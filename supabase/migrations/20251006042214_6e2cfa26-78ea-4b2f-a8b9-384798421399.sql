-- Ensure admins can insert without company_id friction
CREATE POLICY "Admins can insert any contacts"
ON public.contacts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert any leads"
ON public.leads
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert any accounts"
ON public.accounts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create a helper trigger function to set defaults on insert
CREATE OR REPLACE FUNCTION public.set_default_company_and_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := get_user_company_id(auth.uid());
  END IF;
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Apply BEFORE INSERT triggers on contacts and leads to auto-fill company_id and created_by when missing
DROP TRIGGER IF EXISTS trg_contacts_defaults ON public.contacts;
CREATE TRIGGER trg_contacts_defaults
BEFORE INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_default_company_and_creator();

DROP TRIGGER IF EXISTS trg_leads_defaults ON public.leads;
CREATE TRIGGER trg_leads_defaults
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.set_default_company_and_creator();