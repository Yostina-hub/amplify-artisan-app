-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  title TEXT,
  department TEXT,
  account_id UUID,
  lead_source TEXT,
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  website TEXT,
  linkedin_url TEXT,
  twitter_handle TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create accounts table (companies/organizations)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT,
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_country TEXT,
  billing_postal_code TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_country TEXT,
  shipping_postal_code TEXT,
  annual_revenue NUMERIC,
  number_of_employees INTEGER,
  parent_account_id UUID REFERENCES public.accounts(id),
  owner_id UUID,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key from contacts to accounts
ALTER TABLE public.contacts 
ADD CONSTRAINT fk_contacts_account 
FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX idx_contacts_account_id ON public.contacts(account_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_status ON public.contacts(status);
CREATE INDEX idx_accounts_company_id ON public.accounts(company_id);
CREATE INDEX idx_accounts_name ON public.accounts(name);
CREATE INDEX idx_accounts_status ON public.accounts(status);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Users can view their company contacts"
ON public.contacts FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company contacts"
ON public.contacts FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update their company contacts"
ON public.contacts FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company contacts"
ON public.contacts FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all contacts"
ON public.contacts FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for accounts
CREATE POLICY "Users can view their company accounts"
ON public.accounts FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company accounts"
ON public.accounts FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update their company accounts"
ON public.accounts FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company accounts"
ON public.accounts FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all accounts"
ON public.accounts FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();