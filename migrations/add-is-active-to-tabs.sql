-- Add is_active column to tabs table
ALTER TABLE tabs 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Update existing tabs to set one as active per tenant (optional)
-- This ensures each tenant has at least one active tab
WITH active_tabs AS (
  SELECT DISTINCT ON (tenant_id) id, tenant_id
  FROM tabs
  ORDER BY tenant_id, created_at DESC
)
UPDATE tabs t
SET is_active = true
FROM active_tabs a
WHERE t.id = a.id;