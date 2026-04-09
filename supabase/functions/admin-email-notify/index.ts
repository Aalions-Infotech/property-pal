import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, type } = await req.json();

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const emailHtml = html || `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 24px; border-radius: 12px; margin-bottom: 20px;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0;">Ekananda Estate Admin</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Super Admin Notification</p>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 12px 0;">${subject}</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">${type === "new_listing" ? "A new property listing has been submitted and requires your review." : type === "new_user" ? "A new user has registered on the platform." : type === "sponsorship" ? "A new sponsorship payment has been received." : "You have a new admin notification."}</p>
          <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "#"}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px;">Open Admin Dashboard</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">Ekananda Estate · Enterprise Real Estate Platform</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: "Ekananda Estate Admin <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
