-- Create Pages and Blocks Tables Following Notion's Architecture
-- This migration creates the unified page/block system to replace entity-specific tables
-- Designed for Supabase PostgreSQL with tenant_id for multi-tenancy

-- Create pages table with JSONB blocks storage (replaces products, features, roadmaps, releases tables)
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('roadmap', 'feature', 'release', 'project')),
  title TEXT NOT NULL,
  parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  blocks JSONB NOT NULL DEFAULT '[]',
  block_count INTEGER DEFAULT 0,
  last_block_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  last_edited_by UUID
);

-- Function to automatically add IDs and timestamps to blocks
CREATE OR REPLACE FUNCTION process_blocks_metadata(blocks_input JSONB)
RETURNS JSONB AS $$
DECLARE
  processed_blocks JSONB := '[]'::JSONB;
  block_item JSONB;
  processed_block JSONB;
BEGIN
  -- Process each block in the array
  FOR block_item IN SELECT * FROM JSONB_ARRAY_ELEMENTS(blocks_input)
  LOOP
    -- Add ID and timestamps if not present
    processed_block := block_item;
    
    IF NOT (processed_block ? 'id') THEN
      processed_block := processed_block || jsonb_build_object('id', gen_random_uuid()::TEXT);
    END IF;
    
    IF NOT (processed_block ? 'created_at') THEN
      processed_block := processed_block || jsonb_build_object('created_at', NOW()::TEXT);
    END IF;
    
    IF NOT (processed_block ? 'updated_at') THEN
      processed_block := processed_block || jsonb_build_object('updated_at', NOW()::TEXT);
    END IF;
    
    -- Add to processed array
    processed_blocks := processed_blocks || processed_block;
  END LOOP;
  
  RETURN processed_blocks;
END;
$$ LANGUAGE plpgsql;


-- Create indexes for performance (following Notion's patterns)
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(type);
CREATE INDEX IF NOT EXISTS idx_pages_tenant_id ON pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON pages(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pages_properties_gin ON pages USING GIN(properties);

CREATE INDEX IF NOT EXISTS idx_pages_blocks_gin ON pages USING GIN(blocks);
CREATE INDEX IF NOT EXISTS idx_pages_block_count ON pages(block_count);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_pages_updated_at 
  BEFORE UPDATE ON pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Create function to update block metadata when blocks JSONB is modified
CREATE OR REPLACE FUNCTION update_block_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update block count and last_block_update when blocks array changes
  IF OLD.blocks IS DISTINCT FROM NEW.blocks THEN
    NEW.block_count = jsonb_array_length(NEW.blocks);
    NEW.last_block_update = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for block metadata updates
CREATE TRIGGER update_block_metadata_trigger
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_block_metadata();

-- Create trigger to automatically process block metadata on insert/update
CREATE OR REPLACE FUNCTION process_blocks_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Process blocks to add IDs and timestamps
  NEW.blocks = process_blocks_metadata(NEW.blocks);
  NEW.block_count = jsonb_array_length(NEW.blocks);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER process_blocks_trigger
  BEFORE INSERT OR UPDATE OF blocks ON pages
  FOR EACH ROW EXECUTE FUNCTION process_blocks_on_change();

-- Create function to prevent circular references in page hierarchy
CREATE OR REPLACE FUNCTION prevent_page_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
  current_parent_id UUID;
  depth INTEGER := 0;
  max_depth INTEGER := 5;
BEGIN
  -- Only check if parent_id is being set
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Prevent self-reference
  IF NEW.id = NEW.parent_id THEN
    RAISE EXCEPTION 'Page cannot be its own parent';
  END IF;
  
  -- Check for circular reference and max depth
  current_parent_id := NEW.parent_id;
  WHILE current_parent_id IS NOT NULL AND depth < max_depth LOOP
    -- If we find the current page in the parent chain, it's circular
    IF current_parent_id = NEW.id THEN
      RAISE EXCEPTION 'Circular reference detected in page hierarchy';
    END IF;
    
    -- Move up the hierarchy
    SELECT parent_id INTO current_parent_id 
    FROM pages 
    WHERE id = current_parent_id;
    
    depth := depth + 1;
  END LOOP;
  
  -- Check max depth
  IF depth >= max_depth THEN
    RAISE EXCEPTION 'Maximum page hierarchy depth (%) exceeded', max_depth;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for circular reference prevention
CREATE TRIGGER prevent_page_circular_reference_trigger
  BEFORE INSERT OR UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION prevent_page_circular_reference();

-- RLS disabled for now - authentication handled at app layer
-- ALTER TABLE pages ENABLE ROW LEVEL SECURITY;


-- Insert sample data following Notion's property structure
INSERT INTO pages (id, type, title, tenant_id, properties) VALUES
-- Projects (equivalent to old Products)
('550e8400-e29b-41d4-a716-446655440001', 'project', 'Authentication Platform', '00000000-0000-0000-0000-000000000001', '{
  "status": {"type": "select", "select": {"name": "Active", "color": "green"}},
  "owner": {"type": "person", "people": [{"id": "user123", "name": "John Doe"}]},
  "priority": {"type": "select", "select": {"name": "High", "color": "red"}}
}'),

-- Features
('550e8400-e29b-41d4-a716-446655440002', 'feature', 'User Authentication', '00000000-0000-0000-0000-000000000001', '{
  "priority": {"type": "select", "select": {"name": "High", "color": "red"}},
  "status": {"type": "select", "select": {"name": "In Progress", "color": "blue"}},
  "roadmap": {"type": "relation", "relation": [{"id": "550e8400-e29b-41d4-a716-446655440003"}]},
  "owner": {"type": "person", "people": [{"id": "user123", "name": "John Doe"}]}
}'),

-- Roadmaps
('550e8400-e29b-41d4-a716-446655440003', 'roadmap', 'Q1 2024 Platform', '00000000-0000-0000-0000-000000000001', '{
  "quarter": {"type": "select", "select": {"name": "Q1", "color": "blue"}},
  "progress": {"type": "number", "number": 75},
  "owner": {"type": "person", "people": [{"id": "user123", "name": "John Doe"}]}
}'),

-- Releases  
('550e8400-e29b-41d4-a716-446655440004', 'release', 'v2.1 Auth Release', '00000000-0000-0000-0000-000000000001', '{
  "release_date": {"type": "date", "date": {"start": "2024-03-15", "end": null}},
  "version": {"type": "text", "rich_text": [{"plain_text": "v2.1.0"}]},
  "status": {"type": "select", "select": {"name": "Planned", "color": "yellow"}},
  "feature": {"type": "relation", "relation": [{"id": "550e8400-e29b-41d4-a716-446655440002"}]}
}');

-- Update User Authentication feature page with sample blocks stored as JSONB array
UPDATE pages SET 
  blocks = '[
    {
      "id": "block-001",
      "type": "document",
      "content": {
        "tiptap_content": {
          "type": "doc",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "This feature implements secure user authentication using JWT tokens and OAuth2 integration."
                }
              ]
            }
          ]
        },
        "word_count": 12
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "block-002",
      "type": "requirement",
      "content": {
        "name": "Secure Login Flow",
        "priority": "High",
        "owner": "John Doe",
        "cuj": "As a user, I want to securely log into the platform using my email and password",
        "status": "In Progress"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "block-003",
      "type": "criteria",
      "content": {
        "description": "User must be able to log in with valid credentials within 3 seconds",
        "acceptance_test": "Login form accepts valid email/password and redirects to dashboard",
        "status": "Draft"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]',
  block_count = 3,
  last_block_update = NOW()
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

COMMENT ON TABLE pages IS 'Unified page storage following Notion model - replaces separate entity tables';
COMMENT ON COLUMN pages.properties IS 'Type-specific properties stored as JSONB following Notion property value structure';
COMMENT ON COLUMN pages.blocks IS 'Content blocks stored as JSONB array for optimal performance and AI queries';
COMMENT ON COLUMN pages.block_count IS 'Cached count of blocks for quick pagination and UI optimization';
COMMENT ON COLUMN pages.last_block_update IS 'Timestamp of last block modification for change tracking';