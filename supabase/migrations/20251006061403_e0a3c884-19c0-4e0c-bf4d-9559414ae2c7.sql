-- Ensure accounts get company_id/created_by automatically and backfill existing rows

-- 1) Add BEFORE INSERT trigger to populate company_id and created_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_default_company_and_creator_on_accounts'
  ) THEN
    CREATE TRIGGER set_default_company_and_creator_on_accounts
    BEFORE INSERT ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_default_company_and_creator();
  END IF;
END $$;

-- 2) Add BEFORE UPDATE trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_accounts_updated_at'
  ) THEN
    CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- 3) Backfill company_id from related contacts when available
UPDATE public.accounts a
SET company_id = c.company_id
FROM public.contacts c
WHERE a.company_id IS NULL
  AND c.account_id = a.id
  AND c.company_id IS NOT NULL;

-- 4) Backfill remaining rows using creator's profile company
UPDATE public.accounts a
SET company_id = p.company_id
FROM public.profiles p
WHERE a.company_id IS NULL
  AND a.created_by = p.id
  AND p.company_id IS NOT NULL;