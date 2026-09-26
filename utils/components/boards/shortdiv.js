/* ============================================================================
   THE WRITTEN BOARDS — short division
   ----------------------------------------------------------------------------
   The bus stop without the long working: you divide one figure at a time and
   carry what is left over into the next figure, writing it small in front of
   it. 442 ÷ 3 is "3 into 4 goes 1, 1 left over; 3 into 14 goes 4, 2 left over;
   3 into 22 goes 7, 1 left over" — 147 remainder 1, and the only thing written
   down besides the answer is those little carried figures.

   It is the same division as longdiv.js and a different piece of paper: no
   subtractions, nothing brought down, and the whole of the working is one row
   of small figures under the bar. A child who can do this in their head for one
   figure can do any division with it, which is why it is worth having beside
   the long one rather than instead of it.

   WHAT IT ASKS, in order, for every figure of the number being divided:
     how many         how many times the divisor goes into what is standing
                      there — the figure that goes ABOVE the bar
     what is left     the remainder, carried in front of the next figure
   and at the end, if anything is left, the remainder of the whole division.

   Divide by ONE figure. Short division by more than one figure is long
   division with the working rubbed out, and the board says so rather than
   letting a child set a sum they cannot do in their head.
   ========================================================================== */

import { DIGITS, digitsOf, writeNum, readNum, baseWord } from "./num.js";

export const GUTTER = 2;           // room for the divisor outside the bracket
export const MAX_DIGITS = 7;       // as long a dividend as the paper holds

/* ── the sum, worked out before a figure is written ────────────────────────*/

/**
 * The whole method, as a list of things to be written.
 *
 *   rows   0 the answer, 1 the carried remainders, 2 the number being divided
 *   cols   one per figure of that number, and one more when there is a
 *          remainder at the end to write beside the answer
 */
export function workOut(n, d, base) {
  const digits = digitsOf(n, base);          // left to right, as they are written
  const entries = [];
  let carry = 0;
  digits.forEach((digit, k) => {
    const standing = carry * base + digit;
    const q = Math.floor(standing / d);
    const left = standing - q * d;
    entries.push({ kind: "q", row: 0, col: k, value: q, standing, carryIn: carry });
    if (left && k < digits.length - 1) {
      entries.push({ kind: "r", row: 1, col: k + 1, value: left, standing, q });
    }
    carry = left;
  });
  const remainder = carry;
  if (remainder) entries.push({ kind: "rem", row: 0, col: digits.length, value: remainder });
  const quotient = Math.floor(n / d);
  return {
    base, n, d, digits, entries, remainder, quotient,
    width: digits.length + (remainder ? 1 : 0),
    cols: GUTTER + digits.length + (remainder ? 1 : 0),
    rows: 3,
    gutter: GUTTER,
  };
}

const PLANS = new Map();

export function planOf(thing) {
  const key = `${thing.n}/${thing.d}b${thing.base}`;
  let plan = PLANS.get(key);
  if (!plan) {
    plan = workOut(thing.n, thing.d, thing.base);
    if (PLANS.size > 40) PLANS.clear();
    PLANS.set(key, plan);
  }
  return plan;
}

/* ── the thing being worked on ─────────────────────────────────────────────*/

const FIRST = { 10: [442, 3], 2: [13, 1], 5: [124, 3], 8: [249, 5], 12: [305, 4] };

export function makeShortDiv(base) {
  const [n, d] = FIRST[base] || [Math.min(442, base ** 3 - 1), Math.min(3, base - 1)];
  return {
    kind: "board", variant: "shortdiv", tag: null, x: 0, z: 0, angle: 0,
    base, n, d, done: 0, slips: 0,
  };
}

export function checkSum(n, d, base) {
  if (n === null || d === null) {
    return { ok: false, message: `Write both numbers in base ${baseWord(base)} — digits 0 to ${DIGITS[base - 1]}.` };
  }
  if (d < 2) return { ok: false, message: "Divide by two or more: dividing by one leaves the number where it was." };
  if (d >= base) {
    return {
      ok: false,
      message: `Short division divides by ONE figure — up to ${DIGITS[base - 1]} in base ${baseWord(base)}. `
        + "Past that, use the long division board: the working will not fit in your head.",
    };
  }
  if (n < d) return { ok: false, message: "The number being divided has to be the bigger one here." };
  if (digitsOf(n, base).length > MAX_DIGITS) {
    return { ok: false, message: `Up to ${MAX_DIGITS} figures — past that the columns are narrower than the pen.` };
  }
  return { ok: true };
}

export function setSum(thing, n, d) {
  const check = checkSum(n, d, thing.base);
  if (!check.ok) return check;
  if (n === thing.n && d === thing.d) return { ok: false, message: "That is the sum it is already showing." };
  thing.n = n;
  thing.d = d;
  thing.done = 0;
  thing.slips = 0;
  return {
    ok: true, changed: true,
    message: `${writeNum(n, 0, thing.base)} ÷ ${writeNum(d, 0, thing.base)} — ${ask(thing).text}`,
  };
}

export function setWritten(thing, nText, dText) {
  const N = readNum(nText, thing.base);
  const D = readNum(dText, thing.base);
  if (!N || !D || N.dp || D.dp) {
    return { ok: false, message: `Whole numbers in base ${baseWord(thing.base)} — digits 0 to ${DIGITS[thing.base - 1]}.` };
  }
  return setSum(thing, N.n, D.n);
}

export function rebase(thing, base) {
  thing.base = base;
  if (!checkSum(thing.n, thing.d, base).ok) {
    const fresh = makeShortDiv(base);
    thing.n = fresh.n;
    thing.d = fresh.d;
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

const said = (plan) => {
  const b = plan.base;
  const q = writeNum(plan.quotient, 0, b);
  return `${writeNum(plan.n, 0, b)} ÷ ${writeNum(plan.d, 0, b)} = ${q}`
    + (plan.remainder ? ` remainder ${writeNum(plan.remainder, 0, b)}` : "");
};

export function ask(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  const b = thing.base;
  const d = writeNum(plan.d, 0, b);
  if (!e) return { done: true, kind: null, where: "", text: `${said(plan)}.` };
  if (e.kind === "q") {
    const standing = writeNum(e.standing, 0, b);
    return {
      done: false, kind: "q",
      text: e.carryIn
        ? `${writeNum(e.carryIn, 0, b)} carried in front of it makes ${standing}. How many ${d}s in ${standing}?`
        : `How many ${d}s in ${standing}?`,
      where: "above the bar",
    };
  }
  if (e.kind === "r") {
    return {
      done: false, kind: "r",
      text: `${writeNum(e.q, 0, b)} ${d}s is ${writeNum(e.q * plan.d, 0, b)}. What is left over from ${writeNum(e.standing, 0, b)}?`,
      where: "in front of the next figure",
    };
  }
  return {
    done: false, kind: "rem",
    text: "Nothing more to divide. What is left over at the end?",
    where: "beside the answer",
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
  const d = writeNum(plan.d, 0, b);
  if (e.kind === "q") {
    const tooMany = got.n * plan.d > e.standing;
    return {
      ok: false,
      message: tooMany
        ? `${writeNum(got.n, 0, b)} ${d}s is ${writeNum(got.n * plan.d, 0, b)}, which is more than ${writeNum(e.standing, 0, b)}. Take one off.`
        : `${writeNum(got.n, 0, b)} ${d}s is ${writeNum(got.n * plan.d, 0, b)}, and ${writeNum(e.standing - got.n * plan.d, 0, b)} is left — another ${d} still fits.`,
    };
  }
  if (e.kind === "r") {
    return {
      ok: false,
      message: `What is left over is always LESS than ${d}. ${writeNum(e.standing, 0, b)} take away ${writeNum(e.q * plan.d, 0, b)}.`,
    };
  }
  return { ok: false, message: `What is left at the end is less than ${d}.` };
}

export function showNext(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return { changed: false, message: `It is finished: ${said(plan)}.` };
  thing.done += 1;
  const b = thing.base;
  const shown = writeNum(e.value, 0, b);
  const next = ask(thing);
  const what = e.kind === "q" ? `${shown} goes above the bar`
    : e.kind === "r" ? `${shown} is carried in front of the next figure`
      : `${shown} is left over`;
  return { changed: true, message: `${what}. ${next.done ? next.text : next.text}` };
}

/* ── where the next figure goes, and the page as it stands ─────────────────*/

export function cellsOf(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return null;
  return {
    mode: "type",
    grid: { cols: plan.cols, rows: plan.rows, gutter: plan.gutter },
    cells: [{ row: e.row, col: e.col, len: writeNum(e.value, 0, thing.base).length }],
  };
}

export function sheetOf(thing) {
  const plan = planOf(thing);
  const b = thing.base;
  const marks = [];

  /* the divisor outside the bar */
  const dvs = writeNum(plan.d, 0, b);
  [...dvs].forEach((ch, k) => {
    marks.push({ row: 2, col: -plan.gutter + k, ch, tone: "ink" });
  });
  /* the number being divided, inside it */
  plan.digits.forEach((digit, k) => {
    marks.push({ row: 2, col: k, ch: DIGITS[digit], tone: "ink" });
  });

  /* everything the child has written */
  for (let i = 0; i < thing.done; i++) {
    const done = plan.entries[i];
    const ch = writeNum(done.value, 0, b);
    if (done.kind === "rem") marks.push({ row: 0, col: done.col, ch: `r${ch}`, tone: "ink" });
    else marks.push({ row: done.row, col: done.col, ch, tone: done.kind === "r" ? "carry" : "ink" });
  }

  const e = plan.entries[thing.done] || null;
  const finished = thing.done >= plan.entries.length;
  return {
    plan, cols: plan.cols, rows: plan.rows, width: plan.width, gutter: plan.gutter,
    marks, points: [], minus: [], signs: [], strikes: [],
    /* the bus stop: over the carries and the number, not over the answer */
    bracket: { row: 1, to: plan.width },
    rules: [],
    underline: finished ? { row: 0, from: 0, to: plan.width - 1 } : null,
    ask: e ? { row: e.row, cols: [e.col] } : null,
    finished,
    total: plan.quotient,
    sum: said(plan),
  };
}
