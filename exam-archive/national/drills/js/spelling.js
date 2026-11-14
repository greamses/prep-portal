/* ═══════════════════════════════════════════════════════
   DRILLS — Spelling. Two ways to be given a word:
     spellSay  Read out    the word is SPOKEN; spell what you hear
     spellIpa  Transcribe  the word's IPA is SHOWN; spell the word it writes
   The bank is data/spelling/secondary.js (word + IPA).

   The words come off a seeded shuffle of the whole bank, so a round never
   repeats a word until all of it is used, and every player in a room gets the
   same words in the same order (the rest of Drills deals by seed and index the
   same way).

   Marking compares LETTERS only, ignoring case, accents, spaces, hyphens and
   apostrophes: "avant garde", "Avant-garde" and "avantgarde" are all the same
   spelling, and a phone that will not type é does not cost a point on cliché.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed } from '/utils/games/rng.js';
import { SPELLING_SECONDARY } from '/data/spelling/secondary.js';

export const SPELLING_OPS = ['spellSay', 'spellIpa'];
export const isSpellingOp = (op) => SPELLING_OPS.includes(op);

export const BANK = SPELLING_SECONDARY;   // [word, IPA, definition, sentence]
// The deck's own stream: past CONTENT_NS + index (0..), BOT_NS and NAME_NS.
const DECK_NS = 3_000_000;

/* ── Sets of twenty ───────────────────────────────────────────────────
   The bank is learned twenty words at a time, in its own order: set 1 is the
   first twenty, set 41 the last seven. A room carries its sets as `tables`
   (the room doc's list of numbers), so joiners and bots deal the same words. */
export const SET_SIZE = 20;
export const SET_COUNT = Math.ceil(BANK.length / SET_SIZE);
export const setOf = (i) => Math.floor(i / SET_SIZE) + 1;
export function setWords(n) {
  return BANK.slice((n - 1) * SET_SIZE, n * SET_SIZE).map((row, k) => ({ i: (n - 1) * SET_SIZE + k, row }));
}
const validSets = (sets) => {
  const ok = (sets || []).filter((n) => Number.isInteger(n) && n >= 1 && n <= SET_COUNT);
  return ok.length ? [...new Set(ok)].sort((a, b) => a - b) : [1];
};
/** "1-3, 7" from [1, 2, 3, 7]: for summaries. */
export function setsLabel(sets) {
  const s = validSets(sets);
  const out = [];
  for (let k = 0; k < s.length; k++) {
    let j = k;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    out.push(j > k ? `${s[k]}-${s[j]}` : `${s[k]}`);
    k = j;
  }
  return out.join(', ');
}

// One shuffle per seed and set choice, kept for the round. A round runs the
// chosen sets' words in a seeded order and never repeats one until all are used.
let deckKey = null;
let deck = null;
function deckFor(seed, sets) {
  const s = validSets(sets);
  const key = `${seed}|${s.join(',')}`;
  if (deckKey === key && deck) return deck;
  const rng = mulberry32(hashSeed(seed, DECK_NS));
  deck = s.flatMap((n) => setWords(n).map((w) => w.i));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  deckKey = key;
  return deck;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** The sentence with the word blanked out, so reading it never gives the spelling away. */
export function blanked(sentence, word) {
  const re = new RegExp(escapeRe(word), 'gi');
  return sentence.replace(re, (m) => '_'.repeat(Math.max(5, Math.min(m.length, 9))));
}

export function spellingQuestion(seed, index, op, sets) {
  const d = deckFor(seed, sets);
  const [word, ipa, def, use] = BANK[d[index % d.length]];
  const i = d[index % d.length];
  const common = { i, word, ipa, def, use, gap: blanked(use, word), answer: word, set: setOf(i) };
  if (op === 'spellIpa') return { ...common, spell: 'ipa', text: `/${ipa}/`, hint: 'Spell the word' };
  return { ...common, spell: 'say', text: '', hint: 'Listen, then spell the word' };
}

/** Letters only: case, accents, spaces, hyphens and apostrophes do not count. */
export const letters = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
export const spelledRight = (typed, word) => !!typed && letters(typed) === letters(word);

/** What the answer line accepts: letters (accented too), one space, hyphen, apostrophe. */
export const sanitizeSpelling = (raw) => raw
  .replace(/[’‘]/g, "'")
  .replace(/[^\p{L}' -]/gu, '')
  .replace(/ {2,}/g, ' ')
  .replace(/^ /, '')
  .slice(0, 40);

/* ── The voice and the face live in ./boy.js ─────────────────────────── */
export { sayWord, hush, canSpeak, faceButton, FACE_SRC } from './boy.js';

/* ── Recorded clips ───────────────────────────────────────────────────
   Kokoro recordings of every word, definition and sentence, made by
   tools/spelling-audio on GitHub's machines. They live on the repo's
   spelling-audio branch (never in this one) and are served by jsDelivr;
   data/spelling/audio.js lists which exist. Anything missing is spoken by
   the browser. */
import { CLIPS } from '/data/spelling/audio.js';
const pad = (i) => String(i + 1).padStart(4, '0');
/** URL of the recording of bank entry `i` ('w' word, 'd' definition, 's' sentence), or null. */
export function clipFor(i, kind) {
  if (!CLIPS || !CLIPS.base || !CLIPS[kind] || !CLIPS[kind].has(i)) return null;
  return `${CLIPS.base}${pad(i)}-${kind}.mp3`;
}
