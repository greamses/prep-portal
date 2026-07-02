/**
 * Premium page guard — drop-in, self-contained.
 *
 * Add to any page whose whole experience requires a paid plan:
 *   <script type="module" src="/utils/auth/premium-guard.js"></script>
 *
 * It verifies the signed-in user has `isPremium` (admins are flagged premium on
 * sign-up, so they pass too) by reading users/{uid} in Firestore. Free users are
 * sent to /subscribe.html#plans; logged-out users are sent to the login gate.
 *
 * SELF-CONTAINED on purpose: it loads Firebase from full gstatic URLs (not bare
 * specifiers), so it does NOT depend on the host page having an import map. That
 * avoids the breakage an earlier import-map-dependent guard caused.
 *
 * Failure policy: a *definitive* "not premium" redirects to subscribe; a
 * transient read error fails OPEN (reveals the page) so a Firestore glitch never
 * locks out a paying learner. The server still enforces premium on AI endpoints.
 */
import {
  initializeApp, getApps, getApp,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { featureForPath, getFeatureState } from "/utils/features.js";

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
const db = getFirestore(app);

// Cover the page until access is confirmed so gated content can't flash/peek.
const veil = (() => {
  const dark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  const el = document.createElement("div");
  el.id = "pp-premium-veil";
  el.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;" +
    "justify-content:center;font:600 14px/1.5 system-ui,-apple-system,sans-serif;" +
    (dark ? "background:#1a1815;color:#cfc8bd;" : "background:#fffdf8;color:#6b655c;");
  el.textContent = "Checking your access…";
  (document.body || document.documentElement).appendChild(el);
  return el;
})();
const reveal = () => veil.remove();
// Safety net: never trap a paying learner behind the veil if the auth/Firestore
// check stalls (e.g. flaky network). Reveal after a few seconds — the server
// still gates the AI endpoints and the login middleware still gates the page.
const veilTimeout = setTimeout(reveal, 6000);

function toLogin() {
  const next = encodeURIComponent(location.pathname + location.search);
  location.replace("/index.html?login=1&next=" + next);
}
function toSubscribe() {
  veil.textContent = "Redirecting to plans…";
  location.replace("/subscribe.html#plans");
}
// Feature switched fully OFF by the admin: keep the veil up with a friendly note
// instead of redirecting (nobody, premium or not, gets in until it's re-enabled).
function toDisabled() {
  veil.innerHTML =
    '<div style="max-width:340px;text-align:center;padding:1.5rem;line-height:1.5;">' +
    '<div style="font-size:1rem;font-weight:800;margin-bottom:.5rem;">This feature is currently unavailable</div>' +
    '<div style="font-size:.85rem;opacity:.8;margin-bottom:1.2rem;">It has been switched off by the site administrator. Please check back later.</div>' +
    '<a href="/dashboard.html" style="color:inherit;font-weight:700;text-decoration:underline;">&larr; Back to dashboard</a>' +
    "</div>";
}

// Cache the premium verdict locally so navigating across many premium pages in a
// session doesn't read users/{uid} every single time. Within the TTL we trust the
// cached verdict and skip the Firestore read entirely (the server still enforces
// premium on the AI endpoints, so a stale "allowed" can't be abused). A short TTL
// keeps a downgrade from lingering long.
const PREMIUM_TTL = 10 * 60 * 1000; // 10 minutes
function cachedVerdict(uid) {
  try {
    const raw = localStorage.getItem("pp_premium:" + uid);
    if (!raw) return null;
    const { t, premium } = JSON.parse(raw);
    if (Date.now() - t > PREMIUM_TTL) return null;
    return Boolean(premium);
  } catch (e) {
    return null;
  }
}
function storeVerdict(uid, premium) {
  try {
    localStorage.setItem("pp_premium:" + uid, JSON.stringify({ t: Date.now(), premium }));
  } catch (e) {}
}

onAuthStateChanged(auth, async (user) => {
  clearTimeout(veilTimeout);
  if (!user) return toLogin();

  // Which feature does this page belong to, and how has the admin set it?
  //   off     → nobody gets in
  //   free    → any signed-in user gets in (no premium needed)
  //   premium → fall through to the premium check below
  // A page not in the registry (or a config blip) defaults to premium, i.e. the
  // original guard behaviour, so nothing loosens by accident.
  const featureId = featureForPath(location.pathname);
  if (featureId) {
    let state = "premium";
    try { state = await getFeatureState(featureId); } catch (_) {}
    if (state === "off") return toDisabled();
    if (state === "free") return reveal();
  }

  // Fast path: a fresh cached verdict avoids a Firestore read on every page.
  const cached = cachedVerdict(user.uid);
  if (cached === true) return reveal();
  if (cached === false) return toSubscribe();

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const premium = snap.exists() && !!snap.data().isPremium;
    storeVerdict(user.uid, premium);
    if (premium) return reveal(); // allowed
  } catch (e) {
    return reveal(); // transient read error → fail open (server still gates AI)
  }
  toSubscribe(); // definitively not premium
});
