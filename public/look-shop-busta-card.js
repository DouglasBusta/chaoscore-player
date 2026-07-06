(function () {
  "use strict";

  if (window.__lookShopBustaCardBooted) return;
  window.__lookShopBustaCardBooted = true;

  const SHOP_STYLE_ID = "look-shop-busta-card-runtime-style";

  function getShopStyle() {
    return `
      .look-shop-busta-card {
        position: relative !important;
        min-height: 120px !important;
        border-radius: 18px !important;
        overflow: hidden !important;
        display: block !important;
        text-decoration: none !important;
        color: inherit !important;
        border: 1px solid rgba(231,224,210,0.14) !important;
        background:
          radial-gradient(circle at 76% 20%, rgba(180,24,45,0.34), transparent 9rem),
          linear-gradient(135deg, rgba(62,8,15,0.94), rgba(9,8,8,0.94)) !important;
        box-shadow: 0 18px 44px rgba(0,0,0,0.28) !important;
        isolation: isolate !important;
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease !important;
      }

      .look-shop-busta-card:hover {
        transform: translateY(-2px) !important;
        border-color: rgba(231,224,210,0.28) !important;
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
        min-height: 120px !important;
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

    for (let i = 0; i < 8 && current; i++) {
      const rect = current.getBoundingClientRect();

      if (
        rect.width >= 180 &&
        rect.width <= 560 &&
        rect.height >= 70 &&
        rect.height <= 280
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return el;
  }

  function makeShopCard(root) {
    const shopCard = root.createElement("a");

    shopCard.className = "look-shop-busta-card";
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

  function mountShopCardIn(root) {
    if (!root || !root.body) return false;

    ensureShopStyle(root);

    const chaosHit = findChaosCard(root);
    const chaosCard = findRealCard(chaosHit);

    if (!chaosCard || !chaosCard.parentElement) return false;

    let existing = root.querySelector(".look-shop-busta-card");

    if (!existing) {
      existing = makeShopCard(root);
    }

    existing.className = "look-shop-busta-card";

    if (existing.previousElementSibling !== chaosCard) {
      chaosCard.insertAdjacentElement("afterend", existing);
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
