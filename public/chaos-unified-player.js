(function () {
  if (window.__chaosUnifiedPlayerMountedV2) return;
  window.__chaosUnifiedPlayerMountedV2 = true;

  const STORAGE_KEY = "chaosUnifiedPlayerCollapsed";

  function player() {
    return document.querySelector("section.player") || document.querySelector(".player");
  }

  function audio() {
    return document.getElementById("audio");
  }

  function setCollapsed(collapsed) {
    document.body.classList.toggle("chaos-player-collapsed", Boolean(collapsed));

    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch (_) {}

    const btn = document.getElementById("chaos-unified-toggle");
    if (btn) {
      btn.textContent = collapsed ? "▴" : "▾";
      btn.setAttribute("aria-label", collapsed ? "Espandi player" : "Riduci player");
    }
  }

  function getInitialCollapsed() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function looksLikeLegacyMiniPlayer(el) {
    if (!el || el.nodeType !== 1) return false;

    const realPlayer = player();

    if (el === realPlayer) return false;
    if (realPlayer && realPlayer.contains(el) && !String(el.id || "").toLowerCase().includes("mini")) {
      return false;
    }

    if (el.id === "audio") return false;
    if (el.tagName === "AUDIO") return false;
    if (el.id === "chaos-unified-toggle") return false;

    const id = String(el.id || "").toLowerCase();
    const cls = String(el.className || "").toLowerCase();
    const text = String(el.textContent || "").toLowerCase();

    if (
      id.includes("safe-mini") ||
      cls.includes("safe-mini") ||
      id.includes("mini-player") ||
      cls.includes("mini-player") ||
      id.includes("persistent-player") ||
      cls.includes("persistent-player") ||
      id.includes("mini") ||
      cls.includes("mini")
    ) {
      return true;
    }

    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    const isBottomBar =
      style.position === "fixed" &&
      rect.width > 240 &&
      rect.height > 28 &&
      rect.height < 170 &&
      rect.bottom > window.innerHeight - 160;

    const hasChaosText =
      text.includes("#chaoscore") ||
      text.includes("douglas busta") ||
      text.includes("banale") ||
      text.includes("vol");

    const hasControls = Boolean(el.querySelector("button, input, [role='button']"));

    return isBottomBar && hasChaosText && hasControls;
  }

  function removeLegacyMiniPlayers() {
    const candidates = Array.from(document.body.querySelectorAll("div, aside, footer, section"))
      .filter(looksLikeLegacyMiniPlayer);

    candidates.forEach((el) => {
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

  function ensureToggle() {
    const p = player();
    if (!p) return;

    if (!document.getElementById("chaos-unified-toggle")) {
      const btn = document.createElement("button");
      btn.id = "chaos-unified-toggle";
      btn.type = "button";
      btn.textContent = "▾";
      btn.setAttribute("aria-label", "Riduci player");

      btn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        setCollapsed(!document.body.classList.contains("chaos-player-collapsed"));
      });

      p.appendChild(btn);
    }
  }

  function detectFilesViewClick(event) {
    const target = event.target.closest("a, button, [role='button']");
    if (!target) return;

    const text = (
      target.textContent ||
      target.getAttribute("aria-label") ||
      target.getAttribute("title") ||
      ""
    ).toLowerCase();

    const href = (target.getAttribute("href") || "").toLowerCase();

    const toFiles =
      text.includes("back to busta files") ||
      text.includes("busta files") ||
      href.includes("/exclusive") ||
      href.includes("exclusive.html");

    const toChaos =
      text.includes("back to #chaoscore") ||
      text.includes("back to chaoscore") ||
      href.includes("/chaoscore");

    if (toFiles) {
      document.body.classList.add("chaos-files-active");
    }

    if (toChaos) {
      document.body.classList.remove("chaos-files-active");
    }
  }

  function protectSingleAudio() {
    const main = audio();
    if (!main) return;

    document.querySelectorAll("audio").forEach((a) => {
      if (a === main) return;

      try {
        a.pause();
      } catch (_) {}

      a.muted = true;
      a.controls = false;
      a.style.display = "none";
      a.setAttribute("aria-hidden", "true");
    });
  }

  function boot() {
    const p = player();
    if (!p) return;

    document.body.classList.add("chaos-unified-player-ready");

    ensureToggle();
    setCollapsed(getInitialCollapsed());
    protectSingleAudio();
    removeLegacyMiniPlayers();

    document.addEventListener("click", detectFilesViewClick, true);

    const observer = new MutationObserver(function () {
      ensureToggle();
      protectSingleAudio();
      removeLegacyMiniPlayers();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    setInterval(removeLegacyMiniPlayers, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
