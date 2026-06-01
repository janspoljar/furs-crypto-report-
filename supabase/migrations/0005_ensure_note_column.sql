-- Ensure note column exists in transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS note text;
