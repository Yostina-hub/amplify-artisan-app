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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
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

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;

    // Extract hashtags from generated content
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [...generatedText.matchAll(hashtagRegex)].map(match => match[1]);

    // Generate images if requested
    let generatedImages = [];
    if (generateImages) {
      const imagePrompt = `Create a professional social media image for: ${prompt.substring(0, 200)}`;
      
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            { role: 'user', content: imagePrompt }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        if (imageData.choices?.[0]?.message?.images) {
          generatedImages = imageData.choices[0].message.images.map((img: any) => img.image_url.url);
        }
      }
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