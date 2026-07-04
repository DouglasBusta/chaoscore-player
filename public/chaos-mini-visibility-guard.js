(function () {
  if (window.__chaosMiniVisibilityGuardMountedV2) return;
  window.__chaosMiniVisibilityGuardMountedV2 = true;

  let showMini = false;

  function forceHide(el) {
    el.dataset.chaosMiniHidden = "true";
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("opacity", "0", "important");
    el.style.setProperty("pointer-events", "none", "important");
  }

  function forceShow(el) {
    el.setAttribute("aria-hidden", "false");
    el.style.removeProperty("display");
    el.style.removeProperty("visibility");
    el.style.removeProperty("opacity");
    el.style.removeProperty("pointer-events");
  }

  function looksLikeBottomMini(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.id === "audio") return false;
    if (el.tagName === "AUDIO") return false;
    if (el.closest("section.player")) return false;
    if (el.closest(".player") && !el.id.includes("mini")) return false;

    const id = (el.id || "").toLowerCase();
    const cls = (el.className || "").toString().toLowerCase();

    if (
      id.includes("safe-mini") ||
      cls.includes("safe-mini") ||
      id.includes("mini-player") ||
      cls.includes("mini-player") ||
      id.includes("persistent-player") ||
      cls.includes("persistent-player")
    ) {
      return true;
    }

    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const text = (el.textContent || "").toLowerCase();

    const isBottomFixed =
      (style.position === "fixed" || style.position === "sticky") &&
      rect.width > 220 &&
      rect.height > 24 &&
      rect.height < 190 &&
      rect.bottom > window.innerHeight - 170;

    const hasPlayerText =
      text.includes("#chaoscore") ||
      text.includes("douglas") ||
      text.includes("banale") ||
      text.includes("star ii") ||
      text.includes("vol");

    const hasControls = Boolean(el.querySelector("button, input, [role='button']"));

    return isBottomFixed && hasControls && hasPlayerText;
  }

  function findMiniPlayers() {
    const direct = Array.from(document.querySelectorAll([
      "#chaos-safe-mini-player",
      ".chaos-safe-mini-player",
      "[id*='safe-mini']",
      "[class*='safe-mini']",
      "[id*='mini-player']",
      "[class*='mini-player']",
      "[id*='persistent-player']",
      "[class*='persistent-player']"
    ].join(",")));

    const scanned = Array.from(document.body.querySelectorAll("div, aside, footer, section"))
      .filter(looksLikeBottomMini);

    return Array.from(new Set([...direct, ...scanned]));
  }

  function sync() {
    document.body.classList.toggle("chaos-show-mini-player", showMini);

    findMiniPlayers().forEach((el) => {
      if (showMini) {
        forceShow(el);
      } else {
        forceHide(el);
      }
    });
  }

  function txt(el) {
    return (
      el?.textContent ||
      el?.getAttribute?.("aria-label") ||
      el?.getAttribute?.("title") ||
      ""
    ).toLowerCase();
  }

  function href(el) {
    return (el?.getAttribute?.("href") || "").toLowerCase();
  }

  function isBackToFiles(el) {
    const t = txt(el);
    const h = href(el);
    return (
      t.includes("back to busta files") ||
      t.includes("busta files") ||
      h.includes("/exclusive") ||
      h.includes("exclusive.html")
    );
  }

  function isBackToChaoscore(el) {
    const t = txt(el);
    const h = href(el);
    return (
      t.includes("back to #chaoscore") ||
      t.includes("back to chaoscore") ||
      h.includes("/chaoscore")
    );
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("a, button, [role='button']");
    if (!target) return;

    if (isBackToFiles(target)) {
      showMini = true;
      setTimeout(sync, 50);
      setTimeout(sync, 250);
      setTimeout(sync, 900);
      return;
    }

    if (isBackToChaoscore(target)) {
      showMini = false;
      setTimeout(sync, 50);
      setTimeout(sync, 250);
      setTimeout(sync, 900);
    }
  }, true);

  window.addEventListener("pageshow", function () {
    showMini = false;
    sync();
  });

  window.addEventListener("popstate", function () {
    showMini = false;
    sync();
  });

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "id"]
  });

  showMini = false;
  sync();
  setTimeout(sync, 300);
  setTimeout(sync, 1000);
})();
