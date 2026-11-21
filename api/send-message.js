// Vercel serverless function: sends selected channels via Unlimited Messaging.
// API key must remain server-side in UM_API_KEY.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = process.env.UM_API_KEY;
  if (!token) return res.status(500).json({ error: "Unlimited Messaging is not configured. Set UM_API_KEY in Vercel." });
  const { to = {}, text, channels = [], subject } = req.body || {};
  if (!text || typeof text !== "string") return res.status(400).json({ error: "Message text is required." });
  if (text.length > 1600) return res.status(400).json({ error: "Message is too long. Keep it under 1600 characters." });
  const allowed = ["SMS", "WHATSAPP", "EMAIL"];
  const selected = [...new Set(channels)].filter(c => allowed.includes(c));
  if (!selected.length) return res.status(400).json({ error: "Select at least one valid channel." });
  const phone = String(to.phone || "").replace(/[\s().-]/g, "");
  const email = String(to.email || "").trim();
  if (selected.some(c => c === "SMS" || c === "WHATSAPP") && !/^\+[1-9]\d{7,14}$/.test(phone))
    return res.status(400).json({ error: "A valid international phone number is required for SMS or WhatsApp." });
  if (selected.includes("EMAIL") && (!email || !email.includes("@") || !subject))
    return res.status(400).json({ error: "A valid email address and subject are required for email." });
  const payload = { to: {}, text, channels: selected.map(channel => ({ channel })) };
  if (selected.some(c => c === "SMS" || c === "WHATSAPP")) payload.to.phone = phone;
  if (selected.includes("EMAIL")) { payload.to.email = email; payload.subject = subject; }
  try {
    const response = await fetch("https://api.unlimitedmessaging.app/message", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: result?.message || result?.error || "Unlimited Messaging rejected the request." });
    return res.status(200).json({ success: true, message_id: result?.id || result?.messageId, dispatch_id: result?.dispatchId, status: result?.status || "Submitted" });
  } catch {
    return res.status(500).json({ error: "Unable to contact Unlimited Messaging. Please try again." });
  }
}
