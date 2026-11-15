/* ═══════════════════════════════════════════════════════
   SPELLING — the lines the judge says at the Spelling Bee, recorded in the same
   Kokoro voice as the words (tools/spelling-audio, list "phrases", kind d only:
   phrases/<voice>/NNNN-d.mp3). The row shape matches the word lists', so the
   recorder needs nothing special: [name, '', what is said].

   The ORDER is the clip's number. Add new lines at the END; never reorder.
═══════════════════════════════════════════════════════ */
export const SPELLING_PHRASES = [
  ['yourWordIs', '', 'Your word is,'],
  ['correct', '', 'Correct.'],
  ['incorrect', '', 'Incorrect.'],
];
/** Clip number of a phrase: PHRASE.correct -> 1. */
export const PHRASE = Object.fromEntries(SPELLING_PHRASES.map((row, i) => [row[0], i]));
