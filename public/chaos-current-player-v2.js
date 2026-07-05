(function () {
  "use strict";

  if (window.__chaosCurrentPlayerV2Mounted) return;
  window.__chaosCurrentPlayerV2Mounted = true;

  const state = {
    tracks: window.CHAOSCORE_TRACKS || [],
    index: 0,
    expanded: false,
    cover: "",
    ready: false
  };

  let audio = null;
  let section = null;
  let player = null;

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function fmt(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = String(Math.floor(seconds % 60)).padStart(2, "0");
    return `${m}:${s}`;
  }

  function displayArtists(track) {
    if (!track) return "Douglas Busta";
    if (Array.isArray(track.artists) && track.artists.length) return track.artists.join(", ");
    if (track.artist) return track.artist;
    return "Douglas Busta";
  }

  function absoluteUrl(src) {
    return new URL(src, window.location.origin).href;
  }

  function currentTrack() {
    return state.tracks[state.index] || null;
  }

  function inferIndexFromAudio() {
    if (!audio || !audio.src || !state.tracks.length) return state.index;

    const found = state.tracks.findIndex((track) => {
      if (!track.src) return false;
      return audio.src === absoluteUrl(track.src) || audio.src.endsWith(track.src);
    });

    if (found >= 0) state.index = found;
    return state.index;
  }

  function findCover() {
    const oldCover = document.getElementById("main-cover");
    if (oldCover && oldCover.src) return oldCover.src;

    const likely = document.querySelector(
      "img[src*='chaos'], img[src*='cover'], img[src*='album'], img[src*='spotify']"
    );

    return likely?.src || "";
  }

  function buildPlayer() {
    section = document.querySelector("section.player");

    if (!section) {
      section = document.createElement("section");
      section.className = "player";
      document.body.appendChild(section);
    }

    state.cover = findCover();

    audio = document.getElementById("audio");

    if (!audio) {
      audio = document.createElement("audio");
      audio.id = "audio";
      audio.preload = "metadata";
    }

    audio.id = "audio";
    audio.setAttribute("preload", "metadata");
    audio.style.display = "none";

    section.innerHTML = "";
    section.appendChild(audio);

    const shell = document.createElement("div");
    shell.id = "chaos-current-player";
    shell.dataset.expanded = "false";

    shell.innerHTML = `
      <div class="chaos-current-mini">
        <button class="chaos-current-cover-btn" data-action="expand" type="button" aria-label="Open player">
          <img class="chaos-current-cover" data-cover alt="">
        </button>

        <button class="chaos-current-meta-btn" data-action="expand" type="button">
          <span class="chaos-current-title" data-title>#chaoscore</span>
          <span class="chaos-current-artist" data-artist>Douglas Busta</span>
        </button>

        <div class="chaos-current-controls chaos-current-mini-controls">
          <button class="chaos-current-btn" data-action="prev" type="button" aria-label="Previous">‹</button>
          <button class="chaos-current-btn" data-action="play" type="button" aria-label="Play" data-play>▶</button>
          <button class="chaos-current-btn" data-action="next" type="button" aria-label="Next">›</button>
        </div>

        <div class="chaos-current-progress chaos-current-mini-progress" data-progress>
          <div class="chaos-current-fill" data-fill></div>
        </div>
      </div>

      <div class="chaos-current-mega">
        <div class="chaos-current-mega-top">
          <div>
            <div class="chaos-current-kicker">LOOK APP · Now Playing</div>
            <div class="chaos-current-sub">#chaoscore lossless</div>
          </div>
          <button class="chaos-current-btn chaos-current-mega-close" data-action="collapse" type="button" aria-label="Close player">⌄</button>
        </div>

        <img class="chaos-current-mega-cover" data-cover alt="">

        <div class="chaos-current-mega-meta">
          <div class="chaos-current-mega-title" data-title>#chaoscore</div>
          <div class="chaos-current-artist chaos-current-mega-artist" data-artist>Douglas Busta</div>
        </div>

        <div class="chaos-current-mega-progress-area">
          <div class="chaos-current-progress chaos-current-mega-progress" data-progress>
            <div class="chaos-current-fill" data-fill></div>
          </div>
          <div class="chaos-current-time-row">
            <span data-current>0:00</span>
            <span data-duration>0:00</span>
          </div>
        </div>

        <div class="chaos-current-controls chaos-current-mega-controls">
          <button class="chaos-current-btn" data-action="prev" type="button" aria-label="Previous">‹</button>
          <button class="chaos-current-btn" data-action="play" type="button" aria-label="Play" data-play>▶</button>
          <button class="chaos-current-btn" data-action="next" type="button" aria-label="Next">›</button>
        </div>

        <div class="chaos-current-volume">
          <button class="chaos-current-btn" data-action="mute" type="button" data-mute>MUTE</button>
          <input data-volume type="range" min="0" max="1" step="0.01" value="1">
          <span data-volume-label>100</span>
        </div>

        <div class="chaos-current-status">
          Same player. Same audio. Same queue.
        </div>
      </div>
    `;

    section.appendChild(shell);
    player = shell;

  }
  async function play() {
    if (!audio) return;

    if (!audio.src) {
      loadTrack(state.index, false);
    }

    try {
      await audio.play();
    } catch (error) {
      console.warn("[chaos current player v2] play blocked", error);
    }

    render();
  }

  function pause() {
    if (!audio) return;
    audio.pause();
    render();
  }

  function togglePlay() {
    if (!audio) return;
    if (audio.paused) play();
    else pause();
  }

  function loadTrack(index, autoplay = true) {
    if (!state.tracks.length || !audio) return;

    const safeIndex = Math.max(0, Math.min(index, state.tracks.length - 1));
    state.index = safeIndex;

    const track = currentTrack();
    if (!track || !track.src) return;

    const target = absoluteUrl(track.src);

    if (audio.src !== target) {
      audio.pause();
      audio.src = track.src;
      audio.load();
    }

    render();

    if (autoplay) play();
  }

  function nextTrack() {
    inferIndexFromAudio();

    if (state.index >= state.tracks.length - 1) {
      pause();
      if (audio) audio.currentTime = 0;
      render();
      return;
    }

    loadTrack(state.index + 1, true);
  }

  function previousTrack() {
    if (!audio) return;

    inferIndexFromAudio();

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      render();
      return;
    }

    loadTrack(Math.max(0, state.index - 1), true);
  }

  function seek(event, bar) {
    if (!audio || !audio.duration) return;

    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));

    audio.currentTime = ratio * audio.duration;
    render();
  }

  function setExpanded(value) {
    state.expanded = Boolean(value);
    if (player) player.dataset.expanded = String(state.expanded);
    render();
  }

  function setVolume(value) {
    if (!audio) return;

    const safeValue = Math.max(0, Math.min(1, Number(value)));
    audio.volume = safeValue;
    audio.muted = safeValue === 0;
    render();
  }

  function toggleMute() {
    if (!audio) return;
    audio.muted = !audio.muted;
    render();
  }
  function render() {
    if (!player || !audio) return;

    inferIndexFromAudio();

    const track = currentTrack();
    const title = track?.title || "#chaoscore";
    const artist = displayArtists(track);
    const current = audio.currentTime || 0;
    const duration = audio.duration || 0;
    const pct = duration ? (current / duration) * 100 : 0;

    player.dataset.expanded = String(state.expanded);

    $all("[data-title]", player).forEach((el) => el.textContent = title);
    $all("[data-artist]", player).forEach((el) => el.textContent = artist);

    $all("[data-cover]", player).forEach((el) => {
      if (state.cover && el.src !== state.cover) el.src = state.cover;
    });

    $all("[data-play]", player).forEach((el) => {
      el.textContent = audio.paused ? "▶" : "Ⅱ";
      el.setAttribute("aria-label", audio.paused ? "Play" : "Pause");
    });

    $all("[data-fill]", player).forEach((el) => {
      el.style.width = `${pct}%`;
    });

    $all("[data-current]", player).forEach((el) => el.textContent = fmt(current));
    $all("[data-duration]", player).forEach((el) => el.textContent = fmt(duration));

    $all("[data-volume]", player).forEach((el) => {
      if (document.activeElement !== el) el.value = String(audio.volume);
    });

    $all("[data-volume-label]", player).forEach((el) => {
      el.textContent = audio.muted ? "MUTE" : String(Math.round(audio.volume * 100));
    });

    $all("[data-mute]", player).forEach((el) => {
      el.textContent = audio.muted ? "UNMUTE" : "MUTE";
    });
  }

  function bind() {
    section.addEventListener("click", function (event) {
      const actionEl = event.target.closest("[data-action]");
      if (!actionEl) return;

      const action = actionEl.dataset.action;

      event.preventDefault();
      event.stopPropagation();

      if (action === "play") togglePlay();
      if (action === "prev") previousTrack();
      if (action === "next") nextTrack();
      if (action === "expand") setExpanded(true);
      if (action === "collapse") setExpanded(false);
      if (action === "mute") toggleMute();
    });

    section.addEventListener("click", function (event) {
      const bar = event.target.closest("[data-progress]");
      if (!bar) return;

      event.preventDefault();
      seek(event, bar);
    });

    section.addEventListener("input", function (event) {
      const volume = event.target.closest("[data-volume]");
      if (!volume) return;

      setVolume(volume.value);
    });
    /* Back to Busta Files overlay disattivato: il link torna a comportarsi normalmente. */

    if (audio) {
      audio.addEventListener("play", render);
      audio.addEventListener("pause", render);
      audio.addEventListener("timeupdate", render);
      audio.addEventListener("durationchange", render);
      audio.addEventListener("loadedmetadata", render);
      audio.addEventListener("volumechange", render);

      audio.addEventListener("ended", function () {
        nextTrack();
      });
    }
  }

  function boot() {
    if (!window.CHAOSCORE_TRACKS || !window.CHAOSCORE_TRACKS.length) {
      console.warn("[chaos current player v2] missing CHAOSCORE_TRACKS");
    }

    buildPlayer();
    bind();

    if (state.tracks.length && audio && !audio.src) {
      loadTrack(0, false);
    }

    document.body.classList.add("chaos-current-player-v2-ready");

    state.ready = true;

    window.ChaosCurrentPlayerV2 = {
      state,
      play,
      pause,
      togglePlay,
      nextTrack,
      previousTrack,
      loadTrack,
      setExpanded
    };

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
