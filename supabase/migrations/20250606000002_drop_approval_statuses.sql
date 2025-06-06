-- Drop approval_statuses table
-- Note: ai_embeddings was already dropped in previous migration

DROP TABLE IF EXISTS public.approval_statuses CASCADE;