import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  userId: string;
  limit?: number;
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

    const payload: RecommendationRequest = await req.json();
    const limit = payload.limit || 10;
    
    console.log('Generating recommendations for user:', payload.userId);

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_content_preferences')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    if (!preferences) {
      return new Response(
        JSON.stringify({ 
          success: true,
          recommendations: [],
          message: 'No user preferences found. Analyze engagement first.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get user's recent engagements
    const { data: recentEngagements } = await supabase
      .from('user_engagement')
      .select('post_id')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const viewedPostIds = recentEngagements?.map(e => e.post_id).filter(Boolean) || [];

    // Get available posts (excluding already viewed)
    const { data: availablePosts, error: postsError } = await supabase
      .from('social_media_posts')
      .select('id, content, platforms, status, created_at')
      .eq('status', 'published')
      .not('id', 'in', `(${viewedPostIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (postsError) throw postsError;

    if (!availablePosts || availablePosts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          recommendations: [],
          message: 'No new content available for recommendations'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Use AI to score and rank posts
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
            content: `You are an AI recommendation engine for social media content. Score posts based on user preferences and engagement patterns.`
          },
          {
            role: 'user',
            content: `Score these posts for this user based on their preferences:

User Preferences:
${JSON.stringify({
  preferred_content_types: preferences.preferred_content_types,
  preferred_topics: preferences.preferred_topics,
  engagement_score: preferences.engagement_score
}, null, 2)}

Available Posts (${availablePosts.length} total):
${JSON.stringify(availablePosts.map(p => ({
  id: p.id,
  content: p.content?.substring(0, 200),
  platforms: p.platforms
})), null, 2)}

Return JSON array with top ${limit} recommendations:
[
  {
    "post_id": "uuid",
    "score": 0-100,
    "reason": "why this is recommended",
    "confidence": 0-100
  }
]`
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
      throw new Error(`AI recommendation failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const recommendations = JSON.parse(aiData.choices[0].message.content);

    // Store recommendations
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Recommendations valid for 24 hours

    const recommendationsToInsert = recommendations.map((rec: any) => ({
      user_id: payload.userId,
      post_id: rec.post_id,
      company_id: preferences.company_id,
      recommendation_score: rec.score,
      recommendation_reason: rec.reason,
      ai_confidence: rec.confidence,
      expires_at: expiresAt.toISOString()
    }));

    const { error: insertError } = await supabase
      .from('content_recommendations')
      .insert(recommendationsToInsert);

    if (insertError) {
      console.error('Error storing recommendations:', insertError);
    }

    console.log(`Generated ${recommendations.length} recommendations for user:`, payload.userId);

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        message: 'Recommendations generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Recommendation generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
