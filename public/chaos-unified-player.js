(function () {
  if (window.__chaosUnifiedPlayerMounted) return;
  window.__chaosUnifiedPlayerMounted = true;

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

  function removeOldMiniPlayers() {
    document.querySelectorAll([
      "#chaos-safe-mini-player",
      ".chaos-safe-mini-player",
      "[id*='safe-mini']",
      "[class*='safe-mini']",
      "[id*='mini-player']",
      "[class*='mini-player']"
    ].join(",")).forEach((el) => {
      /*
        Non rimuoviamo dal DOM: lo rendiamo invisibile.
        Così non distruggiamo eventuale logica legacy, ma non si vede.
      */
      el.setAttribute("aria-hidden", "true");
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
      el.style.setProperty("opacity", "0", "important");
      el.style.setProperty("pointer-events", "none", "important");
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
      /*
        Non obblighiamo cambio forma per pagina.
        Però se l'utente lo aveva compatto, resta compatto.
        Se lo vuole grande, clicca ▴.
      */
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

      /*
        Non deve esistere un secondo audio udibile.
        Non lo cancelliamo, ma lo neutralizziamo.
      */
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

    removeOldMiniPlayers();
    protectSingleAudio();
    ensureToggle();
    setCollapsed(getInitialCollapsed());

    document.addEventListener("click", detectFilesViewClick, true);

    const observer = new MutationObserver(function () {
      removeOldMiniPlayers();
      protectSingleAudio();
      ensureToggle();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
