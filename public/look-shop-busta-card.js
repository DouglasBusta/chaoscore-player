(function () {
  "use strict";

  if (window.__lookShopBustaCardBooted) return;
  window.__lookShopBustaCardBooted = true;

  const SHOP_STYLE_ID = "look-shop-busta-card-runtime-style";

  function getShopStyle() {
    return `
      .look-shop-busta-card {
        position: relative !important;
        overflow: hidden !important;
        text-decoration: none !important;
        color: inherit !important;
        isolation: isolate !important;
      }

      .look-shop-busta-card,
      .look-shop-busta-card * {
        box-sizing: border-box !important;
      }

      .look-shop-busta-card-bg {
        position: absolute !important;
        inset: 0 !important;
        z-index: 0 !important;
        opacity: 0.82 !important;
        background:
          radial-gradient(circle at 74% 18%, rgba(180,24,45,0.34), transparent 9rem),
          linear-gradient(135deg, rgba(62,8,15,0.92), rgba(9,8,8,0.92)),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px) !important;
        background-size: auto, auto, 18px 18px, 18px 18px !important;
        pointer-events: none !important;
      }

      .look-shop-busta-card-copy {
        position: relative !important;
        z-index: 2 !important;
        width: 100% !important;
        height: 100% !important;
        min-height: inherit !important;
        padding: 18px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-end !important;
        align-items: flex-start !important;
        gap: 5px !important;
        text-align: left !important;
      }

      .look-shop-busta-card-copy span {
        display: block !important;
        font-size: 0.62rem !important;
        letter-spacing: 0.18em !important;
        text-transform: uppercase !important;
        color: rgba(231,224,210,0.58) !important;
      }

      .look-shop-busta-card-copy strong {
        display: block !important;
        max-width: 13ch !important;
        font-size: clamp(1.12rem, 2vw, 1.72rem) !important;
        line-height: 0.92 !important;
        letter-spacing: -0.06em !important;
        text-transform: uppercase !important;
        color: rgba(245,238,224,0.98) !important;
      }

      .look-shop-busta-card-copy small {
        display: block !important;
        max-width: 26ch !important;
        font-size: 0.62rem !important;
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

    style.textContent = getShopStyle();
  }

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findChaosCard(root) {
    const nodes = Array.from(root.querySelectorAll("a, article, section, div, button"));

    return nodes.find(function (el) {
      const text = textOf(el);
      return text.includes("listen to") && text.includes("chaoscore");
    });
  }

  function findRealCard(el) {
    if (!el) return null;

    let current = el;

    for (let i = 0; i < 9 && current; i++) {
      const rect = current.getBoundingClientRect();

      if (
        rect.width >= 170 &&
        rect.width <= 560 &&
        rect.height >= 70 &&
        rect.height <= 300
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return el;
  }

  function makeShopCard(root) {
    const shopCard = root.createElement("a");

    shopCard.href = "/shop";
    shopCard.setAttribute("aria-label", "Enter the LOOK SHOP");

    shopCard.innerHTML = `
      <div class="look-shop-busta-card-bg"></div>
      <div class="look-shop-busta-card-copy">
        <span>SUPPLY DROP</span>
        <strong>ENTER THE SHOP</strong>
        <small>NFC TAGS / MERCH / STICKERS</small>
      </div>
    `;

    return shopCard;
  }

  function syncShopCardShape(shopCard, chaosCard) {
    if (!shopCard || !chaosCard) return;

    /*
      Punto chiave:
      la card shop eredita le classi della card LISTEN TO #CHAOSCORE,
      quindi prende la stessa forma, larghezza e comportamento nella griglia.
    */
    shopCard.className = chaosCard.className || "";
    shopCard.classList.add("look-shop-busta-card");

    const rect = chaosCard.getBoundingClientRect();

    if (rect.height > 60) {
      shopCard.style.minHeight = Math.round(rect.height) + "px";
    }

    shopCard.style.width = "";
    shopCard.style.maxWidth = "";
    shopCard.style.gridColumn = "";
  }

  function mountShopCardIn(root) {
    if (!root || !root.body) return false;

    ensureShopStyle(root);

    const chaosHit = findChaosCard(root);
    const chaosCard = findRealCard(chaosHit);

    if (!chaosCard || !chaosCard.parentElement) return false;

    let shopCard = root.querySelector(".look-shop-busta-card");

    if (!shopCard) {
      shopCard = makeShopCard(root);
    }

    syncShopCardShape(shopCard, chaosCard);

    /*
      Punto chiave:
      la shop card viene messa subito DOPO listen to #chaoscore.
      Se la griglia ha spazio, sta di fianco.
      Se non ha spazio, va a capo come una normale card.
    */
    if (shopCard.previousElementSibling !== chaosCard) {
      chaosCard.insertAdjacentElement("afterend", shopCard);
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

    document.querySelectorAll("iframe").forEach(function (frame) {
      frame.addEventListener("load", function () {
        setTimeout(mountEverywhere, 100);
        setTimeout(mountEverywhere, 500);
        setTimeout(mountEverywhere, 1200);
      });
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
