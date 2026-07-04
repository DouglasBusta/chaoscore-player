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

  function getCardData(card) {
    const img = card.querySelector("img");
    const title =
      card.querySelector(".file-title")?.textContent?.trim() ||
      card.querySelector(".busta-user-file-name")?.textContent?.trim() ||
      "User Submission";

    const fileUrl =
      card.getAttribute("href") ||
      img?.src ||
      "";

    const fileId = "user-submission:" + fileUrl;

    const shareUrl =
      window.location.origin +
      "/user-submissions?file=" +
      encodeURIComponent(card.dataset.fileId || title || fileUrl);

    return { title, fileUrl, fileId, shareUrl };
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

    if (result.error || !Array.isArray(result.data)) {
      console.warn("get_my_saved_files error", result.error);
      return new Set();
    }

    return new Set(
      result.data
        .map(row => row.file_id || row.file_key || row.id)
        .filter(Boolean)
    );
  }

  async function toggleSave(card, button) {
    const session = await getSession();

    if (!session?.user) {
      window.location.href = "/auth?mode=login";
      return;
    }

    const data = getCardData(card);

    button.disabled = true;
    button.textContent = "...";

    const result = await client.rpc("toggle_busta_saved_file", {
      p_file_id: data.fileId,
      p_file_title: data.title,
      p_file_type: "User Submission",
      p_file_url: data.fileUrl,
      p_file_meta: data.shareUrl
    });

    button.disabled = false;

    if (result.error) {
      console.error("toggle_busta_saved_file error", result.error);
      button.textContent = button.dataset.saved === "1" ? "✓" : "Save";
      alert("Save failed: " + result.error.message);
      return;
    }

    const savedNow = result.data === true;

    button.dataset.saved = savedNow ? "1" : "0";
    button.textContent = savedNow ? "✓" : "Save";
    button.classList.toggle("is-saved", savedNow);
  }

  async function shareCard(card, button) {
    const data = getCardData(card);

    try {
      if (navigator.share) {
        await navigator.share({
          title: data.title,
          text: "Busta Files / User Submissions",
          url: data.shareUrl
        });
        return;
      }

      await navigator.clipboard.writeText(data.shareUrl);
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = "Share";
      }, 900);
    } catch (err) {
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
  }

  async function bindUserSubmissionActions() {
    const savedIds = await getSavedIds();

    document.querySelectorAll(".file-card").forEach(card => {
      const data = getCardData(card);
      const saveButton = card.querySelector(".save-button");
      const shareButton = card.querySelector(".share-button");

      if (saveButton) {
        const isSaved = savedIds.has(data.fileId);

        saveButton.dataset.saved = isSaved ? "1" : "0";
        saveButton.textContent = isSaved ? "✓" : "Save";
        saveButton.classList.toggle("is-saved", isSaved);

        if (saveButton.dataset.v2Bound !== "1") {
          saveButton.dataset.v2Bound = "1";

          saveButton.addEventListener("click", async event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            await toggleSave(card, saveButton);
          }, true);
        }
      }

      if (shareButton) {
        shareButton.textContent = "Share";

        if (shareButton.dataset.v2Bound !== "1") {
          shareButton.dataset.v2Bound = "1";

          shareButton.addEventListener("click", async event => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            await shareCard(card, shareButton);
          }, true);
        }
      }
    });
  }

  function run() {
    bindUserSubmissionActions();
    setTimeout(bindUserSubmissionActions, 500);
    setTimeout(bindUserSubmissionActions, 1200);
    setTimeout(bindUserSubmissionActions, 2400);
  }

  window.addEventListener("DOMContentLoaded", run);
})();
