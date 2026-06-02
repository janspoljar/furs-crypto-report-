create table if not exists report_submissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  marked_submitted_at timestamptz not null default now(),
  primary key (user_id, year)
);
create index if not exists idx_report_submissions_user_id on report_submissions(user_id);
