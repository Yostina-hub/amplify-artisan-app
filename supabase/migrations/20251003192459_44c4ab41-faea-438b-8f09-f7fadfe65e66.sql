-- Add Telegram platform
INSERT INTO public.social_platforms (name, display_name, icon_name, requires_oauth, requires_api_key, is_active) 
VALUES ('telegram', 'Telegram', 'Send', false, true, true)
ON CONFLICT (name) DO NOTHING;

-- Add channel_id field to company_platform_configs for storing Telegram channel/group ID
ALTER TABLE public.company_platform_configs 
ADD COLUMN IF NOT EXISTS channel_id text;