// audio.js — WebAudio SFX (shoot / hit / miss) + procedural ambient music
let ctx = null;
let enabled = true;

export function initAudio() {
  if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function setSoundEnabled(v) { enabled = v; }

/* ============================================================
   Procedural ambient background music
   ============================================================ */
let musicOn = true;
let musicGain = null;
let musicTimer = null;
let musicStep = 0;

const CHORDS = [
  [110.00, 130.81, 164.81, 246.94], // Am add
  [ 98.00, 146.83, 196.00, 293.66], // G
  [ 87.31, 130.81, 174.61, 261.63], // F
  [ 82.41, 123.47, 164.81, 246.94], // Em
];
const CHORD_DUR = 5.0;

export function startMusic() {
  initAudio();
  if (!ctx || musicTimer) return;
  if (!musicGain) { musicGain = ctx.createGain(); musicGain.gain.value = 0.0001; musicGain.connect(ctx.destination); }
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.linearRampToValueAtTime(musicOn ? 0.18 : 0.0001, ctx.currentTime + 2.5);
  scheduleChord();
}

function scheduleChord() {
  if (!ctx) return;
  const now = ctx.currentTime;
  const chord = CHORDS[musicStep % CHORDS.length];
  musicStep++;

  chord.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = i === 0 ? 'triangle' : 'sine';
    osc.frequency.value = f;
    osc.detune.value = Math.random() * 8 - 4;
    const peak = i === 0 ? 0.3 : 0.17;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + 1.8);
    g.gain.exponentialRampToValueAtTime(0.0001, now + CHORD_DUR + 1.2);
    osc.connect(g); g.connect(musicGain);
    osc.start(now); osc.stop(now + CHORD_DUR + 1.3);
  });

  // gentle bell arpeggio
  const root = chord[3] * 2;
  [0, 7, 12, 7].forEach((semi, k) => {
    const t = now + 0.8 + k * 1.0;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = root * Math.pow(2, semi / 12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    osc.connect(g); g.connect(musicGain);
    osc.start(t); osc.stop(t + 1.6);
  });

  musicTimer = setTimeout(scheduleChord, CHORD_DUR * 1000);
}

export function setMusicEnabled(on) {
  musicOn = on;
  if (!musicGain || !ctx) return;
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.linearRampToValueAtTime(on ? 0.18 : 0.0001, ctx.currentTime + 0.6);
}

function tone(type, f0, f1, t0, t1, gain) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), now + t1);
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + t1);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(now + t0); osc.stop(now + t1 + 0.02);
}

function noise(dur, decay, gain) {
  const now = ctx.currentTime;
  const size = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * decay));
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(g); g.connect(ctx.destination);
  src.start(now);
}

export function playCharge(power) {
  if (!enabled) return;
  initAudio();
  if (!ctx) return;
  tone('sine', 200 + power * 500, 220 + power * 540, 0, 0.05, 0.05);
}

export function playShoot() {
  if (!enabled) return;
  initAudio();
  if (!ctx) return;
  tone('sawtooth', 120, 60, 0, 0.5, 0.2);
  tone('square', 400, 200, 0, 0.35, 0.08);
  tone('triangle', 300, 100, 0, 0.5, 0.1);
  noise(0.45, 0.15, 0.15);
}

export function playHit() {
  if (!enabled) return;
  initAudio();
  if (!ctx) return;
  tone('sawtooth', 150, 30, 0, 0.5, 0.35);
  tone('sine', 600, 150, 0, 0.45, 0.2);
  tone('triangle', 80, 40, 0, 0.35, 0.25);
  noise(0.6, 0.1, 0.3);
}

export function playMiss() {
  if (!enabled) return;
  initAudio();
  if (!ctx) return;
  tone('sine', 500, 200, 0, 0.6, 0.15);
  tone('triangle', 250, 80, 0, 0.5, 0.08);
  noise(0.6, 0.2, 0.1);
}
