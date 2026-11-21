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

    const spaced = code.split("").join(" ");
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(
      { language: "en-US" },
      `Your MOVIARA verification code is ${spaced}.`
    );
    twiml.pause({ length: 1 });
    twiml.say({ language: "en-US" }, `Again, your code is ${spaced}.`);

    await client.calls.create({
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: twiml.toString(),
    });

    return res.status(200).json({ hash, expires });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Pa t kapab fè apèl la" });
  }
};
