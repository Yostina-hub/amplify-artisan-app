-- Fix critical security issue: Add SELECT policies for companies table
-- This prevents unauthorized access to sensitive company application data

-- Drop existing overly permissive policies if any
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;

-- Allow only super admins to view company applications
CREATE POLICY "Only admins can view companies"
ON public.companies
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add encryption layer for email configurations SMTP passwords
-- Create a view that excludes sensitive SMTP credentials for non-admin users
CREATE OR REPLACE VIEW public.email_configurations_safe AS
SELECT 
  id,
  company_id,
  sender_name,
  sender_email,
  smtp_host,
  smtp_port,
  smtp_secure,
  smtp_username,
  NULL as smtp_password, -- Mask password
  is_verified,
  is_active,
  created_at,
  updated_at
FROM public.email_configurations;

-- Grant appropriate access to the safe view
GRANT SELECT ON public.email_configurations_safe TO authenticated;

-- Add audit logging table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);