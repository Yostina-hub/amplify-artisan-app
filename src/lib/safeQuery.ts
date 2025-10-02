import { supabase } from "@/integrations/supabase/client";

/**
 * Query the safe view of social_media_accounts that excludes sensitive tokens
 * Use this for display purposes only. For INSERT/UPDATE/DELETE, use the main table.
 */
export const querySocialMediaAccountsSafe = () => {
  return (supabase as any).from('social_media_accounts_safe');
};
