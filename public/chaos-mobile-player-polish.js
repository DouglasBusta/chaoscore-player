(function () {
  if (window.__chaosMobilePlayerPolishRealGainMounted) return;
  window.__chaosMobilePlayerPolishRealGainMounted = true;

  const STATE = {
    ctx: null,
    source: null,
    gain: null,
    volume: 1,
    open: false,
    graphReady: false
  };

  function audio() {
    return document.getElementById("audio");
  }

  function isTouchMobile() {
    return window.matchMedia("(max-width: 720px)").matches || navigator.maxTouchPoints > 0;
  }

  function ensureGainGraph() {
    const a = audio();
    if (!a) return false;

    if (STATE.graphReady && STATE.gain && STATE.ctx) return true;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      STATE.ctx = STATE.ctx || new AudioCtx();

      if (!STATE.source) {
        STATE.source = STATE.ctx.createMediaElementSource(a);
      }

      STATE.gain = STATE.ctx.createGain();
      STATE.gain.gain.value = STATE.volume;

      STATE.source.connect(STATE.gain);
      STATE.gain.connect(STATE.ctx.destination);

      STATE.graphReady = true;
      return true;
    } catch (err) {
      console.warn("[chaos mobile volume] WebAudio gain unavailable:", err);
      return false;
    }
  }

  async function resumeCtx() {
    try {
      if (STATE.ctx && STATE.ctx.state !== "running") {
        await STATE.ctx.resume();
      }
    } catch (_) {}
  }

  function setVolume(value) {
    const a = audio();
    const safe = Math.max(0, Math.min(1, Number(value)));

    STATE.volume = safe;

    if (STATE.gain) {
      STATE.gain.gain.value = safe;
    }

    /*
      Desktop fallback: audio.volume funziona.
      iPhone può ignorarlo, ma il GainNode sopra fa il lavoro reale.
    */
    if (a) {
      try {
        a.volume = safe;
      } catch (_) {}

      a.muted = safe === 0;
    }

    syncVolumeUI();
  }

  function syncVolumeUI() {
    const a = audio();

    const actual = STATE.volume;
    const muted = actual <= 0 || Boolean(a?.muted);

    document.querySelectorAll("[data-chaos-real-volume-range]").forEach((range) => {
      if (document.activeElement !== range) {
        range.value = String(actual);
      }
    });

    document.querySelectorAll("[data-chaos-real-volume-button]").forEach((btn) => {
      btn.textContent = muted ? "🔇" : "VOL";
      btn.setAttribute("aria-label", muted ? "Volume spento" : "Volume");
    });

    document.querySelectorAll("[data-chaos-real-volume-popover]").forEach((pop) => {
      pop.classList.toggle("is-open", STATE.open);
    });
  }

  function closePopovers() {
    STATE.open = false;
    syncVolumeUI();
  }

  function buildVolumeControl(id) {
    const wrap = document.createElement("div");
    wrap.className = "chaos-real-mobile-volume";
    wrap.dataset.chaosRealVolume = id;

    wrap.innerHTML = `
      <button type="button" data-chaos-real-volume-button aria-label="Volume">VOL</button>
      <div class="chaos-real-volume-popover" data-chaos-real-volume-popover>
        <input data-chaos-real-volume-range type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume">
      </div>
    `;

    const btn = wrap.querySelector("[data-chaos-real-volume-button]");
    const range = wrap.querySelector("[data-chaos-real-volume-range]");

    btn.addEventListener("click", async function (event) {
      event.preventDefault();
      event.stopPropagation();

      ensureGainGraph();
      await resumeCtx();

      STATE.open = !STATE.open;
      syncVolumeUI();
    });

    range.addEventListener("input", async function (event) {
      event.preventDefault();
      event.stopPropagation();

      ensureGainGraph();
      await resumeCtx();
      setVolume(event.target.value);
    });

    range.addEventListener("change", async function (event) {
      ensureGainGraph();
      await resumeCtx();
      setVolume(event.target.value);
    });

    range.addEventListener("touchstart", async function () {
      ensureGainGraph();
      await resumeCtx();
    }, { passive: true });

    return wrap;
  }

  function mountMainVolume() {
    const a = audio();
    if (!a) return;

    /*
      Rimuove i controlli volume precedenti creati dalle patch vecchie,
      ma NON tocca audio, player, tracklist.
    */
    document.querySelectorAll("#chaos-main-volume, .chaos-main-volume").forEach((el) => el.remove());

    if (document.querySelector("[data-chaos-real-volume='main']")) return;

    const controls =
      document.querySelector("section.player .controls") ||
      document.querySelector(".player .controls") ||
      document.querySelector("section.player") ||
      document.querySelector(".player");

    if (!controls) return;

    controls.appendChild(buildVolumeControl("main"));
  }

  function mountMiniVolume() {
    const mini = document.getElementById("chaos-safe-mini-player");
    if (!mini) return;

    /*
      Nasconde/rimuove vecchi slider mini che usavano audio.volume.
      Ne lasciamo uno solo: quello WebAudio gain.
    */
    mini.querySelectorAll(".chaos-mini-mobile-volume, .chaos-safe-mini-volume").forEach((el) => {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    });

    if (mini.querySelector("[data-chaos-real-volume='mini']")) return;

    const controls =
      mini.querySelector(".chaos-safe-mini-controls") ||
      mini.querySelector("[class*='controls']") ||
      mini.querySelector(".chaos-safe-mini-inner") ||
      mini;

    controls.appendChild(buildVolumeControl("mini"));
  }

  function bindAudioUnlock() {
    const a = audio();
    if (!a || a.dataset.realGainBound === "1") return;

    a.dataset.realGainBound = "1";

    ["play", "playing", "loadedmetadata"].forEach((type) => {
      a.addEventListener(type, async function () {
        if (isTouchMobile()) {
          ensureGainGraph();
          await resumeCtx();
          setVolume(STATE.volume);
        }
      });
    });

    document.addEventListener("pointerdown", async function (event) {
      const target = event.target.closest("button, [role='button'], input, a");
      if (!target) return;

      if (isTouchMobile()) {
        ensureGainGraph();
        await resumeCtx();
      }
    }, true);
  }

  function boot() {
    mountMainVolume();
    mountMiniVolume();
    bindAudioUnlock();
    syncVolumeUI();

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".chaos-real-mobile-volume")) {
        closePopovers();
      }
    }, true);

    const observer = new MutationObserver(function () {
      mountMainVolume();
      mountMiniVolume();
      bindAudioUnlock();
      syncVolumeUI();
    });

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
