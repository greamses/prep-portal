/* ============================================================================
   Manipulatives — the boards you WORK on, as one kind of thing
   ----------------------------------------------------------------------------
   A long division and a column addition are the same object seen twice: a sheet
   of paper with a method printed on it, that knows the whole sum from the first
   moment, shows only as far as the working has got, asks for one figure at a
   time and says why a wrong one is wrong.

   Everything above is identical between them. What differs is only the method
   itself and how the sum is TYPED — two boxes with a ÷ between them, or one box
   holding "269 + 182". So the panel is written once against this registry, and
   a third method later is a new module and an entry here, not a third panel.

   `read` and `set` are the pair that make the sum row work: read puts the sum
   the board is showing into the boxes, set takes what was typed and puts it on
   the board. Parsing lives on the sheet's own side of the line, because what
   counts as a legal sum is part of the method and not part of the strip.
   ========================================================================== */

import { toBase, fromBase } from "./config.js";
import * as longdiv from "./longdiv.js";
import * as column from "./column.js";

export const SHEETS = {
  longdiv: {
    name: "long division",
    sep: "÷",
    fields: [
      { n: "dividend", aria: "The number being divided" },
      { n: "divisor", aria: "What you are dividing by" },
    ],
    read: (t) => ({ dividend: toBase(t.dividend, t.base), divisor: toBase(t.divisor, t.base) }),
    set: (t, v) => longdiv.setSum(t, fromBase(v.dividend, t.base), fromBase(v.divisor, t.base)),
    ask: longdiv.ask,
    answer: longdiv.answer,
    showNext: longdiv.showNext,
    reset: longdiv.resetWork,
  },
  column: {
    name: "column addition",
    sep: "",
    /* One box and not two, because the number of things being added is part of
       the sum: "48 + 96 + 7" is a sum a column can do, and a fixed pair of
       boxes would be a rule against it. */
    fields: [{ n: "sum", aria: "The numbers to add, with + between them", wide: true }],
    read: (t) => ({ sum: t.addends.map((n) => toBase(n, t.base)).join(" + ") }),
    set: (t, v) => column.setSum(t, column.readSum(v.sum, t.base)),
    ask: column.ask,
    answer: column.answer,
    showNext: column.showNext,
    reset: column.resetWork,
  },
};

/** The method a thing is worked by, or null if it is not one of these boards. */
export function sheetFor(thing) {
  if (!thing || thing.kind !== "board") return null;
  return SHEETS[thing.variant] || null;
}

/** Whether a variant is a worked sheet — asked by the base and the tool table. */
export function isSheet(variant) {
  return !!SHEETS[variant];
}
