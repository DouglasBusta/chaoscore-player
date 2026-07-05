import fs from "node:fs";

const files = [
  "chaoscore.html",
  "public/chaoscore.html",
  "public/chaos-current-player-v2.js",
  "public/chaos-current-player-v2.css",
];

const banned = [
  "chaos-main-volume",
  "chaos-busta-overlay-same-player",
  "look-chaos-dock-player",
  "chaos-single-shell-player",
  "chaos-files-overlay-player",
  "chaos-one-player-cleanup",
  "chaos-unified-player",
  "chaos-mini-visibility-guard",
  "safe-mini",
  "mini-player",
  "chaos-current-busta-overlay",
  "chaos-current-busta-close",
  "Back to #chaoscore"
];

let failed = false;

function fail(message) {
  failed = true;
  console.error("❌ " + message);
}

function ok(message) {
  console.log("✅ " + message);
}

for (const file of files) {
  if (!fs.existsSync(file)) {
    fail(`File mancante: ${file}`);
    continue;
  }

  const text = fs.readFileSync(file, "utf8");

  for (const word of banned) {
    if (text.includes(word)) {
      fail(`${file} contiene riferimento vietato: ${word}`);
    }
  }
}

for (const htmlFile of ["chaoscore.html", "public/chaoscore.html"]) {
  const html = fs.readFileSync(htmlFile, "utf8");

  const audioCount = (html.match(/id=["']audio["']/g) || []).length;
  const playerSectionCount = (html.match(/<section[^>]*class=["'][^"']*\bplayer\b/g) || []).length;
  const currentPlayerCssCount = (html.match(/chaos-current-player-v2\.css/g) || []).length;
  const currentPlayerJsCount = (html.match(/chaos-current-player-v2\.js/g) || []).length;
  const tracksDataCount = (html.match(/chaoscore-tracks\.js/g) || []).length;

  if (audioCount !== 1) fail(`${htmlFile}: deve avere 1 solo audio#audio, trovato ${audioCount}`);
  else ok(`${htmlFile}: 1 solo audio#audio`);

  if (playerSectionCount !== 1) fail(`${htmlFile}: deve avere 1 sola section.player, trovato ${playerSectionCount}`);
  else ok(`${htmlFile}: 1 sola section.player`);

  if (currentPlayerCssCount !== 1) fail(`${htmlFile}: deve linkare chaos-current-player-v2.css una volta, trovato ${currentPlayerCssCount}`);
  else ok(`${htmlFile}: CSS player v2 collegato una volta`);

  if (currentPlayerJsCount !== 1) fail(`${htmlFile}: deve linkare chaos-current-player-v2.js una volta, trovato ${currentPlayerJsCount}`);
  else ok(`${htmlFile}: JS player v2 collegato una volta`);

  if (tracksDataCount !== 1) fail(`${htmlFile}: deve linkare chaoscore-tracks.js una volta, trovato ${tracksDataCount}`);
  else ok(`${htmlFile}: track data collegata una volta`);
}

if (failed) {
  console.error("\nSTOP: rischio doppio player/layer. Non pushare.");
  process.exit(1);
}

console.log("\nOK: controllo anti-doppio-player passato.");
