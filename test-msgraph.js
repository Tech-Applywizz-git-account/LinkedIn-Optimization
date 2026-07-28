const fs = require('fs');
const path = require('path');


// Basic dotenv parser for this script
const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

async function testGraph() {
  const tenantId = env.MICROSOFT_TENANT_ID;
  const clientId = env.MICROSOFT_CLIENT_ID;
  const clientSecret = env.MICROSOFT_CLIENT_SECRET;
  const senderEmail = env.SENDER_EMAIL;

  console.log("Testing with:");
  console.log("Tenant ID:", tenantId);
  console.log("Client ID:", clientId);
  console.log("Sender:", senderEmail);

  try {
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
      console.error("Token Error:", await tokenResponse.text());
      return;
    }

    const { access_token } = await tokenResponse.json();
    console.log("Successfully got access token.");

    const sendMailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: "Test Email",
          body: {
            contentType: "Text",
            content: "This is a test email.",
          },
          toRecipients: [
            { emailAddress: { address: senderEmail } },
          ],
        },
        saveToSentItems: false,
      }),
    });

    if (!sendMailResponse.ok) {
      console.error("Send Mail Error:", await sendMailResponse.text());
    } else {
      console.log("Successfully sent email!");
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testGraph();
