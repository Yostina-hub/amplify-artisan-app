-- Create table for tracking social media influencers/accounts
CREATE TABLE public.tracked_social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.company_monitoring_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'facebook', 'youtube', 'instagram', 'twitter', 'linkedin')),
  account_handle TEXT NOT NULL,
  account_name TEXT,
  account_url TEXT NOT NULL,
  profile_image_url TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  last_scraped_at TIMESTAMPTZ,
  scrape_frequency TEXT DEFAULT 'daily' CHECK (scrape_frequency IN ('hourly', 'daily', 'weekly')),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, platform, account_handle)
);

-- Create table for storing scraped social posts
CREATE TABLE public.scraped_social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  tracked_account_id UUID REFERENCES public.tracked_social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_id TEXT,
  post_url TEXT,
  content TEXT,
  media_urls JSONB DEFAULT '[]',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  engagement_score DECIMAL(10,2),
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
  sentiment_score DECIMAL(3,2),
  entities JSONB DEFAULT '{}',
  hashtags TEXT[],
  mentions TEXT[],
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  is_processed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  UNIQUE(company_id, platform, post_id)
);

-- Enable RLS
ALTER TABLE public.tracked_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_social_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for tracked_social_accounts
CREATE POLICY "Users can view own company tracked accounts"
  ON public.tracked_social_accounts FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can manage own company tracked accounts"
  ON public.tracked_social_accounts FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- RLS policies for scraped_social_posts
CREATE POLICY "Users can view own company scraped posts"
  ON public.scraped_social_posts FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can manage own company scraped posts"
  ON public.scraped_social_posts FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Add indexes for performance
CREATE INDEX idx_tracked_accounts_company ON public.tracked_social_accounts(company_id);
CREATE INDEX idx_tracked_accounts_platform ON public.tracked_social_accounts(platform);
CREATE INDEX idx_scraped_posts_account ON public.scraped_social_posts(tracked_account_id);
CREATE INDEX idx_scraped_posts_platform ON public.scraped_social_posts(platform);
CREATE INDEX idx_scraped_posts_scraped_at ON public.scraped_social_posts(scraped_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracked_social_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scraped_social_posts;