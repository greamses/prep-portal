/* ============================================================================
   THE WRITTEN BOARDS — long division, worked the way it is written
   ----------------------------------------------------------------------------
   A sheet of paper with the bus stop drawn on it. The divisor stands outside,
   the number being divided goes under the bar, and the working comes down the
   page a line at a time: how many times it goes, what that multiplies to, what
   is taken away, what is brought down.

   NOTHING IS WRITTEN UNTIL IT IS EARNED. The board knows the whole sum from the
   first moment — it has to, or it could not mark anything — but it shows only
   as far as the learner has got, and it asks for one number at a time. A wrong
   answer is refused with the reason it is wrong ("too many — four sevens is
   more than thirty"), never with a red cross.

   ── the layout is positional, and nothing ever moves ──────────────────────
   Every digit on the page belongs to a COLUMN — the column of the digit of the
   dividend it lines up under — and to a ROW. A digit written into a cell stays
   in that cell for the rest of the sum. That is the one rule that makes this
   readable: the whole method is an argument about place value, and a layout
   whose digits shuffle sideways as the working grows destroys the argument.

   ── the point, when there is one ──────────────────────────────────────────
   A divisor with a point in it is made whole first, by moving BOTH points the
   same number of places — 1.25 ÷ 0.5 is set out as 12.5 ÷ 5, which is the same
   sum. After that the working never thinks about the point again: it is an
   ordinary division, and the point in the answer goes straight above the point
   in the number being divided, because the columns are the columns.

   When the dividend runs out and something is still left over, a nought is
   brought down from past the point and the working carries on. So 7.0 ÷ 8 does
   not stop at "0 remainder 7": it goes 0.875, one brought-down nought at a
   time. A sum that would never come out is refused when it is set, not left to
   run off the bottom of the paper.

   ── it follows the working base like everything else here ─────────────────
   None of this is about ten. In base five, 303₅ ÷ 2₅ is worked with the same
   four questions and the same layout, and the board asks them in base five. The
   plan is computed in plain counting numbers and only ever WRITTEN in the base,
   so there is one algorithm and not one per base.
   ========================================================================== */

import { DIGITS, baseWord, digitsOf, pow, readNum, writeNum } from "./num.js";

/* Room to the right of the bar for the "r 4" that is written once the sum is
   finished. It is margin the rest of the time, which the page needs anyway. */
export const RIGHT = 2;

/* As long a sum as the board will take. Past six digits the working is taller
   than the canvas and the point has long been made. */
export const MAX_DIGITS = 6;
export const MAX_DIVISOR = 999;

/* How far past the point the working will go for an answer that comes out. Four
   places is further than any sum a child is set, and a sum that needs more than
   four is a sum that does not come out at all in disguise. */
export const MAX_PLACES = 4;

/* ── the sum the board opens on ───────────────────────────────────────────── */

/**
 * A three-place dividend and a divisor that does not go into the first digit,
 * so the very first thing the board says is the thing learners get wrong:
 * "seven into three will not go — so seven into thirty".
 */
export function defaultSum(base) {
  const divisor = Math.max(2, base - 3);
  /* The first digit is deliberately SMALLER than the divisor, so the opening
     question is the one every learner trips on: it will not go, and the answer
     is not "skip it" but "then take two digits". In base ten that lands on
     305 divided by 7. */
  const head = Math.min(3, divisor - 1);
  const tail = Math.min(5, base - 1);
  return { dividend: head * base * base + tail, divisor, dpA: 0, dpB: 0 };
}

/* ── the sum, before any of it is written ─────────────────────────────────── */

/**
 * Both points moved until the divisor is whole, and any noughts left hanging
 * off the end of the dividend taken off again.
 *
 *   { a, dp, b, moved }   the value being divided is a / base^dp, and it is
 *                         being divided by the whole number b
 */
export function lineUp(dividend, dpA, divisor, dpB, base) {
  const b = divisor;                        // × base^dpB makes the divisor whole
  let a = dividend * pow(base, dpB);
  let dp = dpA;
  /* Only the noughts the SHIFT put on the end come off again: 1.25 ÷ 0.5 is
     12.5 ÷ 5 and not 12.50 ÷ 5. A nought the writer put there themselves stays,
     because "7.0 ÷ 8" is a sum asked in tenths and the answer is 0.875, not
     0 remainder 7. */
  for (let k = 0; k < Math.min(dpA, dpB) && dp > 0 && a % base === 0; k++) {
    a /= base;
    dp -= 1;
  }
  return { a, dp, b, moved: dpB };
}

/**
 * How many noughts have to be brought down from past the point before nothing
 * is left over, or -1 if the sum never comes out.
 */
function placesNeeded(a, b, base) {
  let rem = a % b;
  for (let k = 0; k <= MAX_PLACES; k++) {
    if (rem === 0) return k;
    rem = (rem * base) % b;
  }
  return -1;
}

/* ── the plan ─────────────────────────────────────────────────────────────── */

/**
 * The whole sum, worked out and laid out.
 *
 * `steps` is one entry per digit of the dividend — including the leading ones
 * where the divisor does not go, because those are steps that were taken even
 * though nothing is written for them. A step is LIVE when its quotient digit is
 * more than nought: only a live step multiplies down and takes away.
 *
 * A step is WRITTEN when a digit goes in the answer. Leading noughts are not
 * written (nobody writes 043), but a nought once the answer has started must
 * be — 3010 ÷ 3 is 1003, and the two noughts in the middle are the answer. A
 * nought BEFORE the point is written too when there is a point: 7.0 ÷ 8 is
 * 0.875 and the 0 is part of how that is read.
 */
export function workOut(dividend, divisor, base, dpA = 0, dpB = 0) {
  const { a, dp, b, moved } = lineUp(dividend, dpA, divisor, dpB, base);

  /* The digits under the bar. A number smaller than one is written with its 0,
     so 0.5 is two columns and not one. */
  const digits = digitsOf(a, base);
  while (digits.length < dp + 1) digits.unshift(0);

  /* The noughts fetched from past the point, when the dividend runs out with
     something still left over. A WHOLE sum keeps its remainder — that is the
     right answer to 305 ÷ 7 — but the moment there is a point anywhere in the
     sum the working carries on past it, because "1 ÷ 0.4 = 2 remainder 2" is
     not an answer anybody wants and 2.5 is. */
  const real = digits.length;
  const decimal = dpA > 0 || dpB > 0;
  let point = dp;
  if (decimal && a % b !== 0) {
    const extra = Math.max(0, placesNeeded(a, b, base));
    for (let k = 0; k < extra; k++) digits.push(0);
    point = dp + extra;
  }

  const steps = [];
  let rem = 0;
  let started = false;
  digits.forEach((d, i) => {
    const cur = rem * base + d;
    const q = Math.floor(cur / b);
    const product = q * b;
    const left = cur - product;
    steps.push({ i, cur, q, product, rem: left, write: started || q > 0 });
    if (q > 0) started = true;
    rem = left;
  });
  /* A dividend smaller than the divisor still has an answer, and it is nought.
     Written above the last digit, where the answer to any division is. */
  if (!steps.some((s) => s.write)) steps[steps.length - 1].write = true;
  /* With a point in it the answer runs from the ones column to the end, noughts
     and all: it has to read 0.875 and not .875, and 0.08 is not 0.8. */
  const ones = digits.length - 1 - point;
  if (point > 0) {
    for (let i = Math.max(0, ones); i < digits.length; i++) steps[i].write = true;
  }

  /* Nobody writes 043, so the leading steps where the divisor does not go are
     never written — but they were still TAKEN, and skipping them silently is
     what makes this method look like sleight of hand. So the first step that IS
     written remembers what was passed over, and says so when it asks. */
  const opener = steps.find((s) => s.write);
  if (opener && opener.i > 0 && opener.cur !== digits[opener.i]) {
    opener.lead = digits.slice(0, opener.i).reduce((n, d) => n * base + d, 0);
  }

  /* Rows down the page. Row 0 is the answer, row 1 is the dividend under the
     bar, and after that every live step takes a line for what it brought down
     and a line for what it multiplies to. The first live step needs no line of
     its own for what it is dividing into: that is the dividend itself. */
  const live = steps.filter((s) => s.q > 0);
  let row = 1;
  live.forEach((s, k) => {
    if (k === 0) s.curRow = 1;
    else { row += 1; s.curRow = row; }
    row += 1;
    s.prodRow = row;
  });
  const remRow = row + 1;
  live.forEach((s, k) => {
    s.diffRow = k + 1 < live.length ? live[k + 1].curRow : remRow;
  });

  /* Which row a digit brought down lands on: the row of the next step that
     actually divides, because a digit the divisor will not go into joins the
     one after it on the same line rather than starting a line of its own. */
  const firstLive = live.length ? live[0].i : digits.length - 1;
  const bringRow = (j) => {
    const s = live.find((x) => x.i >= j);
    return s ? s.curRow : remRow;
  };

  /* What the learner is asked for, in the order a hand writing this would ask
     it of itself. Bringing a digit down IS in the list — it is not typed but
     DRAGGED, because copying a figure down the page is a movement and not a
     calculation, and typing it would only prove you can read. */
  const entries = [];
  for (const s of steps) {
    if (s.write && s.i > firstLive) {
      entries.push({
        kind: "b", step: s, value: digits[s.i], row: bringRow(s.i), endCol: s.i,
        /* a nought that was not in the number at all, fetched from past the
           point because something was still left over */
        fetched: s.i >= real,
      });
    }
    if (s.write) entries.push({ kind: "q", step: s, value: s.q, row: 0, endCol: s.i });
    if (s.q > 0) {
      entries.push({ kind: "p", step: s, value: s.product, row: s.prodRow, endCol: s.i });
      entries.push({ kind: "d", step: s, value: s.rem, row: s.diffRow, endCol: s.i });
    }
  }
  /* Nothing went in at all — 5 ÷ 7. There is no taking away to do, so the thing
     left over has to be asked for outright or it would never be written. */
  if (!live.length) {
    entries.push({
      kind: "r", step: steps[steps.length - 1], value: a,
      row: remRow, endCol: digits.length - 1,
    });
  }

  const dv = digitsOf(b, base).length;
  const gutter = dv + 1;   // the divisor, and a column of air before the bar

  /* The answer, read off the digits that are written — which with a point in it
     is the answer to the sum and not a whole-number quotient. */
  const quotient = steps.reduce((n, s) => n * base + s.q, 0);
  const remainder = point ? 0 : a % b;

  return {
    dividend, divisor, base, dpA, dpB,
    a, dp, b, moved, digits, real, point, ones, steps, live, entries,
    gutter, rows: remRow + 1, cols: gutter + digits.length + RIGHT,
    quotient, quotientDp: point, remainder,
  };
}

/* Plans are pure and small, and the drawing asks for one on every repaint —
   so they are kept. Keyed by the sum itself, which is all a plan depends on. */
const PLANS = new Map();

export function planOf(thing) {
  const key = `${thing.dividend}.${thing.dpA || 0}/${thing.divisor}.${thing.dpB || 0}/${thing.base}`;
  let plan = PLANS.get(key);
  if (!plan) {
    plan = workOut(thing.dividend, thing.divisor, thing.base, thing.dpA || 0, thing.dpB || 0);
    if (PLANS.size > 40) PLANS.clear();
    PLANS.set(key, plan);
  }
  return plan;
}

/* ── the thing being worked on ────────────────────────────────────────────── */

export function makeLongDiv(base) {
  const { dividend, divisor } = defaultSum(base);
  return {
    kind: "board", variant: "longdiv", tag: null, x: 0, z: 0, angle: 0,
    base, dividend, divisor, dpA: 0, dpB: 0,
    done: 0,      // how many of the plan's entries have been written
    slips: 0,     // wrong answers so far, so the board can offer to show one
  };
}

/**
 * Whether a sum can be set on the board, and why not if it cannot.
 * Checked here rather than in the panel so the rule has one home.
 */
export function checkSum(dividend, divisor, base, dpA = 0, dpB = 0) {
  if (dividend === null || divisor === null) {
    return { ok: false, message: `Write both numbers in base ${baseWord(base)} — digits 0 to ${DIGITS[base - 1]}.` };
  }
  if (dpA > MAX_PLACES || dpB > MAX_PLACES) {
    return { ok: false, message: `Up to ${MAX_PLACES} figures after the point.` };
  }
  if (divisor < 1) return { ok: false, message: "Dividing by nought shares nothing out at all." };
  if (divisor === pow(base, dpB)) {
    return { ok: false, message: "Divide by more than one — dividing by one gives you back what you started with." };
  }
  if (divisor > MAX_DIVISOR) return { ok: false, message: `Keep the divisor under ${MAX_DIVISOR}.` };
  if (dividend < 1) return { ok: false, message: "There has to be something to share out." };
  const { a, b } = lineUp(dividend, dpA, divisor, dpB, base);
  if ((dpA > 0 || dpB > 0) && placesNeeded(a, b, base) < 0) {
    return {
      ok: false,
      message: `${writeNum(dividend, dpA, base)} ÷ ${writeNum(divisor, dpB, base)} never comes out — `
        + "the figures after the point would go on for ever.",
    };
  }
  const plan = workOut(dividend, divisor, base, dpA, dpB);
  if (plan.digits.length > MAX_DIGITS) {
    return { ok: false, message: `That is more than ${MAX_DIGITS} figures in base ${baseWord(base)} — the working would be taller than the paper.` };
  }
  return { ok: true };
}

/** How the sum reads once both points have been moved, or "" if they have not. */
function moveNote(plan) {
  if (!plan.moved) return "";
  const b = plan.base;
  return ` Both points move ${plan.moved === 1 ? "one place" : `${plan.moved} places`}, `
    + `so it is ${writeNum(plan.a, plan.dp, b)} ÷ ${writeNum(plan.b, 0, b)}.`;
}

/** Put a new sum on the board and rub out whatever was worked on the old one. */
export function setSum(thing, dividend, divisor, dpA = 0, dpB = 0) {
  const check = checkSum(dividend, divisor, thing.base, dpA, dpB);
  if (!check.ok) return check;
  if (dividend === thing.dividend && divisor === thing.divisor
    && dpA === (thing.dpA || 0) && dpB === (thing.dpB || 0)) {
    return { ok: false, message: "That is the sum it is already showing." };
  }
  thing.dividend = dividend;
  thing.divisor = divisor;
  thing.dpA = dpA;
  thing.dpB = dpB;
  thing.done = 0;
  thing.slips = 0;
  const b = thing.base;
  const plan = planOf(thing);
  return {
    ok: true, changed: true,
    message: `${writeNum(dividend, dpA, b)} ÷ ${writeNum(divisor, dpB, b)} —${moveNote(plan)} ${ask(thing).text}`,
  };
}

/** Read a sum written as two numbers — "12.5" and "0.5" — and set it. */
export function setWritten(thing, dividendText, divisorText) {
  const A = readNum(dividendText, thing.base);
  const B = readNum(divisorText, thing.base);
  if (!A || !B) {
    return { ok: false, message: `Write both numbers in base ${baseWord(thing.base)} — digits 0 to ${DIGITS[thing.base - 1]}.` };
  }
  return setSum(thing, A.n, B.n, A.dp, B.dp);
}

/**
 * Move the board to another base.
 *
 * The two numbers do not change — 305 is 305 however it is written — but every
 * digit on the page does, and so does the working, because the sum is stepped
 * through place by place and the places are the base's. So the sheet is rubbed
 * clean rather than half-translated. A sum too long to write in the new base
 * gives way to that base's own opening sum.
 */
export function rebaseLongDiv(thing, base) {
  thing.base = base;
  if (!checkSum(thing.dividend, thing.divisor, base, thing.dpA || 0, thing.dpB || 0).ok) {
    const fresh = defaultSum(base);
    thing.dividend = fresh.dividend;
    thing.divisor = fresh.divisor;
    thing.dpA = 0;
    thing.dpB = 0;
  }
  thing.done = 0;
  thing.slips = 0;
  return true;
}

export function resetWork(thing) {
  if (!thing.done && !thing.slips) {
    return { changed: false, message: "There is nothing written on it yet." };
  }
  thing.done = 0;
  thing.slips = 0;
  return { changed: true, message: `Rubbed out — ${ask(thing).text}` };
}

/* ── what the board is asking for ─────────────────────────────────────────── */

const nth = ["", "first", "second", "third", "fourth", "fifth", "sixth"];

/** The whole sum said in one line, in the base. */
function said(plan) {
  const b = plan.base;
  const left = `${writeNum(plan.dividend, plan.dpA, b)} ÷ ${writeNum(plan.divisor, plan.dpB, b)}`;
  const right = writeNum(plan.quotient, plan.quotientDp, b);
  return plan.remainder
    ? `${left} = ${right} remainder ${writeNum(plan.remainder, 0, b)}`
    : `${left} = ${right}`;
}

/**
 * The question standing at the front of the working, in words and in the base.
 * `text` is the question; `where` says which part of the page it goes in, so
 * the panel can say "above the 0" and the eye knows where to look.
 */
export function ask(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  const b = thing.base;
  if (!e) {
    return {
      done: true, kind: null,
      text: plan.remainder ? `${said(plan)}.` : `${said(plan)} exactly.`,
      where: "",
    };
  }
  const s = e.step;
  const D = writeNum(plan.b, 0, b);
  if (e.kind === "q") {
    /* The one place a step deserves a sentence of its own: the divisor does not
       go into what is there, so the answer is nought and the next digit joins
       it. Said plainly, because "why is there a nought there" is the question
       every learner asks of this method. */
    const lead = s.q === 0 && s.cur < plan.b
      ? `${D} will not go into ${writeNum(s.cur, 0, b)} — so how many times?`
      : s.lead !== undefined
        ? `${D} will not go into ${writeNum(s.lead, 0, b)} — so how many `
          + `times does it go into ${writeNum(s.cur, 0, b)}?`
        : `How many times does ${D} go into ${writeNum(s.cur, 0, b)}?`;
    return { done: false, kind: "q", text: lead, where: `above the ${nth[s.i + 1] || "next"} figure` };
  }
  if (e.kind === "p") {
    return {
      done: false, kind: "p",
      text: `${writeNum(s.q, 0, b)} × ${D} — what do you take away?`,
      where: "under what you are dividing into",
    };
  }
  if (e.kind === "r") {
    return { done: false, kind: "r", text: "Nothing went in — what is left over?", where: "at the foot of the working" };
  }
  if (e.kind === "b") {
    return {
      done: false, kind: "b",
      text: e.fetched
        ? "There is nothing left to bring down — put a nought past the point and bring that down."
        : `Bring the ${writeNum(e.value, 0, b)} down.`,
      where: "beside what is left over",
    };
  }
  return {
    done: false, kind: "d",
    text: `${writeNum(s.cur, 0, b)} − ${writeNum(s.product, 0, b)} — what is left?`,
    where: "under the line",
  };
}

/* Why a wrong answer is wrong. The two ways of missing a quotient digit are the
   whole of the method's difficulty, and each has its own sentence. */
function nudge(e, plan, given) {
  const b = plan.base;
  const s = e.step;
  const D = writeNum(plan.b, 0, b);
  if (e.kind === "q") {
    const took = given * plan.b;
    if (took > s.cur) {
      return `Too many — ${writeNum(given, 0, b)} × ${D} is ${writeNum(took, 0, b)}, and that is more than ${writeNum(s.cur, 0, b)}.`;
    }
    if (s.cur - took >= plan.b) {
      return `Not enough — take ${writeNum(took, 0, b)} from ${writeNum(s.cur, 0, b)} and there is still another ${D} sitting in it.`;
    }
    return `Not that one. How many whole ${D}s are there in ${writeNum(s.cur, 0, b)}?`;
  }
  if (e.kind === "p") {
    return `Not quite — count ${writeNum(s.q, 0, b)} lots of ${D}.`;
  }
  if (e.kind === "d") {
    return `Not quite — take ${writeNum(s.product, 0, b)} away from ${writeNum(s.cur, 0, b)}.`;
  }
  return `Not quite — nothing was taken away, so all of ${writeNum(plan.a, 0, b)} is still there.`;
}

/* What is said once a number goes down, which is not the same as the question:
   it names what has just been proved rather than what to do next. */
function told(e, plan) {
  const b = plan.base;
  const s = e.step;
  const D = writeNum(plan.b, 0, b);
  /* The step everybody forgets: the point in the answer goes straight above the
     point under the bar, and it goes there as the working crosses it. */
  const crossing = plan.point > 0 && e.kind === "q" && s.i === plan.ones
    ? " The point in the answer goes straight above the point below it."
    : "";
  if (e.kind === "q") {
    return (s.q === 0
      ? `Nought — ${D} does not go into ${writeNum(s.cur, 0, b)}.`
      : `${D} goes into ${writeNum(s.cur, 0, b)} ${writeNum(s.q, 0, b)} times.`) + crossing;
  }
  if (e.kind === "p") return `${writeNum(s.q, 0, b)} × ${D} = ${writeNum(s.product, 0, b)}.`;
  if (e.kind === "r") return `${writeNum(plan.a, 0, b)} is left over.`;
  if (e.kind === "b") {
    return e.fetched
      ? `A nought comes down from past the point — that makes ${writeNum(s.cur, 0, b)}.`
      : `${writeNum(e.value, 0, b)} comes down — that makes ${writeNum(s.cur, 0, b)}.`;
  }
  return `${writeNum(s.cur, 0, b)} − ${writeNum(s.product, 0, b)} = ${writeNum(s.rem, 0, b)}.`;
}

/** The sentence for a finished sum, said once the last number is written. */
function finish(plan) {
  return plan.remainder
    ? `Done — ${said(plan)}.`
    : `Done — ${said(plan)}, and nothing left over.`;
}

/* ── writing a number on the page ─────────────────────────────────────────── */

/**
 * Offer `text` as the number the board is waiting for.
 *
 * Refused answers change nothing but the tally of slips — the page is never
 * written on and then corrected, because a crossing-out on a division is a
 * worse thing to read than a blank.
 */
export function answer(thing, text) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return { ok: false, changed: false, message: finish(plan) };

  const read = readNum(text, thing.base);
  const given = read && read.dp === 0 ? read.n : null;
  if (given === null) {
    return {
      ok: false, changed: false,
      message: `Write it in base ${baseWord(thing.base)} — digits 0 to ${DIGITS[thing.base - 1]}.`,
    };
  }
  if (given !== e.value) {
    /* The tally of slips moves but the PAGE does not, which is why this is not
       a change: stepping back should take a line of working off, never a typo. */
    thing.slips += 1;
    return { ok: false, changed: false, message: nudge(e, plan, given) };
  }

  thing.done += 1;
  const finished = thing.done >= plan.entries.length;
  /* `kind` is how the canvas knows WHICH of D, M, S, B was just written — the
     blocks are laid out differently for each, and the S is the one where a
     group of them is taken away. */
  return {
    ok: true, changed: true, finished, kind: e.kind,
    message: finished ? finish(plan) : told(e, plan),
  };
}

/**
 * Bring the waiting digit down — the one thing on this board done with the hand
 * rather than with the head. Refused unless that is what is being asked for, so
 * a stray drag cannot skip a step of the working.
 */
export function bringDown(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e || e.kind !== "b") {
    return { ok: false, changed: false, message: "There is nothing to bring down just now." };
  }
  thing.done += 1;
  return { ok: true, changed: true, message: told(e, plan) };
}

/** Write the next number for them, and say what it was. */
export function showNext(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return { changed: false, message: finish(plan) };
  thing.done += 1;
  const finished = thing.done >= plan.entries.length;
  return {
    changed: true, finished, kind: e.kind,
    message: finished ? finish(plan) : `${writeNum(e.value, 0, thing.base)} — ${told(e, plan)}`,
  };
}

/**
 * Show `n` on this board — the number being divided.
 *
 * The divisor is left where it is: it is the question being asked OF the
 * number, not part of the number, and sync hands round a number.
 */
export function setDividend(thing, n) {
  const want = Math.max(0, Math.round(n));
  if (want === thing.dividend && !(thing.dpA || 0)) return true;
  return setSum(thing, want, thing.divisor, 0, thing.dpB || 0).ok === true;
}

/**
 * What is STILL TO BE SHARED OUT — the number this board is holding right now.
 *
 * A division is repeated subtraction, so the number on the page is not the same
 * from one line to the next: 305 shared between 7 is 305 to begin with, then 25
 * once the first 28 has been taken away, and 4 at the end. That is the number
 * the other tools should be showing while the sum is worked — watch the blocks
 * and you watch the pile being shared out and getting smaller.
 */
export function leftToShare(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return plan.remainder;
  const s = e.step;
  let n = s.cur;
  for (let k = s.i + 1; k < plan.digits.length; k++) n = n * thing.base + plan.digits[k];
  return n;
}

/**
 * The cells the learner writes in NOW — one box per digit, over the page itself.
 *
 * A number two figures long is two boxes in two columns, because that is what it
 * is on paper: 28 taken away from 30 is a 2 in the tens and an 8 in the ones,
 * and one box holding "28" quietly drops the whole argument about place.
 */
export function cellsOf(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return null;
  const grid = { cols: plan.cols, rows: plan.rows, gutter: plan.gutter };
  if (e.kind === "b") {
    return {
      mode: "bring", grid, ch: writeNum(e.value, 0, thing.base),
      from: { row: 1, col: e.endCol },     // where it stands in the dividend
      to: { row: e.row, col: e.endCol },   // and where it is going
    };
  }
  const figures = writeNum(e.value, 0, thing.base);
  return {
    mode: "type", grid,
    cells: [...figures].map((ch, k) => ({
      row: e.row, col: e.endCol - (figures.length - 1 - k),
    })),
  };
}

/** The columns the pending number occupies — one per box. */
function askCols(thing) {
  const open = cellsOf(thing);
  if (!open) return [];
  return open.mode === "bring" ? [open.to.col] : open.cells.map((c) => c.col);
}

/* ── the page, as marks ───────────────────────────────────────────────────── */

/**
 * Everything to draw, worked out from the plan and how far the learner has got.
 *
 * Returned as data rather than drawn straight onto the texture so it can be
 * read back — a test can assert what is on the paper, which is otherwise
 * impossible for anything painted into a WebGL texture.
 */
export function sheetOf(thing) {
  const plan = planOf(thing);
  const b = thing.base;
  const marks = [];   // { row, col, ch, tone }
  const rules = [];   // { row, from, to } — a line under `row`, cols from..to
  const minus = [];   // { row, col } — the sign in front of what is taken away
  const points = [];  // { row, col } — a point in the gap AFTER this column

  const put = (row, endCol, value, tone) => {
    const chars = writeNum(value, 0, b);
    [...chars].forEach((ch, k) => {
      marks.push({ row, col: endCol - (chars.length - 1 - k), ch, tone });
    });
    return { from: endCol - chars.length + 1, to: endCol };
  };

  /* The divisor outside the bar, pushed to the left edge so the column next to
     the bar stays empty — that column is where the minus signs go, and a
     divisor sitting in it would be read as part of the working. */
  const dvs = writeNum(plan.b, 0, b);
  [...dvs].forEach((ch, k) => {
    marks.push({ row: 1, col: -plan.gutter + k, ch, tone: "ink" });
  });

  const e = plan.entries[thing.done] || null;

  /* How far along the dividend the working has fetched noughts. A nought past
     the end of the number is not on the page until it has been asked for —
     it was never part of the number, it is something the working went and got. */
  let fetchedTo = -1;
  for (let n = 0; n < thing.done; n++) {
    const d = plan.entries[n];
    if (d.kind === "b" && d.fetched) fetchedTo = Math.max(fetchedTo, d.endCol);
  }
  plan.digits.forEach((d, i) => {
    const madeUp = i >= plan.real;
    if (madeUp && i > fetchedTo) return;
    marks.push({ row: 1, col: i, ch: DIGITS[d], tone: madeUp ? "soft" : "ink" });
  });
  if (plan.point > 0) points.push({ row: 1, col: plan.ones });

  /* Nothing is on this page that was not put there. A digit brought down is a
     step of the working like any other, so it appears when it is brought and
     not a moment before. */
  let quotientTo = -1;
  for (let n = 0; n < thing.done; n++) {
    const done = plan.entries[n];
    if (done.kind === "q") {
      marks.push({ row: 0, col: done.endCol, ch: writeNum(done.value, 0, b), tone: "ink" });
      quotientTo = Math.max(quotientTo, done.endCol);
    } else if (done.kind === "p") {
      const span = put(done.row, done.endCol, done.value, "ink");
      rules.push({ row: done.row, from: span.from, to: span.to });
      minus.push({ row: done.row, col: span.from });
    } else {
      put(done.row, done.endCol, done.value, "ink");
    }
  }
  /* The point in the answer, drawn the moment the figure to its left is — which
     is the moment a hand writing this would put it in. */
  if (plan.point > 0 && quotientTo >= plan.ones) points.push({ row: 0, col: plan.ones });

  const finished = thing.done >= plan.entries.length;
  /* One line under the thing left over, the way an answer is underlined —
     only once the sum is finished, so it reads as "this is the end of it". */
  let underline = null;
  if (finished) {
    const last = marks.filter((m) => m.row === plan.rows - 1);
    if (last.length) {
      underline = {
        row: plan.rows - 1,
        from: Math.min(...last.map((m) => m.col)),
        to: Math.max(...last.map((m) => m.col)),
      };
    }
  }
  return {
    plan, cols: plan.cols, rows: plan.rows, gutter: plan.gutter, width: plan.digits.length,
    marks, rules, minus, points, signs: [], underline,
    /* The bar and the line down the side of it — the bus stop. It reaches as
       far as the figures under it and no further, so it grows a column each
       time a nought is fetched from past the point, the way a hand draws it. */
    bracket: { row: 1, to: Math.max(plan.real, fetchedTo + 1) },
    /* Every cell the next number goes in, not just its last: a two-figure
       answer is outlined as two cells, which is how many boxes there are. */
    ask: e ? { row: e.row, cols: askCols(thing) } : null,
    finished,
    remainder: plan.remainder,
    tail: finished && plan.remainder ? `r ${writeNum(plan.remainder, 0, b)}` : "",
    /* the whole thing said in one line, for a heading or a readout */
    sum: said(plan),
  };
}
