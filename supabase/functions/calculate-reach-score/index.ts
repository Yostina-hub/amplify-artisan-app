import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId } = await req.json()

    // Get user engagement data
    const { data: engagementData, error: engagementError } = await supabaseClient
      .from('user_engagement')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (engagementError) throw engagementError

    // Get ad impressions
    const { data: impressions, error: impressionsError } = await supabaseClient
      .from('ad_impressions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (impressionsError) throw impressionsError

    // Prepare data for AI analysis
    const analysisData = {
      totalEngagements: engagementData?.length || 0,
      totalImpressions: impressions?.length || 0,
      avgTimeSpent: engagementData?.reduce((acc, e) => acc + (e.time_spent || 0), 0) / (engagementData?.length || 1),
      clickRate: impressions?.filter(i => i.impression_type === 'click').length / (impressions?.length || 1),
      recentPages: engagementData?.map(e => e.page_visited).slice(0, 10) || []
    }

    // Call Lovable AI to analyze user behavior
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing user engagement patterns and calculating reach scores. Analyze the data and return a JSON with: reach_score (0-100), engagement_level (low/medium/high), and interests (array of strings).'
          },
          {
            role: 'user',
            content: `Analyze this user engagement data: ${JSON.stringify(analysisData)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'calculate_reach_score',
              description: 'Calculate user reach score and engagement level',
              parameters: {
                type: 'object',
                properties: {
                  reach_score: { type: 'number', minimum: 0, maximum: 100 },
                  engagement_level: { type: 'string', enum: ['low', 'medium', 'high'] },
                  interests: { type: 'array', items: { type: 'string' } }
                },
                required: ['reach_score', 'engagement_level', 'interests'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'calculate_reach_score' } }
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API Error:', errorText)
      throw new Error(`AI API error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0]
    const result = JSON.parse(toolCall?.function?.arguments || '{}')

    // Update or insert reach score
    const { error: upsertError } = await supabaseClient
      .from('user_reach_scores')
      .upsert({
        user_id: userId,
        reach_score: result.reach_score,
        engagement_level: result.engagement_level,
        interests: result.interests,
        last_calculated_at: new Date().toISOString()
      })

    if (upsertError) throw upsertError

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
