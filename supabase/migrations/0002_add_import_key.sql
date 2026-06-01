-- Add import_key column to transactions table
ALTER TABLE transactions ADD COLUMN import_key text;

-- Create a normal index on import_key for query performance
CREATE INDEX IF NOT EXISTS idx_transactions_import_key ON transactions(import_key);

-- Create a unique index on import_key to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_import_key_unique ON transactions(import_key);
