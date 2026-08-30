/* ============================================================================
   Manipulatives — long division, worked the way it is written
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

   So the difference at the end of a step is written under the digit it came
   from, and the next digit is BROUGHT DOWN into the cell beside it, on the same
   row — which is exactly what the number you divide into next is. There is no
   re-writing and no re-aligning anywhere.

   ── it follows the working base like everything else here ─────────────────
   None of this is about ten. In base five, 303₅ ÷ 2₅ is worked with the same
   four questions and the same layout, and the board asks them in base five. The
   plan is computed in plain counting numbers and only ever WRITTEN in the base,
   so there is one algorithm and not one per base.
   ========================================================================== */

import { DIGITS, toBase, fromBase, baseWord, cssVar, rgba } from "./config.js";

/* One digit of working is a two-cell square of the canvas's paper — the same
   size a table's cell is, so a division board and a times table standing side
   by side are written in the same hand. */
const DIG = 2;
const SLAB = 0.22;

/* Room to the right of the bar for the "r 4" that is written once the sum is
   finished. It is margin the rest of the time, which the page needs anyway. */
const RIGHT = 2;

/* As long a sum as the board will take. Past six digits the working is taller
   than the canvas and the point has long been made. */
export const MAX_DIGITS = 6;
export const MAX_DIVISOR = 999;

/* ── reading and writing numbers in the working base ──────────────────────── */

/** The digits of `n` in `base`, biggest place first, as counting numbers. */
function digitsOf(n, base) {
  return [...toBase(n, base)].map((d) => DIGITS.indexOf(d));
}

/** How a number is written on this board. */
const write = (n, base) => toBase(n, base);

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
  return { dividend: head * base * base + tail, divisor };
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
 * be — 3010 ÷ 3 is 1003, and the two noughts in the middle are the answer.
 */
export function workOut(dividend, divisor, base) {
  const digits = digitsOf(dividend, base);
  const steps = [];
  let rem = 0;
  let started = false;

  digits.forEach((d, i) => {
    const cur = rem * base + d;
    const q = Math.floor(cur / divisor);
    const product = q * divisor;
    const left = cur - product;
    steps.push({ i, cur, q, product, rem: left, write: started || q > 0 });
    if (q > 0) started = true;
    rem = left;
  });
  /* A dividend smaller than the divisor still has an answer, and it is nought.
     Written above the last digit, where the answer to any division is. */
  if (!steps.some((s) => s.write)) steps[steps.length - 1].write = true;

  /* Nobody writes 043, so the leading steps where the divisor does not go are
     never written — but they were still TAKEN, and skipping them silently is
     what makes this method look like sleight of hand. So the first step that IS
     written remembers what was passed over, and says so when it asks. */
  const opener = steps.find((s) => s.write);
  if (opener && opener.i > 0) {
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
      entries.push({ kind: "b", step: s, value: digits[s.i], row: bringRow(s.i), endCol: s.i });
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
      kind: "r", step: steps[steps.length - 1], value: dividend,
      row: remRow, endCol: digits.length - 1,
    });
  }

  const dv = digitsOf(divisor, base).length;
  const gutter = dv + 1;   // the divisor, and a column of air before the bar

  return {
    dividend, divisor, base, digits, steps, live, entries,
    gutter, rows: remRow + 1, cols: gutter + digits.length + RIGHT,
    quotient: Math.floor(dividend / divisor),
    remainder: dividend % divisor,
  };
}

/* Plans are pure and small, and the drawing asks for one on every repaint —
   so they are kept. Keyed by the sum itself, which is all a plan depends on. */
const PLANS = new Map();

export function planOf(thing) {
  const key = `${thing.dividend}/${thing.divisor}/${thing.base}`;
  let plan = PLANS.get(key);
  if (!plan) {
    plan = workOut(thing.dividend, thing.divisor, thing.base);
    if (PLANS.size > 40) PLANS.clear();
    PLANS.set(key, plan);
  }
  return plan;
}

/* ── the thing on the canvas ──────────────────────────────────────────────── */

export function makeLongDiv(base) {
  const { dividend, divisor } = defaultSum(base);
  const thing = {
    kind: "board", variant: "longdiv", tag: null, x: 0, z: 0, angle: 0,
    base, dividend, divisor,
    done: 0,      // how many of the plan's entries have been written
    slips: 0,     // wrong answers so far, so the board can offer to show one
    h: SLAB, l: 0, w: 0,
  };
  resize(thing);
  return thing;
}

/** The board is as big as the working it has to hold. */
export function resize(thing) {
  const plan = planOf(thing);
  thing.l = plan.cols * DIG;
  thing.w = plan.rows * DIG;
  return thing;
}

/**
 * Whether a sum can be set on the board, and why not if it cannot.
 * Checked here rather than in the panel so the rule has one home.
 */
export function checkSum(dividend, divisor, base) {
  if (dividend === null || divisor === null) {
    return { ok: false, message: `Write both numbers in base ${baseWord(base)} — digits 0 to ${DIGITS[base - 1]}.` };
  }
  if (divisor < 2) return { ok: false, message: "Divide by two or more — dividing by one gives you back what you started with, and by nought nothing at all." };
  if (divisor > MAX_DIVISOR) return { ok: false, message: `Keep the divisor under ${MAX_DIVISOR}.` };
  if (dividend < 1) return { ok: false, message: "There has to be something to share out." };
  if (digitsOf(dividend, base).length > MAX_DIGITS) {
    return { ok: false, message: `That is more than ${MAX_DIGITS} digits in base ${baseWord(base)} — the working would be taller than the paper.` };
  }
  return { ok: true };
}

/** Put a new sum on the board and rub out whatever was worked on the old one. */
export function setSum(thing, dividend, divisor) {
  const check = checkSum(dividend, divisor, thing.base);
  if (!check.ok) return check;
  if (dividend === thing.dividend && divisor === thing.divisor) {
    return { ok: false, message: "That is the sum it is already showing." };
  }
  thing.dividend = dividend;
  thing.divisor = divisor;
  thing.done = 0;
  thing.slips = 0;
  resize(thing);
  const b = thing.base;
  return { ok: true, changed: true, message: `${write(dividend, b)} ÷ ${write(divisor, b)} — ${ask(thing).text}` };
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
  if (!checkSum(thing.dividend, thing.divisor, base).ok) {
    const fresh = defaultSum(base);
    thing.dividend = fresh.dividend;
    thing.divisor = fresh.divisor;
  }
  thing.done = 0;
  thing.slips = 0;
  resize(thing);
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
      text: plan.remainder
        ? `${write(plan.dividend, b)} ÷ ${write(plan.divisor, b)} = ${write(plan.quotient, b)} remainder ${write(plan.remainder, b)}.`
        : `${write(plan.dividend, b)} ÷ ${write(plan.divisor, b)} = ${write(plan.quotient, b)} exactly.`,
      where: "",
    };
  }
  const s = e.step;
  if (e.kind === "q") {
    /* The one place a step deserves a sentence of its own: the divisor does not
       go into what is there, so the answer is nought and the next digit joins
       it. Said plainly, because "why is there a nought there" is the question
       every learner asks of this method. */
    const lead = s.q === 0 && s.cur < plan.divisor
      ? `${write(plan.divisor, b)} will not go into ${write(s.cur, b)} — so how many times?`
      : s.lead !== undefined
        ? `${write(plan.divisor, b)} will not go into ${write(s.lead, b)} — so how many `
          + `times does it go into ${write(s.cur, b)}?`
        : `How many times does ${write(plan.divisor, b)} go into ${write(s.cur, b)}?`;
    return { done: false, kind: "q", text: lead, where: `above the ${nth[s.i + 1] || "next"} digit` };
  }
  if (e.kind === "p") {
    return {
      done: false, kind: "p",
      text: `${write(s.q, b)} × ${write(plan.divisor, b)} — what do you take away?`,
      where: "under what you are dividing into",
    };
  }
  if (e.kind === "r") {
    return { done: false, kind: "r", text: `Nothing went in — what is left over?`, where: "at the foot of the working" };
  }
  if (e.kind === "b") {
    return {
      done: false, kind: "b",
      text: `Bring the ${write(e.value, b)} down.`,
      where: "beside what is left over",
    };
  }
  return {
    done: false, kind: "d",
    text: `${write(s.cur, b)} − ${write(s.product, b)} — what is left?`,
    where: "under the line",
  };
}

/* Why a wrong answer is wrong. The two ways of missing a quotient digit are the
   whole of the method's difficulty, and each has its own sentence. */
function nudge(e, plan, given) {
  const b = plan.base;
  const s = e.step;
  if (e.kind === "q") {
    const took = given * plan.divisor;
    if (took > s.cur) {
      return `Too many — ${write(given, b)} × ${write(plan.divisor, b)} is ${write(took, b)}, and that is more than ${write(s.cur, b)}.`;
    }
    if (s.cur - took >= plan.divisor) {
      return `Not enough — take ${write(took, b)} from ${write(s.cur, b)} and there is still another ${write(plan.divisor, b)} sitting in it.`;
    }
    return `Not that one. How many whole ${write(plan.divisor, b)}s are there in ${write(s.cur, b)}?`;
  }
  if (e.kind === "p") {
    return `Not quite — count ${write(s.q, b)} lots of ${write(plan.divisor, b)}.`;
  }
  if (e.kind === "d") {
    return `Not quite — take ${write(s.product, b)} away from ${write(s.cur, b)}.`;
  }
  return `Not quite — nothing was taken away, so all of ${write(plan.dividend, b)} is still there.`;
}

/* What is said once a number goes down, which is not the same as the question:
   it names what has just been proved rather than what to do next. */
function told(e, plan) {
  const b = plan.base;
  const s = e.step;
  if (e.kind === "q") {
    return s.q === 0
      ? `Nought — ${write(plan.divisor, b)} does not go into ${write(s.cur, b)}.`
      : `${write(plan.divisor, b)} goes into ${write(s.cur, b)} ${write(s.q, b)} times.`;
  }
  if (e.kind === "p") return `${write(s.q, b)} × ${write(plan.divisor, b)} = ${write(s.product, b)}.`;
  if (e.kind === "r") return `${write(plan.dividend, b)} is left over.`;
  if (e.kind === "b") return `${write(e.value, b)} comes down — that makes ${write(s.cur, b)}.`;
  return `${write(s.cur, b)} − ${write(s.product, b)} = ${write(s.rem, b)}.`;
}

/** The sentence for a finished sum, said once the last number is written. */
function finish(plan) {
  const b = plan.base;
  return plan.remainder
    ? `Done — ${write(plan.dividend, b)} ÷ ${write(plan.divisor, b)} = ${write(plan.quotient, b)} remainder ${write(plan.remainder, b)}.`
    : `Done — ${write(plan.dividend, b)} ÷ ${write(plan.divisor, b)} = ${write(plan.quotient, b)}, and nothing left over.`;
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

  const given = fromBase(text, thing.base);
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
  return {
    ok: true, changed: true, finished,
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
    changed: true, finished,
    message: finished ? finish(plan) : `${write(e.value, thing.base)} — ${told(e, plan)}`,
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
  if (want === thing.dividend) return true;
  return setSum(thing, want, thing.divisor).ok === true;
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
      mode: "bring", grid, ch: write(e.value, thing.base),
      from: { row: 1, col: e.endCol },     // where it stands in the dividend
      to: { row: e.row, col: e.endCol },   // and where it is going
    };
  }
  const figures = write(e.value, thing.base);
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

  const put = (row, endCol, value, tone) => {
    const chars = write(value, b);
    [...chars].forEach((ch, k) => {
      marks.push({ row, col: endCol - (chars.length - 1 - k), ch, tone });
    });
    return { from: endCol - chars.length + 1, to: endCol };
  };

  /* The divisor outside the bar, pushed to the left edge so the column next to
     the bar stays empty — that column is where the minus signs go, and a
     divisor sitting in it would be read as part of the working. */
  const dvs = write(plan.divisor, b);
  [...dvs].forEach((ch, k) => {
    marks.push({ row: 1, col: -plan.gutter + k, ch, tone: "ink" });
  });
  plan.digits.forEach((d, i) => marks.push({ row: 1, col: i, ch: DIGITS[d], tone: "ink" }));

  const e = plan.entries[thing.done] || null;

  /* Nothing is on this page that was not put there. A digit brought down is a
     step of the working like any other, so it appears when it is brought and
     not a moment before. */
  // everything that has actually been written
  for (let n = 0; n < thing.done; n++) {
    const done = plan.entries[n];
    if (done.kind === "q") {
      marks.push({ row: 0, col: done.endCol, ch: write(done.value, b), tone: "ink" });
    } else if (done.kind === "p") {
      const span = put(done.row, done.endCol, done.value, "ink");
      rules.push({ row: done.row, from: span.from, to: span.to });
      minus.push({ row: done.row, col: span.from });
    } else {
      put(done.row, done.endCol, done.value, "ink");
    }
  }

  const finished = thing.done >= plan.entries.length;
  return {
    plan, cols: plan.cols, rows: plan.rows, gutter: plan.gutter,
    marks, rules, minus,
    /* Every cell the next number goes in, not just its last: a two-figure
       answer is outlined as two cells, which is how many boxes there are. */
    ask: e ? { row: e.row, cols: askCols(thing) } : null,
    finished,
    remainder: plan.remainder,
    tail: finished && plan.remainder ? `r ${write(plan.remainder, b)}` : "",
  };
}

/* ── drawing ──────────────────────────────────────────────────────────────── */

export function drawLongDiv(g, W, H, thing, c) {
  const sheet = sheetOf(thing);
  const cw = W / sheet.cols;
  const rh = H / sheet.rows;
  const x0 = sheet.gutter * cw;                 // the bar, and column 0 after it
  const colX = (col) => x0 + col * cw;
  const rowY = (row) => row * rh;
  const size = Math.round(Math.min(cw, rh) * 0.56);

  /* The bus stop: a line over what is being divided and a line down the side of
     it. The vertical runs the whole way down, because everything under it is
     still part of the same division. */
  g.strokeStyle = c.ink;
  g.lineWidth = Math.max(2, rh * 0.06);
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x0, H - rh * 0.15);
  g.lineTo(x0, rowY(1));
  g.lineTo(W - RIGHT * cw, rowY(1));
  g.stroke();

  // the lines under each thing that is taken away
  g.lineWidth = Math.max(1.5, rh * 0.045);
  g.beginPath();
  for (const r of sheet.rules) {
    const y = rowY(r.row + 1) - rh * 0.12;
    g.moveTo(colX(r.from) + cw * 0.08, y);
    g.lineTo(colX(r.to) + cw * 0.92, y);
  }
  g.stroke();

  /* Where the next number goes, so the question in the panel and the place on
     the page are the same thing seen twice. */
  if (sheet.ask) {
    const y = rowY(sheet.ask.row);
    for (const col of sheet.ask.cols) {
      const x = colX(col);
      g.fillStyle = rgba(cssVar("--accent-secondary", "#6fb7e8"), 0.16);
      g.fillRect(x + cw * 0.1, y + rh * 0.12, cw * 0.8, rh * 0.76);
      g.save();
      g.strokeStyle = rgba(cssVar("--accent-secondary", "#6fb7e8"), 0.9);
      g.lineWidth = Math.max(2, rh * 0.05);
      g.setLineDash([rh * 0.12, rh * 0.1]);
      g.strokeRect(x + cw * 0.1, y + rh * 0.12, cw * 0.8, rh * 0.76);
      g.restore();
    }
  }

  /* The whole working is written in one monospaced hand, so a column of digits
     is a column and not a drift. */
  g.font = `600 ${size}px "JetBrains Mono", monospace`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const m of sheet.marks) {
    g.fillStyle = m.tone === "soft" ? c.soft : c.ink;
    g.fillText(m.ch, colX(m.col) + cw / 2, rowY(m.row) + rh / 2 + 1);
  }

  // the minus in front of what is being taken away
  g.fillStyle = rgba(c.ink, 0.75);
  for (const m of sheet.minus) {
    g.fillText("−", colX(m.col) - cw * 0.42, rowY(m.row) + rh / 2 + 1);
  }

  /* The remainder, said on the answer line, once there is an answer to say it
     on. Lighter than the answer itself: it is a note about the answer and not a
     third digit of it. */
  if (sheet.tail) {
    g.fillStyle = c.soft;
    g.font = `600 ${Math.round(size * 0.72)}px "JetBrains Mono", monospace`;
    g.textAlign = "left";
    g.fillText(sheet.tail, colX(sheet.plan.digits.length) + cw * 0.2, rowY(0) + rh / 2 + 1);
    g.textAlign = "center";
  }

  /* One line under the thing left over, the way an answer is underlined — drawn
     only when the sum is finished, so it reads as "this is the end of it"
     rather than as one more rule in the middle of the working. */
  if (sheet.finished) {
    const last = sheet.marks.filter((m) => m.row === sheet.rows - 1);
    if (last.length) {
      const from = Math.min(...last.map((m) => m.col));
      const to = Math.max(...last.map((m) => m.col));
      g.strokeStyle = rgba(cssVar("--accent-success", "#7cc47c"), 0.95);
      g.lineWidth = Math.max(2, rh * 0.06);
      g.beginPath();
      g.moveTo(colX(from) + cw * 0.08, rowY(sheet.rows) - rh * 0.14);
      g.lineTo(colX(to) + cw * 0.92, rowY(sheet.rows) - rh * 0.14);
      g.stroke();
    }
  }
}
