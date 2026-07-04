(function () {
  if (window.__chaosMiniVisibilityGuardMounted) return;
  window.__chaosMiniVisibilityGuardMounted = true;

  function setMiniVisible(visible) {
    document.body.classList.toggle("chaos-show-mini-player", Boolean(visible));

    const mini =
      document.getElementById("chaos-safe-mini-player") ||
      document.querySelector(".chaos-safe-mini-player");

    if (!mini) return;

    mini.setAttribute("aria-hidden", visible ? "false" : "true");

    if (visible) {
      mini.classList.add("is-visible");
      mini.style.removeProperty("display");
      mini.style.removeProperty("visibility");
      mini.style.removeProperty("opacity");
      mini.style.removeProperty("pointer-events");
    } else {
      mini.classList.remove("is-visible");
      mini.style.setProperty("display", "none", "important");
      mini.style.setProperty("visibility", "hidden", "important");
      mini.style.setProperty("opacity", "0", "important");
      mini.style.setProperty("pointer-events", "none", "important");
    }
  }

  function txt(el) {
    return (
      el?.textContent ||
      el?.getAttribute?.("aria-label") ||
      el?.getAttribute?.("title") ||
      ""
    ).toLowerCase();
  }

  function href(el) {
    return (el?.getAttribute?.("href") || "").toLowerCase();
  }

  function isBackToFiles(el) {
    const t = txt(el);
    const h = href(el);

    return (
      t.includes("back to busta files") ||
      t.includes("busta files") ||
      h.includes("/exclusive") ||
      h.includes("exclusive.html")
    );
  }

  function isBackToChaoscore(el) {
    const t = txt(el);
    const h = href(el);

    return (
      t.includes("back to #chaoscore") ||
      t.includes("back to chaoscore") ||
      h.includes("/chaoscore")
    );
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("a, button, [role='button']");
    if (!target) return;

    if (isBackToFiles(target)) {
      setTimeout(() => setMiniVisible(true), 50);
      setTimeout(() => setMiniVisible(true), 250);
      setTimeout(() => setMiniVisible(true), 800);
      return;
    }

    if (isBackToChaoscore(target)) {
      setTimeout(() => setMiniVisible(false), 50);
      setTimeout(() => setMiniVisible(false), 250);
      setTimeout(() => setMiniVisible(false), 800);
    }
  }, true);

  window.addEventListener("pageshow", function () {
    setMiniVisible(false);
  });

  window.addEventListener("popstate", function () {
    setMiniVisible(false);
  });

  /*
    Stato iniziale: sulla pagina album il mini non deve vedersi.
    Non tocchiamo mai #audio.
  */
  setMiniVisible(false);
})();
