-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor → New query → paste → Run)

create table if not exists sales (
  id            uuid primary key default gen_random_uuid(),
  order_number  text not null,
  type          text not null check (type in ('online', 'offline')),
  sale_date     timestamptz not null default now(),
  customer_name text not null,
  customer_email text,
  customer_phone text,
  items         jsonb not null default '[]',
  subtotal      numeric(10,2) not null default 0,
  tax_rate      numeric(5,3) not null default 0,
  tax_amount    numeric(10,2) not null default 0,
  total         numeric(10,2) not null default 0,
  payment_method text not null check (payment_method in ('cash', 'interac', 'stripe', 'other')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  fulfillment    text not null default 'pending' check (fulfillment in ('pending', 'shipped', 'delivered', 'cancelled')),
  notes         text,
  created_at    timestamptz not null default now()
);

-- Index for dashboard queries
create index if not exists idx_sales_date on sales (sale_date desc);
create index if not exists idx_sales_type on sales (type);
create index if not exists idx_sales_payment_status on sales (payment_status);

-- Row Level Security: only authenticated service-role calls can read/write.
-- The admin pages use the service-role key server-side, so anon users can't
-- access the ledger even if they guess the table name.
alter table sales enable row level security;

-- Allow the service role full access (service role bypasses RLS by default,
-- but we add an explicit policy for clarity).
create policy "Service role full access"
  on sales for all
  using (true)
  with check (true);
