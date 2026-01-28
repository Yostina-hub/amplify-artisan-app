import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[reset-user-password] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.log('[reset-user-password] Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role, company_id')
      .eq('user_id', user.id);

    const adminRole = roles?.find(r => r.role === 'admin');
    if (!adminRole) {
      console.log(`[reset-user-password] Unauthorized - non-admin user ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = !adminRole.company_id;
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target user's profile to verify company access
    const { data: targetProfile } = await supabaseClient
      .from('profiles')
      .select('company_id, email')
      .eq('id', userId)
      .single();

    if (!targetProfile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Company admins can only reset passwords for users in their company
    if (!isSuperAdmin) {
      const { data: adminProfile } = await supabaseClient
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (adminProfile?.company_id !== targetProfile.company_id) {
        console.log(`[reset-user-password] Cross-company password reset attempt by user ${user.id}`);
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Can only reset passwords for users in your company' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate a new temporary password
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const newPassword = generateTempPassword();

    // Update the user's password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(userId, {
      password: newPassword,
      user_metadata: {
        requires_password_change: true
      }
    });

    if (updateError) {
      console.log(`[reset-user-password] Failed to reset password: ${updateError.message}`);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[reset-user-password] Password reset successfully for user ${userId}`);

    // Log the password reset
    await supabaseClient.from('security_audit_log').insert({
      user_id: user.id,
      action: 'PASSWORD_RESET_BY_ADMIN',
      table_name: 'users',
      record_id: userId,
      severity: 'info',
      details: { 
        target_user_email: targetProfile.email,
        reset_by: user.email
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        temporaryPassword: newPassword,
        message: 'Password reset successfully. User will be required to change it on next login.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[reset-user-password] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
