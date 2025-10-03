import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TrialWelcomeRequest {
  email: string;
  fullName: string;
  subscriptionRequestId: string;
}

function generateTemporaryPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, fullName, subscriptionRequestId }: TrialWelcomeRequest = await req.json();

    console.log("Processing trial welcome for:", email);

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        force_password_change: true,
      },
    });

    if (authError) {
      console.error("Error creating user:", authError);
      throw new Error(`Failed to create user account: ${authError.message}`);
    }

    console.log("User created successfully:", authData.user.id);

    // Get system email configuration
    const { data: emailConfig } = await supabase
      .from("email_configurations")
      .select("*")
      .is("company_id", null)
      .eq("is_active", true)
      .maybeSingle();

    if (!emailConfig || !emailConfig.smtp_host || !emailConfig.smtp_username || !emailConfig.smtp_password) {
      console.error("Email configuration not found or incomplete");
      // User created but email failed - still return success
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Account created but email configuration missing. Please contact support for login credentials.",
          userId: authData.user.id 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get trial settings for email content
    const { data: trialSettings } = await supabase
      .from("trial_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const trialDays = trialSettings?.trial_duration_days || 3;

    // Prepare email content
    const subject = "Welcome to Your Free Trial! 🎉";
    const loginUrl = `${supabaseUrl.replace('/rest/v1', '')}/auth`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .credentials-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .credential-item { margin: 10px 0; }
            .credential-label { font-weight: 600; color: #4b5563; }
            .credential-value { font-family: 'Courier New', monospace; background: #e5e7eb; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-left: 10px; }
            .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .feature-list { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature-item { padding: 8px 0; }
            .feature-item:before { content: "✓ "; color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to SocialHub!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your ${trialDays}-Day Free Trial Starts Now</p>
            </div>
            
            <div class="content">
              <p>Hi ${fullName},</p>
              
              <p>Congratulations! Your free trial account has been activated. You now have <strong>${trialDays} days</strong> to explore all the powerful features of SocialHub.</p>

              <div class="credentials-box">
                <h3 style="margin-top: 0;">🔑 Your Login Credentials</h3>
                <div class="credential-item">
                  <span class="credential-label">Email:</span>
                  <span class="credential-value">${email}</span>
                </div>
                <div class="credential-item">
                  <span class="credential-label">Password:</span>
                  <span class="credential-value">${temporaryPassword}</span>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${loginUrl}" class="cta-button">Login to Your Account →</a>
              </div>

              <div class="warning-box">
                <strong>⚠️ Important Security Notice:</strong><br>
                For your security, you will be required to change this temporary password when you first log in. Please choose a strong, unique password.
              </div>

              <div class="feature-list">
                <h3 style="margin-top: 0;">What You Can Do During Your Trial:</h3>
                <div class="feature-item">Schedule and publish posts across all your social channels</div>
                <div class="feature-item">Track engagement metrics and analytics in real-time</div>
                <div class="feature-item">Manage influencer campaigns and partnerships</div>
                <div class="feature-item">Monitor brand mentions and social listening</div>
                <div class="feature-item">Run targeted ad campaigns with AI recommendations</div>
                <div class="feature-item">Collaborate with your team seamlessly</div>
              </div>

              <p><strong>Need Help Getting Started?</strong><br>
              Check out our <a href="#">Quick Start Guide</a> or contact our support team anytime.</p>

              <p style="margin-top: 30px;">We're excited to have you on board!</p>
              
              <p>Best regards,<br>
              <strong>The SocialHub Team</strong></p>
            </div>

            <div class="footer">
              <p>This email was sent because you started a free trial at SocialHub.<br>
              If you didn't sign up, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using SMTP
    try {
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

      console.log("Trial welcome email sent successfully to:", email);

    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // User created but email failed - still return success
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Account created but email delivery failed. Please contact support for assistance.",
          userId: authData.user.id 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Trial account created and welcome email sent successfully",
        userId: authData.user.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-trial-welcome-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});