-- ============================================================================
-- BÉ HỌC — Migration P2: bài học dùng câu hỏi thật theo topic + CHẤM Ở SERVER
--   • question_bank.topic_id: gắn câu hỏi vào từng chặng (bài học)
--   • be_lesson_questions: lấy câu cho 1 bài — KHÔNG trả answer_index (chống lộ đáp án)
--   • be_submit_lesson: client gửi [{id,choice}] → SERVER tự chấm → tính sao → thưởng
--     ⇒ client không thể tự khai "được 3★" nữa (bịt nốt lỗ hổng cuối).
-- Tương thích ngược: bài nào chưa có câu hỏi → frontend vẫn dùng flow demo cũ.
-- ============================================================================

alter table question_bank add column if not exists topic_id uuid references topics(id);
create index if not exists idx_qbank_topic on question_bank (topic_id, active);

-- Lấy câu hỏi cho 1 bài học (ẩn answer_index)
create or replace function be_lesson_questions(p_topic uuid, p_count int default 5)
returns table(id uuid, question text, options jsonb, difficulty int)
language sql stable security definer set search_path = public as $$
  select id, question, options, difficulty
  from question_bank
  where active and topic_id = p_topic
  order by random()
  limit greatest(1, least(20, coalesce(p_count,5)));
$$;
grant execute on function be_lesson_questions(uuid,int) to authenticated, anon;

-- Chấm bài ở SERVER. p_answers = jsonb array [{"id":"<uuid>","choice":<int>}, ...]
-- Quy đổi sao theo tỉ lệ đúng: =100% → 3★ · ≥80% → 2★ · ≥60% → 1★ · <60% → 0★.
create or replace function be_submit_lesson(p_child uuid, p_topic uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_total int := 0; v_correct int := 0; v_stars int; v_ratio numeric;
  v_ci int; v_ok boolean; v_review jsonb := '[]'::jsonb; v_res jsonb; r record;
begin
  if not be_owns_child(p_child) then raise exception 'Khong co quyen voi be nay'; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Du lieu tra loi khong hop le'; end if;

  for r in select (e->>'id')::uuid as qid, (e->>'choice')::int as choice
           from jsonb_array_elements(p_answers) e loop
    v_total := v_total + 1;
    select answer_index into v_ci
      from question_bank where id = r.qid and topic_id = p_topic and active;
    v_ok := (v_ci is not null and v_ci = r.choice);
    if v_ok then v_correct := v_correct + 1; end if;
    v_review := v_review || jsonb_build_object('id', r.qid, 'choice', r.choice, 'correct', v_ci, 'ok', v_ok);
  end loop;

  if v_total = 0 then raise exception 'Khong co cau tra loi'; end if;
  v_ratio := v_correct::numeric / v_total;
  v_stars := case when v_ratio >= 1 then 3 when v_ratio >= 0.8 then 2 when v_ratio >= 0.6 then 1 else 0 end;

  -- tái dùng logic thưởng/ghi sổ chống farm của be_complete_lesson
  v_res := be_complete_lesson(p_child, p_topic, v_stars);

  return jsonb_build_object(
    'correct', v_correct, 'total', v_total, 'ratio', round(v_ratio,2),
    'stars', (v_res->>'stars')::int, 'gained', (v_res->>'gained')::int,
    'diamonds', (v_res->>'diamonds')::int, 'review', v_review);
end; $$;
grant execute on function be_submit_lesson(uuid,uuid,jsonb) to authenticated;
