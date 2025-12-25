-- Add user_id column to social_platform_tokens if not exists
ALTER TABLE public.social_platform_tokens 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create unique constraint for upsert operations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'social_platform_tokens_company_platform_account_key'
  ) THEN
    ALTER TABLE public.social_platform_tokens 
    ADD CONSTRAINT social_platform_tokens_company_platform_account_key 
    UNIQUE (company_id, platform, account_id);
  END IF;
END $$;

-- Update RLS policies to include user_id checks
DROP POLICY IF EXISTS "Users can manage company tokens" ON public.social_platform_tokens;
DROP POLICY IF EXISTS "Users can view company tokens" ON public.social_platform_tokens;

CREATE POLICY "Users can view own company tokens"
ON public.social_platform_tokens
FOR SELECT
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Users can insert tokens for their company"
ON public.social_platform_tokens
FOR INSERT
WITH CHECK (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update own company tokens"
ON public.social_platform_tokens
FOR UPDATE
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Users can delete own company tokens"
ON public.social_platform_tokens
FOR DELETE
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  OR user_id = auth.uid()
);