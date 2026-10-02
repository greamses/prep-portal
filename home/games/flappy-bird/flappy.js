// flappy.js — Math Flappy Bird
//
// Keep the bird in the air AND keep answering: a flap lifts it (Space, the up
// arrow, or a tap on the sky), the pipes come at it, and under the sky is a sum
// from the chosen table with four answers (click one, or press 1–4). A right
// answer is a point. A wrong answer, a pipe or the ground ends the flight.
//
// Everything on the canvas is drawn here — bird, pipes, clouds — in the theme's
// own colours, and every sound is a beep made on the spot (see SOUND below).
// (The game used to load its sprites from an image host that now refuses them,
// and its sounds from files that were never in the repo, which is why it sat
// broken; there is nothing left for it to fetch.)
//
// A classic script, like the other paper games: the page's buttons call
// openGame() / closeGame() / playAgain() directly.

// ---------- SETTINGS ----------
const OPERATIONS = {
  add: { label: 'Addition', sign: '+' },
  sub: { label: 'Subtraction', sign: '−' },
  mul: { label: 'Multiplication', sign: '×' },
  div: { label: 'Division', sign: '÷' },
};

const settings = { operation: 'mul', table: 2 };

// A link can arrive with the choice made: flappy.html?op=add&table=4 (the old
// per-operation pages now redirect here that way).
(() => {
  const qp = new URLSearchParams(location.search);
  const op = (qp.get('op') || '').toLowerCase();
  const table = parseInt(qp.get('table'), 10);
  if (OPERATIONS[op]) settings.operation = op;
  if (table >= 2 && table <= 9) settings.table = table;
})();

// Each group of sticky-note radios carries data-setting="<key>"; ticking one
// writes straight into `settings`.
document.querySelectorAll('[data-setting]').forEach((group) => {
  const key = group.dataset.setting;
  const pre = group.querySelector(`input[value="${settings[key]}"]`);
  if (pre) pre.checked = true;
  group.addEventListener('change', (e) => {
    settings[key] = key === 'table' ? parseInt(e.target.value, 10) : e.target.value;
  });
});

// ---------- THE SUMS ----------
// Each returns { text, answer, choices } — four different positive choices,
// the answer among them, shuffled.
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

function makeProblem(op, table) {
  let text, answer, near;
  if (op === 'add') {
    const n = randInt(1, 9);
    answer = table + n;
    text = `${table} + ${n} = ?`;
  } else if (op === 'sub') {
    // "17 − ? = 4": what was taken away to leave the table number.
    answer = randInt(2, 15);
    text = `${answer + table} − ? = ${table}`;
  } else if (op === 'div') {
    // "28 ÷ ? = 4": always a clean division.
    answer = randInt(2, 10);
    text = `${table * answer} ÷ ? = ${table}`;
  } else {
    const n = randInt(1, 12);
    answer = table * n;
    text = `${table} × ${n} = ?`;
    // Near misses for a times table are the neighbouring multiples.
    near = [answer - table, answer + table, answer - 1, answer + 1, answer + 2 * table, answer - 2];
  }
  if (!near) near = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3, answer - 3];

  const choices = [answer];
  near.sort(() => Math.random() - 0.5);
  for (const n of near) {
    if (choices.length === 4) break;
    if (n > 0 && !choices.includes(n)) choices.push(n);
  }
  for (let n = answer + 4; choices.length < 4; n++) if (!choices.includes(n)) choices.push(n);
  choices.sort(() => Math.random() - 0.5);
  return { text, answer, choices };
}

// ---------- SOUND ----------
// Four beeps, synthesised with Web Audio — no files. A beep is one oscillator
// sliding between two pitches under a quick fade, so there is no click at
// either end. The context is made on the first press (browsers refuse audio
// before one), and the player's on/off choice is remembered.
const SOUND_KEY = 'flappySound';
let soundOn = localStorage.getItem(SOUND_KEY) !== 'off';
let audioCtx = null;

function beep(from, to, seconds, { type = 'sine', volume = 0.14, delay = 0 } = {}) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const start = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + seconds);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  } catch (_) { /* no audio on this device — the game plays on in silence */ }
}

const SOUND = {
  flap: () => beep(420, 640, 0.09, { type: 'triangle', volume: 0.1 }), // a short rising chirp
  right: () => { beep(660, 660, 0.09); beep(990, 990, 0.14, { delay: 0.09 }); }, // two notes up
  wrong: () => beep(300, 150, 0.32, { type: 'square', volume: 0.08 }), // a low falling buzz
  crash: () => beep(220, 60, 0.4, { type: 'sawtooth', volume: 0.1 }), // a thud that drops away
};

// ---------- STATE ----------
const BEST_KEY = 'flappyBest';

const game = {
  phase: 'idle', // idle | ready (hovering, waiting for the first flap) | flying | over
  score: 0,
  best: Number(localStorage.getItem(BEST_KEY)) || 0,
  problem: null,
  answerLocked: false,
  bird: { x: 0, y: 0, v: 0, r: 0 },
  pipes: [],
  clouds: [],
  w: 0, h: 0, // the sky, in CSS pixels
  unit: 1, // every length and speed scales with the sky's height
  lastFrame: 0,
  raf: 0,
};

let canvas, ctx, sumEl, choicesEl, feedbackEl, scoreEl, bestEl, againBtn, colors;

// Tuned for a 530px-tall sky (the game's original size) and scaled from there,
// in pixels per 1/60 s. Frames are measured, so a 120Hz screen plays the same.
const GRAVITY = 0.25;
const FLAP = -3;
const PIPE_SPEED = 2;
const PIPE_WIDTH = 50;
const PIPE_GAP = 250;
const PIPE_SPACING = 300;
const BIRD_RADIUS = 26;

function readColors() {
  const css = getComputedStyle(document.documentElement);
  const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  colors = {
    pipe: token('--accent-success', '#7cc47c'),
    bird: token('--accent-primary', '#f4c95d'),
    beak: token('--accent-warning', '#f0a868'),
    wing: token('--accent-danger', '#f07a7a'),
    ink: '#14130f',
  };
}

// ---------- OPEN / CLOSE ----------
function openGame() {
  canvas = document.getElementById('flappy-sky');
  ctx = canvas.getContext('2d');
  sumEl = document.getElementById('flappy-sum');
  choicesEl = document.getElementById('flappy-choices');
  feedbackEl = document.getElementById('game-feedback');
  scoreEl = document.getElementById('flappy-score');
  bestEl = document.getElementById('flappy-best');
  againBtn = document.getElementById('again-btn');

  const modal = document.getElementById('game-modal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  // Game mode: the nav goes away, as it does in every other game's play view.
  document.body.classList.add('pgame-nav-hidden');
  document.body.style.overflow = 'hidden';
  // Space is the flap key; it must not also press whatever button has focus.
  if (document.activeElement) document.activeElement.blur();

  readColors();
  sizeSky();
  newFlight();
  cancelAnimationFrame(game.raf);
  game.lastFrame = 0;
  game.raf = requestAnimationFrame(frame);
}

function closeGame() {
  cancelAnimationFrame(game.raf);
  game.phase = 'idle';
  const modal = document.getElementById('game-modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('pgame-nav-hidden');
  document.body.style.overflow = '';
}

// The canvas is as big as CSS makes it; its bitmap matches the screen's pixels.
function sizeSky() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  game.w = rect.width;
  game.h = rect.height;
  game.unit = game.h / 530;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function newFlight() {
  const u = game.unit;
  game.score = 0;
  game.pipes = [];
  game.answerLocked = false;
  game.bird = { x: Math.max(40 * u, game.w * 0.16), y: game.h * 0.45, v: 0, r: BIRD_RADIUS * u };
  game.clouds = [
    { x: game.w * 0.15, y: game.h * 0.14, s: 1.0, speed: 0.25 },
    { x: game.w * 0.62, y: game.h * 0.3, s: 0.75, speed: 0.15 },
    { x: game.w * 0.9, y: game.h * 0.1, s: 0.6, speed: 0.2 },
  ];
  game.phase = 'ready';
  againBtn.hidden = true;
  updateScore();
  nextProblem();
  say(`${OPERATIONS[settings.operation].label}, table of ${settings.table}. Tap the sky or press Space to flap.`);
}

function playAgain() {
  if (game.phase === 'idle') return;
  newFlight();
}

// ---------- THE SUM AND ITS ANSWERS ----------
function nextProblem() {
  game.problem = makeProblem(settings.operation, settings.table);
  game.answerLocked = false;
  sumEl.textContent = game.problem.text;
  choicesEl.innerHTML = '';
  game.problem.choices.forEach((value, i) => {
    const key = document.createElement('button');
    key.type = 'button';
    key.className = `flappy-choice pp-sticky pp-note-btn pp-sticky--c${i % 6}`;
    key.dataset.value = String(value);
    key.innerHTML = `<small>${i + 1}</small><span>${value}</span>`;
    key.setAttribute('aria-label', `Answer ${value}`);
    // Keep focus off the keys: Space is for flapping.
    key.addEventListener('mousedown', (e) => e.preventDefault());
    key.addEventListener('click', () => answer(value));
    choicesEl.appendChild(key);
  });
}

function answer(value) {
  if (game.answerLocked || (game.phase !== 'flying' && game.phase !== 'ready')) return;
  game.answerLocked = true;
  const right = value === game.problem.answer;
  choicesEl.querySelectorAll('.flappy-choice').forEach((key) => {
    key.disabled = true;
    if (Number(key.dataset.value) === game.problem.answer) key.classList.add('is-right');
    else if (Number(key.dataset.value) === value) key.classList.add('is-wrong');
  });
  if (!right) { endFlight(`${value} was not it — ${game.problem.text.replace('?', game.problem.answer)}.`, SOUND.wrong); return; }
  SOUND.right();
  game.score += 1;
  updateScore();
  setTimeout(() => { if (game.phase === 'flying' || game.phase === 'ready') nextProblem(); }, 450);
}

function updateScore() {
  if (game.score > game.best) {
    game.best = game.score;
    try { localStorage.setItem(BEST_KEY, String(game.best)); } catch (_) { /* private mode */ }
  }
  scoreEl.textContent = `${game.score} correct`;
  bestEl.textContent = `best ${game.best}`;
}

function say(text, kind) {
  feedbackEl.textContent = text;
  feedbackEl.className = 'pgame-feedback' + (kind ? ` is-${kind}` : '');
}

function endFlight(why, sound = SOUND.crash) {
  if (game.phase === 'over') return;
  game.phase = 'over';
  sound();
  choicesEl.querySelectorAll('.flappy-choice').forEach((key) => {
    key.disabled = true;
    if (Number(key.dataset.value) === game.problem.answer) key.classList.add('is-right');
  });
  say(`${why} You answered ${game.score}.`, 'error');
  againBtn.hidden = false;
}

// ---------- FLYING ----------
function flap() {
  if (game.phase === 'over') return;
  if (game.phase === 'ready') {
    game.phase = 'flying';
    say('Keep flapping — and keep answering.');
  }
  if (game.phase === 'flying') { game.bird.v = FLAP * game.unit; SOUND.flap(); }
}

function addPipe() {
  const u = game.unit;
  const gap = PIPE_GAP * u;
  const margin = 50 * u;
  const top = margin + Math.random() * (game.h - gap - 2 * margin);
  // The first pipe starts part-way across, so a flight is not five seconds of
  // empty sky; the rest come in from the edge.
  game.pipes.push({ x: game.pipes.length || game.score ? game.w : game.w * 0.8, top, bottom: top + gap });
}

// `t` is the frame's length in sixtieths of a second.
function step(t) {
  const u = game.unit;
  const bird = game.bird;
  bird.v += GRAVITY * u * t;
  bird.y += bird.v * t;

  // The top of the sky is a ceiling, not a wall.
  if (bird.y - bird.r < 0) { bird.y = bird.r; bird.v = Math.abs(bird.v) * 0.5; }
  if (bird.y + bird.r > game.h) { bird.y = game.h - bird.r; endFlight('Down on the ground.'); return; }

  const width = PIPE_WIDTH * u;
  for (const pipe of game.pipes) {
    pipe.x -= PIPE_SPEED * u * t;
    // A little forgiveness: the bird is judged a touch smaller than it is drawn.
    const r = bird.r * 0.82;
    if (bird.x + r > pipe.x && bird.x - r < pipe.x + width && (bird.y - r < pipe.top || bird.y + r > pipe.bottom)) {
      endFlight('Into a pipe.');
      return;
    }
  }
  game.pipes = game.pipes.filter((pipe) => pipe.x > -width);
  const last = game.pipes[game.pipes.length - 1];
  if (!last || last.x < game.w - PIPE_SPACING * u) addPipe();
}

// ---------- DRAWING ----------
function drawCloud(cloud) {
  const s = cloud.s * game.unit * 1.6;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(cloud.x, cloud.y, 22 * s, 0, Math.PI * 2);
  ctx.arc(cloud.x + 26 * s, cloud.y - 10 * s, 26 * s, 0, Math.PI * 2);
  ctx.arc(cloud.x + 56 * s, cloud.y, 22 * s, 0, Math.PI * 2);
  ctx.rect(cloud.x, cloud.y, 56 * s, 22 * s);
  ctx.fill();
}

function drawPipe(pipe) {
  const u = game.unit;
  const width = PIPE_WIDTH * u;
  const lip = 6 * u;
  const lipH = 18 * u;
  const body = (y, h) => {
    ctx.fillStyle = colors.pipe;
    ctx.fillRect(pipe.x, y, width, h);
    // A darker edge down the right, so the pipe reads as round.
    ctx.fillStyle = 'rgba(20, 19, 15, 0.16)';
    ctx.fillRect(pipe.x + width * 0.68, y, width * 0.32, h);
  };
  const cap = (y) => {
    ctx.fillStyle = colors.pipe;
    ctx.fillRect(pipe.x - lip, y, width + 2 * lip, lipH);
    ctx.fillStyle = 'rgba(20, 19, 15, 0.22)';
    ctx.fillRect(pipe.x - lip, y + lipH - 3 * u, width + 2 * lip, 3 * u);
  };
  body(0, pipe.top);
  cap(pipe.top - lipH);
  body(pipe.bottom, game.h - pipe.bottom);
  cap(pipe.bottom);
}

function drawBird() {
  const { x, y, r, v } = game.bird;
  ctx.save();
  ctx.translate(x, y);
  // Nose up on a flap, down in a fall.
  ctx.rotate(Math.max(-0.5, Math.min(0.9, v / (9 * game.unit))));
  ctx.fillStyle = colors.bird;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors.wing;
  ctx.beginPath(); ctx.ellipse(-r * 0.25, r * 0.15, r * 0.5, r * 0.32, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors.beak;
  ctx.beginPath(); ctx.moveTo(r * 0.75, -r * 0.1); ctx.lineTo(r * 1.45, r * 0.12); ctx.lineTo(r * 0.75, r * 0.38); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(r * 0.38, -r * 0.3, r * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.beginPath(); ctx.arc(r * 0.46, -r * 0.28, r * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function draw(t) {
  ctx.clearRect(0, 0, game.w, game.h); // the sky itself is the canvas's CSS background
  for (const cloud of game.clouds) {
    if (game.phase !== 'over') cloud.x -= cloud.speed * game.unit * t;
    if (cloud.x < -120 * game.unit) cloud.x = game.w + 40 * game.unit;
    drawCloud(cloud);
  }
  game.pipes.forEach(drawPipe);
  // Ground: a strip of grass along the foot of the sky.
  ctx.fillStyle = colors.pipe;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, game.h - 6 * game.unit, game.w, 6 * game.unit);
  ctx.globalAlpha = 1;
  drawBird();
}

function frame(now) {
  // Capped, so a stalled tab does not come back with the bird through the
  // floor — at 5 a slow phone (12 frames a second) still flies at full speed.
  const t = game.lastFrame ? Math.min(5, (now - game.lastFrame) / (1000 / 60)) : 1;
  game.lastFrame = now;
  if (game.phase === 'flying') step(t);
  // Waiting for the first flap, the bird bobs in place.
  if (game.phase === 'ready') game.bird.y = game.h * 0.45 + Math.sin(now / 260) * 6 * game.unit;
  draw(t);
  if (game.phase !== 'idle') game.raf = requestAnimationFrame(frame);
}

// ---------- INPUT ----------
document.addEventListener('keydown', (e) => {
  if (game.phase === 'idle') return;
  if (e.key === ' ' || e.key === 'ArrowUp') {
    e.preventDefault(); // no page scroll, no pressing a focused button
    if (e.repeat) return;
    if (game.phase === 'over') playAgain(); else flap();
  } else if (['1', '2', '3', '4'].includes(e.key)) {
    const key = choicesEl.children[Number(e.key) - 1];
    if (key) answer(Number(key.dataset.value));
  } else if (e.key === 'Escape') {
    closeGame();
  }
});
// A button is pressed by Space on key-UP — swallow that too while playing.
document.addEventListener('keyup', (e) => {
  if (game.phase !== 'idle' && e.key === ' ') e.preventDefault();
});

document.addEventListener('DOMContentLoaded', () => {
  // The Sound tick in the play view.
  const soundTick = document.getElementById('flappy-sound');
  if (soundTick) {
    soundTick.checked = soundOn;
    soundTick.addEventListener('change', () => {
      soundOn = soundTick.checked;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (_) { /* private mode */ }
      if (soundOn) SOUND.right(); // let them hear what they turned on
      soundTick.blur(); // Space is the flap key, not this box's
    });
  }

  const sky = document.getElementById('flappy-sky');
  sky.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (game.phase === 'over') playAgain(); else flap();
  });
  window.addEventListener('resize', () => {
    if (game.phase === 'idle') return;
    sizeSky();
    // A resized sky is a new course — start the flight over rather than
    // leave pipes where the old one put them.
    newFlight();
  });
});

// ---------- EXPOSE TO GLOBAL ----------
window.openGame = openGame;
window.closeGame = closeGame;
window.playAgain = playAgain;
