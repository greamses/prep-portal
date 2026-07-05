/* ═══════════════════════════════════════════════════════
   RECALL PRESS — ICON SET
   Matches utils/components/nav-icons.js exactly: no built-in
   background — icons are bare 24×24 objects in 2-3 palette
   colours + white highlights, sitting on the shared organic
   "sticker" blob tile (iconBlob) applied by CSS, same as
   .nav-icon/.nav-icon__blob in nav.css.
═══════════════════════════════════════════════════════ */
export { paintBlob, iconBlob, heroPaint } from '/utils/components/nav-icons.js';

const svg = (paths) =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${paths}</svg>`;

// Card front — a little card with a bold "?" (front = the prompt).
export const ICON_QUESTION = svg(
  `<rect x="4" y="3.5" width="16" height="17" rx="3" fill="var(--accent-secondary)"/>` +
  `<rect x="6.4" y="6" width="11.2" height="2.2" rx="1.1" fill="#fff" opacity="0.85"/>` +
  `<path d="M9.6 11.6a2.6 2.6 0 0 1 5-1c0 1.5-1.7 1.6-1.9 3" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>` +
  `<circle cx="12.3" cy="16.7" r="1.05" fill="#fff"/>`,
);

// Card back — a badge with a checkmark (back = you got it).
export const ICON_CHECK = svg(
  `<circle cx="12" cy="12" r="9.2" fill="var(--accent-success)"/>` +
  `<circle cx="9" cy="8.6" r="2.6" fill="#fff" opacity="0.25"/>` +
  `<path d="M7.4 12.4l3 3 6.2-6.7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
);

// Flip hint — two chasing arrows (same stroke language as signin/signout).
export const ICON_FLIP = svg(
  `<path d="M4 9a8 8 0 0 1 13.8-5.3M20 3.7v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="M20 15a8 8 0 0 1-13.8 5.3M4 20.3v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
);

// Edit — a pencil (echoes the Editorials nav icon's diagonal-strokes build).
export const ICON_EDIT = svg(
  `<path d="M15.6 3.8l4.6 4.6-2 2-4.6-4.6z" fill="var(--accent-secondary)"/>` +
  `<path d="M13.6 5.8l4.6 4.6-7.8 7.8-4.6-4.6z" fill="var(--accent-primary)"/>` +
  `<path d="M5.8 13.6l4.6 4.6-5.5 1.6a.8.8 0 0 1-1-1z" fill="var(--accent-warning)"/>`,
);

// Add image — a little framed picture (mountain + sun), like the blogs scene.
export const ICON_IMAGE = svg(
  `<rect x="3" y="4.5" width="18" height="15" rx="2.4" fill="var(--accent-primary)"/>` +
  `<rect x="4.5" y="6" width="15" height="12" rx="1.4" fill="#fff"/>` +
  `<circle cx="9" cy="10" r="1.8" fill="var(--accent-warning)"/>` +
  `<path d="M4.5 16.5l4-4.4 3.2 3 2.8-3.4 4.5 4.8z" fill="var(--accent-secondary)"/>`,
);

// Generate — a magic sparkle (AI-created image, distinct from the upload icon).
export const ICON_GENERATE = svg(
  `<path d="M12 2.6l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z" fill="var(--accent-secondary)"/>` +
  `<path d="M18.6 14.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="var(--accent-warning)"/>`,
);

// Copy Prompt — a clipboard, for taking the image prompt to an external tool.
export const ICON_COPY_PROMPT = svg(
  `<rect x="7" y="3" width="10" height="4" rx="1" fill="var(--accent-warning)"/>` +
  `<rect x="4.5" y="5.2" width="15" height="16" rx="2" fill="var(--accent-secondary)"/>` +
  `<rect x="7" y="9.5" width="10" height="1.8" rx="0.9" fill="#fff" opacity="0.85"/>` +
  `<rect x="7" y="13.2" width="10" height="1.8" rx="0.9" fill="#fff" opacity="0.85"/>` +
  `<rect x="7" y="16.9" width="6.5" height="1.8" rx="0.9" fill="#fff" opacity="0.85"/>`,
);

// Regenerate — a retry loop (matches the flip-arrow stroke language).
export const ICON_REGEN = svg(
  `<path d="M4.4 12a7.6 7.6 0 0 1 13-5.4M19.6 3.8v5h-5" fill="none" stroke="var(--accent-danger)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="M19.6 12a7.6 7.6 0 0 1-13 5.4M4.4 20.2v-5h5" fill="none" stroke="var(--accent-danger)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`,
);

// Grade: Again — retry arrow (white, on accent-danger button).
export const ICON_AGAIN = svg(
  `<path d="M4.4 12a7.6 7.6 0 0 1 13-5.4M19.6 3.8v5h-5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
);

// Grade: Hard — a flame (white, on accent-warning button).
export const ICON_HARD = svg(
  `<path d="M12 2.4c1.5 2.8.7 4.2 2.3 5.7 1.6-.9 1.8-2.5 1.8-2.5 1.8 1.9 2.6 4.4 2.6 6.4a6.7 6.7 0 1 1-13.4 0c0-2.1.7-3.7 1.6-5 0 0 .5 2 1.9 2.3-.6-2.8.7-4.9 3.2-6.9z" fill="#fff"/>`,
);

// Grade: Good — thumbs up (white, on accent-secondary button).
export const ICON_GOOD = svg(
  `<path d="M7 11h2.2l1.1-5.1a1.5 1.5 0 0 1 3 .5V11H17a1.5 1.5 0 0 1 1.5 1.9L17.4 18a2 2 0 0 1-1.9 1.4H9a2 2 0 0 1-2-2z" fill="#fff"/>` +
  `<rect x="3.2" y="11" width="2.8" height="8.4" rx="1" fill="#fff" opacity="0.8"/>`,
);

// Grade: Easy — a lightning bolt (white, on accent-success button).
export const ICON_EASY = svg(
  `<path d="M13 2.2 4.4 13.8h5.7l-1 8 8.5-11.6h-5.7z" fill="#fff"/>`,
);

// Delete — a plain trash can (currentColor, tints danger-red on hover via CSS).
export const ICON_DELETE = svg(
  `<path d="M4 7h16M9 7V4.8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7M6.5 7l1 12.3a2 2 0 0 0 2 1.9h5a2 2 0 0 0 2-1.9L17.5 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
);
