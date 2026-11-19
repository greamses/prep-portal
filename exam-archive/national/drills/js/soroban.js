/* ═══════════════════════════════════════════════════════
   DRILLS — Soroban (flash anzan): numbers flash one after another, shown as a
   soroban, as figures, or both; the player adds and takes them away in their
   head and types the total. A session is a number of sums.

   Setup (main.js): show (tool / number / both), the test (simple, small friends
   = the fives, big friends = the tens), add / subtract, and four sliders: sums
   in the session (5-100), digits (1-6), speed (how long each number shows) and
   delay (the blank between numbers). Speed and delay ranges grow with the
   digits: one digit 0.45-2 s and 1-4 s, six digits 2-10 s and 3-6 s, the
   others in between (speedRange / delayRange).

   The TEST is checked bead by bead (moveKinds): adding d to a rod holding c is
     simple      the beads go straight on (no five, no ten): 1 + 3, 5 + 2, 6 + 3
     small       it needs the five bead's friend: 3 + 4 = 3 + 5 − 1
     big         it carries to the next rod: 7 + 5 = 7 + 10 − 5
   (taking away the same, backwards). A number in a session that tests "small
   friends" uses at least one small-friend move and nothing beyond what was
   picked; "simple" alone keeps every move simple.

   Two halves, the same split as bars.js and grid.js:
     · the SEEDED GENERATOR (sorobanSum) — pure, so every player in a room gets
       the identical sums with zero network;
     · the ROUND RUNNER (startSorobanRound) — the flash, the answer, the score.

   The soroban is drawn in the 2D look of the Manipulatives workbench's own
   (prep-math/activity/base-blocks/js/abacus.js): the orange timber frame, grey
   rods, the reckoning bar, bicone beads in the place colours (yellow ones, blue
   tens, green hundreds, again for each period), the heaven beads a shade darker,
   and its spacing (rod pitch 1.55, bead slot 1.1, travel 1.45, bar gap 1.0).
═══════════════════════════════════════════════════════ */
import { mulberry32, hashSeed, CONTENT_NS } from '/utils/games/rng.js';

export const SOROBAN_OPS = ['sorAdd', 'sorSub'];
export const SOROBAN_TERMS = 5;                       // numbers flashed in one sum, unless the setup says (5-100)
export const termsOf = (cfg) => Math.round(Math.min(100, Math.max(5, Number(cfg && cfg.terms) || SOROBAN_TERMS)));
const lerp = (a, b, t) => a + (b - a) * t;
const at = (d) => (Math.min(6, Math.max(1, d)) - 1) / 5;
/** seconds each number shows: one digit 0.45-2, six digits 2-10 */
export const speedRange = (d) => [+lerp(0.45, 2, at(d)).toFixed(2), +lerp(2, 10, at(d)).toFixed(2)];
/** the blank between numbers: one digit 1-4 s, six digits 3-6 s */
export const delayRange = (d) => [+lerp(1, 3, at(d)).toFixed(2), +lerp(4, 6, at(d)).toFixed(2)];
/** time to type the total once the last number has gone */
export const answerSeconds = (d) => 6 + 2 * d;
const FEEDBACK_S = 1.6;
const START_BUFFER_MS = 3000;
/** the longest a session can take (every answer box run to its end): the room's clock */
export function sessionSeconds(cfg) {
  const per = termsOf(cfg) * (cfg.speed + cfg.delay) + answerSeconds(cfg.digits) + FEEDBACK_S;
  return Math.min(10000, Math.ceil(cfg.count * per + 6));
}

/* ── the beads ─────────────────────────────────────────────────────────── */
/** The kind of move adding (or taking) digit d on a rod that holds c. */
function kindOf(c, d, add) {
  if (!d) return null;
  if (add) {
    if (c + d > 9) return 'big';
    return d < 5 && (c % 5) + d > 4 ? 'small' : 'simple';
  }
  if (c - d < 0) return 'big';
  return d < 5 && (c % 5) < d ? 'small' : 'simple';
}
/** Every bead move of adding or taking n from total, rod by rod. The carry's +1 (or the borrow's −1)
 *  on the next rod is part of the big-friend move that made it: counted only when `ripple`. */
export function moveKinds(total, n, add, ripple = false) {
  const rods = String(total).split('').reverse().map(Number);
  const ds = String(n).split('').reverse().map(Number);
  const kinds = [];
  const len = Math.max(rods.length, ds.length) + 2;
  while (rods.length < len) rods.push(0);
  for (let i = 0; i < ds.length; i++) {
    let r = i, d = ds[i];
    const k = kindOf(rods[r], d, add);
    if (k) kinds.push(k);
    rods[r] += add ? d : -d;
    // the carry (or the borrow) ripples left as +1 / −1 moves
    while (rods[r] > 9 || rods[r] < 0) {
      rods[r] += rods[r] > 9 ? -10 : 10;
      r += 1;
      const k2 = kindOf(rods[r], 1, add);
      if (k2 && ripple) kinds.push(k2);
      rods[r] += add ? 1 : -1;
    }
  }
  return kinds;
}

/** Sum i of a session: the numbers (signed) and the total. Pure and seeded.
 *  Each number is one the test allows (every bead move simple, or a friend that was picked), and it
 *  is chosen so the sum can go on: a number that would leave no allowed next one is passed over
 *  (adding only, simple only, one digit: 1 + 2 + 1 + 3 + 1, never 8 + 1 then stuck). A sum of
 *  taking away only starts from a bigger number, so there is room to take away four times. */
export function sorobanSum(seed, i, cfg, operations) {
  const rng = mulberry32(hashSeed(seed, CONTENT_NS + 7300 + i));
  const d = Math.min(6, Math.max(1, cfg.digits || 1));
  const TERMS = termsOf(cfg);
  const lo = d === 1 ? 1 : 10 ** (d - 1), hi = 10 ** d - 1;
  const rand = () => lo + Math.floor(rng() * (hi - lo + 1));
  const tests = new Set(cfg.tests && cfg.tests.length ? cfg.tests : ['simple']);
  const friends = ['small', 'big'].filter((k) => tests.has(k));
  const ops = (operations || ['sorAdd']).filter((o) => SOROBAN_OPS.includes(o));
  const canAdd = !ops.length || ops.includes('sorAdd'), canSub = ops.includes('sorSub');
  // strict: testing friends only, every number uses one. Not always possible (small friends only,
  // adding only: once the rod passes five there is no small friend left without a carry), so a sum
  // that cannot be made strictly lets simple numbers in. A move the test did not pick: never.
  let strict = true;
  const fits = (total, n, add) => {
    if (!add && total - n < 0) return false;
    const ks = moveKinds(total, n, add);
    if (ks.some((k) => k !== 'simple' && !tests.has(k))) return false;
    return !strict || tests.has('simple') || ks.some((k) => friends.includes(k));
  };
  // the numbers to try: all of them when there are few; else built rod by rod, each digit one the
  // test allows on the rod it lands on (random big numbers would nearly all carry somewhere)
  const pool = (total, add) => {
    if (hi - lo < 200) { const a = []; for (let n = lo; n <= hi; n++) a.push(n); return a; }
    const rods = String(total).padStart(d, '0').slice(-d).split('').map(Number);   // the d rods it touches, biggest first
    const out = [];
    for (let k = 0; k < 160; k++) {
      let str = '';
      for (let r = 0; r < d; r++) {
        const okDigits = [];
        for (let x = r === 0 ? 1 : 0; x <= 9; x++) {
          const kind = kindOf(rods[r], x, add);
          if (!kind || kind === 'simple' || tests.has(kind)) okDigits.push(x);
        }
        if (!okDigits.length) { str = ''; break; }
        // one way only, no carries: small digits keep room on the rods for the numbers to come
        const ix = Math.floor(rng() * okDigits.length), iy = Math.floor(rng() * okDigits.length), iz = Math.floor(rng() * okDigits.length);
        // (the lead rod takes a digit from every number: the smallest, or the rod overflows by the ninth)
        str += okDigits[tests.has('big') || canAdd === canSub ? ix : r === 0 ? 0 : Math.min(ix, iy, iz)];
      }
      if (str) out.push(Number(str));
    }
    return out;
  };
  const shuffle = (a) => { for (let k = a.length - 1; k > 0; k--) { const r = Math.floor(rng() * (k + 1)); [a[k], a[r]] = [a[r], a[k]]; } return a; };
  const options = (total) => {
    const out = [];
    if (canAdd) for (const n of pool(total, true)) if (fits(total, n, true)) out.push(n);
    if (canSub) for (const n of pool(total, false)) if (fits(total, n, false)) out.push(-n);
    return shuffle(out);
  };
  // a whole sum that fits, found by trying and backing out of dead ends (a few hundred tries at most)
  let budget = 500;
  const room = (v) => String(v).padStart(d + 1, '0').slice(-(d + 1)).split('').reduce((r, ch) => r + (canAdd ? 9 - Number(ch) : Number(ch)), 0);
  const ordered = (total) => {
    const o = options(total);
    if (!tests.has('big') && canAdd !== canSub) o.sort((x, y) => room(total + y) - room(total + x));
    return o.slice(0, 10);
  };
  const search = (total, t) => {
    if (t === TERMS) return [];
    if (--budget < 0) return null;
    for (const c of ordered(total)) {
      const rest = search(total + c, t + 1);
      if (rest) return [c, ...rest];
    }
    return null;
  };
  // the first number, set on a clear frame (taking away only: a bigger one, with room to take from)
  const firsts = [];
  if (canSub && !canAdd) {
    const top = (TERMS - 1) * hi;
    for (let k = 0; k < 24; k++) firsts.push(Math.round(top * (0.55 + rng() * 0.45)));
    // no borrowing: full rods (nines and eights) under a small lead, so there is plenty to take away
    if (!tests.has('big')) {
      for (let k = 0; k < 12; k++) {
        let str = String(1 + Math.floor(rng() * 3));
        for (let r = 0; r < d; r++) str += r === 0 ? 9 : [9, 9, 9, 8, 8, 7][Math.floor(rng() * 6)];   // the rod every take-away's lead comes off: full
        firsts.unshift(Number(str));
      }
    }
  } else {
    for (let k = 0; k < 24; k++) firsts.push(rand());
    if (!tests.has('big') && canAdd && !canSub) {
      firsts.push(...pool(0, true));
      // no carrying: a 1 in front and small digits under it, so there is room to add to
      for (let k = 0; k < 12; k++) {
        let str = d === 1 ? '' : '1';
        for (let r = d === 1 ? 0 : 1; r < d; r++) str += [0, 0, 1, 1, 2][Math.floor(rng() * 5)];
        if (Number(str) >= lo) firsts.push(Number(str));
      }
      firsts.sort((x, y) => room(y) - room(x));
    }
  }
  for (const pass of [true, false]) {
    strict = pass;
    budget = 1500;
    for (const first of firsts) {
      const rest = search(first, 1);
      if (rest) { const terms = [first, ...rest]; return { terms, answer: terms.reduce((a, b) => a + b, 0) }; }
      if (budget < 0) break;
    }
  }
  // nothing fits all the way (a rare corner): one number at a time, the nearest honest ones
  let total = firsts[0];
  const terms = [total];
  for (let t = 1; t < TERMS; t++) {
    let picked = options(total)[0];
    if (picked == null) {
      const n = rand();
      picked = canSub && total - n >= 0 && (!canAdd || rng() < 0.5) ? -n : n;
    }
    terms.push(picked);
    total += picked;
  }
  return { terms, answer: total };
}

/* ── the soroban, drawn (the workbench's 2D look) ────────────────────────── */
const PITCH = 1.55, SLOT = 1.1, TRAVEL = 1.45, BAR_GAP = 1.0, EDGE = 1.1, BEAD_T = 1.0, BEAD_D = 1.3, EYE = 0.07;
const PLACE = [['--accent-primary', '#f4c95d'], ['--accent-secondary', '#6fb7e8'], ['--accent-success', '#7cc47c']];
const U = 22;                         // px to a unit
/** A soroban showing n on `rods` rods (the ones on the right). */
export function sorobanSvg(n, rods) {
  const digits = String(Math.abs(n)).padStart(rods, '0').slice(-rods).split('').map(Number);
  const heaven = BAR_GAP + TRAVEL + BEAD_T / 2, earth = BAR_GAP + 3 * SLOT + TRAVEL + BEAD_T / 2;
  const W = rods * PITCH + EDGE * 2, H = heaven + earth + EDGE * 2, barY = EDGE + heaven;
  const s = (v) => (v * U).toFixed(1);
  const bead = (x, y, fill, dark) => {
    const rr = BEAD_D / 2, tt = BEAD_T / 2;
    const pts = [[-rr, 0], [-rr * 0.62, -tt * 0.44], [-EYE, -tt], [EYE, -tt], [rr * 0.62, -tt * 0.44], [rr, 0], [rr * 0.62, tt * 0.44], [EYE, tt], [-EYE, tt], [-rr * 0.62, tt * 0.44]];
    return `<polygon points="${pts.map(([a, b]) => `${s(x + a)},${s(y + b)}`).join(' ')}" fill="${fill}" stroke="rgba(42,39,35,.55)" stroke-width="1"/>`
      + `<path d="M${s(x - rr * 0.62)} ${s(y - tt * 0.3)} L${s(x + rr * 0.3)} ${s(y - tt * 0.3)}" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-linecap="round"/>`
      + (dark ? `<polygon points="${pts.map(([a, b]) => `${s(x + a)},${s(y + b)}`).join(' ')}" fill="rgba(0,0,0,.34)"/>` : '');
  };
  let out = '';
  // the four timbers (no backing: the paper shows through)
  const T = 0.55;
  out += `<rect x="${s(T / 2)}" y="${s(T / 2)}" width="${s(W - T)}" height="${s(H - T)}" fill="none" stroke="var(--accent-warning, #f0a868)" stroke-width="${s(T)}"/>`;
  out += `<rect x="${s(T / 2)}" y="${s(T / 2)}" width="${s(W - T)}" height="${s(H - T)}" fill="none" stroke="rgba(42,39,35,.35)" stroke-width="1.2"/>`;
  for (let r = 0; r < rods; r++) {
    const x = EDGE + PITCH * (r + 0.5);
    out += `<line x1="${s(x)}" y1="${s(T)}" x2="${s(x)}" y2="${s(H - T)}" stroke="var(--text-tertiary, #9a948a)" stroke-width="2.4"/>`;
  }
  // the reckoning bar, with a dot on every third rod from the ones (the unit marks)
  out += `<rect x="${s(T)}" y="${s(barY - 0.2)}" width="${s(W - 2 * T)}" height="${s(0.4)}" fill="var(--accent-warning, #f0a868)" stroke="rgba(42,39,35,.4)" stroke-width="1"/>`;
  out += `<rect x="${s(T)}" y="${s(barY - 0.2)}" width="${s(W - 2 * T)}" height="${s(0.4)}" fill="rgba(0,0,0,.28)"/>`;
  for (let r = 0; r < rods; r++) {
    const power = rods - 1 - r;
    if (power % 3 === 0) out += `<circle cx="${s(EDGE + PITCH * (r + 0.5))}" cy="${s(barY)}" r="2.6" fill="#2a2723"/>`;
  }
  // the beads: in = against the bar, out = against the frame
  digits.forEach((v, r) => {
    const x = EDGE + PITCH * (r + 0.5), power = rods - 1 - r;
    const [tok, fb] = PLACE[power % 3];
    const fill = `var(${tok}, ${fb})`;
    const up = v >= 5, k = v % 5;
    out += bead(x, barY - (BAR_GAP + (up ? 0 : TRAVEL)), fill, true);
    for (let i = 0; i < 4; i++) out += bead(x, barY + BAR_GAP + i * SLOT + (i < k ? 0 : TRAVEL), fill, false);
  });
  return `<svg class="sor-abacus" viewBox="0 0 ${s(W)} ${s(H)}" width="${s(W)}" height="${s(H)}" role="img" aria-label="${Math.abs(n)} on a soroban">${out}</svg>`;
}

/* ── the round ─────────────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const playBd = $('drill-play-bd');
const stage = $('drill-soroban');
const cardEl = $('drill-card');
const rosterEl = $('drill-roster');
const timeRemainingEl = $('drill-time-remaining');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastTimeMs = 0;
/** how long this player took to answer, over the whole session (the board's tie-break) */
export const lastSorobanTimeMs = () => lastTimeMs;

let els = null;
function mount() {
  if (els) return els;
  stage.innerHTML = `
    <div class="drill-grid-head"><span class="pp-sticky pp-sticky--tape drill-grid-note sor-count"></span><span class="pp-sticky pp-sticky--tape drill-grid-note sor-score"></span></div>
    <p class="pp-countdown sor-countdown" hidden></p>
    <div class="pp-receipt sor-receipt"><div class="pp-receipt__paper sor-paper">
      <div class="sor-flash" aria-live="polite"></div>
      <form class="sor-answer" hidden autocomplete="off">
        <label class="sor-answer__label" for="sor-answer-input">The total</label>
        <input id="sor-answer-input" class="sor-answer__input" type="text" inputmode="numeric" maxlength="12" autocomplete="off" />
        <span class="sor-answer__clock"></span>
      </form>
      <p class="sor-result" hidden></p>
    </div></div>`;
  els = {
    count: stage.querySelector('.sor-count'), score: stage.querySelector('.sor-score'),
    countdown: stage.querySelector('.sor-countdown'), flash: stage.querySelector('.sor-flash'),
    form: stage.querySelector('.sor-answer'), input: stage.querySelector('.sor-answer__input'),
    clock: stage.querySelector('.sor-answer__clock'), result: stage.querySelector('.sor-result'),
  };
  els.input.addEventListener('input', () => { els.input.value = els.input.value.replace(/[^0-9]/g, ''); });
  return els;
}

function renderRoster(roster) {
  if (!rosterEl) return;
  rosterEl.innerHTML = '';
  roster.forEach((p) => {
    const pill = document.createElement('span');
    pill.className = 'pp-pill drill-roster-pill';
    pill.textContent = p.isSelf ? `${p.name} (You)` : p.name;
    rosterEl.appendChild(pill);
  });
  rosterEl.hidden = false;
}

/** One number on the paper: the soroban, the figures, or both (with its sign). */
function showNumber(n, cfg, first) {
  const tool = cfg.show.includes('tool'), fig = cfg.show.includes('number');
  const sign = first ? '' : n < 0 ? '−' : '+';
  const rods = Math.max(cfg.digits + 1, String(Math.abs(n)).length, 3);
  els.flash.innerHTML = `<div class="sor-num${tool && fig ? ' is-both' : ''}">`
    + (sign ? `<span class="sor-sign${n < 0 ? ' is-minus' : ''}">${sign}</span>` : '')
    + (tool ? sorobanSvg(Math.abs(n), rods) : '')
    + (fig ? `<span class="sor-fig">${Math.abs(n)}</span>` : '')
    + '</div>';
  els.flash.classList.remove('is-blank');
}
function blank() { els.flash.innerHTML = ''; els.flash.classList.add('is-blank'); }

/** Resolves with the number of sums right; lastSorobanTimeMs() has the time taken. */
export function startSorobanRound({ seed, startAt, timeLimit, cfg, operations, roster }) {
  mount();
  cfg = { show: ['number'], tests: ['simple'], count: 10, digits: 1, speed: 1, delay: 1.5, ...(cfg || {}) };
  if (!cfg.show.length) cfg.show = ['number'];
  return new Promise((resolve) => {
    cardEl.hidden = true;
    stage.hidden = false;
    playBd.classList.add('open', 'is-soroban');
    playBd.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drill-nav-hidden');
    if (roster) renderRoster(roster);
    let score = 0, timeMs = 0, gone = false;
    lastTimeMs = 0;
    els.score.textContent = '0 right';
    els.result.hidden = true; els.form.hidden = true; blank();
    const endAt = Date.now() + (timeLimit || sessionSeconds(cfg)) * 1000 + 8000;   // a safety net only
    const lead = startAt - Date.now();
    const anchorAt = (lead > -2000 && lead <= START_BUFFER_MS + 2000) ? startAt : Date.now() + 800;
    const finish = () => {
      if (gone) return;
      gone = true;
      playBd.classList.remove('open', 'is-soroban');
      playBd.setAttribute('aria-hidden', 'true');
      stage.hidden = true;
      lastTimeMs = timeMs;
      resolve(score);
    };
    const ask = (seconds) => new Promise((done) => {
      els.form.hidden = false;
      els.input.value = '';
      els.input.focus();
      const t0 = Date.now();
      const tick = setInterval(() => {
        const left = Math.max(0, seconds - (Date.now() - t0) / 1000);
        els.clock.textContent = `${Math.ceil(left)}s`;
        if (left <= 0) end(null);
      }, 120);
      const onSubmit = (e) => { e.preventDefault(); if (els.input.value) end(els.input.value); };
      function end(v) {
        clearInterval(tick);
        els.form.removeEventListener('submit', onSubmit);
        els.form.hidden = true;
        done({ v, ms: Date.now() - t0 });
      }
      els.form.addEventListener('submit', onSubmit);
    });
    (async () => {
      els.countdown.hidden = false;
      while (Date.now() < anchorAt) { els.countdown.textContent = Math.ceil((anchorAt - Date.now()) / 1000); await sleep(100); }
      els.countdown.hidden = true;
      if (rosterEl) rosterEl.hidden = true;
      for (let i = 0; i < cfg.count && !gone && Date.now() < endAt; i++) {
        const sum = sorobanSum(seed, i, cfg, operations);
        els.count.textContent = `Sum ${i + 1} of ${cfg.count}`;
        els.result.hidden = true;
        blank();
        await sleep(700);
        for (let k = 0; k < sum.terms.length; k++) {
          showNumber(sum.terms[k], cfg, k === 0);
          await sleep(cfg.speed * 1000);
          blank();
          if (k < sum.terms.length - 1) await sleep(cfg.delay * 1000);
        }
        const { v, ms } = await ask(answerSeconds(cfg.digits));
        const ok = v != null && Number(v) === sum.answer;
        timeMs += ms;
        if (ok) score += 1;
        els.score.textContent = `${score} right`;
        els.result.hidden = false;
        els.result.className = `sor-result ${ok ? 'is-ok' : 'is-bad'}`;
        els.result.textContent = ok ? `Right: ${sum.answer}` : `The total was ${sum.answer}`;
        await sleep(FEEDBACK_S * 1000);
      }
      if (timeRemainingEl) timeRemainingEl.textContent = '';
      finish();
    })();
  });
}
