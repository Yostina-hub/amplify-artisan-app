-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_period TEXT DEFAULT 'month',
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  cta_text TEXT DEFAULT 'Start free trial',
  max_social_accounts INTEGER,
  max_team_members INTEGER,
  includes_ai BOOLEAN DEFAULT false,
  support_level TEXT DEFAULT 'standard',
  custom_integrations BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active pricing plans
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pricing_plans' AND policyname = 'Anyone can view active pricing plans'
  ) THEN
    CREATE POLICY "Anyone can view active pricing plans"
    ON public.pricing_plans
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- Admins can manage all pricing plans
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pricing_plans' AND policyname = 'Admins can manage pricing plans'
  ) THEN
    CREATE POLICY "Admins can manage pricing plans"
    ON public.pricing_plans
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Insert default pricing plans if not exists
INSERT INTO public.pricing_plans (name, slug, price, description, features, is_popular, display_order, max_social_accounts, max_team_members, includes_ai, support_level)
SELECT 'Professional', 'professional', 99, 'Perfect for small teams', 
 '["Up to 10 social accounts", "Unlimited scheduling", "Advanced analytics", "5 team members", "Basic support"]'::jsonb,
 false, 1, 10, 5, false, 'basic'
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_plans WHERE slug = 'professional');

INSERT INTO public.pricing_plans (name, slug, price, description, features, is_popular, display_order, max_social_accounts, max_team_members, includes_ai, support_level)
SELECT 'Team', 'team', 249, 'For growing businesses', 
 '["Up to 20 social accounts", "Everything in Professional", "AI content assistant", "10 team members", "Priority support"]'::jsonb,
 true, 2, 20, 10, true, 'priority'
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_plans WHERE slug = 'team');

INSERT INTO public.pricing_plans (name, slug, price, description, features, is_popular, display_order, max_social_accounts, max_team_members, includes_ai, support_level)
SELECT 'Business', 'business', 499, 'For large organizations', 
 '["Unlimited social accounts", "Everything in Team", "Custom integrations", "Unlimited team members", "Dedicated support", "Advanced security"]'::jsonb,
 false, 3, -1, -1, true, 'dedicated'
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_plans WHERE slug = 'business');

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_pricing_plans_updated_at ON public.pricing_plans;
CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();