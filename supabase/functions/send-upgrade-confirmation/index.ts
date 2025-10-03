import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpgradeConfirmationRequest {
  email: string;
  fullName: string;
  planId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, planId }: UpgradeConfirmationRequest = await req.json();

    console.log('Processing upgrade confirmation for:', email);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch email configuration
    const { data: emailConfig, error: configError } = await supabase
      .from('email_configurations')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (configError || !emailConfig) {
      throw new Error('Email configuration not found or not active');
    }

    // Fetch plan details
    const { data: plan } = await supabase
      .from('pricing_plans')
      .select('name, price, billing_period')
      .eq('id', planId)
      .single();

    const planName = plan?.name || 'Premium Plan';
    const planPrice = plan?.price || 0;
    const billingPeriod = plan?.billing_period || 'month';

    // Configure SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: emailConfig.smtp_host,
        port: emailConfig.smtp_port,
        tls: emailConfig.smtp_secure,
        auth: {
          username: emailConfig.smtp_username,
          password: emailConfig.smtp_password,
        },
      },
    });

    const loginUrl = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}`;

    // Compose upgrade confirmation email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .plan-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .price { font-size: 32px; font-weight: bold; color: #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Upgrade Confirmed!</h1>
            <p>Thank you for choosing to upgrade</p>
          </div>
          <div class="content">
            <p>Dear ${fullName},</p>
            
            <p>We're excited to confirm your upgrade request! Your trial has been successfully converted to a premium subscription.</p>

            <div class="plan-box">
              <h3>📦 Your Selected Plan</h3>
              <h2>${planName}</h2>
              <div class="price">$${planPrice}<span style="font-size: 18px;">/${billingPeriod}</span></div>
            </div>

            <div class="highlight">
              <strong>⚡ Next Steps:</strong><br>
              Our team will review your upgrade request and send you payment instructions within 24 hours via email.<br>
              Once payment is confirmed, your premium access will continue seamlessly.
            </div>

            <h3>💳 Payment Methods Available:</h3>
            <ul>
              <li>Telebirr</li>
              <li>Commercial Bank of Ethiopia (CBE)</li>
              <li>Direct Bank Transfer</li>
            </ul>

            <p>You can continue using all features while we process your upgrade!</p>

            <center>
              <a href="${loginUrl}" class="button">Access Your Dashboard</a>
            </center>

            <p>If you have any questions, please don't hesitate to contact our support team.</p>

            <p>Best regards,<br>
            <strong>The Support Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await client.send({
      from: `${emailConfig.sender_name} <${emailConfig.sender_email}>`,
      to: email,
      subject: `🎉 Upgrade Request Confirmed - ${planName}`,
      html: emailHtml,
    });

    await client.close();

    console.log('Upgrade confirmation email sent successfully to:', email);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Upgrade confirmation email sent successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in send-upgrade-confirmation:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});