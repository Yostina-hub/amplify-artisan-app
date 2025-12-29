import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  action: 'request' | 'verify' | 'enable' | 'disable' | 'status';
  user_id?: string;
  email?: string;
  code?: string;
  purpose?: 'login' | 'sensitive_action' | 'password_reset';
  delivery_method?: 'email' | 'sms';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: OTPRequest = await req.json();
    const { action, user_id, email, code, purpose = 'login', delivery_method = 'email' } = body;

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (action === 'status') {
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'User ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: settings } = await supabase
        .from('mfa_user_settings')
        .select('*')
        .eq('user_id', user_id)
        .single();

      return new Response(
        JSON.stringify({ 
          mfa_enabled: settings?.mfa_enabled || false,
          preferred_method: settings?.preferred_method || 'email',
          last_mfa_at: settings?.last_mfa_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'enable' || action === 'disable') {
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'User ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('mfa_user_settings')
        .upsert({
          user_id,
          mfa_enabled: action === 'enable',
          preferred_method: delivery_method,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `MFA ${action === 'enable' ? 'enabled' : 'disabled'} successfully` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'request') {
      if (!user_id && !email) {
        return new Response(
          JSON.stringify({ error: 'User ID or email required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check rate limit
      const identifier = user_id || email!;
      const { data: rateLimit } = await supabase.rpc('check_mfa_rate_limit', {
        p_identifier: identifier,
        p_identifier_type: user_id ? 'user_id' : 'email',
        p_action_type: 'request_otp'
      });

      if (!rateLimit?.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again later.',
            blocked_until: rateLimit?.blocked_until,
            remaining: 0
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate OTP code
      const { data: otpCode } = await supabase.rpc('generate_otp_code');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Get actual user_id if we only have email
      let actualUserId = user_id;
      if (!actualUserId && email) {
        const { data: userData } = await supabase.auth.admin.listUsers();
        const user = userData?.users?.find(u => u.email === email);
        if (user) actualUserId = user.id;
      }

      if (!actualUserId) {
        // Don't reveal if user exists or not
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'If the email exists, an OTP has been sent.',
            remaining: rateLimit?.remaining 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store OTP
      const { error: insertError } = await supabase
        .from('mfa_otp_codes')
        .insert({
          user_id: actualUserId,
          code: otpCode,
          delivery_method,
          purpose,
          expires_at: expiresAt.toISOString(),
          ip_address: clientIp,
          user_agent: userAgent
        });

      if (insertError) throw insertError;

      // Get user email for sending
      let userEmail = email;
      if (!userEmail && actualUserId) {
        const { data: userData } = await supabase.auth.admin.getUserById(actualUserId);
        userEmail = userData?.user?.email;
      }

      // Send OTP via email (simplified - in production use a proper email service)
      if (userEmail && delivery_method === 'email') {
        console.log(`[MFA] Sending OTP ${otpCode} to ${userEmail} for ${purpose}`);
        // In production, integrate with email service here
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully',
          expires_in: 600, // 10 minutes
          remaining: rateLimit?.remaining,
          // Only include code in development for testing
          ...(Deno.env.get('ENVIRONMENT') === 'development' && { dev_code: otpCode })
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      if (!user_id || !code) {
        return new Response(
          JSON.stringify({ error: 'User ID and code required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check rate limit for verification attempts
      const { data: rateLimit } = await supabase.rpc('check_mfa_rate_limit', {
        p_identifier: user_id,
        p_identifier_type: 'user_id',
        p_action_type: 'verify_otp'
      });

      if (!rateLimit?.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Too many verification attempts. Please request a new code.',
            blocked_until: rateLimit?.blocked_until
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find valid OTP
      const { data: otpRecord, error: otpError } = await supabase
        .from('mfa_otp_codes')
        .select('*')
        .eq('user_id', user_id)
        .eq('purpose', purpose)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid or expired code',
            remaining: rateLimit?.remaining
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check attempts
      if (otpRecord.attempts >= otpRecord.max_attempts) {
        await supabase
          .from('mfa_otp_codes')
          .update({ is_used: true })
          .eq('id', otpRecord.id);

        return new Response(
          JSON.stringify({ error: 'Maximum attempts exceeded. Please request a new code.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify code
      if (otpRecord.code !== code) {
        await supabase
          .from('mfa_otp_codes')
          .update({ attempts: otpRecord.attempts + 1 })
          .eq('id', otpRecord.id);

        return new Response(
          JSON.stringify({ 
            error: 'Invalid code',
            attempts_remaining: otpRecord.max_attempts - otpRecord.attempts - 1
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark as used
      await supabase
        .from('mfa_otp_codes')
        .update({ 
          is_used: true, 
          verified_at: new Date().toISOString() 
        })
        .eq('id', otpRecord.id);

      // Update last MFA timestamp
      await supabase
        .from('mfa_user_settings')
        .upsert({
          user_id,
          last_mfa_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Code verified successfully',
          verified_at: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[MFA] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
