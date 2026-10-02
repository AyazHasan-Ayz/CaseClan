-- Razorpay payments are written only by trusted Edge Functions. Customers may
-- read payments for their own orders; CASECLAN staff may read all payments.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  provider text not null default 'razorpay' check (provider in ('razorpay', 'cod')),
  provider_order_id text,
  provider_payment_id text,
  expected_amount bigint not null check (expected_amount >= 0),
  received_amount bigint check (received_amount is null or received_amount >= 0),
  currency text not null default 'INR' check (char_length(currency) = 3),
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','amount_mismatch','refunded')),
  payment_method text,
  signature_verified boolean not null default false,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, provider),
  unique (provider_order_id),
  unique (provider_payment_id)
);

create table if not exists private.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'razorpay',
  provider_event_id text not null unique,
  event_type text not null,
  provider_order_id text,
  provider_payment_id text,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists payments_customer_id_idx on public.payments(customer_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payment_events_provider_order_id_idx on private.payment_events(provider_order_id);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at before update on public.payments
for each row execute function private.set_updated_at();

alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

drop policy if exists payments_read_own on public.payments;
create policy payments_read_own on public.payments for select to authenticated
using ((select auth.uid()) = customer_id);

drop policy if exists payments_admin_read on public.payments;
create policy payments_admin_read on public.payments for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));

revoke all on private.payment_events from public, anon, authenticated;

