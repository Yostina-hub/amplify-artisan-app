-- Table for Telegram bulk messaging campaigns
CREATE TABLE public.telegram_bulk_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed')),
  message_template TEXT NOT NULL,
  total_contacts INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for contacts to message
CREATE TABLE public.telegram_bulk_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.telegram_bulk_campaigns(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  telegram_user_id BIGINT,
  telegram_access_hash BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'sent', 'delivered', 'failed', 'not_found')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for Telegram session storage (encrypted)
CREATE TABLE public.telegram_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  phone_number TEXT NOT NULL,
  session_string TEXT NOT NULL,
  is_authenticated BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_bulk_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_bulk_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telegram_bulk_campaigns
CREATE POLICY "Users can view their company campaigns" 
  ON public.telegram_bulk_campaigns FOR SELECT 
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create campaigns for their company" 
  ON public.telegram_bulk_campaigns FOR INSERT 
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company campaigns" 
  ON public.telegram_bulk_campaigns FOR UPDATE 
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company campaigns" 
  ON public.telegram_bulk_campaigns FOR DELETE 
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for telegram_bulk_contacts
CREATE POLICY "Users can view contacts in their campaigns" 
  ON public.telegram_bulk_contacts FOR SELECT 
  USING (campaign_id IN (SELECT id FROM telegram_bulk_campaigns WHERE company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Users can add contacts to their campaigns" 
  ON public.telegram_bulk_contacts FOR INSERT 
  WITH CHECK (campaign_id IN (SELECT id FROM telegram_bulk_campaigns WHERE company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Users can update contacts in their campaigns" 
  ON public.telegram_bulk_contacts FOR UPDATE 
  USING (campaign_id IN (SELECT id FROM telegram_bulk_campaigns WHERE company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Users can delete contacts from their campaigns" 
  ON public.telegram_bulk_contacts FOR DELETE 
  USING (campaign_id IN (SELECT id FROM telegram_bulk_campaigns WHERE company_id = get_user_company_id(auth.uid())));

-- RLS Policies for telegram_sessions
CREATE POLICY "Users can view their company session" 
  ON public.telegram_sessions FOR SELECT 
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create session for their company" 
  ON public.telegram_sessions FOR INSERT 
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company session" 
  ON public.telegram_sessions FOR UPDATE 
  USING (company_id = get_user_company_id(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_telegram_bulk_campaigns_company ON public.telegram_bulk_campaigns(company_id);
CREATE INDEX idx_telegram_bulk_campaigns_status ON public.telegram_bulk_campaigns(status);
CREATE INDEX idx_telegram_bulk_contacts_campaign ON public.telegram_bulk_contacts(campaign_id);
CREATE INDEX idx_telegram_bulk_contacts_status ON public.telegram_bulk_contacts(status);
CREATE INDEX idx_telegram_sessions_company ON public.telegram_sessions(company_id);

-- Triggers for updated_at
CREATE TRIGGER update_telegram_bulk_campaigns_updated_at
  BEFORE UPDATE ON public.telegram_bulk_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_telegram_bulk_contacts_updated_at
  BEFORE UPDATE ON public.telegram_bulk_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_telegram_sessions_updated_at
  BEFORE UPDATE ON public.telegram_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();