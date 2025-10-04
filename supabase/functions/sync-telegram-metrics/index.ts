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

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Syncing Telegram metrics for user:', user.id);

    // Get user's company
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User not assigned to company');
    }

    console.log('Company ID:', profile.company_id);

    // Get Telegram platform ID
    const { data: telegramPlatform } = await supabaseClient
      .from('social_platforms')
      .select('id')
      .eq('name', 'telegram')
      .single();

    if (!telegramPlatform) {
      throw new Error('Telegram platform not found');
    }

    // Get company's Telegram configuration
    const { data: config } = await supabaseClient
      .from('company_platform_configs')
      .select('api_key, channel_id')
      .eq('company_id', profile.company_id)
      .eq('platform_id', telegramPlatform.id)
      .eq('is_active', true)
      .single();

    if (!config?.api_key || !config?.channel_id) {
      throw new Error('Telegram not configured or missing API key/channel ID');
    }

    console.log('Found Telegram config, fetching metrics...');

    // Fetch channel info from Telegram API
    const telegramApiUrl = `https://api.telegram.org/bot${config.api_key}/getChat`;
    const chatResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: config.channel_id }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('Telegram API error:', errorText);
      throw new Error(`Telegram API error: ${errorText}`);
    }

    const chatData = await chatResponse.json();
    console.log('Telegram API response:', chatData);

    if (!chatData.ok) {
      throw new Error(`Telegram API returned error: ${chatData.description}`);
    }

    // Get member count
    const memberCountUrl = `https://api.telegram.org/bot${config.api_key}/getChatMemberCount`;
    const memberResponse = await fetch(memberCountUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: config.channel_id }),
    });

    const memberData = await memberResponse.json();
    const subscriberCount = memberData.ok ? memberData.result : 0;

    console.log('Subscriber count:', subscriberCount);

    // Check if we have a social_media_account for this Telegram channel
    const { data: existingAccount } = await supabaseClient
      .from('social_media_accounts')
      .select('id')
      .eq('company_id', profile.company_id)
      .eq('platform', 'telegram')
      .eq('account_id', config.channel_id)
      .single();

    let accountId: string;

    if (existingAccount) {
      accountId = existingAccount.id;
      console.log('Using existing account:', accountId);
    } else {
      // Create a social_media_account entry
      const { data: newAccount, error: accountError } = await supabaseClient
        .from('social_media_accounts')
        .insert({
          user_id: user.id,
          company_id: profile.company_id,
          platform: 'telegram',
          account_id: config.channel_id,
          account_name: chatData.result.title || 'Telegram Channel',
          access_token: 'configured', // Placeholder since we use bot API
        })
        .select()
        .single();

      if (accountError) {
        console.error('Error creating account:', accountError);
        throw accountError;
      }

      accountId = newAccount.id;
      console.log('Created new account:', accountId);
    }

    // Count posts for this platform
    const { count: postsCount } = await supabaseClient
      .from('social_media_posts')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)
      .contains('platforms', ['telegram']);

    // Calculate engagement from posts
    const { data: posts } = await supabaseClient
      .from('social_media_posts')
      .select('engagement_rate')
      .eq('company_id', profile.company_id)
      .contains('platforms', ['telegram']);

    const avgEngagement = posts && posts.length > 0
      ? posts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / posts.length
      : 0;

    // Update or insert metrics
    const { data: existingMetrics } = await supabaseClient
      .from('social_media_metrics')
      .select('id')
      .eq('account_id', accountId)
      .single();

    const metricsData = {
      account_id: accountId,
      followers_count: subscriberCount,
      posts_count: postsCount || 0,
      engagement_rate: avgEngagement,
      last_synced_at: new Date().toISOString(),
    };

    if (existingMetrics) {
      await supabaseClient
        .from('social_media_metrics')
        .update(metricsData)
        .eq('id', existingMetrics.id);
      console.log('Updated existing metrics');
    } else {
      await supabaseClient
        .from('social_media_metrics')
        .insert(metricsData);
      console.log('Created new metrics');
    }

    return new Response(
      JSON.stringify({
        success: true,
        metrics: {
          subscribers: subscriberCount,
          posts: postsCount || 0,
          engagement_rate: avgEngagement,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing Telegram metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
