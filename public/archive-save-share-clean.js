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

  function fileNameFromButton(button) {
    return (
      button?.dataset?.saveFile ||
      button?.dataset?.shareFile ||
      button?.getAttribute("data-save-file") ||
      button?.getAttribute("data-share-file") ||
      ""
    ).trim();
  }

  function fileTitle(fileName) {
    return fileName || "Busta File";
  }

  function fileUrl(fileName) {
    if (!fileName) return window.location.href;
    return window.location.origin + "/exclusive/" + encodeURIComponent(fileName);
  }

  function shareLink(fileName) {
    return window.location.origin + "/exclusive?file=" + encodeURIComponent(fileName);
  }

  function isSaveButton(el) {
    return el && (
      el.hasAttribute("data-save-file") ||
      el.matches("[data-save-file]")
    );
  }

  function isShareButton(el) {
    return el && (
      el.hasAttribute("data-share-file") ||
      el.matches("[data-share-file]")
    );
  }

  async function getSession() {
    if (!client) return null;
    const result = await client.auth.getSession();
    return result.data?.session || null;
  }

  async function getSavedIds() {
    const session = await getSession();

    if (!session?.user) return new Set();

    const result = await client.rpc("get_my_saved_files");

    if (!result.error && Array.isArray(result.data)) {
      return new Set(
        result.data
          .map(row => row.file_id || row.file_key || row.id)
          .filter(Boolean)
      );
    }

    const fallback = await client
      .from("saved_files")
      .select("file_id")
      .eq("user_id", session.user.id);

    if (!fallback.error && Array.isArray(fallback.data)) {
      return new Set(fallback.data.map(row => row.file_id).filter(Boolean));
    }

    return new Set();
  }

  function markButton(button, saved) {
    button.dataset.saved = saved ? "1" : "0";
    button.textContent = saved ? "✓" : "Save";
    button.classList.toggle("is-saved", saved);
  }

  async function refreshSavedButtons() {
    const ids = await getSavedIds();

    document.querySelectorAll("[data-save-file]").forEach(button => {
      const fileName = fileNameFromButton(button);
      const saved =
        ids.has(fileName) ||
        ids.has("archive:" + fileName) ||
        ids.has(fileUrl(fileName));

      markButton(button, saved);
    });

    document.querySelectorAll("[data-share-file]").forEach(button => {
      button.textContent = "Share";
    });
  }

  async function saveFile(fileName, button) {
    const session = await getSession();

    if (!session?.user) {
      window.location.href = "/auth?mode=login";
      return;
    }

    button.disabled = true;
    button.textContent = "...";

    const result = await client.rpc("save_busta_file", {
      p_file_id: fileName,
      p_file_title: fileTitle(fileName),
      p_file_type: "Busta File",
      p_file_url: fileUrl(fileName),
      p_file_meta: shareLink(fileName)
    });

    button.disabled = false;

    if (result.error) {
      button.textContent = "Save";
      alert("Save failed: " + result.error.message);
      return;
    }

    markButton(button, true);
  }

  async function unsaveFile(fileName, button) {
    const session = await getSession();

    if (!session?.user) {
      window.location.href = "/auth?mode=login";
      return;
    }

    button.disabled = true;
    button.textContent = "...";

    const result = await client.rpc("unsave_busta_file", {
      p_file_id: fileName
    });

    button.disabled = false;

    if (result.error) {
      button.textContent = "✓";
      alert("Remove failed: " + result.error.message);
      return;
    }

    markButton(button, false);
  }

  async function copyShare(fileName, button) {
    const link = shareLink(fileName);

    try {
      await navigator.clipboard.writeText(link);
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = "Share";
      }, 900);
    } catch (_) {
      alert("Copy this link manually: " + link);
    }
  }

  document.addEventListener("click", async function (event) {
    const button = event.target.closest("button, a");
    if (!button) return;

    if (isSaveButton(button)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const fileName = fileNameFromButton(button);
      const saved = button.dataset.saved === "1" || button.textContent.trim() === "✓" || button.textContent.trim().toLowerCase() === "saved";

      if (saved) {
        await unsaveFile(fileName, button);
      } else {
        await saveFile(fileName, button);
      }

      return;
    }

    if (isShareButton(button)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const fileName = fileNameFromButton(button);
      await copyShare(fileName, button);
    }
  }, true);

  function boot() {
    refreshSavedButtons();
    setTimeout(refreshSavedButtons, 400);
    setTimeout(refreshSavedButtons, 1200);
    setTimeout(refreshSavedButtons, 2400);
  }

  window.addEventListener("DOMContentLoaded", boot);

  const observer = new MutationObserver(() => {
    clearTimeout(window.__bustaArchiveSaveShareTimer);
    window.__bustaArchiveSaveShareTimer = setTimeout(refreshSavedButtons, 100);
  });

  window.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
