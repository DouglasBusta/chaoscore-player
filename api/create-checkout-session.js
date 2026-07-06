import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = {
  "nfc-chaoscore-tag": {
    name: "NFC #chaoscore tag",
    amount: 499
  },
  "chaoscore-sticker-pack": {
    name: "#chaoscore sticker pack",
    amount: 499
  },
  "chaoscore-bundle": {
    name: "#chaoscore bundle",
    amount: 2499
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Metodo non consentito" });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ ok: false, error: "STRIPE_SECRET_KEY mancante su Vercel" });
    }

    const siteUrl = process.env.PUBLIC_SITE_URL || "https://lookapp.org";
    const { cart, customerEmail, customerName, orderText } = req.body || {};

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ ok: false, error: "Carrello vuoto" });
    }

    if (!customerEmail || !String(customerEmail).includes("@")) {
      return res.status(400).json({ ok: false, error: "Email cliente non valida" });
    }

    const lineItems = cart.map((item) => {
      const product = PRODUCTS[item.id];

      if (!product) {
        throw new Error(`Prodotto non valido: ${item.id}`);
      }

      const quantity = Math.max(1, Math.min(20, Number(item.qty || 1)));

      return {
        quantity,
        price_data: {
          currency: "eur",
          unit_amount: product.amount,
          product_data: {
            name: product.name
          }
        }
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      line_items: lineItems,
      success_url: `${siteUrl}/shop/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/shop/cancel.html`,
      metadata: {
        customerName: customerName || "",
        orderPreview: String(orderText || "").slice(0, 450)
      }
    });

    return res.status(200).json({
      ok: true,
      url: session.url
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error && error.message ? error.message : "Errore creazione checkout Stripe"
    });
  }
}
