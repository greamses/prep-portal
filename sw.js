const CACHE_NAME = "prepportal-v5";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/manifest-browser.json",
  "/icon.svg",
  "/home/css/main.css",
  "/home/css/login.css",
  "/utils/components/nav.css",
  "/utils/components/loader.js",
  "/utils/components/nav-builder.js",
  "/home/js/auth-modal.js",
];

// The install handler takes care of precaching resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// The activate handler takes care of cleaning up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// App code (HTML/JS/CSS) must never be served stale — a mismatched mix of old
// and new files crashes the app. Use NETWORK-FIRST for those (cache is only an
// offline fallback). Other assets (images, fonts, etc.) use Stale-While-
// Revalidate for speed.
function isAppCode(request) {
  if (request.mode === "navigate") return true;
  return /\.(?:js|mjs|css)(?:\?|$)/i.test(new URL(request.url).pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  const cacheFresh = (response) => {
    if (response && response.status === 200 && response.type === "basic") {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
    return response;
  };

  if (isAppCode(request)) {
    // Network-first: always try the network, fall back to cache when offline.
    event.respondWith(
      fetch(request)
        .then(cacheFresh)
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || (request.mode === "navigate" ? caches.match("/index.html") : undefined)),
        ),
    );
    return;
  }

  // Stale-While-Revalidate for everything else.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then(cacheFresh).catch(() => undefined);
      return cachedResponse || fetchPromise;
    }),
  );
});
