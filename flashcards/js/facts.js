/* ═══════════════════════════════════════════════════════
   RECALL PRESS — MATH FACTS (endless multiplication drill)
   No deck, no Firestore, no Leitner boxes — pick one or more
   times tables and get a never-ending stream of random facts.
   Reuses the same flip-card + swipe/keyboard paging as the
   deck review session (review.js) for a consistent feel.
═══════════════════════════════════════════════════════ */
import { $, attachSwipeNav } from './config.js';
import { heroPaint, iconBlob, ICON_QUESTION, ICON_CHECK, ICON_FLIP } from './icons.js';

const pickerSection = $('fact-picker');
const tileGrid = $('fact-tiles');
const startBtn = $('fact-start-btn');

const factsBd = $('facts-bd');
const factsProgress = $('facts-progress');
const factsClose = $('facts-close');
const factsPrev = $('facts-prev');
const factsNext = $('facts-next');
const flashCard = $('facts-flash-card');
const flashNote = $('facts-note');
const frontText = $('facts-front-text');
const backText = $('facts-back-text');
const frontIconWrap = $('facts-icon-wrap-front');
const backIconWrap = $('facts-icon-wrap-back');
const siteNav = document.querySelector('.site-nav');

const selected = new Set();
let queue = []; // { table, multiplier } — grows forward, never shrinks (history)
let idx = -1;

function mountIcons() {
  $('facts-icon-front').innerHTML = ICON_QUESTION;
  $('facts-icon-back').innerHTML = ICON_CHECK;
  $('facts-flip-hint').innerHTML = ICON_FLIP;
  frontIconWrap.querySelector('.flash-icon-tile').innerHTML = iconBlob(3);
  backIconWrap.querySelector('.flash-icon-tile').innerHTML = iconBlob(8);
  document.querySelector('#facts-flash-card .flash-blob--front').innerHTML = heroPaint();
  document.querySelector('#facts-flash-card .flash-blob--back').innerHTML = heroPaint();
}

function randomFact() {
  const tables = [...selected];
  const table = tables[Math.floor(Math.random() * tables.length)];
  const multiplier = 1 + Math.floor(Math.random() * 12);
  return { table, multiplier };
}

function showFace(front) {
  flashCard.classList.toggle('flipped', !front);
}

function loadCard() {
  const fact = queue[idx];
  frontText.textContent = `${fact.table} × ${fact.multiplier}`;
  backText.textContent = String(fact.table * fact.multiplier);
  showFace(true);
  flashNote.textContent = `×${fact.table}`;
  factsProgress.textContent = `${idx + 1}`;
  factsPrev.disabled = idx === 0;
}

function goPrev() {
  if (idx <= 0) return;
  idx -= 1;
  loadCard();
}
function goNext() {
  idx += 1;
  if (idx >= queue.length) queue.push(randomFact());
  loadCard();
}

function startPractice() {
  if (!selected.size) return;
  queue = [];
  idx = -1;
  goNext();
  pickerSection.hidden = true;
  factsBd.classList.add('open');
  factsBd.setAttribute('aria-hidden', 'false');
  if (siteNav) siteNav.style.display = 'none';
}

function closePractice() {
  factsBd.classList.remove('open');
  factsBd.setAttribute('aria-hidden', 'true');
  pickerSection.hidden = false;
  if (siteNav) siteNav.style.display = '';
}

export function initFacts() {
  mountIcons();

  tileGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.count-tile');
    if (!btn) return;
    const n = parseInt(btn.dataset.table, 10);
    if (selected.has(n)) {
      selected.delete(n);
      btn.classList.remove('active');
    } else {
      selected.add(n);
      btn.classList.add('active');
    }
    startBtn.disabled = selected.size === 0;
  });

  startBtn.addEventListener('click', startPractice);

  flashCard.addEventListener('click', (e) => {
    if (e.target.closest('.flash-note')) return;
    showFace(flashCard.classList.contains('flipped'));
  });

  factsPrev.addEventListener('click', goPrev);
  factsNext.addEventListener('click', goNext);
  attachSwipeNav(flashCard, { onPrev: goPrev, onNext: goNext });

  factsClose.addEventListener('click', closePractice);
  factsBd.addEventListener('click', (e) => {
    if (e.target === factsBd) closePractice();
  });
  document.addEventListener('keydown', (e) => {
    if (!factsBd.classList.contains('open')) return;
    if (e.key === 'Escape') closePractice();
    else if (e.key === 'ArrowLeft') goPrev();
    else if (e.key === 'ArrowRight') goNext();
  });
}

initFacts();
