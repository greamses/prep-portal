/* ═══════════════════════════════════════════════════════
   RECALL PRESS — CONFIG & CONSTANTS
═══════════════════════════════════════════════════════ */

// DOM shortcut
export const $ = (id) => document.getElementById(id);

export const safe = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

export const slugify = (str) =>
  String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'general';

// ── The five Leitner drawers every deck sorts cards into ──
// box 1 = just printed / most-missed, box 5 = mastered. Index = box number.
export const BOXES = [
  null, // no box 0
  { label: 'Daily',      days: 0 },
  { label: '2-Day',      days: 2 },
  { label: '4-Day',      days: 4 },
  { label: '9-Day',      days: 9 },
  { label: 'Mastered',   days: 21 },
];
export const MAX_BOX = BOXES.length - 1;

export function nextBox(box, grade) {
  // grade: 'again' | 'hard' | 'good' | 'easy'
  if (grade === 'again') return 1;
  if (grade === 'hard') return Math.max(1, box - 1);
  if (grade === 'easy') return Math.min(MAX_BOX, box + 2);
  return Math.min(MAX_BOX, box + 1); // 'good'
}

export function dueAtFor(box) {
  const days = BOXES[box]?.days ?? 0;
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

// ── Deck "pouch" visuals — shared between review.js (library page) and
// card-editor.js (edit page) so the same deck renders with the same
// colour on both. Six-colour rotation matches the sticky-note/subject-
// badge pastel set already used elsewhere (--badge-subject-N-bg).
const POUCH_COLOR_COUNT = 6;
export const pouchColorClass = (i) => `deck-pouch--c${i % POUCH_COLOR_COUNT}`;
export const pouchTagColorClass = (i) => `pp-sticky--c${i % POUCH_COLOR_COUNT}`;

// 2-3 card "slivers" peeking out of the pouch opening, in the exact same
// paper/receipt look as the real study card (.pp-receipt), just smaller —
// so pulling a card out of its pouch feels like the same object, not a
// different design.
export const pouchCardsHtml = () => `
    <div class="deck-pouch-cards" aria-hidden="true">
      <div class="deck-pouch-card deck-pouch-card--1 pp-receipt"><div class="pp-receipt__paper"></div></div>
      <div class="deck-pouch-card deck-pouch-card--2 pp-receipt"><div class="pp-receipt__paper"></div></div>
      <div class="deck-pouch-card deck-pouch-card--3 pp-receipt"><div class="pp-receipt__paper"></div></div>
    </div>`;

// Swipe-left/right to page through cards on touch devices (arrow buttons are
// hidden — desktop uses arrow keys, touch uses this). preventDefault on a
// moving touchmove stops the browser turning the same gesture into a tap
// (which would flip the card instead of paging it).
export function attachSwipeNav(el, { onPrev, onNext } = {}) {
  const THRESHOLD = 40;
  let startX = 0;
  let startY = 0;
  let tracking = false;
  let swiping = false;

  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
    swiping = false;
  }, { passive: true });

  el.addEventListener('touchmove', (e) => {
    if (!tracking) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (!swiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) swiping = true;
    if (swiping) e.preventDefault();
  }, { passive: false });

  el.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    if (!swiping) return;
    const dx = (e.changedTouches[0]?.clientX ?? startX) - startX;
    if (Math.abs(dx) < THRESHOLD) return;
    if (dx < 0) onNext?.();
    else onPrev?.();
  });
}

// ── Shared mutable session state ──
export const state = {
  cls: '',        // e.g. "jss", "ss-science"
  clsLabel: '',   // e.g. "JSS 2"
  subject: '',
  topic: '',
  count: 10,
  deckId: null,   // active deck being reviewed
};
