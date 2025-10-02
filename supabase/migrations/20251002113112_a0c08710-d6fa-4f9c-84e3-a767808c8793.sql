-- Create companies table for multi-tenant SaaS
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Super admins can view all companies
CREATE POLICY "Super admins can view all companies"
  ON public.companies FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Super admins can update all companies
CREATE POLICY "Super admins can update all companies"
  ON public.companies FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Super admins can delete companies
CREATE POLICY "Super admins can delete companies"
  ON public.companies FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert a company application
CREATE POLICY "Anyone can apply as a company"
  ON public.companies FOR INSERT
  WITH CHECK (true);

-- Add company_id to profiles table
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update user_roles to include company context
ALTER TABLE public.user_roles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_user_roles_company_id ON public.user_roles(company_id);

-- Add company_id to all existing tables
ALTER TABLE public.ad_campaigns ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.influencers ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.influencer_campaigns ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.social_media_accounts ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.social_media_posts ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.tracked_keywords ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_ad_campaigns_company_id ON public.ad_campaigns(company_id);
CREATE INDEX idx_influencers_company_id ON public.influencers(company_id);
CREATE INDEX idx_influencer_campaigns_company_id ON public.influencer_campaigns(company_id);
CREATE INDEX idx_social_media_accounts_company_id ON public.social_media_accounts(company_id);
CREATE INDEX idx_social_media_posts_company_id ON public.social_media_posts(company_id);
CREATE INDEX idx_tracked_keywords_company_id ON public.tracked_keywords(company_id);

-- Update RLS policies for ad_campaigns to include company isolation
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.ad_campaigns;
CREATE POLICY "Users can view their company campaigns"
  ON public.ad_campaigns FOR SELECT
  USING (
    auth.uid() = user_id AND 
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.ad_campaigns;
CREATE POLICY "Users can insert their company campaigns"
  ON public.ad_campaigns FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.ad_campaigns;
CREATE POLICY "Users can update their company campaigns"
  ON public.ad_campaigns FOR UPDATE
  USING (
    auth.uid() = user_id AND 
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.ad_campaigns;
CREATE POLICY "Users can delete their company campaigns"
  ON public.ad_campaigns FOR DELETE
  USING (
    auth.uid() = user_id AND 
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Update RLS policies for agents to only see their company data
DROP POLICY IF EXISTS "Agents can view all campaigns" ON public.ad_campaigns;
CREATE POLICY "Agents can view their company campaigns"
  ON public.ad_campaigns FOR SELECT
  USING (
    has_role(auth.uid(), 'agent'::app_role) AND
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Agents can insert campaigns" ON public.ad_campaigns;
CREATE POLICY "Agents can insert their company campaigns"
  ON public.ad_campaigns FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'agent'::app_role) AND
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Agents can update campaigns" ON public.ad_campaigns;
CREATE POLICY "Agents can update their company campaigns"
  ON public.ad_campaigns FOR UPDATE
  USING (
    has_role(auth.uid(), 'agent'::app_role) AND
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Update profiles RLS to allow company users to see each other
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Company users can view their company profiles"
  ON public.profiles FOR SELECT
  USING (
    company_id IS NOT NULL AND
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Update user_roles policies for company admins
CREATE POLICY "Company admins can view their company user roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role 
      AND ur.company_id = user_roles.company_id
    )
  );

CREATE POLICY "Company admins can insert their company user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role 
      AND ur.company_id = company_id
    )
  );

-- Create trigger for updating companies updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create function to get user's company
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id;
$$;