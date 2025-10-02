-- User engagement tracking table
CREATE TABLE public.user_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  page_visited text NOT NULL,
  time_spent integer DEFAULT 0, -- seconds
  interactions jsonb DEFAULT '{}'::jsonb,
  device_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Ad impressions tracking
CREATE TABLE public.ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_campaign_id uuid REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  impression_type text DEFAULT 'view', -- view, click, conversion
  session_id text NOT NULL,
  engagement_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User reach scores (calculated by AI)
CREATE TABLE public.user_reach_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reach_score numeric NOT NULL DEFAULT 0,
  engagement_level text DEFAULT 'low', -- low, medium, high
  interests jsonb DEFAULT '[]'::jsonb,
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reach_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_engagement
CREATE POLICY "Users can insert their own engagement"
ON public.user_engagement FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own engagement"
ON public.user_engagement FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all engagement"
ON public.user_engagement FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for ad_impressions
CREATE POLICY "Users can insert their own impressions"
ON public.ad_impressions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own impressions"
ON public.ad_impressions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Companies can view their ad impressions"
ON public.ad_impressions FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can view all impressions"
ON public.ad_impressions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_reach_scores
CREATE POLICY "Users can view their own reach score"
ON public.user_reach_scores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reach scores"
ON public.user_reach_scores FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_user_engagement_user ON public.user_engagement(user_id);
CREATE INDEX idx_user_engagement_session ON public.user_engagement(session_id);
CREATE INDEX idx_ad_impressions_user ON public.ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_campaign ON public.ad_impressions(ad_campaign_id);
CREATE INDEX idx_ad_impressions_company ON public.ad_impressions(company_id);
CREATE INDEX idx_user_reach_scores_user ON public.user_reach_scores(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_reach_scores_updated_at
BEFORE UPDATE ON public.user_reach_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();