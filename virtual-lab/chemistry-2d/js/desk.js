/* ============================================================================
   CHEMISTRY BENCH — what is on the desk beside the glass
   ----------------------------------------------------------------------------
   Two things a practical needs that are not apparatus:

   THE RESULTS TABLE  a table the learner rules for themselves — any columns,
   any rows, their own headings — and a GRAPH of any two of its columns on
   graph paper: the points, joined or with the line of best fit (least
   squares), its gradient and intercept written underneath.

   THE CALCULATOR  a scientific calculator that works like the one in a
   school bag: two-line display, SHIFT for the second function of a key,
   degrees or radians, brackets, powers and roots, logs, trig and its
   inverses, factorials, nCr and nPr, ×10ˣ entry, Ans, a memory, S⇔D for a
   fraction, and the constants a chemist uses. Its arithmetic is calc.js.

   Both are kept with the bench (state.table, state.calc).
   ========================================================================== */

import { evaluate, format, fraction, show, bestFit, niceTicks, CalcError } from "./calc.js";
import { UI } from "/utils/components/ui-icons.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const num = (s) => { const v = Number(String(s).trim().replace(",", ".").replace("−", "-")); return String(s).trim() === "" || !Number.isFinite(v) ? null : v; };

const TEMPLATES = {
  blank: { name: "Blank table", cols: ["", ""], rows: [["", ""], ["", ""], ["", ""], ["", ""]] },
  titration: {
    name: "Titration",
    cols: ["Titration", "Final burette reading / cm³", "Initial burette reading / cm³", "Volume of acid used / cm³"],
    rows: [["Rough", "", "", ""], ["1st", "", "", ""], ["2nd", "", "", ""], ["3rd", "", "", ""]],
  },
  heat: { name: "Temperature against volume", cols: ["Volume added / cm³", "Temperature / °C"], rows: [["0", ""], ["5", ""], ["10", ""], ["15", ""], ["20", ""], ["25", ""]] },
  gas: { name: "Gas collected against time", cols: ["Time / s", "Volume of gas / cm³"], rows: [["0", ""], ["30", ""], ["60", ""], ["90", ""], ["120", ""]] },
};

export function initDesk({ state, save, say }) {
  // ════════════════════════ the results table ════════════════════════
  if (!state.table) state.table = { ...structuredClone(TEMPLATES.blank), gx: 0, gy: 1, fit: "line", title: "" };
  const T = state.table;
  const box = document.getElementById("cl-table");
  const plot = document.getElementById("cl-graph");

  function renderTable() {
    const head = T.cols.map((c, j) => `<th><input class="cl-cell cl-cell--head" data-col="${j}" value="${esc(c)}" placeholder="Heading / unit" aria-label="Heading of column ${j + 1}" />${T.cols.length > 1 ? `<button type="button" class="cl-cut" data-cut-col="${j}" data-tip="Remove this column" aria-label="Remove column ${j + 1}">${UI.close(10)}</button>` : ""}</th>`).join("");
    const body = T.rows.map((r, i) => `<tr>${r.map((v, j) => `<td><input class="cl-cell" data-row="${i}" data-col="${j}" value="${esc(v)}" inputmode="decimal" aria-label="Row ${i + 1}, column ${j + 1}" /></td>`).join("")}<td class="cl-cutcell">${T.rows.length > 1 ? `<button type="button" class="cl-cut" data-cut-row="${i}" data-tip="Remove this row" aria-label="Remove row ${i + 1}">${UI.close(10)}</button>` : ""}</td></tr>`).join("");
    box.innerHTML = `<table class="cl-results"><thead><tr>${head}<th class="cl-cutcell"></th></tr></thead><tbody>${body}</tbody></table>`;
    const opts = (sel) => T.cols.map((c, j) => `<option value="${j}"${j === sel ? " selected" : ""}>${esc(c || `Column ${j + 1}`)}</option>`).join("");
    document.getElementById("cl-gx").innerHTML = opts(T.gx);
    document.getElementById("cl-gy").innerHTML = opts(T.gy);
    document.getElementById("cl-gfit").value = T.fit;
    renderGraph();
  }

  function renderGraph() {
    const pts = T.rows.map((r) => [num(r[T.gx] ?? ""), num(r[T.gy] ?? "")]).filter((p) => p[0] !== null && p[1] !== null);
    const note = document.getElementById("cl-gnote");
    if (pts.length < 2 || T.gx === T.gy) {
      plot.innerHTML = "";
      plot.setAttribute("hidden", "");
      note.textContent = T.gx === T.gy ? "Choose two different columns to plot." : "Fill in at least two rows with numbers in both columns, and the graph is drawn here.";
      return;
    }
    plot.removeAttribute("hidden");          // (an <svg> has no .hidden of its own)
    const Wd = 460, Ht = 320, L = 54, Rt = 14, Tp = 16, Bt = 44;
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    // an axis starts at nought unless the readings are all far from it
    const from = (vs) => { const lo = Math.min(...vs), hi = Math.max(...vs); return lo >= 0 && lo <= (hi - lo) * 1.5 ? 0 : lo; };
    const X = niceTicks(from(xs), Math.max(...xs));
    const Y = niceTicks(from(ys), Math.max(...ys));
    const px = (x) => L + ((x - X.lo) / (X.hi - X.lo)) * (Wd - L - Rt);
    const py = (y) => Ht - Bt - ((y - Y.lo) / (Y.hi - Y.lo)) * (Ht - Tp - Bt);
    const f = (n) => n.toFixed(1);
    const tidy = (v) => Number(v.toPrecision(6)).toString();
    let grid = "";
    // graph paper: five small squares to every numbered one
    for (let i = 0; i < (X.ticks.length - 1) * 5; i++) { const x = L + (i / ((X.ticks.length - 1) * 5)) * (Wd - L - Rt); grid += `<path class="cl-g-fine" d="M${f(x)} ${Tp}V${Ht - Bt}"/>`; }
    for (let i = 0; i < (Y.ticks.length - 1) * 5; i++) { const y = Tp + (i / ((Y.ticks.length - 1) * 5)) * (Ht - Tp - Bt); grid += `<path class="cl-g-fine" d="M${L} ${f(y)}H${Wd - Rt}"/>`; }
    for (const t of X.ticks) grid += `<path class="cl-g-bold" d="M${f(px(t))} ${Tp}V${Ht - Bt}"/><text class="cl-g-num" x="${f(px(t))}" y="${Ht - Bt + 13}" text-anchor="middle">${tidy(t)}</text>`;
    for (const t of Y.ticks) grid += `<path class="cl-g-bold" d="M${L} ${f(py(t))}H${Wd - Rt}"/><text class="cl-g-num" x="${L - 6}" y="${f(py(t) + 3)}" text-anchor="end">${tidy(t)}</text>`;
    const sorted = pts.slice().sort((a, b) => a[0] - b[0]);
    let line = "", says = `${pts.length} points plotted.`;
    if (T.fit === "join") line = `<path class="cl-g-line" d="M${sorted.map((p) => `${f(px(p[0]))} ${f(py(p[1]))}`).join("L")}"/>`;
    else if (T.fit === "line") {
      const fit = bestFit(pts);
      if (fit) {
        // drawn right across the paper, clipped to it
        const ends = [X.lo, X.hi].map((x) => [x, fit.m * x + fit.c]);
        line = `<path class="cl-g-line" clip-path="url(#cl-g-clip)" d="M${f(px(ends[0][0]))} ${f(py(ends[0][1]))}L${f(px(ends[1][0]))} ${f(py(ends[1][1]))}"/>`;
        says = `Line of best fit: gradient ${tidy(fit.m)}, intercept ${tidy(fit.c)} on the vertical axis.`;
      } else says = "A line of best fit needs points at more than one value across.";
    }
    const dots = pts.map((p) => `<path class="cl-g-point" d="M${f(px(p[0]) - 4)} ${f(py(p[1]) - 4)}l8 8m0 -8l-8 8"/>`).join("");
    plot.setAttribute("viewBox", `0 0 ${Wd} ${Ht}`);
    plot.innerHTML = `<rect class="cl-g-paper" x="${L}" y="${Tp}" width="${Wd - L - Rt}" height="${Ht - Tp - Bt}"/>
      <clipPath id="cl-g-clip"><rect x="${L}" y="${Tp}" width="${Wd - L - Rt}" height="${Ht - Tp - Bt}"/></clipPath>${grid}
      <path class="cl-g-axis" d="M${L} ${Tp}V${Ht - Bt}H${Wd - Rt}"/>${line}${dots}
      <text class="cl-g-label" x="${(L + Wd - Rt) / 2}" y="${Ht - 8}" text-anchor="middle">${esc(T.cols[T.gx] || `Column ${T.gx + 1}`)}</text>
      <text class="cl-g-label" transform="translate(13 ${(Tp + Ht - Bt) / 2}) rotate(-90)" text-anchor="middle">${esc(T.cols[T.gy] || `Column ${T.gy + 1}`)}</text>`;
    note.textContent = says;
  }

  box.addEventListener("input", (e) => {
    const c = e.target.closest(".cl-cell");
    if (!c) return;
    const j = Number(c.dataset.col);
    if (c.dataset.row === undefined) {
      T.cols[j] = c.value;
      document.querySelectorAll(`#cl-gx option[value="${j}"], #cl-gy option[value="${j}"]`).forEach((o) => (o.textContent = c.value || `Column ${j + 1}`));
    } else T.rows[Number(c.dataset.row)][j] = c.value;
    renderGraph();
    save();
  });
  // Enter goes down a row, like a spreadsheet; the last row makes a new one
  box.addEventListener("keydown", (e) => {
    const c = e.target.closest(".cl-cell");
    if (!c || e.key !== "Enter" || c.dataset.row === undefined) return;
    e.preventDefault();
    const i = Number(c.dataset.row), j = Number(c.dataset.col);
    if (i === T.rows.length - 1) { T.rows.push(T.cols.map(() => "")); renderTable(); save(); }
    box.querySelector(`.cl-cell[data-row="${i + 1}"][data-col="${j}"]`)?.focus();
  });
  box.addEventListener("click", (e) => {
    const b = e.target.closest(".cl-cut");
    if (!b) return;
    if (b.dataset.cutRow !== undefined) T.rows.splice(Number(b.dataset.cutRow), 1);
    else {
      const j = Number(b.dataset.cutCol);
      T.cols.splice(j, 1);
      T.rows.forEach((r) => r.splice(j, 1));
      T.gx = Math.min(T.gx, T.cols.length - 1);
      T.gy = Math.min(T.gy, T.cols.length - 1);
      if (T.gx === T.gy && T.cols.length > 1) T.gy = T.gx === 0 ? 1 : 0;
    }
    renderTable();
    save();
  });
  document.getElementById("cl-table-tools").addEventListener("click", (e) => {
    const b = e.target.closest("[data-table]");
    if (!b) return;
    const what = b.dataset.table;
    if (what === "row") T.rows.push(T.cols.map(() => ""));
    else if (what === "col") { if (T.cols.length >= 8) { say("Eight columns is as wide as the paper goes.", null, "no"); return; } T.cols.push(""); T.rows.forEach((r) => r.push("")); }
    else if (what === "wipe") T.rows = T.rows.map((r) => r.map(() => ""));
    renderTable();
    save();
  });
  document.getElementById("cl-template").innerHTML = `<option value="">Start from…</option>${Object.entries(TEMPLATES).map(([k, t]) => `<option value="${k}">${esc(t.name)}</option>`).join("")}`;
  document.getElementById("cl-template").addEventListener("change", (e) => {
    const t = TEMPLATES[e.target.value];
    e.target.value = "";
    if (!t) return;
    Object.assign(T, structuredClone({ cols: t.cols, rows: t.rows }), { gx: 0, gy: Math.min(1, t.cols.length - 1) });
    if (t === TEMPLATES.titration) { T.gx = 1; T.gy = 3; }
    renderTable();
    save();
  });
  for (const [id, key] of [["cl-gx", "gx"], ["cl-gy", "gy"], ["cl-gfit", "fit"]]) {
    document.getElementById(id).addEventListener("change", (e) => { T[key] = key === "fit" ? e.target.value : Number(e.target.value); renderGraph(); save(); });
  }
  renderTable();

  // ════════════════════════ the calculator ════════════════════════
  if (!state.calc) state.calc = { deg: true, mem: 0, ans: 0, x: null, y: null, open: false };
  const C = state.calc;
  const el = document.getElementById("cl-calc");
  // [ what it types , its face , its SHIFT function , the face of that , kind ]
  const FN = [
    ["SHIFT", "SHIFT", null, "", "shift"], ["MODE", "DRG", null, "", "fn"], ["^-1", "x⁻¹", "!", "x!", "fn"], ["^2", "x²", "^3", "x³", "fn"], ["^", "xʸ", "abs(", "Abs", "fn"], ["sqrt(", "√", "cbrt(", "∛", "fn"],
    ["log(", "log", "10^(", "10ˣ", "fn"], ["ln(", "ln", "e^(", "eˣ", "fn"], ["sin(", "sin", "asin(", "sin⁻¹", "fn"], ["cos(", "cos", "acos(", "cos⁻¹", "fn"], ["tan(", "tan", "atan(", "tan⁻¹", "fn"], ["neg", "(−)", null, "", "fn"],
    ["(", "(", null, "", "fn"], [")", ")", null, "", "fn"], ["pi", "π", "e", "e", "fn"], ["C", "nCr", "P", "nPr", "fn"], ["%", "%", null, "", "fn"], ["SD", "S⇔D", null, "", "fn"],
    ["M+", "M+", "M-", "M−", "fn"], ["MR", "MR", "MC", "MC", "fn"], ["NA", "Nₐ", null, "", "fn"], ["R", "R", null, "", "fn"], ["F", "F", null, "", "fn"], ["Vm", "Vₘ", "Vr", "Vᵣ", "fn"],
  ];
  const NUM = [
    ["7", "7"], ["8", "8"], ["9", "9"], ["DEL", "DEL", "del"], ["AC", "AC", "del"],
    ["4", "4"], ["5", "5"], ["6", "6"], ["*", "×"], ["/", "÷"],
    ["1", "1"], ["2", "2"], ["3", "3"], ["+", "+"], ["-", "−"],
    ["0", "0"], [".", "."], ["EXP", "×10ˣ"], ["Ans", "Ans"], ["=", "="],
  ];
  el.innerHTML = `
    <div class="cl-calc__top" data-calc-drag>
      <span class="cl-calc__brand">PREP <b>fx-82 Bench</b></span>
      <span class="cl-calc__solar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <button type="button" class="cl-key cl-key--x" data-calc-close aria-label="Put the calculator away">${UI.close(12)}</button>
    </div>
    <div class="cl-calc__lcd" role="status" aria-live="polite">
      <div class="cl-calc__flags"><span data-flag="S">S</span><span data-flag="M">M</span><span data-flag="D">D</span><span data-flag="R">R</span></div>
      <div class="cl-calc__expr" id="cl-calc-expr"></div>
      <div class="cl-calc__out" id="cl-calc-out">0</div>
    </div>
    <div class="cl-calc__fn">${FN.map(([k, face, sk, sface, kind]) => `<span class="cl-calc__cell"><em>${sface}</em><button type="button" class="cl-key cl-key--${kind}" data-k="${esc(k)}"${sk ? ` data-s="${esc(sk)}"` : ""} aria-label="${esc(face)}${sface ? `; with shift, ${esc(sface)}` : ""}">${face}</button></span>`).join("")}</div>
    <div class="cl-calc__num">${NUM.map(([k, face, kind]) => `<button type="button" class="cl-key cl-key--${kind || (k === "=" ? "eq" : "num")}" data-k="${esc(k)}" aria-label="${k === "*" ? "times" : k === "/" ? "divided by" : esc(face)}">${face}</button>`).join("")}</div>`;
  el.tabIndex = 0;
  let keys = [];            // the expression being typed
  let shift = false;
  let shown = null;         // the result on the bottom line: { v } or { err }
  let asFrac = false;
  const exprEl = el.querySelector("#cl-calc-expr"), outEl = el.querySelector("#cl-calc-out");
  function paint() {
    exprEl.textContent = show(keys);
    exprEl.scrollLeft = exprEl.scrollWidth;
    if (shown && shown.err) outEl.textContent = shown.err;
    else if (shown) { const fr = asFrac ? fraction(shown.v) : null; outEl.textContent = fr ? `${fr.n < 0 ? "−" : ""}${Math.abs(fr.n)}⁄${fr.d}` : format(shown.v); }
    else outEl.textContent = keys.length ? "" : "0";
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
    save();
  }
  const OPS = ["+", "-", "*", "/", "^", "^2", "^3", "^-1", "!", "%", "C", "P"];
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
    else if (k === "MODE") { C.deg = !C.deg; if (shown && !shown.err && keys.length) run(); save(); }
    else if (k === "SD") { if (shown && !shown.err) asFrac = !asFrac; }
    else if (k === "M+" || k === "M-") {
      if (keys.length && !shown) run();
      if (shown && !shown.err) { C.mem += (k === "M+" ? 1 : -1) * shown.v; save(); }
    } else if (k === "MC") { C.mem = 0; save(); }
    else if (k === "MR") { if (shown) { keys = []; shown = null; } keys.push(...numKeys(C.mem)); }
    else {
      // after a result, an operator carries on from it (Ans), anything else starts again
      if (shown) { keys = !shown.err && OPS.includes(k) ? ["Ans"] : []; shown = null; }
      if (keys.length < 120) keys.push(k);
    }
    paint();
  }
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-calc-close]")) { toggleCalc(false); return; }
    const b = e.target.closest("[data-k]");
    if (!b) return;
    press(shift && b.dataset.s ? b.dataset.s : b.dataset.k);
  });
  // typed on the keyboard, while the calculator has the focus
  const TYPED = { "*": "*", x: "*", X: "*", "/": "/", "+": "+", "-": "-", "^": "^", "(": "(", ")": ")", ".": ".", ",": ".", "!": "!", "%": "%", Enter: "=", "=": "=", Backspace: "DEL", Delete: "AC", e: "EXP", E: "EXP", p: "pi", s: "sin(", c: "cos(", t: "tan(", l: "log(", n: "ln(", r: "sqrt(" };
  el.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = /^\d$/.test(e.key) ? e.key : TYPED[e.key];
    if (e.key === "Escape") { toggleCalc(false); return; }
    e.stopPropagation();          // while the calculator is being typed on, a letter is not one of the bench's keys
    if (!k) return;
    e.preventDefault();
    press(k);
  });
  // carried about by its top edge
  let grab = null;
  const wrap = document.getElementById("cl-benchwrap");
  function put(x, y) {
    const w = wrap.getBoundingClientRect();
    C.x = Math.max(4, Math.min(x, w.width - el.offsetWidth - 4));
    C.y = Math.max(56, Math.min(y, w.height - 60));
    el.style.left = `${C.x}px`;
    el.style.top = `${C.y}px`;
  }
  el.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("[data-calc-drag]") || e.target.closest("button")) return;
    const r = el.getBoundingClientRect();
    grab = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", (e) => {
    if (!grab) return;
    const w = wrap.getBoundingClientRect();
    put(e.clientX - w.left - grab.dx, e.clientY - w.top - grab.dy);
  });
  el.addEventListener("pointerup", () => { if (grab) { grab = null; save(); } });
  function toggleCalc(on = el.hidden) {
    el.hidden = !on;
    C.open = on;
    document.getElementById("cl-calc-key").setAttribute("aria-pressed", String(on));
    if (on) {
      const w = wrap.getBoundingClientRect();
      put(C.x ?? w.width - el.offsetWidth - 90, C.y ?? 70);
      paint();
      el.focus({ preventScroll: true });
    }
    save();
  }
  document.getElementById("cl-calc-key").addEventListener("click", () => toggleCalc());
  window.addEventListener("resize", () => { if (!el.hidden) put(C.x ?? 0, C.y ?? 70); });
  if (C.open) toggleCalc(true);
  paint();

  return { toggleCalc, renderTable };
}
