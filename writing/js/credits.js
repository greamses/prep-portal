/* ═══════════════════════════════════════════════════════
   WRITING CREDITS — the budget for help taken WHILE writing.

   Three things on this page ask a model to help with the draft itself: the
   planner's per-box ideas, a word replacement, a sentence rewrite. They all
   spend from one allowance of 1000, and the allowance exists for a reason
   that is not money — unlimited rewriting turns the exercise into a
   conversation with a machine, and at some point the sheet stops being the
   student's. A thousand is more than an honest session needs and less than
   leaning on it costs.

   IT DOES NOT TOUCH THE MARKING. The examiner is never told the balance, no
   score depends on it, and running out loses nobody a mark: the suggestions
   simply stop. Help taken while drafting is drafting. The UI says so out
   loud, because a counter next to a writing task looks like a penalty until
   somebody tells you it is not.

   The count is SERVER-SIDE (server/routes/writing.js, writingCredits/{uid}).
   A max kept in localStorage is a max until the student opens devtools, and
   this is a max on the student holding the devtools. What lives here is a
   cache of the balance and the wiring that keeps the badge honest.
═══════════════════════════════════════════════════════ */

import { auth } from '/firebase-init.js';

const API_BASE =
  (typeof window !== 'undefined' && window.location.port === '5500')
    ? 'http://127.0.0.1:5000'
    : '';

/* What each kind of help costs. Priced by how much of the writing it does
   for you rather than by what it costs us to run: swapping one word is a
   nudge, rewriting a sentence hands you a sentence, and three ideas for a
   paragraph is the most help on offer here. */
export const COST = { word: 1, sentence: 2, ideas: 3 };

// null = not known yet, or signed out, or an admin (unlimited). The badge
// renders nothing rather than lying about a number it does not have.
let balance = null;
let allocation = null;
let unlimited = false;
let loaded = false;
const listeners = new Set();

export const onCredits = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const announce = () => listeners.forEach((fn) => fn({ balance, allocation, unlimited, loaded }));

export const creditState = () => ({ balance, allocation, unlimited, loaded });
export const canAfford = (kind) => unlimited || balance === null || balance >= (COST[kind] || 1);

async function token() {
  const user = auth.currentUser;
  if (!user) return null;
  try { return await user.getIdToken(); } catch { return null; }
}

function apply(data) {
  balance = data.unlimited ? null : Number(data.balance) || 0;
  allocation = data.unlimited ? null : Number(data.allocation) || 0;
  unlimited = !!data.unlimited;
  loaded = true;
  announce();
}

export async function loadCredits() {
  const t = await token();
  if (!t) { loaded = true; announce(); return; }
  try {
    const res = await fetch(`${API_BASE}/api/writing/credits`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) return;
    apply(await res.json());
  } catch { /* the badge just stays quiet */ }
}

/* Spend, and report whether the spend happened. Called BEFORE the model call
   so the budget is reserved rather than raced — two clicks on a slow
   connection would otherwise both pass an "afford" check and only one of them
   be charged. A refund is not offered when the model then fails, and that is
   a deliberate simplification: it is one credit in a thousand, and a refund
   path is a second place for the balance to go wrong.

   Returns { ok, balance, out } — `out` distinguishes "you have run out" from
   "the network is down", because those are different things to tell someone. */
export async function spend(kind) {
  const cost = COST[kind] || 1;
  const t = await token();
  if (!t) return { ok: false, out: false, signedOut: true };

  try {
    const res = await fetch(`${API_BASE}/api/writing/credits/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ cost }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 402) {
      balance = 0;
      allocation = Number(data.allocation) || allocation;
      loaded = true;
      announce();
      return { ok: false, out: true, balance: 0 };
    }
    if (!res.ok) return { ok: false, out: false };

    apply(data);
    return { ok: true, out: false, balance };
  } catch {
    return { ok: false, out: false };
  }
}

/* ── The badge ─────────────────────────────────────────
   One line, wherever suggestions are offered. It says the number AND what
   the number is not — see the header. Signed out or unlimited, it says
   nothing at all rather than showing a cap that does not apply. */
export function renderCreditBadge(host) {
  if (!host) return;
  const paint = () => {
    if (!loaded || unlimited || balance === null) { host.hidden = true; return; }
    host.hidden = false;
    const low = allocation ? balance <= Math.max(20, allocation * 0.05) : false;
    host.className = `wcredits${balance === 0 ? ' is-out' : low ? ' is-low' : ''}`;
    host.innerHTML = balance === 0
      ? `<strong>No suggestion credits left.</strong> This costs you nothing in marks — carry on writing, the sheet is marked exactly the same.`
      : `<strong>${balance}</strong> of ${allocation} suggestion credits left <em>— they never affect your marks.</em>`;
  };
  paint();
  onCredits(paint);
}
