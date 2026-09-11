/* ============================================================================
   THE WRITTEN BOARDS — addition set out in columns, with the carrying shown
   ----------------------------------------------------------------------------
   Numbers stacked one under another, a line, and the answer written under it a
   column at a time from the right — with the carried figure written small above
   the column it is carried INTO, which is the whole reason the method is set
   out this way.

   ── the carry is a question, not a decoration ─────────────────────────────
   Every column asks up to two things, in the order a hand writing this says
   them out loud:

     "seven and five — what goes under the line?"   → 2
     "that made twelve — what carries?"             → 1

   A column that does not overflow asks only the first. Splitting it in two is
   the point: "write the 2 and carry the 1" is one sentence and TWO different
   facts, and a board that asked for the twelve and then wrote both figures
   itself would be doing the harder half of the work.

   The commonest slip has its own answer. Type the whole twelve where only the
   two fits and the board does not say "wrong" — it says the total is right and
   will not fit, which is the thing being taught.

   ── points line up, and then they are forgotten ───────────────────────────
   2.5 + 1.25 is written as 2.50 + 1.25: the points in a column, the gaps filled
   with noughts, and after that it is 250 + 125 with a point dropped straight
   down into the answer. Filling the gap is not tidiness — a blank in the
   hundredths column is a column with nothing in it, and the whole method is an
   argument about which column a figure is in.

   ── it follows the working base like everything else here ─────────────────
   None of this is about ten. In base five 234₅ + 132₅ carries twice, for the
   same reason and with the same two questions. Everything is worked in plain
   counting numbers and only ever WRITTEN in the base, so there is one method
   and not one per base.

   ── nothing on the page ever moves ────────────────────────────────────────
   Every figure belongs to a column — the column of the place it counts — and
   to a row: carries on top, the numbers being added under them, the answer
   below the line. A figure written into a cell stays in that cell for the rest
   of the sum, because the whole argument here is about place value and a
   layout that shuffles sideways destroys it.
   ========================================================================== */

import { DIGITS, baseWord, digitsOf, pow, readNum, writeNum } from "./num.js";

/* The column the + sign stands in, to the left of every figure. */
export const GUTTER = 1;

/* As long a sum as the board will take. Past six figures the columns are
   narrower than the pen and the point has long been made. */
export const MAX_DIGITS = 6;
export const MAX_ADDENDS = 4;
export const MAX_PLACES = 3;

/**
 * The numbers typed into one box: "269 + 182", or "2.5 + 1.25", or with any
 * spacing, or with nothing but a space between them. Returns the numbers all
 * written to the same number of places — which is the first thing a hand doing
 * this does — or null if any of them is not a number in this base. Typing 8
 * into a base-five sum is not a slip of the finger, it is the
 * misunderstanding the board exists to catch.
 */
export function readSum(text, base) {
  const parts = String(text ?? "").split(/[+,]|\s+/).filter((s) => s.trim());
  if (!parts.length) return null;
  const ns = parts.map((p) => readNum(p, base));
  if (ns.some((n) => n === null)) return null;
  const dp = Math.max(...ns.map((n) => n.dp));
  return { addends: ns.map((n) => n.n * pow(base, dp - n.dp)), dp };
}

/* ── the sum the board opens on ───────────────────────────────────────────── */

/**
 * Two three-figure numbers that carry TWICE, in whatever base is being worked
 * in. Chosen so the opening sum shows the thing the board is for: a column that
 * overflows, and a second column that overflows again because of what the first
 * one sent up. In base ten it lands on 269 + 182.
 */
export function defaultSum(base) {
  const top = [
    Math.min(base - 1, 2),
    Math.min(base - 1, Math.floor(base / 2) + 1),
    base - 1,
  ];
  const bottom = [
    Math.min(base - 1, 1),
    Math.max(0, base - 2),
    Math.min(base - 1, 2),
  ];
  const value = (ds) => ds.reduce((n, d) => n * base + d, 0);
  return [value(top), value(bottom)];
}

/* ── the plan ─────────────────────────────────────────────────────────────── */

/**
 * The whole sum, worked out and laid out.
 *
 * One `column` per place, counted from the ones end, each holding the figures
 * being added in it, what came in from the column before, what stays and what
 * carries. The entries are what the learner is asked for, in order.
 *
 * The page is as wide as the ANSWER, not as the longest number being added:
 * 269 + 182 is three columns, 900 + 900 is four, and the fourth column's
 * question is "there is nothing left to add but the carried 1".
 */
export function workOut(addends, base, dp = 0) {
  const total = addends.reduce((s, n) => s + n, 0);
  const figures = addends.map((n) => digitsOf(n, base));
  /* Room for a figure before the point on the answer and on every number being
     added — 0.25, never .25. */
  const width = Math.max(digitsOf(total, base).length, dp + 1);
  const rows = addends.length + 2;   // carries, the numbers, the answer
  const cols = GUTTER + width;

  const columns = [];
  const entries = [];
  let carry = 0;
  for (let p = 0; p < width; p++) {
    /* null where a number is too short to reach this column: a blank, not a
       nought — except at the ones column, where a number smaller than one is
       written with its 0 and that 0 is a figure of the sum like any other. */
    const parts = figures.map((ds) => {
      if (p < ds.length) return ds[ds.length - 1 - p];
      return p <= dp ? 0 : null;
    });
    const seen = parts.filter((d) => d !== null);
    const sum = seen.reduce((s, d) => s + d, 0) + carry;
    const col = {
      p, parts, seen, carryIn: carry, total: sum,
      stay: sum % base, carry: Math.floor(sum / base),
    };
    columns.push(col);
    entries.push({ kind: "s", col, value: col.stay, row: rows - 1, place: p });
    /* The carry is asked for straight after the figure that stays, because that
       is the order it is said in and the order it is written in. It never runs
       off the left of the page: the page is as wide as the answer, so the last
       column's total is a single figure by construction. */
    if (col.carry) entries.push({ kind: "c", col, value: col.carry, row: 0, place: p + 1 });
    carry = col.carry;
  }

  return { addends, base, dp, total, figures, width, rows, cols, columns, entries };
}

/* Plans are pure and small, and the drawing asks for one on every repaint —
   so they are kept. Keyed by the sum itself, which is all a plan depends on. */
const PLANS = new Map();

export function planOf(thing) {
  const key = `${thing.addends.join("+")}.${thing.dp || 0}/${thing.base}`;
  let plan = PLANS.get(key);
  if (!plan) {
    plan = workOut(thing.addends, thing.base, thing.dp || 0);
    if (PLANS.size > 40) PLANS.clear();
    PLANS.set(key, plan);
  }
  return plan;
}

/* ── the thing being worked on ────────────────────────────────────────────── */

export function makeColumn(base) {
  return {
    kind: "board", variant: "column", tag: null, x: 0, z: 0, angle: 0,
    base, addends: defaultSum(base), dp: 0,
    done: 0,      // how many of the plan's entries have been written
    slips: 0,     // wrong answers so far, so the board can offer to show one
  };
}

/**
 * Whether a sum can be set on the board, and why not if it cannot.
 * Checked here rather than in the panel so the rule has one home.
 */
export function checkSum(addends, base, dp = 0) {
  if (!addends || addends.some((n) => n === null)) {
    return { ok: false, message: `Write the numbers in base ${baseWord(base)} — digits 0 to ${DIGITS[base - 1]}.` };
  }
  if (addends.length < 2) {
    return { ok: false, message: "Two numbers at least — write them with a + between them." };
  }
  if (addends.length > MAX_ADDENDS) {
    return { ok: false, message: `Up to ${MAX_ADDENDS} numbers at a time — past that the page is taller than it is wide.` };
  }
  if (dp > MAX_PLACES) {
    return { ok: false, message: `Up to ${MAX_PLACES} figures after the point.` };
  }
  if (addends.some((n) => n < 1)) {
    return { ok: false, message: "Every number has to be worth something — adding nought moves nothing." };
  }
  const total = addends.reduce((s, n) => s + n, 0);
  if (Math.max(digitsOf(total, base).length, dp + 1) > MAX_DIGITS) {
    return { ok: false, message: `That comes to more than ${MAX_DIGITS} figures in base ${baseWord(base)} — the columns would be narrower than the pen.` };
  }
  return { ok: true };
}

/** Put a new sum on the board and rub out whatever was worked on the old one. */
export function setSum(thing, addends, dp = 0) {
  const check = checkSum(addends, thing.base, dp);
  if (!check.ok) return check;
  if (addends.length === thing.addends.length && dp === (thing.dp || 0)
    && addends.every((n, i) => n === thing.addends[i])) {
    return { ok: false, message: "That is the sum it is already showing." };
  }
  thing.addends = addends.slice();
  thing.dp = dp;
  thing.done = 0;
  thing.slips = 0;
  const b = thing.base;
  return {
    ok: true, changed: true,
    message: `${addends.map((n) => writeNum(n, dp, b)).join(" + ")} — ${ask(thing).text}`,
  };
}

/** Read a sum written in one line — "2.5 + 1.25" — and set it. */
export function setWritten(thing, text) {
  const read = readSum(text, thing.base);
  if (!read) {
    return { ok: false, message: `Write the numbers in base ${baseWord(thing.base)} — digits 0 to ${DIGITS[thing.base - 1]}.` };
  }
  return setSum(thing, read.addends, read.dp);
}

/**
 * Move the board to another base.
 *
 * The numbers do not change — 269 is 269 however it is written — but every
 * figure on the page does, and so does the carrying, because a column overflows
 * at the base and the base has just moved. So the sheet is rubbed clean rather
 * than half-translated, and a sum too long to write in the new base gives way
 * to that base's own opening sum.
 */
export function rebaseColumn(thing, base) {
  thing.base = base;
  if (!checkSum(thing.addends, base, thing.dp || 0).ok) {
    thing.addends = defaultSum(base);
    thing.dp = 0;
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

const ORD = ["", "second", "third", "fourth", "fifth", "sixth", "seventh"];

/** Which column, said without leaning on base ten's names for the places. */
function columnName(p, dp) {
  if (p === dp) return "the ones column";
  if (p < dp) {
    const k = dp - p;
    return k === 1 ? "the first column past the point"
      : `the ${ORD[k - 1] || `${k}th`} column past the point`;
  }
  const k = p - dp;
  return `the ${ORD[k] || `${k + 1}th`} column from the point`;
}

/** The figures being added in this column, said out loud. */
function adding(col, b) {
  const parts = col.seen.map((d) => writeNum(d, 0, b));
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * The question standing at the front of the working, in words and in the base.
 * `text` is the question; `where` says which part of the page it goes in, so
 * the panel can say "in the ones column" and the eye knows where to look.
 */
export function ask(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  const b = thing.base;
  const dp = plan.dp;
  if (!e) {
    return {
      done: true, kind: null, where: "",
      text: `${plan.addends.map((n) => writeNum(n, dp, b)).join(" + ")} = ${writeNum(plan.total, dp, b)}.`,
    };
  }
  const col = e.col;
  if (e.kind === "c") {
    return {
      done: false, kind: "c",
      text: `That made ${writeNum(col.total, 0, b)} — the ${writeNum(col.stay, 0, b)} is down. What carries?`,
      where: `above ${columnName(e.place, dp)}`,
    };
  }
  const list = adding(col, b);
  /* The column past the end of every number being added. Nothing is being added
     in it at all — what is written there is the carry and only the carry, and
     saying so is the difference between an answer that grew a figure and one
     that seems to have invented one. */
  if (!list) {
    return {
      done: false, kind: "s",
      text: `Nothing left to add — only the ${writeNum(col.carryIn, 0, b)} carried. What goes under the line?`,
      where: `in ${columnName(e.place, dp)}`,
    };
  }
  return {
    done: false, kind: "s",
    text: col.carryIn
      ? `${list}, and the ${writeNum(col.carryIn, 0, b)} carried — what goes under the line?`
      : `${list} — what goes under the line?`,
    where: `in ${columnName(e.place, dp)}`,
  };
}

/* Why a wrong answer is wrong. Each of the ways of missing a column has its own
   sentence, because each is a different misunderstanding. */
function nudge(e, plan, given) {
  const b = plan.base;
  const col = e.col;
  if (e.kind === "c") {
    if (given === col.stay) {
      return `That is the figure that stays under the line. What carries is the rest of ${writeNum(col.total, 0, b)}.`;
    }
    if (given === col.total) {
      return "Not all of it goes up — only the part that would not fit in the column.";
    }
    return `Not quite — ${writeNum(col.total, 0, b)} is ${writeNum(col.carry, 0, b)} `
      + `${baseWord(b)}${col.carry === 1 ? "" : "s"} and ${writeNum(col.stay, 0, b)} over.`;
  }
  /* Writing the carry where the figure that stays goes. Now that a cell holds
     ONE figure, this is what "the answer is twelve" comes out as: the 1 gets
     written first because it is said first, in the column it does not belong
     to. Naming it is the whole lesson of carrying. */
  if (col.carry && given === col.carry) {
    return `That ${writeNum(col.carry, 0, b)} is the part that CARRIES — it belongs above `
      + `the next column. Under the line goes what is left of ${writeNum(col.total, 0, b)}.`;
  }
  /* The whole total offered where only one figure fits. A cell takes one figure
     so this cannot be typed on the page any more, but the sum can still be given
     whole from elsewhere, and it is not a wrong sum — it is the right sum with
     nowhere to put it, which is exactly what carrying is for. */
  if (given === col.total && col.carry) {
    return `${writeNum(col.total, 0, b)} is right, but it will not fit in one column — `
      + `write the ${writeNum(col.stay, 0, b)} and the ${writeNum(col.carry, 0, b)} carries.`;
  }
  const without = col.total - col.carryIn;
  if (col.carryIn && (given === without || given === without % b)) {
    return `You have left out the ${writeNum(col.carryIn, 0, b)} carried from the column before.`;
  }
  const list = adding(col, b);
  return list
    ? `Not that — add the column again: ${list}${col.carryIn ? `, and the ${writeNum(col.carryIn, 0, b)} carried` : ""}.`
    : `Not that — there is only the ${writeNum(col.carryIn, 0, b)} carried in that column.`;
}

/* What is said once a figure goes down, which is not the same as the question:
   it names what has just been proved rather than what to do next. */
function told(e, plan) {
  const b = plan.base;
  const col = e.col;
  if (e.kind === "c") return `The ${writeNum(col.carry, 0, b)} carries into ${columnName(e.place, plan.dp)}.`;
  const list = adding(col, b);
  const saidIt = col.carryIn && list
    ? `${list} and ${writeNum(col.carryIn, 0, b)} is ${writeNum(col.total, 0, b)}`
    : `${list || writeNum(col.carryIn, 0, b)} is ${writeNum(col.total, 0, b)}`;
  /* The point comes straight down out of the numbers above it, and it comes
     down as the ones column is written — which is where a hand puts it. */
  const point = plan.dp && e.place === plan.dp
    ? " The point comes straight down from the points above it."
    : "";
  return (col.carry ? `${saidIt} — the ${writeNum(col.stay, 0, b)} goes under the line.` : `${saidIt}.`) + point;
}

/** The sentence for a finished sum, said once the last figure is written. */
function finish(plan) {
  const b = plan.base;
  const dp = plan.dp;
  return `Done — ${plan.addends.map((n) => writeNum(n, dp, b)).join(" + ")} = ${writeNum(plan.total, dp, b)}.`;
}

/* ── writing a figure on the page ─────────────────────────────────────────── */

/**
 * Offer `text` as the figure the board is waiting for.
 *
 * Refused answers change nothing but the tally of slips — the page is never
 * written on and then corrected, because a crossing-out in a column of figures
 * is a worse thing to read than a blank.
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
    thing.slips += 1;
    return { ok: false, changed: true, message: nudge(e, plan, given) };
  }

  thing.done += 1;
  const finished = thing.done >= plan.entries.length;
  return {
    ok: true, changed: true, finished,
    message: finished ? finish(plan) : told(e, plan),
  };
}

/** Write the next figure for them, and say what it was. */
export function showNext(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return { changed: false, message: finish(plan) };
  thing.done += 1;
  const finished = thing.done >= plan.entries.length;
  return {
    changed: true, finished,
    message: finished ? finish(plan) : `${writeNum(e.value, 0, thing.base)} — ${told(e, plan)}`,
  };
}

/**
 * Show `n` on this board — which for an addition means a sum that COMES TO n.
 *
 * Split down the middle: two numbers of the same length, which is the shape
 * that carries, and the same n always gives back the same sum so the board does
 * not shuffle under you every time something else on the canvas twitches. A sum
 * that already totals n is LEFT ALONE — sync asks the board to show a number,
 * not to be rewritten for the sake of it.
 */
export function setTotal(thing, n) {
  const want = Math.max(0, Math.round(n));
  if (!(thing.dp || 0) && want === thing.addends.reduce((s, x) => s + x, 0)) return true;
  const a = Math.ceil(want / 2);
  if (want - a < 1) return false;   // nothing under two can be split in two
  return setSum(thing, [a, want - a], 0).ok === true;
}

/**
 * The cell the learner writes in NOW — over the page itself, not in a strip
 * beside it. Always exactly one box here: every figure this method asks for is
 * a single figure, which is the whole reason it asks twice for a column that
 * overflows instead of once for the total.
 */
export function cellsOf(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return null;
  return {
    mode: "type",
    grid: { cols: plan.cols, rows: plan.rows, gutter: GUTTER },
    cells: [{ row: e.row, col: plan.width - 1 - e.place }],
  };
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
  const dp = plan.dp;
  const marks = [];             // { row, col, ch, tone }
  const points = [];            // { row, col } — a point in the gap AFTER this column
  const colOf = (p) => plan.width - 1 - p;

  /* The numbers being added, each right-aligned on the ones column, each with
     the gaps past the point filled in — 2.5 written as 2.50 under 1.25. */
  plan.addends.forEach((n, i) => {
    const chars = writeNum(n, dp, b).replace(".", "");
    [...chars].forEach((ch, k) => {
      marks.push({ row: 1 + i, col: colOf(chars.length - 1 - k), ch, tone: "ink" });
    });
    if (dp) points.push({ row: 1 + i, col: colOf(dp) });
  });

  // everything that has actually been written
  let onesDone = false;
  for (let n = 0; n < thing.done; n++) {
    const done = plan.entries[n];
    marks.push({
      row: done.row, col: colOf(done.place),
      ch: writeNum(done.value, 0, b), tone: done.kind === "c" ? "carry" : "ink",
    });
    if (done.kind === "s" && done.place >= dp) onesDone = true;
  }
  /* The point in the answer, drawn as the ones column is written — which is
     where a hand writing this puts it, straight down from the ones above. */
  if (dp && onesDone) points.push({ row: plan.rows - 1, col: colOf(dp) });

  const e = plan.entries[thing.done] || null;
  const finished = thing.done >= plan.entries.length;
  return {
    plan, cols: plan.cols, rows: plan.rows, width: plan.width, gutter: GUTTER,
    marks, points, minus: [], bracket: null,
    /* the line of the sum, drawn under the last number and back through the
       sign, because the sign is part of the sum and not a note beside it */
    rules: [{ row: plan.addends.length, from: -GUTTER, to: plan.width - 1 }],
    signs: [{ row: plan.addends.length, col: -GUTTER, ch: "+" }],
    underline: finished ? { row: plan.rows - 1, from: 0, to: plan.width - 1 } : null,
    // a list, because the division's page asks for two cells at once
    ask: e ? { row: e.row, cols: [colOf(e.place)] } : null,
    finished,
    total: plan.total,
    sum: `${plan.addends.map((n) => writeNum(n, dp, b)).join(" + ")} = ${writeNum(plan.total, dp, b)}`,
  };
}
