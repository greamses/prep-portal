/* =========================================================================
   PREP PORTAL — CUSTOM NAV ICON SET  (multicolour, IXL-inspired)
   -------------------------------------------------------------------------
   A cohesive, friendly icon family used across the mega navigation. Each icon
   is a small, well-built object drawn on a 24×24 grid from chunky rounded
   shapes in 2–3 palette colours plus white highlights — no hard outlines,
   colour does the work. They sit on a soft "sticker" tile (see nav.css).

   ▸ THEMING
     Fills reference the theme tokens (`var(--accent-*)`, `var(--ink)`), so the
     whole set re-tints automatically in light/dark. White (`#fff`) is reserved
     for small highlights that are always enclosed by a coloured shape, so the
     icon reads on any tile.

   ▸ MODULAR USAGE
     Add an icon below, then reference it from nav-config.js as
     `icon: NAV_ICONS.myIcon`. Keep the 24×24 viewBox + token-based fills.
========================================================================= */

const svg = (paths) =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${paths}</svg>`;

export const NAV_ICONS = {
  /* ── Top-level sections ─────────────────────────────────────────────── */

  // Exams — graduation cap with a tassel
  exams: svg(
    `<polygon points="12 3.4 21.6 8 12 12.6 2.4 8" fill="var(--accent-secondary)"/>` +
      `<path d="M6 9.6v3.1c0 1.7 2.7 3 6 3s6-1.3 6-3V9.6l-6 2.8z" fill="var(--accent-primary)"/>` +
      `<circle cx="12" cy="8" r="1.5" fill="#fff"/>` +
      `<rect x="20.4" y="7.7" width="1.5" height="4.6" rx="0.75" fill="var(--accent-warning)"/>` +
      `<circle cx="21.15" cy="13.2" r="1.5" fill="var(--accent-danger)"/>`,
  ),

  // Blogs — open book / article
  blogs: svg(
    `<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 18.5z" fill="var(--accent-secondary)"/>` +
      `<rect x="7.4" y="3" width="9.6" height="13.6" rx="1" fill="#fff"/>` +
      `<rect x="8.9" y="6" width="6.2" height="1.5" rx="0.75" fill="var(--accent-secondary)"/>` +
      `<rect x="8.9" y="9" width="6.2" height="1.2" rx="0.6" fill="var(--text-tertiary)"/>` +
      `<rect x="8.9" y="11.4" width="4.4" height="1.2" rx="0.6" fill="var(--text-tertiary)"/>` +
      `<path d="M14.6 3h2.4v4.4l-1.2-.9-1.2.9z" fill="var(--accent-danger)"/>`,
  ),

  // Activities — rocket (play, adventure, growth)
  activities: svg(
    `<path d="M12 2.2c2.9 1.7 4.6 4.9 4.6 8.5 0 1.6-.4 3.1-1 4.4H8.4c-.6-1.3-1-2.8-1-4.4 0-3.6 1.7-6.8 4.6-8.5z" fill="var(--accent-secondary)"/>` +
      `<circle cx="12" cy="9" r="2.1" fill="#fff"/>` +
      `<circle cx="12" cy="9" r="1" fill="var(--accent-secondary)"/>` +
      `<path d="M8.5 13.4C6.8 14.1 5.7 15.8 5.7 17.7l2.8-1.1zM15.5 13.4c1.7.7 2.8 2.4 2.8 4.3l-2.8-1.1z" fill="var(--accent-danger)"/>` +
      `<path d="M10.1 15.8h3.8l-.8 3c-.3 1.2-2 1.2-2.3 0z" fill="var(--accent-warning)"/>` +
      `<path d="M11.2 15.8h1.6l-.4 2.6c-.1.6-.7.6-.8 0z" fill="var(--accent-primary)"/>`,
  ),

  // Editorials — pencil
  editorial: svg(
    `<path d="M15.6 3.8l4.6 4.6-2 2-4.6-4.6z" fill="var(--accent-secondary)"/>` +
      `<path d="M13.6 5.8l4.6 4.6-7.8 7.8-4.6-4.6z" fill="var(--accent-primary)"/>` +
      `<path d="M5.8 13.6l4.6 4.6-5.5 1.6a.8.8 0 0 1-1-1z" fill="var(--accent-warning)"/>` +
      `<path d="M4.55 18.85l.85.85-1.45.42z" fill="var(--ink)"/>`,
  ),

  /* ── Exams sub-groups ───────────────────────────────────────────────── */

  // National — waving flag
  national: svg(
    `<rect x="4" y="2.8" width="2.1" height="18.4" rx="1.05" fill="var(--accent-warning)"/>` +
      `<path d="M6.1 4c3-1.5 5.4 1.3 8.4 0 1.6-.7 3-.6 4.6.1.6.3.9.8.9 1.5v5.9c0 .7-.3 1-.9 1.3-1.6.7-3.1.6-4.7-.1-2.9-1.3-5.3 1.5-8.3 0z" fill="var(--accent-danger)"/>` +
      `<path d="M6.1 7.3c2.2-.9 4 .8 6.2.1v3c-2.2.7-4-1-6.2-.1z" fill="var(--accent-success)"/>`,
  ),

  // International — globe
  international: svg(
    `<circle cx="12" cy="12" r="9.3" fill="var(--accent-secondary)"/>` +
      `<path d="M5.6 9.6c1.5-.5 2.4.9 3.8.5 1.2-.3 1.1-1.8 2.4-1.9 1.3-.1 1.9 1.2 1.4 2.3-.5 1.1-2.1 1-2.8 1.9-.6.8.1 2.1-.8 2.6-1.3.7-3.1-1.3-3.8-2.8-.3-.7-.7-1.6-.2-2.6z" fill="var(--accent-success)"/>` +
      `<path d="M14.7 14.7c1.1-.5 2.4.2 2.6 1.4-1 .9-1.8 1.5-3.1 1.7 0-1 .4-2.5.5-3.1z" fill="var(--accent-success)"/>` +
      `<circle cx="9" cy="8.4" r="1.5" fill="#fff" opacity="0.55"/>`,
  ),

  // Competitions — trophy
  competitions: svg(
    `<path d="M7 4h10v4a5 5 0 0 1-10 0z" fill="var(--accent-primary)"/>` +
      `<path d="M7 5H4.4v1.6A3 3 0 0 0 7 9.5V7.2A1 1 0 0 1 7 7zm10 0v2c0 .07 0 .14-.01.2v2.3A3 3 0 0 0 19.6 6.6V5z" fill="var(--accent-primary)"/>` +
      `<rect x="10.7" y="12.4" width="2.6" height="3.1" fill="var(--accent-primary)"/>` +
      `<rect x="7.4" y="15" width="9.2" height="2.3" rx="1.15" fill="var(--accent-secondary)"/>` +
      `<rect x="8.4" y="17.7" width="7.2" height="2.5" rx="1.25" fill="var(--accent-secondary)"/>` +
      `<path d="M12 5.3l.85 1.75 1.9.25-1.4 1.3.35 1.9L12 9.4l-1.7.95.35-1.9-1.4-1.3 1.9-.25z" fill="#fff"/>`,
  ),

  /* ── Blogs sub-groups ───────────────────────────────────────────────── */

  // Science — lab flask with bubbling liquid
  science: svg(
    `<path d="M9.5 3h5a1 1 0 0 1 0 2H14v4.3l4.4 7.3A2.2 2.2 0 0 1 16.5 20h-9A2.2 2.2 0 0 1 5.6 16.6L10 9.3V5h-.5a1 1 0 0 1 0-2z" fill="var(--accent-secondary)"/>` +
      `<path d="M8.2 14h7.6l1.9 3.2A1.2 1.2 0 0 1 16.5 19h-9a1.2 1.2 0 0 1-1-1.8z" fill="var(--accent-success)"/>` +
      `<circle cx="10.8" cy="16.4" r="1" fill="#fff" opacity="0.85"/>` +
      `<circle cx="13.4" cy="17.5" r="0.7" fill="#fff" opacity="0.85"/>`,
  ),

  // Math — calculator
  math: svg(
    `<rect x="5" y="2.5" width="14" height="19" rx="2.6" fill="var(--accent-secondary)"/>` +
      `<rect x="7" y="4.6" width="10" height="3.8" rx="1" fill="#fff"/>` +
      `<rect x="8" y="5.6" width="4.4" height="1.7" rx="0.85" fill="var(--accent-secondary)"/>` +
      `<circle cx="8.6" cy="12" r="1.35" fill="var(--accent-primary)"/>` +
      `<circle cx="12" cy="12" r="1.35" fill="#fff"/>` +
      `<circle cx="15.4" cy="12" r="1.35" fill="var(--accent-danger)"/>` +
      `<circle cx="8.6" cy="16" r="1.35" fill="#fff"/>` +
      `<circle cx="12" cy="16" r="1.35" fill="var(--accent-primary)"/>` +
      `<rect x="14.05" y="14.65" width="2.7" height="5" rx="1.35" fill="var(--accent-warning)"/>`,
  ),

  /* ── Activities sub-groups ──────────────────────────────────────────── */

  // Games — game controller
  games: svg(
    `<path d="M7.5 7.5h9a4.7 4.7 0 0 1 4.6 3.8l.7 3.7A2.5 2.5 0 0 1 17 16.6L15.8 15H8.2L7 16.6A2.5 2.5 0 0 1 2.2 15l.7-3.7A4.7 4.7 0 0 1 7.5 7.5z" fill="var(--accent-secondary)"/>` +
      `<rect x="4.9" y="10.7" width="1.6" height="4" rx="0.8" fill="#fff"/>` +
      `<rect x="3.7" y="11.9" width="4" height="1.6" rx="0.8" fill="#fff"/>` +
      `<circle cx="16.2" cy="11.6" r="1.2" fill="var(--accent-danger)"/>` +
      `<circle cx="18.5" cy="13" r="1.2" fill="var(--accent-primary)"/>` +
      `<circle cx="14.4" cy="13" r="1.2" fill="#fff"/>`,
  ),

  // Math activities — colourful shapes
  shapes: svg(
    `<rect x="3" y="3.4" width="8" height="8" rx="1.8" fill="var(--accent-primary)"/>` +
      `<circle cx="17" cy="7.4" r="4" fill="var(--accent-secondary)"/>` +
      `<path d="M7.5 12.5l4.5 8h-9z" fill="var(--accent-danger)"/>` +
      `<rect x="13.4" y="13" width="7.6" height="7.6" rx="1.8" fill="var(--accent-success)"/>`,
  ),

  // Learning tools — lightbulb (smart helpers)
  tools: svg(
    `<path d="M12 2.4a6.6 6.6 0 0 1 3.9 11.9c-.5.4-.8.9-.8 1.5H8.9c0-.6-.3-1.1-.8-1.5A6.6 6.6 0 0 1 12 2.4z" fill="var(--accent-primary)"/>` +
      `<path d="M10.3 6.1A3.4 3.4 0 0 1 13 5.4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.85"/>` +
      `<rect x="9.1" y="16.4" width="5.8" height="1.9" rx="0.95" fill="var(--accent-warning)"/>` +
      `<path d="M9.9 18.7h4.2v.5a1.5 1.5 0 0 1-1.5 1.5h-1.2a1.5 1.5 0 0 1-1.5-1.5z" fill="var(--accent-warning)"/>`,
  ),

  /* ── Profile menu ───────────────────────────────────────────────────── */

  // Dashboard — little house
  home: svg(
    `<rect x="5" y="10" width="14" height="10.6" rx="2.2" fill="var(--accent-warning)"/>` +
      `<path d="M12 3.1 2.8 11.2h18.4z" fill="var(--accent-danger)"/>` +
      `<rect x="10.2" y="13.6" width="3.6" height="7" rx="1.2" fill="var(--accent-secondary)"/>` +
      `<rect x="6.6" y="12.7" width="3" height="3" rx="0.8" fill="#fff"/>`,
  ),

  // Subscription — star
  star: svg(
    `<path d="M12 2.6l2.6 5.35 5.9.85-4.27 4.16 1.01 5.88L12 16.13l-5.24 2.76 1.01-5.88L3.5 8.8l5.9-.85z" fill="var(--accent-primary)"/>` +
      `<circle cx="12" cy="10.4" r="1.9" fill="#fff" opacity="0.85"/>`,
  ),

  // Sign in — arrow into a door
  signin: svg(
    `<rect x="11" y="3" width="9" height="18" rx="2.6" fill="var(--accent-secondary)"/>` +
      `<circle cx="14.4" cy="12" r="1.1" fill="#fff"/>` +
      `<path d="M3 12h7m0 0-3-3m3 3-3 3" fill="none" stroke="var(--accent-success)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),

  // Sign out — arrow leaving a door
  signout: svg(
    `<rect x="4" y="3" width="9" height="18" rx="2.6" fill="var(--accent-secondary)"/>` +
      `<circle cx="9.6" cy="12" r="1.1" fill="#fff"/>` +
      `<path d="M21 12h-7m0 0 3-3m-3 3 3 3" fill="none" stroke="var(--accent-danger)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),
};

/** Resolve an icon by key, returning the raw SVG markup ("" if unknown). */
export function navIcon(name) {
  return NAV_ICONS[name] || "";
}

/* =========================================================================
   ORGANIC BLOBS  (shared with the editorial "paint" world)
   -------------------------------------------------------------------------
   A seeded amoeba generator — the same idea used by the yearbook paint print
   in home/js/flipbook.js — so the nav's blob icon tiles and paint background
   feel hand-made, with every blob lumped a little differently.
========================================================================= */
const rnd = (s) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Smooth closed "amoeba" path around (cx,cy) with radius r; lumps vary by seed. */
function amoebaPath(cx, cy, r, seed, n = 8) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.72 + 0.34 * rnd(seed * 7.3 + i));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const f = (v) => v.toFixed(1);
  const start = mid(pts[n - 1], pts[0]);
  let d = `M ${f(start[0])} ${f(start[1])} `;
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const m = mid(cur, pts[(i + 1) % n]);
    d += `Q ${f(cur[0])} ${f(cur[1])} ${f(m[0])} ${f(m[1])} `;
  }
  return d + "Z";
}

/**
 * Blob tile that sits BEHIND a glyph (fill: currentColor → the section accent).
 * 100×100 viewBox; `seed` morphs the silhouette so adjacent tiles differ.
 */
export function iconBlob(seed = 1) {
  return `<svg class="nav-icon__blob" viewBox="0 0 100 100" aria-hidden="true"><path d="${amoebaPath(
    50,
    50,
    40,
    seed,
    8,
  )}" fill="currentColor"/></svg>`;
}

/**
 * Decorative "paint print" layer for a mega panel — a few big amoebic blobs
 * plus scattered drops, all in `currentColor` so nav.css can tint the whole
 * thing with the section accent at a low opacity. Seeded per section.
 */
export function paintLayer(seed = 1) {
  let drops = "";
  for (let i = 0; i < 7; i++) {
    const dx = 40 + rnd(seed * 3.1 + i) * 920;
    const dy = 20 + rnd(seed * 5.7 + i * 2) * 320;
    const dr = 4 + rnd(seed + i * 1.7) * 9;
    drops += `<circle cx="${dx.toFixed(0)}" cy="${dy.toFixed(0)}" r="${dr.toFixed(1)}" fill="currentColor"/>`;
  }
  return `<div class="mega-panel__paint" aria-hidden="true"><svg viewBox="0 0 1000 360" preserveAspectRatio="xMidYMid slice">
    <path d="${amoebaPath(140, 150, 150, seed, 9)}" fill="currentColor"/>
    <path d="${amoebaPath(760, 250, 175, seed + 3, 10)}" fill="currentColor"/>
    <path d="${amoebaPath(900, 80, 96, seed + 7, 8)}" fill="currentColor"/>
    ${drops}
  </svg></div>`;
}

/**
 * One big organic "paint" blob used as the background of the right-hand
 * preview stage (fill: currentColor → the section accent). Seeded per section.
 */
export function paintBlob(seed = 1) {
  return `<svg class="mega-image__blob" viewBox="0 0 100 100" aria-hidden="true"><path d="${amoebaPath(
    50,
    50,
    47,
    seed,
    9,
  )}" fill="currentColor"/></svg>`;
}

/* =========================================================================
   AVATAR + PROFILE GLYPHS
   (consolidated here so every nav/profile icon lives in one file)
========================================================================= */

// Solid person silhouette shown in the avatar when there's no photo.
export const SVG_PERSON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>`;

// Camera overlay for the "change photo" hover state.
export const SVG_CAMERA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;

// Theme-toggle glyphs. Single-stroke (currentColor) so they read on the
// control button in either theme. Sun = "switch to light"; moon = "switch to dark".
export const SVG_SUN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.6M12 19.4V22M4.2 4.2l1.85 1.85M17.95 17.95L19.8 19.8M2 12h2.6M19.4 12H22M4.2 19.8l1.85-1.85M17.95 6.05L19.8 4.2"/></svg>`;
export const SVG_MOON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.3A8.2 8.2 0 0 1 9.7 3.5 7.3 7.3 0 1 0 20.5 14.3z"/></svg>`;

/* =========================================================================
   PLAN / SUBSCRIPTION EMBLEMS
   Multicolour, in the same icon language; wrapped on the blob tile in
   nav-builder so the per-tier accent (--tile) drives the blob.
========================================================================= */

// FREE — a cheerful five-petal flower (coral petals, gold heart).
export const SVG_ROSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-label="Free">
  <circle cx="12" cy="6.4" r="3.2" fill="var(--accent-danger)"/>
  <circle cx="17.3" cy="10.3" r="3.2" fill="var(--accent-danger)"/>
  <circle cx="15.3" cy="16.5" r="3.2" fill="var(--accent-danger)"/>
  <circle cx="8.7" cy="16.5" r="3.2" fill="var(--accent-danger)"/>
  <circle cx="6.7" cy="10.3" r="3.2" fill="var(--accent-danger)"/>
  <circle cx="12" cy="11.6" r="3.3" fill="var(--accent-primary)"/>
</svg>`;

// PRO — a gold crown with three coloured jewels.
export const SVG_CROWN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-label="Pro">
  <path d="M3 8.2l3.6 3 5.4-5.8 5.4 5.8 3.6-3-1.7 10.2H4.7z" fill="var(--accent-primary)"/>
  <rect x="4.3" y="18.2" width="15.4" height="2.8" rx="1.2" fill="var(--accent-primary)"/>
  <circle cx="6.6" cy="8.2" r="1.4" fill="var(--accent-danger)"/>
  <circle cx="12" cy="5.4" r="1.7" fill="var(--accent-secondary)"/>
  <circle cx="17.4" cy="8.2" r="1.4" fill="var(--accent-success)"/>
</svg>`;

// PREMIUM — a blue shield crested with a gold star.
export const SVG_SHIELD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-label="Premium">
  <path d="M12 2.4l8 2.7v6.3c0 5-3.4 8.5-8 10.6-4.6-2.1-8-5.6-8-10.6V5.1z" fill="var(--accent-secondary)"/>
  <path d="M12 7l1.5 3.6 3.9.3-3 2.6.95 3.8L12 15.3l-3.35 2 .95-3.8-3-2.6 3.9-.3z" fill="var(--accent-primary)"/>
</svg>`;

export function planEmblem(isPremium, planName = "") {
  if (!isPremium) return SVG_ROSE;
  const n = (planName || "").toLowerCase();
  if (n.includes("monthly") || n.includes("premium")) return SVG_SHIELD;
  return SVG_CROWN;
}

export function planTier(isPremium, planName = "") {
  if (!isPremium) return "free";
  const n = (planName || "").toLowerCase();
  return n.includes("monthly") || n.includes("premium") ? "premium" : "pro";
}

/**
 * Wide multicolour "paint" splash for the hero background — a few organic
 * amoeba blobs in the accent palette, kept toward the edges so centred copy
 * stays clear. Opacity is set in CSS (.hero-paint).
 */
export function heroPaint() {
  const blobs = [
    [165, 150, 150, 4, "var(--accent-secondary)"],
    [850, 120, 175, 9, "var(--accent-primary)"],
    [840, 470, 160, 13, "var(--accent-success)"],
    [170, 480, 145, 21, "var(--accent-danger)"],
    [520, 70, 95, 31, "var(--accent-warning)"],
  ]
    .map(
      ([cx, cy, r, seed, fill]) =>
        `<path d="${amoebaPath(cx, cy, r, seed, 10)}" fill="${fill}"/>`,
    )
    .join("");
  return `<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${blobs}</svg>`;
}

export default NAV_ICONS;
