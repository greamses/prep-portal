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

// PrepBot mascot — same robot used by the site-wide chat FAB
// (utils/prepbot/prepbot.js's PB_ICONS.robotAwake), reused here so the
// "teacher" narrating the trick is recognizably the same character.
// Eyes carry their own class (absent from the original) so JS can blink
// them independently. The mouth is a <path> (not the original's <rect>)
// whose `d` is swapped between MOUTH_SHAPES (scene.js) to "talk" — scaling
// the old rect from its own center visibly popped it away from the face
// the moment it grew past the jaw's rounded corners; morphing a path in
// place has no such transform-origin trap.
export const ICON_PREPBOT = `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><line x1="32" y1="7" x2="32" y2="16" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round"/><circle cx="32" cy="6" r="3.2" fill="var(--accent-warning)"/><rect x="4" y="27" width="8" height="13" rx="4" fill="var(--accent-primary)"/><rect x="52" y="27" width="8" height="13" rx="4" fill="var(--accent-primary)"/><rect x="11" y="16" width="42" height="38" rx="14" fill="var(--accent-secondary)"/><rect x="17" y="22" width="30" height="19" rx="9.5" fill="var(--ink)"/><circle class="mm-bot-eye" cx="26" cy="31.5" r="3.1" fill="var(--accent-warning)"/><circle class="mm-bot-eye" cx="38" cy="31.5" r="3.1" fill="var(--accent-warning)"/><path class="mm-bot-mouth" d="M24 48 L40 48" stroke="var(--ink)" stroke-width="4.4" stroke-linecap="round" fill="none"/></svg>`;

// Mouth shapes to cycle through while talking (index 0 = closed/resting).
// Kept as open strokes (not filled paths) so swapping `d` never needs the
// shape to close on itself — a flat line reads as "mouth shut" just fine.
export const MOUTH_SHAPES = [
  "M24 48 L40 48",
  "M25 47 Q32 50.5 39 47",
  "M24.5 46 Q32 53 39.5 46",
  "M27 46.5 Q32 52 37 46.5",
];
