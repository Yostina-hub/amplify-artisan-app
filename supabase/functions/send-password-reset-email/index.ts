import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  userId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, userId }: PasswordResetRequest = await req.json();

    console.log("Processing password reset email for:", email);

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_id")
      .eq("id", userId)
      .single();

    // Get email configuration
    // First try company-specific, then fallback to system-wide
    let emailConfig;
    
    if (profile?.company_id) {
      const { data: companyConfig } = await supabase
        .from("email_configurations")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .single();
      
      emailConfig = companyConfig;
    }

    // Fallback to system-wide config if no company config
    if (!emailConfig) {
      const { data: systemConfig } = await supabase
        .from("email_configurations")
        .select("*")
        .is("company_id", null)
        .eq("is_active", true)
        .single();
      
      emailConfig = systemConfig;
    }

    if (!emailConfig) {
      throw new Error("Email configuration not found or inactive");
    }

    if (!emailConfig.smtp_host || !emailConfig.smtp_username || !emailConfig.smtp_password) {
      throw new Error("SMTP configuration is incomplete. Please configure SMTP settings in Email Settings.");
    }

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/`
      }
    });

    if (resetError) throw resetError;

    // Prepare email content
    const subject = "Password Reset Request";
    const htmlContent = `
      <h1>Password Reset</h1>
      <p>Hello ${profile?.full_name || 'there'},</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetData.properties.action_link}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <br>
      <p>Best regards,<br>${emailConfig.sender_name || 'The Team'}</p>
    `;

    // Send email using SMTP
    const client = new SMTPClient({
      connection: {
        hostname: emailConfig.smtp_host,
        port: emailConfig.smtp_port || 465,
        tls: emailConfig.smtp_secure !== false,
        auth: {
          username: emailConfig.smtp_username,
          password: emailConfig.smtp_password,
        },
      },
    });

    await client.send({
      from: emailConfig.sender_email || emailConfig.smtp_username,
      to: email,
      subject: subject,
      content: htmlContent,
      html: htmlContent,
    });

    await client.close();

    console.log("Password reset email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
