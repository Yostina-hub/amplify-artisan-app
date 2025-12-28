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

    const update = await req.json();
    console.log('Telegram webhook received:', JSON.stringify(update, null, 2));

    // Handle message updates
    const message = update.message || update.edited_message || update.channel_post || update.edited_channel_post;
    
    if (!message) {
      console.log('No message in update, skipping');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const chat = message.chat;
    const from = message.from || { id: chat.id, first_name: chat.title || 'Channel' };
    const text = message.text || message.caption || '';

    // Skip if it's from a bot (likely our own messages)
    if (from.is_bot) {
      console.log('Message from bot, skipping');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing message from:', from.first_name, 'in chat:', chat.id);

    // Find which company this bot token belongs to
    // We look for tokens where the bot was used to send to this chat
    const { data: tokenData } = await supabase
      .from('social_platform_tokens')
      .select('company_id, metadata')
      .eq('platform', 'telegram')
      .eq('is_active', true);

    if (!tokenData || tokenData.length === 0) {
      console.log('No active Telegram tokens found');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use the first active company (or match by channel_id if configured)
    let companyId = tokenData[0].company_id;
    for (const token of tokenData) {
      const channelId = token.metadata?.channel_id;
      if (channelId && String(channelId) === String(chat.id)) {
        companyId = token.company_id;
        break;
      }
    }

    // Build participant name
    const participantName = from.first_name + (from.last_name ? ` ${from.last_name}` : '') + 
      (from.username ? ` (@${from.username})` : '');

    // Determine message type
    let messageType = 'text';
    const mediaUrls: string[] = [];
    
    if (message.photo) {
      messageType = 'image';
    } else if (message.video) {
      messageType = 'video';
    } else if (message.document) {
      messageType = 'document';
    } else if (message.voice) {
      messageType = 'voice';
    } else if (message.sticker) {
      messageType = 'sticker';
    }

    // Create conversation record
    const conversationData = {
      company_id: companyId,
      platform: 'telegram',
      conversation_id: `telegram_${chat.id}_${message.message_id}`,
      participant_id: String(from.id),
      participant_name: participantName,
      message_type: messageType,
      content: text || `[${messageType}]`,
      media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      direction: 'inbound',
      status: 'unread',
      is_automated: false,
      metadata: {
        chat_id: chat.id,
        chat_type: chat.type,
        chat_title: chat.title,
        message_id: message.message_id,
        from_user_id: from.id,
        from_username: from.username,
        reply_to_message_id: message.reply_to_message?.message_id,
      },
      created_at: new Date(message.date * 1000).toISOString(),
    };

    console.log('Inserting conversation:', conversationData.participant_name, '-', conversationData.content.substring(0, 50));

    const { data: inserted, error: insertError } = await supabase
      .from('social_conversations')
      .insert(conversationData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting conversation:', insertError);
      // Don't throw - we still want to return 200 to Telegram
    } else {
      console.log('Conversation saved with id:', inserted.id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in telegram-webhook:', error);
    // Always return 200 to Telegram to prevent retries
    return new Response(JSON.stringify({ ok: true, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
