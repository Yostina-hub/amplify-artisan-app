import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function resolves phone numbers to Telegram users
// In production, this uses MTProto contacts.importContacts

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

    const { campaign_id, batch_size = 100 } = await req.json();

    // Verify session
    const { data: session } = await supabase
      .from('telegram_sessions')
      .select('*')
      .eq('company_id', profile.company_id)
      .single();

    if (!session?.is_authenticated) {
      throw new Error('Telegram not authenticated');
    }

    // Get campaign
    const { data: campaign } = await supabase
      .from('telegram_bulk_campaigns')
      .select('id')
      .eq('id', campaign_id)
      .eq('company_id', profile.company_id)
      .single();

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get pending contacts to resolve
    const { data: contacts, error: contactsError } = await supabase
      .from('telegram_bulk_contacts')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('status', 'pending')
      .limit(batch_size);

    if (contactsError) throw contactsError;

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending contacts to resolve',
        resolved: 0,
        not_found: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Resolving ${contacts.length} contacts for campaign ${campaign_id}`);

    let resolvedCount = 0;
    let notFoundCount = 0;

    // In production MTProto, you would:
    // 1. Call contacts.importContacts with batch of phones
    // 2. Get back user IDs and access hashes
    // 3. Store them for sending messages

    for (const contact of contacts) {
      try {
        // Simulate resolution - in production this would use MTProto
        // contacts.importContacts returns users with matching phone numbers
        
        // For simulation, we'll mark all as resolved
        // In reality, some phones won't have Telegram accounts
        
        const hasAccount = true; // Simulated - MTProto would tell us this
        
        if (hasAccount) {
          // Simulated user ID and access hash
          const telegramUserId = Math.floor(Math.random() * 1000000000);
          const accessHash = Math.floor(Math.random() * 1000000000000);

          await supabase
            .from('telegram_bulk_contacts')
            .update({
              status: 'resolved',
              telegram_user_id: telegramUserId,
              telegram_access_hash: accessHash
            })
            .eq('id', contact.id);

          resolvedCount++;
        } else {
          await supabase
            .from('telegram_bulk_contacts')
            .update({
              status: 'not_found',
              error_message: 'No Telegram account found for this phone number'
            })
            .eq('id', contact.id);

          notFoundCount++;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : 'Resolution failed';
        console.error(`Failed to resolve ${contact.phone_number}:`, errMessage);
        
        await supabase
          .from('telegram_bulk_contacts')
          .update({
            status: 'failed',
            error_message: errMessage
          })
          .eq('id', contact.id);
      }
    }

    // Get updated stats
    const { data: allContacts } = await supabase
      .from('telegram_bulk_contacts')
      .select('status')
      .eq('campaign_id', campaign_id);

    const stats = {
      total: allContacts?.length || 0,
      pending: allContacts?.filter(c => c.status === 'pending').length || 0,
      resolved: allContacts?.filter(c => c.status === 'resolved').length || 0,
      not_found: allContacts?.filter(c => c.status === 'not_found').length || 0
    };

    return new Response(JSON.stringify({
      success: true,
      batch_processed: contacts.length,
      resolved: resolvedCount,
      not_found: notFoundCount,
      stats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Contact resolution error:', error);
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
