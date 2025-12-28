-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own company tokens" ON public.social_platform_tokens;
DROP POLICY IF EXISTS "Users can insert tokens for their company" ON public.social_platform_tokens;
DROP POLICY IF EXISTS "Users can update own company tokens" ON public.social_platform_tokens;
DROP POLICY IF EXISTS "Users can delete own company tokens" ON public.social_platform_tokens;

-- Create new user-specific policies (each user can only see/manage their own tokens)
CREATE POLICY "Users can view own tokens" 
ON public.social_platform_tokens 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tokens" 
ON public.social_platform_tokens 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tokens" 
ON public.social_platform_tokens 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tokens" 
ON public.social_platform_tokens 
FOR DELETE 
USING (user_id = auth.uid());