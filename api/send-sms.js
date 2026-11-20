// Vercel serverless function: securely sends SMS through ClickSend.
// Required Vercel environment variables:
// CLICKSEND_USERNAME, CLICKSEND_API_KEY
// Optional: CLICKSEND_FROM (sender ID or phone number, if supported for your account/region)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { CLICKSEND_USERNAME, CLICKSEND_API_KEY, CLICKSEND_FROM } = process.env;
  if (!CLICKSEND_USERNAME || !CLICKSEND_API_KEY) {
    return res.status(500).json({ error: "ClickSend is not configured. Check the Vercel environment variables." });
  }

  const { to, message } = req.body || {};
  if (!to || !message) return res.status(400).json({ error: "Phone number and message are required." });
  if (typeof message !== "string" || message.length > 1600) {
    return res.status(400).json({ error: "Message is too long. Keep it under 1600 characters." });
  }
  const phone = String(to).replace(/[\\s().-]/g, "");
  if (!/^\\+[1-9]\\d{7,14}$/.test(phone)) {
    return res.status(400).json({ error: "Enter a valid international phone number, including country code." });
  }

  try {
    const auth = Buffer.from(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`).toString("base64");
    const payload = {
      messages: [{
        to: phone,
        body: message,
        source: "MOVIARA Message Studio",
        ...(CLICKSEND_FROM ? { from: CLICKSEND_FROM } : {})
      }]
    };
    const response = await fetch("https://rest.clicksend.com/v3/sms/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result?.response_code && result.response_code !== "SUCCESS") {
      return res.status(response.status || 400).json({
        error: result?.response_msg || result?.data?.messages?.[0]?.message || "ClickSend rejected the SMS request."
      });
    }
    const sms = result?.data?.messages?.[0] || {};
    return res.status(200).json({ success: true, message_id: sms.message_id, status: sms.status });
  } catch (error) {
    return res.status(500).json({ error: "Unable to contact ClickSend. Please try again." });
  }
}
