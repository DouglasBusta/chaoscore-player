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
      <div class="look-auth-card">
        <div class="look-auth-logo" aria-hidden="true">
          <img src="/brand/look-app-logo-chaos-red.png" alt="" loading="eager" decoding="async">
        </div>
        <h1 class="look-auth-title look-auth-title-hidden" id="look-auth-title">LOOK APP</h1>
        <p class="look-auth-subtitle">
          Accedi per entrare in LOOK APP e sbloccare musica, file, shop e contenuti esclusivi.
        </p>
        <div class="look-auth-actions">
          <a class="look-auth-btn look-auth-btn-primary" href="/auth?mode=login">Log in</a>
          <a class="look-auth-btn look-auth-btn-secondary" href="/auth?mode=signup">Sign up</a>
        </div>
        <p class="look-auth-note">Accesso obbligatorio</p>
        <p class="look-auth-loading" id="look-auth-loading">Controllo sessione...</p>
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
          detectSessionInUrl: true
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
})();
