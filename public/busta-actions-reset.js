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

  function text(el) {
    return (el?.textContent || "").trim();
  }

  function isUserSubmissionsPage() {
    return location.pathname.replace(/\/$/, "") === "/user-submissions";
  }

  function isArchivePage() {
    return !isUserSubmissionsPage();
  }

  function archiveFileCards() {
    return Array.from(document.querySelectorAll("[data-save-file], [data-share-file]"))
      .map(button => {
        const fileName = button.getAttribute("data-save-file") || button.getAttribute("data-share-file");
        const card =
          button.closest(".file-card") ||
          button.closest("article") ||
          button.closest("a") ||
          button.closest("div");

        return card && fileName ? { card, fileName } : null;
      })
      .filter(Boolean)
      .filter((item, index, arr) => {
        return arr.findIndex(other => other.card === item.card && other.fileName === item.fileName) === index;
      });
  }

  function userSubmissionCards() {
    return Array.from(document.querySelectorAll(".file-card")).map(card => {
      const img = card.querySelector("img");
      const title =
        card.querySelector(".file-title")?.textContent?.trim() ||
        "User Submission";

      const fileUrl =
        img?.src ||
        "";

      const fileName =
        card.dataset.fileId ||
        title ||
        fileUrl;

      return { card, fileName, title, fileUrl };
    });
  }

  function archiveFileUrl(fileName) {
    return location.origin + "/exclusive/" + encodeURIComponent(fileName);
  }

  function archiveShareLink(fileName) {
    return location.origin + "/exclusive?file=" + encodeURIComponent(fileName);
  }

  function userShareLink(fileName) {
    return location.origin + "/user-submissions?file=" + encodeURIComponent(fileName);
  }

  function archiveFileId(fileName) {
    return fileName;
  }

  function userFileId(fileUrl) {
    return "user-submission:" + fileUrl;
  }

  async function session() {
    if (!client) return null;
    const result = await client.auth.getSession();
    return result.data?.session || null;
  }

  async function getSavedIds() {
    const s = await session();
    if (!s?.user) return new Set();

    const result = await client.rpc("get_my_saved_files");

    if (!result.error && Array.isArray(result.data)) {
      return new Set(
        result.data
          .map(row => row.file_id || row.file_key || row.id || row.name)
          .filter(Boolean)
      );
    }

    const fallback = await client
      .from("saved_files")
      .select("file_id")
      .eq("user_id", s.user.id);

    if (!fallback.error && Array.isArray(fallback.data)) {
      return new Set(fallback.data.map(row => row.file_id).filter(Boolean));
    }

    return new Set();
  }

  function createButton(label, kind) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "file-action busta-fresh-action busta-" + kind;
    button.textContent = label;
    button.style.appearance = "none";
    button.style.webkitAppearance = "none";
    return button;
  }

  function findActionsContainer(card) {
    const oldAction =
      card.querySelector("[data-save-file], [data-share-file], .save-button, .share-button, .busta-fresh-action");

    return (
      oldAction?.parentElement ||
      card.querySelector(".actions") ||
      card.querySelector(".file-info") ||
      card
    );
  }

  function wipeOldButtons(card) {
    card.querySelectorAll(
      "[data-save-file], [data-share-file], .save-button, .share-button, .busta-fresh-action"
    ).forEach(el => el.remove());
  }

  function setSaved(button, saved) {
    button.dataset.saved = saved ? "1" : "0";
    button.textContent = saved ? "✓" : "Save";
    button.classList.toggle("is-saved", saved);
  }

  async function saveFile(payload, button) {
    const s = await session();

    if (!s?.user) {
      location.href = "/auth?mode=login";
      return;
    }

    button.disabled = true;
    button.textContent = "...";

    const result = await client.rpc("save_busta_file", payload);

    button.disabled = false;

    if (result.error) {
      button.textContent = button.dataset.saved === "1" ? "✓" : "Save";
      alert("Save failed: " + result.error.message);
      return;
    }

    setSaved(button, true);
  }

  async function unsaveFile(fileId, button) {
    const s = await session();

    if (!s?.user) {
      location.href = "/auth?mode=login";
      return;
    }

    button.disabled = true;
    button.textContent = "...";

    const result = await client.rpc("unsave_busta_file", {
      p_file_id: fileId
    });

    button.disabled = false;

    if (result.error) {
      button.textContent = "✓";
      alert("Remove failed: " + result.error.message);
      return;
    }

    setSaved(button, false);
  }

  async function copyLink(link, button) {
    try {
      await navigator.clipboard.writeText(link);
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = "Share";
      }, 1400);
    } catch (_) {
      alert("Copy this link manually: " + link);
    }
  }

  async function rebuildArchiveButtons(savedIds) {
    const cards = archiveFileCards();

    cards.forEach(({ card, fileName }) => {
      const container = findActionsContainer(card);
      wipeOldButtons(card);

      const save = createButton("Save", "save");
      const share = createButton("Share", "share");

      const id = archiveFileId(fileName);
      const isSaved =
        savedIds.has(id) ||
        savedIds.has("archive:" + id) ||
        savedIds.has(archiveFileUrl(fileName));

      setSaved(save, isSaved);

      save.addEventListener("click", async event => {
        event.preventDefault();
        event.stopPropagation();

        if (save.dataset.saved === "1") {
          await unsaveFile(id, save);
        } else {
          await saveFile({
            p_file_id: id,
            p_file_title: fileName,
            p_file_type: "Busta File",
            p_file_url: archiveFileUrl(fileName),
            p_file_meta: archiveShareLink(fileName)
          }, save);
        }
      });

      share.addEventListener("click", async event => {
        event.preventDefault();
        event.stopPropagation();
        await copyLink(archiveShareLink(fileName), share);
      });

      container.appendChild(save);
      container.appendChild(share);
    });
  }

  async function rebuildUserSubmissionButtons(savedIds) {
    const cards = userSubmissionCards();

    cards.forEach(({ card, fileName, title, fileUrl }) => {
      const container = findActionsContainer(card);
      wipeOldButtons(card);

      const save = createButton("Save", "save");
      const share = createButton("Share", "share");

      const id = userFileId(fileUrl);
      setSaved(save, savedIds.has(id));

      save.addEventListener("click", async event => {
        event.preventDefault();
        event.stopPropagation();

        if (save.dataset.saved === "1") {
          await unsaveFile(id, save);
        } else {
          await saveFile({
            p_file_id: id,
            p_file_title: title,
            p_file_type: "User Submission",
            p_file_url: fileUrl,
            p_file_meta: userShareLink(fileName)
          }, save);
        }
      });

      share.addEventListener("click", async event => {
        event.preventDefault();
        event.stopPropagation();
        await copyLink(userShareLink(fileName), share);
      });

      container.appendChild(save);
      container.appendChild(share);
    });
  }

  async function rebuildAll() {
    const savedIds = await getSavedIds();

    if (isUserSubmissionsPage()) {
      await rebuildUserSubmissionButtons(savedIds);
    } else {
      await rebuildArchiveButtons(savedIds);
    }
  }

  function boot() {
    rebuildAll();
    setTimeout(rebuildAll, 500);
    setTimeout(rebuildAll, 1200);
    setTimeout(rebuildAll, 2400);
  }

  window.addEventListener("DOMContentLoaded", boot);

  const observer = new MutationObserver(() => {
    clearTimeout(window.__bustaFreshButtonsTimer);
    window.__bustaFreshButtonsTimer = setTimeout(rebuildAll, 180);
  });

  window.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
