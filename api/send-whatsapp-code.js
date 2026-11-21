const twilio = require("twilio");
const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metòd pa pèmèt" });
  }

  try {
    const { phone } = req.body || {};

    if (!/^\+\d{10,15}$/.test(phone || "")) {
      return res.status(400).json({ error: "Nimewo pa valid" });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const expires = Date.now() + 5 * 60 * 1000;

    const hash = crypto
      .createHmac("sha256", process.env.OTP_SECRET)
      .update(`${phone}.${code}.${expires}`)
      .digest("hex");

    const client = twilio(
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      { accountSid: process.env.TWILIO_ACCOUNT_SID }
    );

    await client.messages.create({
      to: `whatsapp:${phone}`,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      body: `Kòd verifikasyon ou nan MOVIARA: ${code}`,
    });

    return res.status(200).json({ hash, expires });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Pa t kapab voye mesaj WhatsApp la" });
  }
};
