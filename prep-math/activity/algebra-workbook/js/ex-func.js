/* ============================================================================
   Algebra Workbook — CHAPTER 6: functions and function machines
   ----------------------------------------------------------------------------
   A function is a machine: a number goes in, the same jobs are done to it
   every time, one number comes out. The chapter keeps that picture from the
   first page to the last, concrete to abstract:

     the machine          a machine with its jobs written on it: put numbers
                          through, one job at a time
     working backwards    out → in, by undoing each job in the other order —
                          and BUILD the machine that undoes it
     find the rule        a table of ins and outs: build the machine from job
                          cards (on screen, tapped or dragged into its boxes,
                          with a row that says what YOUR machine gives)
     writing it down      the machine as a formula — 3x + 2 is "× 3 then + 2",
                          3(x + 2) the other order; the order of the jobs matters
     mappings and f(x)    a mapping diagram joined up; is it a function (one
                          out for every in)?; f(x) notation and f(a) = 13 back
                          to a; (Stretch) one machine after another

   The machines are marked by what they DO (utils/components/workbook/
   machine.js): any machine that turns every in into its out is right.
   ========================================================================== */

import { levelOf } from "./poly.js";
import { helpOf } from "./organiser.js";
import { want } from "/utils/components/workbook/want.js";
import { opText, runOps } from "/utils/components/workbook/machine.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const eq = (html) => `<p class="wb-ask ap-eq">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const table = (head, rows) =>
  `<table class="fn-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>` +
  `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const side = (a, b) => `<div class="fn-side">${a}<div class="fn-lines">${b}</div></div>`;

const tier = (o) => levelOf(o).id;
const named = (o) => helpOf(o).id !== "try";
const num = (v) => (v < 0 ? `−${-v}` : String(v));

/* ── the machine, drawn ─────────────────────────────────────────────────── */

const ARROW = `<svg class="fm-arrow" viewBox="0 0 12 6" aria-hidden="true"><path d="M0.5 3h9M7 0.8 10.8 3 7 5.2" stroke="#2a2723" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * A function machine.
 *   given   its jobs, written on it — or
 *   slots   how many empty boxes, to BUILD it from the tray (on screen: live)
 *   ins     the inputs its test row runs (a machine to build)
 *   tray    the job cards to choose from
 *   inVal, outVal   a number written at IN / OUT
 */
function machine({ given = null, slots = 0, ins = [], tray = [], inVal = null, outVal = null }) {
  const boxes = given
    ? given.map((op) => `<span class="fm-slot fm-slot--given">${opText(op)}</span>`)
    : Array.from({ length: slots }, (_, i) => `<span class="fm-slot" data-slot="${i}"></span>`);
  const io = (word, v) => `<span class="fm-io">${word}${v === null ? "" : `<b>${v}</b>`}</span>`;
  const row = `${io("In", inVal)}${ARROW}<span class="fm-body">${boxes.join(ARROW)}</span>${ARROW}${io("Out", outVal)}`;
  const cards = tray.length
    ? `<div class="fm-tray"><span class="fm-tray__tag">Job cards</span>${tray.map((op) => `<span class="fm-op" data-op="${op}">${opText(op)}</span>`).join("")}</div>`
    : "";
  /* plain bold figures, not typeset: the boxes are filled in on screen */
  return `<div class="fm-wrap wb-nomath"${given ? "" : ` data-machine="1" data-ins="${ins.join(",")}"`}><div class="fm-row">${row}</div>${cards}</div>`;
}

/* ── jobs, by level ─────────────────────────────────────────────────────── */

const undo = (op) => ({ "+": "-", "-": "+", "*": "/", "/": "*" }[op[0]] + op.slice(1));
const inverse = (ops) => ops.slice().reverse().map(undo);

/** The jobs of a machine at this level, and inputs that keep every answer whole. */
function jobsOf(r, o) {
  const t = tier(o);
  if (t === "gentle") {
    const op = r.chance(0.5) ? `+${r.int(1, 9)}` : `*${r.int(2, 5)}`;
    return [op];
  }
  if (t === "middle") {
    const first = r.chance(0.6) ? `*${r.int(2, 6)}` : `+${r.int(1, 9)}`;
    const second = r.chance(0.5) ? `+${r.int(1, 9)}` : `-${r.int(1, 5)}`;
    return first[0] === second[0] ? [first, `*${r.int(2, 4)}`] : [first, second];
  }
  /* one job that multiplies or divides and one that adds or takes away, in
     either order — two of a kind would just be one job (× 2 then ÷ 2 is × 1) */
  const scale = r.chance(0.5) ? `*${r.int(2, 9)}` : `/${r.pick([2, 3, 4, 5])}`;
  const shift = r.chance(0.5) ? `-${r.int(2, 12)}` : `+${r.int(3, 15)}`;
  return r.chance(0.5) ? [scale, shift] : [shift, scale];
}

/** Inputs for these jobs: whole numbers all the way through, and never below 0 at Gentle and Middle. */
function insFor(r, o, ops, n = 4) {
  const t = tier(o);
  const pool = [];
  const lo = t === "stretch" ? -3 : 1;
  const hi = t === "gentle" ? 10 : t === "middle" ? 12 : 20;
  for (let x = lo; x <= hi; x++) {
    /* every stage whole, and (below Stretch) never negative */
    let v = x; let ok = true;
    for (const op of ops) {
      v = runOps([op], v);
      if (!Number.isInteger(v) || (t !== "stretch" && v < 0)) { ok = false; break; }
    }
    if (ok) pool.push(x);
  }
  const pick = r.shuffle(pool).slice(0, n).sort((a, b) => a - b);
  return pick.length ? pick : [1, 2, 3, 4].slice(0, n);
}

/** Job cards for a tray: these, and some that are nearly them. */
function trayFor(r, need, size) {
  const set = new Set(need);
  let g = 0;
  while (set.size < size && g++ < 200) {
    const base = r.pick(need);
    const n = Number(base.slice(1));
    const pick = r.pick([
      `${base[0]}${n + 1}`, `${base[0]}${Math.max(1, n - 1)}`,
      `${{ "+": "*", "*": "+", "-": "/", "/": "-" }[base[0]]}${n}`,
      `${{ "+": "-", "-": "+", "*": "/", "/": "*" }[base[0]]}${n}`,
    ]);
    if (pick.endsWith("1") && pick.length === 2 && "*/".includes(pick[0])) continue;   // × 1 does nothing
    if (pick.startsWith("/") && Number(pick.slice(1)) < 2) continue;
    set.add(pick);
  }
  return r.shuffle([...set]);
}

/** A machine as a formula: "× 3 then + 2" is 3x + 2, "+ 2 then × 3" is 3(x + 2). */
export function formulaOf(ops, v = "x") {
  let e = v; let bare = true;
  for (const op of ops) {
    const n = op.slice(1);
    if (op[0] === "+") { e = `${e} + ${n}`; bare = false; }
    if (op[0] === "-") { e = `${e} − ${n}`; bare = false; }
    if (op[0] === "*") { e = bare ? (e === v ? `${n}${v}` : `${n} × ${e}`) : `${n}(${e})`; }
    if (op[0] === "/") { e = bare ? `${e}/${n}` : `(${e})/${n}`; bare = false; }
  }
  return e;
}

export const FN_GROUPS = [
  { id: "fn-machine", chapter: "Chapter 6 · Functions", label: "Function machines", blurb: "A number in, the same jobs every time, one number out." },
  { id: "fn-back", label: "Working backwards", blurb: "Out to in: undo every job, in the other order." },
  { id: "fn-rule", label: "Find the rule", blurb: "Build the machine from job cards — and test it." },
  { id: "fn-write", label: "Writing a function", blurb: "The machine as a formula; the order of the jobs matters." },
  { id: "fn-map", label: "Mappings and f(x)", blurb: "Join ins to outs; one out for every in; f(x) notation." },
];

/* ═══ 1. the machine ═══════════════════════════════════════════════════════*/

const fnRun = {
  id: "fn-run",
  group: "fn-machine",
  label: "Put numbers through the machine",
  blurb: "Do each job in order, and write what comes out.",
  heading: "Put the numbers through",
  instruction: (o) =>
    "Each number goes IN on the left and has the machine's jobs done to it, in order, left to right. What " +
    "comes out on the right is its OUT." +
    (tier(o) === "gentle" ? "" : " Write down the number between the jobs too, so you can check each step."),
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const ops = jobsOf(r, o);
    return { ops, ins: insFor(r, o, ops, 4) };
  },
  render(item) {
    const two = item.ops.length > 1;
    const head = ["In", ...(two ? [`after ${opText(item.ops[0])}`] : []), "Out"];
    const rows = item.ins.map((x) => [num(x), ...(two ? [box()] : []), box()]);
    return side(machine({ given: item.ops }), table(head, rows));
  },
  worked() {
    return worked(machine({ given: ["*3", "+2"], inVal: 4, outVal: 14 }) +
      say("4 goes in. The first job is × 3: 4 × 3 = 12. The next job is + 2: 12 + 2 = 14. So 4 goes in and 14 " +
        "comes out. The machine always does the SAME jobs in the SAME order — that is what makes it a function."));
  },
  key(item) {
    const two = item.ops.length > 1;
    return item.ins.flatMap((x) => [...(two ? [want.num(runOps([item.ops[0]], x))] : []), want.num(runOps(item.ops, x))]);
  },
  answer(item) {
    return [item.ins.map((x) => `${num(x)} → ${num(runOps(item.ops, x))}`).join(", ")];
  },
};

/* ═══ 2. working backwards ═════════════════════════════════════════════════*/

const fnBack = {
  id: "fn-back",
  group: "fn-back",
  label: "What went in?",
  blurb: "The out is given: undo each job, last one first.",
  heading: "Work backwards",
  instruction: () =>
    "To find what went in, run the machine BACKWARDS: start at the out, undo the last job first, then the " +
    "one before. Undo + with −, and × with ÷. Then build the machine that undoes it from the job cards — on " +
    "screen, tap a card and then a box.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const ops = jobsOf(r, o);
    const ins = insFor(r, o, ops, 3);
    const back = inverse(ops);
    return { ops, ins, outs: ins.map((x) => runOps(ops, x)), tray: trayFor(r, back, back.length + 3) };
  },
  render(item) {
    const rows = item.outs.map((y) => [box(), num(y)]);
    return side(machine({ given: item.ops }), table(["In", "Out"], rows)) +
      ask("The machine that undoes it: out goes in, in comes out.") +
      machine({ slots: item.ops.length, ins: item.outs, tray: item.tray });
  },
  worked() {
    return worked(machine({ given: ["*2", "+5"], inVal: "?", outVal: 17 }) +
      say("17 came out. The last job was + 5, so undo it first: 17 − 5 = 12. The job before was × 2: undo it, " +
        "12 ÷ 2 = 6. So 6 went in — check: 6 × 2 + 5 = 17. The machine that undoes it is − 5 then ÷ 2."));
  },
  key(item) {
    return [
      ...item.ins.map((x) => want.num(x)),
      want.machine({ ins: item.outs, outs: item.ins, says: inverse(item.ops).map(opText).join(" then ") }),
    ];
  },
  answer(item) {
    return [`${item.ins.map(num).join(", ")}; undo with ${inverse(item.ops).map(opText).join(" then ")}`];
  },
};

/* ═══ 3. find the rule ═════════════════════════════════════════════════════*/

const fnRule = {
  id: "fn-rule",
  group: "fn-rule",
  label: "Build the machine",
  blurb: "A table of ins and outs: which jobs make them?",
  heading: "Find the rule — build the machine",
  instruction: (o) =>
    "Look at how each in becomes its out. Is it more each time by the same amount (+), or so many times " +
    "bigger (×)?" + (tier(o) === "gentle" ? "" : " With two jobs, try a × first, then see what you must add or take away.") +
    " Choose job cards for the boxes; on screen the row under the machine shows what YOUR machine gives, " +
    "so you can test it. Then use it on a new number.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const ops = jobsOf(r, o);
    const ins = insFor(r, o, ops, 4);
    /* a number far past the table, and whole at every step of the machine */
    const whole = (x) => ops.every((_, j) => Number.isInteger(runOps(ops.slice(0, j + 1), x)));
    const tries = r.shuffle(tier(o) === "stretch" ? [30, 40, 50, 60, 100, 25, 45, 35, 55, 70, 90, 80] : [20, 50, 100, 30, 40]);
    /* round numbers first; if none keeps the division whole, the nearest that does */
    const farOk = [...tries, ...Array.from({ length: 81 }, (_, j) => 20 + j)].find(whole) ?? tries[0];
    return { ops, ins, outs: ins.map((x) => runOps(ops, x)), tray: trayFor(r, ops, ops.length + (tier(o) === "gentle" ? 3 : 4)), far: farOk };
  },
  render(item) {
    return side(table(["In", "Out"], item.ins.map((x, j) => [num(x), num(item.outs[j])])),
      machine({ slots: item.ops.length, ins: item.ins, tray: item.tray }) +
      ask(`Put ${item.far} in: out comes ${box()}`));
  },
  worked() {
    return worked(say("In 1, 2, 3 — out 5, 8, 11. The outs go up by 3 each time the in goes up by 1, so there " +
      "is a × 3. But 1 × 3 is 3, not 5: 2 more is needed, so the second job is + 2. Test it on 3: 3 × 3 + 2 = 11. " +
      "Right — the machine is × 3 then + 2."));
  },
  key(item) {
    return [
      want.machine({ ins: item.ins, outs: item.outs, says: item.ops.map(opText).join(" then ") }),
      want.num(runOps(item.ops, item.far)),
    ];
  },
  answer(item) {
    return [`${item.ops.map(opText).join(" then ")}; ${item.far} → ${num(runOps(item.ops, item.far))}`];
  },
};

/* ═══ 4. writing a function ════════════════════════════════════════════════*/

const fnFormula = {
  id: "fn-formula",
  group: "fn-write",
  label: "The machine as a formula",
  blurb: "× 3 then + 2 is y = 3x + 2.",
  heading: "Write the machine as a formula",
  instruction: (o) =>
    "Call the number that goes in x. Do the machine's jobs to x, in order, and you have the formula for what " +
    "comes out." + (named(o) ? " × 3 then + 2 is 3x + 2; + 2 then × 3 is 3(x + 2) — the bracket says the adding happened first." : ""),
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const ops = jobsOf(r, o);
    const right = formulaOf(ops);
    const wrong = new Set();
    if (ops.length > 1) wrong.add(formulaOf(ops.slice().reverse()));
    const n = ops[0].slice(1);
    wrong.add(ops[0][0] === "+" ? `${n}x` : `x + ${n}`);
    wrong.add(ops[0][0] === "*" ? `x − ${n}` : `x − ${n}`);
    const opts = r.shuffle([right, ...[...wrong].filter((w) => w !== right).slice(0, 2)]);
    const at = insFor(r, o, ops, 2);
    return { ops, opts, right: opts.indexOf(right), at };
  },
  render(item) {
    return machine({ given: item.ops }) +
      ask("Out =") + tick(...item.opts) +
      eq(`When x = ${num(item.at[0])}, out = ${box()} &nbsp; When x = ${num(item.at[1])}, out = ${box()}`);
  },
  key(item) {
    return [want.tick(item.right), ...item.at.map((x) => want.num(runOps(item.ops, x)))];
  },
  answer(item) {
    return [`${item.opts[item.right]}; ${item.at.map((x) => num(runOps(item.ops, x))).join(", ")}`];
  },
};

const fnOrder = {
  id: "fn-order",
  group: "fn-write",
  label: "Does the order matter?",
  blurb: "The same two jobs, the other way round.",
  heading: "Swap the jobs round",
  hardest: true,
  instruction: () =>
    "The two machines have the same two jobs in the other order. Put the same number through each. Adding " +
    "and multiplying in a different order usually gives a different answer — so a function's jobs have an order.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const a = `*${r.int(2, tier(o) === "stretch" ? 9 : 5)}`;
    const b = `+${r.int(1, 9)}`;
    return { ops: r.chance(0.5) ? [a, b] : [b, a], x: r.int(2, 10) };
  },
  render(item) {
    const back = item.ops.slice().reverse();
    return machine({ given: item.ops, inVal: item.x }) + eq(`Out: ${box()}`) +
      machine({ given: back, inVal: item.x }) + eq(`Out: ${box()}`) +
      ask("The two machines are") + tick("the same", "different") +
      ask("The first machine as a formula") + tick(formulaOf(item.ops), formulaOf(back));
  },
  key(item) {
    const back = item.ops.slice().reverse();
    const p = runOps(item.ops, item.x); const q = runOps(back, item.x);
    return [want.num(p), want.num(q), want.tick(p === q ? 0 : 1), want.tick(0)];
  },
  answer(item) {
    return [`${runOps(item.ops, item.x)} and ${runOps(item.ops.slice().reverse(), item.x)}; ${formulaOf(item.ops)}`];
  },
};

/* ═══ 5. mappings and f(x) ═════════════════════════════════════════════════*/

const fnMap = {
  id: "fn-map",
  group: "fn-map",
  label: "Join the mapping diagram",
  blurb: "Each in on the left, joined to its out on the right.",
  heading: "Join each in to its out",
  instruction: () =>
    "A mapping diagram is the machine's table drawn as two lists: every in on the left is joined by an arrow " +
    "to what comes out for it. Join each dot on the left to the right one — on screen, tap a dot, then its " +
    "partner.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const ops = jobsOf(r, o);
    const ins = insFor(r, o, ops, 4);
    const outs = ins.map((x) => runOps(ops, x));
    return { ops, ins, right: r.shuffle(outs.slice()) };
  },
  render(item) {
    const left = item.ins.map((x) => `<li><span class="wb-match__dot"></span><span><b>${num(x)}</b></span></li>`).join("");
    const right = item.right.map((y) => `<li><span class="wb-match__dot"></span><span><b>${num(y)}</b></span></li>`).join("");
    return ask(`The rule: x → ${formulaOf(item.ops)}`) +
      `<div class="wb-match fn-match"><ul class="wb-match__side">${left}</ul><ul class="wb-match__side wb-match__side--right">${right}</ul></div>`;
  },
  key(item) {
    return [want.match(item.ins.map((x, j) => [j, item.right.indexOf(runOps(item.ops, x))]), "each in to its out")];
  },
  answer(item) {
    return [item.ins.map((x) => `${num(x)} → ${num(runOps(item.ops, x))}`).join(", ")];
  },
};

/** A mapping diagram drawn: two ovals, and an arrow for every pair. */
function mapSvg(ins, outs, pairs) {
  const W = 64; const row = 7; const H = Math.max(ins.length, outs.length) * row + 10;
  const yL = (i) => 7 + i * row + (H - 10 - ins.length * row) / 2 + row / 2;
  const yR = (i) => 7 + i * row + (H - 10 - outs.length * row) / 2 + row / 2;
  let body = `<ellipse cx="12" cy="${H / 2 + 1.5}" rx="9" ry="${H / 2 - 2}" fill="#fff7c7" stroke="#2a2723" stroke-width="0.4"/>` +
    `<ellipse cx="${W - 12}" cy="${H / 2 + 1.5}" rx="9" ry="${H / 2 - 2}" fill="#dcefff" stroke="#2a2723" stroke-width="0.4"/>` +
    `<text x="12" y="3.2" text-anchor="middle" font-size="2.8" font-weight="700" fill="#6b645a">In</text>` +
    `<text x="${W - 12}" y="3.2" text-anchor="middle" font-size="2.8" font-weight="700" fill="#6b645a">Out</text>`;
  ins.forEach((x, i) => { body += `<text x="12" y="${(yL(i) + 1.2).toFixed(2)}" text-anchor="middle" font-size="3.4" font-weight="700" fill="#2a2723">${num(x)}</text>`; });
  outs.forEach((y, i) => { body += `<text x="${W - 12}" y="${(yR(i) + 1.2).toFixed(2)}" text-anchor="middle" font-size="3.4" font-weight="700" fill="#2a2723">${num(y)}</text>`; });
  pairs.forEach(([a, b]) => {
    const x1 = 16.5; const y1 = yL(a); const x2 = W - 16.5; const y2 = yR(b);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const h = (d) => `${(x2 - 2.2 * Math.cos(ang + d)).toFixed(2)},${(y2 - 2.2 * Math.sin(ang + d)).toFixed(2)}`;
    body += `<line x1="${x1}" y1="${y1.toFixed(2)}" x2="${x2}" y2="${y2.toFixed(2)}" stroke="#2f6ea8" stroke-width="0.45"/>` +
      `<polygon points="${x2},${y2.toFixed(2)} ${h(0.4)} ${h(-0.4)}" fill="#2f6ea8"/>`;
  });
  return `<svg class="fn-map" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" role="img" aria-label="A mapping diagram" style="font-family: JetBrains Mono, monospace">${body}</svg>`;
}

let isTurn = 0;
const IS = [
  { kind: "one each", yes: true },
  { kind: "two ins, one out", yes: true },
  { kind: "one in, two outs", yes: false },
  { kind: "an in with no out", yes: false },
];

const fnIs = {
  id: "fn-is",
  group: "fn-map",
  label: "Is it a function?",
  blurb: "Every in must have exactly one out. Two ins may share one.",
  heading: "Is it a function?",
  hardest: true,
  instruction: () =>
    "A machine gives ONE out for every in — so a mapping is a function when every in on the left has exactly " +
    "one arrow leaving it. Two ins going to the same out is allowed (two different numbers can give the same " +
    "answer). An in with two arrows, or none, is not a function.",
  cols: 2,
  defaultCount: 4,
  make(r, o, k, i) {
    if (i === 0) isTurn = r.int(0, 3);
    const c = IS[(i + isTurn) % IS.length];
    const ins = [1, 2, 3, 4];
    const outs = r.shuffle([2, 4, 5, 6, 8, 9]).slice(0, 4).sort((a, b) => a - b);
    let pairs = r.shuffle([0, 1, 2, 3]).map((b, a) => [a, b]);
    if (c.kind === "two ins, one out") { const a = r.int(0, 2); pairs = pairs.map(([p, q]) => (p === a + 1 ? [p, pairs[a][1]] : [p, q])); }
    if (c.kind === "one in, two outs") { const a = r.int(0, 3); const other = pairs.find(([p]) => p !== a)[1]; pairs.push([a, other]); }
    if (c.kind === "an in with no out") { const a = r.int(0, 3); pairs = pairs.filter(([p]) => p !== a); }
    return { ins, outs, pairs, yes: c.yes };
  },
  render(item) {
    return `<div class="ab-art">${mapSvg(item.ins, item.outs, item.pairs)}</div>` + tick("A function", "Not a function");
  },
  key(item) {
    return [want.tick(item.yes ? 0 : 1)];
  },
  answer(item) {
    return [item.yes ? "a function" : "not a function"];
  },
};

const fnNotation = {
  id: "fn-notation",
  group: "fn-map",
  label: "f(x) notation",
  blurb: "f(x) = 3x − 2: f(5) means put 5 in.",
  heading: "Use function notation",
  hardest: true,
  instruction: () =>
    "f(x) = 3x − 2 is the machine × 3 then − 2, with a name: f. f(5) means \"what comes out of f when 5 goes " +
    "in\": 3 × 5 − 2 = 13. To find what went in when f(a) = 13, work backwards.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    let ops;
    do { ops = jobsOf(r, o); } while (ops.length < 2 && tier(o) !== "gentle");
    const at = insFor(r, o, ops, 3);
    return { ops, at: at.slice(0, 2), back: at[2] ?? at[0] + 1 };
  },
  render(item) {
    const f = formulaOf(item.ops);
    const y = runOps(item.ops, item.back);
    return eq(`f(x) = ${f}`) +
      eq(`f(${num(item.at[0])}) = ${box()} &nbsp; f(${num(item.at[1])}) = ${box()}`) +
      eq(`f(a) = ${num(y)}, so a = ${box()}`);
  },
  key(item) {
    return [...item.at.map((x) => want.num(runOps(item.ops, x))), want.num(item.back)];
  },
  answer(item) {
    return [`${item.at.map((x) => num(runOps(item.ops, x))).join(", ")}; a = ${num(item.back)}`];
  },
};

const fnCompose = {
  id: "fn-compose",
  group: "fn-map",
  label: "One machine after another",
  blurb: "g(f(x)): the out of f goes straight into g.",
  heading: "Two machines in a row",
  hardest: true,
  instruction: () =>
    "g(f(x)) means: put x into f, then put what comes out straight into g. Work from the inside out. f(g(x)) is " +
    "the other way round — and usually a different number.",
  cols: 1,
  defaultCount: 2,
  make(r) {
    const f = [`*${r.int(2, 5)}`];
    const g = [`+${r.int(1, 9)}`];
    return { f, g, x: r.int(1, 6) };
  },
  render(item) {
    return eq(`f(x) = ${formulaOf(item.f)} &nbsp;&nbsp; g(x) = ${formulaOf(item.g)}`) +
      machine({ given: [...item.f, ...item.g], inVal: item.x }) +
      eq(`f(${item.x}) = ${box()} &nbsp; g(f(${item.x})) = ${box()} &nbsp; f(g(${item.x})) = ${box()}`);
  },
  key(item) {
    const fx = runOps(item.f, item.x);
    return [want.num(fx), want.num(runOps(item.g, fx)), want.num(runOps(item.f, runOps(item.g, item.x)))];
  },
  answer(item) {
    const fx = runOps(item.f, item.x);
    return [`${fx}; ${runOps(item.g, fx)}; ${runOps(item.f, runOps(item.g, item.x))}`];
  },
};

export const FN_EXERCISES = [
  fnRun,
  fnBack,
  fnRule,
  fnFormula, fnOrder,
  fnMap, fnIs, fnNotation, fnCompose,
];
