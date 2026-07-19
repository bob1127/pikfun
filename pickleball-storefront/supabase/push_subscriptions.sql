-- Web Push（PWA 推播）訂閱：在 Supabase SQL Editor 執行一次
--
-- 每個「瀏覽器 / 裝置」訂閱一筆，以 endpoint 為唯一鍵。
-- customer_email 可為 null（未登入也能訂閱站方公告），
-- 揪團提醒只推給 email 對得上的訂閱。

create table if not exists public.push_subscriptions (
  id             uuid        primary key default gen_random_uuid(),
  endpoint       text        not null unique,       -- 推播服務端點（唯一識別）
  p256dh         text        not null,              -- 加密公鑰
  auth           text        not null,              -- 驗證密鑰
  customer_email text,                              -- 綁定的 PikFun 會員信箱（可空）
  user_agent     text,                              -- 裝置資訊（除錯用）
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists push_subs_email_idx
  on public.push_subscriptions(customer_email);

-- RLS：僅 server 端以 service_role 讀寫
alter table public.push_subscriptions enable row level security;

create policy "push_subs_api_all"
  on public.push_subscriptions using (true) with check (true);
