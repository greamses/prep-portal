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

/** File one prompt under its form. Resolves false when it could not be saved. */
export async function savePrompt({ prompt, form, formLabel, family, videoId, videoStart } = {}) {
  const t = await token();
  if (!t || !prompt || !form) return false;
  try {
    const res = await fetch(`${API_BASE}/api/writing/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ prompt, form, formLabel, family, videoId, videoStart }),
    });
    return res.ok;
  } catch { return false; }
}

/** The prompts already on the shelf for a form — yours, plus any published. */
export async function listPrompts(form, { limit = 8 } = {}) {
  const t = await token();
  if (!t || !form) return [];
  try {
    const res = await fetch(
      `${API_BASE}/api/writing/prompts?form=${encodeURIComponent(form)}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${t}` } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.prompts) ? data.prompts : [];
  } catch { return []; }
}
