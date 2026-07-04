(function () {
  function fixOtherBustaFiles() {
    const card = document.querySelector(".other-busta-user-submissions-card");

    if (card) {
      if (card.tagName.toLowerCase() === "a") {
        card.href = "/user-submissions";
        card.removeAttribute("target");
        card.removeAttribute("rel");
      }

      card.style.background =
        "radial-gradient(circle at 20% 0%, rgba(139,23,23,0.34), transparent 44%), linear-gradient(135deg, rgba(231,224,210,0.08), rgba(231,224,210,0.025)), rgba(0,0,0,0.34)";
      card.style.cursor = "pointer";

      card.querySelectorAll("img").forEach((img) => {
        img.removeAttribute("src");
        img.removeAttribute("srcset");
        img.style.display = "none";
      });

      card.querySelectorAll("button").forEach((button) => button.remove());

      const links = Array.from(card.querySelectorAll("a"));
      links.forEach((link) => {
        if (/share|save|✓|\+/i.test(link.textContent || "")) {
          link.remove();
        }
      });
    }

    Array.from(document.querySelectorAll("*")).forEach((el) => {
      if ((el.textContent || "").trim() === "BUSTA FILES / INCIDENT REPORT") {
        el.textContent = "BUSTA FILES / EVIDENCE ROOM";
      }

      if ((el.textContent || "").trim() === "INCIDENT REPORT") {
        el.textContent = "EVIDENCE ROOM";
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    fixOtherBustaFiles();
    setTimeout(fixOtherBustaFiles, 500);
    setTimeout(fixOtherBustaFiles, 1200);
  });
})();
