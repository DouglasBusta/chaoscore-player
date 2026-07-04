(function () {
  if (window.__chaosMainVolumeMounted) return;
  window.__chaosMainVolumeMounted = true;

  function audio() {
    return document.getElementById("audio");
  }

  function isIOSLike() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function findMountPoint() {
    return (
      document.querySelector("section.player .controls") ||
      document.querySelector(".player .controls") ||
      document.querySelector("section.player") ||
      document.querySelector(".player")
    );
  }

  function build() {
    if (document.getElementById("chaos-main-volume")) return;

    const a = audio();
    const mount = findMountPoint();

    if (!a || !mount) return;

    const box = document.createElement("div");
    box.id = "chaos-main-volume";
    box.className = "chaos-main-volume";

    box.innerHTML = `
      <span>VOL</span>
      <button id="chaos-main-mute" type="button" aria-label="Mute/unmute">🔊</button>
      <input id="chaos-main-volume-range" type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume">
      <span class="chaos-main-volume-note">tasti volume</span>
    `;

    mount.insertAdjacentElement("afterend", box);

    const mute = document.getElementById("chaos-main-mute");
    const range = document.getElementById("chaos-main-volume-range");

    function sync() {
      if (!a) return;

      if (mute) {
        mute.textContent = a.muted || a.volume === 0 ? "🔇" : "🔊";
      }

      if (range && document.activeElement !== range) {
        range.value = String(a.volume);
      }
    }

    mute?.addEventListener("click", function () {
      a.muted = !a.muted;
      sync();
    });

    range?.addEventListener("input", function (event) {
      const value = Number(event.target.value);

      try {
        a.volume = value;
        a.muted = value === 0;
      } catch (_) {}

      sync();
    });

    range?.addEventListener("change", function (event) {
      const value = Number(event.target.value);

      try {
        a.volume = value;
        a.muted = value === 0;
      } catch (_) {}

      sync();
    });

    ["volumechange", "play", "pause", "loadedmetadata"].forEach((type) => {
      a.addEventListener(type, sync);
    });

    if (isIOSLike()) {
      box.classList.add("is-ios-like");
    }

    sync();
  }

  function boot() {
    build();

    const observer = new MutationObserver(build);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
