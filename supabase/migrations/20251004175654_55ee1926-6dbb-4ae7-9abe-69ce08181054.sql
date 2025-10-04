-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.content_recommendations CASCADE;
DROP TABLE IF EXISTS public.user_content_preferences CASCADE;
DROP TABLE IF EXISTS public.user_engagement CASCADE;

-- Create engagement tracking table
CREATE TABLE public.user_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID,
  company_id UUID,
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('view', 'like', 'comment', 'share', 'click')),
  engagement_duration INTEGER,
  engagement_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  location_data JSONB
);

CREATE INDEX idx_user_engagement_user ON public.user_engagement(user_id);
CREATE INDEX idx_user_engagement_post ON public.user_engagement(post_id);
CREATE INDEX idx_user_engagement_type ON public.user_engagement(engagement_type);
CREATE INDEX idx_user_engagement_time ON public.user_engagement(created_at DESC);

ALTER TABLE public.user_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own engagement"
ON public.user_engagement FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own engagement"
ON public.user_engagement FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all engagement"
ON public.user_engagement FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user preferences table
CREATE TABLE public.user_content_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID,
  preferred_content_types JSONB DEFAULT '[]'::jsonb,
  preferred_topics JSONB DEFAULT '[]'::jsonb,
  optimal_engagement_times JSONB DEFAULT '[]'::jsonb,
  engagement_score NUMERIC DEFAULT 0,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_prefs_unique ON public.user_content_preferences(user_id, COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid));

ALTER TABLE public.user_content_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own preferences"
ON public.user_content_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage preferences"
ON public.user_content_preferences FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create recommendations table
CREATE TABLE public.content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  company_id UUID,
  recommendation_score NUMERIC NOT NULL DEFAULT 0,
  recommendation_reason TEXT,
  ai_confidence NUMERIC DEFAULT 0,
  is_viewed BOOLEAN DEFAULT false,
  is_interacted BOOLEAN DEFAULT false,
  recommended_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_recommendations_user ON public.content_recommendations(user_id);
CREATE INDEX idx_recommendations_score ON public.content_recommendations(recommendation_score DESC);

ALTER TABLE public.content_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own recommendations"
ON public.content_recommendations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update recommendations"
ON public.content_recommendations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage recommendations"
ON public.content_recommendations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));