-- profiles: app-level user identity and role.
--
-- Canonical field ownership (to avoid conflicts with taxpayer_profiles):
--   profiles.role        → AUTHORITATIVE. Only source of truth for access control.
--   profiles.full_name   → display-layer copy, nullable. NOT used for XML generation.
--   profiles.tax_number  → display-layer copy, nullable. NOT used for XML generation.
--   profiles.address     → display-layer copy, nullable. NOT used for XML generation.
--   taxpayer_profiles.*  → AUTHORITATIVE for all tax XML fields (full_name, tax_number,
--                          address, city, postal_code, country). Use that table for XML.
--
-- The role column must only be modified via service role (admin actions).
-- RLS own-update policy covers full_name/tax_number/address; do not expose role
-- to client-side mutations.

create table if not exists profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text        not null default 'user' check (role in ('user', 'admin')),
  full_name  text,
  tax_number text,
  address    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Users may read their own row.
create policy "profiles: own read"
  on profiles for select
  using (auth.uid() = user_id);

-- Users may insert their own row (on first sign-in / profile setup).
create policy "profiles: own insert"
  on profiles for insert
  with check (auth.uid() = user_id);

-- Users may update their own row.
-- Note: role is intentionally excluded from client-facing updates at the
-- application layer. Service role bypasses RLS and is the only path to
-- change role.
create policy "profiles: own update"
  on profiles for update
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);
