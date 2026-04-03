import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SECURE: Now reading from Supabase Secrets instead of hardcoding
const TENANT_ID = Deno.env.get('TENANT_ID');
const CLIENT_ID = Deno.env.get('CLIENT_ID');
const CLIENT_SECRET = Deno.env.get('CLIENT_SECRET');
const SENDER_EMAIL = 'support@applywizz.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function sign(data: string, secret: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders, status: 200 });

  try {
    const body = await req.json();
    const { email, otp, signature, expiry, type, password, user_id } = body;
    const SECRET = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (type === 'set-password') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { password, email_confirm: true });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    if (type === 'verify') {
      if (Date.now() > (expiry || 0)) throw new Error("Code expired.");
      const expected = await sign(`${email}:${otp}:${expiry}`, SECRET);
      if (signature !== expected) throw new Error("Invalid verification code.");
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email });
      if (error) throw error;
      return new Response(JSON.stringify({ session_link: data.properties.action_link, user_id: data.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const exp = Date.now() + 10 * 60 * 1000;
    const sig = await sign(`${email}:${code}:${exp}`, SECRET);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 20px; margin: 0;">
          <center>
            <div style="max-width: 600px; background-color: #ffffff; border-radius: 24px; text-align: left; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
              <div style="background-color: #0f172a; padding: 32px 40px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">ApplyWizz</h1>
              </div>
              <div style="padding: 40px;">
                <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 24px; font-weight: 700;">Welcome to the future of LinkedIn!</h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  We are excited to help you transform your professional presence. Use the verification code below to secure your account:
                </p>
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #e2e8f0; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #0f172a; font-family: monospace;">${code}</span>
                </div>
                <div style="border-top: 1px solid #f1f5f9; padding-top: 24px;">
                  <h4 style="color: #334155; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">What's next?</h4>
                  <ul style="color: #64748b; font-size: 14px; padding-left: 20px; margin: 0;">
                    <li style="margin-bottom: 8px;"><b>AI Resume Analysis:</b> Instant feedback on your experience.</li>
                    <li style="margin-bottom: 8px;"><b>Profile Optimization:</b> Stand out to top recruiters.</li>
                    <li><b>Expert Guidance:</b> Personalized advice for your career.</li>
                  </ul>
                </div>
              </div>
              <div style="background-color: #f8fafc; padding: 24px 40px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  Sent with care by ApplyWizz Support Team.<br>
                  If you did not request this, please safely ignore this message.
                </p>
              </div>
            </div>
          </center>
        </body>
      </html>
    `;

    const tokenRes = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      method: "POST", body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "client_credentials", scope: "https://graph.microsoft.com/.default" }),
    });
    const { access_token } = await tokenRes.json();

    await fetch(`https://graph.microsoft.com/v1.0/users/${SENDER_EMAIL}/sendMail`, {
      method: "POST", headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { subject: `${code} is your ApplyWizz verification code`, body: { contentType: "HTML", content: emailHtml }, toRecipients: [{ emailAddress: { address: email } }] } }),
    });

    return new Response(JSON.stringify({ signature: sig, expiry: exp }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});
