-- ============================================================================
-- BÉ HỌC — Schema Supabase (PostgreSQL) — bản HỢP NHẤT
--   Cấu trúc theo tài liệu gốc (DB-driven: subjects/topics/question_bank để
--   nhập nội dung bằng CSV) + BẢN VÁ BẢO MẬT:
--     • Bảng điểm/ví của trẻ KHÔNG có quyền ghi trực tiếp — chỉ RPC ghi.
--     • Cột children.diamonds khóa bằng trigger, chỉ đổi được bên trong RPC.
--   Mô hình: phụ huynh (auth.users) → nhiều profile bé. Tách nhà bằng RLS.
-- Chạy trên SQL Editor. An toàn chạy lại (drop sạch phần của app ở đầu).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------- 0) DỌN SẠCH (chỉ các đối tượng của app) ----------
drop function if exists be_complete_lesson(uuid,uuid,int) cascade;
drop function if exists be_complete_lesson(uuid,text,int,int) cascade;  -- bản cũ (nếu có)
drop function if exists be_finish_minigame(uuid,text,int) cascade;
drop function if exists be_quiz_questions(int,int) cascade;
drop function if exists be_lesson_reward(int) cascade;
drop function if exists be_tier_reward(int) cascade;
drop function if exists be_grade_factor(int) cascade;
drop function if exists be_tier_of(text,int,int) cascade;
drop function if exists be_owns_child(uuid) cascade;
drop function if exists be_guard_diamonds() cascade;
drop table if exists diamond_ledger cascade;
drop table if exists lesson_progress cascade;
drop table if exists minigame_daily cascade;
drop table if exists minigame_records cascade;
drop table if exists game_scores cascade;        -- bản cũ (nếu có)
drop table if exists children cascade;
drop table if exists question_bank cascade;
drop table if exists topics cascade;
drop table if exists minigames cascade;
drop table if exists subjects cascade;
drop table if exists ranks cascade;

-- ---------- 1) BẢNG TĨNH (nội dung — public read) ----------
create table subjects (
  code text primary key, name text not null, color text
);
create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null references subjects(code),
  order_index int not null, title text not null, grade int,
  unique (subject_code, order_index)
);
create table minigames (
  code text primary key, name text not null, skill text,
  thr_bronze int not null, thr_silver int not null, thr_gold int not null,
  active boolean not null default true
);
create table ranks (
  min_diamonds int primary key, name text not null, icon text not null
);
create table question_bank (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null references subjects(code),
  grade int not null, type text not null default 'mcq',
  question text not null, options jsonb not null,
  answer_index int not null, difficulty int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_qbank_lookup on question_bank (subject_code, grade, active);

-- ---------- 2) BẢNG DỮ LIỆU CỦA TRẺ ----------
create table children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  grade int not null default 3 check (grade between 1 and 5),
  avatar text not null default '🐣',
  diamonds int not null default 0 check (diamonds >= 0),
  muted boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_children_user on children (user_id);

create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  topic_id uuid not null references topics(id),
  stars int not null default 0 check (stars between 0 and 3),
  rewarded_stars int not null default 0 check (rewarded_stars between 0 and 3),
  completed_at timestamptz, updated_at timestamptz not null default now(),
  unique (child_id, topic_id)
);
create index idx_progress_child on lesson_progress (child_id);

create table diamond_ledger (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  source text not null, ref text, amount int not null,
  created_at timestamptz not null default now()
);
create index idx_ledger_child on diamond_ledger (child_id, created_at desc);

create table minigame_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  game_code text not null references minigames(code),
  best_score int not null default 0, updated_at timestamptz not null default now(),
  unique (child_id, game_code)
);
create table minigame_daily (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  game_code text not null references minigames(code),
  play_date date not null default current_date,
  rewarded_count int not null default 0,
  unique (child_id, game_code, play_date)
);

-- ---------- 3) HÀM TIỆN ÍCH ----------
create or replace function be_lesson_reward(p_stars int)
returns int language sql immutable as $$
  select case p_stars when 1 then 5 when 2 then 10 when 3 then 20 else 0 end;
$$;
create or replace function be_tier_reward(p_tier int)
returns int language sql immutable as $$
  select case p_tier when 1 then 3 when 2 then 6 when 3 then 12 else 0 end;
$$;
create or replace function be_grade_factor(p_grade int)
returns numeric language sql immutable as $$
  select 0.7 + 0.1 * greatest(1, least(5, coalesce(p_grade,3)));
$$;
create or replace function be_owns_child(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from children c where c.id = p_child and c.user_id = auth.uid());
$$;

-- ---------- 3b) BẢN VÁ: khóa cột diamonds khỏi UPDATE trực tiếp ----------
-- Chỉ cho đổi diamonds khi cờ phiên be.allow_gem = '1' (chỉ RPC đặt cờ này).
create or replace function be_guard_diamonds()
returns trigger language plpgsql as $$
begin
  if new.diamonds is distinct from old.diamonds
     and coalesce(current_setting('be.allow_gem', true),'') <> '1' then
    raise exception 'Khong duoc sua 💎 truc tiep — phai qua RPC';
  end if;
  return new;
end; $$;
create trigger trg_guard_diamonds
  before update on children
  for each row execute function be_guard_diamonds();

-- ---------- 4) RPC: HOÀN THÀNH BÀI HỌC ----------
create or replace function be_complete_lesson(p_child uuid, p_topic uuid, p_stars int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_prev_rewarded int := 0; v_cur_stars int := 0; v_new_best int;
  v_gained int := 0; v_order int; v_diamonds int;
begin
  if not be_owns_child(p_child) then raise exception 'Khong co quyen voi be nay'; end if;
  p_stars := greatest(0, least(3, coalesce(p_stars,0)));
  select stars, rewarded_stars into v_cur_stars, v_prev_rewarded
    from lesson_progress where child_id=p_child and topic_id=p_topic;
  v_new_best := greatest(coalesce(v_cur_stars,0), p_stars);
  v_gained := be_lesson_reward(greatest(v_new_best, coalesce(v_prev_rewarded,0)))
              - be_lesson_reward(coalesce(v_prev_rewarded,0));
  if v_gained < 0 then v_gained := 0; end if;
  insert into lesson_progress(child_id, topic_id, stars, rewarded_stars, completed_at, updated_at)
  values (p_child, p_topic, v_new_best,
          greatest(coalesce(v_prev_rewarded,0), case when v_gained>0 then v_new_best else coalesce(v_prev_rewarded,0) end),
          now(), now())
  on conflict (child_id, topic_id) do update
    set stars = greatest(lesson_progress.stars, excluded.stars),
        rewarded_stars = greatest(lesson_progress.rewarded_stars, case when v_gained>0 then v_new_best else lesson_progress.rewarded_stars end),
        completed_at = now(), updated_at = now();
  if v_gained > 0 then
    select order_index into v_order from topics where id = p_topic;
    insert into diamond_ledger(child_id, source, ref, amount)
      values (p_child, 'lesson', 'topic#'||coalesce(v_order::text,'?'), v_gained);
    perform set_config('be.allow_gem','1', true);
    update children set diamonds = diamonds + v_gained where id = p_child;
    perform set_config('be.allow_gem','0', true);
  end if;
  select diamonds into v_diamonds from children where id = p_child;
  return jsonb_build_object('stars', v_new_best, 'gained', v_gained, 'diamonds', v_diamonds);
end; $$;

-- ---------- 5) RPC: KẾT THÚC MINI GAME ----------
create or replace function be_finish_minigame(p_child uuid, p_game text, p_score int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_grade int; v_f numeric; v_b int; v_s int; v_g int;
  v_tier int := 0; v_gained int := 0; v_capped boolean := false;
  v_record boolean := false; v_best int := 0; v_rewarded int := 0; v_diamonds int;
begin
  if not be_owns_child(p_child) then raise exception 'Khong co quyen voi be nay'; end if;
  p_score := greatest(0, coalesce(p_score,0));
  select grade into v_grade from children where id = p_child;
  v_f := be_grade_factor(v_grade);
  select thr_bronze, thr_silver, thr_gold into v_b, v_s, v_g from minigames where code = p_game and active;
  if v_g is null then raise exception 'Mini game khong hop le: %', p_game; end if;
  v_tier := case
    when p_score >= round(v_g*v_f) then 3
    when p_score >= round(v_s*v_f) then 2
    when p_score >= round(v_b*v_f) then 1 else 0 end;
  insert into minigame_daily(child_id, game_code, play_date, rewarded_count)
    values (p_child, p_game, current_date, 0)
    on conflict (child_id, game_code, play_date) do nothing;
  select rewarded_count into v_rewarded from minigame_daily
    where child_id=p_child and game_code=p_game and play_date=current_date for update;
  if v_tier > 0 then
    if v_rewarded < 3 then
      v_gained := v_gained + be_tier_reward(v_tier);
      update minigame_daily set rewarded_count = rewarded_count + 1
        where child_id=p_child and game_code=p_game and play_date=current_date;
      v_rewarded := v_rewarded + 1;
    else v_capped := true; end if;
  end if;
  insert into minigame_records(child_id, game_code, best_score)
    values (p_child, p_game, p_score)
    on conflict (child_id, game_code) do nothing;
  select best_score into v_best from minigame_records
    where child_id=p_child and game_code=p_game for update;
  if p_score > coalesce(v_best,0) then
    update minigame_records set best_score = p_score, updated_at = now()
      where child_id=p_child and game_code=p_game;
    v_best := p_score;
    if p_score > 0 then v_gained := v_gained + 10; v_record := true; end if;
  end if;
  if v_gained > 0 then
    insert into diamond_ledger(child_id, source, ref, amount)
      values (p_child, case when v_record then 'record' else 'minigame' end, p_game, v_gained);
    perform set_config('be.allow_gem','1', true);
    update children set diamonds = diamonds + v_gained where id = p_child;
    perform set_config('be.allow_gem','0', true);
  end if;
  select diamonds into v_diamonds from children where id = p_child;
  return jsonb_build_object('tier', v_tier, 'gained', v_gained, 'capped', v_capped,
                            'record', v_record, 'best', v_best,
                            'diamonds', v_diamonds, 'rewarded_today', v_rewarded,
                            'reward_day', current_date);
end; $$;

-- ---------- 5b) RPC: câu hỏi "Nhà Thông Thái" (70% đúng lớp + 30% lớp trên) ----------
create or replace function be_quiz_questions(p_grade int, p_count int default 20)
returns setof question_bank language sql stable as $$
  (select * from question_bank where active and grade = p_grade
     order by random() limit ceil(p_count*0.7))
  union all
  (select * from question_bank where active and grade = p_grade + 1
     order by random() limit floor(p_count*0.3));
$$;

-- ---------- 6) RLS ----------
alter table children        enable row level security;
alter table lesson_progress enable row level security;
alter table diamond_ledger  enable row level security;
alter table minigame_records enable row level security;
alter table minigame_daily  enable row level security;

-- children: chủ sở hữu toàn quyền (cột diamonds đã bị trigger khóa khỏi ghi tay)
create policy child_select on children for select using (user_id = auth.uid());
create policy child_insert on children for insert with check (user_id = auth.uid());
create policy child_update on children for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy child_delete on children for delete using (user_id = auth.uid());

-- Bảng điểm/ví: CHỈ cho ĐỌC. Không có policy ghi ⇒ client ghi trực tiếp bị từ
-- chối; mọi ghi đi qua RPC SECURITY DEFINER (bỏ qua RLS có kiểm soát). ĐÂY là
-- chỗ bịt lỗ hổng của schema gốc.
create policy progress_read on lesson_progress  for select using (be_owns_child(child_id));
create policy ledger_read   on diamond_ledger   for select using (be_owns_child(child_id));
create policy records_read  on minigame_records for select using (be_owns_child(child_id));
create policy daily_read    on minigame_daily   for select using (be_owns_child(child_id));

-- bảng tĩnh: public read
alter table subjects      enable row level security;
alter table topics        enable row level security;
alter table minigames     enable row level security;
alter table ranks         enable row level security;
alter table question_bank enable row level security;
create policy read_subjects on subjects      for select using (true);
create policy read_topics   on topics        for select using (true);
create policy read_minigames on minigames    for select using (true);
create policy read_ranks    on ranks         for select using (true);
create policy read_qbank    on question_bank for select using (active);

-- ---------- 6b) QUYỀN GỌI RPC ----------
grant execute on function be_complete_lesson(uuid,uuid,int) to authenticated;
grant execute on function be_finish_minigame(uuid,text,int) to authenticated;
grant execute on function be_quiz_questions(int,int)        to authenticated, anon;
grant execute on function be_owns_child(uuid)               to authenticated;

-- ---------- 7) SEED ----------
insert into subjects(code,name,color) values
  ('math','Toán','#3b82f6'),('viet','Tiếng Việt','#ec4899'),('eng','Tiếng Anh','#10b981')
on conflict (code) do nothing;
insert into minigames(code,name,skill,thr_bronze,thr_silver,thr_gold) values
  ('quiz','Nhà Thông Thái','Kết hợp kiến thức',30,70,130),
  ('reflex','Chạm Siêu Tốc','Phản xạ mắt',8,16,26),
  ('eye','Mắt Tinh','Quan sát',5,10,16),
  ('memory','Lật Hình Ghi Nhớ','Trí nhớ',4,7,10),
  ('logic','Tìm Quy Luật','Tư duy logic',4,8,12)
on conflict (code) do nothing;
insert into ranks(min_diamonds,name,icon) values
  (0,'Tập Sự','🐣'),(50,'Chăm Chỉ','🌱'),(150,'Học Giỏi','⭐'),(300,'Xuất Sắc','🏆'),(600,'Thiên Tài','👑')
on conflict (min_diamonds) do nothing;
insert into topics(subject_code,order_index,title) values
  ('math',1,'Đếm số 1–5'),('math',2,'Đếm số 6–10'),('math',3,'Nhận biết chữ số'),('math',4,'So sánh lớn – bé'),('math',5,'Nhiều hơn – ít hơn'),('math',6,'Phép cộng trong 5'),('math',7,'Phép cộng trong 10'),('math',8,'Phép trừ trong 5'),('math',9,'Phép trừ trong 10'),('math',10,'Số liền trước – liền sau'),('math',11,'Đếm số 11–20'),('math',12,'Hình tròn – vuông – tam giác'),('math',13,'Dài hơn – ngắn hơn'),('math',14,'Cao hơn – thấp hơn'),('math',15,'Nặng hơn – nhẹ hơn'),('math',16,'Xem giờ đúng'),('math',17,'Thứ tự trong tuần'),('math',18,'Cộng có nhớ'),('math',19,'Trừ có nhớ'),('math',20,'Ôn tập tổng hợp'),
  ('viet',1,'Bảng chữ cái'),('viet',2,'Nguyên âm a-ă-â'),('viet',3,'Phụ âm b-c-d'),('viet',4,'Phụ âm đ-g-h'),('viet',5,'Ghép vần: ba, bà'),('viet',6,'Dấu sắc – huyền'),('viet',7,'Dấu hỏi – ngã – nặng'),('viet',8,'Vần an – ăn – ân'),('viet',9,'Vần on – ôn – ơn'),('viet',10,'Vần oa – oe'),('viet',11,'Đọc từ đơn giản'),('viet',12,'Đọc câu ngắn'),('viet',13,'Tập viết chữ thường'),('viet',14,'Tập viết chữ hoa'),('viet',15,'Từ chỉ sự vật'),('viet',16,'Từ chỉ hoạt động'),('viet',17,'Từ chỉ màu sắc'),('viet',18,'Đặt câu đơn giản'),('viet',19,'Kể chuyện theo tranh'),('viet',20,'Ôn tập tổng hợp'),
  ('eng',1,'Hello & Goodbye'),('eng',2,'ABC (A–G)'),('eng',3,'ABC (H–N)'),('eng',4,'ABC (O–U)'),('eng',5,'ABC (V–Z)'),('eng',6,'Numbers 1–5'),('eng',7,'Numbers 6–10'),('eng',8,'Colors'),('eng',9,'Animals'),('eng',10,'Fruits'),('eng',11,'My Family'),('eng',12,'Body parts'),('eng',13,'This / That'),('eng',14,'I like...'),('eng',15,'Days of week'),('eng',16,'Weather'),('eng',17,'Toys'),('eng',18,'Food'),('eng',19,'Short sentences'),('eng',20,'Review')
on conflict (subject_code, order_index) do nothing;
insert into question_bank(subject_code,grade,question,options,answer_index,difficulty) values
  ('math',3,'24 + 18 = ?','["42","41","44"]',0,1),
  ('math',3,'7 × 6 = ?','["42","48","36"]',0,2),
  ('viet',3,'Từ nào viết đúng chính tả?','["nghề","ngề","nghê"]',0,1),
  ('eng',3,'"School" nghĩa là?','["Trường học","Bệnh viện","Công viên"]',0,1),
  ('math',4,'126 ÷ 6 = ?','["21","26","18"]',0,2),
  ('viet',4,'Từ nào là động từ?','["chạy","đẹp","bàn"]',0,2),
  ('eng',4,'Quá khứ của "go"?','["goed","went","gone"]',1,2)
on conflict do nothing;

-- ============================================================================
-- Giới hạn còn lại: RPC chưa chấm đáp án bài học ở server (client gửi số sao).
-- Khi ngân hàng câu hỏi gắn theo từng topic đầy đủ (P2), chuyển việc chấm sang
-- server để chống gian lận triệt để.
-- ============================================================================
