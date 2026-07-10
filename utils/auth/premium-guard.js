/**
 * Premium page guard — drop-in, self-contained.
 *
 * Add to any page whose whole experience requires a paid plan:
 *   <script type="module" src="/utils/auth/premium-guard.js"></script>
 *
 * It resolves the page's feature (and sub-part, e.g. an individual 3D game)
 * through the shared registry (/utils/features.js): admin off/free/premium
 * state + per-user grant/block overrides + part checkboxes, falling back to
 * the plain `isPremium` check (admins are flagged premium on sign-up, so they
 * pass too) for premium-state features. Free users are sent to
 * /subscribe.html#plans; logged-out users are sent to the login gate.
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
import { featureAndPartForPath, resolveUserAccess } from "/utils/features.js";

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

// Cache the user's entitlement (premium flag + per-user featureOverrides)
// locally so navigating across many gated pages in a session doesn't read
// users/{uid} every single time. Within the TTL we trust the cached value and
// skip the Firestore read entirely (the server still enforces access on its
// endpoints, so a stale "allowed" can't be abused). A short TTL keeps a
// downgrade — or an admin's per-user grant/block — from lingering long.
const ACCESS_TTL = 5 * 60 * 1000; // 5 minutes
function cachedEntitlement(uid) {
  try {
    const raw = localStorage.getItem("pp_access:" + uid);
    if (!raw) return null;
    const { t, premium, overrides } = JSON.parse(raw);
    if (Date.now() - t > ACCESS_TTL) return null;
    return { premium: !!premium, overrides: overrides || {} };
  } catch (e) {
    return null;
  }
}
function storeEntitlement(uid, ent) {
  try {
    localStorage.setItem(
      "pp_access:" + uid,
      JSON.stringify({ t: Date.now(), premium: ent.premium, overrides: ent.overrides })
    );
  } catch (e) {}
}

onAuthStateChanged(auth, async (user) => {
  clearTimeout(veilTimeout);
  if (!user) return toLogin();

  // Which feature (and sub-part — e.g. an individual 3D game) does this page
  // belong to, and what's the admin's setting + this user's override for it?
  // Resolution order (resolveAccess in /utils/features.js):
  //   part-disabled → per-user block → per-user grant → off/free/premium.
  const { featureId, partId } = featureAndPartForPath(location.pathname);

  // The user's entitlement: cached, else one users/{uid} read.
  let ent = cachedEntitlement(user.uid);
  let entFresh = !!ent;
  if (!ent) {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const d = (snap.exists() && snap.data()) || {};
      ent = { premium: !!d.isPremium, overrides: d.featureOverrides || {} };
      entFresh = true;
      storeEntitlement(user.uid, ent);
    } catch (e) {
      ent = null; // transient read error — decide below, failing open
    }
  }

  // A page not in the registry keeps the original guard behaviour: plain
  // premium check, so nothing loosens by accident.
  if (!featureId) {
    if (!ent) return reveal(); // read error → fail open (server still gates)
    return ent.premium ? reveal() : toSubscribe();
  }

  let verdict;
  try {
    verdict = await resolveUserAccess({
      featureId,
      partId,
      profile: ent ? { isPremium: ent.premium, featureOverrides: ent.overrides } : null,
    });
  } catch (e) {
    return reveal(); // resolver/config blew up → fail open
  }

  if (verdict.allowed) return reveal();
  if (verdict.reason === "premium-required") {
    // Only send to subscribe on a DEFINITIVE "not premium"; a failed profile
    // read fails open so a Firestore glitch never locks out a paying learner.
    return entFresh && ent ? toSubscribe() : reveal();
  }
  return toDisabled(); // off / override-block / part-disabled
});
