-- Create demo user account
-- Email: demo@gmail.et
-- Password: demo@123

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  demo_user_id uuid;
  demo_email text := 'demo@gmail.et';
  demo_password text := 'demo@123';
  encrypted_pw text;
BEGIN
  -- Check if user already exists
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = demo_email;

  -- If user doesn't exist, create it
  IF demo_user_id IS NULL THEN
    -- Generate encrypted password
    SELECT crypt(demo_password, gen_salt('bf')) INTO encrypted_pw;
    
    -- Insert into auth.users
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
      demo_email,
      encrypted_pw,
      now(),
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'full_name', 'Demo User',
        'email_verified', true,
        'requires_password_change', false
      ),
      now(),
      now()
    )
    RETURNING id INTO demo_user_id;
    
    RAISE NOTICE 'Created demo user: %', demo_email;
  ELSE
    RAISE NOTICE 'Demo user already exists: %', demo_email;
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    demo_user_id,
    demo_email,
    'Demo User'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (demo_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE '✅ Demo account created successfully!';
  RAISE NOTICE '📧 Email: %', demo_email;
  RAISE NOTICE '🔑 Password: %', demo_password;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error creating demo user: %', SQLERRM;
END $$;