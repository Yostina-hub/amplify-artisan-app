-- Add pricing and subscription fields to social_platforms table
ALTER TABLE public.social_platforms
ADD COLUMN IF NOT EXISTS pricing_info TEXT,
ADD COLUMN IF NOT EXISTS subscription_required BOOLEAN DEFAULT false;