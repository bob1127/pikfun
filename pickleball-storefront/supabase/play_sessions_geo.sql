-- 揪團／教練課的球場對應欄位：在 Supabase SQL Editor 執行一次
-- 執行後，開團／開課時從「球場搜尋」選到的場地會記錄唯一球場 ID 與座標，
-- 全台球場地圖即可 100% 精確地在該球場地標上顯示進行中的活動數字。
alter table public.play_sessions
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists court_id text;

alter table public.coach_classes
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists court_id text;
