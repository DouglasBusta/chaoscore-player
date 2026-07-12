const fs = require("fs");

const html = fs.readFileSync("public/chaoscore.html", "utf8");
const player = fs.readFileSync("public/chaos-current-player-v2.js", "utf8");

const externalPlayerLoads = [...html.matchAll(/<script[^>]+src=["']\/chaos-current-player-v2\.js\?v=\d+["'][^>]*><\/script>/g)].length;

const disabledOldPlayer = html.includes('id="chaoscore-old-inline-player-disabled"');

const activeOldInlineMarkers = [
  'function toggleTrack(index)',
  'audio.addEventListener("ended", () => syncUI("pause"))',
  'audio.addEventListener("timeupdate", () => syncUI())'
].filter((marker) => html.includes(marker));

const hasRuntimeGuard = player.includes("__CHAOS_CURRENT_PLAYER_V2_ACTIVE");

const isOff =
  externalPlayerLoads === 1 &&
  disabledOldPlayer &&
  activeOldInlineMarkers.length === 0 &&
  hasRuntimeGuard;

console.log("");
console.log("=== CHAOSCORE DOUBLE PLAYER CHECK ===");
console.log("External player loads:", externalPlayerLoads);
console.log("Old inline player disabled:", disabledOldPlayer ? "YES" : "NO");
console.log("Active old inline markers:", activeOldInlineMarkers.length ? activeOldInlineMarkers.join(", ") : "none");
console.log("Runtime double-boot guard:", hasRuntimeGuard ? "YES" : "NO");
console.log("");
console.log("SECOND PLAYER:", isOff ? "OFF ✅" : "ON ❌");
console.log("");

if (!isOff) {
  process.exit(1);
}
