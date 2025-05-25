-- Fix net.http_post function call to use correct positional parameters
-- Based on the actual pg_net function signature

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
  headers_obj JSONB;
BEGIN
  -- Get the local Supabase URL (for local development)
  project_url := 'http://127.0.0.1:54321';
  
  -- Get service role key for local development
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  -- Construct Edge Function URL
  function_url := project_url || '/functions/v1/' || function_name;
  
  -- Build headers object
  headers_obj := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || service_role_key,
    'apikey', service_role_key
  );
  
  -- Log the attempt
  RAISE LOG 'Invoking Edge Function: % with payload: %', function_url, payload;
  
  -- Make HTTP request using net.http_post with correct positional parameters
  -- Signature: net.http_post(url, body, params, headers, timeout_milliseconds)
  SELECT INTO request_id net.http_post(
    function_url,           -- url
    payload,               -- body
    '{}'::jsonb,          -- params (empty)
    headers_obj,          -- headers
    timeout_milliseconds  -- timeout
  );
  
  -- Log success
  RAISE LOG 'Edge Function request submitted with ID: %', request_id;
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log detailed error
    RAISE LOG 'Error invoking Edge Function %: % (SQLSTATE: %)', function_name, SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$;