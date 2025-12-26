import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeRequest {
  profileId?: string;
  companyId?: string;
  analysisType?: 'predictions' | 'trends' | 'opportunities' | 'risks';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { profileId, companyId, analysisType = 'predictions' }: AnalyzeRequest = await req.json();

    console.log('Neural Engine Analyze request:', { profileId, companyId, analysisType });

    // Get profile details
    let profile = null;
    let requirements: any[] = [];
    
    if (profileId) {
      const { data: profileData } = await supabase
        .from('company_monitoring_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      profile = profileData;

      const { data: reqData } = await supabase
        .from('monitoring_requirements')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_active', true);
      requirements = reqData || [];
    }

    // Get recent intelligence data
    let query = supabase
      .from('scraped_intelligence')
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(50);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (profileId) {
      query = query.eq('profile_id', profileId);
    }

    const { data: intelligence } = await query;

    if (!intelligence || intelligence.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          predictions: [],
          message: 'No intelligence data available for analysis',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate AI predictions
    const predictions: any[] = [];

    if (lovableApiKey) {
      try {
        const intelligenceSummary = intelligence
          .slice(0, 20)
          .map(i => `- ${i.title}: ${i.summary || i.content?.substring(0, 200)}`)
          .join('\n');

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
                content: `You are a business intelligence analyst. Based on the collected intelligence data, generate predictive insights.

${profile ? `Company context: ${profile.business_type} in ${profile.industry}. Keywords: ${profile.keywords?.join(', ')}` : ''}
${requirements.length > 0 ? `Monitoring for: ${requirements.map(r => r.requirement_value).join(', ')}` : ''}

Generate 4-6 predictive insights covering opportunities, risks, and trends.`
              },
              {
                role: 'user',
                content: `Analyze this intelligence data and generate predictions:\n\n${intelligenceSummary}`
              }
            ],
            tools: [
              {
                type: 'function',
                function: {
                  name: 'generate_predictions',
                  description: 'Generate business predictions from intelligence data',
                  parameters: {
                    type: 'object',
                    properties: {
                      predictions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            title: { type: 'string' },
                            description: { type: 'string' },
                            prediction_type: { type: 'string', enum: ['opportunity', 'risk', 'trend', 'competitor'] },
                            confidence: { type: 'number' },
                            trend: { type: 'string', enum: ['up', 'down', 'stable'] },
                            impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                            timeframe: { type: 'string' }
                          },
                          required: ['title', 'description', 'prediction_type', 'confidence']
                        }
                      }
                    },
                    required: ['predictions']
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'generate_predictions' } }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall?.function?.arguments) {
            try {
              const parsed = JSON.parse(toolCall.function.arguments);
              
              for (const pred of parsed.predictions || []) {
                predictions.push({
                  id: crypto.randomUUID(),
                  profile_id: profileId,
                  company_id: companyId,
                  prediction_type: pred.prediction_type || 'trend',
                  title: pred.title,
                  description: pred.description,
                  confidence: pred.confidence || 0.7,
                  trend: pred.trend || 'stable',
                  impact: pred.impact || 'medium',
                  timeframe: pred.timeframe || 'Next 30 days',
                  created_at: new Date().toISOString(),
                });
              }
            } catch (e) {
              console.error('Error parsing AI predictions:', e);
            }
          }
        } else {
          console.error('AI response error:', await aiResponse.text());
        }
      } catch (e) {
        console.error('AI analysis error:', e);
      }
    }

    // Store predictions if we have any
    if (predictions.length > 0 && companyId) {
      // Clear old predictions first
      await supabase
        .from('ai_predictions')
        .delete()
        .eq('company_id', companyId)
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { error } = await supabase
        .from('ai_predictions')
        .insert(predictions);
      
      if (error) {
        console.error('Error storing predictions:', error);
      }
    }

    // Calculate stats
    const stats = {
      totalIntelligence: intelligence.length,
      byCategory: intelligence.reduce((acc: any, i: any) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
      }, {}),
      bySentiment: intelligence.reduce((acc: any, i: any) => {
        acc[i.sentiment_label || 'neutral'] = (acc[i.sentiment_label || 'neutral'] || 0) + 1;
        return acc;
      }, {}),
      avgRelevance: intelligence.reduce((sum: number, i: any) => sum + (i.relevance_score || 0), 0) / intelligence.length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        predictions,
        stats,
        intelligenceCount: intelligence.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Neural engine analyze error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
