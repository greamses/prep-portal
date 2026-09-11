/* ============================================================================
   THE WRITTEN BOARDS — the three of them, as one kind of thing
   ----------------------------------------------------------------------------
   A long division, a column addition and a column multiplication are the same
   object seen three times: a sheet of paper with a method printed on it, that
   knows the whole sum from the first moment, shows only as far as the working
   has got, asks for one figure at a time and says why a wrong one is wrong.

   Everything above is identical between them. What differs is only the method
   itself and how the sum is TYPED — two boxes with a sign between them, or one
   box holding "269 + 182". So anything that shows a board is written once
   against this registry, and a fourth method later is a new module and an entry
   here, not a fourth panel.

   The manipulatives canvas keeps its own registry (base-blocks/js/sheets.js)
   because a board there is also a slab with a size and a painter, and it can
   lay a division out in blocks. This one is the plain paper.
   ========================================================================== */

import * as longdiv from "./longdiv.js";
import * as column from "./column.js";
import * as times from "./times.js";
import { writeNum } from "./num.js";

export const BOARDS = {
  longdiv: {
    id: "longdiv",
    name: "Long division",
    short: "Division",
    sign: "÷",
    blurb: "The bus stop, worked a line at a time.",
    make: longdiv.makeLongDiv,
    fields: [
      { n: "dividend", label: "Number being divided", aria: "The number being divided" },
      { n: "divisor", label: "Divided by", aria: "What you are dividing by" },
    ],
    read: (t) => ({
      dividend: writeNum(t.dividend, t.dpA || 0, t.base),
      divisor: writeNum(t.divisor, t.dpB || 0, t.base),
    }),
    set: (t, v) => longdiv.setWritten(t, v.dividend, v.divisor),
    ask: longdiv.ask,
    answer: longdiv.answer,
    showNext: longdiv.showNext,
    reset: longdiv.resetWork,
    cells: longdiv.cellsOf,
    sheet: longdiv.sheetOf,
    /* The one step on any of these boards that is not typed: copying a figure
       down the page is a movement and not a calculation. */
    bring: longdiv.bringDown,
  },
  column: {
    id: "column",
    name: "Table addition",
    short: "Adding",
    sign: "+",
    blurb: "Numbers stacked, a line, and the carrying shown.",
    make: column.makeColumn,
    /* One box and not two, because the number of things being added is part of
       the sum: "48 + 96 + 7" is a sum a column can do, and a fixed pair of
       boxes would be a rule against it. */
    fields: [{ n: "sum", label: "The numbers to add", aria: "The numbers to add, with + between them", wide: true }],
    read: (t) => ({ sum: t.addends.map((n) => writeNum(n, t.dp || 0, t.base)).join(" + ") }),
    set: (t, v) => column.setWritten(t, v.sum),
    ask: column.ask,
    answer: column.answer,
    showNext: column.showNext,
    reset: column.resetWork,
    cells: column.cellsOf,
    sheet: column.sheetOf,
  },
  times: {
    id: "times",
    name: "Table multiplication",
    short: "Multiplying",
    sign: "×",
    blurb: "A row for every figure, and an addition to finish.",
    make: times.makeTimes,
    fields: [
      { n: "multiplicand", label: "Number being multiplied", aria: "The number being multiplied" },
      { n: "multiplier", label: "Multiplied by", aria: "What you are multiplying it by" },
    ],
    read: (t) => ({
      multiplicand: writeNum(t.multiplicand, t.dpA || 0, t.base),
      multiplier: writeNum(t.multiplier, t.dpB || 0, t.base),
    }),
    set: (t, v) => times.setWritten(t, v.multiplicand, v.multiplier),
    ask: times.ask,
    answer: times.answer,
    showNext: times.showNext,
    reset: times.resetWork,
    cells: times.cellsOf,
    sheet: times.sheetOf,
  },
};

/** The board a variant names, or null. */
export function boardFor(variant) {
  return BOARDS[variant] || null;
}
