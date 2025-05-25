-- Fix the net.http_post function call to match official Supabase docs exactly

-- Drop existing function and recreate with correct net.http_post syntax
DROP FUNCTION IF EXISTS public.invoke_edge_function(TEXT, JSONB, INTEGER);

CREATE OR REPLACE FUNCTION public.invoke_edge_function(
  function_name TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  timeout_milliseconds INTEGER DEFAULT 30000
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url TEXT;
  function_url TEXT;
  auth_header TEXT;
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- Get the local Supabase URL (for local development)
  project_url := 'http://127.0.0.1:54321';
  
  -- Get service role key for local development
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  -- Construct authorization header
  auth_header := 'Bearer ' || service_role_key;
  
  -- Construct Edge Function URL
  function_url := project_url || '/functions/v1/' || function_name;
  
  -- Log the attempt
  RAISE LOG 'Invoking Edge Function: % with payload: %', function_url, payload;
  
  -- Make HTTP request using net.http_post (corrected from extensions.net.http_post)
  SELECT INTO request_id net.http_post(
    url => function_url,
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', auth_header,
      'apikey', service_role_key
    ),
    body => payload,
    timeout_milliseconds => timeout_milliseconds
  );
  
  -- Log success
  RAISE LOG 'Edge Function request queued with ID: %', request_id;
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log detailed error
    RAISE LOG 'Error invoking Edge Function %: % (SQLSTATE: %)', function_name, SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$;

-- Recreate the process_embedding_queue function with proper Edge Function calls
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