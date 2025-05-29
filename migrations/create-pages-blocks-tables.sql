-- Create Pages and Blocks Tables Following Notion's Architecture
-- This migration creates the unified page/block system to replace entity-specific tables
-- Designed for Supabase PostgreSQL with tenant_id for multi-tenancy

-- Create pages table (replaces products, features, roadmaps, releases tables)
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('roadmap', 'feature', 'release', 'project')),
  title TEXT NOT NULL,
  parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_edited_by UUID REFERENCES auth.users(id)
);

-- Create blocks table (content within pages)
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('paragraph', 'heading', 'goal', 'criteria', 'attachment', 'requirement', 'table', 'bulleted_list', 'numbered_list')),
  parent_id UUID NOT NULL,
  parent_type VARCHAR(10) NOT NULL CHECK (parent_type IN ('page', 'block')),
  position INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints for blocks
-- Note: We can't use a traditional FK here since parent_id can reference either pages or blocks
-- We'll enforce this constraint in application logic and triggers

-- Create indexes for performance (following Notion's patterns)
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(type);
CREATE INDEX IF NOT EXISTS idx_pages_tenant_id ON pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON pages(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pages_properties_gin ON pages USING GIN(properties);

CREATE INDEX IF NOT EXISTS idx_blocks_parent_id ON blocks(parent_id);
CREATE INDEX IF NOT EXISTS idx_blocks_parent_type ON blocks(parent_type);
CREATE INDEX IF NOT EXISTS idx_blocks_position ON blocks(parent_id, position);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON blocks(type);
CREATE INDEX IF NOT EXISTS idx_blocks_content_gin ON blocks USING GIN(content);

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

CREATE TRIGGER update_blocks_updated_at 
  BEFORE UPDATE ON blocks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate block parent references
CREATE OR REPLACE FUNCTION validate_block_parent()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if parent exists in pages table when parent_type is 'page'
  IF NEW.parent_type = 'page' THEN
    IF NOT EXISTS (SELECT 1 FROM pages WHERE id = NEW.parent_id) THEN
      RAISE EXCEPTION 'Parent page with id % does not exist', NEW.parent_id;
    END IF;
  END IF;
  
  -- Check if parent exists in blocks table when parent_type is 'block'
  IF NEW.parent_type = 'block' THEN
    IF NOT EXISTS (SELECT 1 FROM blocks WHERE id = NEW.parent_id) THEN
      RAISE EXCEPTION 'Parent block with id % does not exist', NEW.parent_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for block parent validation
CREATE TRIGGER validate_block_parent_trigger
  BEFORE INSERT OR UPDATE ON blocks
  FOR EACH ROW EXECUTE FUNCTION validate_block_parent();

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

-- Add RLS (Row Level Security) for multi-tenancy
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pages (tenant isolation)
CREATE POLICY "Users can only access pages in their tenant" ON pages
  FOR ALL USING (
    tenant_id = (
      SELECT current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- Create RLS policy for blocks (inherit from parent page's workspace)
CREATE POLICY "Users can only access blocks in their workspace" ON blocks
  FOR ALL USING (
    CASE 
      WHEN parent_type = 'page' THEN
        parent_id IN (
          SELECT id FROM pages 
          WHERE workspace_id IN (
            SELECT workspace_id FROM user_workspaces 
            WHERE user_id = auth.uid()
          )
        )
      WHEN parent_type = 'block' THEN
        -- For nested blocks, recursively check the root page
        parent_id IN (
          WITH RECURSIVE block_hierarchy AS (
            -- Base case: direct parent is a page
            SELECT b.id, b.parent_id, b.parent_type, p.workspace_id
            FROM blocks b
            JOIN pages p ON b.parent_id = p.id
            WHERE b.parent_type = 'page'
            
            UNION ALL
            
            -- Recursive case: parent is another block
            SELECT b.id, b.parent_id, b.parent_type, bh.workspace_id
            FROM blocks b
            JOIN block_hierarchy bh ON b.parent_id = bh.id
            WHERE b.parent_type = 'block'
          )
          SELECT id FROM block_hierarchy 
          WHERE workspace_id IN (
            SELECT workspace_id FROM user_workspaces 
            WHERE user_id = auth.uid()
          )
        )
      ELSE false
    END
  );

-- Insert sample data following Notion's property structure
INSERT INTO pages (id, type, title, workspace_id, properties) VALUES
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

-- Insert sample blocks (content within pages)
INSERT INTO blocks (type, parent_id, parent_type, position, content) VALUES
-- Blocks for User Authentication feature page
('paragraph', '550e8400-e29b-41d4-a716-446655440002', 'page', 1, '{
  "rich_text": [{"type": "text", "text": {"content": "This feature implements secure user authentication using JWT tokens and OAuth2 integration."}}]
}'),

('heading', '550e8400-e29b-41d4-a716-446655440002', 'page', 2, '{
  "rich_text": [{"type": "text", "text": {"content": "Requirements"}}],
  "level": 2
}'),

('requirement', '550e8400-e29b-41d4-a716-446655440002', 'page', 3, '{
  "name": "Secure Login Flow",
  "priority": "High",
  "owner": "John Doe",
  "cuj": "As a user, I want to securely log into the platform using my email and password",
  "status": "In Progress"
}'),

('criteria', '550e8400-e29b-41d4-a716-446655440002', 'page', 4, '{
  "description": "User must be able to log in with valid credentials within 3 seconds",
  "acceptance_test": "Login form accepts valid email/password and redirects to dashboard",
  "status": "Draft"
}');

COMMENT ON TABLE pages IS 'Unified page storage following Notion model - replaces separate entity tables';
COMMENT ON TABLE blocks IS 'Content blocks within pages following Notion model';
COMMENT ON COLUMN pages.properties IS 'Type-specific properties stored as JSONB following Notion property value structure';
COMMENT ON COLUMN blocks.content IS 'Block content stored as JSONB following Notion block structure';