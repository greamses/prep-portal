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

     const calc = mountCalculator(host, { state, onChange, onClose, theme });
     calc.paint();          // after showing it
     calc.press("7");       // if something else needs to press a key
   ========================================================================== */

import { evaluate, format, fraction, show, CalcError } from "/virtual-lab/chemistry-2d/js/calc.js";
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

/**
 * Put a calculator in `el`.
 *
 *   state     { deg, mem, ans } — kept by the caller, so a page can remember it
 *   onChange  called whenever any of that changes
 *   onClose   what the × does; omit it and no × is drawn (a panel has its own)
 *   brand     what it says on the top, for pages that want their own machine
 *   theme     an extra class on the wrapper ("paper" for the workbook pages)
 * → { el, press, paint, keys }
 */
export function mountCalculator(el, { state = null, onChange = () => {}, onClose = null, brand = "PREP <b>fx-82</b>", theme = "" } = {}) {
  const C = state || { deg: true, mem: 0, ans: 0 };
  if (theme) el.classList.add(`cl-calc--${theme}`);

  el.innerHTML = `
    <div class="cl-calc__top" data-calc-drag>
      <span class="cl-calc__brand">${brand}</span>
      <span class="cl-calc__solar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      ${onClose ? `<button type="button" class="cl-key cl-key--x" data-calc-close aria-label="Put the calculator away">${UI.close(12)}</button>` : ""}
    </div>
    <div class="cl-calc__lcd" role="status" aria-live="polite">
      <div class="cl-calc__flags"><span data-flag="S">S</span><span data-flag="M">M</span><span data-flag="D">D</span><span data-flag="R">R</span></div>
      <div class="cl-calc__expr" data-calc-expr></div>
      <div class="cl-calc__out" data-calc-out>0</div>
    </div>
    <div class="cl-calc__fn">${FN.map(([k, face, sk, sface, kind]) =>
      `<span class="cl-calc__cell"><em>${sface}</em><button type="button" class="cl-key cl-key--${kind}" data-k="${esc(k)}"${sk ? ` data-s="${esc(sk)}"` : ""} aria-label="${esc(face)}${sface ? `; with shift, ${esc(sface)}` : ""}">${face}</button></span>`).join("")}</div>
    <div class="cl-calc__num">${NUM.map(([k, face, kind]) =>
      `<button type="button" class="cl-key cl-key--${kind || (k === "=" ? "eq" : "num")}" data-k="${esc(k)}" aria-label="${k === "*" ? "times" : k === "/" ? "divided by" : esc(face)}">${face}</button>`).join("")}</div>`;

  let keys = [];            // the expression being typed
  let shift = false;
  let shown = null;         // the result on the bottom line: { v } or { err }
  let asFrac = false;
  const exprEl = el.querySelector("[data-calc-expr]");
  const outEl = el.querySelector("[data-calc-out]");

  function paint() {
    exprEl.textContent = show(keys);
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
  }

  function run() {
    try { const v = evaluate(keys, { deg: C.deg, ans: C.ans }); C.ans = v; shown = { v }; }
    catch (e) { shown = { err: e instanceof CalcError ? e.message : "Math ERROR" }; }
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

  function press(k) {
    if (k === "SHIFT") { shift = !shift; paint(); return; }
    shift = false;
    if (k === "AC") { keys = []; shown = null; }
    else if (k === "DEL") { if (shown) shown = null; else keys.pop(); }
    else if (k === "=") { if (keys.length) run(); }
    else if (k === "MODE") { C.deg = !C.deg; if (shown && !shown.err && keys.length) run(); onChange(C); }
    else if (k === "SD") { if (shown && !shown.err) asFrac = !asFrac; }
    else if (k === "M+" || k === "M-") {
      if (keys.length && !shown) run();
      if (shown && !shown.err) { C.mem += (k === "M+" ? 1 : -1) * shown.v; onChange(C); }
    } else if (k === "MC") { C.mem = 0; onChange(C); }
    else if (k === "MR") { if (shown) { keys = []; shown = null; } keys.push(...numKeys(C.mem)); }
    else {
      /* after a result, an operator carries on from it (Ans), anything else starts again */
      if (shown) { keys = !shown.err && OPS.includes(k) ? ["Ans"] : []; shown = null; }
      if (keys.length < 120) keys.push(k);
    }
    paint();
  }

  el.addEventListener("click", (e) => {
    if (onClose && e.target.closest("[data-calc-close]")) { onClose(); return; }
    const b = e.target.closest("[data-k]");
    if (!b) return;
    press(shift && b.dataset.s ? b.dataset.s : b.dataset.k);
  });

  el.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Escape" && onClose) { onClose(); return; }
    const k = /^\d$/.test(e.key) ? e.key : TYPED[e.key];
    /* while the calculator is being typed on, a letter is not one of the
       host page's shortcuts */
    e.stopPropagation();
    if (!k) return;
    e.preventDefault();
    press(k);
  });

  paint();
  return { el, press, paint, get keys() { return keys.slice(); } };
}
