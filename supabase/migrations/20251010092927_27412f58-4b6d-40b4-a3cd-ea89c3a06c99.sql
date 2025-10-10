-- Add RLS policies for leads table to allow users to view and manage their company's leads

-- Allow users to view their company leads
CREATE POLICY "Users can view their company leads"
ON public.leads
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::text)
);

-- Allow users to insert leads for their company
CREATE POLICY "Users can create leads for their company"
ON public.leads
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND created_by = auth.uid()
);

-- Allow users to update their company leads
CREATE POLICY "Users can update their company leads"
ON public.leads
FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::text)
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
);

-- Allow users to delete their company leads
CREATE POLICY "Users can delete their company leads"
ON public.leads
FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::text)
);