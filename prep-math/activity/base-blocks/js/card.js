/* ============================================================================
   Manipulatives — the number card
   ----------------------------------------------------------------------------
   A card that says what the canvas comes to, written FIVE WAYS. It is the same
   number every time — the point of it is that 123 and 100 + 20 + 3 and
   1 × 10² + 2 × 10¹ + 3 and "one flat, two rods and three units" are one thing
   said in five voices, and a learner who can move between them has understood
   place value rather than learnt a layout.

   It is a STICKY NOTE (the shared component), so it is paper on the canvas like
   any other note: picked up, dragged, turned, thrown away by the machinery
   every item already has. What is different is that nobody writes on it — it is
   REWRITTEN from the number whenever the number changes, which is what makes it
   a reading of the canvas rather than a label somebody typed.

   The mathematics on it is set by MathJax, through the note's own equation runs
   (see /utils/components/sticky-math.js), so the card is typeset exactly the
   way the rest of the site's mathematics is.

   ── every notation follows the working base ───────────────────────────────
   The examples everybody knows are base ten, but nothing here is about ten: in
   base five, 123₅ is 100₅ + 20₅ + 3₅ is 1 × 5² + 2 × 5¹ + 3, and it is still
   one flat, two rods and three units. The place NAMES do not change with the
   base — that is the whole reason the blocks are taught with names rather than
   with numbers — so the fourth notation reads the same in every base.
   ========================================================================== */

import { DIGITS, placeAt, toBase, baseWord } from "./config.js";
import { store, totalUnits } from "./state.js";
import { abacusValue } from "./abacus.js";
import { placeReading } from "./grids.js";
import {
  makeNote as makeStickyNote, blankRun, mathRun, editNote, INKS,
} from "/utils/components/sticky-note.js";
import { measure } from "./notes.js";

/** The five ways the card can say it, in the order they are taught. */
export const NOTATIONS = [
  { id: "standard", label: "Standard", hint: "the number as it is written" },
  { id: "expanded", label: "Expanded", hint: "what each place is worth, added up" },
  { id: "powers", label: "Powers", hint: "each place as a power of the base" },
  { id: "blocks", label: "Blocks", hint: "how many of each piece that is" },
  { id: "groups", label: "Groups", hint: "how many groups of each size" },
];

export const notationOf = (id) => NOTATIONS.find((n) => n.id === id) || NOTATIONS[0];

/* How big the number itself is written, in note-pixels. The standard form is
   one short thing and is written large; the others are sentences and are not. */
const HEAD_PX = 11;
const BIG_PX = 30;
const BODY_PX = 19;

/* ── what the canvas comes to ─────────────────────────────────────────────── */

/**
 * THE number on the canvas.
 *
 * The blocks lead, because they are the one reading that does not depend on the
 * base — a flat is a flat in every base, and only what it is WORTH changes. With
 * no blocks out, the first counting frame or place-value chart speaks instead,
 * so a card put out beside a soroban still says something.
 */
export function canvasNumber() {
  if (store.blocks.length) return totalUnits();
  for (const t of store.things) {
    if (t.kind === "abacus") return abacusValue(t);
    if (t.variant === "place") return placeReading(t, store.blocks, store.base).total;
  }
  return 0;
}

/* ── the five readings ────────────────────────────────────────────────────── */

/** The digits of `n` in the working base, biggest place first, with its power. */
function places(n, base) {
  const digits = toBase(Math.max(0, Math.round(n)), base);
  const top = digits.length - 1;
  return [...digits].map((d, i) => ({
    digit: DIGITS.indexOf(d),
    glyph: d,
    power: top - i,
  })).filter((p) => p.digit !== 0);
}

/* One place's worth: 100, 20, 3. The digit followed by its place's worth of
   zeros, which is what a place is worth in EVERY base — only the subscript the
   caller puts on it says which base those zeros are counting in. */
const worthGlyph = (p) => p.glyph + "0".repeat(p.power);

/* A number in a base that is not ten wears its base, the way it does
   everywhere else on this canvas. */
const sub = (text, base) => (base === 10 ? text : `${text}_{${base}}`);

/**
 * The card's reading, as a list of pieces: `{ tex }` for mathematics and
 * `{ text }` for words. Kept as a list rather than one string so a long reading
 * can WRAP — a formula is one thing that never breaks, but a sum of five terms
 * is five things that may.
 */
export function reading(notation, n, base) {
  const out = places(n, base);
  const zero = !out.length;

  if (notation === "standard") {
    return [{ tex: sub(toBase(n, base), base), big: true }];
  }

  if (notation === "expanded") {
    if (zero) return [{ tex: "0", big: true }];
    return join(out.map((p) => sub(worthGlyph(p), base)));
  }

  if (notation === "powers") {
    if (zero) return [{ tex: "0", big: true }];
    /* The units are written plainly: 1 × 10⁰ is true and is also the one term
       nobody writes. Everything above it carries its power. */
    return join(out.map((p) => (p.power === 0
      ? p.glyph
      : `${p.glyph} \\times ${base}^{${p.power}}`)));
  }

  if (notation === "blocks") {
    if (zero) return [{ text: "nothing on the canvas yet" }];
    const words = out.map((p) => {
      const place = placeAt(p.power);
      const many = p.digit !== 1;
      return `${p.digit} ${many ? place.plural.toLowerCase() : place.label.toLowerCase()}`;
    });
    return [{ text: words.join(", ") }];
  }

  // groups: how many groups of each size — 1(100) + 2(10) + 3(1)
  if (zero) return [{ tex: "0", big: true }];
  return join(out.map((p) =>
    `${p.glyph}(${sub("1" + "0".repeat(p.power), base)})`));
}

/**
 * Terms with their plus signs, each piece its own run so a long line may WRAP.
 *
 * The plus is a run of its own rather than the head of the term after it, and
 * the spaces round it are words rather than TeX: MathJax trims the whitespace
 * off the ends of everything it sets, so a term written "+ 20" comes back set
 * as "+20" and the sum reads "200 +20 +4". Kept apart, each side of the plus
 * is spaced by the note's own writing and the sum reads as it is written.
 */
function join(terms) {
  const out = [];
  terms.forEach((t, i) => {
    if (i) out.push({ text: " " }, { tex: "+" }, { text: " " });
    out.push({ tex: t });
  });
  return out;
}

/** The whole reading as plain text — for a title, a test, or a screen reader. */
export function readingText(notation, n, base) {
  return reading(notation, n, base)
    .map((p) => (p.tex ? texToWords(p.tex) : p.text))
    .join("")
    .trim();
}

/* Enough of a de-TeX to read aloud: this is only ever used for a label.
   The base a number is written in is SAID rather than subscripted, because
   "443 base five" is the reading, and "4435" — which is all that dropping the
   subscript leaves — is a different number altogether. */
const texToWords = (tex) => String(tex)
  .replace(/\\times/g, "×")
  .replace(/\^\{(\d+)\}/g, "^$1")
  .replace(/_\{(\d+)\}/g, (_m, b) => ` base ${baseWord(+b)}`);

/* ── the thing on the canvas ──────────────────────────────────────────────── */

/** Sky paper, so a card is plainly not one of the notes you wrote yourself. */
const CARD_PAPER = 3;

export function makeCard(base = store.base, notation = "standard") {
  const card = makeStickyNote({ text: "", paper: CARD_PAPER });
  Object.assign(card, {
    kind: "card",
    notation,
    tag: null,
    x: 0, z: 0, angle: 0,
    h: 0.02,
    shown: null, // the number it is currently saying
  });
  writeCard(card, canvasNumber(), base);
  return card;
}

/**
 * Write the number onto the card in whatever notation it is set to.
 *
 * Returns true when anything actually changed, so the caller can leave the
 * canvas alone when it did not — this runs on every change to the store, and a
 * card rewritten needlessly is a note rebuilt needlessly.
 */
export function writeCard(card, n, base = store.base) {
  const same = card.shown === n && card.wrote === card.notation && card.base === base;
  if (same) return false;
  card.shown = n;
  card.wrote = card.notation;
  card.base = base;

  const note = notationOf(card.notation);
  const head = base === 10 ? note.label : `${note.label} · base ${baseWord(base)}`;
  const runs = [
    blankRun({ text: head + "\n", px: HEAD_PX, bold: true, ink: INKS[5].hex }),
  ];
  for (const piece of reading(card.notation, n, base)) {
    const px = piece.big ? BIG_PX : BODY_PX;
    runs.push(piece.tex ? mathRun(piece.tex, { px }) : blankRun({ text: piece.text, px }));
  }
  editNote(card, { runs });
  measure(card);
  return true;
}

/** Keep every card on the canvas saying what the canvas says. */
export function refreshCards() {
  let changed = false;
  const n = canvasNumber();
  for (const t of store.things) {
    if (t.kind !== "card") continue;
    if (writeCard(t, n, store.base)) changed = true;
  }
  return changed;
}

/** Set one card to another notation. */
export function setNotation(card, id) {
  if (!card || card.notation === id) return false;
  card.notation = notationOf(id).id;
  writeCard(card, canvasNumber(), store.base);
  return true;
}
