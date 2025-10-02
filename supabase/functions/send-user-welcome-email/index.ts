import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  fullName?: string;
  temporaryPassword: string;
  companyId?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, fullName, temporaryPassword, companyId }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    // Get email configuration
    // First try company-specific, then fallback to system-wide
    let emailConfig;
    
    if (companyId) {
      const { data: companyConfig } = await supabase
        .from("email_configurations")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .maybeSingle();
      
      emailConfig = companyConfig;
    }

    // Fallback to system-wide config if no company config
    if (!emailConfig) {
      const { data: systemConfig } = await supabase
        .from("email_configurations")
        .select("*")
        .is("company_id", null)
        .eq("is_active", true)
        .maybeSingle();
      
      emailConfig = systemConfig;
    }

    if (!emailConfig) {
      throw new Error("Email configuration not found or inactive");
    }

    if (!emailConfig.smtp_host || !emailConfig.smtp_username || !emailConfig.smtp_password) {
      throw new Error("SMTP configuration is incomplete. Please configure SMTP settings in Email Settings.");
    }

    // Prepare email content
    const subject = "Welcome! Your Account Credentials";
    const htmlContent = `
      <h1>Welcome${fullName ? `, ${fullName}` : ''}!</h1>
      <p>Your account has been created successfully.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Your Login Credentials</h2>
        <p style="margin: 10px 0;"><strong>Email/Username:</strong> ${email}</p>
        <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></p>
        <p style="margin: 10px 0; color: #666; font-size: 14px;">Use these credentials to log in to the platform.</p>
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;"><strong>⚠️ Important:</strong> For security reasons, you will be required to change your password upon first login.</p>
      </div>

      <p style="margin-top: 20px;">To get started, please log in at the login page using the credentials above.</p>
      
      <p style="margin-top: 30px;">If you have any questions, feel free to contact us.</p>
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

    console.log("Welcome email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-user-welcome-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});