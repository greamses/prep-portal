/* ============================================================================
   The Prep Toy Shop — the pictures
   ----------------------------------------------------------------------------
   THE TOYS ARE PHOTOGRAPHS. A shop listing lives on its photography, and a
   drawn toy — however carefully drawn — reads as a diagram of a toy, not as
   something you would spend money on. The ten in img/ were generated with the
   site's own image generator (scripts/pollinations.mjs, FLUX) as catalogue
   shots on one cream background, cropped square and saved at 640px.

   One thing worth knowing before regenerating any of them: the model is good
   at toys that are characters or vehicles (bears, dolls, robots, cars, trains,
   planes, boats, dinosaurs) and bad at abstract wooden ones — a kite came out
   a bird, a yo-yo a ball, a xylophone a fan of leaves. Four products were
   swapped for ones it can photograph rather than shipping four poor pictures.

   The van is still drawn: it is a moving part of the delivery scene, not
   something on sale.
   ========================================================================== */

const INK = "#2a2723";

/* the same six papers the rest of the site is painted in */
export const PAPERS = ["#f4c95d", "#6fb7e8", "#7cc47c", "#f0a868", "#c9a3ee", "#7fd7c6"];
export const paper = (i) => PAPERS[((i % 6) + 6) % 6];

const S = (inner, vb = "0 0 64 64") =>
  `<svg viewBox="${vb}" class="ts-art" role="img" aria-hidden="true">${inner}</svg>`;
const st = (w = 2.2) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** Where a toy's photograph lives. */
export const toyPhoto = (art) => `./img/${art}.jpg`;

/**
 * A toy's photograph.
 *
 *   alt   the toy's name, or "" for the little one beside a line of the bill,
 *         where the name is already written next to it
 */
export const toyImg = (art, alt = "", cls = "ts-shot__img") =>
  `<img class="${cls}" src="${toyPhoto(art)}" alt="${alt}" loading="lazy" decoding="async" width="640" height="640">`;

/* ── the van ──────────────────────────────────────────────────────────────
   It drives on, it stops, and nothing gets out of it. That is the joke and
   the point, so the van is drawn rather than photographed: it has to move.
   ------------------------------------------------------------------------*/

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
