-- Add SMTP configuration fields to email_configurations table
ALTER TABLE public.email_configurations
ADD COLUMN IF NOT EXISTS smtp_host text,
ADD COLUMN IF NOT EXISTS smtp_port integer DEFAULT 465,
ADD COLUMN IF NOT EXISTS smtp_username text,
ADD COLUMN IF NOT EXISTS smtp_password text,
ADD COLUMN IF NOT EXISTS smtp_secure boolean DEFAULT true;

-- Update the table to make sender_email and sender_name nullable since they might use SMTP username
ALTER TABLE public.email_configurations
ALTER COLUMN sender_email DROP NOT NULL,
ALTER COLUMN sender_name DROP NOT NULL;