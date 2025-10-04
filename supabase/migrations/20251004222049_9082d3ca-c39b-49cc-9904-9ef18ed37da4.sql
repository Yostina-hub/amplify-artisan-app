-- Create call_scripts table for managing call scripts
CREATE TABLE public.call_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  script_type TEXT CHECK (script_type IN ('lead_generation', 'follow_up', 'sales', 'support', 'survey')),
  script_content TEXT NOT NULL,
  opening_message TEXT,
  closing_message TEXT,
  objection_handling JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create call_campaigns table
CREATE TABLE public.call_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT DEFAULT 'one_time' CHECK (campaign_type IN ('one_time', 'scheduled', 'recurring')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled')),
  script_id UUID REFERENCES public.call_scripts(id) ON DELETE SET NULL,
  target_audience JSONB DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  call_window_start TIME,
  call_window_end TIME,
  max_attempts INTEGER DEFAULT 3,
  retry_interval_hours INTEGER DEFAULT 24,
  total_contacts INTEGER DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  calls_completed INTEGER DEFAULT 0,
  calls_failed INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create call_logs table for tracking individual calls
CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.call_campaigns(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  call_status TEXT DEFAULT 'pending' CHECK (call_status IN ('pending', 'in_progress', 'completed', 'no_answer', 'busy', 'failed', 'voicemail')),
  call_outcome TEXT CHECK (call_outcome IN ('lead_generated', 'interested', 'not_interested', 'callback_requested', 'do_not_call', 'wrong_number')),
  call_duration_seconds INTEGER,
  call_started_at TIMESTAMPTZ,
  call_ended_at TIMESTAMPTZ,
  call_recording_url TEXT,
  agent_id UUID,
  agent_name TEXT,
  call_notes TEXT,
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create call_center_integrations table
CREATE TABLE public.call_center_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('twilio', 'vonage', 'aircall', 'ringcentral', 'custom')),
  api_key_encrypted TEXT,
  account_sid TEXT,
  phone_number TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_call_scripts_company ON public.call_scripts(company_id);
CREATE INDEX idx_call_campaigns_company ON public.call_campaigns(company_id);
CREATE INDEX idx_call_campaigns_status ON public.call_campaigns(status);
CREATE INDEX idx_call_campaigns_scheduled ON public.call_campaigns(scheduled_at);
CREATE INDEX idx_call_logs_company ON public.call_logs(company_id);
CREATE INDEX idx_call_logs_campaign ON public.call_logs(campaign_id);
CREATE INDEX idx_call_logs_contact ON public.call_logs(contact_id);
CREATE INDEX idx_call_logs_status ON public.call_logs(call_status);
CREATE INDEX idx_call_logs_outcome ON public.call_logs(call_outcome);
CREATE INDEX idx_call_center_integrations_company ON public.call_center_integrations(company_id);

-- Enable RLS
ALTER TABLE public.call_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_center_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_scripts
CREATE POLICY "Admins can manage all scripts"
  ON public.call_scripts FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company scripts"
  ON public.call_scripts FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company scripts"
  ON public.call_scripts FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their company scripts"
  ON public.call_scripts FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company scripts"
  ON public.call_scripts FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for call_campaigns
CREATE POLICY "Admins can manage all call campaigns"
  ON public.call_campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company call campaigns"
  ON public.call_campaigns FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company call campaigns"
  ON public.call_campaigns FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their company call campaigns"
  ON public.call_campaigns FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company call campaigns"
  ON public.call_campaigns FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for call_logs
CREATE POLICY "Admins can manage all call logs"
  ON public.call_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company call logs"
  ON public.call_logs FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "System can insert call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company call logs"
  ON public.call_logs FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for call_center_integrations
CREATE POLICY "Admins can manage all integrations"
  ON public.call_center_integrations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company integrations"
  ON public.call_center_integrations FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can manage their company integrations"
  ON public.call_center_integrations FOR ALL
  USING (company_id = get_user_company_id(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_call_scripts_updated_at
  BEFORE UPDATE ON public.call_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_call_campaigns_updated_at
  BEFORE UPDATE ON public.call_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_call_logs_updated_at
  BEFORE UPDATE ON public.call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_call_center_integrations_updated_at
  BEFORE UPDATE ON public.call_center_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();