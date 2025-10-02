-- Create subscription_requests table
CREATE TABLE public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_plan_id UUID REFERENCES public.pricing_plans(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  industry TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'payment_pending', 'active', 'cancelled')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  payment_method TEXT CHECK (payment_method IN ('telebirr', 'cbe', 'bank_transfer')),
  payment_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payment_transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_request_id UUID REFERENCES public.subscription_requests(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ETB',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('telebirr', 'cbe', 'bank_transfer')),
  transaction_reference TEXT UNIQUE,
  phone_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pricing_plan_id UUID REFERENCES public.pricing_plans(id),
  subscription_request_id UUID REFERENCES public.subscription_requests(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscription requests policies
CREATE POLICY "Anyone can create subscription requests"
ON public.subscription_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own subscription requests"
ON public.subscription_requests
FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all subscription requests"
ON public.subscription_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Payment transactions policies
CREATE POLICY "Admins can view all payment transactions"
ON public.payment_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their payment transactions"
ON public.payment_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.subscription_requests sr
    WHERE sr.id = payment_transactions.subscription_request_id
    AND sr.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- User subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
ON public.user_subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_requests_updated_at
  BEFORE UPDATE ON public.subscription_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for performance
CREATE INDEX idx_subscription_requests_email ON public.subscription_requests(email);
CREATE INDEX idx_subscription_requests_status ON public.subscription_requests(status);
CREATE INDEX idx_payment_transactions_subscription ON public.payment_transactions(subscription_request_id);
CREATE INDEX idx_payment_transactions_reference ON public.payment_transactions(transaction_reference);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);