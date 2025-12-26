import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  platform: 'tiktok' | 'facebook' | 'youtube' | 'instagram' | 'twitter';
  accountHandle: string;
  accountUrl?: string;
  companyId: string;
  profileId?: string;
}

// Platform-specific URL builders
const platformConfigs = {
  tiktok: {
    profileUrl: (handle: string) => `https://www.tiktok.com/@${handle.replace('@', '')}`,
    searchUrl: (handle: string) => `tiktok @${handle} latest posts`,
  },
  facebook: {
    profileUrl: (handle: string) => `https://www.facebook.com/${handle}`,
    searchUrl: (handle: string) => `facebook ${handle} posts updates`,
  },
  youtube: {
    profileUrl: (handle: string) => `https://www.youtube.com/@${handle.replace('@', '')}`,
    searchUrl: (handle: string) => `youtube ${handle} latest videos`,
  },
  instagram: {
    profileUrl: (handle: string) => `https://www.instagram.com/${handle.replace('@', '')}`,
    searchUrl: (handle: string) => `instagram ${handle} recent posts`,
  },
  twitter: {
    profileUrl: (handle: string) => `https://twitter.com/${handle.replace('@', '')}`,
    searchUrl: (handle: string) => `twitter ${handle} latest tweets`,
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { platform, accountHandle, accountUrl, companyId, profileId }: ScrapeRequest = await req.json();

    console.log(`Scraping ${platform} account: ${accountHandle}`);

    const config = platformConfigs[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const profileUrl = accountUrl || config.profileUrl(accountHandle);
    const searchQuery = config.searchUrl(accountHandle);

    // Step 1: Scrape the profile page for account info
    console.log('Scraping profile URL:', profileUrl);
    let profileData: any = null;
    
    try {
      const profileResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: profileUrl,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          waitFor: 3000,
        }),
      });

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        profileData = data.data || data;
        console.log('Profile scraped successfully');
      }
    } catch (e) {
      console.error('Error scraping profile:', e);
    }

    // Step 2: Search for recent posts/content
    console.log('Searching for recent content:', searchQuery);
    const posts: any[] = [];

    try {
      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 15,
          scrapeOptions: {
            formats: ['markdown'],
          },
        }),
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('Search returned', searchData.data?.length || 0, 'results');
        
        if (searchData.data) {
          for (const item of searchData.data) {
            posts.push({
              url: item.url,
              title: item.title,
              content: item.markdown || item.description || '',
              source: item.url,
            });
          }
        }
      }
    } catch (e) {
      console.error('Error searching content:', e);
    }

    // Step 3: Use AI to extract structured data
    let accountInfo: any = {
      account_name: accountHandle,
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      profile_image_url: null,
      bio: '',
    };

    if (lovableApiKey && profileData?.markdown) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a social media data extractor. Extract profile information from the scraped content and return JSON with:
- account_name: string (display name)
- bio: string (profile description/bio)
- followers_count: number (parse from text like "1.2M followers" -> 1200000)
- following_count: number
- posts_count: number (videos for youtube/tiktok, posts for others)
- profile_image_url: string or null
- verified: boolean

Be smart about parsing follower counts - "1.2M" = 1200000, "500K" = 500000, "10.5K" = 10500.
If you can't find a value, use reasonable defaults (0 for numbers, null for strings).`
              },
              {
                role: 'user',
                content: `Extract profile info from this ${platform} page:\n\n${profileData.markdown.substring(0, 5000)}`
              }
            ],
            tools: [
              {
                type: 'function',
                function: {
                  name: 'extract_profile',
                  description: 'Extract social media profile information',
                  parameters: {
                    type: 'object',
                    properties: {
                      account_name: { type: 'string' },
                      bio: { type: 'string' },
                      followers_count: { type: 'number' },
                      following_count: { type: 'number' },
                      posts_count: { type: 'number' },
                      profile_image_url: { type: 'string' },
                      verified: { type: 'boolean' }
                    },
                    required: ['account_name', 'followers_count']
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'extract_profile' } }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall?.function?.arguments) {
            try {
              accountInfo = { ...accountInfo, ...JSON.parse(toolCall.function.arguments) };
              console.log('AI extracted account info:', accountInfo);
            } catch (e) {
              console.error('Error parsing AI response:', e);
            }
          }
        }
      } catch (e) {
        console.error('AI extraction error:', e);
      }
    }

    // Step 4: Save/update the tracked account
    const { data: existingAccount } = await supabase
      .from('tracked_social_accounts')
      .select('id')
      .eq('company_id', companyId)
      .eq('platform', platform)
      .eq('account_handle', accountHandle)
      .single();

    let trackedAccountId: string;

    if (existingAccount) {
      const { error } = await supabase
        .from('tracked_social_accounts')
        .update({
          account_name: accountInfo.account_name,
          account_url: profileUrl,
          followers_count: accountInfo.followers_count,
          following_count: accountInfo.following_count,
          posts_count: accountInfo.posts_count,
          profile_image_url: accountInfo.profile_image_url,
          last_scraped_at: new Date().toISOString(),
          metadata: {
            bio: accountInfo.bio,
            verified: accountInfo.verified,
            raw_profile: profileData?.markdown?.substring(0, 2000),
          },
        })
        .eq('id', existingAccount.id);

      if (error) console.error('Error updating account:', error);
      trackedAccountId = existingAccount.id;
    } else {
      const { data: newAccount, error } = await supabase
        .from('tracked_social_accounts')
        .insert({
          company_id: companyId,
          profile_id: profileId,
          platform,
          account_handle: accountHandle,
          account_name: accountInfo.account_name,
          account_url: profileUrl,
          followers_count: accountInfo.followers_count,
          following_count: accountInfo.following_count,
          posts_count: accountInfo.posts_count,
          profile_image_url: accountInfo.profile_image_url,
          last_scraped_at: new Date().toISOString(),
          metadata: {
            bio: accountInfo.bio,
            verified: accountInfo.verified,
          },
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error inserting account:', error);
        throw error;
      }
      trackedAccountId = newAccount.id;
    }

    // Step 5: Process and store posts with AI analysis
    const processedPosts: any[] = [];

    for (const post of posts.slice(0, 10)) {
      let sentiment = { label: 'neutral', score: 0 };
      let entities = { hashtags: [], mentions: [], topics: [] };
      let engagement = 0;

      if (lovableApiKey && post.content) {
        try {
          const postAiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: `Analyze this social media post and extract:
- sentiment: { label: "positive" | "negative" | "neutral", score: -1 to 1 }
- entities: { hashtags: string[], mentions: string[], topics: string[] }
- engagement_indicators: number (estimated engagement 0-100 based on content quality)
- summary: string (1 sentence summary)

Extract hashtags starting with #, mentions starting with @, and key topics discussed.`
                },
                {
                  role: 'user',
                  content: `Analyze this ${platform} post:\n\nTitle: ${post.title}\n\nContent: ${post.content.substring(0, 2000)}`
                }
              ],
              tools: [
                {
                  type: 'function',
                  function: {
                    name: 'analyze_post',
                    description: 'Analyze social media post',
                    parameters: {
                      type: 'object',
                      properties: {
                        sentiment: {
                          type: 'object',
                          properties: {
                            label: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
                            score: { type: 'number' }
                          }
                        },
                        entities: {
                          type: 'object',
                          properties: {
                            hashtags: { type: 'array', items: { type: 'string' } },
                            mentions: { type: 'array', items: { type: 'string' } },
                            topics: { type: 'array', items: { type: 'string' } }
                          }
                        },
                        engagement_indicators: { type: 'number' },
                        summary: { type: 'string' }
                      },
                      required: ['sentiment', 'entities']
                    }
                  }
                }
              ],
              tool_choice: { type: 'function', function: { name: 'analyze_post' } }
            }),
          });

          if (postAiResponse.ok) {
            const postAiData = await postAiResponse.json();
            const toolCall = postAiData.choices?.[0]?.message?.tool_calls?.[0];
            
            if (toolCall?.function?.arguments) {
              const parsed = JSON.parse(toolCall.function.arguments);
              sentiment = parsed.sentiment || sentiment;
              entities = parsed.entities || entities;
              engagement = parsed.engagement_indicators || 0;
            }
          }
        } catch (e) {
          console.error('Error analyzing post:', e);
        }
      }

      // Generate a unique post ID from URL
      const postId = btoa(post.url).substring(0, 50);

      processedPosts.push({
        company_id: companyId,
        tracked_account_id: trackedAccountId,
        platform,
        post_id: postId,
        post_url: post.url,
        content: post.content.substring(0, 5000),
        sentiment_label: sentiment.label,
        sentiment_score: sentiment.score,
        entities,
        hashtags: entities.hashtags,
        mentions: entities.mentions,
        engagement_score: engagement,
        scraped_at: new Date().toISOString(),
        is_processed: true,
        metadata: {
          title: post.title,
          source: post.source,
          topics: entities.topics,
        },
      });
    }

    // Upsert posts
    if (processedPosts.length > 0) {
      const { error: postsError } = await supabase
        .from('scraped_social_posts')
        .upsert(processedPosts, { 
          onConflict: 'company_id,platform,post_id',
          ignoreDuplicates: false 
        });

      if (postsError) {
        console.error('Error storing posts:', postsError);
      } else {
        console.log('Stored', processedPosts.length, 'posts');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        account: accountInfo,
        postsScraped: processedPosts.length,
        trackedAccountId,
        message: `Successfully scraped ${accountHandle} on ${platform}. Found ${processedPosts.length} posts.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Social scrape error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
