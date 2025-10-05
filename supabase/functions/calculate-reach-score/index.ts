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

    // Call Gemini API to analyze user behavior
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert at analyzing user engagement patterns and calculating reach scores. Analyze the data and return a JSON with: reach_score (0-100), engagement_level (low/medium/high), and interests (array of strings).

Analyze this user engagement data: ${JSON.stringify(analysisData)}`
          }]
        }],
        generationConfig: {
          temperature: 0.5,
        }
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API Error:', errorText)
      throw new Error(`AI API error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const resultText = aiData.candidates[0].content.parts[0].text
    
    // Parse JSON from response
    let result
    try {
      const jsonMatch = resultText.match(/```json\n?([\s\S]*?)\n?```/) || resultText.match(/\{[\s\S]*\}/)
      result = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : resultText)
    } catch {
      result = {
        reach_score: 50,
        engagement_level: 'medium',
        interests: []
      }
    }

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
