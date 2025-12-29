-- Geo-blocking configuration table
CREATE TABLE public.geo_blocking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'block' CHECK (action IN ('block', 'allow', 'challenge')),
  is_active BOOLEAN DEFAULT TRUE,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geo access logs
CREATE TABLE public.geo_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  country_code TEXT,
  country_name TEXT,
  city TEXT,
  region TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('allowed', 'blocked', 'challenged')),
  rule_id UUID REFERENCES public.geo_blocking_rules(id),
  user_agent TEXT,
  request_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global geo settings
CREATE TABLE public.geo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'allowlist' CHECK (mode IN ('allowlist', 'blocklist', 'disabled')),
  default_action TEXT NOT NULL DEFAULT 'allow' CHECK (default_action IN ('allow', 'block', 'challenge')),
  vpn_detection_enabled BOOLEAN DEFAULT FALSE,
  tor_blocking_enabled BOOLEAN DEFAULT FALSE,
  proxy_blocking_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Indexes
CREATE INDEX idx_geo_rules_company ON public.geo_blocking_rules(company_id);
CREATE INDEX idx_geo_rules_country ON public.geo_blocking_rules(country_code);
CREATE INDEX idx_geo_logs_country ON public.geo_access_logs(country_code);
CREATE INDEX idx_geo_logs_created ON public.geo_access_logs(created_at);

-- Enable RLS
ALTER TABLE public.geo_blocking_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage geo rules" ON public.geo_blocking_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view geo logs" ON public.geo_access_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert geo logs" ON public.geo_access_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage geo settings" ON public.geo_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Function to check geo access
CREATE OR REPLACE FUNCTION check_geo_access(
  p_country_code TEXT,
  p_company_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_settings RECORD;
  v_rule RECORD;
  v_result JSONB;
BEGIN
  -- Get settings (global or company-specific)
  SELECT * INTO v_settings
  FROM public.geo_settings
  WHERE company_id IS NOT DISTINCT FROM p_company_id
  LIMIT 1;

  -- If no settings or disabled, allow by default
  IF v_settings IS NULL OR v_settings.mode = 'disabled' THEN
    RETURN jsonb_build_object('allowed', true, 'action', 'allowed', 'reason', 'Geo-blocking disabled');
  END IF;

  -- Check for specific country rule
  SELECT * INTO v_rule
  FROM public.geo_blocking_rules
  WHERE country_code = p_country_code
    AND (company_id IS NOT DISTINCT FROM p_company_id)
    AND is_active = true
  LIMIT 1;

  IF v_rule IS NOT NULL THEN
    IF v_rule.action = 'block' THEN
      RETURN jsonb_build_object('allowed', false, 'action', 'blocked', 'reason', v_rule.reason, 'rule_id', v_rule.id);
    ELSIF v_rule.action = 'challenge' THEN
      RETURN jsonb_build_object('allowed', true, 'action', 'challenge', 'reason', v_rule.reason, 'rule_id', v_rule.id);
    ELSE
      RETURN jsonb_build_object('allowed', true, 'action', 'allowed', 'rule_id', v_rule.id);
    END IF;
  END IF;

  -- Apply default action based on mode
  IF v_settings.mode = 'allowlist' THEN
    -- In allowlist mode, block if no rule found
    RETURN jsonb_build_object('allowed', false, 'action', 'blocked', 'reason', 'Country not in allowlist');
  ELSE
    -- In blocklist mode, allow if no rule found
    RETURN jsonb_build_object('allowed', true, 'action', 'allowed', 'reason', 'Country not in blocklist');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;