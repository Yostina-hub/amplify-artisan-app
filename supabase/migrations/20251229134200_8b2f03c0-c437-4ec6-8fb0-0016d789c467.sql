-- MFA OTP codes table
CREATE TABLE public.mfa_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  delivery_method TEXT NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email', 'sms')),
  purpose TEXT NOT NULL DEFAULT 'login' CHECK (purpose IN ('login', 'sensitive_action', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  is_used BOOLEAN DEFAULT FALSE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MFA settings per user
CREATE TABLE public.mfa_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  preferred_method TEXT DEFAULT 'email' CHECK (preferred_method IN ('email', 'sms', 'authenticator')),
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[],
  last_mfa_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MFA rate limiting table
CREATE TABLE public.mfa_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL DEFAULT 'user_id' CHECK (identifier_type IN ('user_id', 'ip', 'email')),
  action_type TEXT NOT NULL CHECK (action_type IN ('request_otp', 'verify_otp')),
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_minutes INTEGER DEFAULT 15,
  max_requests INTEGER DEFAULT 3,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_mfa_otp_user_id ON public.mfa_otp_codes(user_id);
CREATE INDEX idx_mfa_otp_expires ON public.mfa_otp_codes(expires_at);
CREATE INDEX idx_mfa_rate_limits_identifier ON public.mfa_rate_limits(identifier, action_type);
CREATE INDEX idx_mfa_settings_user ON public.mfa_user_settings(user_id);

-- Enable RLS
ALTER TABLE public.mfa_otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for mfa_otp_codes (users can only see their own)
CREATE POLICY "Users can view own OTP codes" ON public.mfa_otp_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert OTP codes" ON public.mfa_otp_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update OTP codes" ON public.mfa_otp_codes
  FOR UPDATE USING (true);

-- RLS policies for mfa_user_settings
CREATE POLICY "Users can view own MFA settings" ON public.mfa_user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own MFA settings" ON public.mfa_user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MFA settings" ON public.mfa_user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all MFA data
CREATE POLICY "Admins can view all OTP codes" ON public.mfa_otp_codes
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all MFA settings" ON public.mfa_user_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view rate limits" ON public.mfa_rate_limits
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_mfa_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_action_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_limit RECORD;
  v_max_requests INTEGER;
  v_window_minutes INTEGER;
BEGIN
  -- Set limits based on action type
  IF p_action_type = 'request_otp' THEN
    v_max_requests := 3;
    v_window_minutes := 15;
  ELSE
    v_max_requests := 5;
    v_window_minutes := 15;
  END IF;

  -- Get or create rate limit record
  SELECT * INTO v_limit
  FROM public.mfa_rate_limits
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND action_type = p_action_type
    AND window_start > NOW() - (v_window_minutes || ' minutes')::INTERVAL;

  IF v_limit IS NULL THEN
    -- Create new rate limit window
    INSERT INTO public.mfa_rate_limits (identifier, identifier_type, action_type, max_requests, window_minutes)
    VALUES (p_identifier, p_identifier_type, p_action_type, v_max_requests, v_window_minutes);
    
    RETURN jsonb_build_object('allowed', true, 'remaining', v_max_requests - 1);
  END IF;

  -- Check if blocked
  IF v_limit.is_blocked AND v_limit.blocked_until > NOW() THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'remaining', 0, 
      'blocked_until', v_limit.blocked_until,
      'reason', 'Rate limit exceeded'
    );
  END IF;

  -- Check if limit exceeded
  IF v_limit.request_count >= v_max_requests THEN
    UPDATE public.mfa_rate_limits
    SET is_blocked = true, blocked_until = NOW() + INTERVAL '15 minutes'
    WHERE id = v_limit.id;
    
    RETURN jsonb_build_object(
      'allowed', false, 
      'remaining', 0, 
      'blocked_until', NOW() + INTERVAL '15 minutes',
      'reason', 'Rate limit exceeded'
    );
  END IF;

  -- Increment counter
  UPDATE public.mfa_rate_limits
  SET request_count = request_count + 1, updated_at = NOW()
  WHERE id = v_limit.id;

  RETURN jsonb_build_object('allowed', true, 'remaining', v_max_requests - v_limit.request_count - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;