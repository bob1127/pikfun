-- PikFun 自有球場實拍照片（檔案存 Cloudflare R2，此表只存公開 URL）
-- 在 Supabase SQL Editor 執行一次。

create table if not exists public.court_custom_photos (
  place_id    text primary key,
  court_name  text not null default '',
  photo_urls  text[] not null default '{}',
  updated_by  text,
  updated_at  timestamptz not null default now()
);

alter table public.court_custom_photos enable row level security;

-- 僅伺服器端 SUPABASE_SERVICE_ROLE_KEY 可讀寫。
drop policy if exists "court_custom_photos_public_read"
  on public.court_custom_photos;
drop policy if exists "court_custom_photos_public_write"
  on public.court_custom_photos;
