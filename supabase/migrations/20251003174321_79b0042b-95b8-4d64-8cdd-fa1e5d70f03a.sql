-- Phase 1 & 2: Critical Security Fixes (Corrected)

-- 1.1 Restrict subscription_requests table access
DROP POLICY IF EXISTS "Anyone can submit subscription request" ON public.subscription_requests;
DROP POLICY IF EXISTS "Users can view their own subscription requests" ON public.subscription_requests;
DROP POLICY IF EXISTS "Anyone can insert subscription requests" ON public.subscription_requests;
DROP POLICY IF EXISTS "Admins can view all subscription requests" ON public.subscription_requests;
DROP POLICY IF EXISTS "Users can view their own subscription requests by email" ON public.subscription_requests;
DROP POLICY IF EXISTS "Admins can update subscription requests" ON public.subscription_requests;

CREATE POLICY "Anyone can insert subscription requests"
ON public.subscription_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all subscription requests"
ON public.subscription_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own subscription requests by email"
ON public.subscription_requests
FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can update subscription requests"
ON public.subscription_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 1.2 Restrict companies table access
DROP POLICY IF EXISTS "Anyone can apply as a company" ON public.companies;
DROP POLICY IF EXISTS "Only admins can view companies" ON public.companies;
DROP POLICY IF EXISTS "Anyone can insert company applications" ON public.companies;
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;

CREATE POLICY "Anyone can insert company applications"
ON public.companies
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all companies"
ON public.companies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 1.3 Update email_configurations policies
DROP POLICY IF EXISTS "Companies can view their email config" ON public.email_configurations;
DROP POLICY IF EXISTS "Companies can update their email config" ON public.email_configurations;
DROP POLICY IF EXISTS "Company admins can view their email config" ON public.email_configurations;
DROP POLICY IF EXISTS "Company admins can update their email config" ON public.email_configurations;

CREATE POLICY "Company admins can view their email config"
ON public.email_configurations
FOR SELECT
USING (
  (company_id IS NOT NULL 
  AND company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role))
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Company admins can update their email config"
ON public.email_configurations
FOR UPDATE
USING (
  (company_id IS NOT NULL 
  AND company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2.1 Strengthen user_roles table security
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Block direct role manipulation" ON public.user_roles;
DROP POLICY IF EXISTS "Block direct role updates" ON public.user_roles;
DROP POLICY IF EXISTS "Block direct role deletion" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Block direct role manipulation"
ON public.user_roles
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block direct role updates"
ON public.user_roles
FOR UPDATE
USING (false);

CREATE POLICY "Block direct role deletion"
ON public.user_roles
FOR DELETE
USING (false);

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2.2 Restrict company_platform_configs to company admins only
DROP POLICY IF EXISTS "Companies can manage their own configs" ON public.company_platform_configs;
DROP POLICY IF EXISTS "Admins can manage all configs" ON public.company_platform_configs;
DROP POLICY IF EXISTS "Company admins can view their configs" ON public.company_platform_configs;
DROP POLICY IF EXISTS "Company admins can update their configs" ON public.company_platform_configs;
DROP POLICY IF EXISTS "Company admins can insert configs" ON public.company_platform_configs;
DROP POLICY IF EXISTS "Company admins can delete configs" ON public.company_platform_configs;

CREATE POLICY "Super admins can manage all configs"
ON public.company_platform_configs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company admins can manage their configs"
ON public.company_platform_configs
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role 
    AND company_id = get_user_company_id(auth.uid())
  )
);

-- 2.3 Create safe view for profiles
DROP VIEW IF EXISTS public.profiles_safe;
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
  id,
  full_name,
  avatar_url,
  company_id,
  created_at,
  updated_at
FROM public.profiles;

-- 2.4 Update profiles policies
DROP POLICY IF EXISTS "Company users can view their company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company admins can view all company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company users can view safe company profiles" ON public.profiles;

CREATE POLICY "Company admins can view all company profiles"
ON public.profiles
FOR SELECT
USING (
  (company_id IS NOT NULL 
  AND company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2.5 Add audit trigger for user_roles
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();