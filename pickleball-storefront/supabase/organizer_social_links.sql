-- 活動策辦人社群連結
-- 請在 Supabase SQL Editor 執行一次。

alter table public.organizer_profiles
  add column if not exists line_url text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text;

alter table public.partner_applications
  add column if not exists line_url text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text;

-- 將既有 Instagram 帳號／網址轉入新欄位。
update public.organizer_profiles
set instagram_url = case
  when instagram ~* '^https?://' then instagram
  else 'https://www.instagram.com/' || regexp_replace(instagram, '^@', '')
end
where instagram is not null
  and btrim(instagram) <> ''
  and instagram_url is null;

update public.partner_applications
set instagram_url = case
  when instagram ~* '^https?://' then instagram
  else 'https://www.instagram.com/' || regexp_replace(instagram, '^@', '')
end
where instagram is not null
  and btrim(instagram) <> ''
  and instagram_url is null;
