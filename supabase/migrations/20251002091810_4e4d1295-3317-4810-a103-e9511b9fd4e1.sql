-- Phase 1: Fix Profiles Table RLS Policies
-- Block direct inserts (only allow via trigger)
CREATE POLICY "Block direct profile inserts"
  ON public.profiles FOR INSERT
  WITH CHECK (false);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Phase 2: Secure Ad Campaigns Table - Replace ALL policy with explicit policies
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.ad_campaigns;

CREATE POLICY "Users can insert their own campaigns"
  ON public.ad_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON public.ad_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON public.ad_campaigns FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert any campaign"
  ON public.ad_campaigns FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any campaign"
  ON public.ad_campaigns FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any campaign"
  ON public.ad_campaigns FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can insert campaigns"
  ON public.ad_campaigns FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents can update campaigns"
  ON public.ad_campaigns FOR UPDATE
  USING (public.has_role(auth.uid(), 'agent'));

-- Phase 3: Add Missing INSERT Policies for Social Media Tables
CREATE POLICY "Users can insert comments on their accounts"
  ON public.social_media_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.social_media_accounts
      WHERE id = social_media_comments.account_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert any comment"
  ON public.social_media_comments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can insert any comment"
  ON public.social_media_comments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins can insert metrics"
  ON public.social_media_metrics FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can insert metrics"
  ON public.social_media_metrics FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'agent'));

-- Phase 4: Add Missing DELETE Policies
CREATE POLICY "Users can delete their own accounts"
  ON public.social_media_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any account"
  ON public.social_media_accounts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own posts"
  ON public.social_media_posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any post"
  ON public.social_media_posts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete comments on their accounts"
  ON public.social_media_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.social_media_accounts
      WHERE id = social_media_comments.account_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete any comment"
  ON public.social_media_comments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can delete any comment"
  ON public.social_media_comments FOR DELETE
  USING (public.has_role(auth.uid(), 'agent'));