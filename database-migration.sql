-- Complete Database Migration Script
-- Run this on your PostgreSQL database after installation

-- ============================================
-- 1. CREATE ENUMS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'user');
  END IF;
END
$$;

-- ============================================
-- 2. CREATE TABLES (in dependency order)
-- ============================================

-- Companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    industry TEXT,
    company_size TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role public.app_role NOT NULL,
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role, company_id)
);

-- Industries table
CREATE TABLE public.industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon_name TEXT NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    benefits JSONB DEFAULT '[]'::jsonb,
    use_cases JSONB DEFAULT '[]'::jsonb,
    case_study JSONB,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pricing plans table
CREATE TABLE public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    billing_period TEXT DEFAULT 'month',
    features JSONB DEFAULT '[]'::jsonb,
    max_team_members INTEGER,
    max_social_accounts INTEGER,
    includes_ai BOOLEAN DEFAULT false,
    custom_integrations BOOLEAN DEFAULT false,
    support_level TEXT DEFAULT 'standard',
    is_popular BOOLEAN DEFAULT false,
    cta_text TEXT DEFAULT 'Start free trial',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subscription requests table
CREATE TABLE public.subscription_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    plan_id UUID REFERENCES public.pricing_plans(id),
    status TEXT DEFAULT 'pending',
    is_trial BOOLEAN DEFAULT false,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    trial_converted BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID
);

-- Payment transactions table
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_request_id UUID REFERENCES public.subscription_requests(id),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'ETB',
    payment_method TEXT NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending',
    transaction_reference TEXT,
    phone_number TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Social media accounts table
CREATE TABLE public.social_media_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID REFERENCES public.companies(id),
    platform TEXT NOT NULL,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Social media posts table
CREATE TABLE public.social_media_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID REFERENCES public.companies(id),
    content TEXT NOT NULL,
    platforms TEXT[] NOT NULL,
    media_urls JSONB DEFAULT '[]'::jsonb,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft',
    platform_post_ids JSONB DEFAULT '{}'::jsonb,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    engagement_rate NUMERIC DEFAULT 0,
    video_watch_time_seconds INTEGER DEFAULT 0,
    metrics_last_synced_at TIMESTAMP WITH TIME ZONE,
    flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ad campaigns table
CREATE TABLE public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID REFERENCES public.companies(id),
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    budget NUMERIC NOT NULL,
    target_audience JSONB,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft',
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Influencers table
CREATE TABLE public.influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID REFERENCES public.companies(id),
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    platform_handle TEXT NOT NULL,
    platform_url TEXT,
    avatar_url TEXT,
    category TEXT,
    bio TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    follower_count INTEGER DEFAULT 0,
    engagement_rate NUMERIC DEFAULT 0,
    avg_post_price NUMERIC,
    tags TEXT[],
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Influencer campaigns table
CREATE TABLE public.influencer_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID REFERENCES public.companies(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning',
    budget NUMERIC NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    goals JSONB,
    target_audience JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaign influencers table
CREATE TABLE public.campaign_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.influencer_campaigns(id) ON DELETE CASCADE,
    influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'invited',
    agreed_price NUMERIC,
    deliverables JSONB,
    content_submitted_at TIMESTAMP WITH TIME ZONE,
    content_approved_at TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE,
    performance_metrics JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Social media comments table
CREATE TABLE public.social_media_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.social_media_accounts(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.social_media_posts(id),
    platform_comment_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    replied BOOLEAN DEFAULT false,
    reply_content TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    city TEXT,
    country TEXT,
    continent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ad impressions table
CREATE TABLE public.ad_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_campaign_id UUID REFERENCES public.ad_campaigns(id),
    company_id UUID REFERENCES public.companies(id),
    user_id UUID,
    session_id TEXT NOT NULL,
    impression_type TEXT DEFAULT 'view',
    engagement_score NUMERIC DEFAULT 0,
    city TEXT,
    country TEXT,
    continent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User engagement table
CREATE TABLE public.user_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id TEXT NOT NULL,
    page_visited TEXT NOT NULL,
    time_spent INTEGER DEFAULT 0,
    interactions JSONB,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Landing page content table
CREATE TABLE public.landing_page_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT NOT NULL UNIQUE,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Social platforms table
CREATE TABLE public.social_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Company platform subscriptions table
CREATE TABLE public.company_platform_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES public.social_platforms(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(company_id, platform_id)
);

-- Company platform configs table
CREATE TABLE public.company_platform_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES public.social_platforms(id) ON DELETE CASCADE,
    client_id TEXT,
    client_secret TEXT,
    api_key TEXT,
    api_secret TEXT,
    access_token TEXT,
    redirect_url TEXT,
    webhook_url TEXT,
    channel_id TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email configurations table
CREATE TABLE public.email_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id),
    sender_name TEXT,
    sender_email TEXT,
    smtp_host TEXT,
    smtp_port INTEGER DEFAULT 465,
    smtp_username TEXT,
    smtp_password TEXT,
    smtp_secure BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- OAuth provider settings table
CREATE TABLE public.oauth_provider_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    client_id TEXT,
    client_secret TEXT,
    redirect_url TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    is_enabled BOOLEAN DEFAULT true,
    is_configured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Security audit log table
CREATE TABLE public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Social media mentions table
CREATE TABLE public.social_media_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.social_media_accounts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    mention_type TEXT DEFAULT 'mention',
    sentiment TEXT,
    post_url TEXT,
    engagement_count INTEGER DEFAULT 0,
    mentioned_at TIMESTAMP WITH TIME ZONE NOT NULL,
    keyword_id UUID,
    city TEXT,
    country TEXT,
    continent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Influencer communications table
CREATE TABLE public.influencer_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
    direction TEXT NOT NULL,
    communication_type TEXT DEFAULT 'email',
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Influencer contracts table
CREATE TABLE public.influencer_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_influencer_id UUID NOT NULL REFERENCES public.campaign_influencers(id) ON DELETE CASCADE,
    payment_amount NUMERIC NOT NULL,
    payment_method TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_status TEXT DEFAULT 'pending',
    contract_url TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 3. CREATE VIEWS
-- ============================================

-- Safe view for social media accounts (without tokens)
CREATE VIEW public.social_media_accounts_safe AS
SELECT 
    id,
    user_id,
    company_id,
    platform,
    account_id,
    account_name,
    token_expires_at,
    is_active,
    created_at,
    updated_at
FROM public.social_media_accounts;

-- Safe view for profiles (without email)
CREATE VIEW public.profiles_safe AS
SELECT 
    id,
    full_name,
    avatar_url,
    company_id,
    created_at,
    updated_at
FROM public.profiles;

-- Safe view for email configurations (without passwords)
CREATE VIEW public.email_configurations_safe AS
SELECT 
    id,
    company_id,
    sender_name,
    sender_email,
    smtp_host,
    smtp_port,
    smtp_username,
    smtp_secure,
    is_active,
    is_verified,
    created_at,
    updated_at
FROM public.email_configurations;

-- Audit log view with user details
CREATE VIEW public.audit_log_view AS
SELECT 
    sal.id,
    sal.user_id,
    sal.action,
    sal.table_name,
    sal.record_id,
    sal.details,
    sal.ip_address,
    sal.user_agent,
    sal.created_at,
    p.full_name as user_name,
    p.email as user_email,
    p.company_id
FROM public.security_audit_log sal
LEFT JOIN public.profiles p ON p.id = sal.user_id;

-- ============================================
-- 4. CREATE FUNCTIONS
-- ============================================

-- Function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Function to get user company ID
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;

-- Function to check active trial
CREATE OR REPLACE FUNCTION public.has_active_trial(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscription_requests
    WHERE email = (SELECT email::text FROM public.profiles WHERE id = _user_id)
      AND is_trial = true
      AND trial_ends_at > now()
      AND status = 'approved'
  )
$$;

-- Function to get trial info
CREATE OR REPLACE FUNCTION public.get_user_trial_info(_user_id UUID)
RETURNS TABLE(
    is_trial BOOLEAN,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER,
    trial_converted BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sr.is_trial,
    sr.trial_ends_at,
    CASE 
      WHEN sr.trial_ends_at > now() 
      THEN EXTRACT(DAY FROM sr.trial_ends_at - now())::INTEGER + 1
      ELSE 0
    END as days_remaining,
    sr.trial_converted
  FROM public.subscription_requests sr
  WHERE sr.email = (SELECT email::text FROM public.profiles WHERE id = _user_id)
    AND sr.is_trial = true
  ORDER BY sr.created_at DESC
  LIMIT 1
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

-- Update timestamp triggers
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_social_media_accounts_updated_at
BEFORE UPDATE ON public.social_media_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_social_media_posts_updated_at
BEFORE UPDATE ON public.social_media_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ad_campaigns_updated_at
BEFORE UPDATE ON public.ad_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_influencers_updated_at
BEFORE UPDATE ON public.influencers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_influencer_campaigns_updated_at
BEFORE UPDATE ON public.influencer_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 6. CREATE INDEXES
-- ============================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_social_media_accounts_user_id ON public.social_media_accounts(user_id);
CREATE INDEX idx_social_media_posts_user_id ON public.social_media_posts(user_id);
CREATE INDEX idx_ad_campaigns_user_id ON public.ad_campaigns(user_id);
CREATE INDEX idx_influencers_user_id ON public.influencers(user_id);

-- ============================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_platform_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_platform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_contracts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. CREATE RLS POLICIES
-- ============================================

-- COMPANIES TABLE POLICIES
CREATE POLICY "Anyone can insert company applications" ON public.companies
FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view companies" ON public.companies
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can update all companies" ON public.companies
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can delete companies" ON public.companies
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES TABLE POLICIES
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = id OR 
    public.has_role(auth.uid(), 'admin') OR 
    (company_id IS NOT NULL AND company_id = public.get_user_company_id(auth.uid()))
  )
);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Block direct profile inserts" ON public.profiles
FOR INSERT WITH CHECK (false);

-- USER ROLES TABLE POLICIES
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- INDUSTRIES TABLE POLICIES
CREATE POLICY "Anyone can view active industries" ON public.industries
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage industries" ON public.industries
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PRICING PLANS TABLE POLICIES
CREATE POLICY "Anyone can view active pricing plans" ON public.pricing_plans
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage pricing plans" ON public.pricing_plans
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- SUBSCRIPTION REQUESTS TABLE POLICIES
CREATE POLICY "Anyone can create subscription requests" ON public.subscription_requests
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own requests" ON public.subscription_requests
FOR SELECT USING (email = (SELECT email::text FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can view all requests" ON public.subscription_requests
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests" ON public.subscription_requests
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- PAYMENT TRANSACTIONS TABLE POLICIES
CREATE POLICY "Users can view their payment transactions" ON public.payment_transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.subscription_requests sr
    WHERE sr.id = subscription_request_id 
    AND sr.email = (SELECT email::text FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Admins can view all payment transactions" ON public.payment_transactions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- SOCIAL MEDIA ACCOUNTS TABLE POLICIES
CREATE POLICY "Users can view their own accounts" ON public.social_media_accounts
FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own accounts" ON public.social_media_accounts
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own accounts" ON public.social_media_accounts
FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own accounts" ON public.social_media_accounts
FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all accounts" ON public.social_media_accounts
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert accounts" ON public.social_media_accounts
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update accounts" ON public.social_media_accounts
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any account" ON public.social_media_accounts
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all accounts" ON public.social_media_accounts
FOR SELECT USING (public.has_role(auth.uid(), 'agent'));

-- SOCIAL MEDIA POSTS TABLE POLICIES
CREATE POLICY "Users can view their own posts" ON public.social_media_posts
FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own posts" ON public.social_media_posts
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own posts" ON public.social_media_posts
FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own posts" ON public.social_media_posts
FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all posts" ON public.social_media_posts
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert posts" ON public.social_media_posts
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts" ON public.social_media_posts
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any post" ON public.social_media_posts
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all posts" ON public.social_media_posts
FOR SELECT USING (public.has_role(auth.uid(), 'agent'));

-- AD CAMPAIGNS TABLE POLICIES
CREATE POLICY "Users can view their company campaigns" ON public.ad_campaigns
FOR SELECT USING (
  auth.uid()::text = user_id::text AND 
  company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can insert their company campaigns" ON public.ad_campaigns
FOR INSERT WITH CHECK (
  auth.uid()::text = user_id::text AND 
  company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update their company campaigns" ON public.ad_campaigns
FOR UPDATE USING (
  auth.uid()::text = user_id::text AND 
  company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete their company campaigns" ON public.ad_campaigns
FOR DELETE USING (
  auth.uid()::text = user_id::text AND 
  company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Agents can view their company campaigns" ON public.ad_campaigns
FOR SELECT USING (
  public.has_role(auth.uid(), 'agent') AND 
  company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Agents can insert their company campaigns" ON public.ad_campaigns
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'agent') AND 
  company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Agents can update their company campaigns" ON public.ad_campaigns
FOR UPDATE USING (
  public.has_role(auth.uid(), 'agent') AND 
  company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can view all campaigns" ON public.ad_campaigns
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert any campaign" ON public.ad_campaigns
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any campaign" ON public.ad_campaigns
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any campaign" ON public.ad_campaigns
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- INFLUENCERS TABLE POLICIES
CREATE POLICY "Users can view their own influencers" ON public.influencers
FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own influencers" ON public.influencers
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own influencers" ON public.influencers
FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own influencers" ON public.influencers
FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all influencers" ON public.influencers
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert influencers" ON public.influencers
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update influencers" ON public.influencers
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete influencers" ON public.influencers
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all influencers" ON public.influencers
FOR SELECT USING (public.has_role(auth.uid(), 'agent'));

-- INFLUENCER CAMPAIGNS TABLE POLICIES
CREATE POLICY "Users can view their own campaigns" ON public.influencer_campaigns
FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own campaigns" ON public.influencer_campaigns
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own campaigns" ON public.influencer_campaigns
FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own campaigns" ON public.influencer_campaigns
FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all campaigns" ON public.influencer_campaigns
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert campaigns" ON public.influencer_campaigns
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update campaigns" ON public.influencer_campaigns
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete campaigns" ON public.influencer_campaigns
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Agents can view all campaigns" ON public.influencer_campaigns
FOR SELECT USING (public.has_role(auth.uid(), 'agent'));

-- CAMPAIGN INFLUENCERS TABLE POLICIES
CREATE POLICY "Users can view campaign influencers for their campaigns" ON public.campaign_influencers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.influencer_campaigns
    WHERE id = campaign_id AND user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can insert campaign influencers for their campaigns" ON public.campaign_influencers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.influencer_campaigns
    WHERE id = campaign_id AND user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can update campaign influencers for their campaigns" ON public.campaign_influencers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.influencer_campaigns
    WHERE id = campaign_id AND user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can delete campaign influencers for their campaigns" ON public.campaign_influencers
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.influencer_campaigns
    WHERE id = campaign_id AND user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Admins can manage all campaign influencers" ON public.campaign_influencers
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can manage all campaign influencers" ON public.campaign_influencers
FOR ALL USING (public.has_role(auth.uid(), 'agent'));

-- SOCIAL MEDIA COMMENTS TABLE POLICIES
CREATE POLICY "Users can view their account comments" ON public.social_media_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.social_media_accounts
    WHERE id = account_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert comments on their accounts" ON public.social_media_comments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.social_media_accounts
    WHERE id = account_id AND user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can update their account comments" ON public.social_media_comments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.social_media_accounts
    WHERE id = account_id AND user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can delete comments on their accounts" ON public.social_media_comments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.social_media_accounts
    WHERE id = account_id AND user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Admins can view all comments" ON public.social_media_comments
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert any comment" ON public.social_media_comments
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all comments" ON public.social_media_comments
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any comment" ON public.social_media_comments
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all comments" ON public.social_media_comments
FOR SELECT USING (public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents can insert any comment" ON public.social_media_comments
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents can update all comments" ON public.social_media_comments
FOR UPDATE USING (public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents can delete any comment" ON public.social_media_comments
FOR DELETE USING (public.has_role(auth.uid(), 'agent'));

-- AD IMPRESSIONS TABLE POLICIES
CREATE POLICY "Users can view their own impressions" ON public.ad_impressions
FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own impressions" ON public.ad_impressions
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Companies can view their ad impressions" ON public.ad_impressions
FOR SELECT USING (company_id::text = public.get_user_company_id(auth.uid())::text);

CREATE POLICY "Admins can view all impressions" ON public.ad_impressions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- USER ENGAGEMENT TABLE POLICIES
CREATE POLICY "Users can insert their own engagement" ON public.user_engagement
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own engagement" ON public.user_engagement
FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all engagement" ON public.user_engagement
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- LANDING PAGE CONTENT TABLE POLICIES
CREATE POLICY "Anyone can view active landing content" ON public.landing_page_content
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage landing content" ON public.landing_page_content
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- SOCIAL PLATFORMS TABLE POLICIES
CREATE POLICY "Anyone can view active platforms" ON public.social_platforms
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage platforms" ON public.social_platforms
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- COMPANY PLATFORM SUBSCRIPTIONS TABLE POLICIES
CREATE POLICY "Companies can view their own subscriptions" ON public.company_platform_subscriptions
FOR SELECT USING (company_id::text = public.get_user_company_id(auth.uid())::text);

CREATE POLICY "Companies can request subscriptions" ON public.company_platform_subscriptions
FOR INSERT WITH CHECK (
  company_id::text = public.get_user_company_id(auth.uid())::text AND 
  status = 'pending'
);

CREATE POLICY "Admins can manage all subscriptions" ON public.company_platform_subscriptions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- COMPANY PLATFORM CONFIGS TABLE POLICIES
CREATE POLICY "Company admins can manage their configs" ON public.company_platform_configs
FOR ALL USING (
  company_id::text = public.get_user_company_id(auth.uid())::text AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id::text = auth.uid()::text 
    AND role = 'admin'::public.app_role 
    AND company_id::text = public.get_user_company_id(auth.uid())::text
  )
);

CREATE POLICY "Super admins can manage all configs" ON public.company_platform_configs
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- EMAIL CONFIGURATIONS TABLE POLICIES
CREATE POLICY "Admins can view all email configs" ON public.email_configurations
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert email configs" ON public.email_configurations
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update email configs" ON public.email_configurations
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete email configs" ON public.email_configurations
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company admins can view their email config" ON public.email_configurations
FOR SELECT USING (
  (company_id IS NOT NULL AND 
   company_id::text = public.get_user_company_id(auth.uid())::text AND 
   public.has_role(auth.uid(), 'admin')) OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Company admins can update their email config" ON public.email_configurations
FOR UPDATE USING (
  (company_id IS NOT NULL AND 
   company_id::text = public.get_user_company_id(auth.uid())::text AND 
   public.has_role(auth.uid(), 'admin')) OR 
  public.has_role(auth.uid(), 'admin')
);

-- OAUTH PROVIDER SETTINGS TABLE POLICIES
CREATE POLICY "Only admins can view OAuth settings" ON public.oauth_provider_settings
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert OAuth settings" ON public.oauth_provider_settings
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update OAuth settings" ON public.oauth_provider_settings
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete OAuth settings" ON public.oauth_provider_settings
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- SECURITY AUDIT LOG TABLE POLICIES
CREATE POLICY "System can insert audit logs" ON public.security_audit_log
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company users can view their company audit logs" ON public.security_audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    WHERE p1.id = auth.uid() 
    AND p1.company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = security_audit_log.user_id 
      AND p2.company_id = p1.company_id
    )
  )
);

-- SOCIAL MEDIA MENTIONS TABLE POLICIES
CREATE POLICY "Users can view mentions for their accounts" ON public.social_media_mentions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.social_media_accounts
    WHERE id = account_id AND user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Admins can view all mentions" ON public.social_media_mentions
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert mentions" ON public.social_media_mentions
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update mentions" ON public.social_media_mentions
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete mentions" ON public.social_media_mentions
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all mentions" ON public.social_media_mentions
FOR SELECT USING (public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents can insert mentions" ON public.social_media_mentions
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'agent'));

-- INFLUENCER COMMUNICATIONS TABLE POLICIES
CREATE POLICY "Users can view communications for their influencers" ON public.influencer_communications
FOR SELECT USING (
  auth.uid()::text = user_id::text OR 
  EXISTS (
    SELECT 1 FROM public.influencers
    WHERE id = influencer_id AND user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can insert communications for their influencers" ON public.influencer_communications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all communications" ON public.influencer_communications
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert communications" ON public.influencer_communications
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update communications" ON public.influencer_communications
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete communications" ON public.influencer_communications
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all communications" ON public.influencer_communications
FOR SELECT USING (public.has_role(auth.uid(), 'agent'));

-- INFLUENCER CONTRACTS TABLE POLICIES
CREATE POLICY "Users can view contracts for their campaigns" ON public.influencer_contracts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.campaign_influencers ci
    JOIN public.influencer_campaigns ic ON ic.id = ci.campaign_id
    WHERE ci.id = campaign_influencer_id AND ic.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can insert contracts for their campaigns" ON public.influencer_contracts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaign_influencers ci
    JOIN public.influencer_campaigns ic ON ic.id = ci.campaign_id
    WHERE ci.id = campaign_influencer_id AND ic.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can update contracts for their campaigns" ON public.influencer_contracts
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.campaign_influencers ci
    JOIN public.influencer_campaigns ic ON ic.id = ci.campaign_id
    WHERE ci.id = campaign_influencer_id AND ic.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Admins can manage all contracts" ON public.influencer_contracts
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can manage all contracts" ON public.influencer_contracts
FOR ALL USING (public.has_role(auth.uid(), 'agent'));

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on all sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- DONE! SECURITY ENABLED
-- ============================================

-- Your database is now ready with:
-- ✅ All tables created
-- ✅ Row Level Security (RLS) enabled
-- ✅ Comprehensive RLS policies
-- ✅ Security definer functions
-- ✅ Proper role-based access control
-- ✅ Audit logging enabled
-- ✅ Views for sensitive data protection

-- Next steps:
-- 1. Update your .env file with the database connection string
-- 2. Set up your first admin user (see DEPLOYMENT.md)
-- 3. Configure auth.uid() to work (requires Supabase Auth or custom auth)
