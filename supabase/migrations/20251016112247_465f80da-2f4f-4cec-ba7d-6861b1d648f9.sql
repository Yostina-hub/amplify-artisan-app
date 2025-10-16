-- Create table for platform-managed OAuth apps (centralized)
CREATE TABLE IF NOT EXISTS public.platform_oauth_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES public.social_platforms(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(platform_id)
);

-- Add use_platform_oauth column to company_platform_configs
ALTER TABLE public.company_platform_configs 
ADD COLUMN IF NOT EXISTS use_platform_oauth BOOLEAN DEFAULT true;

-- Enable RLS
ALTER TABLE public.platform_oauth_apps ENABLE ROW LEVEL SECURITY;

-- Super admins can manage platform OAuth apps
CREATE POLICY "Super admins can manage platform OAuth apps"
ON public.platform_oauth_apps
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Companies can view active platform OAuth apps
CREATE POLICY "Companies can view active platform OAuth apps"
ON public.platform_oauth_apps
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_platform_oauth_apps_updated_at
BEFORE UPDATE ON public.platform_oauth_apps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();