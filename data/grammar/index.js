/* ═══════════════════════════════════════════════════════
   GRAMMAR — the bank's public face.

   Three halves, kept apart for the same reason the Vocab bank splits:
     themes.js             the outline — needed the instant the page loads
     cups.js               the CUPS registry — needed by the focus picker
     passages/<theme>.js   the prose itself — loaded only when a round starts

   THE TOKEN MODEL (the whole design rests on this)
   A passage is split on whitespace into TOKENS, and the play surface makes
   each token independently editable. That is not a detail — it is what makes
   the round scorable at all.

   The obvious build (one big contenteditable blob, diff the strings at the
   end) does not survive contact with a browser: the moment a child backspaces
   across a word boundary or pastes, any markup anchoring "this is error #7"
   is merged away, and a free-text diff then has to GUESS which edit was aimed
   at which error. Per-token editing means the mapping can never drift — token
   4 is token 4 from first render to submit — and it still reads and behaves
   like one flowing editable paragraph.

   So the contract is: every planted error is exactly one whole token, with its
   punctuation and quote marks attached (see the authoring notes in
   passages/diary.js).
═══════════════════════════════════════════════════════ */

export {
  GRADES, THEMES, THEME_KEYS, themesForGrade, themeMeta,
} from './themes.js';
export {
  CUPS, CUPS_KEYS, CUPS_LABEL, CUPS_SHORT, focusKey, focusSet, focusLabel,
} from './cups.js';

import { THEMES, THEME_KEYS } from './themes.js';
import { focusSet } from './cups.js';
import { AVAILABLE } from './manifest.js';

/* ── Loading ──────────────────────────────────────────────────────────────
   One module per theme, cached by the browser's module cache and again here
   so a replay never re-imports. */
const cache = new Map();
export function loadPassages(theme) {
  if (cache.has(theme)) return cache.get(theme);
  const p = import(`./passages/${theme}.js`).then((m) => m.PASSAGES);
  cache.set(theme, p);
  return p;
}

/** Themes that are both written for this grade AND have passages shipped. */
export function availableThemes(grade) {
  return THEME_KEYS.filter((key) => {
    if (!AVAILABLE[key]) return false;
    const [lo, hi] = THEMES[key].band;
    return grade >= lo && grade <= hi;
  });
}

/** The passages a grade can be dealt from a loaded theme. */
export function passagePool(passages, grade) {
  return (passages || []).filter((p) => grade >= p.band[0] && grade <= p.band[1]);
}

/* ── Parsing ──────────────────────────────────────────────────────────────
   `{{CAT|bad|good}}` → a planted error. Anything else is clean prose.

   The marker describes only the part of the token that CHANGES, so literal
   text may sit either side of it and rides along untouched:

       {{C|lagos|Lagos}}.   →  shown "lagos."   answer "Lagos."
       “{{P|home|home?}}”   →  shown "“home”"   answer "“home?”"

   Requiring the whole token inside the braces instead would mean repeating
   every trailing full stop and quote mark in both halves — which is exactly
   the sort of duplication that goes wrong quietly, turning a planted error
   into ordinary prose that then punishes anyone who corrects it.

   ALTERNATIVE ANSWERS. Anything after the third field is another ACCEPTED
   correction:

       {{P|bad|good|also-good|also-good}}

   The first is canonical — it is what the review shows as "the answer" — and
   the rest score identically. This exists because English punctuation is not
   always a single right answer, and a marker with one accepted string quietly
   turns a defensible correction into a wrong one. If a planted error has more
   than one legitimate fix, list them all; if you cannot list them all, it is
   the wrong error to plant (see docs/grammar-authoring.md). */
const MARKER = /^(.*?)\{\{([CUPS])\|([^|}]*)\|([^}]*)\}\}(.*)$/;

/**
 * A passage's tokens, in order:
 *   { i, shown, answer, accept, cat, br }
 * `shown` is what the player is handed, `answer` is the canonical correction
 * (what the review displays), `accept` is every string that scores, and `cat`
 * is the CUPS letter — null on a clean token, where shown === answer.
 *
 * `br` marks the last token of a line: passages are authored as template
 * literals, and a blank line between blocks is a real paragraph break. That is
 * not decoration — a letter whose greeting, body and sign-off run together in
 * one paragraph is not a letter, and the comma after "Dear Bola" only makes
 * sense when the next line starts underneath it.
 *
 * `focus` narrows the hunt: an error outside it is handed over ALREADY FIXED
 * and marked clean, so the prose stays coherent and only the search narrows.
 * That is deliberately not the same as deleting it — a Punctuation-only round
 * on a passage full of spelling errors would otherwise read like nonsense.
 */
export function buildPassage(passage, focus = 'cups') {
  const inFocus = focusSet(focus);
  const tokens = [];
  let i = 0;
  // Every authored line is its own line on screen (runs of blank lines
  // collapse). Single newlines have to count, not just blank ones: a letter's
  // sign-off is "Yours faithfully," and the name UNDERNEATH it, and running
  // those two together is precisely the layout the comma is there to serve.
  const blocks = String(passage.text).trim().split(/\n+/);
  blocks.forEach((block, b) => {
    const words = block.trim().split(/\s+/).filter(Boolean);
    words.forEach((raw, w) => {
      const last = w === words.length - 1 && b < blocks.length - 1;
      const m = MARKER.exec(raw);
      if (!m) {
        tokens.push({ i: i++, shown: raw, answer: raw, accept: [raw], cat: null, br: last });
        return;
      }
      const [, pre, cat, bad, good, post] = m;
      const live = inFocus.has(cat);
      // The third field onwards are all accepted; the first is canonical.
      const answers = good.split('|').map((g) => pre + g + post);
      tokens.push({
        i: i++,
        // out of focus → handed over already correct
        shown: pre + (live ? bad : good.split('|')[0]) + post,
        answer: answers[0],
        accept: answers,
        cat: live ? cat : null,
        br: last,
      });
    });
  });
  return tokens;
}

/** How many scoring errors a passage holds under a given focus. */
export function errorCount(passage, focus = 'cups') {
  return buildPassage(passage, focus).filter((t) => t.cat).length;
}

/* ── Comparing ────────────────────────────────────────────────────────────
   Case is NOT normalised — Capitalisation is a whole CUPS category, so
   "lagos" and "Lagos" must stay different strings. Quote marks and dashes ARE
   normalised: a child typing an apostrophe gets ' from their keyboard while
   the bank is written with the typographic ’, and failing them for that would
   be marking the font, not the grammar. */
export function normalise(s) {
  return String(s == null ? '' : s)
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export const sameToken = (a, b) => normalise(a) === normalise(b);

/* ── Scoring ──────────────────────────────────────────────────────────────
   Four outcomes per token, and they are genuinely different things:

     caught      a planted error, fixed to the answer
     wrongFix    a planted error, changed — but not to the answer
     missed      a planted error, left exactly as it was handed over
     falseEdit   a CLEAN token the player changed anyway

   falseEdit is the one that makes this an editing game rather than a typing
   race. A player who rewrites every other word will catch everything and still
   lose, because false edits are the third ranking key (see leaderboard.js).

   TAGGING is scored on top: naming the error C/U/P/S is worth the same as
   fixing it, so a passage with 12 errors is out of 24. A tag only counts on a
   token you actually caught — naming an error you never repaired scores
   nothing, and tagging a clean token is itself a false edit's worth of noise
   (it is counted as a mis-tag, not punished twice).
*/
export function scorePassage(tokens, edits, tags) {
  const byCat = {};
  const detail = [];
  let caught = 0, wrongFix = 0, missed = 0, falseEdits = 0, tagged = 0;

  tokens.forEach((t) => {
    const submitted = edits[t.i] != null ? edits[t.i] : t.shown;
    const changed = !sameToken(submitted, t.shown);
    // ANY listed answer scores — see the MARKER notes above on why a planted
    // error is allowed more than one legitimate correction.
    const correct = (t.accept || [t.answer]).some((a) => sameToken(submitted, a));
    const tag = tags[t.i] || null;

    let outcome;
    if (t.cat) {
      const cat = (byCat[t.cat] = byCat[t.cat] || { total: 0, caught: 0, tagged: 0 });
      cat.total += 1;
      if (correct) {
        caught += 1;
        cat.caught += 1;
        outcome = 'caught';
        if (tag === t.cat) { tagged += 1; cat.tagged += 1; }
      } else if (changed) {
        wrongFix += 1;
        outcome = 'wrong-fix';
      } else {
        missed += 1;
        outcome = 'missed';
      }
    } else if (changed) {
      falseEdits += 1;
      outcome = 'false-edit';
    } else {
      outcome = 'clean';
    }
    detail.push({ i: t.i, outcome, submitted, shown: t.shown, answer: t.answer, cat: t.cat, tag });
  });

  return {
    // The leaderboard number: fixing and naming are worth the same.
    score: caught + tagged,
    caught, tagged, wrongFix, missed, falseEdits,
    errorTotal: caught + wrongFix + missed,
    maxScore: (caught + wrongFix + missed) * 2,
    byCat,
    detail,
  };
}
