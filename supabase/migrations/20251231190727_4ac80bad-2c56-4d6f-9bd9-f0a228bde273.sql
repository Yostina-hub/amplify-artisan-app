-- Add tools_enabled column to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tools_enabled boolean DEFAULT false;