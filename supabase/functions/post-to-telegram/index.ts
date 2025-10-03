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

    // Get Telegram platform ID
    const { data: telegramPlatform, error: platformError } = await supabase
      .from('social_platforms')
      .select('id')
      .eq('name', 'telegram')
      .single();

    if (platformError || !telegramPlatform) {
      throw new Error("Telegram platform not found");
    }

    // Get company Telegram configuration
    const { data: config, error: configError } = await supabase
      .from('company_platform_configs')
      .select('api_key, channel_id, is_active')
      .eq('company_id', companyId)
      .eq('platform_id', telegramPlatform.id)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      throw new Error(`Telegram not configured for this company: ${configError?.message}`);
    }

    if (!config.api_key || !config.channel_id) {
      throw new Error("Telegram bot token or channel ID not configured");
    }

    // Send message to Telegram (with or without media)
    const mediaUrls = post.media_urls || [];
    let telegramData;
    let telegramUrl;

    if (mediaUrls.length === 0) {
      // Send text-only message
      telegramUrl = `https://api.telegram.org/bot${config.api_key}/sendMessage`;
      const telegramResponse = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.channel_id,
          text: post.content,
          parse_mode: 'HTML',
        }),
      });

      telegramData = await telegramResponse.json();

      if (!telegramResponse.ok) {
        console.error("Telegram API error:", telegramData);
        throw new Error(`Telegram API error: ${telegramData.description || 'Unknown error'}`);
      }
    } else if (mediaUrls.length === 1) {
      // Send single media with caption
      const media = mediaUrls[0];
      const mediaType = media.type || 'photo'; // photo or video
      
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
          caption: post.content,
          parse_mode: 'HTML',
        }),
      });

      telegramData = await telegramResponse.json();

      if (!telegramResponse.ok) {
        console.error("Telegram API error:", telegramData);
        throw new Error(`Telegram API error: ${telegramData.description || 'Unknown error'}`);
      }
    } else {
      // Send multiple media (album)
      const mediaGroup = mediaUrls.map((media: any, index: number) => ({
        type: media.type || 'photo',
        media: media.url,
        ...(index === 0 && post.content ? { caption: post.content, parse_mode: 'HTML' } : {}),
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
        console.error("Telegram API error:", telegramData);
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
        mediaCount: mediaUrls.length
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