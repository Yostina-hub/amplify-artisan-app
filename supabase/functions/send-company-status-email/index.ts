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

    let temporaryPassword = "";
    
    // If approved, create user account and generate temporary password
    if (status === "approved") {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === company.email);
      
      if (!existingUser) {
        // Generate a random temporary password
        const generateTempPassword = () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
          let password = '';
          for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return password;
        };

        temporaryPassword = generateTempPassword();

        // Create user account with temporary password
        const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
          email: company.email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name: company.name,
            company_name: company.name,
            requires_password_change: true
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

          // Assign 'admin' role to the company account (company admins can manage their company)
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: newUser.user.id,
              role: "admin",
              company_id: company.id,
            });

          if (roleError) {
            console.error("Error assigning role:", roleError);
          }
        }
      } else {
        console.log("User already exists, skipping account creation");
        // Reset password for existing user and enforce password change on next login
        const generateTempPassword = () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
          let password = '';
          for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return password;
        };
        temporaryPassword = generateTempPassword();
        const { error: updateErr } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: temporaryPassword,
          user_metadata: {
            ...(existingUser.user_metadata || {}),
            requires_password_change: true,
          },
        } as any);
        if (updateErr) {
          console.error("Error updating existing user password:", updateErr);
          throw new Error(`Failed to set temporary password: ${updateErr.message}`);
        }

        // Ensure profile exists and is linked to the company
        const { error: upsertProfileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: existingUser.id,
              email: existingUser.email ?? company.email,
              full_name: (existingUser.user_metadata as any)?.full_name || company.name,
              company_id: company.id,
            },
            { onConflict: "id" }
          );
        if (upsertProfileError) {
          console.error("Error upserting profile:", upsertProfileError);
        }

        // Ensure the user has the company admin role
        const { error: upsertRoleError } = await supabase
          .from("user_roles")
          .upsert(
            {
              user_id: existingUser.id,
              role: "admin",
              company_id: company.id,
            },
            { onConflict: "user_id,role" }
          );
        if (upsertRoleError) {
          console.error("Error upserting user role:", upsertRoleError);
        }
      }
    }

    // Prepare email content
    const subject = status === "approved" 
      ? "Your Company Application Has Been Approved!" 
      : "Update on Your Company Application";

    // Derive a login URL from request origin or configured site URL
    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || Deno.env.get("LOVABLE_SITE_URL") || "";
    const baseUrl = origin ? origin.replace(/\/$/, "") : "";
    const loginUrl = baseUrl ? `${baseUrl}/auth` : "/auth";

    const htmlContent = status === "approved"
      ? `
        <h1>Congratulations, ${company.name}!</h1>
        <p>We're pleased to inform you that your company application has been approved.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Your Login Credentials</h2>
          <p style="margin: 10px 0;"><strong>Email/Username:</strong> ${company.email}</p>
          <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></p>
          <p style="margin: 10px 0; color: #666; font-size: 14px;">Use these credentials to log in to the platform.</p>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;"><strong>⚠️ Important:</strong> For security reasons, you will be required to change your password upon first login.</p>
        </div>

        <p style="margin-top: 20px;">To get started, please log in using the credentials above:</p>
        <p style="margin: 16px 0;">
          <a href="${loginUrl}" style="background:#111827;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;display:inline-block">Open Login Page</a>
        </p>
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
