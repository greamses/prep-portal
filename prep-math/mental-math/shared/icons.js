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

export const ICON_FULLSCREEN = svg(
  `<path d="M4 9V5.6A1.6 1.6 0 0 1 5.6 4H9M20 9V5.6A1.6 1.6 0 0 0 18.4 4H15M4 15v3.4A1.6 1.6 0 0 0 5.6 20H9M20 15v3.4a1.6 1.6 0 0 1-1.6 1.6H15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
);

// PrepBot's hover menu — no circular chip backgrounds, bare glyphs only.
export const ICON_ASK = svg(
  `<path d="M8.6 9.3a3.5 3.5 0 1 1 5.6 2.8c-.95.7-1.5 1.25-1.5 2.3" fill="none" stroke="var(--accent-secondary)" stroke-width="2.1" stroke-linecap="round"/>` +
  `<circle cx="12.7" cy="17.6" r="1.15" fill="var(--accent-secondary)"/>`,
);

export const ICON_SLEEP = svg(
  `<path d="M20 13.4A8.4 8.4 0 1 1 10.7 4.1a6.7 6.7 0 0 0 9.3 9.3z" fill="var(--accent-secondary)"/>`,
);

export const ICON_WAKE = svg(
  `<circle cx="12" cy="12" r="4.6" fill="var(--accent-warning)"/>` +
  `<path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.1 5.9l-1.55 1.55M7.45 16.55L5.9 18.1M18.1 18.1l-1.55-1.55M7.45 7.45L5.9 5.9" fill="none" stroke="var(--accent-warning)" stroke-width="1.8" stroke-linecap="round"/>`,
);

// "Wiggle" / manual animation trigger — a sparkle, matching prepbot.js's
// own sparkle glyph language.
export const ICON_WIGGLE = svg(
  `<path d="M12 3l1.7 4.6L18 9l-4.3 1.5L12 15l-1.7-4.5L6 9l4.3-1.4z" fill="var(--accent-primary)"/>` +
  `<circle cx="18.3" cy="17" r="1.5" fill="var(--accent-warning)"/>`,
);

// Voice mode toggle — icon shows what clicking switches TO (same
// convention as ICON_SLEEP/ICON_WAKE). Talk = a speaker with sound waves
// (echoes PB_ICONS.speaker in utils/prepbot/prepbot.js); Beep = a small
// blip/burst, for switching back to the silent-rhythm mode.
export const ICON_TALK_MODE = svg(
  `<path d="M4 9.4h2.7l3.8-3.2a0.8 0.8 0 0 1 1.32 0.6v10.4a0.8 0.8 0 0 1-1.32 0.6L6.7 14.6H4a1 1 0 0 1-1-1v-3.2a1 1 0 0 1 1-1z" fill="var(--accent-secondary)"/>` +
  `<path d="M15.3 9.1a4 4 0 0 1 0 5.8" fill="none" stroke="var(--accent-success)" stroke-width="1.8" stroke-linecap="round"/>` +
  `<path d="M17.6 6.6a7.4 7.4 0 0 1 0 10.8" fill="none" stroke="var(--accent-warning)" stroke-width="1.8" stroke-linecap="round"/>`,
);

export const ICON_BEEP_MODE = svg(
  `<circle cx="12" cy="12" r="3" fill="var(--accent-secondary)"/>` +
  `<path d="M4.2 12h2.4M17.4 12h2.4M6.9 6.2l1.7 1.7M15.4 15.9l1.7 1.7M6.9 17.8l1.7-1.7M15.4 8.1l1.7-1.7" fill="none" stroke="var(--accent-secondary)" stroke-width="1.8" stroke-linecap="round"/>`,
);

// Background-music toggle — a little beamed pair of notes. The "off" variant
// adds a danger-coloured slash, same show-what-it-switches-to convention as
// the other menu toggles isn't used here (this one shows current state).
export const ICON_MUSIC = svg(
  `<path d="M9 6.2l8-1.8v8.4" fill="none" stroke="var(--accent-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<circle cx="7" cy="15.4" r="2.5" fill="var(--accent-secondary)"/>` +
  `<circle cx="17" cy="13.6" r="2.5" fill="var(--accent-secondary)"/>`,
);

export const ICON_MUSIC_OFF = svg(
  `<path d="M9 6.2l8-1.8v8.4" fill="none" stroke="var(--text-tertiary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<circle cx="7" cy="15.4" r="2.5" fill="var(--text-tertiary)"/>` +
  `<circle cx="17" cy="13.6" r="2.5" fill="var(--text-tertiary)"/>` +
  `<path d="M4 4l16 16" fill="none" stroke="var(--accent-danger)" stroke-width="2" stroke-linecap="round"/>`,
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
