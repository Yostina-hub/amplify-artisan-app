-- Eliminate recursion in user_roles policies and ensure system admin

-- 1) Drop all existing policies on user_roles that might cause recursion or conflicts
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Company admins can view their company user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Company admins can insert their company user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Company admins can view company user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Company admins can insert company user roles" ON public.user_roles;

-- 2) Create minimal, non-recursive policies using only security definer function calls
--    IMPORTANT: Do not reference public.user_roles directly in these policies to avoid recursion

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all roles (uses security definer function, no direct table reference in policy)
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert roles
CREATE POLICY "Admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete roles
CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- (Optional) If updates are ever needed later, add an UPDATE policy, but we omit for now.

-- 3) Ensure the system admin account exists with global admin (company_id NULL)
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id
  FROM public.profiles
  WHERE email = 'abel.birara@gmail.com';

  IF admin_user_id IS NOT NULL THEN
    -- Upsert admin role with NULL company_id
    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (admin_user_id, 'admin'::app_role, NULL)
    ON CONFLICT (user_id, role)
    DO UPDATE SET company_id = NULL;

    -- Ensure profile has no company assigned
    UPDATE public.profiles
    SET company_id = NULL
    WHERE id = admin_user_id;
  END IF;
END $$;
