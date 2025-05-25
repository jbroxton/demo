-- Setup Supabase Native Auto-Embeddings Infrastructure
-- This migration sets up the required PostgreSQL extensions and infrastructure
-- for automatic embedding generation using Supabase's native capabilities

-- Enable required PostgreSQL extensions for auto-embeddings
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
-- pgmq must be installed in its own schema
CREATE SCHEMA IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS pgmq WITH SCHEMA pgmq;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Create message queue for embedding jobs
SELECT pgmq.create('embedding_jobs');

-- Create utility function to get project URL
CREATE OR REPLACE FUNCTION public.get_project_url()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN current_setting('app.settings.project_url', true);
END;
$$;

-- Create utility function to invoke Edge Functions
CREATE OR REPLACE FUNCTION public.invoke_edge_function(
  function_name TEXT,
  payload JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url TEXT;
  function_url TEXT;
  response_status INTEGER;
BEGIN
  -- Get project URL from settings or environment
  project_url := coalesce(
    current_setting('app.settings.project_url', true),
    'https://your-project.supabase.co'
  );
  
  -- Construct Edge Function URL
  function_url := project_url || '/functions/v1/' || function_name;
  
  -- Make HTTP request to Edge Function
  SELECT status INTO response_status
  FROM extensions.http_post(
    function_url,
    payload::text,
    'application/json'::text
  );
  
  -- Return success if status is 2xx
  RETURN response_status BETWEEN 200 AND 299;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return false
    RAISE LOG 'Error invoking Edge Function %: %', function_name, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Create function to clear embedding columns on content update
CREATE OR REPLACE FUNCTION public.clear_embedding_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clear embedding when content changes to force regeneration
  IF TG_OP = 'UPDATE' THEN
    -- Only clear if actual content changed (not just timestamps)
    IF (OLD.name IS DISTINCT FROM NEW.name OR 
        OLD.description IS DISTINCT FROM NEW.description OR
        OLD.priority IS DISTINCT FROM NEW.priority) THEN
      -- Delete existing embedding for this entity
      DELETE FROM public.ai_embeddings 
      WHERE entity_type = TG_TABLE_NAME 
        AND entity_id = NEW.id 
        AND tenant_id = NEW.tenant_id;
        
      RETURN NEW;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to enqueue embedding jobs
CREATE OR REPLACE FUNCTION public.enqueue_embedding_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  content_text TEXT;
  job_payload JSONB;
BEGIN
  -- Determine content based on table
  IF TG_TABLE_NAME = 'features' THEN
    content_text := format(
      'Feature: %s\nPriority: %s\nDescription: %s',
      COALESCE(NEW.name, 'Unnamed Feature'),
      COALESCE(NEW.priority, 'Not set'),
      COALESCE(NEW.description, '')
    );
  ELSIF TG_TABLE_NAME = 'releases' THEN
    content_text := format(
      'Release: %s\nRelease Date: %s\nPriority: %s\nDescription: %s',
      COALESCE(NEW.name, 'Unnamed Release'),
      COALESCE(NEW.release_date::text, 'Not set'),
      COALESCE(NEW.priority, 'Not set'),
      COALESCE(NEW.description, '')
    );
  ELSE
    RAISE EXCEPTION 'Unsupported table for embedding: %', TG_TABLE_NAME;
  END IF;

  -- Create job payload
  job_payload := jsonb_build_object(
    'entity_type', TG_TABLE_NAME,
    'entity_id', NEW.id,
    'tenant_id', NEW.tenant_id,
    'content', content_text,
    'metadata', jsonb_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'priority', NEW.priority,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    )
  );

  -- Enqueue job for processing
  PERFORM pgmq.send('embedding_jobs', job_payload);
  
  -- Log the job enqueuing
  RAISE LOG 'Enqueued embedding job for % %: %', TG_TABLE_NAME, NEW.id, NEW.name;

  RETURN NEW;
END;
$$;

-- Create triggers for features table
DROP TRIGGER IF EXISTS features_clear_embedding_trigger ON public.features;
CREATE TRIGGER features_clear_embedding_trigger
  BEFORE UPDATE ON public.features
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_embedding_on_update();

DROP TRIGGER IF EXISTS features_enqueue_embedding_trigger ON public.features;
CREATE TRIGGER features_enqueue_embedding_trigger
  AFTER INSERT OR UPDATE ON public.features
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_embedding_job();

-- Create triggers for releases table
DROP TRIGGER IF EXISTS releases_clear_embedding_trigger ON public.releases;
CREATE TRIGGER releases_clear_embedding_trigger
  BEFORE UPDATE ON public.releases
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_embedding_on_update();

DROP TRIGGER IF EXISTS releases_enqueue_embedding_trigger ON public.releases;
CREATE TRIGGER releases_enqueue_embedding_trigger
  AFTER INSERT OR UPDATE ON public.releases
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_embedding_job();

-- Create function to process embedding queue (will be called by cron)
CREATE OR REPLACE FUNCTION public.process_embedding_queue()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_record RECORD;
  jobs_processed INTEGER := 0;
  max_jobs INTEGER := 10; -- Process up to 10 jobs per run
BEGIN
  -- Process jobs from the queue
  FOR job_record IN 
    SELECT * FROM pgmq.read('embedding_jobs', 30, max_jobs) -- 30 second visibility timeout
  LOOP
    -- Invoke Edge Function to process this job
    IF public.invoke_edge_function('process-embedding', job_record.message) THEN
      -- Mark job as completed
      PERFORM pgmq.delete('embedding_jobs', job_record.msg_id);
      jobs_processed := jobs_processed + 1;
      
      RAISE LOG 'Successfully processed embedding job %', job_record.msg_id;
    ELSE
      -- Job failed, it will be retried due to visibility timeout
      RAISE LOG 'Failed to process embedding job %, will retry', job_record.msg_id;
    END IF;
  END LOOP;
  
  RETURN jobs_processed;
END;
$$;

-- Schedule cron job to process embedding queue every 30 seconds
-- Note: This requires pg_cron extension and appropriate permissions
SELECT cron.schedule(
  'process-embedding-queue',
  '*/30 * * * * *', -- Every 30 seconds
  'SELECT public.process_embedding_queue();'
);

-- Create monitoring view for embedding queue status
CREATE OR REPLACE VIEW public.embedding_queue_status AS
SELECT 
  queue_name,
  queue_length,
  newest_msg_age_sec,
  oldest_msg_age_sec,
  total_messages
FROM pgmq.metrics('embedding_jobs');

-- Create wrapper functions for Edge Function to use
CREATE OR REPLACE FUNCTION public.pgmq_read(
  queue_name TEXT,
  vt INTEGER,
  qty INTEGER
)
RETURNS TABLE(msg_id BIGINT, read_ct INTEGER, enqueued_at TIMESTAMP WITH TIME ZONE, vt TIMESTAMP WITH TIME ZONE, message JSONB)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM pgmq.read(queue_name, vt, qty);
$$;

CREATE OR REPLACE FUNCTION public.pgmq_delete(
  queue_name TEXT,
  msg_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pgmq.delete(queue_name, msg_id);
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA pgmq TO authenticated;
GRANT SELECT ON public.embedding_queue_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_embedding_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pgmq_read(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pgmq_delete(TEXT, BIGINT) TO authenticated;
-- Grant permissions for pgmq functions to public/triggers
GRANT USAGE ON SCHEMA pgmq TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgmq TO postgres;

-- Create indexes for performance (only if ai_embeddings table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_embeddings') THEN
    CREATE INDEX IF NOT EXISTS idx_ai_embeddings_tenant_entity 
    ON public.ai_embeddings(tenant_id, entity_type, entity_id);

    CREATE INDEX IF NOT EXISTS idx_ai_embeddings_search 
    ON public.ai_embeddings USING ivfflat (embedding extensions.vector_cosine_ops) 
    WITH (lists = 100);
  ELSE
    RAISE NOTICE 'ai_embeddings table not found, skipping index creation';
  END IF;
END
$$;