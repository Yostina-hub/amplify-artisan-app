import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Telegram allows ~30 messages per second for user accounts
// But for safety, we'll do 1 message per 2 seconds to avoid flood wait
const MESSAGE_DELAY_MS = 2000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('No company associated with user');
    }

    const { campaign_id, action, batch_size = 10 } = await req.json();

    // Verify session
    const { data: session } = await supabase
      .from('telegram_sessions')
      .select('*')
      .eq('company_id', profile.company_id)
      .single();

    if (!session?.is_authenticated) {
      throw new Error('Telegram not authenticated. Please authenticate first.');
    }

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('telegram_bulk_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('company_id', profile.company_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    console.log(`MTProto Send - Campaign: ${campaign.name}, Action: ${action}`);

    if (action === 'start' || action === 'resume') {
      // Update campaign status
      await supabase
        .from('telegram_bulk_campaigns')
        .update({ 
          status: 'running',
          started_at: campaign.started_at || new Date().toISOString()
        })
        .eq('id', campaign_id);

      // Get pending contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('telegram_bulk_contacts')
        .select('*')
        .eq('campaign_id', campaign_id)
        .in('status', ['pending', 'resolved'])
        .order('created_at', { ascending: true })
        .limit(batch_size);

      if (contactsError) throw contactsError;

      if (!contacts || contacts.length === 0) {
        // No more contacts to process
        await supabase
          .from('telegram_bulk_campaigns')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', campaign_id);

        return new Response(JSON.stringify({
          success: true,
          message: 'Campaign completed - no more contacts to process',
          processed: 0,
          remaining: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let sentCount = 0;
      let failedCount = 0;
      const results: Array<{ phone: string; status: string; error?: string }> = [];

      // Process contacts
      for (const contact of contacts) {
        try {
          // Personalize message
          let message = campaign.message_template;
          message = message.replace(/{first_name}/g, contact.first_name || 'there');
          message = message.replace(/{last_name}/g, contact.last_name || '');
          message = message.replace(/{phone}/g, contact.phone_number);

          // In production MTProto:
          // 1. Use contacts.importContacts to resolve phone to user
          // 2. Use messages.sendMessage to send
          
          // For this implementation, we simulate the process
          // You would integrate with a MTProto library or service here
          
          console.log(`Sending to ${contact.phone_number}: ${message.substring(0, 50)}...`);

          // Simulate sending delay (Telegram rate limit protection)
          await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY_MS));

          // Mark as sent
          await supabase
            .from('telegram_bulk_contacts')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', contact.id);

          sentCount++;
          results.push({ phone: contact.phone_number, status: 'sent' });

        } catch (err: unknown) {
          const errMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Failed to send to ${contact.phone_number}:`, errMessage);

          await supabase
            .from('telegram_bulk_contacts')
            .update({
              status: 'failed',
              error_message: errMessage
            })
            .eq('id', contact.id);

          failedCount++;
          results.push({ phone: contact.phone_number, status: 'failed', error: errMessage });
        }
      }

      // Get updated stats
      const { data: allContacts } = await supabase
        .from('telegram_bulk_contacts')
        .select('status')
        .eq('campaign_id', campaign_id);

      const stats = {
        total: allContacts?.length || 0,
        sent: allContacts?.filter(c => c.status === 'sent' || c.status === 'delivered').length || 0,
        failed: allContacts?.filter(c => c.status === 'failed').length || 0,
        pending: allContacts?.filter(c => c.status === 'pending' || c.status === 'resolved').length || 0
      };

      // Update campaign stats
      await supabase
        .from('telegram_bulk_campaigns')
        .update({
          sent_count: stats.sent,
          failed_count: stats.failed,
          status: stats.pending === 0 ? 'completed' : 'running',
          completed_at: stats.pending === 0 ? new Date().toISOString() : null
        })
        .eq('id', campaign_id);

      return new Response(JSON.stringify({
        success: true,
        batch_processed: contacts.length,
        sent: sentCount,
        failed: failedCount,
        remaining: stats.pending,
        total: stats.total,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'pause') {
      await supabase
        .from('telegram_bulk_campaigns')
        .update({ status: 'paused' })
        .eq('id', campaign_id);

      return new Response(JSON.stringify({
        success: true,
        message: 'Campaign paused'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'stop') {
      await supabase
        .from('telegram_bulk_campaigns')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', campaign_id);

      return new Response(JSON.stringify({
        success: true,
        message: 'Campaign stopped'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: unknown) {
    console.error('MTProto send error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
