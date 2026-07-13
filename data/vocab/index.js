/* ═══════════════════════════════════════════════════════
   VOCAB BANK — registry + grade filter
   One place that knows every subject. Adding a subject is one file plus
   one line in SUBJECTS; nothing else in the game needs to change.
═══════════════════════════════════════════════════════ */
import { SCIENCE_WORDS } from './science.js';
import { MATH_WORDS } from './math.js';

export const SUBJECTS = {
  science: { label: 'Science', words: SCIENCE_WORDS },
  math: { label: 'Maths', words: MATH_WORDS },
};

export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// How far below the chosen grade we still count a word as "on topic". A
// Grade 8 learner drilling science should meet `hormone` and `gene`, not
// `air` and `bird` — but a two-grade tail keeps the pool wide enough that
// the same word doesn't come up every single round.
const BAND = 2;

// The words a given subject/grade can be asked for one letter, hardest-band
// first. Grades below the band are only reached for as a last resort, so a
// thin letter (Maths Q at Grade 1, say) still yields something rather than
// silently dropping out of the alphabet.
export function poolFor(subject, letter, grade) {
  const subj = SUBJECTS[subject];
  if (!subj) return [];
  const all = subj.words[letter] || [];

  const inBand = all.filter((x) => x.g <= grade && x.g >= grade - BAND);
  if (inBand.length) return inBand;

  const atOrBelow = all.filter((x) => x.g <= grade);
  if (atOrBelow.length) return atOrBelow;

  // Nothing at this grade or under: fall forward to the easiest word there
  // is for this letter (all of Maths' X and Y words are Grade 6+, and a
  // Grade 1 alphabet with holes in it is worse than one slightly stretching
  // word).
  const easiest = Math.min(...all.map((x) => x.g));
  return all.filter((x) => x.g === easiest);
}

// The letters this subject/grade can actually field a word for — the game
// marches through exactly these, in order. Every letter has at least one
// word today, but a subject added later may not, and the march should bend
// around that rather than break on it.
export function lettersFor(subject, grade) {
  return LETTERS.filter((L) => poolFor(subject, L, grade).length > 0);
}
