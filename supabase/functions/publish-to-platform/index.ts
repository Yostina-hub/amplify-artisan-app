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

    const { contentId, platforms } = await req.json();

    console.log('Publishing content:', contentId, 'to platforms:', platforms);

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User has no company');
    }

    // Get content to publish
    const { data: content } = await supabase
      .from('ai_generated_content')
      .select('*')
      .eq('id', contentId)
      .eq('company_id', profile.company_id)
      .single();

    if (!content) {
      throw new Error('Content not found');
    }

    const results = [];

    for (const platform of platforms) {
      console.log(`Publishing to ${platform}...`);

      // Get platform credentials
      const { data: tokens } = await supabase
        .from('social_platform_tokens')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('platform', platform)
        .eq('is_active', true)
        .limit(1);

      if (!tokens || tokens.length === 0) {
        results.push({
          platform,
          success: false,
          error: `No active credentials for ${platform}`
        });
        continue;
      }

      const token = tokens[0];

      try {
        let postResult: { postId: string; postUrl: string };

        // Platform-specific publishing logic
        switch (platform.toLowerCase()) {
          case 'facebook':
            postResult = await publishToFacebook(content, token);
            break;
          case 'instagram':
            postResult = await publishToInstagram(content, token);
            break;
          case 'twitter':
            postResult = await publishToTwitter(content, token);
            break;
          case 'linkedin':
            postResult = await publishToLinkedIn(content, token);
            break;
          case 'tiktok':
            postResult = await publishToTikTok(content, token);
            break;
          case 'telegram':
            postResult = await publishToTelegram(content, token);
            break;
          default:
            throw new Error(`Platform ${platform} not supported`);
        }

        // Create post record
        const { data: post, error: postError } = await supabase
          .from('social_media_posts')
          .insert({
            company_id: profile.company_id,
            user_id: user.id,
            platform,
            content: content.generated_text,
            media_urls: content.generated_images || [],
            hashtags: content.hashtags || [],
            status: 'published',
            published_at: new Date().toISOString(),
            platform_post_id: postResult.postId,
            platform_post_url: postResult.postUrl,
            metadata: {
              ai_generated: true,
              ai_content_id: contentId,
              platform_response: postResult
            }
          })
          .select()
          .single();

        if (postError) throw postError;

        // Update AI content status
        await supabase
          .from('ai_generated_content')
          .update({
            status: 'published',
            post_id: post.id,
            posted_at: new Date().toISOString()
          })
          .eq('id', contentId);

        results.push({
          platform,
          success: true,
          postId: post.id,
          platformPostId: postResult.postId,
          platformPostUrl: postResult.postUrl
        });

      } catch (error) {
        console.error(`Error publishing to ${platform}:`, error);
        results.push({
          platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in publish-to-platform:', error);
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

async function publishToFacebook(content: any, token: any) {
  // Facebook Graph API implementation
  const pageAccessToken = token.access_token;
  const pageId = token.account_id;

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: content.generated_text,
        access_token: pageAccessToken,
      }),
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Facebook API error');
  }

  return {
    postId: data.id,
    postUrl: `https://facebook.com/${data.id}`
  };
}

async function publishToInstagram(content: any, token: any) {
  // Instagram Graph API implementation
  const accessToken = token.access_token;
  const accountId = token.account_id;

  // For Instagram, we need to create a media object first, then publish it
  // This is a simplified version
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caption: content.generated_text,
        image_url: content.generated_images?.[0] || '',
        access_token: accessToken,
      }),
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Instagram API error');
  }

  // Publish the media
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: data.id,
        access_token: accessToken,
      }),
    }
  );

  const publishData = await publishResponse.json();

  return {
    postId: publishData.id,
    postUrl: `https://instagram.com/p/${publishData.id}`
  };
}

async function publishToTwitter(content: any, token: any) {
  // Twitter API v2 implementation
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: content.generated_text,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Twitter API error');
  }

  return {
    postId: data.data.id,
    postUrl: `https://twitter.com/user/status/${data.data.id}`
  };
}

async function publishToLinkedIn(content: any, token: any) {
  // LinkedIn API implementation
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: `urn:li:person:${token.account_id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.generated_text,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'LinkedIn API error');
  }

  return {
    postId: data.id,
    postUrl: `https://linkedin.com/feed/update/${data.id}`
  };
}

async function publishToTikTok(content: any, token: any): Promise<{ postId: string; postUrl: string }> {
  // TikTok API implementation (requires video content)
  throw new Error('TikTok publishing requires video content - use the dedicated TikTok function');
}

async function publishToTelegram(content: any, token: any) {
  // Telegram Bot API implementation
  const botToken = token.bot_token;
  const channelId = token.channel_id;

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channelId,
        text: content.generated_text,
        parse_mode: 'HTML',
      }),
    }
  );

  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.description || 'Telegram API error');
  }

  return {
    postId: data.result.message_id.toString(),
    postUrl: `https://t.me/${channelId}/${data.result.message_id}`
  };
}
