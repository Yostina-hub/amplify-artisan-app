
-- SocialHub Analytics Foundation Schema

-- Analytics Tenants (extends companies with analytics-specific settings)
CREATE TABLE public.analytics_tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  fiscal_year_start INTEGER DEFAULT 1,
  language TEXT DEFAULT 'en',
  data_retention_days INTEGER DEFAULT 1095,
  features_enabled JSONB DEFAULT '{"segmentation": true, "recommendations": true, "forecasting": false, "ml_segments": false}'::jsonb,
  industry_template TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- KPI Definitions (configurable metrics)
CREATE TABLE public.analytics_kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  calculation_type TEXT NOT NULL DEFAULT 'count',
  source_table TEXT NOT NULL,
  source_field TEXT,
  aggregation TEXT DEFAULT 'sum',
  filters JSONB DEFAULT '{}'::jsonb,
  time_granularity TEXT[] DEFAULT ARRAY['daily', 'weekly', 'monthly'],
  display_format TEXT DEFAULT 'number',
  unit TEXT,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- KPI Values (time-series aggregated facts)
CREATE TABLE public.analytics_kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  kpi_id UUID REFERENCES public.analytics_kpi_definitions(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  granularity TEXT NOT NULL DEFAULT 'daily',
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  change_percent NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, kpi_id, branch_id, period_start, granularity)
);

-- Segments (rule-based customer/user grouping)
CREATE TABLE public.analytics_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  segment_type TEXT DEFAULT 'rule_based',
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  member_count INTEGER DEFAULT 0,
  value_metrics JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Segment Members (cached segment membership)
CREATE TABLE public.analytics_segment_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES public.analytics_segments(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'contact',
  entity_id UUID NOT NULL,
  score NUMERIC,
  joined_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(segment_id, entity_type, entity_id)
);

-- Dashboard Templates
CREATE TABLE public.analytics_dashboard_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT DEFAULT 'general',
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_kpis UUID[] DEFAULT ARRAY[]::UUID[],
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Dashboards (customized per user/company)
CREATE TABLE public.analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.analytics_dashboard_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recommendations (rule-based decision support)
CREATE TABLE public.analytics_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reason TEXT,
  suggested_action TEXT,
  expected_impact TEXT,
  priority TEXT DEFAULT 'medium',
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending',
  kpi_id UUID REFERENCES public.analytics_kpi_definitions(id) ON DELETE SET NULL,
  segment_id UUID REFERENCES public.analytics_segments(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES auth.users(id),
  actioned_at TIMESTAMPTZ,
  actioned_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alert Rules (threshold-based triggers)
CREATE TABLE public.analytics_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  kpi_id UUID REFERENCES public.analytics_kpi_definitions(id) ON DELETE CASCADE NOT NULL,
  condition_type TEXT NOT NULL DEFAULT 'threshold',
  condition_operator TEXT NOT NULL DEFAULT 'lt',
  threshold_value NUMERIC NOT NULL,
  threshold_percent NUMERIC,
  comparison_period TEXT DEFAULT 'previous_period',
  severity TEXT DEFAULT 'warning',
  notification_channels TEXT[] DEFAULT ARRAY['in_app'],
  is_active BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 60,
  last_triggered_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Alert Instances (triggered alerts)
CREATE TABLE public.analytics_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES public.analytics_alert_rules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  current_value NUMERIC,
  threshold_value NUMERIC,
  status TEXT DEFAULT 'active',
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Data Ingestion Jobs
CREATE TABLE public.analytics_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL,
  source_config JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Analytics Audit Log
CREATE TABLE public.analytics_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Report Exports
CREATE TABLE public.analytics_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  dashboard_id UUID REFERENCES public.analytics_dashboards(id) ON DELETE SET NULL,
  export_type TEXT NOT NULL DEFAULT 'pdf',
  file_name TEXT,
  file_url TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Scheduled Reports
CREATE TABLE public.analytics_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  dashboard_id UUID REFERENCES public.analytics_dashboards(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  schedule_cron TEXT NOT NULL,
  export_format TEXT DEFAULT 'pdf',
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  notification_channels TEXT[] DEFAULT ARRAY['email'],
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_dashboard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_scheduled_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY "Users can view own company analytics settings" ON public.analytics_tenant_settings
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own company KPI definitions" ON public.analytics_kpi_definitions
  FOR SELECT USING (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage KPI definitions" ON public.analytics_kpi_definitions
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own company KPI values" ON public.analytics_kpi_values
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own company segments" ON public.analytics_segments
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view segment members" ON public.analytics_segment_members
  FOR SELECT USING (
    segment_id IN (SELECT id FROM public.analytics_segments WHERE company_id = public.get_user_company_id(auth.uid()))
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Anyone can view dashboard templates" ON public.analytics_dashboard_templates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage dashboard templates" ON public.analytics_dashboard_templates
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own company dashboards" ON public.analytics_dashboards
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own company recommendations" ON public.analytics_recommendations
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own company alert rules" ON public.analytics_alert_rules
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own company alerts" ON public.analytics_alerts
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own company ingestion jobs" ON public.analytics_ingestion_jobs
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own company audit log" ON public.analytics_audit_log
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "System can insert audit logs" ON public.analytics_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own company exports" ON public.analytics_exports
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own company scheduled reports" ON public.analytics_scheduled_reports
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_analytics_kpi_values_company_period ON public.analytics_kpi_values(company_id, period_start);
CREATE INDEX idx_analytics_kpi_values_kpi ON public.analytics_kpi_values(kpi_id);
CREATE INDEX idx_analytics_segments_company ON public.analytics_segments(company_id);
CREATE INDEX idx_analytics_segment_members_segment ON public.analytics_segment_members(segment_id);
CREATE INDEX idx_analytics_recommendations_company ON public.analytics_recommendations(company_id, status);
CREATE INDEX idx_analytics_alerts_company ON public.analytics_alerts(company_id, status);
CREATE INDEX idx_analytics_audit_log_company ON public.analytics_audit_log(company_id, created_at);

-- Insert default KPI definitions (system-wide)
INSERT INTO public.analytics_kpi_definitions (name, description, category, calculation_type, source_table, source_field, aggregation, is_system) VALUES
('Total Users', 'Total number of registered users', 'users', 'count', 'profiles', 'id', 'count', true),
('Active Users', 'Users active in the period', 'users', 'count', 'user_engagement', 'user_id', 'count_distinct', true),
('Total Leads', 'Total number of leads', 'sales', 'count', 'leads', 'id', 'count', true),
('Leads Converted', 'Leads converted to customers', 'sales', 'count', 'leads', 'id', 'count', true),
('Total Contacts', 'Total contacts in CRM', 'crm', 'count', 'contacts', 'id', 'count', true),
('Social Posts', 'Total social media posts', 'social', 'count', 'social_media_posts', 'id', 'count', true),
('Email Campaigns', 'Email campaigns sent', 'marketing', 'count', 'email_campaigns', 'id', 'count', true),
('Support Tickets', 'Total support tickets', 'support', 'count', 'support_tickets', 'id', 'count', true),
('Ticket Resolution Rate', 'Percentage of resolved tickets', 'support', 'percentage', 'support_tickets', 'status', 'percentage', true),
('Ad Impressions', 'Total ad impressions', 'advertising', 'sum', 'ad_impressions', 'id', 'count', true);

-- Insert default dashboard template
INSERT INTO public.analytics_dashboard_templates (name, description, industry, layout, is_system) VALUES
('General Overview', 'Standard business overview dashboard', 'general', 
'[
  {"type": "kpi_card", "kpi": "Total Users", "position": {"x": 0, "y": 0, "w": 3, "h": 1}},
  {"type": "kpi_card", "kpi": "Active Users", "position": {"x": 3, "y": 0, "w": 3, "h": 1}},
  {"type": "kpi_card", "kpi": "Total Leads", "position": {"x": 6, "y": 0, "w": 3, "h": 1}},
  {"type": "kpi_card", "kpi": "Total Contacts", "position": {"x": 9, "y": 0, "w": 3, "h": 1}},
  {"type": "line_chart", "kpi": "Active Users", "position": {"x": 0, "y": 1, "w": 6, "h": 2}},
  {"type": "bar_chart", "kpi": "Total Leads", "position": {"x": 6, "y": 1, "w": 6, "h": 2}}
]'::jsonb, true);
