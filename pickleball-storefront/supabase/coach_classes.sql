-- 教練開課：在 Supabase SQL Editor 執行一次

create table if not exists public.coach_classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  curriculum text,
  class_type text not null default 'group'
    check (class_type in ('group', 'private', 'clinic', 'beginner')),
  skill_level text not null default 'all'
    check (skill_level in ('all', 'beginner', 'intermediate', 'advanced')),
  location_name text not null,
  location_address text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  max_students integer not null default 4 check (max_students >= 1 and max_students <= 32),
  price_per_person integer default 0,
  payment_method text default 'cash',
  payment_note text,
  coach_email text not null,
  coach_name text not null,
  coach_avatar text,
  coach_bio text,
  cover_image text,
  status text not null default 'open'
    check (status in ('open', 'full', 'cancelled', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.coach_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.coach_classes(id) on delete cascade,
  student_email text not null,
  student_name text not null,
  student_avatar text,
  status text not null default 'enrolled'
    check (status in ('enrolled', 'waitlist', 'left')),
  enrolled_at timestamptz default now(),
  unique(class_id, student_email)
);

create index if not exists coach_classes_starts_at_idx on public.coach_classes(starts_at);
create index if not exists coach_class_enrollments_class_idx on public.coach_class_enrollments(class_id);

alter table public.coach_classes enable row level security;
alter table public.coach_class_enrollments enable row level security;

drop policy if exists "coach_classes_public_read" on public.coach_classes;
drop policy if exists "coach_classes_api_write" on public.coach_classes;
drop policy if exists "coach_classes_api_update" on public.coach_classes;
drop policy if exists "coach_enrollments_public_read" on public.coach_class_enrollments;
drop policy if exists "coach_enrollments_api_write" on public.coach_class_enrollments;
drop policy if exists "coach_enrollments_api_update" on public.coach_class_enrollments;
drop policy if exists "coach_enrollments_api_delete" on public.coach_class_enrollments;

create policy "coach_classes_public_read" on public.coach_classes for select using (true);
create policy "coach_classes_api_write" on public.coach_classes for insert with check (true);
create policy "coach_classes_api_update" on public.coach_classes for update using (true);
create policy "coach_enrollments_public_read" on public.coach_class_enrollments for select using (true);
create policy "coach_enrollments_api_write" on public.coach_class_enrollments for insert with check (true);
create policy "coach_enrollments_api_update" on public.coach_class_enrollments for update using (true);
create policy "coach_enrollments_api_delete" on public.coach_class_enrollments for delete using (true);
