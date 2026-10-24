/* ============================================================================
   CHEMISTRY BENCH — what is on the desk beside the glass
   ----------------------------------------------------------------------------
   Two things a practical needs that are not apparatus:

   THE RESULTS TABLE  a table the learner rules for themselves — any columns,
   any rows, their own headings — and a GRAPH of any two of its columns on
   graph paper: the points, joined or with the line of best fit (least
   squares), its gradient and intercept written underneath.

   (The scientific calculator is no longer here: it is the first key of the side
   rail, the same machine every workbook page has. It does: two-line display, SHIFT for the second function of a key,
   degrees or radians, brackets, powers and roots, logs, trig and its
   inverses, factorials, nCr and nPr, ×10ˣ entry, Ans, a memory, S⇔D for a
   fraction, and the constants a chemist uses. Its arithmetic is calc.js.

   Both are kept with the bench (state.table, state.calc).
   ========================================================================== */

import { evaluate, bestFit, niceTicks } from "./calc.js";
import { UI } from "/utils/components/ui-icons.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const num = (s) => { const v = Number(String(s).trim().replace(",", ".").replace("−", "-")); return String(s).trim() === "" || !Number.isFinite(v) ? null : v; };

/* A cell that starts with "=" is worked out from the others IN ITS ROW, named by their
   column letters: "=B-C" is this row's column B less its column C. Only sums: + − × ÷ and
   brackets. It is given to as many decimal places as the readings it was made from. */
const LETTERS = "ABCDEFGH";
function worked(raw, row, depth = 0) {
  const text = String(raw).trim();
  if (!text.startsWith("=")) return null;
  if (depth > 8) return { err: true };
  let places = 0, blank = false;
  const keys = [];
  for (const ch of text.slice(1).replace(/\s+/g, "").replace(/\u00d7/g, "*").replace(/\u00f7/g, "/").replace(/\u2212/g, "-").toUpperCase()) {
    const j = LETTERS.indexOf(ch);
    if (j >= 0) {
      if (j >= row.length) return { err: true };
      const inner = worked(row[j], row, depth + 1);
      if (inner && inner.err) return inner;
      const cell = inner ? inner.text : String(row[j]).trim().replace(",", ".");
      if (cell === "") { blank = true; continue; }
      const v = Number(cell);
      if (!Number.isFinite(v)) return { err: true };
      places = Math.max(places, (cell.split(".")[1] || "").length);
      keys.push("(", ...(v < 0 ? ["neg"] : []), ...String(Math.abs(v)).split(""), ")");
    } else if ("0123456789.+-*/()".includes(ch)) keys.push(ch);
    else return { err: true };
  }
  if (blank) return { text: "" };            // not all the readings are in yet
  try { return { text: evaluate(keys).toFixed(Math.min(places, 6)) }; } catch { return { err: true }; }
}
/** What a cell SHOWS: its own text, or what it works out to. */
const shownIn = (row, j) => { const w = worked(row[j], row); return w ? (w.err ? "?" : w.text) : row[j]; };

const TEMPLATES = {
  blank: { name: "Blank table", cols: ["", ""], rows: [["", ""], ["", ""], ["", ""], ["", ""]] },
  titration: {
    name: "Titration",
    cols: ["Titration", "Final burette reading / cm³", "Initial burette reading / cm³", "Volume of acid used / cm³"],
    rows: [["Rough", "", "", "=B-C"], ["1st", "", "", "=B-C"], ["2nd", "", "", "=B-C"], ["3rd", "", "", "=B-C"]],
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
    const head = T.cols.map((c, j) => `<th><i>${LETTERS[j]}</i><input class="cl-cell cl-cell--head" data-col="${j}" value="${esc(c)}" placeholder="Heading / unit" aria-label="Heading of column ${j + 1}" />${T.cols.length > 1 ? `<button type="button" class="cl-cut" data-cut-col="${j}" data-tip="Remove this column" aria-label="Remove column ${j + 1}">${UI.close(10)}</button>` : ""}</th>`).join("");
    const body = T.rows.map((r, i) => `<tr>${r.map((v, j) => `<td><input class="cl-cell${String(v).trim().startsWith("=") ? " is-sum" : ""}" data-row="${i}" data-col="${j}" value="${esc(shownIn(r, j))}" aria-label="Row ${i + 1}, column ${LETTERS[j]}${String(v).trim().startsWith("=") ? ", worked out" : ""}" /></td>`).join("")}<td class="cl-cutcell">${T.rows.length > 1 ? `<button type="button" class="cl-cut" data-cut-row="${i}" data-tip="Remove this row" aria-label="Remove row ${i + 1}">${UI.close(10)}</button>` : ""}</td></tr>`).join("");
    box.innerHTML = `<table class="cl-results"><thead><tr>${head}<th class="cl-cutcell"></th></tr></thead><tbody>${body}</tbody></table>`;
    const opts = (sel) => T.cols.map((c, j) => `<option value="${j}"${j === sel ? " selected" : ""}>${esc(c || `Column ${j + 1}`)}</option>`).join("");
    document.getElementById("cl-gx").innerHTML = opts(T.gx);
    document.getElementById("cl-gy").innerHTML = opts(T.gy);
    document.getElementById("cl-gfit").value = T.fit;
    renderGraph();
  }

  function renderGraph() {
    const pts = T.rows.map((r) => [num(shownIn(r, T.gx) ?? ""), num(shownIn(r, T.gy) ?? "")]).filter((p) => p[0] !== null && p[1] !== null);
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
    } else {
      const i = Number(c.dataset.row);
      T.rows[i][j] = c.value;
      c.classList.toggle("is-sum", c.value.trim().startsWith("="));
      refreshRow(i, c);
    }
    renderGraph();
    save();
  });
  /** The worked-out cells of a row show their answers, except the one being typed in. */
  function refreshRow(i, typing) {
    box.querySelectorAll(`.cl-cell[data-row="${i}"]`).forEach((cell) => {
      if (cell === typing || cell === document.activeElement) return;
      const j = Number(cell.dataset.col);
      if (String(T.rows[i][j]).trim().startsWith("=")) cell.value = shownIn(T.rows[i], j);
    });
  }
  // in a worked-out cell, the sum is what is edited and the answer is what is left showing
  box.addEventListener("focusin", (e) => {
    const c = e.target.closest(".cl-cell.is-sum");
    if (c && c.dataset.row !== undefined) { c.value = T.rows[Number(c.dataset.row)][Number(c.dataset.col)]; c.select(); }
  });
  box.addEventListener("focusout", (e) => {
    const c = e.target.closest(".cl-cell");
    if (!c || c.dataset.row === undefined) return;
    const i = Number(c.dataset.row), j = Number(c.dataset.col);
    if (String(T.rows[i][j]).trim().startsWith("=")) c.value = shownIn(T.rows[i], j);
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
    if (t === TEMPLATES.titration) { T.gx = 0; T.gy = 0; }      // a titration is averaged, not plotted: no graph until two columns are chosen
    renderTable();
    save();
  });
  for (const [id, key] of [["cl-gx", "gx"], ["cl-gy", "gy"], ["cl-gfit", "fit"]]) {
    document.getElementById(id).addEventListener("change", (e) => { T[key] = key === "fit" ? e.target.value : Number(e.target.value); renderGraph(); save(); });
  }
  renderTable();

  return { renderTable };
}
