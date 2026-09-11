/* ============================================================================
   THE WRITTEN BOARDS — fractions, worked down the page
   ----------------------------------------------------------------------------
   The fourth written method, and the one that is least about place value and
   most about EQUIVALENCE. So it is not set out in columns: it is set out in
   LINES, each one the same amount written a different way, with an equals sign
   down the left saying so.

       3   5
       ─ + ─
       4   6

         9    10
       = ── + ──
         12   12

         19
       = ──
         12

            7
       = 1 ──
           12

   Every line is a stage, and every stage is a question the learner is asked:
   what will both bottoms go into, what does each top become, what do the tops
   come to, what goes into both of them, how many whole ones are there. Nothing
   is written until it is earned, and nothing is ever rubbed out and rewritten —
   a line stands once it is finished, which is what makes the page readable
   afterwards.

   ── the refusals are the lesson ───────────────────────────────────────────
   Two mistakes account for most wrong answers to a fraction sum, and each has
   its own sentence. Adding the bottoms ("3/4 + 5/6 = 8/10") is answered by
   saying what the bottom IS: the size of the pieces, which does not change
   because you counted more of them. Forgetting to change the top when you
   change the bottom is answered by asking how many twelfths one quarter is.

   ── it follows the working base like everything else here ─────────────────
   A fraction is a pair of counting numbers and none of this is about ten. In
   base five, 3/4 + 1/2 is worked with the same stages and written in base five.
   ========================================================================== */

import { baseWord, digitsOf, fromBase, writeNum } from "./num.js";

/* A column of air on the left for the equals signs, and three on the right for
   the one number that is worked out beside the page rather than on it — what
   goes into both the top and the bottom. */
export const GUTTER = 1;
export const RIGHT = 3;

export const MAX_NUM = 999;      // as big as a top or a bottom may be
export const MAX_LINES = 8;      // as far down the page as the working may go

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

/* what each operation is called, and how it is written */
export const OPS = [
  ["+", "add"],
  ["-", "take away"],
  ["*", "multiply by"],
  ["/", "divide by"],
];
const SIGN = { "+": "+", "-": "−", "*": "×", "/": "÷" };

/* ── reading and writing a fraction ───────────────────────────────────────── */

/**
 * A fraction as it is typed: "3/4", "2 3/4", "5", "7/2".
 * → { w, n, d }, the whole ones and the part, or null if it is not one.
 */
export function readFraction(text, base) {
  const s = String(text ?? "").trim().replace(/\s+/g, " ");
  if (!s) return null;
  const bits = s.split(" ");
  if (bits.length > 2) return null;
  const frac = bits[bits.length - 1];
  const parts = frac.split("/");
  if (parts.length > 2) return null;
  let w = 0;
  if (bits.length === 2) {
    w = fromBase(bits[0], base);
    if (w === null || parts.length !== 2) return null;   // "2 3" is not a number
  }
  const n = fromBase(parts[0], base);
  if (n === null) return null;
  if (parts.length === 1) return { w: w + n, n: 0, d: 1 };
  const d = fromBase(parts[1], base);
  if (d === null) return null;
  return { w, n, d };
}

/** How a fraction is written on this board. */
export function writeFraction(t, base) {
  const w = writeNum(t.w, 0, base);
  if (!t.n) return w;
  const f = `${writeNum(t.n, 0, base)}/${writeNum(t.d, 0, base)}`;
  return t.w ? `${w} ${f}` : f;
}

/** The same fraction with the whole ones folded into the top. */
const improper = (t) => ({ w: 0, n: t.w * t.d + t.n, d: t.d });

/* ── the sum the board opens on ───────────────────────────────────────────── */

/**
 * Three quarters and five sixths: the bottoms are different and neither goes
 * into the other, the answer is top-heavy, and it will not simplify. So the
 * opening board shows the whole method — a common bottom, an adding of tops,
 * and a change back into whole ones and a part.
 */
export function defaultSum() {
  return { a: { w: 0, n: 3, d: 4 }, b: { w: 0, n: 5, d: 6 }, op: "+" };
}

/* ── the stages ───────────────────────────────────────────────────────────── */

/**
 * One line per stage, in the order a hand would write them. Each line is the
 * same amount as the line above it, written differently — which is the whole
 * argument the page is making.
 */
function stagesOf(A, B, op) {
  const lines = [{ kind: "given", terms: [A, B], op }];
  const ia = improper(A);
  const ib = improper(B);
  if (A.w || B.w) lines.push({ kind: "improper", terms: [ia, ib], op });

  let a = ia;
  let b = ib;
  let o = op;
  if (op === "/") {
    b = { w: 0, n: ib.d, d: ib.n };
    o = "*";
    lines.push({ kind: "flip", terms: [a, b], op: o, was: ib });
  }

  if (o === "+" || o === "-") {
    const L = lcm(a.d, b.d);
    if (a.d !== L || b.d !== L) {
      const was = [a, b];
      a = { w: 0, n: a.n * (L / a.d), d: L };
      b = { w: 0, n: b.n * (L / b.d), d: L };
      lines.push({ kind: "common", terms: [a, b], op: o, L, was });
    }
  }

  const raw = o === "+" ? { w: 0, n: a.n + b.n, d: a.d }
    : o === "-" ? { w: 0, n: a.n - b.n, d: a.d }
      : { w: 0, n: a.n * b.n, d: a.d * b.d };
  lines.push({ kind: "combine", terms: [raw], op: o, from: [a, b] });

  let ans = raw;
  const g = gcd(raw.n, raw.d) || 1;
  if (g > 1) {
    ans = { w: 0, n: raw.n / g, d: raw.d / g };
    lines.push({ kind: "simplify", terms: [ans], g, from: raw });
  }
  if (ans.d === 1) {
    lines.push({ kind: "whole", terms: [{ w: ans.n, n: 0, d: 1, asWhole: true }], from: ans });
  } else if (ans.n > ans.d) {
    lines.push({
      kind: "mixed", from: ans,
      terms: [{ w: Math.floor(ans.n / ans.d), n: ans.n % ans.d, d: ans.d }],
    });
  }
  return lines;
}

/* ── laying the stages out ────────────────────────────────────────────────── */

/* How a term is written: a whole number, a fraction, or one of each.
   Nought is the awkward one. A 0 that is the ANSWER is written as a whole
   number, and a 0 that turned up in the middle of the working — 3/4 − 3/4 comes
   to 0 over 4 before it is tidied — is still a fraction, because that line has
   to line up under the one above it. So the answer line says which it is rather
   than being guessed at. */
function shapeOf(t) {
  if (t.asWhole) return "whole";
  if (t.w > 0 && t.n === 0 && t.d === 1) return "whole";
  return t.w ? "mixed" : "frac";
}

/**
 * The whole sum, worked out and laid out.
 *
 * Line k takes two rows — the tops on row 2k, the bottoms on row 2k+1, and the
 * bar between them. A sign or a whole number stands across both, because it
 * belongs to the fraction beside it and not to either half of it.
 */
export function workOut(A, B, op, base) {
  const lines = stagesOf(A, B, op);
  const len = (n) => digitsOf(n, base).length;

  let width = 0;
  lines.forEach((line, k) => {
    const top = 2 * k;
    let col = 0;
    line.at = { top, bottom: top + 1, eq: k ? { row: top, col: -GUTTER } : null };
    line.signs = [];
    line.boxes = line.terms.map((t, i) => {
      if (i) { line.signs.push({ row: top, col, ch: SIGN[line.op] }); col += 1; }
      const shape = shapeOf(t);
      const box = { shape };
      if (shape !== "frac") {
        box.whole = { row: top, from: col, len: len(t.w) };
        col += len(t.w);
      }
      if (shape !== "whole") {
        const nl = len(t.n);
        const dl = len(t.d);
        const slot = Math.max(nl, dl);
        box.num = { row: top, from: col + Math.floor((slot - nl) / 2), len: nl };
        box.den = { row: top + 1, from: col + Math.floor((slot - dl) / 2), len: dl };
        box.bar = { row: top, from: col, to: col + slot - 1 };
        col += slot;
      }
      return box;
    });
    line.width = col;
    width = Math.max(width, col);
  });
  /* ── what is asked for, and what is simply copied down ─────────────────── */

  /* Room on the right for the one number that is worked out beside the page.
     In a small base it is a long number, so the margin is measured, not fixed. */
  const hcfLine = lines.find((l) => l.kind === "simplify");
  const right = Math.max(RIGHT, hcfLine ? len(hcfLine.g) + 1 : 0);

  const entries = [];
  const auto = [];                                  // { row, from, value, tone, at, span }
  const bars = [];                                  // { row, from, to, at }

  /* A number written across a run of columns, biggest place first. `from` and
     `len` are COLUMNS — what an entry carries about the fractions it came from
     is `src`, and never `from`, or the working would be written in the wrong
     place and nothing would say why. */
  const spread = (spot, value, extra = {}) => ({ row: spot.row, from: spot.from, len: spot.len, value, ...extra });
  const copy = (spot, value, at, tone = "ink", span = 1) => auto.push({ ...spread(spot, value), at, tone, span });
  const askFor = (line, spot, kind, value, extra = {}) => {
    entries.push({ line, kind, value, row: spot.row, from: spot.from, len: spot.len, ...extra });
    return entries.length - 1;
  };

  lines.forEach((line, k) => {
    /* Every line appears when the working reaches it; the first one is the
       question and is there from the start. */
    const starts = entries.length;
    line.starts = starts;
    line.boxes.forEach((box) => {
      if (box.bar) bars.push({ row: box.bar.row, from: box.bar.from, to: box.bar.to, at: starts });
    });
    line.signs.forEach((s) => auto.push({ row: s.row, from: s.col, len: 1, ch: s.ch, at: starts, tone: "sign", span: 2 }));
    if (line.at.eq) auto.push({ row: line.at.eq.row, from: line.at.eq.col, len: 1, ch: "=", at: starts, tone: "sign", span: 2 });

    const t = line.terms;
    const box = line.boxes;
    if (line.kind === "given") {
      t.forEach((x, i) => {
        if (box[i].whole) copy(box[i].whole, x.w, 0, "ink", 2);
        if (box[i].num) { copy(box[i].num, x.n, 0); copy(box[i].den, x.d, 0); }
      });
      return;
    }
    if (line.kind === "improper") {
      t.forEach((x, i) => {
        const was = i ? B : A;
        copy(box[i].den, x.d, starts);
        if (was.w) askFor(line, box[i].num, "improper", x.n, { was, i });
        else copy(box[i].num, x.n, starts);
      });
      return;
    }
    if (line.kind === "flip") {
      copy(box[0].num, t[0].n, starts);
      copy(box[0].den, t[0].d, starts);
      askFor(line, box[1].num, "flipTop", t[1].n, { was: line.was });
      askFor(line, box[1].den, "flipBottom", t[1].d, { was: line.was });
      return;
    }
    if (line.kind === "common") {
      const at = askFor(line, box[0].den, "common", line.L, { was: line.was });
      copy(box[1].den, line.L, at + 1);
      t.forEach((x, i) => askFor(line, box[i].num, "change", x.n, { was: line.was[i], L: line.L, i }));
      return;
    }
    if (line.kind === "combine") {
      askFor(line, box[0].num, "top", t[0].n, { src: line.from, op: line.op });
      askFor(line, box[0].den, "bottom", t[0].d, { src: line.from, op: line.op });
      return;
    }
    if (line.kind === "simplify") {
      /* What goes into both, worked out beside the page rather than on it —
         and beside the line it came OFF, which is the one above this one. */
      askFor(line, { row: line.at.top - 2, from: width, len: len(line.g) }, "hcf", line.g, { src: line.from, beside: true });
      askFor(line, box[0].num, "cutTop", t[0].n, { src: line.from, g: line.g });
      askFor(line, box[0].den, "cutBottom", t[0].d, { src: line.from, g: line.g });
      return;
    }
    if (line.kind === "whole") {
      askFor(line, box[0].whole, "wholeOnly", t[0].w, { src: line.from, span: 2 });
      return;
    }
    /* mixed */
    askFor(line, box[0].whole, "wholes", t[0].w, { src: line.from, span: 2 });
    askFor(line, box[0].num, "left", t[0].n, { src: line.from });
    copy(box[0].den, t[0].d, starts);
  });

  return {
    base, op, A, B, lines, entries, auto, bars,
    width, right, cols: GUTTER + width + right, rows: 2 * lines.length,
    answer: lines[lines.length - 1].terms[0],
  };
}

/* Plans are pure and small, and the drawing asks for one on every repaint —
   so they are kept. Keyed by the sum itself, which is all a plan depends on. */
const PLANS = new Map();

export function planOf(thing) {
  const f = (t) => `${t.w}_${t.n}_${t.d}`;
  const key = `${f(thing.a)}${thing.op}${f(thing.b)}/${thing.base}`;
  let plan = PLANS.get(key);
  if (!plan) {
    plan = workOut(thing.a, thing.b, thing.op, thing.base);
    if (PLANS.size > 40) PLANS.clear();
    PLANS.set(key, plan);
  }
  return plan;
}

/* ── the thing being worked on ────────────────────────────────────────────── */

export function makeFraction(base = 10) {
  const { a, b, op } = defaultSum();
  return {
    kind: "board", variant: "fraction", tag: null, x: 0, z: 0, angle: 0,
    base, a, b, op,
    done: 0,
    slips: 0,
  };
}

export function checkSum(a, b, op, base) {
  if (!a || !b) {
    return { ok: false, message: `Write both of them in base ${baseWord(base)} — a fraction like 3/4, or 2 3/4, or a whole number.` };
  }
  for (const t of [a, b]) {
    if (t.d < 1) return { ok: false, message: "A fraction cannot have nought underneath — nothing can be cut into nought pieces." };
    if (t.n >= MAX_NUM || t.d >= MAX_NUM || t.w >= MAX_NUM) {
      return { ok: false, message: `Keep every number under ${MAX_NUM}.` };
    }
    if (t.w === 0 && t.n === 0) return { ok: false, message: "Both of them have to be worth something." };
  }
  const ia = improper(a);
  const ib = improper(b);
  if (op === "/" && ib.n === 0) return { ok: false, message: "Nothing can be divided into nought parts." };
  if (op === "-" && ia.n * ib.d < ib.n * ia.d) {
    return {
      ok: false,
      message: `${writeFraction(b, base)} is bigger than ${writeFraction(a, base)} — `
        + "this board takes the smaller one away from the bigger one.",
    };
  }
  const plan = workOut(a, b, op, base);
  if (plan.lines.length > MAX_LINES) return { ok: false, message: "That one takes more lines than the paper holds." };
  const big = plan.lines.some((l) => l.terms.some((t) => t.n > MAX_NUM || t.d > MAX_NUM));
  if (big) return { ok: false, message: `The working would run past ${MAX_NUM} — try smaller bottoms.` };
  return { ok: true };
}

export function setSum(thing, a, b, op) {
  const check = checkSum(a, b, op, thing.base);
  if (!check.ok) return check;
  thing.a = a;
  thing.b = b;
  thing.op = op;
  thing.done = 0;
  thing.slips = 0;
  const base = thing.base;
  return {
    ok: true, changed: true,
    message: `${writeFraction(a, base)} ${SIGN[op]} ${writeFraction(b, base)} — ${ask(thing).text}`,
  };
}

/** Read a sum written as two fractions and a sign, and set it. */
export function setWritten(thing, aText, op, bText) {
  const a = readFraction(aText, thing.base);
  const b = readFraction(bText, thing.base);
  if (!a || !b || !SIGN[op]) {
    return { ok: false, message: `Write both of them in base ${baseWord(thing.base)} — a fraction like 3/4, or 2 3/4, or a whole number.` };
  }
  return setSum(thing, a, b, op);
}

export function rebaseFraction(thing, base) {
  thing.base = base;
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

/* the words for a bottom: halves, thirds, quarters, fifths … */
const PIECES = [
  "", "whole ones", "halves", "thirds", "quarters", "fifths", "sixths",
  "sevenths", "eighths", "ninths", "tenths", "elevenths", "twelfths",
];
const ONE = [
  "", "whole one", "half", "third", "quarter", "fifth", "sixth",
  "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth",
];
/* The name of a size of piece. With a count it agrees with the count — one
   twelfth, seven twelfths — and without one it is the plural, the way a size
   is talked about ("quarters and sixths are different sizes"). */
const pieces = (d, base, count) => (count === 1
  ? ONE[d] || `${writeNum(d, 0, base)}th`
  : PIECES[d] || `${writeNum(d, 0, base)}ths`);
const wholes = (n) => (n === 1 ? "whole one" : "whole ones");

/** The sum as it is written — "3/4 + 5/6" — for a heading or a folded strip. */
export function writtenSum(thing) {
  return `${writeFraction(thing.a, thing.base)} ${SIGN[thing.op]} ${writeFraction(thing.b, thing.base)}`;
}

function said(plan) {
  const base = plan.base;
  return `${writeFraction(plan.A, base)} ${SIGN[plan.op]} ${writeFraction(plan.B, base)} `
    + `= ${writeFraction(plan.answer, base)}`;
}

export function ask(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  const base = thing.base;
  const N = (n) => writeNum(n, 0, base);
  if (!e) return { done: true, kind: null, where: "", text: `${said(plan)}.` };

  if (e.kind === "improper") {
    return {
      done: false, kind: e.kind,
      text: e.was.d === 1
        ? `${writeFraction(e.was, base)} is a whole number, and a whole number goes over 1. What goes on top?`
        : `${writeFraction(e.was, base)} — ${N(e.was.w)} ${wholes(e.was.w)} is `
          + `${N(e.was.w * e.was.d)} ${pieces(e.was.d, base, e.was.w * e.was.d)}. What goes on top altogether?`,
      where: "on the next line",
    };
  }
  if (e.kind === "flipTop") {
    return {
      done: false, kind: e.kind,
      text: `Dividing by ${writeFraction(e.was, base)} is multiplying by it upside down. What goes on top?`,
      where: "on the next line",
    };
  }
  if (e.kind === "flipBottom") {
    return { done: false, kind: e.kind, text: "And what goes underneath?", where: "on the next line" };
  }
  if (e.kind === "common") {
    return {
      done: false, kind: e.kind,
      text: `${pieces(e.was[0].d, base)} and ${pieces(e.was[1].d, base)} are different sizes, `
        + `so they will not go together yet. What is the smallest number both `
        + `${N(e.was[0].d)} and ${N(e.was[1].d)} go into?`,
      where: "underneath both of them",
    };
  }
  if (e.kind === "change") {
    return {
      done: false, kind: e.kind,
      text: `${writeFraction(e.was, base)} in ${pieces(e.L, base)} — what goes on top?`,
      where: e.i ? "over the second one" : "over the first one",
    };
  }
  if (e.kind === "top") {
    const [x, y] = e.src;
    return {
      done: false, kind: e.kind,
      text: e.op === "*"
        ? `${N(x.n)} × ${N(y.n)} — what goes on top?`
        : `${N(x.n)} ${SIGN[e.op]} ${N(y.n)} — the pieces are all ${pieces(x.d, base)} now. What goes on top?`,
      where: "on the answer line",
    };
  }
  if (e.kind === "bottom") {
    const [x, y] = e.src;
    return {
      done: false, kind: e.kind,
      text: e.op === "*"
        ? `${N(x.d)} × ${N(y.d)} — what goes underneath?`
        : "And what goes underneath?",
      where: "on the answer line",
    };
  }
  if (e.kind === "hcf") {
    return {
      done: false, kind: e.kind,
      text: `${writeFraction(e.src, base)} will go smaller. What is the biggest number `
        + `that goes into both ${N(e.src.n)} and ${N(e.src.d)}?`,
      where: "beside the line",
    };
  }
  if (e.kind === "cutTop") {
    return { done: false, kind: e.kind, text: `${N(e.src.n)} ÷ ${N(e.g)} — what goes on top?`, where: "on the next line" };
  }
  if (e.kind === "cutBottom") {
    return { done: false, kind: e.kind, text: `${N(e.src.d)} ÷ ${N(e.g)} — what goes underneath?`, where: "on the next line" };
  }
  if (e.kind === "wholeOnly") {
    return {
      done: false, kind: e.kind,
      text: `${writeFraction(e.src, base)} is a whole number of ones. How many?`,
      where: "on the last line",
    };
  }
  if (e.kind === "wholes") {
    return {
      done: false, kind: e.kind,
      text: `${writeFraction(e.src, base)} is top-heavy — there is more than one whole one in it. `
        + `How many ${N(e.src.d)}s are there in ${N(e.src.n)}?`,
      where: "on the last line",
    };
  }
  return {
    done: false, kind: "left",
    text: "And what is left over on top?",
    where: "on the last line",
  };
}

/* Why a wrong answer is wrong. The two mistakes that account for most wrong
   fraction sums each have a sentence of their own. */
function nudge(e, plan, given) {
  const base = plan.base;
  const N = (n) => writeNum(n, 0, base);
  if (e.kind === "bottom" && e.op !== "*") {
    const [x, y] = e.src;
    if (given === x.d + y.d) {
      return `The bottoms are not added. ${N(x.d)} means the pieces are ${pieces(x.d, base)} — `
        + "counting more of them does not make the pieces smaller, so it stays "
        + `${N(x.d)}.`;
    }
  }
  if (e.kind === "change") {
    if (given === e.was.n) {
      return `The bottom changed, so the top has to change with it — `
        + `${writeFraction(e.was, base)} is not ${N(e.was.n)} ${pieces(e.L, base, e.was.n)}.`;
    }
    return `Not that — ${N(e.was.d)} goes into ${N(e.L)} ${N(e.L / e.was.d)} times, `
      + `so the top is multiplied by ${N(e.L / e.was.d)} too.`;
  }
  if (e.kind === "common") {
    const [x, y] = e.was;
    if (given % x.d || given % y.d) {
      return `${N(given)} will not do — ${N(given % x.d ? x.d : y.d)} does not go into it.`;
    }
    return `${N(given)} does work, but it is not the smallest one that does. Try again.`;
  }
  if (e.kind === "top" && e.op !== "*") {
    const [x, y] = e.src;
    return `Not that — the pieces are all ${pieces(x.d, base)} now, so it is `
      + `${N(x.n)} ${SIGN[e.op]} ${N(y.n)} of them.`;
  }
  if (e.kind === "improper") {
    return `Not quite — ${N(e.was.w)} ${wholes(e.was.w)} is ${N(e.was.w)} × ${N(e.was.d)} `
      + `= ${N(e.was.w * e.was.d)} ${pieces(e.was.d, base, e.was.w * e.was.d)}, and there `
      + `${e.was.n === 1 ? "is" : "are"} ${N(e.was.n)} more.`;
  }
  if (e.kind === "flipTop" || e.kind === "flipBottom") {
    return "Not quite — upside down means the top and the bottom swap over.";
  }
  if (e.kind === "hcf") {
    if (e.src.n % given || e.src.d % given) {
      return `${N(given)} does not go into both of them.`;
    }
    return `${N(given)} goes into both, but something bigger does too.`;
  }
  if (e.kind === "wholes") {
    return `Not quite — how many whole lots of ${N(e.src.d)} are there in ${N(e.src.n)}?`;
  }
  if (e.kind === "left") {
    return `Not quite — take the whole ones away and see what is left on top.`;
  }
  return "Not that one.";
}

function told(e, plan) {
  const base = plan.base;
  const N = (n) => writeNum(n, 0, base);
  if (e.kind === "improper") return `${writeFraction(e.was, base)} is ${N(e.value)} ${pieces(e.was.d, base, e.value)}.`;
  if (e.kind === "flipTop") return "Upside down, and the sign turns into a times.";
  if (e.kind === "flipBottom") return "Now it is a multiplication like any other.";
  if (e.kind === "common") return `Both of them can be written in ${pieces(e.value, base)}.`;
  if (e.kind === "change") return `${writeFraction(e.was, base)} is ${N(e.value)} ${pieces(e.L, base, e.value)}.`;
  if (e.kind === "top") return `${N(e.value)} on top.`;
  if (e.kind === "bottom") {
    return e.op === "*"
      ? `${N(e.value)} underneath — the pieces got smaller, because you took a part of a part.`
      : `${N(e.value)} underneath — the pieces are the same size as they were.`;
  }
  if (e.kind === "hcf") return `${N(e.value)} goes into both, so both can be cut down by it.`;
  if (e.kind === "cutTop" || e.kind === "cutBottom") return `${N(e.value)}.`;
  if (e.kind === "wholeOnly") return `${N(e.value)} ${wholes(e.value)}, and no part left over.`;
  if (e.kind === "wholes") return `${N(e.value)} ${wholes(e.value)}.`;
  return `and ${N(e.value)} ${pieces(plan.answer.d, base, e.value)} left over.`;
}

function finish(plan) {
  return `Done — ${said(plan)}.`;
}

/* ── writing a number on the page ─────────────────────────────────────────── */

export function answer(thing, text) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return { ok: false, changed: false, message: finish(plan) };

  const given = fromBase(text, thing.base);
  if (given === null) {
    return {
      ok: false, changed: false,
      message: `Write it in base ${baseWord(thing.base)}.`,
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
  return {
    changed: true, finished, kind: e.kind,
    message: finished ? finish(plan) : `${writeNum(e.value, 0, thing.base)} — ${told(e, plan)}`,
  };
}

/** The cells the learner writes in NOW — one box per figure. */
export function cellsOf(thing) {
  const plan = planOf(thing);
  const e = plan.entries[thing.done];
  if (!e) return null;
  return {
    mode: "type",
    grid: { cols: plan.cols, rows: plan.rows, gutter: GUTTER },
    count: !!e.beside,
    span: e.span || 1,
    cells: Array.from({ length: e.len }, (_, k) => ({ row: e.row, col: e.from + k })),
  };
}

/* ── the page, as marks ───────────────────────────────────────────────────── */

export function sheetOf(thing) {
  const plan = planOf(thing);
  const base = thing.base;
  const marks = [];
  const rules = [];

  /* A number is written as ONE mark across its columns, not a figure per cell.
     The other boards do the opposite, and deliberately: there the columns ARE
     the argument, so a figure has to sit in its own. Here there is no place
     value to make, and twelve has to read as twelve rather than as one two. */
  const put = (row, from, value, tone = "ink", span = 1) => {
    const chars = writeNum(value, 0, base);
    marks.push({ row, col: from, ch: chars, cols: chars.length, tone, span });
  };

  /* what is simply copied down, once the working has reached it */
  for (const a of plan.auto) {
    if (thing.done < a.at) continue;
    if (a.ch !== undefined) marks.push({ row: a.row, col: a.from, ch: a.ch, tone: "ink", span: a.span || 1 });
    else put(a.row, a.from, a.value, a.tone, a.span || 1);
  }
  /* and what has actually been worked out */
  for (let n = 0; n < thing.done; n++) {
    const e = plan.entries[n];
    put(e.row, e.from, e.value, e.beside ? "carry" : "ink", e.span || 1);
  }
  for (const b of plan.bars) {
    if (thing.done >= b.at) rules.push({ row: b.row, from: b.from, to: b.to });
  }

  const e = plan.entries[thing.done] || null;
  const finished = thing.done >= plan.entries.length;
  const last = plan.lines[plan.lines.length - 1];
  return {
    plan, cols: plan.cols, rows: plan.rows, width: plan.width, gutter: GUTTER,
    marks, rules, points: [], minus: [], signs: [], bracket: null,
    underline: finished ? { row: plan.rows - 1, from: 0, to: Math.max(0, last.width - 1) } : null,
    ask: e ? { row: e.row, cols: Array.from({ length: e.len }, (_, k) => e.from + k), span: e.span || 1 } : null,
    finished,
    answer: plan.answer,
    sum: said(plan),
  };
}
