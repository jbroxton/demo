-- Fix the process_embedding_queue function to use correct net.http_post syntax

CREATE OR REPLACE FUNCTION public.process_embedding_queue()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_record RECORD;
  jobs_processed INTEGER := 0;
  max_jobs INTEGER := 10; -- Process up to 10 jobs per run
  project_url TEXT;
  function_url TEXT;
  service_role_key TEXT;
  headers_obj JSONB;
  request_id BIGINT;
BEGIN
  -- Set up Edge Function URL and headers
  project_url := 'http://127.0.0.1:54321';
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  function_url := project_url || '/functions/v1/process-embedding';
  
  -- Build headers object
  headers_obj := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || service_role_key,
    'apikey', service_role_key
  );

  -- Process jobs from the queue
  FOR job_record IN 
    SELECT * FROM pgmq.read('embedding_jobs', 30, max_jobs) -- 30 second visibility timeout
  LOOP
    BEGIN
      -- Make HTTP request using net.http_post with correct positional parameters
      -- Signature: net.http_post(url, body, params, headers, timeout_milliseconds)
      SELECT INTO request_id net.http_post(
        function_url,           -- url
        job_record.message,     -- body (the job payload)
        '{}'::jsonb,           -- params (empty)
        headers_obj,           -- headers
        30000                  -- timeout (30 seconds)
      );
      
      -- If we got a request ID, assume success and delete the job
      IF request_id IS NOT NULL THEN
        PERFORM pgmq.delete('embedding_jobs', job_record.msg_id);
        jobs_processed := jobs_processed + 1;
        
        RAISE LOG 'Successfully processed embedding job % with request ID %', job_record.msg_id, request_id;
      ELSE
        RAISE LOG 'Failed to get request ID for embedding job %', job_record.msg_id;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but continue processing other jobs
        RAISE LOG 'Error processing embedding job %: % (SQLSTATE: %)', job_record.msg_id, SQLERRM, SQLSTATE;
    END;
  END LOOP;
  
  RETURN jobs_processed;
END;
$$;