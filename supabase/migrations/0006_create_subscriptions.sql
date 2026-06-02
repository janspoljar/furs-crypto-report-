create type if not exists subscription_plan as enum ('free', 'pro');

create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan subscription_plan not null default 'free',
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
