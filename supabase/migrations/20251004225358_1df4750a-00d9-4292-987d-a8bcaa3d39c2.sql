-- Create contract templates table
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_category TEXT NOT NULL,
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  terms_and_conditions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  contract_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  contract_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  contract_value NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  auto_renewal BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER DEFAULT 30,
  payment_terms TEXT,
  terms_and_conditions TEXT,
  contract_content TEXT,
  signed_by_company BOOLEAN DEFAULT false,
  signed_by_client BOOLEAN DEFAULT false,
  company_signatory_name TEXT,
  company_signatory_date DATE,
  client_signatory_name TEXT,
  client_signatory_date DATE,
  contract_file_url TEXT,
  metadata JSONB DEFAULT '{}',
  tags TEXT[],
  created_by UUID NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contract amendments table
CREATE TABLE public.contract_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  amendment_number TEXT NOT NULL,
  amendment_type TEXT NOT NULL,
  description TEXT NOT NULL,
  effective_date DATE NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  amendment_content TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contract milestones table
CREATE TABLE public.contract_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  amount NUMERIC(12,2),
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contract renewals table
CREATE TABLE public.contract_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  renewal_date DATE NOT NULL,
  new_end_date DATE NOT NULL,
  renewal_value NUMERIC(12,2),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contract compliance table
CREATE TABLE public.contract_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL,
  requirement TEXT NOT NULL,
  status TEXT DEFAULT 'compliant',
  due_date DATE,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_templates
CREATE POLICY "Admins can manage all templates" ON public.contract_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company templates" ON public.contract_templates
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company templates" ON public.contract_templates
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update their company templates" ON public.contract_templates
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company templates" ON public.contract_templates
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for contracts
CREATE POLICY "Admins can manage all contracts" ON public.contracts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company contracts" ON public.contracts
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company contracts" ON public.contracts
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update their company contracts" ON public.contracts
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company contracts" ON public.contracts
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for contract_amendments
CREATE POLICY "Admins can manage all amendments" ON public.contract_amendments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view amendments for their contracts" ON public.contract_amendments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_amendments.contract_id
    AND contracts.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can manage amendments for their contracts" ON public.contract_amendments
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_amendments.contract_id
    AND contracts.company_id = get_user_company_id(auth.uid())
  ));

-- RLS Policies for contract_milestones
CREATE POLICY "Admins can manage all milestones" ON public.contract_milestones
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view milestones for their contracts" ON public.contract_milestones
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_milestones.contract_id
    AND contracts.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can manage milestones for their contracts" ON public.contract_milestones
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_milestones.contract_id
    AND contracts.company_id = get_user_company_id(auth.uid())
  ));

-- RLS Policies for contract_renewals
CREATE POLICY "Admins can manage all renewals" ON public.contract_renewals
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view renewals for their contracts" ON public.contract_renewals
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_renewals.contract_id
    AND contracts.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can manage renewals for their contracts" ON public.contract_renewals
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_renewals.contract_id
    AND contracts.company_id = get_user_company_id(auth.uid())
  ));

-- RLS Policies for contract_compliance
CREATE POLICY "Admins can manage all compliance" ON public.contract_compliance
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view compliance for their contracts" ON public.contract_compliance
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_compliance.contract_id
    AND contracts.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can manage compliance for their contracts" ON public.contract_compliance
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.id = contract_compliance.contract_id
    AND contracts.company_id = get_user_company_id(auth.uid())
  ));

-- Function to generate contract number
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_number INTEGER;
  company_prefix TEXT;
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.contracts
    WHERE company_id = NEW.company_id;
    
    company_prefix := 'CTR-' || SUBSTRING(NEW.company_id::TEXT FROM 1 FOR 8);
    NEW.contract_number := company_prefix || '-' || LPAD(next_number::TEXT, 6, '0');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to generate contract number
CREATE TRIGGER generate_contract_number_trigger BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION generate_contract_number();

-- Triggers for updated_at
CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contract_milestones_updated_at BEFORE UPDATE ON public.contract_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contract_compliance_updated_at BEFORE UPDATE ON public.contract_compliance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();