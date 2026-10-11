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

/* ── the delivery van ─────────────────────────────────────────────────────
   Drawn, not photographed: it has to move, and no generator will hand back a
   vehicle cleanly cut out of its background. So it is drawn the way a vehicle
   actually looks — a panel van in exact side profile with the proportions of
   a real one (long wheelbase, high roof, short nose), body panels that catch
   the light, cut wheel arches, alloy wheels that turn, glass with a sky in
   it, and a soft contact shadow. No ink outlines: real things do not have
   them, and the outline is what made the old van read as a toy.
   ------------------------------------------------------------------------*/

export const VAN = `
<svg viewBox="0 0 430 175" class="ts-van" role="img" aria-label="A delivery van">
  <defs>
    <linearGradient id="tsv-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.34" stop-color="#eef1f5"/>
      <stop offset="0.52" stop-color="#dfe4ea"/><stop offset="0.78" stop-color="#eaedf2"/>
      <stop offset="1" stop-color="#c6ccd5"/>
    </linearGradient>
    <linearGradient id="tsv-glass" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#dcebf7"/><stop offset="0.55" stop-color="#a8c6dd"/>
      <stop offset="1" stop-color="#7f9fba"/>
    </linearGradient>
    <linearGradient id="tsv-tyre" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3b3f"/><stop offset="1" stop-color="#17181b"/>
    </linearGradient>
    <linearGradient id="tsv-rim" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#f2f4f6"/><stop offset="1" stop-color="#9ea5ad"/>
    </linearGradient>
    <radialGradient id="tsv-shade" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#2a2723" stop-opacity="0.34"/>
      <stop offset="0.65" stop-color="#2a2723" stop-opacity="0.13"/>
      <stop offset="1" stop-color="#2a2723" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="tsv-lamp" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfd8e0"/>
    </linearGradient>
  </defs>

  <ellipse cx="212" cy="152" rx="196" ry="13" fill="url(#tsv-shade)"/>

  <path d="M26 140V40a9 9 0 0 1 9-9h232l10 2 26 31 38 5a26 26 0 0 1 22 20l3 17a9 9 0 0 1-9 10h-6
           a25 25 0 0 0-50 0H146a25 25 0 0 0-50 0H35a9 9 0 0 1-9-9z" fill="url(#tsv-body)"/>

  <path d="M26 118h340l2 22a9 9 0 0 1-9 10h-6a25 25 0 0 0-50 0H146a25 25 0 0 0-50 0H35a9 9 0 0 1-9-9z"
        fill="#aeb5bf" opacity="0.5"/>
  <path d="M30 86h300" stroke="#ffffff" stroke-width="2.4" opacity="0.6" fill="none"/>
  <path d="M30 90h300" stroke="#9aa2ac" stroke-width="1.4" opacity="0.45" fill="none"/>
  <rect x="26" y="31" width="344" height="5" fill="#ffffff" opacity="0.65"/>

  <path d="M38 36v82M150 36v82M158 36v82" stroke="#b3bac4" stroke-width="1.6" fill="none" opacity="0.8"/>
  <rect x="140" y="74" width="7" height="3.4" rx="1.7" fill="#8f97a1"/>

  <path d="M276 36l24 29 28 4-4-33z" fill="url(#tsv-glass)"/>
  <path d="M276 36l24 29 10 1.4-20-30.4z" fill="#ffffff" opacity="0.3"/>
  <path d="M232 38h36v30h-36z" fill="url(#tsv-glass)"/>
  <path d="M226 36v82" stroke="#b3bac4" stroke-width="1.6" fill="none"/>
  <rect x="236" y="78" width="16" height="4" rx="2" fill="#8f97a1"/>
  <path d="M268 44h-9a4 4 0 0 0-4 4v7h13z" fill="#4a4f57"/>

  <path d="M384 96h18a9 9 0 0 1 8 7l1 6h-27z" fill="url(#tsv-lamp)"/>
  <rect x="388" y="112" width="20" height="5" rx="2" fill="#e8a33c"/>
  <rect x="30" y="98" width="12" height="14" rx="2" fill="#c0453f" opacity="0.9"/>
  <rect x="330" y="124" width="34" height="11" rx="2" fill="#f2f3f5"/>
  <rect x="330" y="124" width="34" height="11" rx="2" fill="none" stroke="#b9bfc8" stroke-width="1"/>

  <text x="88" y="70" text-anchor="middle" font-family="Unbounded, sans-serif"
        font-size="25" font-weight="700" fill="#2f6fa8" opacity="0.92">PREP</text>
  <text x="88" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace"
        font-size="8.5" letter-spacing="2.6" fill="#6f7a86">DELIVERIES</text>

  <path d="M96 140a25 25 0 0 1 50 0" fill="none" stroke="#b7bec8" stroke-width="2.6"/>
  <path d="M296 140a25 25 0 0 1 50 0" fill="none" stroke="#b7bec8" stroke-width="2.6"/>

  <g class="ts-van__wheel">
    <circle cx="121" cy="140" r="25" fill="url(#tsv-tyre)"/>
    <circle cx="121" cy="140" r="13.5" fill="url(#tsv-rim)"/>
    <g fill="#c3c9d0">
      <rect x="119.4" y="128" width="3.2" height="24" rx="1.6"/>
      <rect x="119.4" y="128" width="3.2" height="24" rx="1.6" transform="rotate(60 121 140)"/>
      <rect x="119.4" y="128" width="3.2" height="24" rx="1.6" transform="rotate(120 121 140)"/>
    </g>
    <circle cx="121" cy="140" r="4" fill="#8d949c"/>
  </g>
  <g class="ts-van__wheel">
    <circle cx="321" cy="140" r="25" fill="url(#tsv-tyre)"/>
    <circle cx="321" cy="140" r="13.5" fill="url(#tsv-rim)"/>
    <g fill="#c3c9d0">
      <rect x="319.4" y="128" width="3.2" height="24" rx="1.6"/>
      <rect x="319.4" y="128" width="3.2" height="24" rx="1.6" transform="rotate(60 321 140)"/>
      <rect x="319.4" y="128" width="3.2" height="24" rx="1.6" transform="rotate(120 321 140)"/>
    </g>
    <circle cx="321" cy="140" r="4" fill="#8d949c"/>
  </g>
</svg>`;

/* ── the parcel ───────────────────────────────────────────────────────────
   A plain taped cardboard box seen from above one corner, three tones for its
   three faces. Not a gift box with a ribbon: a ribbon says birthday, and this
   is a delivery.
   ------------------------------------------------------------------------*/

export const PARCEL = `
<svg viewBox="0 0 140 124" class="ts-parcel" role="img" aria-label="A cardboard parcel">
  <defs>
    <radialGradient id="tsp-shade" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#2a2723" stop-opacity="0.3"/>
      <stop offset="1" stop-color="#2a2723" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="70" cy="112" rx="56" ry="9" fill="url(#tsp-shade)"/>
  <path d="M70 12l54 22-54 22-54-22z" fill="#d7b082"/>
  <path d="M16 34v44l54 22V56z" fill="#b98f61"/>
  <path d="M124 34v44l-54 22V56z" fill="#a37c52"/>
  <path d="M70 12l54 22-9 3.6-54-22z" fill="#e8d2ad" opacity="0.95"/>
  <path d="M70 56v44l-7-2.8V53.2z" fill="#e8d2ad" opacity="0.5"/>
  <path d="M16 34l54 22v8L16 42z" fill="#000" opacity="0.07"/>
</svg>`;
