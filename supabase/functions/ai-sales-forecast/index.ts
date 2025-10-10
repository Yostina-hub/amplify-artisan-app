import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { opportunities, historicalData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an expert sales forecasting AI. Analyze pipeline data and provide:
1. Revenue forecast for next 30, 60, 90 days
2. Win probability for each deal
3. At-risk deals requiring attention
4. Pipeline health score
5. Recommended actions to improve forecast

Consider:
- Deal stage and age
- Historical close rates per stage
- Deal size and complexity
- Sales cycle length
- Seasonal patterns
- Account engagement`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Forecast sales based on:\nOpportunities: ${JSON.stringify(opportunities, null, 2)}\nHistorical: ${JSON.stringify(historicalData, null, 2)}\n\nProvide JSON: { "forecast30": number, "forecast60": number, "forecast90": number, "dealProbabilities": Record<string, number>, "atRisk": string[], "healthScore": number, "insights": string[] }`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI gateway error: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      forecast30: 0,
      forecast60: 0,
      forecast90: 0,
      dealProbabilities: {},
      atRisk: [],
      healthScore: 75,
      insights: [],
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sales forecast error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
