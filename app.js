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
  els.sheet.hidden = false;
  document.body.classList.add("sheet-open");
}

function closeSheet() {
  els.sheet.hidden = true;
  document.body.classList.remove("sheet-open");
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

  if (state.album.coverUrl || state.album.cover_url) {
    const cover = state.album.coverUrl || state.album.cover_url;
    els.albumArt.src = cover;
    els.miniPlayerArt.src = cover;
  }
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

    item.addEventListener("dblclick", () => {
      if (isLocked) {
        showSheet("Accesso richiesto", "Inserisci prima il codice accesso per sbloccare la riproduzione privata.");
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
    "Audio in streaming da URL esterno. Nessun file pesante e' incluso nella repo.";

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
      "Questa build non ha ancora un audio_url per la traccia selezionata.";
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
  const client = await getSupabaseClient();

  if (!client) {
    state.album = { ...fallbackAlbumSettings };
    state.tracks = [...fallbackTracks];
    state.isPrivate = Boolean(state.album.isPrivate);
    els.dataStatus.textContent =
      "Supabase non configurato: sto usando i contenuti di fallback dal codice.";
    return;
  }

  try {
    const [{ data: albumData, error: albumError }, { data: tracksData, error: tracksError }] =
      await Promise.all([
        client
          .from("album_settings")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        client
          .from("tracks")
          .select("*")
          .eq("is_active", true)
          .order("track_number", { ascending: true })
      ]);

    if (albumError) throw albumError;
    if (tracksError) throw tracksError;

    state.album = albumData
      ? {
          title: albumData.title || fallbackAlbumSettings.title,
          artist: albumData.artist || fallbackAlbumSettings.artist,
          releaseNote:
            albumData.release_note || fallbackAlbumSettings.releaseNote,
          coverUrl: albumData.cover_url || fallbackAlbumSettings.coverUrl,
          theme: albumData.theme || fallbackAlbumSettings.theme,
          isPrivate: Boolean(albumData.is_private),
          updatedAt: albumData.updated_at || fallbackAlbumSettings.updatedAt
        }
      : { ...fallbackAlbumSettings };

    state.tracks = Array.isArray(tracksData) && tracksData.length
      ? tracksData.map(sanitizeTrack)
      : [...fallbackTracks];

    state.isPrivate = Boolean(state.album.isPrivate);
    els.dataStatus.textContent =
      "Contenuti caricati da Supabase. Se cambi tracklist o testi nel database, il sito li rilegge senza cambiare struttura.";
  } catch (_error) {
    state.album = { ...fallbackAlbumSettings };
    state.tracks = [...fallbackTracks];
    state.isPrivate = Boolean(state.album.isPrivate);
    els.dataStatus.textContent =
      "Supabase non raggiungibile o dati non validi: sto usando il fallback locale per tenere il sito online.";
  }
}

function syncPrivateState() {
  const hasSessionAccess = sessionStorage.getItem(ACCESS_STORAGE_KEY) === "ok";
  state.accessGranted = !state.isPrivate || hasSessionAccess;
  els.accessCard.hidden = !state.isPrivate || state.accessGranted;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => null);
  });
}

function bindEvents() {
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
  });
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
}

init();
