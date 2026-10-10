/* ============================================================================
   CARD TRICKS — the cards themselves
   ----------------------------------------------------------------------------
   A premium pack, drawn: ivory stock with gilded edges, a hairline of gold
   foil framing every face, the pips where a printer puts them (the lower ones
   upside down, so the card reads the same from either end), two-headed court
   cards crowned in foil, an ace of spades with its maker's ring, and a back
   of gold filigree on crimson.

   These are DRAWINGS, so they keep their own inks — a seven of hearts is red
   on ivory in dark mode too, the way a sticky note stays pastel.

   Pure strings: no document, so the home page's showcase can import a card
   without importing the table.
   ========================================================================== */

import { rankOf, suitOf, isRed, nameOf } from "./deck.js";

const W = 250;
const H = 350;

const RED = "#b3122b";
const BLACK = "#15151a";
const STOCK = "#fbf6e9";
const FOIL = "url(#ct-gold)";      // gold leaf: a gradient, so it catches the light
const GILT = "#d8b24a";            // gold where a gradient cannot go (inside a pattern)
const HAIR = "#e0b040";
const BLUE = "#1f3f8f";
const SKIN = "#f1d0aa";

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

/* The things every card is printed with: the foil, the stock, the crimson
   and the navy of the backs. The same ids on every card, on purpose — they
   are the same inks. */
const DEFS =
  `<defs>` +
  `<linearGradient id="ct-gold" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0" stop-color="#8a6516"/><stop offset=".22" stop-color="#f3d977"/><stop offset=".42" stop-color="#c39a2c"/>` +
  `<stop offset=".6" stop-color="#fff0b0"/><stop offset=".8" stop-color="#b98c22"/><stop offset="1" stop-color="#7a5911"/></linearGradient>` +
  `<linearGradient id="ct-stock" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0" stop-color="#fffdf6"/><stop offset=".55" stop-color="${STOCK}"/><stop offset="1" stop-color="#ece2c8"/></linearGradient>` +
  `<radialGradient id="ct-red" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#b9152f"/><stop offset=".6" stop-color="#8c0c22"/><stop offset="1" stop-color="#560512"/></radialGradient>` +
  `<radialGradient id="ct-blue" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#2a55b8"/><stop offset=".6" stop-color="#17357f"/><stop offset="1" stop-color="#0a1840"/></radialGradient>` +
  `<pattern id="ct-lattice" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
  `<path d="M0 0H16M0 0V16" stroke="${GILT}" stroke-width="1" opacity=".85"/>` +
  `<circle cx="8" cy="8" r="1.5" fill="${GILT}" opacity=".9"/><circle cx="0" cy="0" r="1" fill="${GILT}"/></pattern>` +
  `</defs>`;

/* Where the pips go: [column 0–2, how far down 0–1]. Anything past half way
   is printed upside down. */
const T = 1 / 3;
const SIDES = (ys) => ys.flatMap((y) => [[0, y], [2, y]]);
const LAYOUT = {
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

const COL_X = [83, 125, 167];
const TOP_Y = 74;
const BOT_Y = 276;

/** An ace: one great pip in a ring of foil. The ace of spades wears the maker's ornament. */
function ace(id) {
  const suit = suitOf(id);
  const ink = inkOf(id);
  const cx = W / 2;
  const cy = H / 2;
  if (suit !== "S") {
    return `<circle cx="${cx}" cy="${cy}" r="62" fill="none" stroke="${FOIL}" stroke-width="1.6"/>` +
      `<circle cx="${cx}" cy="${cy}" r="67" fill="none" stroke="${FOIL}" stroke-width=".8"/>` + pip(suit, cx, cy, 88, ink);
  }
  let rays = "";
  for (let i = 0; i < 24; i++) {
    rays += `<path d="M${cx} ${cy - 84}l${i % 2 ? 2.2 : 3.4} ${i % 2 ? 9 : 14}h${i % 2 ? -4.4 : -6.8}z" fill="${FOIL}" transform="rotate(${i * 15} ${cx} ${cy})"/>`;
  }
  return rays +
    `<circle cx="${cx}" cy="${cy}" r="86" fill="none" stroke="${FOIL}" stroke-width="2.4"/>` +
    `<circle cx="${cx}" cy="${cy}" r="66" fill="none" stroke="${FOIL}" stroke-width="1.2"/>` +
    pip("S", cx, cy - 2, 122, ink) +
    `<path d="${SUIT_PATH.S}" fill="${FOIL}" transform="translate(${cx} ${cy - 6}) scale(40)"/>`;
}

function pips(id) {
  const rank = rankOf(id);
  if (rank === "A") return ace(id);
  const suit = suitOf(id);
  const ink = inkOf(id);
  return LAYOUT[rank]
    .map(([c, t]) => pip(suit, COL_X[c], TOP_Y + (BOT_Y - TOP_Y) * t, 54, ink, t > 0.5))
    .join("");
}

/** The index: the rank over a small pip, top left — and again, turned, bottom right. */
function corner(id) {
  const rank = rankOf(id);
  const ink = inkOf(id);
  const one =
    `<text x="29" y="50" text-anchor="middle" font-family="'Times New Roman', Times, 'Liberation Serif', serif" ` +
    `font-size="${rank === "10" ? 36 : 43}" font-weight="700" ${rank === "10" ? 'letter-spacing="-3" ' : ""}fill="${ink}">${rank}</text>` +
    pip(suitOf(id), 29, 75, 26, ink);
  return one + `<g transform="rotate(180 ${W / 2} ${H / 2})">${one}</g>`;
}

/* ── the court ────────────────────────────────────────────────────────────
   One half-figure, drawn from the waist up inside the frame and printed twice,
   the second time turned about the middle of the card — which is all a court
   card has ever been. The three differ where you would look to tell them
   apart: the king is bearded under a tall crown, the queen wears a low crown
   and a flower, the jack a flat cap with a feather. Crowns, sashes and staves
   are foil. */

function halfFigure(id) {
  const rank = rankOf(id);
  const suit = suitOf(id);
  const ink = inkOf(id);
  const coat = isRed(id) ? RED : BLUE;
  const trim = isRed(id) ? BLUE : RED;
  const line = `stroke="${BLACK}" stroke-width="1.8" stroke-linejoin="round"`;
  let s = "";

  /* the robe, to the waist, with a foil sash down it */
  s += `<path d="M56 175V150C56 128 78 120 104 114L125 132 146 114C172 120 194 128 194 150V175Z" fill="${coat}" ${line}/>`;
  s += `<path d="M104 114 125 132 146 114 138 175H112Z" fill="${FOIL}" ${line}/>`;
  s += `<path d="M56 150 96 175H70L56 166Z" fill="${trim}" ${line}/><path d="M194 150 154 175H180L194 166Z" fill="${trim}" ${line}/>`;
  s += `<path d="M62 146q14 4 26 20M188 146q-14 4-26 20" fill="none" stroke="${FOIL}" stroke-width="2.4"/>`;
  for (const y of [142, 156, 170]) s += `<path d="M125 ${y - 5}l4 5-4 5-4-5z" fill="${trim}" stroke="${BLACK}" stroke-width=".8"/>`;
  /* collar */
  s += `<path d="M100 116Q125 128 150 116L146 106Q125 116 104 106Z" fill="${STOCK}" ${line}/>`;

  /* hair, behind the face */
  const grey = "#8f949d";
  if (rank === "Q") {
    s += `<path d="M97 82C90 96 90 114 98 124L108 118V84Z" fill="${HAIR}" ${line}/><path d="M153 82C160 96 160 114 152 124L142 118V84Z" fill="${HAIR}" ${line}/>`;
  } else {
    s += `<path d="M99 80C94 92 95 104 100 110L108 104V82Z" fill="${rank === "K" ? grey : HAIR}" ${line}/>`;
    s += `<path d="M151 80C156 92 155 104 150 110L142 104V82Z" fill="${rank === "K" ? grey : HAIR}" ${line}/>`;
  }

  /* the face */
  s += `<path d="M104 78C104 66 146 66 146 78V98C146 112 136 120 125 120 114 120 104 112 104 98Z" fill="${SKIN}" ${line}/>`;
  s += `<path d="M110 88q5-4 10 0M130 88q5-4 10 0" fill="none" stroke="${BLACK}" stroke-width="1.8" stroke-linecap="round"/>`;
  s += `<circle cx="115" cy="92" r="2" fill="${BLACK}"/><circle cx="135" cy="92" r="2" fill="${BLACK}"/>`;
  s += `<path d="M125 92v9l-4 2" fill="none" stroke="${BLACK}" stroke-width="1.5" stroke-linecap="round"/>`;
  s += `<path d="M119 108q6 4 12 0" fill="none" stroke="${RED}" stroke-width="2.2" stroke-linecap="round"/>`;

  if (rank === "K") {
    /* beard and moustache */
    s += `<path d="M104 98C104 118 114 130 125 130 136 130 146 118 146 98 140 106 132 104 125 110 118 104 110 106 104 98Z" fill="${grey}" ${line}/>`;
    s += `<path d="M119 108q6 4 12 0" fill="none" stroke="${RED}" stroke-width="2.2" stroke-linecap="round"/>`;
    /* a tall crown */
    s += `<path d="M100 76 96 46 110 60 125 42 140 60 154 46 150 76Z" fill="${FOIL}" ${line}/>`;
    s += `<rect x="100" y="70" width="50" height="8" fill="${trim}" ${line}/>`;
    for (const x of [96, 125, 154]) s += `<circle cx="${x}" cy="${x === 125 ? 42 : 46}" r="4" fill="${coat}" ${line}/>`;
    for (const x of [112, 125, 138]) s += `<circle cx="${x}" cy="74" r="1.8" fill="${FOIL}"/>`;
  } else if (rank === "Q") {
    /* a low crown, and a flower held at the shoulder */
    s += `<path d="M102 76 100 56 112 66 125 54 138 66 150 56 148 76Z" fill="${FOIL}" ${line}/>`;
    s += `<rect x="102" y="71" width="46" height="7" fill="${coat}" ${line}/>`;
    for (const x of [100, 125, 150]) s += `<circle cx="${x}" cy="${x === 125 ? 54 : 56}" r="3.4" fill="${STOCK}" ${line}/>`;
    s += `<path d="M112 122q13 8 26 0" fill="none" stroke="${FOIL}" stroke-width="3"/>`;
    s += `<path d="M174 150V124" stroke="#2f7d4f" stroke-width="3" stroke-linecap="round"/>`;
    for (const [dx, dy] of [[0, -8], [8, 0], [0, 8], [-8, 0]]) s += `<circle cx="${174 + dx}" cy="${118 + dy}" r="6" fill="${trim}" ${line}/>`;
    s += `<circle cx="174" cy="118" r="4.5" fill="${FOIL}" ${line}/>`;
  } else {
    /* a flat cap with a feather */
    s += `<path d="M98 78C96 62 110 56 126 56 144 56 156 62 152 78Z" fill="${coat}" ${line}/>`;
    s += `<rect x="98" y="72" width="54" height="7" fill="${FOIL}" ${line}/>`;
    s += `<path d="M148 62C158 44 172 40 180 44 172 46 166 56 156 68Z" fill="${trim}" ${line}/>`;
    /* and a staff */
    s += `<path d="M76 175V120" stroke="${BLACK}" stroke-width="6" stroke-linecap="round"/><path d="M76 175V120" stroke="${FOIL}" stroke-width="3.2" stroke-linecap="round"/>`;
    s += `<path d="M76 104l7 12h-14z" fill="${FOIL}" ${line}/>`;
  }

  /* the suit, in the corner of the frame */
  s += pip(suit, 73, 68, 30, ink);
  return s;
}

function court(id) {
  const half = halfFigure(id);
  const clip = `ct-half-${id}`;
  return (
    `<defs><clipPath id="${clip}"><rect x="50" y="44" width="150" height="131"/></clipPath></defs>` +
    `<rect x="50" y="44" width="150" height="262" fill="#fffdf6"/>` +
    `<g clip-path="url(#${clip})">${half}</g>` +
    `<g transform="rotate(180 ${W / 2} ${H / 2})"><g clip-path="url(#${clip})">${half}</g></g>` +
    `<path d="M50 175H200" stroke="${FOIL}" stroke-width="2.4"/>` +
    `<rect x="50" y="44" width="150" height="262" fill="none" stroke="${FOIL}" stroke-width="3.4"/>` +
    `<rect x="46" y="40" width="158" height="270" fill="none" stroke="${FOIL}" stroke-width="1"/>`
  );
}

/* The card itself: gilded edge showing along the bottom, ivory stock lit
   from the top left. */
const sheet = (inner, label) =>
  `<svg class="ct-art" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ` +
  `${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${DEFS}` +
  `<rect x="1" y="2.6" width="${W - 2}" height="${H - 3.2}" rx="13" fill="#9c7a22"/>` +
  `<rect x="1" y="1" width="${W - 2}" height="${H - 3.4}" rx="13" fill="url(#ct-stock)" stroke="#cdbf9a" stroke-width="1"/>` +
  `${inner}</svg>`;

/** The hairline of foil round every face. */
const FRAME =
  `<rect x="8.5" y="8.5" width="${W - 17}" height="${H - 19.4}" rx="8" fill="none" stroke="${FOIL}" stroke-width="1.5"/>`;

/** The face of a card. */
export function faceSvg(id, { label = true } = {}) {
  const body = "JQK".includes(rankOf(id)) ? court(id) : pips(id);
  return sheet(FRAME + body + corner(id), label ? nameOf(id) : "");
}

/* A corner of the back's frame: a fan of foil, drawn once and turned into
   the other three. */
const FAN =
  `<path d="M26 26h34q-20 4-27 13-9 7-7 21z" fill="${FOIL}"/>` +
  `<path d="M26 72q10-30 46-46M26 92q14-46 66-66" fill="none" stroke="${FOIL}" stroke-width="1.6"/>` +
  `<circle cx="40" cy="40" r="4" fill="${FOIL}"/>`;

/**
 * The back: gold filigree on crimson, the same from either end. Navy for the
 * computer's own card, which comes from another pack — you can see at a
 * glance it was never in yours.
 */
export function backSvg(tone = "red") {
  const field = tone === "blue" ? "url(#ct-blue)" : "url(#ct-red)";
  const cx = W / 2;
  const cy = H / 2;
  let rays = "";
  for (let i = 0; i < 16; i++) rays += `<path d="M${cx} ${cy - 62}l2.6 16h-5.2z" fill="${FOIL}" transform="rotate(${i * 22.5} ${cx} ${cy})"/>`;
  const fans = [0, 1, 2, 3]
    .map((i) => `<g transform="translate(${i % 2 ? W : 0} ${i > 1 ? H - 1.6 : 0}) scale(${i % 2 ? -1 : 1} ${i > 1 ? -1 : 1})">${FAN}</g>`)
    .join("");
  return sheet(
    `<rect x="13" y="13" width="${W - 26}" height="${H - 27.6}" rx="7" fill="${field}"/>` +
      `<rect x="13" y="13" width="${W - 26}" height="${H - 27.6}" rx="7" fill="url(#ct-lattice)"/>` +
      `<rect x="13" y="13" width="${W - 26}" height="${H - 27.6}" rx="7" fill="none" stroke="${FOIL}" stroke-width="4"/>` +
      `<rect x="22" y="22" width="${W - 44}" height="${H - 45.6}" rx="3" fill="none" stroke="${FOIL}" stroke-width="1.4"/>` +
      fans +
      /* the medallion */
      `<ellipse cx="${cx}" cy="${cy}" rx="58" ry="74" fill="${field}" stroke="${FOIL}" stroke-width="4"/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx="50" ry="66" fill="none" stroke="${FOIL}" stroke-width="1.2"/>` +
      rays +
      `<circle cx="${cx}" cy="${cy}" r="36" fill="${field}" stroke="${FOIL}" stroke-width="2.4"/>` +
      `<path d="${SUIT_PATH.S}" fill="${FOIL}" transform="translate(${cx} ${cy - 1}) scale(50)"/>` +
      /* a diamond above and below it */
      `<path d="M${cx} ${cy - 104}l7 12-7 12-7-12zM${cx} ${cy + 80}l7 12-7 12-7-12z" fill="${FOIL}"/>`,
    "",
  );
}

/** A small fan of cards, for the home page. */
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
