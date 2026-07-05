(function () {
  "use strict";

  /*
    #chaoscore Player V2

    Regola principale:
    - un solo audio engine
    - mini e mega sono due layout dello stesso player
    - dockExpanded false = mini
    - dockExpanded true = mega
    - nessun secondo audio
  */

  const LOOK_PLAYER_VERSION = "chaoscore-player-v2-draft-1";

  const state = {
    tracks: window.CHAOSCORE_TRACKS || [],
    currentIndex: 0,
    isPlaying: false,
    dockExpanded: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    ready: false
  };

  let audio = null;
  let root = null;

  function createAudioEngine() {
    audio = document.createElement("audio");
    audio.id = "chaoscore-v2-audio";
    audio.preload = "metadata";
    audio.crossOrigin = "anonymous";

    document.body.appendChild(audio);

    audio.addEventListener("play", () => {
      state.isPlaying = true;
      render();
    });

    audio.addEventListener("pause", () => {
      state.isPlaying = false;
      render();
    });

    audio.addEventListener("timeupdate", () => {
      state.currentTime = audio.currentTime || 0;
      state.duration = audio.duration || 0;
      renderProgressOnly();
    });

    audio.addEventListener("loadedmetadata", () => {
      state.duration = audio.duration || 0;
      render();
    });

    audio.addEventListener("volumechange", () => {
      state.volume = audio.volume;
      state.muted = audio.muted;
      render();
    });

    audio.addEventListener("ended", () => {
      nextTrack();
    });
  }

  function currentTrack() {
    return state.tracks[state.currentIndex] || null;
  }

  function loadTrack(index, autoplay = false) {
    if (!state.tracks.length) return;

    const safeIndex = Math.max(0, Math.min(index, state.tracks.length - 1));
    state.currentIndex = safeIndex;

    const track = currentTrack();
    if (!track || !track.src) return;

    if (audio.src !== location.origin + track.src && audio.getAttribute("src") !== track.src) {
      audio.src = track.src;
      audio.load();
    }

    render();

    if (autoplay) {
      play();
    }
  }

  async function play() {
    if (!audio) return;

    if (!audio.src) {
      loadTrack(state.currentIndex, false);
    }

    try {
      await audio.play();
    } catch (error) {
      console.warn("[chaoscore-v2] play blocked:", error);
    }
  }

  function pause() {
    if (!audio) return;
    audio.pause();
  }

  function togglePlay() {
    if (!audio) return;

    if (audio.paused) {
      play();
    } else {
      pause();
    }
  }

  function nextTrack() {
    if (!state.tracks.length) return;

    const nextIndex = state.currentIndex + 1;

    if (nextIndex >= state.tracks.length) {
      pause();
      audio.currentTime = 0;
      render();
      return;
    }

    loadTrack(nextIndex, true);
  }

  function previousTrack() {
    if (!audio) return;

    /*
      Comportamento stile Spotify:
      - se la traccia è avanti, torna all'inizio;
      - se è già all'inizio, vai alla traccia precedente.
    */
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      render();
      return;
    }

    const prevIndex = Math.max(0, state.currentIndex - 1);
    loadTrack(prevIndex, true);
  }

  function seekByRatio(ratio) {
    if (!audio || !audio.duration) return;

    const safeRatio = Math.max(0, Math.min(1, ratio));
    audio.currentTime = safeRatio * audio.duration;
  }

  function setVolume(value) {
    if (!audio) return;

    const safeValue = Math.max(0, Math.min(1, Number(value)));
    audio.volume = safeValue;
    audio.muted = safeValue === 0;
  }

  function toggleMute() {
    if (!audio) return;
    audio.muted = !audio.muted;
  }

  function setDockExpanded(value) {
    state.dockExpanded = Boolean(value);
    render();
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    const m = Math.floor(seconds / 60);
    const s = String(Math.floor(seconds % 60)).padStart(2, "0");

    return `${m}:${s}`;
  }

  function createPlayerRoot() {
    root = document.createElement("div");
    root.id = "chaoscore-v2-player-root";

    root.innerHTML = `
      <div class="chaos-v2-player" data-expanded="false">
        <div class="chaos-v2-mini">
          <button class="chaos-v2-cover-btn" data-action="expand" type="button">
            <img class="chaos-v2-mini-cover" data-cover alt="">
          </button>

          <button class="chaos-v2-mini-meta" data-action="expand" type="button">
            <span class="chaos-v2-mini-title" data-title>#chaoscore</span>
            <span class="chaos-v2-mini-artist" data-artist>Douglas Busta</span>
          </button>

          <div class="chaos-v2-mini-controls">
            <button data-action="prev" type="button">‹</button>
            <button data-action="play" type="button" data-play>▶</button>
            <button data-action="next" type="button">›</button>
          </div>

          <div class="chaos-v2-progress chaos-v2-mini-progress" data-progress>
            <div class="chaos-v2-progress-fill" data-fill></div>
          </div>
        </div>

        <div class="chaos-v2-mega">
          <div class="chaos-v2-mega-top">
            <div>
              <div class="chaos-v2-kicker">LOOK APP · Now Playing</div>
              <div class="chaos-v2-subtitle">#chaoscore lossless</div>
            </div>
            <button data-action="collapse" type="button">⌄</button>
          </div>

          <img class="chaos-v2-mega-cover" data-cover alt="">

          <div class="chaos-v2-mega-meta">
            <div class="chaos-v2-mega-title" data-title>#chaoscore</div>
            <div class="chaos-v2-mega-artist" data-artist>Douglas Busta</div>
          </div>

          <div class="chaos-v2-mega-progress-area">
            <div class="chaos-v2-progress chaos-v2-mega-progress" data-progress>
              <div class="chaos-v2-progress-fill" data-fill></div>
            </div>
            <div class="chaos-v2-time-row">
              <span data-current>0:00</span>
              <span data-duration>0:00</span>
            </div>
          </div>

          <div class="chaos-v2-mega-controls">
            <button data-action="prev" type="button">‹</button>
            <button data-action="play" type="button" data-play>▶</button>
            <button data-action="next" type="button">›</button>
          </div>

          <div class="chaos-v2-volume">
            <button data-action="mute" type="button" data-mute>MUTE</button>
            <input data-volume type="range" min="0" max="1" step="0.01" value="1">
            <span data-volume-label>100</span>
          </div>

          <div class="chaos-v2-status">
            Same player. Same audio. Same queue.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);
  }

  function bindEvents() {
    root.addEventListener("click", (event) => {
      const actionEl = event.target.closest("[data-action]");
      if (!actionEl) return;

      const action = actionEl.dataset.action;

      if (action === "play") togglePlay();
      if (action === "prev") previousTrack();
      if (action === "next") nextTrack();
      if (action === "expand") setDockExpanded(true);
      if (action === "collapse") setDockExpanded(false);
      if (action === "mute") toggleMute();
    });

    root.addEventListener("click", (event) => {
      const progress = event.target.closest("[data-progress]");
      if (!progress) return;

      const rect = progress.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;

      seekByRatio(ratio);
    });

    root.addEventListener("input", (event) => {
      const volume = event.target.closest("[data-volume]");
      if (!volume) return;

      setVolume(volume.value);
    });
  }

  function renderProgressOnly() {
    if (!root) return;

    const pct = state.duration ? (state.currentTime / state.duration) * 100 : 0;

    root.querySelectorAll("[data-fill]").forEach((el) => {
      el.style.width = `${pct}%`;
    });

    root.querySelectorAll("[data-current]").forEach((el) => {
      el.textContent = formatTime(state.currentTime);
    });

    root.querySelectorAll("[data-duration]").forEach((el) => {
      el.textContent = formatTime(state.duration);
    });
  }

  function render() {
    if (!root) return;

    const track = currentTrack();

    const player = root.querySelector(".chaos-v2-player");
    if (player) {
      player.dataset.expanded = String(state.dockExpanded);
    }

    root.querySelectorAll("[data-title]").forEach((el) => {
      el.textContent = track ? track.title : "#chaoscore";
    });

    root.querySelectorAll("[data-artist]").forEach((el) => {
      el.textContent = track ? track.artist : "Douglas Busta";
    });

    root.querySelectorAll("[data-cover]").forEach((el) => {
      el.src = "/cover.jpg";
    });

    root.querySelectorAll("[data-play]").forEach((el) => {
      el.textContent = state.isPlaying ? "Ⅱ" : "▶";
    });

    root.querySelectorAll("[data-volume]").forEach((el) => {
      if (document.activeElement !== el) {
        el.value = String(state.volume);
      }
    });

    root.querySelectorAll("[data-volume-label]").forEach((el) => {
      el.textContent = state.muted ? "MUTE" : String(Math.round(state.volume * 100));
    });

    root.querySelectorAll("[data-mute]").forEach((el) => {
      el.textContent = state.muted ? "UNMUTE" : "MUTE";
    });

    renderProgressOnly();
  }

  function boot() {
    if (!state.tracks.length) {
      console.warn("[chaoscore-v2] no tracks found");
    }

    createAudioEngine();
    createPlayerRoot();
    bindEvents();
    loadTrack(0, false);

    state.ready = true;

    window.ChaoscorePlayerV2 = {
      version: LOOK_PLAYER_VERSION,
      state,
      play,
      pause,
      togglePlay,
      nextTrack,
      previousTrack,
      setDockExpanded,
      loadTrack
    };

    render();
  }

  window.ChaoscorePlayerV2Boot = boot;
})();
