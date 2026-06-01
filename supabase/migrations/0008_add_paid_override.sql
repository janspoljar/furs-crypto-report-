-- Add admin override flag to subscriptions.
-- paid_override = true grants paid-tier access without a real subscription.
-- Intended for comped accounts, beta testers, and manual admin grants.
-- Must only be set via service role (see app/admin/actions.ts).

alter table subscriptions
  add column if not exists paid_override boolean not null default false;
