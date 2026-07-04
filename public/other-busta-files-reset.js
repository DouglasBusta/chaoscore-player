(function () {
  function cleanText(value) {
    return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function removeBadUserSubmissionArtifacts() {
    [
      "user-submissions-stable-card",
      "user-submissions-folder",
      "user-submissions-panel",
      "user-submissions-holder"
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    document.querySelectorAll(".user-submissions-panel, .user-submissions-folder").forEach((el) => el.remove());
  }

  function findHeading(title) {
    const wanted = cleanText(title);
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
    const matches = headings.filter((h) => cleanText(h.textContent) === wanted);
    return matches[matches.length - 1] || null;
  }

  function sectionFromHeading(heading) {
    if (!heading) return null;
    return heading.closest("section") || heading.parentElement;
  }

  function removeIds(root) {
    root.removeAttribute("id");
    root.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  }

  function replaceText(root, from, to) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      if (node.nodeValue && node.nodeValue.includes(from)) {
        node.nodeValue = node.nodeValue.replaceAll(from, to);
      }
    });
  }

  function findCardGrid(section) {
    const imageCards = Array.from(section.querySelectorAll("a, article, div"))
      .filter((el) => {
        const text = el.textContent || "";
        return el.querySelector("img") && /reviewed|share/i.test(text);
      })
      .sort((a, b) => (a.textContent || "").length - (b.textContent || "").length);

    if (!imageCards.length) return null;

    const card = imageCards[0].closest("a") || imageCards[0].closest("article") || imageCards[0];
    const grid = card.parentElement;

    return { grid, card };
  }

  function makeUserSubmissionsCard(templateCard) {
    const card = templateCard.cloneNode(true);
    removeIds(card);

    card.classList.add("other-busta-user-submissions-card");

    if (card.tagName.toLowerCase() === "a") {
      card.href = "/user-submissions";
      card.removeAttribute("target");
      card.removeAttribute("rel");
    } else {
      card.addEventListener("click", () => {
        window.location.href = "/user-submissions";
      });
    }

    const img = card.querySelector("img");
    if (img) {
      img.removeAttribute("src");
      img.removeAttribute("srcset");
      img.style.display = "none";
    }

    card.style.background =
      "radial-gradient(circle at 20% 0%, rgba(139,23,23,0.34), transparent 44%), linear-gradient(135deg, rgba(231,224,210,0.08), rgba(231,224,210,0.025)), rgba(0,0,0,0.34)";
    card.style.cursor = "pointer";

    const all = Array.from(card.querySelectorAll("*"));

    const reviewed = all.find((el) => /^reviewed$/i.test((el.textContent || "").trim()));
    if (reviewed) reviewed.textContent = "Subfolder";

    const filename = all.find((el) => /\.(jpe?g|png|webp|gif)$/i.test((el.textContent || "").trim()));
    if (filename) filename.textContent = "User Submissions";

    const share = all.find((el) => /^share$/i.test((el.textContent || "").trim()));
    if (share) share.remove();

    const save = all.find((el) => /^(✓|\+|save)$/i.test((el.textContent || "").trim()));
    if (save) save.remove();

    const submitted = all.find((el) => /submitted by/i.test(el.textContent || ""));
    if (submitted) submitted.textContent = "Approved user files";

    card.querySelectorAll("button").forEach((button) => {
      button.remove();
    });

    card.style.cursor = "pointer";

    return card;
  }

  function rebuildOtherBustaFiles() {
    removeBadUserSubmissionArtifacts();

    const otherHeading = findHeading("Other Busta Files");
    const otherSection = sectionFromHeading(otherHeading);

    const templateHeading =
      findHeading("NUMA Incident — 11 October 2025") ||
      findHeading("Villa Spada Case File");

    const templateSection = sectionFromHeading(templateHeading);

    if (!otherSection || !templateSection || !templateHeading) return;

    const templateData = findCardGrid(templateSection);
    if (!templateData || !templateData.card) return;

    const newOther = templateSection.cloneNode(true);
    removeIds(newOther);

    const newHeading = newOther.querySelector("h1, h2, h3");
    if (newHeading) newHeading.textContent = "Other Busta Files";

    replaceText(newOther, "NUMA Incident — 11 October 2025", "Other Busta Files");
    replaceText(newOther, "Villa Spada Case File", "Other Busta Files");
    replaceText(newOther, "BUSTA FILES / INCIDENT REPORT", "BUSTA FILES / EVIDENCE ROOM");
    replaceText(newOther, "INCIDENT REPORT", "EVIDENCE ROOM");
    replaceText(newOther, "CASE FILE", "EVIDENCE ROOM");
    replaceText(newOther, "INCIDENT REPORT", "EVIDENCE ROOM");
    replaceText(newOther, "CASE FILE", "EVIDENCE ROOM");
    replaceText(newOther, "BUSTA FILES / CASE FILE", "BUSTA FILES / EVIDENCE ROOM");

    // Force right-side section label after cloning, even if original text is split or mutated.
    Array.from(newOther.querySelectorAll("*")).forEach((el) => {
      const value = (el.textContent || "").toUpperCase().replace(/\s+/g, " ").trim();

      if (
        value.includes("BUSTA FILES") &&
        (value.includes("INCIDENT") || value.includes("CASE FILE") || value.includes("REPORT"))
      ) {
        el.textContent = "BUSTA FILES / EVIDENCE ROOM";
      }
    });

    const newGridData = findCardGrid(newOther);
    if (newGridData && newGridData.grid) {
      newGridData.grid.innerHTML = "";
      newGridData.grid.appendChild(makeUserSubmissionsCard(templateData.card));
    }

    otherSection.replaceWith(newOther);
  }

  window.addEventListener("DOMContentLoaded", () => {
    rebuildOtherBustaFiles();
    setTimeout(rebuildOtherBustaFiles, 800);
  });
})();
