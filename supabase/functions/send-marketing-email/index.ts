import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  campaignId: string;
  contactIds?: string[];
  testMode?: boolean;
  testEmail?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { campaignId, contactIds, testMode, testEmail }: SendEmailRequest = await req.json();

    console.log('Sending marketing email for campaign:', campaignId);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*, email_templates(*)')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Get email configuration
    const { data: emailConfig, error: configError } = await supabase
      .from('email_configurations')
      .select('*')
      .eq('company_id', campaign.company_id)
      .eq('is_active', true)
      .single();

    if (configError || !emailConfig) {
      throw new Error('Email configuration not found. Please configure SMTP settings first.');
    }

    // Initialize SMTP client
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

    // Test mode - send to specific email
    if (testMode && testEmail) {
      const emailHtml = campaign.email_templates?.body_html || campaign.content;
      
      await client.send({
        from: `${emailConfig.sender_name} <${emailConfig.sender_email}>`,
        to: testEmail,
        subject: `[TEST] ${campaign.subject}`,
        html: emailHtml,
      });

      await client.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Test email sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get contacts to send to
    let contacts;
    if (contactIds && contactIds.length > 0) {
      const { data } = await supabase
        .from('email_contacts')
        .select('*')
        .in('id', contactIds)
        .eq('subscription_status', 'subscribed');
      contacts = data;
    } else {
      // Use campaign filter
      const { data } = await supabase
        .from('email_contacts')
        .select('*')
        .eq('company_id', campaign.company_id)
        .eq('subscription_status', 'subscribed');
      contacts = data;
    }

    if (!contacts || contacts.length === 0) {
      throw new Error('No contacts found to send to');
    }

    const emailHtml = campaign.email_templates?.body_html || campaign.content;
    let sentCount = 0;
    const trackingRecords = [];

    // Send emails to all contacts
    for (const contact of contacts) {
      try {
        // Personalize email
        let personalizedHtml = emailHtml
          .replace(/\{\{first_name\}\}/g, contact.first_name || '')
          .replace(/\{\{last_name\}\}/g, contact.last_name || '')
          .replace(/\{\{email\}\}/g, contact.email);

        // Add tracking pixel
        const trackingId = crypto.randomUUID();
        const trackingPixel = `<img src="${supabaseUrl}/functions/v1/track-email-open/${trackingId}" width="1" height="1" style="display:none" />`;
        personalizedHtml += trackingPixel;

        await client.send({
          from: `${emailConfig.sender_name} <${emailConfig.sender_email}>`,
          to: contact.email,
          subject: campaign.subject,
          html: personalizedHtml,
        });

        sentCount++;

        // Track email sent
        trackingRecords.push({
          id: trackingId,
          campaign_id: campaignId,
          contact_id: contact.id,
          email: contact.email,
          sent_at: new Date().toISOString(),
        });

        // Rate limiting - wait 100ms between emails
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send to ${contact.email}:`, error);
      }
    }

    await client.close();

    // Insert tracking records
    if (trackingRecords.length > 0) {
      await supabase
        .from('email_tracking')
        .insert(trackingRecords);
    }

    // Update campaign stats
    await supabase
      .from('email_campaigns')
      .update({
        sent_count: sentCount,
        sent_at: new Date().toISOString(),
        status: 'sent',
      })
      .eq('id', campaignId);

    console.log(`Successfully sent ${sentCount} emails for campaign ${campaignId}`);

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        totalContacts: contacts.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending marketing email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});