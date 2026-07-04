(function () {
  if (window.__chaosMobilePlayerPolishMounted) return;
  window.__chaosMobilePlayerPolishMounted = true;

  const STATE = {
    ctx: null,
    source: null,
    gain: null,
    volume: 1,
    open: false
  };

  function audio() {
    return document.getElementById("audio");
  }

  function mainVolumeBox() {
    return document.getElementById("chaos-main-volume");
  }

  function mainMuteButton() {
    return document.getElementById("chaos-main-mute");
  }

  function isTouchMobile() {
    return window.matchMedia("(max-width: 720px)").matches ||
      navigator.maxTouchPoints > 0;
  }

  function ensureGainGraph() {
    const a = audio();
    if (!a) return false;

    if (STATE.gain) return true;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      STATE.ctx = new AudioCtx();

      /*
        Un solo audio: #audio.
        Non creiamo un secondo <audio>.
        Lo passiamo solo attraverso un GainNode per permettere volume reale su iPhone.
      */
      STATE.source = STATE.source || STATE.ctx.createMediaElementSource(a);
      STATE.gain = STATE.ctx.createGain();

      STATE.gain.gain.value = STATE.volume;
      STATE.source.connect(STATE.gain);
      STATE.gain.connect(STATE.ctx.destination);

      return true;
    } catch (err) {
      console.warn("Chaos volume graph non disponibile:", err);
      return false;
    }
  }

  async function resumeCtx() {
    if (!STATE.ctx) return;

    try {
      if (STATE.ctx.state !== "running") {
        await STATE.ctx.resume();
      }
    } catch (_) {}
  }

  function setVolume(value) {
    const a = audio();
    const v = Math.max(0, Math.min(1, Number(value)));

    STATE.volume = v;

    /*
      Desktop/Mac: audio.volume funziona.
      iPhone: può non funzionare, quindi usiamo anche GainNode.
    */
    if (a) {
      try {
        a.volume = v;
      } catch (_) {}

      a.muted = v === 0;
    }

    if (STATE.gain) {
      try {
        STATE.gain.gain.setTargetAtTime(v, STATE.ctx.currentTime, 0.015);
      } catch (_) {
        STATE.gain.gain.value = v;
      }
    }

    syncVolumeUI();
  }

  function syncVolumeUI() {
    const a = audio();
    const mute = mainMuteButton();
    const box = mainVolumeBox();
    const vertical = document.getElementById("chaos-mobile-volume-slider");
    const value = document.getElementById("chaos-mobile-volume-value");

    const current = a?.muted ? 0 : STATE.volume;

    if (mute) {
      mute.textContent = current === 0 ? "🔇" : "🔊";
      mute.setAttribute("aria-label", current === 0 ? "Volume off" : "Volume");
    }

    if (vertical && document.activeElement !== vertical) {
      vertical.value = String(current);
    }

    if (value) {
      value.textContent = `${Math.round(current * 100)}%`;
    }

    if (box) {
      box.classList.toggle("is-volume-open", STATE.open);
    }
  }

  function enhanceMainVolume() {
    const box = mainVolumeBox();
    const mute = mainMuteButton();

    if (!box || !mute || box.dataset.mobileEnhanced === "1") return;

    box.dataset.mobileEnhanced = "1";

    const pop = document.createElement("div");
    pop.className = "chaos-mobile-volume-pop";
    pop.innerHTML = `
      <input
        id="chaos-mobile-volume-slider"
        class="chaos-mobile-volume-slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value="1"
        aria-label="Volume"
      >
      <div id="chaos-mobile-volume-value" class="chaos-mobile-volume-value">100%</div>
    `;

    box.appendChild(pop);

    const vertical = document.getElementById("chaos-mobile-volume-slider");

    mute.addEventListener("click", async function (event) {
      if (!isTouchMobile()) return;

      event.preventDefault();
      event.stopPropagation();

      ensureGainGraph();
      await resumeCtx();

      STATE.open = !STATE.open;
      syncVolumeUI();
    }, true);

    vertical?.addEventListener("input", async function (event) {
      ensureGainGraph();
      await resumeCtx();
      setVolume(event.target.value);
    });

    vertical?.addEventListener("change", async function (event) {
      ensureGainGraph();
      await resumeCtx();
      setVolume(event.target.value);
    });

    document.addEventListener("click", function (event) {
      if (!STATE.open) return;
      if (event.target.closest("#chaos-main-volume")) return;

      STATE.open = false;
      syncVolumeUI();
    }, true);

    syncVolumeUI();
  }

  function bindAudioGestures() {
    const a = audio();
    if (!a || a.dataset.mobileGainBound === "1") return;

    a.dataset.mobileGainBound = "1";

    ["play", "volumechange", "loadedmetadata"].forEach((type) => {
      a.addEventListener(type, syncVolumeUI);
    });

    document.addEventListener("click", async function (event) {
      const target = event.target.closest("button, [role='button'], input");
      if (!target) return;

      if (isTouchMobile()) {
        ensureGainGraph();
        await resumeCtx();
        if (STATE.gain) {
          setVolume(STATE.volume);
        }
      }
    }, true);
  }

  function boot() {
    enhanceMainVolume();
    bindAudioGestures();

    const observer = new MutationObserver(function () {
      enhanceMainVolume();
      bindAudioGestures();
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
