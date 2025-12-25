-- Drop the existing platform_oauth_apps table and recreate with TEXT platform_id
DROP TABLE IF EXISTS platform_oauth_apps;

-- Create platform_oauth_apps with TEXT platform_id for string-based identifiers
CREATE TABLE public.platform_oauth_apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_oauth_apps ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage platform OAuth apps
CREATE POLICY "Super admins can manage platform OAuth apps"
  ON public.platform_oauth_apps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin' 
      AND user_roles.company_id IS NULL
    )
  );

-- All authenticated users can view active OAuth apps (needed for connection flow)
CREATE POLICY "Authenticated users can view active OAuth apps"
  ON public.platform_oauth_apps
  FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Create index for platform lookups
CREATE INDEX idx_platform_oauth_apps_platform ON public.platform_oauth_apps(platform_id);

-- Add comment
COMMENT ON TABLE public.platform_oauth_apps IS 'Centralized OAuth app credentials for social media platforms';