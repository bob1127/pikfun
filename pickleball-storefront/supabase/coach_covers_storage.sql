-- 教練開課封面圖：在 Supabase SQL Editor 執行一次
-- 也可在 Dashboard → Storage → New bucket 手動建立名為 coach-covers 的 Public bucket

insert into storage.buckets (id, name, public)
values ('coach-covers', 'coach-covers', true)
on conflict (id) do update set public = true;

drop policy if exists "coach_covers_public_read" on storage.objects;
drop policy if exists "coach_covers_api_upload" on storage.objects;

create policy "coach_covers_public_read"
  on storage.objects for select
  using (bucket_id = 'coach-covers');

create policy "coach_covers_api_upload"
  on storage.objects for insert
  with check (bucket_id = 'coach-covers');
