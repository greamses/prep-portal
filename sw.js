const CACHE_NAME = "prepportal-v6";
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
    // Network-first. For JS/CSS, `cache: "reload"` forces a real network hit —
    // a plain fetch(request) may still be answered from the browser's own HTTP
    // cache, so a stale max-age entry would quietly defeat "network-first" and
    // keep serving pre-deploy code. Navigations must reuse the original Request:
    // a Request rebuilt from just a URL loses its `navigate` mode, the fetch
    // fails, and we'd fall through to the offline branch and serve the *home
    // page* in place of whatever page was actually requested.
    const netRequest =
      request.mode === "navigate"
        ? request
        : new Request(request.url, { cache: "reload", credentials: "same-origin" });

    event.respondWith(
      fetch(netRequest)
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
