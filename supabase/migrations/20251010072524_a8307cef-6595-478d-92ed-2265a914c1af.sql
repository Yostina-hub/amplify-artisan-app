-- Add payment tracking fields to company_platform_subscriptions
ALTER TABLE public.company_platform_subscriptions
ADD COLUMN IF NOT EXISTS subscription_request_id uuid REFERENCES public.subscription_requests(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_transaction_id uuid REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS monthly_fee numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_subs_payment ON public.company_platform_subscriptions(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_platform_subs_request ON public.company_platform_subscriptions(subscription_request_id);

-- Update RLS policies to allow payment-related queries
DROP POLICY IF EXISTS "Companies can update their pending subscriptions" ON public.company_platform_subscriptions;
CREATE POLICY "Companies can update their pending subscriptions"
ON public.company_platform_subscriptions
FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND status = 'pending')
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Add RLS policy for admins to manage payments
CREATE POLICY "Admins can manage platform subscription payments"
ON public.company_platform_subscriptions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));