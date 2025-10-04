-- Add company_id to api_integrations table
ALTER TABLE public.api_integrations
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create index for company_id
CREATE INDEX idx_api_integrations_company ON public.api_integrations(company_id);

-- Update RLS policies for company access

-- Companies can view their own integrations
CREATE POLICY "Companies can view their own integrations"
ON public.api_integrations FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- Companies can create their own integrations
CREATE POLICY "Companies can create their own integrations"
ON public.api_integrations FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Companies can update their own integrations
CREATE POLICY "Companies can update their own integrations"
ON public.api_integrations FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- Companies can delete their own integrations
CREATE POLICY "Companies can delete their own integrations"
ON public.api_integrations FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- Companies can manage their own integration fields
CREATE POLICY "Companies can manage their own integration fields"
ON public.api_integration_fields FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.api_integrations
  WHERE api_integrations.id = api_integration_fields.integration_id
  AND api_integrations.company_id = get_user_company_id(auth.uid())
));

-- Companies can view their own integration logs
CREATE POLICY "Companies can view their own integration logs"
ON public.api_integration_logs FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.api_integrations
  WHERE api_integrations.id = api_integration_logs.integration_id
  AND api_integrations.company_id = get_user_company_id(auth.uid())
));

-- System can insert logs for company integrations
CREATE POLICY "System can insert company integration logs"
ON public.api_integration_logs FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.api_integrations
  WHERE api_integrations.id = api_integration_logs.integration_id
));