(function () {
  "use strict";

  if (window.__chaosCoverCarouselV2Mounted) return;
  window.__chaosCoverCarouselV2Mounted = true;

  const coverSources = [
  "/covers/copertina icona chaoscore.jpeg",
  "/assets/chaoscore-spotify-cover.jpg"
];

  let currentIndex = 0;
  let locked = false;

  function getMainCover() {
    return document.getElementById("main-cover") || document.querySelector(".cover");
  }

  function getPlayerCovers() {
    return Array.from(document.querySelectorAll("[data-cover], .now img")).filter(Boolean);
  }

  function normalizeSrc(src) {
    try {
      return new URL(src, window.location.origin).pathname;
    } catch (_) {
      return src || "";
    }
  }

  function findCurrentIndex() {
    let saved = localStorage.getItem("chaoscore-selected-cover");

    if (saved && (saved.includes("/brand/") || saved.toLowerCase().includes("look-app"))) {
      localStorage.removeItem("chaoscore-selected-cover");
      saved = "";
    }

    const cover = getMainCover();
    const src = normalizeSrc(saved || cover?.getAttribute("src") || cover?.src || "");

    const found = coverSources.findIndex((item) => normalizeSrc(item) === src || src.endsWith(normalizeSrc(item)));
    currentIndex = found >= 0 ? found : 0;
  }

  function renderPicker() {
    const picker = document.getElementById("cover-picker");
    if (!picker) return;

    picker.innerHTML = "";

    const prev = document.createElement("button");
    prev.className = "cover-arrow";
    prev.id = "cover-prev";
    prev.type = "button";
    prev.setAttribute("aria-label", "Previous cover");
    prev.textContent = "‹★";

    const current = document.createElement("span");
    current.className = "cover-current";
    current.id = "cover-current";
    current.setAttribute("aria-hidden", "true");

    const next = document.createElement("button");
    next.className = "cover-arrow";
    next.id = "cover-next";
    next.type = "button";
    next.setAttribute("aria-label", "Next cover");
    next.textContent = "★›";

    picker.append(prev, current, next);

    prev.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      changeCover(-1);
    });

    next.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      changeCover(1);
    });

    updateCounter();
  }

  function updateCounter() {
    const current = document.getElementById("cover-current");
    if (!current) return;
    current.textContent = `${currentIndex + 1}/${coverSources.length}`;
  }

  function applyCoverSrc(src) {
    const main = getMainCover();
    if (main) {
      main.src = src;
      main.alt = "#chaoscore cover";
    }

    getPlayerCovers().forEach((img) => {
      img.src = src;
    });

    localStorage.setItem("chaoscore-selected-cover", src);
    updateCounter();
  }

  function changeCover(direction) {
    const main = getMainCover();
    if (!main || !coverSources.length) return;

    const currentPath = normalizeSrc(main.getAttribute("src") || main.src || "");
    let nextIndex = currentIndex;

    /*
      Hard fix:
      1 click deve sempre portare a una cover diversa.
      Se la prossima sorgente è uguale alla corrente, la saltiamo.
    */
    for (let i = 0; i < coverSources.length; i++) {
      nextIndex = (nextIndex + direction + coverSources.length) % coverSources.length;
      const candidate = coverSources[nextIndex];
      const candidatePath = normalizeSrc(candidate);

      if (candidatePath !== currentPath) {
        currentIndex = nextIndex;
        break;
      }
    }

    const nextSrc = coverSources[currentIndex];
    const cls = direction > 0 ? "is-cover-sliding-next" : "is-cover-sliding-prev";

    main.classList.remove("is-cover-sliding-next", "is-cover-sliding-prev");

    /*
      Cambio immediato: non aspettiamo l'animazione.
      L'animazione accompagna il cambio, non lo ritarda.
    */
    applyCoverSrc(nextSrc);

    requestAnimationFrame(function () {
      main.classList.add(cls);
    });

    window.setTimeout(function () {
      main.classList.remove(cls);
    }, 220);
  }

  let lastArrowPointerTime = 0;

  function bindImmediateArrowControls() {
    if (window.__chaosCoverCarouselImmediateBound) return;
    window.__chaosCoverCarouselImmediateBound = true;

    /*
      Fix doppio click:
      pointerdown cambia subito la cover e blocca i vecchi handler click/touch.
      Il click sintetico successivo viene soppresso.
    */
    document.addEventListener("pointerdown", function (event) {
      const arrow = event.target.closest(".cover-arrow");
      if (!arrow) return;

      const picker = arrow.closest("#cover-picker, .cover-picker");
      if (!picker) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      lastArrowPointerTime = Date.now();

      const direction =
        arrow.id === "cover-prev" || arrow.textContent.includes("‹")
          ? -1
          : 1;

      changeCover(direction);
    }, true);

    document.addEventListener("click", function (event) {
      const arrow = event.target.closest(".cover-arrow");
      if (!arrow) return;

      if (Date.now() - lastArrowPointerTime < 700) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  function boot() {
    findCurrentIndex();
    renderPicker();
    bindImmediateArrowControls();
    applyCoverSrc(coverSources[currentIndex]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
