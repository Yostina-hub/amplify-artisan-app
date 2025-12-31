-- Add CRM enabled toggle to companies table (default OFF)
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS crm_enabled boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.companies.crm_enabled IS 'Toggle to enable/disable CRM features for this company. Controlled by super admins.';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_companies_crm_enabled ON public.companies(crm_enabled);

-- Update RLS policy to allow super admins to update this field
CREATE POLICY "Super admins can update company crm_enabled"
ON public.companies
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND company_id IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND company_id IS NULL
  )
);