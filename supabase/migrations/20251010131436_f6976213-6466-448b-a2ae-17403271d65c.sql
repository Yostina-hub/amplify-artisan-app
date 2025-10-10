-- Fix: Company admins seeing all companies data
-- This ensures company admins ONLY see their own company

-- 1. Update companies table RLS - restrict to super admins only
DROP POLICY IF EXISTS "Only admins can view companies" ON public.companies;

CREATE POLICY "Only super admins can view all companies"
ON public.companies FOR SELECT
USING (
  has_role(auth.uid(), 'admin') AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND company_id IS NOT NULL
  )
);

-- Allow company admins to view ONLY their own company
CREATE POLICY "Company admins view own company"
ON public.companies FOR SELECT
USING (
  id IN (
    SELECT company_id FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin' AND company_id IS NOT NULL
  )
);

-- 2. Fix profiles table - company admins should only see their company users
DROP POLICY IF EXISTS "Users can view profiles from their company or own" ON public.profiles;

CREATE POLICY "Users view own company profiles"
ON public.profiles FOR SELECT
USING (
  id = auth.uid() OR
  company_id = get_user_company_id(auth.uid()) OR
  (has_role(auth.uid(), 'admin') AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND company_id IS NOT NULL
  ))
);