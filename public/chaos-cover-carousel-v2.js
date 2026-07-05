(function () {
  "use strict";

  if (window.__chaosCoverCarouselV2Mounted) return;
  window.__chaosCoverCarouselV2Mounted = true;

  const coverSources = [
    "/chaoscore-cover.png",
    "/covers/cover chaoscore.png",
    "/assets/chaoscore-spotify-cover.jpg",
    "/covers/copertina icona chaoscore.jpeg"
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
    const saved = localStorage.getItem("chaoscore-selected-cover");
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
    prev.textContent = "‹";

    const current = document.createElement("span");
    current.className = "cover-current";
    current.id = "cover-current";
    current.setAttribute("aria-hidden", "true");

    const next = document.createElement("button");
    next.className = "cover-arrow";
    next.id = "cover-next";
    next.type = "button";
    next.setAttribute("aria-label", "Next cover");
    next.textContent = "›";

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
    if (locked) return;

    const main = getMainCover();
    if (!main) return;

    locked = true;

    const cls = direction > 0 ? "is-cover-sliding-next" : "is-cover-sliding-prev";
    main.classList.remove("is-cover-sliding-next", "is-cover-sliding-prev");
    main.classList.add(cls);

    currentIndex = (currentIndex + direction + coverSources.length) % coverSources.length;
    const nextSrc = coverSources[currentIndex];

    window.setTimeout(function () {
      applyCoverSrc(nextSrc);
      main.classList.remove(cls);
      locked = false;
    }, 180);
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
