-- Complete Database Migration Script
-- Run this on your PostgreSQL database after installation

-- ============================================
-- 1. CREATE ENUMS
-- ============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'user');

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
    WHERE email = (SELECT email FROM public.profiles WHERE id = _user_id)
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
  WHERE sr.email = (SELECT email FROM public.profiles WHERE id = _user_id)
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
-- DONE!
-- ============================================

-- Your database is now ready!
-- Next steps:
-- 1. Update your .env file with the database connection string
-- 2. Run your application migrations if any
-- 3. Set up your first admin user
