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
     "done" / "finished"                        hands the spelling in (the Spelling Bee)

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
const DONE = new Set(['done', 'finished', 'finish', 'submit']);   // the Spelling Bee: "that is my spelling"

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
    else if (DONE.has(w)) out.push({ done: true });
    else if (MARKS[w]) out.push({ ch: MARKS[w] });
    else if (LETTER.has(w)) out.push({ ch: LETTER.get(w) });
    // a run like "f o r" sometimes comes back with no spaces only as capitals ("FOR"): it
    // cannot be told from the word "for", so it is left alone
  }
  return out;
}

/**
 * The mic. `onHeard(items, text)` gets what to do to the answer, in order: letters
 * ({ ch }), { back } and { clear }. Letters arrive AS THEY ARE SAID: the recogniser's
 * first guesses are used at once, and when it changes its mind ("bee" -> "dee") the
 * letters it took back are taken off again ({ back }) before the new ones go in.
 * Commands ("delete", "clear") wait for its final word, as they cannot be undone.
 * `reset()` (a new word) means the letters said so far belong to the last word;
 * `quiet()` says whether hearing should count now (false while the boy talks);
 * `onState(on, why)` reports it switching on or off (why: 'denied', 'error').
 */
export function createSpellMic({ onHeard, quiet = () => true, onState = () => {}, interim = true }) {
  let rec = null;
  let on = false;
  let restarting = 0;
  let applied = [];     // per result of this session: the letters already put in the answer
  let seen = [];        // per result: the letters it holds now (reset() makes them all "applied")
  const same = (a, b) => a.ch === b.ch;

  function begin() {
    if (!Recognition || rec) return;
    rec = new Recognition();
    rec.lang = 'en-GB';
    rec.continuous = true;
    // letters as they are said, not after a pause. The Spelling Bee turns this off: a letter
    // there can never be taken back, so only the recogniser's final word may put one in.
    rec.interimResults = interim;
    rec.maxAlternatives = 1;
    applied = []; seen = [];
    rec.onresult = (e) => {
      for (let k = e.resultIndex; k < e.results.length; k++) {
        const final = e.results[k].isFinal;
        const text = e.results[k][0].transcript;
        const items = parseSpoken(text);
        const letters = items.filter((it) => it.ch);
        seen[k] = letters;
        if (!quiet()) { applied[k] = letters; continue; }   // the boy is talking: his voice, not theirs
        const had = applied[k] || [];
        const ops = [];
        if (items.some((it) => !it.ch)) {
          // a command in it: wait for the final word, then replay this phrase whole, in order
          if (!final) continue;
          for (let n = 0; n < had.length; n++) ops.push({ back: true });
          ops.push(...items);
        } else {
          let keep = 0;
          while (keep < had.length && keep < letters.length && same(had[keep], letters[keep])) keep++;
          for (let n = keep; n < had.length; n++) ops.push({ back: true });
          ops.push(...letters.slice(keep));
        }
        applied[k] = letters;
        if (ops.length || (final && !letters.length && text.trim())) onHeard(ops, text);   // a word said whole: say so
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
  /** A new word: whatever was heard up to now was for the last one. */
  function reset() { applied = seen.map((x) => (x ? [...x] : x)); }
  return { start, stop, reset, get on() { return on; } };
}
