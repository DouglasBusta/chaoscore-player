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

    const frame = document.getElementById("chaos-busta-overlay-frame");

    frame.addEventListener("load", function () {
      patchIframe();
    });
  }

  function openFiles() {
    ensureOverlay();

    const frame = document.getElementById("chaos-busta-overlay-frame");

    if (frame && frame.src === "about:blank") {
      frame.src = "/exclusive";
    }

    document.body.classList.add("chaos-busta-overlay-open");

    setTimeout(patchIframe, 300);
    setTimeout(patchIframe, 900);
  }

  function closeFiles() {
    document.body.classList.remove("chaos-busta-overlay-open");

    /*
      Reset vero:
      se dentro l'iframe eri tornato a /chaoscore, non deve restare
      una seconda pagina chaoscore viva sotto/sopra.
    */
    const frame = document.getElementById("chaos-busta-overlay-frame");
    if (frame) {
      frame.src = "about:blank";
    }
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

  function isChaoscoreLink(el) {
    const text = textOf(el);
    const href = hrefOf(el);

    return (
      text.includes("#chaoscore") ||
      text.includes("chaoscore") ||
      href.includes("/chaoscore") ||
      href.includes("chaoscore.html")
    );
  }

  function patchIframe() {
    const frame = document.getElementById("chaos-busta-overlay-frame");
    if (!frame) return;

    let doc;
    let href = "";

    try {
      doc = frame.contentDocument;
      href = frame.contentWindow.location.href.toLowerCase();
    } catch (_) {
      return;
    }

    if (!doc) return;

    /*
      Se l'iframe è finito su chaoscore, chiudiamo overlay:
      NON dobbiamo mai avere chaoscore dentro chaoscore.
    */
    if (href.includes("/chaoscore") || href.includes("chaoscore.html")) {
      closeFiles();
      return;
    }

    /*
      Dentro Busta Files eliminiamo SOLO eventuali player duplicati caricati
      dalla pagina iframe. Il player vero resta quello fuori: section.player.
    */
    doc.querySelectorAll([
      "audio",
      "section.player",
      ".player",
      "[id*='mini-player']",
      "[class*='mini-player']",
      "[id*='safe-mini']",
      "[class*='safe-mini']",
      "[id*='persistent']",
      "[class*='persistent']"
    ].join(",")).forEach(function (el) {
      try {
        el.remove();
      } catch (_) {
        el.style.setProperty("display", "none", "important");
      }
    });

    /*
      Se dentro Busta Files clicchi un link per tornare a chaoscore,
      non carichiamo chaoscore nell'iframe: chiudiamo l'overlay.
    */
    doc.addEventListener("click", function (event) {
      const target = event.target.closest("a, button, [role='button']");
      if (!target) return;

      if (!isChaoscoreLink(target)) return;

      event.preventDefault();
      event.stopPropagation();

      closeFiles();
    }, true);
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("a, button, [role='button']");
    if (!target) return;

    if (!isBackToFiles(target)) return;

    event.preventDefault();
    event.stopPropagation();

    openFiles();
  }, true);

  /*
    Quando rientri nella pagina o Safari/Chrome ripristina lo stato,
    non deve restare la classe overlay aperta dalla visita precedente.
  */
  window.addEventListener("pageshow", function () {
    document.body.classList.remove("chaos-busta-overlay-open");

    const frame = document.getElementById("chaos-busta-overlay-frame");
    if (frame) frame.src = "about:blank";
  });

  ensureOverlay();
})();
