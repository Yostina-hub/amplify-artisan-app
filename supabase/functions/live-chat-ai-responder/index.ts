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

    // Get all pending conversations without assigned agent
    const { data: pendingConvs } = await supabase
      .from('live_chat_conversations')
      .select('*, live_chat_messages(*)')
      .eq('status', 'pending')
      .is('assigned_agent_id', null)
      .order('created_at', { ascending: true });

    if (!pendingConvs || pendingConvs.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending conversations' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responses = [];

    for (const conv of pendingConvs) {
      const messages = conv.live_chat_messages || [];
      
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

      // Call Lovable AI
      const aiResponse = await fetch('https://api.lovable.app/v1/ai/chat', {
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
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      const aiData = await aiResponse.json();
      const aiMessage = aiData.choices?.[0]?.message?.content;

      if (aiMessage) {
        // Insert AI response
        await supabase
          .from('live_chat_messages')
          .insert({
            conversation_id: conv.id,
            sender_type: 'agent',
            sender_name: 'AI Assistant',
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
