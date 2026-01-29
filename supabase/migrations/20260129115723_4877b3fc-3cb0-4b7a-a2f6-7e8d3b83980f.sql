-- Create user_permissions table for direct user-to-permission assignments
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, permission_id, company_id)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_permissions
CREATE POLICY "Super admins can manage all user permissions"
  ON public.user_permissions FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage their company user permissions"
  ON public.user_permissions FOR ALL
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND company_id = user_permissions.company_id
    )
  );

CREATE POLICY "Users can view their own permissions"
  ON public.user_permissions FOR SELECT
  USING (user_id = auth.uid());

-- Insert comprehensive permissions for all modules
INSERT INTO public.permissions (module_name, permission_key, permission_name, description, category, is_system) 
VALUES
  -- Social Media Module
  ('social', 'social.posts.view', 'View Posts', 'View social media posts', 'Social Media', true),
  ('social', 'social.posts.create', 'Create Posts', 'Create and schedule social media posts', 'Social Media', true),
  ('social', 'social.posts.edit', 'Edit Posts', 'Edit existing posts', 'Social Media', true),
  ('social', 'social.posts.delete', 'Delete Posts', 'Delete social media posts', 'Social Media', true),
  ('social', 'social.posts.approve', 'Approve Posts', 'Approve posts for publishing', 'Social Media', true),
  ('social', 'social.inbox.view', 'View Inbox', 'View social inbox messages', 'Social Media', true),
  ('social', 'social.inbox.reply', 'Reply to Messages', 'Reply to social media messages', 'Social Media', true),
  ('social', 'social.connections.manage', 'Manage Connections', 'Connect and disconnect social accounts', 'Social Media', true),
  ('social', 'social.analytics.view', 'View Social Analytics', 'View social media analytics', 'Social Media', true),
  
  -- Media Monitoring Module
  ('monitoring', 'monitoring.view', 'View Monitoring', 'View media monitoring dashboard', 'Media Monitoring', true),
  ('monitoring', 'monitoring.configure', 'Configure Monitoring', 'Configure monitoring profiles and alerts', 'Media Monitoring', true),
  ('monitoring', 'monitoring.alerts.manage', 'Manage Alerts', 'Manage monitoring alerts', 'Media Monitoring', true),
  
  -- Email Marketing Module
  ('email', 'email.campaigns.view', 'View Campaigns', 'View email campaigns', 'Email Marketing', true),
  ('email', 'email.campaigns.create', 'Create Campaigns', 'Create email campaigns', 'Email Marketing', true),
  ('email', 'email.campaigns.edit', 'Edit Campaigns', 'Edit email campaigns', 'Email Marketing', true),
  ('email', 'email.campaigns.delete', 'Delete Campaigns', 'Delete email campaigns', 'Email Marketing', true),
  ('email', 'email.campaigns.send', 'Send Campaigns', 'Send email campaigns', 'Email Marketing', true),
  ('email', 'email.templates.manage', 'Manage Templates', 'Manage email templates', 'Email Marketing', true),
  ('email', 'email.contacts.manage', 'Manage Contacts', 'Manage email contacts and lists', 'Email Marketing', true),
  
  -- Advertising Module
  ('ads', 'ads.campaigns.view', 'View Ad Campaigns', 'View advertising campaigns', 'Advertising', true),
  ('ads', 'ads.campaigns.create', 'Create Ad Campaigns', 'Create advertising campaigns', 'Advertising', true),
  ('ads', 'ads.campaigns.edit', 'Edit Ad Campaigns', 'Edit advertising campaigns', 'Advertising', true),
  ('ads', 'ads.campaigns.delete', 'Delete Ad Campaigns', 'Delete advertising campaigns', 'Advertising', true),
  ('ads', 'ads.budget.manage', 'Manage Ad Budget', 'Manage advertising budgets', 'Advertising', true),
  
  -- Influencer Module
  ('influencer', 'influencer.view', 'View Influencers', 'View influencer data', 'Influencer Marketing', true),
  ('influencer', 'influencer.manage', 'Manage Influencers', 'Manage influencer relationships', 'Influencer Marketing', true),
  ('influencer', 'influencer.campaigns.manage', 'Manage Influencer Campaigns', 'Manage influencer campaigns', 'Influencer Marketing', true),
  
  -- Call Center Module
  ('callcenter', 'callcenter.view', 'View Call Center', 'Access call center dashboard', 'Call Center', true),
  ('callcenter', 'callcenter.calls.make', 'Make Calls', 'Make outbound calls', 'Call Center', true),
  ('callcenter', 'callcenter.calls.receive', 'Receive Calls', 'Receive inbound calls', 'Call Center', true),
  ('callcenter', 'callcenter.recordings.view', 'View Recordings', 'View call recordings', 'Call Center', true),
  ('callcenter', 'callcenter.reports.view', 'View Call Reports', 'View call center reports', 'Call Center', true),
  ('callcenter', 'callcenter.settings.manage', 'Manage Call Settings', 'Manage call center settings', 'Call Center', true),
  
  -- Customer Support Module
  ('support', 'support.tickets.view', 'View Tickets', 'View support tickets', 'Customer Support', true),
  ('support', 'support.tickets.create', 'Create Tickets', 'Create support tickets', 'Customer Support', true),
  ('support', 'support.tickets.assign', 'Assign Tickets', 'Assign tickets to agents', 'Customer Support', true),
  ('support', 'support.tickets.resolve', 'Resolve Tickets', 'Resolve support tickets', 'Customer Support', true),
  ('support', 'support.livechat.access', 'Access Live Chat', 'Access live chat support', 'Customer Support', true),
  
  -- Sales Module
  ('sales', 'sales.pipeline.view', 'View Pipeline', 'View sales pipeline', 'Sales', true),
  ('sales', 'sales.pipeline.manage', 'Manage Pipeline', 'Manage sales pipeline stages', 'Sales', true),
  ('sales', 'sales.quotes.view', 'View Quotes', 'View sales quotes', 'Sales', true),
  ('sales', 'sales.quotes.create', 'Create Quotes', 'Create sales quotes', 'Sales', true),
  ('sales', 'sales.quotes.approve', 'Approve Quotes', 'Approve sales quotes', 'Sales', true),
  ('sales', 'sales.invoices.view', 'View Invoices', 'View invoices', 'Sales', true),
  ('sales', 'sales.invoices.create', 'Create Invoices', 'Create invoices', 'Sales', true),
  ('sales', 'sales.payments.manage', 'Manage Payments', 'Manage payments', 'Sales', true),
  
  -- Contracts Module
  ('contracts', 'contracts.view', 'View Contracts', 'View contracts', 'Contracts', true),
  ('contracts', 'contracts.create', 'Create Contracts', 'Create contracts', 'Contracts', true),
  ('contracts', 'contracts.edit', 'Edit Contracts', 'Edit contracts', 'Contracts', true),
  ('contracts', 'contracts.approve', 'Approve Contracts', 'Approve contracts', 'Contracts', true),
  ('contracts', 'contracts.sign', 'Sign Contracts', 'Sign contracts', 'Contracts', true),
  
  -- Documents Module
  ('documents', 'documents.view', 'View Documents', 'View documents', 'Documents', true),
  ('documents', 'documents.upload', 'Upload Documents', 'Upload documents', 'Documents', true),
  ('documents', 'documents.edit', 'Edit Documents', 'Edit documents', 'Documents', true),
  ('documents', 'documents.delete', 'Delete Documents', 'Delete documents', 'Documents', true),
  ('documents', 'documents.share', 'Share Documents', 'Share documents', 'Documents', true),
  
  -- Project Management Module
  ('projects', 'projects.view', 'View Projects', 'View projects', 'Project Management', true),
  ('projects', 'projects.create', 'Create Projects', 'Create projects', 'Project Management', true),
  ('projects', 'projects.edit', 'Edit Projects', 'Edit projects', 'Project Management', true),
  ('projects', 'projects.delete', 'Delete Projects', 'Delete projects', 'Project Management', true),
  ('projects', 'projects.tasks.manage', 'Manage Tasks', 'Manage project tasks', 'Project Management', true),
  
  -- Automation Module
  ('automation', 'automation.view', 'View Automations', 'View automation workflows', 'Automation', true),
  ('automation', 'automation.create', 'Create Automations', 'Create automation workflows', 'Automation', true),
  ('automation', 'automation.edit', 'Edit Automations', 'Edit automation workflows', 'Automation', true),
  ('automation', 'automation.delete', 'Delete Automations', 'Delete automation workflows', 'Automation', true),
  ('automation', 'automation.execute', 'Execute Automations', 'Manually trigger automations', 'Automation', true),
  
  -- Form Builder Module
  ('forms', 'forms.view', 'View Forms', 'View forms', 'Form Builder', true),
  ('forms', 'forms.create', 'Create Forms', 'Create forms', 'Form Builder', true),
  ('forms', 'forms.edit', 'Edit Forms', 'Edit forms', 'Form Builder', true),
  ('forms', 'forms.delete', 'Delete Forms', 'Delete forms', 'Form Builder', true),
  ('forms', 'forms.submissions.view', 'View Submissions', 'View form submissions', 'Form Builder', true),
  
  -- Module Builder
  ('modulebuilder', 'modulebuilder.access', 'Access Module Builder', 'Access the module builder', 'Module Builder', true),
  ('modulebuilder', 'modulebuilder.create', 'Create Modules', 'Create custom modules', 'Module Builder', true),
  ('modulebuilder', 'modulebuilder.edit', 'Edit Modules', 'Edit custom modules', 'Module Builder', true),
  ('modulebuilder', 'modulebuilder.delete', 'Delete Modules', 'Delete custom modules', 'Module Builder', true),
  
  -- Territory Management
  ('territory', 'territory.view', 'View Territories', 'View territories', 'Territory Management', true),
  ('territory', 'territory.manage', 'Manage Territories', 'Manage territories and assignments', 'Territory Management', true),
  
  -- Telegram Bulk Messaging
  ('telegram', 'telegram.view', 'View Telegram', 'View Telegram messaging', 'Telegram', true),
  ('telegram', 'telegram.send', 'Send Messages', 'Send Telegram messages', 'Telegram', true),
  ('telegram', 'telegram.bulk.send', 'Send Bulk Messages', 'Send bulk Telegram messages', 'Telegram', true),
  ('telegram', 'telegram.contacts.manage', 'Manage Contacts', 'Manage Telegram contacts', 'Telegram', true),
  
  -- Content Moderation
  ('moderation', 'moderation.view', 'View Moderation Queue', 'View content moderation queue', 'Content Moderation', true),
  ('moderation', 'moderation.approve', 'Approve Content', 'Approve flagged content', 'Content Moderation', true),
  ('moderation', 'moderation.reject', 'Reject Content', 'Reject flagged content', 'Content Moderation', true),
  ('moderation', 'moderation.settings', 'Moderation Settings', 'Configure moderation settings', 'Content Moderation', true),
  
  -- Security Module
  ('security', 'security.dashboard.view', 'View Security Dashboard', 'View security dashboard', 'Security', true),
  ('security', 'security.threats.manage', 'Manage Threats', 'Manage security threats', 'Security', true),
  ('security', 'security.firewall.manage', 'Manage Firewall', 'Manage firewall rules', 'Security', true),
  ('security', 'security.geo.manage', 'Manage Geo-blocking', 'Manage geo-blocking rules', 'Security', true),
  ('security', 'security.mfa.manage', 'Manage MFA', 'Manage MFA settings', 'Security', true),
  
  -- Billing Module
  ('billing', 'billing.view', 'View Billing', 'View billing information', 'Billing', true),
  ('billing', 'billing.manage', 'Manage Billing', 'Manage billing and subscriptions', 'Billing', true),
  ('billing', 'billing.plans.manage', 'Manage Plans', 'Manage pricing plans', 'Billing', true),
  
  -- API Management
  ('api', 'api.keys.view', 'View API Keys', 'View API keys', 'API Management', true),
  ('api', 'api.keys.create', 'Create API Keys', 'Create API keys', 'API Management', true),
  ('api', 'api.keys.delete', 'Delete API Keys', 'Delete API keys', 'API Management', true),
  ('api', 'api.integrations.manage', 'Manage Integrations', 'Manage API integrations', 'API Management', true)
ON CONFLICT (permission_key) DO NOTHING;

-- Update has_permission function to also check user_permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check role-based permissions
    SELECT 1
    FROM user_roles ur
    INNER JOIN role_permissions rp ON rp.role = ur.role
    INNER JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.permission_key = _permission_key
      AND (rp.company_id IS NULL OR rp.company_id = (SELECT company_id FROM profiles WHERE id = _user_id))
  )
  OR EXISTS (
    -- Check direct user permissions
    SELECT 1
    FROM user_permissions up
    INNER JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = _user_id
      AND p.permission_key = _permission_key
      AND up.is_active = true
      AND (up.expires_at IS NULL OR up.expires_at > now())
      AND (up.company_id IS NULL OR up.company_id = (SELECT company_id FROM profiles WHERE id = _user_id))
  )
  OR (
    -- Super admins have all permissions
    public.is_super_admin(_user_id)
  )
$$;

-- Create function to get all user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE(permission_key text, permission_name text, source text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Role-based permissions
  SELECT DISTINCT 
    p.permission_key,
    p.permission_name,
    'role:' || ur.role as source
  FROM user_roles ur
  INNER JOIN role_permissions rp ON rp.role = ur.role
  INNER JOIN permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = _user_id
    AND (rp.company_id IS NULL OR rp.company_id = (SELECT company_id FROM profiles WHERE id = _user_id))
  
  UNION
  
  -- Direct user permissions
  SELECT DISTINCT
    p.permission_key,
    p.permission_name,
    'direct' as source
  FROM user_permissions up
  INNER JOIN permissions p ON p.id = up.permission_id
  WHERE up.user_id = _user_id
    AND up.is_active = true
    AND (up.expires_at IS NULL OR up.expires_at > now())
    AND (up.company_id IS NULL OR up.company_id = (SELECT company_id FROM profiles WHERE id = _user_id))
$$;