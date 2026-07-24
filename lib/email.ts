// lib/email.ts

export async function sendOTPEmail(toEmail: string, otp: string) {
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const senderEmail = process.env.SENDER_EMAIL;

  if (!tenantId || !clientId || !clientSecret || !senderEmail) {
    throw new Error("Microsoft Graph API credentials are not set in environment variables");
  }

  // 1. Get access token
  const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    console.error("Failed to get Microsoft Graph access token:", err);
    throw new Error("Email service configuration error");
  }

  const { access_token } = await tokenResponse.json();

  // 2. Send email via Microsoft Graph API
  const sendMailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: "Your OTP - ApplyWizz",
        body: {
          contentType: "HTML",
          content: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Login to ApplyWizz</h2>
              <p>Your one-time password (OTP) is:</p>
              <h1 style="font-size: 32px; letter-spacing: 5px; color: #0f172a; margin: 20px 0;">${otp}</h1>
              <p>This code will expire in 15 minutes.</p>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: toEmail,
            },
          },
        ],
      },
      saveToSentItems: false,
    }),
  });

  if (!sendMailResponse.ok) {
    const err = await sendMailResponse.text();
    console.error("Failed to send email via Microsoft Graph:", err);
    throw new Error("Failed to send OTP email");
  }
}
