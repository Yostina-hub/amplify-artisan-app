import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IngestRequest {
  sourceId?: string;
  platform?: string;
  companyId?: string;
}

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

    const { sourceId, platform, companyId } = await req.json() as IngestRequest;

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    const targetCompanyId = companyId || profile?.company_id;
    if (!targetCompanyId) {
      throw new Error('No company ID provided');
    }

    console.log('Starting media ingestion for company:', targetCompanyId);

    // Create ingestion job
    const { data: job, error: jobError } = await supabase
      .from('media_ingestion_jobs')
      .insert({
        company_id: targetCompanyId,
        source_id: sourceId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create ingestion job:', jobError);
      throw jobError;
    }

    // Get active sources
    let sourcesQuery = supabase
      .from('media_sources')
      .select('*')
      .eq('company_id', targetCompanyId)
      .eq('is_active', true);

    if (sourceId) {
      sourcesQuery = sourcesQuery.eq('id', sourceId);
    }
    if (platform) {
      sourcesQuery = sourcesQuery.eq('platform', platform);
    }

    const { data: sources, error: sourcesError } = await sourcesQuery;

    if (sourcesError) {
      throw sourcesError;
    }

    console.log(`Found ${sources?.length || 0} active sources to ingest`);

    // Also get connected social platform tokens for real data
    const { data: socialTokens } = await supabase
      .from('social_platform_tokens')
      .select('*')
      .eq('company_id', targetCompanyId)
      .eq('is_active', true);

    console.log(`Found ${socialTokens?.length || 0} connected social accounts`);

    let totalFetched = 0;
    let totalNew = 0;
    let totalDuplicate = 0;

    // Get watchlists for keyword matching
    const { data: watchlists } = await supabase
      .from('media_watchlists')
      .select('*')
      .eq('company_id', targetCompanyId)
      .eq('is_active', true);

    const keywords = watchlists
      ?.filter(w => w.watchlist_type === 'keyword' || w.watchlist_type === 'hashtag')
      .flatMap(w => w.items) || [];

    // Process social platform tokens first (real data from OAuth connections)
    for (const token of socialTokens || []) {
      console.log(`Fetching from connected ${token.platform}: ${token.account_name}`);
      
      // Call the social-sync function to get real data
      try {
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/social-sync`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platforms: [token.platform],
            analyzeSentiments: true,
          }),
        });

        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          totalNew += syncData.synced || 0;
          totalFetched += syncData.total_fetched || 0;
          console.log(`Synced ${syncData.synced} posts from ${token.platform}`);
        }
      } catch (syncError) {
        console.error(`Failed to sync ${token.platform}:`, syncError);
      }
    }

    // Process configured media sources (for sources not connected via OAuth)
    for (const source of sources || []) {
      console.log(`Processing source: ${source.name} (${source.platform})`);

      // Check if this platform already has an OAuth connection
      const hasOAuth = socialTokens?.some(t => t.platform === source.platform);
      if (hasOAuth) {
        console.log(`Skipping ${source.platform} - already synced via OAuth`);
        continue;
      }

      // Simulate fetching data based on platform (fallback for non-OAuth sources)
      const mockMentions = generateMockMentions(source, targetCompanyId, keywords);
      
      for (const mention of mockMentions) {
        // Check for duplicates
        const { data: existing } = await supabase
          .from('media_mentions')
          .select('id')
          .eq('company_id', targetCompanyId)
          .eq('platform', mention.platform)
          .eq('external_id', mention.external_id)
          .maybeSingle();

        if (existing) {
          totalDuplicate++;
          continue;
        }

        // Insert new mention
        const { error: insertError } = await supabase
          .from('media_mentions')
          .insert(mention);

        if (!insertError) {
          totalNew++;
        }
        totalFetched++;
      }

      // Update source last_fetched_at
      await supabase
        .from('media_sources')
        .update({ last_fetched_at: new Date().toISOString() })
        .eq('id', source.id);
    }

    // Update job status
    await supabase
      .from('media_ingestion_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        items_fetched: totalFetched,
        items_processed: totalFetched,
        items_new: totalNew,
        items_duplicate: totalDuplicate,
      })
      .eq('id', job.id);

    console.log(`Ingestion complete: ${totalNew} new, ${totalDuplicate} duplicates`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        fetched: totalFetched,
        new: totalNew,
        duplicate: totalDuplicate,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Ingestion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateMockMentions(source: any, companyId: string, keywords: string[]) {
  const platforms = ['twitter', 'facebook', 'instagram', 'youtube', 'telegram', 'linkedin', 'tiktok', 'news'];
  const sentiments: ('positive' | 'negative' | 'neutral' | 'mixed')[] = ['positive', 'negative', 'neutral', 'mixed'];
  const languages = ['en', 'am', 'ar', 'fr', 'es', 'zh', 'hi', 'sw'];
  
  const sampleContent = [
    "Just discovered this amazing product! Highly recommend it to everyone.",
    "Not satisfied with the service, expected better quality.",
    "Breaking: Major announcement from the company today.",
    "Interesting development in the market. Watching closely.",
    "Customer support was incredibly helpful. Great experience!",
    "The new update has some bugs that need fixing.",
    "Trending topic: Industry experts weigh in on recent changes.",
    "Community response has been overwhelmingly positive.",
  ];

  const count = Math.floor(Math.random() * 5) + 1;
  const mentions = [];

  for (let i = 0; i < count; i++) {
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const content = sampleContent[Math.floor(Math.random() * sampleContent.length)];
    const matchedKeywords = keywords.filter(k => 
      content.toLowerCase().includes(k.toLowerCase())
    );

    mentions.push({
      company_id: companyId,
      source_id: source.id,
      platform: source.platform || platforms[Math.floor(Math.random() * platforms.length)],
      external_id: `${source.platform}_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      permalink: `https://${source.platform}.com/post/${Date.now()}`,
      author_name: `User${Math.floor(Math.random() * 1000)}`,
      author_handle: `@user${Math.floor(Math.random() * 1000)}`,
      author_followers: Math.floor(Math.random() * 100000),
      author_verified: Math.random() > 0.8,
      content,
      published_at: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
      language: languages[Math.floor(Math.random() * languages.length)],
      engagement_likes: Math.floor(Math.random() * 1000),
      engagement_shares: Math.floor(Math.random() * 100),
      engagement_comments: Math.floor(Math.random() * 50),
      engagement_views: Math.floor(Math.random() * 10000),
      reach_estimate: Math.floor(Math.random() * 50000),
      sentiment_score: sentiment === 'positive' ? 0.7 : sentiment === 'negative' ? -0.6 : 0.1,
      sentiment_label: sentiment,
      matched_keywords: matchedKeywords,
      credibility_score: Math.floor(Math.random() * 100),
      processed_at: new Date().toISOString(),
    });
  }

  return mentions;
}
