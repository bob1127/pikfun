-- 社群投稿（教練 / 球場主 / 活動主揪 發文，經審核後顯示於 /news）
-- 在 Supabase SQL Editor 執行一次
--
-- 注意：目前 storefront 若未設定 SUPABASE_SERVICE_ROLE_KEY，
-- API 會以 anon key 操作，因此 RLS 需允許 insert/update/delete/select（與 coach_applications 相同）。
-- 前台僅顯示已核准文章，是由 API 端 .eq('status', 'approved') 過濾，不是靠 RLS 擋住。

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),

  -- 作者（會員）
  author_member_id text,
  author_email text not null,
  author_name text not null,
  author_avatar text,
  author_role text not null default 'coach'
    check (author_role in ('coach', 'court_owner', 'organizer')),

  -- 內容
  slug text not null unique,
  title text not null,
  excerpt text,
  cover_image text,
  content_html text not null,
  category text not null default 'active',
  instagram_urls text[] not null default '{}',

  -- 審核
  admin_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_status_idx
  on public.community_posts(status);

create index if not exists community_posts_author_email_idx
  on public.community_posts(author_email);

create index if not exists community_posts_published_idx
  on public.community_posts(published_at desc)
  where status = 'approved';

alter table public.community_posts enable row level security;

drop policy if exists "community_posts_public_read_approved" on public.community_posts;
drop policy if exists "community_posts_public_read" on public.community_posts;
drop policy if exists "community_posts_api_write" on public.community_posts;
drop policy if exists "community_posts_api_update" on public.community_posts;
drop policy if exists "community_posts_api_delete" on public.community_posts;

-- 與 coach_applications 相同：允許 API（anon / service role）完整讀寫
create policy "community_posts_public_read" on public.community_posts
  for select using (true);

create policy "community_posts_api_write" on public.community_posts
  for insert with check (true);

create policy "community_posts_api_update" on public.community_posts
  for update using (true) with check (true);

create policy "community_posts_api_delete" on public.community_posts
  for delete using (true);

-- 供稿白名單：教練進駐審核通過會自動具備資格；
-- 球場主／活動主揪目前沒有正式申請流程，改由管理員在 /admin/community-authors 手動核可加入。
create table if not exists public.community_authors (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  role text not null default 'organizer'
    check (role in ('court_owner', 'organizer')),
  note text,
  added_by text,
  created_at timestamptz not null default now()
);

alter table public.community_authors enable row level security;

drop policy if exists "community_authors_api_all" on public.community_authors;

create policy "community_authors_api_all" on public.community_authors
  for all using (true) with check (true);
