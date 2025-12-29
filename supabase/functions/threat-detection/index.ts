import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThreatCheckRequest {
  ip_address: string;
  user_agent?: string;
  request_path?: string;
  user_id?: string;
  company_id?: string;
  honeypot_data?: {
    field_name: string;
    field_value: string;
    form_name?: string;
    page_url?: string;
  };
  behavioral_data?: {
    session_id?: string;
    pattern_type: string;
    pattern_data: Record<string, any>;
  };
}

interface ThreatResponse {
  allowed: boolean;
  action: 'allow' | 'warn' | 'challenge' | 'throttle' | 'block';
  reason?: string;
  reputation_score?: number;
  threats_detected?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ThreatCheckRequest = await req.json();
    const { ip_address, user_agent, request_path, user_id, company_id, honeypot_data, behavioral_data } = body;

    if (!ip_address) {
      return new Response(
        JSON.stringify({ error: 'IP address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[TDRS] Checking threat for IP: ${ip_address}`);

    const threats_detected: string[] = [];
    let action: 'allow' | 'warn' | 'challenge' | 'throttle' | 'block' = 'allow';
    let reason = '';

    // 1. Check IP reputation
    const { data: ipRep } = await supabase
      .from('ip_reputation')
      .select('*')
      .eq('ip_address', ip_address)
      .single();

    let reputation_score = ipRep?.reputation_score ?? 100;

    if (ipRep?.is_blocked) {
      if (ipRep.blocked_until && new Date(ipRep.blocked_until) > new Date()) {
        console.log(`[TDRS] IP ${ip_address} is blocked until ${ipRep.blocked_until}`);
        return new Response(
          JSON.stringify({
            allowed: false,
            action: 'block',
            reason: ipRep.blocked_reason || 'IP is blocked',
            reputation_score: 0,
            threats_detected: ['blocked_ip']
          } as ThreatResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Check honeypot (if data provided)
    if (honeypot_data && honeypot_data.field_value && honeypot_data.field_value.trim() !== '') {
      console.log(`[TDRS] Honeypot triggered by IP ${ip_address}`);
      threats_detected.push('honeypot');
      reputation_score = Math.max(0, reputation_score - 50);
      action = 'block';
      reason = 'Bot detected via honeypot';

      // Log honeypot interaction
      await supabase.from('honeypot_interactions').insert({
        ip_address,
        user_agent,
        honeypot_field: honeypot_data.field_name,
        field_value: honeypot_data.field_value,
        page_url: honeypot_data.page_url,
        form_name: honeypot_data.form_name
      });

      // Record threat
      await supabase.from('threat_detections').insert({
        ip_address,
        user_id,
        company_id,
        threat_type: 'honeypot',
        severity: 'high',
        action_taken: 'block',
        details: { honeypot_data },
        user_agent,
        request_path
      });
    }

    // 3. Check behavioral patterns (if data provided)
    if (behavioral_data) {
      const { session_id, pattern_type, pattern_data } = behavioral_data;
      
      // Calculate risk score based on pattern
      let risk_score = 0;
      
      // Check for bot-like behavior
      if (pattern_data.mouse_movements === 0 && pattern_data.keystrokes === 0) {
        risk_score += 40;
        threats_detected.push('no_human_interaction');
      }
      
      // Check for impossibly fast form completion
      if (pattern_data.form_fill_time && pattern_data.form_fill_time < 2000) {
        risk_score += 30;
        threats_detected.push('fast_form_submission');
      }

      // Check for unusual request patterns
      if (pattern_data.requests_per_minute && pattern_data.requests_per_minute > 60) {
        risk_score += 40;
        threats_detected.push('high_request_rate');
      }

      if (risk_score > 0) {
        await supabase.from('behavioral_patterns').insert({
          ip_address,
          user_id,
          session_id,
          pattern_type,
          pattern_data,
          risk_score
        });

        if (risk_score >= 70) {
          action = 'block';
          reason = 'Suspicious behavioral pattern detected';
          reputation_score = Math.max(0, reputation_score - 30);
        } else if (risk_score >= 40) {
          action = 'challenge';
          reason = reason || 'Unusual behavior detected';
          reputation_score = Math.max(0, reputation_score - 15);
        } else if (risk_score >= 20) {
          action = 'warn';
          reason = reason || 'Minor behavioral anomaly';
          reputation_score = Math.max(0, reputation_score - 5);
        }
      }
    }

    // 4. Check rate limiting
    const windowStart = new Date(Date.now() - 60000).toISOString(); // 1 minute window
    const { data: recentRequests, count } = await supabase
      .from('rate_limit_tracking')
      .select('*', { count: 'exact' })
      .eq('identifier', ip_address)
      .eq('endpoint', request_path || 'general')
      .gte('window_start', windowStart);

    const requestCount = count || 0;
    const rateLimit = 100; // 100 requests per minute

    if (requestCount > rateLimit) {
      threats_detected.push('rate_limit_exceeded');
      action = 'throttle';
      reason = 'Rate limit exceeded';
      reputation_score = Math.max(0, reputation_score - 10);

      await supabase.from('threat_detections').insert({
        ip_address,
        user_id,
        company_id,
        threat_type: 'rate_limit',
        severity: 'medium',
        action_taken: 'throttle',
        details: { request_count: requestCount, limit: rateLimit },
        user_agent,
        request_path
      });
    }

    // Track this request
    await supabase.from('rate_limit_tracking').insert({
      identifier: ip_address,
      identifier_type: 'ip',
      endpoint: request_path || 'general',
      window_start: new Date().toISOString(),
      window_end: new Date(Date.now() + 60000).toISOString()
    });

    // 5. Update IP reputation
    if (ipRep) {
      await supabase
        .from('ip_reputation')
        .update({
          reputation_score,
          total_requests: (ipRep.total_requests || 0) + 1,
          suspicious_requests: threats_detected.length > 0 
            ? (ipRep.suspicious_requests || 0) + 1 
            : ipRep.suspicious_requests,
          last_seen_at: new Date().toISOString(),
          is_blocked: action === 'block',
          blocked_reason: action === 'block' ? reason : null,
          blocked_until: action === 'block' ? new Date(Date.now() + 3600000).toISOString() : null // 1 hour block
        })
        .eq('id', ipRep.id);
    } else {
      await supabase.from('ip_reputation').insert({
        ip_address,
        reputation_score,
        total_requests: 1,
        suspicious_requests: threats_detected.length > 0 ? 1 : 0,
        is_blocked: action === 'block',
        blocked_reason: action === 'block' ? reason : null,
        blocked_until: action === 'block' ? new Date(Date.now() + 3600000).toISOString() : null
      });
    }

    // Record any detected threats
    if (threats_detected.length > 0 && action !== 'allow' && !threats_detected.includes('honeypot')) {
      const severity = action === 'block' ? 'critical' : action === 'throttle' ? 'high' : action === 'challenge' ? 'medium' : 'low';
      
      await supabase.from('threat_detections').insert({
        ip_address,
        user_id,
        company_id,
        threat_type: 'anomaly',
        severity,
        action_taken: action,
        details: { threats_detected, behavioral_data },
        user_agent,
        request_path
      });
    }

    const response: ThreatResponse = {
      allowed: action === 'allow' || action === 'warn',
      action,
      reason: reason || undefined,
      reputation_score,
      threats_detected: threats_detected.length > 0 ? threats_detected : undefined
    };

    console.log(`[TDRS] Result for IP ${ip_address}: ${action}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[TDRS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
