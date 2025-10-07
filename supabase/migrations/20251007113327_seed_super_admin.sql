-- Permanent seed: Ensure abel.birara@gmail.com always has admin role
-- This migration is idempotent and safe to run multiple times

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if user exists
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'abel.birara@gmail.com';
  
  -- If user exists, ensure they have admin role
  IF admin_user_id IS NOT NULL THEN
    -- Remove any existing user roles for this user
    DELETE FROM public.user_roles WHERE user_id = admin_user_id AND role != 'admin';
    
    -- Add admin role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role ensured for abel.birara@gmail.com';
  ELSE
    RAISE NOTICE 'User abel.birara@gmail.com does not exist yet - will be auto-assigned admin on signup';
  END IF;
END $$;