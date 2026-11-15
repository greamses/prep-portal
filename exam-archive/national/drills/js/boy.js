/* ═══════════════════════════════════════════════════════
   The boy who says the spelling words: his face, his voice, and his mouth.

   The face is media/characters/boy-face.svg put INTO the page (not an <img>),
   because its mouth is a group of shapes (<g class="mouth">) that moves. The
   mouth closes from the bottom up, about the line of the top lip
   (data-hinge): fully shut, the dark of the mouth narrows to a closed smile.

   He talks two ways:
     a recording (Kokoro, made once by tools/spelling-audio): the mouth makes
       the SHAPE of each sound (js/visemes.js: lips shut for m/b/p, round for
       "oo", wide for "ee", open for "a"...), each vowel on its syllable's swell
       of loudness, and opens as far as the sound is loud;
     the browser's voice, when there is no recording: the browser gives no
       sound to measure, so the mouth flaps in a syllable rhythm while it talks.
   Only the latest line counts: a line cut off by a newer one does not shut or
   open the face it is no longer talking through.
═══════════════════════════════════════════════════════ */
import { SHAPES, unitsFromIpa, unitsFromText, track } from './visemes.js';

export const FACE_SRC = '/media/characters/boy-face.svg';

const REST = 0.12;          // the mouth at rest: a closed smile
const SHUT = 0.1;           // the narrowest it goes while talking
let faceText = null;
const faceSvg = () => (faceText ||= fetch(FACE_SRC).then((r) => (r.ok ? r.text() : '')).catch(() => ''));

/* The mouth squeezed to a shape: `sy` how open (0.1 shut .. 1 as drawn), `sx`
   how wide (0.5 pursed .. 1 as drawn), about the top lip's line and the
   mouth's own middle. */
function setMouth(face, sy, sx = 1) {
  const g = face && face.querySelector('.mouth');
  if (!g) return;
  const y = Number(g.dataset.hinge) || 0;
  if (!g.dataset.cx) { try { const bb = g.getBBox(); g.dataset.cx = (bb.x + bb.width / 2).toFixed(1); } catch { g.dataset.cx = '618'; } }
  const x = Number(g.dataset.cx);
  const v = Math.max(SHUT, Math.min(1.45, sy));   // opens past the drawing for the open vowels
  g.setAttribute('transform', `translate(${x} ${y}) scale(${sx.toFixed(3)} ${v.toFixed(3)}) translate(${-x} ${-y})`);
}

/** The face as a button. Tapping it calls onPress(button). */
export function faceButton({ size = 88, label = 'Hear the word', tip = label, onPress } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'spell-face pp-plain';   // pp-plain: not a sticky note, a round face
  b.style.setProperty('--face', `${size}px`);
  b.setAttribute('aria-label', label);
  b.dataset.tip = tip;
  faceSvg().then((t) => {
    if (!t) return;
    b.insertAdjacentHTML('beforeend', t);
    const svg = b.querySelector('svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.querySelector('title')?.remove();
    setMouth(b, REST);
  });
  if (onPress) b.addEventListener('click', (e) => { e.stopPropagation(); onPress(b); });
  return b;
}

/* ── Who is talking ─────────────────────────────────────────────── */
let face = null;
let lineNo = 0;
let raf = 0;
let talking = false, stoppedAt = 0;
/** Whether he is talking now, or stopped less than `grace` ms ago (the mic ignores that). */
export const isTalking = (grace = 0) => talking || Date.now() - stoppedAt < grace;
function startTalking(f) {
  stopTalking();
  talking = true;
  face = f;
  if (face) face.classList.add('is-talking');
}
function stopTalking() {
  if (talking) stoppedAt = Date.now();
  talking = false;
  cancelAnimationFrame(raf);
  raf = 0;
  if (face) { face.classList.remove('is-talking'); setMouth(face, REST); }
  face = null;
}

/* ── A recording, with the mouth following its loudness ─────────────
   The clip is decoded once, its loudness worked out 60 times a second, and
   it is PLAYED through Web Audio from that same decoded sound. The mouth then
   reads the loudness at the audio clock's own position, less the device's
   output delay (a phone or Bluetooth speaker plays what it is given 0.1 to
   0.2 s later), so lips and sound line up exactly. Until the sound starts
   the mouth stays shut, rather than flapping out of time while it loads. */
const FPS = 60;
let ctx = null;
let source = null;
const clips = new Map();        // url -> Promise<{ buf, env } | null>
function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = AC ? new AC() : null;
  }
  return ctx;
}
function clipData(url) {
  if (clips.has(url)) return clips.get(url);
  const p = (async () => {
    try {
      const c = audioCtx();
      if (!c) return null;
      const data = await (await fetch(url)).arrayBuffer();
      const buf = await new Promise((ok, bad) => { const r = c.decodeAudioData(data, ok, bad); if (r && r.then) r.then(ok, bad); });
      const ch = buf.getChannelData(0);
      const hop = Math.max(1, Math.round(buf.sampleRate / FPS));
      const env = new Float32Array(Math.ceil(ch.length / hop));
      let peak = 0;
      for (let f = 0; f < env.length; f++) {
        let sum = 0;
        const from = f * hop, to = Math.min(ch.length, from + hop);
        for (let i = from; i < to; i++) sum += ch[i] * ch[i];
        env[f] = Math.sqrt(sum / Math.max(1, to - from));
        peak = Math.max(peak, env[f]);
      }
      // 0..1 against the clip's own loudest moment, with a floor for breath noise;
      // a gentle curve so ordinary syllables open the mouth well, not just the peaks
      for (let f = 0; f < env.length; f++) env[f] = Math.pow(Math.max(0, (env[f] / (peak || 1) - 0.1) / 0.9), 0.7);
      return { buf, env };
    } catch { clips.delete(url); return null; }
  })();
  clips.set(url, p);
  return p;
}

/** Move the mouth while line `me` lasts. `target()` gives { sx, sy }, or null to flap. */
function moveMouth(me, target) {
  cancelAnimationFrame(raf);
  let sy = REST, sx = 1;
  const step = () => {
    if (me !== lineNo || !face) return;
    let want = target();
    if (want == null) want = { sx: 1, sy: 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(performance.now() / 70)) };   // a syllable rhythm
    // lips move fast, but not in one jump: most of the way each frame
    sy += (want.sy - sy) * 0.6;
    sx = 1;                                        // the width never changes: mouths open, they do not slide sideways
    setMouth(face, sy, sx);
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

/* The shape to make at this moment: the sound's own shape, opened as far as
   the sound is loud (a shout opens wider than a whisper); lips pressed shut
   stay shut however loud the vowel either side of them is. */
function shapeAt(name, loud) {
  const sh = SHAPES[name] || SHAPES.rest;
  if (name === 'rest' || name === 'M') return sh;
  return { sx: sh.sx, sy: SHUT + (sh.sy - SHUT) * (0.45 + 0.55 * Math.min(1, loud * 1.4)) };
}

function playClip(url, me, onFail, units) {
  moveMouth(me, () => SHAPES.rest);                    // a closed smile while the clip loads
  clipData(url).then(async (data) => {
    if (me !== lineNo) return;
    const c = audioCtx();
    if (!data || !c) { onFail(); return; }
    // resume() can wait forever when the page may not make sound yet: give it a moment, no more
    if (c.state !== 'running') { try { await Promise.race([c.resume(), new Promise((r) => setTimeout(r, 400))]); } catch { /* not allowed yet */ } }
    if (me !== lineNo) return;
    if (c.state !== 'running') { onFail(); return; }  // the page may not make sound yet: the browser voice tries
    const src = c.createBufferSource();
    src.buffer = data.buf;
    src.connect(c.destination);
    const at = c.currentTime + 0.02;
    const lag = (c.outputLatency || 0) + (c.baseLatency || 0);
    src.onended = () => { if (me === lineNo) stopTalking(); };
    // never two voices: a browser line still waiting to start (Windows' speech engine can take
    // over a second) is dropped the moment the recording plays
    try { if (hasSynth) speechSynthesis.cancel(); } catch { /* ignore */ }
    src.start(at);
    console.info('[spelling voice] Kokoro recording:', url);
    source = src;
    const shapes = track(data.env, units || [], FPS);   // the shape for every frame of the clip
    moveMouth(me, () => {
      const t = c.currentTime - at - lag;
      if (t < 0) return SHAPES.rest;
      const f = Math.floor(t * FPS);
      return shapeAt(shapes[f] || 'rest', data.env[f] || 0);
    });
  });
}
/** Fetch and decode clips ahead of time (the next word), so the first syllable is not late. */
export function preloadClip(url) { if (url) clipData(url); }

/* ── The browser's voice ────────────────────────────────────────── */
export const canSpeak = typeof window !== 'undefined' && ('speechSynthesis' in window || typeof Audio !== 'undefined');
const hasSynth = typeof window !== 'undefined' && 'speechSynthesis' in window;
let voice = null;
function pickVoice() {
  try {
    const all = speechSynthesis.getVoices();
    if (!all.length) return;
    const en = all.filter((v) => /^en[-_]/i.test(v.lang) || v.lang === 'en');
    voice = en.find((v) => /en[-_]GB/i.test(v.lang)) || en.find((v) => /en[-_]US/i.test(v.lang)) || en[0] || null;
  } catch { /* no speech here */ }
}
if (hasSynth) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}
// A phone lets a page make sound only after a touch: the first tap or key
// anywhere unlocks both the speech engine and the audio context.
if (typeof document !== 'undefined') {
  const unlock = () => {
    try { if (hasSynth) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch { /* ignore */ }
    try { const c = audioCtx(); if (c && c.state !== 'running') c.resume(); } catch { /* ignore */ }
  };
  document.addEventListener('pointerdown', unlock, { once: true, capture: true });
  document.addEventListener('keydown', unlock, { once: true, capture: true });
}

function synthesise(text, me, rate) {
  if (!hasSynth) { stopTalking(); return; }
  console.info('[spelling voice] browser speech (no recording could play):', text);
  try {
    if (!voice) pickVoice();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-GB';
    u.rate = rate;
    u.onend = u.onerror = () => { if (me === lineNo) stopTalking(); };
    // cancel() does not always catch a line the engine has not started yet: if this one
    // only gets going after a newer line (a recording, say) took over, it stops at once
    u.onstart = () => { if (me !== lineNo) { try { speechSynthesis.cancel(); } catch { /* ignore */ } } };
    speechSynthesis.speak(u);
    moveMouth(me, () => null);   // nothing to measure: the mouth flaps while he talks
  } catch { stopTalking(); }
}

/**
 * Say a line through `f` (a face button, or null). With `clip`, play that
 * recording; without one, or if it will not play, use the browser's voice.
 */
export function sayWord(text, f = null, { rate = 0.8, clip = null, ipa = null } = {}) {
  hush();
  const me = ++lineNo;
  startTalking(f);
  // a word's sounds come from its IPA; a definition's or sentence's from its spelling
  const units = ipa ? unitsFromIpa(ipa) : unitsFromText(text);
  if (clip) playClip(clip, me, () => { if (me === lineNo) { console.info('[spelling voice] the recording would not play:', clip); synthesise(text, me, rate); } }, units);
  else synthesise(text, me, rate);
  return true;
}

export function hush() {
  lineNo++;
  stopTalking();
  try { if (hasSynth) speechSynthesis.cancel(); } catch { /* ignore */ }
  try { if (source) { source.onended = null; source.stop(); } } catch { /* already stopped */ }
  source = null;
}
