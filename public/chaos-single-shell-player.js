(function () {
  if (window.__chaosSingleShellPlayerMounted) return;
  window.__chaosSingleShellPlayerMounted = true;

  let currentIndex = 0;

  function audio() {
    return document.getElementById("audio");
  }

  function fmt(value) {
    if (!Number.isFinite(value)) return "0:00";
    const m = Math.floor(value / 60);
    const s = String(Math.floor(value % 60)).padStart(2, "0");
    return `${m}:${s}`;
  }

  function getTrackItems() {
    return Array.from(document.querySelectorAll("#tracks button, .tracks button, [data-track], [data-index]"))
      .filter((el) => el.offsetParent !== null || el.dataset.track || el.dataset.index);
  }

  function inferIndexFromTitle() {
    const title = (document.getElementById("now-title")?.textContent || "").trim().toLowerCase();
    const items = getTrackItems();

    const found = items.findIndex((item) =>
      (item.textContent || "").trim().toLowerCase().includes(title)
    );

    if (found >= 0) currentIndex = found;
  }

  function clickTrack(index) {
    const items = getTrackItems();
    const item = items[index];

    if (item) {
      item.click();
      currentIndex = index;
      setTimeout(sync, 80);
      setTimeout(sync, 350);
    }
  }

  function build() {
    if (document.getElementById("chaos-single-shell")) return;

    const shell = document.createElement("div");
    shell.id = "chaos-single-shell";

    shell.innerHTML = `
      <div class="chaos-shell-inner">
        <img id="chaos-shell-cover" class="chaos-shell-cover" alt="">
        <div class="chaos-shell-meta">
          <div id="chaos-shell-title" class="chaos-shell-title">#chaoscore</div>
          <div class="chaos-shell-sub">Douglas Busta · Lossless</div>
        </div>
        <div class="chaos-shell-controls">
          <button id="chaos-shell-prev" class="chaos-shell-btn" type="button">‹</button>
          <button id="chaos-shell-play" class="chaos-shell-btn play" type="button">▶</button>
          <button id="chaos-shell-next" class="chaos-shell-btn" type="button">›</button>
          <button id="chaos-shell-expand" class="chaos-shell-btn expand" type="button">▴</button>
        </div>
        <div id="chaos-shell-progress" class="chaos-shell-progress">
          <div id="chaos-shell-fill" class="chaos-shell-fill"></div>
        </div>
        <div class="chaos-shell-time">
          <span id="chaos-shell-current">0:00</span>
          <span id="chaos-shell-duration">0:00</span>
        </div>
        <label class="chaos-shell-volume">
          <span>VOL</span>
          <input id="chaos-shell-volume" type="range" min="0" max="1" step="0.01" value="1">
        </label>
      </div>
    `;

    document.body.appendChild(shell);

    const overlay = document.createElement("div");
    overlay.id = "chaos-files-shell-overlay";
    overlay.innerHTML = `<iframe id="chaos-files-shell-frame" src="about:blank" title="Busta Files"></iframe>`;
    document.body.appendChild(overlay);

    const close = document.createElement("button");
    close.id = "chaos-files-shell-close";
    close.type = "button";
    close.textContent = "← Back to #chaoscore";
    close.addEventListener("click", closeFiles);
    document.body.appendChild(close);

    bind();
  }

  function bind() {
    document.getElementById("chaos-shell-play")?.addEventListener("click", togglePlay);
    document.getElementById("chaos-shell-prev")?.addEventListener("click", prev);
    document.getElementById("chaos-shell-next")?.addEventListener("click", next);

    document.getElementById("chaos-shell-expand")?.addEventListener("click", function () {
      document.getElementById("chaos-single-shell")?.classList.toggle("is-full");
      sync();
    });

    document.getElementById("chaos-shell-volume")?.addEventListener("input", function (event) {
      const a = audio();
      if (!a) return;
      try {
        a.volume = Number(event.target.value);
      } catch (_) {}
      a.muted = Number(event.target.value) === 0;
      sync();
    });

    document.getElementById("chaos-shell-progress")?.addEventListener("click", function (event) {
      const a = audio();
      if (!a || !a.duration) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      a.currentTime = ratio * a.duration;
      sync();
    });

    const a = audio();
    if (a) {
      ["play", "pause", "timeupdate", "durationchange", "loadedmetadata", "volumechange"].forEach((type) => {
        a.addEventListener(type, sync);
      });
    }

    document.addEventListener("click", function (event) {
      const target = event.target.closest("a, button, [role='button']");
      if (!target) return;

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
  }

  async function togglePlay() {
    const a = audio();
    if (!a) return;

    if (!a.src && getTrackItems().length) {
      clickTrack(currentIndex);
    }

    if (a.paused) {
      await a.play();
    } else {
      a.pause();
    }

    sync();
  }

  function prev() {
    inferIndexFromTitle();
    currentIndex = Math.max(0, currentIndex - 1);
    clickTrack(currentIndex);
  }

  function next() {
    inferIndexFromTitle();
    const items = getTrackItems();
    currentIndex = Math.min(items.length - 1, currentIndex + 1);
    clickTrack(currentIndex);
  }

  function openFiles() {
    const frame = document.getElementById("chaos-files-shell-frame");
    if (frame && frame.src === "about:blank") frame.src = "/exclusive";
    document.body.classList.add("chaos-files-shell-open");
    document.getElementById("chaos-single-shell")?.classList.remove("is-full");
  }

  function closeFiles() {
    document.body.classList.remove("chaos-files-shell-open");
  }

  function sync() {
    const a = audio();
    const title = document.getElementById("now-title")?.textContent?.trim() || "#chaoscore";
    const cover = document.getElementById("main-cover")?.src || "";

    const titleEl = document.getElementById("chaos-shell-title");
    const coverEl = document.getElementById("chaos-shell-cover");
    const playEl = document.getElementById("chaos-shell-play");
    const fillEl = document.getElementById("chaos-shell-fill");
    const curEl = document.getElementById("chaos-shell-current");
    const durEl = document.getElementById("chaos-shell-duration");
    const volEl = document.getElementById("chaos-shell-volume");
    const expEl = document.getElementById("chaos-shell-expand");

    if (titleEl) titleEl.textContent = title;
    if (coverEl && cover) coverEl.src = cover;

    if (a) {
      if (playEl) playEl.textContent = a.paused ? "▶" : "Ⅱ";
      if (fillEl) fillEl.style.width = `${a.duration ? (a.currentTime / a.duration) * 100 : 0}%`;
      if (curEl) curEl.textContent = fmt(a.currentTime);
      if (durEl) durEl.textContent = fmt(a.duration);
      if (volEl && document.activeElement !== volEl) volEl.value = String(a.volume);
    }

    if (expEl) {
      expEl.textContent = document.getElementById("chaos-single-shell")?.classList.contains("is-full") ? "▾" : "▴";
    }
  }

  function neutralizeDuplicates() {
    const shell = document.getElementById("chaos-single-shell");
    const mainAudio = audio();

    document.querySelectorAll("audio").forEach((el) => {
      if (el === mainAudio) return;
      try { el.pause(); } catch (_) {}
      el.remove();
    });

    document.querySelectorAll([
      "#chaos-safe-mini-player",
      ".chaos-safe-mini-player",
      "[id*='safe-mini']",
      "[class*='safe-mini']",
      "[id*='mini-player']",
      "[class*='mini-player']"
    ].join(",")).forEach((el) => {
      if (shell && shell.contains(el)) return;
      el.remove();
    });
  }

  function boot() {
    build();
    document.body.classList.add("chaos-single-shell-ready");
    neutralizeDuplicates();
    sync();

    const observer = new MutationObserver(function () {
      neutralizeDuplicates();
      sync();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    setInterval(sync, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
