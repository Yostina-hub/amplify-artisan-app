-- Fix infinite recursion in profiles table policy
-- The "Company users can view their company profiles" policy has a self-reference issue

-- Drop the problematic policy
DROP POLICY IF EXISTS "Company users can view their company profiles" ON public.profiles;

-- Recreate it without self-reference using a simpler approach
-- This allows users to view profiles of other users in the same company
CREATE POLICY "Company users can view their company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.company_id = profiles.company_id
  )
);