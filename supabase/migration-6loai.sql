-- ============================================================================
-- BÉ HỌC — Migration: question_bank hỗ trợ đủ 6 loại câu + chấm ở server
--   Thêm cột: kind, payload (dữ liệu client cần hiển thị), answer (đáp án ẩn).
--   Giữ tương thích ngược: backfill các câu trắc nghiệm cũ.
--   VÁ BẢO MẬT: bỏ public read trên question_bank (tránh lộ đáp án), đưa mọi
--   truy cập câu hỏi qua RPC SECURITY DEFINER.
-- ============================================================================

-- 1) Cột mới
alter table question_bank add column if not exists kind    text;
alter table question_bank add column if not exists payload jsonb;
alter table question_bank add column if not exists answer  jsonb;
alter table question_bank alter column kind set default 'trac_nghiem';
-- câu không-trắc-nghiệm không có options/answer_index → cho phép null
alter table question_bank alter column options drop not null;
alter table question_bank alter column answer_index drop not null;

-- 2) Backfill câu cũ (chỉ có options/answer_index) → trac_nghiem
update question_bank set
  kind    = coalesce(kind, 'trac_nghiem'),
  payload = coalesce(payload, jsonb_build_object('lua_chon', options)),
  answer  = coalesce(answer, to_jsonb(answer_index))
where kind is null or payload is null or answer is null;

-- 3) Ràng buộc loại hợp lệ
alter table question_bank drop constraint if exists qb_kind_chk;
alter table question_bank add constraint qb_kind_chk
  check (kind in ('trac_nghiem','dung_sai','dien_khuyet','noi_cap','sap_xep','tu_luan_ngan'));

-- 4) Hàm chấm 1 câu theo loại (đáp án đúng p_correct vs bé trả lời p_given, dạng jsonb)
create or replace function be_grade_one(p_kind text, p_correct jsonb, p_given jsonb)
returns boolean language plpgsql immutable as $$
begin
  if p_given is null or p_correct is null then return false; end if;
  if p_kind in ('dien_khuyet','tu_luan_ngan') then
    -- so khớp chữ: bỏ khoảng trắng thừa, không phân biệt hoa/thường (giữ dấu tiếng Việt)
    return lower(btrim(p_correct #>> '{}')) = lower(btrim(p_given #>> '{}'));
  else
    -- trac_nghiem (số), dung_sai (bool), noi_cap & sap_xep (mảng số) → so khớp cấu trúc
    return p_correct = p_given;
  end if;
end; $$;
grant execute on function be_grade_one(text,jsonb,jsonb) to authenticated;

-- 5) Lấy câu cho bài học — trả payload (client hiển thị), KHÔNG trả answer
drop function if exists be_lesson_questions(uuid,int);
create or replace function be_lesson_questions(p_topic uuid, p_count int default 5)
returns table(id uuid, kind text, question text, payload jsonb, difficulty int)
language sql stable security definer set search_path = public as $$
  select id, coalesce(kind,'trac_nghiem') as kind, question,
         coalesce(payload, jsonb_build_object('lua_chon', options)) as payload,
         difficulty
  from question_bank
  where active and topic_id = p_topic
  order by random()
  limit greatest(1, least(20, coalesce(p_count,5)));
$$;
grant execute on function be_lesson_questions(uuid,int) to authenticated, anon;

-- 6) Chấm bài ở SERVER cho đủ 6 loại. p_answers = [{"id","answer"}]
create or replace function be_submit_lesson(p_child uuid, p_topic uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_total int:=0; v_correct int:=0; v_stars int; v_ratio numeric;
  v_kind text; v_ans jsonb; v_ok boolean; v_review jsonb:='[]'::jsonb; v_res jsonb; r record;
begin
  if not be_owns_child(p_child) then raise exception 'Khong co quyen voi be nay'; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then raise exception 'Du lieu tra loi khong hop le'; end if;
  for r in select (e->>'id')::uuid as qid, (e->'answer') as given from jsonb_array_elements(p_answers) e loop
    v_total := v_total + 1;
    select kind, answer into v_kind, v_ans from question_bank where id=r.qid and topic_id=p_topic and active;
    v_ok := (v_kind is not null) and be_grade_one(v_kind, v_ans, r.given);
    if v_ok then v_correct := v_correct + 1; end if;
    v_review := v_review || jsonb_build_object('id', r.qid, 'ok', v_ok, 'dap_an', v_ans);
  end loop;
  if v_total = 0 then raise exception 'Khong co cau tra loi'; end if;
  v_ratio := v_correct::numeric / v_total;
  v_stars := case when v_ratio>=1 then 3 when v_ratio>=0.8 then 2 when v_ratio>=0.6 then 1 else 0 end;
  v_res := be_complete_lesson(p_child, p_topic, v_stars);
  return jsonb_build_object('correct',v_correct,'total',v_total,'ratio',round(v_ratio,2),
    'stars',(v_res->>'stars')::int,'gained',(v_res->>'gained')::int,
    'diamonds',(v_res->>'diamonds')::int,'review',v_review);
end; $$;
grant execute on function be_submit_lesson(uuid,uuid,jsonb) to authenticated;

-- 7) VÁ BẢO MẬT: bỏ public read; be_quiz_questions chuyển SECURITY DEFINER để
--    game arcade vẫn lấy được câu (cần answer_index để chấm combo tại chỗ).
drop policy if exists read_qbank on question_bank;
create or replace function be_quiz_questions(p_grade int, p_count int default 20)
returns setof question_bank language sql stable security definer set search_path = public as $$
  (select * from question_bank where active and grade = p_grade
     order by random() limit ceil(p_count*0.7))
  union all
  (select * from question_bank where active and grade = p_grade + 1
     order by random() limit floor(p_count*0.3));
$$;
grant execute on function be_quiz_questions(int,int) to authenticated, anon;
