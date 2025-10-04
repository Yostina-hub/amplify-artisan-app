-- Create auth schema for self-hosted PostgreSQL
-- This replicates the minimal Supabase auth structure needed for RLS policies

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create users table in auth schema (minimal version)
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    is_super_admin BOOLEAN DEFAULT false
);

-- Create function to get current user ID
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$;

-- For session-based auth (simpler approach)
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO app_user;
GRANT SELECT ON auth.users TO app_user;
GRANT EXECUTE ON FUNCTION auth.uid() TO app_user;
