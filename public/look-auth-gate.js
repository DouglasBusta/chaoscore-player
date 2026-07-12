(() => {
  "use strict";

  const SUPABASE_URL = "https://giixvsfwsguudrvvbmkj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Ae2dmdo-KYyNxcVntZg_2Q_xkWq5Bzm";
  const STORAGE_KEY = "lookapp-auth-token";

  const ALLOWED_PATHS = new Set([
    "/auth",
    "/auth.html",
    "/public/auth.html"
  ]);

  const path = window.location.pathname;

  if (ALLOWED_PATHS.has(path)) {
    return;
  }

  function clearOldFakeUnlock() {
    try {
      localStorage.removeItem("lookapp-auth-ok");
      localStorage.removeItem("lookapp-auth-ok-at");
    } catch (_error) {}
  }

  function lockPage() {
    document.documentElement.classList.add("look-auth-locked");
    if (document.body) document.body.classList.add("look-auth-locked");
  }

  function unlockPage() {
    document.documentElement.classList.remove("look-auth-locked");
    if (document.body) document.body.classList.remove("look-auth-locked");

    const gate = document.getElementById("look-auth-gate");
    if (gate) gate.remove();
  }

  function getNextUrl() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function goAuth(mode) {
    const next = encodeURIComponent(getNextUrl());
    window.location.href = `/auth?mode=${encodeURIComponent(mode)}&next=${next}`;
  }

  function ensureGate(message = "Effettua l’accesso per continuare.") {
    let gate = document.getElementById("look-auth-gate");

    if (!gate) {
      gate = document.createElement("div");
      gate.className = "look-auth-gate";
      gate.id = "look-auth-gate";
      gate.setAttribute("role", "dialog");
      gate.setAttribute("aria-modal", "true");
      gate.setAttribute("aria-labelledby", "look-auth-title");

      gate.innerHTML = `
        <div class="look-auth-card look-auth-appscreen" role="document">
          <div class="look-auth-brand-wrap" aria-hidden="true">
            <img class="look-auth-main-logo" src="/brand/look-app-logo-chaos-red.png" alt="" loading="eager" decoding="async">
          </div>

          <div class="look-auth-panel">
            <h1 class="look-auth-title look-auth-title-hidden" id="look-auth-title">LOOK APP</h1>

            <p class="look-auth-subtitle">
              Accedi per entrare in LOOK APP e sbloccare musica, file, shop e contenuti esclusivi.
            </p>

            <div class="look-auth-actions">
              <button class="look-auth-btn look-auth-btn-primary" type="button" data-look-auth-login>LOG IN</button>
              <button class="look-auth-btn look-auth-btn-secondary" type="button" data-look-auth-signup>SIGN UP</button>
            </div>

            <p class="look-auth-note">Accesso obbligatorio</p>
            <p class="look-auth-loading" id="look-auth-loading"></p>
          </div>
        </div>
      `;

      document.body.appendChild(gate);
    }

    const loading = document.getElementById("look-auth-loading");
    if (loading) loading.textContent = message;

    lockPage();
  }

  function loadSupabase() {
    if (window.supabase?.createClient) {
      return Promise.resolve(window.supabase);
    }

    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src*="supabase-js"]');

      if (existing) {
        existing.addEventListener("load", () => resolve(window.supabase), { once: true });
        existing.addEventListener("error", reject, { once: true });

        if (window.supabase?.createClient) {
          resolve(window.supabase);
        }

        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.async = true;
      script.onload = () => resolve(window.supabase);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function checkAuth() {
    clearOldFakeUnlock();

    try {
      const supabaseLib = await loadSupabase();

      if (!supabaseLib?.createClient) {
        ensureGate("Accesso richiesto.");
        return;
      }

      const client = supabaseLib.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: STORAGE_KEY
        }
      });

      const { data } = await client.auth.getSession();

      if (data?.session?.user) {
        unlockPage();
        return;
      }

      ensureGate("Effettua l’accesso per continuare.");

      client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          unlockPage();
        } else {
          ensureGate("Effettua l’accesso per continuare.");
        }
      });
    } catch (error) {
      console.warn("LOOK APP auth gate:", error);
      ensureGate("Accesso richiesto.");
    }
  }

  document.addEventListener("click", (event) => {
    const loginButton = event.target.closest("[data-look-auth-login]");
    const signupButton = event.target.closest("[data-look-auth-signup]");

    if (loginButton) {
      event.preventDefault();
      event.stopPropagation();
      goAuth("login");
      return;
    }

    if (signupButton) {
      event.preventDefault();
      event.stopPropagation();
      goAuth("signup");
    }
  }, true);

  document.addEventListener("keydown", (event) => {
    const gate = document.getElementById("look-auth-gate");

    if (gate && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAuth, { once: true });
  } else {
    checkAuth();
  }
})();
