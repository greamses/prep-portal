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
   replaces the keypad with two matrices — EACH its OWN rows × columns, not a
   shared size, because a real matrix problem is rarely two squares the same
   size — and the arithmetic done on them. GRAPH keeps the comp keypad under
   it and adds a plot above it.

   NO EXPRESSION IS EVER TYPED for a function. GRAPH, SOLVE and d/dx ⁄ ∫ all
   work off ONE shared function (`C.fn`): pick a FAMILY (y = ax+b, a
   quadratic, a cubic, a/x+b, a·sin(bx+c)…) and type only its numbers — the
   way a real calculator's EQN mode does it, not a line of algebra typed
   character by character. FX opens that family-and-numbers editor; GRAPH
   plots whatever it currently says; d/dx, ∫ and SOLVE ask one or two numeric
   prompts and work on it, confirmed with "=" the same way everything else
   always was.

     const calc = mountCalculator(host, { state, onChange, onClose, theme });
     calc.paint();          // after showing it
     calc.press("7");       // if something else needs to press a key
   ========================================================================== */

import {
  evaluate, format, fraction, show, CalcError,
  derivative, integral, solve,
  matAdd, matSub, matMul, matScale, matTranspose, matDet, matInverse,
  fracSimplify, fracAdd, fracSub, fracMul, fracDiv,
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
  ["FX", "f(x)", null, "", "fn"], ["DX", "d/dx", "INTEG", "∫dx", "fn"], ["SOLVE", "SOLVE", null, "", "fn"],
  ["HIST", "HIST", "CLRHIST", "Clr All", "fn"], ["MAT", "MAT", "GRAPH", "GRAPH", "mode"],
  ["MORE", "MORE", null, "", "mode"],
];

/** The machines MORE opens — each its own mode, same as MAT/GRAPH, just
    reached through a list instead of a dedicated key: there is no room left
    on the keypad for one key per machine, and a list is how a real
    calculator's own MODE menu grows past the first handful anyway. */
const MORE_MODES = [
  { id: "sys", label: "Systems of equations" },
  { id: "frac", label: "Algebraic fractions" },
  { id: "base", label: "Number bases" },
];

const NUM = [
  ["7", "7"], ["8", "8"], ["9", "9"], ["DEL", "DEL", "del"], ["AC", "AC", "del"],
  ["4", "4"], ["5", "5"], ["6", "6"], ["*", "×"], ["/", "÷"],
  ["1", "1"], ["2", "2"], ["3", "3"], ["+", "+"], ["-", "−"],
  ["0", "0"], [".", "."], ["EXP", "×10ˣ"], ["Ans", "Ans"], ["=", "="],
];

/** Typed on the keyboard, while the calculator has the focus. */
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

/* ── THE FAMILIES — every function GRAPH, SOLVE and d/dx ⁄ ∫ can know, named
   by its SHAPE and typed in as plain numbers, the way an EQN mode does it.
   `fn(coef, x, deg)` is the family's own formula, nothing cleverer. */
const FAMILIES = {
  linear: { label: "y = ax + b", coefs: ["a", "b"], fn: (c, x) => c[0] * x + c[1] },
  quad: { label: "y = ax² + bx + c", coefs: ["a", "b", "c"], fn: (c, x) => c[0] * x * x + c[1] * x + c[2] },
  cubic: { label: "y = ax³ + bx² + cx + d", coefs: ["a", "b", "c", "d"], fn: (c, x) => c[0] * x ** 3 + c[1] * x * x + c[2] * x + c[3] },
  recip: { label: "y = a/x + b", coefs: ["a", "b"], fn: (c, x) => (x === 0 ? NaN : c[0] / x + c[1]) },
  trig: { label: "y = a·sin(bx + c)", coefs: ["a", "b", "c"], fn: (c, x, deg) => c[0] * Math.sin((c[1] * x + c[2]) * (deg ? Math.PI / 180 : 1)) },
};
const FAM_ORDER = ["linear", "quad", "cubic", "recip", "trig"];

/** The family's own formula, with its numbers actually in it. */
function famExpr(f) {
  const c = f.coef, n = (i) => say(c[i]);
  if (f.family === "linear") return `${n(0)}x + ${n(1)}`;
  if (f.family === "quad") return `${n(0)}x² + ${n(1)}x + ${n(2)}`;
  if (f.family === "cubic") return `${n(0)}x³ + ${n(1)}x² + ${n(2)}x + ${n(3)}`;
  if (f.family === "recip") return `${n(0)}/x + ${n(1)}`;
  return `${n(0)}·sin(${n(1)}x + ${n(2)})`;
}
/** The same, as it is printed in the editor and above the graph — WITH the
    "y =" in front, which "Solve …=0" and "d/dx(…)" below say for themselves
    and would otherwise say twice. */
const famLabel = (f) => `y = ${famExpr(f)}`;

/** Where f(x) = 0, in the family's own terms — a straight line and a
    quadratic are solved exactly (and a quadratic can have two answers, both
    given); anything else falls back to the general numeric SOLVE. */
function solveFamily(f, guess, deg) {
  const c = f.coef;
  if (f.family === "linear") {
    if (c[0] === 0) throw new CalcError(c[1] === 0 ? "Infinite Solutions" : "No Solution");
    return [-c[1] / c[0]];
  }
  if (f.family === "quad") {
    const [a, b, cc] = c;
    if (a === 0) return solveFamily({ family: "linear", coef: [b, cc] }, guess, deg);
    const disc = b * b - 4 * a * cc;
    if (disc < 0) throw new CalcError("No Real Solution");
    if (Math.abs(disc) < 1e-12) return [-b / (2 * a)];
    const sq = Math.sqrt(disc);
    return [(-b + sq) / (2 * a), (-b - sq) / (2 * a)];
  }
  if (f.family === "recip") {
    const [a, b] = c;
    if (b === 0) throw new CalcError(a === 0 ? "Infinite Solutions" : "No Solution");
    return [-a / b];
  }
  return [solve((xv) => FAMILIES[f.family].fn(c, xv, deg), guess)];
}

/**
 * Put a calculator in `el`.
 *
 *   state     { deg, mem, ans, hist, fn, matA, matB, matAR/AC/BR/BC }
 *   onChange  called whenever any of that changes
 *   onClose   what the × does; omit it and no × is drawn (a panel has its own)
 *   brand     what it says on the top, for pages that want their own machine
 *   theme     an extra class on the wrapper ("paper" for the workbook pages)
 * → { el, press, paint, keys }
 */
export function mountCalculator(el, { state = null, onChange = () => {}, onClose = null, brand = "PREP <b>fx-82</b>", theme = "" } = {}) {
  const C = state || { deg: true, mem: 0, ans: 0 };
  /* an older saved machine has none of these — a calculator is still a
     calculator without a history or a matrix or a function ever touched */
  if (!Array.isArray(C.hist)) C.hist = [];
  if (!C.fn || !FAMILIES[C.fn.family]) C.fn = { family: "linear", coef: [1, 0] };
  if (!C.matAR) C.matAR = 2; if (!C.matAC) C.matAC = 2;
  if (!C.matBR) C.matBR = 2; if (!C.matBC) C.matBC = 2;
  if (!Array.isArray(C.matA)) C.matA = zeros(3);
  if (!Array.isArray(C.matB)) C.matB = zeros(3);
  if (!C.sys || !Array.isArray(C.sys.rows)) C.sys = { n: 2, rows: zeros(3).map((r) => [...r, 0]) };
  if (!C.frac) C.frac = { a: { n: 1, d: 2 }, b: { n: 1, d: 3 } };
  if (!C.base) C.base = { active: "A", baseIn: 10, a: 0, b: 0 };

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
    <div class="cl-calc__func" data-calc-func hidden></div>
    <div class="cl-calc__graph" data-calc-graph hidden>
      <svg class="cl-calc__gsvg" data-calc-gsvg viewBox="0 0 240 150" aria-hidden="true"></svg>
      <div class="cl-calc__gtools">
        <button type="button" class="cl-key cl-key--g" data-g="in" aria-label="Zoom in" data-tip="Zoom in">+</button>
        <button type="button" class="cl-key cl-key--g" data-g="out" aria-label="Zoom out" data-tip="Zoom out">−</button>
        <button type="button" class="cl-key cl-key--g" data-g="reset" aria-label="Reset the view" data-tip="Reset the view">⟲</button>
      </div>
    </div>
    <div class="cl-calc__mat" data-calc-mat hidden></div>
    <div class="cl-calc__more" data-calc-more hidden></div>
    <div class="cl-calc__sys" data-calc-sys hidden></div>
    <div class="cl-calc__frac" data-calc-frac hidden></div>
    <div class="cl-calc__base" data-calc-base hidden></div>
    <div class="cl-calc__fn" data-calc-fn>${FN.map(([k, face, sk, sface, kind]) =>
      `<span class="cl-calc__cell"><em>${sface}</em><button type="button" class="cl-key cl-key--${kind}" data-k="${esc(k)}"${sk ? ` data-s="${esc(sk)}"` : ""} aria-label="${esc(face)}${sface ? `; with shift, ${esc(sface)}` : ""}">${face}</button></span>`).join("")}</div>
    <div class="cl-calc__num" data-calc-num>${NUM.map(([k, face, kind]) =>
      `<button type="button" class="cl-key cl-key--${kind || (k === "=" ? "eq" : "num")}" data-k="${esc(k)}" aria-label="${k === "*" ? "times" : k === "/" ? "divided by" : esc(face)}">${face}</button>`).join("")}</div>`;

  let keys = [];            // the expression being typed (plain numbers only now)
  let shift = false;
  let shown = null;         // the result on the bottom line: { v, multi? } or { err }
  let asFrac = false;
  let mode = "comp";         // "comp" | "graph" — MAT is its own thing below
  let ask = null;            // { kind: "dx" | "integ" | "solve", stage, a }
  let histOpen = false;
  let funcOpen = false;
  let moreOpen = false;
  let view = { x0: -10, x1: 10, y0: null, y1: null };   // null y = auto-fit
  const exprEl = el.querySelector("[data-calc-expr]");
  const outEl = el.querySelector("[data-calc-out]");
  const histEl = el.querySelector("[data-calc-hist]");
  const funcEl = el.querySelector("[data-calc-func]");
  const graphEl = el.querySelector("[data-calc-graph]");
  const gsvg = el.querySelector("[data-calc-gsvg]");
  const matEl = el.querySelector("[data-calc-mat]");
  const moreEl = el.querySelector("[data-calc-more]");
  const sysEl = el.querySelector("[data-calc-sys]");
  const fracEl = el.querySelector("[data-calc-frac]");
  const baseEl = el.querySelector("[data-calc-base]");
  const fnEl = el.querySelector("[data-calc-fn]");
  const numEl = el.querySelector("[data-calc-num]");
  wear();

  /* ── the small label a prompt wears while it waits for a number ──────── */
  function askLabel(a) {
    const lbl = famExpr(C.fn);
    if (a.kind === "dx") return `d/dx(${lbl}), x=`;
    if (a.kind === "solve") return `Solve ${lbl}=0, x≈`;
    if (a.kind === "integ") return a.stage === 0 ? `∫(${lbl})dx, a=` : `∫(${lbl})dx, b=`;
    return "";
  }

  function paint() {
    exprEl.textContent = (ask ? askLabel(ask) : "") + show(keys);
    exprEl.scrollLeft = exprEl.scrollWidth;
    if (shown && shown.err) outEl.textContent = shown.err;
    else if (shown && shown.multi) outEl.textContent = shown.multi.map(say).join("  or  ");
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
    const gridMode = mode === "mat" || mode === "sys" || mode === "frac" || mode === "base";
    el.classList.toggle("is-mat", mode === "mat");
    el.classList.toggle("is-graph", mode === "graph");
    el.classList.toggle("is-sys", mode === "sys");
    el.classList.toggle("is-frac", mode === "frac");
    el.classList.toggle("is-base", mode === "base");
    graphEl.hidden = mode !== "graph";
    matEl.hidden = mode !== "mat";
    sysEl.hidden = mode !== "sys";
    fracEl.hidden = mode !== "frac";
    baseEl.hidden = mode !== "base";
    fnEl.hidden = gridMode;
    numEl.hidden = gridMode;
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
    const lbl = famExpr(C.fn);
    try {
      if (ask.kind === "dx") {
        const out = derivative((xv) => FAMILIES[C.fn.family].fn(C.fn.coef, xv, C.deg), guess);
        C.ans = out; shown = { v: out };
        remember(`d/dx(${lbl}) at x=${say(guess)}`, say(out));
      } else if (ask.kind === "solve") {
        const roots = solveFamily(C.fn, guess, C.deg);
        C.ans = roots[0]; shown = roots.length > 1 ? { v: roots[0], multi: roots } : { v: roots[0] };
        remember(`Solve ${lbl}=0`, roots.map(say).join(" or "));
      } else {
        const out = integral((xv) => FAMILIES[C.fn.family].fn(C.fn.coef, xv, C.deg), ask.a, guess);
        C.ans = out; shown = { v: out };
        remember(`∫(${lbl})dx, ${say(ask.a)}→${say(guess)}`, say(out));
      }
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
      else if (keys.length) run();
    }
    else if (k === "MODE") { C.deg = !C.deg; if (shown && !shown.err && keys.length) run(); onChange(C); }
    else if (k === "SD") { if (shown && !shown.err && !shown.multi) asFrac = !asFrac; }
    else if (k === "M+" || k === "M-") {
      if (keys.length && !shown) run();
      if (shown && !shown.err) { C.mem += (k === "M+" ? 1 : -1) * shown.v; onChange(C); }
    } else if (k === "MC") { C.mem = 0; onChange(C); }
    else if (k === "MR") { if (shown) { keys = []; shown = null; } keys.push(...numKeys(C.mem)); }
    else if (k === "HIST") { histOpen = !histOpen; if (histOpen) funcOpen = false; paintHist(); paintFunc(); return; }
    else if (k === "CLRHIST") { C.hist = []; onChange(C); paintHist(); return; }
    else if (k === "FX") { funcOpen = !funcOpen; if (funcOpen) histOpen = false; paintFunc(); paintHist(); return; }
    else if (k === "DX" || k === "INTEG") {
      if (!ask) { ask = { kind: k === "DX" ? "dx" : "integ", stage: 0 }; keys = []; shown = null; }
    }
    else if (k === "SOLVE") {
      if (!ask) { ask = { kind: "solve" }; keys = []; shown = null; }
    }
    else if (k === "MAT" || k === "GRAPH") {
      const next = k === "MAT" ? "mat" : "graph";
      mode = mode === next ? "comp" : next;
      keys = []; shown = null; ask = null;
      paintMat();
    }
    else if (k === "MORE") { moreOpen = !moreOpen; paintMore(); return; }
    else {
      /* after a result, an operator carries on from it (Ans), anything else starts again */
      if (shown) { keys = !shown.err && !shown.multi && !ask && OPS.includes(k) ? ["Ans"] : []; shown = null; }
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
    const v = Number(C.hist[i].out.split(" or ")[0].replace(/−/g, "-").replace(/×10\^/, "e"));
    if (Number.isFinite(v)) { C.ans = v; onChange(C); }
    keys = []; shown = Number.isFinite(v) ? { v } : null;
    histOpen = false;
    paintHist();
    paint();
  });

  /* ── f(x): a family, and only its numbers typed in ────────────────────── */
  function paintFunc() {
    funcEl.hidden = !funcOpen;
    el.classList.toggle("is-func-open", funcOpen);
    if (!funcOpen) return;
    const F = FAMILIES[C.fn.family];
    funcEl.innerHTML = `
      <div class="cl-func__fam">${FAM_ORDER.map((id) =>
        `<button type="button" class="pp-plain cl-func__famkey${id === C.fn.family ? " is-on" : ""}" data-fam="${id}">${FAMILIES[id].label}</button>`).join("")}</div>
      <div class="cl-func__coefs">${F.coefs.map((name, i) =>
        `<label class="cl-func__coef"><span>${name}</span><input type="text" inputmode="decimal" data-coef="${i}" value="${C.fn.coef[i] ?? 0}"></label>`).join("")}</div>
      <p class="cl-func__live" data-func-live>${esc(famLabel(C.fn))}</p>`;
  }
  funcEl.addEventListener("click", (e) => {
    const fam = e.target.closest("[data-fam]")?.dataset.fam;
    if (!fam || fam === C.fn.family) return;
    const n = FAMILIES[fam].coefs.length;
    /* whatever was already typed carries over, slot for slot; a slot with
       nothing in it yet defaults to 1 for "a" (so switching family never
       hands back the flat, forgettable y = 0 line) and 0 for the rest */
    const coef = Array.from({ length: n }, (_, i) => C.fn.coef[i] ?? (i === 0 ? 1 : 0));
    C.fn = { family: fam, coef };
    onChange(C);
    paintFunc();
    if (mode === "graph") drawGraph();
  });
  funcEl.addEventListener("input", (e) => {
    const i = Number(e.target.dataset.coef);
    if (!Number.isInteger(i)) return;
    const v = Number(e.target.value);
    C.fn.coef[i] = Number.isFinite(v) ? v : 0;
    onChange(C);
    const live = el.querySelector("[data-func-live]");
    if (live) live.textContent = famLabel(C.fn);
    if (mode === "graph") drawGraph();
  });

  /* ── graphing: f(x) is whatever the family editor currently says ─────── */
  function drawGraph() {
    const W = 240, H = 150, L = 24, R = 6, T = 8, B = 16;
    gsvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const famFn = FAMILIES[C.fn.family].fn, coef = C.fn.coef;
    const N = 140;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const xv = view.x0 + ((view.x1 - view.x0) * i) / N;
      const yv = famFn(coef, xv, C.deg);
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

  /* ── matrices — A and B each their own rows × columns, up to 3×3 ───────── */
  function matCellsHtml(which, rows, cols) {
    const m = which === "A" ? C.matA : C.matB;
    let out = "";
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++)
      out += `<input class="cl-mat__cell" type="text" inputmode="decimal" data-mat="${which}" data-i="${i}" data-j="${j}" value="${m[i][j] === 0 ? "" : m[i][j]}" aria-label="${which}, row ${i + 1}, column ${j + 1}">`;
    return out;
  }
  function matGridHtml(v) {
    if (!v) return "";
    const cols = v[0].length;
    return `<div class="cl-mat__out" style="--cols:${cols}">${v.map((row) => row.map((x) => `<span>${say(x)}</span>`).join("")).join("")}</div>`;
  }
  function dimPicker(which, axis, cur) {
    return [1, 2, 3].map((v) =>
      `<button type="button" class="pp-plain cl-mat__dimbtn${v === cur ? " is-on" : ""}" data-dim="${which}${axis}" data-v="${v}">${v}</button>`).join("");
  }
  function paintMat(resultHtml = "") {
    matEl.innerHTML = `
      <div class="cl-mat__dims">
        <div class="cl-mat__dimrow"><b>A</b><span class="cl-mat__rc">${dimPicker("A", "r", C.matAR)}</span><i>×</i><span class="cl-mat__rc">${dimPicker("A", "c", C.matAC)}</span></div>
        <div class="cl-mat__dimrow"><b>B</b><span class="cl-mat__rc">${dimPicker("B", "r", C.matBR)}</span><i>×</i><span class="cl-mat__rc">${dimPicker("B", "c", C.matBC)}</span></div>
        <button type="button" class="pp-plain cl-mat__back" data-mop="comp" aria-label="Back to the ordinary keypad">← COMP</button>
      </div>
      <div class="cl-mat__pair">
        <div class="cl-mat__one"><b>A</b><div class="cl-mat__grid" style="--cols:${C.matAC}">${matCellsHtml("A", C.matAR, C.matAC)}</div></div>
        <div class="cl-mat__one"><b>B</b><div class="cl-mat__grid" style="--cols:${C.matBC}">${matCellsHtml("B", C.matBR, C.matBC)}</div></div>
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
  function cut(A, rows, cols) { return A.slice(0, rows).map((r) => r.slice(0, cols)); }
  matEl.addEventListener("click", (e) => {
    const dim = e.target.closest("[data-dim]")?.dataset.dim;
    if (dim) {
      const v = Number(e.target.dataset.v);
      if (dim === "Ar") C.matAR = v; else if (dim === "Ac") C.matAC = v;
      else if (dim === "Br") C.matBR = v; else if (dim === "Bc") C.matBC = v;
      onChange(C); paintMat();
      return;
    }
    const op = e.target.closest("[data-mop]")?.dataset.mop;
    if (!op) return;
    if (op === "comp") { mode = "comp"; paint(); return; }
    const A = cut(C.matA, C.matAR, C.matAC), B = cut(C.matB, C.matBR, C.matBC);
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

  /* ── MORE — the list of machines there was no key left to give its own ── */
  function paintMore() {
    moreEl.hidden = !moreOpen;
    el.classList.toggle("is-more-open", moreOpen);
    if (!moreOpen) return;
    moreEl.innerHTML = `<div class="cl-calc__morelist">${MORE_MODES.map((m) =>
      `<button type="button" class="pp-plain cl-calc__morerow" data-moreto="${m.id}">${esc(m.label)}</button>`).join("")}</div>`;
  }
  moreEl.addEventListener("click", (e) => {
    const to = e.target.closest("[data-moreto]")?.dataset.moreto;
    if (!to) return;
    moreOpen = false;
    mode = to;
    keys = []; shown = null; ask = null;
    paintMore();
    if (to === "sys") paintSys();
    else if (to === "frac") paintFrac();
    else if (to === "base") paintBase();
    paint();
  });

  /* ── systems of equations — each row typed as plain coefficients,
     solved exactly the way the matrix's own A⁻¹ already can: the answer IS
     A⁻¹ times the column of constants, no different a sum than any other
     the matrix panel already does. */
  function sysCellsHtml(n) {
    const vars = ["x", "y", "z"];
    let out = "";
    for (let r = 0; r < n; r++) {
      out += `<div class="cl-sys__row">`;
      for (let j = 0; j < n; j++) {
        out += `${j ? `<span>+</span>` : ""}<input class="cl-sys__cell" type="text" inputmode="decimal" data-sys="${r}" data-j="${j}"`
          + ` value="${C.sys.rows[r][j] === 0 ? "" : C.sys.rows[r][j]}" aria-label="row ${r + 1}, coefficient of ${vars[j]}"><i>${vars[j]}</i>`;
      }
      out += `<span>=</span><input class="cl-sys__cell" type="text" inputmode="decimal" data-sys="${r}" data-j="${n}"`
        + ` value="${C.sys.rows[r][n] === 0 ? "" : C.sys.rows[r][n]}" aria-label="row ${r + 1}, constant"></div>`;
    }
    return out;
  }
  function paintSys(resultHtml = "") {
    const n = C.sys.n;
    sysEl.innerHTML = `
      <div class="cl-mat__dims">
        <div class="cl-mat__dimrow"><i>unknowns</i>
          <span class="cl-mat__rc">${[2, 3].map((v) => `<button type="button" class="pp-plain cl-mat__dimbtn${v === n ? " is-on" : ""}" data-sysn="${v}" aria-label="${v} unknowns">${v}</button>`).join("")}</span>
          <button type="button" class="pp-plain cl-mat__back" data-sop="comp" aria-label="Back to the ordinary keypad">← COMP</button>
        </div>
      </div>
      <div class="cl-sys__eqs">${sysCellsHtml(n)}</div>
      <button type="button" class="cl-key cl-key--eq cl-sys__go" data-sop="solve">SOLVE</button>
      <div class="cl-mat__result" data-sys-result>${resultHtml}</div>`;
  }
  sysEl.addEventListener("click", (e) => {
    const sn = e.target.closest("[data-sysn]")?.dataset.sysn;
    if (sn) { C.sys.n = Number(sn); onChange(C); paintSys(); return; }
    const sop = e.target.closest("[data-sop]")?.dataset.sop;
    if (!sop) return;
    if (sop === "comp") { mode = "comp"; paint(); return; }
    const n = C.sys.n;
    const vars = ["x", "y", "z"];
    try {
      const A = C.sys.rows.slice(0, n).map((r) => r.slice(0, n));
      const b = C.sys.rows.slice(0, n).map((r) => [r[n]]);
      const x = matMul(matInverse(A), b).map((r) => r[0]);
      sysEl.querySelector("[data-sys-result]").innerHTML = `<p class="cl-mat__scalar">${x.map((v, i) => `${vars[i]}=${say(v)}`).join("   ")}</p>`;
    } catch {
      sysEl.querySelector("[data-sys-result]").innerHTML = `<p class="cl-mat__scalar is-err">No Unique Solution</p>`;
    }
  });
  sysEl.addEventListener("input", (e) => {
    const r = Number(e.target.dataset.sys);
    if (!Number.isInteger(r)) return;
    const j = Number(e.target.dataset.j);
    const v = Number(e.target.value);
    C.sys.rows[r][j] = Number.isFinite(v) ? v : 0;
    onChange(C);
  });

  /* ── algebraic fractions — kept EXACT, never rounded to a decimal and
     back; S⇔D on the ordinary keypad only ever approximates a decimal
     that is already on screen, which is a different thing from doing the
     arithmetic itself in fractions. */
  function fracPart(which) { return C.frac[which.toLowerCase()]; }
  function fracOneHtml(which) {
    const f = fracPart(which);
    return `<div class="cl-frac__one"><b>${which}</b>
      <input class="cl-frac__cell" type="text" inputmode="decimal" data-frac="${which}" data-part="n" value="${f.n}" aria-label="${which}, numerator">
      <i>⁄</i>
      <input class="cl-frac__cell" type="text" inputmode="decimal" data-frac="${which}" data-part="d" value="${f.d}" aria-label="${which}, denominator"></div>`;
  }
  function fracShow(f) { return `${f.n < 0 ? "−" : ""}${Math.abs(f.n)}⁄${f.d}`; }
  function paintFrac(resultHtml = "") {
    fracEl.innerHTML = `
      <div class="cl-mat__dims"><span></span><button type="button" class="pp-plain cl-mat__back" data-fop="comp" aria-label="Back to the ordinary keypad">← COMP</button></div>
      <div class="cl-frac__pair">${fracOneHtml("A")}${fracOneHtml("B")}</div>
      <div class="cl-mat__ops">
        <button type="button" class="cl-key cl-key--fn" data-fop="add">A+B</button>
        <button type="button" class="cl-key cl-key--fn" data-fop="sub">A−B</button>
        <button type="button" class="cl-key cl-key--fn" data-fop="mul">A×B</button>
        <button type="button" class="cl-key cl-key--fn" data-fop="div">A÷B</button>
        <button type="button" class="cl-key cl-key--fn" data-fop="simpA">Simplify A</button>
        <button type="button" class="cl-key cl-key--fn" data-fop="simpB">Simplify B</button>
        <button type="button" class="cl-key cl-key--fn" data-fop="decA">A→decimal</button>
        <button type="button" class="cl-key cl-key--fn" data-fop="decB">B→decimal</button>
      </div>
      <div class="cl-mat__result" data-frac-result>${resultHtml}</div>`;
  }
  fracEl.addEventListener("click", (e) => {
    const op = e.target.closest("[data-fop]")?.dataset.fop;
    if (!op) return;
    if (op === "comp") { mode = "comp"; paint(); return; }
    const out = fracEl.querySelector("[data-frac-result]");
    try {
      const A = fracPart("A"), B = fracPart("B");
      if (op === "add") out.innerHTML = `<p class="cl-mat__scalar">${fracShow(fracAdd(A, B))}</p>`;
      else if (op === "sub") out.innerHTML = `<p class="cl-mat__scalar">${fracShow(fracSub(A, B))}</p>`;
      else if (op === "mul") out.innerHTML = `<p class="cl-mat__scalar">${fracShow(fracMul(A, B))}</p>`;
      else if (op === "div") out.innerHTML = `<p class="cl-mat__scalar">${fracShow(fracDiv(A, B))}</p>`;
      else if (op === "simpA") { C.frac.a = fracSimplify(A.n, A.d); onChange(C); paintFrac(out.innerHTML); }
      else if (op === "simpB") { C.frac.b = fracSimplify(B.n, B.d); onChange(C); paintFrac(out.innerHTML); }
      else if (op === "decA") out.innerHTML = `<p class="cl-mat__scalar">${say(A.n / A.d)}</p>`;
      else if (op === "decB") out.innerHTML = `<p class="cl-mat__scalar">${say(B.n / B.d)}</p>`;
    } catch (err) {
      out.innerHTML = `<p class="cl-mat__scalar is-err">${esc(err instanceof CalcError ? err.message : "Math ERROR")}</p>`;
    }
  });
  fracEl.addEventListener("input", (e) => {
    const which = e.target.dataset.frac, part = e.target.dataset.part;
    if (!which || !part) return;
    const v = Number(e.target.value);
    C.frac[which.toLowerCase()][part] = Number.isFinite(v) ? Math.round(v) : (part === "d" ? 1 : 0);
    onChange(C);
  });

  /* ── number bases — two registers, typed in whichever base is picked,
     read back in all four at once */
  const BASE_DIGITS = "0123456789ABCDEF";
  function baseStr(v, r) { return (v < 0 ? "-" : "") + Math.abs(Math.trunc(v)).toString(r).toUpperCase(); }
  function paintBase(resultHtml = "") {
    const active = C.base.active, radix = C.base.baseIn;
    baseEl.innerHTML = `
      <div class="cl-mat__dims">
        <span class="cl-mat__rc">${[["BIN", 2], ["OCT", 8], ["DEC", 10], ["HEX", 16]].map(([lab, r]) =>
          `<button type="button" class="pp-plain cl-base__basebtn${r === radix ? " is-on" : ""}" data-basein="${r}">${lab}</button>`).join("")}</span>
        <button type="button" class="pp-plain cl-mat__back" data-bop="comp" aria-label="Back to the ordinary keypad">← COMP</button>
      </div>
      <div class="cl-base__regs">
        <button type="button" class="pp-plain cl-base__reg${active === "A" ? " is-on" : ""}" data-basereg="A"><b>A</b> <span>${baseStr(C.base.a, radix)}</span></button>
        <button type="button" class="pp-plain cl-base__reg${active === "B" ? " is-on" : ""}" data-basereg="B"><b>B</b> <span>${baseStr(C.base.b, radix)}</span></button>
      </div>
      <div class="cl-base__pad">${BASE_DIGITS.split("").map((d, i) =>
        `<button type="button" class="pp-plain cl-base__digit" data-basedig="${d}"${i >= radix ? " disabled" : ""}>${d}</button>`).join("")}
        <button type="button" class="pp-plain cl-base__digit cl-base__clr" data-basedig="AC">AC</button></div>
      <div class="cl-mat__ops">
        <button type="button" class="cl-key cl-key--fn" data-bop="add">A+B</button>
        <button type="button" class="cl-key cl-key--fn" data-bop="sub">A−B</button>
        <button type="button" class="cl-key cl-key--fn" data-bop="mul">A×B</button>
        <button type="button" class="cl-key cl-key--fn" data-bop="div">A÷B</button>
        <button type="button" class="cl-key cl-key--fn" data-bop="and">AND</button>
        <button type="button" class="cl-key cl-key--fn" data-bop="or">OR</button>
        <button type="button" class="cl-key cl-key--fn" data-bop="xor">XOR</button>
        <button type="button" class="cl-key cl-key--fn" data-bop="not">NOT A</button>
      </div>
      <div class="cl-mat__result" data-base-result>${resultHtml}</div>`;
  }
  function baseAssign(v) {
    C.base[C.base.active === "A" ? "a" : "b"] = v;
    onChange(C);
  }
  baseEl.addEventListener("click", (e) => {
    const bi = e.target.closest("[data-basein]")?.dataset.basein;
    if (bi) { C.base.baseIn = Number(bi); onChange(C); paintBase(); return; }
    const reg = e.target.closest("[data-basereg]")?.dataset.basereg;
    if (reg) { C.base.active = reg; onChange(C); paintBase(); return; }
    const dig = e.target.closest("[data-basedig]")?.dataset.basedig;
    if (dig) {
      const cur = C.base.active === "A" ? C.base.a : C.base.b;
      if (dig === "AC") baseAssign(0);
      else {
        const next = cur * C.base.baseIn + BASE_DIGITS.indexOf(dig);
        if (Number.isSafeInteger(next)) baseAssign(next);
      }
      paintBase();
      return;
    }
    const bop = e.target.closest("[data-bop]")?.dataset.bop;
    if (!bop) return;
    if (bop === "comp") { mode = "comp"; paint(); return; }
    const A = C.base.a, B = C.base.b, r = C.base.baseIn;
    const out = baseEl.querySelector("[data-base-result]");
    try {
      let v;
      if (bop === "add") v = A + B;
      else if (bop === "sub") v = A - B;
      else if (bop === "mul") v = A * B;
      else if (bop === "div") { if (!B) throw new CalcError("Math ERROR"); v = Math.trunc(A / B); }
      else if (bop === "and") v = A & B;
      else if (bop === "or") v = A | B;
      else if (bop === "xor") v = A ^ B;
      else v = ~A;
      out.innerHTML = `<p class="cl-mat__scalar">${baseStr(v, r)}</p>`;
    } catch (err) {
      out.innerHTML = `<p class="cl-mat__scalar is-err">${esc(err instanceof CalcError ? err.message : "Math ERROR")}</p>`;
    }
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
    /* a REAL <input> — a matrix cell, a coefficient — types for itself; this
       is only for the keypad's own shortcuts, and preventDefault() below was
       eating every digit a child tried to type into one before it landed */
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
  paintSys();
  paintFrac();
  paintBase();
  return { el, press, paint, get keys() { return keys.slice(); } };
}
