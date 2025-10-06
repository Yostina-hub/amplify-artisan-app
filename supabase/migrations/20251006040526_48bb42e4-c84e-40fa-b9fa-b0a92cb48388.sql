-- Add IP address tracking columns to security_audit_log
ALTER TABLE public.security_audit_log 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Drop and recreate the audit log view with new columns
DROP VIEW IF EXISTS public.audit_log_view;

CREATE VIEW public.audit_log_view AS
SELECT 
  al.id,
  al.user_id,
  al.action,
  al.table_name,
  al.record_id,
  al.details,
  al.created_at,
  al.ip_address,
  al.user_agent,
  p.full_name as user_name,
  p.email as user_email,
  p.company_id
FROM public.security_audit_log al
LEFT JOIN public.profiles p ON p.id = al.user_id;
