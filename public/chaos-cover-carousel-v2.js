(function () {
  "use strict";

  if (window.__chaosCoverCarouselV2Mounted) return;
  window.__chaosCoverCarouselV2Mounted = true;

  const coverSources = [
    "/covers/copertina icona chaoscore.jpeg",
    "/assets/chaoscore-spotify-cover.jpg"
  ];

  let currentIndex = 0;

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

    const found = coverSources.findIndex((item) => {
      const itemPath = normalizeSrc(item);
      return itemPath === src || src.endsWith(itemPath);
    });

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

    const next = document.createElement("button");
    next.className = "cover-arrow";
    next.id = "cover-next";
    next.type = "button";
    next.setAttribute("aria-label", "Next cover");
    next.textContent = "★›";

    picker.append(prev, next);

    prev.onclick = function (event) {
      event.preventDefault();
      changeCover(-1);
      return false;
    };

    next.onclick = function (event) {
      event.preventDefault();
      changeCover(1);
      return false;
    };
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
  }

  function changeCover(direction) {
    const main = getMainCover();
    if (!main || !coverSources.length) return;

    currentIndex = (currentIndex + direction + coverSources.length) % coverSources.length;
    const nextSrc = coverSources[currentIndex];

    const cls = direction > 0 ? "is-cover-sliding-next" : "is-cover-sliding-prev";

    main.classList.remove("is-cover-sliding-next", "is-cover-sliding-prev");

    applyCoverSrc(nextSrc);

    requestAnimationFrame(function () {
      main.classList.add(cls);
    });

    window.setTimeout(function () {
      main.classList.remove(cls);
    }, 220);
  }

  function boot() {
    findCurrentIndex();
    renderPicker();
    applyCoverSrc(coverSources[currentIndex]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
