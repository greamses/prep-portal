/* ============================================================================
   Maths Workbook — CHAPTER 8: Prime factors
   ----------------------------------------------------------------------------
   THE WHOLE CHAPTER IS ONE QUESTION ASKED HARDER AND HARDER: what is this
   number made of?

     A  can it be grouped      blocks pushed into equal rows. Some numbers go
                               and some will not, and that is the fact the word
                               "prime" is invented for. No words yet — blocks.
     B  composite or not       now the words, on numbers they have handled
     C  strike the primes      a grid gone over by hand, which is how everybody
                               who has ever known the primes came to know them
     D  list the factors       every number that divides it, in order — and the
                               pairs that make them, which is why they come two
                               at a time until the square root
     E  factor tree            split it, split what you got, keep going until
                               nothing will split. Twice: once with the numbers
                               given to drag into place, once building it
                               yourself
     F  table factoring        the same work as a ladder, which is the form you
                               can do at speed and the form that never forgets
                               a factor
     G  product of primes      write what you found as a multiplication
     H  in index form          and write THAT shorter, with indices
     I  how many factors       and now the payoff: the index form counts the
                               factors without listing one of them

   WHY THE TREE IS NOT MARKED BY POSITION. 36 splits as 4 × 9 or 6 × 6 or
   2 × 18, and every one of them ends on 2 × 2 × 3 × 3. That is the theorem —
   the fundamental theorem of arithmetic — and a page that insisted on one
   "right" tree would be teaching the opposite of it. So a tree is marked by
   the rule: every split multiplies to the number above it, and every branch
   ends on a prime (factortree.js → treeRight).

   THE NUMBERS ARE CHOSEN, not random. A number whose prime factors are all
   different teaches nothing about indices; one that is 2 × 2 × 2 × 2 teaches
   nothing about several primes. `pickNumber` keeps both kinds on the page.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import {
  isPrime, primesOf, indexOf_, factorCount, factorsOf, treeOf, treeHtml, ringOf,
} from "/utils/components/workbook/factortree.js";
import { regroupHtml } from "/utils/components/workbook/regroup.js";
import { strikeHtml } from "/utils/components/workbook/strike.js";
import { arrayOf, ladder, ladderKey } from "./primeart.js";
import { levelOf } from "./ex-remainder.js";

/* ── the paper's furniture ───────────────────────────────────────────────── */

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const lead = (html) => `<p class="wb-ask wb-ask--lead">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask rw-worked__say">${html}</p>`;

export const PRIME_GROUPS = [
  { id: "pf-group", chapter: "Chapter 8 · Prime factors", label: "Can it be grouped?", blurb: "Push the blocks into equal rows. Some numbers will not go." },
  { id: "pf-composite", label: "Prime or composite?", blurb: "The two words for the two kinds of number." },
  { id: "pf-strike", label: "Strike out the primes", blurb: "Go along the grid by hand and cross every one out." },
  { id: "pf-factors", label: "List the factors", blurb: "Every number that divides it, in pairs, in order." },
  { id: "pf-tree", label: "Factor tree", blurb: "Split it, split what you got, and keep going until nothing will split." },
  { id: "pf-ladder", label: "Table factoring", blurb: "The same work as a ladder: divide by the smallest prime that goes." },
  { id: "pf-product", label: "Product of prime factors", blurb: "Write what you found as one multiplication." },
  { id: "pf-index", label: "In index form", blurb: "2 × 2 × 3 × 5 written shorter: 2² × 3 × 5." },
  { id: "pf-count", label: "How many factors?", blurb: "The index form counts them without listing one." },
];

/* ── which numbers a level uses ──────────────────────────────────────────── */

/* Every number here is chosen, and each list holds both kinds: numbers with a
   repeated prime (so indices have something to say) and numbers whose primes
   are all different (so the index form is not mistaken for a rule that every
   number has a little 2 in it). */
const POOL = {
  gentle: { small: [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20], tree: [12, 16, 18, 20, 24, 28, 30], big: [24, 30, 36, 40] },
  middle: { small: [12, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28], tree: [36, 40, 42, 44, 45, 48, 50, 54], big: [48, 60, 72, 84, 90] },
  stretch: { small: [26, 27, 28, 32, 33, 34, 35, 36, 38, 39, 44, 45, 49], tree: [56, 60, 64, 72, 80, 84, 90, 96, 100], big: [96, 120, 144, 180, 200, 216] },
};
const poolOf = (o, which) => POOL[levelOf(o).id]?.[which] || POOL.gentle[which];

/* a prime near the level's numbers, for the questions that need one */
const PRIMES = {
  gentle: [2, 3, 5, 7, 11, 13, 17, 19],
  middle: [11, 13, 17, 19, 23, 29, 31, 37],
  stretch: [23, 29, 31, 37, 41, 43, 47, 53, 59, 61],
};
const primesFor = (o) => PRIMES[levelOf(o).id] || PRIMES.gentle;

/** Numbers said the way a child writes them: 2 × 2 × 3 × 5. */
const asProduct = (n) => primesOf(n).join(" × ");
/** …and with indices, as HTML: 2² × 3 × 5. */
const asIndex = (n) => indexOf_(n).map(([p, k]) => (k > 1 ? `${p}<sup>${k}</sup>` : `${p}`)).join(" × ");
const asIndexPlain = (n) => indexOf_(n).map(([p, k]) => (k > 1 ? `${p}^${k}` : `${p}`)).join(" × ");

/* ═══ A. can it be grouped? ════════════════════════════════════════════════
   Blocks, and nothing else. A number that can be pushed into equal rows of
   more than one is made of those rows; a number that cannot is a number that
   is only itself, and that is what a prime IS. The word comes in section B,
   once the child has met the thing. */

const pfGroup = {
  id: "pf-group",
  group: "pf-group",
  label: "Push them into rows",
  blurb: "Can these blocks be put into equal rows of more than one?",
  heading: "Can it be grouped?",
  instruction: () =>
    "Here are the blocks of a number, all in one row. Can you push them into <b>equal rows</b>, with more than "
    + "one in each row and none left over? On screen the two arrows push the blocks into the next shape they "
    + "will make, the way a falling brick drops into a row; on paper, ring the rows you would make. Then write "
    + "what you did. Some numbers will not go at all — the arrows will not move them, and those are the "
    + "interesting ones.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    /* two that go and one that will not, so both answers are met */
    const goes = i % 3 !== 2;
    const n = goes ? r.pick(poolOf(o, "small").filter((v) => !isPrime(v)))
      : r.pick(primesFor(o).filter((v) => v > 4 && v < 30)) || 13;
    return { n, goes: !isPrime(n) };
  },
  render(item) {
    return lead(`<b>${item.n}</b> blocks`)
      + `<div class="rw-art">${regroupHtml({ n: item.n, label: `${item.n} blocks to push into rows` })}</div>`
      + ask(`Can they be put into equal rows of more than one? ${tick("yes", "no")}`)
      + ask(`If they can: ${box()} rows of ${box()}.`);
  },
  worked() {
    return worked(lead("<b>12</b> blocks")
      + `<div class="rw-art">${arrayOf(12, 4)}</div>`
      + say("Twelve goes: <b>3 rows of 4</b>. (It would also go 2 rows of 6, or 4 rows of 3 — any of them is a right "
        + "answer.) Thirteen will not go at all: whatever you try, there is one left over or there is only the one "
        + "long row. A number that will not go is called a <b>prime</b>."));
  },
  key(item) {
    /* the pair is marked as one thing: half a factor pair is not half right */
    return item.goes
      ? [want.tick(0), want.pair({ product: item.n, says: `any two numbers over 1 that multiply to ${item.n}` })]
      : [want.tick(1), want.free(), want.free()];
  },
  answer(item) {
    if (!item.goes) return [`${item.n} will not go — it is prime`];
    const f = factorsOf(item.n).filter((v) => v > 1 && v < item.n);
    return [`${item.n} goes, e.g. ${f[0]} rows of ${item.n / f[0]}`];
  },
};

/* ═══ B. prime or composite? ══════════════════════════════════════════════ */

const pfComposite = {
  id: "pf-composite",
  group: "pf-composite",
  label: "Prime or composite",
  blurb: "Five numbers. Which are only themselves?",
  heading: "Prime or composite?",
  instruction: () =>
    "A <b>prime</b> number has exactly two factors: 1 and itself. Everything else with more than two is "
    + "<b>composite</b> — it is <i>composed</i>, made up, of smaller numbers multiplied together. Tick which each "
    + "one is. (1 is neither: it has only one factor.)",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const comp = r.shuffle(poolOf(o, "small").slice()).slice(0, 3);
    const prime = r.shuffle(primesFor(o).slice()).slice(0, 2);
    return { ns: r.shuffle(comp.concat(prime)) };
  },
  render(item) {
    return `<table class="pf-table wb-nomath"><tbody>${item.ns.map((n) =>
      `<tr><td class="pf-table__n">${n}</td><td>${tick("prime", "composite")}</td></tr>`).join("")}</tbody></table>`;
  },
  worked() {
    return worked(say("<b>17</b> is <b>prime</b>: nothing divides it but 1 and 17. <b>18</b> is <b>composite</b>: "
      + "2 goes into it, and so do 3, 6 and 9. The quickest test for the numbers on this page is to try 2, 3, 5 "
      + "and 7 — if none of them goes, and the number is under 100, it is prime."));
  },
  key(item) {
    return item.ns.map((n) => want.tick(isPrime(n) ? 0 : 1));
  },
  answer(item) {
    return item.ns.map((n) => `${n}: ${isPrime(n) ? "prime" : "composite"}`);
  },
};

/* ═══ C. strike out the primes ════════════════════════════════════════════
   By hand, along the grid. Nobody remembers a list of primes they were given;
   everybody remembers the ones they crossed out themselves. */

const pfStrike = {
  id: "pf-strike",
  group: "pf-strike",
  label: "Strike out the primes",
  blurb: "Go along the grid and cross every prime.",
  heading: "Strike out the primes",
  instruction: () =>
    "Go along the grid and strike out every <b>prime</b>. Work along the rows, not down: try 2, then 3, then 5, "
    + "then 7 on each number, and if none of them goes into it, that number is prime. Take your time — this is the "
    + "exercise everybody who knows the primes did once.",
  cols: 1,
  defaultCount: 1,
  make(r, o) {
    const size = { gentle: 20, middle: 30, stretch: 50 }[levelOf(o).id] ?? 20;
    const from = 2;
    const ns = [];
    for (let v = from; v < from + size; v++) ns.push(v);
    return { ns, cols: size > 24 ? 10 : 5 };
  },
  render(item) {
    return strikeHtml({ numbers: item.ns, cols: item.cols, label: "a grid of numbers to strike the primes out of" });
  },
  worked() {
    const ns = [];
    for (let v = 2; v <= 11; v++) ns.push(v);
    return worked(strikeHtml({ numbers: ns, cols: 10, answer: true, struck: ns.filter(isPrime) })
      + say("2, 3, 5, 7 and 11 are struck: nothing divides any of them but 1 and itself. 4, 6, 8 and 10 all have 2 "
        + "in them, and 9 has 3 — so they stay."));
  },
  key(item) {
    const ps = item.ns.filter(isPrime);
    return [want.strike({ numbers: ps, says: `${ps.join(", ")} struck out` })];
  },
  answer(item) {
    return [item.ns.filter(isPrime).join(", ")];
  },
};

/* ═══ D. list the factors ═════════════════════════════════════════════════ */

const pfFactors = {
  id: "pf-factors",
  group: "pf-factors",
  label: "List the factors",
  blurb: "Every number that divides it, in order.",
  heading: "List the factors",
  instruction: () =>
    "A <b>factor</b> of a number is a number that divides it with nothing left over. Write them all, smallest "
    + "first. They come in PAIRS — 1 with the number itself, 2 with its half, and so on — so hunt in pairs and you "
    + "will not miss one. (You can stop looking when the pair meets in the middle.)",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    return { n: r.pick(poolOf(o, i === 0 ? "small" : "big")) };
  },
  render(item) {
    const fs = factorsOf(item.n);
    return lead(`The factors of <b>${item.n}</b>`)
      + `<p class="pf-slots">${fs.map(() => box()).join("")}</p>`
      + ask(`So ${item.n} has ${box()} factors altogether.`);
  },
  worked() {
    return worked(lead("The factors of <b>18</b>")
      + say("Hunt in pairs: 1 × 18, 2 × 9, 3 × 6. Then 4 does not go, and 5 does not go, and by 6 the pair has met "
        + "itself — so we are finished. <b>1, 2, 3, 6, 9, 18</b>, and that is <b>6</b> factors."));
  },
  key(item) {
    const fs = factorsOf(item.n);
    return [want.set(...fs), want.num(fs.length)];
  },
  answer(item) {
    const fs = factorsOf(item.n);
    return [`${fs.join(", ")} — ${fs.length} factors`];
  },
};

/* ═══ E. the factor tree ══════════════════════════════════════════════════
   Two exercises from one picture, because they are two different skills:
   putting given numbers where they belong, and finding the numbers. */

function treeEx(id, mode, label, count) {
  const drag = mode === "drag";
  return {
    id,
    group: "pf-tree",
    label,
    blurb: drag
      ? "The numbers are given: put each one where it belongs."
      : "Split it yourself, and keep splitting until nothing will split.",
    heading: `Factor tree — ${drag ? "put them in place" : "grow it yourself"}`,
    instruction: () =>
      "Split the number into two things that multiply to it, then split those, and keep going until every branch "
      + "ends on a <b>prime</b>. "
      + (drag
        ? "On screen, tap a circle and the numbers that go into IT swing out and stand round it — drag two of "
          + "them into the circles underneath. Tap a prime and nothing swings out, because nothing goes into it. "
          + "On paper the numbers that go into the top one are printed under the tree. There is more than one "
          + "way to make the tree, so put them where they make sense."
        : "On screen, tap a circle to split it into two, and type the two numbers. Tap it again to change your "
          + "mind. On paper, write in the rings. Any tree is right as long as every pair multiplies to the number "
          + "above it and every branch ends on a prime.")
      + " That is the surprise of this chapter: whichever way you split it, you end on the same primes.",
    cols: 1,
    defaultCount: count,
    make(r, o, k, i) {
      const n = r.pick(poolOf(o, "tree"));
      return { n, shape: treeOf(n) };
    },
    render(item) {
      const shape = treeOf(item.n);
      /* on paper, the numbers that go into the TOP circle are printed under
         the tree; on screen they swing out of whichever circle is tapped */
      const chips = drag ? ringOf(item.n) : null;
      return lead(`<b>${item.n}</b>`)
        + treeHtml({ tree: drag ? shape : { v: item.n, kids: null }, mode, chips, label: `a factor tree of ${item.n}` });
    },
    worked() {
      return worked(treeHtml({ tree: treeOf(36), answer: true })
        + say("36 is 6 × 6. Each 6 is 2 × 3, and 2 and 3 will not split — they are prime, so those branches stop. "
          + "Split it as 4 × 9 instead and you get 2 × 2 and 3 × 3: the same four primes, in a different order. "
          + "That always happens, and it is the reason this chapter exists."));
    },
    key(item) {
      return [want.tree({ n: item.n, says: `${item.n} = ${asProduct(item.n)}` })];
    },
    answer(item) {
      return [`${item.n} = ${asProduct(item.n)}`];
    },
  };
}

/* ═══ F. table factoring ══════════════════════════════════════════════════ */

const pfLadder = {
  id: "pf-ladder",
  group: "pf-ladder",
  label: "The factor ladder",
  blurb: "Divide by the smallest prime that goes, again and again.",
  heading: "Table factoring",
  instruction: () =>
    "The tree drawn as a ladder, and it is quicker. Write the smallest prime that goes into the number on the "
    + "left, and what is left after dividing underneath. Do it again with that. Keep going until you reach "
    + "<b>1</b> — and the primes down the left-hand side are what the number is made of.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    return { n: r.pick(poolOf(o, i === 0 ? "tree" : "big")) };
  },
  render(item) {
    return lead(`<b>${item.n}</b>`) + `<div class="rw-art">${ladder(item.n)}</div>`;
  },
  worked() {
    return worked(lead("<b>60</b>")
      + `<div class="rw-art">${ladder(60, { answer: true })}</div>`
      + say("2 goes into 60, leaving 30. 2 goes into 30, leaving 15. 2 will not go into 15 and 3 will, leaving 5. "
        + "5 goes into 5, leaving 1 — and we stop. Down the left: <b>2, 2, 3, 5</b>."));
  },
  key(item) {
    return ladderKey(item.n).map((e) => (e.kind === "by" ? want.num(e.value) : want.cell(e.value)));
  },
  answer(item) {
    return [`${item.n} = ${asProduct(item.n)}`];
  },
};

/* ═══ G. product of prime factors ═════════════════════════════════════════ */

const pfProduct = {
  id: "pf-product",
  group: "pf-product",
  label: "Write it as a product",
  blurb: "60 = 2 × 2 × 3 × 5.",
  heading: "Product of prime factors",
  instruction: () =>
    "Now write what the tree or the ladder found, as one multiplication: the primes, smallest first, with × "
    + "between them. Every number has exactly one of these — nobody else's answer can be different from yours "
    + "unless one of you is wrong.",
  cols: 2,
  defaultCount: 3,
  make(r, o, k, i) {
    return { n: r.pick(poolOf(o, i % 2 ? "big" : "tree")) };
  },
  render(item) {
    const ps = primesOf(item.n);
    return `<p class="wb-ask wb-ask--lead"><b>${item.n}</b> = ${ps.map(() => box()).join(" × ")}</p>`;
  },
  worked() {
    return worked(say("<b>60</b> = <b>2 × 2 × 3 × 5</b>. Write the primes in order, smallest first, and put every "
      + "one of them in — the two 2s are two different factors and both belong."));
  },
  key(item) {
    return primesOf(item.n).map((p) => want.num(p));
  },
  answer(item) {
    return [`${item.n} = ${asProduct(item.n)}`];
  },
};

/* ═══ H. index form ═══════════════════════════════════════════════════════ */

const pfIndex = {
  id: "pf-index",
  group: "pf-index",
  label: "Write it in index form",
  blurb: "2 × 2 × 3 × 5 written shorter: 2² × 3 × 5.",
  heading: "In index form",
  instruction: () =>
    "A prime that appears more than once is written with an <b>index</b> — a little number up in the corner "
    + "saying how many of them there are. 2 × 2 × 3 × 5 becomes 2² × 3 × 5. Write the base in the big box and how "
    + "many of it in the small one. A prime that appears once has an index of 1, and nobody writes it.",
  cols: 1,
  defaultCount: 2,
  hardest: true,
  make(r, o, k, i) {
    /* a number with a repeated prime, or the index form has nothing to do */
    const pool = poolOf(o, i === 0 ? "tree" : "big").filter((v) => indexOf_(v).some(([, k2]) => k2 > 1));
    return { n: r.pick(pool.length ? pool : [24, 36, 48]) };
  },
  render(item) {
    const parts = indexOf_(item.n);
    return lead(`<b>${item.n}</b> = ${asProduct(item.n)}`)
      + `<p class="wb-ask">In index form: ${item.n} = `
      + parts.map(() => `<span class="pf-power">${box()}<span class="pf-power__i">${box()}</span></span>`).join(" × ")
      + `</p>`;
  },
  worked() {
    return worked(say("<b>60</b> = 2 × 2 × 3 × 5 = <b>2² × 3 × 5</b>. There are two 2s, so the 2 carries an index "
      + "of 2; the 3 and the 5 appear once each, so their index is 1 and it is left off. The little number counts "
      + "HOW MANY of that prime — it does not multiply it, and 2² is 4, never 22."));
  },
  key(item) {
    const out = [];
    indexOf_(item.n).forEach(([p, k]) => { out.push(want.num(p)); out.push(want.num(k)); });
    return out;
  },
  answer(item) {
    return [`${item.n} = ${asIndexPlain(item.n)}`];
  },
};

/* ═══ I. how many factors ═════════════════════════════════════════════════ */

const pfCount = {
  id: "pf-count",
  group: "pf-count",
  label: "How many factors?",
  blurb: "Add one to each index and multiply — no listing.",
  heading: "How many factors are in a number?",
  instruction: () =>
    "Here is what the index form is FOR. Every factor of a number is made by taking some of its primes: none of "
    + "them, one of them, two of them … so a prime with an index of 2 gives you <b>3</b> choices (none, one, two). "
    + "Add one to every index and multiply the answers, and that is how many factors the number has — without "
    + "listing a single one.",
  cols: 1,
  defaultCount: 2,
  hardest: true,
  make(r, o, k, i) {
    const pool = poolOf(o, "big").filter((v) => indexOf_(v).some(([, k2]) => k2 > 1));
    return { n: r.pick(pool.length ? pool : [36, 60, 72]) };
  },
  render(item) {
    const parts = indexOf_(item.n);
    return lead(`<b>${item.n}</b> = ${asIndex(item.n)}`)
      + ask(`Add one to each index: ${parts.map(() => box()).join(" , ")}`)
      + ask(`Multiply them: ${item.n} has ${box()} factors.`)
      + ask(`Check one of them: is ${item.n > 60 ? 8 : 4} a factor of ${item.n}? ${tick("yes", "no")}`);
  },
  worked() {
    return worked(say("<b>60</b> = 2² × 3 × 5. The indices are 2, 1 and 1. Add one to each: 3, 2, 2. Multiply: "
      + "3 × 2 × 2 = <b>12</b>. And there are twelve: 1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60 — counting them "
      + "takes a minute, and the index form took a moment."));
  },
  key(item) {
    const parts = indexOf_(item.n);
    const probe = item.n > 60 ? 8 : 4;
    return parts.map(([, k]) => want.num(k + 1))
      .concat([want.num(factorCount(item.n)), want.tick(item.n % probe === 0 ? 0 : 1)]);
  },
  answer(item) {
    return [`${item.n} = ${asIndexPlain(item.n)} → ${factorCount(item.n)} factors`];
  },
};

/* ── the registry ───────────────────────────────────────────────────────── */

const pfTreeDrag = treeEx("pf-tree-drag", "drag", "Factor tree — put the numbers in place", 1);
const pfTreeGrow = treeEx("pf-tree-grow", "grow", "Factor tree — grow it yourself", 1);

export const PRIME_EXERCISES = [
  pfGroup, pfComposite, pfStrike, pfFactors,
  pfTreeDrag, pfTreeGrow,
  pfLadder, pfProduct, pfIndex, pfCount,
];
