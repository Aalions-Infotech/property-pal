import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { property } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Pull comparable listings stats from DB
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let comparables: any[] = [];
    try {
      const { data } = await supabaseAdmin
        .from("property_listings")
        .select("price, area, bedrooms, property_type, locality, city, created_at")
        .eq("status", "approved")
        .eq("city", property.city)
        .gt("price", 0)
        .gt("area", 0)
        .limit(50);
      comparables = data || [];
    } catch { /* ignore */ }

    const compsSummary = {
      count: comparables.length,
      avg_price_per_sqft: comparables.length
        ? Math.round(comparables.reduce((s, r) => s + Number(r.price) / Number(r.area), 0) / comparables.length)
        : null,
      bedroom_distribution: comparables.reduce((acc: any, r) => { acc[r.bedrooms || "?"] = (acc[r.bedrooms || "?"] || 0) + 1; return acc; }, {}),
    };

    const userPrompt = `Property:
${JSON.stringify(property, null, 2)}

Comparables in same city (${property.city}):
${JSON.stringify(compsSummary, null, 2)}

Estimate fair market value (min/max in INR), 12-month outlook % change (positive = rising), trend ("up"|"down"|"flat"), and a one-sentence insight for the buyer. Respond in concise terms.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an Indian real estate valuation expert. Output only via the provided tool." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "price_estimate",
            description: "Return price estimate and outlook",
            parameters: {
              type: "object",
              properties: {
                estimated_min: { type: "number", description: "Min fair value in INR" },
                estimated_max: { type: "number", description: "Max fair value in INR" },
                expected_change_pct: { type: "number", description: "Expected 12-month % change, e.g. 6.5 or -2.3" },
                trend: { type: "string", enum: ["up", "down", "flat"] },
                insight: { type: "string" },
              },
              required: ["estimated_min", "estimated_max", "expected_change_pct", "trend", "insight"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "price_estimate" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const j = await response.json();
    const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : {};
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("price-prediction error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});