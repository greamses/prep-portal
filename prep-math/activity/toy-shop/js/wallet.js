/* ============================================================================
   The Prep Toy Shop — what there is to spend
   ----------------------------------------------------------------------------
   A free visitor is given TEN THOUSAND PREPCOINS — a hundred prepbills — and
   that is all they get. A subscriber has no limit.

   The point of the limit is not to sell anything. It is that a shop where the
   money never runs out is not a shop, it is a button: a child who can buy
   everything has no reason to look at a price, and looking at prices is the
   whole activity. With a hundred prepbills in the purse, the basket has to be
   chosen, and choosing is where the arithmetic starts.

   IT IS ONE PURSE, whichever way they pay. Cash on the counter and the
   PrepCard draw on the same money, because they are the same money — a child
   who could pay cash after the card ran out would have learnt the wrong thing
   about both.

   Premium is read from the cache the page's own guard already wrote
   (`pp_access:<uid>`, utils/auth/premium-guard.js), so this costs no read and
   no network. If it cannot tell, it says FREE: being wrong in that direction
   hands out a hundred prepbills of play money, and being wrong the other way
   would take a paid-for thing away.
   ========================================================================== */

import { writeAmount } from "/utils/components/workbook/purse.js";

const KEY = "ts-wallet";
export const FREE_START = 10000;          /* 100.00, in prepcoins */

/** Does this visitor have a subscription? */
export function unlimited() {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("pp_access:")) continue;
      const v = JSON.parse(localStorage.getItem(k) || "null");
      if (v && (v.premium || v.p)) return true;
    }
  } catch { /* private mode, or no guard has run */ }
  return false;
}

/** What is left to spend, in prepcoins. Infinity for a subscriber. */
export function left() {
  if (unlimited()) return Infinity;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return FREE_START;
    const v = Number(raw);
    return Number.isFinite(v) && v >= 0 ? v : FREE_START;
  } catch {
    return FREE_START;
  }
}

/** Whether a bill of this size can be paid at all. */
export const canAfford = (coins) => left() >= coins;

/**
 * Take a bill out of the purse. A subscriber's purse does not change.
 * → what is left afterwards
 */
export function spend(coins) {
  if (unlimited()) return Infinity;
  const now = Math.max(0, left() - Math.max(0, Math.round(coins)));
  try { localStorage.setItem(KEY, String(now)); } catch { /* not kept */ }
  return now;
}

/** Put it back to the start — for "shop again" when the purse has run dry. */
export function reset() {
  try { localStorage.setItem(KEY, String(FREE_START)); } catch { /* not kept */ }
  return FREE_START;
}

/** What the purse says on the page. */
export function sayLeft() {
  return unlimited() ? "unlimited" : writeAmount(left());
}
