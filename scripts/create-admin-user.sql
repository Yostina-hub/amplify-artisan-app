-- Script to manually create admin user for self-hosted deployments
-- Run this in your Supabase SQL Editor if automatic signup is not working

-- IMPORTANT: This script assumes you have direct access to Supabase SQL Editor
-- You cannot use this script to create users with passwords from SQL directly
-- Passwords must be handled through Supabase Auth API

-- Instead, use this script to verify and assign admin role to existing user:

-- 1. First, check if user exists
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'abel.birara@gmail.com';

-- 2. If user exists, ensure profile exists
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Admin User')
FROM auth.users
WHERE email = 'abel.birara@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 3. Assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'abel.birara@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Verify admin role was assigned
SELECT 
  u.email,
  p.full_name,
  ur.role,
  u.created_at
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'abel.birara@gmail.com';

-- 5. If you need to reset email confirmation (for testing)
-- WARNING: Only use in development/testing environments
-- UPDATE auth.users
-- SET email_confirmed_at = now()
-- WHERE email = 'abel.birara@gmail.com';

-- 6. Check auth configuration
SELECT parameter, value
FROM auth.config
WHERE parameter IN ('enable_signup', 'enable_email_signup', 'disable_signup');
