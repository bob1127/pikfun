-- 教練進駐申請 + 已上架教練：在 Supabase SQL Editor 執行一次

create table if not exists public.coach_applications (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  member_id text,
  applicant_email text not null,
  applicant_name text not null,
  applicant_avatar text,
  slug text not null,
  name text not null,
  title text,
  subtitle text,
  city text,
  region text,
  avatar text,
  cover_image text,
  video_url text,
  featured_label text,
  tags jsonb default '[]'::jsonb,
  excerpt text,
  bio text,
  story text,
  credentials jsonb default '[]'::jsonb,
  specialties jsonb default '[]'::jsonb,
  contact_email text,
  instagram text,
  admin_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  featured_coach_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists coach_applications_email_pending_idx
  on public.coach_applications(applicant_email)
  where status = 'pending';

create unique index if not exists coach_applications_slug_idx
  on public.coach_applications(slug);

create table if not exists public.featured_coaches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  member_id text,
  applicant_email text,
  name text not null,
  title text,
  subtitle text,
  avatar text,
  cover_image text,
  video_url text,
  featured_label text,
  city text,
  region text,
  tags jsonb default '[]'::jsonb,
  excerpt text,
  bio text,
  story text,
  credentials jsonb default '[]'::jsonb,
  specialties jsonb default '[]'::jsonb,
  email text,
  instagram text,
  is_featured boolean default true,
  sort_order integer default 99,
  published_at date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists featured_coaches_sort_idx on public.featured_coaches(sort_order);

alter table public.coach_applications enable row level security;
alter table public.featured_coaches enable row level security;

drop policy if exists "coach_apps_public_read" on public.coach_applications;
drop policy if exists "coach_apps_api_write" on public.coach_applications;
drop policy if exists "coach_apps_api_update" on public.coach_applications;
drop policy if exists "featured_coaches_public_read" on public.featured_coaches;
drop policy if exists "featured_coaches_api_write" on public.featured_coaches;
drop policy if exists "featured_coaches_api_update" on public.featured_coaches;

create policy "coach_apps_public_read" on public.coach_applications for select using (true);
create policy "coach_apps_api_write" on public.coach_applications for insert with check (true);
create policy "coach_apps_api_update" on public.coach_applications for update using (true);
create policy "featured_coaches_public_read" on public.featured_coaches for select using (true);
create policy "featured_coaches_api_write" on public.featured_coaches for insert with check (true);
create policy "featured_coaches_api_update" on public.featured_coaches for update using (true);
