(function () {
  const SUPABASE_URL = "https://giixvsfwsguudrvvbmkj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Ae2dmdo-KYyNxcVntZg_2Q_xkWq5Bzm";

  const client = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").trim();
  }

  function isSaveButton(el) {
    if (!el) return false;
    const text = textOf(el).toLowerCase();
    return (
      el.classList.contains("save-button") ||
      text === "save" ||
      text === "✓" ||
      text === "saved"
    );
  }

  function isShareButton(el) {
    if (!el) return false;
    const text = textOf(el).toLowerCase();
    return el.classList.contains("share-button") || text === "share" || text === "copied";
  }

  function closestCard(el) {
    return (
      el.closest(".file-card") ||
      el.closest(".busta-user-file-card") ||
      el.closest("a") ||
      el.closest("article")
    );
  }

  function titleFromCard(card) {
    return (
      card.querySelector(".file-title")?.textContent?.trim() ||
      card.querySelector(".busta-user-file-name")?.textContent?.trim() ||
      Array.from(card.querySelectorAll("*"))
        .map((el) => textOf(el))
        .find((text) => text && !/reviewed|submitted by|save|share|copied|✓/i.test(text)) ||
      "User Submission"
    );
  }

  function fileUrlFromCard(card) {
    const img = card.querySelector("img");
    return card.getAttribute("href") || img?.src || "";
  }

  function stableFileKey(card) {
    return (
      card.dataset.fileId ||
      titleFromCard(card) ||
      fileUrlFromCard(card) ||
      String(Date.now())
    );
  }

  function cardData(card) {
    const url = fileUrlFromCard(card);
    const title = titleFromCard(card);
    const key = stableFileKey(card);

    return {
      title,
      url,
      fileId: "user-submission:" + url,
      shareUrl: window.location.origin + "/user-submissions?file=" + encodeURIComponent(key)
    };
  }

  async function session() {
    if (!client) return null;
    const result = await client.auth.getSession();
    return result.data?.session || null;
  }

  async function savedIds() {
    const s = await session();
    if (!s?.user) return new Set();

    const result = await client.rpc("get_my_saved_files");

    if (result.error || !Array.isArray(result.data)) {
      console.warn("get_my_saved_files failed", result.error);
      return new Set();
    }

    return new Set(
      result.data
        .map((row) => row.file_id || row.file_key || row.id)
        .filter(Boolean)
    );
  }

  async function saveViaRpc(data) {
    const attempts = [
      {
        p_file_id: data.fileId,
        p_file_title: data.title,
        p_file_type: "User Submission",
        p_file_url: data.url,
        p_file_meta: data.shareUrl
      },
      {
        file_id: data.fileId,
        file_title: data.title,
        file_type: "User Submission",
        file_url: data.url,
        file_meta: data.shareUrl
      }
    ];

    let lastError = null;

    for (const payload of attempts) {
      const result = await client.rpc("save_busta_file", payload);
      if (!result.error) return { ok: true };
      lastError = result.error;
    }

    return { ok: false, error: lastError };
  }

  async function unsaveViaRpc(data) {
    const result = await client.rpc("unsave_busta_file", {
      p_file_id: data.fileId
    });

    if (!result.error) return { ok: true };

    return { ok: false, error: result.error };
  }

  async function handleSaveClick(button, card) {
    const s = await session();

    if (!s?.user) {
      window.location.href = "/auth?mode=login";
      return;
    }

    const data = cardData(card);
    const currentlySaved = button.dataset.saved === "1" || textOf(button) === "✓";

    button.disabled = true;
    button.textContent = "...";

    const result = currentlySaved
      ? await unsaveViaRpc(data)
      : await saveViaRpc(data);

    button.disabled = false;

    if (!result.ok) {
      button.textContent = currentlySaved ? "✓" : "Save";
      alert((currentlySaved ? "Remove failed: " : "Save failed: ") + (result.error?.message || "Unknown error"));
      return;
    }

    if (currentlySaved) {
      button.dataset.saved = "0";
      button.classList.remove("is-saved");
      button.textContent = "Save";
    } else {
      button.dataset.saved = "1";
      button.classList.add("is-saved");
      button.textContent = "✓";
    }
  }

  async function handleShareClick(button, card) {
    const data = cardData(card);

    try {
      await navigator.clipboard.writeText(data.shareUrl);
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = "Share";
      }, 900);
    } catch (_) {
      alert("Copy this link manually: " + data.shareUrl);
    }
  }

  async function refreshButtonStates() {
    const ids = await savedIds();

    document.querySelectorAll(".file-card, .busta-user-file-card").forEach((card) => {
      const data = cardData(card);

      card.querySelectorAll("button, a").forEach((button) => {
        if (isSaveButton(button)) {
          const saved = ids.has(data.fileId);
          button.dataset.saved = saved ? "1" : "0";
          button.classList.toggle("is-saved", saved);
          button.textContent = saved ? "✓" : "Save";
        }

        if (isShareButton(button)) {
          button.textContent = "Share";
        }
      });
    });
  }

  document.addEventListener(
    "click",
    async function (event) {
      const clicked = event.target.closest("button, a");
      if (!clicked) return;

      const card = closestCard(clicked);
      if (!card) return;

      if (isSaveButton(clicked)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        await handleSaveClick(clicked, card);
        return;
      }

      if (isShareButton(clicked)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        await handleShareClick(clicked, card);
      }
    },
    true
  );

  function run() {
    refreshButtonStates();
    setTimeout(refreshButtonStates, 400);
    setTimeout(refreshButtonStates, 1200);
    setTimeout(refreshButtonStates, 2400);
  }

  window.addEventListener("DOMContentLoaded", run);

  const observer = new MutationObserver(() => {
    clearTimeout(window.__bustaUserSubmissionsActionsTimer);
    window.__bustaUserSubmissionsActionsTimer = setTimeout(refreshButtonStates, 80);
  });

  window.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
