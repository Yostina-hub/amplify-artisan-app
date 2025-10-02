-- Fix infinite recursion in user_roles policies
DROP POLICY IF EXISTS "Company admins can view their company user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Company admins can insert their company user roles" ON public.user_roles;

-- Create proper policies using security definer function to avoid recursion
-- Super admins (no company) can view all roles
CREATE POLICY "Super admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND
    NOT EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.company_id IS NOT NULL
    )
  );

-- Company admins can view roles in their company
CREATE POLICY "Company admins can view company user roles"
  ON public.user_roles FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Super admins can insert any role
CREATE POLICY "Super admins can insert user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND
    NOT EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.company_id IS NOT NULL
    )
  );

-- Company admins can insert roles in their company
CREATE POLICY "Company admins can insert company user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Ensure abel.birara@gmail.com is system admin (admin with no company)
-- First, get the user ID
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID for abel.birara@gmail.com
  SELECT id INTO admin_user_id FROM public.profiles WHERE email = 'abel.birara@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Remove any existing roles for this user
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    
    -- Set as super admin (admin with no company_id)
    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (admin_user_id, 'admin'::app_role, NULL);
    
    -- Make sure profile has no company assigned
    UPDATE public.profiles 
    SET company_id = NULL 
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'System admin set for abel.birara@gmail.com';
  ELSE
    RAISE NOTICE 'User abel.birara@gmail.com not found';
  END IF;
END $$;