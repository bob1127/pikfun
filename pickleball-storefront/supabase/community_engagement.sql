-- 社群文章：作者檔、按讚、留言討論
-- 在 Supabase SQL Editor 執行一次

-- 作者公開資訊（會員中心可編輯）
create table if not exists public.community_author_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  member_id text,
  display_name text,
  title text,
  credentials text,
  bio text,
  avatar_url text,
  highlight text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists community_author_profiles_email_idx
  on public.community_author_profiles(email);

alter table public.community_author_profiles enable row level security;

drop policy if exists "cap_public_read" on public.community_author_profiles;
drop policy if exists "cap_api_write" on public.community_author_profiles;
drop policy if exists "cap_api_update" on public.community_author_profiles;

create policy "cap_public_read" on public.community_author_profiles
  for select using (true);
create policy "cap_api_write" on public.community_author_profiles
  for insert with check (true);
create policy "cap_api_update" on public.community_author_profiles
  for update using (true) with check (true);

-- 文章按讚
create table if not exists public.community_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  member_email text not null,
  created_at timestamptz not null default now(),
  unique (post_id, member_email)
);

create index if not exists community_post_likes_post_idx
  on public.community_post_likes(post_id);

alter table public.community_post_likes enable row level security;

drop policy if exists "cpl_public_read" on public.community_post_likes;
drop policy if exists "cpl_api_write" on public.community_post_likes;
drop policy if exists "cpl_api_delete" on public.community_post_likes;

create policy "cpl_public_read" on public.community_post_likes
  for select using (true);
create policy "cpl_api_write" on public.community_post_likes
  for insert with check (true);
create policy "cpl_api_delete" on public.community_post_likes
  for delete using (true);

-- 文章留言
create table if not exists public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_email text not null,
  author_name text not null,
  author_avatar text,
  content text not null,
  media jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_post_comments_post_idx
  on public.community_post_comments(post_id, created_at desc);

alter table public.community_post_comments enable row level security;

drop policy if exists "cpc_public_read" on public.community_post_comments;
drop policy if exists "cpc_api_write" on public.community_post_comments;
drop policy if exists "cpc_api_delete" on public.community_post_comments;

create policy "cpc_public_read" on public.community_post_comments
  for select using (true);
create policy "cpc_api_write" on public.community_post_comments
  for insert with check (true);
create policy "cpc_api_delete" on public.community_post_comments
  for delete using (true);
