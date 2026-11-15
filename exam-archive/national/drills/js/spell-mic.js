/* ═══════════════════════════════════════════════════════
   DRILLS — spelling OUT LOUD. With the mic on, the player says the letters
   ("F, O, R, T...") as at a spelling bee, and they go into the answer just as
   typed letters do, so a right spelling is taken the moment its last letter
   is heard.

   The browser's own speech recogniser does the hearing (Chrome and Edge send
   the sound to their speech service; Safari has its own). It is asked for
   plain words, and each letter name it writes back ("bee", "sea", "double
   you", "aitch") is turned into its letter. Anything else is ignored, so a
   word said whole is never taken as its spelling.

   Said instead of a letter:
     "delete" / "back" / "backspace" / "undo"   takes the last letter off
     "clear" / "start again"                    empties the answer
     "space", "hyphen" / "dash", "apostrophe"   for the words that have them

   Whatever is heard while the boy is talking (and a moment after) is dropped,
   so his own voice never types into the answer.
═══════════════════════════════════════════════════════ */

const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canListen = !!Recognition;

// Every way a recogniser writes a letter's name. A lone letter ("f", "F.") counts as itself.
const NAMES = {
  a: ['a', 'ay'],
  b: ['b', 'bee', 'be'],
  c: ['c', 'see', 'sea', 'cee'],
  d: ['d', 'dee'],
  e: ['e', 'ee'],
  f: ['f', 'ef', 'eff'],
  g: ['g', 'gee', 'jee'],
  h: ['h', 'aitch', 'haitch'],
  i: ['i', 'eye', 'aye'],
  j: ['j', 'jay'],
  k: ['k', 'kay'],
  l: ['l', 'el', 'elle', 'ell'],
  m: ['m', 'em'],
  n: ['n', 'en'],
  o: ['o', 'oh', 'owe'],
  p: ['p', 'pee', 'pea'],
  q: ['q', 'queue', 'cue'],
  r: ['r', 'are', 'ar'],
  s: ['s', 'es', 'ess'],
  t: ['t', 'tea', 'tee'],
  u: ['u', 'you', 'ewe'],
  v: ['v', 'vee'],
  w: ['w', 'double-u'],
  x: ['x', 'ex'],
  y: ['y', 'why', 'wye'],
  z: ['z', 'zed', 'zee'],
};
const LETTER = new Map();
for (const [ch, names] of Object.entries(NAMES)) for (const n of names) if (!LETTER.has(n)) LETTER.set(n, ch);
const MARKS = { space: ' ', hyphen: '-', dash: '-', apostrophe: "'" };
const BACK = new Set(['delete', 'back', 'backspace', 'undo', 'rub', 'erase']);
const CLEAR = new Set(['clear', 'restart']);

/**
 * What a heard phrase means, in order: letters (strings of one character),
 * 'back' and 'clear'. "double you" is joined first, as is "start again".
 */
export function parseSpoken(text) {
  const words = String(text).toLowerCase()
    .replace(/double[\s-]*(u|you|yu)\b/g, ' double-u ')
    .replace(/start (again|over)/g, ' clear ')
    .replace(/[^a-z' -]+/g, ' ')
    .split(/\s+/).filter(Boolean);
  const out = [];
  for (const w of words) {
    if (BACK.has(w)) out.push({ back: true });
    else if (CLEAR.has(w)) out.push({ clear: true });
    else if (MARKS[w]) out.push({ ch: MARKS[w] });
    else if (LETTER.has(w)) out.push({ ch: LETTER.get(w) });
    // a run like "f o r" sometimes comes back with no spaces only as capitals ("FOR"): it
    // cannot be told from the word "for", so it is left alone
  }
  return out;
}

/**
 * The mic. `onHeard(items, text)` gets each phrase's letters and commands;
 * `quiet()` says whether hearing should count now (false while the boy talks);
 * `onState(on, why)` reports it switching on or off (why: 'denied', 'error').
 */
export function createSpellMic({ onHeard, quiet = () => true, onState = () => {} }) {
  let rec = null;
  let on = false;
  let restarting = 0;

  function begin() {
    if (!Recognition || rec) return;
    rec = new Recognition();
    rec.lang = 'en-GB';
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      for (let k = e.resultIndex; k < e.results.length; k++) {
        if (!e.results[k].isFinal) continue;
        const text = e.results[k][0].transcript;
        if (!quiet()) continue;                    // the boy is talking: that is his voice
        const items = parseSpoken(text);
        onHeard(items, text);
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { stop(); onState(false, 'denied'); }
      else if (e.error === 'audio-capture') { stop(); onState(false, 'error'); }
      // 'no-speech' and 'network' just end this session; onend starts another
    };
    rec.onend = () => {
      rec = null;
      // the recogniser stops itself after a silence: carry on listening while the mic is on,
      // but not in a tight loop if it keeps failing straight away
      if (on) { const now = Date.now(); if (now - restarting > 800) { restarting = now; begin(); } else setTimeout(() => on && begin(), 1000); }
    };
    try { rec.start(); } catch { rec = null; }
  }

  function start() {
    if (!Recognition || on) return;
    on = true;
    begin();
    onState(true);
  }
  function stop() {
    on = false;
    const r = rec;
    rec = null;
    if (r) { r.onend = null; try { r.abort(); } catch { /* already stopped */ } }
    onState(false);
  }
  return { start, stop, get on() { return on; } };
}
