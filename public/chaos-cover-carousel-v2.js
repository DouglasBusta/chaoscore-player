(function () {
  "use strict";

  const coverSources = [
    "/covers/copertina icona chaoscore.jpeg",
    "/assets/chaoscore-spotify-cover.jpg"
  ];

  let currentIndex = 0;

  function getMainCover() {
    return document.getElementById("main-cover") || document.querySelector(".cover");
  }

  function getMiniCoverImages() {
    return Array.from(document.querySelectorAll("[data-cover], .now img")).filter(Boolean);
  }

  function setCover(index) {
    const cover = getMainCover();
    if (!cover) return;

    currentIndex = (index + coverSources.length) % coverSources.length;

    const nextSrc = coverSources[currentIndex];

    cover.src = nextSrc;
    cover.alt = "#chaoscore cover";

    getMiniCoverImages().forEach(function (img) {
      img.src = nextSrc;
    });

    localStorage.setItem("chaoscore-selected-cover", nextSrc);
  }

  function goPreviousCover() {
    setCover(currentIndex - 1);
  }

  function goNextCover() {
    setCover(currentIndex + 1);
  }

  function readInitialCover() {
    const saved = localStorage.getItem("chaoscore-selected-cover") || "";
    const found = coverSources.findIndex(function (src) {
      return saved.includes(src);
    });

    currentIndex = found >= 0 ? found : 0;
  }

  function buildCoverButtons() {
    const oldPicker = document.getElementById("cover-picker");
    if (!oldPicker) return;

    /*
      Cancelliamo proprio il contenuto vecchio dei tasti.
      Da qui in poi esistono solo questi due bottoni.
    */
    oldPicker.innerHTML = "";

    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.id = "cover-prev";
    previousButton.className = "cover-arrow";
    previousButton.textContent = "‹★";
    previousButton.setAttribute("aria-label", "Cover precedente");

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.id = "cover-next";
    nextButton.className = "cover-arrow";
    nextButton.textContent = "★›";
    nextButton.setAttribute("aria-label", "Cover successiva");

    /*
      Linguaggio di programmazione semplice:
      se X clicca il tasto sinistro, cambia immagine indietro.
      se X clicca il tasto destro, cambia immagine avanti.
    */
    previousButton.onclick = function () {
      goPreviousCover();
    };

    nextButton.onclick = function () {
      goNextCover();
    };

    oldPicker.appendChild(previousButton);
    oldPicker.appendChild(nextButton);
  }

  function boot() {
    readInitialCover();
    buildCoverButtons();
    setCover(currentIndex);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
