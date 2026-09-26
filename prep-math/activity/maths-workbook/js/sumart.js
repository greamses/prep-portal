/* ============================================================================
   Maths Workbook — a sum written both ways
   ----------------------------------------------------------------------------
   The same addition, written ACROSS and written DOWN, on the same question.

   That pairing is the whole reason this organiser exists. A child who can do
   23 + 14 across the page and is then handed a column of figures often does
   not recognise it as the sum they just did — they have learned two rituals
   instead of one idea. Printed side by side with the blocks that make both of
   them true, the three are one thing seen three ways.

   THE COLUMN IS RULED LIKE A CHART. Ones under ones, tens under tens, with a
   faint line between the places, because the single thing that goes wrong in a
   written sum is a digit in the wrong column. The carry (or the exchange) has
   its own small box above the column it belongs to, so a child who has been
   taught to "put the one over there" has somewhere exact to put it.
   ========================================================================== */

import { placeFill } from "./blocks.js";

/* ── the sum written across ────────────────────────────────────────────────*/

/** 23 + 14 = ___ . The answer is a box, never a ruled line: it holds figures. */
export function across(a, b, op, { answer = null } = {}) {
  const sign = op === "-" ? "−" : "+";
  return (
    `<span class="ms-across">` +
    `<span class="ms-across__n">${a}</span>` +
    `<span class="ms-across__op">${sign}</span>` +
    `<span class="ms-across__n">${b}</span>` +
    `<span class="ms-across__op">=</span>` +
    (answer === null ? `<span class="ms-across__box"></span>` : `<b>${answer}</b>`) +
    `</span>`
  );
}

/* ── the sum written down ──────────────────────────────────────────────────*/

const digitsOf = (n, places) => {
  const out = [];
  let v = n;
  for (let i = 0; i < places; i++) {
    out.push(v % 10);
    v = Math.floor(v / 10);
  }
  return out; // lowest place first, like everywhere else on this paper
};

/**
 * The column form.
 *
 * `carries` is the row of small boxes above the sum. It is printed EMPTY for a
 * question that needs regrouping and left out entirely for one that does not —
 * a carry box on a sum with no carry is a box a child dutifully writes a 0 in.
 *
 * `answer` fills the line under the rule in, which only the worked example does.
 */
export function down(a, b, op, { places = 2, carries = false, answer = null } = {}) {
  const A = digitsOf(a, places);
  const B = digitsOf(b, places);

  /* An addition can spill into a place neither number has — 91 + 34 is three
     figures — so it gets one extra column on the left. A subtraction never
     can, and giving it one would say the answer might be bigger than the
     number you started with.
     
     EVERY ROW USES THE SAME COLUMNS. The columns are what this drawing is
     about, and a table where one row has an extra cell puts every figure in
     the row above into the wrong column. */
  const spill = op === "+";
  const cols = [...Array(places + (spill ? 1 : 0)).keys()].reverse();
  const total = op === "-" ? a - b : a + b;
  const S = digitsOf(total, cols.length);
  /* the highest column the answer actually reaches: above it the boxes are
     there to be left empty, and the screen knows not to ask for them */
  const top = String(Math.abs(total)).length - 1;

  const NAMES = ["O", "T", "H", "Th"];

  /* The head names the places and tints them the same butter/sky/leaf as the
     blocks and the place-value chart, so a column here and a column there are
     visibly the same column. The spill column is left unnamed and untinted:
     it is not a place the question is about, it is room to be surprised. */
  const head =
    `<tr class="ms-down__head"><td></td>` +
    cols
      .map((p) =>
        p < places
          ? `<td style="--ms-fill:${placeFill(p)}">${NAMES[p] || ""}</td>`
          : `<td class="ms-down__spill"></td>`
      )
      .join("") +
    `</tr>`;

  /* WHAT GOES IN THE CARRY BOX, when the sum is worked for the child.
     Adding, it is the ten that moved on — a 1. Taking away, it is what the
     column has LEFT after lending, which is the figure a child is told to
     write above the column they crossed out. Printed blank for a question,
     written in for the one done for them: a worked example with empty carry
     boxes shows the answer and hides the only step that was difficult. */
  const carryFigures = () => {
    const out = [];
    if (op === "-") {
      const lent = [];
      let borrow = 0;
      for (let p = 0; p < places; p++) {
        let have = A[p] - borrow;
        borrow = 0;
        if (have < B[p]) { have += 10; borrow = 1; lent[p + 1] = 1; }
        /* a column that gave a ten away, or was given one, is no longer the
           figure printed under it — so it says what it is now */
        if (lent[p] || borrow) out[p] = have;
      }
      return out;
    }
    let carry = 0;
    for (let p = 0; p < places; p++) {
      const sum = A[p] + B[p] + carry;
      carry = sum >= 10 ? 1 : 0;
      if (carry) out[p + 1] = 1;
    }
    return out;
  };
  const figures = answer === null ? [] : carryFigures();

  /* A carry box sits above the column the carry goes INTO, so every column but
     the ones has one. Nothing has ever been carried into the ones. */
  const carryRow = carries
    ? `<tr class="ms-down__carry" data-carryrow><td></td>` +
      cols
        .map((p) => `<td>${p < 1 ? ""
          : figures[p] == null
            ? `<span class="ms-down__carrybox" data-carry="${p}"></span>`
            /* written in, not left to be written: print, not a place */
            : `<span class="ms-down__carrywrote">${figures[p]}</span>`}</td>`)
        .join("") +
      `</tr>`
    : "";

  const cell = (text, cls = "") => `<td class="ms-down__cell ${cls}">${text}</td>`;
  const figure = (d, p) => (p < places ? d[p] : "");
  const rowA =
    `<tr><td class="ms-down__sign"></td>` +
    cols.map((p) => cell(figure(A, p))).join("") +
    `</tr>`;
  const rowB =
    `<tr class="ms-down__second"><td class="ms-down__sign">${op === "-" ? "−" : "+"}</td>` +
    cols.map((p) => cell(figure(B, p))).join("") +
    `</tr>`;
  /* The answer row. A box the answer does not reach says `data-blank`: on paper
     it is a box like any other — whether the answer spills is part of the
     question — but on screen nothing asks for it, because the working never
     goes there. */
  const rowS =
    `<tr class="ms-down__answer"><td></td>` +
    cols
      .map((p) => (answer === null
        ? `<td class="ms-down__cell wb-cell" data-col="${p}"${p > top ? " data-blank" : ""}></td>`
        : cell(p <= top ? S[p] : "")))
      .join("") +
    `</tr>`;

  /* A question is worked one box at a time, from the right — the same way the
     written board in the tool panel asks (interactive.js stepwise). The one
     done for the child has nothing to step through, so it does not say it
     steps. */
  const steps = answer === null ? ` data-steps="rtl"` : "";
  return `<table class="ms-down"${steps}>` + head + carryRow + rowA + rowB + rowS + `</table>`;
}

/* ── the two together ──────────────────────────────────────────────────────*/

/**
 * The pairing this file exists for: the blocks, then the sum across, then the
 * same sum down. Always in that order — concrete, then the notation a child
 * already reads, then the notation they are learning.
 */
export function bothWays(a, b, op, opts = {}) {
  return (
    `<div class="ms-ways">` +
    `<div class="ms-ways__across">${across(a, b, op, opts)}</div>` +
    `<div class="ms-ways__down">${down(a, b, op, opts)}</div>` +
    `</div>`
  );
}
