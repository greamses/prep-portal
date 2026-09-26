/* ============================================================================
   THE WRITTEN BOARDS — all of them, as one kind of thing
   ----------------------------------------------------------------------------
   A long division, a short one, a column addition, a column multiplication, a
   criss-cross and a fraction sum are the same object seen six times: a sheet of
   paper with a method printed on it, that knows the whole sum from the first
   moment, shows only as far as the working has got, asks for one thing at a
   time and says why a wrong answer is wrong.

   Two of them are on purpose a SECOND way to do a sum another already does —
   short division beside the long one, the criss-cross beside the column — and
   that is the reason for the registry: a method is a module and an entry, so
   another way of working a sum costs nothing but the method itself.

   Everything above is identical between them. What differs is only the method
   itself and how the sum is TYPED — two boxes with a sign between them, or one
   box holding "269 + 182". So anything that shows a board is written once
   against this registry, and another method later is a new module and an entry
   here, not another panel.

   The manipulatives canvas keeps its own registry (base-blocks/js/sheets.js)
   because a board there is also a slab with a size and a painter, and it can
   lay a division out in blocks. This one is the plain paper.
   ========================================================================== */

import * as longdiv from "./longdiv.js";
import * as column from "./column.js";
import * as times from "./times.js";
import * as fraction from "./fraction.js";
import * as criss from "./criss.js";
import * as shortdiv from "./shortdiv.js";
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
    name: "Adding and taking away",
    short: "Add, take away",
    sign: "+",
    blurb: "Numbers stacked, a line, and the carrying — or the exchange — shown.",
    make: column.makeColumn,
    /* One box and not two, because the number of things being added is part of
       the sum: "48 + 96 + 7" is a sum a column can do, and a fixed pair of
       boxes would be a rule against it. */
    fields: [{ n: "sum", label: "The sum", aria: "The numbers, with + or − between them", wide: true }],
    read: (t) => ({ sum: column.written(t) }),
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
  criss: {
    id: "criss",
    name: "Criss-cross",
    short: "Criss-cross",
    sign: "×",
    blurb: "Down the ones, across both ways, down the tens — a column of the answer at a time.",
    make: criss.makeCriss,
    fields: [
      { n: "a", label: "Number", aria: "The number being multiplied" },
      { n: "b", label: "Times", aria: "What you are multiplying by" },
    ],
    read: (t) => ({ a: writeNum(t.a, 0, t.base), b: writeNum(t.b, 0, t.base) }),
    set: (t, v) => criss.setWritten(t, v.a, v.b),
    ask: criss.ask,
    answer: criss.answer,
    showNext: criss.showNext,
    reset: criss.resetWork,
    cells: criss.cellsOf,
    sheet: criss.sheetOf,
  },
  shortdiv: {
    id: "shortdiv",
    name: "Short division",
    short: "Short division",
    sign: "÷",
    blurb: "Divide one figure at a time and carry what is left into the next.",
    make: shortdiv.makeShortDiv,
    fields: [
      { n: "dividend", label: "Number being divided", aria: "The number being divided" },
      { n: "divisor", label: "Divided by", aria: "What you are dividing by — one figure" },
    ],
    read: (t) => ({ dividend: writeNum(t.n, 0, t.base), divisor: writeNum(t.d, 0, t.base) }),
    set: (t, v) => shortdiv.setWritten(t, v.dividend, v.divisor),
    ask: shortdiv.ask,
    answer: shortdiv.answer,
    showNext: shortdiv.showNext,
    reset: shortdiv.resetWork,
    cells: shortdiv.cellsOf,
    sheet: shortdiv.sheetOf,
  },
  fraction: {
    id: "fraction",
    name: "Fractions",
    short: "Fractions",
    /* No sign between the boxes: which one it is is the middle box. */
    sign: "",
    blurb: "The same amount written again and again until it is tidy.",
    make: fraction.makeFraction,
    fields: [
      /* typed with a "/" and a space, which a number pad has neither of */
      { n: "a", label: "First fraction", aria: "The first fraction, like 3/4 or 2 3/4", mode: "text" },
      { n: "op", label: "Do what", aria: "What to do with them", pick: fraction.OPS },
      { n: "b", label: "Second fraction", aria: "The second fraction, like 5/6", mode: "text" },
    ],
    read: (t) => ({
      a: fraction.writeFraction(t.a, t.base),
      op: t.op,
      b: fraction.writeFraction(t.b, t.base),
    }),
    set: (t, v) => fraction.setWritten(t, v.a, v.op, v.b),
    ask: fraction.ask,
    answer: fraction.answer,
    showNext: fraction.showNext,
    reset: fraction.resetWork,
    cells: fraction.cellsOf,
    sheet: fraction.sheetOf,
  },
};

/** The board a variant names, or null. */
export function boardFor(variant) {
  return BOARDS[variant] || null;
}
