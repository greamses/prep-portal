/* =========================================================================
   PREP PORTAL — DASHBOARD ICON SET
   -------------------------------------------------------------------------
   Content glyphs (papers, users, star…) are chunky multicolour "stickers" in
   the same language as utils/components/nav-icons.js — 24×24, 2–3 palette
   colours + white highlights, token-based fills so they re-tint in light/dark.
   Pure UI chrome (arrow, chevrons) stays single-stroke `currentColor`, same
   split nav-icons.js itself uses for its utility glyphs (SVG_SUN/SVG_MOON).
========================================================================= */

const svg = (paths) =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${paths}</svg>`;

const line = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const I = {
  // Past papers — stacked sheets
  papers: svg(
    `<rect x="6" y="2" width="12" height="16" rx="1.5" fill="var(--accent-primary)"/>` +
      `<rect x="3" y="5.5" width="12" height="16" rx="1.5" fill="var(--accent-secondary)"/>` +
      `<rect x="5.2" y="8.6" width="7.6" height="1.4" rx="0.7" fill="#fff"/>` +
      `<rect x="5.2" y="11.3" width="7.6" height="1.4" rx="0.7" fill="#fff" opacity="0.85"/>` +
      `<rect x="5.2" y="14" width="5" height="1.4" rx="0.7" fill="#fff" opacity="0.7"/>`,
  ),

  // Activities / labs — colourful 2x2 board
  activity: svg(
    `<rect x="3" y="3" width="8" height="8" rx="2" fill="var(--accent-primary)"/>` +
      `<rect x="13" y="3" width="8" height="8" rx="2" fill="var(--accent-secondary)"/>` +
      `<rect x="3" y="13" width="8" height="8" rx="2" fill="var(--accent-success)"/>` +
      `<rect x="13" y="13" width="8" height="8" rx="2" fill="var(--accent-danger)"/>`,
  ),

  // Writing / scratchpad — pencil (same mark as nav-icons.js "editorial")
  writing: svg(
    `<path d="M15.6 3.8l4.6 4.6-2 2-4.6-4.6z" fill="var(--accent-secondary)"/>` +
      `<path d="M13.6 5.8l4.6 4.6-7.8 7.8-4.6-4.6z" fill="var(--accent-primary)"/>` +
      `<path d="M5.8 13.6l4.6 4.6-5.5 1.6a.8.8 0 0 1-1-1z" fill="var(--accent-warning)"/>` +
      `<path d="M4.55 18.85l.85.85-1.45.42z" fill="var(--ink)"/>`,
  ),

  // Premium — star (same mark as nav-icons.js "star")
  star: svg(
    `<path d="M12 2.6l2.6 5.35 5.9.85-4.27 4.16 1.01 5.88L12 16.13l-5.24 2.76 1.01-5.88L3.5 8.8l5.9-.85z" fill="var(--accent-primary)"/>` +
      `<circle cx="12" cy="10.4" r="1.9" fill="#fff" opacity="0.85"/>`,
  ),

  // "View all" chrome arrow — stays a plain stroke glyph
  arrow: line(`<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>`),

  // Classes / manage users — two people
  users: svg(
    `<circle cx="9" cy="8" r="3.6" fill="var(--accent-secondary)"/>` +
      `<path d="M2.6 20.5c0-3.9 3-6.4 6.4-6.4s6.4 2.5 6.4 6.4z" fill="var(--accent-secondary)"/>` +
      `<circle cx="17" cy="9.4" r="2.8" fill="var(--accent-danger)"/>` +
      `<path d="M13.6 20.5c.2-3 2.3-5.2 5-5.2 2.6 0 4.6 2 4.9 4.6v.6z" fill="var(--accent-danger)"/>`,
  ),

  // Confirmed — green badge with a tick
  check: svg(
    `<circle cx="12" cy="12" r="10" fill="var(--accent-success)"/>` +
      `<path d="M7.4 12.4l3 3 6-6.2" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),

  // Add — blue badge with a plus
  plus: svg(
    `<circle cx="12" cy="12" r="10" fill="var(--accent-secondary)"/>` +
      `<path d="M12 7v10M7 12h10" stroke="#fff" stroke-width="2.3" stroke-linecap="round"/>`,
  ),

  // Time — clock face
  clock: svg(
    `<circle cx="12" cy="12" r="9.5" fill="var(--accent-warning)"/>` +
      `<circle cx="12" cy="12" r="6.8" fill="#fff"/>` +
      `<path d="M12 7.5v4.8l3.4 2" fill="none" stroke="var(--accent-warning)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),

  // Growth — rising bars with a trend arrow
  trendUp: svg(
    `<rect x="3" y="15" width="4" height="6" rx="1.2" fill="var(--accent-secondary)"/>` +
      `<rect x="10" y="11" width="4" height="10" rx="1.2" fill="var(--accent-primary)"/>` +
      `<rect x="17" y="6" width="4" height="15" rx="1.2" fill="var(--accent-success)"/>` +
      `<path d="M3 9l5-5 4 3 7-6" fill="none" stroke="var(--accent-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M15 1h4v4" fill="none" stroke="var(--accent-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),

  // Reports — bar chart tile
  chart: svg(
    `<rect x="2.5" y="3" width="19" height="16" rx="2.4" fill="var(--accent-secondary)"/>` +
      `<rect x="5.5" y="12" width="3" height="4.5" rx="1" fill="#fff"/>` +
      `<rect x="10.5" y="8.5" width="3" height="8" rx="1" fill="var(--accent-primary)"/>` +
      `<rect x="15.5" y="10.5" width="3" height="6" rx="1" fill="#fff"/>`,
  ),

  // Book — closed cover with page lines
  book: svg(
    `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" fill="var(--accent-secondary)"/>` +
      `<rect x="4" y="17" width="16" height="3" rx="1.4" fill="var(--accent-primary)"/>` +
      `<rect x="7.2" y="6" width="9" height="1.4" rx="0.7" fill="#fff" opacity="0.85"/>` +
      `<rect x="7.2" y="9" width="9" height="1.4" rx="0.7" fill="#fff" opacity="0.65"/>`,
  ),

  // Logout — door with an exit arrow (same mark as nav-icons.js "signout")
  logout: svg(
    `<rect x="4" y="3" width="9" height="18" rx="2.6" fill="var(--accent-secondary)"/>` +
      `<circle cx="9.6" cy="12" r="1.1" fill="#fff"/>` +
      `<path d="M21 12h-7m0 0 3-3m-3 3 3 3" fill="none" stroke="var(--accent-danger)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),

  // Settings — gear
  settings: svg(
    `<g fill="var(--accent-secondary)">` +
      `<rect x="10.6" y="1.6" width="2.8" height="4.4" rx="1.2"/>` +
      `<rect x="10.6" y="1.6" width="2.8" height="4.4" rx="1.2" transform="rotate(45 12 12)"/>` +
      `<rect x="10.6" y="1.6" width="2.8" height="4.4" rx="1.2" transform="rotate(90 12 12)"/>` +
      `<rect x="10.6" y="1.6" width="2.8" height="4.4" rx="1.2" transform="rotate(135 12 12)"/>` +
      `<rect x="10.6" y="1.6" width="2.8" height="4.4" rx="1.2" transform="rotate(180 12 12)"/>` +
      `<rect x="10.6" y="1.6" width="2.8" height="4.4" rx="1.2" transform="rotate(225 12 12)"/>` +
      `<rect x="10.6" y="1.6" width="2.8" height="4.4" rx="1.2" transform="rotate(270 12 12)"/>` +
      `<rect x="10.6" y="1.6" width="2.8" height="4.4" rx="1.2" transform="rotate(315 12 12)"/>` +
      `</g>` +
      `<circle cx="12" cy="12" r="6.6" fill="var(--accent-secondary)"/>` +
      `<circle cx="12" cy="12" r="3.4" fill="#fff"/>` +
      `<circle cx="12" cy="12" r="1.7" fill="var(--accent-secondary)"/>`,
  ),

  // Child — small person
  child: svg(
    `<circle cx="12" cy="7.4" r="4" fill="var(--accent-secondary)"/>` +
      `<path d="M4 20.6c0-4.2 3.6-7.2 8-7.2s8 3 8 7.2z" fill="var(--accent-secondary)"/>` +
      `<circle cx="12" cy="7.4" r="1.6" fill="#fff" opacity="0.7"/>`,
  ),

  // Alert — warning triangle
  alert: svg(
    `<path d="M12 2.6l10.2 17.7a1.4 1.4 0 0 1-1.2 2.1H3a1.4 1.4 0 0 1-1.2-2.1z" fill="var(--accent-warning)"/>` +
      `<rect x="10.8" y="8.4" width="2.4" height="6.4" rx="1.2" fill="#fff"/>` +
      `<circle cx="12" cy="17.6" r="1.4" fill="#fff"/>`,
  ),

  // Calendar nav chrome — plain chevrons
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`,
};
