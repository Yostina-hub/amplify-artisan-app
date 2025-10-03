-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  audit_user_id uuid;
  audit_action text;
  audit_details jsonb;
BEGIN
  -- Get current user
  audit_user_id := auth.uid();
  
  -- Determine action type
  IF (TG_OP = 'INSERT') THEN
    audit_action := 'INSERT';
    audit_details := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    audit_action := 'UPDATE';
    audit_details := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'changed_fields', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key
      )
    );
  ELSIF (TG_OP = 'DELETE') THEN
    audit_action := 'DELETE';
    audit_details := to_jsonb(OLD);
  END IF;

  -- Insert audit log
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    details,
    created_at
  ) VALUES (
    audit_user_id,
    audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    audit_details,
    NOW()
  );

  -- Return appropriate record
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for key tables

-- Social Media Accounts
DROP TRIGGER IF EXISTS audit_social_media_accounts ON public.social_media_accounts;
CREATE TRIGGER audit_social_media_accounts
  AFTER INSERT OR UPDATE OR DELETE ON public.social_media_accounts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Social Media Posts
DROP TRIGGER IF EXISTS audit_social_media_posts ON public.social_media_posts;
CREATE TRIGGER audit_social_media_posts
  AFTER INSERT OR UPDATE OR DELETE ON public.social_media_posts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Ad Campaigns
DROP TRIGGER IF EXISTS audit_ad_campaigns ON public.ad_campaigns;
CREATE TRIGGER audit_ad_campaigns
  AFTER INSERT OR UPDATE OR DELETE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Influencer Campaigns
DROP TRIGGER IF EXISTS audit_influencer_campaigns ON public.influencer_campaigns;
CREATE TRIGGER audit_influencer_campaigns
  AFTER INSERT OR UPDATE OR DELETE ON public.influencer_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Influencers
DROP TRIGGER IF EXISTS audit_influencers ON public.influencers;
CREATE TRIGGER audit_influencers
  AFTER INSERT OR UPDATE OR DELETE ON public.influencers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Profiles
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Companies
DROP TRIGGER IF EXISTS audit_companies ON public.companies;
CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Company Platform Subscriptions
DROP TRIGGER IF EXISTS audit_company_platform_subscriptions ON public.company_platform_subscriptions;
CREATE TRIGGER audit_company_platform_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON public.company_platform_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- User Roles
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Subscription Requests
DROP TRIGGER IF EXISTS audit_subscription_requests ON public.subscription_requests;
CREATE TRIGGER audit_subscription_requests
  AFTER INSERT OR UPDATE ON public.subscription_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Email Configurations
DROP TRIGGER IF EXISTS audit_email_configurations ON public.email_configurations;
CREATE TRIGGER audit_email_configurations
  AFTER INSERT OR UPDATE OR DELETE ON public.email_configurations
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Social Platforms
DROP TRIGGER IF EXISTS audit_social_platforms ON public.social_platforms;
CREATE TRIGGER audit_social_platforms
  AFTER INSERT OR UPDATE OR DELETE ON public.social_platforms
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Tracked Keywords
DROP TRIGGER IF EXISTS audit_tracked_keywords ON public.tracked_keywords;
CREATE TRIGGER audit_tracked_keywords
  AFTER INSERT OR UPDATE OR DELETE ON public.tracked_keywords
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Social Media Comments
DROP TRIGGER IF EXISTS audit_social_media_comments ON public.social_media_comments;
CREATE TRIGGER audit_social_media_comments
  AFTER UPDATE ON public.social_media_comments
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Create RLS policies for company users to view their company's audit logs
CREATE POLICY "Company users can view their company audit logs"
ON public.security_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1
    WHERE p1.id = auth.uid()
    AND p1.company_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = security_audit_log.user_id
      AND p2.company_id = p1.company_id
    )
  )
);

-- Create a view for formatted audit logs
CREATE OR REPLACE VIEW public.audit_log_view AS
SELECT 
  sal.id,
  sal.user_id,
  p.email as user_email,
  p.full_name as user_name,
  sal.action,
  sal.table_name,
  sal.record_id,
  sal.details,
  sal.ip_address,
  sal.user_agent,
  sal.created_at,
  p.company_id
FROM public.security_audit_log sal
LEFT JOIN public.profiles p ON p.id = sal.user_id;

-- Grant access to the view
GRANT SELECT ON public.audit_log_view TO authenticated;

-- RLS for the view
ALTER VIEW public.audit_log_view SET (security_invoker = on);