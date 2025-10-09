-- Add RLS policies for critical social media tables

-- Branches - company hierarchy
CREATE POLICY "Users can view their company branches"
ON branches FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company admins can manage branches"
ON branches FOR ALL
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

-- Social Media Accounts
CREATE POLICY "Users can view company social accounts"
ON social_media_accounts FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage company social accounts"
ON social_media_accounts FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Social Platform Tokens
CREATE POLICY "Users can view company tokens"
ON social_platform_tokens FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage company tokens"
ON social_platform_tokens FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Social Platforms (platform definitions)
CREATE POLICY "Anyone can view social platforms"
ON social_platforms FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage platforms"
ON social_platforms FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin' AND company_id IS NULL
  )
);

-- Subscription Requests
CREATE POLICY "Users can view own subscription requests"
ON subscription_requests FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Anyone can create subscription requests"
ON subscription_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage subscriptions"
ON subscription_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Social Conversations
CREATE POLICY "Users can view company conversations"
ON social_conversations FOR ALL
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Social Media Mentions (linked via account_id)
CREATE POLICY "Users can view company mentions"
ON social_media_mentions FOR ALL
USING (
  account_id IN (
    SELECT id FROM social_media_accounts 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);