-- Create product_categories table
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  product_code TEXT,
  product_name TEXT NOT NULL,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  product_type TEXT DEFAULT 'product' CHECK (product_type IN ('product', 'service')),
  description TEXT,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10, 2) DEFAULT 0,
  quantity_in_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  unit_of_measure TEXT DEFAULT 'unit',
  tax_rate NUMERIC(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  manufacturer TEXT,
  vendor TEXT,
  sku TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create price_books table
CREATE TABLE public.price_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create price_book_entries table
CREATE TABLE public.price_book_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_book_id UUID NOT NULL REFERENCES public.price_books(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  list_price NUMERIC(10, 2) NOT NULL,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(price_book_id, product_id)
);

-- Create indexes
CREATE INDEX idx_products_company ON public.products(company_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_code ON public.products(product_code);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_product_categories_company ON public.product_categories(company_id);
CREATE INDEX idx_price_books_company ON public.price_books(company_id);
CREATE INDEX idx_price_book_entries_product ON public.price_book_entries(product_id);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_book_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_categories
CREATE POLICY "Admins can manage all categories"
  ON public.product_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company categories"
  ON public.product_categories FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company categories"
  ON public.product_categories FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company categories"
  ON public.product_categories FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company categories"
  ON public.product_categories FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for products
CREATE POLICY "Admins can manage all products"
  ON public.products FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company products"
  ON public.products FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company products"
  ON public.products FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their company products"
  ON public.products FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company products"
  ON public.products FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for price_books
CREATE POLICY "Admins can manage all price books"
  ON public.price_books FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company price books"
  ON public.price_books FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company price books"
  ON public.price_books FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company price books"
  ON public.price_books FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company price books"
  ON public.price_books FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for price_book_entries
CREATE POLICY "Admins can manage all price book entries"
  ON public.price_book_entries FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company price book entries"
  ON public.price_book_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.price_books
      WHERE price_books.id = price_book_entries.price_book_id
        AND price_books.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can insert their company price book entries"
  ON public.price_book_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.price_books
      WHERE price_books.id = price_book_entries.price_book_id
        AND price_books.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can update their company price book entries"
  ON public.price_book_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.price_books
      WHERE price_books.id = price_book_entries.price_book_id
        AND price_books.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can delete their company price book entries"
  ON public.price_book_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.price_books
      WHERE price_books.id = price_book_entries.price_book_id
        AND price_books.company_id = get_user_company_id(auth.uid())
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_price_books_updated_at
  BEFORE UPDATE ON public.price_books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_price_book_entries_updated_at
  BEFORE UPDATE ON public.price_book_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();