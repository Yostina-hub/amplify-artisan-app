import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get current user
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { limit = 5 } = await req.json()

    // Get user reach score
    const { data: reachScore, error: scoreError } = await supabaseClient
      .from('user_reach_scores')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (scoreError && scoreError.code !== 'PGRST116') throw scoreError

    // Get available campaigns
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from('ad_campaigns')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)

    if (campaignsError) throw campaignsError

    // Get recent impressions to avoid showing same ads
    const { data: recentImpressions } = await supabaseClient
      .from('ad_impressions')
      .select('ad_campaign_id')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const recentAdIds = recentImpressions?.map(i => i.ad_campaign_id) || []

    // Build the prompt
    const prompt = `Analyze this data and recommend ${limit} ads. Return JSON format: {"recommended_ids": ["id1", "id2"], "reasoning": "explanation"}

User profile: ${JSON.stringify(reachScore || {})}
Available campaigns: ${JSON.stringify(campaigns?.map(c => ({ id: c.id, name: c.name, target_audience: c.target_audience })))}
Recently shown (avoid these): ${JSON.stringify(recentAdIds)}`

    let resultText = ''

    // Try Gemini 2.5 Flash first
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    
    if (GOOGLE_GEMINI_API_KEY) {
      try {
        console.log('Trying Gemini 2.5 Flash...')
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are an ad recommendation system. Rank ads based on user interests and reach score. Return your response as valid JSON only.\n\n${prompt}`
                }]
              }],
              generationConfig: { temperature: 0.5 }
            })
          }
        )

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json()
          resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
          console.log('Gemini response received')
        } else {
          console.log('Gemini failed with status:', geminiResponse.status)
        }
      } catch (geminiError) {
        console.error('Gemini error:', geminiError)
      }
    }

    // Fallback to Lovable AI Gateway
    if (!resultText) {
      console.log('Falling back to Lovable AI Gateway...')
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
      
      const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are an ad recommendation system. Rank ads based on user interests and reach score. Return your response as valid JSON only.' },
            { role: 'user', content: prompt }
          ]
        })
      })

      if (!lovableResponse.ok) {
        throw new Error(`Lovable AI error: ${lovableResponse.status}`)
      }

      const lovableData = await lovableResponse.json()
      resultText = lovableData.choices?.[0]?.message?.content || ''
      console.log('Lovable AI response received')
    }
    
    // Parse JSON from response
    let result
    try {
      const jsonMatch = resultText.match(/```json\n?([\s\S]*?)\n?```/) || resultText.match(/\{[\s\S]*\}/)
      result = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : resultText)
    } catch {
      result = { recommended_ids: [], reasoning: 'Failed to parse response' }
    }

    // Get full campaign data for recommended IDs
    const recommendedCampaigns = campaigns?.filter(c => 
      result.recommended_ids?.includes(c.id)
    ).slice(0, limit) || []

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendations: recommendedCampaigns,
        reasoning: result.reasoning
      }),
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
