-- Add RLS policies for accounts table
-- Users can view accounts from their own company
CREATE POLICY "Users can view their company accounts"
ON public.accounts
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR can_access_branch(auth.uid(), company_id)
);

-- Users can create accounts for their company
CREATE POLICY "Users can create accounts for their company"
ON public.accounts
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND created_by = auth.uid()
);

-- Users can update accounts in their company
CREATE POLICY "Users can update their company accounts"
ON public.accounts
FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Users can delete accounts in their company
CREATE POLICY "Users can delete their company accounts"
ON public.accounts
FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

-- Super admins can do everything
CREATE POLICY "Super admins can manage all accounts"
ON public.accounts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_company_id ON public.accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_created_by ON public.accounts(created_by);