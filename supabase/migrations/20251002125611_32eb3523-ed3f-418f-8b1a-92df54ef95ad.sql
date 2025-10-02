-- Create social platforms table for dynamic platform management
CREATE TABLE public.social_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  icon_name text,
  oauth_authorize_url text,
  oauth_token_url text,
  oauth_scopes text,
  api_base_url text,
  requires_oauth boolean DEFAULT true,
  requires_api_key boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_platforms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_platforms
CREATE POLICY "Anyone can view active platforms"
ON public.social_platforms
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage platforms"
ON public.social_platforms
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_social_platforms_updated_at
BEFORE UPDATE ON public.social_platforms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Seed initial platforms
INSERT INTO public.social_platforms (name, display_name, icon_name, requires_oauth, is_active) VALUES
('facebook', 'Facebook', 'Facebook', true, true),
('twitter', 'Twitter/X', 'Twitter', true, true),
('instagram', 'Instagram', 'Instagram', true, true),
('linkedin', 'LinkedIn', 'Linkedin', true, true),
('tiktok', 'TikTok', 'Music', true, true),
('youtube', 'YouTube', 'Youtube', true, true),
('pinterest', 'Pinterest', 'Image', true, true);