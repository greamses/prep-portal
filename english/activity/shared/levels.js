/* ============================================================================
   The English workbooks — the two dials, shared by all five
   ----------------------------------------------------------------------------
   The maths workbooks each keep their own levels file, because what "harder"
   means is different in every one of them: bigger keys on a pictogram, more
   figures after the point, a quadratic that will not factorise. In English it
   is the same thing five times over — longer words, longer sentences, rules
   that overlap — so there is one file and the five workbooks read it.

   HOW HARD is about the WORDS, never the idea. The idea is the same at every
   level: a child at Gentle is naming the job of a word in a short sentence,
   and a child at Stretch is doing exactly that in a longer one with a word
   that could be two things.

   HOW MUCH HELP is the fading scaffold every workbook on this site uses: a
   worked example at the top of each section, then none, then no labels.
   ========================================================================== */

export const LEVELS = {
  gentle: {
    id: "gentle",
    label: "Gentle — short words and short sentences, one idea at a time",
    words: 1,            // how long a word may be, in syllables
    len: [4, 8],         // how many words a sentence may run to
    tricky: false,       // the awkward cases: words that are two parts of speech
  },
  middle: {
    id: "middle",
    label: "Middle — longer words, longer sentences, the common exceptions",
    words: 2,
    len: [6, 12],
    tricky: false,
  },
  stretch: {
    id: "stretch",
    label: "Stretch — the awkward ones: words that change their job, rules that clash",
    words: 3,
    len: [9, 18],
    tricky: true,
  },
};

export const levelOf = (o) => LEVELS[o.level] || LEVELS.gentle;

export const HELP = {
  show: { id: "show", label: "Show me — one done for you at the top of every section" },
  help: { id: "help", label: "Help me — no examples, the steps are named" },
  try: { id: "try", label: "Let me try — nothing named" },
};

export const helpOf = (o) => HELP[o.help] || HELP.help;

/* ── the small marks every English page writes into ────────────────────────
   The same HTML the maths workbooks use, so the engine marks these pages
   with the code that already marks those: `.wb-answer` is a box to write in,
   `.wb-tick` a row of boxes to tick, `.wb-line` a ruled line for a sentence.
   They are here rather than copied into five exercise files. */

export const box = () => `<span class="wb-answer"></span>`;
export const line = () => `<span class="wb-line"></span>`;
export const ask = (html) => `<p class="wb-ask">${html}</p>`;
export const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
export const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
export const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;

/** The word a question is ABOUT, marked out of the sentence it sits in. */
export const pick = (w) => `<b class="en-pick">${w}</b>`;

/**
 * Dealt, not drawn.
 *
 * `r.pick` is free to give the same item twice running, and on a page of six
 * questions that reads as a mistake rather than as chance. A dealer shuffles
 * the pack once and goes round it in order, so a page of six is six
 * different ones and a page of thirty still varies.
 */
export function dealer() {
  let order = null;
  return (r, list, i = 0) => {
    if (i === 0 || !order || order.length !== list.length) order = r.shuffle(list.slice());
    return order[i % order.length];
  };
}
