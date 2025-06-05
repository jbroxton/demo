-- Add 'feedback' as an allowed page type
ALTER TABLE pages 
DROP CONSTRAINT pages_type_check;

ALTER TABLE pages 
ADD CONSTRAINT pages_type_check 
CHECK (type IN ('roadmap', 'feature', 'release', 'project', 'feedback'));

-- Add comment to document the change
COMMENT ON COLUMN pages.type IS 'Page type - roadmap, feature, release, project, or feedback';