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
    const { postId, companyId, content, mediaUrls } = await req.json();
    
    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'companyId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get Telegram token from social_platform_tokens (use most recently updated active connection)
    const { data: telegramToken, error: tokenError } = await supabase
      .from('social_platform_tokens')
      .select('*')
      .eq('company_id', companyId)
      .eq('platform', 'telegram')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError) {
      console.error('Error fetching Telegram token:', tokenError);
      throw new Error('Failed to fetch Telegram credentials');
    }

    if (!telegramToken) {
      console.log('No active Telegram connection found for company:', companyId);
      return new Response(
        JSON.stringify({ error: 'No active Telegram connection found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = telegramToken.access_token;
    const channelId = telegramToken.metadata?.channel_id || telegramToken.account_id;

    console.log('Telegram connection picked:', {
      tokenRowId: telegramToken.id,
      account_id: telegramToken.account_id,
      channel_id: telegramToken.metadata?.channel_id,
      updated_at: telegramToken.updated_at,
      is_active: telegramToken.is_active,
    });

    if (!botToken || !channelId) {
      console.error('Missing bot token or channel ID');
      return new Response(
        JSON.stringify({ error: 'Telegram bot token or channel ID not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get post content if postId is provided
    let postContent = content;
    let postMediaUrls = mediaUrls || [];

    if (postId && !postContent) {
      const { data: post, error: postError } = await supabase
        .from('social_media_posts')
        .select('content, media_urls')
        .eq('id', postId)
        .maybeSingle();

      if (postError) {
        console.error('Error fetching post:', postError);
        throw new Error('Failed to fetch post content');
      }

      if (!post) {
        return new Response(
          JSON.stringify({ error: 'Post not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      postContent = post.content;
      postMediaUrls = post.media_urls || [];
    }

    if (!postContent) {
      return new Response(
        JSON.stringify({ error: 'No content to post' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Posting to Telegram channel ${channelId}...`);

    // Send message to Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const telegramResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channelId,
        text: postContent,
        parse_mode: 'HTML',
      }),
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      console.error('Telegram API error:', telegramResult);
      throw new Error(`Telegram error: ${telegramResult.description || 'Unknown error'}`);
    }

    console.log('Successfully posted to Telegram:', telegramResult.result?.message_id);

    // If there are media URLs, send them as photos
    if (postMediaUrls && postMediaUrls.length > 0) {
      for (const mediaUrl of postMediaUrls) {
        try {
          const photoResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: channelId,
              photo: mediaUrl,
            }),
          });
          const photoResult = await photoResponse.json();
          if (!photoResult.ok) {
            console.warn('Failed to send photo:', photoResult.description);
          }
        } catch (photoErr) {
          console.warn('Error sending photo:', photoErr);
        }
      }
    }

    // Update the post with Telegram message ID
    if (postId) {
      await supabase
        .from('social_media_posts')
        .update({
          metadata: {
            telegram_message_id: telegramResult.result?.message_id,
            telegram_chat_id: channelId,
            posted_to_telegram_at: new Date().toISOString(),
          }
        })
        .eq('id', postId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: telegramResult.result?.message_id,
        chatId: channelId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('post-to-telegram error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
