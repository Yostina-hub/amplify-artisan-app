import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { platform } = await req.json();

    console.log('Fetching messages for platform:', platform);

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User has no company');
    }

    // Get platform tokens - if platform is 'all', get all active tokens
    let tokenQuery = supabase
      .from('social_platform_tokens')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true);

    if (platform && platform !== 'all') {
      tokenQuery = tokenQuery.eq('platform', platform);
    }

    const { data: tokens } = await tokenQuery;

    if (!tokens || tokens.length === 0) {
      // Return success with 0 messages instead of throwing error
      return new Response(
        JSON.stringify({ 
          success: true, 
          count: 0,
          message: `No connected platforms found. Connect your social accounts first.` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const messages: any[] = [];

    // Fetch messages from each platform
    // This is a placeholder implementation - actual API calls would go here
    for (const token of tokens) {
      console.log(`Fetching from ${platform} account:`, token.account_name);
      
      // TODO: Implement actual API calls for each platform
      // For now, we'll create mock data structure
      const mockMessages = [
        {
          company_id: profile.company_id,
          platform,
          conversation_id: `conv_${Date.now()}_1`,
          participant_id: 'user_123',
          participant_name: 'John Doe',
          participant_avatar: null,
          message_type: 'message',
          content: 'Great product! Love using your service.',
          media_urls: [],
          direction: 'inbound',
          status: 'unread',
          metadata: { account_id: token.account_id },
        }
      ];

      messages.push(...mockMessages);
    }

    // Save messages to database
    if (messages.length > 0) {
      const { error: insertError } = await supabase
        .from('social_conversations')
        .upsert(messages, { 
          onConflict: 'company_id,platform,conversation_id',
          ignoreDuplicates: false 
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
    }

    console.log(`Fetched ${messages.length} messages successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: messages.length,
        message: `Fetched ${messages.length} messages from ${platform}` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in fetch-social-messages:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});