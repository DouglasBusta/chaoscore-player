(function () {
  if (window.__chaosMiniExpandMounted) return;
  window.__chaosMiniExpandMounted = true;

  let startY = 0;
  let dragging = false;

  function mini() {
    return document.getElementById("chaos-safe-mini-player");
  }

  function isOpen() {
    return mini()?.classList.contains("is-visible");
  }

  function setExpanded(expanded) {
    const player = mini();
    if (!player) return;

    player.classList.add("is-expandable");
    player.classList.toggle("is-expanded", Boolean(expanded));
    player.classList.remove("is-dragging-up", "is-dragging-down");

    try {
      const frame = document.getElementById("chaos-files-safe-frame");
      const doc = frame?.contentDocument;

      if (doc) {
        let style = doc.getElementById("chaos-mini-expand-padding");

        if (!style) {
          style = doc.createElement("style");
          style.id = "chaos-mini-expand-padding";
          doc.head.appendChild(style);
        }

        style.textContent = `
          body {
            padding-bottom: ${expanded ? 360 : 150}px !important;
          }

          @media (max-width: 620px) {
            body {
              padding-bottom: ${expanded ? 390 : 175}px !important;
            }
          }
        `;
      }
    } catch (_) {}
  }

  function toggleExpanded() {
    const player = mini();
    if (!player || !isOpen()) return;

    setExpanded(!player.classList.contains("is-expanded"));
  }

  function ensureHandle() {
    const player = mini();
    if (!player || player.dataset.expandReady === "1") return;

    player.dataset.expandReady = "1";
    player.classList.add("is-expandable");

    const inner = player.querySelector(".chaos-safe-mini-inner");

    if (inner && !inner.querySelector(".chaos-mini-expand-handle")) {
      const handle = document.createElement("div");
      handle.className = "chaos-mini-expand-handle";
      handle.setAttribute("aria-hidden", "true");
      inner.insertBefore(handle, inner.firstChild);
      bindDrag(handle);
    }

    player.addEventListener("click", (event) => {
      if (!isOpen()) return;
      if (event.target.closest("button, input, .chaos-safe-mini-progress")) return;

      const allowed =
        event.target.closest(".chaos-mini-expand-handle") ||
        event.target.closest(".chaos-safe-mini-cover") ||
        event.target.closest(".chaos-safe-mini-meta");

      if (!allowed) return;

      event.preventDefault();
      event.stopPropagation();

      toggleExpanded();
    }, true);
  }

  function bindDrag(handle) {
    handle.addEventListener("pointerdown", (event) => {
      if (!isOpen()) return;

      dragging = true;
      startY = event.clientY;

      try {
        handle.setPointerCapture(event.pointerId);
      } catch (_) {}

      event.preventDefault();
    });

    handle.addEventListener("pointermove", (event) => {
      if (!dragging) return;

      const player = mini();
      if (!player) return;

      const delta = event.clientY - startY;

      player.classList.toggle("is-dragging-up", delta < -12);
      player.classList.toggle("is-dragging-down", delta > 12);

      event.preventDefault();
    });

    function finish(event) {
      if (!dragging) return;

      dragging = false;

      try {
        handle.releasePointerCapture(event.pointerId);
      } catch (_) {}

      const player = mini();
      const delta = event.clientY - startY;

      if (delta < -24) {
        setExpanded(true);
      } else if (delta > 24) {
        setExpanded(false);
      } else {
        player?.classList.remove("is-dragging-up", "is-dragging-down");
      }

      event.preventDefault();
    }

    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  }

  function boot() {
    ensureHandle();

    const observer = new MutationObserver(() => {
      ensureHandle();

      const player = mini();
      if (player && !player.classList.contains("is-visible")) {
        setExpanded(false);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
