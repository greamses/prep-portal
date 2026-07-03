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

// ── Shared mutable session state ──
export const state = {
  cls: '',        // e.g. "jss", "ss-science"
  clsLabel: '',   // e.g. "JSS 2"
  subject: '',
  topic: '',
  count: 10,
  deckId: null,   // active deck being reviewed
};
