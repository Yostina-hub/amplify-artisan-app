-- Session Fingerprinting Table
CREATE TABLE IF NOT EXISTS public.session_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  fingerprint_data JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  is_trusted BOOLEAN DEFAULT false,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session validation logs
CREATE TABLE IF NOT EXISTS public.session_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  old_fingerprint TEXT,
  new_fingerprint TEXT,
  validation_result TEXT CHECK (validation_result IN ('valid', 'mismatch', 'new_device', 'suspicious')),
  action_taken TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Strong password requirements configuration
CREATE TABLE IF NOT EXISTS public.password_policy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  min_length INTEGER DEFAULT 12,
  require_uppercase BOOLEAN DEFAULT true,
  require_lowercase BOOLEAN DEFAULT true,
  require_numbers BOOLEAN DEFAULT true,
  require_special_chars BOOLEAN DEFAULT true,
  min_special_chars INTEGER DEFAULT 1,
  max_repeated_chars INTEGER DEFAULT 3,
  prevent_common_passwords BOOLEAN DEFAULT true,
  prevent_username_in_password BOOLEAN DEFAULT true,
  password_history_count INTEGER DEFAULT 5,
  max_age_days INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

-- Password history for preventing reuse
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_fingerprints_user ON public.session_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_session_fingerprints_session ON public.session_fingerprints(session_id);
CREATE INDEX IF NOT EXISTS idx_session_fingerprints_hash ON public.session_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_session_validation_user ON public.session_validation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON public.password_history(user_id);

-- Enable RLS
ALTER TABLE public.session_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_policy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_fingerprints
DROP POLICY IF EXISTS "Users can view own fingerprints" ON public.session_fingerprints;
CREATE POLICY "Users can view own fingerprints" ON public.session_fingerprints
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all fingerprints" ON public.session_fingerprints;
CREATE POLICY "Admins can view all fingerprints" ON public.session_fingerprints
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert fingerprints" ON public.session_fingerprints;
CREATE POLICY "System can insert fingerprints" ON public.session_fingerprints
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete fingerprints" ON public.session_fingerprints;
CREATE POLICY "Admins can delete fingerprints" ON public.session_fingerprints
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- RLS Policies for session_validation_logs
DROP POLICY IF EXISTS "Admins can view validation logs" ON public.session_validation_logs;
CREATE POLICY "Admins can view validation logs" ON public.session_validation_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert validation logs" ON public.session_validation_logs;
CREATE POLICY "System can insert validation logs" ON public.session_validation_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS Policies for password_policy_settings
DROP POLICY IF EXISTS "Admins can manage password policies" ON public.password_policy_settings;
CREATE POLICY "Admins can manage password policies" ON public.password_policy_settings
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view password policies" ON public.password_policy_settings;
CREATE POLICY "Users can view password policies" ON public.password_policy_settings
  FOR SELECT TO authenticated
  USING (true);

-- RLS Policies for password_history (system only - no direct user access)
DROP POLICY IF EXISTS "System manages password history" ON public.password_history;
CREATE POLICY "System manages password history" ON public.password_history
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- Insert default password policy if not exists
INSERT INTO public.password_policy_settings (company_id) 
SELECT NULL WHERE NOT EXISTS (SELECT 1 FROM public.password_policy_settings WHERE company_id IS NULL);

-- Common passwords list function
CREATE OR REPLACE FUNCTION public.is_common_password(p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  common_passwords TEXT[] := ARRAY[
    'password', 'password1', 'password123', '123456', '12345678', '123456789',
    'qwerty', 'abc123', 'monkey', '1234567', 'letmein', 'trustno1', 
    'dragon', 'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'passw0rd', 'shadow', '123123', '654321', 'superman', 'qazwsx',
    'michael', 'football', 'password1', 'password12', 'princess', 'admin'
  ];
BEGIN
  RETURN LOWER(p_password) = ANY(common_passwords);
END;
$$;

-- Add additional columns to security_audit_log if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_audit_log' AND column_name = 'severity') THEN
    ALTER TABLE public.security_audit_log ADD COLUMN severity TEXT DEFAULT 'info';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_audit_log' AND column_name = 'category') THEN
    ALTER TABLE public.security_audit_log ADD COLUMN category TEXT DEFAULT 'general';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_audit_log' AND column_name = 'ip_address') THEN
    ALTER TABLE public.security_audit_log ADD COLUMN ip_address INET;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_audit_log' AND column_name = 'session_id') THEN
    ALTER TABLE public.security_audit_log ADD COLUMN session_id TEXT;
  END IF;
END $$;

-- Add RLS policy for security_audit_log if not exists
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.security_audit_log;
CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;
CREATE POLICY "System can insert audit logs" ON public.security_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);