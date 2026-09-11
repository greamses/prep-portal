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

   `value` and `setValue` are how a sheet joins in with sync — see sync.js. A
   written sum holds a number like a frame or a chart does: the DIVIDEND for a
   division (the number being shared out) and the TOTAL for an addition (what
   the sum comes to). Neither is the answer being worked towards, and that is
   deliberate: sync passes round the number a tool is working ON.

   `cells` is the other half of the same idea: the ANSWER is typed into the page
   itself (js/cells.js), so each method says which cells are open for writing and
   how many figures go in them. A method with a step that is dragged rather than
   typed says so there too, and answers to `bring`.
   ========================================================================== */

import { writeNum } from "./config.js";
import * as longdiv from "./longdiv.js";
import { stageOf, layStage, stageSentence, groupNote, setAside } from "./divblocks.js";
import * as column from "./column.js";
import * as times from "./times.js";
import * as fraction from "./fraction.js";

export const SHEETS = {
  longdiv: {
    name: "long division",
    sep: "÷",
    fields: [
      { n: "dividend", aria: "The number being divided" },
      { n: "divisor", aria: "What you are dividing by" },
    ],
    /* Written, not counted: a sum may have a point in it, and "12.5" has to
       come back out of the box the way it went in. */
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
    /* Not the dividend: what is still to be shared out, which shrinks as the
       sum is worked. See longdiv.leftToShare. */
    value: longdiv.leftToShare,
    /* And the same working laid out in blocks, stage by stage of DMSB — the
       half that answers "where did the 4 come from?". See divblocks.js. Only
       this method has one; an addition is not a sharing out. */
    stage: stageOf,
    lay: layStage,
    stageSaid: stageSentence,
    groupNote,
    setAside,
    setValue: longdiv.setDividend,
    /* The one step on either board that is not typed. Only the division has
       one, so only the division answers to it. */
    bring: longdiv.bringDown,
  },
  column: {
    name: "column addition",
    sep: "",
    /* One box and not two, because the number of things being added is part of
       the sum: "48 + 96 + 7" is a sum a column can do, and a fixed pair of
       boxes would be a rule against it. */
    fields: [{ n: "sum", aria: "The numbers to add, with + between them", wide: true }],
    read: (t) => ({ sum: t.addends.map((n) => writeNum(n, t.dp || 0, t.base)).join(" + ") }),
    set: (t, v) => column.setWritten(t, v.sum),
    ask: column.ask,
    answer: column.answer,
    showNext: column.showNext,
    reset: column.resetWork,
    cells: column.cellsOf,
    /* What the board is working on is what the sum comes to. Sync hands round
       whole numbers, so a sum with a point in it is rounded on the way out and
       lands as a whole sum on the way back in. */
    value: (t) => Math.round(t.addends.reduce((s, n) => s + n, 0) / Math.pow(t.base, t.dp || 0)),
    setValue: column.setTotal,
  },
  times: {
    name: "column multiplication",
    sep: "×",
    fields: [
      { n: "multiplicand", aria: "The number being multiplied" },
      { n: "multiplier", aria: "What you are multiplying it by" },
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
    /* The number being multiplied, not the answer — sync passes round the
       number a tool is working ON. */
    value: times.multiplicandOf,
    setValue: times.setProduct,
  },
  fraction: {
    name: "fraction sum",
    sep: "",
    /* The operation is picked, not typed: "/" is already the fraction bar. And
       the two fractions are typed with a "/" and a space, which a number pad
       has neither of. */
    fields: [
      { n: "a", aria: "The first fraction, like 3/4 or 2 3/4", mode: "text" },
      { n: "op", aria: "What to do with them", pick: fraction.OPS },
      { n: "b", aria: "The second fraction, like 5/6", mode: "text" },
    ],
    read: (t) => ({
      a: fraction.writeFraction(t.a, t.base),
      op: t.op,
      b: fraction.writeFraction(t.b, t.base),
    }),
    /* The sum said in one line, sign and all — joining the boxes would say the
       operation's internal name, and "3/4 * 5/6" is not how anyone writes it. */
    said: fraction.writtenSum,
    set: (t, v) => fraction.setWritten(t, v.a, v.op, v.b),
    ask: fraction.ask,
    answer: fraction.answer,
    showNext: fraction.showNext,
    reset: fraction.resetWork,
    cells: fraction.cellsOf,
    /* No setValue, on purpose: sync hands round a whole number, and a fraction
       sum does not hold one. Anything it offered the blocks would be made up,
       so it stays out of sync altogether (sync.js `targets`). */
    value: () => null,
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
