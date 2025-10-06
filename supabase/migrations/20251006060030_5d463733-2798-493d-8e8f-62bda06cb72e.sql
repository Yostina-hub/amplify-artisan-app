-- Ensure RLS is enabled for contacts and add SELECT policy so users can view their own company contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contacts' AND policyname = 'Users can view their company contacts'
  ) THEN
    CREATE POLICY "Users can view their company contacts"
    ON public.contacts
    FOR SELECT
    USING (
      company_id = public.get_user_company_id(auth.uid())
      OR created_by = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;