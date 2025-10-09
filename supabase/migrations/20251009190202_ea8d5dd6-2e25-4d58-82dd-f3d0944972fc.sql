-- Fix infinite recursion in user_roles policies and ensure default admin works

-- 1) Drop any existing policies on user_roles to start clean
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles';
  EXECUTE 'DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles';
  EXECUTE 'DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles';
  EXECUTE 'DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles';
  EXECUTE 'DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles';
  EXECUTE 'DROP POLICY IF EXISTS "users can read own roles" ON public.user_roles';
  EXECUTE 'DROP POLICY IF EXISTS "super admin can read all roles" ON public.user_roles';
  EXECUTE 'DROP POLICY IF EXISTS "super admin can manage roles" ON public.user_roles';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2) Create NON-RECURSIVE policies (never reference user_roles in its own policies)
-- Allow users to read their own roles
CREATE POLICY "users can read own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Allow the default super admin (by email) to read all roles
CREATE POLICY "super admin can read all roles"
ON public.user_roles FOR SELECT
USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'abel.birara@gmail.com');

-- Super admin (by email) can manage roles (insert/update/delete)
CREATE POLICY "super admin can manage roles (insert)"
ON public.user_roles FOR INSERT
WITH CHECK ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'abel.birara@gmail.com');

CREATE POLICY "super admin can manage roles (update)"
ON public.user_roles FOR UPDATE
USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'abel.birara@gmail.com')
WITH CHECK ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'abel.birara@gmail.com');

CREATE POLICY "super admin can manage roles (delete)"
ON public.user_roles FOR DELETE
USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'abel.birara@gmail.com');

-- 3) Ensure the app_role enum exists (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'user');
  END IF;
END $$;

-- 4) Ensure handle_new_user still assigns admin for the default email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;

  IF NEW.email = 'abel.birara@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 5) Upsert admin role for existing account
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE u.email = 'abel.birara@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;