-- 修正 community_posts RLS（若已建表、送出審核出現 RLS 錯誤，只執行這段即可）

alter table public.community_posts enable row level security;

drop policy if exists "community_posts_public_read_approved" on public.community_posts;
drop policy if exists "community_posts_public_read" on public.community_posts;
drop policy if exists "community_posts_api_write" on public.community_posts;
drop policy if exists "community_posts_api_update" on public.community_posts;
drop policy if exists "community_posts_api_delete" on public.community_posts;

create policy "community_posts_public_read" on public.community_posts
  for select using (true);

create policy "community_posts_api_write" on public.community_posts
  for insert with check (true);

create policy "community_posts_api_update" on public.community_posts
  for update using (true) with check (true);

create policy "community_posts_api_delete" on public.community_posts
  for delete using (true);

-- 白名單表一併確認
alter table public.community_authors enable row level security;

drop policy if exists "community_authors_api_all" on public.community_authors;

create policy "community_authors_api_all" on public.community_authors
  for all using (true) with check (true);
