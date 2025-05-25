-- Fix Edge Function invocation to match official Supabase docs
-- Replace the invoke_edge_function with proper net.http_post implementation

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
  response_status INTEGER;
  request_id BIGINT;
BEGIN
  -- Get the local Supabase URL (for local development)
  project_url := 'http://127.0.0.1:54321';
  
  -- Get service role key from vault or use environment
  -- For local development, we'll use the known local service role key
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  -- Construct authorization header
  auth_header := 'Bearer ' || service_role_key;
  
  -- Construct Edge Function URL
  function_url := project_url || '/functions/v1/' || function_name;
  
  -- Log the attempt
  RAISE LOG 'Invoking Edge Function: % with payload: %', function_url, payload;
  
  -- Make HTTP request using net.http_post (asynchronous)
  SELECT INTO request_id extensions.net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', auth_header,
      'apikey', service_role_key
    ),
    body := payload,
    timeout_milliseconds := timeout_milliseconds
  );
  
  -- For asynchronous calls, we assume success if request was made
  -- The actual response will be processed separately
  RAISE LOG 'Edge Function request queued with ID: %', request_id;
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return false
    RAISE LOG 'Error invoking Edge Function %: % (SQLSTATE: %)', function_name, SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$;