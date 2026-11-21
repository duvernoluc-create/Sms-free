// Vercel serverless function: securely sends SMS through Unlimited Messaging.
// Set UM_API_KEY in Vercel Project Settings > Environment Variables.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.UM_API_KEY;
  if (!token) return res.status(500).json({ error: "Unlimited Messaging is not configured. Set UM_API_KEY in Vercel." });

  const { to, message } = req.body || {};
  if (!to || !message) return res.status(400).json({ error: "Phone number and message are required." });
  if (typeof message !== "string" || message.length > 1600) return res.status(400).json({ error: "Message is too long. Keep it under 1600 characters." });

  const phone = String(to).replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return res.status(400).json({ error: "Enter a valid international phone number, including country code." });

  try {
    const response = await fetch("https://api.unlimitedmessaging.app/message", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: { phone }, text: message, channels: [{ channel: "SMS" }] })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: result?.message || result?.error || "Unlimited Messaging rejected the request." });
    return res.status(200).json({ success: true, message_id: result?.id || result?.messageId || result?.dispatchId, status: result?.status || "Submitted" });
  } catch (error) {
    return res.status(500).json({ error: "Unable to contact Unlimited Messaging. Please try again." });
  }
}
