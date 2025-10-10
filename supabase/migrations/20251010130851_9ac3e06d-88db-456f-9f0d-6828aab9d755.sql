-- CRITICAL FIX: Company admins seeing all companies' data

-- 1. Fix payment_transactions (links via subscription_request_id)
DROP POLICY IF EXISTS "Users view own payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Company admins view company payments only" ON public.payment_transactions;

CREATE POLICY "Users view own payments via subscription"
ON public.payment_transactions FOR SELECT
USING (
  subscription_request_id IN (
    SELECT id FROM public.subscription_requests 
    WHERE email IN (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Super admins view all payments"
ON public.payment_transactions FOR SELECT
USING (
  has_role(auth.uid(), 'admin') AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND company_id IS NOT NULL
  )
);

-- 2. Fix subscription_requests
DROP POLICY IF EXISTS "Users view own subscription requests" ON public.subscription_requests;
DROP POLICY IF EXISTS "Super admins view all subscriptions" ON public.subscription_requests;

CREATE POLICY "Users view own subscriptions"
ON public.subscription_requests FOR SELECT
USING (email IN (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Super admins view all subs"
ON public.subscription_requests FOR SELECT
USING (
  has_role(auth.uid(), 'admin') AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND company_id IS NOT NULL
  )
);

-- 3. Fix social_media_posts - enforce company isolation
DROP POLICY IF EXISTS "Company users view company posts only" ON public.social_media_posts;

CREATE POLICY "Company isolated posts"
ON public.social_media_posts FOR SELECT
USING (
  user_id = auth.uid() OR
  (company_id = get_user_company_id(auth.uid()) AND company_id IS NOT NULL) OR
  (has_role(auth.uid(), 'admin') AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND company_id IS NOT NULL
  ))
);