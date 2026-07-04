/* ═══════════════════════════════════════════════════════
   RECALL PRESS — THE SHELF (deck grid + Leitner drawers)
   AND THE REVIEW SESSION (card flip, grading, edit/image/redo).
═══════════════════════════════════════════════════════ */
import { $, safe, BOXES, MAX_BOX } from './config.js';
import { listDecks, dueCardsInBox, boxCounts, gradeCard, updateCard } from './deck-store.js';
import { printCards } from './api.js';
import { uploadCardImage, generateCardImage } from './image-upload.js';
import {
  heroPaint, iconBlob, ICON_QUESTION, ICON_CHECK, ICON_FLIP,
  ICON_AGAIN, ICON_HARD, ICON_GOOD, ICON_EASY,
  ICON_EDIT, ICON_IMAGE, ICON_GENERATE, ICON_COPY_PROMPT, ICON_REGEN,
} from './icons.js';

/** Shared with the "Copy Prompt" tool so a user can take the same wording
 * to an external AI image generator instead of our built-in one. */
function buildImagePrompt(text) {
  return `Flat vector clip-art icon of: ${text}. Simple flat design, bold solid colors, minimal shading, icon only. No text, no letters, no numbers, no words, no writing, no labels, no captions anywhere in the image.`;
}

const deckGrid = $('deck-grid');
const deckEmpty = $('deck-empty');

const reviewBd = $('review-bd');
const reviewSubject = $('review-subject');
const reviewProgress = $('review-progress');
const reviewClose = $('review-close');
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
const toolEdit = $('tool-edit');
const toolImage = $('tool-image');
const toolGenerate = $('tool-generate');
const toolCopyPrompt = $('tool-copy-prompt');
const toolRegen = $('tool-regen');
const toolImageInput = $('tool-image-input');
const siteNav = document.querySelector('.site-nav');

function mountIcons() {
  $('flash-icon-front').innerHTML = ICON_QUESTION;
  $('flash-icon-back').innerHTML = ICON_CHECK;
  $('flash-flip-hint').innerHTML = ICON_FLIP;
  $('grade-icon-again').innerHTML = ICON_AGAIN;
  $('grade-icon-hard').innerHTML = ICON_HARD;
  $('grade-icon-good').innerHTML = ICON_GOOD;
  $('grade-icon-easy').innerHTML = ICON_EASY;
  $('tool-icon-edit').innerHTML = ICON_EDIT;
  $('tool-icon-image').innerHTML = ICON_IMAGE;
  $('tool-icon-generate').innerHTML = ICON_GENERATE;
  $('tool-icon-copy-prompt').innerHTML = ICON_COPY_PROMPT;
  $('tool-icon-regen').innerHTML = ICON_REGEN;
  frontIconWrap.querySelector('.flash-icon-tile').innerHTML = iconBlob(3);
  backIconWrap.querySelector('.flash-icon-tile').innerHTML = iconBlob(8);
  document.querySelector('.flash-blob--front').innerHTML = heroPaint();
  document.querySelector('.flash-blob--back').innerHTML = heroPaint();
}

let session = null; // { deckId, box, queue: [cards], idx }
let editing = false;

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

function stopEditing() {
  editing = false;
  frontText.contentEditable = 'false';
  backText.contentEditable = 'false';
  toolEdit.classList.remove('active');
}

function loadCard() {
  stopEditing();
  const card = session.queue[session.idx];
  frontText.textContent = card.front;
  backText.textContent = card.back;
  paintImage(frontImage, frontPhoto, frontIconWrap, card.frontImage);
  paintImage(backImage, backPhoto, backIconWrap, card.backImage);
  showFace(true);
  gradesEl.hidden = true;
  flashNote.textContent = BOXES[session.box].label;
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

  session = { deckId, box, queue, idx: 0, classLabel: deck.classLabel, subject: deck.subject, topic: deck.topic };
  reviewSubject.textContent = `${deck.subject}: ${deck.topic}`;
  reviewBd.querySelector('.review-stage').hidden = false;
  doneEl.hidden = true;
  reviewBd.classList.add('open');
  reviewBd.setAttribute('aria-hidden', 'false');
  if (siteNav) siteNav.style.display = 'none';
  loadCard();
}

function closeSession() {
  stopEditing();
  reviewBd.classList.remove('open');
  reviewBd.setAttribute('aria-hidden', 'true');
  if (siteNav) siteNav.style.display = '';
  session = null;
  renderDecks();
}

async function toggleEdit() {
  if (!session) return;
  const card = session.queue[session.idx];

  if (editing) {
    // Save whichever face text may have changed.
    const front = frontText.textContent.trim();
    const back = backText.textContent.trim();
    stopEditing();
    if (front === card.front && back === card.back) return;
    try {
      await updateCard(session.deckId, card.id, { front, back });
      card.front = front;
      card.back = back;
    } catch (err) {
      console.error('[Recall Press] edit save failed:', err);
    }
    return;
  }

  editing = true;
  toolEdit.classList.add('active');
  const front = !flashCard.classList.contains('flipped');
  (front ? frontText : backText).contentEditable = 'true';
  (front ? frontText : backText).focus();
}

async function handleImagePick(file) {
  if (!session || !file) return;
  const card = session.queue[session.idx];
  const side = flashCard.classList.contains('flipped') ? 'back' : 'front';
  const field = side === 'front' ? 'frontImage' : 'backImage';

  toolImage.disabled = true;
  try {
    const url = await uploadCardImage(file);
    await updateCard(session.deckId, card.id, { [field]: url });
    card[field] = url;
    paintImage(
      side === 'front' ? frontImage : backImage,
      side === 'front' ? frontPhoto : backPhoto,
      side === 'front' ? frontIconWrap : backIconWrap,
      url,
    );
  } catch (err) {
    console.error('[Recall Press] image upload failed:', err);
    alert(err.message || 'Could not add that image.');
  }
  toolImage.disabled = false;
}

async function handleGenerate() {
  if (!session) return;
  const card = session.queue[session.idx];
  const side = flashCard.classList.contains('flipped') ? 'back' : 'front';
  const field = side === 'front' ? 'frontImage' : 'backImage';
  const text = side === 'front' ? card.front : card.back;

  toolGenerate.disabled = true;
  try {
    const url = await generateCardImage(buildImagePrompt(text));
    await updateCard(session.deckId, card.id, { [field]: url });
    card[field] = url;
    paintImage(
      side === 'front' ? frontImage : backImage,
      side === 'front' ? frontPhoto : backPhoto,
      side === 'front' ? frontIconWrap : backIconWrap,
      url,
    );
  } catch (err) {
    console.error('[Recall Press] image generation failed:', err);
    alert(err.message || 'Could not generate that image.');
  }
  toolGenerate.disabled = false;
}

async function handleCopyPrompt() {
  if (!session) return;
  const card = session.queue[session.idx];
  const side = flashCard.classList.contains('flipped') ? 'back' : 'front';
  const text = side === 'front' ? card.front : card.back;

  try {
    await navigator.clipboard.writeText(buildImagePrompt(text));
    const label = $('tool-copy-prompt-label');
    label.textContent = 'Copied!';
    setTimeout(() => { label.textContent = 'Copy Prompt'; }, 1500);
  } catch (err) {
    console.error('[Recall Press] copy prompt failed:', err);
    alert('Could not copy the prompt.');
  }
}

async function regenerateCurrentCard() {
  if (!session) return;
  const card = session.queue[session.idx];
  toolRegen.disabled = true;
  try {
    const [fresh] = await printCards({
      classLabel: session.classLabel,
      subject: session.subject,
      topic: session.topic,
      count: 1,
    });
    if (!fresh) throw new Error('No replacement came back — try again.');
    await updateCard(session.deckId, card.id, {
      front: fresh.front, back: fresh.back, frontImage: null, backImage: null,
    });
    Object.assign(card, { front: fresh.front, back: fresh.back, frontImage: null, backImage: null });
    loadCard();
  } catch (err) {
    console.error('[Recall Press] regenerate failed:', err);
    alert(err.message || 'Could not regenerate this card.');
  }
  toolRegen.disabled = false;
}

export function initReview() {
  mountIcons();

  deckGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.drawer.has-due');
    if (!btn) return;
    startSession(btn.dataset.deck, parseInt(btn.dataset.box, 10));
  });

  flashCard.addEventListener('click', (e) => {
    if (!session || editing) return;
    if (e.target.closest('.flash-note')) return;
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

  toolEdit.addEventListener('click', toggleEdit);
  toolImage.addEventListener('click', () => toolImageInput.click());
  toolImageInput.addEventListener('change', () => {
    const file = toolImageInput.files?.[0];
    toolImageInput.value = '';
    handleImagePick(file);
  });
  toolGenerate.addEventListener('click', handleGenerate);
  toolCopyPrompt.addEventListener('click', handleCopyPrompt);
  toolRegen.addEventListener('click', regenerateCurrentCard);

  reviewClose.addEventListener('click', closeSession);
  doneCloseBtn.addEventListener('click', closeSession);
  reviewBd.addEventListener('click', (e) => {
    if (e.target === reviewBd) closeSession();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reviewBd.classList.contains('open')) closeSession();
  });
}
