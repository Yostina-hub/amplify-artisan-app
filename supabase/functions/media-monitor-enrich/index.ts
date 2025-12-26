import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichRequest {
  mentionIds?: string[];
  companyId?: string;
  action: 'sentiment' | 'entities' | 'translate' | 'cluster' | 'all';
  targetLanguage?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
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

    const { mentionIds, companyId, action, targetLanguage = 'en' } = await req.json() as EnrichRequest;

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

    console.log(`Enriching mentions for company: ${targetCompanyId}, action: ${action}`);

    // Get mentions to process
    let mentionsQuery = supabase
      .from('media_mentions')
      .select('*')
      .eq('company_id', targetCompanyId);

    if (mentionIds && mentionIds.length > 0) {
      mentionsQuery = mentionsQuery.in('id', mentionIds);
    } else {
      // Process unprocessed mentions (limit to 50 at a time)
      mentionsQuery = mentionsQuery.is('processed_at', null).limit(50);
    }

    const { data: mentions, error: mentionsError } = await mentionsQuery;

    if (mentionsError) {
      throw mentionsError;
    }

    console.log(`Found ${mentions?.length || 0} mentions to enrich`);

    let processed = 0;
    const results: any[] = [];

    for (const mention of mentions || []) {
      const updates: any = {};

      try {
        // Sentiment Analysis
        if (action === 'sentiment' || action === 'all') {
          if (lovableApiKey && mention.content) {
            const sentimentResult = await analyzeSentiment(mention.content, lovableApiKey);
            updates.sentiment_score = sentimentResult.score;
            updates.sentiment_label = sentimentResult.label;
            updates.emotions = sentimentResult.emotions;
          }
        }

        // Entity Extraction
        if (action === 'entities' || action === 'all') {
          if (lovableApiKey && mention.content) {
            const entities = await extractEntities(mention.content, lovableApiKey);
            updates.entities = entities;
            updates.topics = entities.topics || [];
          }
        }

        // Translation
        if (action === 'translate' || action === 'all') {
          if (lovableApiKey && mention.content && mention.language !== targetLanguage) {
            const translated = await translateContent(mention.content, mention.language, targetLanguage, lovableApiKey);
            updates.translated_content = translated;
            updates.translated_language = targetLanguage;
          }
        }

        // Clustering
        if (action === 'cluster' || action === 'all') {
          // Find or create cluster based on content similarity
          const clusterId = await findOrCreateCluster(supabase, mention, targetCompanyId);
          if (clusterId) {
            updates.cluster_id = clusterId;
          }
        }

        updates.processed_at = new Date().toISOString();

        // Update mention
        await supabase
          .from('media_mentions')
          .update(updates)
          .eq('id', mention.id);

        processed++;
        results.push({ id: mention.id, status: 'success', updates });

      } catch (error) {
        console.error(`Error processing mention ${mention.id}:`, error);
        results.push({ id: mention.id, status: 'error', error: String(error) });
      }
    }

    console.log(`Enrichment complete: ${processed} mentions processed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Enrichment error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeSentiment(content: string, apiKey: string) {
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
            content: 'You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with JSON containing: score (-1 to 1), label (positive/negative/neutral/mixed), and emotions (object with joy, anger, fear, sadness, surprise as 0-1 values).'
          },
          { role: 'user', content: `Analyze this text: "${content}"` }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error('Sentiment API error');
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(result.replace(/```json\n?|\n?```/g, ''));
      return {
        score: parsed.score || 0,
        label: parsed.label || 'neutral',
        emotions: parsed.emotions || {},
      };
    } catch {
      // Fallback to simple sentiment
      const lower = content.toLowerCase();
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'happy'];
      const negativeWords = ['bad', 'terrible', 'hate', 'angry', 'sad', 'poor'];
      
      const posCount = positiveWords.filter(w => lower.includes(w)).length;
      const negCount = negativeWords.filter(w => lower.includes(w)).length;
      
      if (posCount > negCount) return { score: 0.5, label: 'positive', emotions: {} };
      if (negCount > posCount) return { score: -0.5, label: 'negative', emotions: {} };
      return { score: 0, label: 'neutral', emotions: {} };
    }
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return { score: 0, label: 'neutral', emotions: {} };
  }
}

async function extractEntities(content: string, apiKey: string) {
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
            content: 'You are an NER expert. Extract entities from text and respond with JSON containing: people (array), organizations (array), locations (array), products (array), topics (array of 1-3 word topic phrases).'
          },
          { role: 'user', content: `Extract entities from: "${content}"` }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error('Entity extraction API error');
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';
    
    try {
      return JSON.parse(result.replace(/```json\n?|\n?```/g, ''));
    } catch {
      return { people: [], organizations: [], locations: [], products: [], topics: [] };
    }
  } catch (error) {
    console.error('Entity extraction error:', error);
    return { people: [], organizations: [], locations: [], products: [], topics: [] };
  }
}

async function translateContent(content: string, fromLang: string, toLang: string, apiKey: string) {
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
            content: `You are a professional translator. Translate the following text from ${fromLang} to ${toLang}. Return only the translated text, no explanations.`
          },
          { role: 'user', content }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error('Translation API error');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || content;
  } catch (error) {
    console.error('Translation error:', error);
    return content;
  }
}

async function findOrCreateCluster(supabase: any, mention: any, companyId: string) {
  // Simple clustering based on content similarity
  // In production, use embeddings and vector similarity
  
  const keywords = mention.matched_keywords || [];
  const topics = mention.topics || [];
  
  if (keywords.length === 0 && topics.length === 0) {
    return null;
  }

  // Look for existing cluster with similar topics/keywords
  const { data: existingClusters } = await supabase
    .from('media_clusters')
    .select('*')
    .eq('company_id', companyId)
    .gte('last_updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(10);

  for (const cluster of existingClusters || []) {
    const clusterTopics = cluster.top_entities?.topics || [];
    const overlap = topics.filter((t: string) => 
      clusterTopics.some((ct: string) => 
        ct.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(ct.toLowerCase())
      )
    );
    
    if (overlap.length > 0) {
      // Update cluster stats
      await supabase
        .from('media_clusters')
        .update({
          mention_count: (cluster.mention_count || 0) + 1,
          total_reach: (cluster.total_reach || 0) + (mention.reach_estimate || 0),
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', cluster.id);
      
      return cluster.id;
    }
  }

  // Create new cluster
  const { data: newCluster } = await supabase
    .from('media_clusters')
    .insert({
      company_id: companyId,
      title: topics[0] || keywords[0] || 'Unnamed Story',
      summary: mention.content?.substring(0, 200),
      first_seen_at: mention.published_at,
      mention_count: 1,
      total_reach: mention.reach_estimate || 0,
      avg_sentiment: mention.sentiment_score,
      dominant_sentiment: mention.sentiment_label,
      top_entities: { topics, keywords },
      top_sources: [mention.platform],
    })
    .select()
    .single();

  return newCluster?.id;
}
