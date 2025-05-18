-- Add has_changes column to tabs table
ALTER TABLE tabs
ADD COLUMN IF NOT EXISTS has_changes BOOLEAN DEFAULT false;

-- Update existing tabs to have no changes
UPDATE tabs
SET has_changes = false
WHERE has_changes IS NULL;