/* ═══════════════════════════════════════════════════════
   RECALL PRESS — ICON SET
   Same visual language as utils/components/nav-icons.js:
   24×24 grid, chunky rounded shapes, 2-3 palette colours +
   white highlights, sitting on a soft accent tile.
═══════════════════════════════════════════════════════ */
export { paintBlob } from '/utils/components/nav-icons.js';

const svg = (paths) =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${paths}</svg>`;

// Card front — a question mark on a tile.
export const ICON_QUESTION = svg(
  `<circle cx="12" cy="12" r="9.4" fill="var(--accent-secondary)"/>` +
  `<path d="M9.1 9.6a3 3 0 0 1 5.8.9c0 1.7-1.9 1.8-2.1 3.4" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/>` +
  `<circle cx="12.4" cy="17" r="1.15" fill="#fff"/>`,
);

// Card back — a checkmark on a tile.
export const ICON_CHECK = svg(
  `<circle cx="12" cy="12" r="9.4" fill="var(--accent-success)"/>` +
  `<path d="M7.3 12.5l3 3 6.4-6.9" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`,
);

// Flip hint — two chasing arrows.
export const ICON_FLIP = svg(
  `<path d="M4 9a8 8 0 0 1 13.8-5.3M20 3.7v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="M20 15a8 8 0 0 1-13.8 5.3M4 20.3v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
);

// Grade: Again — retry arrow (white, sits on the accent-danger button).
export const ICON_AGAIN = svg(
  `<path d="M4.4 12a7.6 7.6 0 0 1 13-5.4M19.6 3.8v5h-5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
);

// Grade: Hard — a flame (white, on accent-warning).
export const ICON_HARD = svg(
  `<path d="M12 2.4c1.5 2.8.7 4.2 2.3 5.7 1.6-.9 1.8-2.5 1.8-2.5 1.8 1.9 2.6 4.4 2.6 6.4a6.7 6.7 0 1 1-13.4 0c0-2.1.7-3.7 1.6-5 0 0 .5 2 1.9 2.3-.6-2.8.7-4.9 3.2-6.9z" fill="#fff"/>`,
);

// Grade: Good — thumbs up (white, on accent-secondary).
export const ICON_GOOD = svg(
  `<path d="M7 11h2.2l1.1-5.1a1.5 1.5 0 0 1 3 .5V11H17a1.5 1.5 0 0 1 1.5 1.9L17.4 18a2 2 0 0 1-1.9 1.4H9a2 2 0 0 1-2-2z" fill="#fff"/>` +
  `<rect x="3.2" y="11" width="2.8" height="8.4" rx="1" fill="#fff" opacity="0.8"/>`,
);

// Grade: Easy — a lightning bolt (white, on accent-success).
export const ICON_EASY = svg(
  `<path d="M13 2.2 4.4 13.8h5.7l-1 8 8.5-11.6h-5.7z" fill="#fff"/>`,
);
