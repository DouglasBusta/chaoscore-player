(function () {
  "use strict";

  if (window.__lookShopBustaCardMounted) return;
  window.__lookShopBustaCardMounted = true;

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findChaosCard() {
    const all = Array.from(document.querySelectorAll("a, article, section, div, button"));

    return all.find(function (el) {
      const text = textOf(el);
      return (
        text.includes("listen to") &&
        text.includes("chaoscore")
      );
    });
  }

  function findCardShell(el) {
    if (!el) return null;

    let current = el;

    for (let i = 0; i < 8 && current; i++) {
      const rect = current.getBoundingClientRect();

      if (
        rect.width >= 180 &&
        rect.width <= 520 &&
        rect.height >= 70 &&
        rect.height <= 260
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return el;
  }

  function mountShopCard() {
    if (document.querySelector(".look-shop-busta-card")) return;

    const chaosHit = findChaosCard();
    const chaosCard = findCardShell(chaosHit);

    if (!chaosCard || !chaosCard.parentElement) return;

    const shopCard = document.createElement("a");
    shopCard.className = "look-shop-busta-card";
    shopCard.href = "/shop";
    shopCard.setAttribute("aria-label", "Enter the LOOK SHOP");

    shopCard.innerHTML = `
      <div class="look-shop-busta-card-bg"></div>
      <div class="look-shop-busta-card-inner">
        <span class="look-shop-busta-card-kicker">LOOK SHOP</span>
        <strong>ENTER THE SHOP</strong>
        <small>BUY NFC TAGS / MERCH / STICKERS</small>
      </div>
    `;

    chaosCard.insertAdjacentElement("afterend", shopCard);
  }

  function boot() {
    mountShopCard();
    setTimeout(mountShopCard, 250);
    setTimeout(mountShopCard, 900);
    setTimeout(mountShopCard, 1800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
