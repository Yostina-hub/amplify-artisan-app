-- =====================================================
-- COMPLETE DATABASE MIGRATION - SocialHub CRM Platform
-- =====================================================
-- This file combines ALL tables for a fresh deployment
-- Includes 50+ tables with complete schema
-- Run this on a new database to set up the complete schema
-- =====================================================

-- Create custom types
CREATE TYPE app_role AS ENUM ('admin', 'agent', 'user');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    industry_id UUID,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'professional', 'enterprise')),
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    logo_url TEXT,
    website TEXT,
    business_registration_number TEXT
);

-- Industries table
CREATE TABLE IF NOT EXISTS industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    department TEXT,
    job_title TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- =====================================================
-- BILLING & SUBSCRIPTIONS
-- =====================================================

-- Pricing plans
CREATE TABLE IF NOT EXISTS pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    trial_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription requests
CREATE TABLE IF NOT EXISTS subscription_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES pricing_plans(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    transaction_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SOCIAL MEDIA MANAGEMENT
-- =====================================================

-- Social platforms
CREATE TABLE IF NOT EXISTS social_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    api_version TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Platform OAuth apps (centralized management)
CREATE TABLE IF NOT EXISTS platform_oauth_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID REFERENCES social_platforms(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    scopes TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(platform_id)
);

-- Company platform subscriptions
CREATE TABLE IF NOT EXISTS company_platform_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    platform_id UUID REFERENCES social_platforms(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    subscribed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, platform_id)
);

-- Company platform configs (individual OAuth apps)
CREATE TABLE IF NOT EXISTS company_platform_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    platform_id UUID REFERENCES social_platforms(id) ON DELETE CASCADE,
    use_platform_oauth BOOLEAN DEFAULT true,
    client_id TEXT,
    client_secret TEXT,
    redirect_uri TEXT,
    api_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, platform_id)
);

-- Social media accounts
CREATE TABLE IF NOT EXISTS social_media_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    account_name TEXT,
    account_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social media posts (FIXED STATUS CHECK CONSTRAINT)
CREATE TABLE IF NOT EXISTS social_media_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    platforms TEXT[] NOT NULL,
    scheduled_for TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'pending_approval', 'approved', 'rejected')),
    engagement_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    engagement_rate REAL DEFAULT 0,
    published_at TIMESTAMPTZ,
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    media_attachments JSONB DEFAULT '[]'::jsonb,
    account_id UUID,
    first_published_at TIMESTAMPTZ,
    hashtags TEXT[],
    mentions TEXT[],
    location TEXT,
    ai_generated BOOLEAN DEFAULT false
);

-- Social media comments
CREATE TABLE IF NOT EXISTS social_media_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES social_media_posts(id) ON DELETE CASCADE,
    platform_comment_id TEXT,
    author_name TEXT,
    author_id TEXT,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES social_media_comments(id),
    sentiment REAL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Social media mentions
CREATE TABLE IF NOT EXISTS social_media_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    mention_text TEXT,
    author_name TEXT,
    author_id TEXT,
    mention_url TEXT,
    sentiment REAL,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ADVERTISING & MARKETING
-- =====================================================

-- Ad campaigns
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    platform TEXT NOT NULL,
    budget DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    target_audience JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ad impressions
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    cost DECIMAL(10,2),
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Influencers
CREATE TABLE IF NOT EXISTS influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    platform TEXT NOT NULL,
    handle TEXT,
    follower_count INTEGER,
    engagement_rate REAL,
    category TEXT,
    status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'contacted', 'negotiating', 'active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Influencer campaigns
CREATE TABLE IF NOT EXISTS influencer_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    budget DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign influencers (junction table)
CREATE TABLE IF NOT EXISTS campaign_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES influencer_campaigns(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
    compensation DECIMAL(10,2),
    deliverables TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(campaign_id, influencer_id)
);

-- Influencer communications
CREATE TABLE IF NOT EXISTS influencer_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('email', 'phone', 'meeting', 'other')),
    subject TEXT,
    content TEXT,
    sent_by UUID REFERENCES auth.users(id),
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- Influencer contracts
CREATE TABLE IF NOT EXISTS influencer_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES influencer_campaigns(id),
    contract_url TEXT,
    signed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    terms TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- CONFIGURATION & SETTINGS
-- =====================================================

-- Email configurations
CREATE TABLE IF NOT EXISTS email_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('smtp', 'sendgrid', 'mailgun', 'ses')),
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_username TEXT,
    smtp_password TEXT,
    api_key TEXT,
    from_email TEXT NOT NULL,
    from_name TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id)
);

-- OAuth provider settings
CREATE TABLE IF NOT EXISTS oauth_provider_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL UNIQUE,
    client_id TEXT,
    client_secret TEXT,
    redirect_uri TEXT,
    scopes TEXT[],
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Security audit log
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES companies(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User engagement tracking
CREATE TABLE IF NOT EXISTS user_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    page_views INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    features_used TEXT[],
    last_active TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Landing page content
CREATE TABLE IF NOT EXISTS landing_page_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    content TEXT,
    media_url TEXT,
    cta_text TEXT,
    cta_link TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_company_id ON social_media_posts(company_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_scheduled_at ON social_media_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_company_id ON ad_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_influencers_company_id ON influencers(company_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, check_role app_role, check_company_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF check_company_id IS NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = has_role.user_id
            AND user_roles.role = check_role
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = has_role.user_id
            AND user_roles.role = check_role
            AND user_roles.company_id = check_company_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(user_id UUID)
RETURNS TABLE(role app_role, company_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT user_roles.role, user_roles.company_id
    FROM user_roles
    WHERE user_roles.user_id = get_user_roles.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's company ID
CREATE OR REPLACE FUNCTION get_user_company_id(user_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id FROM profiles WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check active trial
CREATE OR REPLACE FUNCTION has_active_trial(check_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM companies
        WHERE id = check_company_id
        AND trial_ends_at > now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trial info
CREATE OR REPLACE FUNCTION get_user_trial_info(user_id UUID)
RETURNS TABLE(has_trial BOOLEAN, trial_ends_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.trial_ends_at > now() as has_trial,
        c.trial_ends_at
    FROM profiles p
    JOIN companies c ON p.company_id = c.id
    WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON pricing_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscription_requests_updated_at BEFORE UPDATE ON subscription_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_social_media_accounts_updated_at BEFORE UPDATE ON social_media_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_social_media_posts_updated_at BEFORE UPDATE ON social_media_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON ad_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON influencers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_influencer_campaigns_updated_at BEFORE UPDATE ON influencer_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_email_configurations_updated_at BEFORE UPDATE ON email_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_company_platform_configs_updated_at BEFORE UPDATE ON company_platform_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_platform_oauth_apps_updated_at BEFORE UPDATE ON platform_oauth_apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_oauth_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_platform_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_platform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Admins can view all companies" ON companies FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own company" ON companies FOR SELECT
    USING (id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can insert companies" ON companies FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update companies" ON companies FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Profiles policies
CREATE POLICY "Users can view profiles in their company" ON profiles FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Profiles can be created" ON profiles FOR INSERT
    WITH CHECK (true);

-- User roles policies
CREATE POLICY "Users can view roles in their company" ON user_roles FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Industries policies (public read)
CREATE POLICY "Anyone can view industries" ON industries FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage industries" ON industries FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Pricing plans policies (public read)
CREATE POLICY "Anyone can view active pricing plans" ON pricing_plans FOR SELECT
    USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage pricing plans" ON pricing_plans FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Social platforms policies (public read)
CREATE POLICY "Anyone can view active platforms" ON social_platforms FOR SELECT
    USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage platforms" ON social_platforms FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Platform OAuth apps policies (admin only)
CREATE POLICY "Admins can view platform oauth apps" ON platform_oauth_apps FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage platform oauth apps" ON platform_oauth_apps FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Company platform subscriptions policies
CREATE POLICY "Users can view their company subscriptions" ON company_platform_subscriptions FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage company subscriptions" ON company_platform_subscriptions FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role) OR company_id = get_user_company_id(auth.uid()));

-- Company platform configs policies
CREATE POLICY "Users can view their company configs" ON company_platform_configs FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage company configs" ON company_platform_configs FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role) OR company_id = get_user_company_id(auth.uid()));

-- Social media accounts policies
CREATE POLICY "Users can view accounts in their company" ON social_media_accounts FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage accounts in their company" ON social_media_accounts FOR ALL
    USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Social media posts policies
CREATE POLICY "Users can view posts in their company" ON social_media_posts FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create posts in their company" ON social_media_posts FOR INSERT
    WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update posts in their company" ON social_media_posts FOR UPDATE
    USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete posts in their company" ON social_media_posts FOR DELETE
    USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Landing page content policies (public read)
CREATE POLICY "Anyone can view active landing pages" ON landing_page_content FOR SELECT
    USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage landing pages" ON landing_page_content FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Security audit log policies
CREATE POLICY "Admins can view audit logs" ON security_audit_log FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs" ON security_audit_log FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default industries
INSERT INTO industries (name, description, icon, features) VALUES
    ('Technology', 'Software, Hardware, IT Services', 'laptop', '["CRM", "Project Management", "Analytics"]'),
    ('Healthcare', 'Medical Services, Pharmaceuticals', 'heart-pulse', '["Patient Management", "Appointments", "Billing"]'),
    ('Retail', 'E-commerce, Stores, Distribution', 'shopping-cart', '["Inventory", "POS", "Customer Loyalty"]'),
    ('Finance', 'Banking, Insurance, Investment', 'dollar-sign', '["Accounting", "Reporting", "Compliance"]'),
    ('Education', 'Schools, Universities, Training', 'graduation-cap', '["Student Management", "Courses", "Assessments"]')
ON CONFLICT (name) DO NOTHING;

-- Insert default social platforms
INSERT INTO social_platforms (name, display_name, icon, color, is_active) VALUES
    ('facebook', 'Facebook', 'facebook', '#1877F2', true),
    ('twitter', 'Twitter/X', 'twitter', '#1DA1F2', true),
    ('instagram', 'Instagram', 'instagram', '#E4405F', true),
    ('linkedin', 'LinkedIn', 'linkedin', '#0A66C2', true),
    ('tiktok', 'TikTok', 'music', '#000000', true),
    ('telegram', 'Telegram', 'send', '#0088CC', true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
