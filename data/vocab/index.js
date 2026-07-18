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
  ELEMENTS, CATEGORY_LABELS, TABLE_COLUMNS, TABLE_ROWS, GROUP_NAMES, PERIOD_ROW_LABELS,
  inScope, scopeInfo,
} from './periodic-table.js';

/* ── Scoped topic keys ────────────────────────────────────────────────────
   A drawn topic's key can carry a scope after a colon — 'periodic-table:g17'
   is Group 17 only. The scoped key travels the whole seeded-room contract
   untouched (bucket, room doc, joiners), so two players share a room only if
   they are drilling the SAME slice. These two helpers keep everything else
   honest about it. */
export const baseTopic = (key) => (key || '').split(':')[0];
export const topicScope = (key) => (key || '').split(':')[1] || '';

/* The world map's continents — the scope keys a scoped geography round rides
   on, kept here (tiny) so the setup screen never has to load the map data
   just to draw its steps. */
export const CONTINENTS = [
  { key: 'africa', label: 'Africa' },
  { key: 'asia', label: 'Asia' },
  { key: 'europe', label: 'Europe' },
  { key: 'n-america', label: 'North America' },
  { key: 's-america', label: 'South America' },
  { key: 'oceania', label: 'Oceania' },
];
export const CONTINENT_LABELS = Object.fromEntries(CONTINENTS.map((c) => [c.key, c.label]));

/* Nigeria's six geopolitical zones — the scope keys a scoped Map-of-Nigeria
   round rides on. Kept here (tiny) for the same reason as the continents. */
export const ZONES = [
  { key: 'n-central', label: 'North Central' },
  { key: 'n-east', label: 'North East' },
  { key: 'n-west', label: 'North West' },
  { key: 's-east', label: 'South East' },
  { key: 's-south', label: 'South South' },
  { key: 's-west', label: 'South West' },
];
export const ZONE_LABELS = Object.fromEntries(ZONES.map((z) => [z.key, z.label]));

/* A map's scope can pick SEVERAL regions. The checkbox picker writes a mask —
   'cm<hex>' (continents) / 'zm<hex>' (zones), bit i = the i-th region in the
   list above, so 'world-map:cm5' is Africa + Europe. Hex keeps any combo
   under the rules' 40-char topic cap with one canonical spelling per set
   (honest matchmaking buckets). A bare region key ('africa') is the launch
   format and stays decodable so a mid-deploy room never breaks. */
function regionsOf(base) {
  return base === WORLD ? CONTINENTS : base === NIGERIA ? ZONES : null;
}

/** The scoped region keys as a Set, or null when the round is unscoped
    (no scope, an empty mask, or a mask that covers every region). */
export function regionSet(topicKey) {
  const scope = topicScope(topicKey);
  const regions = regionsOf(baseTopic(topicKey));
  if (!scope || !regions) return null;
  if (scope[1] === 'm') {
    const mask = parseInt(scope.slice(2), 16) || 0;
    const keys = regions.filter((_, i) => mask & (1 << i)).map((r) => r.key);
    return keys.length && keys.length < regions.length ? new Set(keys) : null;
  }
  return regions.some((r) => r.key === scope) ? new Set([scope]) : null;
}

/** A human label for a map scope — 'Africa', 'Africa & Asia', '4 zones'. */
export function regionSetLabel(topicKey) {
  const set = regionSet(topicKey);
  if (!set) return '';
  const regions = regionsOf(baseTopic(topicKey)) || [];
  const labels = regions.filter((r) => set.has(r.key)).map((r) => r.label);
  if (labels.length <= 2) return labels.join(' & ');
  const noun = baseTopic(topicKey) === NIGERIA ? 'zones' : 'continents';
  return `${labels.length} ${noun}`;
}

/** topics.js's topicMeta, but scope-aware: the label says which slice. */
export function topicMeta(subjectKey, topicKey) {
  const base = baseTopic(topicKey);
  const meta = outlinedMeta(subjectKey, base);
  const scope = topicScope(topicKey);
  if (!meta || !scope) return meta;
  const label = base === PERIODIC ? scopeLabel(scope) : regionSetLabel(topicKey);
  return label ? { ...meta, label: `${meta.label} — ${label}` } : meta;
}

/* Topics whose content is bundled data (the periodic table's elements, the
   world map's countries), not a generated word file. They are always offered
   wherever their subject is, and their clue is DRAWN, not written — so they
   are topic-only and stay out of the A–Z alphabet. */
const PERIODIC = 'periodic-table';
const WORLD = 'world-map';
const NIGERIA = 'nigeria-map';
const DRAWN = new Set([PERIODIC, WORLD, NIGERIA]);
// A subject made ENTIRELY of bundled topics needs no entry in the generated
// manifest to be offered.
const BUNDLED_SUBJECTS = new Set(['geography']);

// Subjects whose WORDS are hand-authored and ship with the app (not written by
// gen-vocab, so never in the manifest) — their topics carry ordinary text
// clues, so unlike DRAWN topics they still play through the normal word path,
// but they are always offered wherever the subject is. `laws` sources its
// words from data/laws/laws.js (the Laws study page's bank).
const BUNDLED_WORD_SUBJECTS = new Set(['laws']);

/* The bank ships a subject at a time, so the OUTLINE (topics.js) and what has
   actually been written are not the same thing. Everything the setup screen sees
   is filtered through the manifest: a subject with no words is not offered, and
   neither is a topic too thin to play. A subject that isn't there yet is a much
   better experience than one that deals an empty round. */

/** Grades that have at least one subject with words. */
export const GRADES = ALL_GRADES.filter((g) => subjectsForGrade(g).length > 0);

/** Subjects on offer at a grade — outlined for it, AND generated (or bundled). */
export function subjectsForGrade(grade) {
  return outlinedSubjects(grade).filter(
    (key) => AVAILABLE[key] || BUNDLED_SUBJECTS.has(key) || BUNDLED_WORD_SUBJECTS.has(key),
  );
}

/** Topics on offer — outlined for the grade, AND holding enough words to play. */
export function topicsFor(subjectKey, grade) {
  const have = AVAILABLE[subjectKey] || {};
  // A drawn topic carries its own bundled data, and a bundled-word subject
  // (laws) ships all its topics' words with the app — both are offered whenever
  // their subject is; every other topic must have been generated into a file.
  const bundled = BUNDLED_WORD_SUBJECTS.has(subjectKey);
  return outlinedTopics(subjectKey, grade)
    .filter((t) => DRAWN.has(t.key) || bundled ? true : have[t.key]);
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
    // Drawn topics are topic-only modes: their clue is a drawn table or map,
    // not a sentence, so they do not belong in a mixed A–Z alphabet.
    if (DRAWN.has(topic.key)) continue;
    for (const entry of words[topic.key] || []) pool.push({ ...entry, topic: topic.key });
  }
  return pool;
}

/** One topic's words, in file order — the round does its own seeded shuffle. */
export function topicPool(words, topicKey) {
  const base = baseTopic(topicKey);
  const scope = topicScope(topicKey);
  // The periodic table's "words" are the elements themselves; each carries an
  // `element` the game renders as the drawn table instead of a text clue. The
  // scope suffix ('…:g17', '…:p3') narrows it to one group or period.
  if (base === PERIODIC) {
    return scopedElements(scope).map((e) => ({ ...e, topic: PERIODIC }));
  }
  // Any other scoped topic (the maps' continents/zones) filters on the `s`
  // key its entries carry — 'world-map:cm5' keeps Africa + Europe.
  let list = words[base] || [];
  const set = regionSet(topicKey);
  if (set) list = list.filter((entry) => set.has(entry.s));
  return list.map((entry) => ({ ...entry, topic: base }));
}
