const { Resend } = require("resend");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(text) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.SHOP_ADMIN_EMAIL || "shop@lookapp.org";
    const fromEmail = process.env.SHOP_FROM_EMAIL || "LOOK SHOP <shop@lookapp.org>";

    if (!apiKey) {
      return json(res, 500, {
        ok: false,
        error: "RESEND_API_KEY mancante su Vercel. Aggiungila in Project Settings > Environment Variables e fai redeploy."
      });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const orderText = String(body.orderText || "").trim();
    const customerEmail = String(body.customerEmail || "").trim();
    const customerName = String(body.customerName || "").trim();

    if (!orderText) {
      return json(res, 400, { ok: false, error: "Order text mancante." });
    }

    if (!customerEmail || !customerEmail.includes("@")) {
      return json(res, 400, { ok: false, error: "Email cliente non valida." });
    }

    const resend = new Resend(apiKey);

    const subject = "Nuovo ordine LOOK SHOP / #chaoscore";

    const adminHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h1>Nuovo ordine LOOK SHOP</h1>
        <p><strong>Cliente:</strong> ${escapeHtml(customerName || customerEmail)}</p>
        <p><strong>Email cliente:</strong> ${escapeHtml(customerEmail)}</p>
        <hr>
        <pre style="white-space:pre-wrap;background:#f4f4f4;padding:16px;border-radius:12px">${escapeHtml(orderText)}</pre>
      </div>
    `;

    const customerHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h1>Ordine ricevuto</h1>
        <p>Ciao ${escapeHtml(customerName || "")}, abbiamo ricevuto il tuo ordine LOOK SHOP.</p>
        <p>Questo è ancora un checkout beta: il pagamento non è stato effettuato.</p>
        <hr>
        <div>${textToHtml(orderText)}</div>
      </div>
    `;

    const adminResult = await resend.emails.send({
      from: fromEmail,
      to: [adminEmail],
      replyTo: customerEmail,
      subject,
      html: adminHtml
    });

    if (adminResult.error) {
      return json(res, 500, {
        ok: false,
        error: adminResult.error.message || JSON.stringify(adminResult.error) || "Errore invio email admin. Controlla dominio mittente e API key Resend."
      });
    }

    const customerResult = await resend.emails.send({
      from: fromEmail,
      to: [customerEmail],
      replyTo: adminEmail,
      subject: "Conferma ordine LOOK SHOP / #chaoscore",
      html: customerHtml
    });

    if (customerResult.error) {
      return json(res, 500, {
        ok: false,
        error: customerResult.error.message || JSON.stringify(customerResult.error) || "Errore invio email cliente. Controlla dominio mittente e API key Resend."
      });
    }

    return json(res, 200, {
      ok: true,
      adminEmailId: adminResult.data && adminResult.data.id,
      customerEmailId: customerResult.data && customerResult.data.id
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error && error.message ? error.message : "Errore server."
    });
  }
};
