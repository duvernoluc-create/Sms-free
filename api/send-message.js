const twilio = require("twilio");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { to = {}, text, channels = [], subject } = req.body || {};
  if (!text || typeof text !== "string") return res.status(400).json({ error: "Message text is required." });
  if (text.length > 1600) return res.status(400).json({ error: "Message is too long. Keep it under 1600 characters." });

  const selected = [...new Set(channels)].filter(c => ["WHATSAPP", "EMAIL"].includes(c));
  if (!selected.length) return res.status(400).json({ error: "Select a valid channel." });

  const phone = String(to.phone || "").replace(/[\\s().-]/g, "");
  const email = String(to.email || "").trim();
  if (selected.includes("WHATSAPP") && !/^\\+[1-9]\\d{7,14}$/.test(phone))
    return res.status(400).json({ error: "A valid international phone number is required for WhatsApp." });
  if (selected.includes("EMAIL") && (!email || !email.includes("@") || !subject))
    return res.status(400).json({ error: "A valid email address and subject are required for email." });

  const results = {};
  try {
    if (selected.includes("WHATSAPP")) {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const from = process.env.TWILIO_PHONE_NUMBER;
      let client;
      if (process.env.TWILIO_API_KEY && (process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_SECRET || process.env.TWILIO_AUTH_TOKEN)) {
        client = twilio(process.env.TWILIO_API_KEY, (process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_SECRET || process.env.TWILIO_AUTH_TOKEN), { accountSid: sid });
      } else if (process.env.TWILIO_AUTH_TOKEN) {
        client = twilio(sid, process.env.TWILIO_AUTH_TOKEN);
      } else {
        return res.status(500).json({ error: "Twilio credentials are not configured. Check TWILIO_ACCOUNT_SID, TWILIO_API_KEY, and TWILIO_API_SECRET or TWILIO_AUTH_TOKEN." });
      }
      if (!sid || !from) return res.status(500).json({ error: "Set TWILIO_ACCOUNT_SID and TWILIO_PHONE_NUMBER in Vercel." });
      const msg = await client.messages.create({
        from: `whatsapp:${from}`,
        to: `whatsapp:${phone}`,
        body: text
      });
      results.WHATSAPP = { success: true, sid: msg.sid, status: msg.status };
    }

    if (selected.includes("EMAIL")) {
      results.EMAIL = { success: false, error: "Email provider is not configured in this project." };
    }

    return res.status(200).json({ success: Object.values(results).every(r => r.success), results });
  } catch (error) {
    console.error("Channel send failed:", error.message);
    return res.status(500).json({ error: error.message || "Unable to send message." });
  }
};
