import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { conversationId, chatId, replyText } = await req.json();

    if (!replyText?.trim()) {
      throw new Error('Reply text is required');
    }

    console.log('Reply request:', { conversationId, chatId, replyText: replyText.substring(0, 50) });

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User has no company');
    }

    // Get Telegram bot token
    const { data: telegramToken, error: tokenError } = await supabase
      .from('social_platform_tokens')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('platform', 'telegram')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError || !telegramToken) {
      console.error('Token error:', tokenError);
      throw new Error('No active Telegram connection found');
    }

    const botToken = telegramToken.access_token;
    
    // Determine chat ID - use provided chatId, or get from conversation
    let targetChatId = chatId;
    
    if (!targetChatId && conversationId) {
      const { data: conversation } = await supabase
        .from('social_conversations')
        .select('external_id, metadata')
        .eq('id', conversationId)
        .single();
      
      if (conversation) {
        targetChatId = conversation.metadata?.chat_id || conversation.external_id;
      }
    }

    if (!targetChatId) {
      throw new Error('Could not determine chat ID for reply');
    }

    console.log('Sending reply to Telegram chat:', targetChatId);

    // Send message via Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: replyText,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram API error:', result);
      throw new Error(result.description || 'Failed to send Telegram message');
    }

    console.log('Successfully sent reply, message_id:', result.result.message_id);

    // Update conversation status to replied
    if (conversationId) {
      await supabase
        .from('social_conversations')
        .update({ 
          status: 'replied',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: result.result.message_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in reply-to-telegram:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
