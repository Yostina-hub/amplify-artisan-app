-- Retry: drop all policies on user_roles using correct column name, then recreate safe policies

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies (name-agnostic)
DO $$ DECLARE r record; BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', r.policyname);
  END LOOP;
END $$;

-- Minimal, non-recursive policies
CREATE POLICY "read own or default-admin"
ON public.user_roles FOR SELECT
USING (
  auth.uid() = user_id OR
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abel.birara@gmail.com'
);

CREATE POLICY "manage roles insert (default-admin)"
ON public.user_roles FOR INSERT
WITH CHECK ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'abel.birara@gmail.com');

CREATE POLICY "manage roles update (default-admin)"
ON public.user_roles FOR UPDATE
USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'abel.birara@gmail.com')
WITH CHECK ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'abel.birara@gmail.com');

CREATE POLICY "manage roles delete (default-admin)"
ON public.user_roles FOR DELETE
USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'abel.birara@gmail.com');

-- Ensure admin role present
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin' FROM auth.users u
WHERE u.email = 'abel.birara@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;