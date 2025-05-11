-- Add columns to features table
ALTER TABLE features ADD COLUMN "roadmapId" TEXT;

-- Add roadmap_status column to entity_approvals table
ALTER TABLE entity_approvals ADD COLUMN "roadmap_status" TEXT DEFAULT 'Not Started';

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS "idx_features_roadmapId" ON features("roadmapId");
CREATE INDEX IF NOT EXISTS "idx_entity_approvals_roadmap_status" ON entity_approvals("roadmap_status");

-- Create roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default INTEGER DEFAULT 0,
  tenantId TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);

-- Create index for roadmaps
CREATE INDEX IF NOT EXISTS "idx_roadmaps_tenantId" ON roadmaps("tenantId");