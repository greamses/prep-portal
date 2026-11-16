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
import { SPELLING_PHRASES, PHRASE } from '/data/spelling/phrases.js';
import { LETTER } from '/data/spelling/letters.js';
import { SPELLER_VOICES, LETTER_VOICES, KID_LETTER_SET } from '/data/spelling/speller-voices.js';

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
import { heroPaint } from '/utils/components/nav-icons.js';

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
const voiceFor = (() => {
  const cache = {};
  return (kid) => {
    if (cache[kid] !== undefined) return cache[kid];
    let all = [];
    try { all = synth ? synth.getVoices().filter((v) => /^en[-_]?/i.test(v.lang)) : []; } catch { /* none */ }
    if (!all.length) return null;          // not loaded yet: ask again next time
    const want = KIDS[kid]?.girl ? /female|zira|hazel|susan|libby|sonia|aria|jenny|samantha|karen|moira|serena|emma/i
      : /male|david|george|ryan|guy|daniel|alex|arthur|thomas|oliver/i;
    cache[kid] = all.find((v) => want.test(v.name) && !/female/i.test(kid === 'boy' ? v.name : '')) || all.find((v) => /en[-_]GB/i.test(v.lang)) || all[0];
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
function seatSpot(count, seat) {
  const back = count > 5 ? Math.ceil(count / 2) : 0;
  const inBack = seat < back;
  const n = inBack ? back : count - back;
  const j = inBack ? seat : seat - back;
  const step = Math.min(10.5, n > 1 ? 40 / (n - 1) : 0);
  return { x: (inBack ? 64 : 68) + (j - (n - 1) / 2) * step, y: inBack ? 57.5 : 65.5, row: inBack ? 'back' : 'front' };
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
  // her mouth: 50.5% across and 14.9% down the picture
  const mx = W.x + 0.505 * ww, my = W.y + 0.149 * W.h;
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
  const glass = (cx) => `<ellipse cx="${cx}" cy="136.3" rx="4" ry=".9" fill="rgba(0,0,0,.25)"/><polygon points="${cx - 3.4},124.5 ${cx + 3.4},124.5 ${cx + 2.8},136 ${cx - 2.8},136" fill="rgba(210,235,250,.55)" stroke="rgba(255,255,255,.8)" stroke-width=".5"/><polygon points="${cx - 3.1},128 ${cx + 3.1},128 ${cx + 2.8},136 ${cx - 2.8},136" fill="rgba(120,185,230,.55)"/>`;
  // each judge grows or shrinks from the middle of their place at the table (the sizes panel)
  const sized = (id, label, inner) => `<g class="bee-item" data-item="${id}" data-label="${label}">${inner}</g>`;
  return `<svg viewBox="0 0 300 220" aria-hidden="true">
    ${sized('judge-woman', 'Head judge', `${chair(W.x + ww / 2, W.y + 0.11 * W.h, ww * 1.12)}
    <image href="/media/characters/judge-woman.svg" x="${W.x}" y="${W.y}" width="${ww}" height="${W.h}"/>
    <g class="mouth" data-hinge="${(my - 2.4).toFixed(2)}" transform="translate(${mx.toFixed(2)} ${(my - 2.4).toFixed(2)}) scale(1 0.12) translate(${(-mx).toFixed(2)} ${(-(my - 2.4)).toFixed(2)})"><ellipse cx="${mx.toFixed(2)}" cy="${(my + 1).toFixed(2)}" rx="5.6" ry="3.8" fill="#5e2420"/></g>
    ${hands(W.x + ww / 2, '#f0c3a3', '#1d2b55', -0.12)}`)}
    ${sized('judge-man', 'Judge', `${chair(M.x + mw / 2, M.y + 0.11 * M.h, mw * 1.12)}
    <image href="/media/characters/judge-man.svg" x="${M.x}" y="${M.y}" width="${mw}" height="${M.h}"/>
    ${hands(M.x + mw / 2, '#f2b394', '#1c3561', -0.04)}`)}
    <defs>
      <linearGradient id="bee-cloth" x1="0" x2="1" y1="0" y2="0">${Array.from({ length: 13 }, (_, i) => `<stop offset="${(i / 12).toFixed(3)}" stop-color="${i % 2 ? '#1a2d55' : '#25407a'}"/>`).join('')}</linearGradient>
      <linearGradient id="bee-wood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9a6537"/><stop offset=".55" stop-color="#7a4b27"/><stop offset="1" stop-color="#5a3519"/></linearGradient>
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
let settings = { sizes: {}, items: {}, letters: {} };   // what was saved (beeSettings/hall)
const settingsReady = getDoc(doc(db, ...SETTINGS_DOC))
  .then((snap) => {
    const d = snap.exists() ? snap.data() : {};
    settings = { sizes: d.sizes || {}, items: d.items || {}, letters: d.letters || {} };
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
function mountTuner(hall, top, { say }) {
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

  // the letters: which child's voice, and which voice engine
  let kid = 'girl';
  const faces = group(...['girl', 'boy'].map((k) => {
    const f = icon(`bee-ic-face${k === kid ? ' is-on' : ''}`, `<img src="${KIDS[k].src}" alt="" />`, k === 'girl' ? 'The girls\u2019 voice' : 'The boys\u2019 voice');
    f.dataset.who = k;
    f.addEventListener('click', () => { kid = k; faces.querySelectorAll('.bee-ic').forEach((x) => x.classList.toggle('is-on', x === f)); refreshKeys(); if (current != null) pick(current); });
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
  document.addEventListener('bee-voice', showEngine);
  paper.append(row('Letters', faces, engines));

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
  const refreshKeys = () => grid.querySelectorAll('.bee-abc-key').forEach((x, i) => x.classList.toggle('is-changed', !!letters[kid][keys[i]]));
  function pick(ch) {
    current = ch;
    grid.querySelectorAll('.bee-abc-key').forEach((x, i) => x.classList.toggle('is-current', keys[i] === ch));
    which.textContent = keyLabel(ch);
    said.value = letters[kid][ch] ?? letterName(ch, kid);
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
    const v = said.value.trim(), L = letters[kid];
    if (v && v !== DEFAULT_LETTER(current)) L[current] = v; else delete L[current];
    if (L[current]) LETTER_SAID[kid][current] = L[current]; else delete LETTER_SAID[kid][current];
    refreshKeys();
  });
  said.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sayLetter(); } e.stopPropagation(); });
  hear.addEventListener('click', sayLetter);
  paper.append(grid, edit);

  // undo, save, and a one-line note
  const note = document.createElement('p');
  note.className = 'bee-tune-note';
  const undo = icon('bee-tune-undo', UI.undo(18), 'Undo changes');
  const save = icon('bee-tune-keep', UI.save(18), 'Save for everyone');
  save.addEventListener('click', async () => {
    if (!isAdminHere()) { note.textContent = 'Only the admin account can save.'; return; }
    save.disabled = true;
    try {
      await setDoc(doc(db, ...SETTINGS_DOC), { sizes, items, letters, updatedAt: serverTimestamp() });
      settings = { sizes: { ...sizes }, items: JSON.parse(JSON.stringify(items)), letters: normLetters(letters) };
      note.textContent = 'Saved for every bee.';
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
export function startBee({ roomId, seed, sets, turnSeconds, humans, botsNeeded, me }) {
  const myKid = KIDS[me.kid] ? me.kid : null;
  const seats = seatSpellers(seed, humans.map((h) => (h.uid === me.uid && myKid ? { ...h, kid: myKid } : h)), botsNeeded);
  const bee = createBee(seats.length);
  const mySeat = seats.find((s) => s.uid === me.uid) || null;
  // a speller's name: the child's own; a real player's name after it
  const nameOf = (s) => {
    const n = SPELLER_NAMES[s.kid] || s.name;
    return s === mySeat ? `${n} (you)` : s.uid && s.name && s.name !== n ? `${n} (${s.name})` : n;
  };
  const question = (k) => spellingQuestion(seed, k, 'spellSay', sets);

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
      <span class="pp-pill pp-pill--static bee-clock"></span>
      <span class="bee-spacer"></span>
      <button type="button" class="pp-btn pp-btn--ghost bee-skip" hidden>Skip to the result</button>
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
      <span class="pp-sticky pp-sticky--c0 pp-sticky--tape bee-banner bee-item" data-item="banner" data-label="Banner">Prep Spelling Bee</span>
      <div class="bee-judges"></div>
      <div class="bee-stand bee-item" data-item="mic" data-label="Microphone" aria-hidden="true"><svg viewBox="0 0 20 100" preserveAspectRatio="xMidYMax meet"><rect x="5" y="2" width="10" height="17" rx="5" fill="#3b3b3b"/><rect x="6.5" y="5" width="7" height="2" fill="#6b6b6b"/><rect x="8.8" y="18" width="2.4" height="76" fill="#8a8f96"/><rect x="1" y="93" width="18" height="5" rx="2.5" fill="#3b3b3b"/></svg></div>
      <div class="bee-tv bee-item" data-item="tv" data-label="TV" aria-label="The screen">
        <div class="bee-tv-screen">
          <div class="bee-spell">
            <p class="bee-letters"></p>
            <input class="bee-input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="40" aria-label="Spell the word, one letter at a time. Letters cannot be taken back." disabled />
          </div>
          <div class="bee-tv-idle" aria-hidden="true"><svg class="bee-bot" viewBox="0 0 64 64" aria-hidden="true"><line x1="32" y1="7" x2="32" y2="16" stroke="#1f2a37" stroke-width="2.6" stroke-linecap="round"/><circle class="bee-bot-ball" cx="32" cy="6" r="3.2" fill="#f4c95d"/><rect x="4" y="27" width="8" height="13" rx="4" fill="#f28fb0"/><rect x="52" y="27" width="8" height="13" rx="4" fill="#f28fb0"/><rect x="11" y="16" width="42" height="38" rx="14" fill="#7cc4f0"/><rect x="17" y="22" width="30" height="19" rx="9.5" fill="#1f2a37"/><circle class="bee-bot-eye" cx="26" cy="31.5" r="3.1" fill="#f4c95d"/><circle class="bee-bot-eye" cx="38" cy="31.5" r="3.1" fill="#f4c95d"/><path class="bee-bot-mouth" d="M24 48 L40 48" stroke="#1f2a37" stroke-width="4.4" stroke-linecap="round" fill="none"/></svg><p class="bee-tv-logo"><small>Prep</small>Spelling Bee</p></div>
          <div class="bee-tv-host" aria-hidden="true"><svg class="bee-bot" viewBox="0 0 64 64" aria-hidden="true"><line x1="32" y1="7" x2="32" y2="16" stroke="#1f2a37" stroke-width="2.6" stroke-linecap="round"/><circle class="bee-bot-ball" cx="32" cy="6" r="3.2" fill="#f4c95d"/><rect x="4" y="27" width="8" height="13" rx="4" fill="#f28fb0"/><rect x="52" y="27" width="8" height="13" rx="4" fill="#f28fb0"/><rect x="11" y="16" width="42" height="38" rx="14" fill="#7cc4f0"/><rect x="17" y="22" width="30" height="19" rx="9.5" fill="#1f2a37"/><circle class="bee-bot-eye" cx="26" cy="31.5" r="3.1" fill="#f4c95d"/><circle class="bee-bot-eye" cx="38" cy="31.5" r="3.1" fill="#f4c95d"/><path class="bee-bot-mouth" d="M24 48 L40 48" stroke="#1f2a37" stroke-width="4.4" stroke-linecap="round" fill="none"/></svg><p class="bee-tv-host-line"></p><div class="bee-tv-award"><svg class="bee-trophy" viewBox="0 0 64 72" aria-hidden="true"><path d="M14 8 H4 V16 Q4 30 18 32" fill="none" stroke="#d4a937" stroke-width="4"/><path d="M50 8 H60 V16 Q60 30 46 32" fill="none" stroke="#d4a937" stroke-width="4"/><path d="M14 4 H50 V20 Q50 40 32 42 Q14 40 14 20 Z" fill="#f2c94c"/><path d="M20 8 H26 V22 Q26 32 32 36 Q22 34 20 22 Z" fill="#fff0b3" opacity=".75"/><rect x="28" y="42" width="8" height="10" fill="#d4a937"/><rect x="18" y="52" width="28" height="7" fill="#b8902e"/><rect x="13" y="59" width="38" height="9" fill="#7a5c1c"/><rect x="22" y="61.5" width="20" height="4" fill="#f2c94c"/></svg><span class="bee-tv-prize"><b>5,000</b> PrepCoins</span></div></div>
          <span class="bee-tv-static" aria-hidden="true"></span>
          <span class="bee-tv-glare" aria-hidden="true"></span>
        </div>
        <span class="bee-tv-brand" aria-hidden="true"></span>
        <span class="bee-tv-led" aria-hidden="true"></span>
      </div>
      <div class="bee-spot" aria-hidden="true"><span class="bee-spot-beam"></span></div>
      <div class="bee-flood" aria-hidden="true"></div>
      <div class="bee-confetti" aria-hidden="true"></div>
      <div class="bee-curtain bee-curtain--l" aria-hidden="true"><span class="bee-tieback"></span></div>
      <div class="bee-curtain bee-curtain--r" aria-hidden="true"><span class="bee-tieback"></span></div>
      <div class="bee-marquee" aria-hidden="true"></div>
      <div class="bee-audience"></div>
    </div>
    <div class="bee-results" hidden>
      <div class="pp-receipt bee-results-card">
        <div class="pp-receipt__paper bee-results-paper">
          <p class="bee-results-kicker">Prep Spelling Bee</p>
          <p class="bee-results-title"></p>
          <ol class="bee-results-list"></ol>
          <button type="button" class="pp-btn bee-results-close">Back to the setup</button>
        </div>
      </div>
    </div>`;
  const $ = (q) => bd.querySelector(q);
  $('.bee-blob').innerHTML = heroPaint();
  $('.bee-backdrop').innerHTML = hallSvg();
  $('.bee-audience').innerHTML = audienceSvg(seed);
  const judge = $('.bee-judges');
  judge.innerHTML = judgesSvg();
  const hall = $('.bee-hall'), statusEl = $('.bee-status'), lettersEl = $('.bee-letters'), inputEl = $('.bee-input');
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
    const spot = seatSpot(seats.length, s.seat);
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
    tag.innerHTML = `<b class="bee-tag-no">${s.tag}</b><span class="bee-tag-name">${SPELLER_NAMES[s.kid] || ''}</span>`;
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
    if (nm) nm.textContent = SPELLER_NAMES[kid] || '';
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
    settingsReady.then(() => { for (const who of ['girl', 'boy']) for (const [ch, t] of Object.entries(LETTER_SAID[who])) elevenUrl(elevenText(ch, t), who); });
  };
  warmEleven();
  document.addEventListener('bee-voice', warmEleven);
  // everyone's bee: the saved sizes; the admin (or ?tune=1): the settings panel
  settingsReady.then(() => {
    if (gone) return;
    applySizes(hall, settings.sizes);
    applyItems(hall, settings.items);
    if (isAdminHere() || /[?&]tune=1\b/.test(location.search)) mountTuner(hall, $('.bee-top'), { say: (text, kid, ch = null) => {
      if (ch != null && spellerVoice === 'eleven') {
        const who = KIDS[kid]?.girl ? 'girl' : 'boy';
        const shown = isIpa(text) ? DEFAULT_LETTER(ch) : text;     // the browser's fallback cannot read IPA
        elevenUrl(elevenText(ch, text), who).then((u) => spellerSays(shown, kid, u ? [{ url: u }] : letterClip(ch, kid), { letter: true }));
        return;
      }
      if (ch != null && isIpa(text)) text = DEFAULT_LETTER(ch);
      spellerSays(text, kid, ch != null ? letterClip(ch, kid) : null, { letter: ch != null });
    } });
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
  const voiceOf = (kid) => SPELLER_VOICES[KIDS[kid]?.girl ? 'girl' : 'boy'];
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
      // a spelling changed on the chart: ElevenLabs saying that text (once it has been made)
      const own = LETTER_SAID[who][ch.toLowerCase()];
      if (own) {
        const live = elevenDone.get(`${who}|${elevenText(ch, own)}`);
        if (live) list.push({ url: live }); else elevenUrl(elevenText(ch, own), who);
      }
      // a child's voice for the small boy and the girls, once its set is on the site
      const set = KID_LETTER_SET[kid] && ready[KID_LETTER_SET[kid]] ? KID_LETTER_SET[kid] : who;
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
      const a = new Audio(first.url);
      if (first.pitch && first.pitch !== 1) {
        // higher AND a touch quicker, as a child's voice is: the pitch is not held
        a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false;
        a.playbackRate = first.pitch;
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
      u.pitch = KIDS[item.kid]?.girl ? 1.55 : 1.3;
      // unhurried: a whole vowel, not a clipped one; a letter slower still (the user: "make it longer")
      u.rate = item.letter ? LETTER_RATE : 0.88;
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
  function clearScreen(cls = '') { onScreen = ''; screenCls = cls; showLetters('', cls); }
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
  async function host(text) {
    const tv = hall.querySelector('.bee-tv'), line = tv.querySelector('.bee-tv-host-line');
    const mouthEl = tv.querySelector('.bee-tv-host .bee-bot-mouth');
    const SHAPES = ['M24 48 L40 48', 'M25 47 Q32 50.5 39 47', 'M24.5 46 Q32 53 39.5 46', 'M27 46.5 Q32 52 37 46.5'];
    let flap = 0;
    {
      line.textContent = text;
      line.classList.remove('is-in'); void line.offsetWidth; line.classList.add('is-in');
      sayWord(text, null, { rate: 0.98 });
      flap = setInterval(() => { mouthEl.setAttribute('d', SHAPES[1 + Math.floor(Math.random() * 3)]); setTimeout(() => mouthEl.setAttribute('d', SHAPES[0]), 90); }, 190);
      await sleep(400);
      for (let t = 0; t < 120 && isTalking() && !gone && pace; t++) await sleep(100);
      clearInterval(flap); mouthEl.setAttribute('d', SHAPES[0]);
      await wait(250);
    }
  }
  async function tvIntro() {
    const tv = hall.querySelector('.bee-tv');
    tv.classList.remove('is-idle');
    tv.classList.add('is-off');
    await wait(500);
    tv.classList.replace('is-off', 'is-glitch');      // static, rolling bars, a flicker
    await wait(1300);
    tv.classList.replace('is-glitch', 'is-white');    // the picture comes up white
    await wait(450);
    tv.classList.add('is-host');                      // PrepBot pops up
    await wait(700);
    await host('Hello, learners! Welcome to the Prep Spelling Bee!');
    if (gone || !pace) return endIntro(tv);
    await host(`${seats.length} spellers. Listen to your word, spell it letter by letter, and do not miss a single one.`);
    if (gone || !pace) return endIntro(tv);
    await host('Are you ready? Let the bee begin!');
    tv.classList.add('is-title-card');                // the title lands under him
    sweep();
    await wait(1600);
    endIntro(tv);
  }
  function endIntro(tv) {
    tv.classList.add('is-glitch-out');
    setTimeout(() => tv.classList.remove('is-white', 'is-host', 'is-title-card', 'is-glitch', 'is-glitch-out', 'is-off'), 380);
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
    const name = SPELLER_NAMES[champ.kid] || champ.name;
    ovation(10);
    tv.classList.remove('is-idle');
    tv.classList.add('is-glitch');
    await wait(500);
    tv.classList.replace('is-glitch', 'is-white');
    tv.classList.add('is-host');
    await wait(600);
    await host(champ === mySeat ? 'Congratulations! You are the champion of the Prep Spelling Bee!' : `Congratulations, ${name}! You are the champion of the Prep Spelling Bee!`);
    if (gone) return;
    tv.classList.add('is-award');
    confetti();
    chime();
    await host('Here is your trophy, and your prize money: five thousand PrepCoins!');
    if (gone) return;
    await host('Well done, every speller. See you at the next bee!');
    await wait(1200);
    tv.classList.remove('is-white', 'is-host', 'is-award');
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
    const paint = () => {
      const left = Math.ceil((end - Date.now()) / 1000);
      clockEl.textContent = clock(left);
      clockEl.classList.toggle('is-low', left <= 10);
      if (left <= 0) { clearInterval(tick); onEnd?.(); }
    };
    paint();
    tick = setInterval(paint, 250);
  }
  const stopClock = () => { clearInterval(tick); clockEl.textContent = ''; clockEl.classList.remove('is-low'); };

  function mySpell(q, k) {
    return new Promise((resolve) => {
      say(`Your word, number ${mySeat.tag}. Spell it letter by letter (no backspaces), then press Done.`);
      committed = '';
      inputEl.disabled = false; inputEl.value = '';
      clearScreen('is-mine');
      toolsBtn.hidden = false;                     // the tools, folded away in the top bar
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
    if (to !== 'mic') hall.classList.remove('is-spot');     // the spotlight goes off as they leave
    el.classList.remove('is-gone');
    el.classList.add('is-standing');
    await wait(450);                               // up out of the chair first
    el.classList.add('is-walking');
    el.classList.toggle('is-at-mic', to === 'mic');
    el.classList.toggle('is-off', to === 'off');
    await wait(to === 'off' ? 2600 : 1700);
    el.classList.remove('is-walking');
    if (to === 'mic') hall.classList.add('is-spot');        // and on, on the speller at the microphone
    if (to === 'seat') { el.classList.remove('is-standing'); await wait(450); }
    if (to === 'off') el.classList.add('is-gone');
  }
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
  const myPlace = () => (mySeat ? (bee.placings.find((p) => p.seat === mySeat.seat) || {}).place ?? null : null);
  const leaveBtn = $('.bee-leave');
  leaveBtn.innerHTML = UI.close(18);
  leaveBtn.setAttribute('aria-label', 'Leave the bee');
  leaveBtn.dataset.tip = 'Leave the bee';
  leaveBtn.addEventListener('click', () => leave({ place: myPlace(), champion: null, placings: bee.placings }));
  // the spellers' voice: the speaker opens a list; the letters (and the word) follow the choice
  const voiceBtn = $('.bee-voice'), voiceList = $('.bee-voices');
  voiceBtn.innerHTML = UI.speaker(18);
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
  const fullBtn = $('.bee-full');
  fullBtn.innerHTML = UI.expand(18);
  fullBtn.setAttribute('aria-label', 'Full screen');
  fullBtn.dataset.tip = 'Full screen';
  fullBtn.addEventListener('click', () => { if (document.fullscreenElement) leaveFullscreen(); else beeFullscreen(); });
  const onFull = () => fullBtn.setAttribute('aria-pressed', document.fullscreenElement ? 'true' : 'false');
  document.addEventListener('fullscreenchange', onFull);
  skipBtn.addEventListener('click', () => { skipping = true; pace = 0; hush(); try { synth?.cancel(); } catch { /* ignore */ } spellerHush(); skipBtn.hidden = true; settle(); });

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
    say(`Welcome to the Prep Spelling Bee. ${seats.length} spellers. One wrong letter and you leave the stage.`);
    // the title, dropping onto the closed curtains tile by tile
    const marquee = $('.bee-marquee');
    [...'PREP SPELLING BEE'].forEach((ch, i) => { const t = tile(ch === ' ' ? ' ' : ch, 'is-new'); t.style.animationDelay = `${300 + i * 70}ms`; marquee.append(t); });
    await Promise.race([joined, sleep(2500)]);
    await wait(1200);
    bd.classList.add('is-curtains-open');           // the curtains sweep open and are tied back in gold
    await wait(1900);
    if (!gone && pace) await tvIntro();
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
        if (pace) bell();
        if (REACTIONS) el.classList.add('is-sad');
        await spoken();
        await wait(700);
        say(`The word was "${q.word}". ${seat === mySeat ? 'You leave' : `Number ${seat.tag} leaves`} the stage.`);
        await wait(2000);
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
