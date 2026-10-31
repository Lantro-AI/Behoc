-- ============================================================================
-- BÉ HỌC — Supabase schema
-- Mô hình: Phụ huynh đăng ký (Supabase Auth) → tạo nhiều profile bé.
--          Nhiều gia đình dùng chung, dữ liệu tách bằng RLS theo auth.uid().
-- Nguyên tắc chống gian lận: FRONTEND KHÔNG BAO GIỜ tự ghi 💎 / sao.
--   Mọi điểm thưởng đi qua RPC SECURITY DEFINER (be_complete_lesson,
--   be_finish_minigame). Client chỉ có quyền ĐỌC dữ liệu của con mình.
--   Không có policy INSERT/UPDATE trực tiếp lên bảng điểm/ví → chặn ghi tay.
-- Chạy an toàn nhiều lần (idempotent): dùng IF NOT EXISTS / CREATE OR REPLACE.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 1. BẢNG: children  (mỗi profile bé thuộc về 1 phụ huynh = 1 auth user)
-- ---------------------------------------------------------------------------
create table if not exists public.children (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  grade       int  not null default 3 check (grade between 1 and 5),
  avatar      text not null default '🐣',
  muted       boolean not null default false,
  diamonds    int  not null default 0 check (diamonds >= 0),  -- VÍ 💎 (chỉ RPC sửa)
  created_at  timestamptz not null default now()
);
create index if not exists children_parent_idx on public.children(parent_id);

-- ---------------------------------------------------------------------------
-- 2. BẢNG: lesson_progress  (tiến độ + sổ chống farm, 1 dòng / bài)
--    stars          = số sao tốt nhất hiện tại (0..3)
--    rewarded_stars = số sao CAO NHẤT ĐÃ ĐƯỢC TRẢ 💎 — giữ qua reset,
--                     không bao giờ giảm → không kiếm lại 💎 bài cũ.
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  child_id        uuid not null references public.children(id) on delete cascade,
  subject         text not null check (subject in ('math','viet','eng')),
  level           int  not null check (level between 1 and 20),
  stars           int  not null default 0 check (stars between 0 and 3),
  rewarded_stars  int  not null default 0 check (rewarded_stars between 0 and 3),
  updated_at      timestamptz not null default now(),
  primary key (child_id, subject, level)
);

-- ---------------------------------------------------------------------------
-- 3. BẢNG: game_scores  (kỷ lục + trần thưởng theo ngày, 1 dòng / trò / bé)
-- ---------------------------------------------------------------------------
create table if not exists public.game_scores (
  child_id        uuid not null references public.children(id) on delete cascade,
  game_id         text not null,
  best            int  not null default 0 check (best >= 0),
  reward_day      date,                -- ngày của lần thưởng gần nhất
  rewarded_today  int  not null default 0 check (rewarded_today >= 0),
  updated_at      timestamptz not null default now(),
  primary key (child_id, game_id)
);

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
--    Phụ huynh chỉ thấy & sửa profile con mình. Bảng điểm/ví CHỈ CHO ĐỌC;
--    mọi ghi điểm đi qua RPC SECURITY DEFINER (bỏ qua RLS một cách có kiểm soát).
-- ---------------------------------------------------------------------------
alter table public.children        enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.game_scores     enable row level security;

-- children: toàn quyền trên dòng của chính phụ huynh
drop policy if exists children_select on public.children;
create policy children_select on public.children
  for select using (parent_id = auth.uid());
drop policy if exists children_insert on public.children;
create policy children_insert on public.children
  for insert with check (parent_id = auth.uid());
drop policy if exists children_update on public.children;
create policy children_update on public.children
  for update using (parent_id = auth.uid()) with check (parent_id = auth.uid());
drop policy if exists children_delete on public.children;
create policy children_delete on public.children
  for delete using (parent_id = auth.uid());
-- LƯU Ý: phụ huynh có thể UPDATE children (đổi tên/lớp/avatar) nhưng KHÔNG
-- được sửa cột diamonds qua đường này — chặn bằng trigger ở mục 5.

-- helper: bé này có thuộc phụ huynh đang đăng nhập không?
create or replace function public.be_owns_child(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.children c
                 where c.id = p_child and c.parent_id = auth.uid());
$$;

-- lesson_progress / game_scores: CHỈ cho ĐỌC dòng của con mình. Không có
-- policy insert/update/delete ⇒ ghi trực tiếp bị từ chối ⇒ buộc dùng RPC.
drop policy if exists lp_select on public.lesson_progress;
create policy lp_select on public.lesson_progress
  for select using (public.be_owns_child(child_id));
drop policy if exists gs_select on public.game_scores;
create policy gs_select on public.game_scores
  for select using (public.be_owns_child(child_id));

-- ---------------------------------------------------------------------------
-- 5. TRIGGER: khóa cột diamonds khỏi UPDATE trực tiếp của phụ huynh
--    Chỉ cho đổi diamonds khi đang chạy trong RPC (cờ phiên be.allow_gem).
-- ---------------------------------------------------------------------------
create or replace function public.be_guard_diamonds()
returns trigger language plpgsql as $$
begin
  if new.diamonds is distinct from old.diamonds
     and coalesce(current_setting('be.allow_gem', true), '') <> '1' then
    raise exception 'Khong duoc sua 💎 truc tiep — phai qua RPC';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_guard_diamonds on public.children;
create trigger trg_guard_diamonds
  before update on public.children
  for each row execute function public.be_guard_diamonds();

-- ---------------------------------------------------------------------------
-- 6. HÀM THƯỞNG (server-side, khớp bản mẫu Version 7)
-- ---------------------------------------------------------------------------
-- 💎 theo sao bài học: 0★=0 · 1★=5 · 2★=10 · 3★=20
create or replace function public.be_lesson_reward(p_stars int)
returns int language sql immutable as $$
  select (array[0,5,10,20])[greatest(0,least(3,coalesce(p_stars,0)))+1];
$$;

-- 💎 theo hạng mini game: 0=0 · 🥉1=3 · 🥈2=6 · 🥇3=12
create or replace function public.be_tier_reward(p_tier int)
returns int language sql immutable as $$
  select (array[0,3,6,12])[greatest(0,least(3,coalesce(p_tier,0)))+1];
$$;

-- Hệ số độ khó theo lớp: lớp1→0.8 · lớp3→1.0 · lớp5→1.2
create or replace function public.be_grade_factor(p_grade int)
returns numeric language sql immutable as $$
  select 0.7 + 0.1 * greatest(1, least(5, coalesce(p_grade,3)));
$$;

-- Ngưỡng hạng mini game theo trò + lớp (khớp TIERS/thr bản mẫu)
create or replace function public.be_tier_of(p_game text, p_score int, p_grade int)
returns int language plpgsql immutable as $$
declare base int[]; f numeric; t1 int; t2 int; t3 int;
begin
  base := case p_game
            when 'quiz'   then array[30,70,130]
            when 'reflex' then array[8,16,26]
            else null end;
  if base is null then return 0; end if;
  f  := public.be_grade_factor(p_grade);
  t1 := round(base[1]*f); t2 := round(base[2]*f); t3 := round(base[3]*f);
  if p_score >= t3 then return 3;
  elsif p_score >= t2 then return 2;
  elsif p_score >= t1 then return 1;
  else return 0; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. RPC: be_complete_lesson
--    Cập nhật sao + trả 💎 phần CHÊNH so với số sao đã từng được trả.
--    Làm lại chỉ cộng 💎 nếu nâng được số sao cao hơn mức đã trả.
--    (Bài 3★ gọi lại ⇒ gained = 0 vì rewarded_stars đã = 3.)
-- ---------------------------------------------------------------------------
create or replace function public.be_complete_lesson(
  p_child uuid, p_subject text, p_level int, p_stars int)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_stars int := greatest(0, least(3, coalesce(p_stars,0)));
  v_prev_rewarded int := 0;
  v_new_best int;
  v_gained int;
  v_total int;
begin
  if not public.be_owns_child(p_child) then
    raise exception 'Khong co quyen voi profile be nay';
  end if;
  if p_subject not in ('math','viet','eng') then
    raise exception 'Mon hoc khong hop le';
  end if;
  if p_level < 1 or p_level > 20 then
    raise exception 'Chang khong hop le';
  end if;

  select rewarded_stars into v_prev_rewarded
  from public.lesson_progress
  where child_id = p_child and subject = p_subject and level = p_level;
  v_prev_rewarded := coalesce(v_prev_rewarded, 0);

  v_new_best := greatest(v_prev_rewarded, v_stars);
  v_gained := public.be_lesson_reward(greatest(v_new_best, v_prev_rewarded))
            - public.be_lesson_reward(v_prev_rewarded);
  if v_gained < 0 then v_gained := 0; end if;

  insert into public.lesson_progress(child_id,subject,level,stars,rewarded_stars,updated_at)
  values (p_child,p_subject,p_level,v_new_best,v_new_best,now())
  on conflict (child_id,subject,level) do update
    set stars          = greatest(public.lesson_progress.stars, v_stars),
        rewarded_stars = greatest(public.lesson_progress.rewarded_stars, v_new_best),
        updated_at     = now();

  if v_gained > 0 then
    perform set_config('be.allow_gem','1', true);
    update public.children set diamonds = diamonds + v_gained where id = p_child;
    perform set_config('be.allow_gem','0', true);
  end if;

  select diamonds into v_total from public.children where id = p_child;
  return json_build_object(
    'gained', v_gained, 'stars', v_new_best, 'diamonds', v_total);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. RPC: be_finish_minigame
--    Thưởng theo hạng (trần 3 lượt/trò/ngày) + 10 💎 khi phá kỷ lục.
-- ---------------------------------------------------------------------------
create or replace function public.be_finish_minigame(
  p_child uuid, p_game text, p_score int)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_score int := greatest(0, coalesce(p_score,0));
  v_grade int; v_tier int;
  v_best int := 0; v_day date; v_rtoday int := 0;
  v_gained int := 0; v_capped boolean := false; v_record boolean := false;
  v_total int;
begin
  if not public.be_owns_child(p_child) then
    raise exception 'Khong co quyen voi profile be nay';
  end if;
  if p_game not in ('quiz','reflex') then
    raise exception 'Tro choi khong hop le';
  end if;

  select grade into v_grade from public.children where id = p_child;
  v_tier := public.be_tier_of(p_game, v_score, v_grade);

  select best, reward_day, rewarded_today
    into v_best, v_day, v_rtoday
  from public.game_scores
  where child_id = p_child and game_id = p_game;
  v_best := coalesce(v_best, 0); v_rtoday := coalesce(v_rtoday, 0);

  -- reset bộ đếm trần nếu sang ngày mới
  if v_day is distinct from current_date then v_rtoday := 0; end if;

  -- thưởng theo hạng + trần
  if v_tier > 0 then
    if v_rtoday < 3 then
      v_gained := v_gained + public.be_tier_reward(v_tier);
      v_rtoday := v_rtoday + 1;
    else
      v_capped := true;
    end if;
  end if;
  -- thưởng phá kỷ lục
  if v_score > v_best then
    if v_score > 0 then v_gained := v_gained + 10; v_record := true; end if;
    v_best := v_score;
  end if;

  insert into public.game_scores(child_id,game_id,best,reward_day,rewarded_today,updated_at)
  values (p_child,p_game,v_best,current_date,v_rtoday,now())
  on conflict (child_id,game_id) do update
    set best           = v_best,
        reward_day     = current_date,
        rewarded_today = v_rtoday,
        updated_at     = now();

  if v_gained > 0 then
    perform set_config('be.allow_gem','1', true);
    update public.children set diamonds = diamonds + v_gained where id = p_child;
    perform set_config('be.allow_gem','0', true);
  end if;

  select diamonds into v_total from public.children where id = p_child;
  return json_build_object(
    'gained', v_gained, 'tier', v_tier, 'record', v_record,
    'best', v_best, 'capped', v_capped, 'diamonds', v_total,
    'rewarded_today', v_rtoday, 'reward_day', current_date);
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. QUYỀN GỌI RPC
-- ---------------------------------------------------------------------------
grant execute on function public.be_complete_lesson(uuid,text,int,int) to authenticated;
grant execute on function public.be_finish_minigame(uuid,text,int)      to authenticated;
grant execute on function public.be_owns_child(uuid)                    to authenticated;

-- ============================================================================
-- HẾT. Lưu ý giới hạn chống gian lận:
--   RPC chặn: sửa 💎 tay, ghi điểm trực tiếp, farm lại 💎 bài cũ, vượt trần ngày,
--             đụng dữ liệu nhà khác (RLS).
--   RPC KHÔNG tự kiểm được bé trả lời câu hỏi có ĐÚNG hay không (client gửi số
--   sao/điểm). Muốn khóa hẳn phải chấm đáp án ở server — làm ở P2 khi đã có
--   ngân hàng câu hỏi thật.
-- ============================================================================
