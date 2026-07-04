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

  const TEMPLATE_TOKENS = [
    "DSC04317.JPG",
    "DSC04366.JPG",
    "IMG_1468.JPG",
    "IMG_1475.JPG",
    "82179e2f"
  ];

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").trim();
  }

  function findTemplateCard() {
    for (const token of TEMPLATE_TOKENS) {
      const candidates = Array.from(document.querySelectorAll("a, article, div"))
        .filter((el) => {
          const text = textOf(el);
          return (
            text.includes(token) &&
            el.querySelector("img") &&
            /share/i.test(text)
          );
        })
        .sort((a, b) => textOf(a).length - textOf(b).length);

      if (candidates[0]) {
        return {
          card: candidates[0].closest("a") || candidates[0].closest("article") || candidates[0],
          token
        };
      }
    }

    return null;
  }

  function removeIds(root) {
    root.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    root.removeAttribute("id");
  }

  function replaceText(root, oldText, newText) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      if (node.nodeValue && node.nodeValue.includes(oldText)) {
        node.nodeValue = node.nodeValue.replace(oldText, newText);
      }
    });
  }

  function findElementByText(root, matcher) {
    return Array.from(root.querySelectorAll("*")).find((el) => matcher(textOf(el)));
  }

  function findSaveAndShare(root) {
    const clickable = Array.from(root.querySelectorAll("button, a"));

    const share = clickable.find((el) => /^share$/i.test(textOf(el))) ||
      clickable.find((el) => /share/i.test(el.className || ""));

    const save = clickable.find((el) => el !== share && /^(✓|\+|save)$/i.test(textOf(el))) ||
      clickable.find((el) => el !== share && /save/i.test(el.className || ""));

    return { save, share };
  }

  async function savedFileIds() {
    if (!client) return new Set();

    const sessionResult = await client.auth.getSession();
    const session = sessionResult.data && sessionResult.data.session;

    if (!session || !session.user) return new Set();

    const result = await client.rpc("get_my_saved_files");
    if (result.error || !Array.isArray(result.data)) return new Set();

    return new Set(
      result.data
        .map((row) => row.file_id || row.file_key || row.id)
        .filter(Boolean)
    );
  }

  async function saveFile(fileId, title, url, button) {
    if (!client) return;

    const sessionResult = await client.auth.getSession();
    const session = sessionResult.data && sessionResult.data.session;

    if (!session || !session.user) {
      window.location.href = "/auth?mode=login";
      return;
    }

    button.disabled = true;

    const attempts = [
      {
        p_file_id: fileId,
        p_file_title: title,
        p_file_type: "User Submission",
        p_file_url: url,
        p_file_meta: "Other Busta Files / User Submissions"
      },
      {
        file_id: fileId,
        file_title: title,
        file_type: "User Submission",
        file_url: url,
        file_meta: "Other Busta Files / User Submissions"
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
    alert("Save failed: " + (lastError && lastError.message ? lastError.message : "Unknown error"));
  }

  async function unsaveFile(fileId, button) {
    if (!client) return;

    const sessionResult = await client.auth.getSession();
    const session = sessionResult.data && sessionResult.data.session;

    if (!session || !session.user) {
      window.location.href = "/auth?mode=login";
      return;
    }

    button.disabled = true;

    const result = await client.rpc("unsave_busta_file", {
      p_file_id: fileId
    });

    button.disabled = false;

    if (result.error) {
      alert("Remove failed: " + result.error.message);
      return;
    }

    button.dataset.saved = "0";
    button.textContent = "+";
  }

  async function loadApprovedFiles() {
    if (!client) return [];

    const result = await client
      .from("approved_busta_files")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

    if (result.error) {
      console.warn("approved_busta_files error", result.error);
      return [];
    }

    return result.data || [];
  }

  function makeClone(template, templateToken, item, savedIds) {
    const clone = template.cloneNode(true);
    const title = item.title || item.file_name || "User Submission";
    const url = item.file_url || "";
    const fileId = "user-submission:" + url;

    removeIds(clone);

    clone.classList.add("user-submission-cloned-from-real-card");

    if (clone.tagName.toLowerCase() === "a") {
      clone.href = url;
      clone.target = "_blank";
      clone.rel = "noopener noreferrer";
    } else {
      clone.addEventListener("click", () => {
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      });
    }

    const img = clone.querySelector("img");
    if (img && item.file_url) {
      img.src = item.file_url;
      img.alt = title;
    }

    replaceText(clone, templateToken, title);

    const reviewed = findElementByText(clone, (text) => /^reviewed$/i.test(text));
    if (reviewed) reviewed.textContent = "Reviewed";

    const submittedText = "Submitted by @" + (item.submitted_by_username || "unknown");
    const existingSubmitted = findElementByText(clone, (text) => /submitted by/i.test(text));

    if (existingSubmitted) {
      existingSubmitted.textContent = submittedText;
    }

    const buttons = findSaveAndShare(clone);

    if (buttons.save) {
      buttons.save.textContent = savedIds.has(fileId) ? "✓" : "+";
      buttons.save.dataset.saved = savedIds.has(fileId) ? "1" : "0";

      buttons.save.addEventListener(
        "click",
        async (event) => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          if (buttons.save.dataset.saved === "1") {
            await unsaveFile(fileId, buttons.save);
          } else {
            await saveFile(fileId, title, url, buttons.save);
          }
        },
        true
      );
    }

    if (buttons.share) {
      buttons.share.textContent = "Share";

      buttons.share.addEventListener(
        "click",
        async (event) => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          try {
            await navigator.clipboard.writeText(url);
            buttons.share.textContent = "Copied";
            setTimeout(() => {
              buttons.share.textContent = "Share";
            }, 900);
          } catch (_) {
            alert("Copy this link manually: " + url);
          }
        },
        true
      );
    }

    return clone;
  }

  async function rebuild() {
    const grid = document.getElementById("user-submissions-grid");
    if (!grid) return;

    const templateData = findTemplateCard();
    if (!templateData || !templateData.card) return;

    const files = await loadApprovedFiles();
    const savedIds = await savedFileIds();

    grid.innerHTML = "";

    if (!files.length) {
      grid.innerHTML = '<div class="busta-empty-folder-note">No user submissions approved yet.</div>';
      return;
    }

    files.forEach((item) => {
      const clone = makeClone(templateData.card, templateData.token, item, savedIds);
      grid.appendChild(clone);
    });
  }

  function run() {
    rebuild();
    setTimeout(rebuild, 900);
    setTimeout(rebuild, 2200);
  }

  window.addEventListener("DOMContentLoaded", run);
})();
