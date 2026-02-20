import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("sessionId is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, status: session.payment_status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const listingId = session.metadata?.listing_id;
    const userId = session.metadata?.user_id;
    const durationDays = parseInt(session.metadata?.duration_days || "30");
    const planName = session.metadata?.plan_name;

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Update sponsorship to active
    await supabaseAdmin.from("sponsorships")
      .update({
        payment_status: "completed",
        payment_id: session.payment_intent as string,
        payment_method: "stripe",
        status: "active",
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("checkout_session_id", sessionId);

    // Mark listing as featured
    await supabaseAdmin.from("property_listings")
      .update({ is_featured: true })
      .eq("id", listingId);

    // Send notification to user
    if (userId) {
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "🎉 Sponsorship Activated!",
        message: `Your "${planName}" sponsorship for your listing has been activated successfully! Your property is now featured for ${durationDays} days.`,
        type: "success",
        link: "/dashboard",
      });
    }

    return new Response(JSON.stringify({ success: true, listingId, expiresAt: expiresAt.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
