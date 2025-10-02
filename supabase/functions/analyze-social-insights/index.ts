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

    const { analysisType } = await req.json()

    // Fetch all relevant data
    const [metricsRes, influencersRes, mentionsRes, keywordsRes, trendsRes] = await Promise.all([
      supabaseClient.from('social_media_metrics').select('*, social_media_accounts(platform, account_name)').limit(100),
      supabaseClient.from('influencers').select('*').limit(50),
      supabaseClient.from('social_media_mentions').select('*').order('mentioned_at', { ascending: false }).limit(100),
      supabaseClient.from('tracked_keywords').select('*'),
      supabaseClient.from('trending_topics').select('*').order('detected_at', { ascending: false }).limit(50)
    ])

    // Prepare analysis data
    const analysisData = {
      metrics: metricsRes.data || [],
      influencers: influencersRes.data || [],
      mentions: mentionsRes.data || [],
      keywords: keywordsRes.data || [],
      trends: trendsRes.data || [],
      analysisType: analysisType || 'comprehensive'
    }

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
            content: 'You are an expert social media analyst. Analyze the provided data and return structured insights as JSON with: overview (string), top_performers (array of {name, metric, value}), recommendations (array of strings), sentiment_summary (string), growth_opportunities (array of strings), risk_alerts (array of strings).'
          },
          {
            role: 'user',
            content: `Analyze this social media data comprehensively:\n\nMetrics: ${JSON.stringify(analysisData.metrics.slice(0, 20))}\n\nInfluencers: ${JSON.stringify(analysisData.influencers.slice(0, 15))}\n\nMentions: ${JSON.stringify(analysisData.mentions.slice(0, 30))}\n\nKeywords: ${JSON.stringify(analysisData.keywords)}\n\nTrends: ${JSON.stringify(analysisData.trends.slice(0, 20))}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_social_insights',
              description: 'Provide comprehensive social media analysis insights',
              parameters: {
                type: 'object',
                properties: {
                  overview: { type: 'string' },
                  top_performers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        metric: { type: 'string' },
                        value: { type: 'string' }
                      }
                    }
                  },
                  recommendations: { type: 'array', items: { type: 'string' } },
                  sentiment_summary: { type: 'string' },
                  growth_opportunities: { type: 'array', items: { type: 'string' } },
                  risk_alerts: { type: 'array', items: { type: 'string' } }
                },
                required: ['overview', 'top_performers', 'recommendations', 'sentiment_summary', 'growth_opportunities', 'risk_alerts'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_social_insights' } }
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API Error:', errorText)
      throw new Error(`AI API error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0]
    const insights = JSON.parse(toolCall?.function?.arguments || '{}')

    return new Response(
      JSON.stringify({ success: true, insights }),
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
