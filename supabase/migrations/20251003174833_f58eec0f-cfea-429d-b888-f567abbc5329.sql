-- Fix all views to use SECURITY INVOKER

-- 1. Fix audit_log_view
DROP VIEW IF EXISTS public.audit_log_view;
CREATE VIEW public.audit_log_view 
WITH (security_invoker=on)
AS
SELECT 
  sal.id,
  sal.user_id,
  p.email AS user_email,
  p.full_name AS user_name,
  sal.action,
  sal.table_name,
  sal.record_id,
  sal.details,
  sal.ip_address,
  sal.user_agent,
  sal.created_at,
  p.company_id
FROM security_audit_log sal
LEFT JOIN profiles p ON p.id = sal.user_id;

-- 2. Fix email_configurations_safe
DROP VIEW IF EXISTS public.email_configurations_safe;
CREATE VIEW public.email_configurations_safe
WITH (security_invoker=on)
AS
SELECT 
  id,
  company_id,
  sender_name,
  sender_email,
  smtp_host,
  smtp_port,
  smtp_username,
  smtp_secure,
  is_active,
  is_verified,
  created_at,
  updated_at
FROM public.email_configurations;

-- 3. Fix social_media_accounts_safe
DROP VIEW IF EXISTS public.social_media_accounts_safe;
CREATE VIEW public.social_media_accounts_safe
WITH (security_invoker=on)
AS
SELECT 
  id,
  user_id,
  company_id,
  platform,
  account_id,
  account_name,
  is_active,
  token_expires_at,
  created_at,
  updated_at
FROM public.social_media_accounts;

-- 4. Fix profiles_safe
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe
WITH (security_invoker=on)
AS
SELECT 
  id,
  full_name,
  avatar_url,
  company_id,
  created_at,
  updated_at
FROM public.profiles;