-- Anomaly detection events
CREATE TABLE public.anomaly_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('impossible_travel', 'brute_force', 'velocity_anomaly', 'device_change', 'time_anomaly', 'behavioral')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence_score NUMERIC DEFAULT 0,
  description TEXT,
  details JSONB DEFAULT '{}',
  source_ip INET,
  source_country TEXT,
  source_city TEXT,
  previous_ip INET,
  previous_country TEXT,
  previous_city TEXT,
  distance_km NUMERIC,
  time_diff_minutes INTEGER,
  action_taken TEXT CHECK (action_taken IN ('logged', 'alerted', 'challenged', 'blocked', 'session_terminated')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  is_false_positive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User login history for travel detection
CREATE TABLE public.user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address INET,
  country_code TEXT,
  country_name TEXT,
  city TEXT,
  region TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  user_agent TEXT,
  device_fingerprint TEXT,
  login_method TEXT,
  success BOOLEAN DEFAULT TRUE,
  failure_reason TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Failed login attempts tracking
CREATE TABLE public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL DEFAULT 'email' CHECK (identifier_type IN ('email', 'ip', 'user_id')),
  ip_address INET,
  user_agent TEXT,
  failure_reason TEXT,
  attempt_count INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_locked BOOLEAN DEFAULT FALSE,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_anomaly_user ON public.anomaly_detections(user_id);
CREATE INDEX idx_anomaly_type ON public.anomaly_detections(anomaly_type);
CREATE INDEX idx_anomaly_created ON public.anomaly_detections(created_at);
CREATE INDEX idx_login_history_user ON public.user_login_history(user_id);
CREATE INDEX idx_login_history_created ON public.user_login_history(created_at);
CREATE INDEX idx_failed_login_identifier ON public.failed_login_attempts(identifier, identifier_type);

-- Enable RLS
ALTER TABLE public.anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage anomalies" ON public.anomaly_detections
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own anomalies" ON public.anomaly_detections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert anomalies" ON public.anomaly_detections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view login history" ON public.user_login_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own history" ON public.user_login_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert login history" ON public.user_login_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage failed attempts" ON public.failed_login_attempts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage failed attempts" ON public.failed_login_attempts
  FOR ALL USING (true);

-- Function to calculate distance between coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 NUMERIC, lon1 NUMERIC,
  lat2 NUMERIC, lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  R NUMERIC := 6371; -- Earth radius in km
  dLat NUMERIC;
  dLon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);
  
  a := SIN(dLat/2) * SIN(dLat/2) + 
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
       SIN(dLon/2) * SIN(dLon/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to detect impossible travel
CREATE OR REPLACE FUNCTION detect_impossible_travel(
  p_user_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_country_code TEXT,
  p_city TEXT
) RETURNS JSONB AS $$
DECLARE
  v_last_login RECORD;
  v_distance NUMERIC;
  v_time_diff INTEGER;
  v_max_speed NUMERIC := 1000; -- Max realistic speed km/h (airplane)
  v_required_hours NUMERIC;
BEGIN
  -- Get last login location
  SELECT * INTO v_last_login
  FROM public.user_login_history
  WHERE user_id = p_user_id
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_login IS NULL THEN
    RETURN jsonb_build_object('is_anomaly', false, 'reason', 'First login');
  END IF;

  -- Calculate distance
  v_distance := calculate_distance_km(
    v_last_login.latitude, v_last_login.longitude,
    p_latitude, p_longitude
  );

  IF v_distance IS NULL OR v_distance < 50 THEN
    RETURN jsonb_build_object('is_anomaly', false, 'reason', 'Same location or nearby');
  END IF;

  -- Calculate time difference in minutes
  v_time_diff := EXTRACT(EPOCH FROM (NOW() - v_last_login.created_at)) / 60;

  -- Calculate required hours to travel this distance
  v_required_hours := v_distance / v_max_speed;

  -- If time to travel is less than required, it's impossible travel
  IF v_time_diff < (v_required_hours * 60) THEN
    -- Log the anomaly
    INSERT INTO public.anomaly_detections (
      user_id, anomaly_type, severity, confidence_score, description,
      details, source_country, source_city, 
      previous_country, previous_city,
      distance_km, time_diff_minutes, action_taken
    ) VALUES (
      p_user_id, 'impossible_travel', 
      CASE 
        WHEN v_distance > 5000 THEN 'critical'
        WHEN v_distance > 2000 THEN 'high'
        ELSE 'medium'
      END,
      LEAST(100, (v_distance / v_time_diff) * 10),
      'Login from ' || COALESCE(p_city, p_country_code) || ' after being in ' || 
      COALESCE(v_last_login.city, v_last_login.country_code) || ' ' || v_time_diff || ' minutes ago',
      jsonb_build_object(
        'required_hours', v_required_hours,
        'actual_minutes', v_time_diff,
        'speed_required', v_distance / (v_time_diff / 60.0)
      ),
      p_country_code, p_city,
      v_last_login.country_code, v_last_login.city,
      v_distance, v_time_diff, 'alerted'
    );

    RETURN jsonb_build_object(
      'is_anomaly', true,
      'reason', 'Impossible travel detected',
      'distance_km', v_distance,
      'time_diff_minutes', v_time_diff,
      'severity', CASE 
        WHEN v_distance > 5000 THEN 'critical'
        WHEN v_distance > 2000 THEN 'high'
        ELSE 'medium'
      END
    );
  END IF;

  RETURN jsonb_build_object('is_anomaly', false, 'distance_km', v_distance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to track failed logins and detect brute force
CREATE OR REPLACE FUNCTION track_failed_login(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_ip_address INET,
  p_failure_reason TEXT
) RETURNS JSONB AS $$
DECLARE
  v_record RECORD;
  v_threshold INTEGER := 5;
  v_lockout_minutes INTEGER := 30;
BEGIN
  -- Get or create failed attempt record
  SELECT * INTO v_record
  FROM public.failed_login_attempts
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND first_attempt_at > NOW() - INTERVAL '30 minutes';

  IF v_record IS NULL THEN
    INSERT INTO public.failed_login_attempts (
      identifier, identifier_type, ip_address, failure_reason
    ) VALUES (
      p_identifier, p_identifier_type, p_ip_address, p_failure_reason
    );
    RETURN jsonb_build_object('locked', false, 'attempts', 1, 'remaining', v_threshold - 1);
  END IF;

  -- Check if already locked
  IF v_record.is_locked AND v_record.locked_until > NOW() THEN
    RETURN jsonb_build_object(
      'locked', true, 
      'locked_until', v_record.locked_until,
      'reason', 'Account temporarily locked due to too many failed attempts'
    );
  END IF;

  -- Increment attempt count
  UPDATE public.failed_login_attempts
  SET attempt_count = attempt_count + 1,
      last_attempt_at = NOW(),
      is_locked = (attempt_count + 1) >= v_threshold,
      locked_until = CASE 
        WHEN (attempt_count + 1) >= v_threshold 
        THEN NOW() + (v_lockout_minutes || ' minutes')::INTERVAL
        ELSE NULL
      END
  WHERE id = v_record.id;

  IF v_record.attempt_count + 1 >= v_threshold THEN
    -- Log brute force anomaly
    INSERT INTO public.anomaly_detections (
      anomaly_type, severity, description, details, source_ip, action_taken
    ) VALUES (
      'brute_force', 'high',
      'Brute force attack detected on ' || p_identifier_type || ': ' || p_identifier,
      jsonb_build_object('attempts', v_record.attempt_count + 1, 'identifier', p_identifier),
      p_ip_address, 'blocked'
    );

    RETURN jsonb_build_object(
      'locked', true, 
      'locked_until', NOW() + (v_lockout_minutes || ' minutes')::INTERVAL,
      'reason', 'Account locked due to too many failed attempts'
    );
  END IF;

  RETURN jsonb_build_object(
    'locked', false, 
    'attempts', v_record.attempt_count + 1, 
    'remaining', v_threshold - v_record.attempt_count - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;