const CACHE_NAME = "prepportal-v21";
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
  // JSON counts as app code too. A page's data file is as much a part of a
  // deploy as its script is, and stale-while-revalidate hands back the copy
  // from the first visit — which is how the Toy Shop went on listing toys
  // whose pictures had been removed in a later deploy.
  return /\.(?:js|mjs|css|json)(?:\?|$)/i.test(new URL(request.url).pathname);
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

/* ── PUSH: results and tasks, when the person turned notifications on (utils/components/push.js) ──
   The server (server/lib/notify-out.js) sends { title, body, url, tag }. Clicking the notification brings an open tab of the
   site to that page, or opens one. */
self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (_) { d = { body: event.data ? event.data.text() : "" }; }
  event.waitUntil(self.registration.showNotification(d.title || "Prep Portal", {
    body: d.body || "",
    icon: "/logo/favicon-192.png",
    badge: "/logo/favicon-192.png",
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || "/" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const same = tabs.find((t) => t.url === url);
    if (same) return same.focus();
    const any = tabs.find((t) => t.url.startsWith(self.location.origin));
    if (any && "navigate" in any) { await any.navigate(url); return any.focus(); }
    return self.clients.openWindow(url);
  })());
});
