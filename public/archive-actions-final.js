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

  function fileNameFromUrl(url) {
    try {
      const parsed = new URL(url, window.location.origin);
      const parts = parsed.pathname.split("/");
      return decodeURIComponent(parts[parts.length - 1] || "file");
    } catch (_) {
      return "file";
    }
  }

  function cleanTitle(text) {
    return (text || "")
      .replace(/Reviewed/gi, "")
      .replace(/User Submission/gi, "")
      .replace(/Submitted by @[\w.-]+/gi, "")
      .replace(/Save/gi, "")
      .replace(/Share/gi, "")
      .replace(/Copied/gi, "")
      .replace(/[✓+]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findCardForImage(img) {
    let node = img;

    for (let i = 0; i < 8; i += 1) {
      node = node.parentElement;
      if (!node) break;

      const text = textOf(node);
      const imgCount = node.querySelectorAll("img").length;

      if (
        imgCount === 1 &&
        (/Reviewed/i.test(text) || /Share/i.test(text) || /\.(jpe?g|png|webp|gif)/i.test(text))
      ) {
        return node.closest("a") || node.closest("article") || node;
      }
    }

    return img.closest("a") || img.closest("article") || img.parentElement;
  }

  function getArchiveCards() {
    const images = Array.from(document.querySelectorAll("img"));
    const cards = [];

    images.forEach((img) => {
      const src = img.currentSrc || img.src || "";
      if (!src) return;

      const card = findCardForImage(img);
      if (!card) return;

      const text = textOf(card);
      const isArchiveCard =
        /Reviewed/i.test(text) ||
        /Share/i.test(text) ||
        /\.(jpe?g|png|webp|gif)/i.test(text) ||
        card.closest("#user-submissions-grid");

      if (!isArchiveCard) return;

      if (!cards.includes(card)) cards.push(card);
    });

    return cards;
  }

  function getCardData(card) {
    const img = card.querySelector("img");
    const imgUrl = img ? img.currentSrc || img.src || "" : "";
    const href = card.href || card.getAttribute("href") || imgUrl;
    const fileName = fileNameFromUrl(imgUrl || href);

    const titleCandidate =
      Array.from(card.querySelectorAll("*"))
        .map((el) => cleanTitle(textOf(el)))
        .filter(Boolean)
        .find((text) => /\.(jpe?g|png|webp|gif)/i.test(text)) ||
      cleanTitle(textOf(card)) ||
      fileName;

    const title = titleCandidate.length > 120 ? fileName : titleCandidate;
    const fileId = "archive-file:" + fileName;
    const shareUrl =
      window.location.origin +
      window.location.pathname +
      "?file=" +
      encodeURIComponent(fileName);

    return {
      imgUrl,
      href,
      fileName,
      title,
      fileId,
      shareUrl
    };
  }

  function getClickableElements(card) {
    return Array.from(card.querySelectorAll("button, a"));
  }

  function findShareButton(card) {
    return (
      getClickableElements(card).find((el) => /^share$/i.test(textOf(el))) ||
      getClickableElements(card).find((el) => /share/i.test(el.className || ""))
    );
  }

  function findSaveButton(card) {
    const clickables = getClickableElements(card);
    const share = findShareButton(card);

    return (
      clickables.find((el) => {
        if (el === share) return false;
        const text = textOf(el);
        return /^(save|saved|✓|\+)$/i.test(text);
      }) ||
      clickables.find((el) => {
        if (el === share) return false;
        return /save/i.test(el.className || "");
      })
    );
  }

  async function getSession() {
    if (!client) return null;
    const result = await client.auth.getSession();
    return result.data && result.data.session ? result.data.session : null;
  }

  async function getSavedIds() {
    if (!client) return new Set();

    const session = await getSession();
    if (!session || !session.user) return new Set();

    const result = await client.rpc("get_my_saved_files");

    if (result.error || !Array.isArray(result.data)) {
      return new Set();
    }

    return new Set(
      result.data
        .map((row) => row.file_id || row.file_key || row.id)
        .filter(Boolean)
    );
  }

  async function saveFile(data, button) {
    if (!client) return;

    const session = await getSession();

    if (!session || !session.user) {
      window.location.href = "/auth?mode=login";
      return;
    }

    button.disabled = true;
    button.textContent = "...";

    const attempts = [
      {
        p_file_id: data.fileId,
        p_file_title: data.title,
        p_file_type: "Archive File",
        p_file_url: data.href || data.imgUrl,
        p_file_meta: data.shareUrl
      },
      {
        file_id: data.fileId,
        file_title: data.title,
        file_type: "Archive File",
        file_url: data.href || data.imgUrl,
        file_meta: data.shareUrl
      }
    ];

    let lastError = null;

    for (const payload of attempts) {
      const result = await client.rpc("save_busta_file", payload);

      if (!result.error) {
        button.disabled = false;
        button.dataset.saved = "1";
        button.textContent = "✓";
        return;
      }

      lastError = result.error;
    }

    button.disabled = false;
    button.textContent = "Save";
    alert("Save failed: " + (lastError && lastError.message ? lastError.message : "Unknown error"));
  }

  async function unsaveFile(data, button) {
    if (!client) return;

    const session = await getSession();

    if (!session || !session.user) {
      window.location.href = "/auth?mode=login";
      return;
    }

    button.disabled = true;
    button.textContent = "...";

    const result = await client.rpc("unsave_busta_file", {
      p_file_id: data.fileId
    });

    button.disabled = false;

    if (result.error) {
      button.textContent = "✓";
      alert("Remove failed: " + result.error.message);
      return;
    }

    button.dataset.saved = "0";
    button.textContent = "Save";
  }

  function bindSave(card, savedIds) {
    const button = findSaveButton(card);
    if (!button) return;

    const data = getCardData(card);
    const isSaved = savedIds.has(data.fileId);

    button.textContent = isSaved ? "✓" : "Save";
    button.dataset.saved = isSaved ? "1" : "0";

    if (button.dataset.archiveFinalBound === "1") return;
    button.dataset.archiveFinalBound = "1";

    button.addEventListener(
      "click",
      async (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const freshData = getCardData(card);

        if (button.dataset.saved === "1") {
          await unsaveFile(freshData, button);
        } else {
          await saveFile(freshData, button);
        }
      },
      true
    );
  }

  function bindShare(card) {
    const button = findShareButton(card);
    if (!button) return;

    button.textContent = "Share";

    if (button.dataset.archiveFinalBound === "1") return;
    button.dataset.archiveFinalBound = "1";

    button.addEventListener(
      "click",
      async (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const data = getCardData(card);

        try {
          await navigator.clipboard.writeText(data.shareUrl);
          button.textContent = "Copied";
          setTimeout(() => {
            button.textContent = "Share";
          }, 900);
        } catch (_) {
          alert("Copy this link manually: " + data.shareUrl);
        }
      },
      true
    );
  }

  function makeImageLink(card) {
    const data = getCardData(card);

    if (!data.shareUrl) return;

    card.dataset.fileLink = data.shareUrl;

    if (card.tagName.toLowerCase() === "a") {
      card.href = data.href || data.imgUrl;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }
  }

  async function applyArchiveActions() {
    const savedIds = await getSavedIds();
    const cards = getArchiveCards();

    cards.forEach((card) => {
      makeImageLink(card);
      bindSave(card, savedIds);
      bindShare(card);
    });
  }

  function openLinkedFileFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const file = params.get("file");
    if (!file) return;

    const decoded = decodeURIComponent(file);

    setTimeout(() => {
      const img = Array.from(document.querySelectorAll("img")).find((image) => {
        const src = image.currentSrc || image.src || "";
        return src.includes(decoded);
      });

      if (!img) return;

      const card = findCardForImage(img);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.style.outline = "2px solid rgba(216,247,207,0.7)";
        card.style.outlineOffset = "4px";

        setTimeout(() => {
          card.style.outline = "";
          card.style.outlineOffset = "";
        }, 2400);
      }
    }, 900);
  }

  function run() {
    applyArchiveActions();
    openLinkedFileFromUrl();

    setTimeout(applyArchiveActions, 600);
    setTimeout(applyArchiveActions, 1400);
    setTimeout(applyArchiveActions, 2600);
  }

  window.addEventListener("DOMContentLoaded", run);
})();
