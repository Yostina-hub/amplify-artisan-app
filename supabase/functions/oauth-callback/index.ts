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

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const platform = url.searchParams.get('platform');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return new Response(
        JSON.stringify({ error: `OAuth error: ${error}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!code || !platform || !state) {
      throw new Error('Missing required parameters');
    }

    // Decode state to get user info
    const stateData = JSON.parse(atob(state));
    const { userId, companyId } = stateData;

    console.log(`Processing OAuth callback for ${platform}...`);

    // Get platform configuration
    const { data: config } = await supabase
      .from('company_platform_configs')
      .select('*')
      .eq('company_id', companyId)
      .eq('platform_id', platform)
      .single();

    if (!config) {
      throw new Error('Platform configuration not found');
    }

    let tokenData;

    // Exchange code for access token based on platform
    switch (platform.toLowerCase()) {
      case 'facebook':
      case 'instagram':
        tokenData = await exchangeFacebookCode(code, config);
        break;
      case 'twitter':
        tokenData = await exchangeTwitterCode(code, config);
        break;
      case 'linkedin':
        tokenData = await exchangeLinkedInCode(code, config);
        break;
      case 'tiktok':
        tokenData = await exchangeTikTokCode(code, config);
        break;
      case 'telegram':
        tokenData = await exchangeTelegramCode(code, config);
        break;
      default:
        throw new Error(`Platform ${platform} not supported`);
    }

    // Save or update token
    const { error: tokenError } = await supabase
      .from('social_platform_tokens')
      .upsert({
        company_id: companyId,
        user_id: userId,
        platform: platform.toLowerCase(),
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        expires_at: tokenData.expiresAt,
        account_id: tokenData.accountId,
        account_name: tokenData.accountName,
        is_active: true,
        metadata: tokenData.metadata || {}
      }, {
        onConflict: 'company_id,platform,account_id'
      });

    if (tokenError) {
      console.error('Error saving token:', tokenError);
      throw tokenError;
    }

    console.log(`Successfully connected ${platform} account`);

    // Redirect back to app
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${supabaseUrl.replace('.supabase.co', '.app')}/social-media-credentials?success=true&platform=${platform}`
      }
    });

  } catch (error) {
    console.error('Error in oauth-callback:', error);
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

async function exchangeFacebookCode(code: string, config: any) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${config.client_id}&` +
    `client_secret=${config.client_secret}&` +
    `redirect_uri=${config.redirect_url}&` +
    `code=${code}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Facebook OAuth error');
  }

  // Get user info
  const userResponse = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${data.access_token}`
  );
  const userData = await userResponse.json();

  const expiresIn = data.expires_in || 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken: data.access_token,
    refreshToken: null,
    expiresAt,
    accountId: userData.id,
    accountName: userData.name,
    metadata: { userData }
  };
}

async function exchangeTwitterCode(code: string, config: any) {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${config.client_id}:${config.client_secret}`)}`
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirect_url,
      code_verifier: 'challenge' // In production, use proper PKCE
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || 'Twitter OAuth error');
  }

  // Get user info
  const userResponse = await fetch('https://api.twitter.com/2/users/me', {
    headers: {
      'Authorization': `Bearer ${data.access_token}`
    }
  });
  const userData = await userResponse.json();

  const expiresIn = data.expires_in || 7200;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    accountId: userData.data.id,
    accountName: userData.data.username,
    metadata: { userData: userData.data }
  };
}

async function exchangeLinkedInCode(code: string, config: any) {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.client_id,
      client_secret: config.client_secret,
      redirect_uri: config.redirect_url
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || 'LinkedIn OAuth error');
  }

  // Get user info
  const userResponse = await fetch('https://api.linkedin.com/v2/me', {
    headers: {
      'Authorization': `Bearer ${data.access_token}`
    }
  });
  const userData = await userResponse.json();

  const expiresIn = data.expires_in || 5184000;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    accountId: userData.id,
    accountName: `${userData.localizedFirstName} ${userData.localizedLastName}`,
    metadata: { userData }
  };
}

async function exchangeTikTokCode(code: string, config: any) {
  const response = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_key: config.client_id,
      client_secret: config.client_secret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirect_url
    })
  });

  const data = await response.json();

  if (data.data.error_code !== 0) {
    throw new Error(data.data.description || 'TikTok OAuth error');
  }

  const tokenData = data.data;
  const expiresIn = tokenData.expires_in || 86400;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt,
    accountId: tokenData.open_id,
    accountName: tokenData.open_id,
    metadata: { tokenData }
  };
}

async function exchangeTelegramCode(code: string, config: any) {
  // Telegram uses bot tokens, not OAuth
  // This is a simplified version
  return {
    accessToken: config.api_key,
    refreshToken: null,
    expiresAt: new Date('2099-12-31').toISOString(),
    accountId: config.channel_id,
    accountName: config.channel_id,
    metadata: { botToken: config.api_key }
  };
}
