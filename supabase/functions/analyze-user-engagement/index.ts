import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  userId: string;
  companyId?: string;
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

    const payload: AnalysisRequest = await req.json();
    console.log('Analyzing engagement for user:', payload.userId);

    // Get user's engagement history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: engagements, error: engError } = await supabase
      .from('user_engagement')
      .select('*')
      .eq('user_id', payload.userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (engError) throw engError;

    if (!engagements || engagements.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No engagement data available yet'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Prepare engagement summary for AI
    const engagementSummary = {
      total_interactions: engagements.length,
      by_type: engagements.reduce((acc, e) => {
        acc[e.engagement_type] = (acc[e.engagement_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avg_duration: engagements
        .filter(e => e.engagement_duration)
        .reduce((sum, e) => sum + (e.engagement_duration || 0), 0) / engagements.length,
      peak_hours: calculatePeakHours(engagements),
      recent_posts: await getRecentPosts(supabase, engagements)
    };

    // Use AI to analyze patterns
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
            content: `You are an AI engagement analyst specializing in user behavior patterns similar to TikTok's algorithm. 
Analyze user engagement data and provide actionable insights for content recommendations and optimal engagement times.`
          },
          {
            role: 'user',
            content: `Analyze this user's engagement patterns and provide recommendations:

Engagement Summary:
${JSON.stringify(engagementSummary, null, 2)}

Provide your analysis in JSON format with these keys:
- preferred_content_types: array of content types they engage with most
- preferred_topics: array of topics they're interested in
- optimal_engagement_times: array of {hour, day_of_week} when they're most active
- engagement_score: number 0-100 indicating overall engagement level
- recommendations: array of actionable recommendations
- content_strategy: string describing optimal content strategy for this user`
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error(`AI analysis failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // Store or update user preferences
    const { error: upsertError } = await supabase
      .from('user_content_preferences')
      .upsert({
        user_id: payload.userId,
        company_id: payload.companyId,
        preferred_content_types: analysis.preferred_content_types,
        preferred_topics: analysis.preferred_topics,
        optimal_engagement_times: analysis.optimal_engagement_times,
        engagement_score: analysis.engagement_score,
        ai_analysis: {
          ...analysis,
          analyzed_at: new Date().toISOString()
        },
        last_analyzed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,company_id'
      });

    if (upsertError) {
      console.error('Error storing preferences:', upsertError);
    }

    console.log('Engagement analysis complete for user:', payload.userId);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        message: 'User engagement analyzed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Engagement analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

function calculatePeakHours(engagements: any[]): number[] {
  const hourCounts = new Array(24).fill(0);
  engagements.forEach(e => {
    const hour = new Date(e.created_at).getHours();
    hourCounts[hour]++;
  });
  
  return hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(h => h.hour);
}

async function getRecentPosts(supabase: any, engagements: any[]) {
  const postIds = [...new Set(engagements.filter(e => e.post_id).map(e => e.post_id))];
  
  if (postIds.length === 0) return [];
  
  const { data: posts } = await supabase
    .from('social_media_posts')
    .select('id, content, platforms')
    .in('id', postIds.slice(0, 10));
  
  return posts || [];
}
