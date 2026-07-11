export default async function handler(req, res) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const env = process.env.PAYPAL_ENV || "sandbox";

  if (!clientId) {
    return res.status(500).json({ error: "PAYPAL_CLIENT_ID missing" });
  }

  return res.status(200).json({
    clientId,
    env,
    currency: "EUR"
  });
}
