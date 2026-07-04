(function () {
  if (window.__chaosNowPlayingMounted) return;
  window.__chaosNowPlayingMounted = true;

  function audio() {
    return document.getElementById("audio");
  }

  function mainCover() {
    return document.getElementById("main-cover");
  }

  function nowTitle() {
    return document.getElementById("now-title")?.textContent?.trim() || "#chaoscore";
  }

  function fmt(value) {
    if (!Number.isFinite(value)) return "0:00";
    const m = Math.floor(value / 60);
    const s = Math.floor(value % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function buildNowSheet() {
    if (document.getElementById("chaos-now-backdrop")) return;

    const now = document.createElement("div");
    now.id = "chaos-now-backdrop";
    now.className = "chaos-now-backdrop";

    now.innerHTML = `
      <div class="chaos-now-sheet" role="dialog" aria-modal="true">
        <div class="chaos-now-handle"></div>

        <div class="chaos-now-head">
          <div class="chaos-now-label">Now Playing</div>
          <button id="chaos-now-close" class="chaos-now-close" type="button" aria-label="Close">×</button>
        </div>

        <img id="chaos-now-cover" class="chaos-now-cover" src="/chaoscore-cover.png" alt="">

        <div id="chaos-now-title" class="chaos-now-title">#chaoscore</div>
        <div id="chaos-now-sub" class="chaos-now-sub">Douglas Busta · #chaoscore</div>

        <div id="chaos-now-progress" class="chaos-now-progress">
          <div id="chaos-now-progress-fill" class="chaos-now-progress-fill"></div>
        </div>

        <div class="chaos-now-time">
          <span id="chaos-now-current">0:00</span>
          <span id="chaos-now-duration">0:00</span>
        </div>

        <div class="chaos-now-controls">
          <button id="chaos-now-prev" class="chaos-now-btn" type="button" aria-label="Previous">‹</button>
          <button id="chaos-now-play" class="chaos-now-btn play" type="button" aria-label="Play/Pause">▶</button>
          <button id="chaos-now-next" class="chaos-now-btn" type="button" aria-label="Next">›</button>
        </div>

        <label class="chaos-now-volume">
          <span>VOL</span>
          <input id="chaos-now-volume" type="range" min="0" max="1" step="0.01" value="1">
        </label>
      </div>
    `;

    document.body.appendChild(now);
  }

  function openNow() {
    buildNowSheet();
    document.getElementById("chaos-now-backdrop")?.classList.add("is-open");
    syncNow();
  }

  function closeNow() {
    document.getElementById("chaos-now-backdrop")?.classList.remove("is-open");
  }

  async function togglePlay() {
    const a = audio();
    if (!a) return;

    if (a.paused) {
      await a.play();
    } else {
      a.pause();
    }

    syncNow();
  }

  function seekFromEvent(event) {
    const a = audio();
    if (!a || !Number.isFinite(a.duration) || !a.duration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;

    syncNow();
  }

  function syncNow() {
    const a = audio();

    const title = document.getElementById("chaos-now-title");
    const sub = document.getElementById("chaos-now-sub");
    const cover = document.getElementById("chaos-now-cover");
    const play = document.getElementById("chaos-now-play");
    const fill = document.getElementById("chaos-now-progress-fill");
    const current = document.getElementById("chaos-now-current");
    const duration = document.getElementById("chaos-now-duration");
    const volume = document.getElementById("chaos-now-volume");

    if (title) title.textContent = nowTitle();
    if (sub) sub.textContent = "Douglas Busta · #chaoscore";
    if (cover && mainCover()?.src) cover.src = mainCover().src;

    if (a) {
      if (play) play.textContent = a.paused ? "▶" : "Ⅱ";
      if (fill) fill.style.width = `${a.duration ? (a.currentTime / a.duration) * 100 : 0}%`;
      if (current) current.textContent = fmt(a.currentTime);
      if (duration) duration.textContent = fmt(a.duration);

      if (volume && document.activeElement !== volume) {
        volume.value = String(a.volume);
      }
    }
  }

  function bind() {
    buildNowSheet();

    document.addEventListener("click", function (event) {
      const mini = event.target.closest("#chaos-safe-mini-player");

      if (!mini) return;
      if (event.target.closest("button, input, .chaos-safe-mini-progress")) return;

      event.preventDefault();
      event.stopPropagation();

      openNow();
    }, true);

    document.getElementById("chaos-now-close")?.addEventListener("click", closeNow);

    document.getElementById("chaos-now-backdrop")?.addEventListener("click", function (event) {
      if (event.target.id === "chaos-now-backdrop") closeNow();
    });

    document.getElementById("chaos-now-play")?.addEventListener("click", togglePlay);

    document.getElementById("chaos-now-prev")?.addEventListener("click", function () {
      document.getElementById("prev")?.click();
      setTimeout(syncNow, 150);
      setTimeout(syncNow, 500);
    });

    document.getElementById("chaos-now-next")?.addEventListener("click", function () {
      document.getElementById("next")?.click();
      setTimeout(syncNow, 150);
      setTimeout(syncNow, 500);
    });

    document.getElementById("chaos-now-progress")?.addEventListener("click", seekFromEvent);

    document.getElementById("chaos-now-volume")?.addEventListener("input", function (event) {
      const a = audio();
      if (a) {
        a.volume = Number(event.target.value);
        syncNow();
      }
    });

    const a = audio();
    if (a) {
      ["play", "pause", "timeupdate", "loadedmetadata", "durationchange", "volumechange"].forEach(type => {
        a.addEventListener(type, syncNow);
      });
    }

    setInterval(syncNow, 700);
    syncNow();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
