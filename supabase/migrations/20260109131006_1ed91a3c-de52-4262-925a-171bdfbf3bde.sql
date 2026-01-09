-- Update audit_log_view to include user_email and company_id
DROP VIEW IF EXISTS public.audit_log_view CASCADE;

CREATE VIEW public.audit_log_view AS
SELECT sal.id, sal.user_id, sal.action, sal.table_name, sal.record_id, 
       sal.details, sal.ip_address, sal.user_agent, sal.created_at,
       p.full_name as user_name,
       p.email as user_email,
       p.company_id
FROM public.security_audit_log sal
LEFT JOIN public.profiles p ON sal.user_id = p.id;