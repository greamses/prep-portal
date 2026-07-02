/* =========================================================================
   PREP PORTAL — AUTH ICON SET
   -------------------------------------------------------------------------
   Every icon the login / sign-up modal uses lives here, imported by
   home/js/auth-modal.js. Two families:

   • ROLE MARKS (student / parent / teacher) and FIELD MARKS (email, lock,
     user) — chunky multicolour "sticker" glyphs in the same language as
     utils/components/nav-icons.js. Fills use theme accent tokens so they
     re-tint in light/dark.
   • UI CHROME (close, arrow, eye/eyeOff) — single-stroke, drawn in
     `currentColor` so CSS controls the colour. Same split nav-icons.js uses
     for its own utility glyphs (SVG_SUN / SVG_MOON / SVG_CAMERA).
========================================================================= */

const line = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const svg = (paths) =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${paths}</svg>`;

export const AUTH_ICONS = {
  // ── UI chrome (plain stroke, same convention as nav-icons.js SVG_SUN/SVG_MOON) ──
  close: line(`<path d="M18 6 6 18"/><path d="M6 6l12 12"/>`),
  arrow: line(`<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>`),
  eye: line(`<path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>`),
  eyeOff: line(`<path d="M2.5 12S6 5 12 5c2 0 3.8.6 5.4 1.5M21.5 12S18 19 12 19c-2 0-3.8-.6-5.4-1.5"/><path d="M4 4l16 16"/><path d="M9.7 9.7a3 3 0 0 0 4.2 4.2"/>`),

  // ── Field marks — multicolour stickers, same language as nav-icons.js ──
  email: svg(
    `<rect x="2.4" y="5" width="19.2" height="14" rx="2.6" fill="var(--accent-secondary)"/>` +
      `<path d="M2.4 6.5l9.6 6.8 9.6-6.8" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),
  lock: svg(
    `<path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" fill="none" stroke="var(--accent-secondary)" stroke-width="2.2" stroke-linecap="round"/>` +
      `<rect x="4" y="10.5" width="16" height="10" rx="2.6" fill="var(--accent-secondary)"/>` +
      `<circle cx="12" cy="15" r="1.6" fill="#fff"/>` +
      `<rect x="11.2" y="15.6" width="1.6" height="2.4" rx="0.8" fill="#fff"/>`,
  ),
  user: svg(
    `<circle cx="12" cy="8" r="4" fill="var(--accent-secondary)"/>` +
      `<path d="M4.5 20.5a7.5 7.5 0 0 1 15 0z" fill="var(--accent-secondary)"/>`,
  ),

  // ── Google brand mark (keeps its own colours) ───────────────────────
  google: `<svg viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.7 39.6 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6 7l6.3 5.3C39.3 36.8 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/>
  </svg>`,

  // ── Role marks (multicolour stickers) ───────────────────────────────
  // Student — graduation cap with a little tassel bead.
  student: `<svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4 22 8.4 12 12.8 2 8.4z" fill="var(--accent-secondary)"/>
    <path d="M6.4 10.3v3.2c0 1.6 2.5 2.9 5.6 2.9s5.6-1.3 5.6-2.9v-3.2L12 12.8z" fill="var(--accent-primary)"/>
    <path d="M20.6 8.9v4.4" stroke="var(--ink)" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="20.6" cy="14.3" r="1.5" fill="var(--accent-danger)"/>
  </svg>`,

  // Parent — a grown-up and a child side by side.
  parent: `<svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="8" cy="7" r="3.3" fill="var(--accent-secondary)"/>
    <path d="M2.4 20.5v-1.4a5.6 5.6 0 0 1 11.2 0v1.4z" fill="var(--accent-secondary)"/>
    <circle cx="17" cy="10" r="2.5" fill="var(--accent-danger)"/>
    <path d="M12.7 20.5v-.8a4.3 4.3 0 0 1 8.6 0v.8z" fill="var(--accent-danger)"/>
  </svg>`,

  // Teacher — a green board with a tick (lesson done) and a chalk dot.
  teacher: `<svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="4" width="18" height="13" rx="2.4" fill="var(--accent-success)"/>
    <path d="M7.4 10.4l2.5 2.5 4.7-4.8" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="17.6" cy="7" r="1.3" fill="var(--accent-primary)"/>
    <rect x="10.7" y="17" width="2.6" height="2.8" rx="0.6" fill="var(--ink)"/>
    <rect x="8.2" y="19.4" width="7.6" height="1.8" rx="0.9" fill="var(--ink)"/>
  </svg>`,
};

/** Resolve an icon by key, returning raw SVG markup ("" if unknown). */
export function authIcon(name) {
  return AUTH_ICONS[name] || "";
}

export default AUTH_ICONS;
