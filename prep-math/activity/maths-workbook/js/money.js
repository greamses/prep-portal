/* ============================================================================
   Maths Workbook — the money: PREPCOINS and PREPBILLS
   ----------------------------------------------------------------------------
   A currency of our own, built the way real ones are built, so that everything
   a child learns handling it transfers to the money in their pocket.

   ONE HUNDRED PREPCOINS MAKE ONE PREPBILL. That is the only fact to learn, and
   it is the fact that makes a price a decimal: 4.50 is four bills and fifty
   coins, and the point between them is the same point as on the digit-shift
   card (utils/components/workbook/shift.js) and in the written sums.

   THE DENOMINATIONS ARE THE 1-2-5 SERIES, which is what almost every currency
   on earth uses and is not an accident: with 1, 2, 5 at each power of ten you
   can pay any amount with at most three pieces per power, and greedy change —
   take the biggest that fits, again and again — is always the fewest pieces.
   `payWith` relies on that, and `fewestCheck` in the scratchpad proves it.

     prepcoins   1  2  5  10  20  50
     prepbills   1  2  5  10  20  50  100

   EVERY AMOUNT IN THIS FILE IS A WHOLE NUMBER OF PREPCOINS. Money in floating
   point is money that loses a coin: 0.1 + 0.2 is not 0.3 and a till that says
   so is a till nobody trusts. Prices, totals, discounts, interest — all of it
   is integer prepcoins, and only `writeAmount` ever puts the point in.
   ========================================================================== */

const INK = "#2a2723";
const FAINT = "rgba(42,39,35,.3)";

/** Prepcoins in one prepbill. The whole currency hangs off this one number. */
export const PER_BILL = 100;

export const COINS = [1, 2, 5, 10, 20, 50];
export const BILLS = [1, 2, 5, 10, 20, 50, 100];

/** Every piece there is, biggest first — in prepcoins, so they are comparable. */
export const PIECES = BILLS.map((b) => b * PER_BILL).concat(COINS).sort((a, b) => b - a);

/** Bills, as a number of prepcoins. */
export const bill = (n) => n * PER_BILL;

/* ── writing an amount ─────────────────────────────────────────────────────*/

/** 450 → "4.50". Money is always written to the coin, even when it is round. */
export function writeAmount(coins) {
  const n = Math.round(coins);
  const sign = n < 0 ? "−" : "";
  const a = Math.abs(n);
  return `${sign}${Math.floor(a / PER_BILL)}.${String(a % PER_BILL).padStart(2, "0")}`;
}

/** 450 → "4 prepbills and 50 prepcoins" — the amount said out loud. */
export function sayAmount(coins) {
  const n = Math.abs(Math.round(coins));
  const b = Math.floor(n / PER_BILL);
  const c = n % PER_BILL;
  const bs = `${b} prepbill${b === 1 ? "" : "s"}`;
  const cs = `${c} prepcoin${c === 1 ? "" : "s"}`;
  if (!b) return cs;
  if (!c) return bs;
  return `${bs} and ${cs}`;
}

/* ── paying ────────────────────────────────────────────────────────────────*/

/**
 * The FEWEST pieces that make an amount — biggest first, as anybody pays.
 * → [{ value, kind }] where kind is "bill" or "coin", one entry per piece.
 */
export function payWith(coins) {
  let left = Math.round(coins);
  const out = [];
  for (const p of PIECES) {
    while (left >= p) {
      out.push({ value: p >= PER_BILL ? p / PER_BILL : p, kind: p >= PER_BILL ? "bill" : "coin" });
      left -= p;
    }
  }
  return out;
}

/** What is handed back when `paid` covers `price`. */
export const changeFrom = (paid, price) => payWith(Math.max(0, paid - price));

/**
 * The smallest sensible note or coin a shopper would hand over for an amount —
 * the next piece up, so there is change to count. That is the question worth
 * asking: nobody learns anything from paying the exact money.
 */
export function roundUpPiece(coins) {
  const n = Math.round(coins);
  for (const p of [...PIECES].reverse()) if (p >= n) return p;
  return PIECES[0];
}

/* ── the pieces, drawn ─────────────────────────────────────────────────────*/

/* Each denomination its own colour and its own size, the way real money is
   told apart at a glance — and bigger is worth more, which is a lie real
   currencies also tell and children find helpful. */
const COIN_FACE = { 1: "#d9a97a", 2: "#cb9360", 5: "#e3bc85", 10: "#c7ced5", 20: "#aab5c0", 50: "#f4c95d" };
const COIN_EDGE = { 1: "#a97a4e", 2: "#9c6a3c", 5: "#b18e58", 10: "#98a2ac", 20: "#7f8b97", 50: "#c9922f" };
const BILL_FACE = { 1: "#9fd9a4", 2: "#bfe0b0", 5: "#9ed2f2", 10: "#f5c094", 20: "#d6bdf3", 50: "#f7dc96", 100: "#f0a9ac" };
const BILL_EDGE = { 1: "#3f8f4f", 2: "#5a8f3f", 5: "#2a6ca8", 10: "#c9752f", 20: "#7a56a8", 50: "#c9922f", 100: "#c0453f" };

const COIN_MM = { 1: 7.4, 2: 8.2, 5: 9, 10: 9.8, 20: 10.6, 50: 11.4 };
const BILL_MM = { 1: 17, 2: 17.5, 5: 18, 10: 19, 20: 20, 50: 21, 100: 22 };

/**
 * ONE PREPCOIN, drawn: a milled disc with its worth on it. The word is on the
 * coin because a coin that only says "5" is a counter, not money.
 */
export function coinSvg(value, { mm = 0 } = {}) {
  const d = mm || COIN_MM[value] || 9;
  const face = COIN_FACE[value] || "#d9d9d9";
  const edge = COIN_EDGE[value] || "#999";
  return `<svg class="mo-piece mo-piece--coin" viewBox="0 0 40 40" width="${d}mm" height="${d}mm"`
    + ` role="img" aria-label="${value} prepcoin${value === 1 ? "" : "s"}">`
    + `<circle cx="20" cy="20" r="18.6" fill="${edge}"/>`
    + `<circle cx="20" cy="20" r="16.2" fill="${face}" stroke="${edge}" stroke-width="1"/>`
    + `<text x="20" y="19.4" text-anchor="middle" dominant-baseline="central" fill="${INK}"`
    + ` font-size="17" font-weight="800" font-family="JetBrains Mono, ui-monospace, monospace">${value}</text>`
    + `<text x="20" y="31" text-anchor="middle" dominant-baseline="central" fill="${INK}"`
    + ` font-size="5.4" font-weight="700" letter-spacing="0.2">PREPCOIN${value === 1 ? "" : "S"}</text>`
    + `</svg>`;
}

/**
 * ONE PREPBILL, drawn: a note with its worth in two corners the way a note
 * carries it, so it can be read from a handful held fanned out.
 */
export function billSvg(value, { mm = 0 } = {}) {
  const w = mm || BILL_MM[value] || 19;
  const face = BILL_FACE[value] || "#e4e4e4";
  const edge = BILL_EDGE[value] || "#777";
  return `<svg class="mo-piece mo-piece--bill" viewBox="0 0 64 32" width="${w}mm" height="${w / 2}mm"`
    + ` role="img" aria-label="${value} prepbill${value === 1 ? "" : "s"}">`
    + `<rect x="0.8" y="0.8" width="62.4" height="30.4" fill="${face}" stroke="${edge}" stroke-width="1.6"/>`
    + `<rect x="4" y="4" width="56" height="24" fill="none" stroke="${edge}" stroke-width="0.7" stroke-dasharray="2.4 1.8"/>`
    + `<circle cx="32" cy="16" r="8.4" fill="none" stroke="${edge}" stroke-width="0.9"/>`
    + `<text x="32" y="16" text-anchor="middle" dominant-baseline="central" fill="${INK}"`
    + ` font-size="12" font-weight="800" font-family="JetBrains Mono, ui-monospace, monospace">${value}</text>`
    + `<text x="10.6" y="9.6" text-anchor="middle" dominant-baseline="central" fill="${INK}" font-size="7" font-weight="800">${value}</text>`
    + `<text x="53.4" y="23" text-anchor="middle" dominant-baseline="central" fill="${INK}" font-size="7" font-weight="800">${value}</text>`
    + `<text x="32" y="27.4" text-anchor="middle" dominant-baseline="central" fill="${INK}"`
    + ` font-size="4.6" font-weight="700" letter-spacing="0.3">PREPBILL${value === 1 ? "" : "S"}</text>`
    + `</svg>`;
}

/** Whichever kind of piece this is. */
export const pieceSvg = (p, opts) => (p.kind === "bill" ? billSvg(p.value, opts) : coinSvg(p.value, opts));

/**
 * A HANDFUL: the pieces that make an amount, laid out biggest first, notes
 * before coins the way they come out of a purse.
 */
export function moneySvg(coins, { max = 14 } = {}) {
  const pieces = payWith(coins);
  const shown = pieces.slice(0, max);
  const over = pieces.length - shown.length;
  return `<span class="mo-hand">${shown.map((p) => pieceSvg(p)).join("")}`
    + (over ? `<span class="mo-hand__more">+${over} more</span>` : "")
    + `</span>`;
}

/** One of each piece there is — the currency itself, for the chart. */
export function currencySvg() {
  return `<span class="mo-hand mo-hand--all">`
    + BILLS.map((b) => billSvg(b)).join("")
    + COINS.map((c) => coinSvg(c)).join("")
    + `</span>`;
}

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
