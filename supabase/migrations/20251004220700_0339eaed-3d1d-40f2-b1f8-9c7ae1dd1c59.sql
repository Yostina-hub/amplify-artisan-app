-- Create quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  quote_number TEXT NOT NULL,
  quote_name TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until TIMESTAMPTZ,
  subtotal NUMERIC(12, 2) DEFAULT 0,
  tax_amount NUMERIC(12, 2) DEFAULT 0,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) DEFAULT 0,
  terms_and_conditions TEXT,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quote_items table
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  tax_percentage NUMERIC(5, 2) DEFAULT 0,
  line_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_quotes_company ON public.quotes(company_id);
CREATE INDEX idx_quotes_account ON public.quotes(account_id);
CREATE INDEX idx_quotes_contact ON public.quotes(contact_id);
CREATE INDEX idx_quotes_opportunity ON public.quotes(opportunity_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_number ON public.quotes(quote_number);
CREATE INDEX idx_quote_items_quote ON public.quote_items(quote_id);
CREATE INDEX idx_quote_items_product ON public.quote_items(product_id);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotes
CREATE POLICY "Admins can manage all quotes"
  ON public.quotes FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company quotes"
  ON public.quotes FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their company quotes"
  ON public.quotes FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company quotes"
  ON public.quotes FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for quote_items
CREATE POLICY "Admins can manage all quote items"
  ON public.quote_items FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company quote items"
  ON public.quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
        AND quotes.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can insert their company quote items"
  ON public.quote_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
        AND quotes.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can update their company quote items"
  ON public.quote_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
        AND quotes.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can delete their company quote items"
  ON public.quote_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
        AND quotes.company_id = get_user_company_id(auth.uid())
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_quote_items_updated_at
  BEFORE UPDATE ON public.quote_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to auto-generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  company_prefix TEXT;
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    -- Get the next number for this company
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.quotes
    WHERE company_id = NEW.company_id;
    
    -- Generate quote number with company prefix
    company_prefix := 'Q-' || SUBSTRING(NEW.company_id::TEXT FROM 1 FOR 8);
    NEW.quote_number := company_prefix || '-' || LPAD(next_number::TEXT, 5, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER generate_quote_number_trigger
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION generate_quote_number();