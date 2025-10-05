import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')!;
    
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

    const { content, platform, contentId, contentType } = await req.json();

    console.log('Analyzing sentiment for:', { platform, contentType });

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User has no company');
    }

    // Use AI for sentiment analysis
    const systemPrompt = `You are an expert sentiment analyzer. Analyze the following text and provide:
1. Overall sentiment (positive, negative, neutral, or mixed)
2. Sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
3. Confidence level (0 to 1)
4. Detected emotions as a JSON object with emotion names and intensities
5. Main topics (max 5)
6. Keywords (max 10)

Respond ONLY with valid JSON in this exact format:
{
  "sentiment": "positive|negative|neutral|mixed",
  "score": 0.5,
  "confidence": 0.9,
  "emotions": {"joy": 0.8, "surprise": 0.3},
  "topics": ["topic1", "topic2"],
  "keywords": ["keyword1", "keyword2"]
}`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nAnalyze this text: ${content}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      throw new Error(`Sentiment analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.candidates[0].content.parts[0].text;
    
    // Parse JSON from AI response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        analysisText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText);
      // Fallback to neutral sentiment
      analysis = {
        sentiment: 'neutral',
        score: 0,
        confidence: 0.5,
        emotions: {},
        topics: [],
        keywords: []
      };
    }

    // Save to database
    const { data: savedAnalysis, error: insertError } = await supabase
      .from('sentiment_analysis')
      .insert({
        company_id: profile.company_id,
        platform,
        content_id: contentId,
        content_type: contentType,
        content_text: content,
        sentiment: analysis.sentiment,
        sentiment_score: analysis.score,
        confidence: analysis.confidence,
        emotions: analysis.emotions,
        topics: analysis.topics,
        keywords: analysis.keywords,
        ai_model: 'google/gemini-2.5-flash',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Sentiment analyzed successfully:', savedAnalysis.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: savedAnalysis 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-sentiment:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});