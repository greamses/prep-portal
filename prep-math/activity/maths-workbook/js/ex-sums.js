/* ============================================================================
   Maths Workbook — the ADDING AND TAKING AWAY exercises
   ----------------------------------------------------------------------------
   One of the four families this workbook is made of; they are assembled into
   one registry in ./exercises.js.

   REGROUPING IS THE WHOLE POINT, so it is never mixed in by accident. A sheet
   where some sums carry and some do not is a sheet a child works by hoping.
   Every exercise here is one or the other, said in its own heading, and the
   sums are drawn to fit: the no-regrouping ones have every column adding to
   less than ten, the regrouping ones have at least one column that does not.

   Each question shows the same sum THREE ways — the blocks, the sum across,
   the sum down — because a child who can do 23 + 14 across the page and is
   then handed a column of figures often does not recognise it as the sum they
   just did. See sumart.js.

   Taking away is drawn as the first number in blocks with the second CROSSED
   OUT, not as two piles. Two piles is what an addition looks like, and a
   subtraction drawn like an addition is where "which one do I take from which"
   comes from.
   ========================================================================== */

import { blocksSvg } from "./blocks.js";
import { bothWays } from "./sumart.js";
import { levelOf } from "./ex-remainder.js";

export const SUM_GROUPS = [
  {
    id: "add",
    label: "Adding with blocks",
    blurb: "Two piles pushed together, written across and written down.",
  },
  {
    id: "sub",
    label: "Taking away with blocks",
    blurb: "One pile with some crossed out — and the trade, when there are not enough.",
  },
];

/* ── how big the numbers are ───────────────────────────────────────────────
   Tied to the same dial as the rest of the workbook, but read differently:
   what matters for a written sum is HOW MANY PLACES, not how big the number
   is. Two places at gentle, three above it. */

const shapeOf = (o) => {
  const L = levelOf(o);
  return { places: L.max <= 20 ? 2 : 3, cap: L.max <= 20 ? 2 : 3 };
};

const digitsOf = (n, places) => {
  const out = [];
  let v = n;
  for (let i = 0; i < places; i++) { out.push(v % 10); v = Math.floor(v / 10); }
  return out;
};

const fromDigits = (d) => d.reduce((s, k, i) => s + k * Math.pow(10, i), 0);

/** An addition where no column reaches ten. */
function drawAddPlain(r, o) {
  const { places } = shapeOf(o);
  const A = [];
  const B = [];
  for (let p = 0; p < places; p++) {
    /* Split a digit under ten into two parts, so the column cannot carry. */
    const total = r.int(p === places - 1 ? 2 : 1, 9);
    const a = r.int(p === places - 1 ? 1 : 0, total - 1);
    A.push(a);
    B.push(total - a);
  }
  if (B[places - 1] === 0) B[places - 1] = 1; // both numbers keep their width
  return { a: fromDigits(A), b: fromDigits(B), places };
}

/** An addition where at least one column reaches ten. */
function drawAddCarry(r, o) {
  const { places } = shapeOf(o);
  let a;
  let b;
  let guard = 0;
  do {
    a = r.int(Math.pow(10, places - 1), Math.pow(10, places) - 1);
    b = r.int(Math.pow(10, places - 1), Math.pow(10, places) - 1);
    guard++;
  } while (!carries(a, b, places) && guard < 80);
  return { a, b, places };
}

function carries(a, b, places) {
  const A = digitsOf(a, places);
  const B = digitsOf(b, places);
  return A.some((d, i) => d + B[i] >= 10);
}

/** A subtraction where every column can be taken without borrowing. */
function drawSubPlain(r, o) {
  const { places } = shapeOf(o);
  const A = [];
  const B = [];
  for (let p = 0; p < places; p++) {
    const a = r.int(p === places - 1 ? 2 : 1, 9);
    A.push(a);
    B.push(r.int(p === places - 1 ? 1 : 0, a)); // never more than the digit above
  }
  return { a: fromDigits(A), b: fromDigits(B), places };
}

/** A subtraction where at least one column has to be traded down. */
function drawSubBorrow(r, o) {
  const { places } = shapeOf(o);
  let a;
  let b;
  let guard = 0;
  do {
    a = r.int(Math.pow(10, places - 1) + 1, Math.pow(10, places) - 1);
    b = r.int(Math.pow(10, places - 1), a - 1);
    guard++;
  } while (!borrows(a, b, places) && guard < 80);
  return { a, b, places };
}

function borrows(a, b, places) {
  const A = digitsOf(a, places);
  const B = digitsOf(b, places);
  return A.some((d, i) => d < B[i]);
}

/* ── the pictures ──────────────────────────────────────────────────────────*/

/** The blocks for a number, capped at the three places blocks are drawn in. */
const pileOf = (n, places) => blocksSvg(digitsOf(n, Math.min(places, 3)), 10, { maxCells: 30, cellMm: 2.4 });

/** Two piles with a plus between them — an addition, drawn. */
function addPicture(a, b, places) {
  return (
    `<div class="ms-piles">` +
    `<span class="ms-piles__one">${pileOf(a, places)}</span>` +
    `<span class="ms-piles__op">+</span>` +
    `<span class="ms-piles__one">${pileOf(b, places)}</span>` +
    `</div>`
  );
}

/**
 * ONE pile, and a note saying how many to cross out. Never two piles: two piles
 * is what an addition looks like, and a subtraction drawn like an addition is
 * where "which one do I take from which" comes from.
 */
function subPicture(a, b, places) {
  return (
    `<div class="ms-piles ms-piles--sub">` +
    `<span class="ms-piles__one">${pileOf(a, places)}</span>` +
    `<span class="ms-piles__cross">cross out ${b}</span>` +
    `</div>`
  );
}

/* ── the four exercises ────────────────────────────────────────────────────*/

function make(kind) {
  return (r, o) => {
    const d =
      kind === "add-plain" ? drawAddPlain(r, o)
        : kind === "add-carry" ? drawAddCarry(r, o)
          : kind === "sub-plain" ? drawSubPlain(r, o)
            : drawSubBorrow(r, o);
    const op = kind.startsWith("add") ? "+" : "-";
    return { ...d, op, total: op === "+" ? d.a + d.b : d.a - d.b };
  };
}

const addNoRegroup = {
  id: "add-no-regroup",
  group: "add",
  label: "Adding — no regrouping",
  blurb: "Every column adds to less than ten, so nothing has to be carried.",
  heading: "Add them — nothing to carry",
  instruction: () =>
    "Push the two piles together. Then write the sum across, and write it down " +
    "the page as well. Add the ones first, then the tens.",
  cols: 1,
  defaultCount: 3,
  make: make("add-plain"),
  render(item) {
    return addPicture(item.a, item.b, item.places) + bothWays(item.a, item.b, "+", { places: item.places });
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      addPicture(23, 14, 2) +
      bothWays(23, 14, "+", { places: 2, answer: 37 }) +
      `<p class="wb-ask rw-worked__say">Three ones and four ones is seven ones. ` +
      `Two tens and one ten is three tens. Nothing reached ten, so nothing is carried.</p></div>`
    );
  },
  answer(item) {
    return [`${item.a} + ${item.b} = ${item.total}`];
  },
};

const addRegroup = {
  id: "add-regroup",
  group: "add",
  label: "Adding — with regrouping",
  blurb: "A column reaches ten, so ten ones are traded for one ten.",
  heading: "Add them — one column will carry",
  instruction: () =>
    "At least one column comes to ten or more. Trade ten ones for one ten, " +
    "write the traded ten in the small box above the next column, and carry on.",
  cols: 1,
  defaultCount: 3,
  make: make("add-carry"),
  render(item) {
    return (
      addPicture(item.a, item.b, item.places) +
      bothWays(item.a, item.b, "+", { places: item.places, carries: true })
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      addPicture(27, 15, 2) +
      bothWays(27, 15, "+", { places: 2, carries: true, answer: 42 }) +
      `<p class="wb-ask rw-worked__say">Seven ones and five ones is twelve ones — that is ` +
      `one ten and two ones. The two stays in the ones column and the one goes in the ` +
      `little box above the tens.</p></div>`
    );
  },
  answer(item) {
    return [`${item.a} + ${item.b} = ${item.total}`];
  },
};

const subNoRegroup = {
  id: "sub-no-regroup",
  group: "sub",
  label: "Taking away — no regrouping",
  blurb: "Every column has enough to take from, so nothing has to be traded.",
  heading: "Take them away — nothing to trade",
  instruction: () =>
    "Cross out that many blocks. Then write it across, and down the page as well. " +
    "Take the ones away first, then the tens.",
  cols: 1,
  defaultCount: 3,
  make: make("sub-plain"),
  render(item) {
    return subPicture(item.a, item.b, item.places) + bothWays(item.a, item.b, "-", { places: item.places });
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      subPicture(48, 23, 2) +
      bothWays(48, 23, "-", { places: 2, answer: 25 }) +
      `<p class="wb-ask rw-worked__say">Eight ones take away three ones is five ones. ` +
      `Four tens take away two tens is two tens. There was enough in both columns.</p></div>`
    );
  },
  answer(item) {
    return [`${item.a} − ${item.b} = ${item.total}`];
  },
};

const subRegroup = {
  id: "sub-regroup",
  group: "sub",
  label: "Taking away — with regrouping",
  blurb: "A column has not got enough, so one ten is broken into ten ones.",
  heading: "Take them away — one column will need a trade",
  instruction: () =>
    "One column has not got enough to take from. Break one ten into ten ones " +
    "first, cross the ten out and write what is left above the column.",
  cols: 1,
  defaultCount: 3,
  make: make("sub-borrow"),
  render(item) {
    return (
      subPicture(item.a, item.b, item.places) +
      bothWays(item.a, item.b, "-", { places: item.places, carries: true })
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      subPicture(42, 17, 2) +
      bothWays(42, 17, "-", { places: 2, carries: true, answer: 25 }) +
      `<p class="wb-ask rw-worked__say">Two ones will not give up seven. So break one of ` +
      `the four tens into ten ones: three tens left, and twelve ones. Twelve take away ` +
      `seven is five; three tens take away one ten is two tens.</p></div>`
    );
  },
  answer(item) {
    return [`${item.a} − ${item.b} = ${item.total}`];
  },
};

export const SUM_EXERCISES = [addNoRegroup, addRegroup, subNoRegroup, subRegroup];
