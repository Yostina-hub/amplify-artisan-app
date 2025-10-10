-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a cron job to publish scheduled posts every minute
SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
        url:='https://kdqibmhpebndlmzjhuvf.supabase.co/functions/v1/publish-scheduled-posts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcWlibWhwZWJuZGxtempodXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMDg2ODIsImV4cCI6MjA3NDg4NDY4Mn0.vNZuF9QMc5T4me8V71zCOTJgyBgN0DZxPO_gRCAAmA8"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);