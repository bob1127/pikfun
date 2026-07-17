-- 社群投稿圖片（封面 + 內文插圖）：在 Supabase SQL Editor 執行一次

insert into storage.buckets (id, name, public)
values ('community-posts', 'community-posts', true)
on conflict (id) do update set public = true;

drop policy if exists "community_posts_public_read" on storage.objects;
drop policy if exists "community_posts_api_upload" on storage.objects;

create policy "community_posts_public_read"
  on storage.objects for select
  using (bucket_id = 'community-posts');

create policy "community_posts_api_upload"
  on storage.objects for insert
  with check (bucket_id = 'community-posts');
