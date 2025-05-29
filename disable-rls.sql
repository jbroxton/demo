-- Temporarily disable RLS for testing
ALTER TABLE pages DISABLE ROW LEVEL SECURITY;

-- Drop the RLS policies
DROP POLICY IF EXISTS "Users can only access pages in their tenant" ON pages;