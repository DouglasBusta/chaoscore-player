(function () {
  if (window.__disableDuplicateMiniPlayerMounted) return;
  window.__disableDuplicateMiniPlayerMounted = true;

  function killDuplicateMiniPlayer() {
    document.querySelectorAll(
      "#chaos-safe-mini-player, .chaos-safe-mini-player, .chaos-safe-mini, #chaos-now-backdrop, .chaos-now-backdrop"
    ).forEach((el) => {
      el.remove();
    });

    const mainAudio = document.getElementById("audio");

    document.querySelectorAll("audio").forEach((audio) => {
      if (audio !== mainAudio) {
        try {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
        } catch (_) {}

        audio.remove();
      }
    });
  }

  killDuplicateMiniPlayer();

  const observer = new MutationObserver(killDuplicateMiniPlayer);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
