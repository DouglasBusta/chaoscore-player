(function () {
  "use strict";

  if (window.__lookShopBustaCardBooted) return;
  window.__lookShopBustaCardBooted = true;

  const SHOP_STYLE_ID = "look-shop-busta-card-runtime-style";

  function getShopStyleText() {
    return `
      .look-shop-busta-card {
        position: relative !important;
        min-height: 118px !important;
        max-height: 150px !important;
        width: 100% !important;
        border-radius: 18px !important;
        overflow: hidden !important;
        display: block !important;
        text-decoration: none !important;
        color: inherit !important;
        border: 1px solid rgba(231,224,210,0.14) !important;
        background:
          radial-gradient(circle at 76% 18%, rgba(180,24,45,0.34), transparent 9rem),
          linear-gradient(135deg, rgba(62,8,15,0.94), rgba(9,8,8,0.94)) !important;
        box-shadow: 0 18px 44px rgba(0,0,0,0.28) !important;
        isolation: isolate !important;
      }

      .look-shop-busta-card-bg {
        position: absolute !important;
        inset: 0 !important;
        z-index: 0 !important;
        opacity: 0.72 !important;
        background:
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px) !important;
        background-size: 18px 18px !important;
        pointer-events: none !important;
      }

      .look-shop-busta-card-copy {
        position: relative !important;
        z-index: 2 !important;
        min-height: 118px !important;
        padding: 16px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-end !important;
        align-items: flex-start !important;
        gap: 5px !important;
        text-align: left !important;
      }

      .look-shop-busta-card-copy span {
        display: block !important;
        font-size: 0.58rem !important;
        letter-spacing: 0.18em !important;
        text-transform: uppercase !important;
        color: rgba(231,224,210,0.58) !important;
      }

      .look-shop-busta-card-copy strong {
        display: block !important;
        max-width: 13ch !important;
        font-size: clamp(1.05rem, 1.8vw, 1.55rem) !important;
        line-height: 0.92 !important;
        letter-spacing: -0.06em !important;
        text-transform: uppercase !important;
        color: rgba(245,238,224,0.98) !important;
      }

      .look-shop-busta-card-copy small {
        display: block !important;
        max-width: 24ch !important;
        font-size: 0.58rem !important;
        line-height: 1.15 !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        color: rgba(231,224,210,0.62) !important;
      }
    `;
  }

  function ensureShopStyle(root) {
    if (!root || !root.head) return;

    let style = root.getElementById(SHOP_STYLE_ID);

    if (!style) {
      style = root.createElement("style");
      style.id = SHOP_STYLE_ID;
      root.head.appendChild(style);
    }

    style.textContent = getShopStyleText();
  }

  function cleanText(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findListenCard(root) {
    const all = Array.from(root.querySelectorAll("a, article, div, section, button"));

    const hits = all.filter(function (el) {
      const text = cleanText(el);
      if (!text.includes("listen to") || !text.includes("chaoscore")) return false;

      const rect = el.getBoundingClientRect();
      return rect.width >= 150 && rect.width <= 360 && rect.height >= 70 && rect.height <= 170;
    });

    hits.sort(function (a, b) {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.width * ar.height) - (br.width * br.height);
    });

    return hits[0] || null;
  }

  function makeShopCard(root) {
    const card = root.createElement("a");

    card.className = "look-shop-busta-card";
    card.href = "/shop";
    card.setAttribute("aria-label", "Enter the LOOK SHOP");

    card.innerHTML = `
      <div class="look-shop-busta-card-bg"></div>
      <div class="look-shop-busta-card-copy">
        <span>SUPPLY DROP</span>
        <strong>ENTER THE SHOP</strong>
        <small>NFC TAGS / MERCH / STICKERS</small>
      </div>
    `;

    return card;
  }

  function mountShopCardIn(root) {
    if (!root || !root.body) return false;

    ensureShopStyle(root);

    const listenCard = findListenCard(root);
    if (!listenCard || !listenCard.parentElement) return false;

    let shopCard = root.querySelector(".look-shop-busta-card");

    if (!shopCard) {
      shopCard = makeShopCard(root);
    }

    /*
      Copiamo solo le classi della card giusta.
      Non copiamo dimensioni da contenitori grandi.
    */
    shopCard.className = listenCard.className || "";
    shopCard.classList.add("look-shop-busta-card");

    shopCard.style.gridColumn = "auto";
    shopCard.style.width = "";
    shopCard.style.maxWidth = "";
    shopCard.style.minHeight = "118px";
    shopCard.style.maxHeight = "150px";

    if (shopCard.previousElementSibling !== listenCard) {
      listenCard.insertAdjacentElement("afterend", shopCard);
    }

    return true;
  }

  function mountEverywhere() {
    mountShopCardIn(document);

    document.querySelectorAll("iframe").forEach(function (frame) {
      try {
        if (frame.contentDocument) {
          mountShopCardIn(frame.contentDocument);
        }
      } catch (_) {}
    });
  }

  function boot() {
    mountEverywhere();

    const observer = new MutationObserver(function () {
      mountEverywhere();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener("resize", function () {
      setTimeout(mountEverywhere, 100);
    });

    window.__lookShopMountEverywhere = mountEverywhere;

    setInterval(mountEverywhere, 1500);

    setTimeout(mountEverywhere, 250);
    setTimeout(mountEverywhere, 900);
    setTimeout(mountEverywhere, 1800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
