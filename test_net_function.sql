-- Test to see what net.http_post function signatures are available
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'net' 
AND p.proname LIKE '%http%'
ORDER BY p.proname;