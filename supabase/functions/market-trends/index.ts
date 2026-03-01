import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Get current year data
    const { data: currentData, error: e1 } = await supabaseAdmin
      .from("property_listings")
      .select("city, price, area")
      .eq("status", "approved")
      .gt("price", 0)
      .gt("area", 0)
      .gte("created_at", `${currentYear}-01-01`)
      .lte("created_at", `${currentYear}-12-31`);

    // Get previous year data
    const { data: prevData, error: e2 } = await supabaseAdmin
      .from("property_listings")
      .select("city, price, area")
      .eq("status", "approved")
      .gt("price", 0)
      .gt("area", 0)
      .gte("created_at", `${previousYear}-01-01`)
      .lte("created_at", `${previousYear}-12-31`);

    if (e1 || e2) throw new Error(e1?.message || e2?.message);

    // Aggregate by city
    const aggregate = (data: any[]) => {
      const map: Record<string, { totalPrice: number; totalArea: number; count: number }> = {};
      (data || []).forEach((r: any) => {
        const city = r.city;
        if (!map[city]) map[city] = { totalPrice: 0, totalArea: 0, count: 0 };
        map[city].totalPrice += Number(r.price);
        map[city].totalArea += Number(r.area);
        map[city].count += 1;
      });
      return map;
    };

    const currentAgg = aggregate(currentData || []);
    const prevAgg = aggregate(prevData || []);

    const allCities = new Set([...Object.keys(currentAgg), ...Object.keys(prevAgg)]);

    const trends = Array.from(allCities).map(city => {
      const curr = currentAgg[city];
      const prev = prevAgg[city];

      const avgCurrent = curr && curr.totalArea > 0 ? Math.round(curr.totalPrice / curr.totalArea) : null;
      const avgPrev = prev && prev.totalArea > 0 ? Math.round(prev.totalPrice / prev.totalArea) : null;

      let yoyChange: number | null = null;
      if (avgCurrent !== null && avgPrev !== null && avgPrev > 0) {
        yoyChange = Math.round(((avgCurrent - avgPrev) / avgPrev) * 1000) / 10;
      }

      return {
        city,
        avg_price_sqft: avgCurrent || avgPrev || 0,
        yoy_change: yoyChange,
        listing_count: (curr?.count || 0) + (prev?.count || 0),
        trend: yoyChange !== null ? (yoyChange >= 0 ? "up" : "down") : "neutral",
      };
    }).filter(t => t.avg_price_sqft > 0).sort((a, b) => b.listing_count - a.listing_count);

    return new Response(JSON.stringify({ trends }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Market trends error:", error);
    return new Response(JSON.stringify({ error: error.message, trends: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
