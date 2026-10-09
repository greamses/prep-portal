/* ============================================================================
   Maths Workbook — CHAPTER 11: money
   ----------------------------------------------------------------------------
   The chapter where the arithmetic is for something. Every sum here is one a
   grown-up actually does, in the order a child meets them:

     the money        what the pieces are and what a handful comes to. One
                      hundred prepcoins make one prepbill, which is why a price
                      has a point in it.
     at the shop      a shelf with price tags and a basket: so many of this at
                      that each, added up, paid for, change counted. The
                      multiplying and the adding of the earlier chapters, with
                      a reason.
     in the sale      the same shop with the tags changed. A discount is a
                      percentage of a price taken off it — and the question
                      worth asking is not "what is 25% of 20.00" but "is the
                      shop's new tag right?"
     the bank         money left somewhere comes back bigger. SIMPLE interest
                      is the same amount every year, and it is drawn as a
                      function machine (utils/components/workbook/machine.js)
                      because that is exactly what it is: a number goes in, a
                      rule happens to it, a number comes out.
     it grows         COMPOUND interest is the same machine run again on its
                      own output, which is why it is laid out a year to a line.
                      One formula would hide the only thing that matters.
     tax              what a government takes and what it buys. Added at the
                      till, and taken off a wage — the two every adult meets.

   THE MONEY IS ALWAYS WHOLE PREPCOINS (money.js). Nothing here is ever a
   floating point number, because 0.1 + 0.2 is not 0.3 and a worksheet whose
   answer key is out by a coin is a worksheet that teaches a child they are
   wrong when they are right.
   ========================================================================== */

import {
  sayAmount, moneySvg, currencySvg, payWith, totalOf, percentOf,
  simpleInterest, compoundYears, roundUpPiece, goodSvg, goodName, GOOD_NAMES,
  tagSvg, tillHtml, bankSvg, purse, priceHtml, storeHtml, productCard, PER_BILL,
} from "./money.js";
import { trainHtml } from "/utils/components/workbook/machine.js";
import { levelOf } from "./ex-remainder.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="rw-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const lead = (html) => `<p class="wb-ask wb-ask--lead">${html}</p>`;
const art = (html) => `<div class="mo-art">${html}</div>`;
const worked = (body) => `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask rw-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;
/** Money answers are written the way money is written. */
const money = (coins) => want.num(coins / PER_BILL);

/* ── how big the numbers are ──────────────────────────────────────────────
   A price is only ever as awkward as the level asks for: whole bills at
   Gentle, halves and quarters in the Middle, any price at all at Stretch. */
const PRICE = {
  gentle: () => [100, 200, 300, 400, 500, 600],
  middle: () => [150, 175, 250, 325, 450, 525, 650, 750, 900],
  stretch: () => [185, 245, 399, 475, 629, 845, 1250, 1575, 1899],
};
const priceOf = (r, o) => r.pick(PRICE[tier(o)]());
const howMany = (r, o) => ({ gentle: r.int(2, 4), middle: r.int(2, 6), stretch: r.int(3, 9) }[tier(o)]);
const RATES = { gentle: [10, 50], middle: [5, 10, 20, 25], stretch: [5, 8, 12, 15, 24] };
const rateOf = (r, o) => r.pick(RATES[tier(o)]);

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/**
 * A PRICE THAT THE PERCENTAGE COMES OUT OF EXACTLY. 12% of 25 prepcoins is 3
 * prepcoins; 12% of 24 is 2.88, which is not a sum in prepcoins at all. So the
 * old price is always a multiple of 100 ÷ (the common factor of the rate and a
 * hundred), and the discount is then a whole number of coins every time.
 *
 * It matters more here than anywhere else in the book: a child checking a
 * shop's arithmetic has to be able to be CERTAIN, and "near enough" is the one
 * answer a till never gives.
 */
function saleWas(r, o, off) {
  const step = 100 / gcd(off, 100);
  const want = priceOf(r, o) * (tier(o) === "gentle" ? 2 : 1);
  return Math.max(step * 2, Math.round(want / step) * step);
}

/** A basket of different things, each with its own price and count. */
function basket(r, o, n) {
  const picked = [];
  const left = GOOD_NAMES.slice();
  for (let i = 0; i < n && left.length; i++) {
    const good = left.splice(r.int(0, left.length - 1), 1)[0];
    picked.push({ good, colour: i, n: howMany(r, o), price: priceOf(r, o) });
  }
  return picked;
}

/* ── the groups ────────────────────────────────────────────────────────────*/

export const MONEY_GROUPS = [
  { id: "money-know", chapter: "Chapter 11 · Money", label: "The money", blurb: "Prepcoins and prepbills: what the pieces are and what a handful comes to." },
  { id: "money-shop", label: "At the shop", blurb: "A shelf, a basket and a till: so many of this at that each." },
  { id: "money-sale", label: "In the sale", blurb: "The same shop with the tags changed — and the shop's arithmetic to check." },
  { id: "money-bank", label: "The bank: simple interest", blurb: "Money paid in, a rule done to it, money back — drawn as a machine." },
  { id: "money-grow", label: "The bank: compound interest", blurb: "The same machine run again on its own answer, a year to a line." },
  { id: "money-tax", label: "Government and taxes", blurb: "What is added at the till, what is taken off a wage, and what it buys." },
];

/* ═══ the money itself ═════════════════════════════════════════════════════*/

const theMoney = {
  id: "mo-currency",
  group: "money-know",
  label: "Prepcoins and prepbills",
  blurb: "The whole currency on one page, and what each piece is worth.",
  heading: "Our money",
  instruction: () =>
    "One hundred prepcoins make ONE prepbill. That is why a price has a point in it: "
    + "4.50 means four prepbills and fifty prepcoins.",
  cols: 1,
  defaultCount: 1,
  /* NOT `alwaysWorked`: that prints the section head's WORKED block at every
     level of help, and so it is only for an exercise that HAS one — it calls
     `worked()` with no guard (subject.js sectionHead) and a section without
     one takes the whole paper down with it. The chart is the question here,
     so it is simply what this exercise renders. */
  make() { return {}; },
  /* A CHART, not a question — it is the money itself, printed to be looked at
     and kept. `alwaysWorked` puts it on the page at every help level, for the
     same reason the cut-out protractor is always there: it is an instrument. */
  render() {
    return art(currencySvg())
      + ask(`Six prepcoins and seven prepbills, and that is all the money there is. `
        + `The biggest coin is 50 prepcoins — two of those make one prepbill.`);
  },
  key() { return []; },
  answer() { return ["100 prepcoins = 1 prepbill"]; },
};

const handful = {
  id: "mo-handful",
  group: "money-know",
  label: "What is it worth?",
  blurb: "A handful of money to count up.",
  heading: "Count the money",
  instruction: () => "Add up what is there. Write it the way money is written, like 4.50.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const t = tier(o);
    const max = t === "gentle" ? 900 : t === "middle" ? 2500 : 9900;
    const min = t === "gentle" ? 105 : 150;
    return { coins: r.int(min, max) };
  },
  render(item) {
    return art(moneySvg(item.coins)) + ask(`That is ${box()} altogether.`);
  },
  worked() {
    return worked(art(moneySvg(1270))
      + say(`A 10 prepbill, a 2 prepbill, a 50 prepcoin and a 20 prepcoin. `
        + `Ten and two is twelve prepbills; fifty and twenty is seventy prepcoins. `
        + `${sayAmount(1270)} — written 12.70.`));
  },
  key(item) { return [money(item.coins)]; },
  answer(item) { return [priceHtml(item.coins)]; },
};

const makeIt = {
  id: "mo-make",
  group: "money-know",
  label: "Pay it exactly",
  blurb: "The fewest pieces that make an amount.",
  heading: "Pay the exact money",
  instruction: () =>
    "Write which pieces you would hand over, using as FEW as you can. "
    + "Take the biggest that fits, then the biggest that fits what is left.",
  cols: 2,
  defaultCount: 5,
  make(r, o) {
    const t = tier(o);
    return { coins: r.int(t === "gentle" ? 110 : 165, t === "gentle" ? 800 : t === "middle" ? 2400 : 7500) };
  },
  render(item) {
    return lead(`<b>${priceHtml(item.coins)}</b>`)
      /* On screen the money is REAL: take the pieces out of the tray and lay
         them out until the purse says what the question says. On paper the
         tray is a tray and the space under it is somewhere to draw. Either
         way the counting is the child's — the purse says what is lying there
         and nothing else. */
      + purse({ say: `take out ${priceHtml(item.coins)}`, mm: 34 })
      + ask(`How many pieces? ${box()}`)
      /* a LINE and not a box: a list of pieces is writing, and a box the size
         of an answer tells a child to put one thing in it */
      + ask(`Write them: <span class="wb-line wb-line--lg"></span>`);
  },
  worked() {
    const pieces = payWith(1385);
    return worked(lead(`<b>${priceHtml(1385)}</b>`)
      + art(moneySvg(1385))
      + say(`A 10 prepbill leaves 3.85. A 2 prepbill leaves 1.85. A 1 prepbill leaves 0.85. `
        + `Then 50, 20, 10 and 5 prepcoins. ${pieces.length} pieces.`));
  },
  key(item) {
    /* how many pieces is marked; WHICH pieces is written out and read by eye —
       there are too many right ways to write a list for a box to judge it */
    return [want.num(payWith(item.coins).length), want.free()];
  },
  answer(item) {
    return [payWith(item.coins).map((p) => `${p.value} ${p.kind === "bill" ? "prepbill" : "prepcoin"}`).join(", ")];
  },
};

/* ═══ at the shop — no discount ════════════════════════════════════════════*/

const oneLine = {
  id: "mo-shop-line",
  group: "money-shop",
  label: "So many at that each",
  blurb: "One thing, bought more than once.",
  heading: "At the shop",
  instruction: () => "Multiply what one costs by how many are bought.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    return { good: r.pick(GOOD_NAMES), colour: r.int(0, 5), n: howMany(r, o), price: priceOf(r, o) };
  },
  render(item) {
    return storeHtml([item], { withQty: false })
      + ask(`${item.n} ${goodName(item.good)}${item.n === 1 ? "" : "s"} at ${priceHtml(item.price)} each.`)
      + ask(`That comes to ${box()}`);
  },
  worked() {
    return worked(storeHtml([{ good: "apple", colour: 2, price: 150 }], { withQty: false })
      + say("4 apples at 1.50 each. 4 × 1.50: four lots of one prepbill is 4.00, "
        + "four lots of fifty prepcoins is 200 prepcoins, which is 2.00. Altogether 6.00."));
  },
  key(item) { return [money(item.n * item.price)]; },
  answer(item) { return [`${item.n} × ${priceHtml(item.price)} = ${priceHtml(item.n * item.price)}`]; },
};

const atTheTill = {
  id: "mo-shop-till",
  group: "money-shop",
  label: "The whole basket",
  blurb: "A shelf, a basket and a till to add up.",
  heading: "At the till",
  instruction: () =>
    "Work out what each line comes to, then add the lines up for the total. "
    + "Then count the change out of what was handed over.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const lines = basket(r, o, tier(o) === "gentle" ? 2 : 3);
    return { lines, paid: roundUpPiece(totalOf(lines)) };
  },
  render(item) {
    return storeHtml(item.lines)
      + tillHtml(item.lines, { paid: item.paid, box })
      /* and the money to pay with: lay out what was handed over, take the
         price off it, and what is left on the mat IS the change. A child who
         has counted change out of a purse has done the subtraction with their
         hands before they do it in the box above. */
      + purse({ say: `pay with ${priceHtml(item.paid)}, and count the change`, mm: 34 });
  },
  worked() {
    const lines = [
      { good: "loaf", colour: 0, n: 2, price: 250 },
      { good: "apple", colour: 2, n: 3, price: 150 },
    ];
    return worked(tillHtml(lines, { answer: true, paid: 1500 })
      + say("2 loaves at 2.50 is 5.00. 3 apples at 1.50 is 4.50. Together 9.50. "
        + "Out of a 10 prepbill and a 5 prepbill — 15.00 — the change is 5.50."));
  },
  key(item) {
    /* the boxes in the order the till prints them: a line at a time down the
       page, then the total, then the change */
    return item.lines.map((l) => money(l.n * l.price))
      .concat([money(totalOf(item.lines)), money(item.paid - totalOf(item.lines))]);
  },
  answer(item) {
    const t = totalOf(item.lines);
    return [`total ${priceHtml(t)}, change ${priceHtml(item.paid - t)}`];
  },
};

/* ═══ in the sale — with a discount ════════════════════════════════════════*/

const oneTag = {
  id: "mo-sale-tag",
  group: "money-sale",
  label: "What does the sale tag say?",
  blurb: "A price with a percentage off it.",
  heading: "In the sale",
  instruction: () =>
    "Take the percentage OFF the old price. Work out what comes off first, then take it away.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const off = rateOf(r, o);
    return { good: r.pick(GOOD_NAMES), colour: r.int(0, 5), was: saleWas(r, o, off), off };
  },
  render(item) {
    return storeHtml([{ ...item, price: item.was }], { withQty: false })
      + ask(`The shop takes <b>${item.off}%</b> off.`)
      + ask(`What comes off? ${box()}`)
      + ask(`So the sale price is ${box()}`);
  },
  worked() {
    return worked(storeHtml([{ good: "shirt", colour: 4, price: 2000 }], { withQty: false })
      + say("25% off 20.00. A quarter of 20.00 is 5.00, so 5.00 comes off. "
        + "20.00 − 5.00 = 15.00 — and the new tag should say 15.00."));
  },
  key(item) {
    const off = percentOf(item.was, item.off);
    return [money(off), money(item.was - off)];
  },
  answer(item) {
    const off = percentOf(item.was, item.off);
    return [`${item.off}% of ${priceHtml(item.was)} is ${priceHtml(off)}; sale price ${priceHtml(item.was - off)}`];
  },
};

const checkTheShop = {
  id: "mo-sale-check",
  group: "money-sale",
  label: "Is the shop right?",
  blurb: "A sale tag with both prices on it — check the shop's arithmetic.",
  heading: "Check the sale tag",
  instruction: () =>
    "The tag shows the old price, the percentage off and the new price. "
    + "Work out what the new price SHOULD be, then say whether the shop has it right.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const off = rateOf(r, o);
    const was = saleWas(r, o, off);
    const right = was - percentOf(was, off);
    /* half of them are wrong, and wrong in the way shops are wrong: the
       percentage taken off twice, or the percentage written as the price */
    const fiddle = r.chance(0.5);
    const shown = !fiddle ? right
      : r.chance(0.5) ? right - percentOf(right, off) : percentOf(was, off);
    return { good: r.pick(GOOD_NAMES), colour: r.int(0, 5), was, off, shown, right };
  },
  render(item) {
    return `<div class="mo-store">` + productCard(item, { tag: tagSvg(item.shown, { was: item.was, off: item.off }) }) + `</div>`
      + ask(`What should the new price be? ${box()}`)
      + ask(`Has the shop got it right — yes or no? ${box()}`);
  },
  worked() {
    return worked(`<div class="mo-store">` + productCard({ good: "book", colour: 1 }, { tag: tagSvg(600, { was: 800, off: 10 }) }) + `</div>`
      + say("10% of 8.00 is 0.80, so the sale price should be 7.20. The tag says 6.00. "
        + "No — the shop has taken too much off, which is lucky for you and bad for them."));
  },
  key(item) {
    return [money(item.right), want.words(item.shown === item.right ? "yes" : "no")];
  },
  answer(item) {
    return [`${priceHtml(item.right)} — the tag is ${item.shown === item.right ? "right" : "wrong"}`];
  },
};

/* ═══ the bank — simple interest ═══════════════════════════════════════════*/

/**
 * The rule a bank does to your money, written as a train of jobs.
 *
 * The IN card is left EMPTY on purpose. A train whose IN is already filled in
 * is a picture; one that is empty is a machine you can use — the workbook's
 * interactive mode mounts any `data-ride` train (machine.js), so a child types
 * a number on the card and drags it through × rate ÷ 100 a coach at a time,
 * which is what a rate of interest is. On paper it is the same picture with a
 * space to write the money in.
 */
const interestTrain = (rate) => trainHtml({ given: [`*${rate}`, "/100"], inVal: null, outVal: null });

const simple = {
  id: "mo-simple",
  group: "money-bank",
  label: "Simple interest",
  blurb: "Money paid in, the same interest every year.",
  heading: "The bank: simple interest",
  instruction: () =>
    "The bank pays the SAME interest every year, worked out on what you paid in. "
    + "Send the money through the machine for one year's interest, then multiply by the years.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const rate = rateOf(r, o);
    const bills = { gentle: r.int(1, 6) * 100, middle: r.int(2, 9) * 50, stretch: r.int(3, 19) * 25 }[tier(o)];
    return { principal: bills * 100, rate, years: r.int(2, tier(o) === "gentle" ? 3 : 5) };
  },
  render(item) {
    const oneYear = percentOf(item.principal, item.rate);
    return art(bankSvg())
      + lead(`<b>${priceHtml(item.principal)}</b> is paid in at <b>${item.rate}%</b> a year, `
        + `and left for <b>${item.years} years</b>.`)
      + art(interestTrain(item.rate))
      + ask(`One year's interest: ${box()}`)
      + ask(`${item.years} years' interest: ${box()}`)
      + ask(`So altogether the bank hands back ${box()}`)
      + (oneYear ? "" : "");
  },
  worked() {
    return worked(art(bankSvg())
      + lead("<b>100.00</b> is paid in at <b>5%</b> a year, and left for <b>3 years</b>.")
      + art(interestTrain(5))
      + say("5% of 100.00 — 100.00 × 5 ÷ 100 — is 5.00 of interest in one year. "
        + "Three years is 3 × 5.00 = 15.00. The bank hands back 100.00 + 15.00 = 115.00."));
  },
  key(item) {
    const one = percentOf(item.principal, item.rate);
    const all = simpleInterest(item.principal, item.rate, item.years);
    return [money(one), money(all), money(item.principal + all)];
  },
  answer(item) {
    const all = simpleInterest(item.principal, item.rate, item.years);
    return [`interest ${priceHtml(all)}, back ${priceHtml(item.principal + all)}`];
  },
};

/* ═══ the bank — compound interest ═════════════════════════════════════════*/

const compound = {
  id: "mo-compound",
  group: "money-grow",
  label: "Compound interest",
  blurb: "The interest joins the money and earns interest itself.",
  heading: "The bank: compound interest",
  instruction: () =>
    "This time the interest STAYS IN the bank, so next year's interest is worked out on "
    + "the bigger amount. Fill in a line for each year: what is in there, what it earns, "
    + "what it comes to. Each year starts where the last one ended.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const rate = r.pick({ gentle: [10, 50], middle: [10, 20, 25], stretch: [5, 10, 12, 20] }[tier(o)]);
    const bills = { gentle: r.int(1, 4) * 100, middle: r.int(1, 8) * 100, stretch: r.int(2, 12) * 100 }[tier(o)];
    return { principal: bills * 100, rate, years: tier(o) === "gentle" ? 2 : 3 };
  },
  render(item) {
    const rows = Array.from({ length: item.years }, (_, i) =>
      `<tr><td>Year ${i + 1}</td><td>${i === 0 ? priceHtml(item.principal) : box()}</td>`
      + `<td>${box()}</td><td>${box()}</td></tr>`).join("");
    return art(bankSvg({ name: "PREP BANK" }))
      + lead(`<b>${priceHtml(item.principal)}</b> is paid in at <b>${item.rate}%</b> a year `
        + `and LEFT THERE for <b>${item.years} years</b>.`)
      + art(interestTrain(item.rate))
      + `<table class="mo-years"><thead><tr><th>Year</th><th>In the bank</th>`
      + `<th>Interest it earns</th><th>Comes to</th></tr></thead><tbody>${rows}</tbody></table>`
      + ask(`After ${item.years} years the bank hands back ${box()}`);
  },
  worked() {
    const yrs = compoundYears(10000, 10, 3);
    const rows = yrs.map((y) =>
      `<tr><td>Year ${y.year}</td><td>${priceHtml(y.start)}</td>`
      + `<td><b>${priceHtml(y.earned)}</b></td><td><b>${priceHtml(y.end)}</b></td></tr>`).join("");
    return worked(lead("<b>100.00</b> paid in at <b>10%</b> a year, left for <b>3 years</b>.")
      + `<table class="mo-years"><thead><tr><th>Year</th><th>In the bank</th>`
      + `<th>Interest it earns</th><th>Comes to</th></tr></thead><tbody>${rows}</tbody></table>`
      + say("Year 1 earns 10.00, the same as simple interest would. But that 10.00 stays in, "
        + "so year 2 earns 10% of 110.00 — 11.00 — and year 3 earns 10% of 121.00. "
        + "133.10 altogether, where simple interest would have given 130.00."));
  },
  key(item) {
    const yrs = compoundYears(item.principal, item.rate, item.years);
    const out = [];
    yrs.forEach((y, i) => {
      if (i) out.push(money(y.start));          // year 1's start is printed for them
      out.push(money(y.earned));
      out.push(money(y.end));
    });
    out.push(money(yrs.at(-1).end));
    return out;
  },
  answer(item) {
    const yrs = compoundYears(item.principal, item.rate, item.years);
    return [`${priceHtml(yrs.at(-1).end)} (simple interest would give `
      + `${priceHtml(item.principal + simpleInterest(item.principal, item.rate, item.years))})`];
  },
};

/* ═══ government and taxes ═════════════════════════════════════════════════*/

const atTheTillTax = {
  id: "mo-tax-vat",
  group: "money-tax",
  label: "Tax added at the till",
  blurb: "The price on the shelf, and the price you actually pay.",
  heading: "Tax at the till",
  instruction: () =>
    "The government adds a tax to what you buy. Work out the tax on the bill, "
    + "then what there is to pay altogether.",
  cols: 2,
  defaultCount: 5,
  make(r, o) {
    const lines = basket(r, o, 2);
    return { lines, rate: r.pick(tier(o) === "gentle" ? [10, 50] : [5, 10, 15]) };
  },
  render(item) {
    const t = totalOf(item.lines);
    return `<p class="wb-ask wb-ask--lead">The shopping comes to <b>${priceHtml(t)}</b>.</p>`
      + ask(`Tax is <b>${item.rate}%</b> of that. The tax is ${box()}`)
      + ask(`So there is ${box()} to pay altogether.`);
  },
  worked() {
    return worked(lead("The shopping comes to <b>40.00</b>, and tax is <b>10%</b>.")
      + say("10% of 40.00 is 4.00 of tax. 40.00 + 4.00 = 44.00 to pay. "
        + "The 4.00 does not go to the shop — it goes to the government, which is why "
        + "the shelf said 40.00 and the till said 44.00."));
  },
  key(item) {
    const t = totalOf(item.lines);
    const tax = percentOf(t, item.rate);
    return [money(tax), money(t + tax)];
  },
  answer(item) {
    const t = totalOf(item.lines);
    const tax = percentOf(t, item.rate);
    return [`tax ${priceHtml(tax)}, to pay ${priceHtml(t + tax)}`];
  },
};

const offTheWage = {
  id: "mo-tax-wage",
  group: "money-tax",
  label: "Tax taken off a wage",
  blurb: "What is earned, what is taken, and what is left to take home.",
  heading: "Tax on what you earn",
  instruction: () =>
    "Tax is taken OFF what somebody earns before they are paid. Work out the tax, "
    + "then what is left to take home.",
  cols: 2,
  defaultCount: 5,
  make(r, o) {
    const bills = { gentle: r.int(2, 8) * 50, middle: r.int(4, 16) * 25, stretch: r.int(6, 30) * 20 }[tier(o)];
    return { wage: bills * 100, rate: r.pick(tier(o) === "gentle" ? [10, 50] : [5, 10, 20, 25]) };
  },
  render(item) {
    return lead(`A month's wage is <b>${priceHtml(item.wage)}</b>, and <b>${item.rate}%</b> of it is taken in tax.`)
      + ask(`The tax is ${box()}`)
      + ask(`So the take-home pay is ${box()}`);
  },
  worked() {
    return worked(lead("A month's wage is <b>500.00</b>, and <b>20%</b> of it is taken in tax.")
      + say("20% of 500.00: a tenth is 50.00, so a fifth is 100.00. That is the tax. "
        + "500.00 − 100.00 = 400.00 to take home — and the 100.00 pays for the roads, "
        + "the hospital and the school."));
  },
  key(item) {
    const tax = percentOf(item.wage, item.rate);
    return [money(tax), money(item.wage - tax)];
  },
  answer(item) {
    const tax = percentOf(item.wage, item.rate);
    return [`tax ${priceHtml(tax)}, take home ${priceHtml(item.wage - tax)}`];
  },
};

/* ── the registry ──────────────────────────────────────────────────────────*/

export const MONEY_EXERCISES = [
  theMoney, handful, makeIt,
  oneLine, atTheTill,
  oneTag, checkTheShop,
  simple,
  compound,
  atTheTillTax, offTheWage,
];
