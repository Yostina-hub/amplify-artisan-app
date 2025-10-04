import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { platform } = await req.json();
    console.log('Syncing metrics for platform:', platform);

    // Get user's company
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User not assigned to company');
    }

    // Get platform details
    const { data: platformData } = await supabaseClient
      .from('social_platforms')
      .select('id, name')
      .eq('name', platform)
      .single();

    if (!platformData) {
      throw new Error(`Platform ${platform} not found`);
    }

    // Get platform configuration
    const { data: config } = await supabaseClient
      .from('company_platform_configs')
      .select('api_key, channel_id, config')
      .eq('company_id', profile.company_id)
      .eq('platform_id', platformData.id)
      .eq('is_active', true)
      .single();

    if (!config) {
      throw new Error(`${platform} not configured for this company`);
    }

    let metrics = { followers: 0, posts: 0, engagement: 0 };

    // Platform-specific sync logic
    switch (platform) {
      case 'telegram':
        metrics = await syncTelegram(config);
        break;
      case 'facebook':
        metrics = await syncFacebook(config);
        break;
      case 'instagram':
        metrics = await syncInstagram(config);
        break;
      case 'twitter':
        metrics = await syncTwitter(config);
        break;
      case 'linkedin':
        metrics = await syncLinkedIn(config);
        break;
      case 'youtube':
        metrics = await syncYouTube(config);
        break;
      case 'tiktok':
        metrics = await syncTikTok(config);
        break;
      default:
        throw new Error(`Sync not implemented for ${platform}`);
    }

    // Count posts for this platform
    const { count: postsCount } = await supabaseClient
      .from('social_media_posts')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)
      .contains('platforms', [platform]);

    // Calculate engagement from posts
    const { data: posts } = await supabaseClient
      .from('social_media_posts')
      .select('engagement_rate')
      .eq('company_id', profile.company_id)
      .contains('platforms', [platform]);

    const avgEngagement = posts && posts.length > 0
      ? posts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / posts.length
      : metrics.engagement;

    // Get or create social_media_account
    let accountId: string;
    const { data: existingAccount } = await supabaseClient
      .from('social_media_accounts')
      .select('id')
      .eq('company_id', profile.company_id)
      .eq('platform', platform)
      .single();

    if (existingAccount) {
      accountId = existingAccount.id;
    } else {
      const { data: newAccount, error: accountError } = await supabaseClient
        .from('social_media_accounts')
        .insert({
          user_id: user.id,
          company_id: profile.company_id,
          platform: platform,
          account_id: config.channel_id || 'configured',
          account_name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`,
          access_token: 'configured',
        })
        .select()
        .single();

      if (accountError) throw accountError;
      accountId = newAccount.id;
    }

    // Metrics synced - social_media_metrics table removed from system
    console.log('Platform metrics synced:', {
      platform,
      followers: metrics.followers,
      posts: postsCount || metrics.posts,
      engagement_rate: avgEngagement,
    });

    return new Response(
      JSON.stringify({
        success: true,
        platform,
        metrics: {
          followers: metrics.followers,
          posts: postsCount || metrics.posts,
          engagement_rate: avgEngagement,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Platform-specific sync functions
async function syncTelegram(config: any) {
  const telegramApiUrl = `https://api.telegram.org/bot${config.api_key}/getChatMemberCount`;
  const response = await fetch(telegramApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: config.channel_id }),
  });

  const data = await response.json();
  return {
    followers: data.ok ? data.result : 0,
    posts: 0,
    engagement: 0,
  };
}

async function syncFacebook(config: any) {
  // Facebook Graph API would require page access token
  // For now, return placeholder - can be implemented with proper OAuth
  console.log('Facebook sync - requires OAuth implementation');
  return { followers: 0, posts: 0, engagement: 0 };
}

async function syncInstagram(config: any) {
  // Instagram Graph API would require access token
  console.log('Instagram sync - requires OAuth implementation');
  return { followers: 0, posts: 0, engagement: 0 };
}

async function syncTwitter(config: any) {
  // Twitter API v2 would require OAuth tokens
  console.log('Twitter sync - requires OAuth implementation');
  return { followers: 0, posts: 0, engagement: 0 };
}

async function syncLinkedIn(config: any) {
  // LinkedIn API would require OAuth tokens
  console.log('LinkedIn sync - requires OAuth implementation');
  return { followers: 0, posts: 0, engagement: 0 };
}

async function syncYouTube(config: any) {
  // YouTube Data API would require API key and channel ID
  console.log('YouTube sync - requires API implementation');
  return { followers: 0, posts: 0, engagement: 0 };
}

async function syncTikTok(config: any) {
  // TikTok API would require OAuth tokens
  console.log('TikTok sync - requires OAuth implementation');
  return { followers: 0, posts: 0, engagement: 0 };
}
