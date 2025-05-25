-- Add function to check cron job status
CREATE OR REPLACE FUNCTION public.check_cron_jobs()
RETURNS TABLE(jobid BIGINT, schedule TEXT, command TEXT, nodename TEXT, nodeport INTEGER, database TEXT, username TEXT, active BOOLEAN, jobname TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM cron.job WHERE jobname = 'process-embedding-queue';
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_cron_jobs() TO authenticated;

-- Also create a simpler version that just checks if our job exists
CREATE OR REPLACE FUNCTION public.is_cron_job_active()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM cron.job 
    WHERE jobname = 'process-embedding-queue' 
    AND active = true
  );
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_cron_job_active() TO authenticated;