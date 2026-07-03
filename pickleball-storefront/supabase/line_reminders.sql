-- LINE 提醒功能：在 Supabase SQL Editor 執行一次
-- 需先確認 play_sessions.sql 已執行（依賴 play_sessions 表）

-- ==============================================================
-- 1. user_line_profiles
--    記錄每個 PikFun 會員（以 email 為 key）的 LINE 綁定資訊
-- ==============================================================
create table if not exists public.user_line_profiles (
  id            uuid        primary key default gen_random_uuid(),
  customer_email text        not null unique,   -- PikFun 會員信箱（登入用）
  line_user_id  text        not null,           -- LINE sub（推播用）
  display_name  text,                           -- LINE 顯示名稱（選填）
  picture_url   text,                           -- LINE 頭像（選填）
  friend_added  boolean     not null default false, -- 是否已加官方帳號好友
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists ulp_line_user_id_idx on public.user_line_profiles(line_user_id);

-- ==============================================================
-- 2. play_session_reminders
--    每筆揪團報名最多建 2 筆排程（前 24h、前 2h）
-- ==============================================================
create table if not exists public.play_session_reminders (
  id                uuid        primary key default gen_random_uuid(),
  session_id        uuid        not null references public.play_sessions(id) on delete cascade,
  participant_email text        not null,
  remind_at         timestamptz not null,            -- 預計發送時間
  channel           text        not null default 'email'
                                  check (channel in ('line', 'email')),
  sent              boolean     not null default false,
  sent_at           timestamptz,
  error_msg         text,                            -- 發送失敗時記錄原因
  created_at        timestamptz not null default now()
);

-- 讓 cron 快速掃描未送出的提醒
create index if not exists psr_pending_idx
  on public.play_session_reminders(remind_at)
  where sent = false;

create index if not exists psr_session_email_idx
  on public.play_session_reminders(session_id, participant_email);

-- ==============================================================
-- RLS（用 service_role 呼叫，開放所有操作即可）
-- ==============================================================
alter table public.user_line_profiles    enable row level security;
alter table public.play_session_reminders enable row level security;

create policy "ulp_api_all"
  on public.user_line_profiles using (true) with check (true);

create policy "psr_api_all"
  on public.play_session_reminders using (true) with check (true);
