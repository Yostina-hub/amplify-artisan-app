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

    const { campaign_id, contacts, source } = await req.json();

    // Verify campaign belongs to company
    const { data: campaign, error: campaignError } = await supabase
      .from('telegram_bulk_campaigns')
      .select('id')
      .eq('id', campaign_id)
      .eq('company_id', profile.company_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    let importedContacts = [];

    if (source === 'manual') {
      // Manual input - contacts is an array of { phone_number, first_name?, last_name? }
      importedContacts = contacts.map((c: any) => ({
        campaign_id,
        phone_number: c.phone_number.replace(/\D/g, ''), // Remove non-digits
        first_name: c.first_name || null,
        last_name: c.last_name || null,
        status: 'pending'
      }));
    } else if (source === 'crm') {
      // Import from CRM contacts table
      const { data: crmContacts } = await supabase
        .from('contacts')
        .select('phone, mobile, first_name, last_name')
        .eq('company_id', profile.company_id)
        .not('phone', 'is', null);

      importedContacts = (crmContacts || [])
        .filter(c => c.phone || c.mobile)
        .map(c => ({
          campaign_id,
          phone_number: (c.mobile || c.phone || '').replace(/\D/g, ''),
          first_name: c.first_name,
          last_name: c.last_name,
          status: 'pending'
        }));
    } else if (source === 'csv') {
      // CSV data already parsed on frontend
      importedContacts = contacts.map((c: any) => ({
        campaign_id,
        phone_number: String(c.phone_number || c.phone || '').replace(/\D/g, ''),
        first_name: c.first_name || c.name?.split(' ')[0] || null,
        last_name: c.last_name || c.name?.split(' ').slice(1).join(' ') || null,
        status: 'pending'
      }));
    }

    // Filter out duplicates and invalid numbers
    const validContacts = importedContacts.filter((c: any) => 
      c.phone_number && c.phone_number.length >= 10
    );

    // Remove duplicates within the batch
    const uniqueContacts = validContacts.filter((c: any, index: number, self: any[]) =>
      index === self.findIndex((t: any) => t.phone_number === c.phone_number)
    );

    if (uniqueContacts.length === 0) {
      throw new Error('No valid contacts to import');
    }

    // Insert contacts
    const { error: insertError } = await supabase
      .from('telegram_bulk_contacts')
      .insert(uniqueContacts);

    if (insertError) {
      throw insertError;
    }

    // Update campaign total
    const { data: totalContacts } = await supabase
      .from('telegram_bulk_contacts')
      .select('id', { count: 'exact' })
      .eq('campaign_id', campaign_id);

    await supabase
      .from('telegram_bulk_campaigns')
      .update({ total_contacts: totalContacts?.length || uniqueContacts.length })
      .eq('id', campaign_id);

    console.log(`Imported ${uniqueContacts.length} contacts for campaign ${campaign_id}`);

    return new Response(JSON.stringify({
      success: true,
      imported: uniqueContacts.length,
      skipped: importedContacts.length - uniqueContacts.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Contact import error:', error);
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
