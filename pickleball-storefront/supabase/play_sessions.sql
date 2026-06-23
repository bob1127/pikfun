-- 匹克球揪團：在 Supabase SQL Editor 執行一次

create table if not exists public.play_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location_name text not null,
  location_address text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  max_players integer not null default 4 check (max_players >= 2 and max_players <= 32),
  skill_level text not null default 'all'
    check (skill_level in ('all', 'beginner', 'intermediate', 'advanced')),
  host_email text not null,
  host_name text not null,
  host_avatar text,
  fee_per_person integer default 0,
  payment_method text not null default 'free'
    check (payment_method in ('free', 'cash', 'transfer', 'line_pay', 'other')),
  payment_note text,
  status text not null default 'open'
    check (status in ('open', 'full', 'cancelled', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.play_session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.play_sessions(id) on delete cascade,
  participant_email text not null,
  participant_name text not null,
  participant_avatar text,
  status text not null default 'joined'
    check (status in ('joined', 'waitlist', 'left')),
  joined_at timestamptz default now(),
  unique(session_id, participant_email)
);

create index if not exists play_sessions_starts_at_idx on public.play_sessions(starts_at);
create index if not exists play_sessions_status_idx on public.play_sessions(status);
create index if not exists play_participants_session_idx on public.play_session_participants(session_id);

-- Row Level Security（選 Supabase 提示的「Run and enable RLS」後需有這些 policy）
alter table public.play_sessions enable row level security;
alter table public.play_session_participants enable row level security;

create policy "play_sessions_public_read"
  on public.play_sessions for select using (true);

create policy "play_sessions_api_write"
  on public.play_sessions for insert with check (true);

create policy "play_sessions_api_update"
  on public.play_sessions for update using (true);

create policy "play_participants_public_read"
  on public.play_session_participants for select using (true);

create policy "play_participants_api_write"
  on public.play_session_participants for insert with check (true);

create policy "play_participants_api_update"
  on public.play_session_participants for update using (true);

create policy "play_participants_api_delete"
  on public.play_session_participants for delete using (true);
