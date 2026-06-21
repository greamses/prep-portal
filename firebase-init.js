// firebase-init.js - Central Firebase configuration
import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA2N3uI_XfSIVsto2Ku1g_qSezmD3qFmbk",
  authDomain: "prep-portal-2026.firebaseapp.com",
  projectId: "prep-portal-2026",
  storageBucket: "prep-portal-2026.firebasestorage.app",
  messagingSenderId: "837672918701",
  appId: "1:837672918701:web:c0e40bcae21c3ec4e23024",
  measurementId: "G-N9D8N7D2H2",
};

// Defensive initialization: reuse the existing app if it exists
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);

// Initialize the provider and configure it to always prompt for account selection
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

console.log("Firebase initialized:", app.name);

/* ─────────────────────────────────────────────────────────────────────────
   SERVER SESSION COOKIE
   Keep an httpOnly Firebase session cookie in sync with the client auth state
   so the Vercel middleware can gate pages server-side. On sign-in we POST a
   fresh ID token to mint the cookie (throttled to ~12h so normal page loads
   don't re-mint every time); on sign-out we clear it. Right after a login that
   came from the gate, we return the learner to their original page (?next=).
───────────────────────────────────────────────────────────────────────── */
const API_BASE =
  typeof window !== "undefined" && window.location.port === "5500"
    ? "http://127.0.0.1:5000"
    : "";
const SESSION_TS_KEY = "pp_session_ts";
const SESSION_REFRESH_MS = 12 * 60 * 60 * 1000;

function readNext() {
  try {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && n.charAt(0) === "/" && n.charAt(1) !== "/") return n;
  } catch (e) {}
  return null;
}

async function mintSession(user) {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch(`${API_BASE}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      credentials: "include",
    });
    if (res.ok) { try { localStorage.setItem(SESSION_TS_KEY, String(Date.now())); } catch (e) {} }
    return res.ok;
  } catch (e) { return false; }
}

onAuthStateChanged(auth, async (user) => {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      const next = readNext();
      // A gate redirect (?next=) means the server had no valid cookie, so we
      // MUST mint a fresh one before returning — never trust the throttle here
      // (otherwise a cleared/expired cookie would loop). Only redirect on success.
      let ok = true;
      let ts = 0;
      try { ts = +localStorage.getItem(SESSION_TS_KEY) || 0; } catch (e) {}
      if (next || Date.now() - ts > SESSION_REFRESH_MS) ok = await mintSession(user);
      if (next && ok) window.location.replace(next);
    } else {
      try { localStorage.removeItem(SESSION_TS_KEY); } catch (e) {}
      await fetch(`${API_BASE}/api/auth/session`, { method: "DELETE", credentials: "include" });
    }
  } catch (e) {
    console.warn("session sync failed:", e.message);
  }
});

// Expose auth to classic (non-module) scripts that need an ID token,
// e.g. the CBT quiz engine's free-response AI marking.
if (typeof window !== "undefined") window.firebaseAuth = auth;

export { auth, db, storage, googleProvider };
