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
export {
  SUBJECTS, SUBJECT_KEYS, GRADES, TARGET_WORDS,
  subjectsForGrade, gradesForSubject, topicsFor, topicMeta,
} from './topics.js';

import { topicsFor } from './topics.js';

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const MODES = [
  { key: 'az', label: 'A to Z' },
  { key: 'topic', label: 'By Topic' },
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
    for (const entry of words[topic.key] || []) pool.push({ ...entry, topic: topic.key });
  }
  return pool;
}

/** One topic's words, in file order — the round does its own seeded shuffle. */
export function topicPool(words, topicKey) {
  return (words[topicKey] || []).map((entry) => ({ ...entry, topic: topicKey }));
}
