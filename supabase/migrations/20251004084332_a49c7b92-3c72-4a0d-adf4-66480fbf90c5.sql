-- Create table for OAuth provider settings
CREATE TABLE IF NOT EXISTS public.oauth_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  client_id TEXT,
  client_secret TEXT,
  redirect_url TEXT,
  is_enabled BOOLEAN DEFAULT true,
  is_configured BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.oauth_provider_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage OAuth settings
CREATE POLICY "Only admins can view OAuth settings"
  ON public.oauth_provider_settings
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert OAuth settings"
  ON public.oauth_provider_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update OAuth settings"
  ON public.oauth_provider_settings
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete OAuth settings"
  ON public.oauth_provider_settings
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default providers
INSERT INTO public.oauth_provider_settings (provider_name, display_name, is_configured)
VALUES 
  ('google', 'Google', false),
  ('facebook', 'Facebook', false)
ON CONFLICT (provider_name) DO NOTHING;

-- Create updated_at trigger
CREATE TRIGGER update_oauth_provider_settings_updated_at
  BEFORE UPDATE ON public.oauth_provider_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();