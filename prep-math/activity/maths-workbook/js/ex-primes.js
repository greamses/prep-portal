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
     O  roots in the world      and last, the roots in the words a question
                               is asked in: a flat thing gives a square
                               root and a solid one gives a cube root
                               — and the same questions the other way
                               about, where a side is given and the area
                               or the volume is what is wanted

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
import {
  arrayOf, ladder, ladderKey, vennHtml, vennParts, tableHtml, tableKey, tableRows, tableLeft,
  euclidHtml, euclidKey, euclidSteps,
} from "./primeart.js";
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
  { id: "pf-list", label: "The listing way", blurb: "Write both lists out and strike what is in each — slow, sure, and where it all comes from." },
  { id: "pf-table", label: "The table way", blurb: "Both numbers down one ladder: the HCF, the LCM, and both at once." },
  { id: "pf-euclid", label: "Euclid's way", blurb: "Divide, take the remainder, do it again — no factorising at all." },
  { id: "pf-many", label: "Three numbers and four", blurb: "The same table, with more numbers in it." },
  { id: "pf-why", label: "What squaring does to the primes", blurb: "Square a number and every prime turns up twice as often." },
  { id: "pf-sqroot", label: "Square roots from the primes", blurb: "Pair them off and take one out of each pair." },
  { id: "pf-cuberoot", label: "Cube roots from the primes", blurb: "The same, in threes." },
  { id: "pf-rootwords", label: "Squares, cubes and roots in the world", blurb: "A side gives an area, an area gives a side — and the shape says which." },
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
    "The <b>highest common factor</b> of two numbers is the biggest number that divides them both. Both lists of "
    + "primes are written out for you. Write the ones they BOTH have — counting them, so a 2 that is in one "
    + "list three times and the other twice is shared twice — and each one you write is struck off both lists, "
    + "so what is still standing is what they do not share. Multiply the struck ones and you have the HCF; "
    + "multiply the rest and the HCF times that is the LCM.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const [a, b] = r.pick(pairsFor(o));
    return { a, b };
  },
  render(item) {
    const shared = sharedPrimes(item.a, item.b);
    const spare = ownPrimes(item.a, item.b).concat(ownPrimes(item.b, item.a));
    /* THE PRIMES ARE PRINTED AND THEY STRIKE THEMSELVES OUT. Writing a prime
       into the "both" line crosses it off BOTH lists above, which is what a
       hand does with a pencil and the only way to keep count of a 2 that is
       in one list three times and in the other twice. */
    const line = (n, other) => {
      const mine = primesOf(n);
      const theirs = sharedPrimes(n, other);
      const left = theirs.slice();
      return mine.map((v) => {
        const at = left.indexOf(v);
        if (at < 0) return `<span class="pf-p">${v}</span>`;
        left.splice(at, 1);
        /* which of the shared ones this is, counting from the left */
        const k = theirs.length - left.length - 1;
        return `<span class="pf-p" data-cross="s${k}">${v}</span>`;
      }).join(" × ");
    };
    const crossBox = (k) => `<span class="wb-answer" data-crosses="s${k}"></span>`;
    return lead(`<b>${item.a}</b> and <b>${item.b}</b>`)
      + ask(`${item.a} = ${line(item.a, item.b)}`)
      + ask(`${item.b} = ${line(item.b, item.a)}`)
      + ask(`Write the primes they BOTH have — each one you write is struck off both lists: `
        + `${shared.map((v, k) => crossBox(k)).join(" × ")}`)
      + ask(`Multiply those, and that is the HCF: ${box()}`)
      + ask(`Now the ones NOT struck off — what they do not share: ${spare.map(() => box()).join(" × ")}`)
      + ask(`Multiply those: ${box()}`)
      + ask(`And the HCF times THAT is ${box()} — which is the LCM, got out of the HCF for one multiplication.`);
  },
  worked() {
    return worked(lead("<b>36</b> and <b>48</b>")
      + say("36 = 2 × 2 × 3 × 3 and 48 = 2 × 2 × 2 × 2 × 3. Go along them together: they both have a 2, and both "
        + "have a second 2 — but 36 has no third 2, so the sharing stops there. They both have one 3; 36 has "
        + "another but 48 does not. So they share 2 × 2 × 3 = <b>12</b>, and 12 is the highest common factor."));
  },
  key(item) {
    const spare = ownPrimes(item.a, item.b).concat(ownPrimes(item.b, item.a));
    const hcf = hcfOf(item.a, item.b);
    const over = spare.reduce((t, p) => t * p, 1);
    return sharedPrimes(item.a, item.b).map((p) => want.num(p))
      .concat([want.num(hcf)])
      .concat(spare.map((p) => want.num(p)))
      .concat([want.num(over), want.num(hcf * over)]);
  },
  answer(item) {
    const hcf = hcfOf(item.a, item.b);
    return [`HCF ${sharedPrimes(item.a, item.b).join(" × ") || 1} = ${hcf}; `
      + `the rest multiply to ${lcmOf(item.a, item.b) / hcf}, and ${hcf} × ${lcmOf(item.a, item.b) / hcf} = ${lcmOf(item.a, item.b)} (the LCM)`];
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
    + "already there. Leave any of it out and one of the two will not go in. There is a short way at the "
    + "bottom, and it is worth knowing: the two numbers multiplied, divided by the HCF, is the LCM — because "
    + "multiplying them counts the shared part twice and dividing by the HCF takes the extra one back off.",
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
      + ask(`Check: does ${item.a} go into it? ${tick("yes", "no")}`)
      + ask(`And the short way, once you have the HCF: ${item.a} × ${item.b} = ${box()}, `
        + `and that divided by the HCF (${box()}) is ${box()} — the same answer.`);
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
      .concat([
        want.num(lcmOf(item.a, item.b)), want.tick(0),
        want.num(item.a * item.b), want.num(hcfOf(item.a, item.b)), want.num(lcmOf(item.a, item.b)),
      ]);
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

/* ═══ K2. THE LISTING WAY ═════════════════════════════════════════════════
   Where it all comes from, and the method nobody should be without: write
   both lists out and look at what is in each.

     the factors of 24   1  2  3  4  6  8  12  24
     the factors of 36   1  2  3  4  6  9  12  18  36
     in both             1  2  3  4  6  12          → the HIGHEST is 12

     the multiples of 8    8  16  24  32  40  48
     the multiples of 12  12  24  36  48  60  72
     in both               24  48                   → the LOWEST is 24

   It is slow, and that is not a fault: it is the DEFINITION of both words,
   done by hand, and a child who has done it half a dozen times knows what the
   quick methods are quick AT. The lists are struck with a finger here, the
   same way the primes were struck in the sieve. */

/* Small numbers on purpose: a list of multiples that runs off the page
   teaches nothing but how to rule lines. */
const LIST_PAIRS = {
  gentle: [[4, 6], [6, 8], [8, 12], [6, 9], [10, 15], [9, 12]],
  middle: [[8, 12], [12, 18], [10, 15], [14, 21], [15, 20], [12, 20]],
  stretch: [[12, 18], [18, 24], [16, 24], [20, 30], [21, 28], [24, 36]],
};
const listPairFor = (o) => LIST_PAIRS[levelOf(o).id] || LIST_PAIRS.gentle;

const pfListHcf = {
  id: "pf-list-hcf",
  group: "pf-list",
  label: "List the factors of both",
  blurb: "Strike what is in both lists; the biggest one is the HCF.",
  heading: "The listing way — the HCF",
  instruction: () =>
    "Write out all the factors of each number — on screen, strike the ones that are in BOTH lists. Every one you "
    + "strike is a <b>common factor</b>, and the biggest of them is the <b>highest common factor</b>. That is "
    + "not a trick or a method: it is what the words say, done by hand.",
  cols: 1,
  defaultCount: 1,
  make(r, o, k, i) {
    const [a, b] = r.pick(listPairFor(o));
    return { a, b };
  },
  render(item) {
    const fa = factorsOf(item.a);
    const fb = factorsOf(item.b);
    return lead(`<b>${item.a}</b> and <b>${item.b}</b>`)
      + ask(`The factors of ${item.a} — strike the ones that are also factors of ${item.b}:`)
      + strikeHtml({ numbers: fa, cols: Math.min(fa.length, 9), label: `the factors of ${item.a}` })
      + ask(`The factors of ${item.b} — strike the ones that are also factors of ${item.a}:`)
      + strikeHtml({ numbers: fb, cols: Math.min(fb.length, 9), label: `the factors of ${item.b}` })
      + ask(`The biggest number you struck in both is the HCF: ${box()}`);
  },
  worked() {
    const fa = factorsOf(24);
    return worked(lead("<b>24</b> and <b>36</b>")
      + strikeHtml({ numbers: fa, cols: 8, answer: true, struck: factorsOf(24).filter((v) => 36 % v === 0) })
      + strikeHtml({ numbers: factorsOf(36), cols: 9, answer: true, struck: factorsOf(36).filter((v) => 24 % v === 0) })
      + say("1, 2, 3, 4, 6 and 12 are in both lists — they are the common factors — and the biggest of them is "
        + "<b>12</b>. Notice that every one of them divides 12: the common factors of two numbers are exactly "
        + "the factors of their HCF, which is the real reason it is worth finding."));
  },
  key(item) {
    const both = factorsOf(item.a).filter((v) => item.b % v === 0);
    return [
      want.strike({ numbers: both, nth: 0, says: both.join(", ") }),
      want.strike({ numbers: both, nth: 1, says: both.join(", ") }),
      want.num(hcfOf(item.a, item.b)),
    ];
  },
  answer(item) {
    const both = factorsOf(item.a).filter((v) => item.b % v === 0);
    return [`in both: ${both.join(", ")} — the HCF is ${hcfOf(item.a, item.b)}`];
  },
};

const pfListLcm = {
  id: "pf-list-lcm",
  group: "pf-list",
  label: "List the multiples of both",
  blurb: "Strike what is in both lists; the smallest one is the LCM.",
  heading: "The listing way — the LCM",
  instruction: () =>
    "Count up in each number and write the multiples out. Strike the ones that are in BOTH lists: those are the "
    + "<b>common multiples</b>, and the smallest of them is the <b>lowest common multiple</b>. The lists go on "
    + "for ever, which is why the word is LOWEST and not just common.",
  cols: 1,
  defaultCount: 1,
  make(r, o, k, i) {
    const [a, b] = r.pick(listPairFor(o));
    return { a, b };
  },
  render(item) {
    const l = lcmOf(item.a, item.b);
    const upTo = l * 2;
    const ms = (n) => { const out = []; for (let v = n; v <= upTo; v += n) out.push(v); return out; };
    return lead(`<b>${item.a}</b> and <b>${item.b}</b>`)
      + ask(`The multiples of ${item.a} — strike the ones that are also multiples of ${item.b}:`)
      + strikeHtml({ numbers: ms(item.a), cols: Math.min(ms(item.a).length, 9), label: `the multiples of ${item.a}` })
      + ask(`The multiples of ${item.b} — strike the ones that are also multiples of ${item.a}:`)
      + strikeHtml({ numbers: ms(item.b), cols: Math.min(ms(item.b).length, 9), label: `the multiples of ${item.b}` })
      + ask(`The smallest number you struck in both is the LCM: ${box()}`);
  },
  worked() {
    const ms = (n, upTo) => { const out = []; for (let v = n; v <= upTo; v += n) out.push(v); return out; };
    return worked(lead("<b>8</b> and <b>12</b>")
      + strikeHtml({ numbers: ms(8, 48), cols: 6, answer: true, struck: [24, 48] })
      + strikeHtml({ numbers: ms(12, 48), cols: 4, answer: true, struck: [24, 48] })
      + say("24 and 48 are in both lists, and 48 is only there because 24 was — every common multiple is a "
        + "multiple of the LOWEST one. So the answer is <b>24</b>, and the list could have stopped there."));
  },
  key(item) {
    const l = lcmOf(item.a, item.b);
    const both = [];
    for (let v = l; v <= l * 2; v += l) both.push(v);
    return [
      want.strike({ numbers: both, nth: 0, says: both.join(", ") }),
      want.strike({ numbers: both, nth: 1, says: both.join(", ") }),
      want.num(l),
    ];
  },
  answer(item) {
    return [`the LCM of ${item.a} and ${item.b} is ${lcmOf(item.a, item.b)}`];
  },
};

/* ═══ K3. THE TABLE WAY ═══════════════════════════════════════════════════
   Both numbers down one ladder. Three exercises out of one picture, because
   the three things a child is asked for are three different stopping places:

     the HCF     divide by what goes into BOTH, and stop when nothing does
     the LCM     carry on, dividing whatever will go, until both are 1
     both        stop where the HCF stopped, and multiply it by the two
                 numbers left at the foot — which is the LCM

   The last one is the one to keep. It is a single piece of work that answers
   both questions, and it shows WHY the short way works: the left-hand column
   is what they share and the foot of the table is what they do not. */

function tableEx(id, kind, label, count) {
  const both = kind === "both";
  return {
    id,
    group: "pf-table",
    label,
    blurb: both
      ? "One table, both answers: the side gives the HCF and the foot finishes the LCM."
      : kind === "hcf"
        ? "Divide both by what goes into both, and stop when nothing does."
        : "Carry on dividing until both are 1; everything down the side is the LCM.",
    heading: `The table way — ${both ? "both at once" : kind === "hcf" ? "the HCF" : "the LCM"}`,
    instruction: () =>
      "Write both numbers at the top. Down the left write a prime that goes into <b>"
      + (kind === "lcm" ? "either of them" : "both of them") + "</b>, and underneath write what each one becomes"
      + (kind === "lcm" ? " (a number it does not go into is simply copied down). " : ". ")
      + (kind === "hcf"
        ? "Stop when no prime goes into both any more. Everything down the left, multiplied, is the HCF."
        : kind === "lcm"
          ? "Keep going until both of them are 1. Everything down the left, multiplied, is the LCM."
          : "Stop when no prime goes into both. Down the left is the HCF — and that times the two numbers left "
            + "at the foot is the LCM, which is the whole method in one table."),
    cols: 1,
    defaultCount: count,
    hardest: kind === "lcm",
    make(r, o, k, i) {
      const [a, b] = r.pick(pairsFor(o));
      return { a, b };
    },
    render(item) {
      const { rows, left } = tableRows(item.a, item.b, { toOne: kind === "lcm" });
      const down = rows.map((x) => x.by);
      return lead(`<b>${item.a}</b> and <b>${item.b}</b>`)
        + `<div class="rw-art">${tableHtml(item.a, item.b, { kind })}</div>`
        + (kind === "lcm"
          ? ask(`Everything down the left multiplied — the LCM: ${box()}`)
          : ask(`Everything down the left multiplied — the HCF: ${box()}`))
        + (both
          ? ask(`The two left at the foot are ${left[0]} and ${left[1]}. `
            + `So the LCM is the HCF × ${left[0]} × ${left[1]} = ${box()}.`)
          : "")
        + (kind === "hcf"
          ? ask(`Nothing goes into both of ${left[0]} and ${left[1]} any more — is that right? ${tick("yes", "no")}`)
          : "");
    },
    worked() {
      const { left } = tableRows(36, 48);
      return worked(lead("<b>36</b> and <b>48</b>")
        + `<div class="rw-art">${tableHtml(36, 48, { kind, answer: true })}</div>`
        + say(kind === "lcm"
          ? "Keep dividing until both are 1 — a number a prime does not go into is just copied down. Everything "
            + "down the left is 2 × 2 × 3 × 2 × 2 × 3 = <b>144</b>, the LCM."
          : kind === "hcf"
            ? `2 goes into both, and again, and then 3. After that nothing goes into both ${left[0]} and `
              + `${left[1]}, so we stop: 2 × 2 × 3 = <b>12</b> is the HCF.`
            : `Down the left, 2 × 2 × 3 = <b>12</b> — the HCF. At the foot, ${left[0]} and ${left[1]} have `
              + `nothing left in common. So the LCM is 12 × ${left[0]} × ${left[1]} = <b>${12 * left[0] * left[1]}</b>, `
              + "and one table has answered both questions."));
    },
    key(item) {
      /* the divisor is a number outside the rule; what each one becomes is
         written a figure to a column, the way the ladder writes it */
      const out = tableKey(item.a, item.b, kind)
        .map((e) => (e.kind === "by" ? want.num(e.value) : want.cell(e.value)));
      if (kind === "lcm") out.push(want.num(lcmOf(item.a, item.b)));
      else {
        out.push(want.num(hcfOf(item.a, item.b)));
        if (both) out.push(want.num(lcmOf(item.a, item.b)));
        else out.push(want.tick(0));
      }
      return out;
    },
    answer(item) {
      return [kind === "lcm"
        ? `LCM ${lcmOf(item.a, item.b)}`
        : both
          ? `HCF ${hcfOf(item.a, item.b)}, and ${hcfOf(item.a, item.b)} × ${tableLeft(item.a, item.b).join(" × ")} = ${lcmOf(item.a, item.b)}`
          : `HCF ${hcfOf(item.a, item.b)}`];
    },
  };
}

const pfTableHcf = tableEx("pf-table-hcf", "hcf", "The table — the HCF", 2);
const pfTableLcm = tableEx("pf-table-lcm", "lcm", "The table — the LCM", 1);
const pfTableBoth = tableEx("pf-table-both", "both", "One table, both answers", 2);

/* ═══ K4. EUCLID'S WAY ════════════════════════════════════════════════════
   The oldest method in the book, and the one a computer uses: divide the
   bigger by the smaller, then divide THAT by what was left over, and keep
   going until nothing is left over. The last number you divided by is the
   HCF, and nothing was factorised at all.

   It is worth saying why it works, because otherwise it is a trick: anything
   that divides both numbers also divides what is left when you take one away
   from the other — and a remainder is what is left after taking it away as
   many times as it will go. So each line has exactly the same common factors
   as the line before it, and the numbers get smaller every time. When the
   remainder is nothing, the divisor goes into both of them, and nothing
   bigger can.

   This is the one to reach for when the numbers are too big to factorise. */

const EUC_PAIRS = {
  gentle: [[48, 36], [60, 36], [45, 30], [56, 42], [63, 36], [52, 39]],
  middle: [[84, 36], [96, 60], [120, 45], [91, 39], [132, 84], [105, 42]],
  stretch: [[252, 105], [364, 156], [288, 108], [374, 154], [399, 147], [385, 165]],
};

const eucPairFor = (o) => EUC_PAIRS[levelOf(o).id] || EUC_PAIRS.gentle;

const pfEuclid = {
  id: "pf-euclid",
  group: "pf-euclid",
  label: "Divide and take the remainder",
  blurb: "Keep dividing by what was left over until nothing is.",
  heading: "Euclid's way",
  instruction: () =>
    "Divide the bigger number by the smaller one and write the remainder. Then do the same again with the "
    + "number you divided BY and the remainder you got — bring them down yourself, because that carrying down "
    + "is the method. Keep going until the remainder is <b>0</b>: the number you divided by on that last line "
    + "is the <b>HCF</b>. Nothing here is factorised, which is why this is the way to do it when the numbers "
    + "are too big to factorise.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const [a, b] = r.pick(eucPairFor(o));
    return { a, b };
  },
  render(item) {
    return lead(`<b>${item.a}</b> and <b>${item.b}</b>`)
      + `<div class="rw-art">${euclidHtml(item.a, item.b)}</div>`
      + ask(`The remainder is 0, so the HCF of ${item.a} and ${item.b} is ${box()}.`);
  },
  worked() {
    return worked(lead("<b>48</b> and <b>36</b>")
      + `<div class="rw-art">${euclidHtml(48, 36, { answer: true })}</div>`
      + say("48 ÷ 36 is 1 with 12 over. Now do 36 ÷ 12 — the number we divided by, and what was left — and that "
        + "is 3 with nothing over, so we stop: the <b>HCF is 12</b>. It works because whatever divides 48 and 36 "
        + "also divides the 12 that is left over, so every line has the same common factors as the one before "
        + "it — and the numbers get smaller until the answer is staring at you."));
  },
  key(item) {
    return euclidKey(item.a, item.b).map((e) => want.num(e.value))
      .concat([want.num(hcfOf(item.a, item.b))]);
  },
  answer(item) {
    const st = euclidSteps(item.a, item.b);
    return [`${st.map((x) => `${x.x} ÷ ${x.y} = ${x.q} r ${x.r}`).join("; ")} → HCF ${hcfOf(item.a, item.b)}`];
  },
};

/* ═══ K5. THREE NUMBERS AND FOUR ══════════════════════════════════════════
   The table never cared how many numbers were in it. Three or four go down
   it exactly as two did, and the two answers are read off the same way:

     the HCF   the primes that went into EVERY one of them, multiplied
     the LCM   every prime down the left, multiplied

   The second one is worth being careful about. With two numbers the LCM is
   the HCF times what is left over, and a child who learns that as the rule
   is wrong the moment there are three — 4, 6 and 9 have an HCF of 1 and an
   LCM of 36, not 216. What is always true is the column: carry on until every
   number is 1, and everything down the left multiplied is the LCM. */

const MANY = {
  3: {
    gentle: [[4, 6, 8], [6, 9, 12], [8, 12, 16], [10, 15, 20], [6, 8, 12]],
    middle: [[12, 18, 24], [10, 20, 25], [14, 21, 28], [16, 24, 40], [15, 20, 30]],
    stretch: [[24, 36, 60], [30, 45, 75], [28, 42, 70], [36, 48, 72], [40, 60, 90]],
  },
  4: {
    gentle: [[2, 4, 6, 8], [4, 6, 8, 12], [6, 9, 12, 18], [4, 8, 10, 12]],
    middle: [[12, 18, 24, 36], [10, 15, 20, 30], [8, 12, 16, 24], [14, 21, 28, 42]],
    stretch: [[24, 36, 48, 72], [20, 30, 40, 60], [18, 27, 36, 54], [30, 45, 60, 90]],
  },
};

/** The HCF and the LCM of a whole list, worked the way the table works. */
const hcfAll = (ns) => ns.reduce((t, v) => hcfOf(t, v));
const lcmAll = (ns) => ns.reduce((t, v) => lcmOf(t, v));

function manyEx(id, howMany, label, count) {
  return {
    id,
    group: "pf-many",
    label,
    blurb: `${howMany} numbers down one table, and both answers off it.`,
    heading: `${howMany === 3 ? "Three" : "Four"} numbers at once`,
    instruction: () =>
      `All ${howMany} go down the same table. Divide by a prime and write what each number becomes — a number `
      + "the prime will not go into is simply written down again — and keep going until every one of them is 1. "
      + "Then: the primes that went into <b>every</b> number are the <b>HCF</b>, and <b>everything</b> down the "
      + "left is the <b>LCM</b>. Be careful with the second one: with three numbers the LCM is NOT the HCF times "
      + "what is left, and the column is what you can trust.",
    cols: 1,
    defaultCount: count,
    hardest: howMany === 4,
    make(r, o, k, i) {
      const pool = MANY[howMany][levelOf(o).id] || MANY[howMany].gentle;
      return { ns: r.pick(pool) };
    },
    render(item) {
      const { rows } = tableRows(item.ns, { toOne: true });
      const all = rows.filter((x) => x.all).map((x) => x.by);
      return lead(`<b>${item.ns.join("</b>, <b>")}</b>`)
        + `<div class="rw-art">${tableHtml(item.ns, { kind: "lcm" })}</div>`
        + ask(`The primes that went into every one of them: ${all.length ? all.map(() => box()).join(" × ") : "none"}`)
        + ask(`So the HCF is ${box()}.`)
        + ask(`And everything down the left multiplied — the LCM: ${box()}`);
    },
    worked() {
      const ns = howMany === 3 ? [12, 18, 30] : [6, 9, 12, 18];
      const { rows } = tableRows(ns, { toOne: true });
      const all = rows.filter((x) => x.all).map((x) => x.by);
      return worked(lead(`<b>${ns.join("</b>, <b>")}</b>`)
        + `<div class="rw-art">${tableHtml(ns, { kind: "lcm", answer: true })}</div>`
        + say(`${all.join(" and ")} went into every one of them, so the HCF is <b>${hcfAll(ns)}</b>. `
          + `Everything down the left is ${rows.map((x) => x.by).join(" × ")} = <b>${lcmAll(ns)}</b>, the LCM. `
          + "Notice that the HCF times what was left at the bottom is not the LCM here — that shortcut belongs "
          + "to two numbers only, and the column is what works however many there are."));
    },
    key(item) {
      const { rows } = tableRows(item.ns, { toOne: true });
      const all = rows.filter((x) => x.all).map((x) => x.by);
      return tableKey(item.ns, "lcm")
        .map((e) => (e.kind === "by" ? want.num(e.value) : want.cell(e.value)))
        .concat(all.map((p) => want.num(p)))
        .concat([want.num(hcfAll(item.ns)), want.num(lcmAll(item.ns))]);
    },
    answer(item) {
      return [`HCF ${hcfAll(item.ns)}, LCM ${lcmAll(item.ns)}`];
    },
  };
}

const pfMany3 = manyEx("pf-many-3", 3, "Three numbers at once", 1);
const pfMany4 = manyEx("pf-many-4", 4, "Four numbers at once", 1);

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

/* ═══ O. roots in the world ═══════════════════════════════════════════════
   The roots in the words a question is actually asked in — and, as with the
   HCF and the LCM, the work is in knowing which one is wanted. The rule is
   worth saying out loud because it is a fact about shapes and not about
   arithmetic:

     a FLAT thing   — an area, a square of chairs, tiles on a floor — is made
                      of two equal things, so it asks for a SQUARE ROOT
     a SOLID thing  — a volume, a cube of boxes, a tank — is made of three
                      equal things, so it asks for a CUBE ROOT

   Every number here comes out exactly, because the question is "how long is
   the side", and a side that is 13.7 of something is not what this chapter is
   for. What a child has to decide is which root — and then the primes do the
   rest. */

const ROOT_SQUARES = {
  gentle: [36, 64, 100, 144],
  middle: [196, 225, 324, 400],
  stretch: [441, 576, 784, 900],
};
const ROOT_CUBES = {
  gentle: [8, 27, 64, 125],
  middle: [216, 343, 512],
  stretch: [729, 1000, 1728],
};

const ROOT_STORIES = [
  {
    k: 2,
    say: (n) => `A square carpet covers <b>${n}</b> square centimetres. How long is each side?`,
    more: { ask: () => "And how far is it all the way round the edge?", value: (r) => r * 4, unit: "cm" },
  },
  {
    k: 2,
    say: (n) => `${n} chairs are set out in a hall in a <b>square</b> — the same number in every row as there `
      + `are rows. How many chairs are in one row?`,
    more: null,
  },
  {
    k: 2,
    say: (n) => `A square garden has an area of <b>${n}</b> square metres. A fence is to go all the way round `
      + `it. How long is one side?`,
    more: { ask: () => "How many metres of fence does that take?", value: (r) => r * 4, unit: "m" },
  },
  {
    k: 3,
    say: (n) => `A box is a <b>cube</b> and it holds <b>${n}</b> cubic centimetres. How long is each edge?`,
    more: { ask: () => "What is the area of one face of it?", value: (r) => r * r, unit: "cm²" },
  },
  {
    k: 3,
    say: (n) => `${n} sugar cubes are stacked into one big <b>cube</b>. How many of them are along one edge?`,
    more: null,
  },
  {
    k: 3,
    say: (n) => `A water tank is a <b>cube</b> that holds <b>${n}</b> litres. (One litre is a cube of 10 cm, so `
      + `take the tank as ${n} cubes.) How many cubes along one edge?`,
    more: null,
  },
];

const pfRootWords = {
  id: "pf-rootwords",
  group: "pf-rootwords",
  label: "Which root does it want?",
  blurb: "A flat thing gives a square root; a solid one gives a cube root.",
  heading: "Roots in the world",
  instruction: () =>
    "Nobody will say \"take the square root\" — the shape says it. A <b>flat</b> thing (an area, rows and "
    + "columns, tiles on a floor) is made of TWO equal things, so it asks for a <b>square root</b>. A "
    + "<b>solid</b> thing (a volume, a stack of cubes, a tank) is made of THREE, so it asks for a <b>cube "
    + "root</b>. Decide that first; then write the number as its primes and pair them, or group them in threes.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    /* stepped along by `i`, so a page never asks the same shape twice running
       — the deciding is the question, and two of a kind answers itself */
    const which = (r.int(0, ROOT_STORIES.length - 1) + i) % ROOT_STORIES.length;
    const t = ROOT_STORIES[which];
    const tier = levelOf(o).id;
    const pool = t.k === 2 ? (ROOT_SQUARES[tier] || ROOT_SQUARES.gentle) : (ROOT_CUBES[tier] || ROOT_CUBES.gentle);
    return { story: which, n: r.pick(pool) };
  },
  render(item) {
    const t = ROOT_STORIES[item.story];
    const root = rootOf(item.n, t.k);
    return ask(t.say(item.n))
      + ask(`${item.n} = ${primesOf(item.n).map(() => box()).join(" × ")}`)
      + ask(`Which does this question want? ${tick("the square root", "the cube root")}`)
      + ask(`So the answer is ${box()}.`)
      + (t.more ? ask(`${t.more.ask()} ${box()} ${t.more.unit}`) : "");
  },
  worked() {
    return worked(ask("A box is a <b>cube</b> and it holds <b>216</b> cubic centimetres. How long is each edge?")
      + say("A box is a solid — three equal edges — so it is the <b>cube root</b>. 216 = 2 × 2 × 2 × 3 × 3 × 3, "
        + "which groups into (2 × 2 × 2) and (3 × 3 × 3), so the edge is 2 × 3 = <b>6 cm</b>. If the question "
        + "had been about a square carpet of 216 square centimetres there would be no whole answer at all — "
        + "216 does not pair off — and that is the shape telling you which root it wanted."));
  },
  key(item) {
    const t = ROOT_STORIES[item.story];
    const root = rootOf(item.n, t.k);
    const out = primesOf(item.n).map((p) => want.num(p));
    out.push(want.tick(t.k === 2 ? 0 : 1));
    out.push(want.num(root));
    if (t.more) out.push(want.num(t.more.value(root)));
    return out;
  },
  answer(item) {
    const t = ROOT_STORIES[item.story];
    const root = rootOf(item.n, t.k);
    return [`${t.k === 2 ? "square" : "cube"} root of ${item.n} = ${root}`
      + (t.more ? `, then ${t.more.value(root)} ${t.more.unit}` : "")];
  },
};

/* ── and the same questions the other way about ───────────────────────────
   A side is given and the area is wanted; an edge is given and the volume is.
   It is the easier direction and it is where the roots come FROM, so it is
   worth doing in the same words: a child who has worked out that a 14 cm
   square tile covers 196 cm² is not surprised later to be told that 196 cm²
   of tile is 14 cm along the side.

   The last line of each one is the primes, because this chapter has a reason
   to care: squaring a number puts every one of its primes in twice, so the
   answer's prime factors are the number's own, written out twice over. That
   is the fact the roots are undone by, met here in the direction where it is
   obvious. */

const POW_SIDES = {
  gentle: [4, 5, 6, 7, 8, 9, 10, 12],
  middle: [11, 12, 14, 15, 16, 18, 20],
  stretch: [21, 24, 25, 28, 30, 36],
};
const POW_EDGES = {
  gentle: [2, 3, 4, 5],
  middle: [6, 7, 8, 9, 10],
  stretch: [11, 12, 14, 15],
};

const POW_STORIES = [
  {
    k: 2,
    say: (n) => `A square tile is <b>${n} cm</b> along every side. What area does one tile cover?`,
    unit: "cm²",
  },
  {
    k: 2,
    say: (n) => `Chairs are set out in a square with <b>${n}</b> in every row, and as many rows as there are `
      + `chairs in a row. How many chairs are there altogether?`,
    unit: "chairs",
  },
  {
    k: 2,
    say: (n) => `A square field is <b>${n} m</b> along each side. How many square metres of grass is that?`,
    unit: "m²",
  },
  {
    k: 3,
    say: (n) => `A box is a cube with every edge <b>${n} cm</b>. How many cubic centimetres does it hold?`,
    unit: "cm³",
  },
  {
    k: 3,
    say: (n) => `Sugar cubes are stacked into a big cube with <b>${n}</b> of them along every edge. How many `
      + `sugar cubes is that?`,
    unit: "cubes",
  },
  {
    k: 3,
    say: (n) => `A water tank is a cube <b>${n} m</b> along each edge. How many cubic metres does it hold?`,
    unit: "m³",
  },
];

const pfPowWords = {
  id: "pf-powwords",
  group: "pf-rootwords",
  label: "Squaring and cubing in the world",
  blurb: "A side is given; the area or the volume is wanted.",
  heading: "Squares and cubes in the world",
  instruction: () =>
    "The same two shapes, the other way about. A <b>flat</b> thing is two equal things multiplied — a side times "
    + "itself — and a <b>solid</b> one is three. Decide which the question is asking for, work it out, and then "
    + "write the answer's primes: they are the primes of the number you started with, twice over for a square "
    + "and three times over for a cube. That is the fact the roots undo.",
  cols: 1,
  defaultCount: 2,
  make(r, o, k, i) {
    const which = (r.int(0, POW_STORIES.length - 1) + i) % POW_STORIES.length;
    const t = POW_STORIES[which];
    const tier = levelOf(o).id;
    const pool = t.k === 2 ? (POW_SIDES[tier] || POW_SIDES.gentle) : (POW_EDGES[tier] || POW_EDGES.gentle);
    return { story: which, n: r.pick(pool) };
  },
  render(item) {
    const t = POW_STORIES[item.story];
    const v = item.n ** t.k;
    return ask(t.say(item.n))
      + ask(`Which does this question want? ${tick("squaring — two the same", "cubing — three the same")}`)
      + ask(`${item.n} × ${item.n}${t.k === 3 ? ` × ${item.n}` : ""} = ${box()} ${t.unit}`)
      + ask(`And its primes, which are the primes of ${item.n} ${t.k === 2 ? "twice" : "three times"} over: `
        + `${primesOf(v).map(() => box()).join(" × ")}`);
  },
  worked() {
    return worked(ask("A box is a cube with every edge <b>6 cm</b>. How many cubic centimetres does it hold?")
      + say("A box is a solid, so it is <b>cubing</b>: 6 × 6 × 6 = <b>216 cm³</b>. And 6 = 2 × 3, so 216 is "
        + "2 × 2 × 2 × 3 × 3 × 3 — the primes of 6, three times over. Which is why, if somebody hands you 216 "
        + "and asks for the edge, you group those primes in threes and take one out of each: 2 × 3 = 6."));
  },
  key(item) {
    const t = POW_STORIES[item.story];
    const v = item.n ** t.k;
    return [want.tick(t.k === 2 ? 0 : 1), want.num(v)]
      .concat(primesOf(v).map((p) => want.num(p)));
  },
  answer(item) {
    const t = POW_STORIES[item.story];
    const v = item.n ** t.k;
    return [`${item.n}${t.k === 2 ? "²" : "³"} = ${v} ${t.unit} = ${primesOf(v).join(" × ")}`];
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
  pfListHcf, pfListLcm,
  pfTableHcf, pfTableLcm, pfTableBoth,
  pfEuclid, pfMany3, pfMany4,
  pfWhy, pfSqRoot, pfCubeRoot, pfPowWords, pfRootWords,
];
