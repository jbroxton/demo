-- PostgreSQL/Supabase version of the roadmap feature migration

-- Add columns to features table if they don't exist
ALTER TABLE features ADD COLUMN IF NOT EXISTS roadmap_id UUID;

-- Add roadmap_status column to entity_approvals table if it doesn't exist
ALTER TABLE entity_approvals ADD COLUMN IF NOT EXISTS roadmap_status TEXT DEFAULT 'Not Started';

-- Create roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add foreign key constraint
  CONSTRAINT fk_roadmap_tenant 
    FOREIGN KEY (tenant_id) 
    REFERENCES tenants(id) 
    ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_features_roadmap_id ON features(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_entity_approvals_roadmap_status ON entity_approvals(roadmap_status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_tenant_id ON roadmaps(tenant_id);

-- Add foreign key constraint for features to roadmaps
ALTER TABLE features 
  ADD CONSTRAINT fk_feature_roadmap 
  FOREIGN KEY (roadmap_id) 
  REFERENCES roadmaps(id) 
  ON DELETE SET NULL;

-- Add RLS (Row Level Security) policies
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their tenant's roadmaps
CREATE POLICY tenant_isolation_select ON roadmaps
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create policy for insert
CREATE POLICY tenant_isolation_insert ON roadmaps
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create policy for update
CREATE POLICY tenant_isolation_update ON roadmaps
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create policy for delete
CREATE POLICY tenant_isolation_delete ON roadmaps
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_roadmaps_updated_at
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();