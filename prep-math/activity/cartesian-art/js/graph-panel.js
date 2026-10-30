/* ============================================================================
   Cartesian Art — the graphing panel (type an equation, see it drawn)
   ----------------------------------------------------------------------------
   A Desmos-style list of lines in the "Graph" rail panel. Each line is typed
   as plain linear maths (y = x^2/4, r = 1 + cos(theta)); when it is not being
   edited it is shown typeset. A coloured dot opens the line's style strip
   (show/hide, colour, dash, thickness, "Make a shape" to paint it).

   A line like `a = 2` becomes a slider; any letter used but not defined
   offers a slider for it. The lines persist in localStorage and travel in the
   share link (export.js reads getGraphRows / setGraphRows).
   ========================================================================== */

import { analyze, fmtNum } from "./graph-model.js";
import { setItems, initGraph, initTrace, shapePoints } from "./graph.js";
import { addShape } from "./state.js";
import { niceStep } from "./scale.js";
import { toTeX } from "/utils/components/math-linear.js";
import { mathNode, mathReady, whenMathDrawn, preloadMath } from "/utils/components/sticky-math.js";

const KEY = "ca-graph-v1";
const COLORS = ["#c74440", "#2d70b3", "#388c46", "#6042a6", "#fa7e19", "#1b8a8f", "#c2477e", "#5c4a3d"];

let rows = [];
let rid = 0;
let selectedId = null;
let deg = false;
let analysis = { results: new Map(), params: {} };
const anim = new Map(); // row id → { raf, dir, last }

const $ = (s, r = document) => r.querySelector(s);

/* ── model ───────────────────────────────────────────────────────────────── */

function newRow(src = "", extra = {}) {
  const used = new Set(rows.map((r) => r.color));
  const color = COLORS.find((c) => !used.has(c)) || COLORS[rows.length % COLORS.length];
  return { id: ++rid, src, color, style: "solid", width: "normal", hidden: false, label: false, ...extra };
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ rows: getGraphRows(), deg })); } catch {}
}

/** The rows as plain data (for saving and the share link). */
export function getGraphRows() {
  return rows
    .filter((r) => r.src.trim())
    .map(({ src, color, style, width, hidden, label, slider, range }) => {
      const o = { src, color };
      if (style !== "solid") o.style = style;
      if (width !== "normal") o.width = width;
      if (hidden) o.hidden = 1;
      if (label) o.label = 1;
      if (slider) o.slider = slider;
      if (range) o.range = range;
      return o;
    });
}

/** Replace the rows (from a share link). */
export function setGraphRows(list) {
  if (!Array.isArray(list)) return;
  stopAll();
  rows = list.map((o) => newRow(String(o.src || ""), {
    color: o.color || undefined, style: o.style || "solid", width: o.width || "normal",
    hidden: !!o.hidden, label: !!o.label, slider: o.slider, range: o.range,
  }));
  rows.forEach((r, i) => { if (!r.color) r.color = COLORS[i % COLORS.length]; });
  rows.push(newRow());
  if (listEl) { renderList(); refresh(); save(); }
}

/* ── DOM ─────────────────────────────────────────────────────────────────── */

let listEl, keypadEl, dock;

const ICON = {
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="10.6" y="3.6" width="2.8" height="16.8" rx="1.4" fill="var(--accent-danger)" transform="rotate(45 12 12)"/><rect x="10.6" y="3.6" width="2.8" height="16.8" rx="1.4" fill="var(--accent-danger)" transform="rotate(-45 12 12)"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.4 19.6 12 7 19.6z" fill="var(--accent-success)"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.4" width="4.2" height="15.2" fill="var(--accent-secondary)"/><rect x="13.8" y="4.4" width="4.2" height="15.2" fill="var(--accent-secondary)"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.4c5 0 8.6 4.4 9.6 6.6-1 2.2-4.6 6.6-9.6 6.6S3.4 14.2 2.4 12C3.4 9.8 7 5.4 12 5.4z" fill="var(--accent-secondary)"/><circle cx="12" cy="12" r="3.6" fill="#fff"/><circle cx="12" cy="12" r="1.8" fill="var(--ink)"/></svg>',
  shape: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 20 7.6v7.2L12 21.2 4 14.8V7.6z" fill="var(--accent-secondary)"/><circle cx="12" cy="2.8" r="2.2" fill="var(--accent-danger)"/><circle cx="20" cy="7.6" r="2" fill="var(--accent-primary)"/><circle cx="4" cy="7.6" r="2" fill="var(--accent-primary)"/></svg>',
};

function rowEl(r) {
  const li = document.createElement("div");
  li.className = "ca-eq-row";
  li.dataset.id = r.id;
  li.innerHTML = `
    <button type="button" class="ca-eq-dot" title="Colour and style" aria-label="Colour and style"><span></span></button>
    <div class="ca-eq-main">
      <div class="ca-eq-field">
        <input type="text" class="ca-eq-input" spellcheck="false" autocomplete="off" autocapitalize="off"
               aria-label="Equation" />
        <div class="ca-eq-math" aria-hidden="true"></div>
      </div>
      <div class="ca-eq-sub"></div>
    </div>
    <button type="button" class="ca-eq-del" title="Delete this line" aria-label="Delete this line">${ICON.close}</button>
    <div class="ca-eq-style" hidden></div>`;
  const input = $(".ca-eq-input", li);
  input.value = r.src;
  input.placeholder = rows[0] === r ? "Type an equation, e.g. y = x^2" : "";
  paintDot(li, r);
  return li;
}

function paintDot(li, r) {
  const dot = $(".ca-eq-dot", li);
  dot.style.setProperty("--c", r.color);
  dot.classList.toggle("is-hidden", !!r.hidden);
}

function renderList() {
  listEl.innerHTML = "";
  for (const r of rows) listEl.appendChild(rowEl(r));
  rows.forEach((r) => updateMath(r));
}

const rowOf = (el) => rows.find((r) => r.id === +el.closest(".ca-eq-row")?.dataset.id);
const liOf = (r) => listEl.querySelector(`.ca-eq-row[data-id="${r.id}"]`);

/* ── typeset display ─────────────────────────────────────────────────────── */

function updateMath(r) {
  const li = liOf(r);
  if (!li) return;
  const box = $(".ca-eq-math", li);
  const input = $(".ca-eq-input", li);
  const editing = document.activeElement === input;
  const show = !editing && r.src.trim() && mathReady();
  li.classList.toggle("is-typeset", !!show);
  if (!show) return;
  if (box.dataset.src === r.src) return;
  box.dataset.src = r.src;
  box.innerHTML = "";
  try {
    const node = mathNode(toTeX(r.src));
    node.removeAttribute("title");
    node.removeAttribute("contenteditable");
    box.appendChild(node);
  } catch {
    li.classList.remove("is-typeset");
  }
}

/* ── analysis → the sub-line and the plot ───────────────────────────────── */

let refreshTimer = 0;
function refreshSoon() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refresh, 90);
}

function refresh() {
  analysis = analyze(rows, { deg });
  const plot = [];
  for (const r of rows) {
    const res = analysis.results.get(r.id) || { kind: "empty" };
    paintSub(r, res);
    if (res.kind === "curve" || res.kind === "region" || res.kind === "points") {
      plot.push({ id: r.id, color: r.color, style: r.style, width: r.width, hidden: r.hidden,
        label: r.label, result: res, selected: r.id === selectedId });
    }
  }
  setItems(plot);
}

function paintSub(r, res) {
  const li = liOf(r);
  if (!li) return;
  const sub = $(".ca-eq-sub", li);
  li.classList.toggle("is-error", res.kind === "error");
  const typing = document.activeElement === $(".ca-eq-input", li);

  if (res.kind === "slider") {
    paintSlider(r, sub, res.value);
    return;
  }
  delete sub.dataset.slider;
  stop(r.id);

  if (res.kind === "error") {
    const chips = (res.missing || []).map((v) =>
      `<button type="button" class="ca-eq-chip" data-add="${v}">add slider: ${v}</button>`).join("");
    // a half-typed line is normal: only complain once they pause
    sub.innerHTML = chips || typing
      ? (chips ? chips : "")
      : `<span class="ca-eq-err">${escape(res.error)}</span>`;
    if (!chips && typing) {
      clearTimeout(li._errT);
      li._errT = setTimeout(() => {
        const now = analysis.results.get(r.id);
        if (now && now.kind === "error" && !(now.missing || []).length) sub.innerHTML = `<span class="ca-eq-err">${escape(now.error)}</span>`;
      }, 900);
    }
    return;
  }
  if (res.kind === "value" || res.kind === "constant") {
    sub.innerHTML = `<span class="ca-eq-val">= ${fmtNum(res.value)}</span>`;
    return;
  }
  if (res.kind === "truth") {
    sub.innerHTML = `<span class="ca-eq-val">${res.value ? "true" : "false"}</span>`;
    return;
  }
  if (res.kind === "curve" && res.param) {
    // parametric / polar: the range of t or θ
    const rg = r.range || {};
    const name = res.param;
    if (sub.dataset.range === name) return;
    sub.dataset.range = name;
    sub.innerHTML = `<label class="ca-eq-range">
        <input type="text" class="ca-eq-mini" data-rg="min" value="${escape(rg.min ?? "0")}" aria-label="${name} from" />
        <span>≤ ${name} ≤</span>
        <input type="text" class="ca-eq-mini" data-rg="max" value="${escape(rg.max ?? "2pi")}" aria-label="${name} to" />
      </label>`;
    return;
  }
  delete sub.dataset.range;
  sub.innerHTML = "";
}

function paintSlider(r, sub, value) {
  const s = r.slider || (r.slider = { min: -10, max: 10 });
  if (value < s.min) s.min = Math.floor(value);
  if (value > s.max) s.max = Math.ceil(value);
  const step = sliderStep(s);
  if (sub.dataset.slider !== "1") {
    sub.dataset.slider = "1";
    sub.innerHTML = `<div class="ca-eq-slider">
        <button type="button" class="ca-eq-play" title="Play" aria-label="Play">${ICON.play}</button>
        <input type="text" class="ca-eq-mini" data-sl="min" aria-label="Lowest" />
        <input type="range" class="ca-eq-range-input" aria-label="Value" />
        <input type="text" class="ca-eq-mini" data-sl="max" aria-label="Highest" />
      </div>`;
  }
  const range = $(".ca-eq-range-input", sub);
  range.min = s.min; range.max = s.max; range.step = step;
  if (document.activeElement !== range) range.value = value;
  const lo = $('[data-sl="min"]', sub), hi = $('[data-sl="max"]', sub);
  if (document.activeElement !== lo) lo.value = s.min;
  if (document.activeElement !== hi) hi.value = s.max;
  paintTrack(range);
  $(".ca-eq-play", sub).innerHTML = anim.has(r.id) ? ICON.pause : ICON.play;
}

const sliderStep = (s) => niceStep(Math.abs(s.max - s.min) || 1) / 20;

function paintTrack(range) {
  const p = ((range.value - range.min) / ((range.max - range.min) || 1)) * 100;
  range.style.setProperty("--p", `${p}%`);
}

/** Write a slider's value back into its line, e.g. "a = 2.5". */
function setSliderValue(r, v) {
  const step = sliderStep(r.slider);
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const name = (r.src.split("=")[0] || "").trim();
  r.src = `${name} = ${Number(v.toFixed(d))}`;
  const li = liOf(r);
  if (li) $(".ca-eq-input", li).value = r.src;
  updateMath(r);
  refresh();
}

/* ── slider play ─────────────────────────────────────────────────────────── */

function play(r) {
  if (anim.has(r.id)) { stop(r.id); refresh(); save(); return; }
  const a = { dir: 1, last: performance.now(), raf: 0 };
  anim.set(r.id, a);
  const tick = (now) => {
    const res = analysis.results.get(r.id);
    if (!res || res.kind !== "slider") { stop(r.id); return; }
    const s = r.slider;
    const span = s.max - s.min;
    let v = res.value + a.dir * span * ((now - a.last) / 4000);
    a.last = now;
    if (v >= s.max) { v = s.max; a.dir = -1; }
    if (v <= s.min) { v = s.min; a.dir = 1; }
    setSliderValue(r, v);
    a.raf = requestAnimationFrame(tick);
  };
  a.raf = requestAnimationFrame(tick);
  refresh();
}
function stop(id) {
  const a = anim.get(id);
  if (!a) return;
  cancelAnimationFrame(a.raf);
  anim.delete(id);
}
function stopAll() { [...anim.keys()].forEach(stop); }

/* ── style strip ─────────────────────────────────────────────────────────── */

function openStyle(r) {
  const li = liOf(r);
  const strip = $(".ca-eq-style", li);
  const open = strip.hidden;
  listEl.querySelectorAll(".ca-eq-style").forEach((s) => { s.hidden = true; });
  if (!open) return;
  const res = analysis.results.get(r.id) || {};
  const isPts = res.kind === "points";
  const canShape = res.kind === "points" || (res.curves && res.curves[0] && res.curves[0].type !== "implicit");
  strip.innerHTML = `
    <div class="ca-eq-style-row">
      <button type="button" class="ca-eq-opt ca-eq-eye ${r.hidden ? "" : "is-active"}" data-act="hide" title="Show on the graph">${ICON.eye}<span>${r.hidden ? "Hidden" : "Shown"}</span></button>
      ${COLORS.map((c) => `<button type="button" class="ca-eq-col ${c === r.color ? "is-active" : ""}" data-col="${c}" style="--c:${c}" aria-label="Colour"></button>`).join("")}
    </div>
    <div class="ca-eq-style-row">
      ${isPts ? "" : ["solid", "dashed", "dotted"].map((s) => `<button type="button" class="ca-eq-opt ${r.style === s ? "is-active" : ""}" data-st="${s}" title="${s}">
          <svg viewBox="0 0 30 10" aria-hidden="true"><line x1="2" y1="5" x2="28" y2="5" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" ${s === "dashed" ? 'stroke-dasharray="6 4"' : s === "dotted" ? 'stroke-dasharray="0.1 5"' : ""}/></svg></button>`).join("")}
      ${["thin", "normal", "thick"].map((w) => `<button type="button" class="ca-eq-opt ${r.width === w ? "is-active" : ""}" data-wd="${w}" title="${w}">
          <svg viewBox="0 0 30 10" aria-hidden="true"><line x1="3" y1="5" x2="27" y2="5" stroke="var(--ink)" stroke-width="${w === "thin" ? 1.4 : w === "thick" ? 4.6 : 2.6}" stroke-linecap="round"/></svg></button>`).join("")}
      ${isPts ? `<button type="button" class="ca-eq-opt ${r.label ? "is-active" : ""}" data-act="label">Label</button>` : ""}
    </div>
    ${canShape ? `<button type="button" class="ca-soft-btn ca-soft-btn--sm ca-eq-mkshape" data-act="shape" title="Copy this curve onto the grid as a shape you can paint">${ICON.shape}Make a shape</button>` : ""}`;
  strip.hidden = false;
}

function makeShape(r) {
  const res = analysis.results.get(r.id);
  if (!res) return;
  const sp = shapePoints(res);
  if (!sp || sp.points.length < 2) return;
  addShape({ points: sp.points, closed: sp.closed, strokeColor: r.color, fillColor: sp.closed ? null : null });
}

/* ── the keypad: the Algebra Moves one, not a second ───────────────────────
   Its own typeset line is the editor while it is open: the selected row is
   loaded into it, every key press is copied back into the row (so the graph
   follows the typing), and its Enter moves on to the next line instead of
   putting a card on an Algebra Moves canvas. */

let kp = null;      // the keypad, once loaded
let kpRow = null;   // the row it is typing into

async function openKeypad() {
  if (kp) return kp;
  const [{ needCss }, { createKeypad }] = await Promise.all([
    import("/utils/components/workbook/panels.js"),
    import("/prep-math/activity/algebra-moves/js/keypad.js"),
  ]);
  needCss("/prep-math/activity/algebra-moves/style.css");
  kp = createKeypad(keypadEl, {});
  const go = keypadEl.querySelector(".am-key--go");
  if (go) { go.title = "Next line"; go.setAttribute("aria-label", "Next line"); }

  const pull = () => setTimeout(() => {
    if (!kpRow || !rows.includes(kpRow)) return;
    if (kp.value === kpRow.src) return;
    kpRow.src = kp.value;
    const li = liOf(kpRow);
    if (li) $(".ca-eq-input", li).value = kpRow.src;
    if (rows[rows.length - 1] === kpRow && kpRow.src.trim()) insertAfter(kpRow);
    updateMath(kpRow);
    refreshSoon();
    save();
  }, 0);
  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!kpRow) return;
    const i = rows.indexOf(kpRow);
    const n = rows[i + 1] && !rows[i + 1].src.trim() ? rows[i + 1] : insertAfter(kpRow);
    loadIntoKeypad(n);
  };
  // capture: Enter is ours before the keypad sees it
  keypadEl.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".am-key--go")) next(e);
    else pull();
  }, true);
  keypadEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.classList.contains("am-line")) next(e);
    else pull();
  }, true);
  keypadEl.addEventListener("input", pull, true);
  keypadEl.addEventListener("paste", pull, true);
  return kp;
}

function loadIntoKeypad(r) {
  if (!kp || keypadEl.hidden || !r) return;
  kpRow = r;
  select(r);
  listEl.querySelectorAll(".ca-eq-row").forEach((li) => li.classList.toggle("is-keyed", +li.dataset.id === r.id));
  kp.set(r.src);
}

/* ── events ──────────────────────────────────────────────────────────────── */

function focusRow(r, atEnd = true) {
  const li = liOf(r);
  if (!li) return;
  const input = $(".ca-eq-input", li);
  input.focus();
  if (atEnd) input.setSelectionRange(input.value.length, input.value.length);
}

function select(r) {
  if (selectedId === (r ? r.id : null)) return;
  selectedId = r ? r.id : null;
  listEl.querySelectorAll(".ca-eq-row").forEach((li) => li.classList.toggle("is-selected", +li.dataset.id === selectedId));
  refresh();
}

function deleteRow(r) {
  stop(r.id);
  const i = rows.indexOf(r);
  rows.splice(i, 1);
  if (!rows.length) rows.push(newRow());
  liOf(r)?.remove();
  if (!listEl.children.length) renderList();
  if (selectedId === r.id) selectedId = null;
  refresh();
  save();
  return rows[Math.max(0, i - 1)];
}

function insertAfter(r, src = "") {
  const n = newRow(src);
  const i = r ? rows.indexOf(r) + 1 : rows.length;
  rows.splice(i, 0, n);
  const li = rowEl(n);
  const ref = r ? liOf(r) : null;
  if (ref) ref.after(li); else listEl.appendChild(li);
  return n;
}

function wire() {
  listEl.addEventListener("input", (e) => {
    const r = rowOf(e.target);
    if (!r) return;
    if (e.target.classList.contains("ca-eq-input")) {
      r.src = e.target.value;
      // always keep one empty line at the bottom to type into
      if (rows[rows.length - 1] === r && r.src.trim()) insertAfter(r);
      refreshSoon();
      save();
    } else if (e.target.classList.contains("ca-eq-range-input")) {
      paintTrack(e.target);
      setSliderValue(r, parseFloat(e.target.value));
      save();
    }
  });

  listEl.addEventListener("change", (e) => {
    const r = rowOf(e.target);
    if (!r) return;
    const t = e.target;
    if (t.dataset.sl) {
      const v = parseFloat(t.value);
      if (isFinite(v)) r.slider[t.dataset.sl] = v;
      if (r.slider.min >= r.slider.max) r.slider.max = r.slider.min + 1;
      const sub = $(".ca-eq-sub", liOf(r));
      refresh();
      void sub;
      save();
    } else if (t.dataset.rg) {
      r.range = { ...(r.range || {}), [t.dataset.rg]: t.value };
      refresh();
      save();
    }
  });

  listEl.addEventListener("focusin", (e) => {
    const r = rowOf(e.target);
    if (!r) return;
    if (e.target.classList.contains("ca-eq-input")) {
      if (kp && !keypadEl.hidden) { loadIntoKeypad(r); return; }
      liOf(r).classList.remove("is-typeset");
    }
    select(r);
  });
  listEl.addEventListener("focusout", (e) => {
    const r = rowOf(e.target);
    if (!r || !e.target.classList.contains("ca-eq-input")) return;
    setTimeout(() => {
      updateMath(r);
      const res = analysis.results.get(r.id);
      if (res) paintSub(r, res);
    }, 0);
  });

  listEl.addEventListener("keydown", (e) => {
    const t = e.target;
    if (!t.classList.contains("ca-eq-input")) return;
    const r = rowOf(t);
    if (e.key === "Enter") {
      e.preventDefault();
      const i = rows.indexOf(r);
      const next = rows[i + 1] && !rows[i + 1].src.trim() ? rows[i + 1] : insertAfter(r);
      focusRow(next);
    } else if (e.key === "Backspace" && !t.value && rows.length > 1) {
      e.preventDefault();
      const prev = deleteRow(r);
      if (prev) focusRow(prev);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const i = rows.indexOf(r) + (e.key === "ArrowUp" ? -1 : 1);
      if (rows[i]) { e.preventDefault(); focusRow(rows[i]); }
    } else if (e.key === "Escape") {
      t.blur();
    }
  });

  listEl.addEventListener("click", (e) => {
    const r = rowOf(e.target);
    if (!r) return;
    const t = e.target;
    if (t.closest(".ca-eq-math")) { focusRow(r); return; }
    if (t.closest(".ca-eq-dot")) { select(r); openStyle(r); return; }
    if (t.closest(".ca-eq-del")) { deleteRow(r); return; }
    if (t.closest(".ca-eq-play")) { play(r); return; }
    const chip = t.closest(".ca-eq-chip");
    if (chip) {
      const n = insertAfter(r, `${chip.dataset.add} = 1`);
      void n;
      refresh();
      save();
      return;
    }
    const col = t.closest(".ca-eq-col");
    if (col) {
      r.color = col.dataset.col;
      paintDot(liOf(r), r);
      $(".ca-eq-style", liOf(r)).querySelectorAll(".ca-eq-col").forEach((b) => b.classList.toggle("is-active", b === col));
      refresh();
      save();
      return;
    }
    const opt = t.closest(".ca-eq-opt, .ca-eq-mkshape");
    if (!opt) return;
    if (opt.dataset.st) r.style = opt.dataset.st;
    else if (opt.dataset.wd) r.width = opt.dataset.wd;
    else if (opt.dataset.act === "hide") { r.hidden = !r.hidden; paintDot(liOf(r), r); }
    else if (opt.dataset.act === "label") r.label = !r.label;
    else if (opt.dataset.act === "shape") { makeShape(r); return; }
    // redraw the strip with the new choice lit
    const strip = $(".ca-eq-style", liOf(r));
    strip.hidden = true;
    openStyle(r);
    refresh();
    save();
  });
}

/* ── boot ────────────────────────────────────────────────────────────────── */

export function initGraphPanel() {
  dock = $("#dock-graph");
  listEl = $("#eq-list");
  keypadEl = $("#eq-keypad");
  if (!dock || !listEl) return;

  initGraph();
  initTrace($("#ca-stage"));

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && Array.isArray(saved.rows)) {
      deg = !!saved.deg;
      rows = saved.rows.map((o) => newRow(String(o.src || ""), {
        color: o.color, style: o.style || "solid", width: o.width || "normal",
        hidden: !!o.hidden, label: !!o.label, slider: o.slider, range: o.range,
      }));
    }
  } catch {}
  if (!rows.length || rows[rows.length - 1].src.trim()) rows.push(newRow());

  renderList();
  wire();

  // header controls
  $("#eq-add")?.addEventListener("click", () => {
    const last = rows[rows.length - 1];
    focusRow(last && !last.src.trim() ? last : insertAfter(last));
  });
  $("#eq-clear")?.addEventListener("click", () => {
    stopAll();
    rows = [newRow()];
    selectedId = null;
    renderList();
    refresh();
    save();
  });
  const degBtn = $("#eq-deg");
  const paintDeg = () => {
    if (!degBtn) return;
    degBtn.textContent = deg ? "DEG" : "RAD";
    degBtn.title = deg ? "Angles in degrees (tap for radians)" : "Angles in radians (tap for degrees)";
  };
  degBtn?.addEventListener("click", () => { deg = !deg; paintDeg(); refresh(); save(); });
  paintDeg();
  const kpBtn = $("#eq-kp");
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  const setKp = async (on) => {
    if (!keypadEl) return;
    keypadEl.hidden = !on;
    kpBtn?.classList.toggle("is-active", on);
    kpBtn?.setAttribute("aria-pressed", on ? "true" : "false");
    if (!on) {
      kpRow = null;
      listEl.querySelectorAll(".is-keyed").forEach((li) => li.classList.remove("is-keyed"));
      return;
    }
    await openKeypad();
    const sel = rows.find((r) => r.id === selectedId);
    const last = rows[rows.length - 1];
    loadIntoKeypad(sel || last);
  };
  if (coarse) setKp(true);
  kpBtn?.addEventListener("click", () => setKp(keypadEl.hidden));

  // clicking the empty part of the panel deselects
  dock.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".ca-eq-row, .ca-eq-keypad, .ca-dock-head, .ca-eq-foot")) select(null);
  });

  refresh();
  preloadMath();
  whenMathDrawn(() => rows.forEach(updateMath));
}

function escape(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
