import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // If webhook secret is configured, verify signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Fallback: parse body directly (for testing without webhook secret)
      event = JSON.parse(body);
    }

    console.log(`Stripe webhook event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        console.log("Payment not yet paid, skipping");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const listingId = session.metadata?.listing_id;
      const userId = session.metadata?.user_id;
      const durationDays = parseInt(session.metadata?.duration_days || "30");
      const planName = session.metadata?.plan_name;

      const startsAt = new Date();
      const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Update sponsorship to active
      const { error: sponsorError } = await supabaseAdmin.from("sponsorships")
        .update({
          payment_status: "completed",
          payment_id: session.payment_intent as string,
          payment_method: "stripe",
          status: "active",
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq("checkout_session_id", session.id);

      if (sponsorError) console.error("Sponsorship update error:", sponsorError);

      // Mark listing as featured
      if (listingId) {
        await supabaseAdmin.from("property_listings")
          .update({ is_featured: true })
          .eq("id", listingId);
      }

      // Send notification
      if (userId) {
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          title: "🎉 Sponsorship Activated!",
          message: `Your "${planName}" sponsorship has been activated! Your property is now featured for ${durationDays} days.`,
          type: "success",
          link: "/dashboard",
        });
      }

      console.log(`Sponsorship activated for listing ${listingId}`);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      // Mark sponsorship as failed
      await supabaseAdmin.from("sponsorships")
        .update({ payment_status: "failed", status: "cancelled" })
        .eq("checkout_session_id", session.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
