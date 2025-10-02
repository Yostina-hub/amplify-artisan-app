-- Add company OAuth app credentials table
CREATE TABLE public.company_platform_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform_id uuid NOT NULL REFERENCES public.social_platforms(id) ON DELETE CASCADE,
  client_id text,
  client_secret text,
  api_key text,
  api_secret text,
  redirect_url text,
  webhook_url text,
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, platform_id)
);

-- Enable RLS
ALTER TABLE public.company_platform_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all configs"
ON public.company_platform_configs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Companies can manage their own configs"
ON public.company_platform_configs
FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_company_platform_configs_updated_at
BEFORE UPDATE ON public.company_platform_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();