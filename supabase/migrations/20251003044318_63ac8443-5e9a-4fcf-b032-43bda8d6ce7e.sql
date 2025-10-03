-- Add trial settings table for dynamic configuration
CREATE TABLE IF NOT EXISTS public.trial_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_duration_days INTEGER NOT NULL DEFAULT 3,
  is_trial_enabled BOOLEAN NOT NULL DEFAULT true,
  trial_features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default trial settings
INSERT INTO public.trial_settings (trial_duration_days, is_trial_enabled, trial_features)
VALUES (3, true, '["Dashboard Access", "Basic Analytics", "Social Media Posting", "Limited AI Features"]'::jsonb);

-- Add trial fields to subscription_requests
ALTER TABLE public.subscription_requests 
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_converted BOOLEAN DEFAULT false;

-- Enable RLS on trial_settings
ALTER TABLE public.trial_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trial_settings
CREATE POLICY "Anyone can view trial settings"
ON public.trial_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage trial settings"
ON public.trial_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create function to check if user has active trial
CREATE OR REPLACE FUNCTION public.has_active_trial(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscription_requests
    WHERE email = (SELECT email FROM auth.users WHERE id = _user_id)
      AND is_trial = true
      AND trial_ends_at > now()
      AND status = 'approved'
  )
$$;

-- Create function to get user trial info
CREATE OR REPLACE FUNCTION public.get_user_trial_info(_user_id uuid)
RETURNS TABLE (
  is_trial BOOLEAN,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER,
  trial_converted BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sr.is_trial,
    sr.trial_ends_at,
    CASE 
      WHEN sr.trial_ends_at > now() 
      THEN EXTRACT(DAY FROM sr.trial_ends_at - now())::INTEGER + 1
      ELSE 0
    END as days_remaining,
    sr.trial_converted
  FROM public.subscription_requests sr
  WHERE sr.email = (SELECT email FROM auth.users WHERE id = _user_id)
    AND sr.is_trial = true
  ORDER BY sr.created_at DESC
  LIMIT 1
$$;

-- Update subscription_requests RLS to allow trial signups
CREATE POLICY "Anyone can start free trial"
ON public.subscription_requests
FOR INSERT
WITH CHECK (is_trial = true AND status = 'pending');