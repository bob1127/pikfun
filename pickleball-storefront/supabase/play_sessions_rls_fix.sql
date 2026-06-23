-- 修復揪團 RLS 錯誤：在 Supabase SQL Editor 執行此檔
-- 錯誤訊息：new row violates row-level security policy for table "play_sessions"

alter table public.play_sessions enable row level security;
alter table public.play_session_participants enable row level security;

-- 清除舊 policy（若有的話）再重建
drop policy if exists "play_sessions_public_read" on public.play_sessions;
drop policy if exists "play_sessions_api_write" on public.play_sessions;
drop policy if exists "play_sessions_api_update" on public.play_sessions;
drop policy if exists "play_participants_public_read" on public.play_session_participants;
drop policy if exists "play_participants_api_write" on public.play_session_participants;
drop policy if exists "play_participants_api_update" on public.play_session_participants;
drop policy if exists "play_participants_api_delete" on public.play_session_participants;

create policy "play_sessions_public_read"
  on public.play_sessions for select using (true);

create policy "play_sessions_api_write"
  on public.play_sessions for insert with check (true);

create policy "play_sessions_api_update"
  on public.play_sessions for update using (true);

create policy "play_participants_public_read"
  on public.play_session_participants for select using (true);

create policy "play_participants_api_write"
  on public.play_session_participants for insert with check (true);

create policy "play_participants_api_update"
  on public.play_session_participants for update using (true);

create policy "play_participants_api_delete"
  on public.play_session_participants for delete using (true);
