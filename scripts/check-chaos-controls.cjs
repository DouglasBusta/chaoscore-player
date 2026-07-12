const fs = require("fs");

const html = fs.readFileSync("public/chaoscore.html", "utf8");
const player = fs.readFileSync("public/chaos-current-player-v2.js", "utf8");

const checks = [
  ["HTML has legacy track rows", /\.track\b/.test(html)],
  ["HTML has legacy play buttons", /play-small/.test(html)],
  ["Player listens to legacy play buttons", player.includes(".play-small")],
  ["Player maps legacy row index", player.includes("getLegacyTrackIndex")],
  ["Player syncs legacy buttons", player.includes("syncLegacyTrackButtons")],
  ["Player has direct legacy click guard", player.includes("data-chaos-legacy-bridge")],
  ["Player does not use raw textContent for play icon", !player.includes('btn.textContent = isPlaying ? "❚❚" : "▶";')],
  ["Player exposes runtime double-boot guard", player.includes("__CHAOS_CURRENT_PLAYER_V2_ACTIVE")]
];

let ok = true;

console.log("");
console.log("=== CHAOSCORE CONTROL BUTTON CHECK ===");

for (const [label, pass] of checks) {
  console.log(`${pass ? "✅" : "❌"} ${label}`);
  if (!pass) ok = false;
}

console.log("");
console.log("CONTROL BUTTONS:", ok ? "OK ✅" : "BROKEN / DETACHED ❌");
console.log("");

if (!ok) process.exit(1);
