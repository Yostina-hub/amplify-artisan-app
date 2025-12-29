import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnomalyRequest {
  action: 'check_login' | 'track_failure' | 'clear_lockout' | 'get_status';
  user_id?: string;
  email?: string;
  ip_address?: string;
  latitude?: number;
  longitude?: number;
  country_code?: string;
  city?: string;
  user_agent?: string;
  device_fingerprint?: string;
  failure_reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AnomalyRequest = await req.json();
    const { action, user_id, email, ip_address, latitude, longitude, country_code, city, user_agent, device_fingerprint, failure_reason } = body;

    const clientIp = ip_address || 
                     req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     'unknown';

    if (action === 'get_status') {
      // Get recent anomalies for user
      const { data: anomalies } = await supabase
        .from('anomaly_detections')
        .select('*')
        .eq('user_id', user_id)
        .is('resolved_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      // Check if locked out
      const identifier = email || user_id || clientIp;
      const { data: lockout } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .eq('identifier', identifier)
        .eq('is_locked', true)
        .gt('locked_until', new Date().toISOString())
        .single();

      return new Response(
        JSON.stringify({
          is_locked: !!lockout,
          locked_until: lockout?.locked_until,
          active_anomalies: anomalies?.length || 0,
          anomalies: anomalies || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'track_failure') {
      const identifier = email || user_id || clientIp;
      const identifierType = email ? 'email' : user_id ? 'user_id' : 'ip';

      const { data: result } = await supabase.rpc('track_failed_login', {
        p_identifier: identifier,
        p_identifier_type: identifierType,
        p_ip_address: clientIp,
        p_failure_reason: failure_reason || 'Unknown'
      });

      return new Response(
        JSON.stringify(result || { locked: false }),
        { 
          status: result?.locked ? 429 : 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (action === 'clear_lockout') {
      const identifier = email || user_id;
      if (!identifier) {
        return new Response(
          JSON.stringify({ error: 'Email or user_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase
        .from('failed_login_attempts')
        .update({ is_locked: false, locked_until: null, attempt_count: 0 })
        .eq('identifier', identifier);

      return new Response(
        JSON.stringify({ success: true, message: 'Lockout cleared' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check_login') {
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const anomalies: any[] = [];

      // Check for impossible travel if we have location data
      if (latitude && longitude) {
        const { data: travelResult } = await supabase.rpc('detect_impossible_travel', {
          p_user_id: user_id,
          p_latitude: latitude,
          p_longitude: longitude,
          p_country_code: country_code || 'XX',
          p_city: city || 'Unknown'
        });

        if (travelResult?.is_anomaly) {
          anomalies.push({
            type: 'impossible_travel',
            severity: travelResult.severity,
            details: travelResult
          });
        }
      }

      // Log this login
      await supabase.from('user_login_history').insert({
        user_id,
        ip_address: clientIp,
        country_code: country_code || null,
        country_name: null,
        city: city || null,
        latitude: latitude || null,
        longitude: longitude || null,
        user_agent: user_agent || req.headers.get('user-agent'),
        device_fingerprint: device_fingerprint || null,
        login_method: 'password',
        success: true
      });

      // Check for device change
      const { data: recentLogins } = await supabase
        .from('user_login_history')
        .select('device_fingerprint')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (device_fingerprint && recentLogins && recentLogins.length > 1) {
        const knownDevices = new Set(recentLogins.slice(1).map(l => l.device_fingerprint).filter(Boolean));
        if (knownDevices.size > 0 && !knownDevices.has(device_fingerprint)) {
          anomalies.push({
            type: 'device_change',
            severity: 'medium',
            details: { message: 'Login from new device' }
          });

          await supabase.from('anomaly_detections').insert({
            user_id,
            anomaly_type: 'device_change',
            severity: 'medium',
            description: 'Login from new device detected',
            details: { device_fingerprint, known_devices: Array.from(knownDevices) },
            source_ip: clientIp,
            source_country: country_code,
            source_city: city,
            action_taken: 'logged'
          });
        }
      }

      // Clear any failed attempts on successful login
      const identifier = email || user_id;
      if (identifier) {
        await supabase
          .from('failed_login_attempts')
          .update({ attempt_count: 0, is_locked: false, locked_until: null })
          .or(`identifier.eq.${identifier},identifier.eq.${clientIp}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          anomalies_detected: anomalies.length,
          anomalies,
          requires_verification: anomalies.some(a => a.severity === 'high' || a.severity === 'critical')
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AnomalyDetection] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
