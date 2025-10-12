import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation_id, message, attachment } = await req.json();
    if (!conversation_id || (!message && !attachment)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("Missing Supabase envs");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const metadata: Record<string, any> = {};
    if (attachment) {
      metadata.attachment_url = attachment.url;
      metadata.attachment_name = attachment.name;
      metadata.attachment_type = attachment.type;
    }

    // Insert guest message
    const { error: insertErr } = await supabase
      .from("live_chat_messages")
      .insert({
        conversation_id,
        sender_id: null,
        sender_type: "guest",
        message: message || "Sent a file",
        metadata,
      });

    if (insertErr) {
      console.error("live-chat-send insert error", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trigger AI auto-response via existing function
    try {
      await supabase.functions.invoke("live-chat-ai-responder", {
        body: { conversation_id },
      });
    } catch (e) {
      console.error("AI responder invoke from live-chat-send failed", e);
      // Continue regardless
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("live-chat-send error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
