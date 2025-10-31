-- ============================================================================
-- AUTOMATIC SUPER ADMIN USER SEEDING
-- ============================================================================
-- This script creates the default super admin user if it doesn't exist
-- 
-- Default Credentials:
--   Email: abel.birara@gmail.com
--   Password: Admin@2025
--
-- ⚠️  IMPORTANT: CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!
--
-- For VPS Self-Hosted Deployment:
-- This script is run automatically during deployment OR you can run it manually:
-- psql "postgresql://postgres:password@localhost:5432/postgres" -f scripts/seed-admin.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create the admin user in auth.users (if not exists)
DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'abel.birara@gmail.com';
  admin_password text := 'Admin@2025'; -- Default password
  encrypted_pw text;
BEGIN
  -- Check if user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- If user doesn't exist, create it
  IF admin_user_id IS NULL THEN
    -- Generate encrypted password using crypt
    SELECT crypt(admin_password, gen_salt('bf')) INTO encrypted_pw;
    
    -- Insert into auth.users with all required fields
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      admin_email,
      encrypted_pw,
      now(),
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'full_name', 'System Administrator',
        'email_verified', true,
        'requires_password_change', false
      ),
      now(),
      now()
    )
    RETURNING id INTO admin_user_id;
    
    RAISE NOTICE 'Created super admin user: %', admin_email;
  ELSE
    RAISE NOTICE 'Super admin user already exists: %', admin_email;
  END IF;

  -- 2. Ensure profile exists
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    admin_user_id,
    admin_email,
    'System Administrator'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- 3. Ensure admin role is assigned
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE '✅ Super admin setup completed successfully!';
  RAISE NOTICE '📧 Email: %', admin_email;
  RAISE NOTICE '🔑 Password: % (CHANGE THIS IN PRODUCTION!)', admin_password;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  SECURITY WARNING: Change the default password immediately after first login!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error creating super admin: %', SQLERRM;
    RAISE NOTICE 'You may need to create the admin user manually via the signup page.';
END $$;

-- 4. Verify admin user was created correctly
DO $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE u.email = 'abel.birara@gmail.com'
    AND ur.role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE NOTICE '✅ Verification passed: Super admin user is correctly configured';
  ELSE
    RAISE WARNING '⚠️  Verification failed: Super admin might not be configured correctly';
  END IF;
END $$;
