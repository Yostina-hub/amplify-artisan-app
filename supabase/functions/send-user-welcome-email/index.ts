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
  passwordSetupLink: string;
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

    const { email, fullName, passwordSetupLink, companyId }: WelcomeEmailRequest = await req.json();

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
    const subject = "Welcome! Set Up Your Account";
    const htmlContent = `
      <h1>Welcome${fullName ? `, ${fullName}` : ''}!</h1>
      <p>Your account has been created successfully.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Your Login Credentials</h2>
        <p style="margin: 10px 0;"><strong>Email/Username:</strong> ${email}</p>
        <p style="margin: 10px 0; color: #666; font-size: 14px;">Use this email to log in to the platform.</p>
      </div>

      <h2>Set Up Your Password</h2>
      <p>To get started, please click the button below to create your password:</p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="${passwordSetupLink}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Set Up Your Password</a>
      </p>
      <p style="color: #666; font-size: 14px;">⏰ This link will expire in 24 hours. If you need a new link, please contact your administrator.</p>
      <p style="margin-top: 20px;">After setting your password, you can log in at the login page using your email: <strong>${email}</strong></p>
      
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