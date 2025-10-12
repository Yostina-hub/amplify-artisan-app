import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional conversation_id from request body
    let conversationId: string | undefined;
    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body.conversation_id === 'string') {
        conversationId = body.conversation_id;
      }
    } catch (_) { /* ignore */ }

    // Fetch conversations to process
    let pendingConvs: any[] = [];
    if (conversationId) {
      const { data: conv } = await supabase
        .from('live_chat_conversations')
        .select('*, live_chat_messages(*)')
        .eq('id', conversationId)
        .maybeSingle();
      if (conv) pendingConvs = [conv];
    } else {
      const { data } = await supabase
        .from('live_chat_conversations')
        .select('*, live_chat_messages(*)')
        .in('status', ['pending', 'active'])
        .is('assigned_agent_id', null)
        .order('created_at', { ascending: true });
      pendingConvs = data || [];
    }

    if (!pendingConvs || pendingConvs.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending conversations' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responses = [];

    for (const conv of pendingConvs) {
      const messages = (conv.live_chat_messages || []).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      // Check if last message is from user/guest and not AI
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.sender_type === 'agent' || lastMessage.is_ai_response) {
        continue;
      }

      // Build conversation history for context
      const conversationHistory = messages.map((m: any) => ({
        role: m.sender_type === 'agent' || m.is_ai_response ? 'assistant' : 'user',
        content: m.message,
      }));

      // Call Lovable AI Gateway (OpenAI-compatible)
      const gatewayUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      const aiResponse = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful customer support AI assistant. Be friendly, professional, and concise. If the question is complex or requires human judgment, let them know an agent will assist them shortly.',
            },
            ...conversationHistory,
          ],
          // Non-streaming
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI gateway error:', aiResponse.status, errorText);
        if (aiResponse.status === 429) {
          continue; // Rate limited, skip for now
        }
        if (aiResponse.status === 402) {
          continue; // Payment required, skip
        }
        continue;
      }

      const aiData = await aiResponse.json();
      const aiMessage = aiData.choices?.[0]?.message?.content;

      if (aiMessage) {
        // Insert AI response
        await supabase
          .from('live_chat_messages')
          .insert({
            conversation_id: conv.id,
            sender_type: 'agent',
            message: aiMessage,
            is_ai_response: true,
          });

        responses.push({ conversation_id: conv.id, ai_message: aiMessage });
      }
    }

    return new Response(JSON.stringify({ success: true, responses_sent: responses.length, responses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
