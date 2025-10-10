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
    const { insightType, userId, companyId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant data based on insight type
    let contextData: any = {};
    let systemPrompt = "";

    if (insightType === "email_marketing") {
      const { data: campaigns } = await supabase
        .from("email_campaigns")
        .select("*, email_contacts(*)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(10);

      contextData = { campaigns };
      systemPrompt = "You are an email marketing analytics expert. Analyze the campaign data and provide actionable insights about performance, engagement trends, and recommendations for improvement.";
    } else if (insightType === "crm") {
      const { data: leads } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50);

      const { data: activities } = await supabase
        .from("activities")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50);

      contextData = { leads, activities };
      systemPrompt = "You are a CRM analytics expert. Analyze the leads and activities data to provide insights about conversion trends, engagement patterns, and opportunities for improvement.";
    } else if (insightType === "overview") {
      const { data: leads } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: campaigns } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: activities } = await supabase
        .from("activities")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(20);

      contextData = { leads, campaigns, activities };
      systemPrompt = "You are a business intelligence expert. Analyze the overall business data and provide strategic insights about performance, trends, and growth opportunities.";
    }

    // Call Lovable AI to generate insights
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze this data and provide 3-5 actionable insights. For each insight, provide:
- type: one of "success", "warning", "info", "danger"
- title: brief insight title
- description: detailed explanation
- confidence: number between 0 and 1
- metric: optional metric string
- trend: optional "up", "down", or "stable"

Data: ${JSON.stringify(contextData, null, 2)}

Return ONLY a JSON array of insights, no markdown, no extra text.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_insights",
            description: "Generate actionable business insights",
            parameters: {
              type: "object",
              properties: {
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["success", "warning", "info", "danger"] },
                      title: { type: "string" },
                      description: { type: "string" },
                      confidence: { type: "number", minimum: 0, maximum: 1 },
                      metric: { type: "string" },
                      trend: { type: "string", enum: ["up", "down", "stable"] }
                    },
                    required: ["type", "title", "description", "confidence"]
                  }
                }
              },
              required: ["insights"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_insights" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    const insights = toolCall ? JSON.parse(toolCall.function.arguments).insights : [];

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
