-- Media Monitoring Module Schema

-- 1. Media Sources Configuration
CREATE TABLE public.media_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('social', 'website', 'rss', 'news', 'broadcast')),
  platform TEXT, -- twitter, facebook, youtube, telegram, linkedin, tiktok, instagram, etc.
  url TEXT,
  api_config JSONB DEFAULT '{}',
  crawl_config JSONB DEFAULT '{}', -- robots.txt respect, crawl depth, etc.
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5, -- 1-10, affects polling frequency
  last_fetched_at TIMESTAMPTZ,
  fetch_interval_minutes INTEGER DEFAULT 60,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- 2. Watchlists (Keywords, Accounts, Domains)
CREATE TABLE public.media_watchlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  watchlist_type TEXT NOT NULL CHECK (watchlist_type IN ('keyword', 'hashtag', 'account', 'domain', 'geo')),
  items TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  countries TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- 3. Media Mentions (Core Data)
CREATE TABLE public.media_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  source_id UUID REFERENCES public.media_sources(id),
  platform TEXT NOT NULL,
  external_id TEXT, -- Original ID from platform
  permalink TEXT,
  author_name TEXT,
  author_handle TEXT,
  author_avatar TEXT,
  author_followers INTEGER,
  author_verified BOOLEAN DEFAULT false,
  title TEXT,
  content TEXT NOT NULL,
  content_html TEXT,
  media_urls TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ NOT NULL,
  language TEXT,
  country TEXT,
  geo_location JSONB, -- lat/lng if available
  engagement_likes INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  engagement_views INTEGER DEFAULT 0,
  reach_estimate INTEGER DEFAULT 0,
  sentiment_score NUMERIC(3,2), -- -1 to 1
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral', 'mixed')),
  emotions JSONB DEFAULT '{}', -- joy, anger, fear, etc.
  entities JSONB DEFAULT '{}', -- people, orgs, locations extracted
  topics TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  matched_keywords TEXT[] DEFAULT '{}',
  credibility_score INTEGER, -- 1-100
  is_verified_source BOOLEAN DEFAULT false,
  cluster_id UUID,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of UUID,
  raw_payload JSONB,
  translated_content TEXT,
  translated_language TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Story Clusters
CREATE TABLE public.media_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  title TEXT NOT NULL,
  summary TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mention_count INTEGER DEFAULT 1,
  total_reach INTEGER DEFAULT 0,
  avg_sentiment NUMERIC(3,2),
  dominant_sentiment TEXT,
  top_entities JSONB DEFAULT '{}',
  top_sources TEXT[] DEFAULT '{}',
  is_trending BOOLEAN DEFAULT false,
  trend_velocity NUMERIC, -- mentions per hour
  peak_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Alert Rules
CREATE TABLE public.media_alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('keyword', 'spike', 'sentiment', 'source', 'entity', 'trend')),
  conditions JSONB NOT NULL, -- flexible conditions
  threshold_value NUMERIC,
  threshold_period_minutes INTEGER DEFAULT 60,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  channels TEXT[] DEFAULT '{}', -- email, sms, telegram, slack, webhook
  recipients JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 30, -- prevent alert spam
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- 6. Triggered Alerts
CREATE TABLE public.media_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  rule_id UUID REFERENCES public.media_alert_rules(id),
  mention_ids UUID[] DEFAULT '{}',
  cluster_id UUID REFERENCES public.media_clusters(id),
  title TEXT NOT NULL,
  summary TEXT,
  severity TEXT DEFAULT 'medium',
  trigger_data JSONB,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  sent_to TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Cases (Investigation Workflow)
CREATE TABLE public.media_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  case_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed', 'archived')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID,
  mention_ids UUID[] DEFAULT '{}',
  cluster_ids UUID[] DEFAULT '{}',
  alert_ids UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  resolution TEXT,
  evidence_package_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_by UUID
);

-- 8. Case Notes
CREATE TABLE public.media_case_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.media_cases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'note' CHECK (note_type IN ('note', 'action', 'evidence', 'escalation')),
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- 9. Scheduled Reports
CREATE TABLE public.media_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  report_type TEXT DEFAULT 'summary' CHECK (report_type IN ('summary', 'detailed', 'executive', 'custom')),
  schedule TEXT, -- cron expression
  filters JSONB DEFAULT '{}',
  template_id TEXT,
  recipients TEXT[] DEFAULT '{}',
  format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'csv', 'html')),
  is_active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- 10. Ingestion Jobs (for tracking)
CREATE TABLE public.media_ingestion_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  source_id UUID REFERENCES public.media_sources(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  items_fetched INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  items_new INTEGER DEFAULT 0,
  items_duplicate INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users (company-based access)
CREATE POLICY "Users can view their company media sources" ON public.media_sources FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_sources.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can manage their company media sources" ON public.media_sources FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_sources.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can view their company watchlists" ON public.media_watchlists FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_watchlists.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can manage their company watchlists" ON public.media_watchlists FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_watchlists.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can view their company mentions" ON public.media_mentions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_mentions.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can manage their company mentions" ON public.media_mentions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_mentions.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can view their company clusters" ON public.media_clusters FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_clusters.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can manage their company clusters" ON public.media_clusters FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_clusters.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can view their company alert rules" ON public.media_alert_rules FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_alert_rules.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can manage their company alert rules" ON public.media_alert_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_alert_rules.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can view their company alerts" ON public.media_alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_alerts.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can manage their company alerts" ON public.media_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_alerts.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can view their company cases" ON public.media_cases FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_cases.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can manage their company cases" ON public.media_cases FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_cases.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can view case notes" ON public.media_case_notes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM media_cases mc 
    JOIN profiles p ON p.company_id = mc.company_id 
    WHERE mc.id = media_case_notes.case_id AND p.id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can manage case notes" ON public.media_case_notes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM media_cases mc 
    JOIN profiles p ON p.company_id = mc.company_id 
    WHERE mc.id = media_case_notes.case_id AND p.id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can view their company reports" ON public.media_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_reports.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can manage their company reports" ON public.media_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_reports.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can view their company ingestion jobs" ON public.media_ingestion_jobs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_ingestion_jobs.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can manage their company ingestion jobs" ON public.media_ingestion_jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = media_ingestion_jobs.company_id)
  OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

-- Indexes for performance
CREATE INDEX idx_media_mentions_company ON public.media_mentions(company_id);
CREATE INDEX idx_media_mentions_platform ON public.media_mentions(platform);
CREATE INDEX idx_media_mentions_published ON public.media_mentions(published_at DESC);
CREATE INDEX idx_media_mentions_sentiment ON public.media_mentions(sentiment_label);
CREATE INDEX idx_media_mentions_cluster ON public.media_mentions(cluster_id);
CREATE INDEX idx_media_mentions_content_search ON public.media_mentions USING gin(to_tsvector('english', content));
CREATE INDEX idx_media_clusters_company ON public.media_clusters(company_id);
CREATE INDEX idx_media_clusters_trending ON public.media_clusters(is_trending, trend_velocity DESC);
CREATE INDEX idx_media_alerts_company ON public.media_alerts(company_id);
CREATE INDEX idx_media_cases_company ON public.media_cases(company_id);
CREATE INDEX idx_media_cases_status ON public.media_cases(status);

-- Trigger for updating timestamps
CREATE TRIGGER update_media_sources_updated_at BEFORE UPDATE ON public.media_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_watchlists_updated_at BEFORE UPDATE ON public.media_watchlists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_mentions_updated_at BEFORE UPDATE ON public.media_mentions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_alert_rules_updated_at BEFORE UPDATE ON public.media_alert_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_cases_updated_at BEFORE UPDATE ON public.media_cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate case numbers
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.case_number := 'CASE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_case_number BEFORE INSERT ON public.media_cases
FOR EACH ROW EXECUTE FUNCTION generate_case_number();