/* ============================================================================
   THE WRITTEN BOARDS — criss-cross multiplication
   ----------------------------------------------------------------------------
   Down the ones, across both ways, down the tens. 42 × 32: 2 × 2 is 4 — write
   4. Then the cross, 4 × 2 and 2 × 3, which is 14 — write 4, carry 1. Then
   4 × 3 and the 1 carried, 13. 1344, and not a partial product in sight.

   It is the same arithmetic as the grid method and the same answer as the long
   one, worked in a different order: by COLUMN of the answer instead of by row
   of the multiplier. Every figure of the answer is finished before the next is
   started, which is why it can be done in your head and why it belongs on a
   board that asks one figure at a time.

   The column at place p takes every pair of figures whose places add up to p —
   that is the whole rule, and it is what the crossing lines in the picture are
   drawn to show. Two figures times two figures gives three columns: down,
   across, down. Three by three gives five.

   WHAT IT ASKS, for each column from the right:
     what goes down   the crossings for that column, plus anything carried in,
                      written under the line
     what carries     the rest of it, over the next column
   ========================================================================== */

import { DIGITS, digitsOf, writeNum, readNum, baseWord } from "./num.js";

export const GUTTER = 1;
export const MAX_DIGITS = 4;       // figures in each number
export const MAX_WIDE = 8;         // figures the answer may come to

/* ── the sum, worked out before a figure is written ────────────────────────*/

/** The pairs of figures whose places add up to `p` — the crossings. */
export function crossings(A, B, p) {
  const out = [];
  for (let i = 0; i < A.length; i++) {
    const j = p - i;
    if (j >= 0 && j < B.length) out.push({ i, j, a: A[i], b: B[j] });
  }
  return out;
}

/**
 * The method, as a list of things to be written.
 *
 *   rows   0 the carries, 1 the first number, 2 the second, 3 the answer
 *   A, B   the figures of each number, LOWEST PLACE FIRST, because a column of
 *          the answer is named by a place and not by a position in the writing
 */
export function workOut(a, b, base) {
  const A = digitsOf(a, base).slice().reverse();
  const B = digitsOf(b, base).slice().reverse();
  const entries = [];
  const width = Math.max(digitsOf(a * b, base).length, 1);
  let carry = 0;
  for (let p = 0; p < width; p++) {
    const pairs = crossings(A, B, p);
    const cross = pairs.reduce((t, q) => t + q.a * q.b, 0);
    const total = cross + carry;
    const digit = total % base;
    carry = Math.floor(total / base);
    entries.push({ kind: "d", place: p, row: 3, value: digit, pairs, cross, carryIn: total - cross });
    if (carry && p < width - 1) entries.push({ kind: "c", place: p + 1, row: 0, value: carry });
  }
  return {
    base, a, b, A, B, entries, width,
    total: a * b,
    cols: GUTTER + width,
    rows: 4,
    gutter: GUTTER,
  };
}

const PLANS = new Map();

export function planOf(thing) {
  const key = `${thing.a}x${thing.b}b${thing.base}`;
  let plan = PLANS.get(key);
  if (!plan) {
    plan = workOut(thing.a, thing.b, thing.base);
    if (PLANS.size > 40) PLANS.clear();
    PLANS.set(key, plan);
  }
  return plan;
}

/* ── the thing being worked on ─────────────────────────────────────────────*/

const FIRST = { 10: [42, 32], 2: [11, 11], 5: [23, 12], 8: [34, 21], 12: [23, 14] };

export function makeCriss(base) {
  const [a, b] = FIRST[base] || [Math.min(42, base ** 2 - 1), Math.min(32, base ** 2 - 1)];
  return {
    kind: "board", variant: "criss", tag: null, x: 0, z: 0, angle: 0,
    base, a, b, done: 0, slips: 0,
  };
}

export function checkSum(a, b, base) {
  if (a === null || b === null) {
    return { ok: false, message: `Write both numbers in base ${baseWord(base)} — digits 0 to ${DIGITS[base - 1]}.` };
  }
  if (a < 1 || b < 1) return { ok: false, message: "Both numbers have to be worth something." };
  if (digitsOf(a, base).length > MAX_DIGITS || digitsOf(b, base).length > MAX_DIGITS) {
    return { ok: false, message: `Up to ${MAX_DIGITS} figures each — past that the crossings are more than anyone holds in their head.` };
  }
  if (digitsOf(a * b, base).length > MAX_WIDE) {
    return { ok: false, message: `That comes to more than ${MAX_WIDE} figures — the columns would be narrower than the pen.` };
  }
  return { ok: true };
}

export function setSum(thing, a, b) {
  const check = checkSum(a, b, thing.base);
  if (!check.ok) return check;
  if (a === thing.a && b === thing.b) return { ok: false, message: "That is the sum it is already showing." };
  thing.a = a;
  thing.b = b;
  thing.done = 0;
  thing.slips = 0;
  return {
    ok: true, changed: true,
    message: `${writeNum(a, 0, thing.base)} × ${writeNum(b, 0, thing.base)} — ${ask(thing).text}`,
  };
}

export function setWritten(thing, aText, bText) {
  const A = readNum(aText, thing.base);
  const B = readNum(bText, thing.base);
  if (!A || !B || A.dp || B.dp) {
    return { ok: false, message: `Whole numbers in base ${baseWord(thing.base)} — digits 0 to ${DIGITS[thing.base - 1]}.` };
  }
  return setSum(thing, A.n, B.n);
}

export function rebase(thing, base) {
  thing.base = base;
  if (!checkSum(thing.a, thing.b, base).ok) {
    const fresh = makeCriss(base);
    thing.a = fresh.a;
    thing.b = fresh.b;
  }
  thing.done = 0;
  thing.slips = 0;
  return true;
}

export function resetWork(thing) {
  if (!thing.done && !thing.slips) return { changed: false, message: "There is nothing written on it yet." };
  thing.done = 0;
  thing.slips = 0;
  return { changed: true, message: `Rubbed out — ${ask(thing).text}` };
}

/* ── what it is asking for ─────────────────────────────────────────────────*/

const ORD = ["the ones", "the tens", "the hundreds", "the thousands"];
const columnName = (p, base) => (base === 10 && ORD[p]) || `column ${p + 1} from the right`;

const said = (plan) => {
  const b = plan.base;
  return `${writeNum(plan.a, 0, b)} × ${writeNum(plan.b, 0, b)} = ${writeNum(plan.total, 0, b)}`;
};

/** "4 × 1 and 2 × 3" — the crossings of a column, named but never added up. */
function crossSay(e, base) {
  const w = (n) => writeNum(n, 0, base);
  return e.pairs.map((q) => `${w(q.a)} × ${w(q.b)}`).join(" and ");
}

export function ask(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  const b = thing.base;
  if (!e) return { done: true, kind: null, where: "", text: `${said(plan)}.` };
  if (e.kind === "c") {
    return {
      done: false, kind: "c",
      text: "And what carries over into the next column?",
      where: "in the little row at the top",
    };
  }
  const where = columnName(e.place, b);
  const carried = e.carryIn ? `, and ${writeNum(e.carryIn, 0, b)} carried` : "";
  if (!e.pairs.length) {
    return {
      done: false, kind: "d",
      text: `Nothing crosses in ${where} — only the ${writeNum(e.carryIn, 0, b)} carried. What goes down?`,
      where,
    };
  }
  return {
    done: false, kind: "d",
    text: e.pairs.length > 1
      ? `Across ${where}: ${crossSay(e, b)}${carried}. What goes down?`
      : `Down ${where}: ${crossSay(e, b)}${carried}. What goes down?`,
    where,
  };
}

/* ── answering ─────────────────────────────────────────────────────────────*/

export function answer(thing, text) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  const b = thing.base;
  if (!e) return { ok: false, message: `It is finished: ${said(plan)}.` };
  const got = readNum(String(text ?? "").trim(), b);
  if (!got || got.dp) {
    return { ok: false, message: `A figure in base ${baseWord(b)} — digits 0 to ${DIGITS[b - 1]}.` };
  }
  if (got.n === e.value) {
    thing.done += 1;
    const next = ask(thing);
    return { ok: true, changed: true, message: next.done ? next.text : `Yes. ${next.text}` };
  }
  thing.slips += 1;
  if (e.kind === "c") {
    return {
      ok: false,
      message: `The column came to ${writeNum(e.value * b + plan.entries[thing.done - 1].value, 0, b)}: `
        + `the last figure goes down and the REST carries.`,
    };
  }
  const total = e.cross + e.carryIn;
  if (got.n >= b) {
    return {
      ok: false,
      message: `One figure goes down. ${writeNum(total, 0, b)} is ${writeNum(Math.floor(total / b), 0, b)} `
        + `to carry and ${writeNum(total % b, 0, b)} to write.`,
    };
  }
  return {
    ok: false,
    message: `Add the crossings for ${columnName(e.place, b)}: ${crossSay(e, b)}`
      + `${e.carryIn ? ` and the ${writeNum(e.carryIn, 0, b)} carried` : ""}. `
      + "Then the last figure of that goes down.",
  };
}

export function showNext(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return { changed: false, message: `It is finished: ${said(plan)}.` };
  thing.done += 1;
  const b = thing.base;
  const shown = writeNum(e.value, 0, b);
  const next = ask(thing);
  return {
    changed: true,
    message: `${shown} ${e.kind === "c" ? "carries" : "goes down"}. ${next.text}`,
  };
}

/* ── where the next figure goes, and the page as it stands ─────────────────*/

export function cellsOf(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return null;
  return {
    mode: "type",
    grid: { cols: plan.cols, rows: plan.rows, gutter: plan.gutter },
    cells: [{ row: e.row, col: plan.width - 1 - e.place, len: 1 }],
  };
}

export function sheetOf(thing) {
  const plan = planOf(thing);
  const b = thing.base;
  const marks = [];
  const colOf = (p) => plan.width - 1 - p;

  /* the two numbers, right-aligned on the ones */
  plan.A.forEach((d, p) => marks.push({ row: 1, col: colOf(p), ch: DIGITS[d], tone: "ink" }));
  plan.B.forEach((d, p) => marks.push({ row: 2, col: colOf(p), ch: DIGITS[d], tone: "ink" }));

  /* everything written so far: the answer under the line, the carries above */
  for (let i = 0; i < thing.done; i++) {
    const done = plan.entries[i];
    marks.push({
      row: done.row,
      col: colOf(done.place),
      ch: writeNum(done.value, 0, b),
      tone: done.kind === "c" ? "carry" : "ink",
    });
  }

  const e = plan.entries[thing.done] || null;
  const finished = thing.done >= plan.entries.length;
  return {
    plan, cols: plan.cols, rows: plan.rows, width: plan.width, gutter: plan.gutter,
    marks, points: [], minus: [], strikes: [], bracket: null,
    rules: [{ row: 2, from: -plan.gutter, to: plan.width - 1 }],
    signs: [{ row: 2, col: -plan.gutter, ch: "×" }],
    underline: finished ? { row: 3, from: 0, to: plan.width - 1 } : null,
    ask: e ? { row: e.row, cols: [colOf(e.place)] } : null,
    finished,
    total: plan.total,
    sum: said(plan),
  };
}
