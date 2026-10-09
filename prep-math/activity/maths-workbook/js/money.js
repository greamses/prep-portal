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
  purse, mountPurse, heldTotal, sayHeld,
} from "/utils/components/workbook/purse.js";

/* one place for the exercises to ask for money from */
export {
  PER_BILL, COINS, BILLS, PIECES, bill, writeAmount, sayAmount, payWith,
  changeFrom, roundUpPiece, coinSvg, billSvg, pieceSvg, moneySvg, currencySvg,
  purse, mountPurse, heldTotal, sayHeld,
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
    + (was != null ? `<s class="mo-tag__was">${writeAmount(was)}</s>` : "")
    + `<b class="mo-tag__now">${writeAmount(price)}</b>`
    + `</span>`;
}

/* ── the bank ──────────────────────────────────────────────────────────────*/

/**
 * THE BANK, drawn: a front with columns, a door and a sign. It is a picture of
 * a place money is left, which is the thing a child has to believe before
 * interest means anything — the money goes somewhere, stays there, and comes
 * back bigger.
 */
export function bankSvg({ mm = 36, name = "PREP BANK" } = {}) {
  const col = (x) => `<rect x="${x}" y="30" width="6" height="26" fill="#fffdf8" stroke="${INK}" stroke-width="1.4"/>`;
  return `<svg class="mo-bank" viewBox="0 0 96 72" width="${mm}mm" height="${mm * 0.75}mm" role="img" aria-label="the bank">`
    + `<path d="M4 30 48 8l44 22z" fill="#f4c95d" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
    + col(14) + col(28) + col(42) + col(56) + col(70)
    + `<rect x="2" y="56" width="92" height="8" fill="#e8dfcc" stroke="${INK}" stroke-width="2"/>`
    + `<rect x="38" y="38" width="20" height="18" fill="#6fb7e8" stroke="${INK}" stroke-width="1.4"/>`
    + `<text x="48" y="24" text-anchor="middle" fill="${INK}" font-size="8" font-weight="800" letter-spacing="0.6">${name}</text>`
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
      + `<td class="mo-till__each">${writeAmount(l.price)}</td>`
      + `<td class="mo-till__line">${answer ? `<b>${writeAmount(line)}</b>` : box()}</td>`
      + `</tr>`;
  }).join("");
  const total = lines.reduce((t, l) => t + l.n * l.price, 0);
  const foot = `<tr class="mo-till__total"><td colspan="3">Total to pay</td>`
    + `<td>${answer ? `<b>${writeAmount(total)}</b>` : box()}</td></tr>`
    + (paid == null ? "" : `<tr class="mo-till__change"><td colspan="3">Paid ${writeAmount(paid)} — change</td>`
      + `<td>${answer ? `<b>${writeAmount(paid - total)}</b>` : box()}</td></tr>`);
  return `<table class="mo-till"><thead><tr><th>What</th><th>How many</th><th>Each</th><th>Comes to</th></tr></thead>`
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
