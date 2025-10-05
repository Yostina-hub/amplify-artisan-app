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

    const { platform, prompt, tone, language = 'en', contentType = 'post', generateImages = false } = await req.json();

    console.log('Generating content for:', { platform, tone, language, contentType });

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User has no company');
    }

    // Build AI prompt based on platform and parameters
    const systemPrompt = `You are a professional social media content creator specializing in ${platform}. 
Generate engaging, platform-optimized content that follows ${platform}'s best practices.
Tone: ${tone || 'professional'}
Language: ${language}
Include relevant hashtags and emojis where appropriate.`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.8,
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.candidates[0].content.parts[0].text;

    // Extract hashtags from generated content
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [...generatedText.matchAll(hashtagRegex)].map(match => match[1]);

    // Generate images if requested
    let generatedImages: string[] = [];
    if (generateImages) {
      const imagePrompt = `Create a professional social media image for: ${prompt.substring(0, 200)}`;
      
      // Note: Image generation with Gemini requires Imagen model which needs separate setup
      // Skipping image generation for now
      console.log('Image generation not yet implemented with direct Gemini API');
    }

    // Save to database
    const { data: savedContent, error: insertError } = await supabase
      .from('ai_generated_content')
      .insert({
        user_id: user.id,
        company_id: profile.company_id,
        platform,
        content_type: contentType,
        prompt,
        generated_text: generatedText,
        generated_images: generatedImages,
        hashtags,
        tone,
        language,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Content generated successfully:', savedContent.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: savedContent 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-social-content:', error);
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