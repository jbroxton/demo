-- Drop legacy entity tables in favor of unified pages architecture
-- This migration removes old separate tables that are now replaced by the pages-based system

-- Drop different types of objects safely
-- Drop views and functions first, then tables
DROP VIEW IF EXISTS public.embedding_queue_status CASCADE;
DROP FUNCTION IF EXISTS public.embedding_queue_status CASCADE;

-- Drop tables in order to handle foreign key dependencies
DROP TABLE IF EXISTS public.attachments CASCADE;
DROP TABLE IF EXISTS public.approval_stages CASCADE;
DROP TABLE IF EXISTS public.requirements CASCADE;
DROP TABLE IF EXISTS public.roadmaps CASCADE;
DROP TABLE IF EXISTS public.features CASCADE;
DROP TABLE IF EXISTS public.interfaces CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;