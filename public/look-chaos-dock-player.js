(function () {
  if (window.__lookChaosDockPlayerMounted) return;
  window.__lookChaosDockPlayerMounted = true;

  let dockExpanded = false;
  let currentIndex = 0;

  function $(sel) {
    return document.querySelector(sel);
  }

  function audio() {
    return document.getElementById("audio");
  }

  function fmt(t) {
    if (!Number.isFinite(t) || t < 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = String(Math.floor(t % 60)).padStart(2, "0");
    return `${m}:${s}`;
  }

  function trackButtons() {
    return Array.from(document.querySelectorAll("#tracks button, .tracks button, [data-track], [data-index]"))
      .filter((el) => !el.closest("#look-chaos-dock"));
  }

  function readTitle() {
    const fromOld = $("#now-title")?.textContent?.trim();
    if (fromOld) return fromOld;

    const items = trackButtons();
    const active = items[currentIndex];
    const txt = active?.textContent?.trim();
    return txt || "#chaoscore";
  }

  function readCover() {
    return $("#main-cover")?.src || document.querySelector("img[src*='chaos'], img[src*='cover']")?.src || "";
  }

  function setExpanded(value) {
    dockExpanded = Boolean(value);
    const dock = $("#look-chaos-dock");
    if (!dock) return;
    dock.classList.toggle("is-expanded", dockExpanded);
    sync();
  }

  function build() {
    if ($("#look-chaos-dock")) return;

    const dock = document.createElement("div");
    dock.id = "look-chaos-dock";
    dock.innerHTML = `
      <div class="look-dock-mini">
        <img class="look-mini-cover" data-look-cover alt="">
        <div class="look-mini-meta" data-look-expand>
          <div class="look-mini-title" data-look-title>#chaoscore</div>
          <div class="look-mini-artist">Douglas Busta</div>
        </div>
        <div class="look-mini-controls">
          <button class="look-btn look-btn-mini" data-look-prev type="button">‹</button>
          <button class="look-btn look-btn-mini play" data-look-play type="button">▶</button>
          <button class="look-btn look-btn-mini" data-look-next type="button">›</button>
        </div>
        <div class="look-progress look-mini-progress" data-look-progress>
          <div class="look-progress-fill" data-look-fill></div>
        </div>
      </div>

      <div class="look-dock-mega">
        <div class="look-mega-top">
          <div class="look-mega-brand">
            <div class="look-mega-kicker">LOOK APP · Now Playing</div>
            <div class="look-mini-artist">#chaoscore lossless</div>
          </div>
          <button class="look-btn look-mega-close" data-look-collapse type="button">⌄</button>
        </div>

        <div class="look-mega-cover-wrap">
          <img class="look-mega-cover" data-look-cover alt="">
        </div>

        <div class="look-mega-meta">
          <div class="look-mega-title" data-look-title>#chaoscore</div>
          <div class="look-mega-artist">Douglas Busta</div>
        </div>

        <div class="look-mega-progress-area">
          <div class="look-progress look-mega-progress" data-look-progress>
            <div class="look-progress-fill" data-look-fill></div>
          </div>
          <div class="look-time-row">
            <span data-look-current>0:00</span>
            <span data-look-duration>0:00</span>
          </div>
        </div>

        <div class="look-mega-controls">
          <button class="look-btn look-btn-mega" data-look-prev type="button">‹</button>
          <button class="look-btn look-btn-mega play" data-look-play type="button">▶</button>
          <button class="look-btn look-btn-mega" data-look-next type="button">›</button>
        </div>

        <div class="look-mega-volume">
          <button class="look-btn look-btn-mini" data-look-mute type="button">M</button>
          <input data-look-volume type="range" min="0" max="1" step="0.01" value="1">
          <span data-look-volume-label>100</span>
        </div>

        <div class="look-mega-status" data-look-status>
          Same player, same audio, same track. Mini and mega are only two layouts.
        </div>

        <div class="look-mega-nav">
          <button class="look-nav-btn" data-look-files type="button">Busta Files</button>
          <button class="look-nav-btn" data-look-chaos type="button">#chaoscore</button>
        </div>
      </div>
    `;

    const overlay = document.createElement("div");
    overlay.id = "look-busta-overlay";
    overlay.innerHTML = '<iframe id="look-busta-frame" src="about:blank" title="Busta Files"></iframe>';

    const close = document.createElement("button");
    close.id = "look-busta-close";
    close.type = "button";
    close.textContent = "← Back to #chaoscore";

    document.body.appendChild(overlay);
    document.body.appendChild(close);
    document.body.appendChild(dock);

    bind();
  }

  function bind() {
    document.addEventListener("click", function (event) {
      const btn = event.target.closest("[data-look-play], [data-look-prev], [data-look-next], [data-look-expand], [data-look-collapse], [data-look-mute], [data-look-files], [data-look-chaos], .look-progress");
      if (!btn) return;

      if (btn.matches("[data-look-play]")) togglePlay();
      else if (btn.matches("[data-look-prev]")) prev();
      else if (btn.matches("[data-look-next]")) next();
      else if (btn.matches("[data-look-expand]")) setExpanded(true);
      else if (btn.matches("[data-look-collapse]")) setExpanded(false);
      else if (btn.matches("[data-look-mute]")) toggleMute();
      else if (btn.matches("[data-look-files]")) openFiles();
      else if (btn.matches("[data-look-chaos]")) closeFiles();
      else if (btn.matches(".look-progress")) seek(event, btn);
    });

    document.addEventListener("input", function (event) {
      const input = event.target.closest("[data-look-volume]");
      if (!input) return;

      const a = audio();
      if (!a) return;

      try {
        a.volume = Number(input.value);
      } catch (_) {}

      a.muted = Number(input.value) === 0;
      sync();
    });

    document.addEventListener("click", function (event) {
      const target = event.target.closest("a, button, [role='button']");
      if (!target || target.closest("#look-chaos-dock")) return;

      const text = (
        target.textContent ||
        target.getAttribute("aria-label") ||
        target.getAttribute("title") ||
        ""
      ).toLowerCase();

      const href = (target.getAttribute("href") || "").toLowerCase();

      if (
        text.includes("back to busta files") ||
        text.includes("busta files") ||
        href.includes("/exclusive") ||
        href.includes("exclusive.html")
      ) {
        event.preventDefault();
        event.stopPropagation();
        openFiles();
      }
    }, true);

    document.addEventListener("click", function (event) {
      const item = event.target.closest("#tracks button, .tracks button, [data-track], [data-index]");
      if (!item || item.closest("#look-chaos-dock")) return;

      const items = trackButtons();
      const idx = items.indexOf(item);
      if (idx >= 0) currentIndex = idx;

      setTimeout(sync, 80);
      setTimeout(sync, 350);
    }, true);

    $("#look-busta-close")?.addEventListener("click", closeFiles);

    const a = audio();
    if (a) {
      ["play", "pause", "timeupdate", "durationchange", "loadedmetadata", "volumechange", "ended"].forEach((ev) => {
        a.addEventListener(ev, sync);
      });

      a.addEventListener("ended", next);
    }
  }

  async function togglePlay() {
    const a = audio();
    if (!a) return;

    if (!a.src) {
      const first = trackButtons()[currentIndex] || trackButtons()[0];
      if (first) {
        first.click();
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
    }

    try {
      if (a.paused) await a.play();
      else a.pause();
    } catch (_) {}

    sync();
  }

  function inferIndex() {
    const title = readTitle().toLowerCase();
    const items = trackButtons();
    const found = items.findIndex((item) => item.textContent.toLowerCase().includes(title));
    if (found >= 0) currentIndex = found;
  }

  function clickTrack(index) {
    const items = trackButtons();
    const item = items[index];
    if (!item) return;

    currentIndex = index;
    item.click();

    setTimeout(async () => {
      const a = audio();
      try {
        if (a && a.paused) await a.play();
      } catch (_) {}
      sync();
    }, 140);
  }

  function prev() {
    inferIndex();
    clickTrack(Math.max(0, currentIndex - 1));
  }

  function next() {
    inferIndex();
    const items = trackButtons();
    clickTrack(Math.min(items.length - 1, currentIndex + 1));
  }

  function seek(event, bar) {
    const a = audio();
    if (!a || !a.duration) return;

    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;
    sync();
  }

  function toggleMute() {
    const a = audio();
    if (!a) return;

    a.muted = !a.muted;
    sync();
  }

  function openFiles() {
    const frame = $("#look-busta-frame");
    if (frame && frame.src === "about:blank") frame.src = "/exclusive";

    document.body.classList.add("look-busta-open");
    setExpanded(false);
  }

  function closeFiles() {
    document.body.classList.remove("look-busta-open");
  }

  function killOldFloatingPlayers() {
    document.querySelectorAll("audio").forEach((el) => {
      if (el === audio()) return;
      try { el.pause(); } catch (_) {}
      el.remove();
    });

    document.querySelectorAll([
      "[id*='safe-mini']",
      "[class*='safe-mini']",
      "[id*='mini-player']",
      "[class*='mini-player']",
      "[id*='persistent-player']",
      "[class*='persistent-player']",
      "[id*='unified-player']",
      "[class*='unified-player']"
    ].join(",")).forEach((el) => {
      if (el.closest("#look-chaos-dock")) return;
      el.remove();
    });
  }

  function sync() {
    const a = audio();
    const title = readTitle();
    const cover = readCover();

    document.querySelectorAll("[data-look-title]").forEach((el) => el.textContent = title);

    if (cover) {
      document.querySelectorAll("[data-look-cover]").forEach((el) => {
        if (el.src !== cover) el.src = cover;
      });
    }

    const paused = !a || a.paused;
    document.querySelectorAll("[data-look-play]").forEach((el) => {
      el.textContent = paused ? "▶" : "Ⅱ";
    });

    const current = a ? a.currentTime : 0;
    const duration = a ? a.duration : 0;
    const pct = duration ? (current / duration) * 100 : 0;

    document.querySelectorAll("[data-look-fill]").forEach((el) => {
      el.style.width = `${pct}%`;
    });

    document.querySelectorAll("[data-look-current]").forEach((el) => el.textContent = fmt(current));
    document.querySelectorAll("[data-look-duration]").forEach((el) => el.textContent = fmt(duration));

    const vol = a ? a.volume : 1;
    document.querySelectorAll("[data-look-volume]").forEach((el) => {
      if (document.activeElement !== el) el.value = String(vol);
    });
    document.querySelectorAll("[data-look-volume-label]").forEach((el) => {
      el.textContent = a?.muted ? "MUTE" : String(Math.round(vol * 100));
    });

    document.querySelectorAll("[data-look-mute]").forEach((el) => {
      el.textContent = a?.muted ? "U" : "M";
    });
  }

  function boot() {
    build();
    document.body.classList.add("look-dock-ready");
    killOldFloatingPlayers();
    sync();

    const observer = new MutationObserver(() => {
      killOldFloatingPlayers();
      sync();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    setInterval(sync, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
