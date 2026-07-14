const PAYPAL_API = process.env.PAYPAL_ENV === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error("PayPal credentials missing");
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || "PayPal token error");
  }

  return data.access_token;
}

const EXPECTED_ORDER_AMOUNT = "6.99";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, total } = req.body || {};
    const submittedAmount = Number(String(total || "").replace(",", ".")).toFixed(2);

    if (!orderId) {
      return res.status(400).json({ error: "Missing orderId" });
    }

    if (submittedAmount !== EXPECTED_ORDER_AMOUNT) {
      return res.status(400).json({
        error: "Invalid order total",
        expected: EXPECTED_ORDER_AMOUNT
      });
    }

    const amount = EXPECTED_ORDER_AMOUNT;

    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: orderId,
            custom_id: orderId,
            description: `LOOK APP SHOP order ${orderId}`,
            amount: {
              currency_code: "EUR",
              value: amount
            }
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "PayPal create order failed",
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "PayPal create order error"
    });
  }
}
