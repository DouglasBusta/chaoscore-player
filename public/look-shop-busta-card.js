(function () {
  "use strict";

  if (window.__lookShopBustaCardBooted) return;
  window.__lookShopBustaCardBooted = true;

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
        rect.width <= 540 &&
        rect.height >= 70 &&
        rect.height <= 270
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return el;
  }

  function makeShopCard(root, chaosCard) {
    const shopCard = root.createElement("a");

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

  function mountShopCardIn(root) {
    if (!root || !root.body) return false;

    const chaosHit = findChaosCard(root);
    const chaosCard = findRealCard(chaosHit);

    if (!chaosCard || !chaosCard.parentElement) return false;

    const existing = root.querySelector(".look-shop-busta-card");

    if (existing) {
      if (existing.previousElementSibling !== chaosCard) {
        chaosCard.insertAdjacentElement("afterend", existing);
      }
      return true;
    }

    const shopCard = makeShopCard(root, chaosCard);
    chaosCard.insertAdjacentElement("afterend", shopCard);
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
