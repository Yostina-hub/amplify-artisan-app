-- Grant super admin (admin role) full access to all tables

-- Influencer campaigns - add missing admin policies
DROP POLICY IF EXISTS "Admins can insert campaigns" ON public.influencer_campaigns;
DROP POLICY IF EXISTS "Admins can update campaigns" ON public.influencer_campaigns;
DROP POLICY IF EXISTS "Admins can delete campaigns" ON public.influencer_campaigns;

CREATE POLICY "Admins can insert campaigns"
ON public.influencer_campaigns
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update campaigns"
ON public.influencer_campaigns
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete campaigns"
ON public.influencer_campaigns
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Influencer communications - add missing admin policies
DROP POLICY IF EXISTS "Admins can insert communications" ON public.influencer_communications;
DROP POLICY IF EXISTS "Admins can update communications" ON public.influencer_communications;
DROP POLICY IF EXISTS "Admins can delete communications" ON public.influencer_communications;

CREATE POLICY "Admins can insert communications"
ON public.influencer_communications
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update communications"
ON public.influencer_communications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete communications"
ON public.influencer_communications
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Influencers - add missing admin policies
DROP POLICY IF EXISTS "Admins can insert influencers" ON public.influencers;
DROP POLICY IF EXISTS "Admins can update influencers" ON public.influencers;
DROP POLICY IF EXISTS "Admins can delete influencers" ON public.influencers;

CREATE POLICY "Admins can insert influencers"
ON public.influencers
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update influencers"
ON public.influencers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete influencers"
ON public.influencers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Social media accounts - add missing admin policies
DROP POLICY IF EXISTS "Admins can insert accounts" ON public.social_media_accounts;
DROP POLICY IF EXISTS "Admins can update accounts" ON public.social_media_accounts;

CREATE POLICY "Admins can insert accounts"
ON public.social_media_accounts
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update accounts"
ON public.social_media_accounts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Social media mentions - add missing admin policies
DROP POLICY IF EXISTS "Admins can update mentions" ON public.social_media_mentions;
DROP POLICY IF EXISTS "Admins can delete mentions" ON public.social_media_mentions;

CREATE POLICY "Admins can update mentions"
ON public.social_media_mentions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete mentions"
ON public.social_media_mentions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Social media metrics - add missing admin policies
DROP POLICY IF EXISTS "Admins can update metrics" ON public.social_media_metrics;
DROP POLICY IF EXISTS "Admins can delete metrics" ON public.social_media_metrics;

CREATE POLICY "Admins can update metrics"
ON public.social_media_metrics
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete metrics"
ON public.social_media_metrics
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Social media posts - add missing admin policies
DROP POLICY IF EXISTS "Admins can insert posts" ON public.social_media_posts;
DROP POLICY IF EXISTS "Admins can update posts" ON public.social_media_posts;

CREATE POLICY "Admins can insert posts"
ON public.social_media_posts
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts"
ON public.social_media_posts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Tracked keywords - add missing admin policies
DROP POLICY IF EXISTS "Admins can insert keywords" ON public.tracked_keywords;
DROP POLICY IF EXISTS "Admins can update keywords" ON public.tracked_keywords;
DROP POLICY IF EXISTS "Admins can delete keywords" ON public.tracked_keywords;

CREATE POLICY "Admins can insert keywords"
ON public.tracked_keywords
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update keywords"
ON public.tracked_keywords
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete keywords"
ON public.tracked_keywords
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Trending topics - add missing admin policies
DROP POLICY IF EXISTS "Admins can select trending topics" ON public.trending_topics;
DROP POLICY IF EXISTS "Admins can delete trending topics" ON public.trending_topics;

CREATE POLICY "Admins can select trending topics"
ON public.trending_topics
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trending topics"
ON public.trending_topics
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- User engagement - add missing admin policies
DROP POLICY IF EXISTS "Admins can insert engagement" ON public.user_engagement;
DROP POLICY IF EXISTS "Admins can update engagement" ON public.user_engagement;
DROP POLICY IF EXISTS "Admins can delete engagement" ON public.user_engagement;

CREATE POLICY "Admins can insert engagement"
ON public.user_engagement
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update engagement"
ON public.user_engagement
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete engagement"
ON public.user_engagement
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- User roles - add missing admin policy
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));