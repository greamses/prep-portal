/* ============================================================================
   Maths Workbook — CHAPTER 8: multiplying
   ----------------------------------------------------------------------------
   Built from the concrete up, in the order a child meets it, and every step
   standing on the one before:

     equal groups       things on plates — "3 groups of 4" is a picture first,
                        then an addition, and only then a multiplication
     arrays and jumps   the groups straightened into rows, which is why 3 × 4 is
                        4 × 3; and the same count as hops along a line
     tables and tens    the facts, and what ×10, ×100, ×1000 does to a number's
                        figures — they move a place, the zero holds it
     blocks             a two-figure number times one, as rows of rods and units,
                        with ten units traded for a rod
     the grid           the blocks with the pictures taken away: each part times
                        each part, then add — 2 × 1, 2 × 2, 3 × 2 figures
     columns            short multiplication (2, 3 and 4 figures × 1) and long
                        multiplication (2 and 3 figures × 2) — the grid folded up
     the lattice        another way to lay the same partial products out
     word problems

   DIFFERENT DIGITS ARE DIFFERENT EXERCISES, not a dial, so a teacher can put
   "3-digit × 1-digit" on a page and nothing else. The level decides how big the
   figures are inside that shape: small figures and few carries at Gentle, any
   figure at Middle, big figures and carries everywhere at Stretch.
   ========================================================================== */

import {
  digitsOf, groupsHtml, arraySvg, jumpsSvg, shiftTable, blockRowsHtml, partsOf,
  gridTable, shortCol, longCol, latticeTable,
} from "./mulart.js";
import { traysSvg, SHAPE_NAMES } from "./shapes.js";
import { levelOf } from "./ex-remainder.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="rw-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const lead = (html) => `<p class="wb-ask wb-ask--lead">${html}</p>`;
const art = (html) => `<div class="mm-art">${html}</div>`;
const worked = (body) => `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask rw-worked__say">${html}</p>`;

const tier = (o) => levelOf(o).id;

/** A figure from the level's range: small at Gentle, big at Stretch. */
const fig = (r, o, { zero = false } = {}) => {
  const lo = zero ? 0 : 1;
  const t = tier(o);
  if (t === "gentle") return r.int(lo, 4);
  if (t === "middle") return r.int(lo, 9);
  return r.int(Math.max(lo, 4), 9);
};
/** A number of `n` figures, the top one never 0. */
const numOf = (r, o, n) => {
  let v = fig(r, o);
  for (let i = 1; i < n; i++) v = v * 10 + fig(r, o, { zero: tier(o) !== "gentle" });
  return v;
};
/** The one-figure multiplier. */
const single = (r, o) => r.pick({ gentle: [2, 3, 4, 5], middle: [2, 3, 4, 5, 6, 7, 8, 9], stretch: [6, 7, 8, 9] }[tier(o)]);

/* ── the groups ────────────────────────────────────────────────────────────*/

export const MUL_GROUPS = [
  { id: "mul-groups", chapter: "Chapter 8 · Multiplying", label: "Equal groups" },
  { id: "mul-arrays", label: "Arrays and jumps" },
  { id: "mul-facts", label: "Times tables and tens" },
  { id: "mul-blocks", label: "Multiplying with blocks" },
  { id: "mul-grid", label: "The grid method" },
  { id: "mul-column", label: "Short and long multiplication" },
  { id: "mul-lattice", label: "The lattice method" },
  { id: "mul-words", label: "Word problems" },
];

/* ═══ equal groups ═════════════════════════════════════════════════════════*/

const groupSizes = (r, o) => ({
  g: r.int(2, tier(o) === "gentle" ? 4 : 5),
  n: r.int(2, tier(o) === "stretch" ? 10 : tier(o) === "middle" ? 8 : 5),
});

const mulEqualGroups = {
  id: "mul-equal-groups",
  group: "mul-groups",
  label: "Count the equal groups",
  blurb: "Plates with the same number on each: how many groups, how many in each, how many altogether.",
  heading: "How many altogether?",
  instruction: () =>
    "Count the plates — that is how many GROUPS. Count what is on one plate — that is how many IN EACH " +
    "group. Every plate has the same, so you can add the groups up, or multiply: groups × in each.",
  cols: 1,
  defaultCount: 3,
  make(r, o, k, i) {
    return { ...groupSizes(r, o), shape: SHAPE_NAMES[i % SHAPE_NAMES.length], colour: i };
  },
  render(item) {
    return (
      art(groupsHtml(item.g, item.n, item)) +
      ask(`${box()} groups, with ${box()} in each group`) +
      ask(`Add them up: ${box()} &nbsp;&nbsp; Multiply: groups × in each = ${box()}`)
    );
  },
  worked() {
    return worked(
      art(groupsHtml(3, 4, { shape: "star", colour: 1 })) +
      ask(`<b>3</b> groups, with <b>4</b> in each group`) +
      ask(`Add them up: <b>4 + 4 + 4 = 12</b> &nbsp;&nbsp; Multiply: <b>3 × 4 = 12</b>`) +
      say("Three plates, four on each. Adding four three times is twelve — and that is exactly what 3 × 4 means.")
    );
  },
  key(item) {
    const t = item.g * item.n;
    return [want.num(item.g), want.num(item.n), want.num(t), want.num(t)];
  },
  answer(item) {
    return [`${item.g} groups of ${item.n}: ${item.g} × ${item.n} = ${item.g * item.n}`];
  },
};

const mulDrawGroups = {
  id: "mul-draw-groups",
  group: "mul-groups",
  label: "Draw the equal groups",
  blurb: "The picture made by the child: draw the groups, then count them up.",
  heading: "Draw the groups, then multiply",
  instruction: () =>
    "Draw the same number of dots in every tray. Then count all the dots, and write the multiplication.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return groupSizes(r, o);
  },
  render(item) {
    return (
      lead(`Draw <b>${item.g}</b> groups of <b>${item.n}</b>.`) +
      art(traysSvg(item.g, { tall: 20 })) +
      ask(`${item.g} × ${item.n} = ${box()}`)
    );
  },
  key(item) {
    return [want.pen(".rw-trays"), want.num(item.g * item.n)];
  },
  answer(item) {
    return [`${item.g} × ${item.n} = ${item.g * item.n}`];
  },
};

/* ═══ arrays and jumps ═════════════════════════════════════════════════════*/

const mulArray = {
  id: "mul-array",
  group: "mul-arrays",
  label: "Read the array",
  blurb: "Rows of the same length — and turned round, the same dots are the other multiplication.",
  heading: "Rows and columns",
  instruction: () =>
    "An ARRAY is equal groups in straight rows. Count the rows and how many are in each row, and multiply. " +
    "Then read it the other way, down the columns: it is the same dots, so it is the same answer.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const max = { gentle: 5, middle: 7, stretch: 9 }[tier(o)];
    return { rows: r.int(2, max), cols: r.int(2, max) };
  },
  render(item) {
    return (
      art(arraySvg(item.rows, item.cols)) +
      ask(`${box()} rows, ${box()} in each row`) +
      ask(`rows × in each row = ${box()}`) +
      ask(`Turn it round — columns × in each column = ${box()}`)
    );
  },
  worked() {
    return worked(
      art(arraySvg(2, 5)) +
      ask("<b>2</b> rows, <b>5</b> in each row") +
      ask("<b>2 × 5 = 10</b> &nbsp;&nbsp; <b>5 × 2 = 10</b>") +
      say("Two rows of five is ten. Read down instead and it is five columns of two — still the same ten dots.")
    );
  },
  key(item) {
    const t = item.rows * item.cols;
    return [want.num(item.rows), want.num(item.cols), want.num(t), want.num(t)];
  },
  answer(item) {
    return [`${item.rows} × ${item.cols} = ${item.cols} × ${item.rows} = ${item.rows * item.cols}`];
  },
};

const mulJumps = {
  id: "mul-jumps",
  group: "mul-arrays",
  label: "Jumps on a number line",
  blurb: "Equal hops from 0: the number of hops times the size of each.",
  heading: "Where do the jumps land?",
  instruction: () =>
    "Every jump is the same size and they all start at 0. Count the jumps, read the size of one jump, and " +
    "write where the last one lands as a multiplication.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const sizes = { gentle: [2, 5, 10], middle: [2, 3, 4, 5, 10], stretch: [3, 4, 6, 7, 8, 9] }[tier(o)];
    return { jumps: r.int(2, tier(o) === "gentle" ? 5 : 7), size: r.pick(sizes) };
  },
  render(item) {
    return (
      art(jumpsSvg(item.jumps, item.size)) +
      ask(`${box()} jumps of ${box()} land on ${box()}`)
    );
  },
  key(item) {
    return [want.num(item.jumps), want.num(item.size), want.num(item.jumps * item.size)];
  },
  answer(item) {
    return [`${item.jumps} × ${item.size} = ${item.jumps * item.size}`];
  },
};

/* ═══ times tables and tens ════════════════════════════════════════════════*/

const TABLES = { gentle: [2, 5, 10], middle: [3, 4, 6, 8], stretch: [6, 7, 8, 9, 11, 12] };

const mulFacts = {
  id: "mul-facts",
  group: "mul-facts",
  label: "Times-table facts",
  blurb: "Six facts from the tables for this level — some ask for the answer, some for the missing number.",
  heading: "Fill in the missing numbers",
  instruction: () =>
    "Some boxes want the answer and some want the number you multiply by. If the answer is there, count " +
    "up in that table until you reach it.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const t = r.pick(TABLES[tier(o)]);
    const bys = r.shuffle([...Array(12).keys()].map((x) => x + 1)).slice(0, 6);
    return { facts: bys.map((by, i) => ({ t, by, hide: i % 3 === 2 ? "by" : "ans" })) };
  },
  render(item) {
    return `<div class="mm-facts">${item.facts.map((f) => `<p class="wb-ask">${f.hide === "by"
      ? `${f.t} × ${box()} = ${f.t * f.by}`
      : `${f.t} × ${f.by} = ${box()}`}</p>`).join("")}</div>`;
  },
  key(item) {
    return item.facts.map((f) => want.num(f.hide === "by" ? f.by : f.t * f.by));
  },
  answer(item) {
    return [item.facts.map((f) => `${f.t} × ${f.by} = ${f.t * f.by}`).join(" · ")];
  },
};

const mulTens = {
  id: "mul-tens",
  group: "mul-facts",
  label: "Multiply by 10, 100 and 1000",
  blurb: "The figures move one place left for every zero, and a 0 holds the empty place.",
  heading: "Move the figures",
  instruction: () =>
    "Multiplying by 10 moves every figure ONE place to the left; by 100, two places; by 1000, three. The " +
    "empty places on the right are filled with 0. Write the figures in their new places, then the answer.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    const factor = r.pick({ gentle: [10], middle: [10, 100], stretch: [10, 100, 1000] }[tier(o)]);
    const n = numOf(r, o, tier(o) === "gentle" ? r.int(1, 2) : r.int(2, 3));
    return { n, factor };
  },
  render(item) {
    return art(shiftTable(item.n, item.factor)) + ask(`${item.n} × ${item.factor} = ${box()}`);
  },
  worked() {
    return worked(
      art(shiftTable(34, 10, { answer: true })) +
      ask("<b>34 × 10 = 340</b>") +
      say("The 3 tens become 3 hundreds and the 4 ones become 4 tens. Nothing is left in the ones, so a 0 holds that place.")
    );
  },
  key(item) {
    const v = item.n * item.factor;
    const places = String(item.n).length + String(item.factor).length - 1;
    const R = digitsOf(v, places);
    const cells = [...Array(places).keys()].reverse().map((p) => want.cell(R[p]));
    return [...cells, want.num(v)];
  },
  answer(item) {
    return [`${item.n} × ${item.factor} = ${item.n * item.factor}`];
  },
};

/* ═══ blocks ═══════════════════════════════════════════════════════════════*/

const mulBlocks = {
  id: "mul-blocks-rows",
  group: "mul-blocks",
  label: "Rows of blocks",
  blurb: "A two-figure number times one figure, as rows of rods and units — and ten units make a rod.",
  heading: "Multiply with the blocks",
  instruction: () =>
    "Every row is the same number. Count all the rods — those are tens — and all the units — those are " +
    "ones. If there are ten ones or more, ring ten of them: they make another ten. Then write the answer.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const n = r.int(2, tier(o) === "gentle" ? 3 : 4);
    const t = r.int(1, tier(o) === "gentle" ? 2 : 3);
    const u = tier(o) === "gentle" ? r.int(1, 4) : r.int(3, 9);
    return { n, t, u };
  },
  render(item) {
    return (
      lead(`${item.n} × ${item.t}${item.u}`) +
      art(blockRowsHtml(item.n, item.t, item.u)) +
      ask(`Tens altogether: ${box()} &nbsp; Ones altogether: ${box()}`) +
      ask(`${item.n} × ${item.t * 10 + item.u} = ${box()}`)
    );
  },
  worked() {
    return worked(
      lead("3 × 24") +
      art(blockRowsHtml(3, 2, 4)) +
      ask("Tens altogether: <b>6</b> &nbsp; Ones altogether: <b>12</b>") +
      ask("<b>3 × 24 = 72</b>") +
      say("Six tens is 60. Twelve ones is one more ten and 2 ones, so 60 + 10 + 2 = 72.")
    );
  },
  key(item) {
    return [
      want.pen(".mm-rows svg"),
      want.num(item.n * item.t),
      want.num(item.n * item.u),
      want.num(item.n * (item.t * 10 + item.u)),
    ];
  },
  answer(item) {
    const a = item.t * 10 + item.u;
    return [`${item.n} × ${a}: ${item.n * item.t} tens and ${item.n * item.u} ones = ${item.n * a}`];
  },
};

/* ═══ the grid method ══════════════════════════════════════════════════════*/

/** Numbers for a da-figure × db-figure question, with no zero figures (the grid would drop a column). */
function pairFor(r, o, da, db) {
  const noZero = (n) => {
    let v = 0;
    for (let i = 0; i < n; i++) v = v * 10 + fig(r, o);
    return v;
  };
  const a = noZero(da);
  const b = db === 1 ? single(r, o) : noZero(db);
  return { a, b };
}

function gridEx(id, da, db, label, count) {
  return {
    id,
    group: "mul-grid",
    label,
    blurb: "Split each number into its parts, multiply every part by every part, then add the boxes.",
    heading: "The grid method",
    instruction: () =>
      "The top number is split into hundreds, tens and ones along the top; the other down the side. Fill each " +
      "box with the number above it times the number beside it. Then add up every box.",
    cols: db === 1 ? 2 : 1,
    defaultCount: count,
    make(r, o) {
      return pairFor(r, o, da, db);
    },
    render(item) {
      return (
        lead(`${item.a} × ${item.b}`) +
        art(gridTable(item.a, item.b)) +
        ask(`Add the boxes: ${item.a} × ${item.b} = ${box()}`)
      );
    },
    worked() {
      const [a, b] = db === 1 ? [36, 4] : da === 2 ? [23, 15] : [124, 32];
      const cells = partsOf(b).flatMap((s) => partsOf(a).map((v) => v * s));
      return worked(
        lead(`${a} × ${b}`) +
        art(gridTable(a, b, { fill: true })) +
        ask(`<b>${cells.join(" + ")} = ${a * b}</b>`) +
        say(`Each box is one part of ${a} times one part of ${b}. Nothing is left out, so adding every box gives ${a} × ${b}.`)
      );
    },
    key(item) {
      const cells = partsOf(item.b).flatMap((s) => partsOf(item.a).map((v) => want.num(v * s)));
      return [...cells, want.num(item.a * item.b)];
    },
    answer(item) {
      return [`${item.a} × ${item.b} = ${item.a * item.b}`];
    },
  };
}

/* ═══ short and long multiplication ════════════════════════════════════════*/

function shortEx(id, da, label, count) {
  return {
    id,
    group: "mul-column",
    label,
    blurb: "One figure times every figure of the number, from the ones, carrying as you go.",
    heading: "Short multiplication",
    instruction: () =>
      "Start with the ONES. Multiply, write the ones figure in the answer and carry the tens into the box " +
      "above the next column. Multiply the next figure, ADD what you carried, and carry again.",
    cols: 2,
    defaultCount: count,
    make(r, o) {
      return { a: numOf(r, o, da), b: single(r, o) };
    },
    render(item) {
      return lead(`${item.a} × ${item.b}`) + art(shortCol(item.a, item.b));
    },
    worked() {
      const [a, b] = da === 2 ? [47, 6] : da === 3 ? [254, 3] : [3172, 4];
      return worked(
        lead(`${a} × ${b}`) + art(shortCol(a, b, { answer: true })) +
        say(da === 2
          ? "6 × 7 = 42: write 2, carry 4. 6 × 4 = 24, and the 4 carried makes 28. The answer is 282."
          : da === 3
            ? "3 × 4 = 12: write 2, carry 1. 3 × 5 = 15, add 1 is 16: write 6, carry 1. 3 × 2 = 6, add 1 is 7. The answer is 762."
            : "4 × 2 = 8. 4 × 7 = 28: write 8, carry 2. 4 × 1 = 4, add 2 is 6. 4 × 3 = 12. The answer is 12 688."));
    },
    key(item) {
      const cols = [...Array(da + 1).keys()].reverse();
      const R = digitsOf(item.a * item.b, da + 1);
      const topR = String(item.a * item.b).length - 1;
      const carries = cols.filter((p) => p >= 1).map(() => want.free());
      return [...carries, ...cols.map((p) => want.cell(R[p], p > topR))];
    },
    answer(item) {
      return [`${item.a} × ${item.b} = ${item.a * item.b}`];
    },
  };
}

function longEx(id, da, label, count) {
  return {
    id,
    group: "mul-column",
    label,
    blurb: "One row for the ones, one for the tens with its 0, and add the two rows.",
    heading: "Long multiplication",
    instruction: () =>
      "First row: the top number times the ONES figure. Second row: write a 0 in the ones column — this row " +
      "is times TENS — then the top number times the tens figure. Add the two rows for the answer.",
    cols: 1,
    defaultCount: count,
    make(r, o) {
      /* a multiplier ending in 0 makes a first row of noughts, which teaches
         nothing about long multiplication and a great deal about boredom */
      let b = numOf(r, o, 2);
      while (b % 10 === 0) b = numOf(r, o, 2);
      return { a: numOf(r, o, da), b };
    },
    render(item) {
      return lead(`${item.a} × ${item.b}`) + art(longCol(item.a, item.b));
    },
    worked() {
      const [a, b] = da === 2 ? [34, 26] : [213, 42];
      const ones = b % 10;
      const tens = Math.floor(b / 10);
      return worked(
        lead(`${a} × ${b}`) + art(longCol(a, b, { answer: true })) +
        say(`${a} × ${ones} = ${a * ones}. Then a 0, because the next row is ${a} × ${tens * 10}: `
          + `${a * tens * 10}. Add the rows: ${a * ones} + ${a * tens * 10} = ${a * b}.`));
    },
    key(item) {
      const places = da + 2;
      const cols = [...Array(places).keys()].reverse();
      const out = [];
      digitsOf(item.b, 2).forEach((d, k) => {
        const v = item.a * d * 10 ** k;
        const V = digitsOf(v, places);
        const top = String(v).length - 1;
        cols.forEach((p) => out.push(want.cell(V[p], p > top)));
      });
      const R = digitsOf(item.a * item.b, places);
      const topR = String(item.a * item.b).length - 1;
      cols.forEach((p) => out.push(want.cell(R[p], p > topR)));
      return out;
    },
    answer(item) {
      return [`${item.a} × ${item.b} = ${item.a * item.b}`];
    },
  };
}

/* ═══ the lattice ══════════════════════════════════════════════════════════*/

function latticeEx(id, da, label, count) {
  return {
    id,
    group: "mul-lattice",
    label,
    blurb: "Every figure times every figure in its own cell, then add along the diagonals.",
    heading: "The lattice method",
    instruction: () =>
      "In each cell, write the figure above it times the figure to its right: the TENS above the diagonal, " +
      "the ONES below it. Then add along each diagonal strip, starting at the bottom right, carrying into the " +
      "next strip. Read the answer down the left side and along the bottom.",
    cols: 1,
    defaultCount: count,
    make(r, o) {
      return pairFor(r, o, da, 2);
    },
    render(item) {
      return lead(`${item.a} × ${item.b}`) + art(latticeTable(item.a, item.b));
    },
    worked() {
      const [a, b] = da === 2 ? [47, 36] : [253, 14];
      return worked(
        lead(`${a} × ${b}`) + art(latticeTable(a, b, { answer: true })) +
        say(`Each cell is one figure times one figure. Adding down the diagonals from the bottom right and carrying `
          + `gives the figures of the answer, read down the left and along the bottom: ${a * b}.`));
    },
    key(item) {
      const as = String(item.a).split("").map(Number);
      const bs = String(item.b).split("").map(Number);
      const dA = as.length;
      const dB = bs.length;
      const R = digitsOf(item.a * item.b, dA + dB);
      const topR = String(item.a * item.b).length - 1;
      const ans = (q) => want.cell(R[q], q > topR);
      const out = [];
      bs.forEach((bd, i) => {
        out.push(ans(dA + dB - 1 - i));
        as.forEach((ad) => {
          const p = ad * bd;
          const t = Math.floor(p / 10);
          out.push(want.cell(t, t === 0), want.cell(p % 10));
        });
      });
      as.forEach((_, j) => out.push(ans(dA - 1 - j)));
      return out;
    },
    answer(item) {
      return [`${item.a} × ${item.b} = ${item.a * item.b}`];
    },
  };
}

/* ═══ word problems ════════════════════════════════════════════════════════*/

const STORIES = [
  (g, n) => `There are <b>${g}</b> boxes of pencils. Each box holds <b>${n}</b> pencils. How many pencils are there altogether?`,
  (g, n) => `A bus has <b>${g}</b> rows of seats with <b>${n}</b> seats in each row. How many seats are on the bus?`,
  (g, n) => `Ada reads <b>${n}</b> pages every day for <b>${g}</b> days. How many pages does she read?`,
  (g, n) => `A farmer plants <b>${g}</b> rows of maize with <b>${n}</b> plants in each row. How many plants is that?`,
  (g, n) => `Tickets cost <b>${n}</b> naira each. How much do <b>${g}</b> tickets cost?`,
  (g, n) => `A crate holds <b>${n}</b> bottles. How many bottles are in <b>${g}</b> crates?`,
];

const mulWords = {
  id: "mul-words",
  group: "mul-words",
  label: "Multiplication stories",
  blurb: "Equal groups hidden in a story: find the groups and the size of each, then multiply.",
  heading: "Solve the problems",
  instruction: () =>
    "Find the number of equal groups and how many are in each. Write the multiplication, work it out any " +
    "way you like, and write the answer.",
  cols: 1,
  defaultCount: 4,
  make(r, o, k, i) {
    const t = tier(o);
    const g = t === "gentle" ? r.int(2, 5) : t === "middle" ? r.int(3, 9) : r.int(12, 35);
    const n = t === "gentle" ? r.int(2, 10) : t === "middle" ? r.int(12, 48) : r.int(15, 64);
    return { g, n, s: i % STORIES.length };
  },
  render(item) {
    return (
      ask(STORIES[item.s](item.g, item.n)) +
      ask(`${box()} × ${box()} = ${box()}`) +
      `<div class="mm-work"></div>`
    );
  },
  key(item) {
    return [want.num(item.g), want.num(item.n), want.num(item.g * item.n)];
  },
  answer(item) {
    return [`${item.g} × ${item.n} = ${item.g * item.n}`];
  },
};

export const MUL_EXERCISES = [
  mulEqualGroups, mulDrawGroups,
  mulArray, mulJumps,
  mulFacts, mulTens,
  mulBlocks,
  gridEx("mul-grid-21", 2, 1, "Grid — 2-digit × 1-digit", 4),
  gridEx("mul-grid-22", 2, 2, "Grid — 2-digit × 2-digit", 3),
  gridEx("mul-grid-32", 3, 2, "Grid — 3-digit × 2-digit", 2),
  shortEx("mul-short-21", 2, "Short — 2-digit × 1-digit", 4),
  shortEx("mul-short-31", 3, "Short — 3-digit × 1-digit", 4),
  shortEx("mul-short-41", 4, "Short — 4-digit × 1-digit", 4),
  longEx("mul-long-22", 2, "Long — 2-digit × 2-digit", 3),
  longEx("mul-long-32", 3, "Long — 3-digit × 2-digit", 2),
  latticeEx("mul-lattice-22", 2, "Lattice — 2-digit × 2-digit", 3),
  latticeEx("mul-lattice-32", 3, "Lattice — 3-digit × 2-digit", 2),
  mulWords,
];
