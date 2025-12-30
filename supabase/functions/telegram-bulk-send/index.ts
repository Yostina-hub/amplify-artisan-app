import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { campaign_id, action } = await req.json();

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

    // Check session
    const { data: session } = await supabase
      .from('telegram_sessions')
      .select('*')
      .eq('company_id', profile.company_id)
      .single();

    if (!session?.is_authenticated) {
      throw new Error('Telegram account not authenticated. Please authenticate first.');
    }

    if (action === 'start') {
      // Update campaign status
      await supabase
        .from('telegram_bulk_campaigns')
        .update({ 
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', campaign_id);

      // Get pending contacts
      const { data: contacts } = await supabase
        .from('telegram_bulk_contacts')
        .select('*')
        .eq('campaign_id', campaign_id)
        .eq('status', 'pending')
        .limit(50); // Process in batches

      let sentCount = 0;
      let failedCount = 0;

      // Process each contact
      for (const contact of contacts || []) {
        try {
          // In production, this would use MTProto to:
          // 1. Import contact by phone number
          // 2. Get Telegram user ID
          // 3. Send message
          
          // For demo purposes, we simulate the process
          console.log(`Processing contact: ${contact.phone_number}`);
          
          // Simulate delay between messages (Telegram rate limits)
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Update contact status
          await supabase
            .from('telegram_bulk_contacts')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', contact.id);

          sentCount++;
        } catch (err: unknown) {
          console.error(`Failed to send to ${contact.phone_number}:`, err);
          const errMessage = err instanceof Error ? err.message : 'Unknown error';
          
          await supabase
            .from('telegram_bulk_contacts')
            .update({
              status: 'failed',
              error_message: errMessage
            })
            .eq('id', contact.id);

          failedCount++;
        }
      }

      // Update campaign counts
      const { data: stats } = await supabase
        .from('telegram_bulk_contacts')
        .select('status')
        .eq('campaign_id', campaign_id);

      const newSentCount = stats?.filter(c => c.status === 'sent' || c.status === 'delivered').length || 0;
      const newFailedCount = stats?.filter(c => c.status === 'failed').length || 0;
      const pendingCount = stats?.filter(c => c.status === 'pending').length || 0;

      await supabase
        .from('telegram_bulk_campaigns')
        .update({
          sent_count: newSentCount,
          failed_count: newFailedCount,
          status: pendingCount === 0 ? 'completed' : 'running',
          completed_at: pendingCount === 0 ? new Date().toISOString() : null
        })
        .eq('id', campaign_id);

      return new Response(JSON.stringify({
        success: true,
        processed: contacts?.length || 0,
        sent: sentCount,
        failed: failedCount,
        remaining: pendingCount
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

    throw new Error('Invalid action');

  } catch (error: unknown) {
    console.error('Telegram bulk send error:', error);
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
