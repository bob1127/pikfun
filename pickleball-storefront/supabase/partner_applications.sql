-- 進駐申請（廠商／球場主／揪團主）— 教練仍走 coach_applications
-- 在 Supabase SQL Editor 執行一次

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  apply_type text not null
    check (apply_type in ('vendor', 'court_owner', 'organizer')),

  member_id text,
  applicant_email text not null,
  applicant_name text not null,
  applicant_avatar text,

  company text,
  phone text,
  city text,
  website text,
  instagram text,
  line_url text,
  instagram_url text,
  facebook_url text,
  message text not null,

  admin_note text,
  reviewed_by text,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_applications_status_idx
  on public.partner_applications(status);

create index if not exists partner_applications_email_idx
  on public.partner_applications(applicant_email);

create unique index if not exists partner_applications_email_type_pending_idx
  on public.partner_applications(applicant_email, apply_type)
  where status = 'pending';

alter table public.partner_applications enable row level security;

drop policy if exists "partner_apps_public_read" on public.partner_applications;
drop policy if exists "partner_apps_api_write" on public.partner_applications;
drop policy if exists "partner_apps_api_update" on public.partner_applications;

create policy "partner_apps_public_read" on public.partner_applications
  for select using (true);

create policy "partner_apps_api_write" on public.partner_applications
  for insert with check (true);

create policy "partner_apps_api_update" on public.partner_applications
  for update using (true) with check (true);
