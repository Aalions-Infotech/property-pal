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
    const { to, agentName, agentId, password, loginUrl } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasTemporaryPassword = Boolean(password);
    const credentialsBlock = hasTemporaryPassword
      ? `
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e9ecef;">
            <h3 style="color: #0f1d3a; margin: 0 0 12px;">Your Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Agent ID:</td>
                <td style="padding: 8px 0; color: #0f1d3a; font-weight: bold; font-size: 14px;">${agentId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Email:</td>
                <td style="padding: 8px 0; color: #0f1d3a; font-weight: bold; font-size: 14px;">${to}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Temporary Password:</td>
                <td style="padding: 8px 0; color: #0f1d3a; font-weight: bold; font-size: 14px; font-family: monospace;">${password}</td>
              </tr>
            </table>
          </div>
          <p style="color: #555; font-size: 13px;">⚠️ Please change your password after your first login for security.</p>
        `
      : `
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e9ecef;">
            <h3 style="color: #0f1d3a; margin: 0 0 10px;">Your Agent Access Is Active</h3>
            <p style="color: #555; font-size: 14px; margin: 0; line-height: 1.6;">
              Agent ID: <strong>${agentId}</strong><br />
              Sign in using your registered email and existing password.
            </p>
          </div>
        `;

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f1d3a, #1a2d5a); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">🎉 Welcome to PropEstate!</h1>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-top: 8px;">Your Agent Account Has Been Approved</p>
        </div>
        <div style="padding: 30px;">
          <p style="color: #333; font-size: 16px;">Hi <strong>${agentName}</strong>,</p>
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            Congratulations! Your application to become a PropEstate agent has been approved by our admin team.
            You now have access to your dedicated Agent Dashboard.
          </p>
          ${credentialsBlock}

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PropEstate <onboarding@resend.dev>",
        to: [to],
        subject: `🎉 Agent Account Approved - Welcome to PropEstate, ${agentName}!`,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
