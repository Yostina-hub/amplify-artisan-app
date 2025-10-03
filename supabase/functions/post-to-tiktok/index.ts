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

    console.log(`Posting to TikTok - Post ID: ${postId}, Company ID: ${companyId}`);

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

    // Check if post should be sent to TikTok
    if (!post.platforms.includes('tiktok')) {
      return new Response(
        JSON.stringify({ success: false, message: "Post not targeted for TikTok" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get TikTok platform ID
    const { data: tiktokPlatform, error: platformError } = await supabase
      .from('social_platforms')
      .select('id')
      .eq('name', 'tiktok')
      .single();

    if (platformError || !tiktokPlatform) {
      throw new Error("TikTok platform not found");
    }

    // Get company TikTok configuration
    const { data: config, error: configError } = await supabase
      .from('company_platform_configs')
      .select('access_token, is_active, config')
      .eq('company_id', companyId)
      .eq('platform_id', tiktokPlatform.id)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      throw new Error(`TikTok not configured for this company: ${configError?.message}`);
    }

    if (!config.access_token) {
      throw new Error("TikTok access token not configured");
    }

    // Extract video from media_urls
    const mediaItems = Array.isArray(post.media_urls) ? post.media_urls : [];
    const videoItem = mediaItems.find((m: any) => m.type === 'video');

    if (!videoItem) {
      throw new Error("TikTok requires a video to post");
    }

    // Step 1: Initialize video upload
    const initUploadResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: post.content.substring(0, 150), // TikTok max 150 chars
          privacy_level: config.config?.privacy_level || 'SELF_ONLY',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoItem.url,
        }
      }),
    });

    if (!initUploadResponse.ok) {
      const errorData = await initUploadResponse.json();
      console.error('TikTok init upload error:', errorData);
      throw new Error(`TikTok API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const uploadData = await initUploadResponse.json();
    console.log('Successfully initiated TikTok upload:', uploadData);

    const publishId = uploadData.data?.publish_id;
    
    if (!publishId) {
      throw new Error('No publish_id returned from TikTok');
    }

    // Update post with TikTok publish ID
    const platformPostIds = {
      tiktok: publishId,
    };

    const { error: updateError } = await supabase
      .from('social_media_posts')
      .update({
        platform_post_ids: platformPostIds,
      })
      .eq('id', postId);

    if (updateError) {
      console.error("Error updating post with TikTok publish ID:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        publishId: publishId,
        status: uploadData.data?.status || 'processing',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in post-to-tiktok function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
