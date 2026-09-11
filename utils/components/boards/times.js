/* ============================================================================
   THE WRITTEN BOARDS — multiplication set out in columns
   ----------------------------------------------------------------------------
   The third of the written methods, and the one that is really two methods
   stacked: a row of multiplying for each figure of the number you are
   multiplying BY, and then an addition of those rows. The board says so by
   drawing it that way — a line under the numbers, a row per figure, a second
   line, and the answer under that.

   ── the two questions, again ──────────────────────────────────────────────
   Every figure of a row asks the same pair the addition board asks:

     "three sevens — what goes under the line?"     → 1
     "that made twenty-one — what carries?"         → 2

   and the carry is written small above the NEXT column of the number being
   multiplied, where a hand writes it, and rubbed out when that row is finished
   — because a carry belongs to one row and reading it into the next is the
   commonest way this method goes wrong.

   ── the nought that holds the place ───────────────────────────────────────
   The second row is the tens figure's row, so it starts one column further
   left, and the column it leaves empty is filled with a nought. The board puts
   those noughts in itself, faintly: they are not a calculation, they are what
   "this row is worth ten times as much" looks like on paper.

   ── the point is counted, not lined up ────────────────────────────────────
   This is the one written method where the points are NOT put under each
   other. 2.5 × 1.25 is worked as 25 × 125 and the point is put back at the end
   by counting: one figure after the point in the first, two in the second,
   three in the answer. So the last thing the board asks for is that count —
   which is the only part of a decimal multiplication anybody gets wrong.

   ── it follows the working base like everything else here ─────────────────
   None of this is about ten. In base five 23₅ × 4₅ carries for the same reason
   and the board asks in base five. Everything is worked in plain counting
   numbers and only ever WRITTEN in the base.
   ========================================================================== */

import { DIGITS, baseWord, digitsOf, pow, readNum, writeNum } from "./num.js";

/* The column the × sign stands in, to the left of every figure. */
export const GUTTER = 1;

/* Two columns of air to the right of the answer. The count of places at the
   end is written in one of them — it is a note about the answer and not a
   figure of it, so it does not stand in the answer's own columns. */
export const RIGHT = 2;

export const MAX_DIGITS = 6;       // as wide as the answer may be
export const MAX_BY = 3;           // figures in the number you multiply BY
export const MAX_PLACES = 3;

/* ── the sum the board opens on ───────────────────────────────────────────── */

/**
 * A three-figure number times a two-figure one, so the opening board shows the
 * whole method at once: two rows, the place-holding nought, and an addition to
 * finish. In base ten it lands on 246 × 13.
 */
export function defaultSum(base) {
  const value = (ds) => ds.reduce((n, d) => n * base + d, 0);
  const a = value([
    Math.min(base - 1, 2),
    Math.min(base - 1, 4),
    Math.min(base - 1, 6),
  ]);
  const b = value([1, Math.min(base - 1, 3)]);
  return { multiplicand: a, multiplier: b, dpA: 0, dpB: 0 };
}

/* ── the plan ─────────────────────────────────────────────────────────────── */

/**
 * The whole sum, worked out and laid out.
 *
 * `rows` counts down the page: 0 is the line the carries are written on, 1 the
 * number being multiplied, 2 the number it is multiplied by, then one row for
 * each figure of that number, and — when there is more than one — a last row
 * for the answer.
 *
 * Every entry carries the `run` it belongs to: which row of multiplying, or the
 * addition at the end, or the counting of the places. The carries on row 0
 * belong to one run only, which is how they get rubbed out between rows.
 */
export function workOut(multiplicand, multiplier, base, dpA = 0, dpB = 0) {
  const A = digitsOf(multiplicand, base);          // biggest place first
  const B = digitsOf(multiplier, base);
  const la = A.length;
  const lb = B.length;
  const product = multiplicand * multiplier;
  const dp = dpA + dpB;
  const width = Math.max(digitsOf(product, base).length, dp + 1);

  /* The ones figure's row goes first, straight under the line, and each
     figure after it one row lower — the way a hand writes it. */
  const partRow = (j) => 3 + j;
  const answerRow = lb > 1 ? 3 + lb : partRow(0);
  const rows = answerRow + 1;

  const entries = [];
  const parts = [];       // one per figure of the multiplier, biggest place last

  for (let j = 0; j < lb; j++) {
    const d = B[lb - 1 - j];                       // the figure, counted from the right
    const row = partRow(j);
    const digits = [];                             // place -> figure, or null
    for (let k = 0; k < j; k++) digits[k] = { d: 0, held: true };   // the place-holding noughts

    if (d === 0) {
      /* Nothing times anything is nothing. One nought is written and the row is
         done — asking for a whole row of them would teach nothing. */
      entries.push({ kind: "z", run: j, value: 0, row, place: j, d, i: 0 });
      digits[j] = { d: 0, held: false };
    } else {
      let carry = 0;
      for (let i = 0; i < la; i++) {
        const a = A[la - 1 - i];
        const total = a * d + carry;
        const stay = total % base;
        const up = Math.floor(total / base);
        entries.push({ kind: "m", run: j, value: stay, row, place: j + i, d, a, i, total, carryIn: carry });
        if (up) entries.push({ kind: "mc", run: j, value: up, row: 0, place: j + i + 1, d, a, i, total, carryIn: carry });
        digits[j + i] = { d: stay, held: false };
        carry = up;
      }
      if (carry) {
        entries.push({ kind: "m", run: j, value: carry, row, place: j + la, d, a: 0, i: la, total: carry, carryIn: carry, last: true });
        digits[j + la] = { d: carry, held: false };
      }
    }
    parts.push({ j, d, row, digits, value: multiplicand * d * pow(base, j) });
  }

  /* The addition of the rows, when there is more than one of them. Exactly the
     column addition, over the figures already on the page. */
  const columns = [];
  if (lb > 1) {
    let carry = 0;
    for (let p = 0; p < width; p++) {
      const seen = parts.map((pt) => (pt.digits[p] ? pt.digits[p].d : null)).filter((v) => v !== null);
      const total = seen.reduce((s, v) => s + v, 0) + carry;
      const col = { p, seen, carryIn: carry, total, stay: total % base, carry: Math.floor(total / base) };
      columns.push(col);
      entries.push({ kind: "a", run: lb, col, value: col.stay, row: answerRow, place: p });
      if (col.carry) entries.push({ kind: "ac", run: lb, col, value: col.carry, row: 0, place: p + 1 });
      carry = col.carry;
    }
  }

  /* And the point, put back by counting. */
  if (dp > 0) entries.push({ kind: "pt", run: lb + 1, value: dp, row: answerRow, place: null });

  return {
    multiplicand, multiplier, base, dpA, dpB, dp,
    A, B, la, lb, product, width, rows, answerRow, parts, columns, entries,
    cols: GUTTER + width + RIGHT,
    lastPartRow: partRow(lb - 1),
  };
}

/* Plans are pure and small, and the drawing asks for one on every repaint —
   so they are kept. */
const PLANS = new Map();

export function planOf(thing) {
  const key = `${thing.multiplicand}.${thing.dpA || 0}x${thing.multiplier}.${thing.dpB || 0}/${thing.base}`;
  let plan = PLANS.get(key);
  if (!plan) {
    plan = workOut(thing.multiplicand, thing.multiplier, thing.base, thing.dpA || 0, thing.dpB || 0);
    if (PLANS.size > 40) PLANS.clear();
    PLANS.set(key, plan);
  }
  return plan;
}

/* ── the thing being worked on ────────────────────────────────────────────── */

export function makeTimes(base) {
  const { multiplicand, multiplier } = defaultSum(base);
  return {
    kind: "board", variant: "times", tag: null, x: 0, z: 0, angle: 0,
    base, multiplicand, multiplier, dpA: 0, dpB: 0,
    done: 0,
    slips: 0,
  };
}

export function checkSum(multiplicand, multiplier, base, dpA = 0, dpB = 0) {
  if (multiplicand === null || multiplier === null) {
    return { ok: false, message: `Write both numbers in base ${baseWord(base)} — digits 0 to ${DIGITS[base - 1]}.` };
  }
  if (dpA > MAX_PLACES || dpB > MAX_PLACES) {
    return { ok: false, message: `Up to ${MAX_PLACES} figures after the point.` };
  }
  if (multiplicand < 1 || multiplier < 1) {
    return { ok: false, message: "Both numbers have to be worth something — multiplying by nought leaves nothing to set out." };
  }
  if (digitsOf(multiplier, base).length > MAX_BY) {
    return { ok: false, message: `Multiply by up to ${MAX_BY} figures — past that there are more rows than the paper holds.` };
  }
  const product = multiplicand * multiplier;
  if (Math.max(digitsOf(product, base).length, dpA + dpB + 1) > MAX_DIGITS) {
    return { ok: false, message: `That comes to more than ${MAX_DIGITS} figures in base ${baseWord(base)} — the columns would be narrower than the pen.` };
  }
  return { ok: true };
}

export function setSum(thing, multiplicand, multiplier, dpA = 0, dpB = 0) {
  const check = checkSum(multiplicand, multiplier, thing.base, dpA, dpB);
  if (!check.ok) return check;
  if (multiplicand === thing.multiplicand && multiplier === thing.multiplier
    && dpA === (thing.dpA || 0) && dpB === (thing.dpB || 0)) {
    return { ok: false, message: "That is the sum it is already showing." };
  }
  thing.multiplicand = multiplicand;
  thing.multiplier = multiplier;
  thing.dpA = dpA;
  thing.dpB = dpB;
  thing.done = 0;
  thing.slips = 0;
  const b = thing.base;
  return {
    ok: true, changed: true,
    message: `${writeNum(multiplicand, dpA, b)} × ${writeNum(multiplier, dpB, b)} — ${ask(thing).text}`,
  };
}

/** Read a sum written as two numbers — "2.5" and "1.25" — and set it. */
export function setWritten(thing, aText, bText) {
  const A = readNum(aText, thing.base);
  const B = readNum(bText, thing.base);
  if (!A || !B) {
    return { ok: false, message: `Write both numbers in base ${baseWord(thing.base)} — digits 0 to ${DIGITS[thing.base - 1]}.` };
  }
  return setSum(thing, A.n, B.n, A.dp, B.dp);
}

export function rebaseTimes(thing, base) {
  thing.base = base;
  if (!checkSum(thing.multiplicand, thing.multiplier, base, thing.dpA || 0, thing.dpB || 0).ok) {
    const fresh = defaultSum(base);
    thing.multiplicand = fresh.multiplicand;
    thing.multiplier = fresh.multiplier;
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

const ORD = ["", "second", "third", "fourth", "fifth", "sixth", "seventh"];

function columnName(p) {
  return p === 0 ? "the ones column" : `the ${ORD[p] || `${p + 1}th`} column from the right`;
}

/** The row being worked, named by the figure it belongs to. */
function rowName(j, plan) {
  const b = plan.base;
  const d = writeNum(plan.B[plan.lb - 1 - j], 0, b);
  return j === 0 ? `the ${d} row` : `the ${d} row, ${j === 1 ? "one place" : `${j} places`} across`;
}

export function ask(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  const b = thing.base;
  if (!e) return { done: true, kind: null, where: "", text: `${said(plan)}.` };

  if (e.kind === "z") {
    return {
      done: false, kind: "z",
      text: `Nothing times ${writeNum(plan.multiplicand, 0, b)} is nothing — what goes in the row?`,
      where: rowName(e.run, plan),
    };
  }
  if (e.kind === "m") {
    if (e.last) {
      return {
        done: false, kind: "m",
        text: `Nothing left to multiply — only the ${writeNum(e.carryIn, 0, b)} carried. What goes down?`,
        where: rowName(e.run, plan),
      };
    }
    const times = `${writeNum(e.d, 0, b)} × ${writeNum(e.a, 0, b)}`;
    return {
      done: false, kind: "m",
      text: e.carryIn
        ? `${times}, and the ${writeNum(e.carryIn, 0, b)} carried — what goes down?`
        : `${times} — what goes down?`,
      where: rowName(e.run, plan),
    };
  }
  if (e.kind === "mc") {
    return {
      done: false, kind: "mc",
      text: `That made ${writeNum(e.total, 0, b)} — the ${writeNum(e.total % b, 0, b)} is down. What carries?`,
      where: "above the next figure",
    };
  }
  if (e.kind === "a") {
    const list = e.col.seen.map((d) => writeNum(d, 0, b));
    const said2 = list.length > 1
      ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`
      : (list[0] || "");
    return {
      done: false, kind: "a",
      text: !said2
        ? `Nothing left to add — only the ${writeNum(e.col.carryIn, 0, b)} carried. What goes under the line?`
        : e.col.carryIn
          ? `Add the rows: ${said2}, and the ${writeNum(e.col.carryIn, 0, b)} carried — what goes under the line?`
          : `Add the rows: ${said2} — what goes under the line?`,
      where: `in ${columnName(e.place)}`,
    };
  }
  if (e.kind === "ac") {
    return {
      done: false, kind: "ac",
      text: `That made ${writeNum(e.col.total, 0, b)} — the ${writeNum(e.col.stay, 0, b)} is down. What carries?`,
      where: `above ${columnName(e.place)}`,
    };
  }
  return {
    done: false, kind: "pt",
    text: `${writeNum(plan.multiplicand, plan.dpA, b)} has ${plan.dpA} `
      + `${plan.dpA === 1 ? "figure" : "figures"} after the point and `
      + `${writeNum(plan.multiplier, plan.dpB, b)} has ${plan.dpB} — `
      + "so how many go after the point in the answer?",
    where: "in the answer",
  };
}

/* Why a wrong answer is wrong. */
function nudge(e, plan, given) {
  const b = plan.base;
  if (e.kind === "mc") {
    if (given === e.total % b) return `That is the figure that stays. What carries is the rest of ${writeNum(e.total, 0, b)}.`;
    return `Not quite — ${writeNum(e.total, 0, b)} is ${writeNum(Math.floor(e.total / b), 0, b)} `
      + `${baseWord(b)}${Math.floor(e.total / b) === 1 ? "" : "s"} and ${writeNum(e.total % b, 0, b)} over.`;
  }
  if (e.kind === "m") {
    const up = Math.floor(e.total / b);
    if (up && given === up) {
      return `That ${writeNum(up, 0, b)} is the part that CARRIES — it goes above the next figure. `
        + `Under it goes what is left of ${writeNum(e.total, 0, b)}.`;
    }
    if (given === e.total && up) {
      return `${writeNum(e.total, 0, b)} is right, but it will not fit in one column — `
        + `write the ${writeNum(e.total % b, 0, b)} and the ${writeNum(up, 0, b)} carries.`;
    }
    if (e.carryIn && given === (e.d * e.a) % b) {
      return `You have left out the ${writeNum(e.carryIn, 0, b)} carried from the figure before.`;
    }
    return `Not that — count ${writeNum(e.d, 0, b)} lots of ${writeNum(e.a, 0, b)}`
      + `${e.carryIn ? `, and add the ${writeNum(e.carryIn, 0, b)} carried` : ""}.`;
  }
  if (e.kind === "ac") {
    if (given === e.col.stay) return `That is the figure that stays under the line. What carries is the rest of ${writeNum(e.col.total, 0, b)}.`;
    return `Not quite — ${writeNum(e.col.total, 0, b)} is ${writeNum(e.col.carry, 0, b)} `
      + `${baseWord(b)}${e.col.carry === 1 ? "" : "s"} and ${writeNum(e.col.stay, 0, b)} over.`;
  }
  if (e.kind === "a") {
    if (e.col.carry && given === e.col.carry) {
      return `That ${writeNum(e.col.carry, 0, b)} carries into the next column. Under the line goes what is left of ${writeNum(e.col.total, 0, b)}.`;
    }
    return `Not that — add that column of the rows again${e.col.carryIn ? `, and the ${writeNum(e.col.carryIn, 0, b)} carried` : ""}.`;
  }
  if (e.kind === "pt") {
    return `Not quite — count them: ${plan.dpA} in the first number and ${plan.dpB} in the second.`;
  }
  return "Not that one.";
}

function told(e, plan) {
  const b = plan.base;
  if (e.kind === "z") return "A row of nothing — nothing is what it comes to.";
  if (e.kind === "m") {
    if (e.last) return `The ${writeNum(e.carryIn, 0, b)} carried comes down in front.`;
    return e.carryIn
      ? `${writeNum(e.d, 0, b)} × ${writeNum(e.a, 0, b)} is ${writeNum(e.d * e.a, 0, b)}, and ${writeNum(e.carryIn, 0, b)} makes ${writeNum(e.total, 0, b)}.`
      : `${writeNum(e.d, 0, b)} × ${writeNum(e.a, 0, b)} = ${writeNum(e.total, 0, b)}.`;
  }
  if (e.kind === "mc") return `The ${writeNum(Math.floor(e.total / b), 0, b)} goes above the next figure.`;
  if (e.kind === "ac") return `The ${writeNum(e.col.carry, 0, b)} carries into ${columnName(e.place)}.`;
  if (e.kind === "a") return `That column comes to ${writeNum(e.col.total, 0, b)}.`;
  const room = plan.dp - (digitsOf(plan.product, plan.base).length - 1);
  return `${plan.dp} ${plan.dp === 1 ? "figure" : "figures"} after the point — count them off from the right.`
    + (room > 0 ? ` There are not enough figures, so ${room === 1 ? "a nought goes" : `${room} noughts go`} in front to make room.` : "");
}

/** The whole sum said in one line. */
function said(plan) {
  const b = plan.base;
  return `${writeNum(plan.multiplicand, plan.dpA, b)} × ${writeNum(plan.multiplier, plan.dpB, b)} `
    + `= ${writeNum(plan.product, plan.dp, b)}`;
}

function finish(plan) {
  return `Done — ${said(plan)}.`;
}

/* ── writing a figure on the page ─────────────────────────────────────────── */

export function answer(thing, text) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return { ok: false, changed: false, message: finish(plan) };

  /* The count of places is a plain count and not a figure in the base — there
     are bases with no figure for it. */
  const given = e.kind === "pt"
    ? (/^\d+$/.test(String(text ?? "").trim()) ? Number(String(text).trim()) : null)
    : (() => { const r = readNum(text, thing.base); return r && r.dp === 0 ? r.n : null; })();
  if (given === null) {
    return {
      ok: false, changed: false,
      message: e.kind === "pt"
        ? "Write how many figures go after the point."
        : `Write it in base ${baseWord(thing.base)} — digits 0 to ${DIGITS[thing.base - 1]}.`,
    };
  }
  if (given !== e.value) {
    thing.slips += 1;
    return { ok: false, changed: false, message: nudge(e, plan, given) };
  }
  thing.done += 1;
  const finished = thing.done >= plan.entries.length;
  return {
    ok: true, changed: true, finished, kind: e.kind,
    message: finished ? finish(plan) : told(e, plan),
  };
}

export function showNext(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return { changed: false, message: finish(plan) };
  thing.done += 1;
  const finished = thing.done >= plan.entries.length;
  const shown = e.kind === "pt" ? String(e.value) : writeNum(e.value, 0, thing.base);
  return {
    changed: true, finished, kind: e.kind,
    message: finished ? finish(plan) : `${shown} — ${told(e, plan)}`,
  };
}

/** Show `n` on this board — the number being multiplied. */
export function setProduct(thing, n) {
  const want = Math.max(1, Math.round(n));
  if (want === thing.multiplicand && !(thing.dpA || 0)) return true;
  return setSum(thing, want, thing.multiplier, 0, thing.dpB || 0).ok === true;
}

/** What this board is working ON — the number being multiplied. */
export function multiplicandOf(thing) {
  return thing.multiplicand;
}

/** The cell the learner writes in NOW, or null when what is asked for is not
    a figure on the page (the count of places at the end). */
export function cellsOf(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return null;
  const grid = { cols: plan.cols, rows: plan.rows, gutter: GUTTER };
  /* The count of places goes in the air to the right of the answer, where a
     note about the answer belongs. */
  if (e.place === null) return { mode: "type", grid, count: true, cells: [{ row: e.row, col: plan.width }] };
  return { mode: "type", grid, cells: [{ row: e.row, col: plan.width - 1 - e.place }] };
}

/* ── the page, as marks ───────────────────────────────────────────────────── */

export function sheetOf(thing) {
  const plan = planOf(thing);
  const b = thing.base;
  const marks = [];
  const points = [];
  const colOf = (p) => plan.width - 1 - p;

  const putRow = (row, chars, tone = "ink") => {
    [...chars].forEach((ch, k) => {
      marks.push({ row, col: colOf(chars.length - 1 - k), ch, tone });
    });
  };

  /* the two numbers, each with its own point where it stands */
  const aChars = writeNum(plan.multiplicand, plan.dpA, b).replace(".", "");
  const bChars = writeNum(plan.multiplier, plan.dpB, b).replace(".", "");
  putRow(1, aChars);
  putRow(2, bChars);
  if (plan.dpA) points.push({ row: 1, col: colOf(plan.dpA) });
  if (plan.dpB) points.push({ row: 2, col: colOf(plan.dpB) });

  const e = plan.entries[thing.done] || null;
  const run = e ? e.run : plan.entries[plan.entries.length - 1].run;

  /* Every figure that has actually been written. The carries are the exception:
     they belong to the row being worked and are rubbed out with it. */
  const started = new Set();
  let pointDone = false;
  for (let n = 0; n < thing.done; n++) {
    const d = plan.entries[n];
    if (d.kind === "pt") { pointDone = true; continue; }
    if (d.kind === "mc" || d.kind === "ac") {
      if (d.run !== run) continue;                 // a carry from a finished row
      marks.push({ row: 0, col: colOf(d.place), ch: writeNum(d.value, 0, b), tone: "carry" });
      continue;
    }
    marks.push({ row: d.row, col: colOf(d.place), ch: writeNum(d.value, 0, b), tone: "ink" });
    started.add(d.run);
  }

  /* the place-holding noughts, once their row has been started */
  plan.parts.forEach((pt) => {
    if (!started.has(pt.j)) return;
    for (let k = 0; k < pt.j; k++) {
      marks.push({ row: pt.row, col: colOf(k), ch: "0", tone: "soft" });
    }
  });

  /* The point, put in by counting — and with it whatever noughts have to go in
     front to make room for it. 0.1 × 0.1 works out to a single 1, and the two
     noughts that turn it into 0.01 are not a calculation: they are what
     "two figures after the point" means when there is only one figure. */
  if (plan.dp && pointDone) {
    const onRow = marks.filter((m) => m.row === plan.answerRow);
    const highest = onRow.length ? Math.max(...onRow.map((m) => plan.width - 1 - m.col)) : -1;
    for (let p = highest + 1; p <= plan.dp; p++) {
      marks.push({ row: plan.answerRow, col: colOf(p), ch: "0", tone: "ink" });
    }
    points.push({ row: plan.answerRow, col: colOf(plan.dp) });
  }

  /* The line under the two numbers is there from the start; the line under the
     rows of multiplying is ruled when the last of them is begun, because until
     then there is nothing for it to be under. */
  const rules = [{ row: 2, from: -GUTTER, to: plan.width - 1 }];
  if (plan.lb > 1 && started.has(plan.lb - 1)) {
    rules.push({ row: plan.lastPartRow, from: -GUTTER, to: plan.width - 1 });
  }

  const finished = thing.done >= plan.entries.length;
  return {
    plan, cols: plan.cols, rows: plan.rows, width: plan.width, gutter: GUTTER,
    marks, points, rules, minus: [], bracket: null,
    signs: [{ row: 2, col: -GUTTER, ch: "×" }],
    underline: finished ? { row: plan.answerRow, from: 0, to: plan.width - 1 } : null,
    ask: e ? { row: e.row, cols: [e.place === null ? plan.width : colOf(e.place)] } : null,
    counting: !!(e && e.kind === "pt"),
    finished,
    product: plan.product,
    sum: said(plan),
  };
}
