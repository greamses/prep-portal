/* ============================================================================
   NUMBER MATCH — the ways one number can be written
   ----------------------------------------------------------------------------
   The grid holds numerals. Every CARD holds one of the OTHER ways of writing
   the same value — the words, an addition of its places, the places named and
   counted, tally marks, base-ten blocks — and never the numeral itself. A card
   reading "56" laid beside a cell reading "56" is a spotting exercise; the
   number work is in seeing that "fifty-six", "50 + 6" and five rods and six
   ones are all the same thing.

   That rule is not a convention here, it is enforced: `offers` refuses any form
   on any number where the form would come out as the numeral (7 "expanded" is
   7, and 50 expanded is 50), and the tests check every number in range against
   every form to be sure none of them ever prints what the grid already says.

   The words and the blocks are the workbook's own — `wordsOf` and `blocksSvg`
   from the Maths Workbook — so the word form is spelt one way across the site
   and a hundred-flat here is the same drawing as a hundred-flat there.
   ========================================================================== */

import { wordsOf, placeNameFor, digitsOf } from "../../maths-workbook/js/numbers.js";
import { blocksSvg } from "../../maths-workbook/js/blocks.js";

/** Lowest place first, as long as the number is written: 56 → [6, 5]. */
export function placesOf(n) {
  const v = Math.max(0, Math.round(n));
  return digitsOf(v, 10, String(v).length);
}

/* ── tally marks ────────────────────────────────────────────────────────────
   Four uprights and the fifth struck across them. This is the one drawing in
   the activity that was not already somewhere on the site — the workbook has a
   tally ICON, but an icon is a picture of the idea and not a count of
   anything. Drawn in fives because that is the whole point of a tally: you
   read it by counting the gates, not the strokes. */

const GATE = 20;   // across, per group of five
const ROW = 27;    // down, per row of groups
const TOP = 3;
const FOOT = 21;

/** The marks for one group: `k` uprights, struck through when it is a full five. */
function gate(x, y, k) {
  let d = "";
  const ups = Math.min(k, 4);
  for (let i = 0; i < ups; i++) d += `M${x + i * 4} ${y + TOP}V${y + FOOT}`;
  /* The fifth mark is the one laid across the other four — that is what makes
     a five readable at a glance without counting it. */
  if (k === 5) d += `M${x - 1.4} ${y + FOOT - 1.5}L${x + 13.4} ${y + TOP + 1.5}`;
  return d;
}

/**
 * `n` counted in tally marks.
 *
 * Groups of five wrap after `perRow` so that a big number stays a shape you
 * can read rather than one long unreadable fence.
 */
export function tallySvg(n, { perRow = 5 } = {}) {
  const count = Math.max(0, Math.round(n));
  const groups = [];
  for (let left = count; left > 0; left -= 5) groups.push(Math.min(5, left));

  let d = "";
  groups.forEach((k, i) => {
    /* Every group is drawn in its own slot, so the gaps between fives are even
       and the eye can count the gates across a row. */
    d += gate((i % perRow) * GATE, Math.floor(i / perRow) * ROW, k);
  });

  const cols = Math.min(groups.length, perRow) || 1;
  const rows = Math.ceil(groups.length / perRow) || 1;
  const w = cols * GATE;
  const h = rows * ROW;
  /* The label says WHAT this is, never what it counts. A card that tells a
     screen reader "seven in tally marks" has answered the question out loud
     for one reader and not the others. */
  return (
    `<svg viewBox="-2 0 ${w + 2} ${h}" class="nm-tally" role="img" `
    + `aria-label="Tally marks" preserveAspectRatio="xMidYMid meet">`
    + `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>`
    + `</svg>`
  );
}

/* ── the forms ─────────────────────────────────────────────────────────────*/

/** "50 + 6" — the places that are doing work, highest first. */
export function sumText(n) {
  const places = placesOf(n);
  const parts = [];
  for (let p = places.length - 1; p >= 0; p--) {
    if (places[p]) parts.push(String(places[p] * Math.pow(10, p)));
  }
  return parts.join(" + ");
}

/** "5 tens + 6 ones", with the singular where there is only one of a place. */
export function placeText(n) {
  const places = placesOf(n);
  const parts = [];
  for (let p = places.length - 1; p >= 0; p--) {
    const c = places[p];
    if (c) parts.push(`${c} ${placeNameFor(c, p, 10)}`);
  }
  return parts.join(" + ");
}

/** How many places of this number are actually doing work. */
const working = (n) => placesOf(n).filter((d) => d).length;

export const FORMS = [
  {
    id: "words",
    label: "Word form",
    hint: "the number said out loud",
    /* Always: no number under a hundred is spelt with its own figures. */
    offers: () => true,
    make: (n) => ({ kind: "text", text: wordsOf(String(n)) }),
  },
  {
    id: "expanded",
    label: "Expanded addition",
    hint: "its places added together",
    /* 7 expanded is "7" and 50 expanded is "50" — both hand back the numeral,
       so neither is offered. Two places have to be doing work for there to be
       an addition at all. */
    offers: (n) => working(n) >= 2,
    make: (n) => ({ kind: "text", text: sumText(n) }),
  },
  {
    id: "places",
    label: "Place value",
    hint: "how many of each place",
    /* "6 ones" is the figure 6 with a word after it — finding the 6 on the
       board takes no number sense at all. But "5 tens" and "1 hundred" are
       real readings: the face says 5, the answer is 50, and getting from one
       to the other is the whole point. So what is refused is the single
       FIGURE, not the single place. */
    offers: (n) => String(Math.round(n)).length >= 2,
    make: (n) => ({ kind: "text", text: placeText(n) }),
  },
  {
    id: "tally",
    label: "Tally marks",
    hint: "counted in fives",
    offers: () => true,
    make: (n) => ({ kind: "art", html: tallySvg(n), text: "tally marks" }),
  },
  {
    id: "blocks",
    label: "Base-ten blocks",
    hint: "flats, rods and ones",
    offers: () => true,
    /* The workbook's own blocks, drawn small enough to sit on a note. */
    make: (n) => ({
      kind: "art",
      html: blocksSvg(placesOf(n), 10, { maxCells: 26, cellMm: 1.45, still: true, label: "Base-ten blocks" }),
      text: "base-ten blocks",
    }),
  },
];

export const FORM_IDS = FORMS.map((f) => f.id);

export const formById = (id) => FORMS.find((f) => f.id === id) || null;

/** Which of the chosen forms can honestly carry this number. */
export function formsFor(n, ids = FORM_IDS) {
  return FORMS.filter((f) => ids.includes(f.id) && f.offers(n));
}

/**
 * One card: a number, written one way that is not its numeral.
 *
 * → { id, n, form, label, kind, text, html }
 */
export function cardFor(n, formId) {
  const form = formById(formId);
  if (!form || !form.offers(n)) return null;
  const body = form.make(n);
  return {
    id: `${n}-${formId}`,
    n,
    form: formId,
    label: form.label,
    kind: body.kind,
    text: body.text,
    html: body.html || "",
  };
}

/**
 * Does this card give the game away by BEING the numeral?
 *
 * The rule is standard form, not figures. "5 tens + 6 ones" and "50 + 6" are
 * full of figures and are exactly the forms worth matching; what may never
 * appear is the bare numeral the grid already shows. So the whole face is
 * compared against it, rather than the digits being fished out of it.
 *
 * A drawing writes nothing, so for one the question is whether any figure has
 * been drawn into it at all.
 *
 * Kept here rather than in the tests because it is the rule the activity is
 * built on, and anything added later should be able to ask.
 */
export function saysTheNumeral(card) {
  if (card.kind !== "text") return /<text[\s>]/.test(card.html || "");
  return String(card.text || "").replace(/\s+/g, "") === String(card.n);
}
