-- Add status field to company_platform_subscriptions for admin review
ALTER TABLE company_platform_subscriptions
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add reviewed_by and reviewed_at fields
ALTER TABLE company_platform_subscriptions
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update existing subscriptions to be approved
UPDATE company_platform_subscriptions
SET status = 'approved'
WHERE status IS NULL OR status = 'pending';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_company_platform_subscriptions_status 
ON company_platform_subscriptions(status);

-- Update RLS policies to allow companies to see their pending requests
DROP POLICY IF EXISTS "Companies can view their own subscriptions" ON company_platform_subscriptions;

CREATE POLICY "Companies can view their own subscriptions"
ON company_platform_subscriptions
FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- Allow companies to insert subscription requests
DROP POLICY IF EXISTS "Companies can insert their subscriptions" ON company_platform_subscriptions;

CREATE POLICY "Companies can request subscriptions"
ON company_platform_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND
  status = 'pending'
);