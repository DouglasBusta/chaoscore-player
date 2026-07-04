(function () {
  if (window.__chaosBustaOverlaySamePlayerMounted) return;
  window.__chaosBustaOverlaySamePlayerMounted = true;

  function ensureOverlay() {
    if (document.getElementById("chaos-busta-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "chaos-busta-overlay";
    overlay.innerHTML = '<iframe id="chaos-busta-overlay-frame" src="about:blank" title="Busta Files"></iframe>';

    const close = document.createElement("button");
    close.id = "chaos-busta-overlay-close";
    close.type = "button";
    close.textContent = "← Back to #chaoscore";
    close.addEventListener("click", closeFiles);

    document.body.appendChild(overlay);
    document.body.appendChild(close);
  }

  function openFiles() {
    ensureOverlay();

    const frame = document.getElementById("chaos-busta-overlay-frame");
    if (frame && frame.src === "about:blank") {
      frame.src = "/exclusive";
    }

    /*
      La pagina /chaoscore resta viva.
      Quindi #audio non viene distrutto e la canzone continua.
    */
    document.body.classList.add("chaos-busta-overlay-open");
  }

  function closeFiles() {
    document.body.classList.remove("chaos-busta-overlay-open");
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
    document.body.classList.remove("chaos-busta-overlay-open");
  });

  ensureOverlay();
})();
