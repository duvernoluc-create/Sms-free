const twilio = require("twilio");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { to = {}, text, channels = [], subject } = req.body || {};
  if (!text || typeof text !== "string") return res.status(400).json({ error: "Message text is required." });
  if (text.length > 1600) return res.status(400).json({ error: "Message is too long. Keep it under 1600 characters." });
  const selected = [...new Set(channels)].filter(c => ["SMS", "WHATSAPP", "EMAIL"].includes(c));
  if (!selected.length) return res.status(400).json({ error: "Select a valid messaging channel." });
  const phone = String(to.phone || "").replace(/[\s().-]/g, "");
  const email = String(to.email || "").trim();
  if ((selected.includes("SMS") || selected.includes("WHATSAPP")) && !/^\+[1-9]\d{7,14}$/.test(phone))
    return res.status(400).json({ error: "Enter a valid international phone number with country code." });
  if (selected.includes("EMAIL") && (!email.includes("@") || !subject))
    return res.status(400).json({ error: "A valid email and subject are required." });
  const results = {};
  try {
    if (selected.some(c => c === "SMS" || c === "WHATSAPP")) {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const key = process.env.TWILIO_API_KEY;
      const secret = process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_SECRET;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER;
      if (!sid || !from || !(key && secret) && !token)
        return res.status(500).json({ error: "Twilio configuration missing. Required: TWILIO_ACCOUNT_SID, TWILIO_PHONE_NUMBER, TWILIO_API_KEY and TWILIO_API_SECRET (or TWILIO_AUTH_TOKEN)." });
      const client = key && secret ? twilio(key, secret, { accountSid: sid }) : twilio(sid, token);
      if (selected.includes("SMS")) {
        const msg = await client.messages.create({ from, to: phone, body: text });
        results.SMS = { success: true, sid: msg.sid, status: msg.status };
      }
      if (selected.includes("WHATSAPP")) {
        const msg = await client.messages.create({ from: `whatsapp:${from}`, to: `whatsapp:${phone}`, body: text });
        results.WHATSAPP = { success: true, sid: msg.sid, status: msg.status };
      }
    }
    if (selected.includes("EMAIL")) results.EMAIL = { success: false, error: "Email sending is not configured yet." };
    return res.status(200).json({ success: Object.values(results).every(r => r.success), results });
  } catch (err) {
    console.error("Twilio messaging error:", err.message);
    return res.status(500).json({ error: err.message || "Twilio could not send the message." });
  }
};
