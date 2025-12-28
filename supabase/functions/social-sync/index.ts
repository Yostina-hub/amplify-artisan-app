import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  author_name: string;
  author_handle: string;
  published_at: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
  permalink: string;
  sentiment?: {
    score: number;
    label: string;
    emotions: Record<string, number>;
  };
}

// Platform-specific API fetchers
async function fetchFacebookData(token: string, accountId: string): Promise<SocialPost[]> {
  try {
    // Fetch posts from Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/feed?fields=id,message,created_time,shares,likes.summary(true),comments.summary(true),permalink_url&access_token=${token}&limit=50`
    );
    
    if (!response.ok) {
      console.error('Facebook API error:', await response.text());
      return [];
    }
    
    const data = await response.json();
    
    return (data.data || []).map((post: any) => ({
      id: post.id,
      platform: 'facebook',
      content: post.message || '',
      author_name: accountId,
      author_handle: accountId,
      published_at: post.created_time,
      engagement: {
        likes: post.likes?.summary?.total_count || 0,
        shares: post.shares?.count || 0,
        comments: post.comments?.summary?.total_count || 0,
        views: 0,
      },
      permalink: post.permalink_url || `https://facebook.com/${post.id}`,
    }));
  } catch (error) {
    console.error('Facebook fetch error:', error);
    return [];
  }
}

async function fetchInstagramData(token: string, accountId: string): Promise<SocialPost[]> {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${accountId}/media?fields=id,caption,timestamp,like_count,comments_count,permalink&access_token=${token}&limit=50`
    );
    
    if (!response.ok) {
      console.error('Instagram API error:', await response.text());
      return [];
    }
    
    const data = await response.json();
    
    return (data.data || []).map((post: any) => ({
      id: post.id,
      platform: 'instagram',
      content: post.caption || '',
      author_name: accountId,
      author_handle: accountId,
      published_at: post.timestamp,
      engagement: {
        likes: post.like_count || 0,
        shares: 0,
        comments: post.comments_count || 0,
        views: 0,
      },
      permalink: post.permalink || `https://instagram.com/p/${post.id}`,
    }));
  } catch (error) {
    console.error('Instagram fetch error:', error);
    return [];
  }
}

async function fetchTwitterData(token: string, accountId: string): Promise<SocialPost[]> {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/${accountId}/tweets?tweet.fields=created_at,public_metrics&max_results=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      console.error('Twitter API error:', await response.text());
      return [];
    }
    
    const data = await response.json();
    
    return (data.data || []).map((tweet: any) => ({
      id: tweet.id,
      platform: 'twitter',
      content: tweet.text || '',
      author_name: accountId,
      author_handle: `@${accountId}`,
      published_at: tweet.created_at,
      engagement: {
        likes: tweet.public_metrics?.like_count || 0,
        shares: tweet.public_metrics?.retweet_count || 0,
        comments: tweet.public_metrics?.reply_count || 0,
        views: tweet.public_metrics?.impression_count || 0,
      },
      permalink: `https://twitter.com/i/status/${tweet.id}`,
    }));
  } catch (error) {
    console.error('Twitter fetch error:', error);
    return [];
  }
}

async function fetchLinkedInData(token: string, accountId: string): Promise<SocialPost[]> {
  try {
    // LinkedIn API requires different approach - using UGC posts
    const response = await fetch(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:${accountId})&count=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    
    if (!response.ok) {
      console.error('LinkedIn API error:', await response.text());
      return [];
    }
    
    const data = await response.json();
    
    return (data.elements || []).map((post: any) => ({
      id: post.id,
      platform: 'linkedin',
      content: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
      author_name: accountId,
      author_handle: accountId,
      published_at: new Date(post.created?.time || Date.now()).toISOString(),
      engagement: {
        likes: 0,
        shares: 0,
        comments: 0,
        views: 0,
      },
      permalink: `https://linkedin.com/feed/update/${post.id}`,
    }));
  } catch (error) {
    console.error('LinkedIn fetch error:', error);
    return [];
  }
}

async function fetchYouTubeData(token: string, channelId: string): Promise<SocialPost[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      console.error('YouTube API error:', await response.text());
      return [];
    }
    
    const data = await response.json();
    
    // Get video statistics
    const videoIds = (data.items || []).map((v: any) => v.id.videoId).join(',');
    const statsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    const statsData = await statsResponse.json();
    const statsMap = new Map((statsData.items || []).map((v: any) => [v.id, v.statistics]));
    
    return (data.items || []).map((video: any) => {
      const stats: any = statsMap.get(video.id.videoId) || {};
      return {
        id: video.id.videoId,
        platform: 'youtube',
        content: video.snippet?.title + '\n' + (video.snippet?.description || ''),
        author_name: video.snippet?.channelTitle || channelId,
        author_handle: channelId,
        published_at: video.snippet?.publishedAt,
        engagement: {
          likes: parseInt(stats.likeCount || '0'),
          shares: 0,
          comments: parseInt(stats.commentCount || '0'),
          views: parseInt(stats.viewCount || '0'),
        },
        permalink: `https://youtube.com/watch?v=${video.id.videoId}`,
      };
    });
  } catch (error) {
    console.error('YouTube fetch error:', error);
    return [];
  }
}

// Sentiment analysis using Lovable AI
async function analyzeSentiment(content: string, apiKey: string): Promise<{ score: number; label: string; emotions: Record<string, number>; topics: string[]; keywords: string[] }> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert sentiment analyzer. Analyze the following text and respond ONLY with valid JSON:
{
  "sentiment": "positive|negative|neutral|mixed",
  "score": <number from -1 to 1>,
  "confidence": <number from 0 to 1>,
  "emotions": {"joy": 0.0, "anger": 0.0, "sadness": 0.0, "surprise": 0.0, "fear": 0.0},
  "topics": ["topic1", "topic2"],
  "keywords": ["keyword1", "keyword2"]
}`
          },
          {
            role: 'user',
            content: `Analyze this: ${content.substring(0, 1000)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Sentiment API error:', response.status);
      return { score: 0, label: 'neutral', emotions: {}, topics: [], keywords: [] };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score || 0,
        label: parsed.sentiment || 'neutral',
        emotions: parsed.emotions || {},
        topics: parsed.topics || [],
        keywords: parsed.keywords || [],
      };
    }
    
    return { score: 0, label: 'neutral', emotions: {}, topics: [], keywords: [] };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return { score: 0, label: 'neutral', emotions: {}, topics: [], keywords: [] };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
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

    const { platforms, analyzeSentiments = true } = await req.json();

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User has no company');
    }

    const companyId = profile.company_id;
    console.log(`Starting social sync for company: ${companyId}`);

    // Get active social tokens for the company
    let tokensQuery = supabase
      .from('social_platform_tokens')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (platforms && platforms.length > 0) {
      tokensQuery = tokensQuery.in('platform', platforms);
    }

    const { data: tokens, error: tokensError } = await tokensQuery;

    if (tokensError) {
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No connected accounts to sync', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tokens.length} connected accounts`);

    let totalPosts = 0;
    let totalNew = 0;
    let totalAnalyzed = 0;
    const errors: string[] = [];

    // Process each connected account
    for (const token of tokens) {
      console.log(`Syncing ${token.platform} account: ${token.account_name}`);
      
      let posts: SocialPost[] = [];
      
      try {
        switch (token.platform) {
          case 'facebook':
            posts = await fetchFacebookData(token.access_token, token.account_id);
            break;
          case 'instagram':
            posts = await fetchInstagramData(token.access_token, token.account_id);
            break;
          case 'twitter':
            posts = await fetchTwitterData(token.access_token, token.account_id);
            break;
          case 'linkedin':
            posts = await fetchLinkedInData(token.access_token, token.account_id);
            break;
          case 'youtube':
            posts = await fetchYouTubeData(token.access_token, token.account_id);
            break;
          default:
            console.log(`Platform ${token.platform} not yet supported for auto-sync`);
            continue;
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`${token.platform}: ${errorMessage}`);
        continue;
      }

      console.log(`Fetched ${posts.length} posts from ${token.platform}`);
      totalPosts += posts.length;

      // Store posts as media mentions
      for (const post of posts) {
        if (!post.content) continue;

        // Check for duplicates
        const { data: existing } = await supabase
          .from('media_mentions')
          .select('id')
          .eq('company_id', companyId)
          .eq('platform', post.platform)
          .eq('external_id', post.id)
          .maybeSingle();

        if (existing) continue;

        // Analyze sentiment if enabled
        let sentimentData = { score: 0, label: 'neutral' as string, emotions: {} as Record<string, number>, topics: [] as string[], keywords: [] as string[] };
        if (analyzeSentiments && lovableApiKey) {
          sentimentData = await analyzeSentiment(post.content, lovableApiKey);
          totalAnalyzed++;
        }

        // Insert mention
        const { error: insertError } = await supabase
          .from('media_mentions')
          .insert({
            company_id: companyId,
            platform: post.platform,
            external_id: post.id,
            permalink: post.permalink,
            author_name: post.author_name,
            author_handle: post.author_handle,
            content: post.content,
            published_at: post.published_at,
            engagement_likes: post.engagement.likes,
            engagement_shares: post.engagement.shares,
            engagement_comments: post.engagement.comments,
            engagement_views: post.engagement.views,
            sentiment_score: sentimentData.score,
            sentiment_label: sentimentData.label,
            emotions: sentimentData.emotions,
            topics: sentimentData.topics,
            matched_keywords: sentimentData.keywords,
            processed_at: new Date().toISOString(),
          });

        if (!insertError) {
          totalNew++;
        }

        // Also store in sentiment_analysis for detailed tracking
        if (analyzeSentiments && lovableApiKey) {
          await supabase.from('sentiment_analysis').insert({
            company_id: companyId,
            platform: post.platform,
            content_id: post.id,
            content_type: 'post',
            content_text: post.content,
            sentiment: sentimentData.label,
            sentiment_score: sentimentData.score,
            confidence: 0.85,
            emotions: sentimentData.emotions,
            topics: sentimentData.topics,
            keywords: sentimentData.keywords,
            ai_model: 'google/gemini-2.5-flash',
          });
        }
      }

      // Update last_synced_at
      await supabase
        .from('social_platform_tokens')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', token.id);
    }

    console.log(`Sync complete: ${totalNew} new posts, ${totalAnalyzed} analyzed`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: totalNew,
        total_fetched: totalPosts,
        analyzed: totalAnalyzed,
        accounts: tokens.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Social sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});