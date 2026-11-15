/* ═══════════════════════════════════════════════════════
   DRILLS — the Spelling library. The whole word bank, ten words a set,
   to study before (or between) rounds: each word with its IPA, its meaning
   and a sentence using it, and the boy's face beside it to say it aloud.

   One set shows at a time. Only the sets ticked in the setup are in it (all of
   them when none is ticked): the numbered strip along the top and the arrows
   move between those. Opened from the Word Sets step:
   openSpellingLibrary({ sets: [1, 2], start: 1 }).
═══════════════════════════════════════════════════════ */
import { BANKS, setCount, SET_SIZE, setWords, aboutText, aboutLine, sayWord, hush, faceButton, canSpeak, clipFor } from './spelling.js';
import { UI } from '/utils/components/ui-icons.js';

let bd = null;
let strip = null;
let list = null;
let title = null;
let chosen = new Set();
let order = [1];          // the sets in the library, in order: the ticked ones
let current = 1;
let bank = 'secondary';
let kicker = null;
let sub = null;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The sentence with the word picked out (as text nodes: nothing is parsed as HTML). */
function sentenceWithWord(sentence, word) {
  const p = document.createElement('p');
  p.className = 'spell-lib-use';
  const re = new RegExp(escapeRe(word), 'gi');
  let at = 0;
  for (const m of sentence.matchAll(re)) {
    p.append(sentence.slice(at, m.index));
    const b = document.createElement('mark');
    b.textContent = m[0];
    p.append(b);
    at = m.index + m[0].length;
  }
  p.append(sentence.slice(at));
  return p;
}

function row({ i: at, row: [word, ipa, def, use, pos = '', origin = ''] }, n) {
  const li = document.createElement('li');
  li.className = 'spell-lib-row';
  const face = faceButton({ size: 46, label: `Hear "${word}"`, onPress: (b) => sayWord(word, b, { clip: clipFor(bank, at, 'w'), ipa }) });
  if (!canSpeak) face.disabled = true;
  const body = document.createElement('div');
  body.className = 'spell-lib-body';
  const head = document.createElement('p');
  head.className = 'spell-lib-head';
  const num = document.createElement('span');
  num.className = 'spell-lib-num';
  num.textContent = n;
  const w = document.createElement('strong');
  w.className = 'spell-lib-word';
  w.textContent = word;
  const i = document.createElement('span');
  i.className = 'spell-lib-ipa';
  i.textContent = `/${ipa}/`;
  head.append(num, w, i);
  const d = document.createElement('p');
  d.className = 'spell-lib-def';
  d.textContent = def;
  // the part of speech, the language and the root, which the boy reads out too
  const about = aboutText(word, pos, origin, true);
  let aboutLineEl = null;
  if (about) {
    aboutLineEl = document.createElement('div');
    aboutLineEl.className = 'spell-lib-useline spell-lib-aboutline';
    const hearRoot = document.createElement('button');
    hearRoot.type = 'button';
    hearRoot.className = 'spell-lib-hear';
    hearRoot.innerHTML = UI.roots(16);
    hearRoot.setAttribute('aria-label', `Hear where "${word}" comes from`);
    hearRoot.dataset.tip = 'Hear the origin and root';
    hearRoot.disabled = !canSpeak;
    hearRoot.addEventListener('click', () => sayWord(aboutLine(word, pos, origin), face, { rate: 0.95, clip: clipFor(bank, at, 'o') }));
    const a = document.createElement('p');
    a.className = 'spell-lib-about';
    a.textContent = about;
    aboutLineEl.append(hearRoot, a);
  }
  const useLine = document.createElement('div');
  useLine.className = 'spell-lib-useline';
  const hearUse = document.createElement('button');
  hearUse.type = 'button';
  hearUse.className = 'spell-lib-hear';
  hearUse.innerHTML = UI.speech(16);
  hearUse.setAttribute('aria-label', `Hear "${word}" in a sentence`);
  hearUse.dataset.tip = 'Hear the sentence';
  hearUse.disabled = !canSpeak;
  hearUse.addEventListener('click', () => sayWord(use, face, { rate: 0.95, clip: clipFor(bank, at, 's') }));
  useLine.append(hearUse, sentenceWithWord(use, word));
  body.append(head, d, ...(aboutLineEl ? [aboutLineEl] : []), useLine);
  li.append(face, body);
  return li;
}

/** Step `by` sets along the library's own sets (the ticked ones), stopping at either end. */
function step(by) {
  const k = Math.min(Math.max(0, order.indexOf(current) + by), order.length - 1);
  showSet(order[k]);
}

function showSet(n) {
  current = order.includes(n) ? n : order[0];
  hush();
  const words = setWords(bank, current);
  const first = (current - 1) * SET_SIZE + 1;
  title.textContent = `Set ${current} · words ${first} to ${first + words.length - 1}`;
  const ol = document.createElement('ol');
  ol.className = 'spell-lib-list';
  words.forEach((w, k) => ol.appendChild(row(w, first + k)));
  list.replaceChildren(ol);
  list.scrollTop = 0;
  strip.querySelectorAll('button').forEach((b) => {
    const on = Number(b.dataset.set) === current;
    b.classList.toggle('is-current', on);
    b.setAttribute('aria-current', on ? 'true' : 'false');
    if (on) b.scrollIntoView({ block: 'nearest', inline: 'center' });
  });
}

function build() {
  bd = document.createElement('div');
  bd.className = 'review-bd spell-lib-bd';
  bd.setAttribute('role', 'dialog');
  bd.setAttribute('aria-modal', 'true');
  bd.setAttribute('aria-hidden', 'true');
  bd.setAttribute('aria-label', 'Spelling library');
  bd.innerHTML = `
    <div class="spell-lib pp-receipt">
      <div class="spell-lib-paper pp-receipt__paper">
        <p class="spell-lib-kicker">Spelling library</p>
        <p class="spell-lib-title"></p>
        <p class="spell-lib-sub"></p>
        <nav class="spell-lib-strip" aria-label="Sets"></nav>
        <div class="spell-lib-scroll"></div>
        <div class="spell-lib-foot">
          <button type="button" class="spell-lib-step" data-step="-1"></button>
          <button type="button" class="spell-lib-close"></button>
          <button type="button" class="spell-lib-step" data-step="1"></button>
        </div>
      </div>
    </div>`;
  title = bd.querySelector('.spell-lib-title');
  kicker = bd.querySelector('.spell-lib-kicker');
  sub = bd.querySelector('.spell-lib-sub');
  strip = bd.querySelector('.spell-lib-strip');
  list = bd.querySelector('.spell-lib-scroll');
  const [prev, next] = bd.querySelectorAll('.spell-lib-step');
  prev.innerHTML = UI.chevronLeft(20);
  prev.setAttribute('aria-label', 'Previous set'); prev.dataset.tip = 'Previous set';
  next.innerHTML = UI.chevronRight(20);
  next.setAttribute('aria-label', 'Next set'); next.dataset.tip = 'Next set';
  [prev, next].forEach((b) => b.addEventListener('click', () => step(Number(b.dataset.step))));
  const close = bd.querySelector('.spell-lib-close');
  close.innerHTML = UI.close(20);
  close.setAttribute('aria-label', 'Close the library'); close.dataset.tip = 'Close';
  close.addEventListener('click', closeSpellingLibrary);
  bd.addEventListener('click', (e) => { if (e.target === bd) closeSpellingLibrary(); });
  document.addEventListener('keydown', (e) => {
    if (!bd.classList.contains('open')) return;
    if (e.key === 'Escape') closeSpellingLibrary();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });
  document.body.appendChild(bd);
}

/* The numbered strip: one button per set in the library. */
function buildStrip() {
  strip.replaceChildren();
  for (const n of order) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.set = n;
    b.textContent = n;
    b.setAttribute('aria-label', `Set ${n}`);
    b.addEventListener('click', () => showSet(n));
    strip.appendChild(b);
  }
}

export function openSpellingLibrary({ bank: list = 'secondary', sets = [1], start } = {}) {
  if (!bd) build();
  bank = BANKS[list] ? list : 'secondary';
  kicker.textContent = `${BANKS[bank].label} spelling library`;
  const count = setCount(bank);
  chosen = new Set(sets.filter((n) => n >= 1 && n <= count));
  order = chosen.size ? [...chosen].sort((a, b) => a - b) : Array.from({ length: count }, (_, k) => k + 1);
  buildStrip();
  // one set needs no strip and no arrows
  strip.hidden = order.length < 2;
  bd.querySelectorAll('.spell-lib-step').forEach((b) => { b.hidden = order.length < 2; });
  sub.textContent = chosen.size
    ? `Tap the boy to hear a word. ${chosen.size === 1 ? 'This is the set' : `These are the ${chosen.size} sets`} your round will use.`
    : 'Tap the boy to hear a word. Tick sets in the setup to study just those.';
  bd.classList.add('open');
  bd.setAttribute('aria-hidden', 'false');
  showSet(start || order[0]);
}

export function closeSpellingLibrary() {
  if (!bd) return;
  hush();
  bd.classList.remove('open');
  bd.setAttribute('aria-hidden', 'true');
}
