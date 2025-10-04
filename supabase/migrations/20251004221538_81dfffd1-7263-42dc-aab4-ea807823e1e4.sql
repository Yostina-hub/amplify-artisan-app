-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  template_type TEXT CHECK (template_type IN ('quote', 'invoice', 'payment_reminder', 'welcome', 'follow_up', 'general')),
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create email_campaigns table
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  target_audience JSONB DEFAULT '{}'::jsonb,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create email_logs table
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_email_templates_company ON public.email_templates(company_id);
CREATE INDEX idx_email_templates_type ON public.email_templates(template_type);
CREATE INDEX idx_email_campaigns_company ON public.email_campaigns(company_id);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_logs_company ON public.email_logs(company_id);
CREATE INDEX idx_email_logs_campaign ON public.email_logs(campaign_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Admins can manage all templates"
  ON public.email_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company templates"
  ON public.email_templates FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their company templates"
  ON public.email_templates FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company templates"
  ON public.email_templates FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for email_campaigns
CREATE POLICY "Admins can manage all campaigns"
  ON public.email_campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company campaigns"
  ON public.email_campaigns FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company campaigns"
  ON public.email_campaigns FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their company campaigns"
  ON public.email_campaigns FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company campaigns"
  ON public.email_campaigns FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for email_logs
CREATE POLICY "Admins can manage all logs"
  ON public.email_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company logs"
  ON public.email_logs FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "System can insert logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert default email templates
INSERT INTO public.email_templates (company_id, created_by, name, subject, body_html, template_type, variables, is_default) 
SELECT 
  c.id,
  (SELECT id FROM auth.users LIMIT 1),
  'Default Quote Template',
  'Quote {{quote_number}} from {{company_name}}',
  '<h1>Quote {{quote_number}}</h1><p>Dear {{customer_name}},</p><p>Thank you for your interest. Please find attached your quote.</p><p>Total: {{total_amount}}</p><p>Valid until: {{valid_until}}</p>',
  'quote',
  '["quote_number", "company_name", "customer_name", "total_amount", "valid_until"]'::jsonb,
  true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates 
  WHERE template_type = 'quote' AND company_id = c.id
);

INSERT INTO public.email_templates (company_id, created_by, name, subject, body_html, template_type, variables, is_default)
SELECT 
  c.id,
  (SELECT id FROM auth.users LIMIT 1),
  'Default Invoice Template',
  'Invoice {{invoice_number}} from {{company_name}}',
  '<h1>Invoice {{invoice_number}}</h1><p>Dear {{customer_name}},</p><p>Please find your invoice details below.</p><p>Total: {{total_amount}}</p><p>Due Date: {{due_date}}</p>',
  'invoice',
  '["invoice_number", "company_name", "customer_name", "total_amount", "due_date"]'::jsonb,
  true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates 
  WHERE template_type = 'invoice' AND company_id = c.id
);