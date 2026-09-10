/* ============================================================================
   PRINTABLE WORKBOOK — who is signed in
   ----------------------------------------------------------------------------
   Self-contained, like premium-guard.js: full gstatic URLs rather than bare
   specifiers, so a page without an import map still works. Everything that
   needs the account — the admin's watermark switch, the print pass — asks
   here, and Firebase is started once.
   ========================================================================== */

const CONFIG = {
  apiKey: "AIzaSyA2N3uI_XfSIVsto2Ku1g_qSezmD3qFmbk",
  authDomain: "prep-portal-2026.firebaseapp.com",
  projectId: "prep-portal-2026",
  storageBucket: "prep-portal-2026.firebasestorage.app",
  messagingSenderId: "837672918701",
  appId: "1:837672918701:web:c0e40bcae21c3ec4e23024",
};

let started = null;
const listeners = new Set();
let current;          // undefined until Firebase has answered, then user|null

function start() {
  if (started) return started;
  started = (async () => {
    try {
      const [{ initializeApp, getApps, getApp }, { getAuth, onAuthStateChanged }] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js"),
      ]);
      const app = getApps().length ? getApp() : initializeApp(CONFIG);
      onAuthStateChanged(getAuth(app), (user) => {
        current = user || null;
        listeners.forEach((fn) => { try { fn(current); } catch { /* one bad listener is not all of them */ } });
      });
    } catch {
      current = null;
      listeners.forEach((fn) => fn(null));
    }
  })();
  return started;
}

/** Call back with the user (or null) now if known, and on every change. */
export function onUser(fn) {
  listeners.add(fn);
  if (current !== undefined) fn(current);
  start();
  return () => listeners.delete(fn);
}

/** The signed-in user once Firebase has answered, or null. */
export function currentUser() {
  if (current !== undefined) return Promise.resolve(current);
  return new Promise((resolve) => {
    const off = onUser((u) => { off(); resolve(u); });
  });
}

/** Call our API as the signed-in user: POST with a body, GET without one.
    Throws with the server's message. */
export async function api(path, body, method = body === undefined ? "GET" : "POST") {
  const user = await currentUser();
  if (!user) throw new Error("Please sign in first.");
  const base = window.location.port === "5500" ? "http://127.0.0.1:5000" : "";
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    body: method === "GET" ? undefined : JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
