-- =============================================
-- FIX: Add RLS Policies for social_media_posts
-- This allows the Composer to save posts
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own posts
CREATE POLICY "Users can create posts"
  ON public.social_media_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own posts and company posts  
CREATE POLICY "Users can view own and company posts"
  ON public.social_media_posts
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR company_id = get_user_company_id(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Policy: Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON public.social_media_posts
  FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON public.social_media_posts
  FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- =============================================
-- FIX: Add RLS Policies for ai_generated_content
-- =============================================

ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert AI content"
  ON public.ai_generated_content
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own AI content"
  ON public.ai_generated_content
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR company_id = get_user_company_id(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can update own AI content"
  ON public.ai_generated_content
  FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own AI content"
  ON public.ai_generated_content
  FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- =============================================
-- FIX: Add RLS Policies for critical tables
-- =============================================

-- activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage company activities"
  ON public.activities
  FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- ad_campaigns
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage company ad campaigns"
  ON public.ad_campaigns
  FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- ad_impressions
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company ad impressions"
  ON public.ad_impressions
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- social_media_comments
ALTER TABLE public.social_media_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage social comments"
  ON public.social_media_comments
  FOR ALL
  USING (TRUE);  -- Comments are public for now

-- content_recommendations
ALTER TABLE public.content_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON public.content_recommendations
  FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- automation_workflows
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage company workflows"
  ON public.automation_workflows
  FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- automation_executions
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company automation executions"
  ON public.automation_executions
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- call_campaigns
ALTER TABLE public.call_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage company call campaigns"
  ON public.call_campaigns
  FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- call_logs
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage company call logs"
  ON public.call_logs
  FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- call_scripts
ALTER TABLE public.call_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage company call scripts"
  ON public.call_scripts
  FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'));