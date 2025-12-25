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
    const error = url.searchParams.get('error');

    console.log('OAuth callback received:', { 
      hasCode: !!code, 
      hasState: !!state, 
      error 
    });

    if (error) {
      console.error('OAuth error from provider:', error);
      return new Response(
        JSON.stringify({ error: `OAuth error: ${error}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!code || !state) {
      console.error('Missing required parameters:', { code: !!code, state: !!state });
      throw new Error('Missing required parameters: code and state are required');
    }

    // Decode state to get user info and platform
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch (e) {
      console.error('Failed to decode state:', e);
      throw new Error('Invalid state parameter');
    }

    const { userId, companyId, platform } = stateData;
    
    if (!userId || !companyId || !platform) {
      console.error('Missing state data:', { userId: !!userId, companyId: !!companyId, platform: !!platform });
      throw new Error('Invalid state: missing userId, companyId, or platform');
    }

    console.log(`Processing OAuth callback for platform: ${platform}, user: ${userId}, company: ${companyId}`);

    // Get centralized platform OAuth config using TEXT-based platform_id
    const { data: platformOAuthConfig, error: configError } = await supabase
      .from('platform_oauth_apps')
      .select('*')
      .eq('platform_id', platform.toLowerCase())
      .eq('is_active', true)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching OAuth config:', configError);
      throw new Error('Failed to fetch OAuth configuration');
    }

    if (!platformOAuthConfig) {
      console.error(`No OAuth config found for platform: ${platform}`);
      throw new Error(`OAuth not configured for ${platform}. Contact your administrator.`);
    }

    if (!platformOAuthConfig.client_id || !platformOAuthConfig.client_secret) {
      console.error('OAuth credentials missing for platform:', platform);
      throw new Error('OAuth credentials not configured');
    }

    console.log(`Found OAuth config for ${platform}, exchanging code for token...`);

    let tokenData;

    // Exchange code for access token based on platform
    switch (platform.toLowerCase()) {
      case 'facebook':
        tokenData = await exchangeFacebookCode(code, platformOAuthConfig);
        break;
      case 'instagram':
        tokenData = await exchangeInstagramCode(code, platformOAuthConfig);
        break;
      case 'twitter':
        tokenData = await exchangeTwitterCode(code, platformOAuthConfig);
        break;
      case 'linkedin':
        tokenData = await exchangeLinkedInCode(code, platformOAuthConfig);
        break;
      case 'tiktok':
        tokenData = await exchangeTikTokCode(code, platformOAuthConfig);
        break;
      case 'youtube':
        tokenData = await exchangeYouTubeCode(code, platformOAuthConfig);
        break;
      default:
        throw new Error(`Platform ${platform} not supported`);
    }

    console.log(`Token exchange successful for ${platform}, account: ${tokenData.accountName}`);

    // Save or update token in social_platform_tokens
    const { error: tokenError } = await supabase
      .from('social_platform_tokens')
      .upsert({
        company_id: companyId,
        platform: platform.toLowerCase(),
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        token_expires_at: tokenData.expiresAt,
        account_id: tokenData.accountId,
        account_name: tokenData.accountName,
        scopes: tokenData.scopes || [],
        is_active: true,
        metadata: tokenData.metadata || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id,platform,account_id'
      });

    if (tokenError) {
      console.error('Error saving token:', tokenError);
      throw new Error(`Failed to save token: ${tokenError.message}`);
    }

    console.log(`Successfully connected ${platform} account: ${tokenData.accountName}`);

    // Generate success redirect URL - redirect to the app's social connections page
    const appUrl = supabaseUrl.replace('.supabase.co', '.lovable.app');
    const redirectUrl = `${appUrl}/social-connections?success=true&platform=${platform}`;
    
    console.log(`Redirecting to: ${redirectUrl}`);

    // Return HTML that closes the popup and notifies parent
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connection Successful</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            .checkmark {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 { margin: 0 0 0.5rem; }
            p { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✅</div>
            <h1>Connected!</h1>
            <p>${platform} account connected successfully.</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            // Notify parent window and close popup
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'oauth-success', 
                platform: '${platform}',
                accountName: '${tokenData.accountName}'
              }, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              // If not a popup, redirect
              setTimeout(() => {
                window.location.href = '${redirectUrl}';
              }, 1500);
            }
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html'
      }
    });

  } catch (error) {
    console.error('Error in oauth-callback:', error);
    
    // Return error HTML for popup
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #eb4d4b 0%, #c0392b 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 400px;
            }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
            h1 { margin: 0 0 0.5rem; }
            p { opacity: 0.9; font-size: 0.9rem; }
            button {
              margin-top: 1rem;
              padding: 0.75rem 1.5rem;
              border: 2px solid white;
              background: transparent;
              color: white;
              border-radius: 8px;
              cursor: pointer;
              font-size: 1rem;
            }
            button:hover { background: rgba(255,255,255,0.1); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>Connection Failed</h1>
            <p>${errorMessage}</p>
            <button onclick="window.close()">Close</button>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'oauth-error', 
                error: '${errorMessage}'
              }, '*');
            }
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html'
      }
    });
  }
});

// Facebook token exchange
async function exchangeFacebookCode(code: string, config: any) {
  console.log('Exchanging Facebook code...');
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${config.client_id}&` +
    `client_secret=${config.client_secret}&` +
    `redirect_uri=${encodeURIComponent(config.redirect_url)}&` +
    `code=${code}`
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error('Facebook token error:', data);
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
    scopes: ['pages_manage_posts', 'pages_read_engagement'],
    metadata: { userData }
  };
}

// Instagram token exchange (via Facebook Graph API)
async function exchangeInstagramCode(code: string, config: any) {
  console.log('Exchanging Instagram code...');
  
  const response = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.client_id,
      client_secret: config.client_secret,
      grant_type: 'authorization_code',
      redirect_uri: config.redirect_url,
      code
    })
  });

  const data = await response.json();

  if (!response.ok || data.error_type) {
    console.error('Instagram token error:', data);
    throw new Error(data.error_message || 'Instagram OAuth error');
  }

  // Get user profile
  const userResponse = await fetch(
    `https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`
  );
  const userData = await userResponse.json();

  return {
    accessToken: data.access_token,
    refreshToken: null,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    accountId: userData.id || data.user_id,
    accountName: userData.username || data.user_id,
    scopes: ['user_profile', 'user_media'],
    metadata: { userData }
  };
}

// Twitter token exchange
async function exchangeTwitterCode(code: string, config: any) {
  console.log('Exchanging Twitter code...');
  
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
      code_verifier: 'challenge' // Note: In production, use proper PKCE
    })
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error('Twitter token error:', data);
    throw new Error(data.error_description || 'Twitter OAuth error');
  }

  // Get user info
  const userResponse = await fetch('https://api.twitter.com/2/users/me', {
    headers: { 'Authorization': `Bearer ${data.access_token}` }
  });
  const userData = await userResponse.json();

  const expiresIn = data.expires_in || 7200;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    accountId: userData.data?.id,
    accountName: userData.data?.username,
    scopes: ['tweet.read', 'tweet.write', 'users.read'],
    metadata: { userData: userData.data }
  };
}

// LinkedIn token exchange
async function exchangeLinkedInCode(code: string, config: any) {
  console.log('Exchanging LinkedIn code...');
  
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.client_id,
      client_secret: config.client_secret,
      redirect_uri: config.redirect_url
    })
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error('LinkedIn token error:', data);
    throw new Error(data.error_description || 'LinkedIn OAuth error');
  }

  // Get user info
  const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${data.access_token}` }
  });
  const userData = await userResponse.json();

  const expiresIn = data.expires_in || 5184000; // 60 days
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    accountId: userData.sub,
    accountName: userData.name || `${userData.given_name} ${userData.family_name}`,
    scopes: ['openid', 'profile', 'w_member_social'],
    metadata: { userData }
  };
}

// TikTok token exchange
async function exchangeTikTokCode(code: string, config: any) {
  console.log('Exchanging TikTok code...');
  
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: config.client_id,
      client_secret: config.client_secret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirect_url
    })
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error('TikTok token error:', data);
    throw new Error(data.error_description || data.error?.message || 'TikTok OAuth error');
  }

  const expiresIn = data.expires_in || 86400;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    accountId: data.open_id,
    accountName: data.open_id, // TikTok doesn't return username in token response
    scopes: ['user.info.basic', 'video.list'],
    metadata: { tokenData: data }
  };
}

// YouTube (Google) token exchange
async function exchangeYouTubeCode(code: string, config: any) {
  console.log('Exchanging YouTube code...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.client_id,
      client_secret: config.client_secret,
      redirect_uri: config.redirect_url,
      grant_type: 'authorization_code'
    })
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error('YouTube token error:', data);
    throw new Error(data.error_description || 'YouTube OAuth error');
  }

  // Get channel info
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`,
    { headers: { 'Authorization': `Bearer ${data.access_token}` } }
  );
  const channelData = await channelResponse.json();
  
  const channel = channelData.items?.[0];
  const expiresIn = data.expires_in || 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    accountId: channel?.id || 'unknown',
    accountName: channel?.snippet?.title || 'YouTube Channel',
    scopes: ['youtube', 'youtube.readonly', 'youtube.upload'],
    metadata: { channelData: channel }
  };
}
