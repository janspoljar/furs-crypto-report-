-- Add asset_type column to transactions table if it doesn't exist
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS asset_type text DEFAULT 'crypto';

-- Update existing rows to have a default asset_type
UPDATE transactions SET asset_type = 'crypto' WHERE asset_type IS NULL;

-- Make the column NOT NULL
ALTER TABLE transactions ALTER COLUMN asset_type SET NOT NULL;
