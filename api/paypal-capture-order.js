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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL || "orders@lookapp.org";

  if (!apiKey || !to) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      paypalOrderId,
      lookOrderId,
      total,
      preview,
      customerEmail
    } = req.body || {};

    if (!paypalOrderId) {
      return res.status(400).json({ error: "Missing paypalOrderId" });
    }

    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "PayPal capture failed",
        details: data
      });
    }

    const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
    const status = capture?.status || data?.status || "UNKNOWN";
    const paidAmount = capture?.amount?.value || total || "";
    const paidCurrency = capture?.amount?.currency_code || "EUR";

    const orderText =
`LOOK APP SHOP — PAGAMENTO PAYPAL CONFERMATO

Ordine: ${lookOrderId || "LOOK ORDER"}
PayPal Order ID: ${paypalOrderId}
Stato PayPal: ${status}
Importo pagato: ${paidAmount} ${paidCurrency}

${preview || "Nessun riepilogo ordine disponibile."}`;

    const html =
`<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
  <h2>LOOK APP SHOP — Pagamento PayPal confermato</h2>
  <p><strong>Ordine:</strong> ${escapeHtml(lookOrderId || "LOOK ORDER")}</p>
  <p><strong>PayPal Order ID:</strong> ${escapeHtml(paypalOrderId)}</p>
  <p><strong>Stato PayPal:</strong> ${escapeHtml(status)}</p>
  <p><strong>Importo pagato:</strong> ${escapeHtml(paidAmount)} ${escapeHtml(paidCurrency)}</p>
  <pre style="white-space:pre-wrap;background:#f5f5f5;padding:14px;border-radius:10px">${escapeHtml(preview || "Nessun riepilogo ordine disponibile.")}</pre>
</div>`;

    const adminEmail = process.env.ORDER_ADMIN_EMAIL || "orders@lookapp.org";

    await sendEmail({
      to: adminEmail,
      subject: `Pagamento PayPal confermato — ${lookOrderId || paypalOrderId}`,
      text: orderText,
      html
    });

    if (customerEmail && String(customerEmail).includes("@")) {
      await sendEmail({
        to: customerEmail,
        subject: `LOOK APP SHOP — pagamento confermato ${lookOrderId || ""}`.trim(),
        text: orderText,
        html
      });
    }

    return res.status(200).json({
      ok: true,
      paypalOrderId,
      lookOrderId,
      status,
      paidAmount,
      paidCurrency,
      paypal: data
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "PayPal capture error"
    });
  }
}
