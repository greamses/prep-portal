/**
 * Login page guard — drop-in, self-contained.
 *
 * Add to any page that should only be usable by a signed-in user (no plan
 * requirement):
 *   <script type="module" src="/utils/auth/login-guard.js"></script>
 *
 * Logged-out visitors are sent to the login gate (with ?next= so they return
 * here after signing in). This is client-side defense-in-depth: the server
 * login middleware also gates the page, but it fails OPEN on any error, so this
 * guarantees a learner can't actually use the activity without logging in.
 *
 * SELF-CONTAINED on purpose: it loads Firebase from full gstatic URLs (not bare
 * specifiers), so it does NOT depend on the host page having an import map, and
 * reuses the already-initialised app when one exists.
 *
 * Failure policy: a transient auth glitch fails OPEN after a few seconds (the
 * veil lifts) so a real, signed-in learner is never trapped.
 */
import {
  initializeApp, getApps, getApp,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2N3uI_XfSIVsto2Ku1g_qSezmD3qFmbk",
  authDomain: "prep-portal-2026.firebaseapp.com",
  projectId: "prep-portal-2026",
  storageBucket: "prep-portal-2026.firebasestorage.app",
  messagingSenderId: "837672918701",
  appId: "1:837672918701:web:c0e40bcae21c3ec4e23024",
  measurementId: "G-N9D8N7D2H2",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Cover the page until login is confirmed so the activity can't be used by a
// logged-out visitor before the redirect fires.
const veil = (() => {
  const dark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  const el = document.createElement("div");
  el.id = "pp-login-veil";
  el.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;" +
    "justify-content:center;font:600 14px/1.5 system-ui,-apple-system,sans-serif;" +
    (dark ? "background:#1a1815;color:#cfc8bd;" : "background:#fffdf8;color:#6b655c;");
  el.textContent = "Checking your access…";
  (document.body || document.documentElement).appendChild(el);
  return el;
})();
const reveal = () => veil.remove();
// Safety net: never trap a signed-in learner if auth stalls (flaky network).
const veilTimeout = setTimeout(reveal, 6000);

function toLogin() {
  const next = encodeURIComponent(location.pathname + location.search);
  location.replace("/index.html?login=1&next=" + next);
}

onAuthStateChanged(auth, (user) => {
  clearTimeout(veilTimeout);
  if (!user) return toLogin();
  reveal(); // signed in → allow
});
