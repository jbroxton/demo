-- Create tenant_settings table for storing tenant-level configuration
-- Uses JSONB for flexible settings storage without schema changes

CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,
  settings_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast tenant lookups
CREATE INDEX idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);

-- Index for common JSON queries (can add more as needed)
CREATE INDEX idx_tenant_settings_speqq_instructions ON tenant_settings 
USING GIN ((settings_json->'speqq_instructions'));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tenant_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row changes
CREATE TRIGGER trigger_update_tenant_settings_updated_at
  BEFORE UPDATE ON tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_settings_updated_at();