/* HAND-AUTHORED (not gen-vocab). The "Science Laws" hangman bank, derived at
   load time from the Laws study page's single source of truth
   (data/laws/laws.js) — the study cards are the library, this is the drill.

   Four topics, all keyed to data/vocab/topics.js's `laws` subject:
     physics / chemistry / biology — clue = the law's plain-language statement,
                                     answer = the law's NAME.
     scientists                    — clue = a statement (name withheld),
                                     answer = the SURNAME it is named after.

   Word shape is the vocab contract: { w: answer, d: clue }. Spaces, hyphens,
   apostrophes and en-dashes in an answer are "scenery" (shown from the start,
   never guessed) — see rng.js's isGuessable — so multi-word law names play. */
import { SUBJECTS } from '/data/laws/laws.js';

// The hangman answer for a law: its name minus any parenthetical aside
// ("Newton's First Law (Inertia)" → "Newton's First Law"), so the board asks
// for the name a student would actually write.
const lawName = (name) => name.replace(/\s*\([^)]*\)/g, '').trim();

// The scientist's surname — the last name token, with a few overrides where the
// plain last-token rule would drop a particle or keep a Latinised form.
const SURNAME = {
  'Willebrord Snellius': 'Snell',
  'Henry Le Chatelier': 'Le Chatelier',
};
const surname = (full) => SURNAME[full] || full.split(' ').pop();

const bySubject = Object.fromEntries(SUBJECTS.map((s) => [s.key, s.laws]));
const nameEntries = (laws) => laws.map((l) => ({ w: lawName(l.name), d: l.statement }));

// Every law that names a scientist becomes a "guess who" — the statement is the
// clue, so a law whose name gives the answer away is fine here (the name is
// never shown). Laws with no single namesake (e.g. the Combined Gas Law) sit
// this topic out.
const scientistEntries = SUBJECTS.flatMap((s) => s.laws)
  .filter((l) => l.scientist)
  .map((l) => ({ w: surname(l.scientist), d: l.statement }));

export const WORDS = {
  physics: nameEntries(bySubject.physics),
  chemistry: nameEntries(bySubject.chemistry),
  biology: nameEntries(bySubject.biology),
  scientists: scientistEntries,
};
