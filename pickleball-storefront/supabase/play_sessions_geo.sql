-- 揪團地圖座標：在 Supabase SQL Editor 執行一次（可選，未執行時仍會用球場資料對應）
alter table public.play_sessions
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists court_id text;
