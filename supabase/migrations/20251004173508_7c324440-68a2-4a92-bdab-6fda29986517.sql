-- Add pricing plan selection to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS pricing_plan_id UUID REFERENCES public.pricing_plans(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_pricing_plan 
ON public.companies(pricing_plan_id);

COMMENT ON COLUMN public.companies.pricing_plan_id IS 'Selected pricing plan during company application (optional)';