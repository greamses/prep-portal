/* ============================================================================
   Maths Workbook — the shop, the bank and the till
   ----------------------------------------------------------------------------
   THE MONEY ITSELF IS NOT HERE. PrepCoins and PrepBills live in
   /utils/components/workbook/purse.js, with the purse a child takes them out
   of on screen, because both halves of the chapter need them: the paper draws
   the pieces and the purse hands them over. They are re-exported through this
   file so the exercises have one place to ask for money from.

   What IS here is everything the money is spent on — the goods on the shelf,
   the price tags, the till they are added up at, the bank they are paid into,
   and the percentage that a discount, a rate of interest and a tax all are.

   EVERY AMOUNT IS A WHOLE NUMBER OF PREPCOINS, here as there. A worksheet
   whose answer key is out by a coin teaches a child they are wrong when they
   are right.
   ========================================================================== */

import {
  PER_BILL, COINS, BILLS, PIECES, bill, writeAmount, sayAmount, payWith,
  changeFrom, roundUpPiece, coinSvg, billSvg, pieceSvg, moneySvg, currencySvg,
  purse, mountPurse, heldTotal, sayHeld, markSvg, priceHtml,
} from "/utils/components/workbook/purse.js";

/* one place for the exercises to ask for money from */
export {
  PER_BILL, COINS, BILLS, PIECES, bill, writeAmount, sayAmount, payWith,
  changeFrom, roundUpPiece, coinSvg, billSvg, pieceSvg, moneySvg, currencySvg,
  purse, mountPurse, heldTotal, sayHeld, markSvg, priceHtml,
};

const INK = "#2a2723";

/* ── the shop ──────────────────────────────────────────────────────────────*/

/* Goods a child recognises, drawn bold enough to survive a photocopier. Each
   is a name, a picture and nothing else: the price is on the tag, because a
   price is something a shop decides and not something a thing has. */
const GOODS = {
  loaf: { name: "loaf of bread", draw: (c) =>
    `<path d="M6 26c0-7 4-12 12-12h12c8 0 12 5 12 12v8H6z" fill="${c}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<path d="M14 18v16M24 14v20M34 18v16" stroke="${INK}" stroke-width="1.1" opacity=".5"/>` },
  apple: { name: "apple", draw: (c) =>
    `<path d="M24 14c-5-4-14-2-14 8 0 9 7 16 14 16s14-7 14-16c0-10-9-12-14-8z" fill="${c}" stroke="${INK}" stroke-width="1.6"/>`
    + `<path d="M24 14V7" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
    + `<path d="M24 10c4-4 8-3 8-3s0 5-5 5z" fill="#7cc47c" stroke="${INK}" stroke-width="1.2"/>` },
  pencil: { name: "pencil", draw: (c) =>
    `<path d="M10 36 36 10l6 6-26 26-8 2z" fill="${c}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<path d="M8 44l8-2-6-6z" fill="${INK}"/>`
    + `<path d="M32 14l6 6" stroke="${INK}" stroke-width="1.4"/>` },
  book: { name: "book", draw: (c) =>
    `<path d="M9 10h13c3 0 5 2 5 4v24c0-2-2-4-5-4H9z" fill="${c}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<path d="M39 10H26c-3 0-5 2-5 4v24c0-2 2-4 5-4h13z" fill="${c}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" opacity=".75"/>`
    + `<path d="M24 14v24" stroke="${INK}" stroke-width="1.4"/>` },
  ball: { name: "ball", draw: (c) =>
    `<circle cx="24" cy="24" r="15" fill="${c}" stroke="${INK}" stroke-width="1.6"/>`
    + `<path d="M9 24h30M24 9c6 7 6 23 0 30M24 9c-6 7-6 23 0 30" fill="none" stroke="${INK}" stroke-width="1.2"/>` },
  bottle: { name: "bottle of water", draw: (c) =>
    `<path d="M20 8h8v6l4 5v21a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V19l4-5z" fill="${c}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<path d="M16 26h16" stroke="${INK}" stroke-width="1.2"/>` },
  shirt: { name: "shirt", draw: (c) =>
    `<path d="M18 9h12l10 6-4 7-3-2v20H15V20l-3 2-4-7z" fill="${c}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<path d="M18 9a6 6 0 0 0 12 0" fill="none" stroke="${INK}" stroke-width="1.4"/>` },
  bag: { name: "bag of rice", draw: (c) =>
    `<path d="M12 16h24l3 24H9z" fill="${c}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<path d="M17 16c0-5 3-8 7-8s7 3 7 8" fill="none" stroke="${INK}" stroke-width="1.6"/>`
    + `<path d="M15 26h18" stroke="${INK}" stroke-width="1.2" opacity=".6"/>` },
};

export const GOOD_NAMES = Object.keys(GOODS);
export const goodName = (k) => (GOODS[k] || GOODS.ball).name;

const GOOD_COLOURS = ["#f4c95d", "#6fb7e8", "#7cc47c", "#f0a868", "#c9a3ee", "#7fd7c6"];

/** One thing on the shelf. */
export function goodSvg(key, { mm = 15, colour = 0 } = {}) {
  const g = GOODS[key] || GOODS.ball;
  const c = GOOD_COLOURS[((colour % GOOD_COLOURS.length) + GOOD_COLOURS.length) % GOOD_COLOURS.length];
  return `<svg class="mo-good" viewBox="0 0 48 48" width="${mm}mm" height="${mm}mm" role="img" aria-label="${g.name}">`
    + g.draw(c) + `</svg>`;
}

/**
 * A PRICE TAG, hung on its string. `was` prints the old price struck through
 * above the new one, which is what a sale tag is and is the whole of the
 * discount question: a child who cannot see the old price cannot check the
 * shop's arithmetic.
 */
export function tagSvg(price, { was = null, off = null } = {}) {
  const wide = was != null;
  return `<span class="mo-tag${wide ? " mo-tag--sale" : ""}">`
    + (off != null ? `<b class="mo-tag__off">${off}% off</b>` : "")
    + (was != null ? `<s class="mo-tag__was">${priceHtml(was)}</s>` : "")
    + `<b class="mo-tag__now">${priceHtml(price)}</b>`
    + `</span>`;
}

/* ── the store ─────────────────────────────────────────────────────────────
   THE SHOP IS LAID OUT THE WAY A SHOP IS LAID OUT ON A SCREEN: a grid of
   product cards, each one a picture on its own panel, the thing's name under
   it, the price in the place a price goes, and how many are in the basket.

   It was a row of little drawings with a tag hung under each, which is a
   SHELF — and a shelf is not what a child has ever bought anything from. The
   whole point of the chapter is that these are sums grown-ups actually do, so
   the page should look like the place they actually do them. */

/**
 * One product card. `n` is how many are in the basket; leave it null for a
 * card that is only showing a price.
 */
export function productCard(l, { n = null, tag = null } = {}) {
  return `<article class="mo-card">`
    + `<div class="mo-card__shot">${goodSvg(l.good, { mm: 17, colour: l.colour || 0 })}</div>`
    + `<div class="mo-card__body">`
    + `<h4 class="mo-card__name">${goodName(l.good)}</h4>`
    + (tag || `<p class="mo-card__price">${priceHtml(l.price)}</p>`)
    + (n == null ? "" : `<p class="mo-card__qty"><span>In the basket</span><b>${n}</b></p>`)
    + `</div></article>`;
}

/** The storefront: every product on the page, in a grid. */
export function storeHtml(lines, { withQty = true } = {}) {
  return `<div class="mo-store" role="list">`
    + lines.map((l) => productCard(l, { n: withQty ? l.n : null })).join("")
    + `</div>`;
}

/* ── the bank ──────────────────────────────────────────────────────────────*/

/**
 * THE BANK, drawn as a bank is built: a stepped plinth, a colonnade of fluted
 * columns standing on their own bases and carrying their own capitals, a
 * proper entablature — architrave, frieze, dentils, cornice — and a pediment
 * over it with the house emblem alone in the tympanum.
 *
 * THE NAME IS CUT INTO THE FRIEZE, which is where a bank's name goes and the
 * only band tall enough to hold it. In the pediment it printed straight
 * through the emblem.
 *
 * It is drawn in STONE, not in poster paint. A bank is the most solemn
 * building a child ever walks past, and that solemnity is the whole reason the
 * picture is here: money left in it stays there and comes back bigger, and
 * nobody believes that of a yellow triangle on sticks.
 */
export function bankSvg({ mm = 36, name = "PREP BANK" } = {}) {
  const STONE = "#efe9dd";
  const SHADE = "#d9d1c1";
  const DEEP = "#b9ae99";

  /* A COLUMN: base, fluted shaft, capital, abacus. The flutes are what make it
     a column rather than a post. It hangs off the architrave above it, so the
     whole order moves together if the entablature ever moves. */
  const column = (x) => {
    const flute = [3.4, 6, 8.6]
      .map((o) => `<path d="M${x + o} 55v28" stroke="${DEEP}" stroke-width="0.7" opacity="0.65"/>`)
      .join("");
    return `<rect x="${x + 0.6}" y="55" width="10.8" height="28" fill="${STONE}"/>`
      + flute
      + `<rect x="${x + 0.6}" y="55" width="10.8" height="28" fill="none" stroke="${DEEP}" stroke-width="0.6"/>`
      /* capital, and the abacus that carries the architrave */
      + `<rect x="${x - 1}" y="51.6" width="14" height="3.6" fill="${STONE}" stroke="${DEEP}" stroke-width="0.6"/>`
      + `<rect x="${x - 0.2}" y="49" width="12.4" height="2.8" fill="${SHADE}" stroke="${DEEP}" stroke-width="0.5"/>`
      /* base */
      + `<rect x="${x - 1}" y="83" width="14" height="4" fill="${STONE}" stroke="${DEEP}" stroke-width="0.6"/>`;
  };

  /* THE DENTILS under the cornice — the row of little blocks that says
     "classical" faster than any other detail. */
  let dentils = "";
  for (let x = 12; x < 148; x += 7.4) {
    dentils += `<rect x="${x}" y="35.8" width="4.2" height="3.2" fill="${SHADE}"/>`;
  }

  /* THE STEPS, each one WIDER than the one above it, which is what makes a
     flight of steps read as a flight and not as a stack of slabs. */
  const steps = [0, 1, 2]
    .map((i) => `<rect x="${14 - i * 5}" y="${87 + i * 4.6}" width="${132 + i * 10}" height="4.8"`
      + ` fill="${i % 2 ? SHADE : STONE}" stroke="${DEEP}" stroke-width="0.6"/>`)
    .join("");

  return `<svg class="mo-bank" viewBox="0 0 160 108" width="${mm}mm" height="${(mm * 0.675).toFixed(2)}mm"`
    + ` role="img" aria-label="the bank">`
    /* the pediment, and the shade under its rake that gives it depth */
    + `<path d="M6 32 80 5l74 27z" fill="${STONE}" stroke="${DEEP}" stroke-width="1.2" stroke-linejoin="round"/>`
    + `<path d="M14 30 80 10l66 20z" fill="${SHADE}" opacity="0.5"/>`
    /* the emblem, alone in the tympanum, where a pediment carries its device */
    + `<g transform="translate(80 21.5) scale(1.45)">`
    + [0, 1, 2, 3, 4].map((i) => {
      const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      return `<circle cx="${(Math.cos(a) * 2.5).toFixed(2)}" cy="${(Math.sin(a) * 2.5).toFixed(2)}" r="1.75" fill="${DEEP}"/>`;
    }).join("")
    + `<circle cx="0" cy="0" r="1.15" fill="${DEEP}" opacity="0.5"/>`
    + `</g>`
    /* the entablature, top down: cornice, dentils, frieze, architrave */
    + `<rect x="2" y="31.4" width="156" height="4.4" fill="${STONE}" stroke="${DEEP}" stroke-width="0.7"/>`
    + dentils
    + `<rect x="6" y="39" width="148" height="7" fill="${STONE}" stroke="${DEEP}" stroke-width="0.6"/>`
    + `<text x="80" y="43.4" text-anchor="middle" dominant-baseline="central" fill="${DEEP}"`
    + ` font-size="5.4" font-weight="800" letter-spacing="2.6">${name}</text>`
    + `<rect x="6" y="46" width="148" height="3" fill="${SHADE}" stroke="${DEEP}" stroke-width="0.5"/>`
    /* the dark of the portico behind the columns */
    + `<rect x="10" y="49" width="140" height="38" fill="#6b6150" opacity="0.18"/>`
    + [12, 37, 62, 87, 112, 137].map(column).join("")
    /* the doorway, standing in the shade between the middle columns */
    + `<rect x="68" y="60" width="24" height="27" fill="#5d7f96"/>`
    + `<path d="M68 60a12 12 0 0 1 24 0z" fill="#7fa3bb"/>`
    + `<path d="M80 51v36M68 68h24" stroke="${STONE}" stroke-width="0.8" opacity="0.6"/>`
    + `<rect x="68" y="60" width="24" height="27" fill="none" stroke="${DEEP}" stroke-width="0.8"/>`
    + steps
    + `</svg>`;
}

/* ── the till ──────────────────────────────────────────────────────────────*/

/**
 * A line of the checkout: the thing, how many, what each costs, and the box
 * the child writes what that line comes to in. The TOTAL row is the last box.
 *
 * `answer` prints the working done, for the one done for you.
 */
export function tillHtml(lines, { answer = false, paid = null, box = () => "" } = {}) {
  const rows = lines.map((l) => {
    const line = l.n * l.price;
    return `<tr>`
      + `<td class="mo-till__what">${goodSvg(l.good, { mm: 9, colour: l.colour || 0 })}<span>${goodName(l.good)}</span></td>`
      + `<td class="mo-till__n">${l.n}</td>`
      + `<td class="mo-till__each">${priceHtml(l.price)}</td>`
      + `<td class="mo-till__line">${answer ? `<b>${priceHtml(line)}</b>` : box()}</td>`
      + `</tr>`;
  }).join("");
  const total = lines.reduce((t, l) => t + l.n * l.price, 0);
  const foot = `<tr class="mo-till__total"><td colspan="3">Total to pay</td>`
    + `<td>${answer ? `<b>${priceHtml(total)}</b>` : box()}</td></tr>`
    + (paid == null ? "" : `<tr class="mo-till__change"><td colspan="3">Paid ${priceHtml(paid)} — change</td>`
      + `<td>${answer ? `<b>${priceHtml(paid - total)}</b>` : box()}</td></tr>`);
  /* the cart's own heading, because this is the order and not a worksheet
     table that happens to have things in it */
  return `<table class="mo-till"><caption class="mo-till__cap">Your order</caption>`
    + `<thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Comes to</th></tr></thead>`
    + `<tbody>${rows}${foot}</tbody></table>`;
}

/** What a basket comes to, in prepcoins. */
export const totalOf = (lines) => lines.reduce((t, l) => t + l.n * l.price, 0);

/* ── percentages, done the way money is done ───────────────────────────────*/

/**
 * A PERCENTAGE OF AN AMOUNT, to the nearest prepcoin. Everything in this
 * chapter — a discount, a rate of interest, a tax — is this one sum, and it is
 * done on whole prepcoins so that a shop, a bank and a government all agree
 * with the child's arithmetic to the last coin.
 */
export const percentOf = (coins, rate) => Math.round((coins * rate) / 100);

/** Simple interest: the same interest every year, on what was paid in. */
export const simpleInterest = (principal, rate, years) => percentOf(principal, rate) * years;

/**
 * Compound interest, year by year — the interest joins the money and earns
 * interest itself the next year. Returned as the list of years, because the
 * YEARS are the lesson: one line per year is what makes it different from
 * simple interest, and a single formula hides exactly that.
 */
export function compoundYears(principal, rate, years) {
  const out = [];
  let have = principal;
  for (let y = 1; y <= years; y++) {
    const earned = percentOf(have, rate);
    have += earned;
    out.push({ year: y, start: have - earned, earned, end: have });
  }
  return out;
}
