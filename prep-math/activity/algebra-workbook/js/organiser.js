/* ============================================================================
   Remainder Theorem Workbook — the graphic organisers
   ----------------------------------------------------------------------------
   This workbook is built for reinforcement, and specifically for a learner who
   needs the shape of the task made visible. That is what a graphic organiser
   is: not decoration, and not a hint, but the STEPS OF THE METHOD DRAWN ON THE
   PAGE, so that "where am I?" is answered by looking rather than by
   remembering.

   Three of them, and each does one job the others cannot:

   THE FOUR-STEP FRAME says what to do and in what order. Four numbered rows
   with an arrow between them, always the same four, always in the same place.
   A child who has met it five times knows that the answer goes in row four
   before they have read the question.

   THE SWAP LADDER breaks the one hard step into rows. Substituting into
   2x³ − 4x + 5 is not one thing, it is three little multiplications and an
   addition, and it goes wrong in the middle where nothing is written down.
   Given a row per term, the working is on the paper and a slip is findable —
   by the child, which is the point.

   THE ZERO BOX is two cells and an arrow, for the single error this whole
   topic turns on: the bracket (x + 2) has zero −2, not 2.

   ── HOW MUCH HELP ──────────────────────────────────────────────────────────
   The organisers do not change between levels; what changes is how much of
   each one is already written. That is deliberate — a scaffold you take away
   is a scaffold; a scaffold you REPLACE with a different scaffold is a new
   thing to learn.

     show   a worked example at the top, and the first steps filled in
     help   the organiser is there with its labels, and empty
     try    the organiser is there, numbered but unlabelled — the child has to
            remember what step two is

   Every colour here is a fixed hex, like the rest of the paper: see the note
   at the top of /utils/components/workbook.css.
   ========================================================================== */

import {
  polyText, statement, divisor, divisorText, zeroEquation, termsOf,
  termText, swapText, termValue, valueAt, num, NAME,
} from "./poly.js";

export const HELP = {
  show: { id: "show", label: "Show me — one done for you, and the first steps filled in" },
  help: { id: "help", label: "Help me — the organiser is there, and empty" },
  try: { id: "try", label: "Let me try — the steps are numbered but not named" },
};

export const helpOf = (o) => HELP[o.help] || HELP.help;

/* ── the marks ─────────────────────────────────────────────────────────────
   The writing lines and boxes are the shared ones from workbook.css, so a
   blank here is the same blank as a blank in the place-value workbook. */

const line = (size = "md") => `<span class="wb-line wb-line--${size}"></span>`;

const ARROW_DOWN =
  `<svg viewBox="0 0 24 24" class="rt-arrow" aria-hidden="true" fill="none" ` +
  `stroke="#8f887c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M12 4v14M6 13l6 6 6-6"/></svg>`;

const ARROW_RIGHT =
  `<svg viewBox="0 0 24 24" class="rt-arrow rt-arrow--right" aria-hidden="true" fill="none" ` +
  `stroke="#8f887c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M4 12h14M13 6l6 6-6 6"/></svg>`;

/* ── 1. the four-step frame ────────────────────────────────────────────────*/

/* The four steps, in the words they are said in everywhere on this paper. The
   wording is repeated verbatim in the instructions, in the worked example and
   in the frame itself, because a method described three different ways is
   three methods. */
export const STEPS = [
  { no: 1, what: "Write the bracket" },
  { no: 2, what: "Make it zero" },
  { no: 3, what: "Swap every x for that number" },
  { no: 4, what: "Work it out — that is the remainder" },
];

/**
 * The frame for one question.
 *
 * `given` fills a row in — used by the worked example, which is the same frame
 * with every row already written, so a child comparing the two is comparing
 * like with like and not a picture with a paragraph.
 */
export function frame({ a }, o, { given = {} } = {}) {
  const named = helpOf(o).id !== "try";
  const prefill = helpOf(o).id === "show";

  const row = (step, body) =>
    `<div class="rt-frame__step">` +
    `<span class="rt-frame__no rt-frame__no--s${step.no}">${step.no}</span>` +
    `<span class="rt-frame__what">${named ? step.what : ""}</span>` +
    `<span class="rt-frame__work">${body}</span>` +
    `</div>`;

  const filled = (key, ifShown) =>
    given[key] !== undefined ? given[key] : prefill ? ifShown : null;

  /* Show me writes in step ONE and no further. Step one is a copy — the
     bracket is already in the question above it — while step two is the thing
     section A drilled for a whole page, and a frame that answers it for you is
     a frame the child watches rather than fills. The worked example still
     shows all four rows, which is where a model belongs. */
  const one = filled("bracket", divisor(a));
  const two = given.zero;

  return (
    `<div class="rt-frame">` +
    row(STEPS[0], one ? `<b>${one}</b>` : line("sm")) +
    ARROW_DOWN +
    row(STEPS[1], `${zeroEquation(a)} &nbsp;so&nbsp; ${two || "x =&nbsp;" + line("xs")}`) +
    ARROW_DOWN +
    row(STEPS[2], given.swap ? `<b>${given.swap}</b>` : line("lg")) +
    ARROW_DOWN +
    row(
      STEPS[3],
      given.answer !== undefined
        ? `remainder = <b>${given.answer}</b>`
        : `remainder = ${line("sm")}`
    ) +
    `</div>`
  );
}

/* ── 2. the swap ladder ────────────────────────────────────────────────────*/

/**
 * One row per term, so the substitution is done in pieces small enough to see.
 *
 * `filledMiddle` writes the middle column in — the swap itself, spelled out as
 * repeated multiplication. `filledRight` writes the answers too, which only
 * the worked example does.
 */
export function ladder(c, a, o, { filledMiddle = null, filledRight = false } = {}) {
  const show = filledMiddle === null ? helpOf(o).id === "show" : filledMiddle;
  const terms = termsOf(c);

  const rows = terms
    .map((t) => {
      const mid = show ? swapText(t.coef, t.p, a) : "";
      const right = filledRight ? `<b>${num(termValue(t.coef, t.p, a))}</b>` : "";
      return (
        `<tr>` +
        `<td class="rt-ladder__term">${termText(t.coef, t.p)}</td>` +
        `<td class="rt-ladder__swap">${mid}</td>` +
        `<td class="rt-ladder__got">${right}</td>` +
        `</tr>`
      );
    })
    .join("");

  const total = filledRight ? `<b>${num(valueAt(c, a))}</b>` : "";

  return (
    `<table class="rt-ladder">` +
    `<thead><tr>` +
    `<th>The term</th>` +
    `<th>Swap x for ${num(a)}</th>` +
    `<th>Comes to</th>` +
    `</tr></thead>` +
    `<tbody>${rows}` +
    `<tr class="rt-ladder__total">` +
    `<td colspan="2">Add them all up</td>` +
    `<td class="rt-ladder__got">${total}</td>` +
    `</tr></tbody></table>`
  );
}

/* ── 3. the zero box ───────────────────────────────────────────────────────*/

/** Two cells and an arrow: the bracket, and the number that makes it zero. */
export function zeroBox(a, { answer = false } = {}) {
  return (
    `<span class="rt-zero">` +
    `<span class="rt-zero__cell">${zeroEquation(a)}</span>` +
    ARROW_RIGHT +
    `<span class="rt-zero__cell rt-zero__cell--ans">x =&nbsp;` +
    (answer ? `<b>${num(a)}</b>` : line("xs")) +
    `</span></span>`
  );
}

/* ── odds and ends that are still organisers ───────────────────────────────*/

/**
 * A box with faint rules in it. Not a plain empty rectangle: a child who is
 * asked to "show your working" in a blank space writes one line in the middle
 * and stops, and rules say how much writing is expected.
 */
export function workingBox({ lines = 4 } = {}) {
  const rows = Array.from(
    { length: lines - 1 },
    (_, i) => `<span class="rt-work__rule" style="top:${((i + 1) * 100) / lines}%"></span>`
  ).join("");
  return `<span class="rt-work" style="--rt-lines:${lines}">${rows}</span>`;
}

/** Two squares to tick, and only ever two. */
export function tickPair(yes, no) {
  return (
    `<span class="rt-tick">` +
    `<span class="rt-tick__one"><span class="wb-box"></span>${yes}</span>` +
    `<span class="rt-tick__one"><span class="wb-box"></span>${no}</span>` +
    `</span>`
  );
}

/**
 * "One done for you" — the same organiser as the questions below it, with
 * every row written in.
 *
 * It prints only at the Show me level, and it prints ONCE PER SECTION rather
 * than once per workbook, because the sections teach different steps and an
 * example of the wrong step is worse than none.
 */
export function worked(title, body) {
  return (
    `<div class="rt-worked">` +
    `<p class="rt-worked__tag">One done for you</p>` +
    `<p class="rt-worked__ask">${title}</p>` +
    body +
    `</div>`
  );
}

/** The question sentence, said the same way every single time. */
export function askRemainder(c, a) {
  return `Find the remainder when <b>${polyText(c)}</b> is divided by <b>${divisor(a)}</b>.`;
}

export { statement, polyText, divisor, divisorText, NAME };
