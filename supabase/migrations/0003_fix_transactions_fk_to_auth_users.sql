-- Drop the existing FK constraint on transactions.user_id
alter table transactions drop constraint transactions_user_id_fkey;

-- Recreate the FK constraint to reference auth.users(id) instead of custom users table
alter table transactions add constraint transactions_user_id_fkey 
  foreign key (user_id) references auth.users(id) on delete cascade;
