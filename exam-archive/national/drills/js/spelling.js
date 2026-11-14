/* ═══════════════════════════════════════════════════════
   DRILLS — Spelling. Two ways to be given a word:
     spellSay  Read out    the word is SPOKEN; spell what you hear
     spellIpa  Transcribe  the word's IPA is SHOWN; spell the word it writes
   Three word lists (BANKS), each [word, IPA, definition, sentence] rows:
   data/spelling/lower-primary.js, upper-primary.js, secondary.js.

   The words come off a seeded shuffle of the chosen sets, so a round never
   repeats a word until all of them are used, and every player in a room gets
   the same words in the same order (the rest of Drills deals by seed and index
   the same way).

   Marking compares LETTERS only, ignoring case, accents, spaces, hyphens and
   apostrophes: "avant garde", "Avant-garde" and "avantgarde" are all the same
   spelling, and a phone that will not type é does not cost a point on cliché.
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed } from '/utils/games/rng.js';
import { SPELLING_SECONDARY } from '/data/spelling/secondary.js';
import { SPELLING_UPPER_PRIMARY } from '/data/spelling/upper-primary.js';
import { SPELLING_LOWER_PRIMARY } from '/data/spelling/lower-primary.js';

export const SPELLING_OPS = ['spellSay', 'spellIpa'];
export const isSpellingOp = (op) => SPELLING_OPS.includes(op);

/* The lists. `code` is how a list's sets travel in a room: a room's `tables`
   holds code + set number (secondary 1..81, upper primary 1001.., lower
   primary 2001..), so rooms on different lists never meet in matchmaking and
   no new room field (or rule) was needed. */
export const BANKS = {
  lower: { key: 'lower', label: 'Lower Primary', rows: SPELLING_LOWER_PRIMARY, code: 2000 },
  upper: { key: 'upper', label: 'Upper Primary', rows: SPELLING_UPPER_PRIMARY, code: 1000 },
  secondary: { key: 'secondary', label: 'Secondary', rows: SPELLING_SECONDARY, code: 0 },
};
export const BANK_KEYS = ['lower', 'upper', 'secondary'];
export const BANK = SPELLING_SECONDARY;   // the first list; kept for older callers
// The deck's own stream: past CONTENT_NS + index (0..), BOT_NS and NAME_NS.
const DECK_NS = 3_000_000;

/* ── Sets of ten ──────────────────────────────────────────────────────
   A list is learned ten words at a time (the user's choice; it was twenty),
   in its own order: set 1 is its first ten. */
export const SET_SIZE = 10;
export const setCount = (bank) => Math.ceil(BANKS[bank].rows.length / SET_SIZE);
export const SET_COUNT = setCount('secondary');
export const setOf = (i) => Math.floor(i / SET_SIZE) + 1;
export function setWords(bank, n) {
  if (typeof bank === 'number') { n = bank; bank = 'secondary'; }   // older calls: setWords(n)
  return BANKS[bank].rows.slice((n - 1) * SET_SIZE, n * SET_SIZE).map((row, k) => ({ bank, i: (n - 1) * SET_SIZE + k, row }));
}
/** A room's set id -> { bank, n }, and back. */
export function parseSet(id) {
  const key = BANK_KEYS.slice().sort((x, y) => BANKS[y].code - BANKS[x].code).find((k) => id > BANKS[k].code);
  return key ? { bank: key, n: id - BANKS[key].code } : null;
}
export const setId = (bank, n) => BANKS[bank].code + n;
const validSets = (ids) => {
  const ok = (ids || []).filter((id) => {
    if (!Number.isInteger(id)) return false;
    const p = parseSet(id);
    return p && p.n >= 1 && p.n <= setCount(p.bank);
  });
  return ok.length ? [...new Set(ok)].sort((a, b) => a - b) : [1];
};
/** The list a room's sets belong to. */
export const bankOfSets = (ids) => (parseSet(validSets(ids)[0]) || { bank: 'secondary' }).bank;
/** "1-3, 7" from set numbers (or ids): for summaries. */
export function setsLabel(sets) {
  const s = [...new Set((sets || []).map((id) => (id > 999 ? parseSet(id).n : id)))].sort((a, b) => a - b);
  const out = [];
  for (let k = 0; k < s.length; k++) {
    let j = k;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    out.push(j > k ? `${s[k]}-${s[j]}` : `${s[k]}`);
    k = j;
  }
  return out.join(', ');
}

/* ── Time comes from the words ────────────────────────────────────────
   The user's rule: a spelling round lasts as long as its words need, at
   10 words a minute in Normal mode and 20 a minute in Focus mode (where the
   first wrong letter puts you out). The round also ends early once every word
   has been tried. */
export const SECONDS_PER_WORD = { normal: 6, focus: 3 };
/** How many words the chosen sets hold. */
export function wordsInSets(ids) {
  return validSets(ids).reduce((sum, id) => { const { bank, n } = parseSet(id); return sum + setWords(bank, n).length; }, 0);
}
/** The round's length in seconds for these sets. */
export const roundSeconds = (ids, focus) => wordsInSets(ids) * SECONDS_PER_WORD[focus ? 'focus' : 'normal'];
/** "3:20" from 200. */
export const clockLabel = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/** Focus mode: is what has been typed still the start of the word? (letters only) */
export const onTrack = (typed, word) => letters(word).startsWith(letters(typed));

// One shuffle per seed and set choice, kept for the round. A round runs the
// chosen sets' words in a seeded order and never repeats one until all are used.
let deckKey = null;
let deck = null;
function deckFor(seed, ids) {
  const s = validSets(ids);
  const key = `${seed}|${s.join(',')}`;
  if (deckKey === key && deck) return deck;
  const rng = mulberry32(hashSeed(seed, DECK_NS));
  deck = s.flatMap((id) => { const { bank, n } = parseSet(id); return setWords(bank, n).map((w) => [bank, w.i]); });
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
  const [bank, i] = d[index % d.length];
  const [word, ipa, def, use] = BANKS[bank].rows[i];
  const common = { bank, i, word, ipa, def, use, gap: blanked(use, word), answer: word, set: setOf(i) };
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
export { sayWord, hush, canSpeak, faceButton, preloadClip, FACE_SRC } from './boy.js';

/* ── Recorded clips ───────────────────────────────────────────────────
   Kokoro recordings of every word, definition and sentence, made by
   tools/spelling-audio on GitHub's machines. They live on the repo's
   spelling-audio branch (never in this one) and are served by jsDelivr;
   data/spelling/audio.js lists which exist. Anything missing is spoken by
   the browser. */
import { CLIPS } from '/data/spelling/audio.js';
const pad = (i) => String(i + 1).padStart(4, '0');
/** URL of the recording of entry `i` of list `bank` ('w' word, 'd' definition, 's' sentence), or null. */
export function clipFor(bank, i, kind) {
  const c = CLIPS && CLIPS[bank];
  if (!c || !c.base || !c[kind] || !c[kind].has(i)) return null;
  return `${c.base}${pad(i)}-${kind}.mp3`;
}
