// LOOK APP global auth gate
(function () {
  const SUPABASE_URL = "https://giixvsfwsguudrvvbmkj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Ae2dmdo-KYyNxcVntZg_2Q_xkWq5Bzm";

  const allowedPaths = [
    "/auth",
    "/auth.html"
  ];

  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  if (allowedPaths.some((allowed) => path === allowed || path.startsWith(allowed + "/"))) {
    return;
  }

  if (window.__LOOK_AUTH_GATE_ACTIVE__) return;
  window.__LOOK_AUTH_GATE_ACTIVE__ = true;

  function lockPage() {
    document.documentElement.classList.add("look-auth-locked");
    document.body.classList.add("look-auth-locked");
  }

  function unlockPage() {
    document.documentElement.classList.remove("look-auth-locked");
    document.body.classList.remove("look-auth-locked");
    const gate = document.getElementById("look-auth-gate");
    if (gate) gate.hidden = true;
  }

  function buildGate() {
    let gate = document.getElementById("look-auth-gate");

    if (gate) return gate;

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
          <p class="look-auth-loading" id="look-auth-loading">Effettua l’accesso per continuare.</p>
        </div>
      </div>
      </div>
    `;

    document.body.appendChild(gate);
    return gate;
  }

  function showGate(message) {
    const gate = buildGate();
    const loading = gate.querySelector("#look-auth-loading");
    if (loading && message) loading.textContent = message;
    gate.hidden = false;
    lockPage();
  }

  function loadSupabase() {
    return new Promise((resolve, reject) => {
      if (window.supabase) return resolve(window.supabase);

      const existing = document.querySelector('script[src*="@supabase/supabase-js"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.supabase));
        existing.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.onload = () => resolve(window.supabase);
      script.onerror = () => reject(new Error("Impossibile caricare Supabase."));
      document.head.appendChild(script);
    });
  }

  async function checkAuth() {
    showGate("Controllo sessione...");

    try {
      const supabaseLib = await loadSupabase();

      if (!supabaseLib || !supabaseLib.createClient) {
        throw new Error("Supabase non disponibile.");
      }

      const client = supabaseLib.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "lookapp-auth-token"
        }
      });

      const result = await client.auth.getSession();
      const session = result && result.data ? result.data.session : null;

      if (session && session.user) {
        unlockPage();
        return;
      }

      showGate("Effettua l’accesso per continuare.");

      client.auth.onAuthStateChange((_event, currentSession) => {
        if (currentSession && currentSession.user) {
          unlockPage();
        } else {
          showGate("Effettua l’accesso per continuare.");
        }
      });
    } catch (error) {
      console.warn("LOOK APP auth gate:", error);
      showGate("Accesso richiesto.");
    }
  }

  document.addEventListener("keydown", function (event) {
    const gate = document.getElementById("look-auth-gate");
    if (gate && !gate.hidden && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAuth);
  } else {
    checkAuth();
  }
  document.addEventListener("click", function(event) {
    const loginButton = event.target.closest("[data-look-auth-login]");
    const signupButton = event.target.closest("[data-look-auth-signup]");

    if (loginButton) {
      event.preventDefault();
      event.stopPropagation();
      window.location.href = "/auth?mode=login&next=" + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
      return;
    }

    if (signupButton) {
      event.preventDefault();
      event.stopPropagation();
      window.location.href = "/auth?mode=signup&next=" + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
    }
  }, true);

})();


/* LOOK APP: evita loop del login gate dopo accesso riuscito. */
(function () {
  function hasRecentLookAppLogin() {
    try {
      const ok = localStorage.getItem("lookapp-auth-ok") === "1";
      const at = Number(localStorage.getItem("lookapp-auth-ok-at") || "0");
      const maxAge = 1000 * 60 * 60 * 24 * 30; // 30 giorni
      return ok && at && Date.now() - at < maxAge;
    } catch (_error) {
      return false;
    }
  }

  function hasAnyStoredSupabaseSession() {
    try {
      const keys = [
        "lookapp-auth-token",
        "sb-giixvsfwsguudrvvbmkj-auth-token"
      ];

      return keys.some((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return false;

        if (raw.includes("access_token") || raw.includes("refresh_token")) {
          return true;
        }

        try {
          const parsed = JSON.parse(raw);
          return Boolean(
            parsed?.access_token ||
            parsed?.refresh_token ||
            parsed?.currentSession?.access_token ||
            parsed?.session?.access_token
          );
        } catch (_error) {
          return false;
        }
      });
    } catch (_error) {
      return false;
    }
  }

  function forceCloseLookAuthGate() {
    if (!hasRecentLookAppLogin() && !hasAnyStoredSupabaseSession()) return false;

    document.documentElement.classList.remove("look-auth-locked");
    if (document.body) document.body.classList.remove("look-auth-locked");

    const gate = document.getElementById("look-auth-gate") || document.querySelector(".look-auth-gate");
    if (gate) gate.remove();

    return true;
  }

  forceCloseLookAuthGate();

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;

    if (forceCloseLookAuthGate() || attempts > 80) {
      clearInterval(timer);
    }
  }, 250);
})();

