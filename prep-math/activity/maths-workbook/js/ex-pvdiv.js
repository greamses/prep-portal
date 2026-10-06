/* ============================================================================
   Maths Workbook — dividing by ONE figure, with counters and a chart
   ----------------------------------------------------------------------------
   Two methods, and they are the same method written two ways:

     PLACE VALUE DIVISION   the child writes the VALUES: 400, 170, 22 …
     BOX DIVISION           the child writes only the DIGITS: 4, 17, 22 …

   Every question has TWO CHARTS:

     the COUNTING GRID   (utils/components/workbook/divmat.js) — counters. The
                         top row is the number, built from hundreds, tens and
                         ones; the bottom row is each column cut into as many
                         groups as the divisor, to share into. A counter that
                         cannot be shared is broken into ten of the next place.
                         Never marked: it is the working.
     the INPUT GRID      a column for every figure of the number, and a row
                         for every part of the rule. This is what is marked.

   THE RULE, down each column and then on to the next:
     DIVIDE      how many go into each group
     MULTIPLY    how many were shared out altogether
     SUBTRACT    how many are left over
     REGROUP     break what is left into ten of the next place, and put it
                 with what is there — the top of the NEXT column

   So the "Regroup" row of a column is what that column HAS once the leftover
   from the column before has been broken into it; the first column needs no
   regrouping, and its box is not there. The boxes open one at a time in that
   order (`data-steps="listed"`).
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { divMat, placesFor } from "/utils/components/workbook/divmat.js";
import { levelOf } from "./ex-remainder.js";

/** The working of n ÷ d, a column at a time, in DIGITS: what each column has, and the three steps. */
export function divWork(n, d) {
  const digits = String(n).split("").map(Number);
  let carry = 0;
  const cols = digits.map((digit, c) => {
    const now = carry * 10 + digit;
    const q = Math.floor(now / d), m = q * d, s = now - m;
    carry = s;
    return { digit, now, q, m, s, place: 10 ** (digits.length - 1 - c) };
  });
  return { cols, q: Math.floor(n / d), r: n % d };
}

/* the rows of the input grid, in the order each method prints them */
const ROWS = {
  /* place value: straight down the rule */
  value: ["regroup", "divide", "multiply", "subtract"],
  /* the box: the answer stands on top of it, as it does in a division box */
  digit: ["divide", "regroup", "multiply", "subtract"],
};
const STEP = { regroup: 0, divide: 1, multiply: 2, subtract: 3 };
const FIELD = { regroup: "now", divide: "q", multiply: "m", subtract: "s" };
const NAME = (d) => ({ regroup: "Regroup", divide: `Divide by&nbsp;${d}`, multiply: `Multiply by&nbsp;${d}`, subtract: "Subtract" });

/** what a box of the grid holds: the digits, or — for place value — what they are worth */
const held = (col, row, mode) => col[FIELD[row]] * (mode === "value" ? col.place : 1);

/**
 * The input grid.
 *   mode     "value" (place value division) or "digit" (box division)
 *   answer   true prints it filled in, for the worked example
 */
function inputGrid(n, d, mode, { answer = false } = {}) {
  const W = divWork(n, d);
  const k = W.cols.length;
  const names = placesFor(k);
  const label = NAME(d);
  const box = (v, step) => (answer
    ? `<span class="pvd-cell pvd-cell--done">${v}</span>`
    : `<span class="pvd-cell"><span class="wb-answer" data-step="${step}"></span></span>`);
  const numberRow = `<span class="pvd-name">${mode === "digit" ? `<b class="pvd-by">${d}</b>` : "The number"}</span>`
    + W.cols.map((col) => `<span class="pvd-cell pvd-cell--given">${mode === "value" ? col.digit * col.place : col.digit}</span>`).join("");
  const row = (r) => `<span class="pvd-name">${label[r]}</span>` + W.cols.map((col, c) => (r === "regroup" && c === 0
    ? `<span class="pvd-cell pvd-cell--none" aria-hidden="true"></span>`
    : box(held(col, r, mode), c * 4 + STEP[r]))).join("");
  const head = `<span class="pvd-name"></span>` + names.map((p) => `<span class="pvd-head" data-kind="${p.v}">${p.name}</span>`).join("");
  const body = mode === "digit"
    ? head + `<span class="pvd-quot">${row("divide")}</span>` + `<span class="pvd-boxrow">${numberRow}</span>` + ["regroup", "multiply", "subtract"].map(row).join("")
    : head + numberRow + ROWS.value.map(row).join("");
  const end = answer
    ? `<p class="wb-ask pvd-end">${n} ÷ ${d} = <b>${W.q}</b>${W.r ? ` remainder <b>${W.r}</b>` : ""}</p>`
    : `<p class="wb-ask pvd-end">${n} ÷ ${d} = <span class="wb-answer" data-step="${k * 4}"></span> remainder <span class="wb-answer" data-step="${k * 4 + 1}"></span></p>`;
  return `<div class="pvd pvd--${mode}" data-steps="listed"><div class="pvd-grid" style="--pvd-cols:${k}">${body}</div>${end}</div>`;
}

/** the answers, in the order the boxes stand on the page */
function gridKey(n, d, mode) {
  const W = divWork(n, d);
  const out = [];
  ROWS[mode].forEach((r) => W.cols.forEach((col, c) => { if (!(r === "regroup" && c === 0)) out.push(want.num(held(col, r, mode))); }));
  out.push(want.num(W.q), want.num(W.r));
  return out;
}

const TEXT = {
  value: {
    heading: "Place value division",
    how: "Write the VALUE every time: 4 hundreds is 400, 17 tens is 170.",
    worked: (n, d) => { const W = divWork(n, d); const [a, b2, c] = W.cols;
      return `Hundreds: ${a.now * 100} ÷ ${d} is ${a.q * 100} each, which uses ${a.m * 100}, and ${a.s * 100} is left. Break it into tens: with the ${b2.digit * 10} that makes ${b2.now * 10}. `
        + `Tens: ${b2.now * 10} ÷ ${d} is ${b2.q * 10} each, which uses ${b2.m * 10}, and ${b2.s * 10} is left. Break it into ones: with the ${c.digit} that makes ${c.now}. `
        + `Ones: ${c.now} ÷ ${d} is ${c.q} each, which uses ${c.m}, and ${c.s} is left. ${a.q * 100} + ${b2.q * 10} + ${c.q} = ${W.q}, remainder ${W.r}.`; },
  },
  digit: {
    heading: "Box division",
    how: "Write only the DIGITS: 4 for 4 hundreds, 17 for 17 tens. The answer is the row on top of the box.",
    worked: (n, d) => { const W = divWork(n, d); const [a, b2, c] = W.cols;
      return `Hundreds: ${a.now} ÷ ${d} is ${a.q}; ${a.q} × ${d} is ${a.m}; ${a.now} − ${a.m} is ${a.s}. Regroup: ${a.s} hundred and ${b2.digit} tens is ${b2.now} tens. `
        + `Tens: ${b2.now} ÷ ${d} is ${b2.q}; ${b2.q} × ${d} is ${b2.m}; ${b2.now} − ${b2.m} is ${b2.s}. Regroup: ${b2.s} tens and ${c.digit} ones is ${c.now} ones. `
        + `Ones: ${c.now} ÷ ${d} is ${c.q}; ${c.q} × ${d} is ${c.m}; ${c.now} − ${c.m} is ${c.s}. The top row reads ${W.q}, remainder ${W.r}.`; },
  },
};

const RULE = "The rule is the same in every column: DIVIDE, MULTIPLY, SUBTRACT, REGROUP. ";
const COUNTERS = "Use the counting grid first. Put the counters that make the number in its TOP row. Share each column into "
  + "the groups in its BOTTOM row — whatever cannot be shared stays on top. Break a counter that is left into TEN of "
  + "the next place, and it joins the next column. What is left in the ones at the end is the remainder. ";

function divEx({ id, group, mode, digits, label, count }) {
  const T = TEXT[mode];
  return {
    id,
    group,
    label,
    blurb: mode === "value"
      ? "Counters shared on a chart, and the values written: 400, 170, 22."
      : "Counters shared on a chart, and only the digits written: 4, 17, 22.",
    heading: `${T.heading} — ${digits === 2 ? "two" : "three"} figures by one`,
    instruction: () => COUNTERS + RULE + "In the input grid, start with the first column: write how many go into each group "
      + "(divide), how many that used (multiply), and how many are left (subtract). Then REGROUP: break what is left "
      + "into the next place and write what the next column has now. " + T.how,
    cols: 1,
    defaultCount: count,
    make(r, o) {
      const d = r.pick(levelOf(o).divisors.filter((x) => x >= 2 && x <= 9));
      /* the first figure can always be shared, so the first column is never an empty one */
      return { d, n: r.int(d * 10 ** (digits - 1), 10 ** digits - 1) };
    },
    render: ({ n, d }) => `<p class="wb-ask wb-ask--lead"><b>${n} ÷ ${d}</b></p>` + divMat({ n, d }) + inputGrid(n, d, mode),
    worked: () => `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>`
      + `<p class="wb-ask wb-ask--lead"><b>472 ÷ 3</b></p>` + inputGrid(472, 3, mode, { answer: true })
      + `<p class="wb-ask rw-worked__say">${T.worked(472, 3)}</p></div>`,
    key: ({ n, d }) => gridKey(n, d, mode),
    answer: ({ n, d }) => { const W = divWork(n, d); return [`${n} ÷ ${d} = ${W.q}${W.r ? ` r ${W.r}` : ""}`]; },
  };
}

/* The two sections are named in REM_GROUPS (ex-remainder.js), between the leftover and short division. */
export const PVDIV_EXERCISES = [
  divEx({ id: "pvdiv-two", group: "pv-div", mode: "value", digits: 2, label: "Place value division: two figures", count: 2 }),
  divEx({ id: "pvdiv-three", group: "pv-div", mode: "value", digits: 3, label: "Place value division: three figures", count: 2 }),
  divEx({ id: "boxdiv-two", group: "box-div", mode: "digit", digits: 2, label: "Box division: two figures", count: 2 }),
  divEx({ id: "boxdiv-three", group: "box-div", mode: "digit", digits: 3, label: "Box division: three figures", count: 2 }),
];
