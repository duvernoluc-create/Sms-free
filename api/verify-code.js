const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Metòd pa pèmèt" });
  }

  try {
    const { phone, code, hash, expires } = req.body || {};

    if (!phone || !code || !hash || !expires) {
      return res.status(400).json({ ok: false, error: "Done manke" });
    }

    if (Date.now() > Number(expires)) {
      return res.status(400).json({ ok: false, error: "Kòd la ekspire" });
    }

    const check = crypto
      .createHmac("sha256", process.env.OTP_SECRET)
      .update(`${phone}.${code}.${expires}`)
      .digest("hex");

    const a = Buffer.from(check);
    const b = Buffer.from(String(hash));
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!ok) {
      return res.status(400).json({ ok: false, error: "Kòd la pa kòrèk" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Erè sèvè" });
  }
};
