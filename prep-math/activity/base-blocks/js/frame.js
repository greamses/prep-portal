/* ============================================================================
   Manipulatives — the area frame
   ----------------------------------------------------------------------------
   Algebra tiles are for laying out a RECTANGLE, and a rectangle is a
   multiplication: the two sides are what you multiplied, and what fills it is
   the answer. The frame is the board that makes that reading possible — a
   corner, with a track along the top and a track down the left side, and the
   open field between them.

   Lay pieces along the two tracks and you have said what you are multiplying.
   Fill the field with pieces and you have said what it comes to. The frame
   reads both back and says whether they agree — and it NEVER says what the
   answer should be, because working that out is the whole exercise.

   Read backwards it is factorising: put x² + 5x + 6 in the field, then find the
   two sides that close it into a rectangle.

   ── how an edge is read ───────────────────────────────────────────────────
   Not by asking a piece what it is: by MEASURING the side it presents to the
   field. An x-tile lying along the top offers a side 4.6 long, and so does an
   x² tile — both of them contribute x, which is exactly right, because along
   that edge that is all either of them is. The three lengths of the family are
   far enough apart that a measurement can never be two of them at once.
   ========================================================================== */

import { footprint } from "./layout.js";
import { addTerm, tileTerm, termOfLength, writeTerms } from "./tiles.js";

/* The board, in canvas cells: a track two cells deep along the top and down the
   left, and a field big enough for three x-lengths each way. */
export const TRACK = 2;
export const FIELD = 14;
export const FRAME_SIDE = TRACK + FIELD;

/** Is this a frame that can be read — square to the paper, as it must be? */
export function frameSquare(thing) {
  const a = Math.abs(thing.angle || 0) % (Math.PI * 2);
  return a < 1e-6 || Math.PI * 2 - a < 1e-6;
}

/**
 * The three parts of a frame, in world cells.
 *
 * POSITIVE z is up the screen, so the TOP track is the far edge — the high-z
 * strip — and the field is everything below and to the right of the corner.
 */
export function regions(thing) {
  const x0 = thing.x;
  const z0 = thing.z;
  const x1 = x0 + thing.l;
  const z1 = z0 + thing.w;
  return {
    top: { x0: x0 + TRACK, x1, z0: z1 - TRACK, z1 },
    left: { x0, x1: x0 + TRACK, z0, z1: z1 - TRACK },
    field: { x0: x0 + TRACK, x1, z0, z1: z1 - TRACK },
    corner: { x0, x1: x0 + TRACK, z0: z1 - TRACK, z1 },
  };
}

const inside = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

/** Where a tile's middle is, and how big a patch of paper it covers. */
function whereIs(t) {
  const f = footprint(t);
  return { cx: t.x + f.l / 2, cz: t.z + f.w / 2, l: f.l, w: f.w };
}

/**
 * Read a frame: what is along each track, what is in the field, and whether the
 * one comes to the other.
 *
 * `sides` is true once BOTH tracks have something on them — until then there is
 * no multiplication to check, only a field of pieces.
 */
export function readFrame(thing, tiles) {
  const r = regions(thing);
  const top = new Map();
  const left = new Map();
  const field = new Map();
  let odd = 0;

  for (const t of tiles) {
    const at = whereIs(t);
    if (inside(r.top, at.cx, at.cz)) {
      const term = termOfLength(at.l, t.sign);
      if (term) addTerm(top, term); else odd += 1;
    } else if (inside(r.left, at.cx, at.cz)) {
      const term = termOfLength(at.w, t.sign);
      if (term) addTerm(left, term); else odd += 1;
    } else if (inside(r.field, at.cx, at.cz)) {
      addTerm(field, tileTerm(t));
    }
  }

  const a = writeTerms(top);
  const b = writeTerms(left);
  const inner = writeTerms(field);
  const sides = a.terms.length > 0 && b.terms.length > 0;

  /* What the two sides multiply out to. Worked out here only to be COMPARED
     with what is in the field — it is never shown, or the frame would be
     answering its own question. */
  const want = new Map();
  for (const p of a.terms) {
    for (const q of b.terms) {
      addTerm(want, { x: p.x + q.x, y: p.y + q.y, n: p.n * q.n });
    }
  }
  const target = writeTerms(want);
  const agree = sides && inner.terms.length > 0 && same(target.terms, inner.terms);

  return { a, b, inner, sides, agree, odd, empty: !sides && !inner.terms.length };
}

function same(p, q) {
  if (p.length !== q.length) return false;
  const key = (t) => `${t.x},${t.y},${t.n}`;
  const set = new Set(p.map(key));
  return q.every((t) => set.has(key(t)));
}

/* A side written with its brackets round it, the way a factor is written. One
   term needs no brackets: (x)(x) is not how anybody writes x². */
const wrap = (r, open, close) =>
  r.terms.length > 1 ? open + close.replace("%", r.text) : r.text;

/**
 * The frame as one sentence, to read and to set.
 *
 * What it says depends on how far the work has got, and it never runs ahead of
 * the learner: the two sides alone are the QUESTION, the two sides with a field
 * that matches are the ANSWER, and a field that does not match is shown as
 * exactly that — not as a correction.
 */
export function frameSentence(read) {
  if (read.empty) return null;
  const bra = (r, tex) => {
    const body = tex ? r.tex : r.text;
    return r.terms.length > 1 ? `(${body})` : body;
  };

  if (!read.sides) {
    return { text: read.inner.text, tex: read.inner.tex, kind: "field" };
  }
  const lhsText = bra(read.a) + bra(read.b);
  const lhsTex = bra(read.a, true) + bra(read.b, true);
  if (!read.inner.terms.length) {
    return { text: lhsText, tex: lhsTex, kind: "asked" };
  }
  const sign = read.agree ? "=" : "≠";
  return {
    text: `${lhsText} ${sign} ${read.inner.text}`,
    tex: `${lhsTex} ${read.agree ? "=" : String.fromCharCode(92) + "neq"} ${read.inner.tex}`,
    kind: read.agree ? "done" : "off",
  };
}

/** Every frame on the canvas that is square enough to be read. */
export function frames(things) {
  return things.filter((t) => t.kind === "board" && t.variant === "area");
}
