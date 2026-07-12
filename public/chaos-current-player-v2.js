(function () {
  "use strict";

  if (window.__CHAOS_CURRENT_PLAYER_V2_ACTIVE) {
    console.warn("[chaos current player v2] second player blocked");
    return;
  }

  window.__CHAOS_CURRENT_PLAYER_V2_ACTIVE = true;
  window.__CHAOS_CURRENT_PLAYER_V2_BOOT_COUNT = (window.__CHAOS_CURRENT_PLAYER_V2_BOOT_COUNT || 0) + 1;

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

  function ensureLookAppGlobalView() {
    if (document.getElementById("look-app-global-view")) return;

    const view = document.createElement("div");
    view.id = "look-app-global-view";
    view.innerHTML = '<iframe id="look-app-global-frame" src="about:blank" title="Busta Files"></iframe>';

    document.body.appendChild(view);

    const frame = document.getElementById("look-app-global-frame");
    frame.addEventListener("load", patchLookAppGlobalFrame);
  }

  function openLookAppGlobalView() {
    ensureLookAppGlobalView();

    const frame = document.getElementById("look-app-global-frame");
    if (frame && frame.src === "about:blank") {
      frame.src = "/exclusive";
    }

    document.body.classList.add("look-app-global-view-open");
    setExpanded(false);

    setTimeout(patchLookAppGlobalFrame, 350);
    setTimeout(patchLookAppGlobalFrame, 1000);
  }

  function closeLookAppGlobalView() {
    document.body.classList.remove("look-app-global-view-open");

    const frame = document.getElementById("look-app-global-frame");
    if (frame) {
      frame.src = "about:blank";
    }
  }

  function patchLookAppGlobalFrame() {
    const frame = document.getElementById("look-app-global-frame");
    if (!frame) return;

    let doc;
    let href = "";

    try {
      doc = frame.contentDocument;
      href = frame.contentWindow.location.href.toLowerCase();
    } catch (_) {
      return;
    }

    if (!doc) return;

    /*
      Se dentro la vista provano ad aprire chaoscore, non carichiamo una seconda
      pagina chaoscore dentro chaoscore: chiudiamo la vista e teniamo il PIP vivo.
    */
    if (href.includes("/chaoscore") || href.includes("chaoscore.html")) {
      closeLookAppGlobalView();
      return;
    }

    /*
      Dentro Busta Files non deve vivere nessun player suo.
      Il player vero è solo quello fuori, in section.player.
    */
    function removeFramePlayers() {
      doc.querySelectorAll([
        "audio",
        "section.player",
        ".player",
        "[id*='player']",
        "[class*='player']",
        "[id*='mini']",
        "[class*='mini']",
        "[id*='persistent']",
        "[class*='persistent']"
      ].join(",")).forEach((el) => {
        try {
          el.remove();
        } catch (_) {
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("pointer-events", "none", "important");
        }
      });
    }

    removeFramePlayers();
    setTimeout(removeFramePlayers, 350);
    setTimeout(removeFramePlayers, 1000);

    if (!doc.__lookAppNoFramePlayerObserver) {
      doc.__lookAppNoFramePlayerObserver = true;

      const observer = new MutationObserver(removeFramePlayers);
      observer.observe(doc.documentElement, {
        childList: true,
        subtree: true
      });
    }

    /*
      Se clicchi un link chaoscore dentro Busta Files, chiudiamo la vista.
      Non creiamo nessun tasto return-to-chaoscore.
    */
    if (!doc.__lookAppChaosLinkInterceptor) {
      doc.__lookAppChaosLinkInterceptor = true;

      doc.addEventListener("click", function (event) {
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
          text.includes("chaoscore") ||
          href.includes("/chaoscore") ||
          href.includes("chaoscore.html")
        ) {
          event.preventDefault();
          event.stopPropagation();
          closeLookAppGlobalView();
        }
      }, true);
    }
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
    if (!state.tracks.length) return;

    const currentIndex = Math.max(0, Math.min(state.index, state.tracks.length - 1));
    const nextIndex = currentIndex + 1;

    if (nextIndex >= state.tracks.length) {
      pause();
      if (audio) audio.currentTime = 0;
      render();
      return;
    }

    loadTrack(nextIndex, true);
  }

  function previousTrack() {
    if (!audio || !state.tracks.length) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      render();
      return;
    }

    const currentIndex = Math.max(0, Math.min(state.index, state.tracks.length - 1));
    loadTrack(Math.max(0, currentIndex - 1), true);
  }

  function parseDurationSeconds(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value !== "string") return 0;

    const parts = value.trim().split(":").map((part) => Number(part));

    if (parts.some((part) => !Number.isFinite(part))) return 0;

    if (parts.length === 2) {
      return (parts[0] * 60) + parts[1];
    }

    if (parts.length === 3) {
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }

    return 0;
  }

  function effectiveDuration() {
    if (!audio) return 0;

    const track = currentTrack();
    const realDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const listedDuration = parseDurationSeconds(
      track?.duration ||
      track?.time ||
      track?.length ||
      track?.displayDuration
    );

    return Math.max(realDuration, listedDuration, 0);
  }

  function seekByClientX(clientX, bar) {
    if (!audio || !bar) return;

    const duration = effectiveDuration();

    if (!duration) return;

    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));

    audio.currentTime = ratio * duration;
    render();
  }

  function seek(event, bar) {
    seekByClientX(event.clientX, bar);
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
    syncLegacyTrackButtons();
    if (!player || !audio) return;

    const track = currentTrack();
    const title = track?.title || "#chaoscore";
    const artist = displayArtists(track);
    const current = audio.currentTime || 0;
    const duration = effectiveDuration();
    const pct = duration ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0;

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

  function getLegacyTrackRows() {
    return Array.from(document.querySelectorAll("#tracks .track, .tracks .track, .track"));
  }

  function getLegacyTrackIndex(target) {
    const row = target.closest(".track");
    if (!row) return -1;

    return getLegacyTrackRows().indexOf(row);
  }

  function setLegacyButtonState(button, isPlaying) {
    if (!button) return;

    button.dataset.chaosLegacyBridge = "1";
    button.setAttribute("data-chaos-legacy-bridge", "1");
    button.dataset.playing = isPlaying ? "1" : "0";
    button.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    button.setAttribute("aria-label", isPlaying ? "Pause track" : "Play track");

    button.classList.toggle("playing", isPlaying);
    button.classList.toggle("is-playing", isPlaying);

    // Mantiene l'icona originale semplice: triangolo quando è ferma, due barre quando suona.
    if (
      button.classList.contains("play-small") ||
      button.id === "play" ||
      button.id === "hero-play"
    ) {
      const nextIcon = isPlaying ? "Ⅱ" : "▶";
      if (button.textContent.trim() !== nextIcon) {
        button.textContent = nextIcon;
      }
    }
  }

  function syncLegacyTrackButtons() {
    const rows = getLegacyTrackRows();

    rows.forEach((row, index) => {
      const isActive = index === state.index;
      const isPlaying = isActive && Boolean(audio && !audio.paused && !audio.ended);

      row.classList.toggle("active", isActive);
      row.classList.toggle("playing", isPlaying);
      row.classList.toggle("is-playing", isPlaying);

      setLegacyButtonState(row.querySelector(".play-small"), isPlaying);
    });

    const mainIsPlaying = Boolean(audio && !audio.paused && !audio.ended);

    setLegacyButtonState(document.getElementById("play"), mainIsPlaying);
    setLegacyButtonState(document.getElementById("hero-play"), mainIsPlaying);
  }

  function handleLegacyPlayClick(event) {
    const legacyControl = event.target.closest(".play-small, #hero-play, #play, #prev, #next, #tracks .track, .tracks .track");

    if (!legacyControl) return false;

    const isInsideNewPlayer = legacyControl.closest(".chaos-current-player, [data-chaos-current-player]");
    if (isInsideNewPlayer) return false;

    event.preventDefault();
    event.stopPropagation();

    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }

    if (legacyControl.id === "prev") {
      previousTrack();
      requestAnimationFrame(syncLegacyTrackButtons);
      return true;
    }

    if (legacyControl.id === "next") {
      nextTrack();
      requestAnimationFrame(syncLegacyTrackButtons);
      return true;
    }

    if (legacyControl.id === "hero-play" || legacyControl.id === "play") {
      const actuallyPlaying = Boolean(audio && !audio.paused && !audio.ended);

      if (actuallyPlaying || state.isPlaying) {
        pause();
      } else {
        play();
      }

      requestAnimationFrame(syncLegacyTrackButtons);
      return true;
    }

    const index = getLegacyTrackIndex(legacyControl);

    if (index < 0) return false;

    const sameTrack = index === state.index;
    const actuallyPlaying = Boolean(audio && !audio.paused && !audio.ended);

    if (sameTrack && (actuallyPlaying || state.isPlaying)) {
      pause();
    } else if (sameTrack) {
      play();
    } else {
      loadTrack(index, true);
    }

    requestAnimationFrame(syncLegacyTrackButtons);
    return true;
  }

  function bind() {
    document.addEventListener("click", handleLegacyPlayClick, true);
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

    section.addEventListener("pointerdown", function (event) {
      const bar = event.target.closest("[data-progress]");
      if (!bar) return;

      event.preventDefault();
      event.stopPropagation();

      let active = true;

      if (bar.setPointerCapture && event.pointerId != null) {
        try {
          bar.setPointerCapture(event.pointerId);
        } catch (_error) {}
      }

      seekByClientX(event.clientX, bar);

      const move = (moveEvent) => {
        if (!active) return;
        moveEvent.preventDefault();
        seekByClientX(moveEvent.clientX, bar);
      };

      const stop = () => {
        active = false;
        document.removeEventListener("pointermove", move, { capture: true });
        document.removeEventListener("pointerup", stop, { capture: true });
        document.removeEventListener("pointercancel", stop, { capture: true });
      };

      document.addEventListener("pointermove", move, { capture: true, passive: false });
      document.addEventListener("pointerup", stop, { capture: true });
      document.addEventListener("pointercancel", stop, { capture: true });
    }, { passive: false });

    section.addEventListener("input", function (event) {
      const volume = event.target.closest("[data-volume]");
      if (!volume) return;

      setVolume(volume.value);
    });
document.addEventListener("click", function (event) {
      const target = event.target.closest("a, button, [role='button']");
      if (!target || target.closest("section.player")) return;

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
        openLookAppGlobalView();
      }
    }, true);

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
    ensureLookAppGlobalView();

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
