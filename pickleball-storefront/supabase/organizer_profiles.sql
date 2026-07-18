-- 揪團主／活動策辦人公開介紹頁
-- 請在 Supabase SQL Editor 執行一次。

create extension if not exists pgcrypto;

create table if not exists public.organizer_profiles (
  id uuid primary key default gen_random_uuid(),
  member_id text not null unique,
  owner_email text not null unique,
  slug text not null unique,
  display_name text not null,
  title text,
  avatar text,
  cover_image text,
  city text,
  region text,
  excerpt text,
  bio text,
  story text,
  specialties text[] not null default '{}',
  tags text[] not null default '{}',
  instagram text,
  contact_email text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizer_profiles_slug_idx
  on public.organizer_profiles (slug);
create index if not exists organizer_profiles_owner_email_idx
  on public.organizer_profiles (lower(owner_email));

alter table public.organizer_profiles enable row level security;

-- 不建立 anon policy：公開與寫入資料皆由 Next.js API 以 service role 處理，
-- 避免 owner_email/member_id 被 Supabase REST 直接讀取。

alter table public.play_sessions
  add column if not exists host_member_id text,
  add column if not exists host_profile_id uuid
    references public.organizer_profiles(id) on delete set null;

create index if not exists play_sessions_host_member_id_idx
  on public.play_sessions (host_member_id);
create index if not exists play_sessions_host_profile_id_idx
  on public.play_sessions (host_profile_id);
