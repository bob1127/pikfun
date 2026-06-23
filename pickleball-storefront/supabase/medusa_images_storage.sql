-- Medusa 商品圖片 bucket：在 Supabase SQL Editor 執行一次
-- Dashboard → Storage 也可手動建立 Public bucket「medusa-images」

insert into storage.buckets (id, name, public)
values ('medusa-images', 'medusa-images', true)
on conflict (id) do update set public = true;

drop policy if exists "medusa_images_public_read" on storage.objects;
drop policy if exists "medusa_images_service_upload" on storage.objects;

-- 公開讀取（前台顯示商品圖）
create policy "medusa_images_public_read"
  on storage.objects for select
  using (bucket_id = 'medusa-images');

-- 允許透過 service / S3 key 寫入（與 coach-covers 相同模式）
create policy "medusa_images_service_upload"
  on storage.objects for insert
  with check (bucket_id = 'medusa-images');
