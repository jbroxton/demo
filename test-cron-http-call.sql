-- Test if cron job can make HTTP calls to Edge Function
-- This isolates just the HTTP call functionality

CREATE OR REPLACE FUNCTION public.test_cron_http_call()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url TEXT;
  function_url TEXT;
  service_role_key TEXT;
  headers_obj JSONB;
  request_id BIGINT;
  test_payload JSONB;
BEGIN
  -- Set up the same configuration as the real cron job
  project_url := 'http://127.0.0.1:54321';
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  function_url := project_url || '/functions/v1/process-embedding';
  
  -- Build headers object
  headers_obj := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || service_role_key,
    'apikey', service_role_key
  );
  
  -- Simple test payload
  test_payload := jsonb_build_object(
    'entity_type', 'test',
    'entity_id', 'cron-http-test-123',
    'tenant_id', '22222222-2222-2222-2222-222222222222',
    'content', 'Testing if cron job can make HTTP calls to Edge Function',
    'metadata', jsonb_build_object('test', 'cron-http-call')
  );
  
  RAISE LOG 'Testing HTTP call from database to Edge Function...';
  RAISE LOG 'URL: %', function_url;
  RAISE LOG 'Payload: %', test_payload;
  
  -- Try to make the HTTP call
  BEGIN
    SELECT INTO request_id net.http_post(
      url := function_url,
      body := test_payload,
      headers := headers_obj,
      timeout_milliseconds := 10000
    );
    
    IF request_id IS NOT NULL THEN
      RAISE LOG 'SUCCESS: HTTP call returned request_id: %', request_id;
      RETURN 'SUCCESS: HTTP call completed with request_id: ' || request_id::text;
    ELSE
      RAISE LOG 'FAIL: HTTP call returned NULL request_id';
      RETURN 'FAIL: HTTP call returned NULL request_id';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'ERROR: HTTP call failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
      RETURN 'ERROR: HTTP call failed: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')';
  END;
END;
$$;