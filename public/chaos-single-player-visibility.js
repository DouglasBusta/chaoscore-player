(function () {
  if (window.__chaosSinglePlayerVisibilityMountedV2) return;
  window.__chaosSinglePlayerVisibilityMountedV2 = true;

  function setFilesMode(on) {
    document.body.classList.toggle("chaos-files-mode", Boolean(on));
  }

  function textOf(el) {
    return (el?.textContent || el?.ariaLabel || el?.title || "").toLowerCase();
  }

  function hrefOf(el) {
    return (el?.getAttribute?.("href") || "").toLowerCase();
  }

  function looksLikeBackToFiles(el) {
    const t = textOf(el);
    const h = hrefOf(el);

    return (
      t.includes("back to busta files") ||
      t.includes("busta files") ||
      h.includes("exclusive") ||
      h === "/" ||
      h.includes("index.html")
    );
  }

  function looksLikeBackToChaoscore(el) {
    const t = textOf(el);
    const h = hrefOf(el);

    return (
      t.includes("back to #chaoscore") ||
      t.includes("back to chaoscore") ||
      t.includes("#chaoscore") ||
      h.includes("chaoscore")
    );
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("a, button, [role='button']");
    if (!target) return;

    if (looksLikeBackToFiles(target)) {
      setTimeout(() => setFilesMode(true), 60);
      setTimeout(() => setFilesMode(true), 250);
      setTimeout(() => setFilesMode(true), 700);
      return;
    }

    if (looksLikeBackToChaoscore(target)) {
      setTimeout(() => setFilesMode(false), 60);
      setTimeout(() => setFilesMode(false), 250);
      setTimeout(() => setFilesMode(false), 700);
    }
  }, true);

  window.addEventListener("pageshow", function () {
    setFilesMode(false);
  });

  window.addEventListener("popstate", function () {
    setFilesMode(false);
  });

  setFilesMode(false);
})();
