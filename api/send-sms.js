// Vercel serverless function: securely sends SMS through Twilio.
// Required Vercel environment variables:
// TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_PHONE_NUMBER

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_PHONE_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET || !TWILIO_PHONE_NUMBER) {
    return res.status(500).json({ error: "Twilio is not configured. Check the Vercel environment variables." });
  }

  const { to, message } = req.body || {};
  if (!to || !message) return res.status(400).json({ error: "Phone number and message are required." });
  if (typeof message !== "string" || message.length > 1600) {
    return res.status(400).json({ error: "Message is too long. Keep it under 1600 characters." });
  }
  const phone = String(to).replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return res.status(400).json({ error: "Enter a valid international phone number, including country code." });
  }

  try {
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_API_KEY}:${TWILIO_API_SECRET}`).toString("base64");
    const form = new URLSearchParams({ To: phone, From: TWILIO_PHONE_NUMBER, Body: message });
    const twilioResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form
    });
    const result = await twilioResponse.json();
    if (!twilioResponse.ok) {
      return res.status(twilioResponse.status).json({
        error: result.message || "Twilio rejected the SMS request.",
        code: result.code
      });
    }
    return res.status(200).json({ success: true, sid: result.sid, status: result.status });
  } catch (error) {
    return res.status(500).json({ error: "Unable to contact Twilio. Please try again." });
  }
}
