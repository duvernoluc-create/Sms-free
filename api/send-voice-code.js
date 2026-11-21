const twilio = require("twilio");
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { phone, firstName, lastName, amount, paymentMethod, reference, date } = req.body || {};
    if (!/^\+[1-9]\d{7,14}$/.test(phone || "")) return res.status(400).json({ error: "Valid international phone number required." });
    const sid = process.env.TWILIO_ACCOUNT_SID, key = process.env.TWILIO_API_KEY;
    const secret = process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_SECRET;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !from || !(key && secret) && !token) return res.status(500).json({ error: "Twilio configuration missing. Check Account SID, API Key, API Secret, and phone number in Vercel." });
    const client = key && secret ? twilio(key, secret, { accountSid: sid }) : twilio(sid, token);
    const name = `${firstName || ""} ${lastName || ""}`.trim() || "Customer";
    const msg = `Hello ${name}. This is MOVIARA calling with a professional payment confirmation. We confirm that your payment of ${amount || "the payment amount"} dollars ${paymentMethod ? `using ${paymentMethod}` : ""} has been received. ${date ? `Payment date: ${date}.` : ""} ${reference ? `The payment reference is ${reference}.` : ""} Thank you, ${name}, for your payment. We appreciate your business.`;
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: "alice", language: "en-US" }, msg);
    twiml.pause({ length: 1 });
    twiml.say({ voice: "alice", language: "en-US" }, `Once again, ${msg}`);
    const call = await client.calls.create({ to: phone, from, twiml: twiml.toString() });
    return res.status(200).json({ success: true, callSid: call.sid, status: call.status });
  } catch (e) {
    console.error("Voice call error:", e.message);
    return res.status(500).json({ error: e.message || "Twilio could not initiate the call." });
  }
};
