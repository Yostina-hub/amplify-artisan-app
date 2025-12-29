-- TDRS (Threat Detection & Response System) Tables

-- Threat types enum
CREATE TYPE public.threat_type AS ENUM ('bot', 'brute_force', 'suspicious_ip', 'anomaly', 'honeypot', 'rate_limit');

-- Threat response actions enum
CREATE TYPE public.threat_action AS ENUM ('warn', 'challenge', 'throttle', 'block');

-- Threat severity levels
CREATE TYPE public.threat_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Main threat detection table
CREATE TABLE public.threat_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  threat_type threat_type NOT NULL,
  severity threat_severity NOT NULL DEFAULT 'low',
  action_taken threat_action NOT NULL DEFAULT 'warn',
  details JSONB DEFAULT '{}',
  user_agent TEXT,
  request_path TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IP reputation scores table
CREATE TABLE public.ip_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reputation_score INTEGER DEFAULT 100 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  blocked_until TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0,
  suspicious_requests INTEGER DEFAULT 0,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Honeypot interactions table
CREATE TABLE public.honeypot_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_agent TEXT,
  honeypot_field TEXT NOT NULL,
  field_value TEXT,
  page_url TEXT,
  form_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Behavioral patterns table
CREATE TABLE public.behavioral_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}',
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting tracking table
CREATE TABLE public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL DEFAULT 'ip',
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ,
  is_exceeded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_threat_detections_ip ON public.threat_detections(ip_address);
CREATE INDEX idx_threat_detections_created ON public.threat_detections(created_at DESC);
CREATE INDEX idx_threat_detections_severity ON public.threat_detections(severity);
CREATE INDEX idx_ip_reputation_ip ON public.ip_reputation(ip_address);
CREATE INDEX idx_ip_reputation_blocked ON public.ip_reputation(is_blocked);
CREATE INDEX idx_honeypot_ip ON public.honeypot_interactions(ip_address);
CREATE INDEX idx_behavioral_patterns_ip ON public.behavioral_patterns(ip_address);
CREATE INDEX idx_rate_limit_identifier ON public.rate_limit_tracking(identifier, endpoint);

-- Enable RLS
ALTER TABLE public.threat_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honeypot_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can access threat detection data
CREATE POLICY "Admins can view all threat detections"
ON public.threat_detections FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage threat detections"
ON public.threat_detections FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view IP reputation"
ON public.ip_reputation FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage IP reputation"
ON public.ip_reputation FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view honeypot interactions"
ON public.honeypot_interactions FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view behavioral patterns"
ON public.behavioral_patterns FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view rate limits"
ON public.rate_limit_tracking FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Trigger for updating updated_at
CREATE TRIGGER update_threat_detections_updated_at
BEFORE UPDATE ON public.threat_detections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ip_reputation_updated_at
BEFORE UPDATE ON public.ip_reputation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();