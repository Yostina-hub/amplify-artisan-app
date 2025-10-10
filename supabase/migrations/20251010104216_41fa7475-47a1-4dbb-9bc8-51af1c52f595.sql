-- Enable RLS and add company-scoped policies for Documents, Email Campaigns, and Quotes

-- DOCUMENTS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Users can view company documents'
  ) THEN
    CREATE POLICY "Users can view company documents"
    ON public.documents
    FOR SELECT
    USING (
      company_id = get_user_company_id(auth.uid())
      OR has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Users can insert company documents'
  ) THEN
    CREATE POLICY "Users can insert company documents"
    ON public.documents
    FOR INSERT
    WITH CHECK (
      company_id = get_user_company_id(auth.uid())
      AND created_by = auth.uid()
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Users can update company documents'
  ) THEN
    CREATE POLICY "Users can update company documents"
    ON public.documents
    FOR UPDATE
    USING (
      company_id = get_user_company_id(auth.uid())
      OR has_role(auth.uid(), 'admin')
    )
    WITH CHECK (
      company_id = get_user_company_id(auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Users can delete company documents'
  ) THEN
    CREATE POLICY "Users can delete company documents"
    ON public.documents
    FOR DELETE
    USING (
      company_id = get_user_company_id(auth.uid())
      OR has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

-- EMAIL CAMPAIGNS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_campaigns' AND policyname='Users can view company email campaigns'
  ) THEN
    CREATE POLICY "Users can view company email campaigns"
    ON public.email_campaigns
    FOR SELECT
    USING (
      company_id = get_user_company_id(auth.uid())
      OR has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_campaigns' AND policyname='Users can insert company email campaigns'
  ) THEN
    CREATE POLICY "Users can insert company email campaigns"
    ON public.email_campaigns
    FOR INSERT
    WITH CHECK (
      company_id = get_user_company_id(auth.uid())
      AND created_by = auth.uid()
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_campaigns' AND policyname='Users can update company email campaigns'
  ) THEN
    CREATE POLICY "Users can update company email campaigns"
    ON public.email_campaigns
    FOR UPDATE
    USING (
      company_id = get_user_company_id(auth.uid())
      OR has_role(auth.uid(), 'admin')
    )
    WITH CHECK (
      company_id = get_user_company_id(auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_campaigns' AND policyname='Users can delete company email campaigns'
  ) THEN
    CREATE POLICY "Users can delete company email campaigns"
    ON public.email_campaigns
    FOR DELETE
    USING (
      company_id = get_user_company_id(auth.uid())
      OR has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

-- QUOTES
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quotes' AND policyname='Users can view company quotes'
  ) THEN
    CREATE POLICY "Users can view company quotes"
    ON public.quotes
    FOR SELECT
    USING (
      company_id = get_user_company_id(auth.uid())
      OR has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quotes' AND policyname='Users can insert company quotes'
  ) THEN
    CREATE POLICY "Users can insert company quotes"
    ON public.quotes
    FOR INSERT
    WITH CHECK (
      company_id = get_user_company_id(auth.uid())
      AND created_by = auth.uid()
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quotes' AND policyname='Users can update company quotes'
  ) THEN
    CREATE POLICY "Users can update company quotes"
    ON public.quotes
    FOR UPDATE
    USING (
      company_id = get_user_company_id(auth.uid())
      OR has_role(auth.uid(), 'admin')
    )
    WITH CHECK (
      company_id = get_user_company_id(auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quotes' AND policyname='Users can delete company quotes'
  ) THEN
    CREATE POLICY "Users can delete company quotes"
    ON public.quotes
    FOR DELETE
    USING (
      company_id = get_user_company_id(auth.uid())
      OR has_role(auth.uid(), 'admin')
    );
  END IF;
END $$;
