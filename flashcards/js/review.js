/* ═══════════════════════════════════════════════════════
   RECALL PRESS — THE SHELF (deck grid + Leitner drawers)
   AND THE PRACTICE SESSION (card flip + reaction grading).
   Pure practice only — no editing tools here on purpose; all
   card editing/prompting lives on the generator page's editor
   (flashcards/js/card-editor.js) so students only ever see
   already-edited cards.
═══════════════════════════════════════════════════════ */
import {
  $, safe, BOXES, MAX_BOX, pouchColorClass, pouchTagColorClass, pouchCardsHtml, attachSwipeNav,
} from './config.js';
import { listDecks, dueCardsInBox, boxCounts, gradeCard } from './deck-store.js';
import {
  heroPaint, iconBlob, ICON_QUESTION, ICON_CHECK, ICON_FLIP,
  ICON_AGAIN, ICON_HARD, ICON_GOOD, ICON_EASY,
} from './icons.js';

const deckGrid = $('deck-grid');
const deckEmpty = $('deck-empty');

const reviewBd = $('review-bd');
const reviewSubject = $('review-subject');
const reviewProgress = $('review-progress');
const reviewClose = $('review-close');
const reviewPrev = $('review-prev');
const reviewNext = $('review-next');
const flashCard = $('flash-card');
const flashNote = $('flash-note');
const frontText = $('flash-front-text');
const backText = $('flash-back-text');
const frontImage = $('flash-image-front');
const backImage = $('flash-image-back');
const frontPhoto = $('flash-photo-front');
const backPhoto = $('flash-photo-back');
const frontIconWrap = $('flash-icon-wrap-front');
const backIconWrap = $('flash-icon-wrap-back');
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
  frontIconWrap.querySelector('.flash-icon-tile').innerHTML = iconBlob(3);
  backIconWrap.querySelector('.flash-icon-tile').innerHTML = iconBlob(8);
  document.querySelector('.flash-blob--front').innerHTML = heroPaint();
  document.querySelector('.flash-blob--back').innerHTML = heroPaint();
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
  deckGrid.querySelectorAll('.deck-pouch').forEach((el) => el.remove());

  decks.forEach((deck, i) => {
    const total = (deck.cards || []).length;
    const tag = deck.topic || deck.subject || 'Deck';
    const tilt = (i % 2 === 0 ? -1 : 1) * (2 + (i % 3));
    const pouch = document.createElement('div');
    pouch.className = `deck-pouch ${pouchColorClass(i)}`;
    pouch.innerHTML = `
      <span class="pp-sticky ${pouchTagColorClass(i)} pp-sticky--tape deck-pouch-tag" style="--pp-note-tilt:${tilt}deg">${safe(tag)}</span>
      <div class="deck-pouch-neck"></div>
      ${pouchCardsHtml()}
      <div class="deck-pouch-body">
        <div class="deck-card-hdr">
          <span class="deck-subject">${safe(deck.subject)}</span>
          <span class="deck-topic">${safe(deck.topic)}</span>
          <span class="deck-total">${total} card${total === 1 ? '' : 's'}</span>
        </div>
        <div class="deck-drawers">${drawerRow(deck)}</div>
      </div>`;
    deckGrid.appendChild(pouch);
  });
}

function showFace(front) {
  flashCard.classList.toggle('flipped', !front);
}

function paintImage(imgEl, photoEl, iconWrapEl, url) {
  if (url) {
    imgEl.src = url;
    photoEl.hidden = false;
    iconWrapEl.classList.add('has-image');
  } else {
    imgEl.src = '';
    photoEl.hidden = true;
    iconWrapEl.classList.remove('has-image');
  }
}

function loadCard() {
  const card = session.queue[session.idx];
  frontText.textContent = card.front;
  backText.textContent = card.back;
  paintImage(frontImage, frontPhoto, frontIconWrap, card.frontImage);
  paintImage(backImage, backPhoto, backIconWrap, card.backImage);
  showFace(true);
  gradesEl.hidden = true;
  flashNote.textContent = BOXES[session.box].label;
  reviewProgress.textContent = `${session.idx + 1} / ${session.queue.length}`;
  reviewPrev.disabled = session.idx === 0;
  reviewNext.disabled = session.idx === session.queue.length - 1;
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

// Free navigation between due cards — no grade is recorded, so a skipped
// card simply stays due and can be graded on a later pass.
function goPrev() {
  if (!session || session.idx === 0) return;
  session.idx -= 1;
  loadCard();
}
function goNext() {
  if (!session || session.idx >= session.queue.length - 1) return;
  session.idx += 1;
  loadCard();
}

export function initReview() {
  mountIcons();

  deckGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.drawer.has-due');
    if (!btn) return;
    startSession(btn.dataset.deck, parseInt(btn.dataset.box, 10));
  });

  flashCard.addEventListener('click', (e) => {
    if (!session) return;
    if (e.target.closest('.flash-note') || e.target.closest('.review-grades')) return;
    const isFront = !flashCard.classList.contains('flipped');
    showFace(!isFront);
    gradesEl.hidden = isFront; // reveal grading once the answer is shown
  });

  reviewPrev.addEventListener('click', goPrev);
  reviewNext.addEventListener('click', goNext);
  attachSwipeNav(flashCard, { onPrev: goPrev, onNext: goNext });

  // "Good" sits on the card as the one-tap default grade (like Facebook's
  // Like button); hovering (desktop) or long-pressing (touch) fans the other
  // three reactions out above it instead of grading immediately.
  let longPressTimer = null;
  gradesEl.addEventListener('touchstart', () => {
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      gradesEl.classList.add('expanded');
      gradesEl.dataset.suppressClick = '1';
    }, 420);
  }, { passive: true });
  ['touchend', 'touchmove', 'touchcancel'].forEach((evt) => {
    gradesEl.addEventListener(evt, () => clearTimeout(longPressTimer));
  });
  document.addEventListener('click', (e) => {
    if (gradesEl.classList.contains('expanded') && !gradesEl.contains(e.target)) {
      gradesEl.classList.remove('expanded');
    }
  });

  gradesEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.grade-btn');
    if (!btn || !session) return;
    if (gradesEl.dataset.suppressClick === '1') {
      delete gradesEl.dataset.suppressClick;
      return;
    }
    gradesEl.classList.remove('expanded');
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
    if (!reviewBd.classList.contains('open')) return;
    if (e.key === 'Escape') closeSession();
    else if (e.key === 'ArrowLeft') goPrev();
    else if (e.key === 'ArrowRight') goNext();
  });
}
