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
    throw new Error(
      data?.error_description ||
      data?.error ||
      "PayPal token error"
    );
  }

  return data.access_token;
}

function parseEuroAmount(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(",", ".");

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

function calculateExpectedTotal(preview) {
  const text = String(preview || "");

  /*
   * Legge esplicitamente:
   * Totale prodotti: 4,99 €
   * Spedizione: 2,00 €
   */
  const productsMatch = text.match(
    /Totale prodotti:\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*€/i
  );

  const shippingMatch = text.match(
    /Spedizione:\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*€/i
  );

  if (!productsMatch || !shippingMatch) {
    return null;
  }

  const productsTotal = parseEuroAmount(productsMatch[1]);
  const shippingTotal = parseEuroAmount(shippingMatch[1]);

  if (productsTotal === null || shippingTotal === null) {
    return null;
  }

  return (productsTotal + shippingTotal).toFixed(2);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      orderId,
      total,
      preview
    } = req.body || {};

    if (!orderId) {
      return res.status(400).json({
        error: "Missing orderId"
      });
    }

    if (!preview) {
      return res.status(400).json({
        error: "Missing order preview"
      });
    }

    const expectedAmount = calculateExpectedTotal(preview);

    if (!expectedAmount) {
      return res.status(400).json({
        error: "Unable to calculate order total"
      });
    }

    const submittedNumber = parseEuroAmount(total);

    if (submittedNumber === null) {
      return res.status(400).json({
        error: "Invalid submitted total"
      });
    }

    const submittedAmount = submittedNumber.toFixed(2);

    /*
     * Il browser deve essere coerente con il totale
     * ricostruito dal riepilogo ordine.
     */
    if (submittedAmount !== expectedAmount) {
      return res.status(400).json({
        error: "Invalid order total",
        expected: expectedAmount,
        received: submittedAmount
      });
    }

    const amount = expectedAmount;

    const accessToken = await getAccessToken();

    const response = await fetch(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
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
      }
    );

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
      error:
        error.message ||
        "PayPal create order error"
    });
  }
}
