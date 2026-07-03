import { fallbackAlbumSettings, fallbackTracks } from "./data/library.js";

const publicConfig = window.CHAOSCORE_PUBLIC_CONFIG || {};
const SUPABASE_URL = publicConfig.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = publicConfig.VITE_SUPABASE_ANON_KEY || "";
const ACCESS_STORAGE_KEY = "chaoscore-access-ok";

const els = {
  albumArt: document.getElementById("album-art"),
  albumTitle: document.getElementById("album-title"),
  albumMeta: document.getElementById("album-meta"),
  releaseNote: document.getElementById("release-note"),
  trackList: document.getElementById("track-list"),
  emptyState: document.getElementById("empty-state"),
  audio: document.getElementById("audio-player"),
  nowTitle: document.getElementById("now-title"),
  nowSubtitle: document.getElementById("now-subtitle"),
  miniPlayerArt: document.getElementById("mini-player-art"),
  playButton: document.querySelector('[data-action="play"]'),
  heroPlayButton: document.getElementById("hero-play"),
  prevButton: document.querySelector('[data-action="prev"]'),
  nextButton: document.querySelector('[data-action="next"]'),
  shuffleButton: document.querySelector('[data-action="shuffle"]'),
  repeatButton: document.querySelector('[data-action="repeat"]'),
  muteButton: document.getElementById("mute-button"),
  menuButton: document.getElementById("menu-button"),
  volumeSlider: document.getElementById("volume-slider"),
  timeReadout: document.getElementById("time-readout"),
  copyLinkButton: document.getElementById("copy-link"),
  refreshDataButton: document.getElementById("refresh-data"),
  installAppButton: document.getElementById("install-app"),
  installIosButton: document.getElementById("install-ios"),
  waveform: document.getElementById("waveform"),
  waveformWrap: document.getElementById("waveform-wrap"),
  waveformTooltip: document.getElementById("waveform-tooltip"),
  seekbar: document.getElementById("seekbar"),
  sheet: document.getElementById("sheet"),
  sheetTitle: document.getElementById("sheet-title"),
  sheetCopy: document.getElementById("sheet-copy"),
  sheetClose: document.getElementById("sheet-close"),
  dataStatus: document.getElementById("data-status"),
  audioStatus: document.getElementById("audio-status"),
  accessCard: document.getElementById("access-card"),
  accessForm: document.getElementById("access-form"),
  accessCode: document.getElementById("access-code"),
  accessStatus: document.getElementById("access-status")
};

const state = {
  supabase: null,
  album: { ...fallbackAlbumSettings },
  tracks: [...fallbackTracks],
  activeIndex: 0,
  shuffleEnabled: false,
  repeatMode: "off",
  isScrubbing: false,
  deferredInstallPrompt: null,
  accessGranted: false,
  isPrivate: false
};

let supabaseModulePromise = null;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function parseDuration(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const parts = value.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function sanitizeTrack(track, index) {
  const durationSeconds =
    track.durationSeconds ?? parseDuration(track.duration ?? track.length);

  return {
    id: track.id ?? `track-${index + 1}`,
    trackNumber: track.trackNumber ?? track.track_number ?? index + 1,
    title: track.title,
    duration: track.duration || formatTime(durationSeconds),
    durationSeconds,
    audioUrl: track.audioUrl ?? track.audio_url ?? "",
    downloadUrl: track.downloadUrl ?? track.download_url ?? "",
    lyrics: track.lyrics ?? "",
    credits: track.credits ?? track.meta ?? "",
    isActive: track.isActive ?? track.is_active ?? true,
    peaks: Array.isArray(track.peaks) && track.peaks.length ? track.peaks : fallbackTracks[index]?.peaks || fallbackTracks[0].peaks
  };
}

async function loadSupabaseModule() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!supabaseModulePromise) {
    supabaseModulePromise = import("https://esm.sh/@supabase/supabase-js@2.54.0");
  }
  return supabaseModulePromise;
}

async function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!state.supabase) {
    const supabaseModule = await loadSupabaseModule();
    if (!supabaseModule) return null;
    const { createClient } = supabaseModule;
    state.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return state.supabase;
}

function showSheet(title, copy) {
  els.sheetTitle.textContent = title;
  els.sheetCopy.textContent = copy;
  els.sheet.classList.add("is-manual-sheet");
  els.sheet.hidden = false;
  document.body.classList.add("sheet-open");
}

function closeSheet() {
  els.sheet.hidden = true;
  els.sheet.classList.remove("is-manual-sheet");
  document.body.classList.remove("sheet-open");
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function updateInstallUI() {
  if (els.installAppButton) {
    els.installAppButton.hidden = true;
    els.installAppButton.style.display = "none";
  }

  if (els.installIosButton) {
    els.installIosButton.hidden = true;
    els.installIosButton.style.display = "none";
  }
}

function setupDownloadActions() {
  if (!els.albumArt) return;

  // Nasconde definitivamente i vecchi bottoni installazione originali.
  // I vecchi bottoni restano nel DOM solo come fallback tecnico, ma non si vedono più.
  if (els.installAppButton) {
    els.installAppButton.hidden = true;
    els.installAppButton.style.display = "none";
  }

  if (els.installIosButton) {
    els.installIosButton.hidden = true;
    els.installIosButton.style.display = "none";
  }

  const coverParent = els.albumArt.parentElement;
  if (!coverParent) return;

  let actions = document.getElementById("hero-download-actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.id = "hero-download-actions";
    actions.className = "hero-download-actions";
    coverParent.appendChild(actions);
  }

  actions.innerHTML = "";

  const iosButton = document.createElement("button");
  iosButton.type = "button";
  iosButton.className = "hero-download-button";
  iosButton.innerHTML = '<span class="download-icon"></span><span>Download iOS</span>';
  iosButton.addEventListener("click", () => {
    showSheet(
      "Download iOS",
      "Su iPhone apri questo sito in Safari, tocca Condividi e poi “Aggiungi alla schermata Home”. Non e' un file sospetto: e' il sito #chaoscore installato come app."
    );
  });

  const androidButton = document.createElement("button");
  androidButton.type = "button";
  androidButton.className = "hero-download-button";
  androidButton.innerHTML = '<span class="download-icon">🤖</span><span>Download Android</span>';
  androidButton.addEventListener("click", async () => {
    if (state.deferredInstallPrompt) {
      state.deferredInstallPrompt.prompt();
      await state.deferredInstallPrompt.userChoice.catch(() => null);
      state.deferredInstallPrompt = null;
      showSheet(
        "Download Android",
        "Installazione avviata. Se il browser non mostra il prompt, usa il menu di Chrome e scegli “Installa app”."
      );
      return;
    }

    showSheet(
      "Download Android",
      "Su Android apri il menu del browser e scegli “Installa app” o “Aggiungi a schermata Home”. Non e' un APK: e' il sito #chaoscore installato come app sicura."
    );
  });

  const contentButton = document.createElement("button");
  contentButton.type = "button";
  contentButton.id = "download-content";
  contentButton.className = "hero-download-button hero-download-button--content";
  contentButton.innerHTML = '<span class="download-icon">⬇</span><span>Download contenuto</span>';
  contentButton.addEventListener("click", () => {
    const url =
      publicConfig.CONTENT_DOWNLOAD_URL ||
      publicConfig.contentDownloadUrl ||
      state.album.downloadUrl ||
      state.album.download_url ||
      "";

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    showSheet(
      "Download contenuto",
      "Il pacchetto download non e' ancora collegato. Carica il contenuto su uno storage esterno e inserisci il link in public-config.js o nel database."
    );
  });

  actions.append(iosButton, androidButton, contentButton);
}

function updatePlaybackButtons() {
  const icon = els.audio.paused ? "▶" : "❚❚";
  els.playButton.textContent = icon;
  els.heroPlayButton.textContent = icon;
  els.muteButton.textContent = els.audio.muted || els.audio.volume === 0 ? "🔇" : "🔊";
}

function updateTimeReadout(current, total) {
  els.timeReadout.textContent = `${formatTime(current)} / ${formatTime(total)}`;
}

function renderWaveform(track, progress) {
  els.waveform.innerHTML = "";
  const peaks = track?.peaks || fallbackTracks[0].peaks;

  peaks.forEach((peak, index) => {
    const bar = document.createElement("span");
    bar.className = "waveform-bar";
    bar.style.setProperty("--bar-height", String(peak));
    if ((index + 1) / peaks.length <= progress) {
      bar.classList.add("is-played");
    }
    els.waveform.append(bar);
  });
}

function getPlayableTracks() {
  return state.tracks.filter((track) => Boolean(track.audioUrl));
}

function updateAlbumUI() {
  const totalSeconds = state.tracks.reduce(
    (sum, track) => sum + (track.durationSeconds || 0),
    0
  );

  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  document.title = state.album.title || "#chaoscore";
  els.albumTitle.textContent = state.album.title || "#chaoscore";
  els.albumMeta.textContent = `${state.album.artist || "DouglasBusta"} · ${state.tracks.length} tracks · ${mins}m ${secs}s`;
  els.releaseNote.textContent =
    state.album.releaseNote ||
    state.album.release_note ||
    "Player privato installabile con contenuti caricati da sorgenti esterne.";

  const cover = state.album.coverUrl || state.album.cover_url || "./assets/chaoscore-spotify-cover.jpg";
  els.albumArt.src = cover || "./assets/chaoscore-spotify-cover.jpg";
  els.miniPlayerArt.src = cover || "./assets/chaoscore-spotify-cover.jpg";

  els.albumArt.onerror = () => {
    els.albumArt.src = "./assets/chaoscore-spotify-cover.jpg";
  };

  els.miniPlayerArt.onerror = () => {
    els.miniPlayerArt.src = "./assets/chaoscore-spotify-cover.jpg";
  };
}

function openFirstPlayableTrack() {
  const firstIndex = state.tracks.findIndex((track) => Boolean(track.audioUrl));
  if (firstIndex >= 0) {
    loadTrack(firstIndex, true);
    return;
  }
  els.nowSubtitle.textContent =
    "Nessun audio_url attivo disponibile. Collega gli URL esterni nel database.";
}

function renderTracks() {
  els.trackList.innerHTML = "";
  els.emptyState.hidden = state.tracks.length > 0;

  state.tracks.forEach((rawTrack, index) => {
    const track = sanitizeTrack(rawTrack, index);
    const isPlayable = Boolean(track.audioUrl);
    const isLocked = state.isPrivate && !state.accessGranted;

    const item = document.createElement("article");
    item.className = `track-item${index === state.activeIndex ? " is-active" : ""}${isLocked ? " is-locked" : ""}`;

    item.addEventListener("click", () => {
      state.activeIndex = index;
      renderTracks();
      updateNowPlaying(track, false);
    });


    item.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      openCreditsPopup(track);
    });

    item.addEventListener("dblclick", () => {
      if (isLocked) {
        showSheet("Accesso richiesto", "Inserisci prima il codice accesso per sbloccare la riproduzione privata.");
        return;
      }
      if (!isPlayable) {
        showSheet("Audio non collegato", "Audio non disponibile per questa traccia.");
        return;
      }
      loadTrack(index, true);
    });

    const number = document.createElement("div");
    number.className = "track-number";
    number.textContent = String(track.trackNumber);

    const play = document.createElement("button");
    play.type = "button";
    play.className = "track-play";
    play.textContent = index === state.activeIndex && !els.audio.paused ? "❚❚" : "▶";
    play.setAttribute("aria-label", `Riproduci ${track.title}`);
    play.disabled = !isPlayable || isLocked;
    play.addEventListener("click", (event) => {
      event.stopPropagation();
      if (index === state.activeIndex && els.audio.src) {
        togglePlayback();
        return;
      }
      loadTrack(index, true);
    });

    const copy = document.createElement("div");
    copy.className = "track-copy";
    copy.innerHTML = `
      <span class="track-title">${track.title}</span>
      <div class="track-subtitle">${isLocked ? "accesso richiesto" : track.credits || "#chaoscore"}</div>
    `;

    const duration = document.createElement("div");
    duration.className = "track-duration";
    duration.textContent = track.duration || formatTime(track.durationSeconds);
    duration.title = "Apri credits";
    duration.style.cursor = "pointer";
    duration.addEventListener("click", (event) => {
      event.stopPropagation();
      openCreditsPopup(track);
    });

    item.append(number, play, copy, duration);
    els.trackList.append(item);
  });
}

function updateNowPlaying(track, resetTime = true) {
  els.nowTitle.textContent = track.title;
  els.nowSubtitle.textContent = track.credits || "#chaoscore";
  if (resetTime) {
    updateTimeReadout(0, track.durationSeconds);
    renderWaveform(track, 0);
  }
}

function loadTrack(index, shouldAutoplay) {
  const track = sanitizeTrack(state.tracks[index], index);
  if (!track) return;

  state.activeIndex = index;
  updateNowPlaying(track);
  renderTracks();

  if (state.isPrivate && !state.accessGranted) {
    els.nowSubtitle.textContent = "Inserisci il codice per ascoltare i contenuti privati.";
    updatePlaybackButtons();
    return;
  }

  els.audio.pause();

  if (!track.audioUrl) {
    els.audio.removeAttribute("src");
    els.audio.load();
    els.audioStatus.textContent =
      "Questa traccia non ha ancora un audio_url esterno attivo.";
    updatePlaybackButtons();
    return;
  }

  els.audio.src = track.audioUrl;
  els.audio.load();
  els.audioStatus.textContent =
    "";

  if (shouldAutoplay) {
    els.audio
      .play()
      .then(updatePlaybackButtons)
      .catch(() => {
        els.nowSubtitle.textContent =
          "Riproduzione non avviata. Controlla l'URL audio o il browser.";
        updatePlaybackButtons();
      });
  } else {
    updatePlaybackButtons();
  }
}

function togglePlayback() {
  const currentTrack = sanitizeTrack(state.tracks[state.activeIndex], state.activeIndex);

  if (state.isPrivate && !state.accessGranted) {
    showSheet("Accesso richiesto", "Inserisci il codice per sbloccare la riproduzione privata.");
    return;
  }

  if (!currentTrack.audioUrl) {
    els.nowSubtitle.textContent =
      "Audio non disponibile per questa traccia.";
    return;
  }

  if (!els.audio.src) {
    loadTrack(state.activeIndex, true);
    return;
  }

  if (els.audio.paused) {
    els.audio.play().catch(() => {
      els.nowSubtitle.textContent =
        "Impossibile riprodurre il file in questo momento.";
    });
  } else {
    els.audio.pause();
  }
}

function getNextIndex(direction) {
  if (state.shuffleEnabled) {
    if (state.tracks.length <= 1) return state.activeIndex;
    let nextIndex = state.activeIndex;
    while (nextIndex === state.activeIndex) {
      nextIndex = Math.floor(Math.random() * state.tracks.length);
    }
    return nextIndex;
  }

  if (direction === "prev") {
    return (state.activeIndex - 1 + state.tracks.length) % state.tracks.length;
  }

  return (state.activeIndex + 1) % state.tracks.length;
}

function setPlaybackPositionFromClientX(clientX) {
  if (!Number.isFinite(els.audio.duration) || els.audio.duration <= 0) return;
  const rect = els.waveformWrap.getBoundingClientRect();
  const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  els.audio.currentTime = ratio * els.audio.duration;
  els.seekbar.value = String(ratio * 100);
  updateTimeReadout(els.audio.currentTime, els.audio.duration);
  renderWaveform(sanitizeTrack(state.tracks[state.activeIndex], state.activeIndex), ratio);
}

function updateWaveformTooltip(clientX) {
  if (!Number.isFinite(els.audio.duration) || els.audio.duration <= 0) return;
  const rect = els.waveformWrap.getBoundingClientRect();
  const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  els.waveformTooltip.hidden = false;
  els.waveformTooltip.textContent = formatTime(ratio * els.audio.duration);
  els.waveformTooltip.style.left = `${clientX - rect.left}px`;
}

async 
function getTrackCredits(track) {
  const cleanTrack = sanitizeTrack(track || state.tracks[state.activeIndex], state.activeIndex);
  return cleanTrack.credits || "Lyrics by Douglas Busta. Production by Douglas Busta. Mix & master by Douglas Busta.";
}

function openCreditsPopup(track = null) {
  const cleanTrack = sanitizeTrack(track || state.tracks[state.activeIndex], state.activeIndex);
  const title = cleanTrack?.title ? `Credits — ${cleanTrack.title}` : "Credits";
  const credits = getTrackCredits(cleanTrack);
  showSheet(title, credits);
}

async function validateAccessCode(code) {
  const client = await getSupabaseClient();
  if (!client) {
    return code.trim().toLowerCase() === "chaoscore";
  }

  const { data, error } = await client
    .from("access_codes")
    .select("id, label, is_active")
    .eq("code", code.trim())
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

function unlockPrivateAccess() {
  state.accessGranted = true;
  sessionStorage.setItem(ACCESS_STORAGE_KEY, "ok");
  els.accessStatus.textContent = "Accesso sbloccato.";
  renderTracks();
}

async function loadRemoteContent() {
  state.album = { ...fallbackAlbumSettings };
  state.tracks = [...fallbackTracks];
  state.isPrivate = false;

  if (els.dataStatus) {
    els.dataStatus.textContent = "";
    els.dataStatus.hidden = true;
  }

  if (els.audioStatus) {
    els.audioStatus.textContent = "";
    els.audioStatus.hidden = true;
  }
}

function syncPrivateState() {
  state.isPrivate = false;
  state.accessGranted = true;

  if (els.accessCard) {
    els.accessCard.hidden = true;
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // Temporaneamente disattivo la PWA cache per evitare versioni vecchie bloccate.
  window.addEventListener("load", async () => {
    const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
    registrations.forEach((registration) => registration.unregister());
  });
}

function bindEvents() {

  document.addEventListener("click", (event) => {
    const target = event.target.closest('a, button, [data-open-credits="true"]');
    if (!target) return;

    const text = (target.textContent || "").toLowerCase();
    const href = (target.getAttribute("href") || "").toLowerCase();

    if (
      target.matches('[data-open-credits="true"]') ||
      text.includes("credits") ||
      href.includes("credits")
    ) {
      event.preventDefault();
      openCreditsPopup();
    }
  });


  document.querySelectorAll('[data-open-credits="true"], a[href$="credits.html"], a[href="/credits"], a[href="./credits"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openCreditsPopup();
    });
  });

  els.playButton.addEventListener("click", togglePlayback);
  els.heroPlayButton.addEventListener("click", () => {
    if (!els.audio.src) {
      openFirstPlayableTrack();
      return;
    }
    togglePlayback();
  });

  els.prevButton.addEventListener("click", () => {
    loadTrack(getNextIndex("prev"), true);
  });

  els.nextButton.addEventListener("click", () => {
    loadTrack(getNextIndex("next"), true);
  });

  els.shuffleButton.addEventListener("click", () => {
    state.shuffleEnabled = !state.shuffleEnabled;
    els.shuffleButton.classList.toggle("is-active", state.shuffleEnabled);
  });

  els.repeatButton.addEventListener("click", () => {
    state.repeatMode =
      state.repeatMode === "off"
        ? "all"
        : state.repeatMode === "all"
          ? "one"
          : "off";
    els.repeatButton.classList.toggle("is-active", state.repeatMode !== "off");
    els.repeatButton.textContent = state.repeatMode === "one" ? "1" : "↻";
  });

  els.muteButton.addEventListener("click", () => {
    els.audio.muted = !els.audio.muted;
    if (!els.audio.muted && els.audio.volume === 0) {
      els.audio.volume = 1;
      els.volumeSlider.value = "100";
    }
    updatePlaybackButtons();
  });

  els.menuButton.addEventListener("click", () => {
    document.querySelector(".track-item.is-active")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });

  els.volumeSlider.addEventListener("input", () => {
    const volume = Number(els.volumeSlider.value) / 100;
    els.audio.volume = volume;
    els.audio.muted = volume === 0;
    updatePlaybackButtons();
  });

  els.copyLinkButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      els.copyLinkButton.textContent = "+ link copiato";
      window.setTimeout(() => {
        els.copyLinkButton.textContent = "+ copia link privato";
      }, 1600);
    } catch (_error) {
      showSheet("Copia link", "Il browser non ha copiato il link in automatico. Puoi copiarlo manualmente dalla barra indirizzi.");
    }
  });

  els.refreshDataButton.addEventListener("click", async () => {
    els.refreshDataButton.disabled = true;
    await initializeContent();
    els.refreshDataButton.disabled = false;
  });

  els.installAppButton.addEventListener("click", async () => {
    if (state.deferredInstallPrompt) {
      state.deferredInstallPrompt.prompt();
      await state.deferredInstallPrompt.userChoice.catch(() => null);
      state.deferredInstallPrompt = null;
      updateInstallUI();
      showSheet("Installazione avviata", "Se il browser supporta il prompt nativo, la richiesta di installazione e' partita. Altrimenti usa il menu del browser e scegli “Installa app” o “Aggiungi a schermata Home”.");
      return;
    }

    showSheet("Installa applicazione", "Su Android usa il menu del browser e scegli “Installa app” o “Aggiungi a schermata Home”. Su iPhone apri il link in Safari, tocca Condividi e poi “Aggiungi alla schermata Home”. Per APK o app store serve un packaging separato, non incluso in questa base portabile.");
  });

  els.installIosButton.addEventListener("click", () => {
    showSheet("Installazione iPhone", "Apri questo link in Safari, tocca Condividi e poi “Aggiungi alla schermata Home”. Il sito resta una PWA portabile e non dipende da Vercel.");
  });

  els.sheetClose.addEventListener("click", closeSheet);
  els.sheet.addEventListener("click", (event) => {
    if (event.target === els.sheet) closeSheet();
  });

  els.accessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = els.accessCode.value.trim();
    if (!code) {
      els.accessStatus.textContent = "Inserisci un codice valido.";
      return;
    }

    els.accessStatus.textContent = "Verifica codice in corso...";

    try {
      const isValid = await validateAccessCode(code);
      if (!isValid) {
        els.accessStatus.textContent = "Codice non valido o disattivato.";
        return;
      }
      unlockPrivateAccess();
      els.accessCard.hidden = true;
      els.audioStatus.textContent =
        "Accesso sbloccato. Ora puoi ascoltare i contenuti collegati.";
    } catch (_error) {
      els.accessStatus.textContent =
        "Impossibile verificare il codice. Controlla Supabase o riprova.";
    }
  });

  els.audio.addEventListener("play", () => {
    updatePlaybackButtons();
    renderTracks();
  });

  els.audio.addEventListener("pause", () => {
    updatePlaybackButtons();
    renderTracks();
  });

  els.audio.addEventListener("loadedmetadata", () => {
    updateTimeReadout(els.audio.currentTime, els.audio.duration);
  });

  els.audio.addEventListener("timeupdate", () => {
    if (!Number.isFinite(els.audio.duration) || els.audio.duration <= 0) return;
    const progress = els.audio.currentTime / els.audio.duration;
    els.seekbar.value = String(progress * 100);
    updateTimeReadout(els.audio.currentTime, els.audio.duration);
    if (!state.isScrubbing) {
      renderWaveform(sanitizeTrack(state.tracks[state.activeIndex], state.activeIndex), progress);
    }
  });

  els.audio.addEventListener("ended", () => {
    if (state.repeatMode === "one") {
      loadTrack(state.activeIndex, true);
      return;
    }
    loadTrack(getNextIndex("next"), state.repeatMode !== "off" || state.shuffleEnabled);
  });

  els.audio.addEventListener("error", () => {
    els.nowSubtitle.textContent =
      "Errore di riproduzione: controlla l'audio_url esterno della traccia.";
    els.audioStatus.textContent =
      "Il browser non ha potuto caricare l'audio esterno. Verifica l'URL o i permessi CORS del file.";
  });

  els.waveformWrap.addEventListener("pointerdown", (event) => {
    state.isScrubbing = true;
    els.waveformWrap.setPointerCapture(event.pointerId);
    setPlaybackPositionFromClientX(event.clientX);
    updateWaveformTooltip(event.clientX);
  });

  els.waveformWrap.addEventListener("pointermove", (event) => {
    updateWaveformTooltip(event.clientX);
    if (state.isScrubbing) {
      setPlaybackPositionFromClientX(event.clientX);
    }
  });

  els.waveformWrap.addEventListener("pointerup", (event) => {
    if (state.isScrubbing) {
      setPlaybackPositionFromClientX(event.clientX);
    }
    state.isScrubbing = false;
  });

  els.waveformWrap.addEventListener("pointerleave", () => {
    els.waveformTooltip.hidden = true;
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    updateInstallUI();
  });

  window.addEventListener("appinstalled", () => {
    state.deferredInstallPrompt = null;
    updateInstallUI();
  });

  updateInstallUI();
}

async function initializeContent() {
  await loadRemoteContent();
  syncPrivateState();
  updateAlbumUI();
  renderTracks();

  const initialIndex = state.tracks.findIndex((track) => Boolean(track.audioUrl));
  state.activeIndex = initialIndex >= 0 ? initialIndex : 0;
  updateNowPlaying(sanitizeTrack(state.tracks[state.activeIndex], state.activeIndex));
}

async function init() {
  bindEvents();
  registerServiceWorker();
  await initializeContent();
  els.audio.volume = 1;
  updatePlaybackButtons();
  updateInstallUI();
  setupDownloadActions();
  forceCoverVisible();
  setTimeout(forceCoverVisible, 300);
  setTimeout(forceCoverVisible, 1200);
}

init();

/* FORCE FIX: elimina vecchi bottoni installazione, pulisce cache PWA e crea CTA sicure */
(function forceChaoscoreDownloadCTAs() {
  async function killOldPwaCache() {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
      registrations.forEach((registration) => registration.unregister());
    }

    if ("caches" in window) {
      const keys = await caches.keys().catch(() => []);
      await Promise.all(keys.map((key) => caches.delete(key))).catch(() => null);
    }
  }

  function renderCleanDownloadButtons() {
    const oldInstall = document.getElementById("install-app");
    const oldIos = document.getElementById("install-ios");

    [oldInstall, oldIos].forEach((button) => {
      if (!button) return;
      button.hidden = true;
      button.style.display = "none";
      button.style.visibility = "hidden";
      button.style.opacity = "0";
      button.style.pointerEvents = "none";
    });

    const albumArt = document.getElementById("album-art");
    if (!albumArt || !albumArt.parentElement) return;

    let actions = document.getElementById("hero-download-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.id = "hero-download-actions";
      actions.className = "hero-download-actions";
      albumArt.parentElement.appendChild(actions);
    }

    actions.innerHTML = "";

    const iosButton = document.createElement("button");
    iosButton.type = "button";
    iosButton.className = "hero-download-button";
    iosButton.innerHTML = '<span class="download-icon"></span><span>Download iOS</span>';
    iosButton.addEventListener("click", () => {
      showSheet(
        "Download iOS",
        "Su iPhone apri questo sito in Safari, tocca Condividi e poi “Aggiungi alla schermata Home”. È il sito #chaoscore installato come app, non un file esterno."
      );
    });

    const androidButton = document.createElement("button");
    androidButton.type = "button";
    androidButton.className = "hero-download-button";
    androidButton.innerHTML = '<span class="download-icon">🤖</span><span>Download Android</span>';
    androidButton.addEventListener("click", async () => {
      if (state.deferredInstallPrompt) {
        state.deferredInstallPrompt.prompt();
        await state.deferredInstallPrompt.userChoice.catch(() => null);
        state.deferredInstallPrompt = null;
        showSheet(
          "Download Android",
          "Installazione avviata. Se non appare il prompt, apri il menu del browser e scegli “Installa app”."
        );
        return;
      }

      showSheet(
        "Download Android",
        "Su Android apri il menu di Chrome e scegli “Installa app” o “Aggiungi a schermata Home”. Non è un APK: è il sito #chaoscore installato come app sicura."
      );
    });

    const contentButton = document.createElement("button");
    contentButton.type = "button";
    contentButton.className = "hero-download-button";
    contentButton.innerHTML = '<span class="download-icon">⬇</span><span>Download contenuto</span>';
    contentButton.addEventListener("click", () => {
      const url =
        publicConfig.CONTENT_DOWNLOAD_URL ||
        publicConfig.contentDownloadUrl ||
        state.album.downloadUrl ||
        state.album.download_url ||
        "";

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      showSheet(
        "Download contenuto",
        "Il pacchetto download non è ancora collegato. Lo collegheremo tramite link esterno, non dentro GitHub."
      );
    });

    actions.append(iosButton, androidButton, contentButton);
  }

  window.addEventListener("load", async () => {
    await killOldPwaCache();
    renderCleanDownloadButtons();
    setTimeout(renderCleanDownloadButtons, 500);
    setTimeout(renderCleanDownloadButtons, 1500);
  });
})();


/* FINAL FIX: il vecchio popup installazione non deve apparire da solo */
(function closeOldInstallPopupForever() {
  function closeOnlyOldInstallPopup() {
    const sheet = document.getElementById("sheet");
    const title = document.getElementById("sheet-title");

    if (!sheet || !title) return;

    const titleText = (title.textContent || "").toLowerCase();

    if (
      titleText.includes("installa #chaoscore") ||
      titleText.includes("installa applicazione")
    ) {
      sheet.hidden = true;
      document.body.classList.remove("sheet-open");
    }
  }

  window.addEventListener("DOMContentLoaded", closeOnlyOldInstallPopup);
  window.addEventListener("load", () => {
    closeOnlyOldInstallPopup();
    setTimeout(closeOnlyOldInstallPopup, 300);
    setTimeout(closeOnlyOldInstallPopup, 1200);
  });
})();


/* FINAL STARTUP FIX: nessun popup deve apparire da solo all'apertura */
(function forceSheetClosedOnStartup() {
  function closeStartupSheet() {
    const sheet = document.getElementById("sheet");
    if (!sheet) return;

    sheet.hidden = true;
    sheet.classList.remove("is-manual-sheet");
    document.body.classList.remove("sheet-open");
  }

  closeStartupSheet();
  window.addEventListener("DOMContentLoaded", closeStartupSheet);
  window.addEventListener("load", () => {
    closeStartupSheet();
    setTimeout(closeStartupSheet, 250);
    setTimeout(closeStartupSheet, 1000);
    setTimeout(closeStartupSheet, 2500);
  });
})();




/* CHAOSCORE REAL FINAL OVERRIDE */
(function chaoscoreRealFinalOverride() {
  const albumCreditsText = `#chaoscore credits

All lyrics by Douglas Busta.
All production by Douglas Busta.
Mix & master by Douglas Busta.

Track 4 — so ki 6... ft. 39Redboy
Lyrics by Douglas Busta, 39redboy.
Production by Douglas Busta, Gador.
Mix & master by Douglas Busta.

Track 8 — Patto d'Achille ft. Gador
Lyrics by Douglas Busta, Gador.
Production by Douglas Busta.
Mix & master by Douglas Busta.

Track 10 — sensibileh! ft. Deffy
Lyrics by Douglas Busta, Deffy.
Production by Douglas Busta.
Mix & master by Douglas Busta.`;

  function hideBadElements() {
    const badIds = [
      "copy-link",
      "refresh-data",
      "access-card",
      "data-status",
      "audio-status"
    ];

    badIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.hidden = true;
      el.style.display = "none";
      el.style.visibility = "hidden";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
    });

    document.querySelectorAll("button, a, p, span, div").forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();

      if (
        text === "contenuto privato" ||
        text === "aggiorna contenuti" ||
        text === "copia link privato" ||
        text === "+ copia link privato" ||
        text === "stato sorgente" ||
        text.includes("supabase") ||
        text.includes("deploy") ||
        text.includes("repository") ||
        text.includes("url esterni")
      ) {
        el.hidden = true;
        el.style.display = "none";
      }
    });
  }

  function forceCleanText() {
    if (els.albumTitle) els.albumTitle.textContent = "#chaoscore";
    if (els.albumMeta) els.albumMeta.textContent = "Douglas Busta";
    if (els.releaseNote) els.releaseNote.textContent = "By Douglas Busta";

    document.title = "#chaoscore — Douglas Busta";
  }

  function forceAlbumData() {
    state.album = {
      ...fallbackAlbumSettings,
      title: "#chaoscore",
      artist: "Douglas Busta",
      releaseNote: "By Douglas Busta",
      coverUrl: "/assets/chaoscore-spotify-cover.jpg",
      isPrivate: false
    };

    state.tracks = [...fallbackTracks];
    state.isPrivate = false;
    state.accessGranted = true;
  }

  function forceCover() {
    const cover = "/assets/chaoscore-spotify-cover.jpg";
    const albumArt = document.getElementById("album-art");
    const miniArt = document.getElementById("mini-player-art");

    if (albumArt) albumArt.src = cover;
    if (miniArt) miniArt.src = cover;
  }

  function forceTracksVisible() {
    const list = document.getElementById("track-list");
    const empty = document.getElementById("empty-state");
    const waveform = document.getElementById("waveform-wrap");

    if (list) {
      list.hidden = false;
      list.style.display = "";
      list.style.visibility = "visible";
      list.style.opacity = "1";
    }

    if (empty) {
      empty.hidden = true;
      empty.style.display = "none";
    }

    if (waveform) {
      waveform.hidden = false;
      waveform.style.display = "";
      waveform.style.visibility = "visible";
      waveform.style.opacity = "1";
    }

    if (typeof renderTracks === "function") renderTracks();

    if (state.tracks.length && typeof updateNowPlaying === "function") {
      updateNowPlaying(sanitizeTrack(state.tracks[state.activeIndex] || state.tracks[0], state.activeIndex || 0), false);
    }
  }

  function renderAppButtons() {
    const albumArt = document.getElementById("album-art");
    if (!albumArt || !albumArt.parentElement) return;

    let actions = document.getElementById("hero-download-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.id = "hero-download-actions";
      actions.className = "hero-download-actions";
      albumArt.parentElement.appendChild(actions);
    }

    actions.innerHTML = "";

    const ios = document.createElement("button");
    ios.type = "button";
    ios.className = "hero-download-button";
    ios.innerHTML = '<span class="download-icon"></span><span>Download iOS</span>';
    ios.addEventListener("click", () => {
      showSheet(
        "Download iOS",
        "Su iPhone apri questo sito in Safari, tocca Condividi e poi “Aggiungi alla schermata Home”."
      );
    });

    const android = document.createElement("button");
    android.type = "button";
    android.className = "hero-download-button";
    android.innerHTML = '<span class="download-icon">🤖</span><span>Download Android</span>';
    android.addEventListener("click", async () => {
      if (state.deferredInstallPrompt) {
        state.deferredInstallPrompt.prompt();
        await state.deferredInstallPrompt.userChoice.catch(() => null);
        state.deferredInstallPrompt = null;
        showSheet("Download Android", "Installazione avviata.");
        return;
      }

      showSheet(
        "Download Android",
        "Su Android apri il menu di Chrome e scegli “Installa app” oppure “Aggiungi a schermata Home”."
      );
    });

    actions.append(ios, android);
  }

  function renderMinimalCreditsButton() {
    let button = document.getElementById("album-credits-button");

    if (!button) {
      button = document.createElement("button");
      button.id = "album-credits-button";
      button.type = "button";
      button.className = "minimal-credits-button";
      button.textContent = "credits";

      const heroInfo = document.querySelector(".hero-info, .album-info, .hero-copy, header, main");
      if (heroInfo) {
        heroInfo.appendChild(button);
      }
    }

    button.onclick = () => {
      showSheet("Credits", albumCreditsText);
    };
  }

  function bindCreditsClicks() {
    document.querySelectorAll('[data-open-credits="true"], a[href*="credits"], button').forEach((el) => {
      const text = (el.textContent || "").toLowerCase();
      const href = (el.getAttribute("href") || "").toLowerCase();

      if (text.includes("credits") || href.includes("credits") || el.matches('[data-open-credits="true"]')) {
        el.addEventListener("click", (event) => {
          event.preventDefault();
          showSheet("Credits", albumCreditsText);
        });
      }
    });
  }

  function applyFinalState() {
    forceAlbumData();
    forceCleanText();
    forceCover();
    hideBadElements();
    renderAppButtons();
    renderMinimalCreditsButton();
    bindCreditsClicks();
    forceTracksVisible();
  }

  window.addEventListener("DOMContentLoaded", () => {
    applyFinalState();
    setTimeout(applyFinalState, 250);
  });

  window.addEventListener("load", () => {
    applyFinalState();
    setTimeout(applyFinalState, 500);
    setTimeout(applyFinalState, 1500);
    setTimeout(applyFinalState, 3000);
  });
})();


/* FORCE APP DOWNLOAD BUTTONS FINAL */
(function forceAppDownloadButtonsFinal() {
  function hidePrivateContentButton() {
    document.querySelectorAll("button, a, div, span").forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();

      if (
        text === "contenuto privato" ||
        text.includes("contenuto privato") ||
        text === "private content"
      ) {
        el.hidden = true;
        el.style.display = "none";
        el.style.visibility = "hidden";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      }
    });
  }

  function renderInstallButtons() {
    const albumArt = document.getElementById("album-art");
    if (!albumArt || !albumArt.parentElement) return;

    let actions = document.getElementById("hero-download-actions");

    if (!actions) {
      actions = document.createElement("div");
      actions.id = "hero-download-actions";
      actions.className = "hero-download-actions";
      albumArt.parentElement.appendChild(actions);
    }

    actions.hidden = false;
    actions.style.display = "grid";
    actions.style.visibility = "visible";
    actions.style.opacity = "1";
    actions.style.pointerEvents = "auto";

    actions.innerHTML = "";

    const iosButton = document.createElement("button");
    iosButton.type = "button";
    iosButton.className = "hero-download-button";
    iosButton.innerHTML = '<span class="download-icon"></span><span>Download iOS</span>';
    iosButton.addEventListener("click", () => {
      showSheet(
        "Download iOS",
        "Su iPhone apri questo sito in Safari, tocca Condividi e poi “Aggiungi alla schermata Home”."
      );
    });

    const androidButton = document.createElement("button");
    androidButton.type = "button";
    androidButton.className = "hero-download-button";
    androidButton.innerHTML = '<span class="download-icon">🤖</span><span>Download Android</span>';
    androidButton.addEventListener("click", async () => {
      if (state.deferredInstallPrompt) {
        state.deferredInstallPrompt.prompt();
        await state.deferredInstallPrompt.userChoice.catch(() => null);
        state.deferredInstallPrompt = null;
        showSheet("Download Android", "Installazione avviata.");
        return;
      }

      showSheet(
        "Download Android",
        "Su Android apri il menu di Chrome e scegli “Installa app” oppure “Aggiungi a schermata Home”."
      );
    });

    actions.append(iosButton, androidButton);
  }

  function apply() {
    hidePrivateContentButton();
    renderInstallButtons();
  }

  window.addEventListener("DOMContentLoaded", () => {
    apply();
    setTimeout(apply, 300);
    setTimeout(apply, 1000);
    setTimeout(apply, 2500);
  });

  window.addEventListener("load", () => {
    apply();
    setTimeout(apply, 300);
    setTimeout(apply, 1000);
    setTimeout(apply, 2500);
    setTimeout(apply, 5000);
  });

  const observer = new MutationObserver(() => {
    apply();
  });

  window.addEventListener("load", () => {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  });
})();

/* CHAOSCORE EMERGENCY FINAL PLAYER */
(function chaoscoreEmergencyFinalPlayer() {
  const tracks = [
    { n: 1, title: "banale", file: "/audio-mp3/1. banale.mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 2, title: "STAR II", file: "/audio-mp3/2. STAR II.mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 3, title: "stella vera reale.wav", file: "/audio-mp3/3. stella vera reale.wav.mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 4, title: "so ki 6... ft. 39Redboy", file: "/audio-mp3/4. so ki 6... ft. 39Redboy.mp3", credits: "Lyrics by Douglas Busta, 39redboy.\nProduction by Douglas Busta, Gador.\nMix & master by Douglas Busta." },
    { n: 5, title: "sono triste e caco.", file: "/audio-mp3/5. sono triste e caco..mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 6, title: "blue hair", file: "/audio-mp3/6. blue hair.mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 7, title: "PICCOLO me", file: "/audio-mp3/7. PICCOLO me.mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 8, title: "Patto d'Achille ft. Gador", file: "/audio-mp3/8. Patto d'Achille ft. Gador.mp3", credits: "Lyrics by Douglas Busta, Gador.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 9, title: "Stop the EMOTIONS", file: "/audio-mp3/9. Stop the EMOTIONS.mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 10, title: "sensibileh! ft. Deffy", file: "/audio-mp3/10. sensibileh! ft. Deffy.mp3", credits: "Lyrics by Douglas Busta, Deffy.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 11, title: "ma che ho fatto mo??...", file: "/audio-mp3/11. ma che ho fatto mo??....mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 12, title: "NO TIME!", file: "/audio-mp3/12. NO TIME!.mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 13, title: "GET OUT!", file: "/audio-mp3/13. GET OUT!.mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 14, title: "LOOK UP!", file: "/audio-mp3/14. LOOK UP!.mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." },
    { n: 15, title: "1 normale (Bonus Track)", file: "/audio-mp3/15. 1 normale (Bonus Track).mp3", credits: "Lyrics by Douglas Busta.\nProduction by Douglas Busta.\nMix & master by Douglas Busta." }
  ];

  let currentIndex = 0;

  function $(selector) {
    return document.querySelector(selector);
  }

  function openPopup(title, text) {
    const sheet = document.getElementById("sheet");
    const sheetTitle = document.getElementById("sheet-title");
    const sheetCopy = document.getElementById("sheet-copy");

    if (sheet && sheetTitle && sheetCopy) {
      sheetTitle.textContent = title;
      sheetCopy.textContent = text;
      sheet.classList.add("is-manual-sheet");
      sheet.hidden = false;
      document.body.classList.add("sheet-open");
      return;
    }

    alert(title + "\n\n" + text);
  }

  function closePopup() {
    const sheet = document.getElementById("sheet");
    if (!sheet) return;
    sheet.hidden = true;
    sheet.classList.remove("is-manual-sheet");
    document.body.classList.remove("sheet-open");
  }

  function removeBadStuff() {
    document.querySelectorAll("button, a, div, span, p, section").forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();

      if (
        text === "contenuto privato" ||
        text.includes("contenuto privato") ||
        text.includes("player privato pronto per il deploy") ||
        text.includes("player installabile") ||
        text.includes("codice portabile") ||
        text.includes("supabase") ||
        text.includes("stato sorgente") ||
        text.includes("repository")
      ) {
        el.remove();
      }
    });
  }

  function forceHeader() {
    const title = document.getElementById("album-title");
    const meta = document.getElementById("album-meta");
    const note = document.getElementById("release-note");
    const cover = document.getElementById("album-art");
    const miniCover = document.getElementById("mini-player-art");

    if (title) title.textContent = "#chaoscore";
    if (meta) meta.textContent = "Douglas Busta";
    if (note) note.textContent = "By Douglas Busta";
    if (cover) cover.src = "/assets/chaoscore-spotify-cover.jpg";
    if (miniCover) miniCover.src = "/assets/chaoscore-spotify-cover.jpg";

    document.title = "#chaoscore — Douglas Busta";
  }

  function renderInstallButtons() {
    const cover = document.getElementById("album-art");
    if (!cover || !cover.parentElement) return;

    let actions = document.getElementById("hero-download-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.id = "hero-download-actions";
      actions.className = "hero-download-actions";
      cover.parentElement.appendChild(actions);
    }

    actions.innerHTML = "";

    const ios = document.createElement("button");
    ios.type = "button";
    ios.className = "hero-download-button";
    ios.innerHTML = '<span class="download-icon"></span><span>Download iOS</span>';
    ios.onclick = () => openPopup("Download iOS", "Su iPhone apri questo sito in Safari, tocca Condividi e poi “Aggiungi alla schermata Home”.");

    const android = document.createElement("button");
    android.type = "button";
    android.className = "hero-download-button";
    android.innerHTML = '<span class="download-icon">🤖</span><span>Download Android</span>';
    android.onclick = () => openPopup("Download Android", "Su Android apri il menu di Chrome e scegli “Installa app” oppure “Aggiungi a schermata Home”.");

    actions.append(ios, android);
  }

  function setNowPlaying(track) {
    const nowTitle = document.getElementById("now-title");
    const nowSubtitle = document.getElementById("now-subtitle");
    const audio = document.getElementById("audio-player");
    const time = document.getElementById("time-readout");

    if (nowTitle) nowTitle.textContent = track.title;
    if (nowSubtitle) nowSubtitle.textContent = "#chaoscore";
    if (audio) {
      audio.src = track.file;
      audio.load();
    }
    if (time) time.textContent = "0:00 / 0:00";

    renderWaveform(0);
  }

  function renderWaveform(progress) {
    const waveform = document.getElementById("waveform");
    const wrap = document.getElementById("waveform-wrap");

    if (wrap) {
      wrap.hidden = false;
      wrap.style.display = "block";
      wrap.style.visibility = "visible";
      wrap.style.opacity = "1";
    }

    if (!waveform) return;

    const peaks = [18,24,32,45,58,74,88,66,52,41,69,83,77,56,35,22,31,49,73,92,85,61,44,38,57,79,95,82,64,47,29,21,38,54,72,90,69,44,30,18];

    waveform.innerHTML = "";
    peaks.forEach((height, index) => {
      const bar = document.createElement("span");
      bar.className = "waveform-bar";
      bar.style.setProperty("--bar-height", String(height / 100));
      if (index / peaks.length <= progress) bar.classList.add("is-played");
      waveform.appendChild(bar);
    });
  }

  function renderTracks() {
    const list = document.getElementById("track-list");
    const empty = document.getElementById("empty-state");

    if (!list) return;

    if (empty) {
      empty.hidden = true;
      empty.style.display = "none";
    }

    list.hidden = false;
    list.style.display = "grid";
    list.style.visibility = "visible";
    list.style.opacity = "1";
    list.innerHTML = "";

    tracks.forEach((track, index) => {
      const item = document.createElement("article");
      item.className = "track-item" + (index === currentIndex ? " is-active" : "");
      item.dataset.index = String(index);

      const number = document.createElement("div");
      number.className = "track-number";
      number.textContent = String(track.n);

      const play = document.createElement("button");
      play.type = "button";
      play.className = "track-play";
      play.textContent = "▶";
      play.setAttribute("aria-label", "Play " + track.title);

      const copy = document.createElement("div");
      copy.className = "track-copy";
      copy.innerHTML = '<span class="track-title"></span><div class="track-subtitle">Douglas Busta</div>';
      copy.querySelector(".track-title").textContent = track.title;

      const duration = document.createElement("button");
      duration.type = "button";
      duration.className = "track-duration";
      duration.textContent = "credits";

      function playThis() {
        currentIndex = index;
        setNowPlaying(track);
        renderTracks();

        const audio = document.getElementById("audio-player");
        if (audio) {
          audio.play().catch(() => {
            openPopup("Audio", "Il browser non ha avviato l'audio. Riprova cliccando Play.");
          });
        }
      }

      item.addEventListener("click", playThis);
      play.addEventListener("click", (event) => {
        event.stopPropagation();
        playThis();
      });
      duration.addEventListener("click", (event) => {
        event.stopPropagation();
        openPopup("Credits — " + track.title, track.credits);
      });

      item.append(number, play, copy, duration);
      list.appendChild(item);
    });
  }

  function bindPlayerButtons() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest("button, a");
      if (!target) return;

      const text = (target.textContent || "").trim().toLowerCase();
      const href = (target.getAttribute("href") || "").toLowerCase();
      const action = target.getAttribute("data-action");

      if (text === "exclusive" || href.includes("exclusive")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.href = "./exclusive.html";
        return;
      }

      if (text === "credits" || href.includes("credits")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openPopup("Credits", "#chaoscore credits\n\nAll lyrics by Douglas Busta.\nAll production by Douglas Busta.\nMix & master by Douglas Busta.\n\nTrack 4 — so ki 6... ft. 39Redboy\nLyrics by Douglas Busta, 39redboy.\nProduction by Douglas Busta, Gador.\nMix & master by Douglas Busta.\n\nTrack 8 — Patto d'Achille ft. Gador\nLyrics by Douglas Busta, Gador.\nProduction by Douglas Busta.\nMix & master by Douglas Busta.\n\nTrack 10 — sensibileh! ft. Deffy\nLyrics by Douglas Busta, Deffy.\nProduction by Douglas Busta.\nMix & master by Douglas Busta.");
        return;
      }

      if (action === "play" || target.id === "hero-play") {
        event.preventDefault();
        event.stopImmediatePropagation();

        const audio = document.getElementById("audio-player");
        if (!audio) return;

        if (!audio.src) {
          setNowPlaying(tracks[currentIndex]);
        }

        if (audio.paused) {
          audio.play().catch(() => openPopup("Audio", "Riprova cliccando una traccia."));
        } else {
          audio.pause();
        }
      }
    }, true);

    const audio = document.getElementById("audio-player");
    if (audio) {
      audio.addEventListener("timeupdate", () => {
        if (!audio.duration) return;
        renderWaveform(audio.currentTime / audio.duration);

        const time = document.getElementById("time-readout");
        if (time) {
          const fmt = (s) => {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60).toString().padStart(2, "0");
            return `${m}:${sec}`;
          };
          time.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
        }
      });

      audio.addEventListener("loadedmetadata", () => {
        const time = document.getElementById("time-readout");
        if (time && audio.duration) {
          const m = Math.floor(audio.duration / 60);
          const s = Math.floor(audio.duration % 60).toString().padStart(2, "0");
          time.textContent = `0:00 / ${m}:${s}`;
        }
      });
    }
  }

  function run() {
    removeBadStuff();
    forceHeader();
    renderInstallButtons();
    renderTracks();
    renderWaveform(0);
    setNowPlaying(tracks[0]);
  }

  window.addEventListener("DOMContentLoaded", () => {
    bindPlayerButtons();
    run();
    setTimeout(run, 300);
    setTimeout(run, 1000);
    setTimeout(run, 2500);
  });

  window.addEventListener("load", () => {
    run();
    setTimeout(run, 500);
    setTimeout(run, 1500);
    setTimeout(run, 3000);
  });
})();
