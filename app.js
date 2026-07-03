(function () {
  const config = window.CHAOSCORE_LIBRARY;

  if (!config) {
    throw new Error("Missing CHAOSCORE_LIBRARY config.");
  }

  const trackList = document.getElementById("track-list");
  const audio = document.getElementById("audio-player");
  const nowTitle = document.getElementById("now-title");
  const nowSubtitle = document.getElementById("now-subtitle");
  const albumMeta = document.getElementById("album-meta");
  const playButton = document.querySelector('[data-action="play"]');
  const heroPlayButton = document.getElementById("hero-play");
  const prevButton = document.querySelector('[data-action="prev"]');
  const nextButton = document.querySelector('[data-action="next"]');
  const shuffleButton = document.querySelector('[data-action="shuffle"]');
  const repeatButton = document.querySelector('[data-action="repeat"]');
  const muteButton = document.getElementById("mute-button");
  const menuButton = document.getElementById("menu-button");
  const volumeSlider = document.getElementById("volume-slider");
  const seekbar = document.getElementById("seekbar");
  const timeReadout = document.getElementById("time-readout");
  const copyLinkButton = document.getElementById("copy-link");
  const contentInfoButton = document.getElementById("content-info");
  const contentInfoSecondaryButton = document.getElementById("content-info-secondary");
  const contentInfoMiniButton = document.getElementById("content-info-mini");
  const installAndroidButton = document.getElementById("install-android");
  const installIosButton = document.getElementById("install-ios");
  const installSheet = document.getElementById("install-sheet");
  const installTitle = document.getElementById("install-title");
  const installCopy = document.getElementById("install-copy");
  const installClose = document.getElementById("install-close");
  const waveform = document.getElementById("waveform");
  const waveformWrap = document.getElementById("waveform-wrap");
  const waveformTooltip = document.getElementById("waveform-tooltip");

  let activeIndex = 0;
  let shuffleEnabled = false;
  let repeatMode = "off";
  let isScrubbing = false;
  let deferredInstallPrompt = null;

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function isInStandaloneMode() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function openInstallSheet(message) {
    installTitle.textContent = "Installa #chaoscore";
    installCopy.textContent = message;
    installSheet.hidden = false;
  }

  function openContentSheet() {
    installTitle.textContent = "Contenuto privato";
    installCopy.textContent =
      "La base installabile del sito e' pronta. Audio completi e bundle album verranno collegati in seguito da una sorgente esterna privata.";
    installSheet.hidden = false;
  }

  function updateAlbumMeta() {
    const totalSeconds = config.tracks.reduce(
      (sum, track) => sum + (track.durationSeconds || 0),
      0
    );
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.round(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    albumMeta.textContent = `DouglasBusta · ${config.tracks.length} tracks · ${mins}m ${secs}s`;
  }

  function updatePlaybackButtons() {
    const icon = audio.paused ? "▶" : "❚❚";
    playButton.textContent = icon;
    heroPlayButton.textContent = icon;
    muteButton.textContent = audio.muted ? "🔇" : "🔊";
  }

  function updateTimeReadout(current, total) {
    timeReadout.textContent = `${formatTime(current)} / ${formatTime(total)}`;
  }

  function renderWaveform(track, progress) {
    const peaks = track.peaks || [];
    waveform.innerHTML = "";

    peaks.forEach((peak, index) => {
      const bar = document.createElement("span");
      bar.className = "waveform-bar";
      bar.style.setProperty("--bar-height", String(peak));
      if ((index + 1) / peaks.length <= progress) {
        bar.classList.add("is-played");
      }
      waveform.append(bar);
    });
  }

  function loadTrack(index, shouldAutoplay) {
    const track = config.tracks[index];
    if (!track) return;

    activeIndex = index;
    audio.pause();
    if (track.file) {
      audio.src = track.file;
      audio.load();
    } else {
      audio.removeAttribute("src");
      audio.load();
    }
    nowTitle.textContent = track.title.replace(/^\d+\.\s*/, "");
    nowSubtitle.textContent = "#chaoscore";
    seekbar.value = "0";
    updateTimeReadout(0, track.durationSeconds);
    renderWaveform(track, 0);
    renderTracks();

    if (shouldAutoplay) {
      if (!track.file) {
        nowSubtitle.textContent = "Audio privato non ancora collegato in questa build.";
        updatePlaybackButtons();
        return;
      }
      audio.play().catch(() => {
        nowSubtitle.textContent = "Impossibile riprodurre il file in questo momento.";
      });
    } else {
      updatePlaybackButtons();
    }
  }

  function togglePlayback() {
    if (!config.tracks[activeIndex]?.file) {
      nowSubtitle.textContent = "Audio privato non ancora collegato in questa build.";
      return;
    }

    if (!audio.src) {
      loadTrack(activeIndex, true);
      return;
    }

    if (audio.paused) {
      audio.play().catch(() => {
        nowSubtitle.textContent = "Impossibile riprodurre il file in questo momento.";
      });
    } else {
      audio.pause();
    }
  }

  function getNextIndex(direction) {
    if (shuffleEnabled) {
      if (config.tracks.length <= 1) return activeIndex;
      let nextIndex = activeIndex;
      while (nextIndex === activeIndex) {
        nextIndex = Math.floor(Math.random() * config.tracks.length);
      }
      return nextIndex;
    }

    if (direction === "prev") {
      return (activeIndex - 1 + config.tracks.length) % config.tracks.length;
    }

    return (activeIndex + 1) % config.tracks.length;
  }

  function renderTracks() {
    trackList.innerHTML = "";

    config.tracks.forEach((track, index) => {
      const item = document.createElement("article");
      item.className = `track-item${index === activeIndex ? " is-active" : ""}`;
      item.addEventListener("dblclick", () => loadTrack(index, true));

      const number = document.createElement("div");
      number.className = "track-number";
      number.textContent = String(index + 1);

      const play = document.createElement("button");
      play.type = "button";
      play.className = "track-play";
      play.textContent = "▶";
      play.setAttribute("aria-label", `Riproduci ${track.title}`);
      play.addEventListener("click", () => loadTrack(index, true));
      play.disabled = !track.file;

      const copy = document.createElement("div");
      copy.className = "track-copy";
      copy.innerHTML = `
        <span class="track-title">${track.title.replace(/^\d+\.\s*/, "")}</span>
        <div class="track-subtitle">${track.file ? "#chaoscore" : "audio privato in arrivo"}</div>
      `;

      const duration = document.createElement("div");
      duration.className = "track-duration";
      duration.textContent = formatTime(track.durationSeconds);
      item.append(number, play, copy, duration);
      trackList.append(item);
    });
  }

  function setPlaybackPositionFromClientX(clientX) {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = waveformWrap.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = ratio * audio.duration;
    seekbar.value = String(ratio * 100);
    updateTimeReadout(audio.currentTime, audio.duration);
    renderWaveform(config.tracks[activeIndex], ratio);
  }

  function updateWaveformTooltip(clientX) {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = waveformWrap.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    waveformTooltip.hidden = false;
    waveformTooltip.textContent = formatTime(ratio * audio.duration);
    waveformTooltip.style.left = `${clientX - rect.left}px`;
  }

  playButton.addEventListener("click", togglePlayback);
  heroPlayButton.addEventListener("click", togglePlayback);

  prevButton.addEventListener("click", () => {
    loadTrack(getNextIndex("prev"), true);
  });

  nextButton.addEventListener("click", () => {
    loadTrack(getNextIndex("next"), true);
  });

  shuffleButton.addEventListener("click", () => {
    shuffleEnabled = !shuffleEnabled;
    shuffleButton.classList.toggle("is-active", shuffleEnabled);
  });

  repeatButton.addEventListener("click", () => {
    repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
    repeatButton.classList.toggle("is-active", repeatMode !== "off");
    repeatButton.textContent = repeatMode === "one" ? "1" : "↻";
  });

  muteButton.addEventListener("click", () => {
    audio.muted = !audio.muted;
    if (!audio.muted && audio.volume === 0) {
      audio.volume = 1;
      volumeSlider.value = "100";
    }
    updatePlaybackButtons();
  });

  menuButton.addEventListener("click", () => {
    document.querySelector(".track-item.is-active")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });

  audio.addEventListener("play", updatePlaybackButtons);
  audio.addEventListener("pause", updatePlaybackButtons);
  audio.addEventListener("loadedmetadata", () => {
    updateTimeReadout(audio.currentTime, audio.duration);
  });
  audio.addEventListener("timeupdate", () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const progress = audio.currentTime / audio.duration;
    seekbar.value = String(progress * 100);
    updateTimeReadout(audio.currentTime, audio.duration);
    if (!isScrubbing) {
      renderWaveform(config.tracks[activeIndex], progress);
    }
  });
  audio.addEventListener("ended", () => {
    if (repeatMode === "one") {
      loadTrack(activeIndex, true);
      return;
    }

    loadTrack(getNextIndex("next"), repeatMode !== "off" || shuffleEnabled);
  });

  seekbar.addEventListener("input", () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = (Number(seekbar.value) / 100) * audio.duration;
  });

  waveformWrap.addEventListener("pointerdown", (event) => {
    isScrubbing = true;
    waveformWrap.setPointerCapture(event.pointerId);
    setPlaybackPositionFromClientX(event.clientX);
    updateWaveformTooltip(event.clientX);
  });

  waveformWrap.addEventListener("pointermove", (event) => {
    updateWaveformTooltip(event.clientX);
    if (isScrubbing) {
      setPlaybackPositionFromClientX(event.clientX);
    }
  });

  waveformWrap.addEventListener("pointerup", (event) => {
    if (isScrubbing) {
      setPlaybackPositionFromClientX(event.clientX);
    }
    isScrubbing = false;
  });

  waveformWrap.addEventListener("pointerleave", () => {
    waveformTooltip.hidden = true;
  });

  volumeSlider.addEventListener("input", () => {
    const volume = Number(volumeSlider.value) / 100;
    audio.volume = volume;
    audio.muted = volume === 0;
    updatePlaybackButtons();
  });

  copyLinkButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copyLinkButton.textContent = "+ link copiato";
      window.setTimeout(() => {
        copyLinkButton.textContent = "+ copia link privato";
      }, 1600);
    } catch (_error) {
      copyLinkButton.textContent = "+ copia manuale";
    }
  });

  installAndroidButton.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      installAndroidButton.textContent = "app pronta";
      return;
    }

    openInstallSheet("Su Android apri il menu del browser e scegli “Installa app” oppure “Aggiungi a schermata Home”. Per un APK vero serve un packaging separato.");
  });

  installIosButton.addEventListener("click", () => {
    openInstallSheet("Su iPhone apri questo link in Safari, tocca Condividi e poi “Aggiungi alla schermata Home”.");
  });

  [contentInfoButton, contentInfoSecondaryButton, contentInfoMiniButton].forEach((button) => {
    button.addEventListener("click", openContentSheet);
  });

  installClose.addEventListener("click", () => {
    installSheet.hidden = true;
  });

  installSheet.addEventListener("click", (event) => {
    if (event.target === installSheet) {
      installSheet.hidden = true;
    }
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installAndroidButton.textContent = "installa android";
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => null);
    });
  }

  updateAlbumMeta();
  audio.volume = 1;
  if (isInStandaloneMode()) {
    installAndroidButton.hidden = true;
    installIosButton.hidden = true;
  }
  renderTracks();
  loadTrack(0, false);
})();
