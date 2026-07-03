const CACHE_NAME = "chaoscore-shell-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./credits.html",
  "./exclusive.html",
  "./styles.css",
  "./app.js",
  "./data/library.js",
  "./manifest.webmanifest",
  "./robots.txt",
  "./assets/chaoscore-cover-original.png",
  "./assets/chaoscore-spotify-cover.jpg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request);
    })
  );
});
