import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const resendKey = Deno.env.get("RESEND_API_KEY");

  try {
    const { data: searches } = await supabase
      .from("saved_searches")
      .select("*, profiles:user_id(email, full_name)")
      .eq("alerts_enabled", true);

    let sent = 0;
    for (const s of searches || []) {
      let q = supabase
        .from("property_listings")
        .select("id,title,city,locality,price,bedrooms,images,created_at")
        .eq("status", "approved")
        .gte("created_at", s.last_alerted_at || new Date(Date.now() - 7 * 86400e3).toISOString())
        .limit(10);
      if (s.listing_type) q = q.eq("listing_type", s.listing_type);
      if (s.city) q = q.ilike("city", `%${s.city}%`);
      if (s.locality) q = q.ilike("locality", `%${s.locality}%`);
      if (s.property_type) q = q.eq("property_type", s.property_type);
      if (s.min_price) q = q.gte("price", s.min_price);
      if (s.max_price) q = q.lte("price", s.max_price);
      if (s.bedrooms) q = q.eq("bedrooms", s.bedrooms);

      const { data: matches } = await q;
      if (!matches || matches.length === 0) continue;

      // In-app notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", s.user_id)
        .maybeSingle();

      await supabase.from("notifications").insert({
        user_id: s.user_id,
        title: `🔔 ${matches.length} new matches for "${s.name}"`,
        message: matches.slice(0, 3).map((m: any) => `${m.title} - ₹${Number(m.price).toLocaleString("en-IN")}`).join(" · "),
        type: "info",
        link: "/dashboard",
      });

      // Email
      if (resendKey && profile?.email) {
        const html = `
          <h2>New matches for "${s.name}"</h2>
          <p>Hi ${profile.full_name || ""}, we found ${matches.length} new listings:</p>
          <ul>${matches.slice(0, 5).map((m: any) => `<li><b>${m.title}</b> — ${m.locality}, ${m.city} — ₹${Number(m.price).toLocaleString("en-IN")}</li>`).join("")}</ul>
          <p><a href="https://ekananda.estate/dashboard">View all matches →</a></p>`;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Ekananda Estate <alerts@ekananda.estate>",
            to: profile.email,
            subject: `${matches.length} new matches for "${s.name}"`,
            html,
          }),
        });
      }

      await supabase.from("saved_searches").update({ last_alerted_at: new Date().toISOString() }).eq("id", s.id);
      sent++;
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});