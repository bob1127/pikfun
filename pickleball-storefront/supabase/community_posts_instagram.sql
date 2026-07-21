-- 社群投稿附加 Instagram 貼文
-- 請在 Supabase SQL Editor 執行一次。

alter table public.community_posts
  add column if not exists instagram_urls text[] not null default '{}';
