/* ============================================================================
   THE SCIENTIFIC CALCULATOR — one of them, for the whole site
   ----------------------------------------------------------------------------
   The keypad, the display and the key handling, lifted out of the chemistry
   bench (virtual-lab/chemistry-2d/js/desk.js) so that the bench and the
   workbook rail are the SAME calculator rather than two that drift apart.
   The arithmetic underneath it was already shared-able and is left where it
   is: virtual-lab/chemistry-2d/js/calc.js — pure, testable in node, no eval.

   WHAT STAYED WITH THE BENCH. The things that are about the bench and not
   about calculators: being dragged around the bench top, the key on the bench
   toolbar that opens it, and where on the bench it was left. Those are passed
   in, or simply not used, by whoever mounts this.

   THEMING. The markup keeps its `cl-` class names — they are what the bench's
   stylesheet already paints, and renaming them would churn a working feature
   for nothing. A second skin is a class on the wrapper
   (`cl-calc--paper` for the workbook's paper pages), not a second component.

   THREE MODES, one machine. COMP is everything the fx-82 always did. MAT
   replaces the keypad with two matrices (up to 3×3) and the arithmetic
   done on them. GRAPH keeps the SAME keypad — a function in x is typed the
   same way any expression always was — and adds a plot above it; "=" draws
   instead of computing a single number. d/dx, an integral and SOLVE stay
   IN comp mode rather than earning a mode of their own: each is "type an
   expression in x, press the key, answer one or two numeric prompts",
   which is what typing already is, not a different machine.

     const calc = mountCalculator(host, { state, onChange, onClose, theme });
     calc.paint();          // after showing it
     calc.press("7");       // if something else needs to press a key
   ========================================================================== */

import {
  evaluate, format, fraction, show, CalcError,
  derivative, integral, solve,
  matAdd, matSub, matMul, matScale, matTranspose, matDet, matInverse,
  niceTicks,
} from "/virtual-lab/chemistry-2d/js/calc.js";
import { UI } from "/utils/components/ui-icons.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* [ what it types , its face , its SHIFT function , the face of that , kind ] */
const FN = [
  ["SHIFT", "SHIFT", null, "", "shift"], ["MODE", "DRG", null, "", "fn"], ["^-1", "x⁻¹", "!", "x!", "fn"],
  ["^2", "x²", "^3", "x³", "fn"], ["^", "xʸ", "abs(", "Abs", "fn"], ["sqrt(", "√", "cbrt(", "∛", "fn"],
  ["log(", "log", "10^(", "10ˣ", "fn"], ["ln(", "ln", "e^(", "eˣ", "fn"], ["sin(", "sin", "asin(", "sin⁻¹", "fn"],
  ["cos(", "cos", "acos(", "cos⁻¹", "fn"], ["tan(", "tan", "atan(", "tan⁻¹", "fn"], ["neg", "(−)", null, "", "fn"],
  ["(", "(", null, "", "fn"], [")", ")", null, "", "fn"], ["pi", "π", "e", "e", "fn"],
  ["C", "nCr", "P", "nPr", "fn"], ["%", "%", null, "", "fn"], ["SD", "S⇔D", null, "", "fn"],
  ["M+", "M+", "M-", "M−", "fn"], ["MR", "MR", "MC", "MC", "fn"], ["NA", "Nₐ", null, "", "fn"],
  ["R", "R", null, "", "fn"], ["F", "F", null, "", "fn"], ["Vm", "Vₘ", "Vr", "Vᵣ", "fn"],
  ["x", "x", null, "", "fn"], ["DX", "d/dx", "INTEG", "∫dx", "fn"], ["SOLVE", "SOLVE", null, "", "fn"],
  ["HIST", "HIST", "CLRHIST", "Clr All", "fn"], ["MAT", "MAT", "GRAPH", "GRAPH", "mode"],
];

const NUM = [
  ["7", "7"], ["8", "8"], ["9", "9"], ["DEL", "DEL", "del"], ["AC", "AC", "del"],
  ["4", "4"], ["5", "5"], ["6", "6"], ["*", "×"], ["/", "÷"],
  ["1", "1"], ["2", "2"], ["3", "3"], ["+", "+"], ["-", "−"],
  ["0", "0"], [".", "."], ["EXP", "×10ˣ"], ["Ans", "Ans"], ["=", "="],
];

/** Typed on the keyboard, while the calculator has the focus. "x" is left
    off this list on purpose: it already means × (multiply), typed either
    way, and that habit matters more than a shortcut for the variable. */
const TYPED = {
  "*": "*", x: "*", X: "*", "/": "/", "+": "+", "-": "-", "^": "^", "(": "(", ")": ")",
  ".": ".", ",": ".", "!": "!", "%": "%", Enter: "=", "=": "=", Backspace: "DEL", Delete: "AC",
  e: "EXP", E: "EXP", p: "pi", s: "sin(", c: "cos(", t: "tan(", l: "log(", n: "ln(", r: "sqrt(",
};

const OPS = ["+", "-", "*", "/", "^", "^2", "^3", "^-1", "!", "%", "C", "P"];

/** A result's own rough shape, so history shows it the way the screen did. */
const say = (v) => format(v);

/** An empty n×n matrix, as the four cells of a brand-new machine are. */
const zeros = (n) => Array.from({ length: n }, () => Array(n).fill(0));

/**
 * Put a calculator in `el`.
 *
 *   state     { deg, mem, ans, hist, matA, matB, matN } — kept by the caller
 *   onChange  called whenever any of that changes
 *   onClose   what the × does; omit it and no × is drawn (a panel has its own)
 *   brand     what it says on the top, for pages that want their own machine
 *   theme     an extra class on the wrapper ("paper" for the workbook pages)
 * → { el, press, paint, keys }
 */
export function mountCalculator(el, { state = null, onChange = () => {}, onClose = null, brand = "PREP <b>fx-82</b>", theme = "" } = {}) {
  const C = state || { deg: true, mem: 0, ans: 0 };
  /* an older saved machine has none of these — a calculator is still a
     calculator without a history or a matrix ever having been touched */
  if (!Array.isArray(C.hist)) C.hist = [];
  if (!C.matN) C.matN = 2;
  if (!Array.isArray(C.matA)) C.matA = zeros(3);
  if (!Array.isArray(C.matB)) C.matB = zeros(3);

  /**
   * TWO CASES, AND THE CHILD CHOOSES. The machine comes in the dark grey of
   * the thing on a desk and in the workbook's paper, and which one a page
   * hands it is a guess about the page, not about the person using it — one
   * reads better on a bright screen, the other in a dark room. So the case is
   * a key on the machine itself, and the choice is kept for next time.
   */
  let skin = theme;
  try { skin = localStorage.getItem("pp-calc-skin") ?? theme; } catch { /* a private window keeps the page's own */ }
  const wear = () => {
    el.classList.toggle("cl-calc--paper", skin === "paper");
    el.querySelector("[data-calc-skin]")?.setAttribute("aria-pressed", String(skin === "paper"));
  };

  el.innerHTML = `
    <div class="cl-calc__top" data-calc-drag>
      <span class="cl-calc__brand">${brand}</span>
      <span class="cl-calc__solar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <button type="button" class="cl-key cl-key--skin" data-calc-skin aria-pressed="false"
              aria-label="Change the colour of the calculator" data-tip="Change its colour" data-tip-side="down">
        <span class="cl-calc__swatch" aria-hidden="true"></span></button>
      ${onClose ? `<button type="button" class="cl-key cl-key--x" data-calc-close aria-label="Put the calculator away">${UI.close(12)}</button>` : ""}
    </div>
    <div class="cl-calc__lcd" role="status" aria-live="polite">
      <div class="cl-calc__flags"><span data-flag="S">S</span><span data-flag="M">M</span><span data-flag="D">D</span><span data-flag="R">R</span></div>
      <div class="cl-calc__expr" data-calc-expr></div>
      <div class="cl-calc__out" data-calc-out>0</div>
    </div>
    <div class="cl-calc__hist" data-calc-hist hidden></div>
    <div class="cl-calc__graph" data-calc-graph hidden>
      <svg class="cl-calc__gsvg" data-calc-gsvg viewBox="0 0 240 150" aria-hidden="true"></svg>
      <div class="cl-calc__gtools">
        <button type="button" class="cl-key cl-key--g" data-g="in" aria-label="Zoom in" data-tip="Zoom in">+</button>
        <button type="button" class="cl-key cl-key--g" data-g="out" aria-label="Zoom out" data-tip="Zoom out">−</button>
        <button type="button" class="cl-key cl-key--g" data-g="reset" aria-label="Reset the view" data-tip="Reset the view">⟲</button>
      </div>
    </div>
    <div class="cl-calc__mat" data-calc-mat hidden></div>
    <div class="cl-calc__fn" data-calc-fn>${FN.map(([k, face, sk, sface, kind]) =>
      `<span class="cl-calc__cell"><em>${sface}</em><button type="button" class="cl-key cl-key--${kind}" data-k="${esc(k)}"${sk ? ` data-s="${esc(sk)}"` : ""} aria-label="${esc(face)}${sface ? `; with shift, ${esc(sface)}` : ""}">${face}</button></span>`).join("")}</div>
    <div class="cl-calc__num" data-calc-num>${NUM.map(([k, face, kind]) =>
      `<button type="button" class="cl-key cl-key--${kind || (k === "=" ? "eq" : "num")}" data-k="${esc(k)}" aria-label="${k === "*" ? "times" : k === "/" ? "divided by" : esc(face)}">${face}</button>`).join("")}</div>`;

  let keys = [];            // the expression being typed
  let shift = false;
  let shown = null;         // the result on the bottom line: { v } or { err }
  let asFrac = false;
  let mode = "comp";         // "comp" | "graph" — MAT is its own thing below
  let ask = null;            // { kind: "dx" | "integ" | "solve", fn, stage, a }
  let histOpen = false;
  let view = { x0: -10, x1: 10, y0: null, y1: null };   // null y = auto-fit
  const exprEl = el.querySelector("[data-calc-expr]");
  const outEl = el.querySelector("[data-calc-out]");
  const histEl = el.querySelector("[data-calc-hist]");
  const graphEl = el.querySelector("[data-calc-graph]");
  const gsvg = el.querySelector("[data-calc-gsvg]");
  const matEl = el.querySelector("[data-calc-mat]");
  const fnEl = el.querySelector("[data-calc-fn]");
  const numEl = el.querySelector("[data-calc-num]");
  wear();

  /* ── the small label a prompt wears while it waits for a number ──────── */
  function askLabel(a) {
    const fn = show(a.fn);
    if (a.kind === "dx") return `d/dx(${fn}), x=`;
    if (a.kind === "solve") return `Solve ${fn}=0, x≈`;
    if (a.kind === "integ") return a.stage === 0 ? `∫(${fn})dx, a=` : `∫(${fn})dx, b=`;
    return "";
  }

  function paint() {
    exprEl.textContent = (ask ? askLabel(ask) : "") + show(keys);
    exprEl.scrollLeft = exprEl.scrollWidth;
    if (shown && shown.err) outEl.textContent = shown.err;
    else if (shown) {
      const fr = asFrac ? fraction(shown.v) : null;
      outEl.textContent = fr ? `${fr.n < 0 ? "−" : ""}${Math.abs(fr.n)}⁄${fr.d}` : format(shown.v);
    } else outEl.textContent = keys.length ? "" : "0";
    el.querySelector('[data-flag="S"]').classList.toggle("is-on", shift);
    el.querySelector('[data-flag="M"]').classList.toggle("is-on", C.mem !== 0);
    el.querySelector('[data-flag="D"]').classList.toggle("is-on", C.deg);
    el.querySelector('[data-flag="R"]').classList.toggle("is-on", !C.deg);
    el.classList.toggle("is-shift", shift);
    el.classList.toggle("is-asking", !!ask);
    el.classList.toggle("is-mat", mode === "mat");
    el.classList.toggle("is-graph", mode === "graph");
    graphEl.hidden = mode !== "graph";
    matEl.hidden = mode !== "mat";
    fnEl.hidden = mode === "mat";
    numEl.hidden = mode === "mat";
    if (mode === "graph") drawGraph();
  }

  /** Added to the tape, newest first, capped so a long session does not
      grow the saved state without bound. */
  function remember(expr, out) {
    C.hist.unshift({ expr, out });
    if (C.hist.length > 30) C.hist.length = 30;
  }

  function run() {
    try {
      const v = evaluate(keys, { deg: C.deg, ans: C.ans });
      C.ans = v; shown = { v };
      remember(show(keys), say(v));
    } catch (e) { shown = { err: e instanceof CalcError ? e.message : "Math ERROR" }; }
    asFrac = false;
    onChange(C);
  }

  /** A number, as the keys that would type it. */
  function numKeys(v) {
    const [mant, ex] = Math.abs(v).toString().split("e");
    const out = [...(v < 0 ? ["neg"] : []), ...mant.split("")];
    if (ex !== undefined) out.push("EXP", ...(Number(ex) < 0 ? ["neg"] : []), ...String(Math.abs(Number(ex))).split(""));
    return out;
  }

  /** The number the prompt's own keys type, or null if there is nothing
      sound typed yet (SOLVE is allowed to start from nothing — Ans, or 0). */
  function promptValue() {
    if (!keys.length) return null;
    try { return evaluate(keys, { deg: C.deg, ans: C.ans }); } catch { return null; }
  }

  function finishAsk() {
    const v = promptValue();
    if (ask.kind === "integ" && ask.stage === 0) {
      if (v == null) return;
      ask.a = v; ask.stage = 1; keys = []; shown = null; paint();
      return;
    }
    const guess = v == null ? (ask.kind === "solve" ? C.ans : null) : v;
    if (guess == null) return;
    try {
      let out, label;
      if (ask.kind === "dx") { out = derivative(ask.fn, guess, { deg: C.deg }); label = `d/dx(${show(ask.fn)}) at x=${say(guess)}`; }
      else if (ask.kind === "solve") { out = solve(ask.fn, guess, { deg: C.deg }); label = `Solve ${show(ask.fn)}=0`; }
      else { out = integral(ask.fn, ask.a, guess, { deg: C.deg }); label = `∫(${show(ask.fn)})dx, ${say(ask.a)}→${say(guess)}`; }
      C.ans = out; shown = { v: out };
      remember(label, say(out));
    } catch (e) { shown = { err: e instanceof CalcError ? e.message : "Math ERROR" }; }
    ask = null; keys = []; asFrac = false;
    onChange(C);
  }

  function press(k) {
    if (k === "SHIFT") { shift = !shift; paint(); return; }
    shift = false;
    if (k === "AC") { keys = []; shown = null; ask = null; }
    else if (k === "DEL") { if (ask && !keys.length) ask = null; else if (shown) shown = null; else keys.pop(); }
    else if (k === "=") {
      if (ask) finishAsk();
      else if (mode === "graph") { if (keys.length) drawGraph(); }
      else if (keys.length) run();
    }
    else if (k === "MODE") { C.deg = !C.deg; if (shown && !shown.err && keys.length) run(); onChange(C); }
    else if (k === "SD") { if (shown && !shown.err) asFrac = !asFrac; }
    else if (k === "M+" || k === "M-") {
      if (keys.length && !shown) run();
      if (shown && !shown.err) { C.mem += (k === "M+" ? 1 : -1) * shown.v; onChange(C); }
    } else if (k === "MC") { C.mem = 0; onChange(C); }
    else if (k === "MR") { if (shown) { keys = []; shown = null; } keys.push(...numKeys(C.mem)); }
    else if (k === "HIST") { histOpen = !histOpen; paintHist(); return; }
    else if (k === "CLRHIST") { C.hist = []; onChange(C); paintHist(); return; }
    else if (k === "DX" || k === "INTEG") {
      if (!ask && keys.length) { ask = { kind: k === "DX" ? "dx" : "integ", fn: keys.slice(), stage: 0 }; keys = []; shown = null; }
    }
    else if (k === "SOLVE") {
      if (!ask && keys.length) { ask = { kind: "solve", fn: keys.slice() }; keys = []; shown = null; }
    }
    else if (k === "MAT" || k === "GRAPH") {
      const next = k === "MAT" ? "mat" : "graph";
      mode = mode === next ? "comp" : next;
      keys = []; shown = null; ask = null;
      paintMat();
    }
    else {
      /* after a result, an operator carries on from it (Ans), anything else starts again */
      if (shown) { keys = !shown.err && !ask && OPS.includes(k) ? ["Ans"] : []; shown = null; }
      if (keys.length < 120) keys.push(k);
    }
    paint();
  }

  /* ── history: the tape, newest on top ─────────────────────────────────── */
  function paintHist() {
    histEl.hidden = !histOpen;
    el.classList.toggle("is-hist-open", histOpen);
    if (!histOpen) return;
    histEl.innerHTML = C.hist.length
      ? `<div class="cl-calc__histlist">${C.hist.map((h, i) =>
          `<button type="button" class="pp-plain cl-calc__histrow" data-hist="${i}"><span>${esc(h.expr)}</span><b>${esc(h.out)}</b></button>`).join("")}</div>`
      : `<p class="cl-calc__histnone">Nothing worked out yet.</p>`;
  }
  histEl.addEventListener("click", (e) => {
    const i = Number(e.target.closest("[data-hist]")?.dataset.hist);
    if (!Number.isInteger(i) || !C.hist[i]) return;
    const v = Number(C.hist[i].out.replace(/−/g, "-").replace(/×10\^/, "e"));
    if (Number.isFinite(v)) { C.ans = v; onChange(C); }
    keys = []; shown = Number.isFinite(v) ? { v } : null;
    histOpen = false;
    paintHist();
    paint();
  });

  /* ── graphing: the same keypad types f(x); "=" draws it ───────────────── */
  function drawGraph() {
    const W = 240, H = 150, L = 24, R = 6, T = 8, B = 16;
    gsvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    if (!keys.length) { gsvg.innerHTML = ""; return; }
    const N = 140;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const xv = view.x0 + ((view.x1 - view.x0) * i) / N;
      let yv;
      try { yv = evaluate(keys, { deg: C.deg, ans: C.ans, vars: { x: xv } }); } catch { yv = null; }
      pts.push(Number.isFinite(yv) ? [xv, yv] : null);
    }
    const finite = pts.filter(Boolean);
    if (!finite.length) { gsvg.innerHTML = `<text class="cl-g-num" x="${W / 2}" y="${H / 2}" text-anchor="middle">No graph</text>`; return; }
    let y0 = view.y0, y1 = view.y1;
    if (y0 == null || y1 == null) {
      const ys = finite.map((p) => p[1]);
      const lo = Math.min(...ys), hi = Math.max(...ys);
      const pad = (hi - lo) * 0.12 || 1;
      y0 = lo - pad; y1 = hi + pad;
    }
    const X = niceTicks(view.x0, view.x1, 5);
    const Y = niceTicks(y0, y1, 5);
    const px = (xv) => L + ((xv - X.lo) / (X.hi - X.lo)) * (W - L - R);
    const py = (yv) => H - B - ((yv - Y.lo) / (Y.hi - Y.lo)) * (H - T - B);
    const f = (n) => n.toFixed(1);
    let grid = `<rect class="cl-g-paper" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}"/>`;
    for (const t of X.ticks) grid += `<path class="cl-g-bold" d="M${f(px(t))} ${T}V${H - B}"/>`;
    for (const t of Y.ticks) grid += `<path class="cl-g-bold" d="M${L} ${f(py(t))}H${W - R}"/>`;
    /* the axes themselves, where nought actually falls, not just the edge */
    const axisX = Y.lo <= 0 && Y.hi >= 0 ? py(0) : null;
    const axisY = X.lo <= 0 && X.hi >= 0 ? px(0) : null;
    let axes = "";
    if (axisX != null) axes += `<path class="cl-g-axis" d="M${L} ${f(axisX)}H${W - R}"/>`;
    if (axisY != null) axes += `<path class="cl-g-axis" d="M${f(axisY)} ${T}V${H - B}"/>`;
    let path = "";
    let open = false;
    pts.forEach((p) => {
      if (!p) { open = false; return; }
      const [xv, yv] = p;
      if (yv < Y.lo - (Y.hi - Y.lo) || yv > Y.hi + (Y.hi - Y.lo)) { open = false; return; }
      path += `${open ? "L" : "M"}${f(px(xv))} ${f(py(yv))}`;
      open = true;
    });
    gsvg.innerHTML = `${grid}${axes}<path class="cl-g-line" d="${path}"/>`;
  }
  el.querySelector("[data-calc-graph]").addEventListener("click", (e) => {
    const g = e.target.closest("[data-g]")?.dataset.g;
    if (!g) return;
    const midX = (view.x0 + view.x1) / 2, spanX = view.x1 - view.x0;
    if (g === "reset") view = { x0: -10, x1: 10, y0: null, y1: null };
    else {
      const k2 = g === "in" ? 0.7 : 1 / 0.7;
      view = { x0: midX - (spanX * k2) / 2, x1: midX + (spanX * k2) / 2, y0: null, y1: null };
    }
    drawGraph();
  });

  /* ── matrices, up to 3×3 ───────────────────────────────────────────────── */
  function matCellsHtml(which, n) {
    const m = which === "A" ? C.matA : C.matB;
    let out = "";
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
      out += `<input class="cl-mat__cell" type="text" inputmode="decimal" data-mat="${which}" data-i="${i}" data-j="${j}" value="${m[i][j] === 0 ? "" : m[i][j]}" aria-label="${which}, row ${i + 1}, column ${j + 1}">`;
    return out;
  }
  function matGridHtml(v) {
    if (!v) return "";
    const n = v.length;
    return `<div class="cl-mat__out" style="--n:${n}">${v.map((row) => row.map((x) => `<span>${say(x)}</span>`).join("")).join("")}</div>`;
  }
  function paintMat(resultHtml = "") {
    const n = C.matN;
    matEl.innerHTML = `
      <div class="cl-mat__size">
        <button type="button" class="pp-plain cl-mat__sz${n === 2 ? " is-on" : ""}" data-n="2">2×2</button>
        <button type="button" class="pp-plain cl-mat__sz${n === 3 ? " is-on" : ""}" data-n="3">3×3</button>
        <button type="button" class="pp-plain cl-mat__back" data-mop="comp" aria-label="Back to the ordinary keypad">← COMP</button>
      </div>
      <div class="cl-mat__pair">
        <div class="cl-mat__one"><b>A</b><div class="cl-mat__grid" style="--n:${n}">${matCellsHtml("A", n)}</div></div>
        <div class="cl-mat__one"><b>B</b><div class="cl-mat__grid" style="--n:${n}">${matCellsHtml("B", n)}</div></div>
      </div>
      <div class="cl-mat__ops">
        <button type="button" class="cl-key cl-key--fn" data-mop="add">A+B</button>
        <button type="button" class="cl-key cl-key--fn" data-mop="sub">A−B</button>
        <button type="button" class="cl-key cl-key--fn" data-mop="mul">A×B</button>
        <button type="button" class="cl-key cl-key--fn" data-mop="mulr">B×A</button>
        <button type="button" class="cl-key cl-key--fn" data-mop="detA">det A</button>
        <button type="button" class="cl-key cl-key--fn" data-mop="detB">det B</button>
        <button type="button" class="cl-key cl-key--fn" data-mop="invA">A⁻¹</button>
        <button type="button" class="cl-key cl-key--fn" data-mop="invB">B⁻¹</button>
        <button type="button" class="cl-key cl-key--fn" data-mop="trA">Aᵀ</button>
        <button type="button" class="cl-key cl-key--fn" data-mop="trB">Bᵀ</button>
        <button type="button" class="cl-key cl-key--del" data-mop="clr">CLR</button>
      </div>
      <div class="cl-mat__result" data-mat-result>${resultHtml}</div>`;
  }
  function cut(A, n) { return A.slice(0, n).map((r) => r.slice(0, n)); }
  matEl.addEventListener("click", (e) => {
    const sz = e.target.closest("[data-n]")?.dataset.n;
    if (sz) { C.matN = Number(sz); onChange(C); paintMat(); return; }
    const op = e.target.closest("[data-mop]")?.dataset.mop;
    if (!op) return;
    if (op === "comp") { mode = "comp"; paint(); return; }
    const n = C.matN, A = cut(C.matA, n), B = cut(C.matB, n);
    try {
      let result = "";
      if (op === "clr") { C.matA = zeros(3); C.matB = zeros(3); onChange(C); paintMat(); return; }
      else if (op === "add") result = matGridHtml(matAdd(A, B));
      else if (op === "sub") result = matGridHtml(matSub(A, B));
      else if (op === "mul") result = matGridHtml(matMul(A, B));
      else if (op === "mulr") result = matGridHtml(matMul(B, A));
      else if (op === "detA") result = `<p class="cl-mat__scalar">det A = ${say(matDet(A))}</p>`;
      else if (op === "detB") result = `<p class="cl-mat__scalar">det B = ${say(matDet(B))}</p>`;
      else if (op === "invA") result = matGridHtml(matInverse(A));
      else if (op === "invB") result = matGridHtml(matInverse(B));
      else if (op === "trA") result = matGridHtml(matTranspose(A));
      else if (op === "trB") result = matGridHtml(matTranspose(B));
      el.querySelector("[data-mat-result]").innerHTML = result;
    } catch (err) {
      el.querySelector("[data-mat-result]").innerHTML = `<p class="cl-mat__scalar is-err">${esc(err instanceof CalcError ? err.message : "Math ERROR")}</p>`;
    }
  });
  matEl.addEventListener("input", (e) => {
    const which = e.target.dataset.mat;
    if (!which) return;
    const i = Number(e.target.dataset.i), j = Number(e.target.dataset.j);
    const v = Number(e.target.value);
    const m = which === "A" ? C.matA : C.matB;
    m[i][j] = Number.isFinite(v) ? v : 0;
    onChange(C);
  });

  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-calc-skin]")) {
      skin = skin === "paper" ? "" : "paper";
      try { localStorage.setItem("pp-calc-skin", skin); } catch { /* not kept */ }
      wear();
      return;
    }
    if (onClose && e.target.closest("[data-calc-close]")) { onClose(); return; }
    const b = e.target.closest("[data-k]");
    if (!b) return;
    press(shift && b.dataset.s ? b.dataset.s : b.dataset.k);
  });

  el.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Escape" && onClose) { onClose(); return; }
    /* a REAL <input> — a matrix cell — types for itself; this is only for
       the keypad's own shortcuts, and preventDefault() below was eating
       every digit a child tried to type into a cell before it landed */
    if (e.target.tagName === "INPUT") return;
    const k = /^\d$/.test(e.key) ? e.key : TYPED[e.key];
    /* while the calculator is being typed on, a letter is not one of the
       host page's shortcuts */
    e.stopPropagation();
    if (!k) return;
    e.preventDefault();
    press(k);
  });

  paint();
  paintMat();
  return { el, press, paint, get keys() { return keys.slice(); } };
}
