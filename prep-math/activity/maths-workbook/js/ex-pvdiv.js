/* ============================================================================
   Maths Workbook — dividing by ONE figure, with counters and a chart
   ----------------------------------------------------------------------------
   Two methods, and they are the same method written two ways:

     PLACE VALUE DIVISION   the child writes the VALUES: 400, 150, 21 …
     BOX DIVISION           the child writes only the DIGITS: 4, 15, 21 …

   Every question has TWO CHARTS:

     the COUNTING GRID   (utils/components/workbook/divmat.js) — counters. The
                         top row is the number, built from hundreds, tens and
                         ones; the bottom row is each column cut into as many
                         groups as the divisor, to share into. A counter that
                         cannot be shared is broken into ten of the next place.
                         Never marked: it is the working.
     the INPUT GRID      a column for every figure of the number, and a row
                         for Divide, Multiply and Subtract. This is what is
                         marked.

   THE RULE — D M S R, "Does My Sister Run?" — down each column and on:
     D  DIVIDE      how many go into each group
     M  MULTIPLY    how many were shared out altogether
     S  SUBTRACT    how many are left over
     R  REGROUP     carry what is left over to the next place

   REGROUP HAS NO ROW. What is left over is carried along an ARROW, from the
   Subtract box up to a small box standing BESIDE the next figure of the
   number — the figure it makes its tens with. A 1 carried beside a 7 reads
   17; in place value division, 100 carried beside 70 makes 170.

   The boxes open one at a time in the order of the rule
   (`data-steps="listed"`): the carry of a column, then its D, M and S.
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { divMat, placesFor } from "/utils/components/workbook/divmat.js";
import { levelOf } from "./ex-remainder.js";
import { divWork } from "./divwork.js";
import { videoStrip } from "./divvideo.js";

export { divWork };

/* the rows of the input grid under its headings, in the order each method prints them */
const ROWS = {
  /* place value: the number, then straight down the rule */
  value: ["number", "divide", "multiply", "subtract"],
  /* the box: the answer stands on top of it, as it does in a division box */
  digit: ["divide", "number", "multiply", "subtract"],
};
/* when a box is filled, within its column: the carry first, then D, M, S */
const STEP = { number: 0, divide: 1, multiply: 2, subtract: 3 };
const FIELD = { divide: "q", multiply: "m", subtract: "s" };
const LETTER = { divide: "D", multiply: "M", subtract: "S" };
const NAME = (d) => ({ divide: `Divide by&nbsp;${d}`, multiply: `Multiply by&nbsp;${d}`, subtract: "Subtract" });

/* the grid is measured, so that the carry arrows can be drawn across it: millimetres */
const G = { name: 31, col: 25, head: 6.5, row: 10.5 };

/** what a box of the grid holds: the digits, or — for place value — what they are worth */
const held = (col, row, mode) => col[FIELD[row]] * (mode === "value" ? col.place : 1);
/** what is carried INTO column c: what the column before had left over */
const carried = (W, c, mode) => W.cols[c - 1].s * (mode === "value" ? W.cols[c - 1].place : 1);

/** The rule, as it is remembered: on a small sticky note that stands beside the grid. */
const ruleNote = () => `<aside class="pvd-note pp-sticky pp-sticky--tape pp-sticky--c0" aria-label="Divide, Multiply, Subtract, Regroup: Does My Sister Run?">`
  + `<span class="pvd-note__say">Does My Sister Run?</span>`
  + [["D", "Divide"], ["M", "Multiply"], ["S", "Subtract"], ["R", "Regroup"]]
    .map(([l, what]) => `<span class="pvd-note__one"><b>${l}</b>${what}</span>`).join("")
  + `</aside>`;

/** The arrows that carry what is left over: from each Subtract box up to the small box beside the next figure. */
function carryArrows(k, mode) {
  const numberRow = ROWS[mode].indexOf("number");
  const ys = G.head + G.row * 3.5, ye = G.head + G.row * (numberRow + 0.5);
  let s = "";
  for (let c = 0; c < k - 1; c++) {
    const xb = G.name + G.col * (c + 1);
    s += `<path d="M${xb - 1.5} ${ys}Q${xb} ${ys} ${xb} ${ys - 2.4}L${xb} ${ye + 2.4}Q${xb} ${ye} ${xb + 1.2} ${ye}" fill="none" stroke="#2a6ca8" stroke-width="0.55" stroke-linecap="round"/>`
      + `<path d="M${xb + 0.5} ${ye - 1.2}L${xb + 2} ${ye}L${xb + 0.5} ${ye + 1.2}Z" fill="#2a6ca8"/>`;
  }
  const w = G.name + G.col * k, h = G.head + G.row * 4;
  return `<svg class="pvd-arrows" viewBox="0 0 ${w} ${h}" style="width:${w}mm;height:${h}mm" aria-hidden="true">${s}</svg>`;
}

/**
 * The input grid.
 *   mode     "value" (place value division) or "digit" (box division)
 *   answer   true prints it filled in, for the worked example
 */
function inputGrid(n, d, mode, { answer = false } = {}) {
  const W = divWork(n, d);
  const k = W.cols.length;
  const label = NAME(d);
  const box = (v, step, cls = "") => (answer
    ? `<span class="pvd-done ${cls}">${v}</span>`
    : `<span class="wb-answer ${cls}" data-step="${step}"></span>`);
  const head = `<span class="pvd-name"></span>` + placesFor(k).map((p) => `<span class="pvd-head" data-kind="${p.v}">${p.name}</span>`).join("");
  const row = {
    /* the number: each figure, and beside every figure but the first the small box its carry is written in */
    number: () => `<span class="pvd-name pvd-name--number">${mode === "digit" ? `<b class="pvd-by">${d}</b>` : "The number"}</span>`
      + W.cols.map((col, c) => `<span class="pvd-cell pvd-cell--given${c ? " has-carry" : ""}">`
        + (c ? box(carried(W, c, mode), c * 4 + STEP.number, "pvd-carry") + (mode === "value" ? `<i class="pvd-plus">+</i>` : "") : "")
        + `<span class="pvd-fig">${mode === "value" ? col.digit * col.place : col.digit}</span></span>`).join(""),
  };
  ["divide", "multiply", "subtract"].forEach((r) => {
    row[r] = () => `<span class="pvd-name"><b class="pvd-l">${LETTER[r]}</b>${label[r]}</span>`
      + W.cols.map((col, c) => `<span class="pvd-cell" data-row="${r}">${box(held(col, r, mode), c * 4 + STEP[r])}</span>`).join("");
  });
  const body = head + ROWS[mode].map((r) => `<span class="pvd-row pvd-row--${r}">${row[r]()}</span>`).join("");
  const end = answer
    ? `<p class="wb-ask pvd-end">${n} ÷ ${d} = <b>${W.q}</b>${W.r ? ` remainder <b>${W.r}</b>` : ""}</p>`
    : `<p class="wb-ask pvd-end">${n} ÷ ${d} = <span class="wb-answer" data-step="${k * 4}"></span> remainder <span class="wb-answer" data-step="${k * 4 + 1}"></span></p>`;
  return `<div class="pvd pvd--${mode}" data-steps="listed"><div class="pvd-side">`
    + `<div class="pvd-grid" style="--pvd-cols:${k}">${body}${carryArrows(k, mode)}</div>${ruleNote()}</div>${end}</div>`;
}

/** the answers, in the order the boxes stand on the page */
function gridKey(n, d, mode) {
  const W = divWork(n, d);
  const out = [];
  ROWS[mode].forEach((r) => W.cols.forEach((col, c) => {
    if (r === "number") { if (c) out.push(want.num(carried(W, c, mode))); } else out.push(want.num(held(col, r, mode)));
  }));
  out.push(want.num(W.q), want.num(W.r));
  return out;
}

const TEXT = {
  value: {
    heading: "Place value division",
    how: "Write the VALUE every time: 4 hundreds is 400, 15 tens is 150.",
    worked: (n, d) => { const W = divWork(n, d); const [a, b2, c] = W.cols;
      return `Hundreds: ${a.now * 100} ÷ ${d} is ${a.q * 100} each, which uses ${a.m * 100}, and ${a.s * 100} is left. Carry it along the arrow: ${a.s * 100} and ${b2.digit * 10} make ${b2.now * 10}. `
        + `Tens: ${b2.now * 10} ÷ ${d} is ${b2.q * 10} each, which uses ${b2.m * 10}, and ${b2.s * 10} is left. Carry it: ${b2.s * 10} and ${c.digit} make ${c.now}. `
        + `Ones: ${c.now} ÷ ${d} is ${c.q} each, which uses ${c.m}, and ${c.s} is left. ${a.q * 100} + ${b2.q * 10} + ${c.q} = ${W.q}, remainder ${W.r}.`; },
  },
  digit: {
    heading: "Box division",
    how: "Write only the DIGITS: 4 for 4 hundreds, 15 for 15 tens. The answer is the row on top of the box.",
    worked: (n, d) => { const W = divWork(n, d); const [a, b2, c] = W.cols;
      return `Hundreds: ${a.now} ÷ ${d} is ${a.q}; ${a.q} × ${d} is ${a.m}; ${a.now} − ${a.m} is ${a.s}. Carry the ${a.s} along the arrow: beside the ${b2.digit} it reads ${b2.now}. `
        + `Tens: ${b2.now} ÷ ${d} is ${b2.q}; ${b2.q} × ${d} is ${b2.m}; ${b2.now} − ${b2.m} is ${b2.s}. Carry the ${b2.s}: beside the ${c.digit} it reads ${c.now}. `
        + `Ones: ${c.now} ÷ ${d} is ${c.q}; ${c.q} × ${d} is ${c.m}; ${c.now} − ${c.m} is ${c.s}. The top row reads ${W.q}, remainder ${W.r}.`; },
  },
};

const RULE = "The rule is the same in every column — D, M, S, R: Does My Sister Run? DIVIDE, MULTIPLY, SUBTRACT, REGROUP. ";
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
      ? "Counters shared on a chart, and the values written: 400, 150, 21."
      : "Counters shared on a chart, and only the digits written: 4, 15, 21.",
    heading: `${T.heading} — ${digits === 2 ? "two" : "three"} figures by one`,
    instruction: () => COUNTERS + RULE + "In the input grid, start with the first column: write how many go into each group "
      + "(divide), how many that used (multiply), and how many are left (subtract). Then REGROUP: follow the arrow, and "
      + "write what is left in the small box beside the next figure. " + T.how,
    cols: 1,
    defaultCount: count,
    /* PrepBot's video opens the section, whatever the level of help (subject.js sectionHead) */
    video: () => videoStrip(mode, T.heading),
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
