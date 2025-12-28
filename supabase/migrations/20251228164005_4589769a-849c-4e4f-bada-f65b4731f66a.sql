-- Drop existing user-only policies
DROP POLICY IF EXISTS "Users can view own tokens" ON public.social_platform_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.social_platform_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.social_platform_tokens;
DROP POLICY IF EXISTS "Users can delete own tokens" ON public.social_platform_tokens;

-- Create company-wide policies with admin-only management

-- All company users can VIEW connections
CREATE POLICY "Company users can view tokens" 
ON public.social_platform_tokens 
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Only admins can INSERT (connect new accounts)
CREATE POLICY "Admins can insert tokens" 
ON public.social_platform_tokens 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
  AND public.has_role(auth.uid(), 'admin')
);

-- Only admins can UPDATE
CREATE POLICY "Admins can update tokens" 
ON public.social_platform_tokens 
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
  AND public.has_role(auth.uid(), 'admin')
);

-- Only admins can DELETE (disconnect accounts)
CREATE POLICY "Admins can delete tokens" 
ON public.social_platform_tokens 
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
  AND public.has_role(auth.uid(), 'admin')
);