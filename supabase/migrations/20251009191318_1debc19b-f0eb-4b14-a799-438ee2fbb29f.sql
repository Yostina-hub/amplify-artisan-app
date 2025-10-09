-- Fix user_roles RLS: remove auth.users dependency and avoid recursion
-- 1) Helper functions
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin' AND company_id IS NULL
  );
$$;

-- 2) Enable RLS and reset policies on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE r record; BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', r.policyname);
  END LOOP;
END $$;

-- 3) Recreate safe policies (no auth.users access)
CREATE POLICY "user_roles select own or admins"
ON public.user_roles FOR SELECT
USING (
  user_id = auth.uid() OR public.is_admin(auth.uid())
);

CREATE POLICY "user_roles insert super_admin"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "user_roles update super_admin"
ON public.user_roles FOR UPDATE
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "user_roles delete super_admin"
ON public.user_roles FOR DELETE
USING (public.is_super_admin(auth.uid()));

-- 4) Ensure the default owner email has a super admin role (no company context)
-- This read from auth.users happens at migration time only (not in policies), which is safe
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::text
FROM auth.users u
WHERE u.email = 'abel.birara@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
