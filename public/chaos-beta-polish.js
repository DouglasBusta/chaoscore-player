(function () {
  if (window.__chaosBetaPolishMounted) return;
  window.__chaosBetaPolishMounted = true;

  const STATE = {
    filesMode: false
  };

  function setFilesMode(on) {
    STATE.filesMode = Boolean(on);
    document.body.classList.toggle("chaos-files-mode", STATE.filesMode);

    const mini = document.getElementById("chaos-safe-mini-player");
    if (mini) {
      mini.classList.toggle("is-visible", STATE.filesMode);
      mini.setAttribute("aria-hidden", STATE.filesMode ? "false" : "true");
    }
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
      href === "/" ||
      href.includes("/index")
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

  function keepOneVisiblePlayer() {
    const mini = document.getElementById("chaos-safe-mini-player");

    document.body.classList.toggle("chaos-files-mode", STATE.filesMode);

    if (mini) {
      mini.classList.toggle("is-visible", STATE.filesMode);
      mini.setAttribute("aria-hidden", STATE.filesMode ? "false" : "true");
    }
  }

  function protectAudio() {
    const mainAudio = document.getElementById("audio");
    if (!mainAudio) return;

    document.querySelectorAll("audio").forEach((audio) => {
      if (audio === mainAudio) return;

      /*
        Non rimuoviamo il secondo audio in modo aggressivo.
        Lo mettiamo solo muto e senza controlli, così non può partire sopra.
      */
      audio.controls = false;
      audio.muted = true;
      audio.style.display = "none";
      audio.setAttribute("aria-hidden", "true");
    });
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
          padding-bottom: 150px !important;
        }

        @media (max-width: 720px) {
          body {
            padding-bottom: 175px !important;
          }
        }
      `;
    } catch (_) {}
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("a, button, [role='button']");
    if (!target) return;

    if (isBackToFiles(target)) {
      setTimeout(() => setFilesMode(true), 40);
      setTimeout(() => {
        setFilesMode(true);
        addIframePadding();
      }, 180);
      setTimeout(() => {
        setFilesMode(true);
        addIframePadding();
      }, 600);
      return;
    }

    if (isBackToChaoscore(target)) {
      setTimeout(() => setFilesMode(false), 40);
      setTimeout(() => setFilesMode(false), 180);
      setTimeout(() => setFilesMode(false), 600);
    }
  }, true);

  window.addEventListener("pageshow", function () {
    setFilesMode(false);
    protectAudio();
  });

  window.addEventListener("popstate", function () {
    setFilesMode(false);
    protectAudio();
  });

  window.addEventListener("resize", function () {
    keepOneVisiblePlayer();
    addIframePadding();
  });

  const observer = new MutationObserver(function () {
    keepOneVisiblePlayer();
    protectAudio();

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

  setFilesMode(false);
  protectAudio();
})();
