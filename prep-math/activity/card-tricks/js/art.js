/* ============================================================================
   CARD TRICKS — the cards themselves
   ----------------------------------------------------------------------------
   A real pack, drawn: white stock with rounded corners, an index in two
   opposite corners, the pips where a printer puts them (the lower ones upside
   down, so the card reads the same from either end), two-headed court cards
   and a lattice back.

   These are DRAWINGS, so they keep their own inks — a seven of hearts is red
   on white in dark mode too, the way a sticky note stays pastel.

   Pure strings: no document, so the home page's showcase can import a card
   without importing the table.
   ========================================================================== */

import { rankOf, suitOf, isRed, nameOf } from "./deck.js";

const W = 250;
const H = 350;

const RED = "#c8102e";
const BLACK = "#16161a";
const STOCK = "#fffdf7";
const GOLD = "#e9b93a";
const BLUE = "#27509b";
const SKIN = "#f3d3ae";

/* Each suit in a box one unit wide, centred on the origin. */
const SUIT_PATH = {
  H: "M0 .44C-.52 .06-.5-.42-.25-.42-.1-.42 0-.31 0-.19 0-.31.1-.42.25-.42.5-.42.52.06 0 .44Z",
  D: "M0-.5Q.15-.21.38 0 .15.21 0 .5-.15.21-.38 0-.15-.21 0-.5Z",
  S: "M0-.48C.52-.06.5.3.25.3.13.3.05.23.03.15.03.3.1.42.19.47H-.19C-.1.42-.03.3-.03.15-.05.23-.13.3-.25.3-.5.3-.52-.06 0-.48Z",
  C: "M0-.46A.2.2 0 0 1 .13-.1 .2.2 0 1 1 .04.16C.04.3.1.42.19.47H-.19C-.1.42-.04.3-.04.16A.2.2 0 1 1-.13-.1 .2.2 0 0 1 0-.46Z",
};

const inkOf = (id) => (isRed(id) ? RED : BLACK);

/** One pip: centre, size, and whether it stands on its head. */
const pip = (suit, x, y, size, ink, flip = false) =>
  `<path d="${SUIT_PATH[suit]}" fill="${ink}" transform="translate(${x} ${y})${flip ? " rotate(180)" : ""} scale(${size})"/>`;

/* Where the pips go: [column 0–2, how far down 0–1]. Anything past half way
   is printed upside down. */
const T = 1 / 3;
const SIDES = (ys) => ys.flatMap((y) => [[0, y], [2, y]]);
const LAYOUT = {
  A: [[1, 0.5]],
  2: [[1, 0], [1, 1]],
  3: [[1, 0], [1, 0.5], [1, 1]],
  4: SIDES([0, 1]),
  5: [...SIDES([0, 1]), [1, 0.5]],
  6: SIDES([0, 0.5, 1]),
  7: [...SIDES([0, 0.5, 1]), [1, 0.25]],
  8: [...SIDES([0, 0.5, 1]), [1, 0.25], [1, 0.75]],
  9: [...SIDES([0, T, 2 * T, 1]), [1, 0.5]],
  10: [...SIDES([0, T, 2 * T, 1]), [1, T / 2], [1, 1 - T / 2]],
};

const COL_X = [82, 125, 168];
const TOP_Y = 72;
const BOT_Y = 278;

function pips(id) {
  const rank = rankOf(id);
  const suit = suitOf(id);
  const ink = inkOf(id);
  if (rank === "A") return pip(suit, W / 2, H / 2, suit === "S" ? 128 : 92, ink);
  return LAYOUT[rank]
    .map(([c, t]) => pip(suit, COL_X[c], TOP_Y + (BOT_Y - TOP_Y) * t, 55, ink, t > 0.5))
    .join("");
}

/** The index: the rank over a small pip, top left — and again, turned, bottom right. */
function corner(id) {
  const rank = rankOf(id);
  const ink = inkOf(id);
  const one =
    `<text x="27" y="47" text-anchor="middle" font-family="'Times New Roman', Times, 'Liberation Serif', serif" ` +
    `font-size="${rank === "10" ? 37 : 44}" font-weight="700" ${rank === "10" ? 'letter-spacing="-3" ' : ""}fill="${ink}">${rank}</text>` +
    pip(suitOf(id), 27, 73, 27, ink);
  return one + `<g transform="rotate(180 ${W / 2} ${H / 2})">${one}</g>`;
}

/* ── the court ────────────────────────────────────────────────────────────
   One half-figure, drawn from the waist up inside the frame and printed twice,
   the second time turned about the middle of the card — which is all a court
   card has ever been. The three differ where you would look to tell them
   apart: the king is bearded under a tall crown, the queen wears a low crown
   and a flower, the jack a flat cap with a feather. */

function halfFigure(id) {
  const rank = rankOf(id);
  const suit = suitOf(id);
  const ink = inkOf(id);
  const coat = isRed(id) ? RED : BLUE;
  const trim = isRed(id) ? BLUE : RED;
  const line = `stroke="${BLACK}" stroke-width="2" stroke-linejoin="round"`;
  let s = "";

  /* the robe, to the waist, with a sash across it */
  s += `<path d="M56 175V150C56 128 78 120 104 114L125 132 146 114C172 120 194 128 194 150V175Z" fill="${coat}" ${line}/>`;
  s += `<path d="M104 114 125 132 146 114 138 175H112Z" fill="${GOLD}" ${line}/>`;
  s += `<path d="M56 150 96 175H70L56 166Z" fill="${trim}" ${line}/><path d="M194 150 154 175H180L194 166Z" fill="${trim}" ${line}/>`;
  for (const y of [142, 156, 170]) s += `<path d="M125 ${y - 5}l4 5-4 5-4-5z" fill="${trim}"/>`;
  /* collar */
  s += `<path d="M100 116Q125 128 150 116L146 106Q125 116 104 106Z" fill="${STOCK}" ${line}/>`;

  /* hair, behind the face */
  if (rank === "Q") {
    s += `<path d="M97 82C90 96 90 114 98 124L108 118V84Z" fill="${GOLD}" ${line}/><path d="M153 82C160 96 160 114 152 124L142 118V84Z" fill="${GOLD}" ${line}/>`;
  } else {
    s += `<path d="M99 80C94 92 95 104 100 110L108 104V82Z" fill="${rank === "K" ? "#8a8f98" : GOLD}" ${line}/>`;
    s += `<path d="M151 80C156 92 155 104 150 110L142 104V82Z" fill="${rank === "K" ? "#8a8f98" : GOLD}" ${line}/>`;
  }

  /* the face */
  s += `<path d="M104 78C104 66 146 66 146 78V98C146 112 136 120 125 120 114 120 104 112 104 98Z" fill="${SKIN}" ${line}/>`;
  s += `<path d="M110 88q5-4 10 0M130 88q5-4 10 0" fill="none" stroke="${BLACK}" stroke-width="2" stroke-linecap="round"/>`;
  s += `<circle cx="115" cy="92" r="2" fill="${BLACK}"/><circle cx="135" cy="92" r="2" fill="${BLACK}"/>`;
  s += `<path d="M125 92v9l-4 2" fill="none" stroke="${BLACK}" stroke-width="1.6" stroke-linecap="round"/>`;
  s += `<path d="M119 108q6 4 12 0" fill="none" stroke="${RED}" stroke-width="2.2" stroke-linecap="round"/>`;

  if (rank === "K") {
    /* beard and moustache */
    s += `<path d="M104 98C104 118 114 130 125 130 136 130 146 118 146 98 140 106 132 104 125 110 118 104 110 106 104 98Z" fill="#8a8f98" ${line}/>`;
    s += `<path d="M119 108q6 4 12 0" fill="none" stroke="${RED}" stroke-width="2.2" stroke-linecap="round"/>`;
    /* a tall crown */
    s += `<path d="M100 76 96 46 110 60 125 42 140 60 154 46 150 76Z" fill="${GOLD}" ${line}/>`;
    s += `<rect x="100" y="70" width="50" height="8" fill="${trim}" ${line}/>`;
    for (const x of [96, 125, 154]) s += `<circle cx="${x}" cy="${x === 125 ? 42 : 46}" r="4" fill="${coat}" ${line}/>`;
  } else if (rank === "Q") {
    /* a low crown, and a flower held at the shoulder */
    s += `<path d="M102 76 100 56 112 66 125 54 138 66 150 56 148 76Z" fill="${GOLD}" ${line}/>`;
    s += `<rect x="102" y="71" width="46" height="7" fill="${coat}" ${line}/>`;
    for (const x of [100, 125, 150]) s += `<circle cx="${x}" cy="${x === 125 ? 54 : 56}" r="3.4" fill="${STOCK}" ${line}/>`;
    s += `<path d="M174 150V124" stroke="#2f7d4f" stroke-width="3" stroke-linecap="round"/>`;
    for (const [dx, dy] of [[0, -8], [8, 0], [0, 8], [-8, 0]]) s += `<circle cx="${174 + dx}" cy="${118 + dy}" r="6" fill="${trim}" ${line}/>`;
    s += `<circle cx="174" cy="118" r="4.5" fill="${GOLD}" ${line}/>`;
  } else {
    /* a flat cap with a feather */
    s += `<path d="M98 78C96 62 110 56 126 56 144 56 156 62 152 78Z" fill="${coat}" ${line}/>`;
    s += `<rect x="98" y="72" width="54" height="7" fill="${GOLD}" ${line}/>`;
    s += `<path d="M148 62C158 44 172 40 180 44 172 46 166 56 156 68Z" fill="${trim}" ${line}/>`;
    /* and a staff */
    s += `<path d="M76 175V120" stroke="${BLACK}" stroke-width="6" stroke-linecap="round"/><path d="M76 175V120" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`;
    s += `<path d="M76 104l7 12h-14z" fill="${trim}" ${line}/>`;
  }

  /* the suit, in the corner of the frame */
  s += pip(suit, 72, 68, 30, ink);
  return s;
}

function court(id) {
  const half = halfFigure(id);
  const clip = `ct-half-${id}`;
  return (
    `<defs><clipPath id="${clip}"><rect x="50" y="44" width="150" height="131"/></clipPath></defs>` +
    `<rect x="50" y="44" width="150" height="262" fill="${STOCK}"/>` +
    `<g clip-path="url(#${clip})">${half}</g>` +
    `<g transform="rotate(180 ${W / 2} ${H / 2})"><g clip-path="url(#${clip})">${half}</g></g>` +
    `<path d="M50 175H200" stroke="${BLACK}" stroke-width="2"/>` +
    `<rect x="50" y="44" width="150" height="262" fill="none" stroke="${isRed(id) ? RED : BLUE}" stroke-width="2.5"/>`
  );
}

/* The stock: not flat white. Light falls from the top left, so the card is a
   shade warmer toward its far corner, with a hairline of shadow along the
   bottom edge where it stands off the table. */
const sheet = (inner, label) =>
  `<svg class="ct-art" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ` +
  `${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>` +
  `<defs><linearGradient id="ct-stock" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="${STOCK}"/><stop offset="1" stop-color="#efe9dc"/></linearGradient></defs>` +
  `<rect x="1" y="2.5" width="${W - 2}" height="${H - 3}" rx="13" fill="#8f897c"/>` +
  `<rect x="1" y="1" width="${W - 2}" height="${H - 3.2}" rx="13" fill="url(#ct-stock)" stroke="#c9c3b6" stroke-width="1.2"/>` +
  `${inner}</svg>`;

/** The face of a card. */
export function faceSvg(id, { label = true } = {}) {
  const body = "JQK".includes(rankOf(id)) ? court(id) : pips(id);
  return sheet(body + corner(id), label ? nameOf(id) : "");
}

/**
 * The back. Red for the pack on the table; blue for the computer's own card,
 * which comes from another pack — you can see at a glance it was never in
 * yours.
 */
export function backSvg(tone = "red") {
  const ink = tone === "blue" ? BLUE : RED;
  const pat = `ct-lattice-${tone}`;
  return sheet(
    `<defs><pattern id="${pat}" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
      `<rect width="18" height="18" fill="${ink}"/>` +
      `<path d="M0 0H18M0 0V18" stroke="${STOCK}" stroke-width="2.4" opacity=".85"/>` +
      `<circle cx="9" cy="9" r="2.2" fill="${STOCK}" opacity=".85"/></pattern></defs>` +
      `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="7" fill="url(#${pat})"/>` +
      `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="7" fill="none" stroke="${ink}" stroke-width="5"/>` +
      `<rect x="23" y="23" width="${W - 46}" height="${H - 46}" rx="4" fill="none" stroke="${STOCK}" stroke-width="2.5"/>` +
      `<ellipse cx="${W / 2}" cy="${H / 2}" rx="46" ry="62" fill="${STOCK}" stroke="${ink}" stroke-width="5"/>` +
      `<path d="${SUIT_PATH.S}" fill="${ink}" transform="translate(${W / 2} ${H / 2 - 2}) scale(64)"/>`,
    "",
  );
}

/** A small fan of cards, for the home page and the page's own eyebrow. */
export function fanSvg(ids = ["KS", "7H", "AD"]) {
  const step = 26;
  const from = -((ids.length - 1) * step) / 2;
  const cards = ids
    .map((id, i) => {
      const inner = faceSvg(id, { label: false }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
      return `<g transform="translate(${190 + (from + i * step) * 2.2} ${40 + Math.abs(from + i * step) * 0.5}) rotate(${from + i * step} 125 350)">${inner}</g>`;
    })
    .join("");
  return `<svg viewBox="0 0 630 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A fan of playing cards">${cards}</svg>`;
}
