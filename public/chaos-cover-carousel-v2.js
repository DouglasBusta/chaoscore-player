(function () {
  "use strict";

  const coverSources = [
    "/covers/copertina icona chaoscore.jpeg",
    "/covers/cover chaoscore.png"
  ];

  let currentIndex = 0;
  const preloadedCovers = new Map();

  function preloadCover(src) {
    if (preloadedCovers.has(src)) {
      return preloadedCovers.get(src);
    }

    const promise = new Promise(function (resolve) {
      const image = new Image();

      image.onload = async function () {
        try {
          if (typeof image.decode === "function") {
            await image.decode();
          }
        } catch (_) {}

        resolve(src);
      };

      image.onerror = function () {
        console.warn("[chaos cover] preload fallito:", src);
        resolve(src);
      };

      image.src = src;
    });

    preloadedCovers.set(src, promise);
    return promise;
  }

  function preloadAllCovers() {
    return Promise.all(coverSources.map(preloadCover));
  }

  function getCover() {
    return document.getElementById("main-cover") || document.querySelector("img.cover") || document.querySelector(".cover img");
  }

  function getMiniCovers() {
    return Array.from(document.querySelectorAll("[data-cover], .now img")).filter(Boolean);
  }

  function normalize(path) {
    try {
      return new URL(path, window.location.origin).pathname;
    } catch (_) {
      return path || "";
    }
  }

  function syncIndexFromCurrentImage() {
    const cover = getCover();
    const currentSrc = normalize(cover?.getAttribute("src") || cover?.src || "");

    const found = coverSources.findIndex(function (src) {
      const srcPath = normalize(src);
      return currentSrc === srcPath || currentSrc.endsWith(srcPath);
    });

    if (found >= 0) currentIndex = found;
  }

  function setCover(index, animate = true) {
    const cover = getCover();
    if (!cover) {
      console.warn("[chaos cover] main cover non trovata");
      return;
    }

    currentIndex = (index + coverSources.length) % coverSources.length;
    const nextSrc = coverSources[currentIndex];

    if (animate) {
      cover.classList.remove("chaos-cover-swap");
      void cover.offsetWidth;
      cover.classList.add("chaos-cover-swap");
    }

    cover.setAttribute("src", nextSrc);
    cover.src = nextSrc;
    cover.alt = "#chaoscore cover";

    getMiniCovers().forEach(function (img) {
      img.setAttribute("src", nextSrc);
      img.src = nextSrc;
    });

    localStorage.setItem("chaoscore-selected-cover", nextSrc);

    console.log("[chaos cover] cambiata cover:", nextSrc);
  }

  function nextCover() {
    syncIndexFromCurrentImage();
    setCover(currentIndex + 1);
  }

  function previousCover() {
    syncIndexFromCurrentImage();
    setCover(currentIndex - 1);
  }

  function rebuildButtons() {
    const picker = document.getElementById("cover-picker");
    if (!picker) return;

    picker.innerHTML = "";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.id = "cover-prev";
    prev.className = "cover-arrow";
    prev.textContent = "‹★";
    prev.setAttribute("aria-label", "Cover precedente");

    const next = document.createElement("button");
    next.type = "button";
    next.id = "cover-next";
    next.className = "cover-arrow";
    next.textContent = "★›";
    next.setAttribute("aria-label", "Cover successiva");

    picker.appendChild(prev);
    picker.appendChild(next);
  }

  async function boot() {
    rebuildButtons();

    await preloadAllCovers();
    console.log("[chaos cover] entrambe le cover precaricate");

    const saved = localStorage.getItem("chaoscore-selected-cover") || "";
    const savedIndex = coverSources.findIndex(function (src) {
      return saved.includes(src);
    });

    currentIndex = savedIndex >= 0 ? savedIndex : 0;
    setCover(currentIndex, false);

    /*
      Funzionamento vero:
      se X clicca cover-prev, cambia immagine indietro.
      se X clicca cover-next, cambia immagine avanti.
      Sta sul document, quindi funziona anche se i bottoni vengono ricreati.
    */
    document.addEventListener("click", function (event) {
      const prev = event.target.closest("#cover-prev");
      const next = event.target.closest("#cover-next");

      if (!prev && !next) return;

      event.preventDefault();
      event.stopPropagation();

      if (prev) previousCover();
      if (next) nextCover();
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
