-- ============================================================================
-- FIX SUPER ADMIN LOGIN ISSUE
-- ============================================================================
-- This script fixes common issues preventing super admin login
-- 
-- Run this if you cannot login with: abel.birara@gmail.com / Admin@2025
--
-- Usage:
--   psql "postgresql://postgres:password@localhost:5432/postgres" -f scripts/fix-admin-login.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 1: Check if user exists
DO $$
DECLARE
  admin_exists boolean;
  admin_user_id uuid;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'abel.birara@gmail.com') INTO admin_exists;
  
  IF admin_exists THEN
    RAISE NOTICE '✓ Admin user exists in auth.users';
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'abel.birara@gmail.com';
    RAISE NOTICE '  User ID: %', admin_user_id;
  ELSE
    RAISE NOTICE '✗ Admin user does NOT exist - will create it';
  END IF;
END $$;

-- Step 2: Create or update the admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'abel.birara@gmail.com',
  crypt('Admin@2025', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"System Administrator","email_verified":true,"requires_password_change":false}'::jsonb,
  false,
  now(),
  now(),
  null,
  now()
)
ON CONFLICT (email) 
DO UPDATE SET
  encrypted_password = crypt('Admin@2025', gen_salt('bf')),
  email_confirmed_at = now(),
  confirmed_at = now(),
  raw_user_meta_data = '{"full_name":"System Administrator","email_verified":true,"requires_password_change":false}'::jsonb,
  updated_at = now()
RETURNING id;

-- Step 3: Ensure profile exists
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'System Administrator'),
  now(),
  now()
FROM auth.users
WHERE email = 'abel.birara@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, 'System Administrator'),
  updated_at = now();

-- Step 4: Ensure admin role exists (without company_id for super admin)
INSERT INTO public.user_roles (user_id, role, company_id, created_at)
SELECT 
  id, 
  'admin'::public.app_role,
  NULL,
  now()
FROM auth.users
WHERE email = 'abel.birara@gmail.com'
ON CONFLICT (user_id, role) 
DO UPDATE SET
  company_id = NULL,
  updated_at = now();

-- Step 5: Verify setup
DO $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.encrypted_password IS NOT NULL as has_password,
    p.full_name,
    ur.role,
    ur.company_id
  INTO user_record
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE u.email = 'abel.birara@gmail.com';
  
  IF user_record.id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SUPER ADMIN SETUP COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Email: abel.birara@gmail.com';
    RAISE NOTICE '🔑 Password: Admin@2025';
    RAISE NOTICE '';
    RAISE NOTICE 'User Details:';
    RAISE NOTICE '  ID: %', user_record.id;
    RAISE NOTICE '  Name: %', user_record.full_name;
    RAISE NOTICE '  Role: %', user_record.role;
    RAISE NOTICE '  Email Confirmed: %', CASE WHEN user_record.email_confirmed_at IS NOT NULL THEN 'Yes' ELSE 'No' END;
    RAISE NOTICE '  Has Password: %', CASE WHEN user_record.has_password THEN 'Yes' ELSE 'No' END;
    RAISE NOTICE '  Is Super Admin: %', CASE WHEN user_record.company_id IS NULL THEN 'Yes (no company)' ELSE 'No' END;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Change the default password after first login!';
    RAISE NOTICE '';
    
    IF user_record.email_confirmed_at IS NULL THEN
      RAISE WARNING '⚠️  Email is not confirmed. Enable auto-confirm in Supabase Auth settings.';
    END IF;
    
    IF NOT user_record.has_password THEN
      RAISE WARNING '⚠️  User does not have a password set!';
    END IF;
  ELSE
    RAISE EXCEPTION '❌ Failed to create/verify super admin user';
  END IF;
END $$;

-- Step 6: Additional verification queries
\echo ''
\echo 'Additional Checks:'
\echo '=================='

-- Check auth.users
\echo ''
\echo '1. Auth User Record:'
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at IS NOT NULL as email_confirmed,
  encrypted_password IS NOT NULL as has_password,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
WHERE email = 'abel.birara@gmail.com';

-- Check profiles
\echo ''
\echo '2. Profile Record:'
SELECT id, email, full_name, company_id, created_at
FROM public.profiles 
WHERE email = 'abel.birara@gmail.com';

-- Check user_roles
\echo ''
\echo '3. User Roles:'
SELECT user_id, role, company_id, created_at
FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'abel.birara@gmail.com');

-- Check if is_super_admin function works
\echo ''
\echo '4. Super Admin Function Test:'
SELECT public.is_super_admin((SELECT id FROM auth.users WHERE email = 'abel.birara@gmail.com')) as is_super_admin;

\echo ''
\echo 'Setup verification complete!'
\echo ''
