/* ═══════════════════════════════════════════════════════
   RECALL PRESS — CARD EDITOR (generator page only)
   All card editing/prompting lives here: edit text, upload or
   AI-generate a card image, copy the image prompt, regenerate
   a card outright. Pages through every card in a deck (not just
   due ones — editing doesn't care about Leitner boxes). Students
   never see this; the library page is read-only practice.
═══════════════════════════════════════════════════════ */
import { $, safe } from './config.js';
import { listDecks, updateCard } from './deck-store.js';
import { printCards } from './api.js';
import { uploadCardImage, generateCardImage } from './image-upload.js';
import {
  heroPaint, iconBlob, ICON_QUESTION, ICON_CHECK, ICON_FLIP,
  ICON_EDIT, ICON_IMAGE, ICON_GENERATE, ICON_COPY_PROMPT, ICON_REGEN,
} from './icons.js';

/** Shared with the "Copy Prompt" tool so a user can take the same wording
 * to an external AI image generator instead of our built-in one. */
function buildImagePrompt(text) {
  return `Flat vector clip-art icon of: ${text}. Simple flat design, bold solid colors, minimal shading, icon only. No text, no letters, no numbers, no words, no writing, no labels, no captions anywhere in the image.`;
}

const editDeckGrid = $('edit-deck-grid');
const editDeckEmpty = $('edit-deck-empty');

const editorBd = $('editor-bd');
const editorSubject = $('editor-subject');
const editorProgress = $('editor-progress');
const editorClose = $('editor-close');
const editorPrev = $('editor-prev');
const editorNext = $('editor-next');
const flashCard = $('editor-flash-card');
const flashNote = $('editor-flash-note');
const frontText = $('editor-front-text');
const backText = $('editor-back-text');
const frontImage = $('editor-image-front');
const backImage = $('editor-image-back');
const frontPhoto = $('editor-photo-front');
const backPhoto = $('editor-photo-back');
const frontIconWrap = $('editor-icon-wrap-front');
const backIconWrap = $('editor-icon-wrap-back');
const toolEdit = $('editor-tool-edit');
const toolImage = $('editor-tool-image');
const toolGenerate = $('editor-tool-generate');
const toolCopyPrompt = $('editor-tool-copy-prompt');
const toolRegen = $('editor-tool-regen');
const toolImageInput = $('editor-tool-image-input');
const siteNav = document.querySelector('.site-nav');

function mountIcons() {
  $('editor-icon-front').innerHTML = ICON_QUESTION;
  $('editor-icon-back').innerHTML = ICON_CHECK;
  $('editor-flip-hint').innerHTML = ICON_FLIP;
  $('editor-tool-icon-edit').innerHTML = ICON_EDIT;
  $('editor-tool-icon-image').innerHTML = ICON_IMAGE;
  $('editor-tool-icon-generate').innerHTML = ICON_GENERATE;
  $('editor-tool-icon-copy-prompt').innerHTML = ICON_COPY_PROMPT;
  $('editor-tool-icon-regen').innerHTML = ICON_REGEN;
  frontIconWrap.querySelector('.flash-icon-tile').innerHTML = iconBlob(3);
  backIconWrap.querySelector('.flash-icon-tile').innerHTML = iconBlob(8);
  document.querySelector('#editor-flash-card .flash-blob--front').innerHTML = heroPaint();
  document.querySelector('#editor-flash-card .flash-blob--back').innerHTML = heroPaint();
}

let deck = null; // { id, cards, subject, topic, ... }
let idx = 0;
let editing = false;

export async function renderEditDecks() {
  const decks = await listDecks();
  editDeckEmpty.style.display = decks.length ? 'none' : '';
  editDeckGrid.querySelectorAll('.deck-card').forEach((el) => el.remove());

  decks.forEach((d) => {
    const total = (d.cards || []).length;
    const card = document.createElement('div');
    card.className = 'deck-card deck-card--edit';
    card.dataset.deck = d.id;
    card.innerHTML = `
      <div class="deck-card-hdr">
        <span class="deck-subject">${safe(d.subject)}</span>
        <span class="deck-topic">${safe(d.topic)}</span>
        <span class="deck-total">${total} card${total === 1 ? '' : 's'}</span>
      </div>
      <div class="deck-edit-cta">Edit cards →</div>`;
    editDeckGrid.appendChild(card);
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
  const card = deck.cards[idx];
  frontText.textContent = card.front;
  backText.textContent = card.back;
  paintImage(frontImage, frontPhoto, frontIconWrap, card.frontImage);
  paintImage(backImage, backPhoto, backIconWrap, card.backImage);
  showFace(true);
  flashNote.textContent = `Card ${idx + 1}`;
  editorProgress.textContent = `${idx + 1} / ${deck.cards.length}`;
  editorPrev.disabled = idx === 0;
  editorNext.disabled = idx === deck.cards.length - 1;
}

export async function openEditor(deckId) {
  const decks = await listDecks();
  const found = decks.find((d) => d.id === deckId);
  if (!found || !(found.cards || []).length) return;

  deck = found;
  idx = 0;
  editorSubject.textContent = `${deck.subject}: ${deck.topic}`;
  editorBd.classList.add('open');
  editorBd.setAttribute('aria-hidden', 'false');
  if (siteNav) siteNav.style.display = 'none';
  loadCard();
}

function closeEditor() {
  stopEditing();
  editorBd.classList.remove('open');
  editorBd.setAttribute('aria-hidden', 'true');
  if (siteNav) siteNav.style.display = '';
  deck = null;
  renderEditDecks();
}

function goPrev() {
  if (!deck || idx === 0) return;
  idx -= 1;
  loadCard();
}
function goNext() {
  if (!deck || idx >= deck.cards.length - 1) return;
  idx += 1;
  loadCard();
}

async function toggleEdit() {
  if (!deck) return;
  const card = deck.cards[idx];

  if (editing) {
    const front = frontText.textContent.trim();
    const back = backText.textContent.trim();
    stopEditing();
    if (front === card.front && back === card.back) return;
    try {
      await updateCard(deck.id, card.id, { front, back });
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
  if (!deck || !file) return;
  const card = deck.cards[idx];
  const side = flashCard.classList.contains('flipped') ? 'back' : 'front';
  const field = side === 'front' ? 'frontImage' : 'backImage';

  toolImage.disabled = true;
  try {
    const url = await uploadCardImage(file);
    await updateCard(deck.id, card.id, { [field]: url });
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
  if (!deck) return;
  const card = deck.cards[idx];
  const side = flashCard.classList.contains('flipped') ? 'back' : 'front';
  const field = side === 'front' ? 'frontImage' : 'backImage';
  const text = side === 'front' ? card.front : card.back;

  toolGenerate.disabled = true;
  try {
    const url = await generateCardImage(buildImagePrompt(text));
    await updateCard(deck.id, card.id, { [field]: url });
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
  if (!deck) return;
  const card = deck.cards[idx];
  const side = flashCard.classList.contains('flipped') ? 'back' : 'front';
  const text = side === 'front' ? card.front : card.back;

  try {
    await navigator.clipboard.writeText(buildImagePrompt(text));
    const label = $('editor-tool-copy-prompt-label');
    label.textContent = 'Copied!';
    setTimeout(() => { label.textContent = 'Copy Prompt'; }, 1500);
  } catch (err) {
    console.error('[Recall Press] copy prompt failed:', err);
    alert('Could not copy the prompt.');
  }
}

async function regenerateCurrentCard() {
  if (!deck) return;
  const card = deck.cards[idx];
  toolRegen.disabled = true;
  try {
    const [fresh] = await printCards({
      classLabel: deck.classLabel,
      subject: deck.subject,
      topic: deck.topic,
      count: 1,
    });
    if (!fresh) throw new Error('No replacement came back — try again.');
    await updateCard(deck.id, card.id, {
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

export function initCardEditor() {
  mountIcons();

  editDeckGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.deck-card--edit');
    if (!card) return;
    openEditor(card.dataset.deck);
  });

  flashCard.addEventListener('click', (e) => {
    if (!deck || editing) return;
    if (e.target.closest('.flash-note')) return;
    showFace(flashCard.classList.contains('flipped'));
  });

  editorPrev.addEventListener('click', goPrev);
  editorNext.addEventListener('click', goNext);

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

  editorClose.addEventListener('click', closeEditor);
  editorBd.addEventListener('click', (e) => {
    if (e.target === editorBd) closeEditor();
  });
  document.addEventListener('keydown', (e) => {
    if (!editorBd.classList.contains('open')) return;
    if (e.key === 'Escape') closeEditor();
    else if (e.key === 'ArrowLeft') goPrev();
    else if (e.key === 'ArrowRight') goNext();
  });
}
