-- Fix security definer view issue
-- Recreate the view without SECURITY DEFINER to use querying user's permissions

DROP VIEW IF EXISTS public.email_configurations_safe;

-- Recreate view with proper RLS that respects querying user's permissions
CREATE VIEW public.email_configurations_safe 
WITH (security_invoker=true)
AS
SELECT 
  id,
  company_id,
  sender_name,
  sender_email,
  smtp_host,
  smtp_port,
  smtp_secure,
  smtp_username,
  NULL as smtp_password, -- Mask password for security
  is_verified,
  is_active,
  created_at,
  updated_at
FROM public.email_configurations;