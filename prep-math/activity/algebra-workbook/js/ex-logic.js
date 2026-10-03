/* ============================================================================
   Algebra Workbook — CHAPTER 11: LOGIC — truth tables and logic gates
   ----------------------------------------------------------------------------
   A statement is true (T) or false (F). Joined statements are true or false
   by rule, and a TRUTH TABLE lists every way the parts can come out:

     NOT, AND, OR          ~p flips p; p ∧ q only when both; p ∨ q when
                           either (or both)
     compound statements   a column for each step: ~q, then p ∧ ~q …
     if … then             (Middle+) p ⇒ q is false only when p is true and q
                           false; p ⇔ q when they agree

   A LOGIC GATE is the same rule in a wire: 1 is on (true), 0 is off.

     what comes out        a small circuit, the inputs given: the output
     the circuit's table   every row of A and B (and C): the output column
     name the gate         (Middle+) its table says which: AND, OR, NAND, NOR
                           or XOR

   And then the gates are BUILT with (the shared logicboard.js): switches, a
   bulb, wires with empty places, and a tray of gates to drag into them.

     meet the gates        drop one in, flip the switches, write its table
     which gate?           a table to match with one gate
     combine them          only AND, OR and NOT in the tray: NOT-AND, NOT-OR,
                           a NOT on one input
     three switches        (Middle+) two gates in a row, from an expression
                           (Stretch: from the table alone)

   A built circuit is marked by what it DOES — its whole truth table — so any
   gates that light the bulb as asked are right. Every gate has one colour
   everywhere: in the tray, on the board, and in the printed circuits.

   Truth-table cells are typed T or F (true/false and 1/0 are taken too); gate
   outputs are typed 0 or 1. The gates are drawn with the usual symbols
   (gateart below): AND a D, OR a shield, NOT a triangle, and a small circle
   on the output for NAND and NOR.
   ========================================================================== */

import { levelOf } from "./poly.js";
import { want } from "/utils/components/workbook/want.js";
import { GATES as PIECES, gatesBoardHtml, tableOf, settings } from "/utils/components/workbook/logicboard.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const tier = (o) => levelOf(o).id;

const TF = (v) => (v ? "T" : "F");
const wantTF = (v) => (v ? want.text("T", "true", "1") : want.text("F", "false", "0"));

/* ── the operations ───────────────────────────────────────────────────── */

const OPS = {
  not: { sym: "~", fn: (p) => !p },
  and: { sym: "∧", fn: (p, q) => p && q },
  or: { sym: "∨", fn: (p, q) => p || q },
  imp: { sym: "⇒", fn: (p, q) => !p || q },
  iff: { sym: "⇔", fn: (p, q) => p === q },
};
const ROWS2 = [[true, true], [true, false], [false, true], [false, false]];

/** A truth table: given columns filled, asked columns as boxes. */
const TEX = { "~": "{\\sim}", "∧": "\\land ", "∨": "\\lor ", "⇒": "\\Rightarrow ", "⇔": "\\Leftrightarrow " };
/** A heading as the typesetter is to set it: its signs swapped for their TeX. */
const head = (h) => `<span data-tex="${[...h].map((c) => TEX[c] ?? c).join("")}">${h}</span>`;

function truthTable(heads, rows, asked) {
  const th = heads.map((h, i) => `<th${asked.includes(i) ? ' class="lg-ask"' : ""}>${head(h)}</th>`).join("");
  const body = rows.map((r) => `<tr>${r.map((v, i) => `<td>${asked.includes(i) ? box() : TF(v)}</td>`).join("")}</tr>`).join("");
  return `<table class="lg-table"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
}

export const LG_GROUPS = [
  { id: "lg-truth", chapter: "Chapter 11 · Logic", label: "Truth tables", blurb: "NOT, AND, OR — and every way the parts can come out." },
  { id: "lg-gates", label: "Logic gates", blurb: "The same rules in wires: 1 is on, 0 is off." },
  { id: "lg-build", label: "Build the logic path", blurb: "Drag gates into the circuit, flip the switches, light the bulb." },
];

/* ═══ NOT, AND, OR ═════════════════════════════════════════════════════════*/

const lgBasic = {
  id: "lg-basic",
  group: "lg-truth",
  label: "NOT, AND, OR",
  blurb: "~p flips it; p ∧ q needs both; p ∨ q needs either.",
  heading: "Truth tables: NOT, AND and OR",
  instruction: () =>
    "Write T (true) or F (false) in every empty box. ~p (NOT p) is the opposite of p. p ∧ q (p AND q) is true " +
    "only when BOTH are true. p ∨ q (p OR q) is true when EITHER is true — or both.",
  cols: 2,
  defaultCount: 2,
  make(r, o) {
    const which = tier(o) === "gentle" ? r.pick(["and", "or"]) : r.pick(["and", "or", "not"]);
    return { which };
  },
  render(item) {
    if (item.which === "not") return truthTable(["p", "~p"], [[true, false], [false, true]], [1]);
    const op = OPS[item.which];
    return truthTable(["p", "q", `p ${op.sym} q`], ROWS2.map(([p, q]) => [p, q, op.fn(p, q)]), [2]);
  },
  worked() {
    return worked(truthTable(["p", "q", "p ∧ q", "p ∨ q"], ROWS2.map(([p, q]) => [p, q, p && q, p || q]), []) +
      say("AND is true in one row only — the top, where both are true. OR is false in one row only — the bottom, where both are false."));
  },
  key(item) {
    if (item.which === "not") return [wantTF(false), wantTF(true)];
    return ROWS2.map(([p, q]) => wantTF(OPS[item.which].fn(p, q)));
  },
  answer(item) {
    if (item.which === "not") return ["F, T"];
    return [ROWS2.map(([p, q]) => TF(OPS[item.which].fn(p, q))).join(" ")];
  },
};

/* ═══ compound statements ══════════════════════════════════════════════════*/

/* each: the column names, and how each is worked out from p and q */
const COMPOUNDS = [
  { heads: ["~q", "p ∧ ~q"], fns: [(p, q) => !q, (p, q) => p && !q] },
  { heads: ["~p", "~p ∨ q"], fns: [(p) => !p, (p, q) => !p || q] },
  { heads: ["p ∧ q", "~(p ∧ q)"], fns: [(p, q) => p && q, (p, q) => !(p && q)] },
  { heads: ["p ∨ q", "~(p ∨ q)"], fns: [(p, q) => p || q, (p, q) => !(p || q)] },
  { heads: ["~p", "~q", "~p ∧ ~q"], fns: [(p) => !p, (p, q) => !q, (p, q) => !p && !q] },
  { heads: ["~p", "~q", "~p ∨ ~q"], fns: [(p) => !p, (p, q) => !q, (p, q) => !p || !q] },
];

const lgCompound = {
  id: "lg-compound",
  group: "lg-truth",
  label: "Compound statements",
  blurb: "A column for every step, from the inside out.",
  heading: "Truth tables for compound statements",
  instruction: () =>
    "Work from the inside out: first the small pieces (like ~q), each in its own column, then the whole " +
    "statement from those columns. Brackets first, as in arithmetic.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const pool = tier(o) === "gentle" ? COMPOUNDS.slice(0, 4) : COMPOUNDS;
    return { c: COMPOUNDS.indexOf(r.pick(pool)) };
  },
  render(item) {
    const C = COMPOUNDS[item.c];
    const rows = ROWS2.map(([p, q]) => [p, q, ...C.fns.map((f) => f(p, q))]);
    return truthTable(["p", "q", ...C.heads], rows, C.heads.map((_, i) => i + 2));
  },
  worked() {
    return worked(truthTable(["p", "q", "~q", "p ∧ ~q"], ROWS2.map(([p, q]) => [p, q, !q, p && !q]), []) +
      say("~q flips the q column. Then p ∧ ~q is true only where p AND ~q are both true: the second row."));
  },
  key(item) {
    const C = COMPOUNDS[item.c];
    /* the table is read row by row, left to right */
    return ROWS2.flatMap(([p, q]) => C.fns.map((f) => wantTF(f(p, q))));
  },
  answer(item) {
    const C = COMPOUNDS[item.c];
    return C.heads.map((h, i) => `${h}: ${ROWS2.map(([p, q]) => TF(C.fns[i](p, q))).join(" ")}`);
  },
};

/* ═══ if … then, if and only if ════════════════════════════════════════════*/

const lgImplies = {
  id: "lg-implies",
  group: "lg-truth",
  label: "If … then, if and only if",
  blurb: "p ⇒ q fails only when p is true and q is false.",
  heading: "Truth tables: implication",
  hardest: true,
  instruction: () =>
    "p ⇒ q (if p then q) is a promise: it is broken — false — only when p happens and q does not. In every other " +
    "row it is true. p ⇔ q (p if and only if q) is true when p and q are the SAME, both true or both false.",
  cols: 1,
  defaultCount: 2,
  make(r) {
    return { set: r.int(0, 2) };
  },
  render(item) {
    const S = [
      { heads: ["p ⇒ q", "q ⇒ p"], fns: [OPS.imp.fn, (p, q) => OPS.imp.fn(q, p)] },
      { heads: ["p ⇒ q", "p ⇔ q"], fns: [OPS.imp.fn, OPS.iff.fn] },
      { heads: ["~p", "~p ⇒ q"], fns: [(p) => !p, (p, q) => OPS.imp.fn(!p, q)] },
    ][item.set];
    return truthTable(["p", "q", ...S.heads], ROWS2.map(([p, q]) => [p, q, ...S.fns.map((f) => f(p, q))]), S.heads.map((_, i) => i + 2));
  },
  worked() {
    return worked(truthTable(["p", "q", "p ⇒ q"], ROWS2.map(([p, q]) => [p, q, !p || q]), []) +
      say("“If it rains, the ground is wet.” Rain and a dry ground (T then F) breaks the promise. Without rain the promise says nothing, so it is not broken: T."));
  },
  key(item) {
    const S = [
      [OPS.imp.fn, (p, q) => OPS.imp.fn(q, p)],
      [OPS.imp.fn, OPS.iff.fn],
      [(p) => !p, (p, q) => OPS.imp.fn(!p, q)],
    ][item.set];
    return ROWS2.flatMap(([p, q]) => S.map((f) => wantTF(f(p, q))));
  },
  answer(item) {
    return [["p ⇒ q, q ⇒ p", "p ⇒ q, p ⇔ q", "~p, ~p ⇒ q"][item.set]];
  },
};

/* ═══ GATES ════════════════════════════════════════════════════════════════*/

const GATE = {
  AND: (a, b) => a & b,
  OR: (a, b) => a | b,
  NAND: (a, b) => 1 - (a & b),
  NOR: (a, b) => 1 - (a | b),
  XOR: (a, b) => a ^ b,
};

/** One gate's symbol, its output at (x + 22, y). */
function gateSym(kind, x, y) {
  /* each gate in its own colour, the same as the pieces on the board */
  const P = PIECES[kind] || { col: "#2a2723", tint: "#fffdf8" };
  const s = `stroke="${P.col}" stroke-width="0.6" fill="${P.tint}"`;
  const bubble = (cx) => `<circle cx="${cx}" cy="${y}" r="1.3" ${s}/>`;
  if (kind === "NOT") return `<path d="M${x} ${y - 5}L${x + 16} ${y}L${x} ${y + 5}Z" ${s}/>` + bubble(x + 17.3);
  const and = `<path d="M${x} ${y - 7}H${x + 9}A7 7 0 0 1 ${x + 9} ${y + 7}H${x}Z" ${s}/>`;
  const or = `<path d="M${x} ${y - 7}Q${x + 12} ${y - 7} ${x + 18} ${y}Q${x + 12} ${y + 7} ${x} ${y + 7}Q${x + 4} ${y} ${x} ${y - 7}Z" ${s}/>`;
  const xor = `<path d="M${x - 2.4} ${y - 7}Q${x + 1.6} ${y} ${x - 2.4} ${y + 7}" fill="none" stroke="${P.col}" stroke-width="0.6"/>`;
  if (kind === "AND") return and;
  if (kind === "NAND") return and + bubble(x + 17.3);
  if (kind === "OR") return or;
  if (kind === "NOR") return or + bubble(x + 19.3);
  return or + xor; // XOR
}
const outX = (kind, x) => x + (kind === "NAND" ? 18.6 : kind === "NOR" ? 20.6 : kind === "NOT" ? 18.6 : kind === "AND" ? 16 : 18);
const wire = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}H${(x1 + x2) / 2}V${y2}H${x2}" fill="none" stroke="#2a2723" stroke-width="0.45"/>`;
const lab = (x, y, t, anchor = "end", w = 700) => `<text x="${x}" y="${y + 1.3}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" font-size="3.6" font-weight="${w}" fill="#2a2723">${t}</text>`;
const gname = (kind, x, y) => `<text x="${x + 7}" y="${y + 1.1}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.4" font-weight="800" fill="${(PIECES[kind] || {}).col || "#6f685f"}">${kind}</text>`;

/**
 * A circuit: { g1, g2?, not? } — g1 joins A and B; g2 (if any) joins that
 * with C; `not` puts a NOT on the end. Inputs may be labelled with values.
 */
function circuitSvg(c, vals = null) {
  const W = 120, H = c.g2 ? 40 : 30;
  let s = "";
  const yA = 8, yB = 22, yC = 34;
  const g1x = 22, g1y = 15;
  s += lab(10, yA, vals ? `A = ${vals.A}` : "A") + lab(10, yB, vals ? `B = ${vals.B}` : "B");
  s += wire(12, yA, g1x, g1y - 4) + wire(12, yB, g1x, g1y + 4);
  s += gateSym(c.g1, g1x, g1y) + gname(c.g1, g1x, g1y);
  let ox = outX(c.g1, g1x), oy = g1y;
  if (c.g2) {
    const g2x = 62, g2y = 24;
    s += lab(10, yC, vals ? `C = ${vals.C}` : "C");
    s += wire(ox, oy, g2x, g2y - 4) + wire(12, yC, g2x, g2y + 4);
    s += gateSym(c.g2, g2x, g2y) + gname(c.g2, g2x, g2y);
    ox = outX(c.g2, g2x); oy = g2y;
  }
  if (c.not) {
    const nx = ox + 8;
    s += wire(ox, oy, nx, oy) + gateSym("NOT", nx, oy);
    ox = outX("NOT", nx);
  }
  s += wire(ox, oy, W - 14, oy) + lab(W - 12, oy, "Q", "start");
  return `<svg class="lg-circuit" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" role="img" aria-label="A logic circuit">${s}</svg>`;
}
function run(c, A, B, C) {
  let v = GATE[c.g1](A, B);
  if (c.g2) v = GATE[c.g2](v, C);
  if (c.not) v = 1 - v;
  return v;
}
function circuitOf(r, o) {
  const t = tier(o);
  const kinds = t === "gentle" ? ["AND", "OR"] : ["AND", "OR", "NAND", "NOR"];
  const c = { g1: r.pick(kinds) };
  if (t !== "gentle" && r.chance(0.5)) c.g2 = r.pick(["AND", "OR"]);
  if (t !== "gentle" && !c.g2 && r.chance(0.5)) c.not = true;
  if (t === "stretch" && r.chance(0.4)) c.not = true;
  return c;
}

const lgOut = {
  id: "lg-out",
  group: "lg-gates",
  label: "What comes out",
  blurb: "Follow the 1s and 0s through each gate.",
  heading: "Logic gates: what comes out?",
  instruction: () =>
    "1 means on (true), 0 means off (false). AND gives 1 only if both inputs are 1. OR gives 1 if either is. " +
    "NOT turns 1 into 0 and 0 into 1. A small circle on a gate's output is a NOT: NAND is NOT AND, NOR is NOT OR. " +
    "Work through the circuit from the left and write what comes out at Q.",
  cols: 1,
  defaultCount: 4,
  make(r, o) {
    const c = circuitOf(r, o);
    return { c, A: r.int(0, 1), B: r.int(0, 1), C: r.int(0, 1) };
  },
  render(item) {
    return `<div class="lg-art">${circuitSvg(item.c, item)}</div>` + ask(`Q = ${box()}`);
  },
  worked() {
    return worked(`<div class="lg-art">${circuitSvg({ g1: "AND", not: true }, { A: 1, B: 0 })}</div>` +
      say("AND with 1 and 0 gives 0 (not both are on). The NOT turns that 0 into 1, so Q = 1."));
  },
  key(item) {
    return [want.num(run(item.c, item.A, item.B, item.C))];
  },
  answer(item) {
    return [`Q = ${run(item.c, item.A, item.B, item.C)}`];
  },
};

const lgTable = {
  id: "lg-table",
  group: "lg-gates",
  label: "The circuit's truth table",
  blurb: "Every row of inputs, and what comes out of each.",
  heading: "Logic gates: the whole truth table",
  instruction: () =>
    "Put every row of inputs through the circuit and write Q, 0 or 1. With two inputs there are four rows; with " +
    "three (A, B and C), eight.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { c: circuitOf(r, o) };
  },
  render(item) {
    const three = !!item.c.g2;
    const rows = three ? [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [k >> 2 & 1, k >> 1 & 1, k & 1]) : [[0, 0], [0, 1], [1, 0], [1, 1]];
    const head = three ? ["A", "B", "C", "Q"] : ["A", "B", "Q"];
    const body = rows.map((rw) => `<tr>${rw.map((v) => `<td>${v}</td>`).join("")}<td>${box()}</td></tr>`).join("");
    return `<div class="lg-side"><div class="lg-art">${circuitSvg(item.c)}</div>` +
      `<table class="lg-table wb-nomath"><thead><tr>${head.map((h, i) => `<th${i === head.length - 1 ? ' class="lg-ask"' : ""}>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
  },
  key(item) {
    const three = !!item.c.g2;
    const rows = three ? [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [k >> 2 & 1, k >> 1 & 1, k & 1]) : [[0, 0], [0, 1], [1, 0], [1, 1]];
    return rows.map(([A, B, C]) => want.num(run(item.c, A, B, C ?? 0)));
  },
  answer(item) {
    const three = !!item.c.g2;
    const rows = three ? [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [k >> 2 & 1, k >> 1 & 1, k & 1]) : [[0, 0], [0, 1], [1, 0], [1, 1]];
    return [rows.map(([A, B, C]) => run(item.c, A, B, C ?? 0)).join(" ")];
  },
};

const NAMES = ["AND", "OR", "NAND", "NOR", "XOR"];

const lgName = {
  id: "lg-name",
  group: "lg-gates",
  label: "Name the gate",
  blurb: "Its truth table says which gate it is.",
  heading: "Logic gates: which gate is it?",
  hardest: true,
  instruction: () =>
    "Read the Q column. One 1, at the bottom (both inputs on): AND. Only one 0, at the top: OR. NAND and NOR are " +
    "those turned over. 1 when the inputs DIFFER: XOR (exclusive or).",
  cols: 2,
  defaultCount: 4,
  make(r) {
    return { g: r.int(0, NAMES.length - 1) };
  },
  render(item) {
    const f = GATE[NAMES[item.g]];
    const body = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => `<tr><td>${a}</td><td>${b}</td><td>${f(a, b)}</td></tr>`).join("");
    return `<table class="lg-table wb-nomath"><thead><tr><th>A</th><th>B</th><th>Q</th></tr></thead><tbody>${body}</tbody></table>` +
      ask(`This is ${tick(...NAMES)}`);
  },
  key(item) {
    return [want.tick(item.g)];
  },
  answer(item) {
    return [NAMES[item.g]];
  },
};


/* ═══ BUILD THE LOGIC PATH ═════════════════════════════════════════════════*/

/** The gates in the tray, by level. */
const trayOf = (o) => (tier(o) === "gentle" ? ["AND", "OR", "NOT"] : tier(o) === "middle" ? ["AND", "OR", "NOT", "XOR", "NAND", "NOR"] : ["AND", "OR", "NOT", "XOR", "NAND", "NOR", "XNOR"]);
const twoWire = (tray) => tray.filter((g) => PIECES[g].two);

/** The table a circuit must match: the switches' columns, and Q given or to fill. */
function targetTable(layout, target, { fill = false } = {}) {
  const rows = settings(layout);
  const names = Object.keys(rows[0]);
  const body = rows.map((sw, i) => `<tr>${names.map((n) => `<td>${sw[n]}</td>`).join("")}<td>${fill ? box() : target[i]}</td></tr>`).join("");
  return `<table class="lg-table"><thead><tr>${names.map((n) => `<th>${n}</th>`).join("")}<th class="lg-ask">Q</th></tr></thead><tbody>${body}</tbody></table>`;
}
/** What a two-switch table says in words. */
const WORDS2 = {
  "0001": "only when BOTH switches are on", "0111": "when AT LEAST ONE switch is on", "1110": "unless both switches are on",
  "1000": "only when both switches are OFF", "0110": "when exactly ONE switch is on", "1001": "when the two switches are the SAME",
  "0100": "only when A is off and B is on", "0010": "only when A is on and B is off", "1011": "unless A is off and B is on",
  "1101": "unless A is on and B is off", "0011": "whenever A is on", "0101": "whenever B is on", "1100": "whenever A is off", "1010": "whenever B is off",
};
const board = (layout, tray) => gatesBoardHtml({ layout, palette: tray });

const lbMeet = {
  id: "lb-meet",
  group: "lg-build",
  label: "Meet the gates",
  blurb: "Drop a gate in, flip the switches, write what the bulb does.",
  heading: "Build it: meet the gates",
  instruction: () =>
    "Each gate has its own colour. Put the named gate into the empty place — on screen, drag it from the tray " +
    "(or tap it, then tap the place); on paper, draw it. Then try every setting of the two switches and write " +
    "what the bulb does: 1 for ON, 0 for off.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const tray = trayOf(o);
    return { tray, g: r.pick(twoWire(tray)) };
  },
  render(item) {
    return ask(`Put in the <strong>${item.g}</strong> gate, then fill in its table.`) +
      `<div class="lg-side">${board("one", item.tray)}${targetTable("one", null, { fill: true })}</div>`;
  },
  worked() {
    return worked(say("With the AND gate in: both switches off, the bulb is off (0). Only A on: off. Only B on: off. " +
      "Both on: the bulb lights (1). So Q is 0, 0, 0, 1."));
  },
  key(item) {
    const target = tableOf("one", { g1: item.g });
    return [want.gates({ layout: "one", target, says: `the ${item.g} gate` }), ...target.map((v) => want.num(v))];
  },
  answer(item) {
    return [`${item.g}: Q = ${tableOf("one", { g1: item.g }).join(" ")}`];
  },
};

const lbFind = {
  id: "lb-find",
  group: "lg-build",
  label: "Which gate lights it like this?",
  blurb: "A table to match: find the one gate that does it.",
  heading: "Build it: match the table",
  instruction: () =>
    "The table says what the bulb must do for each setting of the switches. Find the ONE gate that does exactly " +
    "that: put a gate in, flip the switches, and compare with the table. Change the gate until every row agrees.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const tray = trayOf(o);
    return { tray, g: r.pick(twoWire(tray)) };
  },
  render(item) {
    const target = tableOf("one", { g1: item.g });
    return ask(`The bulb must light ${WORDS2[target.join("")]}.`) +
      `<div class="lg-side">${board("one", item.tray)}${targetTable("one", target)}</div>`;
  },
  key(item) {
    const target = tableOf("one", { g1: item.g });
    return [want.gates({ layout: "one", target, says: `the ${item.g} gate` })];
  },
  answer(item) {
    return [item.g];
  },
};

const BASIC = ["AND", "OR", "NOT"];

const lbCombine = {
  id: "lb-combine",
  group: "lg-build",
  label: "Combine AND, OR and NOT",
  blurb: "Only three gates in the tray: make the others from them.",
  heading: "Build it: two gates together",
  instruction: () =>
    "Now the tray has only AND, OR and NOT — but two places. A NOT after a gate turns its answer over; a NOT " +
    "before it turns one switch over. (A one-wire place may be left empty: then it is just a wire.) Build a path " +
    "that lights the bulb exactly as the table says, and test every row with the switches.",
  cols: 1,
  defaultCount: 2,
  make(r) {
    const layout = r.pick(["then-not", "not-in"]);
    const g = r.pick(["AND", "OR"]);
    const slots = layout === "then-not" ? { g1: g, g2: "NOT" } : { g1: "NOT", g2: g };
    return { layout, slots };
  },
  render(item) {
    const target = tableOf(item.layout, item.slots);
    return ask(`The bulb must light ${WORDS2[target.join("")]}.`) +
      `<div class="lg-side">${board(item.layout, BASIC)}${targetTable(item.layout, target)}</div>`;
  },
  worked() {
    return worked(say("“Only when both switches are OFF”: an OR gives 1 when at least one is on — the exact opposite. " +
      "So put an OR first and a NOT after it: the NOT turns every answer over."));
  },
  key(item) {
    const target = tableOf(item.layout, item.slots);
    return [want.gates({ layout: item.layout, target, says: Object.values(item.slots).join(" then ") })];
  },
  answer(item) {
    return [item.layout === "then-not" ? `${item.slots.g1}, then NOT` : `NOT on A, then ${item.slots.g2}`];
  },
};

const lbThree = {
  id: "lb-three",
  group: "lg-build",
  label: "Three switches, two gates",
  blurb: "One gate feeds the next: (A AND B) OR C.",
  heading: "Build it: three switches",
  hardest: true,
  instruction: () =>
    "Three switches and two gates in a row: the first gate takes A and B, and its answer goes into the second " +
    "gate with C. Build the path, test it with the switches, and then answer the question about one setting. " +
    "At Stretch there is no expression — only the table to match.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const pool = twoWire(trayOf(o));
    const slots = { g1: r.pick(pool), g2: r.pick(pool) };
    const sw = { A: r.int(0, 1), B: r.int(0, 1), C: r.int(0, 1) };
    return { tray: trayOf(o), slots, sw, bare: tier(o) === "stretch" };
  },
  render(item) {
    const { slots, sw } = item;
    const target = tableOf("two", slots);
    const lead = item.bare ? "Build a path that matches the table." : `Build Q = (A ${slots.g1} B) ${slots.g2} C.`;
    return ask(lead) + `<div class="lg-side">${board("two", item.tray)}${item.bare ? targetTable("two", target) : ""}</div>` +
      ask(`With A = ${sw.A}, B = ${sw.B} and C = ${sw.C}, Q = ${box()}`);
  },
  key(item) {
    const target = tableOf("two", item.slots);
    const k = item.sw.A * 4 + item.sw.B * 2 + item.sw.C;
    return [want.gates({ layout: "two", target, says: `(A ${item.slots.g1} B) ${item.slots.g2} C` }), want.num(target[k])];
  },
  answer(item) {
    const target = tableOf("two", item.slots);
    return [`(A ${item.slots.g1} B) ${item.slots.g2} C; Q = ${target[item.sw.A * 4 + item.sw.B * 2 + item.sw.C]}`];
  },
};

export const LG_EXERCISES = [lgBasic, lgCompound, lgImplies, lgOut, lgTable, lgName, lbMeet, lbFind, lbCombine, lbThree];
