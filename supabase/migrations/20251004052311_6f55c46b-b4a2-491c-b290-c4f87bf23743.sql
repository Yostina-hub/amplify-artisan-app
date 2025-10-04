-- Add access_token column to company_platform_configs table
ALTER TABLE public.company_platform_configs 
ADD COLUMN IF NOT EXISTS access_token TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.company_platform_configs.access_token IS 'OAuth access token for platforms that require OAuth authentication (Facebook, Instagram, LinkedIn, Twitter, TikTok, YouTube, Pinterest)';