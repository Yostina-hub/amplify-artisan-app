-- Create a safe view of social_media_accounts that excludes sensitive tokens
CREATE OR REPLACE VIEW social_media_accounts_safe AS
SELECT 
  id,
  user_id,
  company_id,
  platform,
  account_name,
  account_id,
  is_active,
  token_expires_at,
  created_at,
  updated_at
FROM social_media_accounts;

-- Grant access to authenticated users
GRANT SELECT ON social_media_accounts_safe TO authenticated;

-- The view will inherit RLS from the base table, but we can add explicit policies
ALTER VIEW social_media_accounts_safe SET (security_invoker = on);