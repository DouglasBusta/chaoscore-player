(function () {
  "use strict";

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findChaosCard() {
    const nodes = Array.from(document.querySelectorAll("a, article, section, div, button"));

    return nodes.find(function (el) {
      const text = textOf(el);
      return text.includes("listen to") && text.includes("chaoscore");
    });
  }

  function findRealCard(el) {
    if (!el) return null;

    let current = el;

    for (let i = 0; i < 7 && current; i++) {
      const rect = current.getBoundingClientRect();

      if (
        rect.width >= 180 &&
        rect.width <= 520 &&
        rect.height >= 80 &&
        rect.height <= 260
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return el;
  }

  function makeShopCardLike(chaosCard) {
    const tag = chaosCard.tagName && chaosCard.tagName.toLowerCase() === "a" ? "a" : "a";
    const shopCard = document.createElement(tag);

    shopCard.className = chaosCard.className || "";
    shopCard.classList.add("look-shop-busta-card");
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

  function mountShopCard() {
    const existing = document.querySelector(".look-shop-busta-card");
    const chaosHit = findChaosCard();
    const chaosCard = findRealCard(chaosHit);

    if (!chaosCard || !chaosCard.parentElement) return;

    if (existing) {
      if (existing.previousElementSibling !== chaosCard) {
        chaosCard.insertAdjacentElement("afterend", existing);
      }
      return;
    }

    const shopCard = makeShopCardLike(chaosCard);
    chaosCard.insertAdjacentElement("afterend", shopCard);
  }

  function boot() {
    mountShopCard();

    const observer = new MutationObserver(function () {
      mountShopCard();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

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
