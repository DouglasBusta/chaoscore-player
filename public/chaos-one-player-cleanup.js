(function () {
  if (window.__chaosOnePlayerCleanupMounted) return;
  window.__chaosOnePlayerCleanupMounted = true;

  function realPlayer() {
    return document.querySelector("section.player") || document.querySelector(".player");
  }

  function realAudio() {
    return document.getElementById("audio");
  }

  function isInsideRealPlayer(el) {
    const p = realPlayer();
    return p && (el === p || p.contains(el));
  }

  function looksLikeDuplicateBottomPlayer(el) {
    if (!el || el.nodeType !== 1) return false;

    if (isInsideRealPlayer(el)) return false;
    if (el.id === "audio") return false;
    if (el.tagName === "AUDIO") return false;

    const id = String(el.id || "").toLowerCase();
    const cls = String(el.className || "").toLowerCase();
    const text = String(el.textContent || "").toLowerCase();

    if (
      id.includes("safe-mini") ||
      cls.includes("safe-mini") ||
      id.includes("mini-player") ||
      cls.includes("mini-player") ||
      id.includes("persistent") ||
      cls.includes("persistent") ||
      id.includes("unified") ||
      cls.includes("unified")
    ) {
      return true;
    }

    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    const fixedBottom =
      style.position === "fixed" &&
      rect.width > 220 &&
      rect.height > 24 &&
      rect.height < 220 &&
      rect.bottom > window.innerHeight - 190;

    const hasControls = Boolean(el.querySelector("button, input, [role='button']"));

    const hasPlayerWords =
      text.includes("#chaoscore") ||
      text.includes("banale") ||
      text.includes("douglas") ||
      text.includes("vol") ||
      text.includes("0:00");

    return fixedBottom && hasControls && hasPlayerWords;
  }

  function cleanupDuplicatePlayers() {
    const main = realAudio();

    document.querySelectorAll("audio").forEach((a) => {
      if (a === main) return;

      try { a.pause(); } catch (_) {}
      a.muted = true;
      a.controls = false;
      a.removeAttribute("src");
      try { a.load(); } catch (_) {}
      a.remove();
    });

    Array.from(document.body.querySelectorAll("div, aside, footer, section"))
      .filter(looksLikeDuplicateBottomPlayer)
      .forEach((el) => {
        try {
          el.remove();
        } catch (_) {
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("pointer-events", "none", "important");
        }
      });
  }

  function boot() {
    cleanupDuplicatePlayers();

    const observer = new MutationObserver(cleanupDuplicatePlayers);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "id"]
    });

    setInterval(cleanupDuplicatePlayers, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
