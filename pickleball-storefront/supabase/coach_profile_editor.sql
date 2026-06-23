-- 教練自助編輯：富文本、媒體配額、Instagram 貼文網址嵌入
-- 在 Supabase SQL Editor 執行一次

alter table public.featured_coaches
  add column if not exists bio_html text,
  add column if not exists story_html text,
  add column if not exists instagram_embed_urls jsonb default '[]'::jsonb;

create table if not exists public.coach_media_assets (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.featured_coaches(id) on delete cascade,
  slug text not null,
  media_type text not null check (media_type in ('image', 'video')),
  file_path text not null,
  public_url text not null,
  byte_size bigint not null default 0,
  created_at timestamptz default now()
);

create index if not exists coach_media_assets_coach_idx
  on public.coach_media_assets(coach_id);

create index if not exists coach_media_assets_slug_idx
  on public.coach_media_assets(slug);

alter table public.coach_media_assets enable row level security;

drop policy if exists "coach_media_api_all" on public.coach_media_assets;
create policy "coach_media_api_all" on public.coach_media_assets
  for all using (true) with check (true);

-- Storage bucket：教練內頁圖片 / 影片
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coach-media',
  'coach-media',
  true,
  31457280,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "coach_media_public_read" on storage.objects;
drop policy if exists "coach_media_api_upload" on storage.objects;
drop policy if exists "coach_media_api_delete" on storage.objects;

create policy "coach_media_public_read" on storage.objects
  for select using (bucket_id = 'coach-media');

create policy "coach_media_api_upload" on storage.objects
  for insert with check (bucket_id = 'coach-media');

create policy "coach_media_api_delete" on storage.objects
  for delete using (bucket_id = 'coach-media');
