-- 留言加上圖片欄位（若已執行 community_engagement.sql，再執行這段）

alter table public.community_post_comments
  add column if not exists media jsonb default '[]'::jsonb;
