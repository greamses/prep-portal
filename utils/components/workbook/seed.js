/* ============================================================================
   PRINTABLE WORKBOOK — the seed
   ----------------------------------------------------------------------------
   One workbook = one seed, and the seed is printed on the paper as five
   letters. A teacher who prints, loses the file and comes back next term types
   those five letters and gets the identical paper — and, crucially, the
   identical answer key. Nothing else about a workbook is stored anywhere.

   Every draw comes off a stream mixed from that seed and the EXERCISE'S OWN
   NAME — not its position in the registry — so adding a question to section
   three cannot quietly reshuffle section four, and a new exercise slotted in
   between two old ones cannot change what an old code prints.
   ========================================================================== */

import { mulberry32, hashSeed } from "/utils/games/rng.js";

export function stream(seed, ns) {
  const rnd = mulberry32(hashSeed(seed >>> 0, ns));
  return {
    /** A whole number in [lo, hi]. */
    int: (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1)),
    /** One of a list. */
    pick: (list) => list[Math.floor(rnd() * list.length)],
    /** A shuffled copy — Fisher-Yates off the same stream. */
    shuffle: (list) => {
      const a = list.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    /** True with probability p. */
    chance: (p) => rnd() < p,
    raw: rnd,
  };
}

/** A seed a person can read back off the page and type in again. */
export function seedFrom(text) {
  let h = 2166136261 >>> 0;
  const s = String(text || "").trim().toUpperCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* …and back the other way, so the seed prints as five letters and not as
   3184729164. No I, O, 0 or 1: this code gets copied off paper by hand. */
const CODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function seedCode(seed) {
  let v = seed >>> 0;
  let out = "";
  for (let i = 0; i < 5; i++) {
    out = CODE[v % CODE.length] + out;
    v = Math.floor(v / CODE.length);
  }
  return out;
}
