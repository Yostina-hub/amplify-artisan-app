-- Fix infinite recursion in email_configurations RLS policies
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Companies can update their email config" ON public.email_configurations;
DROP POLICY IF EXISTS "Companies can view their email config" ON public.email_configurations;

-- Recreate policies using the security definer function to avoid recursion
CREATE POLICY "Companies can update their email config" 
ON public.email_configurations 
FOR UPDATE 
USING (
  company_id IS NOT NULL 
  AND company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Companies can view their email config" 
ON public.email_configurations 
FOR SELECT 
USING (
  company_id IS NOT NULL 
  AND company_id = public.get_user_company_id(auth.uid())
);