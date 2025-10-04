import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  subscriptionId: string;
  planId: string;
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
    console.log('Analyzing subscription:', payload);

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscription_requests')
      .select('*, pricing_plans(*)')
      .eq('id', payload.subscriptionId)
      .single();

    if (subError) throw subError;

    // Get plan features
    const plan = subscription.pricing_plans;
    
    // Use AI to analyze and generate recommendations
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
            content: `You are an AI subscription management assistant. Analyze subscription plans and provide feature recommendations, usage limits, and insights.`
          },
          {
            role: 'user',
            content: `Analyze this subscription plan and provide:
1. Recommended usage limits and quotas
2. Feature access configuration
3. Best practices for the customer
4. Monitoring recommendations

Plan: ${plan.name}
Price: $${plan.price}/${plan.billing_period}
Features: ${JSON.stringify(plan.features)}
Max Social Accounts: ${plan.max_social_accounts}
Max Team Members: ${plan.max_team_members}
Includes AI: ${plan.includes_ai}
Support Level: ${plan.support_level}

Format your response as JSON with these keys:
- usage_limits: object with recommended limits
- feature_config: object with feature settings
- best_practices: array of strings
- monitoring_recommendations: array of strings
- initial_report: string with summary`
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

    // Store analysis results
    const { error: updateError } = await supabase
      .from('subscription_requests')
      .update({
        metadata: {
          ai_analysis: analysis,
          analyzed_at: new Date().toISOString(),
        }
      })
      .eq('id', payload.subscriptionId);

    if (updateError) {
      console.error('Error storing analysis:', updateError);
    }

    console.log('Subscription analysis complete');

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        message: 'Subscription analyzed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Subscription analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
