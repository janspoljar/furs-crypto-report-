create table if not exists taxpayer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tax_number text not null,
  full_name text not null,
  address text not null,
  city text not null,
  postal_code text not null,
  country text not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_taxpayer_profiles_user_id on taxpayer_profiles(user_id);
