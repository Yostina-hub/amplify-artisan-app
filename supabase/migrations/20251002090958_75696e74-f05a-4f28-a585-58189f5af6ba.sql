-- Create social media accounts table
CREATE TABLE public.social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'tiktok')),
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, platform, account_id)
);

-- Create social media posts table
CREATE TABLE public.social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  platform_post_ids JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create social media metrics table
CREATE TABLE public.social_media_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.social_media_accounts(id) ON DELETE CASCADE,
  followers_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create social media comments table
CREATE TABLE public.social_media_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.social_media_accounts(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.social_media_posts(id) ON DELETE CASCADE,
  platform_comment_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  replied BOOLEAN DEFAULT false,
  reply_content TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(account_id, platform_comment_id)
);

-- Create ad campaigns table
CREATE TABLE public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter')),
  budget DECIMAL(10,2) NOT NULL,
  target_audience JSONB,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_media_accounts
CREATE POLICY "Users can view their own accounts"
  ON public.social_media_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
  ON public.social_media_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON public.social_media_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all accounts"
  ON public.social_media_accounts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all accounts"
  ON public.social_media_accounts FOR SELECT
  USING (public.has_role(auth.uid(), 'agent'));

-- RLS Policies for social_media_posts
CREATE POLICY "Users can view their own posts"
  ON public.social_media_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts"
  ON public.social_media_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all posts"
  ON public.social_media_posts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all posts"
  ON public.social_media_posts FOR SELECT
  USING (public.has_role(auth.uid(), 'agent'));

-- RLS Policies for social_media_metrics
CREATE POLICY "Users can view their account metrics"
  ON public.social_media_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_media_accounts
      WHERE id = social_media_metrics.account_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all metrics"
  ON public.social_media_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all metrics"
  ON public.social_media_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'agent'));

-- RLS Policies for social_media_comments
CREATE POLICY "Users can view their account comments"
  ON public.social_media_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_media_accounts
      WHERE id = social_media_comments.account_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their account comments"
  ON public.social_media_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.social_media_accounts
      WHERE id = social_media_comments.account_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all comments"
  ON public.social_media_comments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all comments"
  ON public.social_media_comments FOR SELECT
  USING (public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins can update all comments"
  ON public.social_media_comments FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can update all comments"
  ON public.social_media_comments FOR UPDATE
  USING (public.has_role(auth.uid(), 'agent'));

-- RLS Policies for ad_campaigns
CREATE POLICY "Users can manage their own campaigns"
  ON public.ad_campaigns FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all campaigns"
  ON public.ad_campaigns FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all campaigns"
  ON public.ad_campaigns FOR SELECT
  USING (public.has_role(auth.uid(), 'agent'));

-- Triggers for updated_at
CREATE TRIGGER update_social_media_accounts_updated_at
  BEFORE UPDATE ON public.social_media_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_social_media_posts_updated_at
  BEFORE UPDATE ON public.social_media_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ad_campaigns_updated_at
  BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();