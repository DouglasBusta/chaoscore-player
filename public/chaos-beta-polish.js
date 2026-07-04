(function () {
  if (window.__chaosBetaPolishMountedV2) return;
  window.__chaosBetaPolishMountedV2 = true;

  const STATE = {
    filesMode: false
  };

  function setImportant(el, prop, value) {
    try {
      el.style.setProperty(prop, value, "important");
    } catch (_) {}
  }

  function clearForcedMiniStyles(el) {
    try {
      el.style.removeProperty("display");
      el.style.removeProperty("visibility");
      el.style.removeProperty("opacity");
      el.style.removeProperty("pointer-events");
    } catch (_) {}
  }

  function isLikelyMiniPlayer(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.id === "audio") return false;
    if (el.tagName === "AUDIO") return false;
    if (el.closest("section.player")) return false;

    const id = (el.id || "").toLowerCase();
    const cls = (el.className || "").toString().toLowerCase();
    const text = (el.textContent || "").toLowerCase();

    if (
      id.includes("chaos-safe-mini") ||
      cls.includes("chaos-safe-mini") ||
      id.includes("safe-mini") ||
      cls.includes("safe-mini") ||
      id.includes("mini-player") ||
      cls.includes("mini-player")
    ) {
      return true;
    }

    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    const looksBottomBar =
      (style.position === "fixed" || style.position === "sticky") &&
      rect.width > 260 &&
      rect.height > 24 &&
      rect.height < 170 &&
      rect.bottom > window.innerHeight - 120;

    const hasChaosText =
      text.includes("#chaoscore") ||
      text.includes("banale") ||
      text.includes("douglas busta");

    const hasControls = Boolean(el.querySelector("button, input, [role='button']"));

    return looksBottomBar && hasChaosText && hasControls;
  }

  function getMiniPlayers() {
    const direct = Array.from(document.querySelectorAll([
      "#chaos-safe-mini-player",
      ".chaos-safe-mini-player",
      ".chaos-safe-mini",
      "[id*='safe-mini']",
      "[class*='safe-mini']",
      "[id*='mini-player']",
      "[class*='mini-player']"
    ].join(",")));

    const scanned = Array.from(document.body.querySelectorAll("div, aside, footer, section"))
      .filter(isLikelyMiniPlayer);

    return Array.from(new Set([...direct, ...scanned]));
  }

  function syncMiniVisibility() {
    document.body.classList.toggle("chaos-files-mode", STATE.filesMode);

    const minis = getMiniPlayers();

    minis.forEach((mini) => {
      mini.setAttribute("aria-hidden", STATE.filesMode ? "false" : "true");

      if (STATE.filesMode) {
        clearForcedMiniStyles(mini);
        mini.classList.add("is-visible");
      } else {
        mini.classList.remove("is-visible");
        setImportant(mini, "display", "none");
        setImportant(mini, "visibility", "hidden");
        setImportant(mini, "opacity", "0");
        setImportant(mini, "pointer-events", "none");
      }
    });
  }

  function textOf(el) {
    return (
      el?.textContent ||
      el?.getAttribute?.("aria-label") ||
      el?.getAttribute?.("title") ||
      ""
    ).toLowerCase().trim();
  }

  function hrefOf(el) {
    return (el?.getAttribute?.("href") || "").toLowerCase().trim();
  }

  function isBackToFiles(el) {
    const text = textOf(el);
    const href = hrefOf(el);

    return (
      text.includes("back to busta files") ||
      text === "busta files" ||
      href.includes("/exclusive") ||
      href.includes("exclusive.html")
    );
  }

  function isBackToChaoscore(el) {
    const text = textOf(el);
    const href = hrefOf(el);

    return (
      text.includes("back to #chaoscore") ||
      text.includes("back to chaoscore") ||
      href.includes("/chaoscore")
    );
  }

  function addIframePadding() {
    try {
      const frame =
        document.getElementById("chaos-files-safe-frame") ||
        document.querySelector("iframe");

      const doc = frame?.contentDocument;
      if (!doc) return;

      let style = doc.getElementById("chaos-beta-padding");
      if (!style) {
        style = doc.createElement("style");
        style.id = "chaos-beta-padding";
        doc.head.appendChild(style);
      }

      style.textContent = `
        html, body {
          max-width: 100%;
          overflow-x: hidden;
        }

        body {
          padding-bottom: 160px !important;
        }

        @media (max-width: 720px) {
          body {
            padding-bottom: 185px !important;
          }
        }
      `;
    } catch (_) {}
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("a, button, [role='button']");
    if (!target) return;

    if (isBackToFiles(target)) {
      STATE.filesMode = true;
      setTimeout(syncMiniVisibility, 40);
      setTimeout(function () {
        syncMiniVisibility();
        addIframePadding();
      }, 180);
      setTimeout(function () {
        syncMiniVisibility();
        addIframePadding();
      }, 700);
      return;
    }

    if (isBackToChaoscore(target)) {
      STATE.filesMode = false;
      setTimeout(syncMiniVisibility, 40);
      setTimeout(syncMiniVisibility, 180);
      setTimeout(syncMiniVisibility, 700);
    }
  }, true);

  window.addEventListener("pageshow", function () {
    STATE.filesMode = false;
    syncMiniVisibility();
  });

  window.addEventListener("popstate", function () {
    STATE.filesMode = false;
    syncMiniVisibility();
  });

  window.addEventListener("resize", syncMiniVisibility);

  const observer = new MutationObserver(function () {
    syncMiniVisibility();

    if (STATE.filesMode) {
      addIframePadding();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "hidden", "aria-hidden"]
  });

  STATE.filesMode = false;
  syncMiniVisibility();
})();
