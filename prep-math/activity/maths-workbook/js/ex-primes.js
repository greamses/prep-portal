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
     J  HCF and LCM           and the other payoff, the one this is all FOR:
                               two numbers' primes laid in two rings, and the
                               highest common factor read off the middle while
                               the lowest common multiple is read off the whole
                               picture
     K  in the shops           the same two, in the words a question is
                               actually asked in — which is where the work
                               is, because nobody is ever told which one
                               they need
     L  what squaring does     the discovery the two sections after it rest
                               on: square a number and every one of its
                               primes turns up twice as often
     M  square roots           so pair the primes off and take one out of
                               each pair
     N  cube roots             and in threes, for the same reason

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
  sharedPrimes, ownPrimes, hcfOf, lcmOf, rootOf, oddPrimes,
} from "/utils/components/workbook/factortree.js";
import { regroupHtml } from "/utils/components/workbook/regroup.js";
import { strikeHtml } from "/utils/components/workbook/strike.js";
import { arrayOf, ladder, ladderKey, vennHtml, vennParts } from "./primeart.js";
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
  { id: "pf-hcf", label: "Highest common factor", blurb: "What two numbers share: the primes they both have." },
  { id: "pf-lcm", label: "Lowest common multiple", blurb: "The smallest number both of them go into." },
  { id: "pf-venn", label: "Both, from two rings", blurb: "One picture: the middle is the HCF and the whole of it is the LCM." },
  { id: "pf-words", label: "HCF and LCM in the shops", blurb: "The hard part is knowing which one the question wants." },
  { id: "pf-why", label: "What squaring does to the primes", blurb: "Square a number and every prime turns up twice as often." },
  { id: "pf-sqroot", label: "Square roots from the primes", blurb: "Pair them off and take one out of each pair." },
  { id: "pf-cuberoot", label: "Cube roots from the primes", blurb: "The same, in threes." },
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

/* ═══ J. HCF and LCM ══════════════════════════════════════════════════════
   Everything in this chapter was for this. A child who can only find the HCF
   by listing both sets of factors and looking down them is doing arithmetic
   that falls apart at three figures; the same child with the prime factors
   does 504 and 540 in their head.

   THE PAIRS ARE CHOSEN, not taken at random. Each one shares something (an
   HCF of 1 teaches the method nothing), and no ring holds more than three
   primes — four boxes in a stack is taller than the ring it sits in, and a
   picture a child cannot read is not a picture. */

const PAIRS = {
  gentle: [[12, 18], [8, 12], [10, 15], [12, 20], [18, 24], [20, 30], [9, 15], [16, 24]],
  middle: [[24, 36], [30, 45], [28, 42], [36, 48], [40, 60], [45, 60], [27, 45], [50, 75]],
  stretch: [[84, 126], [90, 135], [126, 210], [60, 126], [100, 150], [90, 126], [84, 132], [140, 210]],
};
const pairsFor = (o) => PAIRS[levelOf(o).id] || PAIRS.gentle;

/** Two numbers written as their primes, with × between: "2 × 2 × 3". */
const primeLine = (n) => primesOf(n).join(" × ");

const pfHcf = {
  id: "pf-hcf",
  group: "pf-hcf",
  label: "Highest common factor",
  blurb: "Write both as primes, ring what they share, multiply it.",
  heading: "Highest common factor",
  instruction: () =>
    "The <b>highest common factor</b> of two numbers is the biggest number that divides them both. Write each "
    + "one as its primes, find the primes they BOTH have — counting them, so two 2s in each list means two 2s "
    + "shared — and multiply those together. Nothing else can divide both, because anything that did would be "
    + "made of primes they both have, and you have just taken all of those.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const [a, b] = r.pick(pairsFor(o));
    return { a, b };
  },
  render(item) {
    const shared = sharedPrimes(item.a, item.b);
    return lead(`<b>${item.a}</b> and <b>${item.b}</b>`)
      + ask(`${item.a} = ${primesOf(item.a).map(() => box()).join(" × ")}`)
      + ask(`${item.b} = ${primesOf(item.b).map(() => box()).join(" × ")}`)
      + ask(`What they both have: ${shared.map(() => box()).join(" × ")}`)
      + ask(`So the HCF of ${item.a} and ${item.b} is ${box()}.`);
  },
  worked() {
    return worked(lead("<b>36</b> and <b>48</b>")
      + say("36 = 2 × 2 × 3 × 3 and 48 = 2 × 2 × 2 × 2 × 3. Go along them together: they both have a 2, and both "
        + "have a second 2 — but 36 has no third 2, so the sharing stops there. They both have one 3; 36 has "
        + "another but 48 does not. So they share 2 × 2 × 3 = <b>12</b>, and 12 is the highest common factor."));
  },
  key(item) {
    return primesOf(item.a).map((p) => want.num(p))
      .concat(primesOf(item.b).map((p) => want.num(p)))
      .concat(sharedPrimes(item.a, item.b).map((p) => want.num(p)))
      .concat([want.num(hcfOf(item.a, item.b))]);
  },
  answer(item) {
    return [`HCF of ${item.a} and ${item.b} = ${sharedPrimes(item.a, item.b).join(" × ") || 1} = ${hcfOf(item.a, item.b)}`];
  },
};

const pfLcm = {
  id: "pf-lcm",
  group: "pf-lcm",
  label: "Lowest common multiple",
  blurb: "Everything they share, and everything they do not.",
  heading: "Lowest common multiple",
  instruction: () =>
    "The <b>lowest common multiple</b> is the smallest number that BOTH of them go into. Take what they share, "
    + "and then everything each of them has on top of that: the shared part is only counted once, because it is "
    + "already there. Leave any of it out and one of the two will not go in.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const [a, b] = r.pick(pairsFor(o));
    return { a, b };
  },
  render(item) {
    const parts = vennParts(item.a, item.b);
    const all = parts.left.concat(parts.mid, parts.right);
    return lead(`<b>${item.a}</b> = ${primeLine(item.a)} &nbsp;and&nbsp; <b>${item.b}</b> = ${primeLine(item.b)}`)
      + ask(`They share: ${parts.mid.map(() => box()).join(" × ")}`)
      + ask(`${item.a} also has ${parts.left.length ? parts.left.map(() => box()).join(" × ") : "nothing else"}, `
        + `and ${item.b} also has ${parts.right.length ? parts.right.map(() => box()).join(" × ") : "nothing else"}.`)
      + ask(`All of that multiplied: the LCM of ${item.a} and ${item.b} is ${box()}.`)
      + ask(`Check: does ${item.a} go into it? ${tick("yes", "no")}`);
  },
  worked() {
    return worked(lead("<b>36</b> and <b>48</b>")
      + say("They share 2 × 2 × 3 = 12. On top of that 36 has another 3, and 48 has another 2 × 2. So the LCM is "
        + "12 × 3 × 4 = <b>144</b>. Check it: 144 ÷ 36 = 4 and 144 ÷ 48 = 3, so both go in — and nothing smaller "
        + "could, because taking anything out would leave one of them short of a prime it needs."));
  },
  key(item) {
    const parts = vennParts(item.a, item.b);
    return parts.mid.map((p) => want.num(p))
      .concat(parts.left.map((p) => want.num(p)))
      .concat(parts.right.map((p) => want.num(p)))
      .concat([want.num(lcmOf(item.a, item.b)), want.tick(0)]);
  },
  answer(item) {
    return [`LCM of ${item.a} and ${item.b} = ${lcmOf(item.a, item.b)}`];
  },
};

const pfVenn = {
  id: "pf-venn",
  group: "pf-venn",
  label: "Both, from two rings",
  blurb: "Fill the rings once and read off both answers.",
  heading: "Both, from two rings",
  instruction: () =>
    "Put the primes of each number in its own ring, and the ones they SHARE in the part that belongs to both — "
    + "each prime in a box of its own, so two 2s take two boxes. Then read both answers straight off the "
    + "picture: the <b>HCF</b> is the middle multiplied, and the <b>LCM</b> is the whole picture multiplied.",
  cols: 1,
  defaultCount: 1,
  make(r, o, k, i) {
    const [a, b] = r.pick(pairsFor(o));
    return { a, b };
  },
  render(item) {
    return lead(`<b>${item.a}</b> = ${primeLine(item.a)} &nbsp;and&nbsp; <b>${item.b}</b> = ${primeLine(item.b)}`)
      + `<div class="rw-art">${vennHtml(item.a, item.b)}</div>`
      + ask(`The middle, multiplied — the HCF: ${box()}`)
      + ask(`The whole picture, multiplied — the LCM: ${box()}`)
      + ask(`And one more thing to notice: HCF × LCM = ${box()}, which is ${item.a} × ${item.b}.`);
  },
  worked() {
    return worked(lead("<b>36</b> and <b>48</b>")
      + `<div class="rw-art">${vennHtml(36, 48, { answer: true })}</div>`
      + say("The middle is 2 × 2 × 3 = <b>12</b>, the highest common factor. The whole picture is "
        + "3 × 2 × 2 × 3 × 2 × 2 = <b>144</b>, the lowest common multiple. And 12 × 144 = 1728, which is exactly "
        + "36 × 48. It has to be: multiplying the HCF by the LCM uses the shared primes twice and each number's "
        + "own primes once — and that is what 36 × 48 is made of."));
  },
  key(item) {
    const parts = vennParts(item.a, item.b);
    const out = [];
    if (parts.left.length) out.push(want.set(...parts.left));
    if (parts.mid.length) out.push(want.set(...parts.mid));
    if (parts.right.length) out.push(want.set(...parts.right));
    out.push(want.num(hcfOf(item.a, item.b)));
    out.push(want.num(lcmOf(item.a, item.b)));
    out.push(want.num(item.a * item.b));
    return out;
  },
  answer(item) {
    return [`HCF ${hcfOf(item.a, item.b)}, LCM ${lcmOf(item.a, item.b)} `
      + `(and ${hcfOf(item.a, item.b)} × ${lcmOf(item.a, item.b)} = ${item.a * item.b})`];
  },
};

/* ═══ K. HCF and LCM in the shops ═════════════════════════════════════════
   THE WHOLE DIFFICULTY of these at school is not the arithmetic, it is
   knowing which of the two the question is asking for, and no amount of
   practice at finding the HCF teaches that. So the choosing is a separate
   thing to answer, and it is marked.

   The test that works, and that the instruction gives them: are you CUTTING
   SOMETHING UP (so the answer is smaller than what you started with — the
   HCF), or are you WAITING FOR THINGS TO COME ROUND TOGETHER (so the answer
   is bigger — the LCM)? Every one of these stories is one or the other, and
   a child who asks that question gets them all right. */

const STORIES = [
  {
    kind: "hcf",
    say: (a, b) => `Ada has a ribbon ${a} cm long and another ${b} cm long. She cuts both of them into `
      + `pieces that are all exactly the same length, with none left over. What is the LONGEST each piece can be?`,
    more: { ask: (a, b, v) => `And how many pieces does she get altogether?`, value: (a, b, v) => a / v + b / v },
  },
  {
    kind: "hcf",
    say: (a, b) => `A teacher has ${a} pencils and ${b} crayons. She shares them out so that every child gets the `
      + `same number of pencils and the same number of crayons, with none left over. What is the GREATEST number `
      + `of children she can share them between?`,
    more: { ask: (a, b, v) => `How many pencils does each child get?`, value: (a, b, v) => a / v },
  },
  {
    kind: "lcm",
    say: (a, b) => `Two buses leave the park at 8 o'clock. One of them goes every ${a} minutes and the other `
      + `every ${b} minutes. How many minutes later do they next leave together?`,
    more: null,
  },
  {
    kind: "lcm",
    say: (a, b) => `One lighthouse flashes every ${a} seconds and another every ${b} seconds. They have just `
      + `flashed together. After how many seconds do they flash together again?`,
    more: null,
  },
  {
    kind: "lcm",
    say: (a, b) => `Tiles are ${a} cm by ${b} cm. They are laid flat, all the same way round, to make the `
      + `SMALLEST square they can. How long is the side of that square?`,
    more: { ask: () => "How many tiles does that take?", value: (a, b, v) => (v / a) * (v / b) },
  },
  {
    kind: "hcf",
    say: (a, b) => `A floor is ${a} cm by ${b} cm. It is covered exactly with square tiles, all the same size `
      + `and as BIG as possible, with none cut. How long is the side of one tile?`,
    more: { ask: () => "How many tiles does that take?", value: (a, b, v) => (a / v) * (b / v) },
  },
];

const pfWords = {
  id: "pf-words",
  group: "pf-words",
  label: "Which one does it want?",
  blurb: "A story, and the first job is deciding HCF or LCM.",
  heading: "HCF and LCM in the shops",
  instruction: () =>
    "Nobody will ever tell you which one you need, so ask this: am I <b>cutting something up</b> — into the "
    + "longest piece, the biggest tile, the most children — or am I <b>waiting for things to come round "
    + "together</b> again? Cutting up makes something SMALLER than what you started with, and that is the "
    + "<b>HCF</b>. Coming round together makes something BIGGER, and that is the <b>LCM</b>. Decide first, then "
    + "work it out from the primes.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const [a, b] = r.pick(pairsFor(o));
    /* stepped along by `i` rather than picked again: two cutting-up stories
       in a row would let a child answer the second without reading it */
    const story = (r.int(0, STORIES.length - 1) + i) % STORIES.length;
    return { a, b, story };
  },
  render(item) {
    const t = STORIES[item.story];
    const v = t.kind === "hcf" ? hcfOf(item.a, item.b) : lcmOf(item.a, item.b);
    return ask(t.say(item.a, item.b))
      + ask(`${item.a} = ${primesOf(item.a).map(() => box()).join(" × ")} &nbsp; and &nbsp; `
        + `${item.b} = ${primesOf(item.b).map(() => box()).join(" × ")}`)
      + ask(`Which does this question want? ${tick("the HCF", "the LCM")}`)
      + ask(`The answer is ${box()}.`)
      + (t.more ? ask(`${t.more.ask(item.a, item.b, v)} ${box()}`) : "");
  },
  worked() {
    return worked(ask("A rope 12 m long and a rope 18 m long are cut into equal pieces, as long as possible, "
      + "with none left over. How long is each piece?")
      + say("Cutting up, so it is the <b>HCF</b>. 12 = 2 × 2 × 3 and 18 = 2 × 3 × 3; they share 2 × 3 = <b>6</b>, "
        + "so each piece is 6 m. (If the question had said the two ropes were being laid end to end over and over "
        + "until the two lines were the same length, that is things coming round together — the LCM, 36.)"));
  },
  key(item) {
    const t = STORIES[item.story];
    const v = t.kind === "hcf" ? hcfOf(item.a, item.b) : lcmOf(item.a, item.b);
    const out = primesOf(item.a).map((p) => want.num(p))
      .concat(primesOf(item.b).map((p) => want.num(p)))
      .concat([want.tick(t.kind === "hcf" ? 0 : 1), want.num(v)]);
    if (t.more) out.push(want.num(t.more.value(item.a, item.b, v)));
    return out;
  },
  answer(item) {
    const t = STORIES[item.story];
    const v = t.kind === "hcf" ? hcfOf(item.a, item.b) : lcmOf(item.a, item.b);
    return [`${t.kind.toUpperCase()} = ${v}${t.more ? `, then ${t.more.value(item.a, item.b, v)}` : ""}`];
  },
};

/* ═══ L. what squaring does to the primes ═════════════════════════════════
   THE DISCOVERY THE TWO SECTIONS AFTER IT REST ON, and it is done by looking
   rather than by being told: write the primes of a number, then the primes of
   its square, and see what happened to them.

     6 = 2 × 3            36 = 2 × 2 × 3 × 3
     10 = 2 × 5          100 = 2 × 2 × 5 × 5

   Every prime turns up TWICE AS OFTEN, and of course it does — squaring is
   multiplying the number by itself, so every prime in it is there twice. Once
   a child has seen that, the square root is not a rule to remember: it is the
   same picture read backwards, and the pairing in the next section is
   obviously the undoing of this one. */

const SEEDS = {
  gentle: [4, 6, 9, 10, 12, 15],
  middle: [6, 10, 12, 14, 15, 18, 20, 21],
  stretch: [12, 14, 15, 18, 20, 21, 22, 24, 30],
};
const seedFor = (o) => SEEDS[levelOf(o).id] || SEEDS.gentle;

const pfWhy = {
  id: "pf-why",
  group: "pf-why",
  label: "Square it and look",
  blurb: "Write the primes of a number and of its square. What happened?",
  heading: "What squaring does to the primes",
  instruction: () =>
    "Write each number as its primes. Then square it — multiply it by itself — and write the primes of THAT. "
    + "Look at the two lines together before you answer the question underneath: something has happened to every "
    + "prime, and it is the same thing every time.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const n = r.pick(seedFor(o));
    const cube = levelOf(o).id !== "gentle";
    return { n, cube };
  },
  render(item) {
    const n = item.n;
    return lead(`<b>${n}</b>`)
      + ask(`${n} = ${primesOf(n).map(() => box()).join(" × ")}`)
      + ask(`${n} × ${n} = ${box()}, and that is ${primesOf(n * n).map(() => box()).join(" × ")}`)
      + (item.cube
        ? ask(`${n} × ${n} × ${n} = ${box()}, and that is ${primesOf(n ** 3).map(() => box()).join(" × ")}`)
        : "")
      + ask(`So when a number is SQUARED, each of its primes appears ${tick("the same number of times", "twice as many times", "half as many times")}`);
  },
  worked() {
    return worked(lead("<b>6</b>")
      + say("6 = 2 × 3. And 6 × 6 = 36, which is 2 × 2 × 3 × 3 — <b>the same primes, each one twice</b>. It could "
        + "not be anything else: 36 is 6 × 6, so every prime in 6 is in it twice over. Cube it and they come "
        + "three times each: 6 × 6 × 6 = 216 = 2 × 2 × 2 × 3 × 3 × 3."));
  },
  key(item) {
    const n = item.n;
    const out = primesOf(n).map((p) => want.num(p));
    out.push(want.num(n * n));
    primesOf(n * n).forEach((p) => out.push(want.num(p)));
    if (item.cube) {
      out.push(want.num(n ** 3));
      primesOf(n ** 3).forEach((p) => out.push(want.num(p)));
    }
    out.push(want.tick(1));
    return out;
  },
  answer(item) {
    return [`${item.n}² = ${item.n * item.n} = ${primesOf(item.n * item.n).join(" × ")} — each prime twice`];
  },
};

/* ═══ M. square roots ═════════════════════════════════════════════════════ */

/* Perfect squares, and numbers that are nearly one — the second kind matter
   more than the first, because a child who has only ever been given squares
   learns to take one from each pair without ever asking whether they can. */
const SQUARES = {
  gentle: [36, 64, 100, 144, 196],
  middle: [225, 324, 400, 441, 576, 784],
  stretch: [900, 1024, 1225, 1296, 1764, 2025],
};
const NOT_SQUARES = {
  gentle: [48, 50, 54, 72, 98],
  middle: [108, 150, 200, 242, 294],
  stretch: [363, 450, 588, 686, 968],
};

const pfSqRoot = {
  id: "pf-sqroot",
  group: "pf-sqroot",
  label: "Pair them off",
  blurb: "A perfect square pairs up exactly; the root is one from each pair.",
  heading: "Square roots from the primes",
  instruction: () =>
    "Squaring put every prime in TWICE, so finding the square root is undoing that: write the number as its "
    + "primes and <b>pair them off</b>. If every prime has a partner, the number is a <b>perfect square</b>, and "
    + "its root is one prime taken out of each pair, multiplied. If one is left without a partner, there is no "
    + "whole-number root — and that leftover prime is the reason.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const tier = levelOf(o).id;
    /* one of each, so the tick is a real question */
    const square = i % 2 === 0;
    const pool = square ? SQUARES[tier] : NOT_SQUARES[tier];
    return { n: r.pick(pool || SQUARES.gentle), square };
  },
  render(item) {
    const ps = primesOf(item.n);
    const root = rootOf(item.n, 2);
    return lead(`<b>${item.n}</b> = ${ps.join(" × ")}`)
      + ask(`Pair them off. Is every prime in a pair? ${tick("yes", "no")}`)
      + (item.square
        ? ask(`So it is a perfect square. Take one out of each pair: `
          + `${primesOf(root).map(() => box()).join(" × ")} = ${box()}, and that is √${item.n}.`)
        : ask(`So it is not a perfect square. Which prime is left without a partner? ${box()}`));
  },
  worked() {
    return worked(lead("<b>324</b> = 2 × 2 × 3 × 3 × 3 × 3")
      + say("Pair them off: (2 × 2) and (3 × 3) and (3 × 3). Every prime has a partner, so 324 is a perfect "
        + "square. One out of each pair is 2 × 3 × 3 = <b>18</b>, and 18 × 18 = 324. Now 72 = 2 × 2 × 2 × 3 × 3: "
        + "the 3s pair and two of the 2s pair, but one 2 is left over — so 72 is not a perfect square, and that "
        + "spare 2 is exactly why."));
  },
  key(item) {
    const out = [want.tick(item.square ? 0 : 1)];
    if (item.square) {
      const root = rootOf(item.n, 2);
      primesOf(root).forEach((p) => out.push(want.num(p)));
      out.push(want.num(root));
    } else {
      out.push(want.num(oddPrimes(item.n, 2)[0][0]));
    }
    return out;
  },
  answer(item) {
    return [item.square
      ? `√${item.n} = ${rootOf(item.n, 2)}`
      : `${item.n} is not a perfect square — the ${oddPrimes(item.n, 2)[0][0]} has no partner`];
  },
};

/* ═══ N. cube roots ═══════════════════════════════════════════════════════ */

const CUBES = {
  gentle: [8, 27, 64, 125, 216],
  middle: [343, 512, 729, 1000, 1728],
  stretch: [1331, 2197, 2744, 3375, 5832],
};
const NOT_CUBES = {
  gentle: [24, 36, 48, 100, 200],
  middle: [250, 392, 500, 675, 968],
  stretch: [1080, 1372, 2000, 2592, 3087],
};

const pfCubeRoot = {
  id: "pf-cuberoot",
  group: "pf-cuberoot",
  label: "Group them in threes",
  blurb: "A perfect cube groups into threes; the root is one from each three.",
  heading: "Cube roots from the primes",
  instruction: () =>
    "Cubing puts every prime in THREE times, so a cube root is that undone: write the number as its primes and "
    + "group them in <b>threes</b>. If they all group, it is a <b>perfect cube</b> and the root is one prime out "
    + "of each three, multiplied. It is the same idea as the square root with one number changed, which is the "
    + "point — you have not learned a second rule.",
  cols: 1,
  defaultCount: 2,
  hardest: true,
  make(r, o, k, i) {
    const tier = levelOf(o).id;
    const cube = i % 2 === 0;
    const pool = cube ? CUBES[tier] : NOT_CUBES[tier];
    return { n: r.pick(pool || CUBES.gentle), cube };
  },
  render(item) {
    const root = rootOf(item.n, 3);
    return lead(`<b>${item.n}</b> = ${primesOf(item.n).join(" × ")}`)
      + ask(`Group them in threes. Does every prime make a complete three? ${tick("yes", "no")}`)
      + (item.cube
        ? ask(`So it is a perfect cube. One out of each three: `
          + `${primesOf(root).map(() => box()).join(" × ")} = ${box()}, and that is the cube root of ${item.n}.`)
        : ask(`So it is not a perfect cube. Which prime does not make a complete three? ${box()}`));
  },
  worked() {
    return worked(lead("<b>1728</b> = 2 × 2 × 2 × 2 × 2 × 2 × 3 × 3 × 3")
      + say("Group them in threes: (2 × 2 × 2), (2 × 2 × 2), (3 × 3 × 3). They all group, so 1728 is a perfect "
        + "cube. One out of each three is 2 × 2 × 3 = <b>12</b>, and 12 × 12 × 12 = 1728. Try 500 = 2 × 2 × 5 × 5 "
        + "× 5: the 5s make a three but the two 2s do not, so 500 has no whole cube root."));
  },
  key(item) {
    const out = [want.tick(item.cube ? 0 : 1)];
    if (item.cube) {
      const root = rootOf(item.n, 3);
      primesOf(root).forEach((p) => out.push(want.num(p)));
      out.push(want.num(root));
    } else {
      out.push(want.num(oddPrimes(item.n, 3)[0][0]));
    }
    return out;
  },
  answer(item) {
    return [item.cube
      ? `the cube root of ${item.n} is ${rootOf(item.n, 3)}`
      : `${item.n} is not a perfect cube — the ${oddPrimes(item.n, 3)[0][0]}s do not make a complete three`];
  },
};

/* ── the registry ───────────────────────────────────────────────────────── */

const pfTreeDrag = treeEx("pf-tree-drag", "drag", "Factor tree — put the numbers in place", 1);
const pfTreeGrow = treeEx("pf-tree-grow", "grow", "Factor tree — grow it yourself", 1);

export const PRIME_EXERCISES = [
  pfGroup, pfComposite, pfStrike, pfFactors,
  pfTreeDrag, pfTreeGrow,
  pfLadder, pfProduct, pfIndex, pfCount,
  pfHcf, pfLcm, pfVenn, pfWords,
  pfWhy, pfSqRoot, pfCubeRoot,
];
