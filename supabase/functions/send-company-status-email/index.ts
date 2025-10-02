import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);
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

    // Prepare email content
    const subject = status === "approved" 
      ? "Your Company Application Has Been Approved!" 
      : "Update on Your Company Application";

    const htmlContent = status === "approved"
      ? `
        <h1>Congratulations, ${company.name}!</h1>
        <p>We're pleased to inform you that your company application has been approved.</p>
        <p>You can now access all features of our platform.</p>
        <p>If you have any questions, feel free to contact us.</p>
        <br>
        <p>Best regards,<br>${emailConfig.sender_name}</p>
      `
      : `
        <h1>Update on Your Application</h1>
        <p>Dear ${company.name},</p>
        <p>Thank you for your interest in our platform. Unfortunately, we are unable to approve your application at this time.</p>
        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
        <p>If you have any questions or would like to discuss this further, please don't hesitate to contact us.</p>
        <br>
        <p>Best regards,<br>${emailConfig.sender_name}</p>
      `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: `${emailConfig.sender_name} <${emailConfig.sender_email}>`,
      to: [company.email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
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
