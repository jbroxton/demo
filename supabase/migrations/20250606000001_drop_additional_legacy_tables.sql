-- Drop additional legacy tables
-- Remove releases and ai_embeddings tables in favor of pages-based architecture

DROP TABLE IF EXISTS public.releases CASCADE;
DROP TABLE IF EXISTS public.ai_embeddings CASCADE;