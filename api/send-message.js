const twilio = require("twilio");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to = {}, text, channels = [], subject } = req.body || {};
  if (typeof text !== "string" || !text.trim())
    return res.status(400).json({ error: "Message text is required." });
  if (text.length > 1600)
    return res.status(400).json({ error: "Message is too long. Keep it under 1600 characters." });

  const selected = [...new Set(Array.isArray(channels) ? channels : [])]
    .filter(c => ["SMS", "WHATSAPP", "EMAIL"].includes(c));
  if (!selected.length)
    return res.status(400).json({ error: "Select a valid messaging channel." });

  const phone = String(to.phone || "").replace(/[\s().-]/g, "");
  const email = String(to.email || "").trim();
  if (selected.some(c => c === "SMS" || c === "WHATSAPP") &&
      !/^\+[1-9]\d{7,14}$/.test(phone))
    return res.status(400).json({ error: "Enter a valid international phone number with country code, such as +18095551234." });
  if (selected.includes("EMAIL") && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !subject))
    return res.status(400).json({ error: "A valid email and subject are required. Email sending is not configured yet." });

  if (selected.includes("EMAIL"))
    return res.status(501).json({ error: "Email sending is not configured yet. Choose SMS or WhatsApp." });

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_SECRET;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !from || (!(apiKey && apiSecret) && !authToken)) {
    return res.status(500).json({
      error: "Twilio configuration is incomplete. Check TWILIO_ACCOUNT_SID, TWILIO_PHONE_NUMBER, and either TWILIO_API_KEY + TWILIO_API_SECRET or TWILIO_AUTH_TOKEN in Vercel."
    });
  }

  try {
    const client = (apiKey && apiSecret)
      ? twilio(apiKey, apiSecret, { accountSid: sid })
      : twilio(sid, authToken);

    const results = {};
    for (const channel of selected) {
      let message;
      if (channel === "SMS") {
        message = await client.messages.create({ from, to: phone, body: text.trim() });
      } else if (channel === "WHATSAPP") {
        const whatsappFrom = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
        const whatsappTo = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
        message = await client.messages.create({ from: whatsappFrom, to: whatsappTo, body: text.trim() });
      }
      results[channel] = {
        success: true,
        sid: message.sid,
        status: message.status
      };
    }
    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error("Twilio send error:", {
      message: err.message,
      code: err.code,
      status: err.status
    });
    return res.status(err.status || 502).json({
      error: err.message || "Twilio could not send the message.",
      code: err.code || null,
      providerStatus: err.status || null
    });
  }
};
