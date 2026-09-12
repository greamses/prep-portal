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
   three fifths and one fifth is four fifths, and the FIVE NEVER MOVES. Every
   question here is like-denominators only, and the answer key says the bottom
   number again rather than a different one, over and over, until it stops
   being a surprise. Unlike denominators are a different lesson and are not on
   this paper.
   ========================================================================== */

import { shapeSvg, kindsFor, frac } from "./fracart.js";
import { levelOf, helpOf } from "./ex-remainder.js";
import { want } from "/utils/components/workbook/want.js";

export const FRAC_GROUPS = [
  {
    chapter: "Chapter 4 · Fractions",
    id: "frac-what",
    label: "What a fraction is",
    blurb: "Equal parts, some coloured. Read one off, then colour one in.",
  },
  {
    id: "frac-add",
    label: "Adding and taking away fractions",
    blurb: "Same-sized parts only — count the parts, and the bottom number never moves.",
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

export const FRAC_EXERCISES = [
  fracIdentify, fracColour, fracSame,
  addLike, subLike, addLikeQuick,
];
