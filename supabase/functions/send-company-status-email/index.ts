import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  companyId: string;
  status: "approved" | "rejected";
  rejectionReason?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { companyId, status, rejectionReason }: EmailRequest = await req.json();

    console.log("Processing email for company:", companyId, "status:", status);

    // Fetch company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      throw new Error("Company not found");
    }

    // Fetch email configuration (system-wide)
    const { data: emailConfig } = await supabase
      .from("email_configurations")
      .select("*")
      .is("company_id", null)
      .eq("is_active", true)
      .single();

    if (!emailConfig) {
      throw new Error("Email configuration not found or inactive");
    }

    if (!emailConfig.smtp_host || !emailConfig.smtp_username || !emailConfig.smtp_password) {
      throw new Error("SMTP configuration is incomplete. Please configure SMTP settings in Email Settings.");
    }

    let passwordResetLink = "";
    
    // If approved, create user account and generate password reset link
    if (status === "approved") {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === company.email);
      
      if (!existingUser) {
        // Create user account
        const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
          email: company.email,
          email_confirm: true,
          user_metadata: {
            full_name: company.name,
            company_name: company.name,
          }
        });

        if (createUserError) {
          console.error("Error creating user:", createUserError);
          throw new Error(`Failed to create user account: ${createUserError.message}`);
        }

        console.log("User account created:", newUser.user?.id);

        // Update profile with company_id
        if (newUser.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ company_id: company.id })
            .eq("id", newUser.user.id);

          if (profileError) {
            console.error("Error updating profile:", profileError);
          }

          // Assign 'user' role to the new account
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: newUser.user.id,
              role: "user",
              company_id: company.id,
            });

          if (roleError) {
            console.error("Error assigning role:", roleError);
          }
        }

        // Generate password reset link
        const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: company.email,
        });

        if (resetError) {
          console.error("Error generating reset link:", resetError);
        } else {
          passwordResetLink = resetData.properties?.action_link || "";
        }
      } else {
        console.log("User already exists, generating new password reset link");
        // User exists, just generate a new password reset link
        const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: company.email,
        });

        if (resetError) {
          console.error("Error generating reset link:", resetError);
        } else {
          passwordResetLink = resetData.properties?.action_link || "";
        }
      }
    }

    // Prepare email content
    const subject = status === "approved" 
      ? "Your Company Application Has Been Approved!" 
      : "Update on Your Company Application";

    const htmlContent = status === "approved"
      ? `
        <h1>Congratulations, ${company.name}!</h1>
        <p>We're pleased to inform you that your company application has been approved.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Your Login Credentials</h2>
          <p style="margin: 10px 0;"><strong>Email/Username:</strong> ${company.email}</p>
          <p style="margin: 10px 0; color: #666; font-size: 14px;">Use this email to log in to the platform.</p>
        </div>

        <h2>Set Up Your Password</h2>
        ${passwordResetLink ? `
          <p>To complete your account setup, please click the button below to create your password:</p>
          <p style="text-align: center; margin: 25px 0;">
            <a href="${passwordResetLink}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Set Up Your Password</a>
          </p>
          <p style="color: #666; font-size: 14px;">⏰ This link will expire in 24 hours. If you need a new link, please contact us.</p>
          <p style="margin-top: 20px;">After setting your password, you can log in at the login page using your email: <strong>${company.email}</strong></p>
        ` : `
          <p style="color: #666;">Please contact us to receive your password setup link.</p>
        `}
        
        <p style="margin-top: 30px;">If you have any questions, feel free to contact us.</p>
        <br>
        <p>Best regards,<br>${emailConfig.sender_name || 'The Team'}</p>
      `
      : `
        <h1>Update on Your Application</h1>
        <p>Dear ${company.name},</p>
        <p>Thank you for your interest in our platform. Unfortunately, we are unable to approve your application at this time.</p>
        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
        <p>If you have any questions or would like to discuss this further, please don't hesitate to contact us.</p>
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
      to: company.email,
      subject: subject,
      content: htmlContent,
      html: htmlContent,
    });

    await client.close();

    console.log("Email sent successfully to:", company.email);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-company-status-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
