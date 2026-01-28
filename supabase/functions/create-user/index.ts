import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

// In-memory rate limiting store (per edge function instance)
const rateLimitStore = new Map<string, { count: number; windowStart: number; blockedUntil: number | null }>();

const RATE_LIMIT_CONFIG = {
  maxRequests: 5,        // Max 5 user creations per window
  windowMs: 300000,      // 5 minutes
  blockDurationMs: 900000 // 15 minutes block
};

function checkRateLimit(identifier: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  let record = rateLimitStore.get(identifier);

  // Check if blocked
  if (record?.blockedUntil && now < record.blockedUntil) {
    const remainingMs = record.blockedUntil - now;
    return { 
      allowed: false, 
      reason: `Rate limit exceeded. Try again in ${Math.ceil(remainingMs / 60000)} minutes.` 
    };
  }

  // Reset window if expired
  if (!record || now - record.windowStart > RATE_LIMIT_CONFIG.windowMs) {
    record = { count: 0, windowStart: now, blockedUntil: null };
  }

  // Check if limit exceeded
  if (record.count >= RATE_LIMIT_CONFIG.maxRequests) {
    record.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
    rateLimitStore.set(identifier, record);
    return { allowed: false, reason: 'Rate limit exceeded. Too many user creation attempts.' };
  }

  // Increment count
  record.count += 1;
  rateLimitStore.set(identifier, record);
  return { allowed: true };
}

// Privileged roles that require super admin to assign
const PRIVILEGED_ROLES = ['admin', 'super_admin'];

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
      console.log('[create-user] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.log('[create-user] Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit check based on user ID
    const rateLimitResult = checkRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      console.log(`[create-user] Rate limit exceeded for user ${user.id}`);
      
      // Log rate limit violation
      await supabaseClient.from('security_audit_log').insert({
        user_id: user.id,
        action: 'RATE_LIMIT_EXCEEDED',
        table_name: 'user_creation',
        severity: 'warn',
        details: { reason: rateLimitResult.reason }
      });
      
      return new Response(
        JSON.stringify({ error: rateLimitResult.reason }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile to check company
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    // Check if user is admin with company context
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role, company_id')
      .eq('user_id', user.id);

    const adminRole = roles?.find(r => r.role === 'admin');
    if (!adminRole) {
      console.log(`[create-user] Unauthorized - non-admin user ${user.id} attempted to create user`);
      
      // Log unauthorized attempt
      await supabaseClient.from('security_audit_log').insert({
        user_id: user.id,
        action: 'UNAUTHORIZED_USER_CREATION_ATTEMPT',
        table_name: 'users',
        severity: 'high',
        details: { reason: 'Non-admin user attempted to create user' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine if super admin (no company) or company admin
    const isSuperAdmin = !adminRole.company_id;
    
    const { email, fullName, role, companyId } = await req.json();
    const targetCompanyId = companyId || profile?.company_id;

    // SECURITY: Prevent privilege escalation
    // Company admins cannot assign privileged roles
    if (!isSuperAdmin && role && PRIVILEGED_ROLES.includes(role)) {
      console.log(`[create-user] Privilege escalation attempt by user ${user.id} - tried to assign role: ${role}`);
      
      // Log privilege escalation attempt
      await supabaseClient.from('security_audit_log').insert({
        user_id: user.id,
        action: 'PRIVILEGE_ESCALATION_ATTEMPT',
        table_name: 'user_roles',
        severity: 'critical',
        details: { 
          attempted_role: role,
          reason: 'Company admin attempted to assign privileged role'
        }
      });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only super admins can assign admin roles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Company admins can only create users for their own company
    if (!isSuperAdmin && adminRole.company_id !== targetCompanyId) {
      console.log(`[create-user] Cross-company user creation attempt by user ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Company admins can only create users for their own company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Super admins creating users must specify a company
    if (isSuperAdmin && !targetCompanyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID is required when creating users' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing user with same email
    const { data: existingUser } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a random temporary password
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const temporaryPassword = generateTempPassword();

    // Create the user with temporary password
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || '',
        requires_password_change: true
      }
    });

    if (createError) {
      console.log(`[create-user] Failed to create user: ${createError.message}`);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[create-user] User created successfully: ${newUser.user.id}`);

    // Update profile with company_id
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ company_id: targetCompanyId })
      .eq('id', newUser.user.id);
    
    if (profileError) {
      console.error('[create-user] Error updating profile with company:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to assign company to user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign role if provided, with company context
    // Only assign non-privileged roles or if super admin
    const safeRole = (!isSuperAdmin && PRIVILEGED_ROLES.includes(role)) ? 'user' : role;
    
    if (safeRole) {
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: safeRole,
          company_id: targetCompanyId
        });

      if (roleError) {
        console.error('[create-user] Error assigning role:', roleError);
        return new Response(
          JSON.stringify({ error: 'Failed to assign role to user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log successful user creation
    await supabaseClient.from('security_audit_log').insert({
      user_id: user.id,
      action: 'USER_CREATED',
      table_name: 'users',
      record_id: newUser.user.id,
      severity: 'info',
      details: { 
        created_user_email: email,
        assigned_role: safeRole,
        company_id: targetCompanyId
      }
    });

    // Send welcome email with temporary password
    try {
      const { error: emailError } = await supabaseClient.functions.invoke('send-user-welcome-email', {
        body: {
          email: email,
          fullName: fullName,
          temporaryPassword: temporaryPassword,
          companyId: targetCompanyId
        }
      });

      if (emailError) {
        console.error('[create-user] Error sending welcome email:', emailError);
        // Don't fail the user creation if email fails
      }
    } catch (emailErr) {
      console.error('[create-user] Failed to send welcome email:', emailErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: newUser.user,
        temporaryPassword: temporaryPassword,
        message: 'User created successfully. Welcome email sent with password setup instructions.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-user] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
