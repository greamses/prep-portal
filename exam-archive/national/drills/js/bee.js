/* ═══════════════════════════════════════════════════════
   DRILLS — the Spelling Bee, as it is held in a hall.

   The spellers sit in chairs on a stage, numbered tags on, in front of a full
   hall. The judges sit at a table at the side. One at a time a speller walks
   to the microphone; the head judge says "Your word is ..." and the word; the
   speller spells it once, letter by letter (each letter is said out loud as
   it is typed: there are no backspaces, as on a real stage), and says "done".
   The judge says "Correct" and they go back to their chair, or "Incorrect",
   and they walk off the stage in tears. The last one standing at the end of
   a round is the champion (js/bee-logic.js holds the rules).

   Two voices. The JUDGE is the recorded Kokoro voice (the word lists' own
   clips, and data/spelling/phrases.js for "Your word is" / "Correct" /
   "Incorrect"). The SPELLERS speak with the browser's own speech (the Web
   Speech API), a higher voice for each child, so the letters are heard as the
   speller says them.

   Who sits where, each turn's word and every bot's spelling come from the
   room's seed, so they are the same on every device with nothing sent. Only a
   REAL player's turn travels, through the live room (utils/live, ns "bee"):
     state  r<k> = { u, ok, t }     turn k's result, written by its speller
     shout  spell  { k, v }         the letters so far, so the hall sees and hears them
     shout  ask    { k, kind }      "may I have the definition?": all hear it
   A device that falls behind catches up by itself: a turn whose result has
   already arrived is played through quickly.

   If a real speller's device goes away mid-turn, the turn must still end. One
   device (the lowest uid still here) writes it as a miss after the clock.
═══════════════════════════════════════════════════════ */
import { spellingQuestion, sayWord, hush, canSpeak, clipFor, preloadClip, isTalking, sanitizeSpelling, spelledRight } from './spelling.js';
import { canListen, createSpellMic } from './spell-mic.js';
import { seatSpellers, createBee, botSpelling } from './bee-logic.js';
import { questionAt } from './rng.js';
import { answerIsRight, sanitizeFor, texFor, drawMath, toTex } from './game.js';
import { answerText, isEasy, working, slip, setupLines } from './bee-maths.js';
import { geoFigure } from './geo-figure.js';
import { sorobanSum, sorobanSvg, answerSeconds as sorAnswerSeconds, termsOf } from './soroban.js';
import { loadMath } from '/utils/components/workbook/mathify.js';
import { sayMaths } from '/utils/speech-maths.js';
import { SPELLING_PHRASES, PHRASE } from '/data/spelling/phrases.js';
import { LETTER } from '/data/spelling/letters.js';
import { SPELLER_VOICES, LETTER_VOICES, KID_LETTER_SET, JUDGE_KOKORO, KOKORO_NAMES } from '/data/spelling/speller-voices.js';

/* The letters' ElevenLabs recordings (scripts/make-bee-letters.mjs) are on the site itself,
   once they have been made. One look at the first file of each says whether they are there,
   so a missing set costs one request, not one per letter. */
const lettersReady = {};
for (const who of new Set([...Object.keys(LETTER_VOICES), ...Object.values(KID_LETTER_SET)])) {
  lettersReady[who] = fetch(`/media/spelling-letters/${who}/0001.mp3`, { method: 'HEAD' })
    .then((r) => r.ok && /audio/.test(r.headers.get('content-type') || '')).catch(() => false);
}
// a namespace import: an audio.js written before the spellers were recorded has no SPELLER_CLIPS
import * as AUDIO from '/data/spelling/audio.js';
import { openRoom, idFor } from '/utils/live/index.js';
import { auth, db } from '/firebase-init.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ADMIN_EMAIL } from '/utils/features.js';
import { UI } from '/utils/components/ui-icons.js';
import { hideTip } from '/utils/components/tooltip.js';
import { enhanceSelect } from '/utils/components/pp-select.js';
import { heroPaint } from '/utils/components/nav-icons.js';
// the PrepBot tutor's TV curtain: white satin drapes that gather to the sides as it opens
import { makeCurtain } from '/prep-math/mental-math/shared/tv-curtain.js';

/* The spellers, and where things are on each drawing, in % of the picture:
     hip    where the legs start (the rig splits there; sitting hides hip to knee)
     knee   where a seated child's shins start
     hands  the bottom of the hanging hands (the body is cut just under them)
     tall   how tall the child is beside the others (the hoodie boy is older and taller);
            every size the child takes (chair, microphone, walking off) is times this
     eyes / mouth  for the tears and the frown of a speller who has lost
                   (mouth = [centre x, centre y, width, height])
   The first girl has both hands down (girl-hands-down.svg, made by
   tools/character-trace/hands-down.mjs); boy-hoodie and girl-overalls came as pictures. */
export const KIDS = {
  // the boy in the blue T-shirt with his mouth closed (boy-closed.svg; boy.svg, grinning, stays for the films)
  // sitY: how far he sits up when seated (% of his height): his shins are shorter than the chair
  // is high, so on the seat his feet hang clear of the floor
  boy: { src: '/media/characters/boy-closed.svg', girl: false, tall: 0.78, hip: 63.5, knee: 81, hands: 72, sitY: -14,
    eyes: [[39.4, 23.1], [68, 23.1]], mouth: [55, 29.2, 15, 2.2], skin: '#f6c09c', lip: '#8a3b2b' },
  girl: { src: '/media/characters/girl-hands-down.svg', girl: true, tall: 0.86, hip: 64, knee: 80, hands: 73,
    eyes: [[39, 19.6], [60.5, 19.6]], mouth: [49.6, 24, 15, 2.8], skin: '#f3c3a9', lip: '#a4523f' },
  boy2: { src: '/media/characters/boy-hoodie.svg', girl: false, tall: 1.16, hip: 54, knee: 77, hands: 65,
    eyes: [[40, 12.2], [59, 12.2]], mouth: [49, 16.3, 15, 2.2], skin: '#f0b089', lip: '#8a3b2b' },
  girl2: { src: '/media/characters/girl-overalls.svg', girl: true, tall: 0.98, hip: 59, knee: 78, hands: 68,
    eyes: [[38, 16.4], [62, 16.4]], mouth: [50, 21, 17, 2.6], skin: '#8a4733', lip: '#3e1a12' },
  girl3: { src: '/media/characters/girl-curly.svg', girl: true, tall: 1.12, hip: 58, knee: 76, hands: 66,
    eyes: [[40, 17.9], [61, 17.9]], mouth: [50, 22, 14, 2.2], skin: '#7d4a2e', lip: '#3e1a12' },
  boy3: { src: '/media/characters/boy-curly.svg', girl: false, tall: 0.84, hip: 63, knee: 78, hands: 68,
    eyes: [[38, 20.6], [61, 20.6]], mouth: [50, 25.4, 15, 2.2], skin: '#b8673f', lip: '#5e2a1c' },
};
/* The hall's reactions (clapping for a right word, tears for a wrong one) are switched off
   until the user's clapping and crying pictures arrive (2026-11-15). The code stays. */
const REACTIONS = false;
/* The spellers speak with the browser's own voice (the Web Speech API): the user's choice,
   2026-11-15, after hearing the recordings. Their recordings stay made and listed (ElevenLabs
   letters in media/spelling-letters, Kokoro words and letters on the spelling-audio branch);
   true plays them again. The judge is always the recorded voice. */
const SPELLER_RECORDINGS = true;     // 2026-11-15: back to Kokoro, read from each letter's and word's transcription
// The spellers' voice, picked from the speaker's list in the hall's top bar (the user: "add voice
// switch button and make sure the letters join in the switch"; then "show a dropdown list of the
// sounds including 11labs"). The letters always follow the choice:
//   browser — letters and word in the browser's voice
//   kokoro  — letters and word from the Kokoro recordings
//   eleven  — letters from the ElevenLabs recordings (media/spelling-letters); ElevenLabs never
//             recorded the words, so the word is the Kokoro recording
// Remembered on this device.
const VOICE_KEY = 'ppBeeSpellerVoice';
const SPELLER_VOICE_CHOICES = [
  { key: 'browser', label: 'Browser voice' },
  { key: 'kokoro', label: 'Kokoro (recorded)' },
  { key: 'eleven', label: 'ElevenLabs letters' },
];
let spellerVoice = (() => { try { const v = localStorage.getItem(VOICE_KEY); return SPELLER_VOICE_CHOICES.some((c) => c.key === v) ? v : 'browser'; } catch { return 'browser'; } })();
// choose the spellers' voice from anywhere (the speaker's list, the ABC chart): every list showing it follows
function setSpellerVoice(v) {
  spellerVoice = v;
  try { localStorage.setItem(VOICE_KEY, v); } catch { /* not kept */ }
  document.dispatchEvent(new CustomEvent('bee-voice', { detail: v }));
}
// how a speller says each letter: a little slower than speech, and a pause after it
const LETTER_RATE = 0.7;
const LETTER_PAUSE_MS = 500;
/* The spellers a player may choose to be (the setup's "Choose your speller"). */
const KID_NAMES = { boy: 'Boy, blue T-shirt', girl: 'Girl, pigtails', boy2: 'Boy, hoodie', girl2: 'Girl, pink and yellow', girl3: 'Girl, curly hair', boy3: 'Boy, curly hair' };
// each speller's own name: the same child is always called the same (on the selection card, the
// waiting room's stickers, their placard, the announcements and the results)
export const SPELLER_NAMES = { boy: 'Leo', girl: 'Mia', boy2: 'Sam', girl2: 'Amara', girl3: 'Zainab', boy3: 'Tunde' };
/* A speller's face as an avatar: the drawing as the background of a square (round) box, sized
   and placed so the face (between the eyes, a little below them) fills it. Works at any box size.
   The drawings' widths over heights (their viewBoxes). */
const ASPECT = { boy: 570 / 1535, girl: 1835 / 4316, boy2: 636 / 2076, girl2: 664 / 1902, girl3: 600 / 2115, boy3: 836 / 2247 };
export function faceStyle(key) {
  const f = KIDS[key];
  if (!f) return '';
  const [[x1, y], [x2]] = f.eyes;
  const F = Math.min(0.92, ((x2 - x1) / 100) * 3.1);          // the share of the drawing's width shown
  const cx = (x1 + x2) / 200, cy = y / 100 + ((f.mouth[1] - y) / 100) * 0.15;
  const r = 1 / (F * ASPECT[key]);                             // the drawing's height over the box's
  const px = ((0.5 - cx / F) / (1 - 1 / F)) * 100, py = ((0.5 - cy * r) / (1 - r)) * 100;
  return `background-image:url('${f.src}');background-size:${(100 / F).toFixed(1)}% auto;background-position:${px.toFixed(1)}% ${py.toFixed(1)}%;background-repeat:no-repeat`;
}
export const BEE_SPELLERS = Object.keys(KID_NAMES).map((key) => ({ key, name: KID_NAMES[key], call: SPELLER_NAMES[key], src: KIDS[key].src, face: faceStyle(key) }));
export { spellerPool } from './bee-logic.js';
export const BEE_SIZE = 5;            // a bee is for five spellers (the user, 2026-11-15)
/* How many syllables are said: a letter's name ("W" is "double-you", three), or a word's vowel
   groups (a silent final e, as in "make", not counted; "-le" as in "table" is). At least one. */
const LETTER_SYLLABLES = { w: 3, space: 1, hyphen: 2, apostrophe: 4 };
export function syllablesOf(text) {
  const words = String(text || '').toLowerCase().match(/[a-z]+/g) || [];
  let n = 0;
  for (const w of words) {
    if (w.length === 1) { n += LETTER_SYLLABLES[w] || 1; continue; }
    if (LETTER_SYLLABLES[w]) { n += LETTER_SYLLABLES[w]; continue; }
    let c = (w.match(/[aeiouy]+/g) || []).length;
    if (/[^aeiouy]e$/.test(w) && !/[^aeiouy]le$/.test(w) && c > 1) c--;
    if (/(ed)$/.test(w) && !/[td]ed$/.test(w) && c > 1) c--;
    n += Math.max(1, c);
  }
  return Math.max(1, n);
}
/* A child's mouth, open by `o` (0 shut .. 1 as open as a speaking child opens it). The upper
   edge follows the drawn smile (a curve through the corners, dipping in the middle); the lower
   lip comes down from it, deepest in the middle, so a dark opening appears along the smile and
   closes back onto it. In % of the drawing (the mouth's SVG has no aspect of its own). */
export function mouthPath(f, o) {
  const [cx, cy, w, h] = f.mouth;
  const half = w * 0.28, x1 = cx - half, x2 = cx + half;
  const top = cy - h * 0.1, dip = h * 0.22;           // the smile: its corners and how far it dips
  const open = h * 0.75 * o;                          // how far the lower lip comes down
  // the upper lip's edge: a gentle curve along the smile; the lower lip's: a rounded U under it
  const inner = `M${x1} ${top} C${cx - half * 0.5} ${top + dip * 1.3} ${cx + half * 0.5} ${top + dip * 1.3} ${x2} ${top}` +
    ` C${x2 - half * 0.15} ${top + dip + open * 1.25} ${x1 + half * 0.15} ${top + dip + open * 1.25} ${x1} ${top} Z`;
  // a hint of the lower lip just under the opening
  const low = `M${x1 + half * 0.35} ${top + dip + open + h * 0.28} Q${cx} ${top + dip + open + h * 0.42} ${x2 - half * 0.35} ${top + dip + open + h * 0.28}`;
  return { inner, low };
}
/* A judge's mouth: the same lips as a speller's (mouthPath), drawn in the judges' picture at
   data-mouth = "cx,cy,width,height" (its own units), open by o (0 shut .. 1). */
export function drawJudgeLips(g, o) {
  if (!g) return;
  const [cx, cy, w, h] = g.dataset.mouth.split(',').map(Number);
  const { inner, low } = mouthPath({ mouth: [cx, cy, w, h] }, Math.max(0, Math.min(1, o)));
  g.querySelector('.bee-lips-in').setAttribute('d', o > 0.03 ? inner : '');
  g.querySelector('.bee-lips-low').setAttribute('d', o > 0.03 ? low : '');
}
/* The head judge speaks through the shared speech code, which opens a `.mouth` group by scaling
   it (boy.js setMouth). Hers is empty: how far it is scaled is read and drawn as lips. */
function followJudgeMouth(judges) {
  const g = judges.querySelector('.mouth'), lips = judges.querySelector('.bee-jw-lips');
  if (!g || !lips) return;
  new MutationObserver(() => {
    const m = /scale\(\s*[\d.]+\s+([\d.]+)\s*\)/.exec(g.getAttribute('transform') || '');
    const sy = m ? Number(m[1]) : 0.12;
    drawJudgeLips(lips, (sy - 0.14) / 0.9);
  }).observe(g, { attributes: true, attributeFilter: ['transform'] });
}
export function setMouth(el, o) {
  const svg = el.querySelector('.bee-kid-mouth');
  const f = KIDS[el.dataset.kid];
  if (!svg || !f) return;
  const { inner, low } = mouthPath(f, o);
  svg.querySelector('.bee-lips-in').setAttribute('d', o > 0.02 ? inner : '');
  svg.querySelector('.bee-lips-low').setAttribute('d', o > 0.02 ? low : '');
}
const MIC_KEY = 'ppSpellMic';          // the same choice as the drill's mic
const GRACE = 12;                      // seconds past the clock before a silent turn is called a miss

/* ── Fullscreen: the bee is held on the whole screen. Asked for from the Start button's
   own click (main.js), because a browser only allows it from a tap or a key. ── */
let wentFull = false;
export function beeFullscreen() {
  try {
    if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    const p = document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    wentFull = true;
    p?.then(() => { try { screen.orientation?.lock?.('landscape')?.catch?.(() => {}); } catch { /* not a phone */ } }).catch(() => { wentFull = false; });
  } catch { /* not allowed here */ }
}
function leaveFullscreen() {
  try { if (wentFull && document.fullscreenElement) document.exitFullscreen(); } catch { /* already out */ }
  wentFull = false;
}

/* ── Two small sounds: the judge's bell (wrong) and a rising chime (right) ── */
let actx = null;
function tone(freqs, { gap = 0.12, len = 0.5, type = 'sine', vol = 0.16 } = {}) {
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state !== 'running') actx.resume();
    freqs.forEach((f, n) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f;
      const at = actx.currentTime + n * gap;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(vol, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, at + len);
      o.connect(g).connect(actx.destination);
      o.start(at); o.stop(at + len + 0.05);
    });
  } catch { /* no sound here */ }
}
const chime = () => tone([660, 880, 1320], { len: 0.45 });
/* The hall's sound effects, made here (no files): noise shaped by filters, and tones. */
function noise(seconds, { type = 'bandpass', freq = 1200, to = null, q = 0.8, vol = 0.3, attack = 0.02, at = 0 } = {}) {
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state !== 'running') actx.resume();
    const n = Math.floor(actx.sampleRate * seconds), buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = actx.createBufferSource(); src.buffer = buf;
    const f = actx.createBiquadFilter(); f.type = type; f.Q.value = q;
    const t0 = actx.currentTime + at;
    f.frequency.setValueAtTime(freq, t0);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + seconds);
    const g = actx.createGain();
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    src.connect(f).connect(g).connect(actx.destination);
    src.start(t0); src.stop(t0 + seconds + 0.05);
  } catch { /* no sound here */ }
}
const sfx = {
  swish: () => { noise(1.4, { freq: 300, to: 2400, q: 0.7, vol: 0.25, attack: 0.5 }); noise(1.2, { freq: 2600, to: 500, q: 0.6, vol: 0.12, attack: 0.4, at: 0.25 }); },
  static: (s = 1.2) => noise(s, { type: 'highpass', freq: 2500, q: 0.2, vol: 0.12, attack: 0.03 }),
  clunk: () => { tone([70], { len: 0.35, type: 'sine', vol: 0.35 }); noise(0.08, { freq: 3000, q: 1, vol: 0.25, attack: 0.002 }); },
  tick: () => noise(0.03, { type: 'highpass', freq: 4000, q: 1, vol: 0.35, attack: 0.001 }),
  buzz: () => tone([110, 104], { gap: 0, len: 0.6, type: 'sawtooth', vol: 0.07 }),
  pop: () => { noise(0.12, { freq: 1800, q: 0.5, vol: 0.5, attack: 0.002 }); noise(0.9, { type: 'highpass', freq: 5000, q: 0.3, vol: 0.06, attack: 0.05, at: 0.05 }); },
  drumroll: (s = 2.4) => {
    for (let t = 0; t < s; t += 0.045) noise(0.05, { freq: 1600, q: 0.6, vol: 0.08 + 0.18 * (t / s), attack: 0.002, at: t });
    noise(1.6, { type: 'highpass', freq: 3500, q: 0.4, vol: 0.22, attack: 0.005, at: s });   // the cymbal
  },
  fanfare: () => { tone([523, 659, 784, 1047], { gap: 0.16, len: 0.5, type: 'sawtooth', vol: 0.05 }); tone([262, 330, 392, 523], { gap: 0.16, len: 0.6, type: 'triangle', vol: 0.08 }); },
};
/* Applause: a crowd of short claps (bursts of noise, each dying away fast), thick at
   first and thinning out, through a band filter so it sounds like hands and not hiss. */
function applause(seconds = 2.4, crowd = 40) {
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state !== 'running') actx.resume();
    const rate = actx.sampleRate, n = Math.floor(rate * seconds);
    const buf = actx.createBuffer(1, n, rate), d = buf.getChannelData(0);
    const claps = Math.floor(seconds * crowd);
    for (let c = 0; c < claps; c++) {
      const start = Math.floor(seconds * Math.pow(Math.random(), 1.5) * 0.92 * rate);
      const len = Math.floor(rate * (0.008 + Math.random() * 0.018));
      const amp = 0.2 + Math.random() * 0.35;
      for (let i = 0; i < len && start + i < n; i++) d[start + i] += (Math.random() * 2 - 1) * amp * Math.exp(-i / (len * 0.22));
    }
    for (let i = Math.floor(n * 0.65); i < n; i++) d[i] *= (n - i) / (n * 0.35);
    const src = actx.createBufferSource();
    src.buffer = buf;
    const band = actx.createBiquadFilter();
    band.type = 'bandpass'; band.frequency.value = 1400; band.Q.value = 0.55;
    const gain = actx.createGain();
    gain.gain.value = 0.55;
    src.connect(band).connect(gain).connect(actx.destination);
    src.start();
  } catch { /* no sound here */ }
}
const bell = () => tone([1568, 1568], { gap: 0.02, len: 1.4, type: 'triangle', vol: 0.2 });

/* ── The spellers' voices: the browser's own speech (Web Speech API) ───────
   A child's voice is the browser's English voice, pitched up: a girl's
   higher than a boy's, and a girl's voice for a girl where one is offered. */
const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
/* The browser's voices: every speller sounds like themselves. Each child takes a different
   voice of their own sex where the device has several (girls in turn through the women's voices,
   boys through the men's), and each has their own pitch and pace, so even a device with one or two
   voices makes six different children. Leo and Mia are the youngest (highest); Sam and Zainab the
   oldest. */
const BROWSER_VOICE = {
  // the boys all speak in Sam's voice (the user: "Use sams voice for all the boys. Just tweak the
  // pitches for younger boys"): the same voice, higher for the younger two
  boy: { pick: 2, pitch: 1.45, rate: 0.88 },   // Leo, the youngest
  boy3: { pick: 2, pitch: 1.25, rate: 0.86 },  // Tunde
  boy2: { pick: 2, pitch: 1.05, rate: 0.84 },  // Sam
  // and the girls all in Zainab's voice ("Use zainab's voice for all the girls with different
  // pitches too"): higher for the younger two
  girl: { pick: 2, pitch: 1.6, rate: 0.88 },   // Mia, the youngest
  girl2: { pick: 2, pitch: 1.42, rate: 0.86 }, // Amara
  girl3: { pick: 2, pitch: 1.25, rate: 0.85 }, // Zainab
};
const FEMALE = /\b(female|woman|zira|hazel|susan|libby|sonia|aria|jenny|samantha|karen|moira|serena|emma|ava|allison|kate|fiona|tessa|victoria|natasha|clara|michelle|amy|joanna|salli|kimberly|ivy|mia|olivia|maisie|ana)\b/i;
const MALE = /\b(male|man|david|george|ryan|guy|daniel|alex|arthur|thomas|oliver|mark|james|fred|tom|aaron|eric|christopher|roger|brian|matthew|joey|justin|william|liam|steffan)\b/i;
const voiceFor = (() => {
  const cache = {};
  return (kid) => {
    if (cache[kid] !== undefined) return cache[kid];
    let all = [];
    try { all = synth ? synth.getVoices().filter((v) => /^en[-_]?/i.test(v.lang)) : []; } catch { /* none */ }
    if (!all.length) return null;          // not loaded yet: ask again next time
    const girl = !!KIDS[kid]?.girl;
    const mine = all.filter((v) => (girl ? FEMALE.test(v.name) : MALE.test(v.name) && !/female/i.test(v.name)));
    const pool = mine.length ? mine : all;
    cache[kid] = pool[(BROWSER_VOICE[kid]?.pick || 0) % pool.length];
    return cache[kid];
  };
})();
/* Each letter by its NAME, written as it sounds: a lone "A." is read as the word "a"
   (cut short), and "I." and "O." as words too. */
/* What the browser's voice is given for a letter. A capital letter on its own is read as its
   name ("F" is "eff"), but written-out names are read as words or spelled ("eff" came out
   E-F-F, "ar" as "er"). Only A is read as a word (the article "a"), so it alone is written
   out. */
const LETTER_WORD = { a: 'Ay.', ' ': 'space', '-': 'hyphen', "'": 'apostrophe' };
const DEFAULT_LETTER = (ch) => LETTER_WORD[ch.toLowerCase()] || ch.toUpperCase();
/* a better spelling for a letter, set in the hall's settings (the ABC chart) and saved for everyone */
// what each voice is given for a letter, set on the ABC chart: the girl's and the boy's apart
const LETTER_SAID = { girl: {}, boy: {} };
const genderOf = (k) => (k === 'girl' || k === 'boy' ? k : KIDS[k]?.girl ? 'girl' : 'boy');
/** The saved letters as { girl, boy }: an older save (one list for both) goes to both. */
function normLetters(v = {}) {
  if (v && (typeof v.girl === 'object' || typeof v.boy === 'object')) return { girl: { ...(v.girl || {}) }, boy: { ...(v.boy || {}) } };
  const flat = Object.fromEntries(Object.entries(v || {}).filter(([, t]) => typeof t === 'string'));
  return { girl: { ...flat }, boy: { ...flat } };
}
function setLetterSaid(v) {
  const n = normLetters(v);
  for (const g of ['girl', 'boy']) { for (const k of Object.keys(LETTER_SAID[g])) delete LETTER_SAID[g][k]; Object.assign(LETTER_SAID[g], n[g]); }
}
/* A letter's spelling on the ABC chart may be IPA between slashes ("/eɪ/"). Only ElevenLabs can
   say IPA (an SSML phoneme tag, read by its English Flash model); the browser's voice says the
   letter as usual. */
const isIpa = (t) => /^\/[^/]+\/$/.test(String(t || '').trim());
const ipaOf = (t) => String(t).trim().slice(1, -1).replace(/["<>&]/g, '');
const letterName = (ch, who = 'girl') => {
  const own = LETTER_SAID[genderOf(who)][ch.toLowerCase()];
  return own && !isIpa(own) ? own : DEFAULT_LETTER(ch);
};
/* ElevenLabs, live: a letter whose spelling was changed on the ABC chart is said by ElevenLabs
   from THAT text (the server's /api/tts/elevenlabs, which keeps each line it has made), since the
   recorded letters cannot change (the user: "They dont seem to respond to my new inputs"). A
   refused or failed request leaves the recording. */
const elevenDone = new Map(), elevenAsked = new Map();
const withStop = (t) => { t = String(t || '').trim(); return /[.!?]$/.test(t) ? t : `${t}.`; };
// what ElevenLabs is given for a letter: its IPA as a phoneme tag, or the spelling as a sentence
const elevenText = (ch, t) => (isIpa(t)
  ? `<phoneme alphabet="ipa" ph="${ipaOf(t)}">${ch === ' ' ? 'space' : ch.toUpperCase()}</phoneme>.`
  : withStop(t));
/* The ABC chart's saved letters, recorded in each voice when the admin saves (one Firestore doc
   per voice set: beeLetterClips/<set> = { clips: { <letter>: { text, data } } }), so every player
   hears them, not only one who may use ElevenLabs live. */
const SAVED_CLIPS = {};
const setsOfGender = (g) => [...new Set(Object.keys(KIDS).filter((k) => genderOf(k) === g).map((k) => KID_LETTER_SET[k] || g))];
const savedClipsReady = Promise.all(Object.keys(LETTER_VOICES).map((set) => getDoc(doc(db, 'beeLetterClips', set))
  .then((d) => { SAVED_CLIPS[set] = (d.exists() && d.data().clips) || {}; }).catch(() => { SAVED_CLIPS[set] = {}; })));
const toDataUrl = async (url) => {
  if (url.startsWith('data:')) return url;
  const blob = await (await fetch(url)).blob();
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
};
/* A real player's name, said by the judge in Kokoro (the server's free Hugging Face Kokoro), made
   once as they enter the bee; never ElevenLabs (the user: "Dont use elevenlabs to call out the
   player's name so we dont burn tokens"). Resolves to an audio URL, or null (no access, no answer). */
const nameMemo = new Map();
function kokoroSays(text, voice = 'hf:bm_george') {
  const key = `${voice}|${text}`;
  if (nameMemo.has(key)) return nameMemo.get(key);
  const ask = (async () => {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      const res = await fetch('/api/tts/kokoro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ text, voice }),
      });
      if (!res.ok) return null;
      const d = await res.json();
      return d.url || (d.audioContent ? `data:audio/${d.audioEncoding === 'WAV' ? 'wav' : 'mp3'};base64,${d.audioContent}` : null);
    } catch { return null; }
  })();
  nameMemo.set(key, ask);
  return ask;
}
function elevenUrl(text, who) {
  const key = `${who}|${text}`;
  if (elevenAsked.has(key)) return elevenAsked.get(key);
  const ask = (async () => {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      const token = await user.getIdToken();
      const res = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text, voiceId: LETTER_VOICES[who].id, from: 'letter' }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const url = data.url || (data.audioContent ? `data:audio/mp3;base64,${data.audioContent}` : null);
      if (url) elevenDone.set(key, url);
      return url;
    } catch { return null; }
  })();
  elevenAsked.set(key, ask);
  ask.then((u) => { if (!u) elevenAsked.delete(key); });   // a failure may be tried again later
  return ask;
}

/* Where the chairs are, in % of the hall: on the stage, a back row and a front row. The
   back row sits half a chair across, so its spellers show between the front row's. */
function seatSpot(count, seat, cup = false) {
  const back = count > 5 ? Math.ceil(count / 2) : 0;
  const inBack = seat < back;
  const n = inBack ? back : count - back;
  const j = inBack ? seat : seat - back;
  const step = Math.min(10.5, n > 1 ? (cup ? 24 : 40) / (n - 1) : 0);   // a tournament: two pulpits, the chairs further right
  return { x: (inBack ? 64 : 68) + (cup ? 9 : 0) + (j - (n - 1) / 2) * step, y: inBack ? 57.5 : 65.5, row: inBack ? 'back' : 'front' };
}
const CHAIR = '<svg viewBox="0 0 100 125" preserveAspectRatio="none"><rect x="12" y="0" width="76" height="64" fill="#3f6fae"/><rect x="18" y="6" width="64" height="40" fill="#5a8bc8"/><rect x="4" y="60" width="92" height="16" fill="#335c94"/><rect x="8" y="76" width="8" height="49" fill="#59606b"/><rect x="84" y="76" width="8" height="49" fill="#59606b"/><rect x="26" y="76" width="6" height="40" fill="#474d57"/><rect x="68" y="76" width="6" height="40" fill="#474d57"/></svg>';

/* The hall behind everyone: wall, curtains, the stage and the floor (a drawing: its
   colours are its own, in both themes, as the children's are). 1600 x 900. */
function hallSvg() {
  const folds = (x0, w) => Array.from({ length: 7 }, (_, i) => `<rect x="${x0 + i * (w / 7)}" y="0" width="${w / 14}" height="610" fill="#6e1f2a" opacity=".55"/>`).join('');
  const scallops = Array.from({ length: 21 }, (_, i) => `<circle cx="${i * 80 + 40}" cy="64" r="40" fill="#8f2a36"/>`).join('');
  const planks = [500, 532, 566].map((y) => `<line x1="0" y1="${y}" x2="1600" y2="${y}" stroke="#a8713f" stroke-width="3"/>`).join('');
  const boards = Array.from({ length: 16 }, (_, i) => `<line x1="${i * 100 + 50}" y1="470" x2="${i * 106 + 45}" y2="600" stroke="#ad7745" stroke-width="2"/>`).join('');
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
    <rect width="1600" height="900" fill="#efe4d2"/>
    <rect width="1600" height="470" fill="#e6d6ba"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${170 + i * 145}" y="120" width="110" height="300" fill="#e0ceaf"/>`).join('')}
    <rect x="0" y="440" width="1600" height="30" fill="#d5bf98"/>
    <polygon points="40,470 1560,470 1600,600 0,600" fill="#c68b52"/>${planks}${boards}
    <rect x="0" y="600" width="1600" height="14" fill="#a86f40"/>
    <rect x="0" y="614" width="1600" height="40" fill="#7e5130"/>
    <rect x="0" y="654" width="1600" height="246" fill="#d8c19b"/>
    <rect x="0" y="0" width="150" height="610" fill="#962d3a"/>${folds(0, 150)}
    <rect x="1450" y="0" width="150" height="610" fill="#962d3a"/>${folds(1450, 150)}
    <rect x="0" y="0" width="1600" height="64" fill="#8f2a36"/>${scallops}
    <rect x="0" y="0" width="1600" height="16" fill="#6e1f2a"/>
  </svg>`;
}

/* The audience: two rows of eight, seen from behind (media/characters/audience-back-*.svg),
   nearer the camera than the stage, so bigger than the spellers, and the front row bigger
   than the back. Each person is cut off at the bottom of their chair back; every other one is
   mirrored. Their raised arms, for the clapping, are drawn over them. 1600 x 288 (the bottom
   32% of the hall, which starts below the stage's front edge). */
const AUDIENCE = [
  { src: '/media/characters/audience-back-1.svg', aspect: 623 / 1983 },   // a man, denim jacket
  { src: '/media/characters/audience-back-2.svg', aspect: 514 / 1854 },   // a woman, dark bob, blazer
  { src: '/media/characters/audience-back-3.svg', aspect: 586 / 2078 },   // a woman, long hair, green jumper
];
function audienceSvg(seed) {
  let s = (seed >>> 0) || 1;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  // head top, person width, the eight seats' centres, chair back size
  const rows = [
    { top: 22, pw: 160, xs: Array.from({ length: 8 }, (_, i) => 100 + i * 200), cw: 170, ch: 120 },
    { top: 96, pw: 205, xs: Array.from({ length: 8 }, (_, i) => 10 + i * 226), cw: 214, ch: 150 },
  ];
  let defs = '', out = '';
  rows.forEach((row, r) => {
    const H = row.pw / AUDIENCE[0].aspect;          // the man's height sets the row's chair line
    const chairTop = row.top + 0.24 * H;
    defs += `<clipPath id="bee-row${r}"><rect x="-200" y="-300" width="2000" height="${chairTop + row.ch + 300}"/></clipPath>`;
    row.xs.forEach((cx, n) => {
      // the three people take turns, so no two neighbours are the same; each is drawn at the
      // same height (H), so their own proportions set their width
      const who = AUDIENCE[(n + r * 2 + (seed % 3)) % AUDIENCE.length];
      const top = row.top, pw = H * who.aspect;
      const flip = (n + r) % 2 ? ` transform="translate(${2 * cx} 0) scale(-1 1)"` : '';
      const tone = (0.9 + rnd() * 0.16).toFixed(2);
      const person = `<image href="${who.src}" x="${cx - pw / 2}" y="${top}" width="${pw}" height="${H}" style="filter:brightness(${tone})"${flip}/>`;
      // their arms, up above their heads, clapping (shown only while the hall claps)
      const arm = (side) => {
        const sx = cx + side * pw * 0.3, sy = top + 0.2 * H;             // the shoulder
        const hx = cx + side * pw * 0.12, hy = top - 0.015 * H;          // the hand, over the head
        return `<g class="bee-hand bee-hand--${side < 0 ? 'l' : 'r'}">` +
          `<line x1="${sx}" y1="${sy}" x2="${hx}" y2="${hy + pw * 0.08}" stroke="#1c365f" stroke-width="${pw * 0.15}" stroke-linecap="round"/>` +
          `<ellipse cx="${hx}" cy="${hy}" rx="${pw * 0.085}" ry="${pw * 0.12}" fill="#5a3622"/></g>`;
      };
      const hands = `<g class="bee-aud-hands" style="--d:-${(rnd() * 0.3).toFixed(2)}s">${arm(-1)}${arm(1)}</g>`;
      const x = cx - row.cw / 2, k = row.cw / 100;
      const chair = `<rect x="${x}" y="${chairTop}" width="${row.cw}" height="${row.ch}" fill="#2f4c7a"/><rect x="${x + 6 * k}" y="${chairTop + 6 * k}" width="${row.cw - 12 * k}" height="${row.ch * 0.45}" fill="#3c5d92"/>`;
      // ONE item: this person and their chair, moved and sized on their own (the hall editor)
      // the body in its own group, so it can stand up for the champion (bee.css .bee-aud-body)
      out += `<g class="bee-item" data-item="aud-${r}-${n}" data-label="${r ? 'Front' : 'Back'} row, seat ${n + 1}" data-bottom="${chairTop + row.ch}"><g clip-path="url(#bee-row${r})"><g class="bee-aud-body">${person}</g></g>${chair}${hands}</g>`;
    });
  });
  return `<svg viewBox="0 0 1600 288" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs>${defs}</defs>${out}</svg>`;
}

/* The judges' table: the head judge (media/characters/judge-woman.svg) and a judge
   (judge-man.svg), seen from the waist up behind it. Her mouth is a <g class="mouth"> drawn
   over the picture's own, so the talking-mouth code (js/boy.js) opens it as she speaks.
   300 x 220: the table top is at 136, at their waists; its front runs down to the stage. */
function judgesSvg() {
  const W = { x: 53, y: 26, h: 300, aspect: 543 / 1936 }, M = { x: 167, y: 20, h: 305, aspect: 636 / 2033 };
  const ww = W.h * W.aspect, mw = M.h * M.aspect;
  // her mouth: 50.5% across and 14.9% down the picture; his: 50% across, 15.2% down
  const mx = W.x + 0.505 * ww, my = W.y + 0.149 * W.h;
  const jx = M.x + 0.5 * mw, jy = M.y + 0.152 * M.h;
  const hands = (cx, skin, sleeve, d) => {
    const arm = (side) => `<g class="bee-hand bee-hand--${side < 0 ? 'l' : 'r'}">` +
      `<line x1="${cx + side * 32}" y1="142" x2="${cx + side * 13}" y2="124" stroke="${sleeve}" stroke-width="13" stroke-linecap="round"/>` +
      `<ellipse cx="${cx + side * 10}" cy="116" rx="8" ry="11" fill="${skin}" stroke="rgba(0,0,0,.25)" stroke-width="1"/></g>`;
    return `<g class="bee-hands" style="--d:${d}s">${arm(-1)}${arm(1)}</g>`;
  };
  // a judge's chair: a tall padded back, standing up behind the shoulders
  const chair = (cx, top, w) => `<rect x="${cx - w / 2}" y="${top}" width="${w}" height="${148 - top}" fill="#3b2a22"/>` +
    `<rect x="${cx - w / 2 + 6}" y="${top + 6}" width="${w - 12}" height="${148 - top - 6}" fill="#5a4033"/>`;
  // a folded tent card standing on the table: its face, a darker back fold showing at the top,
  // a shadow on the wood
  const card = (cx, title, role) => `<ellipse cx="${cx}" cy="136.5" rx="27" ry="1.6" fill="rgba(0,0,0,.28)"/>` +
    `<polygon points="${cx - 25},121 ${cx + 25},121 ${cx + 27},136 ${cx - 27},136" fill="#fdfbf5"/>` +
    `<polygon points="${cx - 25},121 ${cx + 25},121 ${cx + 24},119.4 ${cx - 24},119.4" fill="#d8d2c4"/>` +
    `<rect x="${cx - 27}" y="134.6" width="54" height="1.4" fill="#e6dfd0"/>` +
    `<line x1="${cx - 20}" y1="124" x2="${cx + 20}" y2="124" stroke="#c9a33a" stroke-width=".8"/>` +
    `<text x="${cx}" y="129.6" text-anchor="middle" style="font-family: var(--font-display)" font-size="5.6" font-weight="700" fill="#1d2433">${title}</text>` +
    `<text x="${cx}" y="134" text-anchor="middle" style="font-family: var(--font-mono)" font-size="3.4" font-weight="700" letter-spacing=".5" fill="#6b5a2e">${role}</text>`;
  // a brass desk bell and a glass of water
  const bell = (cx) => `<ellipse cx="${cx}" cy="136.4" rx="8" ry="1.4" fill="rgba(0,0,0,.3)"/><rect x="${cx - 7.5}" y="133.5" width="15" height="2.8" rx="1" fill="#5b3f22"/>` +
    `<path d="M${cx - 6} 133.6 Q${cx - 6} 125.5 ${cx} 125.5 Q${cx + 6} 125.5 ${cx + 6} 133.6 Z" fill="#e2b84a"/><path d="M${cx - 3.5} 131 Q${cx - 3.2} 127 ${cx} 126.6" stroke="#fff3c4" stroke-width="1" fill="none" opacity=".8"/><rect x="${cx - .8}" y="122.6" width="1.6" height="3" fill="#b8902e"/><circle cx="${cx}" cy="122.4" r="1.4" fill="#e2b84a"/>`;
  // a desk microphone: a weighted base, a gooseneck curving up to the judge, a mesh head
  const deskMic = (cx, lean) => {
    const hx = cx + lean * 12, hy = 104;                         // where the head is, near the judge's chin
    return `<ellipse cx="${cx}" cy="136.6" rx="11" ry="1.8" fill="rgba(0,0,0,.32)"/>` +
      `<path d="M${cx - 10} 136 Q${cx - 10} 130.5 ${cx - 6} 130.5 H${cx + 6} Q${cx + 10} 130.5 ${cx + 10} 136 Z" fill="#222428"/>` +
      `<rect x="${cx - 8}" y="131.6" width="16" height="1" fill="#5c6168"/><circle cx="${cx + 5}" cy="133.6" r="1.3" fill="#d64541"/><rect x="${cx - 7}" y="132.8" width="5" height="1.6" fill="#3a3d42"/>` +
      `<path d="M${cx} 131 C${cx} 120 ${cx + lean * 3} 112 ${hx} ${hy + 4}" fill="none" stroke="#2d3035" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="M${cx} 131 C${cx} 120 ${cx + lean * 3} 112 ${hx} ${hy + 4}" fill="none" stroke="#8a9199" stroke-width=".8" stroke-dasharray="1.1 .8"/>` +
      `<g transform="rotate(${lean * 30} ${hx} ${hy + 4})"><rect x="${hx - 3.6}" y="${hy - 7}" width="7.2" height="11.5" rx="3.4" fill="url(#bee-desk-mesh)" stroke="#9aa1a9" stroke-width=".6"/>` +
      `<rect x="${hx - 3.8}" y="${hy + 2.2}" width="7.6" height="2" rx=".8" fill="#9aa1a9"/><circle cx="${hx}" cy="${hy - 2.5}" r="3.6" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".5"/></g>`;
  };
  // a tumbler of water: clear tapered glass with a thick base, the water inside with its surface,
  // the table seen through it, and light caught down one side
  const glass = (cx) => `<ellipse cx="${cx}" cy="136.4" rx="5.4" ry="1.1" fill="rgba(0,0,0,.22)"/>` +
    `<path d="M${cx - 4.6} 121 L${cx - 3.7} 135.6 Q${cx} 136.9 ${cx + 3.7} 135.6 L${cx + 4.6} 121 Z" fill="rgba(225,240,250,.22)" stroke="rgba(255,255,255,.75)" stroke-width=".45"/>` +
    `<path d="M${cx - 4.25} 126.2 L${cx - 3.75} 134.2 Q${cx} 135.3 ${cx + 3.75} 134.2 L${cx + 4.25} 126.2 Z" fill="url(#bee-water)"/>` +
    `<ellipse cx="${cx}" cy="126.2" rx="4.25" ry=".8" fill="rgba(235,248,255,.75)" stroke="rgba(255,255,255,.9)" stroke-width=".3"/>` +
    `<path d="M${cx - 3.7} 134.2 Q${cx} 136.6 ${cx + 3.7} 134.2 L${cx + 3.6} 135.6 Q${cx} 136.9 ${cx - 3.6} 135.6 Z" fill="rgba(200,225,240,.7)"/>` +
    `<rect x="${cx - 3.3}" y="128.6" width="6.6" height="1.6" fill="rgba(122,75,39,.35)"/>` +
    `<path d="M${cx - 3.6} 122.2 L${cx - 3.0} 134" stroke="rgba(255,255,255,.85)" stroke-width=".7" stroke-linecap="round"/>` +
    `<path d="M${cx + 3.1} 123 L${cx + 2.8} 130" stroke="rgba(255,255,255,.45)" stroke-width=".4" stroke-linecap="round"/>` +
    `<ellipse cx="${cx}" cy="121" rx="4.6" ry=".85" fill="none" stroke="rgba(255,255,255,.8)" stroke-width=".4"/>`;
  // each judge grows or shrinks from the middle of their place at the table (the sizes panel)
  const sized = (id, label, inner) => `<g class="bee-item" data-item="${id}" data-label="${label}">${inner}</g>`;
  return `<svg viewBox="0 0 300 220" aria-hidden="true">
    ${sized('judge-woman', 'Head judge', `${chair(W.x + ww / 2, W.y + 0.11 * W.h, ww * 1.12)}
    <image href="/media/characters/judge-woman.svg" x="${W.x}" y="${W.y}" width="${ww}" height="${W.h}"/>
    <g class="mouth" data-hinge="${(my - 2.4).toFixed(2)}" data-cx="${mx.toFixed(2)}" transform="scale(1 0.12)"></g>
    <g class="bee-judge-lips bee-jw-lips" data-mouth="${mx.toFixed(2)},${(my - 0.4).toFixed(2)},10.5,3.2"><path class="bee-lips-in" d=""/><path class="bee-lips-low" d=""/></g>
    ${hands(W.x + ww / 2, '#f0c3a3', '#1d2b55', -0.12)}`)}
    ${sized('judge-man', 'Judge', `${chair(M.x + mw / 2, M.y + 0.11 * M.h, mw * 1.12)}
    <image class="bee-jm" href="/media/characters/judge-man.svg" x="${M.x}" y="${M.y}" width="${mw}" height="${M.h}"/>
    <g class="bee-judge-lips bee-jm-lips" data-mouth="${jx.toFixed(2)},${(jy - 0.6).toFixed(2)},11,3"><path class="bee-lips-in" d=""/><path class="bee-lips-low" d=""/></g>
    ${hands(M.x + mw / 2, '#f2b394', '#1c3561', -0.04)}`)}
    <defs>
      <linearGradient id="bee-cloth" x1="0" x2="1" y1="0" y2="0">${Array.from({ length: 13 }, (_, i) => `<stop offset="${(i / 12).toFixed(3)}" stop-color="${i % 2 ? '#1a2d55' : '#25407a'}"/>`).join('')}</linearGradient>
      <linearGradient id="bee-wood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9a6537"/><stop offset=".55" stop-color="#7a4b27"/><stop offset="1" stop-color="#5a3519"/></linearGradient>
      <linearGradient id="bee-water" x1="0" x2="1"><stop offset="0" stop-color="rgba(150,200,230,.55)"/><stop offset=".45" stop-color="rgba(200,230,248,.35)"/><stop offset="1" stop-color="rgba(120,175,215,.6)"/></linearGradient>
      <pattern id="bee-desk-mesh" width="1.2" height="1.2" patternUnits="userSpaceOnUse"><rect width="1.2" height="1.2" fill="#26292d"/><circle cx=".6" cy=".6" r=".36" fill="#6b7077"/></pattern>
      <linearGradient id="bee-gold" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f6dc85"/><stop offset=".5" stop-color="#d4a937"/><stop offset="1" stop-color="#9c7720"/></linearGradient>
    </defs>
    <g class="bee-item" data-item="judge-table" data-label="Judges' table">
    <rect x="2" y="134" width="298" height="10" fill="url(#bee-wood)"/>
    <rect x="2" y="134" width="298" height="1.4" fill="#b98250"/>
    <rect x="2" y="144" width="298" height="2.5" fill="#3e2410"/>
    <path d="M4 146 H298 V212 Q291 216 284 212 Q277 216 270 212 Q263 216 256 212 Q249 216 242 212 Q235 216 228 212 Q221 216 214 212 Q207 216 200 212 Q193 216 186 212 Q179 216 172 212 Q165 216 158 212 Q151 216 144 212 Q137 216 130 212 Q123 216 116 212 Q109 216 102 212 Q95 216 88 212 Q81 216 74 212 Q67 216 60 212 Q53 216 46 212 Q39 216 32 212 Q25 216 18 212 Q11 216 4 212 Z" fill="url(#bee-cloth)"/>
    <rect x="4" y="146" width="294" height="12" fill="#1c3260"/>
    <rect x="4" y="157" width="294" height="3" fill="url(#bee-gold)"/>
    ${Array.from({ length: 49 }, (_, i) => `<rect x="${5 + i * 6}" y="211.5" width="2" height="5.5" fill="#d4a937"/>`).join('')}
    <rect x="102" y="170" width="98" height="28" fill="#13234a" stroke="url(#bee-gold)" stroke-width="1.6"/>
    <text x="151" y="181.5" text-anchor="middle" style="font-family: var(--font-mono)" font-size="5.6" font-weight="700" letter-spacing="1.6" fill="#e9c86a">PREP</text>
    <text x="151" y="192" text-anchor="middle" style="font-family: var(--font-display)" font-size="7.6" font-weight="800" letter-spacing=".4" fill="#f6dc85">SPELLING BEE</text>
    ${glass(W.x + ww / 2 - 33)}${bell(128)}${glass(M.x + mw / 2 + 31)}
    ${deskMic(W.x + ww / 2 + 22, -1)}${deskMic(M.x + mw / 2 - 22, 1)}
    ${card(W.x + ww / 2, 'Mrs. Chen', 'HEAD JUDGE')}${card(M.x + mw / 2, 'Mr. Whitmore', 'JUDGE')}</g>
  </svg>`;
}

/* ── The hall's settings (the admin's panel) ─────────────────────────
   Each person's size, and what the spellers' (browser) voice is given for each letter, are
   kept in ONE Firestore document, beeSettings/hall, that every bee reads when it opens. The
   panel opens from a button in the top bar for the admin (or anyone with ?tune=1, who can
   try things but not save): sliders change the hall at once, the ABC chart says a letter
   in the girl's or the boy's voice and takes a better spelling for it, and "Save for
   everyone" writes the document. */
const TUNE = [
  ['tall-boy', 'Boy, blue T-shirt'], ['tall-girl', 'Girl, pigtails'], ['tall-boy2', 'Boy, hoodie'],
  ['tall-girl2', 'Girl, pink and yellow'], ['tall-girl3', 'Girl, curly hair'],
  ['at-mic', 'Speller at the microphone'], ['mic', 'Microphone stand'],
  ['judges', 'Judges and table'], ['judge-woman', 'Head judge'], ['judge-man', 'Judge'],
  ['aud-row0', 'Audience, back row'], ['aud-row1', 'Audience, front row'],
];
const SETTINGS_DOC = ['beeSettings', 'hall'];
let settings = { sizes: {}, items: {}, letters: {}, voices: {} };   // what was saved (beeSettings/hall)
/* Each speller's recorded voices, as picked in the hall's settings: kokoro[kid] a Kokoro voice
   (their words and Kokoro letters), eleven[kid] an ElevenLabs letter set. Empty: the defaults. */
const VOICE_PICKS = { kokoro: {}, eleven: {} };
/* Volume and pitch for each speller in each voice engine (the hall's settings, "Letters"):
   VOICE_TUNE[engine][kid] = { vol 0..1, pitch 0.7..1.4 (1 as recorded or as the voice is) }. */
const VOICE_TUNE = { browser: {}, kokoro: {}, eleven: {} };
const tuneOf = (engine, kid) => ({ vol: 1, pitch: 1, ...(VOICE_TUNE[engine]?.[kid] || {}) });
const setVoicePicks = (v = {}) => {
  for (const k of ['kokoro', 'eleven']) { for (const x of Object.keys(VOICE_PICKS[k])) delete VOICE_PICKS[k][x]; Object.assign(VOICE_PICKS[k], (v && v[k]) || {}); }
  for (const e of Object.keys(VOICE_TUNE)) { for (const x of Object.keys(VOICE_TUNE[e])) delete VOICE_TUNE[e][x]; Object.assign(VOICE_TUNE[e], (v && v.tune && v.tune[e]) || {}); }
};
const settingsReady = getDoc(doc(db, ...SETTINGS_DOC))
  .then((snap) => {
    const d = snap.exists() ? snap.data() : {};
    settings = { sizes: d.sizes || {}, items: d.items || {}, letters: d.letters || {}, voices: d.voices || {} };
    setVoicePicks(settings.voices);
    setLetterSaid(settings.letters);
  })
  .catch((e) => console.warn('[bee] settings not read; the defaults stand:', e));
const tuneStart = (name) => settings.sizes[name] ?? (name.startsWith('tall-') ? KIDS[name.slice(5)]?.tall ?? 1 : 1);
function applySizes(hall, sizes) {
  for (const [name] of TUNE) {
    const v = sizes[name];
    if (v != null) hall.style.setProperty(`--t-${name}`, v); else hall.style.removeProperty(`--t-${name}`);
  }
}
const isAdminHere = () => (auth.currentUser?.email || '') === ADMIN_EMAIL;

/* ── Moving and resizing (the hall editor) ──────────────────────────────
   Every thing in the hall is an item: an element with data-item. Its place and size are kept
   as items[id] = { x, y, s }: a shift and a scale. Three kinds:
     html  the TV, the banner, the microphone: x, y in % of the hall, read by their CSS
           (--ix, --iy, --is)
     svg   a judge, the judges' table, each audience person: x, y in the drawing's own units,
           applied as a CSS transform on their <g>, grown from the middle of their base
     kid   a speller: only s, the height of every child drawn like them (--t-tall-<kid>);
           where they sit comes from the seating
   The editor puts a box over each one, kept in step with it as it moves (a speller walking). */
const itemKind = (el) => (el.classList.contains('bee-kid') ? 'kid' : el instanceof SVGElement ? 'svg' : 'html');
function setItem(hall, el, v = {}) {
  const kind = itemKind(el);
  if (kind === 'kid') {
    if (v.s != null) hall.style.setProperty(`--t-tall-${el.dataset.kid}`, v.s);
    return;
  }
  const x = v.x || 0, y = v.y || 0, sx = v.sx ?? v.s ?? 1, sy = v.sy ?? v.s ?? 1;
  if (kind === 'svg') {
    el.style.transformBox = 'fill-box';
    el.style.transformOrigin = '50% 100%';
    el.style.transform = x || y || sx !== 1 || sy !== 1 ? `translate(${x}px, ${y}px) scale(${sx}, ${sy})` : '';
  } else {
    el.style.setProperty('--ix', x);
    el.style.setProperty('--iy', y);
    el.style.setProperty('--isx', sx);
    el.style.setProperty('--isy', sy);
  }
}
/** Where a child sits on their chair (seated only): moved in the editor, saved per child. */
function sitVars(el, kid) {
  el.style.setProperty('--sit-x', `var(--t-sitx-${kid}, 0)`);
  el.style.setProperty('--sit-y', `var(--t-sity-${kid}, ${KIDS[kid]?.sitY || 0})`);
}
/** A seat (its child and its chair) moved by x, y (% of the hall) from where the seating put it. */
function placeSeat(hall, seat, x = 0, y = 0) {
  hall.querySelectorAll(`[data-seat="${seat}"]`).forEach((el) => {
    el.style.setProperty('--x', +el.dataset.bx + x);
    el.style.setProperty('--y', +el.dataset.by + y);
  });
}
function applyItems(hall, items = {}) {
  for (const [id, v] of Object.entries(items)) {
    const m = /^seat-(\d+)$/.exec(id);
    if (m) placeSeat(hall, m[1], v.x || 0, v.y || 0);
  }
  hall.querySelectorAll('[data-item]').forEach((el) => setItem(hall, el, items[el.dataset.item] || {}));
  for (const [id, v] of Object.entries(items)) {
    if (id.startsWith('kid-') && v.s != null) hall.style.setProperty(`--t-tall-${id.slice(4)}`, v.s);
    if (id.startsWith('kid-') && v.sitx != null) hall.style.setProperty(`--t-sitx-${id.slice(4)}`, v.sitx);
    if (id.startsWith('kid-') && v.sity != null) hall.style.setProperty(`--t-sity-${id.slice(4)}`, v.sity);
  }
}
function makeEditor(hall, items) {
  const layer = document.createElement('div');
  layer.className = 'bee-edit-layer';
  layer.hidden = true;
  hall.append(layer);
  let raf = 0;
  const boxes = new Map();          // element -> box
  const idOf = (el) => (itemKind(el) === 'kid' ? `kid-${el.dataset.kid}` : el.dataset.item);
  const valueOf = (el) => {
    const id = idOf(el);
    if (!items[id]) {
      // a speller starts at their drawing's height as it stands (saved, else their own)
      const k = el.dataset.kid;
      items[id] = itemKind(el) === 'kid'
        ? { s: Number(hall.style.getPropertyValue(`--t-tall-${k}`)) || KIDS[k]?.tall || 1 }
        : { x: 0, y: 0, s: 1 };
    }
    return items[id];
  };
  function boxFor(el) {
    const box = document.createElement('div');
    box.className = `bee-tbox bee-tbox--${itemKind(el)}`;
    const tag = document.createElement('span');
    tag.className = 'bee-tbox-tag';
    tag.textContent = el.dataset.label || el.getAttribute('aria-label') || '';
    box.append(tag);
    for (const c of itemKind(el) === 'kid' ? ['nw', 'ne', 'sw', 'se'] : ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
      const k = document.createElement('span');
      k.className = `bee-knob bee-knob--${c}`;
      k.dataset.corner = c;
      box.append(k);
    }
    // drag: inside the box moves it (not a speller), a corner resizes it about its base
    box.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const v = valueOf(el), kind = itemKind(el);
      const sx0 = v.sx ?? v.s ?? 1, sy0 = v.sy ?? v.s ?? 1;
      const start = { x: e.clientX, y: e.clientY, vx: v.x || 0, vy: v.y || 0 };
      const r0 = box.getBoundingClientRect();
      const handle = e.target.dataset?.corner || '';
      const hr = hall.getBoundingClientRect();
      // screen pixels -> the item's own units
      const svg = el.ownerSVGElement;
      const unit = kind === 'svg' ? 1 / (svg.getScreenCTM()?.a || 1) : null;
      const shift = (dx, dy) => {
        if (kind === 'svg') { v.x = +((v.x || 0) + dx * unit).toFixed(1); v.y = +((v.y || 0) + dy * unit).toFixed(1); }
        else { v.x = +((v.x || 0) + dx / hr.width * 100).toFixed(2); v.y = +((v.y || 0) + dy / hr.height * 100).toFixed(2); }
      };
      box.setPointerCapture(e.pointerId);
      const move = (m) => {
        const dx = m.clientX - start.x, dy = m.clientY - start.y;
        if (!handle) {                                   // inside the box: move it
          if (kind === 'kid') {                          // a speller: only the child moves, on their chair
            if (!el.classList.contains('is-standing') && !el.classList.contains('is-at-mic') && !el.classList.contains('is-walking')) {
              const k = el.dataset.kid;
              if (v.sitx0 == null) {
                const cs = getComputedStyle(el);
                v.sitx0 = v.sitx ?? (parseFloat(cs.getPropertyValue(`--t-sitx-${k}`)) || 0);
                v.sity0 = v.sity ?? (parseFloat(hall.style.getPropertyValue(`--t-sity-${k}`)) || KIDS[k]?.sitY || 0);
              }
              // % of the child's own box (translate's percentages)
              v.sitx = +(v.sitx0 + dx / r0.width * 100).toFixed(1);
              v.sity = +(v.sity0 + dy / r0.height * 100).toFixed(1);
              hall.style.setProperty(`--t-sitx-${k}`, v.sitx);
              hall.style.setProperty(`--t-sity-${k}`, v.sity);
            }
            return;
          }
          v.x = start.vx; v.y = start.vy; shift(dx, dy);
          setItem(hall, el, v);
          return;
        }
        // a handle: the edges it holds follow the pointer, the opposite edges stay put
        let { left, right, top, bottom } = r0;
        if (handle.includes('w')) left += dx;
        if (handle.includes('e')) right += dx;
        if (handle.includes('n')) top += dy;
        if (handle.includes('s')) bottom += dy;
        const w = Math.max(8, right - left), h = Math.max(8, bottom - top);
        if (kind === 'kid') {                             // a speller keeps their shape
          const k = Math.max(w / r0.width, h / r0.height);
          v.s = Math.max(0.2, Math.min(4, +(sx0 * k).toFixed(3)));
          setItem(hall, el, v);
          return;
        }
        if (/[ew]/.test(handle)) v.sx = Math.max(0.15, Math.min(5, +(sx0 * w / r0.width).toFixed(3)));
        if (/[ns]/.test(handle)) v.sy = Math.max(0.15, Math.min(5, +(sy0 * h / r0.height).toFixed(3)));
        if (v.sx == null) v.sx = sx0;
        if (v.sy == null) v.sy = sy0;
        delete v.s;
        v.x = start.vx; v.y = start.vy;
        setItem(hall, el, v);
        // then slide it so the edges that were not held are where they were
        const r1 = el.getBoundingClientRect();
        const want = { left: handle.includes('w') ? null : r0.left, right: handle.includes('w') ? r0.right : null,
          top: handle.includes('n') ? null : r0.top, bottom: handle.includes('n') ? r0.bottom : null };
        const ddx = /[ew]/.test(handle) ? (want.left != null ? want.left - r1.left : want.right - r1.right) : 0;
        const ddy = /[ns]/.test(handle) ? (want.top != null ? want.top - r1.top : want.bottom - r1.bottom) : 0;
        if (ddx || ddy) { shift(ddx, ddy); setItem(hall, el, v); }
      };
      const up = () => {
        delete v.sitx0; delete v.sity0;
        box.removeEventListener('pointermove', move); box.removeEventListener('pointerup', up); box.removeEventListener('pointercancel', up); };
      box.addEventListener('pointermove', move);
      box.addEventListener('pointerup', up);
      box.addEventListener('pointercancel', up);
    });
    layer.append(box);
    return box;
  }
  // keep every box over its item, as things move
  function follow() {
    const hr = hall.getBoundingClientRect();
    for (const el of hall.querySelectorAll('[data-item], .bee-kid')) {
      if (el.closest('.bee-edit-layer')) continue;
      let box = boxes.get(el);
      if (!box) { box = boxFor(el); boxes.set(el, box); }
      const r = el.getBoundingClientRect();
      // what can be seen of it: an audience member ends at their chair's foot (data-bottom),
      // and nothing goes past the hall's edges
      let top = r.top, bottom = r.bottom, left = r.left, right = r.right;
      if (el.dataset.bottom && el.getScreenCTM) { const m = el.getScreenCTM(); if (m) bottom = Math.min(bottom, m.f + m.d * Number(el.dataset.bottom)); }
      top = Math.max(top, hr.top); bottom = Math.min(bottom, hr.bottom); left = Math.max(left, hr.left); right = Math.min(right, hr.right);
      const hidden = right - left < 2 || bottom - top < 2 || el.classList.contains('is-gone');
      box.hidden = hidden;
      if (hidden) continue;
      box.style.left = `${left - hr.left}px`; box.style.top = `${top - hr.top}px`;
      box.style.width = `${right - left}px`; box.style.height = `${bottom - top}px`;
    }
    raf = requestAnimationFrame(follow);
  }
  return {
    get on() { return !layer.hidden; },
    toggle(on) {
      layer.hidden = !on;
      hall.classList.toggle('is-editing', on);
      cancelAnimationFrame(raf);
      if (on) follow();
    },
  };
}

/* The hall's settings (the admin, or ?tune=1): a small panel of icon buttons. Move-and-resize
   boxes for everything in the hall; the ABC chart, for the girl's voice and the boy's voice
   apart, said in the voice picked from the speaker's list; undo and save for everyone. */
function mountTuner(hall, top, { say, hush = () => {} }) {
  const sizes = { ...settings.sizes };
  const items = JSON.parse(JSON.stringify(settings.items || {}));
  const letters = normLetters(settings.letters);
  const icon = (cls, svg, tip) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `pp-plain bee-ic ${cls}`;
    b.innerHTML = svg;
    b.dataset.tip = tip;
    b.setAttribute('aria-label', tip);
    return b;
  };
  const row = (label, ...kids) => {
    const r = document.createElement('div');
    r.className = 'bee-tune-row';
    if (label) { const l = document.createElement('span'); l.className = 'bee-tune-head'; l.textContent = label; r.append(l); }
    r.append(...kids);
    return r;
  };
  const group = (...kids) => { const g = document.createElement('div'); g.className = 'bee-ic-group'; g.append(...kids); return g; };

  const btn = icon('bee-tune-btn', UI.settings(18), 'Hall settings');
  btn.className = 'bee-tune-btn';
  const panel = document.createElement('div');
  panel.className = 'bee-tune';
  panel.hidden = true;
  const paper = document.createElement('div');
  paper.className = 'bee-tune-paper';

  // the hall: everything in its own box
  const editor = makeEditor(hall, items);
  const boxes = icon('', UI.transform(18), 'Move and resize things in the hall');
  boxes.addEventListener('click', () => {
    const on = !editor.on;
    editor.toggle(on);
    boxes.classList.toggle('is-on', on);
    if (on) panel.hidden = true;            // out of the way of the boxes; the settings button brings it back
  });
  paper.append(row('Hall', group(boxes)));

  /* Voices: each speller's recorded voices, picked from every one there is: a Kokoro voice (their
     words, and their letters with Kokoro) and an ElevenLabs letter set. A play button beside each
     plays its "B". Saved with the rest, for every bee. */
  const picks = { kokoro: { ...VOICE_PICKS.kokoro }, eleven: { ...VOICE_PICKS.eleven } };
  const kokoroVoices = Object.keys(AUDIO.SPELLER_CLIPS || {}).filter((v) => AUDIO.SPELLER_CLIPS[v].letters?.base);
  const elevenSets = Object.keys(LETTER_VOICES);
  const voicesBox = document.createElement('div');
  voicesBox.className = 'bee-voice-picks';
  const play = (url) => { try { const a = liveClip(new Audio(url)); a.play().catch(() => {}); } catch { /* no sound */ } };
  const choose = (opts, value, onPick, tip) => {
    const sel = document.createElement('select');
    sel.className = 'bee-voice-sel';
    sel.setAttribute('aria-label', tip);
    sel.dataset.tip = tip;
    for (const [v, label] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = label; sel.append(o); }
    sel.value = value;
    sel.addEventListener('change', () => onPick(sel.value));
    sel.addEventListener('keydown', (e) => e.stopPropagation());
    return sel;
  };
  for (const kid of ['boy', 'boy3', 'boy2', 'girl', 'girl2', 'girl3']) {
    const line = document.createElement('div');
    line.className = 'bee-voice-pick';
    const face = document.createElement('span');
    face.className = 'pp-face';
    face.style.cssText = faceStyle(kid);
    face.dataset.tip = SPELLER_NAMES[kid];
    const name = document.createElement('span');
    name.className = 'bee-voice-name';
    name.textContent = SPELLER_NAMES[kid];
    const defK = SPELLER_VOICES[KIDS[kid].girl ? 'girl' : 'boy'];
    const k = choose(kokoroVoices.map((v) => [v, `${KOKORO_NAMES[v] || v}${v === defK ? ' *' : ''}`]), picks.kokoro[kid] || defK,
      (v) => { picks.kokoro[kid] = v; VOICE_PICKS.kokoro[kid] = v; }, `${SPELLER_NAMES[kid]}'s Kokoro voice`);
    const kPlay = icon('', UI.play(16), 'Hear this Kokoro voice');
    kPlay.addEventListener('click', () => { const v = k.value, c = AUDIO.SPELLER_CLIPS?.[v]?.letters; if (c?.base) play(`${c.base}0002-w.mp3`); });
    const defE = KID_LETTER_SET[kid] || (KIDS[kid].girl ? 'girl' : 'boy');
    const e = choose(elevenSets.map((v) => [v, `${LETTER_VOICES[v].name}${v === defE ? ' *' : ''}`]), picks.eleven[kid] || defE,
      (v) => { picks.eleven[kid] = v; VOICE_PICKS.eleven[kid] = v; }, `${SPELLER_NAMES[kid]}'s ElevenLabs letters`);
    const ePlay = icon('', UI.play(16), 'Hear these ElevenLabs letters');
    ePlay.addEventListener('click', () => play(`/media/spelling-letters/${e.value}/0002.mp3`));
    line.append(face, name, k, kPlay, e, ePlay);
    voicesBox.append(line);
    // the site's own dropdown, its small size (built while the panel is hidden, so it is asked for)
    for (const sel of [k, e]) enhanceSelect(sel, { className: 'pp-select--auto pp-select--sm' });
  }
  const voicesHead = document.createElement('div');
  voicesHead.className = 'bee-tune-row';
  const vh = document.createElement('span'); vh.className = 'bee-tune-head'; vh.textContent = 'Voices'; voicesHead.append(vh);
  const cols = document.createElement('div');
  cols.className = 'bee-voice-pick bee-voice-cols';
  cols.innerHTML = '<span></span><span></span><span>Kokoro</span><span></span><span>ElevenLabs</span><span></span>';
  voicesBox.prepend(cols);
  paper.append(voicesHead, voicesBox);

  // the letters: which speller (any of the six), and which voice engine; the spellings are kept
  // for the girls and for the boys (a speller's group)
  let kid = 'girl';
  const g = () => genderOf(kid);
  const SPELLER_ORDER = ['boy', 'boy3', 'boy2', 'girl', 'girl2', 'girl3'];
  const faces = group(...SPELLER_ORDER.map((k) => {
    const f = icon(`bee-ic-face${k === kid ? ' is-on' : ''}`, `<span class="pp-face" style="${faceStyle(k)}"></span>`, SPELLER_NAMES[k]);
    f.dataset.who = k;
    f.addEventListener('click', () => { kid = k; faces.querySelectorAll('.bee-ic').forEach((x) => x.classList.toggle('is-on', x === f)); refreshKeys(); showTune(); if (current != null) pick(current); });
    return f;
  }));
  const ENGINE_ICON = { browser: UI.monitor(18), kokoro: UI.cpu(18), eleven: UI.sparkle(18) };
  const engines = group(...SPELLER_VOICE_CHOICES.map((c) => {
    const e = icon('', ENGINE_ICON[c.key], c.label);
    e.dataset.voice = c.key;
    e.addEventListener('click', () => setSpellerVoice(c.key));
    return e;
  }));
  const showEngine = () => engines.querySelectorAll('.bee-ic').forEach((x) => x.classList.toggle('is-on', x.dataset.voice === spellerVoice));
  showEngine();
  document.addEventListener('bee-voice', () => { showEngine(); showTune(); });
  paper.append(row('Letters', faces), row('', engines));

  // this speller's volume and pitch in this engine, and the whole alphabet through them
  const tunes = picks.tune = JSON.parse(JSON.stringify(settings.voices?.tune || { browser: {}, kokoro: {}, eleven: {} }));
  for (const e of ['browser', 'kokoro', 'eleven']) tunes[e] ||= {};
  const slider = (label, min, max, step, onInput) => {
    const wrap = document.createElement('label');
    wrap.className = 'bee-tune-slide';
    wrap.innerHTML = `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" /><output></output>`;
    const inp = wrap.querySelector('input'), out = wrap.querySelector('output');
    inp.addEventListener('input', () => { out.textContent = Number(inp.value).toFixed(2); onInput(Number(inp.value)); });
    inp.addEventListener('keydown', (ev) => ev.stopPropagation());
    return { wrap, inp, out };
  };
  const setTune = (field, v) => {
    const e = spellerVoice, cur = { ...tuneOf(e, kid), [field]: v };
    tunes[e][kid] = cur; VOICE_TUNE[e][kid] = cur;
  };
  const vol = slider('Volume', 0, 1, 0.05, (v) => setTune('vol', v));
  const pit = slider('Pitch', 0.7, 1.4, 0.01, (v) => setTune('pitch', v));
  function showTune() {
    const t = tuneOf(spellerVoice, kid);
    vol.inp.value = t.vol; vol.out.textContent = t.vol.toFixed(2);
    pit.inp.value = t.pitch; pit.out.textContent = t.pitch.toFixed(2);
  }
  const atoz = icon('', UI.play(18), 'Hear A to Z in this voice');
  atoz.addEventListener('click', () => { hush(); for (const ch of 'abcdefghijklmnopqrstuvwxyz') say(letterName(ch, kid), kid, ch); });
  const stopAll = icon('', UI.pause(18), 'Stop');
  stopAll.addEventListener('click', () => hush());
  const resetT = icon('', UI.undo(18), 'Volume and pitch back to 1 for this speller in this voice');
  resetT.addEventListener('click', () => { delete tunes[spellerVoice][kid]; delete VOICE_TUNE[spellerVoice][kid]; showTune(); });
  const tuneBox = document.createElement('div');
  tuneBox.className = 'bee-tune-box';
  tuneBox.append(vol.wrap, pit.wrap, group(atoz, stopAll, resetT));
  paper.append(tuneBox);
  showTune();

  // the ABC chart: plain tiles; a changed one is marked
  const grid = document.createElement('div');
  grid.className = 'bee-abc';
  const keys = 'abcdefghijklmnopqrstuvwxyz'.split('').concat([' ', '-', "'"]);
  const keyLabel = (ch) => (ch === ' ' ? 'space' : ch === '-' ? '-' : ch === "'" ? "'" : ch.toUpperCase());
  let current = null;
  const edit = document.createElement('div');
  edit.className = 'bee-abc-edit';
  edit.innerHTML = '<span class="bee-abc-which"></span><input type="text" maxlength="24" placeholder="A spelling, or /IPA/" />';
  const which = edit.querySelector('.bee-abc-which'), said = edit.querySelector('input');
  said.setAttribute('aria-label', 'What this voice is given for the letter: a spelling, or IPA between slashes (said by ElevenLabs only)');
  said.dataset.tip = 'A spelling ("Ay."), or IPA between slashes ("/eɪ/"): IPA is said by ElevenLabs only';
  const hear = icon('', UI.speaker(18), 'Hear it');
  edit.append(hear);
  const sayLetter = () => { if (current != null) say(said.value.trim() || letterName(current, kid), kid, current); };
  const refreshKeys = () => grid.querySelectorAll('.bee-abc-key').forEach((x, i) => x.classList.toggle('is-changed', !!letters[g()][keys[i]]));
  function pick(ch) {
    current = ch;
    grid.querySelectorAll('.bee-abc-key').forEach((x, i) => x.classList.toggle('is-current', keys[i] === ch));
    which.textContent = keyLabel(ch);
    said.value = letters[g()][ch] ?? letterName(ch, kid);
    edit.hidden = false;
  }
  for (const ch of keys) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `pp-plain bee-abc-key${ch === ' ' ? ' is-word' : ''}`;
    b.textContent = keyLabel(ch);
    b.setAttribute('aria-label', `Letter ${ch === ' ' ? 'space' : ch === '-' ? 'hyphen' : ch === "'" ? 'apostrophe' : ch.toUpperCase()}`);
    b.addEventListener('click', () => { pick(ch); sayLetter(); });
    grid.append(b);
  }
  refreshKeys();
  edit.hidden = true;
  said.addEventListener('input', () => {
    if (current == null) return;
    const v = said.value.trim(), L = letters[g()];
    if (v && v !== DEFAULT_LETTER(current)) L[current] = v; else delete L[current];
    if (L[current]) LETTER_SAID[g()][current] = L[current]; else delete LETTER_SAID[g()][current];
    refreshKeys();
  });
  /* Typing IPA: a row of the symbols English needs (tap one: it goes in where the cursor is), and
     while the box holds IPA (it starts with "/") the keyboard helps: ' is the stress mark, , the
     second stress, : the long mark, and Shift with a letter is the IPA letter like it (capitals
     mean nothing in IPA). */
  const IPA_KEYS = ['ˈ', 'ˌ', 'ː', 'ə', 'ɪ', 'iː', 'ʊ', 'uː', 'ɛ', 'æ', 'ʌ', 'ɑː', 'ɒ', 'ɔː', 'ɜː', 'eɪ', 'aɪ', 'ɔɪ', 'əʊ', 'aʊ', 'ɪə', 'eə', 'θ', 'ð', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'ŋ', 'j', 'ɹ', '/'];
  const SHIFT_IPA = { E: 'ɛ', A: 'æ', I: 'ɪ', U: 'ʊ', O: 'ɔ', V: 'ʌ', Q: 'ɑ', B: 'ɒ', '@': 'ə', '#': 'ɜ', T: 'θ', D: 'ð', S: 'ʃ', Z: 'ʒ', N: 'ŋ', R: 'ɹ' };
  const PLAIN_IPA = { "'": 'ˈ', ',': 'ˌ', ':': 'ː' };
  const putIn = (t) => {
    const a = said.selectionStart ?? said.value.length, b = said.selectionEnd ?? a;
    said.value = said.value.slice(0, a) + t + said.value.slice(b);
    said.setSelectionRange(a + t.length, a + t.length);
    said.dispatchEvent(new Event('input'));
  };
  const ipaRow = document.createElement('div');
  ipaRow.className = 'bee-ipa';
  for (const k of IPA_KEYS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pp-plain bee-ipa-key';
    b.textContent = k;
    const hint = Object.entries(SHIFT_IPA).find(([, v]) => v === k) || Object.entries(PLAIN_IPA).find(([, v]) => v === k);
    b.dataset.tip = hint ? `${k}  (${/[A-Z@#]/.test(hint[0]) ? 'Shift+' : ''}${hint[0] === '#' ? '3' : hint[0] === '@' ? '2' : hint[0]})` : k;
    b.setAttribute('aria-label', `Insert ${k}`);
    b.addEventListener('mousedown', (e) => e.preventDefault());   // keep the cursor in the box
    b.addEventListener('click', () => {
      if (!said.value.trim().startsWith('/')) { said.value = `/${said.value.replace(/\//g, '')}`; }
      said.focus();
      putIn(k === '/' ? '/' : k);
    });
    ipaRow.append(b);
  }
  said.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sayLetter(); e.stopPropagation(); return; }
    if (said.value.trim().startsWith('/') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const k = e.shiftKey && e.key === '3' ? '#' : e.key;
      const sym = (e.shiftKey && SHIFT_IPA[k]) || PLAIN_IPA[k];
      if (sym) { e.preventDefault(); putIn(sym); }
    }
    e.stopPropagation();
  });
  hear.addEventListener('click', sayLetter);
  paper.append(grid, edit, ipaRow);
  const showIpaRow = () => { ipaRow.hidden = edit.hidden; };
  new MutationObserver(showIpaRow).observe(edit, { attributes: true, attributeFilter: ['hidden'] });
  showIpaRow();

  // undo, save, and a one-line note
  const note = document.createElement('p');
  note.className = 'bee-tune-note';
  const undo = icon('bee-tune-undo', UI.undo(18), 'Undo changes');
  const save = icon('bee-tune-keep', UI.save(18), 'Save for everyone');
  save.addEventListener('click', async () => {
    if (!isAdminHere()) { note.textContent = 'Only the admin account can save.'; return; }
    save.disabled = true;
    try {
      await setDoc(doc(db, ...SETTINGS_DOC), { sizes, items, letters, voices: picks, updatedAt: serverTimestamp() });
      settings = { sizes: { ...sizes }, items: JSON.parse(JSON.stringify(items)), letters: normLetters(letters), voices: JSON.parse(JSON.stringify(picks)) };
      // the saved letters, recorded in every ElevenLabs voice of that group, for every player
      note.textContent = 'Saved. Recording the letters in each voice...';
      let made = 0, failed = 0;
      for (const g of ['girl', 'boy']) {
        for (const set of setsOfGender(g)) {
          const clips = {};
          for (const [ch, t] of Object.entries(letters[g])) {
            const said = elevenText(ch, t);
            const old = SAVED_CLIPS[set]?.[ch];
            if (old && old.text === said) { clips[ch] = old; continue; }
            const url = await elevenUrl(said, set);
            if (!url) { failed++; continue; }
            try { clips[ch] = { text: said, data: await toDataUrl(url) }; made++; } catch { failed++; }
          }
          await setDoc(doc(db, 'beeLetterClips', set), { clips, updatedAt: serverTimestamp() });
          SAVED_CLIPS[set] = clips;
        }
      }
      note.textContent = failed ? `Saved; ${made} letters recorded, ${failed} could not be (ElevenLabs refused).` : `Saved for every bee${made ? `, ${made} letters recorded in each voice` : ''}.`;
    } catch (e) {
      note.textContent = `Not saved: ${e.code || e.message || e}`;
    }
    save.disabled = false;
  });
  undo.addEventListener('click', () => {
    for (const k of Object.keys(sizes)) delete sizes[k];
    Object.assign(sizes, settings.sizes);
    applySizes(hall, sizes);
    for (const k of Object.keys(items)) delete items[k];
    Object.assign(items, JSON.parse(JSON.stringify(settings.items || {})));
    applyItems(hall, items);
    setVoicePicks(settings.voices);
    picks.kokoro = { ...VOICE_PICKS.kokoro }; picks.eleven = { ...VOICE_PICKS.eleven };
    picks.tune = JSON.parse(JSON.stringify(VOICE_TUNE));
    showTune();
    voicesBox.querySelectorAll('.bee-voice-pick:not(.bee-voice-cols)').forEach((line, n) => {
      const kid = ['boy', 'boy3', 'boy2', 'girl', 'girl2', 'girl3'][n], [k, e] = line.querySelectorAll('select');
      k.value = picks.kokoro[kid] || SPELLER_VOICES[KIDS[kid].girl ? 'girl' : 'boy'];
      e.value = picks.eleven[kid] || KID_LETTER_SET[kid] || (KIDS[kid].girl ? 'girl' : 'boy');
    });
    const back = normLetters(settings.letters);
    letters.girl = back.girl; letters.boy = back.boy;
    setLetterSaid(settings.letters);
    refreshKeys();
    edit.hidden = true;
    note.textContent = 'Back to what was saved.';
  });
  const foot = document.createElement('div');
  foot.className = 'bee-tune-foot';
  foot.append(note, group(undo, save));
  paper.append(foot);
  if (!isAdminHere()) note.textContent = 'Only the admin can save.';
  panel.append(paper);
  btn.addEventListener('click', () => { panel.hidden = !panel.hidden; });
  top.querySelector('.bee-full').before(btn);
  top.after(panel);
}

const spaced = (s) => s.toUpperCase().split('').join(' ');
const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Hold a bee. Resolves when the player closes it: { place, champion, placings }
 * (place is null if they left before going out).
 *   humans  [{ uid, name }] every real player in the room
 *   me      { uid, name }
 */
export function startBee({ roomId, seed, sets, turnSeconds, humans, botsNeeded, me, mode = 'spell', operations = [], cup = false, soroban = null }) {
  const isMath = mode === 'math';                  // the Math Bee: a minute each at the pulpit
  const BEE_NAME = isMath ? 'Prep Math Bee' : 'Prep Spelling Bee';
  const myKid = KIDS[me.kid] ? me.kid : null;
  const seats = seatSpellers(seed, humans.map((h) => (h.uid === me.uid && myKid ? { ...h, kid: myKid } : h)), botsNeeded);
  const bee = createBee(seats.length);
  const mySeat = seats.find((s) => s.uid === me.uid) || null;
  // a speller's name: the child's own; a real player's name after it
  /* A speller's name: a real player is called by their OWN name; a bot by its child's fixed name
     (the user: "show players own name on their character. Only show fixed name for bots"). */
  const ownName = (s) => (s.uid && s.name ? s.name : SPELLER_NAMES[s.kid] || s.name || 'Speller');
  const nameOf = (s) => (s === mySeat ? `${ownName(s)} (you)` : ownName(s));
  const question = (k) => spellingQuestion(seed, k, 'spellSay', sets);
  // the judge's voice says each real player's name, made once now, ready for the end
  const nameClips = new Map();
  for (const s of seats) if (s.uid && s.name) nameClips.set(s, kokoroSays(s === mySeat ? `${s.name}! That is you!` : `${s.name}!`));

  /* ── The screen ──────────────────────────────────────────────── */
  const bd = document.createElement('div');
  bd.className = 'bee-bd';
  bd.setAttribute('role', 'dialog');
  bd.setAttribute('aria-modal', 'true');
  bd.setAttribute('aria-label', 'Spelling bee');
  bd.innerHTML = `
    <div class="bee-blob" aria-hidden="true"></div>
    <div class="bee-top">
      <span class="pp-pill pp-pill--static bee-round"></span>
      <span class="pp-pill pp-pill--static bee-left"></span>
      <span class="bee-say"><span class="bee-status" aria-live="polite"></span><span class="bee-heard" hidden></span></span>
<span class="bee-clock" hidden aria-live="off"><svg viewBox="0 0 48 56" aria-hidden="true"><defs><linearGradient id="bee-sw-metal" x1="0" x2="1"><stop offset="0" stop-color="#9aa3ad"/><stop offset=".45" stop-color="#eef1f4"/><stop offset="1" stop-color="#7b848e"/></linearGradient><radialGradient id="bee-sw-face" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9ecef"/></radialGradient></defs><rect x="20" y="0" width="8" height="5" rx="1.5" fill="url(#bee-sw-metal)"/><rect x="22" y="4" width="4" height="4" fill="#7b848e"/><rect x="36" y="6" width="5" height="4" rx="1.2" transform="rotate(40 38.5 8)" fill="url(#bee-sw-metal)"/><circle cx="24" cy="32" r="22" fill="url(#bee-sw-metal)"/><circle cx="24" cy="32" r="19" fill="url(#bee-sw-face)"/><circle class="bee-sw-ring" cx="24" cy="32" r="16" fill="none" stroke="#3bb273" stroke-width="3" pathLength="100" stroke-dasharray="100 100" transform="rotate(-90 24 32)"/><line x1="24" y1="14.2" x2="24" y2="16.4" stroke="#2a2f36" stroke-width="1" transform="rotate(0 24 32)"/><line x1="24" y1="14.2" x2="24" y2="15.4" stroke="#2a2f36" stroke-width="0.6" transform="rotate(30 24 32)"/><line x1="24" y1="14.2" x2="24" y2="15.4" stroke="#2a2f36" stroke-width="0.6" transform="rotate(60 24 32)"/><line x1="24" y1="14.2" x2="24" y2="16.4" stroke="#2a2f36" stroke-width="1" transform="rotate(90 24 32)"/><line x1="24" y1="14.2" x2="24" y2="15.4" stroke="#2a2f36" stroke-width="0.6" transform="rotate(120 24 32)"/><line x1="24" y1="14.2" x2="24" y2="15.4" stroke="#2a2f36" stroke-width="0.6" transform="rotate(150 24 32)"/><line x1="24" y1="14.2" x2="24" y2="16.4" stroke="#2a2f36" stroke-width="1" transform="rotate(180 24 32)"/><line x1="24" y1="14.2" x2="24" y2="15.4" stroke="#2a2f36" stroke-width="0.6" transform="rotate(210 24 32)"/><line x1="24" y1="14.2" x2="24" y2="15.4" stroke="#2a2f36" stroke-width="0.6" transform="rotate(240 24 32)"/><line x1="24" y1="14.2" x2="24" y2="16.4" stroke="#2a2f36" stroke-width="1" transform="rotate(270 24 32)"/><line x1="24" y1="14.2" x2="24" y2="15.4" stroke="#2a2f36" stroke-width="0.6" transform="rotate(300 24 32)"/><line x1="24" y1="14.2" x2="24" y2="15.4" stroke="#2a2f36" stroke-width="0.6" transform="rotate(330 24 32)"/><line class="bee-sw-hand" x1="24" y1="32" x2="24" y2="16" stroke="#d64541" stroke-width="1.4" stroke-linecap="round"/><circle cx="24" cy="32" r="1.8" fill="#2a2f36"/></svg><b class="bee-clock-n"></b></span>
      <span class="bee-spacer"></span>
      <button type="button" class="bee-skip" hidden></button>
      <button type="button" class="bee-skip-intro" hidden></button>
      <div class="bee-toolbox">
        <button type="button" class="bee-tools-btn" hidden></button>
        <div class="bee-tools" hidden><p class="bee-keys">Keys: Enter done &middot; 1 word &middot; 2 meaning &middot; 3 sentence &middot; 4 origin &middot; 5 mic</p></div>
      </div>
      <div class="bee-toolbox bee-voicebox">
        <button type="button" class="bee-voice"></button>
        <div class="bee-tools bee-voices" role="menu" hidden></div>
      </div>
      <button type="button" class="bee-full"></button>
      <button type="button" class="bee-leave"></button>
    </div>
    <div class="bee-hall">
      <div class="bee-backdrop"></div>
      <span class="pp-sticky pp-sticky--c0 pp-sticky--tape bee-banner bee-item" data-item="banner" data-label="Banner">${BEE_NAME}</span>
      <div class="bee-platform" aria-hidden="true"><svg viewBox="0 0 120 40" preserveAspectRatio="none"><rect x="6" y="6" width="96" height="34" fill="#6e4421"/><rect x="4" y="2" width="100" height="6" fill="#a06a3a"/><rect x="6" y="8" width="96" height="2" fill="#3e2410" opacity=".5"/><rect x="102" y="18" width="12" height="22" fill="#5a3519"/><rect x="101" y="15" width="14" height="4" fill="#a06a3a"/><rect x="112" y="29" width="8" height="11" fill="#4a2a12"/><rect x="111" y="26" width="9" height="4" fill="#a06a3a"/></svg></div>
      <div class="bee-pulpit bee-item" data-item="pulpit" data-label="Pulpit" aria-hidden="true"><svg viewBox="0 0 100 110" preserveAspectRatio="none"><defs><linearGradient id="bee-pw" x1="0" x2="1"><stop offset="0" stop-color="#5a3519"/><stop offset=".45" stop-color="#8a5a2f"/><stop offset="1" stop-color="#4a2a12"/></linearGradient><linearGradient id="bee-pt" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a06a3a"/><stop offset="1" stop-color="#6e4421"/></linearGradient></defs><polygon points="4,14 96,14 90,24 10,24" fill="url(#bee-pt)"/><rect x="4" y="11" width="92" height="4" fill="#b98250"/><polygon points="12,24 88,24 84,104 16,104" fill="url(#bee-pw)"/><rect x="10" y="102" width="80" height="8" fill="#3e2410"/><rect x="24" y="34" width="52" height="56" fill="none" stroke="#3e2410" stroke-width="1.2" opacity=".45"/><g class="bee-buzzer"><rect x="2" y="8.5" width="22" height="4.5" fill="#2c2f33"/><rect x="4" y="7" width="18" height="2" fill="#4a4e55"/><path class="bee-buzzer-dome" d="M5 7.2 Q13 -4 21 7.2 Z"/><path d="M8.5 4.4 Q10.5 1.4 14 1" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".55"/></g><path d="M70 12 C70 4 74 0 80 -4" fill="none" stroke="#2d3035" stroke-width="2"/><rect x="77" y="-10" width="7" height="9" rx="3" fill="#2c2f33" transform="rotate(30 80 -5)"/></svg><div class="bee-pulpit-tv"><b></b></div></div>
      <div class="bee-platform bee-platform--2" aria-hidden="true"><svg viewBox="0 0 120 40" preserveAspectRatio="none"><rect x="6" y="6" width="96" height="34" fill="#6e4421"/><rect x="4" y="2" width="100" height="6" fill="#a06a3a"/><rect x="6" y="8" width="96" height="2" fill="#3e2410" opacity=".5"/><rect x="102" y="18" width="12" height="22" fill="#5a3519"/><rect x="101" y="15" width="14" height="4" fill="#a06a3a"/><rect x="112" y="29" width="8" height="11" fill="#4a2a12"/><rect x="111" y="26" width="9" height="4" fill="#a06a3a"/></svg></div>
      <div class="bee-pulpit bee-pulpit--2" aria-hidden="true"><svg viewBox="0 0 100 110" preserveAspectRatio="none"><defs><linearGradient id="bee-pw" x1="0" x2="1"><stop offset="0" stop-color="#5a3519"/><stop offset=".45" stop-color="#8a5a2f"/><stop offset="1" stop-color="#4a2a12"/></linearGradient><linearGradient id="bee-pt" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a06a3a"/><stop offset="1" stop-color="#6e4421"/></linearGradient></defs><polygon points="4,14 96,14 90,24 10,24" fill="url(#bee-pt)"/><rect x="4" y="11" width="92" height="4" fill="#b98250"/><polygon points="12,24 88,24 84,104 16,104" fill="url(#bee-pw)"/><rect x="10" y="102" width="80" height="8" fill="#3e2410"/><rect x="24" y="34" width="52" height="56" fill="none" stroke="#3e2410" stroke-width="1.2" opacity=".45"/><g class="bee-buzzer"><rect x="2" y="8.5" width="22" height="4.5" fill="#2c2f33"/><rect x="4" y="7" width="18" height="2" fill="#4a4e55"/><path class="bee-buzzer-dome" d="M5 7.2 Q13 -4 21 7.2 Z"/><path d="M8.5 4.4 Q10.5 1.4 14 1" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".55"/></g><path d="M70 12 C70 4 74 0 80 -4" fill="none" stroke="#2d3035" stroke-width="2"/><rect x="77" y="-10" width="7" height="9" rx="3" fill="#2c2f33" transform="rotate(30 80 -5)"/></svg><div class="bee-pulpit-tv"><b></b></div></div>
      <div class="bee-judges"></div>
      <div class="bee-stand bee-item" data-item="mic" data-label="Microphone" aria-hidden="true"><svg viewBox="0 0 20 100" preserveAspectRatio="xMidYMax meet"><defs><linearGradient id="bee-chrome" x1="0" x2="1"><stop offset="0" stop-color="#6d737a"/><stop offset=".45" stop-color="#f1f3f5"/><stop offset="1" stop-color="#5b6168"/></linearGradient><pattern id="bee-mesh" width="1.4" height="1.4" patternUnits="userSpaceOnUse"><rect width="1.4" height="1.4" fill="#2c2f33"/><circle cx=".7" cy=".7" r=".42" fill="#6b7077"/></pattern></defs><path d="M10 85 L2.2 98.6 M10 85 L17.8 98.6 M10 85 L10 99" stroke="#25282c" stroke-width="1.6" stroke-linecap="round"/><rect x="8.4" y="80" width="3.2" height="6" rx="1" fill="#25282c"/><rect x="9.1" y="22" width="1.8" height="59" fill="url(#bee-chrome)"/><rect x="8.3" y="48" width="3.4" height="3" rx="1" fill="#25282c"/><path d="M10.6 30 Q14 40 11 52 Q9 62 12.5 80" fill="none" stroke="#111" stroke-width=".55" opacity=".85"/><rect x="8.4" y="18" width="3.2" height="5" rx="1" fill="#25282c"/><rect x="7.2" y="10" width="5.6" height="9" rx="1.6" fill="#1d1f22"/><rect x="7.6" y="16.2" width="4.8" height=".8" fill="#9aa1a9"/><path d="M5.8 10.5 Q5.8 2 10 2 Q14.2 2 14.2 10.5 Z" fill="url(#bee-mesh)" stroke="#9aa1a9" stroke-width=".5"/><rect x="5.6" y="9.8" width="8.8" height="1.4" rx=".6" fill="url(#bee-chrome)"/><path d="M7.4 4.6 Q8.4 3.2 10 3" stroke="#fff" stroke-width=".5" fill="none" opacity=".5"/></svg></div>
      <div class="bee-tv bee-item" data-item="tv" data-label="TV" aria-label="The screen">
        <div class="bee-tv-screen">
          <div class="bee-spell">
            <p class="bee-letters"></p>
            <input class="bee-input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="40" aria-label="Spell the word, one letter at a time. Letters cannot be taken back." disabled />
          </div>
          <div class="bee-tv-idle" aria-hidden="true"><svg class="bee-bot" viewBox="0 0 64 64" aria-hidden="true"><line x1="32" y1="7" x2="32" y2="16" stroke="#1f2a37" stroke-width="2.6" stroke-linecap="round"/><circle class="bee-bot-ball" cx="32" cy="6" r="3.2" fill="#f4c95d"/><rect x="4" y="27" width="8" height="13" rx="4" fill="#f28fb0"/><rect x="52" y="27" width="8" height="13" rx="4" fill="#f28fb0"/><rect x="11" y="16" width="42" height="38" rx="14" fill="#7cc4f0"/><rect x="17" y="22" width="30" height="19" rx="9.5" fill="#1f2a37"/><circle class="bee-bot-eye" cx="26" cy="31.5" r="3.1" fill="#f4c95d"/><circle class="bee-bot-eye" cx="38" cy="31.5" r="3.1" fill="#f4c95d"/><path class="bee-bot-mouth" d="M24 48 L40 48" stroke="#1f2a37" stroke-width="4.4" stroke-linecap="round" fill="none"/></svg><p class="bee-tv-logo"><small>Prep</small>${isMath ? 'Math Bee' : 'Spelling Bee'}</p></div>
          <div class="bee-tv-host" aria-hidden="true"><svg class="bee-bot" viewBox="0 0 64 64" aria-hidden="true"><line x1="32" y1="7" x2="32" y2="16" stroke="#1f2a37" stroke-width="2.6" stroke-linecap="round"/><circle class="bee-bot-ball" cx="32" cy="6" r="3.2" fill="#f4c95d"/><rect x="4" y="27" width="8" height="13" rx="4" fill="#f28fb0"/><rect x="52" y="27" width="8" height="13" rx="4" fill="#f28fb0"/><rect x="11" y="16" width="42" height="38" rx="14" fill="#7cc4f0"/><rect x="17" y="22" width="30" height="19" rx="9.5" fill="#1f2a37"/><circle class="bee-bot-eye" cx="26" cy="31.5" r="3.1" fill="#f4c95d"/><circle class="bee-bot-eye" cx="38" cy="31.5" r="3.1" fill="#f4c95d"/><path class="bee-bot-mouth" d="M24 48 L40 48" stroke="#1f2a37" stroke-width="4.4" stroke-linecap="round" fill="none"/></svg><p class="bee-tv-host-line"></p><div class="bee-tv-award"><svg class="bee-trophy" viewBox="0 0 64 72" aria-hidden="true"><path d="M14 8 H4 V16 Q4 30 18 32" fill="none" stroke="#d4a937" stroke-width="4"/><path d="M50 8 H60 V16 Q60 30 46 32" fill="none" stroke="#d4a937" stroke-width="4"/><path d="M14 4 H50 V20 Q50 40 32 42 Q14 40 14 20 Z" fill="#f2c94c"/><path d="M20 8 H26 V22 Q26 32 32 36 Q22 34 20 22 Z" fill="#fff0b3" opacity=".75"/><rect x="28" y="42" width="8" height="10" fill="#d4a937"/><rect x="18" y="52" width="28" height="7" fill="#b8902e"/><rect x="13" y="59" width="38" height="9" fill="#7a5c1c"/><rect x="22" y="61.5" width="20" height="4" fill="#f2c94c"/></svg><span class="bee-tv-prize"><b>5,000</b> PrepCoins</span></div></div>
          <div class="bee-tv-math"><div class="bee-mfig" aria-hidden="true"></div><p class="bee-mh"></p><p class="bee-mq"></p><p class="bee-ma"></p><p class="bee-mn"></p><div class="bee-duel"><div class="bee-duel-side" data-side="0"><p class="bee-duel-name"></p><p class="bee-duel-ans"></p></div><p class="bee-duel-score"></p><div class="bee-duel-side" data-side="1"><p class="bee-duel-name"></p><p class="bee-duel-ans"></p></div></div><input class="bee-math-input" type="text" inputmode="text" enterkeyhint="go" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="40" aria-label="Your answer: type it and press Enter" disabled /></div>
          <div class="bee-tv-curtain" aria-hidden="true"></div>
          <span class="bee-tv-static" aria-hidden="true"></span>
          <span class="bee-tv-glare" aria-hidden="true"></span>
        </div>
        <span class="bee-tv-brand" aria-hidden="true"></span>
        <span class="bee-tv-led" aria-hidden="true"></span>
      </div>
      <div class="bee-truss" aria-hidden="true"></div>
      <div class="bee-lamp bee-lamp--l" aria-hidden="true"><svg viewBox="0 0 60 90" aria-hidden="true"><defs><linearGradient id="bee-can-l" x1="0" x2="1"><stop offset="0" stop-color="#16171a"/><stop offset=".35" stop-color="#4b4f56"/><stop offset=".6" stop-color="#2b2e33"/><stop offset="1" stop-color="#101113"/></linearGradient><radialGradient id="bee-lens-l" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffdf2"/><stop offset=".55" stop-color="#ffe9a8"/><stop offset="1" stop-color="#d9a441"/></radialGradient></defs><rect x="22" y="0" width="16" height="7" fill="#2b2e33"/><rect x="28" y="6" width="4" height="9" fill="#3b3f45"/><path d="M10 40 V18 Q10 14 14 14 H46 Q50 14 50 18 V40" fill="none" stroke="#3b3f45" stroke-width="4"/><circle cx="10" cy="40" r="3.2" fill="#55595f"/><circle cx="50" cy="40" r="3.2" fill="#55595f"/><rect x="15" y="22" width="30" height="46" rx="4" fill="url(#bee-can-l)"/><rect x="17" y="27" width="26" height="2" fill="#5d6168" opacity=".6"/><rect x="17" y="32" width="26" height="2" fill="#5d6168" opacity=".6"/><rect x="13" y="66" width="34" height="6" rx="1.5" fill="#202226"/><path d="M13 72 L4 86 H16 L20 72 Z" fill="#26282c"/><path d="M47 72 L56 86 H44 L40 72 Z" fill="#26282c"/><ellipse class="bee-lens" cx="30" cy="73" rx="12" ry="3.4" fill="url(#bee-lens-l)"/></svg></div>
      <div class="bee-lamp bee-lamp--r" aria-hidden="true"><svg viewBox="0 0 60 90" aria-hidden="true"><defs><linearGradient id="bee-can-r" x1="0" x2="1"><stop offset="0" stop-color="#16171a"/><stop offset=".35" stop-color="#4b4f56"/><stop offset=".6" stop-color="#2b2e33"/><stop offset="1" stop-color="#101113"/></linearGradient><radialGradient id="bee-lens-r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffdf2"/><stop offset=".55" stop-color="#ffe9a8"/><stop offset="1" stop-color="#d9a441"/></radialGradient></defs><rect x="22" y="0" width="16" height="7" fill="#2b2e33"/><rect x="28" y="6" width="4" height="9" fill="#3b3f45"/><path d="M10 40 V18 Q10 14 14 14 H46 Q50 14 50 18 V40" fill="none" stroke="#3b3f45" stroke-width="4"/><circle cx="10" cy="40" r="3.2" fill="#55595f"/><circle cx="50" cy="40" r="3.2" fill="#55595f"/><rect x="15" y="22" width="30" height="46" rx="4" fill="url(#bee-can-r)"/><rect x="17" y="27" width="26" height="2" fill="#5d6168" opacity=".6"/><rect x="17" y="32" width="26" height="2" fill="#5d6168" opacity=".6"/><rect x="13" y="66" width="34" height="6" rx="1.5" fill="#202226"/><path d="M13 72 L4 86 H16 L20 72 Z" fill="#26282c"/><path d="M47 72 L56 86 H44 L40 72 Z" fill="#26282c"/><ellipse class="bee-lens" cx="30" cy="73" rx="12" ry="3.4" fill="url(#bee-lens-r)"/></svg></div>
      <div class="bee-lamp bee-lamp--spot" aria-hidden="true"><svg viewBox="0 0 60 90" aria-hidden="true"><defs><linearGradient id="bee-can-s" x1="0" x2="1"><stop offset="0" stop-color="#16171a"/><stop offset=".35" stop-color="#4b4f56"/><stop offset=".6" stop-color="#2b2e33"/><stop offset="1" stop-color="#101113"/></linearGradient><radialGradient id="bee-lens-s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffdf2"/><stop offset=".55" stop-color="#ffe9a8"/><stop offset="1" stop-color="#d9a441"/></radialGradient></defs><rect x="22" y="0" width="16" height="7" fill="#2b2e33"/><rect x="28" y="6" width="4" height="9" fill="#3b3f45"/><path d="M10 40 V18 Q10 14 14 14 H46 Q50 14 50 18 V40" fill="none" stroke="#3b3f45" stroke-width="4"/><circle cx="10" cy="40" r="3.2" fill="#55595f"/><circle cx="50" cy="40" r="3.2" fill="#55595f"/><rect x="15" y="22" width="30" height="46" rx="4" fill="url(#bee-can-s)"/><rect x="17" y="27" width="26" height="2" fill="#5d6168" opacity=".6"/><rect x="17" y="32" width="26" height="2" fill="#5d6168" opacity=".6"/><rect x="13" y="66" width="34" height="6" rx="1.5" fill="#202226"/><path d="M13 72 L4 86 H16 L20 72 Z" fill="#26282c"/><path d="M47 72 L56 86 H44 L40 72 Z" fill="#26282c"/><ellipse class="bee-lens" cx="30" cy="73" rx="12" ry="3.4" fill="url(#bee-lens-s)"/></svg></div>
      <div class="bee-spot" aria-hidden="true"></div>
      <span class="bee-pool bee-pool--l" aria-hidden="true"></span><span class="bee-pool bee-pool--r" aria-hidden="true"></span><span class="bee-pool bee-pool--spot" aria-hidden="true"></span>
      <span class="bee-beam bee-beam--l" aria-hidden="true"></span><span class="bee-beam bee-beam--r" aria-hidden="true"></span><span class="bee-beam bee-beam--spot" aria-hidden="true"></span>
      <div class="bee-footlights" aria-hidden="true">${Array.from({ length: 11 }, () => '<span></span>').join('')}</div>
      <div class="bee-flood" aria-hidden="true"></div>
      <div class="bee-confetti" aria-hidden="true"></div>
      <div class="bee-curtain bee-curtain--l" aria-hidden="true"><span class="bee-tieback"></span></div>
      <div class="bee-curtain bee-curtain--r" aria-hidden="true"><span class="bee-tieback"></span></div>
      <div class="bee-marquee" aria-hidden="true"></div>
      <div class="bee-audience"></div>
    </div>
    <div class="bee-cup" hidden>
      <div class="pp-receipt bee-cup-card">
        <div class="pp-receipt__paper bee-cup-paper">
          <p class="bee-results-kicker">${BEE_NAME} tournament</p>
          <p class="bee-results-title bee-cup-title"></p>
          <div class="bee-cup-body"></div>
        </div>
      </div>
    </div>
    <div class="bee-results" hidden>
      <div class="pp-receipt bee-results-card">
        <div class="pp-receipt__paper bee-results-paper">
          <p class="bee-results-kicker">${BEE_NAME}</p>
          <p class="bee-results-title"></p>
          <ol class="bee-results-list"></ol>
          <button type="button" class="pp-btn bee-results-close">Back to the setup</button>
        </div>
      </div>
    </div>`;
  const $ = (q) => bd.querySelector(q);
  if (isMath) bd.classList.add('is-math');
  /* the TV is a lit screen: the stage's dimming (.bee-spot) is cut away over it */
  const keepTvLit = () => {
    const sp = bd.querySelector('.bee-spot'), tvEl = bd.querySelector('.bee-tv');
    if (!sp || !tvEl) return;
    const h = sp.getBoundingClientRect(), t = tvEl.getBoundingClientRect();
    if (!h.width || !t.width) return;
    Object.assign(sp.style, {
      maskImage: 'linear-gradient(#000, #000), linear-gradient(#000, #000)', webkitMaskImage: 'linear-gradient(#000, #000), linear-gradient(#000, #000)',
      maskSize: `100% 100%, ${t.width}px ${t.height}px`, webkitMaskSize: `100% 100%, ${t.width}px ${t.height}px`,
      maskPosition: `0 0, ${t.left - h.left}px ${t.top - h.top}px`, webkitMaskPosition: `0 0, ${t.left - h.left}px ${t.top - h.top}px`,
      maskRepeat: 'no-repeat', webkitMaskRepeat: 'no-repeat', maskComposite: 'exclude', webkitMaskComposite: 'xor',
    });
  };
  requestAnimationFrame(keepTvLit);
  try { new ResizeObserver(keepTvLit).observe(bd); } catch { /* an old browser: the screen dims with the hall */ }
  if (isMath && cup) bd.classList.add('is-cup');
  $('.bee-blob').innerHTML = heroPaint();
  $('.bee-backdrop').innerHTML = hallSvg();
  $('.bee-audience').innerHTML = audienceSvg(seed);
  const judge = $('.bee-judges');
  judge.innerHTML = judgesSvg();
  if (isMath) judge.querySelectorAll('text').forEach((t) => { if (t.textContent === 'SPELLING BEE') t.textContent = 'MATH BEE'; });   // the table's front panel
  followJudgeMouth(judge);              // her lips follow the speech code's mouth
  const hall = $('.bee-hall'), statusEl = $('.bee-status'), lettersEl = $('.bee-letters'), inputEl = $('.bee-input');
  const liveClips = new Set();
  /** a recorded line, kept track of while it plays (stopClips() silences every one) */
  function liveClip(a) {
    liveClips.add(a);
    const off = () => liveClips.delete(a);
    a.addEventListener('ended', off); a.addEventListener('error', off); a.addEventListener('pause', off);
    return a;
  }
  function stopClips() { for (const a of [...liveClips]) { try { a.pause(); a.dispatchEvent(new Event('ended')); } catch { /* gone */ } } liveClips.clear(); }
  const clockEl = $('.bee-clock'), toolsEl = $('.bee-tools'), heardEl = $('.bee-heard'), skipBtn = $('.bee-skip');
  const toolsBtn = $('.bee-tools-btn'), keysEl = $('.bee-keys');
  // the speller's tools live in the top bar, folded away behind one button
  toolsBtn.innerHTML = UI.menu(18);
  toolsBtn.setAttribute('aria-label', 'Ask the judge (keys 1 to 5)');
  toolsBtn.dataset.tip = 'Ask the judge (keys 1 to 5)';
  toolsBtn.setAttribute('aria-expanded', 'false');
  toolsBtn.addEventListener('click', () => {
    toolsEl.hidden = !toolsEl.hidden;
    toolsBtn.setAttribute('aria-expanded', toolsEl.hidden ? 'false' : 'true');
    if (!inputEl.disabled) inputEl.focus();
  });
  const roundEl = $('.bee-round'), leftEl = $('.bee-left');

  // the spellers, in their chairs, tags on
  const kids = seats.map((s) => {
    const spot = seatSpot(seats.length, s.seat, cup);
    const f = KIDS[s.kid];
    const el = document.createElement('div');
    el.className = `bee-kid bee-kid--${spot.row}${s === mySeat ? ' is-me' : ''}`;
    el.style.setProperty('--x', spot.x);
    el.style.setProperty('--y', spot.y);
    el.style.setProperty('--tall', `var(--t-tall-${s.kid}, ${f.tall})`);
    el.dataset.kid = s.kid;
    el.dataset.seat = s.seat; el.dataset.bx = spot.x; el.dataset.by = spot.y;
    el.dataset.label = `${KID_NAMES[s.kid] || s.kid} (every one)`;
    sitVars(el, s.kid);
    el.style.setProperty('--hip', f.hip);
    el.style.setProperty('--knee', f.knee);
    el.style.setProperty('--hands', f.hands);
    /* The rig. The picture is one flat drawing, so it is used three times: the body
       (head to hips, with the hands), and each leg on its own from the hip down. Walking,
       the legs take turns to lift (a leg coming towards you looks shorter) while the body
       bobs and sways. Sitting, the body comes down onto the knees: from the front a seated
       child's thighs point at you and are not seen. See bee.css. */
    const pic = () => { const i = document.createElement('img'); i.src = f.src; i.alt = ''; i.draggable = false; return i; };
    const rig = document.createElement('div');
    rig.className = 'bee-kid-rig';
    const body = document.createElement('div');
    body.className = 'bee-kid-body';
    // a numbered placard on a lanyard, the speller's name under the number
    const tag = document.createElement('span');
    tag.className = `bee-tag${s === mySeat ? ' is-me' : ''}`;
    tag.innerHTML = `<b class="bee-tag-no">${s.tag}</b><span class="bee-tag-name"></span>`;
    tag.querySelector('.bee-tag-name').textContent = ownName(s);      // a player's own name, as typed
    // a lost speller's face: a frown over the smile, and tears
    const frown = document.createElement('span');
    frown.className = 'bee-frown';
    frown.style.cssText = `left:${f.mouth[0] - f.mouth[2] / 2}%;top:${f.mouth[1] - f.mouth[3] / 2}%;width:${f.mouth[2]}%;height:${f.mouth[3] * 1.6}%`;
    frown.innerHTML = `<svg viewBox="0 0 40 16" preserveAspectRatio="none"><ellipse cx="20" cy="7" rx="20" ry="7" fill="${f.skin}"/><path d="M7 12 Q20 1.5 33 12" fill="none" stroke="${f.lip}" stroke-width="3" stroke-linecap="round"/></svg>`;
    const tears = f.eyes.map(([x, y], n) => {
      const t = document.createElement('span');
      t.className = 'bee-tear';
      t.style.cssText = `left:${x}%;top:${y + 1.6}%;animation-delay:${n * 0.45}s`;
      return t;
    });
    // a mouth over the drawing's own, opening and shutting while the child speaks (bee.css)
    // the speaking mouth: an SVG over the drawing, in % of it, whose path follows the drawn smile
    const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mouth.setAttribute('class', 'bee-kid-mouth');
    mouth.setAttribute('viewBox', '0 0 100 100');
    mouth.setAttribute('preserveAspectRatio', 'none');
    mouth.setAttribute('aria-hidden', 'true');
    mouth.innerHTML = '<path class="bee-lips-in" d=""/><path class="bee-lips-low" d=""/>';
    body.append(pic(), tag, frown, ...tears, mouth);
    const legL = document.createElement('div');
    legL.className = 'bee-leg bee-leg--l';
    legL.append(pic());
    const legR = document.createElement('div');
    legR.className = 'bee-leg bee-leg--r';
    legR.append(pic());
    rig.append(legL, legR, body);
    el.append(rig);
    // the chair stays where it is when its speller goes to the microphone, or leaves
    const chair = document.createElement('div');
    chair.className = `bee-chair bee-chair--${spot.row}`;
    chair.style.setProperty('--x', spot.x);
    chair.style.setProperty('--y', spot.y);
    chair.dataset.seat = s.seat; chair.dataset.bx = spot.x; chair.dataset.by = spot.y;
    chair.classList.add('bee-item');
    chair.dataset.item = `chair-${s.seat}`;
    chair.dataset.label = `Chair ${s.tag}`;
    chair.innerHTML = CHAIR;
    hall.append(chair);
    if (s === mySeat) { const you = document.createElement('span'); you.className = 'pp-pill pp-pill--static bee-you'; you.textContent = 'You'; el.append(you); }
    el.setAttribute('aria-label', `Number ${s.tag}, ${nameOf(s)}`);
    hall.append(el);
    return el;
  });
  /** A seat's child becomes another drawing (a player's chosen speller, told by the live room). */
  function changeKid(seat, kid, swapping = false) {
    const f = KIDS[kid], el = kids[seat.seat];
    if (!f || !el) return;
    // no two spellers alike: whoever has this child already (not a player who chose it) takes this seat's
    const other = seats.find((x) => x !== seat && x.kid === kid);
    const was = seat.kid;
    seat.kid = kid;
    if (other && !swapping && was) changeKid(other, was, true);
    el.querySelectorAll('img').forEach((i) => { i.src = f.src; });
    el.style.setProperty('--tall', `var(--t-tall-${kid}, ${f.tall})`);
    el.style.setProperty('--hip', f.hip);
    el.style.setProperty('--knee', f.knee);
    el.style.setProperty('--hands', f.hands);
    el.dataset.kid = kid;
    el.dataset.label = `${KID_NAMES[kid] || kid} (every one)`;
    sitVars(el, kid);
    const nm = el.querySelector('.bee-tag-name');
    if (nm) nm.textContent = ownName(seat);
    el.setAttribute('aria-label', `Number ${seat.tag}, ${nameOf(seat)}`);
    setMouth(el, 0);
    const frown = el.querySelector('.bee-frown');
    if (frown) frown.style.cssText = `left:${f.mouth[0] - f.mouth[2] / 2}%;top:${f.mouth[1] - f.mouth[3] / 2}%;width:${f.mouth[2]}%;height:${f.mouth[3] * 1.6}%`;
    el.querySelectorAll('.bee-tear').forEach((t, n) => { t.style.left = `${f.eyes[n][0]}%`; t.style.top = `${f.eyes[n][1] + 1.6}%`; });
  }
  document.body.append(bd);
  document.body.classList.add('drill-nav-hidden');
  const warmEleven = () => {
    if (spellerVoice !== 'eleven') return;
    // every voice a girl or a boy speaks in: their children's sets, or the grown-up one
    // (only what was not already recorded at saving)
    Promise.all([settingsReady, savedClipsReady]).then(() => {
      for (const g of ['girl', 'boy']) for (const [ch, t] of Object.entries(LETTER_SAID[g])) for (const set of setsOfGender(g)) {
        if (SAVED_CLIPS[set]?.[ch]?.text !== elevenText(ch, t)) elevenUrl(elevenText(ch, t), set);
      }
    });
  };
  warmEleven();
  document.addEventListener('bee-voice', warmEleven);
  // everyone's bee: the saved sizes; the admin (or ?tune=1): the settings panel
  settingsReady.then(() => {
    if (gone) return;
    applySizes(hall, settings.sizes);
    applyItems(hall, settings.items);
    if (isAdminHere() || /[?&]tune=1\b/.test(location.search)) mountTuner(hall, $('.bee-top'), { say: (text, kid, ch = null) => {
      const g = genderOf(kid);
      if (ch != null && spellerVoice === 'eleven' && (LETTER_SAID[g][ch] || text !== DEFAULT_LETTER(ch))) {
        const who = VOICE_PICKS.eleven[kid] && LETTER_VOICES[VOICE_PICKS.eleven[kid]] ? VOICE_PICKS.eleven[kid]
          : KID_LETTER_SET[kid] && LETTER_VOICES[KID_LETTER_SET[kid]] ? KID_LETTER_SET[kid] : g;
        const shown = isIpa(text) ? DEFAULT_LETTER(ch) : text;     // the browser's fallback cannot read IPA
        elevenUrl(elevenText(ch, text), who).then((u) => spellerSays(shown, kid, u ? [{ url: u }] : letterClip(ch, kid), { letter: true }));
        return;
      }
      if (ch != null && isIpa(text)) text = DEFAULT_LETTER(ch);
      spellerSays(text, kid, ch != null ? letterClip(ch, kid) : null, { letter: ch != null });
    }, hush: () => spellerHush() });
  });
  if (!document.fullscreenElement) beeFullscreen();   // allowed only if the Start tap is still fresh
  // Came in some other way (a friend's code, the lobby's Start now): the first tap or key
  // anywhere in the bee takes it to the full screen. Not the exit or full-screen buttons.
  const firstTap = (e) => {
    if (e.target.closest?.('.bee-leave, .bee-full, .bee-voicebox')) return;
    bd.removeEventListener('pointerdown', firstTap, true);
    bd.removeEventListener('keydown', firstTap, true);
    if (!document.fullscreenElement) beeFullscreen();
  };
  bd.addEventListener('pointerdown', firstTap, true);
  bd.addEventListener('keydown', firstTap, true);

  /* ── Pace: 1 as it happens, less to catch up, 0 to skip to the end ── */
  let gone = false, skipping = false, pace = 1;
  const wait = (ms) => (gone || !pace ? Promise.resolve() : sleep(ms * pace));
  const say = (text) => { statusEl.textContent = text; };
  const who = (s) => `Number ${s.tag}, ${nameOf(s)}`;
  /* The TV shows the letters as Scrabble tiles: a cream tile each, the letter and its score.
     A tile that is new since the last time drops in; the ones already up stay still. */
  const SCORE = { a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10 };
  const norm1 = (c) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let shown = '';
  function tile(ch, cls = '') {
    const t = document.createElement('span');
    t.className = `bee-tile ${cls}`;
    if (ch === ' ') { t.classList.add('is-space'); return t; }
    const l = document.createElement('span');
    l.className = 'bee-tile-letter';
    l.textContent = ch === '_' ? '' : ch.toUpperCase();
    t.append(l);
    const pts = SCORE[norm1(ch)];
    if (pts) { const n = document.createElement('span'); n.className = 'bee-tile-score'; n.textContent = pts; t.append(n); }
    return t;
  }
  const showLetters = (typed, cls = '') => {
    typed = String(typed || '');
    lettersEl.className = `bee-letters bee-tiles ${cls}`;
    const keep = typed.startsWith(shown) && lettersEl.querySelector('.bee-tile') ? shown.length : 0;
    if (!keep) lettersEl.replaceChildren();
    else lettersEl.querySelectorAll('.bee-tile.is-caret').forEach((x) => x.remove());
    for (let i = keep; i < typed.length; i++) lettersEl.append(tile(typed[i], 'is-new'));
    if (cls.includes('is-mine')) lettersEl.append(tile('_', 'is-caret'));
    shown = typed;
    // nothing on the screen: the TV shows the Prep Spelling Bee
    hall.querySelector('.bee-tv')?.classList.toggle('is-idle', !typed && !cls.includes('is-mine'));
  };
  /* A spelling marked: every letter up to the first mistake green, the first wrong letter red,
     the letters after it as they were. A missing letter is a red gap where it should be. */
  function showMarked(typed, word) {
    hall.querySelector('.bee-tv')?.classList.remove('is-idle');
    const t = String(typed || ''), w = String(word || '');
    const norm = (c) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let bad = 0;
    while (bad < t.length && bad < w.length && norm(t[bad]) === norm(w[bad])) bad++;
    const right = bad >= t.length && t.length === w.length;
    // the tiles already up are kept, and coloured in turn: green, then the red one, then as they were
    showLetters(t);
    const tiles = [...lettersEl.querySelectorAll('.bee-tile')];
    tiles.forEach((x, i) => {
      const cls = right || i < bad ? 'is-ok' : i === bad ? 'is-bad' : '';
      if (cls) setTimeout(() => x.classList.add(cls), Math.min(i, 14) * 70);
    });
    if (!right && bad >= t.length) lettersEl.append(tile('_', 'is-bad is-gap is-new'));   // stopped short: the missing letter
    shown = '';
  }
  function pills() {
    roundEl.textContent = `Round ${bee.round}`;
    const n = bee.alive.length;
    leftEl.textContent = `${n} ${n === 1 ? 'speller' : 'spellers'} left`;
  }

  /* ── The spellers' voices: their own Kokoro recordings (data/spelling/speller-voices.js:
     a girl's voice and a boy's), each letter by name and the whole word. They are played
     ONE AFTER ANOTHER from a queue, so letters typed fast are all said, none cut off. A clip
     not recorded (yet) is said with the browser's voice instead. ── */
  const pad4 = (i) => String(i + 1).padStart(4, '0');
  const voiceOf = (kid) => {
    const pick = VOICE_PICKS.kokoro[kid];
    return pick && AUDIO.SPELLER_CLIPS?.[pick] ? pick : SPELLER_VOICES[KIDS[kid]?.girl ? 'girl' : 'boy'];
  };
  function spellerClip(kid, list, i) {
    const c = AUDIO.SPELLER_CLIPS?.[voiceOf(kid)]?.[list];
    return c && c.base && c.w.has(i) ? `${c.base}${pad4(i)}-w.mp3` : null;
  }
  /* A letter: the ElevenLabs recording, pitched up for a child (LETTER_VOICES), if that set
     has been made; else the Kokoro one; else (in next()) the browser's voice. */
  const ready = {};
  for (const who of Object.keys(lettersReady)) lettersReady[who].then((ok) => { ready[who] = ok; });
  function letterClip(ch, kid) {
    if (spellerVoice === 'browser') return [];
    const i = LETTER[ch.toLowerCase()];
    const who = KIDS[kid]?.girl ? 'girl' : 'boy';
    const list = [];
    if (spellerVoice === 'eleven') {
      // a child's voice for the small boy and the girls, once its set is on the site
      const picked = VOICE_PICKS.eleven[kid];
      const set = picked && ready[picked] ? picked : KID_LETTER_SET[kid] && ready[KID_LETTER_SET[kid]] ? KID_LETTER_SET[kid] : who;
      // a spelling changed on the chart (the girls' or the boys'): ElevenLabs saying that text in
      // this child's voice (once it has been made)
      const own = LETTER_SAID[who][ch.toLowerCase()];
      if (own) {
        const said = elevenText(ch, own), kept = SAVED_CLIPS[set]?.[ch.toLowerCase()];
        if (kept && kept.text === said) list.push({ url: kept.data });         // recorded when it was saved
        else {
          const live = elevenDone.get(`${set}|${said}`);
          if (live) list.push({ url: live }); else elevenUrl(said, set);
        }
      }
      if (i != null && ready[set]) list.push({ url: `/media/spelling-letters/${set}/${pad4(i)}.mp3`, pitch: LETTER_VOICES[set]?.pitch || 1 });
    }
    if (spellerVoice === 'kokoro' && SPELLER_RECORDINGS) { const k = spellerClip(kid, 'letters', i); if (k) list.push({ url: k }); }
    return list;
  }
  const wordClip = (q, kid) => (SPELLER_RECORDINGS && spellerVoice !== 'browser' ? spellerClip(kid, q.bank, q.i) : null);
  const queue = [];
  let talkingNow = null;            // the Audio (or utterance) playing
  const started = (item) => { if (item.onStart && !item.onStartDone) { item.onStartDone = true; item.onStart(); } };
  let speakingKid = null;           // the child at the microphone: their mouth moves as they speak
  /* The mouth opens once for each syllable of what is said (syllablesOf), the openings spread
     evenly over how long it is said: each opens and closes fully (a half sine) in its own slot,
     and after the last the mouth stays shut until the sound ends. */
  let talking = false, mouthRaf = 0, mouthO = 0, sylBeat = null;
  const mouthOn = (on, text = '', ms = 0) => {
    talking = on;
    speakingKid?.classList.toggle('is-talking', on);
    if (on) {
      const n = syllablesOf(text);
      sylBeat = { t0: performance.now(), n, slot: Math.max(160, (ms || n * 300) / n), amp: [] };
      for (let i = 0; i < n; i++) sylBeat.amp.push(0.7 + Math.random() * 0.3);
    } else sylBeat = null;
    if (!mouthRaf) mouthRaf = requestAnimationFrame(mouthTick);
  };
  function mouthTick(now) {
    mouthRaf = 0;
    if (!speakingKid) return;
    let goal = 0;
    if (talking && sylBeat) {
      // rAF's clock can read a touch EARLIER than performance.now() did at the start: before
      // the first syllable, the mouth simply waits (a negative slot once made it NaN for good)
      const k = (now - sylBeat.t0) / sylBeat.slot, i = Math.floor(k);
      // open for the first 65% of the syllable's slot, then fully shut, so each syllable is its
      // own flap and two never run together
      const ph = k - i;
      if (i >= 0 && i < sylBeat.n && ph < 0.65) goal = Math.sin((Math.PI * ph) / 0.65) * sylBeat.amp[i];
    }
    mouthO += (goal - mouthO) * 0.6;
    if (!Number.isFinite(mouthO)) mouthO = 0;
    setMouth(speakingKid, mouthO);
    if (talking || mouthO > 0.01) mouthRaf = requestAnimationFrame(mouthTick);
    else setMouth(speakingKid, 0);
  }
  function next() {
    talkingNow = null;
    mouthOn(false);
    if (gone || !pace) { queue.splice(0).forEach(started); return; }   // no time to speak: still show them
    const item = queue.shift();
    if (!item) return;
    started(item);
    // recordings to try in turn: [{ url, pitch? }] (a plain url string is one with no pitch)
    const tries = Array.isArray(item.url) ? item.url : item.url ? [{ url: item.url }] : [];
    if (tries.length) {
      const [first, ...rest] = tries;
      const a = liveClip(new Audio(first.url));
      // this speller's volume and pitch for the engine that made the recording (the settings)
      const engine = /raw\.githubusercontent/.test(first.url) ? 'kokoro' : 'eleven';
      const t = tuneOf(engine, item.kid);
      a.volume = Math.max(0, Math.min(1, t.vol));
      const rate = (first.pitch || 1) * t.pitch;
      if (Math.abs(rate - 1) > 0.001) {
        // higher AND a touch quicker, as a child's voice is: the pitch is not held
        a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false;
        a.playbackRate = rate;
      }
      talkingNow = a;
      a.__letter = !!item.letter;
      a.onplaying = () => { if (talkingNow === a) mouthOn(true, item.text, isFinite(a.duration) ? (a.duration * 1000) / (a.playbackRate || 1) : 0); };
      const fallBack = () => { if (talkingNow === a) { queue.unshift({ ...item, url: rest }); next(); } };
      a.onended = () => { if (talkingNow !== a) return; if (item.letter) afterLetter(a); else next(); };
      a.onerror = fallBack;
      a.play().catch(fallBack);
      return;
    }
    if (!synth) { setTimeout(next, 350); return; }
    try {
      // a letter is said as a sentence ("B."): a bare "B" is a fragment the voice stops short
      // on, a sentence it finishes with a full, falling end (the user: "It gets a quick cut off")
      const said = item.letter && !/[.!?]$/.test(item.text.trim()) ? `${item.text.trim()}.` : item.text;
      const u = new SpeechSynthesisUtterance(said);
      const v = voiceFor(item.kid);
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'en-GB';
      const bt = tuneOf('browser', item.kid);
      u.pitch = Math.max(0, Math.min(2, (BROWSER_VOICE[item.kid]?.pitch ?? (KIDS[item.kid]?.girl ? 1.55 : 1.3)) * bt.pitch));   // each child their own
      u.volume = Math.max(0, Math.min(1, bt.vol));
      // unhurried: a whole vowel, not a clipped one; a letter slower still (the user: "make it longer")
      const own = BROWSER_VOICE[item.kid]?.rate ?? 0.88;          // each child's own pace; letters slower still
      u.rate = item.letter ? LETTER_RATE * (own / 0.88) : own;
      talkingNow = u;
      u.__letter = !!item.letter;
      // the browser does not say how long it will take: about 0.3 s a syllable at rate 1
      u.onstart = () => { if (talkingNow === u) mouthOn(true, item.text, (syllablesOf(item.text) * 300) / u.rate); };
      u.onend = u.onerror = () => { if (talkingNow !== u) return; if (item.letter) afterLetter(u); else next(); };
      synth.speak(u);
    } catch { next(); }
  }
  // after each letter, a short silence before the next one (still busy, so nothing jumps ahead)
  function afterLetter(t) {
    mouthOn(false);
    setTimeout(() => { if (talkingNow === t) next(); }, LETTER_PAUSE_MS);
  }
  /** A speller says something: their recording(s) `url` (a url, or a list to try in turn), else `text` in the browser's voice. */
  function spellerSays(text, kid, url = null, { onStart = null, letter = false } = {}) {
    if (gone || !pace) { onStart?.(); return; }
    // one after another, each said in full: the next waits until the last has finished
    queue.push({ text, kid, url, onStart, letter });
    if (!talkingNow) next();
  }
  const spellerBusy = () => !!talkingNow || queue.length > 0;
  function spellerHush() {
    queue.length = 0;
    mouthOn(false);
    const t = talkingNow;
    talkingNow = null;
    try { if (t instanceof Audio) t.pause(); else if (t) synth?.cancel(); } catch { /* gone */ }
  }
  /** Wait for the speller to finish what is queued. */
  async function spellerDone(max = 30000) {
    const t0 = Date.now();
    await sleep(150);
    while (!gone && pace && spellerBusy() && Date.now() - t0 < max) await sleep(120);
  }
  /* The TV shows a letter only as the speller says it, and the next only once that one has
     been said in full: the letters typed are kept (`committed`, the answer) and come up on the
     screen at the pace of the voice. */
  let onScreen = '', screenCls = '';
  const reveal = (ch) => { onScreen += ch; showLetters(onScreen, screenCls); };
  function clearScreen(cls = '') { onScreen = ''; screenCls = cls; clearAnswer(); showLetters('', cls); }
  /* The right spelling, built tile by tile on a row ABOVE the speller's marked one (a miss). */
  let answerEl = null;
  function clearAnswer() { answerEl?.remove(); answerEl = null; }
  function answerRow() {
    clearAnswer();
    answerEl = document.createElement('p');
    answerEl.className = 'bee-letters bee-tiles bee-answer';
    answerEl.setAttribute('aria-label', 'The correct spelling');
    lettersEl.before(answerEl);
    hall.querySelector('.bee-tv')?.classList.remove('is-idle');   // the TV is showing a spelling, not the logo
    return answerEl;
  }
  /** A title on the TV ("SPELLING BEE", "ROUND 2"): its tiles drop in one after another. */
  function tvTitle(text, cls = '') {
    onScreen = ''; screenCls = '';
    showLetters('', '');
    showLetters(text, `is-title ${cls}`);
    lettersEl.querySelectorAll('.bee-tile').forEach((t, i) => { t.style.animationDelay = `${i * 80}ms`; });
    shown = '';                                   // the next spelling starts afresh
  }
  /* The big opening on the TV: it flickers on through static, the screen goes white, PrepBot
     pops up and welcomes everyone to the Prep Spelling Bee, the title lands, then the screen
     settles for the spelling. */
  /* PrepBot speaks on the TV: the line shows under him and his mouth moves while it is said. */
  /* PrepBot on the TV speaks in the teacher's voice (the lessons' Alice): `clip` is his line
     recorded in it (media/spelling-host/); without one, the judge's voice says it. */
  async function host(text, clip = null) {
    const tv = hall.querySelector('.bee-tv'), line = tv.querySelector('.bee-tv-host-line');
    const mouthEl = tv.querySelector('.bee-tv-host .bee-bot-mouth');
    const SHAPES = ['M24 48 L40 48', 'M25 47 Q32 50.5 39 47', 'M24.5 46 Q32 53 39.5 46', 'M27 46.5 Q32 52 37 46.5'];
    line.textContent = text;
    line.classList.remove('is-in'); void line.offsetWidth; line.classList.add('is-in');
    const flap = setInterval(() => { mouthEl.setAttribute('d', SHAPES[1 + Math.floor(Math.random() * 3)]); setTimeout(() => mouthEl.setAttribute('d', SHAPES[0]), 90); }, 190);
    let played = false;
    if (clip && pace) {
      played = await new Promise((resolve) => {
        try {
          hush();
          const a = liveClip(new Audio(clip));
          let done = false;
          const fin = (ok) => { if (!done) { done = true; resolve(ok); } };
          a.onended = () => fin(true);
          a.onerror = () => fin(false);
          a.play().catch(() => fin(false));
          setTimeout(() => fin(true), 12000);
          const stop = setInterval(() => { if (gone || !pace) { a.pause(); clearInterval(stop); fin(true); } }, 200);
          a.addEventListener('ended', () => clearInterval(stop));
        } catch { resolve(false); }
      });
    }
    if (!played) {
      sayWord(text, null, { rate: 0.98 });
      await sleep(400);
      for (let t = 0; t < 120 && isTalking() && !gone && pace; t++) await sleep(100);
    }
    clearInterval(flap); mouthEl.setAttribute('d', SHAPES[0]);
    await wait(250);
  }
  const HOST = (name) => `/media/spelling-host/${name}.mp3`;
  async function tvIntro() {
    const tv = hall.querySelector('.bee-tv');
    tv.classList.remove('is-idle');
    tv.classList.add('is-off');
    await wait(500);
    tv.classList.replace('is-off', 'is-glitch');      // static, rolling bars, a flicker
    if (pace) sfx.static(1.3);
    await wait(1300);
    // the picture comes up on the tutor's white curtain; PrepBot pops up in front and pulls it open
    const curtainBox = tv.querySelector('.bee-tv-curtain');
    curtainBox.replaceChildren();
    curtainBox.style.cssText = '';                    // open() leaves it faded out
    curtainBox.hidden = false;
    let drapes = null;
    try { drapes = makeCurtain(curtainBox); } catch { /* no curtain: straight to the picture */ }
    tv.classList.replace('is-glitch', 'is-white');
    await wait(500);
    tv.classList.add('is-host');                      // PrepBot pops up
    await wait(450);
    if (drapes && pace) { if (pace) sfx.swish(); await drapes.open(); }
    curtainBox.hidden = true;
    if (gone || !pace) return endIntro(tv);
    await host(`Hello, learners! Welcome to the ${BEE_NAME}!`, HOST(isMath ? 'math-welcome' : 'welcome'));
    if (gone || !pace) return endIntro(tv);
    await host(isMath ? 'One minute each at the pulpit. Answer as many questions as you can. The most correct answers wins.'
      : `${seats.length} spellers. Listen to your word, spell it letter by letter, and do not miss a single one.`, isMath ? HOST('math-rules') : seats.length === 5 ? HOST('rules-5') : null);
    if (gone || !pace) return endIntro(tv);
    await host('Are you ready? Let the bee begin!', HOST('ready'));
    tv.classList.add('is-title-card');                // the title lands under him
    sweep();
    await wait(1600);
    endIntro(tv);
  }
  function endIntro(tv) {
    tv.classList.add('is-glitch-out');
    setTimeout(() => tv.classList.remove('is-white', 'is-host', 'is-title-card', 'is-glitch', 'is-glitch-out', 'is-off'), 380);
  }
  /* The man on the panel speaks (the champion): the browser's voice, a man's where it has one,
     while he nods a little. Resolves when he has finished. */
  function judgeManSays(text, clip = null) {
    const judges = hall.querySelector('.bee-judges');
    return new Promise((resolve) => {
      if (!pace) { resolve(); return; }
      let ended = false;
      // his mouth: opening and shutting, by a different amount each time, while he is speaking
      const lips = judges.querySelector('.bee-jm-lips');
      const setOpen = (o) => drawJudgeLips(lips, o);
      let flap = 0, open = false;
      const startFlap = () => { if (flap) return; flap = setInterval(() => { open = !open; setOpen(open ? 0.45 + Math.random() * 0.55 : 0); }, 140); };
      const end = () => { if (ended) return; ended = true; clearInterval(flap); setOpen(0); judges.classList.remove('is-man-talking'); resolve(); };
      // his own recorded voice (media/spelling-judge); the browser's if it will not play
      if (clip) {
        try {
          hush();
          const a = liveClip(new Audio(clip));
          a.onplaying = () => { judges.classList.add('is-man-talking'); startFlap(); };
          a.onended = end;
          a.onerror = () => { clip = null; judges.classList.remove('is-man-talking'); speak(); };
          a.play().catch(() => { if (!ended) speak(); });
          setTimeout(end, 9000);
          return;
        } catch { /* the browser's voice, below */ }
      }
      speak();
      function speak() {
      if (!synth) { end(); return; }
      try {
        hush();
        const u = new SpeechSynthesisUtterance(text);
        const all = synth.getVoices().filter((v) => /^en[-_]?/i.test(v.lang));
        const v = all.find((x) => /\b(male|david|george|ryan|guy|daniel|mark|thomas|arthur|fred)\b/i.test(x.name) && !/female/i.test(x.name)) || all[0];
        if (v) { u.voice = v; u.lang = v.lang; }
        u.pitch = 0.85; u.rate = 0.92;
        u.onstart = () => { judges.classList.add('is-man-talking'); startFlap(); };
        u.onend = u.onerror = end;
        synth.speak(u);
        setTimeout(end, 1500 + text.length * 110);   // never wait for ever
      } catch { end(); }
      }
    });
  }
  /* The audience stand for the champion, one here and one there, and clap (the sound only; no
     hands), swaying a little as they do. */
  function ovation(seconds = 9) {
    const bodies = [...hall.querySelectorAll('.bee-aud-body')];
    bodies.forEach((b) => {
      if (Math.random() < 0.82) {
        b.style.setProperty('--up-d', `${(Math.random() * 1.6).toFixed(2)}s`);
        b.style.setProperty('--sway-d', `${(0.35 + Math.random() * 0.3).toFixed(2)}s`);
        b.classList.add('is-up');
      }
    });
    hall.classList.add('is-ovation');
    for (let t = 0; t < seconds; t += 2.2) setTimeout(() => { if (!gone) applause(2.6, 70); }, t * 1000);
    setTimeout(() => { hall.classList.remove('is-ovation'); bodies.forEach((b) => b.classList.remove('is-up')); }, seconds * 1000);
  }
  /* Confetti poured over the stage from above. */
  function confetti(count = 160) {
    const box = hall.querySelector('.bee-confetti');
    const colours = ['#f4c95d', '#f26a6a', '#6fe08a', '#7cc4f0', '#f28fb0', '#b48cf2', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const c = document.createElement('i');
      c.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;background:${colours[i % colours.length]};` +
        `animation-delay:${(Math.random() * 2.2).toFixed(2)}s;animation-duration:${(3 + Math.random() * 2.5).toFixed(2)}s;` +
        `--drift:${(Math.random() * 16 - 8).toFixed(1)}cqw;--spin:${Math.floor(360 + Math.random() * 720)}deg;` +
        `width:${(0.7 + Math.random() * 0.7).toFixed(2)}cqh;height:${(1.1 + Math.random() * 0.9).toFixed(2)}cqh`;
      box.append(c);
    }
    setTimeout(() => box.replaceChildren(), 8000);
  }
  /* PrepBot presents the award: the hall stands, he congratulates the champion on the TV, the
     trophy and the prize money come up, and confetti pours down on the stage. */
  async function award(champ) {
    const tv = hall.querySelector('.bee-tv');
    const name = ownName(champ);
    const bot = !champ.uid;                          // only a bot's fixed name is recorded
    sfx.drumroll(2.6);
    await judgeManSays(`Ladies and gentlemen, the champion of the ${BEE_NAME} is...`, `/media/spelling-judge/${isMath ? 'math-champion-is' : 'champion-is'}.mp3`);
    await wait(900);
    if (gone) return;
    sfx.fanfare();
    const playerName = bot ? null : await Promise.race([nameClips.get(champ) || Promise.resolve(null), sleep(4000).then(() => null)]);
    await judgeManSays(champ === mySeat ? `${name}! That is you!` : `${name}!`, bot ? `/media/spelling-judge/name-${champ.kid}.mp3` : playerName);
    if (gone) return;
    ovation(10);
    tv.classList.remove('is-idle');
    tv.classList.add('is-glitch');
    await wait(500);
    tv.classList.replace('is-glitch', 'is-white');
    tv.classList.add('is-host');
    await wait(600);
    // PrepBot never says a player's name (his voice is ElevenLabs): a congratulation without it
    if (isMath) await host(`Congratulations to our champion! You are the champion of the ${BEE_NAME}!`, HOST('math-champion'));
    else if (champ === mySeat) await host('Congratulations! You are the champion of the Prep Spelling Bee!', HOST('champion-you'));
    else if (bot) await host(`Congratulations, ${name}! You are the champion of the Prep Spelling Bee!`, HOST(`champion-${champ.kid}`));
    else await host('Congratulations to our champion! What a wonderful speller you are. You are the champion of the Prep Spelling Bee!', HOST('champion-player'));
    if (gone) return;
    tv.classList.add('is-award');
    confetti();
    sfx.pop();
    chime();
    await host('Here is your trophy, and your prize money: five thousand PrepCoins!', HOST('prize'));
    if (gone) return;
    await host('Well done, every speller. See you at the next bee!', HOST('goodbye'));
    await wait(1200);
    tv.classList.remove('is-white', 'is-host', 'is-award');
  }
  /* ══ THE MATH BEE ═══════════════════════════════════════════════════════
     Each contestant in turn stands at the pulpit for one minute. The judge reads a question (the
     TV shows it); they type the answer and press Enter; their voice says it, a bell says right or
     wrong, and the next question comes at once. The most correct answers in the minute wins (then
     the fewest wrong). Questions come from the drills' own seeded questions (the operations and
     tables chosen in the setup), each contestant their own run of them, the same on every screen. */
  const MATH_SECONDS = 60;
  const mathResults = new Map();   // seat -> { c, w }
  let mathRanking = [];
  const mathQ = (seat, i) => questionAt(seed, 50000 + seat.seat * 1000 + i, { operations, tables: sets });
  const spokenMaths = (t) => sayMaths(String(t).replace(/∛/g, 'the cube root of ').replace(/⁴√/g, 'the fourth root of ').replace(/[()]/g, ' '));
  // a number between 0 and 1 for (seat, n): the same on every device
  const seeded = (seat, n) => { const x = Math.sin((Number(seed) || 1) * 0.000137 + seat.seat * 97.13 + n * 12.9898) * 43758.5453; return x - Math.floor(x); };

  /* ── the TV: everything typeset by MathJax (the drills' own TeX: game.js toTex / texFor) ── */
  const qTex = (q) => { const b = q.tex || toTex(q.text); return /=|\\square|\?/.test(b) ? b : `${b} = \\,?`; };
  let shownKey = '';
  /* a bot's working: in a thought bubble over its head at the pulpit (not on the TV), a line at a time */
  /* a bot's working: a thought cloud over ITS head (it goes where the bot goes), a line at a time */
  const thoughts = new Map();     // the child's element -> their thought cloud
  const CLOUD = '<svg class="bee-think__shape" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true">'
    + '<path d="M38 96 C14 98 6 74 22 62 C10 44 28 24 50 30 C56 10 88 4 104 20 C118 4 150 8 154 30 C178 24 196 46 182 64 C198 78 186 102 162 98 C154 116 124 118 112 104 C98 118 66 118 58 102 C52 106 42 104 38 96 Z"/></svg>';
  /* setWork(lines, kid, on): that child's cloud shows `lines` (on: shown even empty, "..." while they
     start thinking); setWork([]) with no child puts every cloud away */
  function setWork(lines, kidEl, on = lines.length > 0) {
    if (!kidEl) { for (const t of thoughts.values()) { t.classList.remove('is-on'); t.querySelector('.bee-think__lines').replaceChildren(); } return; }
    let t = thoughts.get(kidEl);
    if (!t) {
      t = document.createElement('div');
      t.className = 'bee-think';
      t.setAttribute('aria-hidden', 'true');
      t.innerHTML = `<div class="bee-think__cloud">${CLOUD}<div class="bee-think__lines"></div></div>`
        + '<span class="bee-think__dot bee-think__dot--1"></span><span class="bee-think__dot bee-think__dot--2"></span><span class="bee-think__dot bee-think__dot--3"></span>';
      kidEl.append(t);
      thoughts.set(kidEl, t);
    }
    t.classList.toggle('is-right', kidEl.classList.contains('is-at-mic2'));
    const box = t.querySelector('.bee-think__lines');
    box.replaceChildren(...lines.flatMap((tex) => wrapTex(tex)).map((tex) => { const el = document.createElement('p'); drawMath(el, tex, ''); return el; }));
    t.classList.toggle('is-on', on);
    // still too wide for the cloud: drawn smaller (MathJax gives each line a viewBox)
    const room = parseFloat(getComputedStyle(box).fontSize) * 12;
    for (const svg of box.querySelectorAll('svg')) {
      const w = svg.getBoundingClientRect().width / (parseFloat(getComputedStyle(t).scale) || 1);
      if (w > room) { const r = svg.getBoundingClientRect(); svg.style.width = `${room}px`; svg.style.height = `${(r.height * room) / r.width}px`; }
    }
  }
  /* a TeX line too long for a cloud, broken into lines: words between words; maths before a +, a −,
     an = or a × at the top level (never inside a bracket or a fraction) */
  const texLen = (t) => t.replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '$1').replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}\s]/g, '').length;
  function wrapTex(tex, max = 18) {
    if (texLen(tex) <= max) return [tex];
    const words = /^\\text\{([^{}]*)\}$/.exec(tex);
    if (words) {
      const out = [];
      let cur = '';
      for (const w of words[1].split(' ')) { if (cur && `${cur} ${w}`.length > max) { out.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w; }
      if (cur) out.push(cur);
      return out.map((x) => `\\text{${x}}`);
    }
    const pieces = [];
    let depth = 0, start = 0;
    for (let k = 0; k < tex.length; k++) {
      const ch = tex[k];
      if (ch === '{' || ch === '(') depth++;
      else if (ch === '}' || ch === ')') depth--;
      else if (depth === 0 && k > start && tex[k - 1] === ' ' && (/[+=-]/.test(ch) || tex.startsWith('\\times', k))) { pieces.push(tex.slice(start, k).trim()); start = k; }
    }
    pieces.push(tex.slice(start).trim());
    const lines = [];
    let cur = '';
    for (const p of pieces) { if (cur && texLen(`${cur}${p}`) > max) { lines.push(cur); cur = p; } else cur = cur ? `${cur} ${p}` : p; }
    if (cur) lines.push(cur);
    return lines;
  }
  /* a cloud holding a drawing (the soroban), instead of lines */
  function setCloud(kidEl, html) {
    setWork([], kidEl, true);
    const t = thoughts.get(kidEl);
    if (t) t.querySelector('.bee-think__lines').innerHTML = html;
  }
  /* a bot works a question out in its cloud across its thinking time; returns stop() */
  function think(kidEl, tr) {
    if (tr.sor) return sorThink(kidEl, tr);
    if (tr.easy || !pace) return () => {};
    const lines = tr.ok ? working(tr.q) : [...setupLines(tr.q), texFor(tr.q, sanitizeFor(tr.q, tr.v))];
    const t0 = Date.now(), span = Math.max(1000, tr.dt * 1000 - 700);
    let shown = -1;
    setWork([], kidEl, true);
    const iv = setInterval(() => {
      const want = lines.filter((_, j) => Date.now() - t0 >= ((j + 1) * span) / (lines.length + 1)).length;
      if (want !== shown) { shown = want; setWork(lines.slice(0, shown), kidEl, true); }
    }, 90);
    return () => { clearInterval(iv); setWork([], kidEl, false); };
  }
  function showMath(q, typed, c, w) {
    const tv = hall.querySelector('.bee-tv');
    tv.classList.remove('is-idle');
    tv.classList.add('is-math-q');
    lastShow = [q, typed, c, w];
    const key = q ? `${q.text}|${q.hint || ''}` : '';
    if (key !== shownKey) {
      const tvm = $('.bee-tv-math'), fig = q ? geoFigure(q) : '';
      $('.bee-mfig').innerHTML = fig;                       // a geometry question comes with its diagram
      const fsvg = $('.bee-mfig svg');
      if (fsvg) {                                           // cropped to the drawing (labels and all), so it fills its card
        tvm.classList.add('has-fig');
        try { const b = fsvg.getBBox(); if (b.width && b.height) fsvg.setAttribute('viewBox', `${(b.x - 7).toFixed(1)} ${(b.y - 7).toFixed(1)} ${(b.width + 14).toFixed(1)} ${(b.height + 14).toFixed(1)}`); } catch { /* not drawn yet: as it comes */ }
      }
      tvm.classList.toggle('has-fig', !!fig);
      $('.bee-mh').textContent = q?.hint || '';
      drawMath($('.bee-mq'), q ? qTex(q) : '', q ? q.text : '');
      // drawn as plain text (MathJax not up yet): drawn again with MathJax as soon as it is
      shownKey = !q || $('.bee-mq svg') ? key : '';
      fitTV($('.bee-mq'));
      keepTvLit();
      setWork([]);
    }
    const t = q ? sanitizeFor(q, String(typed ?? '')) : '';
    drawMath($('.bee-ma'), t ? texFor(q, t) : '', t);
    fitTV($('.bee-ma'));
    fitTV($('.bee-mq'));                                   // a tall answer (a fraction) leaves the question less room
    $('.bee-ma').classList.toggle('is-empty', !t);
    $('.bee-mn').textContent = `${c} correct${w ? ` · ${w} wrong` : ''}`;
    if (q && !$('.bee-tv-math').classList.contains('is-duel')) pulpitScore(1, c);
  }
  /* the screen on the front of a pulpit: that contestant's score (a little jump when it goes up) */
  function pulpitScore(n, v) {
    const b = hall.querySelector(n === 2 ? '.bee-pulpit--2 .bee-pulpit-tv b' : '.bee-pulpit:not(.bee-pulpit--2) .bee-pulpit-tv b');
    if (!b) return;
    const was = b.textContent, now = v === '' || v == null ? '' : String(v);
    if (was === now) return;
    b.textContent = now;
    if (now !== '' && Number(now) > Number(was || 0)) { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); }
  }
  /* shrink a typeset line to the room the TV really has left for it: its width less the diagram's
     column, its height less the instruction, the answer and the count (never larger than drawn) */
  let lastShow = null;
  function fitTV(el) {
    el.style.height = ''; el.style.width = '';
    const svg = el.querySelector('svg');
    if (!svg) return;
    svg.style.width = ''; svg.style.height = '';
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const tvm = $('.bee-tv-math'), box = tvm.getBoundingClientRect(), cs = getComputedStyle(tvm);
    const fig = tvm.classList.contains('has-fig') ? $('.bee-mfig').getBoundingClientRect().width + parseFloat(cs.columnGap || 0) : 0;
    const roomW = (box.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - fig) * 0.96;
    let roomH = box.height * 0.2;
    if (el.classList.contains('bee-mq')) {
      const others = ['.bee-mh', '.bee-ma', '.bee-mn', '.bee-duel'].reduce((sum, k) => sum + ($(k)?.getBoundingClientRect().height || 0), 0);
      roomH = (box.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - others) * 0.92;
    }
    const k = Math.min(1, roomW / r.width, roomH / r.height);
    // the formula drawn smaller in place (it has a viewBox): nothing left hanging out of its box
    if (k < 1) { svg.style.width = `${r.width * k}px`; svg.style.height = `${r.height * k}px`; }
  }
  if (window.__beeTest) { window.__beeTest.show = (q, typed = '') => showMath(q, typed, 0, 0); window.__beeTest.q = () => lastShow?.[0] || null; window.__beeTest.cloud = (lines, n = 0) => setWork(lines, kids[n], true); }   // the tests' window onto the TV
  function hideMath() { shownKey = ''; setWork([]); pulpitScore(1, ''); pulpitScore(2, ''); hall.querySelector('.bee-tv').classList.remove('is-math-q', 'is-ok', 'is-bad'); }
  function mathFlash(ok) {
    const tv = hall.querySelector('.bee-tv');
    tv.classList.remove('is-ok', 'is-bad'); void tv.offsetWidth;
    tv.classList.add(ok ? 'is-ok' : 'is-bad');
  }

  /* ── the questions are HEARD, not read by anyone on stage (the user: "the children should just
     hear the questions"): a Kokoro voice, the next few fetched ahead; if Kokoro is not there or not
     ready in time, the browser's voice. Nobody's mouth moves. ── */
  const Q_VOICE = 'hf:af_heart';
  const spokenQ = (q) => spokenMaths(q.hint ? `${q.hint}. ${q.text}` : q.text);
  let readToken = 0, readAudio = null;
  function stopReading() {
    readToken++;
    if (readAudio) { try { readAudio.pause(); } catch { /* gone */ } readAudio = null; }
    try { synth?.cancel(); } catch { /* nothing to stop */ }
  }
  function prefetchQs(seat, from, n) { for (let k = from; k < from + n; k++) kokoroSays(spokenQ(mathQ(seat, k)), Q_VOICE); }
  function offstage(text) {
    if (!synth) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      const all = synth.getVoices().filter((v) => /^en[-_]?/i.test(v.lang));
      const v = all.find((x) => /female|zira|samantha|susan|hazel|libby|sonia|aria|jenny/i.test(x.name)) || all[0];
      if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = 1;
      synth.speak(u);
    } catch { /* no voice: the TV shows the question */ }
  }
  async function readAloud(text) {
    stopReading();
    if (!pace) return;
    const mine = readToken;
    const url = await Promise.race([kokoroSays(text, Q_VOICE), new Promise((r) => setTimeout(() => r(null), 1500))]);
    if (mine !== readToken || !pace) return;
    if (!url) { offstage(text); return; }
    const a = liveClip(new Audio(url));
    readAudio = a;
    a.play().catch(() => { if (mine === readToken) offstage(text); });
  }
  const readQuestion = (seat, i) => { prefetchQs(seat, i + 1, 3); readAloud(spokenQ(mathQ(seat, i))); };

  /* an answer typed: the reading stops, a bell says right or wrong (nobody says the answer aloud) */
  function answered(seat, v, ok) {
    stopReading();
    const kid = kids[seat.seat];
    const pulpit = hall.querySelector(kid?.dataset.pulpit === '2' ? '.bee-pulpit--2' : '.bee-pulpit:not(.bee-pulpit--2)');
    if (pulpit) {
      pulpit.classList.remove('is-ok', 'is-bad'); void pulpit.offsetWidth;
      pulpit.classList.add(ok ? 'is-ok' : 'is-bad');
      clearTimeout(pulpit._buzz);
      pulpit._buzz = setTimeout(() => pulpit.classList.remove('is-ok', 'is-bad'), 1100);
    }
    if (pace) { if (ok) chime(); else sfx.buzz(); }
    mathFlash(ok);
  }

  /* my minute: type, Enter, next */
  function myMath(seat) {
    return new Promise((resolve) => {
      const inp = $('.bee-math-input');
      let i = 0, c = 0, w = 0, q = null, over = false;
      const ask = () => { q = mathQ(seat, i); showMath(q, '', c, w); readQuestion(seat, i); };
      const onInput = () => {
        inp.value = sanitizeFor(q, inp.value.replace(/[\r\n]/g, ''));   // the drills' own cleaning, per kind of answer
        showMath(q, inp.value, c, w);
        try { room?.send('mtype', { s: seat.seat, i, v: inp.value }); } catch { /* the other screens just wait */ }
      };
      const onKey = (e) => {
        e.stopPropagation();
        if (e.key !== 'Enter' || over) return;
        e.preventDefault();
        const v = inp.value.trim();
        if (!v) return;
        const ok = answerIsRight(q, v);
        if (ok) c++; else w++;
        answered(seat, v, ok);
        try { room?.send('mans', { s: seat.seat, i, v, ok }); } catch { /* sent with the total at the end */ }
        i++;
        inp.value = '';
        ask();
      };
      inp.addEventListener('input', onInput);
      inp.addEventListener('keydown', onKey);
      inp.disabled = false;
      bd.classList.add('is-my-turn');
      ask();
      inp.focus();
      runClock(MATH_SECONDS, () => {
        over = true;
        stopReading();
        inp.removeEventListener('input', onInput);
        inp.removeEventListener('keydown', onKey);
        inp.disabled = true; inp.blur();
        bd.classList.remove('is-my-turn');
        const r = { u: me.uid, c, w };
        publish(1000 + seat.seat, r);
        resolve(r);
      });
    });
  }
  /* a bot's minute. Easy arithmetic is answered in a second or two; anything harder takes at least
     five seconds, the bot's working written out on the TV line by line as it thinks (bee-maths.js).
     How quick and how sure it is come from the seed, and so does every answer, so the count is the
     same on every screen; the screen plays it out. */
  function botPlan(seat) {
    const skill = 0.72 + seeded(seat, 1) * 0.24, quick = 0.8 + seeded(seat, 2) * 0.5;
    const plan = [];
    let t = 0;
    for (let i = 0; i < 80; i++) {
      const q = mathQ(seat, i), easy = isEasy(q), s = seeded(seat, 10 + i);
      const dt = easy ? (0.9 + s * 1.4) * quick : Math.max(5, (5 + s * 4) * quick);
      if (t + dt > MATH_SECONDS) break;
      t += dt;
      // never wrong (rushed or not): basic arithmetic, simple factorising (9x + 81) and expanding a bracket
      // (9(x - 3)); only the harder questions can go astray, as sure as the bot is
      const sure = easy || (q.answer && (q.answer.kind === 'factorise' || q.answer.kind === 'distribute'));
      const ok = sure || seeded(seat, 100 + i) < skill - 0.08;
      let v = answerText(q);
      if (!ok) { for (let n = i; n < i + 6; n++) { v = slip(q, n); if (!answerIsRight(q, sanitizeFor(q, v))) break; } }
      plan.push({ i, q, at: t, dt, easy, ok, v });
    }
    return { plan, r: { c: plan.filter((p) => p.ok).length, w: plan.filter((p) => !p.ok).length } };
  }
  async function botMath(seat) {
    const { plan, r } = botPlan(seat);
    if (!pace) return r;
    runClock(MATH_SECONDS);
    const start = Date.now();
    let c = 0, w = 0;
    for (const p of plan) {
      if (gone || !pace) break;
      showMath(p.q, '', c, w);
      readQuestion(seat, p.i);
      // the working: each line written down in turn across the thinking time. A wrong answer is never
      // thought right and typed wrong: the bot sets up, then its last thought is its own slip.
      const lines = p.easy ? [] : p.ok ? working(p.q) : [...setupLines(p.q), texFor(p.q, sanitizeFor(p.q, p.v))];
      const due = start + p.at * 1000, from = due - p.dt * 1000, span = Math.max(1000, p.dt * 1000 - 700);
      let shown = 0;
      if (!p.easy) setWork([], kids[seat.seat], true);
      while (Date.now() < due && !gone && pace) {
        const el = Date.now() - from;
        const want = lines.filter((_, j) => el >= ((j + 1) * span) / (lines.length + 1)).length;
        if (want !== shown) { shown = want; setWork(lines.slice(0, shown), kids[seat.seat], true); }
        await sleep(80);
      }
      if (gone || !pace) break;
      if (p.ok) c++; else w++;
      setWork([]);                                  // the thought is done: the answer goes up on the TV
      showMath(p.q, p.v, c, w);
      answered(seat, p.v, p.ok);
      await sleep(p.easy ? 350 : 900);
    }
    while (Date.now() < start + MATH_SECONDS * 1000 && !gone && pace) await sleep(120);
    setWork([]);
    stopReading();
    stopClock();
    return r;
  }
  /* another player's minute, from their screen's answers */
  function theirMath(seat) {
    const k = 1000 + seat.seat;
    if (results.has(k)) return Promise.resolve(results.get(k));
    return new Promise((resolve) => {
      let i = 0, c = 0, w = 0;
      const show = (typed = '') => showMath(mathQ(seat, i), typed, c, w);
      show(); readQuestion(seat, i);
      mathWatch = {
        seat,
        type: (p) => { if (p.i === i) show(String(p.v || '')); },
        ans: (p) => {
          if (p.i !== i) return;
          if (p.ok) c++; else w++;
          answered(seat, p.v, !!p.ok);
          i += 1; show(); readQuestion(seat, i);
        },
      };
      const started = Date.now();
      let watch = 0;
      const finish = (r) => { clearInterval(watch); stopReading(); stopClock(); mathWatch = null; resolve(r); };
      waiters.set(k, finish);
      runClock(MATH_SECONDS);
      // a player whose device has gone: the minute still ends, with what this screen saw
      watch = setInterval(() => {
        if (gone) { finish({ u: seat.uid, c, w }); return; }
        const sec = (Date.now() - started) / 1000;
        const seen = present.get(seat.uid);
        const away = sec > 8 && (!seen || Date.now() - seen > 15000);
        if ((sec > MATH_SECONDS + GRACE || away) && amArbiter(seat.uid)) publish(k, { u: seat.uid, c, w, to: 1 });
      }, 1000);
    });
  }
  /* ══ THE MATH BEE TOURNAMENT ════════════════════════════════════════════
     1. The qualifying round: everyone answers for one minute at once (each on their own TV); the
        table ranks them (most right, then fewest wrong); the top four go through.
     2. The knockout: 1st against 4th and 2nd against 3rd, then the final. Two contestants at two
        pulpits race the SAME questions: the first right answer takes the point, first to five wins.
        A wrong answer can be tried again (a player) or is the bot's last word on that question.
     A match with a player in it is kept by ONE device (the lowest uid of the players in it): it
     says when each question starts, takes the answers in the order they come and awards the
     points ('dq' / 'dans' / 'dpt', and 'dst' every three seconds); the result is published (key
     9000 + match). A match of two bots is worked out from the seed, the same on every screen. */
  /* ── THE SOROBAN TOURNAMENT (the room's `soroban` settings) ───────────────────────────────────
     The same tournament, with soroban sums: each point (and each qualifying sum) is a sum whose
     numbers flash one by one on the TV (as a soroban, figures or both); when the last has gone the
     contestants type the total, the first right one takes the point, first to 3. A bot thinks with
     a soroban in its cloud, its beads following the running total as the numbers flash (a bot that
     slips ends on its slip). Never on the screen of a player who is answering: it is the answer. */
  const isSor = !!soroban;
  const SOR = isSor ? { show: ['number'], tests: ['simple'], count: 10, digits: 1, speed: 1, delay: 1.5, ...soroban } : null;
  if (SOR && !(SOR.show || []).length) SOR.show = ['number'];
  const SOR_LEAD = 700;                                     // the blank before the first number
  const sorFlashMs = () => SOR_LEAD + termsOf(SOR) * SOR.speed * 1000 + (termsOf(SOR) - 1) * SOR.delay * 1000;
  const sorQ = (key, hint = '') => {
    const sum = sorobanSum(seed, key, SOR, operations);
    return { math: true, text: 'The total', tex: '\\text{The total} = \\,?', hint, answer: sum.answer, terms: sum.terms, sor: true };
  };
  // a wrong total a bot might give: one figure of the right one off by one
  const sorSlip = (ans, n) => {
    const str = String(ans), k = n % str.length, dgt = Number(str[k]);
    const nd = dgt === 9 ? 8 : dgt === 0 ? 1 : dgt + (n % 2 ? -1 : 1);
    return Number(str.slice(0, k) + nd + str.slice(k + 1)) || ans + 1;
  };
  // how sure and how quick a bot is at a soroban sum (more digits, more numbers, big friends: harder)
  function sorTry(seat, key, q) {
    const skill = 0.72 + seeded(seat, 1) * 0.24, quick = 0.8 + seeded(seat, 2) * 0.5;
    const d = SOR.digits, n = termsOf(SOR);
    const sure = Math.max(0.3, Math.min(0.97, skill + 0.2 - 0.06 * (d - 1) - 0.004 * n - ((SOR.tests || []).includes('big') ? 0.05 : 0)));
    const ok = seeded(seat, 8000 + key) < sure;
    const dt = sorFlashMs() / 1000 + (1 + d * 0.5 + n * 0.04) * quick * (0.6 + seeded(seat, 8500 + key) * 0.9);
    return { q, dt, ok, v: ok ? q.answer : sorSlip(q.answer, key), easy: false, sor: true };
  }
  /* the numbers, flashed on the TV one by one (with their signs), then gone */
  function flashOnTV(terms) {
    const screen = hall.querySelector('.bee-tv-screen');
    let el = screen.querySelector('.bee-tv-flash');
    if (!el) { el = document.createElement('div'); el.className = 'bee-tv-flash'; screen.append(el); }
    const tool = SOR.show.includes('tool'), fig = SOR.show.includes('number');
    const rods = Math.max(SOR.digits + 1, 3, ...terms.map((t) => String(Math.abs(t)).length));
    let alive = true;
    const done = (async () => {
      el.hidden = false; el.innerHTML = '';
      await sleep(SOR_LEAD);
      for (let k = 0; k < terms.length && alive && !gone; k++) {
        const n = terms[k], sign = k === 0 ? '' : n < 0 ? '−' : '+';
        el.innerHTML = `<div class="bee-flash-num${tool && fig ? ' is-both' : ''}">${sign ? `<span class="bee-flash-sign${n < 0 ? ' is-minus' : ''}">${sign}</span>` : ''}${tool ? sorobanSvg(Math.abs(n), rods) : ''}${fig ? `<span class="bee-flash-fig">${Math.abs(n)}</span>` : ''}</div>`;
        if (pace) sfx.tick();
        await sleep(SOR.speed * 1000);
        el.innerHTML = '';
        if (k < terms.length - 1) await sleep(SOR.delay * 1000);
      }
      el.hidden = true;
    })();
    return { done, stop: () => { alive = false; el.hidden = true; el.innerHTML = ''; } };
  }
  /* a bot's soroban in its cloud: the beads follow the running total as each number flashes */
  function sorThink(kidEl, tr) {
    if (!pace) return () => {};
    const terms = tr.q.terms;
    const rods = Math.max(SOR.digits + 1, 3, String(Math.abs(tr.q.answer)).length, String(Math.abs(tr.v)).length);
    const timers = [];
    const show = (v) => setCloud(kidEl, `<div class="bee-think__sor">${sorobanSvg(Math.max(0, v), rods)}</div>`);
    show(0);
    let total = 0;
    terms.forEach((t, j) => {
      const at = SOR_LEAD + j * (SOR.speed + SOR.delay) * 1000 + SOR.speed * 600;   // a moment into each number
      timers.push(setTimeout(() => { total += t; show(j === terms.length - 1 ? tr.v : total); }, at));
    });
    return () => { timers.forEach(clearTimeout); setWork([], kidEl, false); };
  }
  const CUP_POINTS = isSor ? 3 : 5, CUP_Q_SECONDS = isSor ? null : 20, CUP_MAX_Q = 40;
  const qSeconds = () => (isSor ? sorFlashMs() / 1000 + sorAnswerSeconds(SOR.digits) : CUP_Q_SECONDS);
  const cupQ = (m, i) => (isSor ? sorQ(20000 + m * 400 + i) : questionAt(seed, 70000 + m * 200 + i, { operations, tables: sets }));
  const cupName = (s) => `No. ${s.tag} ${nameOf(s)}`;
  const escH = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const roundName = (r, B) => ['Final', 'Semi-final', 'Quarter-final'][Math.log2(B) - 1 - r] || `Round ${r + 1}`;
  const roundsName = (r, B) => ['The final', 'The semi-finals', 'The quarter-finals'][Math.log2(B) - 1 - r] || `Round ${r + 1}`;
  const readCupQ = (m, i) => { if (!isSor) readAloud(spokenQ(cupQ(m, i))); };          // a soroban sum is flashed, not read
  const prefetchCup = (m, i) => { if (!isSor) kokoroSays(spokenQ(cupQ(m, i)), Q_VOICE); };
  const seedOf = new Map();         // seat -> their place in the qualifying table

  /* a bot's go at question i of match m: when it answers (seconds after the question), and right or not */
  function botTry(seat, m, i) {
    if (isSor) return sorTry(seat, 20000 + m * 400 + i, cupQ(m, i));
    const q = cupQ(m, i), easy = isEasy(q), s = seeded(seat, 5000 + m * 97 + i);
    const quick = 0.8 + seeded(seat, 2) * 0.5, skill = 0.72 + seeded(seat, 1) * 0.24;
    const sure = easy || (q.answer && (q.answer.kind === 'factorise' || q.answer.kind === 'distribute'));
    const dt = easy ? (0.9 + s * 1.4) * quick : Math.max(5, (5 + s * 4) * quick);
    const ok = sure || seeded(seat, 6000 + m * 97 + i) < skill - 0.08;
    let v = answerText(q);
    if (!ok) { for (let n = i; n < i + 6; n++) { v = slip(q, n); if (!answerIsRight(q, sanitizeFor(q, v))) break; } }
    return { q, dt, ok, v, easy };
  }
  /* two bots: every point worked out from the seed (the higher seed, side 0, wins a tie) */
  function simulateMatch(m, sides) {
    const sc = [0, 0], log = [];
    for (let i = 0; i < CUP_MAX_Q && Math.max(...sc) < CUP_POINTS; i++) {
      const tries = sides.map((s) => botTry(s, m, i));
      const right = tries.map((t, n) => ({ n, t })).filter((x) => x.t.ok).sort((a, b) => a.t.dt - b.t.dt);
      const win = right.length ? right[0].n : -1;
      if (win >= 0) sc[win]++;
      log.push({ i, tries, win, t: win >= 0 ? right[0].t.dt : Math.max(...tries.map((t) => t.dt)) });
    }
    return { w: sc[1] > sc[0] ? 1 : 0, sc };
  }

  /* ── the TV in a match: the question (and diagram) as ever; under it each side's name and answer,
     and the score between them. Kept above the heads of the two at the pulpits. ── */
  function showDuel(q, sides, sc, typed, st) {
    $('.bee-tv-math').classList.add('is-duel');
    showMath(q, '', 0, 0);
    sides.forEach((s, n) => {
      const el = $(`.bee-duel-side[data-side="${n}"]`);
      el.className = `bee-duel-side${st[n] ? ` is-${st[n]}` : ''}`;
      el.querySelector('.bee-duel-name').textContent = cupName(s);
      const t = q ? sanitizeFor(q, String(typed[n] || '')) : '';
      const a = el.querySelector('.bee-duel-ans');
      drawMath(a, t ? texFor(q, t) : '', t);
      const svg = a.querySelector('svg');
      if (svg) {
        const r = svg.getBoundingClientRect(), room = el.getBoundingClientRect().width * 0.95;
        if (r.width > room) { svg.style.width = `${room}px`; svg.style.height = `${(r.height * room) / r.width}px`; }
      }
    });
    $('.bee-duel-score').textContent = `${sc[0]} – ${sc[1]}`;
    pulpitScore(1, sc[0]); pulpitScore(2, sc[1]);
  }
  function duelOff() { $('.bee-tv-math').classList.remove('is-duel'); hideMath(); }

  /* ── the board over the hall: the qualifying table, then the bracket ── */
  async function showBoard(title, html, ms, after) {
    const el = $('.bee-cup');
    el.querySelector('.bee-cup-title').textContent = title;
    el.querySelector('.bee-cup-body').innerHTML = html;
    el.hidden = false;
    const web = el.querySelector('.bee-web');
    if (web) { await new Promise((r) => requestAnimationFrame(r)); drawWires(web); }
    if (after && pace) after(el);
    await wait(ms);
    el.hidden = true;
  }
  const face = (s, cls = '') => `<span class="pp-face ${cls}" style="${faceStyle(s.kid)}" aria-hidden="true"></span>`;

  /* the qualifying table: each contestant's face, a rank disc, a bar for their right answers, their
     wrong ones, and the line the top ones go through over */
  function tableHtml(table, B) {
    const top = Math.max(1, ...table.map((r) => r.c));
    const row = (r, n) => {
      const s = seats[r.seat];
      return `<li class="bee-qt-row${s === mySeat ? ' is-me' : ''}${r.through ? '' : ' is-out'}" style="--i:${n}">
        <span class="bee-qt-rank bee-qt-rank--${r.through ? Math.min(r.place, 4) : 'out'}">${r.place}</span>
        ${face(s, 'bee-qt-face')}
        <span class="bee-qt-who"><b>${escH(ownName(s))}${s === mySeat ? '<span class="bee-web-you">You</span>' : ''}</b><em>No. ${s.tag}</em></span>
        <span class="bee-qt-bar" aria-label="${r.c} right"><i style="--w:${((r.c / top) * 100).toFixed(1)}%"></i><b>${r.c}</b></span>
        <span class="bee-qt-wrong${r.w ? '' : ' is-none'}" aria-label="${r.w} wrong">${r.w} wrong</span>
        <span class="bee-qt-tag">${r.through ? 'Through' : 'Out'}</span>
      </li>`;
    };
    const through = table.filter((r) => r.through), out = table.filter((r) => !r.through);
    return `<ol class="bee-qt">${through.map(row).join('')}${out.length ? `<li class="bee-qt-cut" style="--i:${through.length}"><span>The top ${through.length} go through to the knockout</span></li>` : ''}${out.map((r, n) => row(r, through.length + 1 + n)).join('')}</ol>`;
  }

  /* the bracket (the web): every round's matches with each side's face, seed, name and score; the
     champion at the end; wires joining each match to the slot its winner goes to. opts.now marks the
     match about to be played; opts.just the one just played: its loser is crossed out and its winner
     flies along the wire into the next slot (the slot waits, empty, until they land). */
  function webHtml(rounds, B, opts = {}) {
    const total = Math.log2(B);
    const [jr, jj] = opts.just || [-1, -1];
    const pend = opts.just ? (jr + 1 < total ? `${jr + 1}-${jj >> 1}-${jj % 2}` : 'champ') : '';
    const slot = (mt, r, j, side) => {
      const s = mt[side ? 'b' : 'a'];
      const win = mt.w && s && s === mt.w, lose = mt.w && s && s !== mt.w;
      const key = `${r}-${j}-${side}`;
      const cls = ['bee-web-p', win && 'is-win', lose && 'is-lose', lose && r === jr && j === jj && 'is-cancel', s && s === mySeat && 'is-me', !s && 'is-empty', key === pend && 'is-pending'].filter(Boolean).join(' ');
      const inner = s ? `${face(s, 'bee-web-face')}<span class="bee-web-seed">${seedOf.get(s.seat)}</span><span class="bee-web-nm">${escH(ownName(s))}${s === mySeat ? '<span class="bee-web-you">You</span>' : ''}</span><span class="bee-web-sc">${mt.sc ? mt.sc[side] : ''}</span><span class="bee-web-x" aria-hidden="true">Out</span>`
        : '<span class="bee-web-face is-blank"></span><span class="bee-web-seed"></span><span class="bee-web-nm">to be decided</span><span class="bee-web-sc"></span>';
      return `<div class="${cls}" data-slot="${key}">${inner}</div>`;
    };
    const cols = [];
    for (let r = 0; r < total; r++) {
      const games = rounds[r].map((mt, j) => {
        const now = opts.now && opts.now[0] === r && opts.now[1] === j;
        return `<div class="bee-web-match${now ? ' is-now' : ''}${mt.w ? ' is-done' : ''}" data-m="${r}-${j}">${now ? '<span class="bee-web-live">Up next</span>' : ''}${slot(mt, r, j, 0)}${slot(mt, r, j, 1)}</div>`;
      }).join('');
      cols.push(`<div class="bee-web-col"><p class="bee-web-head">${roundsName(r, B)}</p><div class="bee-web-games">${games}</div></div>`);
    }
    const champ = rounds[total - 1][0].w;
    const ch = champ ? `${face(champ, 'bee-web-face')}<span class="bee-web-nm">${escH(nameOf(champ))}</span>` : '<span class="bee-web-face is-blank"></span><span class="bee-web-nm">?</span>';
    cols.push(`<div class="bee-web-col bee-web-col--champ"><p class="bee-web-head">Champion</p><div class="bee-web-games"><div class="bee-web-match bee-web-champ${champ ? ' is-done' : ''}" data-m="champ"><span class="bee-web-cup">${UI.trophy(22)}</span><div class="bee-web-p${champ ? ' is-win' : ' is-empty'}${pend === 'champ' ? ' is-pending' : ''}" data-slot="champ">${ch}</div></div></div></div>`);
    return `<div class="bee-web" style="--rounds:${total}"><svg class="bee-web-wires" aria-hidden="true"></svg>${cols.join('')}</div>`;
  }
  /* the wires: from each match to the slot its winner takes (elbows), lit once it is decided */
  function drawWires(web) {
    const svg = web.querySelector('.bee-web-wires'), box = web.getBoundingClientRect();
    svg.setAttribute('width', box.width); svg.setAttribute('height', box.height);
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    let paths = '';
    for (const m of web.querySelectorAll('.bee-web-match[data-m]:not([data-m="champ"])')) {
      const [r, j] = m.dataset.m.split('-').map(Number);
      const next = web.querySelector(`[data-slot="${r + 1}-${j >> 1}-${j % 2}"]`) || (!web.querySelector(`[data-m="${r + 1}-0"]`) ? web.querySelector('[data-slot="champ"]') : null);
      if (!next) continue;
      const a = m.getBoundingClientRect(), b = next.getBoundingClientRect();
      const x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top, x2 = b.left - box.left, y2 = b.top + b.height / 2 - box.top, xm = (x1 + x2) / 2;
      const lit = m.classList.contains('is-done');
      paths += `<path class="bee-web-wire${lit ? ' is-lit' : ''}" data-from="${m.dataset.m}" d="M${x1.toFixed(1)} ${y1.toFixed(1)} H${xm.toFixed(1)} V${y2.toFixed(1)} H${x2.toFixed(1)}"/>`;
    }
    svg.innerHTML = paths;
  }
  /* after a match: the loser crossed out (CSS), then the winner flies along the wire to their new slot */
  function advance(board, r, j) {
    const web = board.querySelector('.bee-web');
    const from = web?.querySelector(`[data-m="${r}-${j}"] .bee-web-p.is-win`);
    const to = web?.querySelector('.bee-web-p.is-pending');
    const wire = web?.querySelector(`.bee-web-wire[data-from="${r}-${j}"]`);
    if (wire) { wire.classList.remove('is-lit'); }
    if (!from || !to) return;
    setTimeout(() => {
      const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), o = board.getBoundingClientRect();
      const ghost = from.cloneNode(true);
      ghost.classList.add('bee-web-ghost');
      ghost.querySelector('.bee-web-sc')?.replaceChildren();
      Object.assign(ghost.style, { left: `${a.left - o.left}px`, top: `${a.top - o.top}px`, width: `${a.width}px`, height: `${a.height}px` });
      board.append(ghost);
      if (wire) wire.classList.add('is-lit', 'is-drawing');
      const dx = b.left - a.left, dy = b.top - a.top;
      ghost.animate([
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 14}px) scale(1.1)`, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(1)` },
      ], { duration: 1000, easing: 'cubic-bezier(.45, .05, .25, 1)', fill: 'forwards' }).finished.then(() => {
        to.classList.remove('is-pending');          // the slot already holds them, waiting to be shown
        to.classList.add('is-arrived');
        ghost.remove();
        if (to.dataset.slot === 'champ') chime();
      }).catch(() => ghost.remove());
    }, 1100);
  }

  /* ── the qualifying minute: another player's count, when it comes (a player gone: none) ── */
  /* the soroban qualifier: the Sums dial's sums, each flashed on the TV for everyone at once; type the
     total when the last number has gone. Bots think in their clouds (not while a player answers). */
  const sorQualSeconds = () => SOR.count * (sorFlashMs() / 1000 + sorAnswerSeconds(SOR.digits) + 1.6);
  function sorBotQual(seat) {
    let c = 0, w = 0;
    for (let k = 0; k < SOR.count; k++) { if (sorTry(seat, 30000 + k, sorQ(30000 + k)).ok) c++; else w++; }
    return { c, w };
  }
  async function sorQualifier() {
    const inp = $('.bee-math-input');
    let c = 0, w = 0, t = 0;
    for (let k = 0; k < SOR.count && !gone; k++) {
      const q = sorQ(30000 + k, `Sum ${k + 1} of ${SOR.count}`);
      showMath(q, '', c, w);
      const stops = mySeat ? [] : seats.filter((s) => !s.uid).map((s) => think(kids[s.seat], sorTry(s, 30000 + k, q)));
      const fl = flashOnTV(q.terms);
      await fl.done;
      if (gone) return null;
      if (mySeat) {
        const r = await new Promise((done) => {
          const t0 = Date.now();
          let fin = false;
          const end = (v) => { if (fin) return; fin = true; inp.removeEventListener('input', onIn); inp.removeEventListener('keydown', onK); inp.disabled = true; stopClock(); done({ v, ms: Date.now() - t0 }); };
          const onIn = () => { inp.value = sanitizeFor(q, inp.value); showMath(q, inp.value, c, w); };
          const onK = (e) => { e.stopPropagation(); if (e.key === 'Enter' && inp.value.trim()) { e.preventDefault(); end(inp.value.trim()); } };
          inp.value = ''; inp.disabled = false; inp.addEventListener('input', onIn); inp.addEventListener('keydown', onK); inp.focus();
          bd.classList.add('is-my-turn');
          runClock(sorAnswerSeconds(SOR.digits), () => end(null));
        });
        const ok = r.v != null && answerIsRight(q, r.v);
        if (ok) c++; else w++;
        t += r.ms;
        answered(mySeat, r.v ?? '', ok);
        showMath(q, r.v ?? '', c, w);
      } else await wait(sorAnswerSeconds(SOR.digits) * 1000);
      stops.forEach((f) => f());
      say(`Sum ${k + 1}: the total was ${q.answer}.`);
      await wait(1600);
    }
    bd.classList.remove('is-my-turn');
    const r = { u: me.uid, c, w, t };
    if (mySeat) publish(1000 + mySeat.seat, r);
    return r;
  }
  function waitQual(s) {
    const k = 1000 + s.seat;
    if (results.has(k)) return Promise.resolve(results.get(k));
    return new Promise((resolve) => {
      const started = Date.now();
      const iv = setInterval(() => {
        if (gone) { clearInterval(iv); resolve({ c: 0, w: 0 }); return; }
        if ((Date.now() - started) / 1000 > (isSor ? sorQualSeconds() : MATH_SECONDS) + GRACE && amArbiter(s.uid)) publish(k, { u: s.uid, c: 0, w: 0, to: 1 });
      }, 1000);
      waiters.set(k, (r) => { clearInterval(iv); resolve(r); });
    });
  }

  /* ── a match played out from the seed (two bots), on this screen ── */
  async function playSim(m, sides) {
    const sc = [0, 0];
    for (let i = 0; i < CUP_MAX_Q && Math.max(...sc) < CUP_POINTS; i++) {
      if (gone || !pace) break;
      const q = cupQ(m, i), tries = sides.map((s) => botTry(s, m, i));
      const typed = ['', ''], st = ['', ''];
      const draw = () => showDuel(q, sides, sc, typed, st);
      draw(); readCupQ(m, i); prefetchCup(m, i + 1);
      const flash = isSor ? flashOnTV(q.terms) : null;
      const stops = sides.map((s, n) => think(kids[s.seat], tries[n]));
      if (flash) stops.push(flash.stop);
      const t0 = Date.now();
      let win = -1;
      for (const n of [0, 1].sort((a, b) => tries[a].dt - tries[b].dt)) {
        while (Date.now() - t0 < tries[n].dt * 1000 && !gone && pace) await sleep(60);
        if (gone || !pace) break;
        stops[n]();
        typed[n] = tries[n].v; st[n] = tries[n].ok ? 'ok' : 'bad';
        answered(sides[n], tries[n].v, tries[n].ok);
        draw();
        if (tries[n].ok) { win = n; break; }
      }
      stops.forEach((f) => f());
      if (gone || !pace) break;
      if (win >= 0) { sc[win]++; st[win] = 'point'; }
      draw();
      await sleep(1300);
    }
    return simulateMatch(m, sides);         // the result is the seed's, whatever this screen got to see
  }

  /* ── a match with a player in it ── */
  function liveMatch(m, sides) {
    const k = 9000 + m;
    const boss = sides.filter((s) => s.uid).map((s) => s.uid).sort()[0];   // the device that keeps the score
    const iBoss = boss === me.uid;
    const mine = sides.indexOf(mySeat);                                     // -1: watching
    const inp = $('.bee-math-input');
    return new Promise((resolve) => {
      let i = -1, q = null, over = false, awarded = false, lastHeard = Date.now();
      const sc = [0, 0], typed = ['', ''], st = ['', ''];
      let stops = [], botTimers = [], qTimer = 0, nextTimer = 0, flashEnd = 0;
      const draw = () => { if (q) showDuel(q, sides, sc, typed, st); };
      const send = (type, p) => { try { room?.send(type, { m, ...p }); } catch { /* the others catch up on the next 'dst' */ } };
      const clear = () => { stops.forEach((f) => f()); stops = []; botTimers.forEach(clearTimeout); botTimers = []; clearTimeout(qTimer); clearTimeout(nextTimer); };
      function begin(n, s0) {
        if (over || n <= i) return;
        clear();
        i = n; q = cupQ(m, i); awarded = false; lastHeard = Date.now();
        if (s0) { sc[0] = s0[0]; sc[1] = s0[1]; }
        typed[0] = typed[1] = ''; st[0] = st[1] = '';
        draw(); readCupQ(m, i); prefetchCup(m, i + 1); prefetchCup(m, i + 2);
        if (isSor) { const fl = flashOnTV(q.terms); stops.push(fl.stop); flashEnd = Date.now() + sorFlashMs(); }
        sides.forEach((s, side) => {
          if (s.uid) return;
          const tr = botTry(s, m, i);
          // a player racing this bot never sees its working (it would give the answer away)
          if (mine < 0) stops.push(think(kids[s.seat], tr));
          if (iBoss) botTimers.push(setTimeout(() => take(side, tr.v, tr.ok, true), tr.dt * 1000));
        });
        if (mine >= 0) {
          inp.value = '';
          // a soroban sum: the box opens when the last number has gone
          const open = () => { if (!over && !awarded) { inp.disabled = false; inp.focus(); } };
          if (isSor) { inp.disabled = true; botTimers.push(setTimeout(open, sorFlashMs())); } else open();
        }
        if (iBoss) qTimer = setTimeout(() => point(-1), qSeconds() * 1000);
      }
      function shown(side, v, ok) {
        typed[side] = String(v); st[side] = ok ? 'ok' : 'bad';
        if (!sides[side].uid) setWork([], kids[sides[side].seat], false);
        answered(sides[side], v, ok);
        draw();
      }
      // the score keeper: an answer, in the order they come
      function take(side, v, ok, tell) {
        if (over || awarded) return;
        shown(side, v, ok);
        if (tell) send('dans', { i, side, v, ok });
        if (ok) point(side);
      }
      function scored(side) {
        if (side >= 0) st[side] = 'point';
        else if (pace) say('Nobody has it: the next question.');
        draw();
      }
      function point(side) {
        if (over || awarded) return;
        awarded = true; clear();
        if (side >= 0) sc[side]++;
        send('dpt', { i, side, sc: [...sc] });
        scored(side);
        nextTimer = setTimeout(() => {
          if ((side >= 0 && sc[side] >= CUP_POINTS) || i + 1 >= CUP_MAX_Q) { publish(k, { w: sc[1] > sc[0] ? 1 : 0, sc: [...sc] }); return; }
          send('dq', { i: i + 1, sc: [...sc] });
          begin(i + 1);
        }, 1400);
      }
      // me at a pulpit: type, Enter (a wrong answer may be tried again)
      const onInput = () => {
        if (!q || awarded) return;
        inp.value = sanitizeFor(q, inp.value.replace(/[\r\n]/g, ''));
        typed[mine] = inp.value; st[mine] = '';
        draw();
        send('dtype', { i, side: mine, v: inp.value });
      };
      const onKey = (e) => {
        e.stopPropagation();
        if (e.key !== 'Enter' || over || awarded || !q || Date.now() < flashEnd) return;
        e.preventDefault();
        const v = inp.value.trim();
        if (!v) return;
        const ok = answerIsRight(q, v);
        if (iBoss) take(mine, v, ok, true);
        else { shown(mine, v, ok); send('dans', { i, side: mine, v, ok }); }
        if (!ok) inp.value = '';
      };
      if (mine >= 0) { inp.addEventListener('input', onInput); inp.addEventListener('keydown', onKey); bd.classList.add('is-my-turn'); }
      duelWatch = {
        m,
        dq: (p) => { lastHeard = Date.now(); if (!iBoss) begin(p.i, p.sc); },
        dst: (p) => { lastHeard = Date.now(); if (!iBoss && p.i > i) begin(p.i, p.sc); },
        dans: (p) => {
          lastHeard = Date.now();
          if (p.i !== i) return;
          if (iBoss) { if (sides[p.side]?.uid && p.side !== mine) take(p.side, p.v, !!p.ok, false); }
          else if (p.side !== mine) shown(p.side, p.v, !!p.ok);
        },
        dpt: (p) => {
          lastHeard = Date.now();
          if (iBoss || p.i !== i) return;
          awarded = true; clear();
          if (Array.isArray(p.sc)) { sc[0] = p.sc[0]; sc[1] = p.sc[1]; }
          scored(p.side);
        },
        dtype: (p) => { if (p.i === i && p.side !== mine && !awarded) { typed[p.side] = String(p.v || ''); st[p.side] = ''; draw(); } },
      };
      const beat = iBoss ? setInterval(() => send('dst', { i, sc: [...sc] }), 3000) : 0;
      // the score keeper's device gone: after a while, the match goes to the other side
      const watch = setInterval(() => {
        if (gone) { finish({ w: 0, sc: [...sc] }); return; }
        if (iBoss || Date.now() - lastHeard < 25000) return;
        const seen = present.get(boss);
        if ((!seen || Date.now() - seen > 15000) && amArbiter(boss)) publish(k, { w: sides.findIndex((s) => s.uid === boss) === 0 ? 1 : 0, sc: [...sc], to: 1 });
      }, 1000);
      function finish(r) {
        if (over) return;
        over = true;
        clear(); clearInterval(beat); clearInterval(watch);
        duelWatch = null;
        if (mine >= 0) { inp.removeEventListener('input', onInput); inp.removeEventListener('keydown', onKey); inp.disabled = true; inp.blur(); bd.classList.remove('is-my-turn'); }
        resolve(r);
      }
      if (results.has(k)) { finish(results.get(k)); return; }
      waiters.set(k, finish);
      if (iBoss) setTimeout(() => { if (!over) { send('dq', { i: 0, sc: [0, 0] }); begin(0); } }, 900);
    });
  }

  /* ── one match: both to their pulpits, the race, back to their chairs ── */
  async function playMatch(m, sides, title) {
    const humans = sides.filter((s) => s.uid);
    pace = skipping && !humans.length ? 0 : 1;
    settle();
    if (!pace) return simulateMatch(m, sides);
    say(`${title}: ${who(sides[0])} against ${who(sides[1])}. First to ${CUP_POINTS}.${isSor ? ' Watch the screen, then type the total.' : ''}`);
    sweep();
    tvTitle(title.toUpperCase(), 'is-round');
    for (let n = 0; n < 3; n++) prefetchCup(m, n);
    await Promise.all([walk(kids[sides[0].seat], 'mic'), walk(kids[sides[1].seat], 'mic2')]);
    if (gone) return { w: 0, sc: [0, 0] };
    clearScreen();
    const res = humans.length ? await liveMatch(m, sides) : await playSim(m, sides);
    if (gone) return res;
    setWork([]);
    duelOff();
    const w = sides[res.w];
    say(`${who(w)} wins, ${Math.max(...res.sc)} to ${Math.min(...res.sc)}.`);
    if (pace) { chime(); await wait(1800); }
    // the winner back to their chair; the loser leaves the stage
    await Promise.all(sides.map((s) => walk(kids[s.seat], s === w ? 'seat' : 'off')));
    return res;
  }

  async function mathCup() {
    loadMath().then((ok) => { if (ok && lastShow && !gone) { shownKey = ''; showMath(...lastShow); } });
    for (const s of seats) prefetchQs(s, 0, 2);
    const B = seats.length >= 8 ? 8 : seats.length >= 4 ? 4 : 2;
    // 1. the qualifying minute, everyone at once
    if (!gone && pace) {
      say(isSor ? `The qualifying round: ${SOR.count} soroban sums on the screen, everyone at once. Type each total when the last number has gone. The top ${B} go through.` : `The qualifying round: one minute, everyone at once. The top ${B} go through to the knockout.`);
      sweep(); tvTitle('QUALIFYING', 'is-round'); await wait(2600);
    }
    clearScreen();
    const quals = await Promise.all(seats.map((s) => (s === mySeat ? (isSor ? sorQualifier() : myMath(s)) : s.uid ? waitQual(s) : Promise.resolve(isSor ? sorBotQual(s) : botPlan(s).r))));
    if (gone) return;
    hideMath(); stopClock(); clearScreen();
    seats.forEach((s, n) => mathResults.set(s.seat, { c: (quals[n] || {}).c || 0, w: (quals[n] || {}).w || 0 }));
    const table = seats.map((s) => ({ seat: s.seat, ...mathResults.get(s.seat) }))
      .sort((a, b) => b.c - a.c || a.w - b.w || a.seat - b.seat)
      .map((r, n) => ({ ...r, place: n + 1, through: n < B }));
    table.forEach((r) => seedOf.set(r.seat, r.place));
    if (pace) { chime(); readAloud('The qualifying table.'); }
    await showBoard('The qualifying table', tableHtml(table, B), 9000);
    const notThrough = table.filter((r) => !r.through);
    notThrough.forEach((r) => kids[r.seat].classList.add('is-out'));
    if (notThrough.length && pace) say(notThrough.length === 1 ? `${who(seats[notThrough[0].seat])} leaves the stage.` : 'The ones who did not qualify leave the stage.');
    await Promise.all(notThrough.map((r) => walk(kids[r.seat], 'off')));
    // 2. the knockout: 1 v 4 and 2 v 3 (1 v 8, 4 v 5, 2 v 7, 3 v 6 in a bracket of eight)
    const seeds = table.slice(0, B).map((r) => seats[r.seat]);
    const order = B === 8 ? [[0, 7], [3, 4], [1, 6], [2, 5]] : B === 4 ? [[0, 3], [1, 2]] : [[0, 1]];
    const total = Math.log2(B);
    const rounds = [order.map(([a, b]) => ({ a: seeds[a], b: seeds[b], w: null, sc: null }))];
    for (let r = 1; r < total; r++) rounds.push(Array.from({ length: B / 2 ** (r + 1) }, () => ({ a: null, b: null, w: null, sc: null })));
    let m = 0;
    for (let r = 0; r < total; r++) {
      for (let j = 0; j < rounds[r].length; j++) {
        const mt = rounds[r][j];
        if (gone) return;
        // nothing more can happen to a player: offer the end
        skipBtn.hidden = skipping || seats.some((s) => s.uid && !kids[s.seat].classList.contains('is-out'));
        await showBoard(roundsName(r, B), webHtml(rounds, B, { now: [r, j] }), 4500);
        const res = await playMatch(m++, [mt.a, mt.b], roundName(r, B));
        if (gone) return;
        mt.w = res.w === 0 ? mt.a : mt.b;
        mt.sc = res.sc;
        kids[(mt.w === mt.a ? mt.b : mt.a).seat].classList.add('is-out');
        if (r + 1 < total) rounds[r + 1][j >> 1][j % 2 ? 'b' : 'a'] = mt.w;
        await showBoard(roundsName(r, B), webHtml(rounds, B, { just: [r, j] }), 6000, (board) => advance(board, r, j));
      }
    }
    const champ = rounds[total - 1][0].w;
    // the placings: how far each got, then the qualifying table (losers of a round share a place)
    const depth = new Map(table.map((r) => [r.seat, -1]));
    const label = new Map(table.map((r) => [r.seat, `Qualifying: ${r.c} right`]));
    rounds.forEach((rd, ri) => rd.forEach((mt) => {
      const loser = mt.w === mt.a ? mt.b : mt.a;
      depth.set(loser.seat, ri);
      label.set(loser.seat, ri === rounds.length - 1 ? `Runner-up, ${mt.sc[0]}–${mt.sc[1]}` : `Out in the ${roundName(ri, B).toLowerCase()}`);
    }));
    depth.set(champ.seat, rounds.length);
    label.set(champ.seat, 'Champion');
    mathRanking = table.map((r) => ({ ...r, d: depth.get(r.seat), label: label.get(r.seat) }))
      .sort((a, b) => b.d - a.d || a.place - b.place)
      .map((r, _, all) => ({ ...r, place: 1 + all.filter((x) => x.d > r.d).length + (r.d === -1 ? all.filter((x) => x.d === -1 && seedOf.get(x.seat) < seedOf.get(r.seat)).length : 0) }));
    pace = 1; settle();
    skipBtn.hidden = true;
    stopClock(); clearScreen();
    await showBoard('The champion', webHtml(rounds, B), 3500);
    kids[champ.seat].classList.remove('is-out');
    kids[champ.seat].classList.add('is-champion');
    say(`${who(champ)} wins the tournament!`);
    sweep();
    tvTitle('CHAMPION', 'is-round');
    chime();
    await walk(kids[champ.seat], 'mic');
    if (!gone) await award(champ);
    if (!gone) showMathResults(champ);
  }

  async function mathBee() {
    loadMath().then((ok) => { if (ok && lastShow && !gone) { shownKey = ''; showMath(...lastShow); } });
    if (seats[0]) prefetchQs(seats[0], 0, 3);
    if (!gone && pace) { say('One minute each.'); sweep(); tvTitle('ONE MINUTE', 'is-round'); await wait(2200); }
    clearScreen();
    for (const seat of seats) {
      if (gone) return;
      const el = kids[seat.seat], k = 1000 + seat.seat;
      const behind = results.has(k) && seat.uid && seat.uid !== me.uid;
      pace = skipping ? 0 : behind ? 0.12 : 1;
      settle();
      // only bots left to go: nothing more can happen to a real player, so offer the end
      skipBtn.hidden = skipping || seats.slice(seat.seat).some((s) => s.uid);
      prefetchQs(seat, 0, 3);
      if (seats[seat.seat + 1]) prefetchQs(seats[seat.seat + 1], 0, 2);
      say(`${who(seat)}, to the pulpit.`);
      speakingKid = el;
      await walk(el, 'mic');
      if (gone) return;
      if (pace) await judgeManSays('You have one minute. Here is your first question.', '/media/spelling-judge/math-start.mp3');
      const r = seat === mySeat ? await myMath(seat) : seat.uid ? await theirMath(seat) : await botMath(seat);
      if (gone) return;
      mathResults.set(seat.seat, { c: r.c || 0, w: r.w || 0 });
      hideMath();
      clearScreen();
      say(`${who(seat)}: ${r.c || 0} correct.`);
      if (pace) { await judgeManSays('Time!', '/media/spelling-judge/math-time.mp3'); readAloud(`${r.c || 0} correct.`); await wait(1500); }
      await walk(el, 'seat');
    }
    // the ranking: most correct, then fewest wrong
    mathRanking = seats.map((s) => ({ seat: s.seat, ...(mathResults.get(s.seat) || { c: 0, w: 0 }) }))
      .sort((a, b) => b.c - a.c || a.w - b.w || a.seat - b.seat)
      .map((r, n) => ({ ...r, place: n + 1 }));
    const champ = seats[mathRanking[0].seat];
    pace = 1; settle();
    skipBtn.hidden = true;
    stopClock(); clearScreen();
    kids[champ.seat].classList.add('is-champion');
    say(`${who(champ)} is the champion, with ${mathRanking[0].c} correct!`);
    sweep();
    tvTitle('CHAMPION', 'is-round');
    chime();
    await walk(kids[champ.seat], 'mic');
    if (!gone) await award(champ);
    if (!gone) showMathResults(champ);
  }
  function showMathResults(champ) {
    $('.bee-results-title').textContent = champ === mySeat ? 'You are the champion!' : `Champion: number ${champ.tag}, ${nameOf(champ)}`;
    const list = $('.bee-results-list');
    for (const p of mathRanking) {
      const s = seats[p.seat];
      const li = document.createElement('li');
      li.className = `bee-results-row${s === mySeat ? ' is-me' : ''}${p.place === 1 ? ' is-champion' : ''}`;
      const place = document.createElement('span');
      place.className = 'bee-results-place';
      if (p.place === 1) place.innerHTML = UI.trophy(20); else place.textContent = p.place;
      const name = document.createElement('span');
      name.className = 'bee-results-name';
      name.textContent = `No. ${s.tag} ${nameOf(s)}`;
      const meta = document.createElement('span');
      meta.className = 'bee-results-meta';
      meta.textContent = p.label || `${p.c} correct${p.w ? `, ${p.w} wrong` : ''}`;
      li.append(place, name, meta);
      list.append(li);
    }
    $('.bee-results').hidden = false;
    $('.bee-results-close').addEventListener('click', () => leave({ place: myPlace(), champion: champ, placings: mathRanking }));
    $('.bee-results-close').focus();
  }

  /** A light sweeps across the stage (a new round). */
  function sweep() {
    hall.classList.remove('is-sweep');
    void hall.offsetWidth;
    hall.classList.add('is-sweep');
    setTimeout(() => hall.classList.remove('is-sweep'), 1600);
  }
  /** Say (and then show) the letters of `after` that are not in `before` (letters are only ever added). */
  function sayNewLetters(before, after, kid) {
    if (!after.startsWith(before)) before = '';
    for (const ch of after.slice(before.length)) spellerSays(letterName(ch, kid), kid, letterClip(ch, kid), { onStart: () => reveal(ch), letter: true });
  }

  /* ── The live room ───────────────────────────────────────────── */
  const results = new Map();       // k -> { u, ok, t }
  const waiters = new Map();       // k -> resolve
  const present = new Map();       // uid -> last seen (ms)
  let room = null;
  let nowK = -1, nowQ = null;      // the turn on this screen
  let theirTyping = null;          // (v) => void, while somebody else is spelling
  let mathWatch = null;            // { seat, ans(p), type(p) }, while somebody else is at the pulpit
  let duelWatch = null;            // { m, dq(p), dans(p), dpt(p), dtype(p), dst(p) }, during a tournament match
  function land(k, r) {
    if (results.has(k)) return;
    results.set(k, r);
    const w = waiters.get(k);
    if (w) { waiters.delete(k); w(r); }
  }
  const publish = (k, r) => { land(k, r); try { room?.state.patch({ [`r${k}`]: r }); room?.state.flush(); } catch { /* offline: this device still plays on */ } };
  const joined = openRoom({ ns: 'bee', code: roomId, me: { id: idFor(me.uid), name: me.name } }).then((r) => {
    if (gone) { r.leave(); return; }
    room = r;
    r.presence.set({ seat: mySeat ? mySeat.seat : -1, kid: myKid });
    r.on('presence', (people) => {
      const t = Date.now();
      for (const p of people) {
        const uid = String(p.id).split(':')[0];
        present.set(uid, t);
        // another player's chosen speller: their seat takes that drawing
        const seat = seats.find((s) => s.uid === uid);
        if (seat && seat !== mySeat && p.kid && KIDS[p.kid] && seat.kid !== p.kid) changeKid(seat, p.kid);
      }
    });
    r.on('state', (s) => { for (const [key, v] of Object.entries(s || {})) { const m = /^r(\d+)$/.exec(key); if (m && v) land(Number(m[1]), v); } });
    r.on('spell', (p) => { if (p && p.k === nowK && theirTyping) theirTyping(String(p.v || '')); });
    r.on('ask', (p) => { if (p && p.k === nowK && nowQ) speak(p.kind); });
    r.on('mans', (p) => { if (p && mathWatch && p.s === mathWatch.seat.seat) mathWatch.ans(p); });
    r.on('mtype', (p) => { if (p && mathWatch && p.s === mathWatch.seat.seat) mathWatch.type(p); });
    for (const kind of ['dq', 'dans', 'dpt', 'dtype', 'dst']) r.on(kind, (p) => { if (p && duelWatch && p.m === duelWatch.m) duelWatch[kind]?.(p); });
  }).catch((e) => console.warn('[bee] no live room; playing on this device only:', e));
  const beat = setInterval(() => { try { room?.presence.set({ seat: mySeat ? mySeat.seat : -1, kid: myKid }); } catch { /* ignore */ } }, 5000);
  /** Am I the one device that calls a silent turn? The lowest uid here, not counting the speller. */
  function amArbiter(spellerUid) {
    const t = Date.now();
    const here = [...present].filter(([u, at]) => u !== spellerUid && t - at < 12000).map(([u]) => u);
    if (!here.includes(me.uid)) here.push(me.uid);
    return here.sort()[0] === me.uid;
  }

  /* ── The head judge's voice (every device plays it: it is the hall's) ── */
  function speak(kind) {
    if (gone || !pace || !nowQ || !canSpeak) return;
    const q = nowQ;
    if (kind === 'w') sayWord(q.word, judge, { clip: clipFor(q.bank, q.i, 'w'), ipa: q.ipa });
    else if (kind === 'd') sayWord(q.def, judge, { rate: 0.95, clip: clipFor(q.bank, q.i, 'd') });
    else if (kind === 's') sayWord(q.use, judge, { rate: 0.95, clip: clipFor(q.bank, q.i, 's') });
    else if (kind === 'o') sayWord(q.about, judge, { rate: 0.95, clip: clipFor(q.bank, q.i, 'o') });
  }
  /** "Your word is," / "Correct." / "Incorrect.": the judge's own lines. */
  /* After "Incorrect": the head judge spells the word ("The correct spelling is: B. L. A. N. K.
     Blank.") while the TV shows it, tile by tile, in green. */
  async function judgeSpells(word, q = null) {
    const letters = [...String(word)];
    const names = letters.map((ch) => { const n = DEFAULT_LETTER(ch); return /[.!?]$/.test(n) ? n : `${n}.`; });
    say(`The judge: "The correct spelling is ${letters.join(' ').toUpperCase()}."`);
    const row = answerRow();                          // the speller's marked try stays, under it
    // in her own Kokoro voice when every piece is recorded: the phrase, each letter, the word
    const jl = AUDIO.SPELLER_CLIPS?.[JUDGE_KOKORO]?.letters;
    const letterAt = (ch) => { const i = LETTER[ch.toLowerCase()]; return jl && jl.base && i != null && jl.w.has(i) ? `${jl.base}${pad4(i)}-w.mp3` : null; };
    const intro = PHRASE.correctIs != null ? clipFor('phrases', PHRASE.correctIs, 'd') : null;
    const wordAt = q ? clipFor(q.bank, q.i, 'w') : null;
    if (canSpeak && intro && wordAt && letters.every(letterAt)) {
      const sayClip = async (text, clip) => {
        sayWord(text, judge, { rate: 0.95, clip });
        await sleep(160);
        for (let t = 0; t < 120 && isTalking() && !gone && pace; t++) await sleep(60);
      };
      await sayClip('The correct spelling is,', intro);
      for (const ch of letters) {
        if (gone || !pace) break;
        row.append(tile(ch, 'is-new'));
        await sayClip(DEFAULT_LETTER(ch), letterAt(ch));
        await wait(140);
      }
      if (!gone && pace) await sayClip(word, wordAt);
      await wait(400);
      return;
    }
    if (canSpeak) sayWord(`The correct spelling is: ${names.join(' ')} ${word}.`, judge, { rate: 0.9 });
    await wait(1700);                                // "The correct spelling is"
    for (const ch of letters) {
      if (gone || !pace) break;
      row.append(tile(ch, 'is-new'));
      await wait(620);
    }
    await spoken(15000);                             // a long word takes a while to spell
    await wait(500);
  }
  function judgeSays(name) {
    if (gone || !pace || !canSpeak) return;
    const i = PHRASE[name];
    sayWord(SPELLING_PHRASES[i][2], judge, { rate: 0.95, clip: clipFor('phrases', i, 'd') });
  }
  /** The judges and the hall clap. */
  let clapTimer = 0;
  function clap(seconds = 2.4) {
    if (gone || !pace) return;
    clearTimeout(clapTimer);
    bd.classList.add('is-clapping');
    applause(seconds, seconds > 3 ? 55 : 40);
    clapTimer = setTimeout(() => bd.classList.remove('is-clapping'), seconds * 1000);
  }
  async function spoken(max = 6000) {
    const t0 = Date.now();
    await wait(450);
    while (!gone && pace && isTalking() && Date.now() - t0 < max) await sleep(120);
  }

  /* ── My turn: the keys, the mic, and what a speller may ask for ── */
  let finishMine = null;           // (timedOut) => void, while I am at the mic
  let asks = 0;
  const ask = (kind) => { speak(kind); try { room?.send('ask', { k: nowK, kind, n: ++asks }); } catch { /* ignore */ } inputEl.focus(); };
  function tool(cls, icon, label, onPress) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `drill-spell-btn ${cls}`;
    b.innerHTML = icon;
    b.setAttribute('aria-label', label);
    b.dataset.tip = label;
    b.addEventListener('click', onPress);
    toolsEl.append(b);
    return b;
  }
  let micWanted = false;
  try { micWanted = localStorage.getItem(MIC_KEY) === '1'; } catch { /* storage blocked */ }
  /* No backspaces: what has been said cannot be unsaid. The answer only ever grows; the
     caret stays at its end; Backspace, Delete and the arrow keys do nothing. */
  let committed = '';
  const keepEnd = () => { try { inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length); } catch { /* not focusable */ } };
  function onType(fromMic = false) {
    let v = sanitizeSpelling(inputEl.value);
    if (!v.startsWith(committed)) v = committed;
    const before = committed;
    committed = v;
    if (inputEl.value !== v) inputEl.value = v;
    keepEnd();
    if (fromMic) { for (const ch of v.slice(before.length)) reveal(ch); }
    // each letter is said as it goes in, in my voice (a letter I said into the mic I have already said)
    if (!fromMic) sayNewLetters(before, v, mySeat.kid);
    try { room?.send('spell', { k: nowK, v }); } catch { /* ignore */ }
  }
  const mic = createSpellMic({
    interim: false,                                    // a letter here cannot be taken back: final words only
    quiet: () => !isTalking(350) && !spellerBusy(),
    onHeard: (items, text) => {
      if (!finishMine) return;
      const said = items.filter((it) => it.ch).length;
      heardEl.textContent = said || items.some((it) => it.done) ? `Heard: ${text.trim()}`
        : items.some((it) => it.back || it.clear) ? 'There are no backspaces at a spelling bee. Carry on, then say "done".'
        : `Heard "${text.trim()}". Say the letters one by one, then "done".`;
      let v = inputEl.value, done = false;
      for (const it of items) { if (it.done) done = true; else if (it.ch) v += it.ch; }
      inputEl.value = v;
      onType(true);
      if (done && committed) finishMine(false);
    },
    onState: (on, why) => {
      micBtn.classList.toggle('is-on', on);
      micBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      heardEl.hidden = !on && !why;
      if (on) heardEl.textContent = 'Listening. Say the letters one by one, then "done".';
      else if (why === 'denied') heardEl.textContent = 'The microphone is blocked. Allow it in the browser, or type the letters.';
      else if (why === 'error') heardEl.textContent = 'No microphone was found. Type the letters.';
    },
  });
  const micBtn = tool('drill-mic', UI.mic(22), 'Spell out loud: mic on or off (5)', () => {
    micWanted = !mic.on;
    try { localStorage.setItem(MIC_KEY, micWanted ? '1' : '0'); } catch { /* storage blocked */ }
    if (micWanted) mic.start(); else mic.stop();
    inputEl.focus();
  });
  micBtn.hidden = !canListen;
  micBtn.setAttribute('aria-pressed', 'false');
  tool('bee-again', UI.speaker(22), 'May I have the word again? (1)', () => ask('w')).hidden = !canSpeak;
  tool('bee-def', UI.book(22), 'May I have the definition? (2)', () => ask('d')).hidden = !canSpeak;
  tool('bee-use', UI.speech(22), 'May I have it in a sentence? (3)', () => ask('s')).hidden = !canSpeak;
  tool('bee-root', UI.roots(22), 'May I have the part of speech and the origin? (4)', () => ask('o')).hidden = !canSpeak;
  tool('bee-done', UI.check(22), 'Done: that is my spelling (Enter)', () => { if (finishMine && committed) finishMine(false); else inputEl.focus(); });
  inputEl.addEventListener('input', () => onType(false));
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (finishMine && committed) finishMine(false); return; }
    // 1 to 5 ask the judge (no figure is ever part of a spelling, so they are free keys)
    const keyed = { 1: () => ask('w'), 2: () => ask('d'), 3: () => ask('s'), 4: () => ask('o'), 5: () => micBtn.click() }[e.key];
    if (keyed && !e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); if (finishMine) keyed(); return; }
    if (/^(Backspace|Delete|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End)$/.test(e.key)) {
      e.preventDefault();
      if (e.key === 'Backspace' || e.key === 'Delete') heardEl.hidden = false, heardEl.textContent = 'There are no backspaces at a spelling bee. Carry on, then press Done.';
    }
  });
  ['select', 'click', 'focus'].forEach((t) => inputEl.addEventListener(t, keepEnd));
  inputEl.addEventListener('paste', (e) => e.preventDefault());   // letters come one at a time
  $('.bee-spell').addEventListener('click', () => { if (!inputEl.disabled) inputEl.focus(); });
  // a key pressed anywhere in the bee during my turn (after a click on the tools, say) goes to the answer
  bd.addEventListener('keydown', (e) => {
    if (!finishMine || e.target === inputEl || e.target.closest?.('.bee-tune') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length === 1 || e.key === 'Enter') inputEl.focus();
  }, true);

  let tick = 0;
  function runClock(seconds, onEnd) {
    clearInterval(tick);
    const end = Date.now() + seconds * 1000;
    const ring = clockEl.querySelector('.bee-sw-ring'), hand = clockEl.querySelector('.bee-sw-hand'), num = clockEl.querySelector('.bee-clock-n');
    let lastTick = null;
    clockEl.hidden = false;
    const paint = () => {
      const ms = Math.max(0, end - Date.now()), left = Math.ceil(ms / 1000), frac = ms / (seconds * 1000);
      num.textContent = clock(left);
      ring.setAttribute('stroke-dasharray', `${(frac * 100).toFixed(2)} 100`);
      ring.setAttribute('stroke', frac > 0.5 ? '#3bb273' : frac > 0.2 ? '#e0a526' : '#d64541');
      hand.setAttribute('transform', `rotate(${((1 - frac) * 360).toFixed(1)} 24 32)`);
      clockEl.classList.toggle('is-low', left <= 10);
      if (left <= 5 && left > 0 && left !== lastTick) { lastTick = left; if (pace) sfx.tick(); }   // the last seconds tick
      if (left <= 0) { clearInterval(tick); onEnd?.(); }
    };
    paint();
    tick = setInterval(paint, 100);
  }
  const stopClock = () => { clearInterval(tick); clockEl.hidden = true; clockEl.classList.remove('is-low'); };

  function mySpell(q, k) {
    return new Promise((resolve) => {
      say(`Your word, number ${mySeat.tag}. Spell it letter by letter (no backspaces), then press Done.`);
      committed = '';
      inputEl.disabled = false; inputEl.value = '';
      clearScreen('is-mine');
      toolsEl.hidden = false;                      // the tools, as icons along the top bar (a phone has no keys 1 to 5)
      bd.classList.add('is-my-turn');
      inputEl.focus();
      if (micWanted && canListen) mic.start();
      mic.reset();
      finishMine = (timedOut) => {
        if (!finishMine) return;
        finishMine = null;
        stopClock();
        if (mic.on) mic.stop();
        heardEl.hidden = true;
        inputEl.disabled = true; inputEl.blur();
        toolsEl.hidden = true;
        toolsBtn.hidden = true;
        toolsBtn.setAttribute('aria-expanded', 'false');
        bd.classList.remove('is-my-turn');
        const typed = committed;
        // if the hall already called this turn a miss (this device was away), that stands
        const r = results.get(k) || { u: me.uid, ok: !timedOut && spelledRight(typed, q.word), t: typed.toLowerCase() };
        publish(k, r);
        resolve(r);
      };
      runClock(turnSeconds, () => finishMine && finishMine(true));
    });
  }

  function theirSpell(seat, q, k) {
    if (results.has(k)) return Promise.resolve(results.get(k));
    return new Promise((resolve) => {
      say(`${who(seat)} is spelling.`);
      clearScreen();
      let heard = '';
      theirTyping = (v) => { sayNewLetters(heard, v, seat.kid); heard = v; };
      const started = Date.now();
      let watch = 0;
      const finish = (r) => { clearInterval(watch); stopClock(); theirTyping = null; resolve(r); };
      waiters.set(k, finish);
      runClock(turnSeconds);
      // a speller whose device has gone: the turn still has to end
      watch = setInterval(() => {
        if (gone) { finish({ u: seat.uid, ok: false, t: '' }); return; }
        const sec = (Date.now() - started) / 1000;
        const seen = present.get(seat.uid);
        const away = sec > 8 && (!seen || Date.now() - seen > 15000);
        if ((sec > turnSeconds + GRACE || away) && amArbiter(seat.uid)) publish(k, { u: seat.uid, ok: false, t: '', to: 1 });
      }, 1000);
    });
  }

  async function botSpell(seat, q, k) {
    const b = botSpelling(seed, seat.bot, k, q.word);
    say(`${who(seat)} is spelling.`);
    clearScreen();
    if (pace) {
      await wait(Math.min(2200, b.ms / 3));
      for (let n = 1; n <= b.typed.length && !gone && pace; n++) {
        const ch = b.typed[n - 1];
        spellerSays(letterName(ch, seat.kid), seat.kid, letterClip(ch, seat.kid), { onStart: () => reveal(ch), letter: true });
        await spellerDone();
        await wait(250);
      }
    }
    return { ok: b.ok, t: b.typed };
  }

  /* ── Walking ─────────────────────────────────────────────────── */
  async function walk(el, to) {
    spotOn(el);                                             // the spotlight finds them and follows
    el.classList.remove('is-gone');
    el.classList.add('is-standing');
    await wait(450);                               // up out of the chair first
    // the Math Bee: a short contestant steps down off the pulpit's platform before walking away
    if (isMath && el.classList.contains('is-up') && to !== 'mic' && to !== 'mic2') {
      await stairs(el, false);                      // down the platform's stairs, a step at a time
      el.classList.remove('is-up');
      hall.querySelector(el.dataset.pulpit === '2' ? '.bee-platform--2' : '.bee-platform:not(.bee-platform--2)')?.classList.remove('is-on');
    }
    // a short contestant (Math Bee) heads straight for the foot of the platform's stairs
    let shortLift = 0;
    if (isMath && (to === 'mic' || to === 'mic2')) {
      el.dataset.pulpit = to === 'mic2' ? '2' : '1';
      shortLift = Math.max(0, 1 - (parseFloat(getComputedStyle(el).getPropertyValue('--tall')) || 1));
      if (shortLift > 0.01) {
        el.style.setProperty('--lift', shortLift.toFixed(3));
        const pf = hall.querySelector(to === 'mic2' ? '.bee-platform--2' : '.bee-platform:not(.bee-platform--2)');
        pf?.style.setProperty('--lift', shortLift.toFixed(3));
        pf?.classList.add('is-on');
        el.style.setProperty('--liftnow', '0');
        el.style.setProperty('--stepx', `${stairX(el, STAIRS[0][1]).toFixed(1)}px`);
        el.classList.add('is-up', 'is-approach');
      }
    }
    el.classList.add('is-walking');
    el.classList.toggle('is-at-mic', to === 'mic');
    el.classList.toggle('is-at-mic2', to === 'mic2');
    el.classList.toggle('is-off', to === 'off');
    await wait(to === 'off' ? 2600 : 1700);
    el.classList.remove('is-walking');
    // ...and climbs onto it at the pulpit to be seen (as high as they are short of an average child)
    if (shortLift > 0.01) {
      el.classList.remove('is-approach');
      await stairs(el, true);                          // at the foot of the stairs: up them, onto the platform
    }
    if (to === 'seat') { el.classList.remove('is-standing'); await wait(450); }
    if (to === 'off') el.classList.add('is-gone');
    if (to !== 'mic' && to !== 'mic2') spotOff();             // back in the chair (or gone): the light goes off
  }
  /* A platform's stairs (on its right at the first pulpit, its left at the second), measured off the
     drawn platform: [share of the climb, where across the platform from its middle (a share of its
     width; null: the contestant's own place at the pulpit)]. The foot, the low step, the high step,
     the platform's edge, then across to the pulpit. Each foot lands ON something. */
  const STAIRS = [[0, 0.56], [0.35, 0.467], [0.625, 0.4], [1, 0.27], [1, null]];
  function stairX(el, at) {
    if (at == null) return 0;
    const two = el.dataset.pulpit === '2', side = two ? -1 : 1;
    const pf = hall.querySelector(two ? '.bee-platform--2' : '.bee-platform:not(.bee-platform--2)');
    const h = hall.getBoundingClientRect(), p = pf?.getBoundingClientRect();
    if (!p || !p.width || !h.width) return 0;
    const scale = h.width / (hall.offsetWidth || h.width);                       // the hall may be drawn scaled
    const kidX = h.left + (two ? 0.555 : 0.385) * h.width;                       // their spot at the pulpit (bee.css .is-at-mic / .is-at-mic2)
    return (p.left + p.width / 2 - kidX + side * at * p.width) / scale;
  }
  async function stairs(el, up) {
    const lift = parseFloat(el.style.getPropertyValue('--lift')) || 0;
    for (const [f, at] of up ? STAIRS : [...STAIRS].reverse()) {
      const dx = stairX(el, at);
      el.style.setProperty('--liftnow', (lift * f).toFixed(3));
      el.style.setProperty('--stepx', `${dx.toFixed(1)}px`);
      await wait(320);
    }
  }
  /* The spotlight: the lamp on the lighting bar turns to the speller and its beam runs from the
     lens to them, every frame while it is on, so it follows them as they walk. */
  let spotEl = null, spotRaf = 0;
  function spotOn(el) {
    spotEl = el;
    hall.classList.add('is-spot');
    if (!spotRaf) spotRaf = requestAnimationFrame(spotTick);
  }
  function spotOff() {
    spotEl = null;
    hall.classList.remove('is-spot');
  }
  function spotTick() {
    spotRaf = 0;
    if (!spotEl || gone) return;
    const hr = hall.getBoundingClientRect(), kr = spotEl.getBoundingClientRect();
    if (hr.width && kr.width) {
      const tx = kr.left + kr.width / 2 - hr.left, ty = kr.top + kr.height * 0.985 - hr.top;  // the speller's feet
      aim('spot', tx, ty, Math.max(kr.width * 1.7, hr.width * 0.07));
      hall.style.setProperty('--spot-x', `${((tx / hr.width) * 100).toFixed(2)}%`);
      hall.style.setProperty('--spot-y', `${(((kr.top + kr.height * 0.5 - hr.top) / hr.height) * 100).toFixed(2)}%`);
    }
    spotRaf = requestAnimationFrame(spotTick);
  }
  /* A lamp on the lighting bar aimed at (tx, ty) in the hall (px): it turns about its clamp so
     its lens points there; the beam spreads from the lens to that point; and the light lands
     there as an ellipse of width w on the floor. */
  function aim(which, tx, ty, w) {
    const lamp = hall.querySelector(`.bee-lamp--${which}`), beam = hall.querySelector(`.bee-beam--${which}`), pool = hall.querySelector(`.bee-pool--${which}`);
    if (!lamp || !beam || !pool) return;
    const px = lamp.offsetLeft, py = lamp.offsetTop;            // the clamp (the lamp turns about its top middle)
    const L = lamp.offsetHeight * (73 / 90);                   // clamp to lens, in the lamp's drawing
    const a = Math.atan2(-(tx - px), ty - py);                 // clockwise from straight down
    const lx = px - L * Math.sin(a), ly = py + L * Math.cos(a);
    const deg = (a * 180) / Math.PI;
    lamp.style.rotate = `${deg.toFixed(2)}deg`;
    const len = Math.hypot(tx - lx, ty - ly);
    const lens = lamp.offsetWidth * 0.4;                       // the beam is as wide as the lens where it leaves it
    beam.style.left = `${lx}px`; beam.style.top = `${ly}px`; beam.style.height = `${len}px`; beam.style.width = `${w}px`;
    beam.style.rotate = `${(Math.atan2(-(tx - lx), ty - ly) * 180 / Math.PI).toFixed(2)}deg`;
    const t = Math.min(49, (lens / w) * 50);
    beam.style.clipPath = `polygon(${(50 - t).toFixed(2)}% 0, ${(50 + t).toFixed(2)}% 0, 100% 100%, 0 100%)`;
    pool.style.left = `${tx}px`; pool.style.top = `${ty}px`; pool.style.width = `${w}px`; pool.style.height = `${(w * 0.26).toFixed(1)}px`;
  }
  // the two flood lamps, aimed at the stage left and right of the middle, kept aimed as the hall resizes
  const aimFloods = () => {
    const W = hall.clientWidth, H = hall.clientHeight;
    if (!W) return;
    aim('l', W * 0.42, H * 0.645, W * 0.26);         // the open floor in front of the TV, left and right
    aim('r', W * 0.68, H * 0.645, W * 0.26);
  };
  aimFloods();
  new ResizeObserver(aimFloods).observe(hall);
  // with no time to walk (catching up, skipping), the classes are still set, so everyone ends in the right place
  const settle = () => { bd.classList.toggle('is-instant', !pace); };

  /* ── The bee ─────────────────────────────────────────────────── */
  let finished = null;
  const done = new Promise((r) => { finished = r; });
  function leave(result) {
    if (gone) return;
    gone = true;
    clearInterval(beat); clearInterval(tick);
    if (finishMine) finishMine(true);
    hush();
    spellerHush();
    try { synth?.cancel(); } catch { /* ignore */ }
    if (mic.on) mic.stop();
    for (const w of [...waiters.values()]) w({ ok: false, t: '' });
    joined.then(() => room?.leave()).catch(() => {});
    bd.remove();
    document.body.classList.remove('drill-nav-hidden');
    leaveFullscreen();
    finished(result);
  }
  const myPlace = () => (mySeat ? ((isMath ? mathRanking : bee.placings).find((p) => p.seat === mySeat.seat) || {}).place ?? null : null);
  const leaveBtn = $('.bee-leave');
  leaveBtn.innerHTML = UI.close(18);
  leaveBtn.setAttribute('aria-label', 'Leave the bee');
  leaveBtn.dataset.tip = 'Leave the bee';
  leaveBtn.addEventListener('click', () => leave({ place: myPlace(), champion: null, placings: bee.placings }));
  // the spellers' voice: the speaker opens a list; the letters (and the word) follow the choice
  const voiceBtn = $('.bee-voice'), voiceList = $('.bee-voices');
  voiceBtn.innerHTML = UI.users(18);          // the spellers' voices (the speaker icon is "hear the word again")
  voiceBtn.setAttribute('aria-haspopup', 'menu');
  voiceBtn.setAttribute('aria-expanded', 'false');
  const showVoice = () => {
    const tip = `Speller voice: ${SPELLER_VOICE_CHOICES.find((c) => c.key === spellerVoice).label}`;
    voiceBtn.dataset.tip = tip;
    voiceBtn.setAttribute('aria-label', tip);
    voiceList.querySelectorAll('.bee-voice-opt').forEach((b) => {
      const on = b.dataset.voice === spellerVoice;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  };
  for (const c of SPELLER_VOICE_CHOICES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bee-voice-opt';
    b.setAttribute('role', 'menuitemradio');
    b.dataset.voice = c.key;
    b.textContent = c.label;
    b.addEventListener('click', () => { setSpellerVoice(c.key); setOpen(false); });
    voiceList.append(b);
  }
  showVoice();
  document.addEventListener('bee-voice', () => { if (voiceList.hidden) showVoice(); else voiceList.querySelectorAll('.bee-voice-opt').forEach((b) => b.classList.toggle('is-on', b.dataset.voice === spellerVoice)); });
  // the button's tooltip would sit over the list: none while it is open
  const setOpen = (open) => {
    voiceList.hidden = !open;
    voiceBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { delete voiceBtn.dataset.tip; hideTip(); } else showVoice();
  };
  voiceBtn.addEventListener('click', () => setOpen(voiceList.hidden));
  document.addEventListener('pointerdown', (e) => {
    if (!voiceList.hidden && !e.target.closest?.('.bee-voicebox')) setOpen(false);
  });
  skipBtn.innerHTML = UI.skip(18);
  skipBtn.dataset.tip = 'Skip to the result';
  skipBtn.setAttribute('aria-label', 'Skip to the result');
  const fullBtn = $('.bee-full');
  fullBtn.innerHTML = UI.expand(18);
  fullBtn.setAttribute('aria-label', 'Full screen');
  fullBtn.dataset.tip = 'Full screen';
  fullBtn.addEventListener('click', () => { if (document.fullscreenElement) leaveFullscreen(); else beeFullscreen(); });
  const onFull = () => fullBtn.setAttribute('aria-pressed', document.fullscreenElement ? 'true' : 'false');
  document.addEventListener('fullscreenchange', onFull);
  skipBtn.addEventListener('click', () => { skipping = true; pace = 0; hush(); try { synth?.cancel(); } catch { /* ignore */ } spellerHush(); skipBtn.hidden = true; settle(); });
  /* Skip the intro: the curtains, the welcome, the TV's opening and the judges' introductions go by at
     once (the clips stop), and the bee starts. */
  const skipIntroBtn = $('.bee-skip-intro');
  let introSkipped = false;
  skipIntroBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5v13l8.5-6.5z M12.5 5.5v13l8.5-6.5z" fill="currentColor"/><rect x="20" y="5.5" width="2" height="13" fill="currentColor"/></svg>';
  skipIntroBtn.dataset.tip = 'Skip the intro';
  skipIntroBtn.setAttribute('aria-label', 'Skip the intro');
  skipIntroBtn.addEventListener('click', () => {
    introSkipped = true; pace = 0;
    hush(); try { synth?.cancel(); } catch { /* ignore */ } spellerHush(); stopClips();
    skipIntroBtn.hidden = true; settle();
  });

  function showResults() {
    const champ = seats[bee.champion];
    $('.bee-results-title').textContent = champ === mySeat ? 'You are the champion!' : `Champion: number ${champ.tag}, ${nameOf(champ)}`;
    const list = $('.bee-results-list');
    const rows = [...bee.placings].sort((a, b) => a.place - b.place || a.seat - b.seat);
    for (const p of rows) {
      const s = seats[p.seat];
      const li = document.createElement('li');
      li.className = `bee-results-row${s === mySeat ? ' is-me' : ''}${p.place === 1 ? ' is-champion' : ''}`;
      const place = document.createElement('span');
      place.className = 'bee-results-place';
      if (p.place === 1) place.innerHTML = UI.trophy(20); else place.textContent = p.place;
      const name = document.createElement('span');
      name.className = 'bee-results-name';
      name.textContent = `No. ${s.tag} ${nameOf(s)}`;
      const meta = document.createElement('span');
      meta.className = 'bee-results-meta';
      meta.textContent = p.place === 1 ? `won in round ${p.round}` : `out in round ${p.round}`;
      li.append(place, name, meta);
      list.append(li);
    }
    $('.bee-results').hidden = false;
    $('.bee-results-close').addEventListener('click', () => leave({ place: myPlace(), champion: champ, placings: bee.placings }));
    $('.bee-results-close').focus();
  }

  (async () => {
    pills();
    skipIntroBtn.hidden = false;
    say(isMath ? `Welcome to the Prep Math Bee. ${seats.length} contestants, one minute each at the pulpit.` : `Welcome to the Prep Spelling Bee. ${seats.length} spellers. One wrong letter and you leave the stage.`);
    // the title, dropping onto the closed curtains tile by tile
    const marquee = $('.bee-marquee');
    [...(isMath ? 'PREP MATH BEE' : 'PREP SPELLING BEE')].forEach((ch, i) => { const t = tile(ch === ' ' ? ' ' : ch, 'is-new'); t.style.animationDelay = `${300 + i * 70}ms`; marquee.append(t); });
    await Promise.race([joined, sleep(2500)]);
    await wait(1200);
    bd.classList.add('is-curtains-open');           // the curtains sweep open and are tied back in gold
    if (pace) sfx.swish();
    setTimeout(() => { if (!gone && pace) sfx.clunk(); }, 1300);   // the flood lamps come on
    await wait(1200);
    if (!gone && pace) ovation(4.5);                // the hall stands and claps, then sits
    await wait(4700);
    if (!gone && pace) await tvIntro();
    if (!gone && pace) {                            // the judges introduce themselves
      judgeSays(isMath ? 'introMath' : 'intro');
      await sleep(500);
      for (let t = 0; t < 140 && isTalking() && !gone; t++) await sleep(100);
      await wait(300);
      if (!gone && pace) await judgeManSays('And I am Mr. Whitmore. Good luck to every one of our spellers!', '/media/spelling-judge/intro.mp3');
      await wait(400);
    }
    // the intro over (or skipped): the curtains open, the TV back to its card, full pace again
    skipIntroBtn.hidden = true;
    if (introSkipped) {
      bd.classList.add('is-curtains-open');
      hall.querySelector('.bee-tv')?.classList.remove('is-white', 'is-host', 'is-award', 'is-title-card', 'is-off', 'is-glitch');
      pace = 1; settle();
      introSkipped = false;
    }
    if (isMath) { await (cup ? mathCup() : mathBee()); return; }        // the Math Bee has its own turns
    if (!gone && pace) {
      say(`Round 1. ${bee.alive.length} spellers.`);
      sweep();
      tvTitle('ROUND 1', 'is-round');
      await wait(2200);
    }
    clearScreen();
    while (!gone && bee.champion == null) {
      const seat = seats[bee.current], el = kids[seat.seat], k = bee.turn, q = question(k);
      nowK = k; nowQ = q;
      bd.dataset.turn = k;
      // catch up if the hall is ahead of this screen; skip if asked to
      const behind = [...results.keys()].some((key) => key > k) || (results.has(k) && seat.uid && seat.uid !== me.uid);
      pace = skipping ? 0 : behind ? 0.12 : 1;
      settle();
      // only bots left: nothing more can happen to a real player, so offer the end
      skipBtn.hidden = skipping || bee.alive.some((s) => seats[s].uid);
      preloadClip(clipFor(q.bank, q.i, 'w'));
      preloadClip(clipFor('phrases', PHRASE.yourWordIs, 'd'));
      clearScreen(); stopClock();
      say(`${who(seat)}, to the microphone.`);
      speakingKid = el;                              // whose mouth moves when the speller speaks
      await walk(el, 'mic');
      if (gone) break;
      // "Your word is ..." and the word
      say('The judge: "Your word is ..."');
      judgeSays('yourWordIs');
      await spoken();
      speak('w');
      await spoken();
      // the speller says the word back before spelling it, as at a real bee (in their own voice,
      // on every device: it needs nothing sent)
      if (!gone && pace && !results.has(k)) {
        say(`${who(seat)} says the word back.`);    // never the word itself: it is spelled on screen
        spellerSays(q.word, seat.kid, wordClip(q, seat.kid));
        await spellerDone();
      }
      const r = seat.bot != null ? await botSpell(seat, q, k)
        : seat === mySeat ? await mySpell(q, k)
        : await theirSpell(seat, q, k);
      if (gone) break;
      await spellerDone();            // the last letter is said before the judge answers
      // and, done, the speller says the word, as at a real bee
      if (r.t && !gone && pace) { spellerSays(q.word, seat.kid, wordClip(q, seat.kid)); await spellerDone(); }
      if (gone) break;
      // the verdict
      if (r.ok) {
        showMarked(r.t || q.word, q.word);
        say('The judge: "Correct."');
        judgeSays('correct');
        if (pace) chime();
        await spoken();
        if (REACTIONS) { say('Correct! The hall claps.'); clap(2.4); await wait(2200); } else await wait(800);
      } else {
        showMarked(r.t || '', q.word);
        say(r.t ? 'The judge: "Incorrect."' : 'Time is up. The judge: "Incorrect."');
        judgeSays('incorrect');
        if (pace) { bell(); sfx.buzz(); }
        if (REACTIONS) el.classList.add('is-sad');
        await spoken();
        await wait(700);
        // the head judge spells the word as it should be, before the speller leaves
        if (!gone && pace) await judgeSpells(q.word, q);
        say(`The word was "${q.word}". ${seat === mySeat ? 'You leave' : `Number ${seat.tag} leaves`} the stage.`);
        await wait(1200);
      }
      const ev = bee.apply(r.ok);
      await walk(el, r.ok ? 'seat' : 'off');
      if (gone) break;
      if (ev.reinstated.length) {
        say('Everyone left missed that round, so nobody goes out. They all come back.');
        ev.reinstated.forEach((s) => kids[s].classList.remove('is-sad', 'is-off'));
        await Promise.all(ev.reinstated.map((s) => walk(kids[s], 'seat')));
        await wait(1200);
      } else if (!r.ok && seat === mySeat && bee.champion == null) {
        say('You are out. Stay and watch the rest of the bee, or leave with the cross.');
        await wait(2200);
      }
      pills();
      if (ev.roundEnd && bee.champion == null) {
        say(`Round ${bee.round}. ${bee.alive.length} spellers left.`);
        if (pace) { sweep(); tvTitle(`ROUND ${bee.round}`, 'is-round'); }
        await wait(2400);
        clearScreen();
      }
    }
    if (gone) return;
    // the champion
    pace = 1; settle();
    skipBtn.hidden = true;
    stopClock(); showLetters('');
    const champ = seats[bee.champion];
    kids[champ.seat].classList.add('is-champion');
    say(`${who(champ)} is the champion!`);
    sweep();
    tvTitle('CHAMPION', 'is-round');
    chime();
    await walk(kids[champ.seat], 'mic');
    if (!gone) await award(champ);
    if (!gone) showResults();
  })();

  return done;
}
