/* ═══════════════════════════════════════════════════════
   RECALL PRESS — THE SHELF (deck grid + Leitner drawers)
   AND THE REVIEW SESSION (card flip + grading).
═══════════════════════════════════════════════════════ */
import { $, safe, BOXES, MAX_BOX } from './config.js';
import { listDecks, dueCardsInBox, boxCounts, gradeCard } from './deck-store.js';
import {
  paintBlob, ICON_QUESTION, ICON_CHECK, ICON_FLIP,
  ICON_AGAIN, ICON_HARD, ICON_GOOD, ICON_EASY,
} from './icons.js';

const deckGrid = $('deck-grid');
const deckEmpty = $('deck-empty');

const reviewBd = $('review-bd');
const reviewSubject = $('review-subject');
const reviewBoxLabel = $('review-box');
const reviewProgress = $('review-progress');
const reviewClose = $('review-close');
const flashCard = $('flash-card');
const frontText = $('flash-front-text');
const backText = $('flash-back-text');
const gradesEl = $('review-grades');
const doneEl = $('review-done');
const doneCloseBtn = $('review-done-close');
const siteNav = document.querySelector('.site-nav');

function mountIcons() {
  $('flash-icon-front').innerHTML = ICON_QUESTION;
  $('flash-icon-back').innerHTML = ICON_CHECK;
  $('flash-flip-hint').innerHTML = ICON_FLIP;
  $('grade-icon-again').innerHTML = ICON_AGAIN;
  $('grade-icon-hard').innerHTML = ICON_HARD;
  $('grade-icon-good').innerHTML = ICON_GOOD;
  $('grade-icon-easy').innerHTML = ICON_EASY;
  document.querySelector('.flash-blob--front').innerHTML = paintBlob(5);
  document.querySelector('.flash-blob--back').innerHTML = paintBlob(12);
}

let session = null; // { deckId, box, queue: [cards], idx }

function drawerRow(deck) {
  const { counts, due } = boxCounts(deck);
  const cells = [];
  for (let b = 1; b <= MAX_BOX; b++) {
    const label = BOXES[b].label;
    const hasDue = due[b] > 0;
    cells.push(`
      <button class="drawer ${hasDue ? 'has-due' : ''}" data-deck="${deck.id}" data-box="${b}" ${counts[b] ? '' : 'disabled'}>
        <span class="drawer-label">${label}</span>
        <span class="drawer-count">${counts[b]}</span>
        ${hasDue ? `<span class="drawer-due">${due[b]} due</span>` : ''}
      </button>`);
  }
  return cells.join('');
}

export async function renderDecks() {
  const decks = await listDecks();
  deckEmpty.style.display = decks.length ? 'none' : '';
  deckGrid.querySelectorAll('.deck-card').forEach((el) => el.remove());

  decks.forEach((deck) => {
    const total = (deck.cards || []).length;
    const card = document.createElement('div');
    card.className = 'deck-card';
    card.innerHTML = `
      <div class="deck-card-hdr">
        <span class="deck-subject">${safe(deck.subject)}</span>
        <span class="deck-topic">${safe(deck.topic)}</span>
        <span class="deck-total">${total} card${total === 1 ? '' : 's'}</span>
      </div>
      <div class="deck-drawers">${drawerRow(deck)}</div>`;
    deckGrid.appendChild(card);
  });
}

function showFace(front) {
  flashCard.classList.toggle('flipped', !front);
}

function loadCard() {
  const card = session.queue[session.idx];
  frontText.textContent = card.front;
  backText.textContent = card.back;
  showFace(true);
  gradesEl.hidden = true;
  reviewProgress.textContent = `${session.idx + 1} / ${session.queue.length}`;
}

function endSession() {
  reviewBd.querySelector('.review-stage').hidden = true;
  gradesEl.hidden = true;
  doneEl.hidden = false;
}

async function startSession(deckId, box) {
  const decks = await listDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return;
  const queue = dueCardsInBox(deck, box);
  if (!queue.length) return;

  session = { deckId, box, queue, idx: 0 };
  reviewSubject.textContent = `${deck.subject}: ${deck.topic}`;
  reviewBoxLabel.textContent = BOXES[box].label;
  reviewBd.querySelector('.review-stage').hidden = false;
  doneEl.hidden = true;
  reviewBd.classList.add('open');
  reviewBd.setAttribute('aria-hidden', 'false');
  if (siteNav) siteNav.style.display = 'none';
  loadCard();
}

function closeSession() {
  reviewBd.classList.remove('open');
  reviewBd.setAttribute('aria-hidden', 'true');
  if (siteNav) siteNav.style.display = '';
  session = null;
  renderDecks();
}

export function initReview() {
  mountIcons();

  deckGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.drawer.has-due');
    if (!btn) return;
    startSession(btn.dataset.deck, parseInt(btn.dataset.box, 10));
  });

  flashCard.addEventListener('click', () => {
    if (!session) return;
    const isFront = !flashCard.classList.contains('flipped');
    showFace(!isFront);
    gradesEl.hidden = isFront; // reveal grading once the answer is shown
  });

  gradesEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.grade-btn');
    if (!btn || !session) return;
    const card = session.queue[session.idx];
    gradesEl.querySelectorAll('.grade-btn').forEach((b) => (b.disabled = true));
    try {
      await gradeCard(session.deckId, card.id, btn.dataset.grade);
    } catch (err) {
      console.error('[Recall Press] grading failed:', err);
    }
    gradesEl.querySelectorAll('.grade-btn').forEach((b) => (b.disabled = false));

    session.idx += 1;
    if (session.idx >= session.queue.length) endSession();
    else loadCard();
  });

  reviewClose.addEventListener('click', closeSession);
  doneCloseBtn.addEventListener('click', closeSession);
  reviewBd.addEventListener('click', (e) => {
    if (e.target === reviewBd) closeSession();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reviewBd.classList.contains('open')) closeSession();
  });
}
