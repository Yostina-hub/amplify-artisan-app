-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  lead_source TEXT,
  lead_status TEXT DEFAULT 'new',
  lead_score INTEGER DEFAULT 0,
  converted BOOLEAN DEFAULT FALSE,
  converted_contact_id UUID REFERENCES public.contacts(id),
  converted_account_id UUID REFERENCES public.accounts(id),
  converted_at TIMESTAMPTZ,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  description TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pipeline_stages table
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  probability INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  stage_type TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create opportunities table (deals)
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id),
  contact_id UUID REFERENCES public.contacts(id),
  stage_id UUID REFERENCES public.pipeline_stages(id),
  amount NUMERIC DEFAULT 0,
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  closed_date DATE,
  lead_source TEXT,
  owner_id UUID,
  status TEXT DEFAULT 'open',
  description TEXT,
  next_step TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_leads_company_id ON public.leads(company_id);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_status ON public.leads(lead_status);
CREATE INDEX idx_leads_converted ON public.leads(converted);

CREATE INDEX idx_pipeline_stages_company_id ON public.pipeline_stages(company_id);
CREATE INDEX idx_pipeline_stages_order ON public.pipeline_stages(display_order);

CREATE INDEX idx_opportunities_company_id ON public.opportunities(company_id);
CREATE INDEX idx_opportunities_account_id ON public.opportunities(account_id);
CREATE INDEX idx_opportunities_stage_id ON public.opportunities(stage_id);
CREATE INDEX idx_opportunities_status ON public.opportunities(status);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view their company leads"
ON public.leads FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company leads"
ON public.leads FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update their company leads"
ON public.leads FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company leads"
ON public.leads FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all leads"
ON public.leads FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for pipeline_stages
CREATE POLICY "Users can view their company stages"
ON public.pipeline_stages FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company stages"
ON public.pipeline_stages FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company stages"
ON public.pipeline_stages FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company stages"
ON public.pipeline_stages FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all stages"
ON public.pipeline_stages FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for opportunities
CREATE POLICY "Users can view their company opportunities"
ON public.opportunities FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company opportunities"
ON public.opportunities FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update their company opportunities"
ON public.opportunities FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company opportunities"
ON public.opportunities FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all opportunities"
ON public.opportunities FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pipeline_stages_updated_at
BEFORE UPDATE ON public.pipeline_stages
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default pipeline stages
INSERT INTO public.pipeline_stages (company_id, name, display_order, probability, stage_type)
SELECT 
  c.id,
  stage.name,
  stage.display_order,
  stage.probability,
  stage.stage_type
FROM public.companies c
CROSS JOIN (
  VALUES 
    ('Prospecting', 0, 10, 'open'),
    ('Qualification', 1, 20, 'open'),
    ('Proposal', 2, 50, 'open'),
    ('Negotiation', 3, 75, 'open'),
    ('Closed Won', 4, 100, 'won'),
    ('Closed Lost', 5, 0, 'lost')
) AS stage(name, display_order, probability, stage_type)
WHERE NOT EXISTS (
  SELECT 1 FROM public.pipeline_stages ps WHERE ps.company_id = c.id
);