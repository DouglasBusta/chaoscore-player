(function () {
  "use strict";

  if (window.__lookShopBustaCardBooted) return;
  window.__lookShopBustaCardBooted = true;

  function cleanText(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function removeDuplicateIds(el) {
    if (!el) return;

    if (el.id) el.removeAttribute("id");

    el.querySelectorAll("[id]").forEach(function (node) {
      node.removeAttribute("id");
    });
  }

  function findListenCard(root) {
    const all = Array.from(root.querySelectorAll("a, article, button, div, section"));

    const candidates = all.filter(function (el) {
      const text = cleanText(el);
      if (!text.includes("listen to") || !text.includes("chaoscore")) return false;

      const rect = el.getBoundingClientRect();

      return (
        rect.width >= 160 &&
        rect.width <= 420 &&
        rect.height >= 70 &&
        rect.height <= 190
      );
    });

    candidates.sort(function (a, b) {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      /*
        Prendiamo la card più grande tra quelle plausibili,
        non il testo interno.
      */
      return (br.width * br.height) - (ar.width * ar.height);
    });

    return candidates[0] || null;
  }

  function rewriteTextNodes(card) {
    const walker = card.ownerDocument.createTreeWalker(
      card,
      NodeFilter.SHOW_TEXT,
      null
    );

    const replacements = [
      ["PRIVATE ALBUM FILE", "SUPPLY DROP"],
      ["private album file", "SUPPLY DROP"],
      ["LISTEN TO #CHAOSCORE", "ENTER THE SHOP"],
      ["Listen to #chaoscore", "ENTER THE SHOP"],
      ["listen to #chaoscore", "ENTER THE SHOP"],
      ["NFC-only access. Scan your #chaoscore tag to unlock.", "NFC TAGS / MERCH / STICKERS"],
      ["NFC-only access. Scan your #chaoscore tag to unlock", "NFC TAGS / MERCH / STICKERS"],
      ["NFC-only access", "NFC TAGS / MERCH / STICKERS"]
    ];

    const textNodes = [];

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach(function (node) {
      let value = node.nodeValue;

      replacements.forEach(function (pair) {
        value = value.split(pair[0]).join(pair[1]);
      });

      node.nodeValue = value;
    });
  }

  function forceShopTextIfNeeded(card) {
    const text = cleanText(card);

    if (text.includes("enter the shop")) return;

    card.innerHTML = `
      <div class="look-shop-fallback-bg"></div>
      <div data-shop-card-text class="look-shop-card-text">
        <span>SUPPLY DROP</span>
        <strong>ENTER THE SHOP</strong>
        <small>NFC TAGS / MERCH / STICKERS</small>
      </div>
    `;
  }

  function makeShopCard(root, listenCard) {
    /*
      Punto chiave:
      questa è la copia letterale della card LISTEN TO #CHAOSCORE.
      Non ricostruiamo più dimensioni/layout a mano.
    */
    const shopCard = listenCard.cloneNode(true);

    removeDuplicateIds(shopCard);

    shopCard.classList.add("look-shop-busta-card");
    shopCard.setAttribute("aria-label", "Enter the LOOK SHOP");

    if (shopCard.tagName.toLowerCase() === "a") {
      shopCard.href = "/shop";
    } else {
      shopCard.setAttribute("role", "link");
      shopCard.tabIndex = 0;
      shopCard.addEventListener("click", function () {
        window.location.href = "/shop";
      });
      shopCard.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          window.location.href = "/shop";
        }
      });
    }

    shopCard.querySelectorAll("a").forEach(function (a) {
      a.href = "/shop";
    });

    rewriteTextNodes(shopCard);
    forceShopTextIfNeeded(shopCard);

    return shopCard;
  }

  function hasNativeShopLink(root) {
    const links = Array.from(root.querySelectorAll("a[href]"));

    return links.some(function (link) {
      if (link.closest(".look-shop-busta-card")) return false;

      const href = link.getAttribute("href") || "";
      const text = cleanText(link);

      return (
        href === "/shop" ||
        href === "/shop/" ||
        href.endsWith("/shop") ||
        href.endsWith("/shop/") ||
        text.includes("enter the shop") ||
        text.includes("look app shop")
      );
    });
  }

  function mountShopCardIn(root) {
    if (!root || !root.body) return false;

    /*
      Se la pagina ha già uno shop vero, non creiamo un doppione automatico.
      Questo evita su mobile l'effetto "due shop diversi" che portano allo stesso link.
    */
    if (hasNativeShopLink(root)) return false;

    const listenCard = findListenCard(root);
    if (!listenCard || !listenCard.parentElement) return false;

    let shopCard = root.querySelector(".look-shop-busta-card");

    if (!shopCard) {
      shopCard = makeShopCard(root, listenCard);
    }

    /*
      Punto chiave:
      inserimento dopo la card originale, mai dentro.
    */
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

    window.__lookShopMountEverywhere = mountEverywhere;

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
