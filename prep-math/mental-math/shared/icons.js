/* ═══════════════════════════════════════════════════════
   MENTAL MATH — ICON SET
   Bare 24×24 objects, same svg() convention as flashcards/js/icons.js
   (which mirrors utils/components/nav-icons.js) — no emoji. Playback
   icons use currentColor so they inherit whatever button chrome hosts
   them and swap cleanly on toggle.
═══════════════════════════════════════════════════════ */

const svg = (paths) =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${paths}</svg>`;

export const ICON_PLAY = svg(
  `<path d="M7.5 4.8v14.4a1 1 0 0 0 1.53.85l11.2-7.2a1 1 0 0 0 0-1.7l-11.2-7.2a1 1 0 0 0-1.53.85z" fill="currentColor"/>`,
);

export const ICON_PAUSE = svg(
  `<rect x="6" y="4.5" width="4.4" height="15" rx="1.4" fill="currentColor"/>` +
  `<rect x="13.6" y="4.5" width="4.4" height="15" rx="1.4" fill="currentColor"/>`,
);

export const ICON_PREV = svg(
  `<path d="M15 5.5L8 12l7 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
);

export const ICON_NEXT = svg(
  `<path d="M9 5.5l7 6.5-7 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
);

export const ICON_CHECK = svg(
  `<circle cx="12" cy="12" r="9.2" fill="var(--accent-success)"/>` +
  `<path d="M7.4 12.4l3 3 6.2-6.7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
);

export const ICON_CLOSE = svg(
  `<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
);
