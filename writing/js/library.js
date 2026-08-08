/* ═══════════════════════════════════════════════════════
   THE PROMPT LIBRARY — where an inserted prompt goes afterwards.

   A prompt somebody was actually set in a classroom is worth keeping, so
   every one that is typed into "your own task" is filed on the server under
   the form it was set for (server/routes/writing.js, category "writing").
   That is the whole reason the form is chosen first: a prompt with no form
   has no shelf to sit on.

   Filing is fire-and-forget. Nobody's writing lesson should stop because the
   library was busy, so every call here fails quietly and returns nothing.
═══════════════════════════════════════════════════════ */

import { auth } from '/firebase-init.js';

/* Dev: static site on :5500, API on :5000; same origin in production —
   the same trick ai-client.js and PrepBot use. */
const API_BASE =
  (typeof window !== 'undefined' && window.location.port === '5500')
    ? 'http://127.0.0.1:5000'
    : '';

async function token() {
  const user = auth.currentUser;
  if (!user) return null;
  try { return await user.getIdToken(); } catch { return null; }
}

/* File one task under its form. Resolves the filed id, or false.
   `passage` is how a SUMMARY becomes shareable: its task is a whole reading,
   which cannot travel in a query string, so it is filed and the link points
   at it by id. */
export async function savePrompt({ prompt, form, formLabel, family, videoId, videoStart, passage } = {}) {
  const t = await token();
  if (!t || !prompt || !form) return false;
  try {
    const res = await fetch(`${API_BASE}/api/writing/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ prompt, form, formLabel, family, videoId, videoStart, passage }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return data.id || true;
  } catch { return false; }
}

/** Fetch one filed task by id — what a ?task=<id> share link resolves against. */
export async function fetchTask(id) {
  if (!id) return null;
  try {
    const res = await fetch(`${API_BASE}/api/writing/task/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.found ? data : null;
  } catch { return null; }
}

/* The prompts already on the shelf for a form — yours, plus any published.
   Reports WHY it has nothing rather than just handing back an empty list: an
   empty shelf and an unreachable one look identical to the caller otherwise,
   and telling somebody "nothing is filed here yet" when their connection just
   dropped is a lie the page would then act on. */
export async function listPrompts(form, { limit = 8 } = {}) {
  const t = await token();
  if (!t) return { ok: false, reason: 'signed-out' };
  if (!form) return { ok: false, reason: 'no-form' };
  try {
    const res = await fetch(
      `${API_BASE}/api/writing/prompts?form=${encodeURIComponent(form)}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${t}` } },
    );
    if (!res.ok) return { ok: false, reason: 'unreachable' };
    const data = await res.json();
    return { ok: true, prompts: Array.isArray(data.prompts) ? data.prompts : [] };
  } catch {
    // fetch itself threw — offline, DNS, a dropped socket.
    return { ok: false, reason: 'unreachable' };
  }
}
