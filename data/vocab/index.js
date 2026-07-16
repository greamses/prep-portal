/* ═══════════════════════════════════════════════════════
   VOCAB — the bank's public face.

   Two halves, kept apart on purpose:
     topics.js           the outline (subjects, topics, grade bands) — tiny, and
                         needed by the setup screen the moment the page loads.
     words/<subject>.js  the vocabulary itself — big, and not needed until a
                         round actually starts, so it loads on demand.

   That split matters: the whole bank runs to a few hundred KB, and a player
   picking "Grade 4 · Earth Science" should never pay to download senior
   Chemistry to find that out.

   Words carry no grade of their own any more. A topic's BAND is what makes its
   vocabulary fair (see topics.js) — so the pool at a grade is simply the union
   of the topics on offer at that grade.
═══════════════════════════════════════════════════════ */
export { SUBJECTS, SUBJECT_KEYS, TARGET_WORDS, gradesForSubject } from './topics.js';

import {
  SUBJECTS, GRADES as ALL_GRADES,
  subjectsForGrade as outlinedSubjects, topicsFor as outlinedTopics,
  topicMeta as outlinedMeta,
} from './topics.js';
import { AVAILABLE } from './manifest.js';
import { scopedElements, scopeLabel } from './periodic-table.js';

export {
  ELEMENTS, CATEGORY_LABELS, TABLE_COLUMNS, TABLE_ROWS, GROUP_NAMES, inScope,
} from './periodic-table.js';

/* ── Scoped topic keys ────────────────────────────────────────────────────
   A drawn topic's key can carry a scope after a colon — 'periodic-table:g17'
   is Group 17 only. The scoped key travels the whole seeded-room contract
   untouched (bucket, room doc, joiners), so two players share a room only if
   they are drilling the SAME slice. These two helpers keep everything else
   honest about it. */
export const baseTopic = (key) => (key || '').split(':')[0];
export const topicScope = (key) => (key || '').split(':')[1] || '';

/** topics.js's topicMeta, but scope-aware: the label says which slice. */
export function topicMeta(subjectKey, topicKey) {
  const meta = outlinedMeta(subjectKey, baseTopic(topicKey));
  const scope = topicScope(topicKey);
  if (!meta || !scope) return meta;
  return { ...meta, label: `${meta.label} — ${scopeLabel(scope)}` };
}

// A topic whose content is bundled scientific data (the periodic table), not a
// generated word file. It is always available wherever its subject is, and its
// "words" are the elements themselves — see topicPool below.
const PERIODIC = 'periodic-table';

/* The bank ships a subject at a time, so the OUTLINE (topics.js) and what has
   actually been written are not the same thing. Everything the setup screen sees
   is filtered through the manifest: a subject with no words is not offered, and
   neither is a topic too thin to play. A subject that isn't there yet is a much
   better experience than one that deals an empty round. */

/** Grades that have at least one subject with words. */
export const GRADES = ALL_GRADES.filter((g) => subjectsForGrade(g).length > 0);

/** Subjects on offer at a grade — outlined for it, AND generated. */
export function subjectsForGrade(grade) {
  return outlinedSubjects(grade).filter((key) => AVAILABLE[key]);
}

/** Topics on offer — outlined for the grade, AND holding enough words to play. */
export function topicsFor(subjectKey, grade) {
  const have = AVAILABLE[subjectKey] || {};
  // periodic-table carries its own bundled data, so it is offered whenever its
  // subject is; every other topic must have been generated into a word file.
  return outlinedTopics(subjectKey, grade)
    .filter((t) => t.key === PERIODIC ? true : have[t.key]);
}

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const MODES = [
  { key: 'az', label: 'A to Z' },
  { key: 'topic', label: 'By Topic' },
];

/* How a word is played. Classic is hangman — you READ the word out of the
   letters you guess. A spelling bee makes you WRITE it, in order, which is what
   a spelling test actually asks for and a much harder thing to do. */
export const SPELL_MODES = [
  { key: 'classic', label: 'Classic', hint: 'Guess any letter. A hit fills every place it appears.' },
  { key: 'spell', label: 'Spelling Bee', hint: 'Type the whole word, letter by letter, in order.' },
];

const cache = new Map();

/**
 * The word lists for one subject, fetched once. The specifier is absolute so
 * the import map's content-hashed URL applies — a dynamic import is remapped
 * just like a static one, but only if the string matches a map key exactly
 * (see scripts/version-assets.mjs).
 */
export async function loadWords(subjectKey) {
  if (!cache.has(subjectKey)) {
    cache.set(subjectKey, import(`/data/vocab/words/${subjectKey}.js`).then((m) => m.WORDS));
  }
  return cache.get(subjectKey);
}

/** Every word a grade can fairly meet in a subject — what an A–Z round draws from. */
export function gradePool(words, subjectKey, grade) {
  const pool = [];
  for (const topic of topicsFor(subjectKey, grade)) {
    // The periodic table is a topic-only mode: its clue is a drawn cell, not a
    // sentence, so it does not belong in a mixed A–Z alphabet.
    if (topic.key === PERIODIC) continue;
    for (const entry of words[topic.key] || []) pool.push({ ...entry, topic: topic.key });
  }
  return pool;
}

/** One topic's words, in file order — the round does its own seeded shuffle. */
export function topicPool(words, topicKey) {
  // The periodic table's "words" are the elements themselves; each carries an
  // `element` the game renders as the drawn table instead of a text clue. The
  // scope suffix ('…:g17', '…:p3') narrows it to one group or period.
  if (baseTopic(topicKey) === PERIODIC) {
    return scopedElements(topicScope(topicKey)).map((e) => ({ ...e, topic: PERIODIC }));
  }
  return (words[topicKey] || []).map((entry) => ({ ...entry, topic: topicKey }));
}
