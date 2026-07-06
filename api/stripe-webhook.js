import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

async function readRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Metodo non consentito" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ ok: false, error: "STRIPE_SECRET_KEY mancante" });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ ok: false, error: "STRIPE_WEBHOOK_SECRET mancante" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ ok: false, error: "RESEND_API_KEY mancante" });
  }

  const signature = req.headers["stripe-signature"];
  const rawBody = await readRawBody(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: `Webhook Stripe non valido: ${error.message}`
    });
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ ok: true, ignored: event.type });
  }

  const session = event.data.object;

  const adminEmail = process.env.ORDER_ADMIN_EMAIL || process.env.SHOP_ADMIN_EMAIL;
  const fromEmail =
    process.env.ORDER_FROM_EMAIL ||
    process.env.SHOP_FROM_EMAIL ||
    "LOOK APP SHOP <orders@lookapp.org>";

  const customerEmail = session.customer_details?.email || session.customer_email;
  const customerName =
    session.customer_details?.name ||
    session.metadata?.customerName ||
    "Cliente LOOK APP SHOP";

  const amountTotal = typeof session.amount_total === "number"
    ? (session.amount_total / 100).toFixed(2).replace(".", ",") + " €"
    : "Importo non disponibile";

  const orderPreview = (
    session.metadata?.orderPreview || "Dettagli ordine non disponibili in questa prima versione webhook."
  )
    .replaceAll("Pagamento non ancora effettuato.", "Pagamento ricevuto tramite Stripe.")
    .replaceAll("Pagamento in attesa di conferma Stripe.", "Pagamento ricevuto tramite Stripe.")
    .replaceAll("Checkout in modalità preview.", "Checkout completato in modalità sandbox Stripe.")
    .replaceAll("Checkout in modalità sandbox Stripe.", "Checkout completato in modalità sandbox Stripe.");

  const subjectAdmin = `Pagamento ricevuto LOOK APP SHOP — ${amountTotal}`;
  const subjectCustomer = `Pagamento confermato LOOK APP SHOP`;

  const adminHtml = `
    <h1>Pagamento ricevuto LOOK APP SHOP</h1>
    <p><strong>Importo:</strong> ${escapeHtml(amountTotal)}</p>
    <p><strong>Cliente:</strong> ${escapeHtml(customerName)}</p>
    <p><strong>Email cliente:</strong> ${escapeHtml(customerEmail)}</p>
    <p><strong>Stripe session:</strong> ${escapeHtml(session.id)}</p>
    <hr />
    <pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${escapeHtml(orderPreview)}</pre>
  `;

  const customerHtml = `
    <h1>Pagamento confermato</h1>
    <p>Ciao ${escapeHtml(customerName)},</p>
    <p>abbiamo ricevuto il pagamento per il tuo ordine LOOK APP SHOP.</p>
    <p><strong>Importo:</strong> ${escapeHtml(amountTotal)}</p>
    <p>Questa è una conferma automatica in modalità sandbox/test.</p>
  `;

  try {
    if (adminEmail) {
      await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        replyTo: customerEmail || undefined,
        subject: subjectAdmin,
        html: adminHtml,
        text: `Pagamento ricevuto LOOK APP SHOP\nImporto: ${amountTotal}\nCliente: ${customerName}\nEmail: ${customerEmail}\nStripe session: ${session.id}\n\n${orderPreview}`
      });
    }

    if (customerEmail) {
      await resend.emails.send({
        from: fromEmail,
        to: customerEmail,
        subject: subjectCustomer,
        html: customerHtml,
        text: `Pagamento confermato LOOK APP SHOP\nImporto: ${amountTotal}\nGrazie per il tuo ordine.`
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error && error.message ? error.message : "Errore invio email post-pagamento"
    });
  }
}
