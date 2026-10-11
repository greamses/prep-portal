/* ============================================================================
   The Prep Toy Shop — what is on the shelf, drawn
   ----------------------------------------------------------------------------
   Our own SVG, one per toy, in the site's paper palette. A shop photograph is
   the one thing a listing really needs and the one thing we will not borrow,
   so every toy here is drawn — bold enough to read at 20mm on a phone and at
   60mm on a laptop, and flat enough that a hundred of them cost nothing.

   The van is here too: it is a toy as much as the rest of them.
   ========================================================================== */

const INK = "#2a2723";

/* the same six papers the rest of the site is painted in */
export const PAPERS = ["#f4c95d", "#6fb7e8", "#7cc47c", "#f0a868", "#c9a3ee", "#7fd7c6"];
export const paper = (i) => PAPERS[((i % 6) + 6) % 6];

const S = (inner, vb = "0 0 64 64") =>
  `<svg viewBox="${vb}" class="ts-art" role="img" aria-hidden="true">${inner}</svg>`;
const st = (w = 2.2) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const TOYS = {
  teddy: (c) => S(
    `<circle cx="18" cy="16" r="7" fill="${c}" ${st()}/><circle cx="46" cy="16" r="7" fill="${c}" ${st()}/>`
    + `<circle cx="18" cy="16" r="3" fill="#e8b9a8"/><circle cx="46" cy="16" r="3" fill="#e8b9a8"/>`
    + `<circle cx="32" cy="24" r="14" fill="${c}" ${st()}/>`
    + `<ellipse cx="32" cy="29" rx="6.5" ry="5" fill="#f6e7d8" ${st(1.6)}/>`
    + `<circle cx="27" cy="21" r="1.9" fill="${INK}"/><circle cx="37" cy="21" r="1.9" fill="${INK}"/>`
    + `<path d="M32 27v2.6M29.4 31.4a3.4 3.4 0 0 0 5.2 0" fill="none" ${st(1.5)}/>`
    + `<path d="M20 38h24a8 8 0 0 1 8 8v8a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6v-8a8 8 0 0 1 8-8z" fill="${c}" ${st()}/>`
    + `<ellipse cx="32" cy="48" rx="7" ry="8" fill="#f6e7d8" ${st(1.6)}/>`),

  robot: (c) => S(
    `<path d="M32 4v6" ${st(2)}/><circle cx="32" cy="3.4" r="3" fill="#c0453f" ${st(1.6)}/>`
    + `<rect x="19" y="10" width="26" height="20" rx="2" fill="${c}" ${st()}/>`
    + `<rect x="24" y="16" width="6" height="6" fill="#fffdf8" ${st(1.6)}/><rect x="34" y="16" width="6" height="6" fill="#fffdf8" ${st(1.6)}/>`
    + `<path d="M25 26h14" ${st(1.8)}/>`
    + `<rect x="16" y="32" width="32" height="20" rx="2" fill="${c}" ${st()}/>`
    + `<circle cx="32" cy="42" r="5" fill="#fff3a8" ${st(1.6)}/>`
    + `<rect x="7" y="34" width="8" height="5" rx="1.5" fill="${c}" ${st(1.8)}/><rect x="49" y="34" width="8" height="5" rx="1.5" fill="${c}" ${st(1.8)}/>`
    + `<rect x="20" y="53" width="8" height="8" rx="1.5" fill="${c}" ${st(1.8)}/><rect x="36" y="53" width="8" height="8" rx="1.5" fill="${c}" ${st(1.8)}/>`),

  kite: (c) => S(
    `<path d="M32 4 52 26 32 56 12 26z" fill="${c}" ${st()}/>`
    + `<path d="M32 4v52M12 26h40" ${st(1.4)} opacity="0.75"/>`
    + `<path d="M32 56c6 3 2 6 8 9" fill="none" ${st(1.8)}/>`
    + `<path d="M36 61l5-2-1 4z" fill="#c0453f" ${st(1.2)}/><path d="M41 66l5-2-1 4z" fill="#6fb7e8" ${st(1.2)}/>`),

  yoyo: (c) => S(
    `<path d="M32 4v18" ${st(2)}/>`
    + `<circle cx="32" cy="40" r="20" fill="${c}" ${st()}/>`
    + `<circle cx="32" cy="40" r="12" fill="#fffdf8" ${st(1.8)}/>`
    + `<circle cx="32" cy="40" r="4" fill="${INK}"/>`
    + `<path d="M26 4h12" ${st(2)}/>`),

  drum: (c) => S(
    `<ellipse cx="32" cy="22" rx="22" ry="8" fill="#f6e7d8" ${st()}/>`
    + `<path d="M10 22v20a22 8 0 0 0 44 0V22" fill="${c}" ${st()}/>`
    + `<path d="M12 26l12 16M52 26L40 42M24 26l-12 16M40 26l12 16" fill="none" stroke="#fffdf8" stroke-width="2"/>`
    + `<ellipse cx="32" cy="22" rx="22" ry="8" fill="none" ${st()}/>`
    + `<path d="M46 10 56 2M50 8l4 4" ${st(1.8)}/><circle cx="57" cy="1.6" r="3" fill="${INK}"/>`),

  blocks: (c) => S(
    `<rect x="6" y="34" width="20" height="20" rx="2" fill="${c}" ${st()}/>`
    + `<rect x="28" y="34" width="20" height="20" rx="2" fill="#6fb7e8" ${st()}/>`
    + `<rect x="17" y="12" width="20" height="20" rx="2" fill="#7cc47c" ${st()}/>`
    + `<text x="16" y="48" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="800" fill="${INK}">A</text>`
    + `<text x="38" y="48" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="800" fill="${INK}">B</text>`
    + `<text x="27" y="26" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="800" fill="${INK}">C</text>`),

  car: (c) => S(
    `<path d="M6 42h52v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" fill="${c}" ${st()}/>`
    + `<path d="M12 42l7-14a4 4 0 0 1 3.6-2.4h18.8A4 4 0 0 1 45 28l7 14z" fill="${c}" ${st()}/>`
    + `<path d="M22 40l4-10h12l4 10z" fill="#bfe3ff" ${st(1.6)}/>`
    + `<circle cx="18" cy="52" r="7" fill="${INK}"/><circle cx="18" cy="52" r="2.8" fill="#f4c95d"/>`
    + `<circle cx="46" cy="52" r="7" fill="${INK}"/><circle cx="46" cy="52" r="2.8" fill="#f4c95d"/>`),

  doll: (c) => S(
    `<circle cx="32" cy="16" r="11" fill="#f6e7d8" ${st()}/>`
    + `<path d="M21 14a11 11 0 0 1 22 0c0-7-4.5-10-11-10s-11 3-11 10z" fill="${c}" ${st(1.8)}/>`
    + `<path d="M19 16c-3 4-3 9 0 12M45 16c3 4 3 9 0 12" fill="none" ${st(1.8)} stroke="${c}"/>`
    + `<circle cx="28" cy="17" r="1.8" fill="${INK}"/><circle cx="36" cy="17" r="1.8" fill="${INK}"/>`
    + `<path d="M29 22a4 4 0 0 0 6 0" fill="none" ${st(1.5)}/>`
    + `<path d="M32 27 16 56h32z" fill="${c}" ${st()}/>`
    + `<path d="M22 44h20" ${st(1.4)} opacity="0.7"/>`),

  puzzle: (c) => S(
    `<path d="M6 6h22v8a5 5 0 0 1 8 0V6h22v22h-8a5 5 0 0 0 0 8h8v22H36v-8a5 5 0 0 0-8 0v8H6V36h8a5 5 0 0 0 0-8H6z" fill="${c}" ${st()}/>`
    + `<path d="M28 6v8a5 5 0 0 0 8 0V6M58 28h-8a5 5 0 0 0 0 8h8M36 58v-8a5 5 0 0 0-8 0v8M6 36h8a5 5 0 0 0 0-8H6" fill="none" ${st(1.4)} opacity="0.65"/>`),

  train: (c) => S(
    `<rect x="4" y="30" width="22" height="18" rx="2" fill="${c}" ${st()}/>`
    + `<path d="M26 22h16a4 4 0 0 1 4 4v22H26z" fill="#c0453f" ${st()}/>`
    + `<rect x="10" y="16" width="7" height="14" fill="${INK}"/>`
    + `<circle cx="13.5" cy="13" r="4.5" fill="#d9d1c1" ${st(1.4)}/>`
    + `<rect x="31" y="28" width="10" height="9" fill="#bfe3ff" ${st(1.6)}/>`
    + `<path d="M2 48h52" ${st(2)}/>`
    + `<circle cx="14" cy="54" r="6" fill="${INK}"/><circle cx="14" cy="54" r="2.4" fill="#f4c95d"/>`
    + `<circle cx="36" cy="54" r="6" fill="${INK}"/><circle cx="36" cy="54" r="2.4" fill="#f4c95d"/>`),
};

export const TOY_KEYS = Object.keys(TOYS);

/** One toy, in the paper of its place on the shelf. */
export const toySvg = (key, i = 0) => (TOYS[key] || TOYS.blocks)(paper(i));

/* ── the van ──────────────────────────────────────────────────────────────
   It drives on, it stops, and nothing gets out of it. That is the joke and
   the page says so out loud. */
export const VAN = S(
  `<rect x="4" y="20" width="56" height="30" rx="3" fill="#6fb7e8" ${st(2.6)}/>`
  + `<path d="M60 28h14l10 12v10H60z" fill="#f4c95d" ${st(2.6)}/>`
  + `<rect x="63" y="31" width="10" height="8" rx="1.5" fill="#bfe3ff" ${st(1.8)}/>`
  /* The sign has to be wider than the word. Four mono letters at font-size 9
     measure about 22 units; the panel was 20 wide, so PREP ran out of its own
     sign and the cab cut the P in half. */
  + `<rect x="10" y="27" width="30" height="15" fill="#fffdf8" ${st(1.8)}/>`
  + `<text x="25" y="34.6" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono, monospace"`
  + ` font-size="7.5" font-weight="800" fill="${INK}">PREP</text>`
  /* the back doors, so the parcel has somewhere to have come from */
  + `<path d="M4 22v26M9 35h-5" fill="none" ${st(1.8)}/>`
  + `<circle cx="22" cy="52" r="8" fill="${INK}"/><circle cx="22" cy="52" r="3.2" fill="#d9d1c1"/>`
  + `<circle cx="68" cy="52" r="8" fill="${INK}"/><circle cx="68" cy="52" r="3.2" fill="#d9d1c1"/>`,
  "0 0 90 60",
);

/** A parcel, for the van to not deliver. */
export const PARCEL = S(
  `<rect x="6" y="16" width="36" height="26" fill="#e0b183" ${st(2.2)}/>`
  + `<path d="M24 16v26M6 26h36" ${st(1.8)}/>`
  + `<rect x="4" y="10" width="40" height="7" fill="#d2a070" ${st(2.2)}/>`
  + `<path d="M24 10c-6-8-14-4-9 3M24 10c6-8 14-4 9 3" fill="none" ${st(1.8)}/>`,
  /* the same box as PARCEL_OPEN, so swapping one for the other does not
     change the size of the parcel on the road */
  "0 0 78 48",
);

/**
 * The same parcel with the lid off and NOTHING inside — the point of the whole
 * page. The inside is drawn dark: an open box with a flat tan floor just reads
 * as a shut one, and the emptiness is the thing the child is meant to see.
 */
export const PARCEL_OPEN = S(
  `<rect x="6" y="16" width="36" height="26" fill="#e0b183" ${st(2.2)}/>`
  + `<path d="M9 18h30l-5 9H14z" fill="#8a6240"/>`
  + `<path d="M14 25h20v2.4H14z" fill="#5d3f27" opacity="0.65"/>`
  + `<path d="M6 16h36" ${st(2.2)}/>`
  + `<g transform="translate(26 -2) rotate(18 24 13)">`
  + `<rect x="4" y="10" width="40" height="7" fill="#d2a070" ${st(2.2)}/>`
  + `<path d="M24 10c-6-8-14-4-9 3M24 10c6-8 14-4 9 3" fill="none" ${st(1.8)}/>`
  + `</g>`,
  "0 0 78 48",
);
