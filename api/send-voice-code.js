const twilio = require("twilio");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { phone, firstName, lastName, amount, paymentMethod, reference, date } = req.body || {};
    if (!/^\+\d{10,15}$/.test(phone || "")) {
      return res.status(400).json({ error: "Valid international phone number required." });
    }
    const customerName = `${firstName || ""} ${lastName || ""}`.trim() || "Customer";
    const amountText = amount ? `${amount} dollars` : "the payment amount";
    const methodText = paymentMethod ? `using ${paymentMethod}` : "";
    const refText = reference ? `The payment reference is ${reference}.` : "";
    const dateText = date ? `Payment date: ${date}.` : "";

    const message = `Hello ${customerName}. This is MOVIARA calling with a professional payment confirmation. We confirm that your payment of ${amountText} ${methodText} has been received. ${dateText} ${refText} Thank you, ${customerName}, for your payment. We appreciate your business.`;

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: "alice", language: "en-US" }, message);
    twiml.pause({ length: 1 });
    twiml.say({ voice: "alice", language: "en-US" }, `Once again, ${message}`);

    let client;
    if (process.env.TWILIO_API_KEY && (process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_SECRET || process.env.TWILIO_AUTH_TOKEN)) {
      client = twilio(process.env.TWILIO_API_KEY, (process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_SECRET || process.env.TWILIO_AUTH_TOKEN), {
        accountSid: process.env.TWILIO_ACCOUNT_SID
      });
    } else if (process.env.TWILIO_AUTH_TOKEN) {
      client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } else {
      return res.status(500).json({ error: "Twilio credentials are not configured." });
    }

    const call = await client.calls.create({
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: twiml.toString()
    });

    return res.status(200).json({ success: true, callSid: call.sid, status: call.status });
  } catch (error) {
    console.error("Voice payment confirmation failed:", error.message);
    return res.status(500).json({ error: "Unable to initiate the voice call. Check Twilio configuration and account balance." });
  }
};
