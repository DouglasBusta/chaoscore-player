(() => {
  "use strict";

  const SUPABASE_URL = "https://giixvsfwsguudrvvbmkj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Ae2dmdo-KYyNxcVntZg_2Q_xkWq5Bzm";

  const ALLOWED_PATHS = new Set([
    "/",
    "/index.html",
    "/auth",
    "/auth.html",
    "/public/auth.html",
    "/shop",
    "/shop/",
    "/shop.html",
    "/shop/index.html",
    "/claim",
    "/claim/",
    "/claim.html",
    "/public/claim.html",
    "/terms",
    "/terms/",
    "/legal/terms.html",
    "/privacy",
    "/privacy/",
    "/legal/privacy.html",
    "/chaoscore",
    "/chaoscore/",
    "/chaoscore.html",
    "/public/chaoscore.html"
  ]);

  const path = window.location.pathname;

  function installUnifiedBackButton() {
    const cleanPath = path.replace(/\/$/, "") || "/";
    const supported = new Set([
      "/shop",
      "/shop/index.html",
      "/shop.html",
      "/account",
      "/account.html",
      "/chaoscore",
      "/chaoscore.html"
    ]);

    if (!supported.has(cleanPath)) return;

    const styleId = "look-unified-back-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .look-unified-back {
          position: fixed !important;
          top: max(12px, env(safe-area-inset-top)) !important;
          left: max(12px, env(safe-area-inset-left)) !important;
          z-index: 2147483000 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 38px !important;
          width: auto !important;
          margin: 0 !important;
          padding: 0 14px !important;
          border: 1px solid rgba(231,224,210,.22) !important;
          border-radius: 999px !important;
          background: rgba(12,9,9,.78) !important;
          color: #e7e0d2 !important;
          box-shadow: 0 8px 28px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.04) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          text-decoration: none !important;
          text-transform: uppercase !important;
          letter-spacing: .12em !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important;
          font-size: .68rem !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          white-space: nowrap !important;
          cursor: pointer !important;
          transition: background 160ms ease, border-color 160ms ease, transform 160ms ease !important;
        }

        .look-unified-back:hover {
          background: rgba(255,255,255,.09) !important;
          border-color: rgba(231,224,210,.4) !important;
          transform: translateY(-1px) !important;
        }

        .look-unified-back:focus-visible {
          outline: 2px solid rgba(231,224,210,.65) !important;
          outline-offset: 3px !important;
        }

        @media (max-width: 560px) {
          .look-unified-back {
            top: max(10px, env(safe-area-inset-top)) !important;
            left: max(10px, env(safe-area-inset-left)) !important;
            min-height: 36px !important;
            padding: 0 12px !important;
            font-size: .62rem !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const candidates = Array.from(document.querySelectorAll("a"));
    let backLink = candidates.find((link) =>
      /back\s+to\s+busta\s+files/i.test((link.textContent || "").trim())
    );

    if (!backLink) {
      backLink = document.createElement("a");
      document.body.appendChild(backLink);
    }

    backLink.classList.add("look-unified-back");
    backLink.href = "/";
    backLink.textContent = "← Back to Busta Files";
    backLink.setAttribute("aria-label", "Back to Busta Files");

    candidates.forEach((link) => {
      if (link === backLink) return;
      if (/back\s+to\s+busta\s+files/i.test((link.textContent || "").trim())) {
        link.style.display = "none";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installUnifiedBackButton, { once: true });
  } else {
    installUnifiedBackButton();
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

  let sharedClientPromise = null;

  async function getSharedClient() {
    if (!sharedClientPromise) {
      sharedClientPromise = loadSupabase().then((supabaseLib) => {
        if (!supabaseLib?.createClient) {
          throw new Error("Supabase non disponibile");
        }

        return supabaseLib.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
      });
    }

    return sharedClientPromise;
  }

  window.lookAuth = window.lookAuth || {};
  window.lookAuth.getSession = async function () {
    const client = await getSharedClient();
    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    return data?.session || null;
  };

  window.lookAuth.getClient = async function () {
    return await getSharedClient();
  };

  if (ALLOWED_PATHS.has(path)) {
    return;
  }

  async function checkAuth() {
    ensureGate("Controllo sessione...");

    try {
      const client = await getSharedClient();

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
