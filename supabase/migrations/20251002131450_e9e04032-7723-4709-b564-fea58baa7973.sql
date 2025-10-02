-- Create company platform subscriptions table
CREATE TABLE public.company_platform_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform_id uuid NOT NULL REFERENCES public.social_platforms(id) ON DELETE CASCADE,
  subscribed_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, platform_id)
);

-- Enable RLS
ALTER TABLE public.company_platform_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all subscriptions"
ON public.company_platform_subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Companies can view their own subscriptions"
ON public.company_platform_subscriptions
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_company_platform_subscriptions_updated_at
BEFORE UPDATE ON public.company_platform_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create index for performance
CREATE INDEX idx_company_platform_subs_company ON public.company_platform_subscriptions(company_id);
CREATE INDEX idx_company_platform_subs_platform ON public.company_platform_subscriptions(platform_id);