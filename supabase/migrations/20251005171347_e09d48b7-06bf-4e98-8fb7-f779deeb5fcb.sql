-- Dynamic Roles Migration
-- Step 1: Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key TEXT NOT NULL UNIQUE,
  role_name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Insert default system roles
INSERT INTO public.roles (role_key, role_name, description, is_system, color) VALUES
  ('admin', 'Administrator', 'Full system access and management capabilities', true, '#ef4444'),
  ('agent', 'Agent', 'Customer service and sales capabilities', true, '#3b82f6'),
  ('user', 'User', 'Standard user access', true, '#10b981')
ON CONFLICT (role_key) DO NOTHING;

-- Step 2: Drop all policies that reference the role column type
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Step 3: Convert enum columns to text
ALTER TABLE public.user_roles ALTER COLUMN role TYPE TEXT;
ALTER TABLE public.role_permissions ALTER COLUMN role TYPE TEXT;

-- Step 4: Drop the old enum
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Step 5: Update functions to work with text roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Step 6: Recreate essential RLS policies with text-based role checks

-- Policies for roles table
CREATE POLICY "Super admins can manage all roles"
  ON public.roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view all roles"
  ON public.roles FOR SELECT
  USING (true);

-- Policies for user_roles
CREATE POLICY "Block direct role manipulation"
  ON public.user_roles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct role updates"
  ON public.user_roles FOR UPDATE
  USING (false);

CREATE POLICY "Block direct role deletion"
  ON public.user_roles FOR DELETE
  USING (false);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Policies for companies
CREATE POLICY "Anyone can insert company applications"
  ON public.companies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view companies"
  ON public.companies FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can update all companies"
  ON public.companies FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can delete companies"
  ON public.companies FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Policies for company_platform_configs
CREATE POLICY "Super admins can manage all configs"
  ON public.company_platform_configs FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Company admins can manage their configs"
  ON public.company_platform_configs FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND company_id = get_user_company_id(auth.uid())
    )
  );

-- Policies for company_platform_subscriptions  
CREATE POLICY "Admins can manage all subscriptions"
  ON public.company_platform_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies can view their own subscriptions"
  ON public.company_platform_subscriptions FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Companies can request subscriptions"
  ON public.company_platform_subscriptions FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND status = 'pending');

-- Add trigger for updated_at on roles table
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();