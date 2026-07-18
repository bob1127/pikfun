-- Google Places 球場快取（以「縣市」為單位）
-- 取代原本寫在 data/cache/google-places/*.json 的檔案快取，
-- 讓 Vercel serverless（唯讀檔案系統、多實例）也能持久化並跨實例共用。
--
-- 在 Supabase SQL Editor 執行一次即可。

create table if not exists public.google_places_cache (
  city                text primary key,                 -- 正規化後的縣市名（快取鍵）
  version             int  not null default 1,           -- 搜尋邏輯版本，遞增即讓舊快取失效
  courts              jsonb not null default '[]'::jsonb, -- 球場清單
  district_checks     jsonb not null default '{}'::jsonb, -- 各區域最後補抓時間 { 區域: epoch_ms }
  last_forced_refresh bigint,                            -- 最後一次強制更新時間（epoch ms）
  fetched_at          bigint not null,                   -- 抓取時間（epoch ms）
  expires_at          bigint not null,                   -- 到期時間（epoch ms）
  updated_at          timestamptz not null default now()
);

-- === 防竄改：開 RLS 但「不建立任何公開政策」 ===
-- 效果：anon / 前端完全無法讀寫這張表；
-- 只有伺服器端用 SUPABASE_SERVICE_ROLE_KEY（會 bypass RLS）能讀寫。
alter table public.google_places_cache enable row level security;

-- 明確移除可能殘留的舊政策，確保沒有任何公開存取
drop policy if exists "google_places_cache_public_read"  on public.google_places_cache;
drop policy if exists "google_places_cache_public_write" on public.google_places_cache;
drop policy if exists "google_places_cache_public_update" on public.google_places_cache;
