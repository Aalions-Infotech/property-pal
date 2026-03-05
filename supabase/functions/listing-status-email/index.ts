import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, userName, listingTitle, status, adminNote, listingId } = await req.json();
    const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

    const statusConfig: Record<string, { emoji: string; color: string; heading: string; message: string }> = {
      approved: {
        emoji: "🎉", color: "#10b981",
        heading: "Your Property is Now Live!",
        message: `Great news! Your listing "<strong>${listingTitle}</strong>" has been approved and is now visible to millions of buyers and renters on PropEstate.`,
      },
      rejected: {
        emoji: "📋", color: "#ef4444",
        heading: "Listing Requires Changes",
        message: `Your listing "<strong>${listingTitle}</strong>" needs some changes before it can go live.${adminNote ? `<br/><br/><strong>Admin Note:</strong> ${adminNote}` : ""}`,
      },
      suspended: {
        emoji: "🚫", color: "#6b7280",
        heading: "Listing Suspended",
        message: `Your listing "<strong>${listingTitle}</strong>" has been suspended by admin. Please contact support for more details.`,
      },
    };

    const config = statusConfig[status] || statusConfig.approved;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; margin: 0;">${config.emoji} PropEstate</h1>
          <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 6px 0 0;">Property Listing Update</p>
        </div>
        <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #333; font-size: 15px;">Hi <strong>${userName || "there"}</strong>,</p>
          <div style="background: ${config.color}10; border-left: 4px solid ${config.color}; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h2 style="color: ${config.color}; font-size: 16px; margin: 0 0 8px;">${config.heading}</h2>
            <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0;">${config.message}</p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/dashboard" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600;">View Dashboard</a>
          </div>
        </div>
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 12px;">© 2026 PropEstate · India's Most Trusted Real Estate Platform</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: "PropEstate <onboarding@resend.dev>",
      to: [to],
      subject: `${config.emoji} ${config.heading} - ${listingTitle}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
