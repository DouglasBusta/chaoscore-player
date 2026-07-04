(function () {
  if (window.__chaosFilesOverlayPlayerMounted) return;
  window.__chaosFilesOverlayPlayerMounted = true;

  function audio() {
    return document.getElementById("audio");
  }

  function ensureOverlay() {
    if (document.getElementById("chaos-files-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "chaos-files-overlay";
    overlay.innerHTML = '<iframe id="chaos-files-overlay-frame" src="about:blank" title="Busta Files"></iframe>';

    const close = document.createElement("button");
    close.id = "chaos-files-overlay-close";
    close.type = "button";
    close.textContent = "← Back to #chaoscore";

    close.addEventListener("click", function () {
      closeFiles();
    });

    document.body.appendChild(overlay);
    document.body.appendChild(close);
  }

  function openFiles() {
    ensureOverlay();

    const frame = document.getElementById("chaos-files-overlay-frame");

    if (frame && frame.src === "about:blank") {
      frame.src = "/exclusive";
    }

    document.body.classList.add("chaos-files-overlay-open");

    /*
      Mantiene vivo l'audio: non tocchiamo play/pause.
      Serve solo a garantire che esista #audio.
    */
    audio();
  }

  function closeFiles() {
    document.body.classList.remove("chaos-files-overlay-open");
  }

  function textOf(el) {
    return (
      el?.textContent ||
      el?.getAttribute?.("aria-label") ||
      el?.getAttribute?.("title") ||
      ""
    ).toLowerCase();
  }

  function hrefOf(el) {
    return (el?.getAttribute?.("href") || "").toLowerCase();
  }

  function isBackToFiles(el) {
    const text = textOf(el);
    const href = hrefOf(el);

    return (
      text.includes("back to busta files") ||
      text.includes("busta files") ||
      href.includes("/exclusive") ||
      href.includes("exclusive.html")
    );
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("a, button, [role='button']");
    if (!target) return;

    if (!isBackToFiles(target)) return;

    event.preventDefault();
    event.stopPropagation();

    openFiles();
  }, true);

  window.addEventListener("pageshow", function () {
    document.body.classList.remove("chaos-files-overlay-open");
  });

  ensureOverlay();
})();
