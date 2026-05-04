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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Build a candidate pool: same city, similar listing type
    let q = supabaseAdmin.from("property_listings").select("*").eq("status", "approved").neq("id", property.id).limit(40);
    if (property.city) q = q.eq("city", property.city);
    if (property.listingType) q = q.eq("listing_type", property.listingType);
    const { data: candidates } = await q;

    const list = candidates || [];
    if (list.length === 0) {
      return new Response(JSON.stringify({ recommendations: [], reason: "No similar properties yet." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ recommendations: list.slice(0, 4), reason: "Top picks in your area" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const compact = list.map(c => ({
      id: c.id, title: c.title, city: c.city, locality: c.locality,
      bedrooms: c.bedrooms, area: c.area, price: Number(c.price),
      property_type: c.property_type, furnishing: c.furnishing,
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You rank Indian real estate listings by similarity to a target property. Respond only via the tool." },
          { role: "user", content: `Target:\n${JSON.stringify(property)}\n\nCandidates:\n${JSON.stringify(compact)}\n\nReturn the 4 best matches by ID, ranked.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "rank_recs",
            parameters: {
              type: "object",
              properties: {
                ids: { type: "array", items: { type: "string" }, description: "Top 4 candidate IDs in order" },
                reason: { type: "string", description: "One short sentence on why these match" },
              },
              required: ["ids", "reason"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "rank_recs" } },
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ recommendations: list.slice(0, 4), reason: "Top picks in your area" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await response.json();
    const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { ids: [], reason: "" };
    const map = new Map(list.map(p => [p.id, p]));
    const ordered = (parsed.ids || []).map((id: string) => map.get(id)).filter(Boolean);
    const recs = ordered.length ? ordered : list.slice(0, 4);
    return new Response(JSON.stringify({ recommendations: recs, reason: parsed.reason || "Top picks for you" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-recommendations error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown", recommendations: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});