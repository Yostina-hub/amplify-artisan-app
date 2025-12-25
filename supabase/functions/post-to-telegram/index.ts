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
    const { postId, companyId } = await req.json();

    if (!postId || !companyId) {
      throw new Error("Missing postId or companyId");
    }

    console.log(`Posting to Telegram - Post ID: ${postId}, Company ID: ${companyId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get post content and media
    const { data: post, error: postError } = await supabase
      .from('social_media_posts')
      .select('content, platforms, media_urls')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      throw new Error(`Post not found: ${postError?.message}`);
    }

    // Check if post should be sent to Telegram
    if (!post.platforms.includes('telegram')) {
      return new Response(
        JSON.stringify({ success: false, message: "Post not targeted for Telegram" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Telegram credentials from unified social_platform_tokens
    const { data: token, error: tokenError } = await supabase
      .from('social_platform_tokens')
      .select('*')
      .eq('company_id', companyId)
      .eq('platform', 'telegram')
      .eq('is_active', true)
      .single();

    if (tokenError || !token) {
      throw new Error(`Telegram not connected for this company: ${tokenError?.message}`);
    }

    if (!token.access_token || !token.account_id) {
      throw new Error("Telegram bot token or channel ID not configured");
    }

    // Map to config format for backward compatibility
    const config = {
      api_key: token.access_token,
      channel_id: token.account_id
    };

    // Send message to Telegram (with or without media)
    const mediaItems = Array.isArray(post.media_urls) ? post.media_urls : [];
    const supportedMedia = mediaItems.filter((m: any) => (m?.type === 'photo' || m?.type === 'video'));
    const linkItems = mediaItems.filter((m: any) => !(m?.type === 'photo' || m?.type === 'video'));

    // Append non-photo/video links (e.g., YouTube, Vimeo, generic links) to the caption
    const linksText = linkItems.length
      ? '\n\n' + linkItems.map((l: any) => `${l.url}`).join('\n')
      : '';
    const caption = `${post.content || ''}${linksText}`.trim();

    let telegramData;
    let telegramUrl;

    if (supportedMedia.length === 0) {
      // Only links or text -> send as a text message including the links
      telegramUrl = `https://api.telegram.org/bot${config.api_key}/sendMessage`;
      const telegramResponse = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.channel_id,
          text: caption,
          parse_mode: 'HTML',
        }),
      });

      telegramData = await telegramResponse.json();

      if (!telegramResponse.ok) {
        console.error('Telegram API error:', telegramData);
        throw new Error(`Telegram API error: ${telegramData.description || 'Unknown error'}`);
      }
    } else if (supportedMedia.length === 1) {
      // Single media item with caption that includes any links
      const media = supportedMedia[0];
      const mediaType = media.type; // 'photo' | 'video'

      telegramUrl = mediaType === 'video'
        ? `https://api.telegram.org/bot${config.api_key}/sendVideo`
        : `https://api.telegram.org/bot${config.api_key}/sendPhoto`;

      const telegramResponse = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.channel_id,
          [mediaType === 'video' ? 'video' : 'photo']: media.url,
          caption,
          parse_mode: 'HTML',
        }),
      });

      telegramData = await telegramResponse.json();

      if (!telegramResponse.ok) {
        console.error('Telegram API error:', telegramData);
        throw new Error(`Telegram API error: ${telegramData.description || 'Unknown error'}`);
      }
    } else {
      // Multiple media items -> send album, add caption (with links) on the first item
      const mediaGroup = supportedMedia.map((media: any, index: number) => ({
        type: media.type,
        media: media.url,
        ...(index === 0 && caption ? { caption, parse_mode: 'HTML' } : {}),
      }));

      telegramUrl = `https://api.telegram.org/bot${config.api_key}/sendMediaGroup`;
      const telegramResponse = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.channel_id,
          media: mediaGroup,
        }),
      });

      telegramData = await telegramResponse.json();

      if (!telegramResponse.ok) {
        console.error('Telegram API error:', telegramData);
        throw new Error(`Telegram API error: ${telegramData.description || 'Unknown error'}`);
      }
    }

    console.log("Successfully posted to Telegram:", telegramData);

    // Update post with Telegram message ID
    const messageId = Array.isArray(telegramData.result) 
      ? telegramData.result[0].message_id 
      : telegramData.result.message_id;
    
    const platformPostIds = {
      telegram: messageId.toString(),
    };

    const { error: updateError } = await supabase
      .from('social_media_posts')
      .update({
        platform_post_ids: platformPostIds,
      })
      .eq('id', postId);

    if (updateError) {
      console.error("Error updating post with Telegram message ID:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: messageId,
        chatId: Array.isArray(telegramData.result) 
          ? telegramData.result[0].chat.id 
          : telegramData.result.chat.id,
        mediaCount: supportedMedia.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in post-to-telegram function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});