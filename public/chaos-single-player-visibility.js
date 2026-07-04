(function () {
  if (window.__chaosSinglePlayerVisibilityMounted) return;
  window.__chaosSinglePlayerVisibilityMounted = true;

  function isVisible(el) {
    if (!el) return false;

    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity || "1") !== 0 &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function filesModeIsOpen() {
    const candidates = [
      document.getElementById("chaos-files-safe-shell"),
      document.getElementById("chaos-safe-shell"),
      document.getElementById("chaos-files-shell"),
      document.getElementById("chaos-files-safe-frame")?.parentElement
    ].filter(Boolean);

    return candidates.some(isVisible);
  }

  function syncSinglePlayerState() {
    const open = filesModeIsOpen();
    const mini = document.getElementById("chaos-safe-mini-player");

    document.body.classList.toggle("chaos-files-mode", open);

    if (!mini) return;

    if (open) {
      mini.classList.add("is-visible");
    } else {
      mini.classList.remove("is-visible");
    }
  }

  syncSinglePlayerState();

  const observer = new MutationObserver(syncSinglePlayerState);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "hidden", "aria-hidden"]
  });

  window.addEventListener("resize", syncSinglePlayerState);
  window.addEventListener("pageshow", syncSinglePlayerState);
  document.addEventListener("click", function () {
    setTimeout(syncSinglePlayerState, 80);
    setTimeout(syncSinglePlayerState, 250);
    setTimeout(syncSinglePlayerState, 700);
  }, true);
})();
