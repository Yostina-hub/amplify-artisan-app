import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voice, company_id } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    console.log('Generating speech for text:', text.substring(0, 50), '...');
    console.log('Using voice:', voice || 'alloy');

    // Initialize API keys with system defaults
    let openaiKey = Deno.env.get('OPENAI_API_KEY');
    let elevenlabsKey = Deno.env.get('ELEVENLABS_API_KEY');

    // Check for company-specific API keys if company_id is provided
    if (company_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: companySettings } = await supabase
        .from('company_tts_settings')
        .select('*')
        .eq('company_id', company_id)
        .single();

      // Use company keys if they opted for custom keys
      if (companySettings?.use_custom_keys) {
        if (companySettings.openai_api_key) {
          openaiKey = companySettings.openai_api_key;
          console.log('Using company OpenAI key');
        }
        if (companySettings.elevenlabs_api_key) {
          elevenlabsKey = companySettings.elevenlabs_api_key;
          console.log('Using company ElevenLabs key');
        }
      }
    }

    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Use OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice || 'alloy',
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS error:', response.status, errorText);

      const shouldFallback =
        response.status === 402 ||
        response.status === 429 ||
        errorText.toLowerCase().includes('insufficient_quota') ||
        errorText.toLowerCase().includes('payment required');

      if (shouldFallback && elevenlabsKey) {
        const voiceId = voice && /^[a-zA-Z0-9]+$/.test(voice) && voice.length > 10 ? voice : '9BWtsMINqrJLrRacOk9x';
        console.log('Falling back to ElevenLabs TTS with voice:', voiceId);

        const elResp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenlabsKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });

        if (!elResp.ok) {
          const elErr = await elResp.text();
          console.error('ElevenLabs fallback error:', elResp.status, elErr);
          return new Response(
            JSON.stringify({ error: `OpenAI quota exceeded and ElevenLabs failed: ${elErr}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        const fbArrayBuffer = await elResp.arrayBuffer();
        const fbBytes = new Uint8Array(fbArrayBuffer);
        let fbBinary = '';
        const fbChunkSize = 0x8000; // 32KB
        for (let i = 0; i < fbBytes.length; i += fbChunkSize) {
          const chunk = fbBytes.subarray(i, i + fbChunkSize);
          fbBinary += String.fromCharCode(...chunk);
        }
        const fbBase64Audio = btoa(fbBinary);

        return new Response(JSON.stringify({ audioContent: fbBase64Audio }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const errStatus = response.status === 402 || errorText.toLowerCase().includes('payment required')
        ? 402
        : (response.status === 429 ? 429 : 400);
      return new Response(
        JSON.stringify({ error: `Failed to generate speech: ${errorText}` }),
        { status: errStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 0x8000; // 32KB to avoid call stack overflow
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64Audio = btoa(binary);

    console.log('Speech generation successful, audio size:', arrayBuffer.byteLength);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
