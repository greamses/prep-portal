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
   vehicle cleanly cut out of its background.

   IT IS ONE OUTLINE. The first attempt built the van out of separate pieces —
   a body here, a nose there, a lamp beyond it — and they did not meet: the
   front floated off the back and the thing read as a kit of parts. So the
   shell is a single path that runs rear, roof, windscreen rake, bonnet, nose,
   bumper and back along the bottom THROUGH the wheel arches, which are cut
   out of that same path rather than drawn over it. Every detail after it —
   the sill, the creases, the seams, the glass, the lamps, the livery — is
   clipped to that outline, so nothing can escape the body again.

   THE PROPORTIONS ARE A REAL VAN'S, which is most of what makes a drawing of
   one look right: the overhang in front of the front wheel is about a fifth
   of the wheelbase and the one behind the rear wheel about a third, the wheel
   is a sixth of the wheelbase across, and the windscreen falls at close to
   fifty degrees. Drawn by eye the nose came out half a van long.

   The wheels are the only things outside the clip: they sit in the arches and
   show below the sill, which is what tells you it is standing on a road.
   ------------------------------------------------------------------------*/

const SHELL = "M32 132V28a10 10 0 0 1 10-10h250l44 50h14a20 20 0 0 1 14 16l6 22v26h-19"
  + "a23 23 0 0 0-46 0H135a23 23 0 0 0-46 0H32z";

const wheel = (cx) => `
  <g class="ts-van__wheel">
    <circle cx="${cx}" cy="132" r="20" fill="url(#tsv-tyre)"/>
    <circle cx="${cx}" cy="132" r="10.4" fill="url(#tsv-rim)"/>
    <g fill="#c6ccd3">
      <rect x="${cx - 1.3}" y="123" width="2.6" height="18" rx="1.3"/>
      <rect x="${cx - 1.3}" y="123" width="2.6" height="18" rx="1.3" transform="rotate(60 ${cx} 132)"/>
      <rect x="${cx - 1.3}" y="123" width="2.6" height="18" rx="1.3" transform="rotate(120 ${cx} 132)"/>
    </g>
    <circle cx="${cx}" cy="132" r="3" fill="#8d949c"/>
  </g>`;

export const VAN = `
<svg viewBox="0 0 400 168" class="ts-van" role="img" aria-label="A delivery van">
  <defs>
    <linearGradient id="tsv-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.3" stop-color="#f1f4f7"/>
      <stop offset="0.5" stop-color="#e2e7ec"/><stop offset="0.74" stop-color="#eef1f5"/>
      <stop offset="1" stop-color="#c8ced6"/>
    </linearGradient>
    <linearGradient id="tsv-glass" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0" stop-color="#e2eef8"/><stop offset="0.5" stop-color="#a9c7dd"/>
      <stop offset="1" stop-color="#7e9eb9"/>
    </linearGradient>
    <linearGradient id="tsv-tyre" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#43444a"/><stop offset="1" stop-color="#151619"/>
    </linearGradient>
    <linearGradient id="tsv-rim" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#f4f6f8"/><stop offset="1" stop-color="#9aa1a9"/>
    </linearGradient>
    <linearGradient id="tsv-lamp" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c3cdd6"/>
    </linearGradient>
    <radialGradient id="tsv-shade" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#2a2723" stop-opacity="0.32"/>
      <stop offset="0.62" stop-color="#2a2723" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#2a2723" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="tsv-in"><path d="${SHELL}"/></clipPath>
  </defs>

  <ellipse cx="200" cy="154" rx="172" ry="10" fill="url(#tsv-shade)"/>

  <path d="${SHELL}" fill="url(#tsv-body)"/>

  <g clip-path="url(#tsv-in)">
    <!-- the sill, and the crease along the flank: two tones are what make a
         flat shape read as a panel rather than a card -->
    <rect x="24" y="112" width="360" height="26" fill="#b7bec8" opacity="0.5"/>
    <rect x="26" y="18" width="262" height="5" fill="#ffffff" opacity="0.6"/>
    <path d="M38 76h300" stroke="#ffffff" stroke-width="2.6" opacity="0.55" fill="none"/>
    <path d="M38 80h300" stroke="#99a1ab" stroke-width="1.3" opacity="0.4" fill="none"/>

    <!-- rear doors, the side load door, the cab door. They stop at the sill:
         run to the floor and they cross the open wheel arches. -->
    <path d="M44 22v90M150 22v90M158 22v90M236 22v90"
          stroke="#b4bbc5" stroke-width="1.5" fill="none" opacity="0.85"/>
    <rect x="140" y="68" width="7" height="3.4" rx="1.7" fill="#8f97a1"/>
    <rect x="240" y="72" width="15" height="4" rx="2" fill="#8f97a1"/>

    <!-- the cab window, and the sliver of windscreen you see from the side -->
    <path d="M240 28h48l13 34h-61z" fill="url(#tsv-glass)"/>
    <path d="M240 28h20l-5 34h-15z" fill="#ffffff" opacity="0.22"/>
    <path d="M298 26l30 36h-13l-23-32z" fill="url(#tsv-glass)"/>

    <!-- the bumper, the lamps and the plate: all inside the shell now -->
    <rect x="322" y="112" width="62" height="26" fill="#aeb5bf" opacity="0.8"/>
    <path d="M334 82h18a10 10 0 0 1 9 8l1 6h-28z" fill="url(#tsv-lamp)"/>
    <rect x="338" y="100" width="20" height="4.5" rx="2.2" fill="#e8a33c"/>
    <rect x="36" y="88" width="10" height="17" rx="2" fill="#c0453f" opacity="0.92"/>
    <rect x="332" y="116" width="30" height="10" rx="1.5" fill="#f3f4f6"/>

    <!-- the livery, flat on the flank the way a wrap sits -->
    <text x="100" y="62" text-anchor="middle" font-family="Unbounded, sans-serif"
          font-size="25" font-weight="700" fill="#2f6fa8" opacity="0.92">PREP</text>
    <text x="100" y="76" text-anchor="middle" font-family="JetBrains Mono, monospace"
          font-size="8" letter-spacing="2.4" fill="#717c88">DELIVERIES</text>
  </g>

  <!-- the arch lips, drawn on the cut edge -->
  <path d="M89 132a23 23 0 0 1 46 0M305 132a23 23 0 0 1 46 0"
        fill="none" stroke="#b2b9c3" stroke-width="2.2"/>

  <!-- the wing mirror reaches out past the body, so it sits outside the clip -->
  <path d="M300 34h3v12h-3z" fill="#9aa1a9"/>
  <path d="M303 32l11-1.6v10l-11-1.6z" fill="#4a4f57"/>

  ${wheel(112)}
  ${wheel(328)}
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
