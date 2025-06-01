-- Migration: Add page assignment properties
-- Created: 2025-01-31
-- Description: Initialize assignedTo properties for page assignments feature

-- Add assignedTo property to all existing pages that don't have it
UPDATE pages 
SET properties = COALESCE(properties, '{}'::jsonb) || jsonb_build_object(
  'assignedTo', jsonb_build_object(
    'roadmaps', '[]'::jsonb,
    'releases', '[]'::jsonb
  )
)
WHERE properties IS NULL 
   OR properties->>'assignedTo' IS NULL;

-- Create GIN index for efficient JSON queries on assignments
CREATE INDEX IF NOT EXISTS idx_pages_properties_assigned_to 
ON pages USING GIN ((properties->'assignedTo'));

-- Create index for querying pages by type (for roadmaps and releases lookup)
CREATE INDEX IF NOT EXISTS idx_pages_type 
ON pages (type) WHERE type IN ('roadmap', 'release');

-- Add comment explaining the assignment structure
COMMENT ON COLUMN pages.properties IS 'JSON properties including assignedTo: {roadmaps: [{id, title}], releases: [{id, title}]}';