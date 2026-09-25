/* ============================================================================
   Maths Workbook — the FRACTIONS exercises
   ----------------------------------------------------------------------------
   One of the four families this workbook is made of; they are assembled into
   one registry in ./exercises.js.

   Two ideas, and the order between them is not negotiable:

   FIRST, WHAT A FRACTION IS. A whole cut into equal parts, some of them
   coloured. Read one off a picture; colour one in. Both directions, because a
   child who can only read them has learned to recognise a fraction and not to
   make one. The same fraction turns up as a pie, as a bar and as a grid of
   squares — a child who has only ever seen quarters as a wedge thinks a
   quarter IS a wedge.

   THEN, ADDING THE ONES THAT MATCH. Fifths and fifths, because when the parts
   are the same size you count them exactly the way you count anything else:
   three fifths and one fifth is four fifths, and the FIVE NEVER MOVES.

   THEN THE SAME FRACTION UNDER ANOTHER NAME. One half is two quarters is
   three sixths — not because of a rule about multiplying top and bottom, but
   because cutting every part in two leaves exactly as much coloured in.

   THEN MIXED NUMBERS AND IMPROPER FRACTIONS, which used to sit in chapter 4
   with the remainders. They are fractions, so they live here now.

   AND LAST, UNLIKE DENOMINATORS — the one that needs a pair of scissors. Two
   thirds and one quarter cannot be counted together until the parts are the
   same size, so the child CUTS both bars (utils/components/workbook/fracbar.js)
   until they agree, and only then adds. Nothing on the page will mark as right
   until the bars match, because that is the lesson and the arithmetic
   afterwards is the easy half.
   ========================================================================== */

import { shapeSvg, kindsFor, frac } from "./fracart.js";
import { barsSvg, mixed, improper } from "./bars.js";
import { splitHtml, barSvg, commonDen } from "/utils/components/workbook/fracbar.js";
import { levelOf, helpOf, box } from "./ex-remainder.js";
import { want } from "/utils/components/workbook/want.js";

export const FRAC_GROUPS = [
  {
    chapter: "Chapter 5 · Fractions",
    id: "frac-what",
    label: "What a fraction is",
    blurb: "Equal parts, some coloured. Read one off, then colour one in.",
  },
  {
    id: "frac-add",
    label: "Adding and taking away fractions",
    blurb: "Same-sized parts only — count the parts, and the bottom number never moves.",
  },
  {
    id: "frac-equal",
    label: "The same fraction, another name",
    blurb: "Cut every part in two and nothing changes but what it is called.",
  },
  {
    id: "frac-convert",
    label: "Mixed numbers and improper fractions",
    blurb: "Whole bars and parts of a bar, read both ways.",
  },
  {
    id: "frac-unlike",
    label: "When the parts do not match",
    blurb: "Cut the bars until they agree — then add or take away.",
  },
];

/* ── drawing one ───────────────────────────────────────────────────────────*/

/** The denominators this level uses, and a shape that can show them. */
function drawFraction(r, o, { proper = true } = {}) {
  const den = r.pick(levelOf(o).dens);
  const num = proper ? r.int(1, den - 1) : r.int(1, den);
  const kind = r.pick(kindsFor(den));
  return { den, num, kind };
}

/* ── G. what a fraction is ─────────────────────────────────────────────────*/

const fracIdentify = {
  id: "frac-identify",
  group: "frac-what",
  label: "Write the fraction",
  blurb: "The shape is coloured in; say what fraction it is.",
  heading: "Write the fraction",
  instruction: () =>
    "Count ALL the equal parts — that is the bottom number. Then count the " +
    "coloured ones — that is the top number.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    return drawFraction(r, o);
  },
  render(item) {
    return (
      `<div class="mf-art">${shapeSvg(item.kind, item.den, item.num)}</div>` +
      `<p class="wb-ask">Coloured in: ${frac(null, null, { blank: true, big: true })}</p>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="mf-art">${shapeSvg("pie", 4, 3)}</div>` +
      `<p class="wb-ask">Four equal parts, and three of them coloured: ` +
      `${frac(3, 4, { big: true })}.</p></div>`
    );
  },
  key(item) {
    return [want.num(item.num), want.num(item.den)];
  },
  answer(item) {
    return [`${item.num}/${item.den}`];
  },
};

const fracColour = {
  id: "frac-colour",
  group: "frac-what",
  label: "Colour the fraction",
  blurb: "The fraction is given; colour that many parts in.",
  heading: "Colour the fraction in",
  instruction: () =>
    "The shape is already cut into equal parts. Colour in as many as the top " +
    "number says.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    return drawFraction(r, o);
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Colour in ${frac(item.num, item.den, { big: true })}</p>` +
      `<div class="mf-art">${shapeSvg(item.kind, item.den, 0)}</div>`
    );
  },
  key(item) {
    return [want.colour({ count: item.num, says: `colour ${item.num} of the ${item.den}` })];
  },
  answer(item) {
    return [`${item.num} of the ${item.den} parts`];
  },
};

const fracSame = {
  id: "frac-same",
  group: "frac-what",
  label: "The same fraction, three ways",
  blurb: "One fraction as a pie, a bar and a grid — so it is a number, not a picture.",
  heading: "The same fraction, drawn three ways",
  instruction: () =>
    "All three pictures show the same fraction. Colour each one in, and write " +
    "the fraction underneath.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    /* Only denominators every shape can show, so the three really are the same
       fraction and not two of them and an apology. */
    const dens = levelOf(o).dens.filter((d) => kindsFor(d).length === 3);
    const den = dens.length ? r.pick(dens) : 4;
    return { den, num: r.int(1, den - 1) };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Colour in ${frac(item.num, item.den, { big: true })} of each one.</p>` +
      `<div class="mf-three">` +
      `<span>${shapeSvg("pie", item.den, 0)}</span>` +
      `<span>${shapeSvg("bar", item.den, 0)}</span>` +
      `<span>${shapeSvg("grid", item.den, 0)}</span>` +
      `</div>`
    );
  },
  key(item) {
    return [0, 1, 2].map((nth) => want.colour({ count: item.num, nth, says: `colour ${item.num} of the ${item.den}` }));
  },
  answer(item) {
    return [`${item.num}/${item.den} of each — the same amount every time`];
  },
};

/* ── H. adding and taking away like fractions ──────────────────────────────*/

/** Two fractions over the same denominator whose sum is at most one whole. */
function drawAddLike(r, o) {
  const den = r.pick(levelOf(o).dens.filter((d) => d >= 3));
  const a = r.int(1, den - 2);
  const b = r.int(1, den - a);
  return { den, a, b, total: a + b };
}

/** Two fractions over the same denominator, the first the bigger. */
function drawSubLike(r, o) {
  const den = r.pick(levelOf(o).dens.filter((d) => d >= 3));
  const a = r.int(2, den);
  const b = r.int(1, a - 1);
  return { den, a, b, total: a - b };
}

const addLike = {
  id: "frac-add-like",
  group: "frac-add",
  label: "Adding fractions with the same bottom",
  blurb: "Three fifths and one fifth. Count the parts; the five never moves.",
  heading: "Add them — the parts are the same size",
  instruction: () =>
    "Both fractions are cut into the same number of parts, so you can just " +
    "count the parts. The bottom number stays exactly as it is.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    return { ...drawAddLike(r, o), kind: r.pick(["bar", "pie"]) };
  },
  render(item, o) {
    const shade = helpOf(o).id === "show";
    return (
      `<p class="wb-ask wb-ask--lead">` +
      frac(item.a, item.den, { big: true }) +
      `<span class="mf-op">+</span>` +
      frac(item.b, item.den, { big: true }) +
      `<span class="mf-op">=</span>` +
      frac(null, null, { blank: true, big: true }) +
      `</p>` +
      `<div class="mf-sum">` +
      `<span>${shapeSvg(item.kind, item.den, shade ? item.a : 0)}</span>` +
      `<span class="mf-op">+</span>` +
      `<span>${shapeSvg(item.kind, item.den, shade ? item.b : 0)}</span>` +
      `</div>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead">` +
      frac(2, 5, { big: true }) + `<span class="mf-op">+</span>` +
      frac(1, 5, { big: true }) + `<span class="mf-op">=</span>` +
      frac(3, 5, { big: true }) + `</p>` +
      `<div class="mf-sum">` +
      `<span>${shapeSvg("bar", 5, 2)}</span><span class="mf-op">+</span>` +
      `<span>${shapeSvg("bar", 5, 1)}</span><span class="mf-op">=</span>` +
      `<span>${shapeSvg("bar", 5, 3)}</span></div>` +
      `<p class="wb-ask rw-worked__say">Two fifths and one more fifth is three fifths. ` +
      `They are all fifths, so the five does not change — only how many of them.</p></div>`
    );
  },
  /* at Show me the pictures come coloured in; otherwise colour them */
  key(item, o) {
    const out = [want.num(item.total), want.num(item.den)];
    if (helpOf(o).id !== "show") {
      out.push(want.colour({ count: item.a, nth: 0 }), want.colour({ count: item.b, nth: 1 }));
    }
    return out;
  },
  answer(item) {
    return [`${item.total}/${item.den}`];
  },
};

const subLike = {
  id: "frac-sub-like",
  group: "frac-add",
  label: "Taking away fractions with the same bottom",
  blurb: "Five eighths take away two eighths. Cross the parts out; the eight stays.",
  heading: "Take them away — the parts are the same size",
  instruction: () =>
    "Cross out as many parts as the second fraction says. Count what is left. " +
    "The bottom number stays exactly as it is.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    return { ...drawSubLike(r, o), kind: r.pick(["bar", "pie"]) };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">` +
      frac(item.a, item.den, { big: true }) +
      `<span class="mf-op">−</span>` +
      frac(item.b, item.den, { big: true }) +
      `<span class="mf-op">=</span>` +
      frac(null, null, { blank: true, big: true }) +
      `</p>` +
      `<p class="wb-ask">Cross out ${item.b} of the coloured parts.</p>` +
      `<div class="mf-art">${shapeSvg(item.kind, item.den, item.a)}</div>`
    );
  },
  key(item) {
    return [want.num(item.total), want.num(item.den), want.colour({ count: item.b, mode: "cross", says: `cross out ${item.b}` })];
  },
  answer(item) {
    return [`${item.total}/${item.den}`];
  },
};

const addLikeQuick = {
  id: "frac-add-quick",
  group: "frac-add",
  label: "Both ways, no pictures",
  blurb: "Once the pictures are not needed. Adding and taking away, mixed.",
  heading: "Add and take away",
  instruction: () =>
    "The bottom numbers already match, so count the parts. Write the bottom " +
    "number again, exactly as it was.",
  cols: 2,
  defaultCount: 8,
  make(r, o) {
    const adding = r.chance(0.5);
    return { adding, ...(adding ? drawAddLike(r, o) : drawSubLike(r, o)) };
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">` +
      frac(item.a, item.den, { big: true }) +
      `<span class="mf-op">${item.adding ? "+" : "−"}</span>` +
      frac(item.b, item.den, { big: true }) +
      `<span class="mf-op">=</span>` +
      frac(null, null, { blank: true, big: true }) +
      `</p>`
    );
  },
  key(item) {
    return [want.num(item.total), want.num(item.den)];
  },
  answer(item) {
    return [`${item.total}/${item.den}`];
  },
};

/* --- the conversion exercises, moved here from chapter 4 --- */
function drawMixed(r, o) {
  const L = levelOf(o);
  const den = r.pick(L.dens);
  const whole = r.int(1, L.maxWhole);
  const num = r.int(1, den - 1);
  return { whole, num, den, top: whole * den + num };
}

const barsRead = {
  id: "bars-read",
  group: "frac-convert",
  label: "Read the bars",
  blurb: "Bars already coloured; write it both ways.",
  heading: "Read the bars",
  instruction: () =>
    "Count the whole bars, then the coloured parts of the last one. Write it both ways.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    return drawMixed(r, o);
  },
  render(item) {
    return (
      `<div class="rw-art">${barsSvg(item.den, item.top, item.whole + 1)}</div>` +
      `<p class="wb-ask">As a mixed number ${mixed(null, null, null, { blank: true })}` +
      `<span class="rw-gap"></span>` +
      `As an improper fraction ${improper(null, null, { blank: true })}</p>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="rw-art">${barsSvg(4, 9, 3)}</div>` +
      `<p class="wb-ask">Two whole bars and 1 out of 4 more: ${mixed(2, 1, 4)}.` +
      `<span class="rw-gap"></span>` +
      `Nine quarters altogether: ${improper(9, 4)}.</p></div>`
    );
  },
  key(item) {
    return [want.num(item.whole), want.num(item.num), want.num(item.den), want.num(item.top), want.num(item.den)];
  },
  answer(item) {
    return [`${item.whole} ${item.num}/${item.den} = ${item.top}/${item.den}`];
  },
};

const mixedToImproper = {
  id: "mixed-to-improper",
  group: "frac-convert",
  label: "Mixed into improper",
  blurb: "Colour the bars in, then count every part.",
  heading: "Mixed number into improper fraction",
  instruction: () =>
    "Colour in the bars to show the number. Then count ALL the coloured parts — " +
    "that is the top of the improper fraction.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    return drawMixed(r, o);
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Colour in ${mixed(item.whole, item.num, item.den)}.</p>` +
      `<div class="rw-art">${barsSvg(item.den, 0, item.whole + 1)}</div>` +
      `<p class="wb-ask">${mixed(item.whole, item.num, item.den)} = ` +
      `${improper(null, null, { blank: true })}</p>`
    );
  },
  key(item) {
    return [want.colour({ count: item.top, says: `colour ${item.top} parts` }), want.num(item.top), want.num(item.den)];
  },
  answer(item) {
    return [`${item.top}/${item.den}`];
  },
};

const improperToMixed = {
  id: "improper-to-mixed",
  group: "frac-convert",
  label: "Improper into mixed",
  blurb: "The same picture read the other way — and it is a division with a remainder.",
  heading: "Improper fraction into mixed number",
  instruction: () =>
    "Colour in that many parts, filling one bar before you start the next. " +
    "The full bars are the whole number.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    return drawMixed(r, o);
  },
  render(item) {
    return (
      `<p class="wb-ask wb-ask--lead">Colour in ${improper(item.top, item.den)}.</p>` +
      `<div class="rw-art">${barsSvg(item.den, 0, item.whole + 1)}</div>` +
      `<p class="wb-ask">${improper(item.top, item.den)} = ` +
      `${mixed(null, null, null, { blank: true })}</p>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask wb-ask--lead">Colour in ${improper(7, 3)}.</p>` +
      `<div class="rw-art">${barsSvg(3, 7, 3)}</div>` +
      `<p class="wb-ask">Seven thirds fills two whole bars and one third more: ` +
      `${improper(7, 3)} = ${mixed(2, 1, 3)}.` +
      `<span class="rw-gap"></span>` +
      `It is 7 ÷ 3 = 2 remainder 1 — the same sum.</p></div>`
    );
  },
  key(item) {
    return [
      want.colour({ count: item.top, says: `colour ${item.top} parts` }),
      want.num(item.whole), want.num(item.num), want.num(item.den),
    ];
  },
  answer(item) {
    return [`${item.whole} ${item.num}/${item.den}`];
  },
};

const convertQuick = {
  id: "convert-quick",
  group: "frac-convert",
  label: "Both ways, no bars",
  blurb: "Once the bars are not needed. Mixed one way, improper the other.",
  heading: "Change them over",
  instruction: () =>
    "Where you are given a mixed number, write the improper fraction. " +
    "Where you are given an improper fraction, write the mixed number.",
  cols: 2,
  defaultCount: 8,
  make(r, o) {
    return { ...drawMixed(r, o), toImproper: r.chance(0.5) };
  },
  render(item) {
    return item.toImproper
      ? `<p class="wb-ask wb-ask--lead">${mixed(item.whole, item.num, item.den)} = ` +
          `${improper(null, null, { blank: true })}</p>`
      : `<p class="wb-ask wb-ask--lead">${improper(item.top, item.den)} = ` +
          `${mixed(null, null, null, { blank: true })}</p>`;
  },
  key(item) {
    return item.toImproper
      ? [want.num(item.top), want.num(item.den)]
      : [want.num(item.whole), want.num(item.num), want.num(item.den)];
  },
  answer(item) {
    return [
      item.toImproper
        ? `${item.top}/${item.den}`
        : `${item.whole} ${item.num}/${item.den}`,
    ];
  },
};


/* === THE SAME FRACTION, ANOTHER NAME =====================================
   Equivalence is not a rule about multiplying the top and the bottom; it is
   what you SEE when every part of a bar is cut in two. The bar is drawn twice,
   once whole and once cut, and the child reads the second name off the
   picture before anyone mentions multiplying. */

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/**
 * A fraction, and the same fraction with every part cut into `k`.
 *   lowest   the fraction it starts from is already in its simplest form —
 *            which the "simplest form" question needs, or its own answer
 *            would not be the simplest form (2/6 cut by 2 is 4/12, and the
 *            answer is 1/3, not 2/6)
 */
function drawEqual(r, o, { maxK = 4, lowest = false } = {}) {
  const L = levelOf(o);
  const small = L.dens.filter((d) => d <= 8);
  const dens = small.length ? small : L.dens;
  let den = r.pick(dens);
  let num = r.int(1, den - 1);
  for (let tries = 0; lowest && gcd(num, den) !== 1 && tries < 40; tries++) {
    den = r.pick(dens);
    num = r.int(1, den - 1);
  }
  if (lowest && gcd(num, den) !== 1) { num = 1; }
  const k = r.int(2, Math.max(2, Math.min(maxK, Math.floor(24 / den))));
  return { num, den, k };
}

const equalSee = {
  id: "frac-equal-see",
  group: "frac-equal",
  label: "Cut every part in two",
  blurb: "The same amount coloured; a new name for it.",
  heading: "The same fraction, another name",
  instruction: () =>
    "The second bar is the first one with every part cut up — the SAME amount is coloured, but there are " +
    "more parts and they are smaller. Write what the second bar is called.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    return drawEqual(r, o);
  },
  render(item) {
    return (
      `<div class="rw-art">${barSvg({ num: item.num, den: item.den, label: `${item.num} out of ${item.den}` })}` +
      `${barSvg({ num: item.num * item.k, den: item.den * item.k, was: item.den, label: "the same bar, cut up" })}</div>` +
      `<p class="wb-ask">${frac(item.num, item.den)} = ${frac(null, null, { blank: true })}</p>` +
      `<p class="wb-ask">Is the same amount coloured in?</p>` +
      `<span class="wb-tick"><span class="wb-tick__one"><span class="wb-box"></span>Yes</span>` +
      `<span class="wb-tick__one"><span class="wb-box"></span>No</span></span>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="rw-art">${barSvg({ num: 1, den: 2 })}${barSvg({ num: 3, den: 6, was: 2 })}</div>` +
      `<p class="wb-ask">Every half has been cut into three, so one half is three sixths: ` +
      `${frac(1, 2)} = ${frac(3, 6)}. Nothing was coloured in or rubbed out — only the cutting changed.</p></div>`
    );
  },
  key(item) {
    return [want.num(item.num * item.k), want.num(item.den * item.k), want.tick(0)];
  },
  answer(item) {
    return [`${item.num}/${item.den} = ${item.num * item.k}/${item.den * item.k}`];
  },
};

const equalFill = {
  id: "frac-equal-fill",
  group: "frac-equal",
  label: "Fill in the missing number",
  blurb: "Whatever you do to the bottom, do to the top.",
  heading: "Fill in the missing number",
  instruction: () =>
    "These two fractions are the same size. Work out what the bottom was multiplied by, then do the same " +
    "to the top.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    return { ...drawEqual(r, o), hideTop: r.chance(0.5) };
  },
  render(item) {
    const bigNum = item.num * item.k;
    const bigDen = item.den * item.k;
    return `<p class="wb-ask wb-ask--lead">${frac(item.num, item.den)} = ` +
      (item.hideTop ? frac(null, bigDen) : frac(bigNum, null)) + `</p>`;
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask">${frac(2, 3)} = ${frac(null, 12)} — the bottom went from 3 to 12, ` +
      `which is × 4, so the top goes × 4 as well: 2 × 4 = <b>8</b>, and ${frac(2, 3)} = ${frac(8, 12)}.</p></div>`
    );
  },
  key(item) {
    return [want.num(item.hideTop ? item.num * item.k : item.den * item.k)];
  },
  answer(item) {
    return [`${item.num * item.k}/${item.den * item.k}`];
  },
};

const equalSimplest = {
  id: "frac-equal-simplest",
  group: "frac-equal",
  label: "Put it in its simplest form",
  blurb: "The other way: rub the cuts out until you cannot any more.",
  heading: "Simplest form",
  instruction: () =>
    "Cutting a bar up gives a fraction more names; rubbing the cuts out gives it fewer. Keep dividing the " +
    "top and the bottom by the same number until you cannot any more.",
  cols: 2,
  defaultCount: 6,
  hardest: true,
  make(r, o) {
    return drawEqual(r, o, { maxK: 5, lowest: true });
  },
  render(item) {
    return `<p class="wb-ask wb-ask--lead">${frac(item.num * item.k, item.den * item.k)} = ` +
      `${frac(null, null, { blank: true })} in its simplest form</p>`;
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<p class="wb-ask">${frac(6, 8)}: 6 and 8 both divide by 2, so it is ${frac(3, 4)}. Now 3 and 4 have ` +
      `nothing left in common, so ${frac(3, 4)} is as simple as it gets.</p></div>`
    );
  },
  key(item) {
    /* whatever it was cut by, the simplest form is what it was cut FROM */
    return [want.num(item.num), want.num(item.den)];
  },
  answer(item) {
    return [`${item.num}/${item.den}`];
  },
};

/* === WHEN THE PARTS DO NOT MATCH ==========================================
   The scissors section. Two bars in different parts, and nothing may be added
   until they have been cut to the same size — which is what want.split marks.
   Gentle keeps one denominator a multiple of the other (halves and quarters),
   so ONE bar needs cutting; Middle and Stretch need both. */

function drawUnlike(r, o, { sub = false } = {}) {
  const t = levelOf(o).id;
  const pairs = t === "gentle"
    ? [[2, 4], [2, 6], [3, 6], [2, 8], [4, 8], [3, 9]]
    : t === "middle"
      ? [[2, 3], [3, 4], [2, 5], [4, 6], [3, 8], [2, 6], [4, 5]]
      : [[3, 4], [4, 5], [3, 5], [5, 6], [3, 8], [5, 8]];
  /* Every pair here must be reachable with the cuts the scissors offer
     (×2, ×3, ×4, ×5): sevenths cannot be made from quarters, so a pair like
     [4, 7] would ask for a cut the child has no button for. */
  const [da, db] = r.pick(pairs);
  const d = commonDen(da, db);
  for (let tries = 0; tries < 60; tries++) {
    const a = { num: r.int(1, da - 1), den: da };
    const b = { num: r.int(1, db - 1), den: db };
    const A = a.num * (d / da);
    const B = b.num * (d / db);
    /* an answer past one whole (or below nothing) is a different lesson:
       keep this one inside a single bar */
    if (sub ? A - B >= 1 : A + B <= d - 1) return { a, b, d, top: sub ? A - B : A + B, sub };
  }
  const a = { num: 1, den: da };
  const b = { num: 1, den: db };
  const A = d / da;
  const B = d / db;
  return { a, b, d, top: sub ? Math.max(1, A - B) : A + B, sub };
}

const cutAndCount = (item) =>
  splitHtml({ a: item.a, b: item.b, op: item.sub ? "−" : "+", label: "Two bars to cut to the same size" }) +
  `<p class="wb-ask">Both bars cut into ${box()}ths.</p>` +
  `<p class="wb-ask">${frac(item.a.num, item.a.den)} ${item.sub ? "−" : "+"} ${frac(item.b.num, item.b.den)} = ` +
  `${frac(null, null, { blank: true })}</p>`;

const addUnlike = {
  id: "frac-add-unlike",
  group: "frac-unlike",
  label: "Adding when the parts do not match",
  blurb: "Cut both bars to the same size, then count.",
  heading: "Adding fractions with different bottoms",
  instruction: () =>
    "You cannot add thirds to quarters any more than you can add shoes to sheep. Cut every part of each bar " +
    "— the scissors do it on screen — until BOTH bars are in parts of the same size. The amount coloured " +
    "never changes; only what it is called. Then count the parts, and the bottom number stays put.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return drawUnlike(r, o);
  },
  render(item) {
    return cutAndCount(item);
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="rw-art">${barSvg({ num: 3, den: 6, was: 2 })}${barSvg({ num: 2, den: 6, was: 3 })}</div>` +
      `<p class="wb-ask">${frac(1, 2)} + ${frac(1, 3)}: halves and thirds do not match, so cut the halves into ` +
      `three and the thirds into two. Both bars are in sixths now — ${frac(3, 6)} and ${frac(2, 6)} — and 3 parts ` +
      `and 2 parts is <b>5</b> parts: ${frac(5, 6)}.</p></div>`
    );
  },
  key(item) {
    return [
      want.split({ a: item.a, b: item.b, says: `both bars cut into ${item.d}ths` }),
      want.num(item.d),
      want.num(item.top), want.num(item.d),
    ];
  },
  answer(item) {
    return [`${item.a.num}/${item.a.den} + ${item.b.num}/${item.b.den} = ${item.top}/${item.d}`];
  },
};

const subUnlike = {
  id: "frac-sub-unlike",
  group: "frac-unlike",
  label: "Taking away when the parts do not match",
  blurb: "The same cutting, then count what is left.",
  heading: "Taking away fractions with different bottoms",
  instruction: () =>
    "Exactly as before: cut both bars until the parts are the same size. Then take the second lot of parts " +
    "away from the first, and say how many are left — out of the new bottom number.",
  cols: 1,
  defaultCount: 2,
  hardest: true,
  make(r, o) {
    return drawUnlike(r, o, { sub: true });
  },
  render(item) {
    return cutAndCount(item);
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="rw-art">${barSvg({ num: 8, den: 12, was: 3 })}${barSvg({ num: 3, den: 12, was: 4 })}</div>` +
      `<p class="wb-ask">${frac(2, 3)} − ${frac(1, 4)}: cut the thirds into four and the quarters into three, ` +
      `and both are twelfths — ${frac(8, 12)} and ${frac(3, 12)}. Take 3 parts from 8 and <b>5</b> are left: ` +
      `${frac(5, 12)}.</p></div>`
    );
  },
  key(item) {
    return [
      want.split({ a: item.a, b: item.b, says: `both bars cut into ${item.d}ths` }),
      want.num(item.d),
      want.num(item.top), want.num(item.d),
    ];
  },
  answer(item) {
    return [`${item.a.num}/${item.a.den} − ${item.b.num}/${item.b.den} = ${item.top}/${item.d}`];
  },
};

export const FRAC_EXERCISES = [
  fracIdentify, fracColour, fracSame,
  addLike, subLike, addLikeQuick,
  equalSee, equalFill, equalSimplest,
  barsRead, mixedToImproper, improperToMixed, convertQuick,
  addUnlike, subUnlike,
];
