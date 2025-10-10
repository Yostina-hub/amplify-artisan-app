-- Add subscription tracking to call center integrations
ALTER TABLE public.call_center_integrations
ADD COLUMN IF NOT EXISTS subscription_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_plan text,
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;

-- Create user call preferences table
CREATE TABLE IF NOT EXISTS public.user_call_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  use_company_integration boolean DEFAULT true,
  personal_sip_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_call_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_call_preferences
CREATE POLICY "Users can view own call preferences"
  ON public.user_call_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own call preferences"
  ON public.user_call_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own call preferences"
  ON public.user_call_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for call_center_integrations
CREATE POLICY "Users can view company call center integrations"
  ON public.call_center_integrations
  FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid()) 
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Company admins can manage call center integrations"
  ON public.call_center_integrations
  FOR ALL
  USING (
    (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR has_role(auth.uid(), 'admin')
  );

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_user_call_preferences_updated_at
  BEFORE UPDATE ON public.user_call_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE public.user_call_preferences IS 'Stores user preferences for call center integration - use company subscription or personal SIP settings';
COMMENT ON COLUMN public.call_center_integrations.subscription_active IS 'Whether the company has an active call center subscription';
COMMENT ON COLUMN public.user_call_preferences.use_company_integration IS 'If true, use company call center subscription; if false, use personal SIP settings';