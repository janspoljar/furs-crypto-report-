create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  transaction_id text,
  date timestamptz not null,
  type text not null,
  asset_type text not null,
  asset text not null,
  isin text,
  amount numeric not null,
  price_eur numeric not null,
  fee_eur numeric,
  broker text,
  exchange text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_id on transactions(user_id);
create index if not exists idx_transactions_date on transactions(date);
