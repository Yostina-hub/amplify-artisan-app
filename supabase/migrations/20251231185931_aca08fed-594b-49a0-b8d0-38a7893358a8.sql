-- Add Sales enabled toggle to companies table (default OFF)
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS sales_enabled boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.companies.sales_enabled IS 'Toggle to enable/disable Sales features for this company. Controlled by super admins.';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_companies_sales_enabled ON public.companies(sales_enabled);