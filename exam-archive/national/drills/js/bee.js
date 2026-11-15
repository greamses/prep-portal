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
import { openRoom, idFor } from '/utils/live/index.js';
import { UI } from '/utils/components/ui-icons.js';
import { heroPaint } from '/utils/components/nav-icons.js';

// the girl is the one with both hands down (made from girl.svg by tools/character-trace/hands-down.mjs)
const KID = { boy: '/media/characters/boy.svg', girl: '/media/characters/girl-hands-down.svg' };
/* Where each drawing's eyes and mouth are, in % of the picture: for the tears and the frown
   of a speller who has lost. mouth = [centre x, centre y, width, height]. */
const FACE = {
  boy: { eyes: [[39.5, 25.5], [67.5, 25.5]], mouth: [55, 30.7, 26, 5.6], skin: '#f6bf98', lip: '#8a3b2b' },
  girl: { eyes: [[39, 19.6], [60.5, 19.6]], mouth: [49.6, 24, 15, 2.8], skin: '#f3c3a9', lip: '#a4523f' },
};
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
    const want = kid === 'girl' ? /female|zira|hazel|susan|libby|sonia|aria|jenny|samantha|karen|moira|serena|emma/i
      : /male|david|george|ryan|guy|daniel|alex|arthur|thomas|oliver/i;
    cache[kid] = all.find((v) => want.test(v.name) && !/female/i.test(kid === 'boy' ? v.name : '')) || all.find((v) => /en[-_]GB/i.test(v.lang)) || all[0];
    return cache[kid];
  };
})();
const LETTER_WORD = { ' ': 'space', '-': 'hyphen', "'": 'apostrophe' };
const letterName = (ch) => LETTER_WORD[ch] || `${ch.toUpperCase()}.`;

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

/* The audience: rows of chairs filling the hall, the backs of heads above most of them. */
function audienceSvg(seed) {
  let s = (seed >>> 0) || 1;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const hairs = ['#1b1410', '#2b1d14', '#120d0a', '#3a2a1c', '#4a3322'];
  const wraps = ['#d0632f', '#2f7d6d', '#7c3f98', '#c79a1d'];
  const rows = [{ y: 52, k: 0.78 }, { y: 136, k: 0.92 }, { y: 228, k: 1.08 }];
  const skins = ['#6b4026', '#8d5a3b', '#4a2c1a', '#a8714d', '#7a4a2e'];
  let out = '', hands = '';
  rows.forEach((row, r) => {
    const gap = 96 * row.k, w = 74 * row.k, h = 64 * row.k;
    for (let x = (r % 2 ? gap / 2 : 0) - 30; x < 1640; x += gap) {
      const cx = x + w / 2;
      if (rnd() < 0.82) {
        const hr = 24 * row.k;
        out += `<ellipse cx="${cx}" cy="${row.y - h * 0.15}" rx="${hr}" ry="${hr * 1.12}" fill="${hairs[Math.floor(rnd() * hairs.length)]}"/>`;
        // their hands, up in front of their faces: drawn last, over every row behind them
        if (rnd() < 0.8) {
          const headY = row.y - h * 0.15, skin = skins[Math.floor(rnd() * skins.length)];
          const sleeve = ['#c9d4e6', '#e7c9a8', '#b9d7c2', '#e3b8b8', '#d9cfe8'][Math.floor(rnd() * 5)];
          const arm = (side) => {
            const sx = cx + side * hr * 1.35, sy = headY + hr * 0.95;          // the shoulder
            const hx = cx + side * hr * 0.55, hy = headY - hr * 1.25;          // the hand, above the head
            return `<g class="bee-hand bee-hand--${side < 0 ? 'l' : 'r'}">` +
              `<line x1="${sx}" y1="${sy}" x2="${hx}" y2="${hy + hr * 0.3}" stroke="${sleeve}" stroke-width="${hr * 0.55}" stroke-linecap="round"/>` +
              `<ellipse cx="${hx}" cy="${hy}" rx="${hr * 0.36}" ry="${hr * 0.5}" fill="${skin}"/></g>`;
          };
          hands += `<g class="bee-aud-hands" style="--d:-${(rnd() * 0.3).toFixed(2)}s">${arm(-1)}${arm(1)}</g>`;
        }
        if (rnd() < 0.18) out += `<path d="M${cx - hr * 1.1} ${row.y - h * 0.3} Q${cx} ${row.y - h * 1.15} ${cx + hr * 1.1} ${row.y - h * 0.3} Z" fill="${wraps[Math.floor(rnd() * wraps.length)]}"/>`;
        out += `<rect x="${cx - hr * 1.5}" y="${row.y + h * 0.18}" width="${hr * 3}" height="${h}" fill="${['#c9d4e6', '#e7c9a8', '#b9d7c2', '#e3b8b8', '#d9cfe8'][Math.floor(rnd() * 5)]}" opacity=".85"/>`;
      }
      out += `<rect x="${x}" y="${row.y}" width="${w}" height="${h}" fill="#2f4c7a"/><rect x="${x + 5 * row.k}" y="${row.y + 5 * row.k}" width="${w - 10 * row.k}" height="${h * 0.45}" fill="#3c5d92"/>`;
    }
  });
  return `<svg viewBox="0 0 1600 270" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${out}${hands}</svg>`;
}

/* The judges' table: three judges, the head judge in the middle. Her mouth is a <g
   class="mouth"> so the talking-mouth code (js/boy.js) moves it as she speaks. 300 x 160. */
function judgesSvg() {
  const judge = (cx, { skin, hair, shirt, tie, headwrap, glasses, head }) => `
    <path d="M${cx - 33} 128 Q${cx - 33} 80 ${cx} 78 Q${cx + 33} 80 ${cx + 33} 128 Z" fill="${shirt}"/>
    <rect x="${cx - 7}" y="66" width="14" height="14" fill="${skin}"/>
    <path d="M${cx - 8} 79 L${cx} 95 L${cx + 8} 79 Z" fill="#f4f1ea"/>
    ${tie ? `<path d="M${cx - 2.6} 81 h5.2 l2.4 16 -5 5 -5 -5 Z" fill="${tie}"/>` : ''}
    <circle cx="${cx - 17}" cy="51" r="4.5" fill="${skin}"/><circle cx="${cx + 17}" cy="51" r="4.5" fill="${skin}"/>
    <ellipse cx="${cx}" cy="49" rx="17" ry="20" fill="${skin}"/>
    ${headwrap ? `<path d="M${cx - 22} 42 Q${cx - 26} 14 ${cx} 16 Q${cx + 28} 12 ${cx + 24} 40 Q${cx + 34} 22 ${cx + 20} 14 Q${cx} 2 ${cx - 22} 20 Z" fill="${headwrap}"/><path d="M${cx - 21} 40 Q${cx} 26 ${cx + 21} 40 L${cx + 20} 33 Q${cx} 20 ${cx - 20} 33 Z" fill="${headwrap}" opacity=".75"/>`
      : `<path d="M${cx - 17} 44 Q${cx - 18} 26 ${cx} 27 Q${cx + 18} 26 ${cx + 17} 44 Q${cx + 12} 33 ${cx} 34 Q${cx - 12} 33 ${cx - 17} 44 Z" fill="${hair}"/>`}
    <path d="M${cx - 10} 42 h6 M${cx + 4} 42 h6" stroke="#2a1d16" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="${cx - 6.5}" cy="48" r="2.1" fill="#2a1d16"/><circle cx="${cx + 6.5}" cy="48" r="2.1" fill="#2a1d16"/>
    ${glasses ? `<circle cx="${cx - 6.5}" cy="48" r="5" fill="none" stroke="#3b3b3b" stroke-width="1.3"/><circle cx="${cx + 6.5}" cy="48" r="5" fill="none" stroke="#3b3b3b" stroke-width="1.3"/><path d="M${cx - 1.5} 48 h3" stroke="#3b3b3b" stroke-width="1.3"/>` : ''}
    <path d="M${cx - 1.5} 51 q1.5 4 3 0" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/>
    ${head ? `<g class="mouth" data-hinge="58"><path d="M${cx - 6.5} 58 Q${cx} 58.6 ${cx + 6.5} 58 Q${cx + 4} 66 ${cx} 66 Q${cx - 4} 66 ${cx - 6.5} 58 Z" fill="#5e2420"/><path d="M${cx - 4.5} 58.4 h9 v2 h-9 Z" fill="#f4f1ea"/></g>`
      : `<path d="M${cx - 5.5} 58.5 Q${cx} 62.5 ${cx + 5.5} 58.5" fill="none" stroke="#5e2420" stroke-width="1.8" stroke-linecap="round"/>`}`;
  const hands = (cx, skin, shirt, d) => {
    const arm = (side) => `<g class="bee-hand bee-hand--${side < 0 ? 'l' : 'r'}">` +
      `<line x1="${cx + side * 24}" y1="100" x2="${cx + side * 10}" y2="88" stroke="${shirt}" stroke-width="9" stroke-linecap="round"/>` +
      `<line x1="${cx + side * 24}" y1="100" x2="${cx + side * 10}" y2="88" stroke="rgba(0,0,0,.18)" stroke-width="9" stroke-linecap="round" stroke-dasharray="0 1"/>` +
      `<ellipse cx="${cx + side * 8}" cy="83" rx="5.5" ry="8" fill="${skin}" stroke="rgba(0,0,0,.25)" stroke-width=".8"/></g>`;
    return `<g class="bee-hands" style="--d:${d}s">${arm(-1)}${arm(1)}</g>`;
  };
  const card = (cx, text) => `<rect x="${cx - 26}" y="104" width="52" height="16" fill="#fbf8f1"/><text x="${cx}" y="115.5" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" fill="#2a2723">${text}</text>`;
  return `<svg viewBox="0 0 300 160" aria-hidden="true">
    ${judge(52, { skin: '#8d5a3b', hair: '#1a1210', shirt: '#2d3e5c', tie: '#9b2f3a', glasses: true })}
    ${judge(150, { skin: '#6b4026', headwrap: '#c6531f', shirt: '#7c3f98', head: true })}
    ${judge(248, { skin: '#a8714d', hair: '#22160f', shirt: '#2f6e5c', tie: '#d9b44a' })}
    ${hands(52, '#8d5a3b', '#253350', -0.05)}${hands(150, '#6b4026', '#69337f', -0.17)}${hands(248, '#a8714d', '#265c4c', -0.1)}
    <rect x="0" y="94" width="300" height="10" fill="#27406b"/>
    <rect x="0" y="104" width="300" height="56" fill="#2f4c7a"/>
    <rect x="0" y="104" width="300" height="5" fill="#d9b44a"/>
    ${card(52, 'JUDGE')}${card(150, 'HEAD JUDGE')}${card(248, 'JUDGE')}
  </svg>`;
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
  const seats = seatSpellers(seed, humans, botsNeeded);
  const bee = createBee(seats.length);
  const mySeat = seats.find((s) => s.uid === me.uid) || null;
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
      <button type="button" class="bee-full"></button>
      <button type="button" class="bee-leave"></button>
    </div>
    <div class="bee-hall">
      <div class="bee-backdrop"></div>
      <span class="pp-sticky pp-sticky--c0 pp-sticky--tape bee-banner">Spelling Bee</span>
      <div class="bee-judges"></div>
      <div class="bee-stand" aria-hidden="true"><svg viewBox="0 0 20 100" preserveAspectRatio="xMidYMax meet"><rect x="5" y="2" width="10" height="17" rx="5" fill="#3b3b3b"/><rect x="6.5" y="5" width="7" height="2" fill="#6b6b6b"/><rect x="8.8" y="18" width="2.4" height="76" fill="#8a8f96"/><rect x="1" y="93" width="18" height="5" rx="2.5" fill="#3b3b3b"/></svg></div>
      <div class="bee-audience"></div>
    </div>
    <div class="pp-receipt bee-panel">
      <div class="pp-receipt__paper bee-paper">
        <p class="bee-status" aria-live="polite"></p>
        <div class="bee-spell">
          <p class="bee-letters"></p>
          <input class="bee-input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="40" aria-label="Spell the word, one letter at a time. Letters cannot be taken back." disabled />
        </div>
        <p class="bee-clock"></p>
        <div class="bee-tools" hidden></div>
        <p class="bee-heard" hidden></p>
        <button type="button" class="pp-btn pp-btn--ghost bee-skip" hidden>Skip to the result</button>
      </div>
    </div>
    <div class="bee-results" hidden>
      <div class="pp-receipt bee-results-card">
        <div class="pp-receipt__paper bee-results-paper">
          <p class="bee-results-kicker">Spelling Bee</p>
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
  const roundEl = $('.bee-round'), leftEl = $('.bee-left');

  // the spellers, in their chairs, tags on
  const kids = seats.map((s) => {
    const spot = seatSpot(seats.length, s.seat);
    const f = FACE[s.kid];
    const el = document.createElement('div');
    el.className = `bee-kid bee-kid--${spot.row}${s === mySeat ? ' is-me' : ''}`;
    el.style.setProperty('--x', spot.x);
    el.style.setProperty('--y', spot.y);
    /* The rig. The picture is one flat drawing, so it is used three times: the body
       (head to hips, with the hands), and each leg on its own from the hip down. Walking,
       the legs take turns to lift (a leg coming towards you looks shorter) while the body
       bobs and sways. Sitting, the body comes down onto the knees: from the front a seated
       child's thighs point at you and are not seen. See bee.css. */
    const pic = () => { const i = document.createElement('img'); i.src = KID[s.kid]; i.alt = ''; i.draggable = false; return i; };
    const rig = document.createElement('div');
    rig.className = 'bee-kid-rig';
    const body = document.createElement('div');
    body.className = 'bee-kid-body';
    const tag = document.createElement('span');
    tag.className = `pp-sticky ${s === mySeat ? 'pp-sticky--c4' : 'pp-sticky--c3'} bee-tag`;
    tag.textContent = s.tag;
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
    body.append(pic(), tag, frown, ...tears);
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
    chair.innerHTML = CHAIR;
    hall.append(chair);
    if (s === mySeat) { const you = document.createElement('span'); you.className = 'pp-pill pp-pill--static bee-you'; you.textContent = 'You'; el.append(you); }
    el.setAttribute('aria-label', `Number ${s.tag}, ${s.name}`);
    hall.append(el);
    return el;
  });
  document.body.append(bd);
  document.body.classList.add('drill-nav-hidden');
  if (!document.fullscreenElement) beeFullscreen();   // allowed only if the Start tap is still fresh

  /* ── Pace: 1 as it happens, less to catch up, 0 to skip to the end ── */
  let gone = false, skipping = false, pace = 1;
  const wait = (ms) => (gone || !pace ? Promise.resolve() : sleep(ms * pace));
  const say = (text) => { statusEl.textContent = text; };
  const who = (s) => `Number ${s.tag}, ${s.name}${s === mySeat ? ' (you)' : ''}`;
  const showLetters = (typed, cls = '') => { lettersEl.textContent = spaced(typed); lettersEl.className = `bee-letters ${cls}`; };
  function pills() {
    roundEl.textContent = `Round ${bee.round}`;
    const n = bee.alive.length;
    leftEl.textContent = `${n} ${n === 1 ? 'speller' : 'spellers'} left`;
  }

  /* A speller says something in their own (browser) voice. */
  function spellerSays(text, kid) {
    if (!synth || gone || !pace) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      const v = voiceFor(kid);
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'en-GB';
      u.pitch = kid === 'girl' ? 1.55 : 1.3;
      u.rate = 0.95;
      synth.speak(u);
    } catch { /* no speech here */ }
  }
  /** Wait for the spellers' voice to finish (a letter typed fast queues up). */
  async function spellerDone(max = 9000) {
    const t0 = Date.now();
    await sleep(150);
    while (synth && !gone && pace && (synth.speaking || synth.pending) && Date.now() - t0 < max) await sleep(120);
  }
  /** Say the letters of `after` that are not in `before` (the letters are only ever added to). */
  function sayNewLetters(before, after, kid) {
    if (!after.startsWith(before)) before = '';
    for (const ch of after.slice(before.length)) spellerSays(letterName(ch), kid);
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
    r.presence.set({ seat: mySeat ? mySeat.seat : -1 });
    r.on('presence', (people) => { const t = Date.now(); for (const p of people) present.set(String(p.id).split(':')[0], t); });
    r.on('state', (s) => { for (const [key, v] of Object.entries(s || {})) { const m = /^r(\d+)$/.exec(key); if (m && v) land(Number(m[1]), v); } });
    r.on('spell', (p) => { if (p && p.k === nowK && theirTyping) theirTyping(String(p.v || '')); });
    r.on('ask', (p) => { if (p && p.k === nowK && nowQ) speak(p.kind); });
  }).catch((e) => console.warn('[bee] no live room; playing on this device only:', e));
  const beat = setInterval(() => { try { room?.presence.set({ seat: mySeat ? mySeat.seat : -1 }); } catch { /* ignore */ } }, 5000);
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
    showLetters(v, 'is-mine');
    // each letter is said as it goes in, in my voice (a letter I said into the mic I have already said)
    if (!fromMic) sayNewLetters(before, v, mySeat.kid);
    try { room?.send('spell', { k: nowK, v }); } catch { /* ignore */ }
  }
  const mic = createSpellMic({
    interim: false,                                    // a letter here cannot be taken back: final words only
    quiet: () => !isTalking(350) && !(synth && synth.speaking),
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
  const micBtn = tool('drill-mic', UI.mic(22), 'Spell out loud: mic on or off', () => {
    micWanted = !mic.on;
    try { localStorage.setItem(MIC_KEY, micWanted ? '1' : '0'); } catch { /* storage blocked */ }
    if (micWanted) mic.start(); else mic.stop();
    inputEl.focus();
  });
  micBtn.hidden = !canListen;
  micBtn.setAttribute('aria-pressed', 'false');
  tool('bee-again', UI.speaker(22), 'May I have the word again?', () => ask('w')).hidden = !canSpeak;
  tool('bee-def', UI.book(22), 'May I have the definition?', () => ask('d')).hidden = !canSpeak;
  tool('bee-use', UI.speech(22), 'May I have it in a sentence?', () => ask('s')).hidden = !canSpeak;
  tool('bee-root', UI.roots(22), 'May I have the part of speech and the origin?', () => ask('o')).hidden = !canSpeak;
  tool('bee-done', UI.check(22), 'Done: that is my spelling (Enter)', () => { if (finishMine && committed) finishMine(false); else inputEl.focus(); });
  inputEl.addEventListener('input', () => onType(false));
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (finishMine && committed) finishMine(false); return; }
    if (/^(Backspace|Delete|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End)$/.test(e.key)) {
      e.preventDefault();
      if (e.key === 'Backspace' || e.key === 'Delete') heardEl.hidden = false, heardEl.textContent = 'There are no backspaces at a spelling bee. Carry on, then press Done.';
    }
  });
  ['select', 'click', 'focus'].forEach((t) => inputEl.addEventListener(t, keepEnd));
  inputEl.addEventListener('paste', (e) => e.preventDefault());   // letters come one at a time
  $('.bee-spell').addEventListener('click', () => { if (!inputEl.disabled) inputEl.focus(); });

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
      showLetters('', 'is-mine');
      toolsEl.hidden = false;
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
      showLetters('');
      let heard = '';
      theirTyping = (v) => { showLetters(v); sayNewLetters(heard, v, seat.kid); heard = v; };
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
    showLetters('');
    if (pace) {
      await wait(Math.min(2200, b.ms / 3));
      for (let n = 1; n <= b.typed.length && !gone && pace; n++) {
        showLetters(b.typed.slice(0, n));
        spellerSays(letterName(b.typed[n - 1]), seat.kid);
        await wait(720);
      }
    }
    return { ok: b.ok, t: b.typed };
  }

  /* ── Walking ─────────────────────────────────────────────────── */
  async function walk(el, to) {
    el.classList.remove('is-gone');
    el.classList.add('is-standing');
    await wait(450);                               // up out of the chair first
    el.classList.add('is-walking');
    el.classList.toggle('is-at-mic', to === 'mic');
    el.classList.toggle('is-off', to === 'off');
    await wait(to === 'off' ? 2600 : 1700);
    el.classList.remove('is-walking');
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
  const fullBtn = $('.bee-full');
  fullBtn.innerHTML = UI.expand(18);
  fullBtn.setAttribute('aria-label', 'Full screen');
  fullBtn.dataset.tip = 'Full screen';
  fullBtn.addEventListener('click', () => { if (document.fullscreenElement) leaveFullscreen(); else beeFullscreen(); });
  const onFull = () => fullBtn.setAttribute('aria-pressed', document.fullscreenElement ? 'true' : 'false');
  document.addEventListener('fullscreenchange', onFull);
  skipBtn.addEventListener('click', () => { skipping = true; pace = 0; hush(); try { synth?.cancel(); } catch { /* ignore */ } skipBtn.hidden = true; settle(); });

  function showResults() {
    const champ = seats[bee.champion];
    $('.bee-results-title').textContent = champ === mySeat ? 'You are the champion!' : `Champion: number ${champ.tag}, ${champ.name}`;
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
      name.textContent = `No. ${s.tag} ${s.name}${s === mySeat ? ' (you)' : ''}`;
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
    say(`Welcome to the Spelling Bee. ${seats.length} spellers. One wrong letter and you leave the stage.`);
    await Promise.race([joined, sleep(2500)]);
    await wait(2200);
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
      showLetters(''); stopClock();
      say(`${who(seat)}, to the microphone.`);
      await walk(el, 'mic');
      if (gone) break;
      // "Your word is ..." and the word
      say('The judge: "Your word is ..."');
      judgeSays('yourWordIs');
      await spoken();
      speak('w');
      await spoken();
      const r = seat.bot != null ? await botSpell(seat, q, k)
        : seat === mySeat ? await mySpell(q, k)
        : await theirSpell(seat, q, k);
      if (gone) break;
      await spellerDone();            // the last letter is said before the judge answers
      if (gone) break;
      // the verdict
      if (r.ok) {
        showLetters(r.t || q.word, 'is-right');
        say('The judge: "Correct."');
        judgeSays('correct');
        if (pace) chime();
        await spoken();
        say('Correct! The hall claps.');
        clap(2.4);
        await wait(2200);
      } else {
        showLetters(r.t || '', 'is-wrong');
        say(r.t ? 'The judge: "Incorrect."' : 'Time is up. The judge: "Incorrect."');
        judgeSays('incorrect');
        if (pace) bell();
        el.classList.add('is-sad');
        await spoken();
        await wait(700);
        showLetters(q.word, 'is-answer');
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
        await wait(1600);
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
    chime();
    clap(5);
    await walk(kids[champ.seat], 'mic');
    await wait(1200);
    if (!gone) showResults();
  })();

  return done;
}
