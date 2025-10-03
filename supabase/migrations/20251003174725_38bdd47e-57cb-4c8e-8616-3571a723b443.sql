-- Fix profiles and companies public access by removing conflicting policies

-- For profiles: Remove all other SELECT policies except authenticated requirement
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company admins can view all company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create single comprehensive SELECT policy for profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = id  -- Own profile
    OR has_role(auth.uid(), 'admin'::app_role)  -- Admins see all
    OR (company_id IS NOT NULL AND company_id = get_user_company_id(auth.uid()))  -- Same company
  )
);

-- For companies: Remove duplicate policies
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;

-- Create single comprehensive SELECT policy for companies
CREATE POLICY "Only admins can view companies"
ON public.companies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));