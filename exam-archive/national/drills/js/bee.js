/* ═══════════════════════════════════════════════════════
   DRILLS — the Spelling Bee, as it is held in a hall.

   The spellers sit on the stage with numbered tags. One at a time they walk
   to the microphone; the pronouncer calls a word; they spell it once, out
   loud (the mic) or on the keys, and say "done". Right, and they go back to
   their seat. Wrong, and they walk off the stage, and may stay to watch. The
   last one standing at the end of a round is the champion (js/bee-logic.js
   holds the rules).

   Who sits where, each turn's word and every bot's spelling come from the
   room's seed, so they are the same on every device with nothing sent. Only a
   REAL player's turn travels, through the live room (utils/live, ns "bee"):
     state  r<k> = { u, ok, t }     turn k's result, written by its speller
     shout  spell  { k, v }         the letters so far, so the hall sees them
     shout  ask    { k, kind }      "may I have the definition?": all hear it
   A device that falls behind catches up by itself: a turn whose result has
   already arrived is played through quickly.

   If a real speller's device goes away mid-turn, the turn must still end. One
   device (the lowest uid still here) writes it as a miss after the clock.
═══════════════════════════════════════════════════════ */
import { spellingQuestion, sayWord, hush, canSpeak, faceButton, clipFor, preloadClip, isTalking, sanitizeSpelling, spelledRight } from './spelling.js';
import { canListen, createSpellMic } from './spell-mic.js';
import { seatSpellers, createBee, botSpelling } from './bee-logic.js';
import { openRoom, idFor } from '/utils/live/index.js';
import { UI } from '/utils/components/ui-icons.js';
import { heroPaint } from '/utils/components/nav-icons.js';

const KID = { boy: '/media/characters/boy.svg', girl: '/media/characters/girl.svg' };
const MIC_KEY = 'ppSpellMic';          // the same choice as the drill's mic
const GRACE = 12;                      // seconds past the clock before a silent turn is called a miss

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
const bell = () => tone([1568, 1568], { gap: 0.02, len: 1.4, type: 'triangle', vol: 0.2 });

/* Where the chairs are, in % of the hall: a back row and a front row. The back row
   sits half a chair across, so its spellers show between the front row's. */
function seatSpot(count, seat) {
  const back = count > 5 ? Math.ceil(count / 2) : 0;
  const inBack = seat < back;
  const n = inBack ? back : count - back;
  const j = inBack ? seat : seat - back;
  const step = Math.min(13, n > 1 ? 58 / (n - 1) : 0);
  return { x: (inBack ? 55 : 61.5) + (j - (n - 1) / 2) * step, y: inBack ? 55 : 72, row: inBack ? 'back' : 'front' };
}
const CHAIR = '<svg viewBox="0 0 100 125" preserveAspectRatio="none"><rect x="12" y="0" width="76" height="66" fill="var(--bee-chair)"/><rect x="20" y="8" width="60" height="42" fill="var(--bee-chair-in)"/><rect x="4" y="62" width="92" height="15" fill="var(--bee-chair)"/><rect x="8" y="77" width="9" height="48" fill="var(--bee-chair-leg)"/><rect x="83" y="77" width="9" height="48" fill="var(--bee-chair-leg)"/></svg>';

const spaced = (s) => s.toUpperCase().split('').join(' ');
const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;

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
      <button type="button" class="bee-leave"></button>
    </div>
    <div class="bee-hall">
      <div class="bee-wall"><span class="pp-sticky pp-sticky--c0 pp-sticky--tape bee-banner">Spelling Bee</span></div>
      <div class="bee-floor"></div>
      <div class="bee-exit" aria-hidden="true"></div>
      <div class="bee-desk"><span class="pp-pill pp-pill--static bee-desk-label">Pronouncer</span></div>
      <div class="bee-stand" aria-hidden="true"><svg viewBox="0 0 20 100" preserveAspectRatio="xMidYMax meet"><rect x="5" y="2" width="10" height="17" rx="5" fill="var(--text-secondary)"/><rect x="8.6" y="18" width="2.8" height="76" fill="var(--text-tertiary)"/><rect x="1" y="93" width="18" height="5" rx="2.5" fill="var(--text-secondary)"/></svg></div>
    </div>
    <div class="pp-receipt bee-panel">
      <div class="pp-receipt__paper bee-paper">
        <p class="bee-status" aria-live="polite"></p>
        <div class="bee-spell">
          <p class="bee-letters"></p>
          <input class="bee-input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="40" aria-label="Spell the word" disabled />
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
  const hall = $('.bee-hall'), statusEl = $('.bee-status'), lettersEl = $('.bee-letters'), inputEl = $('.bee-input');
  const clockEl = $('.bee-clock'), toolsEl = $('.bee-tools'), heardEl = $('.bee-heard'), skipBtn = $('.bee-skip');
  const roundEl = $('.bee-round'), leftEl = $('.bee-left');

  // the pronouncer, at the desk: the face that says the words
  const face = faceButton({ size: 64, label: 'The pronouncer', tip: 'The pronouncer' });
  face.tabIndex = -1;
  $('.bee-desk').prepend(face);

  // the spellers, in their seats, tags on
  const kids = seats.map((s) => {
    const spot = seatSpot(seats.length, s.seat);
    const el = document.createElement('div');
    el.className = `bee-kid bee-kid--${spot.row}${s === mySeat ? ' is-me' : ''}`;
    el.style.setProperty('--x', spot.x);
    el.style.setProperty('--y', spot.y);
    // The picture is one flat drawing, so it sits the way a seated child looks from the
    // front: the thighs point at you and are not seen. Two copies of the picture, the body
    // (head to hips) and the legs (knees to feet); seated, the body comes down onto the
    // knees. Standing, the two meet again as the whole drawing. See bee.css.
    const pic = () => { const i = document.createElement('img'); i.src = KID[s.kid]; i.alt = ''; i.draggable = false; return i; };
    const body = document.createElement('div');
    body.className = 'bee-kid-body';
    const tag = document.createElement('span');
    tag.className = `pp-sticky ${s === mySeat ? 'pp-sticky--c4' : 'pp-sticky--c3'} bee-tag`;
    tag.textContent = s.tag;
    body.append(pic(), tag);
    const legs = document.createElement('div');
    legs.className = 'bee-kid-legs';
    legs.append(pic());
    el.append(body, legs);
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

  /* ── Pace: 1 as it happens, less to catch up, 0 to skip to the end ── */
  let gone = false, skipping = false, pace = 1;
  const wait = (ms) => (gone || !pace ? Promise.resolve() : new Promise((r) => setTimeout(r, ms * pace)));
  const say = (text) => { statusEl.textContent = text; };
  const who = (s) => `Number ${s.tag}, ${s.name}${s === mySeat ? ' (you)' : ''}`;
  const showLetters = (typed, cls = '') => { lettersEl.textContent = spaced(typed); lettersEl.className = `bee-letters ${cls}`; };
  function pills() {
    roundEl.textContent = `Round ${bee.round}`;
    const n = bee.alive.length;
    leftEl.textContent = `${n} ${n === 1 ? 'speller' : 'spellers'} left`;
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

  /* ── The pronouncer's voice (every device plays it: it is the hall's) ── */
  function speak(kind) {
    if (gone || !pace || !nowQ || !canSpeak) return;
    const q = nowQ;
    if (kind === 'w') sayWord(q.word, face, { clip: clipFor(q.bank, q.i, 'w'), ipa: q.ipa });
    else if (kind === 'd') sayWord(q.def, face, { rate: 0.95, clip: clipFor(q.bank, q.i, 'd') });
    else if (kind === 's') sayWord(q.use, face, { rate: 0.95, clip: clipFor(q.bank, q.i, 's') });
    else if (kind === 'o') sayWord(q.about, face, { rate: 0.95, clip: clipFor(q.bank, q.i, 'o') });
  }
  async function spoken(max = 5000) {
    const t0 = Date.now();
    await wait(500);
    while (!gone && pace && isTalking() && Date.now() - t0 < max) await new Promise((r) => setTimeout(r, 120));
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
  const typedNow = () => sanitizeSpelling(inputEl.value);
  function onType() {
    const v = typedNow();
    if (inputEl.value !== v) inputEl.value = v;
    showLetters(v, 'is-mine');
    try { room?.send('spell', { k: nowK, v }); } catch { /* ignore */ }
  }
  const mic = createSpellMic({
    quiet: () => !isTalking(350),
    onHeard: (items, text) => {
      if (!finishMine) return;
      heardEl.textContent = items.length ? `Heard: ${text.trim()}` : `Heard "${text.trim()}". Say the letters one by one, then "done".`;
      let v = inputEl.value, done = false;
      for (const it of items) { if (it.done) done = true; else v = it.back ? v.slice(0, -1) : it.clear ? '' : v + it.ch; }
      inputEl.value = v;
      onType();
      if (done && typedNow()) finishMine(false);
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
  tool('bee-done', UI.check(22), 'Done: that is my spelling (Enter)', () => { if (finishMine && typedNow()) finishMine(false); else inputEl.focus(); });
  inputEl.addEventListener('input', onType);
  inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (finishMine && typedNow()) finishMine(false); } });
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
      say(`Your word, number ${mySeat.tag}. Spell it, then press Done.`);
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
        const typed = typedNow();
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
      theirTyping = (v) => showLetters(v);
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
      const per = b.ms / (b.typed.length + 2);
      await wait(per);
      for (let n = 1; n <= b.typed.length && !gone && pace; n++) { showLetters(b.typed.slice(0, n)); await wait(per); }
    }
    return { ok: b.ok, t: b.typed };
  }

  /* ── Walking ─────────────────────────────────────────────────── */
  async function walk(el, to) {
    el.classList.remove('is-gone');
    el.classList.add('is-walking');
    el.classList.toggle('is-at-mic', to === 'mic');
    el.classList.toggle('is-off', to === 'off');
    await wait(1500);
    el.classList.remove('is-walking');
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
    if (mic.on) mic.stop();
    for (const w of [...waiters.values()]) w({ ok: false, t: '' });
    joined.then(() => room?.leave()).catch(() => {});
    bd.remove();
    document.body.classList.remove('drill-nav-hidden');
    finished(result);
  }
  const myPlace = () => (mySeat ? (bee.placings.find((p) => p.seat === mySeat.seat) || {}).place ?? null : null);
  const leaveBtn = $('.bee-leave');
  leaveBtn.innerHTML = UI.close(18);
  leaveBtn.setAttribute('aria-label', 'Leave the bee');
  leaveBtn.dataset.tip = 'Leave the bee';
  leaveBtn.addEventListener('click', () => leave({ place: myPlace(), champion: null, placings: bee.placings }));
  skipBtn.addEventListener('click', () => { skipping = true; pace = 0; hush(); skipBtn.hidden = true; settle(); });

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
    await Promise.race([joined, new Promise((r) => setTimeout(r, 2500))]);
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
      showLetters(''); stopClock();
      say(`${who(seat)}, to the microphone.`);
      await walk(el, 'mic');
      if (gone) break;
      speak('w');
      await spoken();
      const r = seat.bot != null ? await botSpell(seat, q, k)
        : seat === mySeat ? await mySpell(q, k)
        : await theirSpell(seat, q, k);
      if (gone) break;
      // the verdict
      if (r.ok) {
        showLetters(r.t || q.word, 'is-right');
        say('That is correct.');
        if (pace) chime();
        await wait(1300);
      } else {
        showLetters(r.t || '', 'is-wrong');
        say(r.t ? 'That is not correct.' : 'Time is up.');
        if (pace) bell();
        await wait(1300);
        showLetters(q.word, 'is-answer');
        say(`The word was "${q.word}". ${seat === mySeat ? 'You leave' : `Number ${seat.tag} leaves`} the stage.`);
        await wait(2200);
      }
      const ev = bee.apply(r.ok);
      await walk(el, r.ok ? 'seat' : 'off');
      if (gone) break;
      if (ev.reinstated.length) {
        say('Everyone left missed that round, so nobody goes out. They all come back.');
        await Promise.all(ev.reinstated.map((s) => walk(kids[s], 'seat')));
        await wait(1200);
      } else if (!r.ok && seat === mySeat && bee.champion == null && !ev.reinstated.length) {
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
    await walk(kids[champ.seat], 'mic');
    await wait(1200);
    if (!gone) showResults();
  })();

  return done;
}
