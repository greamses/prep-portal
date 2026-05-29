// ════════════════════════════════════════════════════════════════════════
// BOOK SERVICE — talks to the Grammar Police API.
//   loadBook()        → GET  /api/grammar/book   (falls back to offline mirror)
//   checkWriting(text)→ POST /api/grammar/check  (Firebase-authenticated)
// Same API_BASE convention as the rest of the app: Live Server (:5500) hits the
// local Express server on :5000, everything else uses same-origin /api.
// ════════════════════════════════════════════════════════════════════════

import FALLBACK_BOOK from "../data/book.fallback.js";

const API_BASE =
  window.location.port === "5500" ? "http://127.0.0.1:5000" : "";

// ── Book content ────────────────────────────────────────────────────────────
export async function loadBook() {
  try {
    const res = await fetch(`${API_BASE}/api/grammar/book`);
    if (!res.ok) throw new Error(`book ${res.status}`);
    const book = await res.json();
    if (!book?.units?.length) throw new Error("empty book");
    return { book, source: "api" };
  } catch (err) {
    console.warn("[grammar] using offline book mirror:", err.message);
    return { book: FALLBACK_BOOK, source: "fallback" };
  }
}

// ── AI grammar checker ──────────────────────────────────────────────────────
// Lazily import firebase so the landing page stays light if the user never
// opens the checker. Returns { provider, summary, corrected, errors }.
export async function checkWriting(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("Please type or paste some writing first.");

  let token;
  try {
    const { auth } = await import("/firebase-init.js");
    const user = auth.currentUser;
    if (!user) throw new Error("auth");
    token = await user.getIdToken();
  } catch {
    throw new Error("Please sign in to use the writing checker.");
  }

  const res = await fetch(`${API_BASE}/api/grammar/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text: trimmed }),
  });

  if (!res.ok) {
    let msg = `Checker error (${res.status}).`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* keep generic */
    }
    throw new Error(msg);
  }

  return res.json();
}

export { API_BASE };
