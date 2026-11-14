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

const BANK = SPELLING_SECONDARY;
// The deck's own stream: past CONTENT_NS + index (0..), BOT_NS and NAME_NS.
const DECK_NS = 3_000_000;

// One shuffle per seed, kept for the round.
let deckSeed = null;
let deck = null;
function deckFor(seed) {
  if (deckSeed === seed && deck) return deck;
  const rng = mulberry32(hashSeed(seed, DECK_NS));
  deck = BANK.map((_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  deckSeed = seed;
  return deck;
}

export function spellingQuestion(seed, index, op) {
  const d = deckFor(seed);
  const [word, ipa] = BANK[d[index % d.length]];
  if (op === 'spellIpa') {
    return { spell: 'ipa', word, ipa, text: `/${ipa}/`, hint: 'Spell the word', answer: word };
  }
  return { spell: 'say', word, ipa, text: '', hint: 'Listen, then spell the word', answer: word };
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

/* ── The voice ────────────────────────────────────────────────────────
   The browser's own speech. A British or American English voice is picked
   once the list of voices has loaded (Chrome fills it in a beat after the
   page). A phone only lets a page speak after the player has touched it, so
   the first tap or key anywhere on the page says nothing out loud to unlock
   it: by the time a round starts, Read out can talk. */
let voice = null;
function pickVoice() {
  try {
    const all = speechSynthesis.getVoices();
    if (!all.length) return;
    const en = all.filter((v) => /^en[-_]/i.test(v.lang) || v.lang === 'en');
    voice = en.find((v) => /en[-_]GB/i.test(v.lang)) || en.find((v) => /en[-_]US/i.test(v.lang)) || en[0] || null;
  } catch { /* no speech here */ }
}
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
if (canSpeak) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
  const unlock = () => {
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch { /* ignore */ }
  };
  document.addEventListener('pointerdown', unlock, { once: true, capture: true });
  document.addEventListener('keydown', unlock, { once: true, capture: true });
}

/** Say a word, a little slower than talking pace. */
export function sayWord(word) {
  if (!canSpeak) return false;
  try {
    speechSynthesis.cancel();
    if (!voice) pickVoice();
    const u = new SpeechSynthesisUtterance(word);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-GB';
    u.rate = 0.8;
    speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}
export function hush() { try { if (canSpeak) speechSynthesis.cancel(); } catch { /* ignore */ } }
