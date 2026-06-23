-- 揪團新增：每人費用、付款方式（在 Supabase SQL Editor 執行）

alter table public.play_sessions
  add column if not exists fee_per_person integer default 0,
  add column if not exists payment_method text default 'free'
    check (payment_method in ('free', 'cash', 'transfer', 'line_pay', 'other')),
  add column if not exists payment_note text;
