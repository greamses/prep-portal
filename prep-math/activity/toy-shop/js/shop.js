/* ============================================================================
   The Prep Toy Shop — the feed, the money, and what is in the basket
   ----------------------------------------------------------------------------
   THE FEED IS FETCHED, not written into the page: `toys.json` is asked for over
   the network like any shop's product feed, and the page is built from what
   comes back. It is OUR dummy feed because no public one sells toys — and
   because the prices have a job to do that a real feed's would not.

   EVERY PRICE AND EVERY DISCOUNT LANDS ON A WHOLE PREPCOIN. That is not
   decoration: a child checking a shop's arithmetic has to be able to be
   CERTAIN, and "near enough, it rounded" is the one answer a till never gives.
   Prices are multiples of half a prepbill, so a subtotal is always a multiple
   of 50 prepcoins and 10% or 20% of it is a whole number of coins too.

   All money is held as a whole number of PREPCOINS (see the currency itself in
   utils/components/workbook/purse.js). Nothing here is ever a float: 0.1 + 0.2
   is not 0.3, and a shop that says so is a shop nobody trusts.
   ========================================================================== */

import { PER_BILL, writeAmount } from "/utils/components/workbook/purse.js";

/** A percentage of an amount, to the nearest prepcoin. */
export const percentOf = (coins, rate) => Math.round((coins * rate) / 100);

/** What was typed, as prepcoins — or null if it is not an amount. */
export function readAmount(text) {
  const t = String(text ?? "").trim().replace(/[\s,]/g, "").replace(/[−–]/g, "-");
  if (!/^-?\d*(\.\d{0,2})?$/.test(t) || t === "" || t === "." || t === "-") return null;
  return Math.round(Number(t) * PER_BILL);
}

/* ── the feed ──────────────────────────────────────────────────────────────*/

/**
 * Ask the shop for its stock. The prices come back as prepbills with a point
 * in them, the way a feed writes them, and are turned into whole prepcoins
 * once, here, so that nothing downstream ever has to.
 */
export async function loadToys(url = "./toys.json") {
  /* `no-store` beats the browser's HTTP cache but not a service worker's, and
     ours served this file stale-while-revalidate — so a visitor kept the first
     catalogue they ever loaded and went on being shown toys whose pictures a
     later deploy had removed. sw.js now treats .json as app code; the stamp is
     the belt to that pair of braces, for workers already installed. */
  const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`the shop did not answer (${res.status})`);
  const feed = await res.json();
  const products = (feed.products || []).map((p, i) => {
    const price = Math.round(Number(p.price) * PER_BILL);
    const off = percentOf(price, Number(p.discountPercentage) || 0);
    return {
      ...p,
      slot: i,
      price,                       // prepcoins, before the discount
      off,                         // prepcoins off each one
      now: price - off,            // prepcoins each, after it
      cut: Number(p.discountPercentage) || 0,
    };
  });
  return { ...feed, products, taxRates: feed.taxRates || [10, 20] };
}

/* ── the basket ────────────────────────────────────────────────────────────*/

/**
 * What is in the basket, and every sum the till will ask about. The page never
 * SHOWS these — they are what the child's own answers are marked against.
 */
export function bill(lines, rate) {
  const rows = lines.map((l) => {
    const gross = l.n * l.price;               // so many, at the shelf price
    const off = percentOf(gross, l.cut);       // what the sale takes off the line
    /* `cut` stays the RATE the whole way through (20 means 20%); `off` is the
       money it takes off. Letting one name carry both printed "500%". */
    return { ...l, gross, off, net: gross - off };
  });
  const subtotal = rows.reduce((t, r) => t + r.net, 0);
  const tax = percentOf(subtotal, rate);
  return { rows, subtotal, tax, total: subtotal + tax, rate };
}

/** A basket that remembers itself between visits. */
export function makeBasket(onChange = () => {}) {
  const KEY = "ts-basket";
  let lines = [];
  try { lines = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { lines = []; }
  if (!Array.isArray(lines)) lines = [];

  const keep = () => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* not kept */ }
    onChange(lines.slice());
  };
  return {
    get lines() { return lines.slice(); },
    get count() { return lines.reduce((t, l) => t + l.n, 0); },
    countOf(id) { return lines.find((l) => l.id === id)?.n || 0; },
    /** Put one more in — never more than the shop has. */
    add(p) {
      const at = lines.find((l) => l.id === p.id);
      if (at) { at.n = Math.min(p.stock, at.n + 1); } else {
        lines.push({ id: p.id, title: p.title, art: p.art, slot: p.slot, price: p.price, cut: p.cut, n: 1 });
      }
      keep();
    },
    /** Take one out, and the line with it when the last one goes. */
    take(id) {
      const at = lines.find((l) => l.id === id);
      if (!at) return;
      at.n -= 1;
      if (at.n <= 0) lines = lines.filter((l) => l.id !== id);
      keep();
    },
    drop(id) { lines = lines.filter((l) => l.id !== id); keep(); },
    clear() { lines = []; keep(); },
  };
}

export { writeAmount, PER_BILL };
