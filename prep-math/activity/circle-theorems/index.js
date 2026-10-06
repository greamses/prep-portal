/* ============================================================================
   CIRCLE THEOREMS — the studio  (prep-math/activity/circle-theorems/index.js)
   ----------------------------------------------------------------------------
   Eight theorems, each a figure whose points can be DRAGGED round the circle
   (or, for the two tangents, anywhere outside it). Three ways to use one:

     Explore   drag, and the note at the top says the theorem with the live
               numbers — the angle at the centre stays twice the angle at the
               circumference, however the points are moved
     Why?      the proof, a step at a time: each step lights the lines and
               angles it talks about and the rest of the figure steps back
     Find it   a fresh figure with one angle (or length) given and one asked:
               type it, check it, and the reason is said

   geometry.js says what every figure is made of; this file only draws it and
   handles the pointer. Keys: 1–8 a theorem, E / W / Q the three ways, arrows
   step a proof, Enter checks, N another, R start again.
   ========================================================================== */

import { THEOREMS, theoremById, R } from "./geometry.js";

const $ = (id) => document.getElementById(id);
const svg = $("figure");
const DEG = Math.PI / 180;

/* where each theorem's points are: kept per theorem, so going back to one finds it as it was left */
const KEEP = "ct-studio-v1";
const saved = (() => { try { return JSON.parse(localStorage.getItem(KEEP) || "{}") || {}; } catch { return {}; } })();
const state = {
  id: THEOREMS.some((t) => t.id === saved.id) ? saved.id : THEOREMS[0].id,
  pts: Object.fromEntries(THEOREMS.map((t) => [t.id, { ...t.start, ...(saved.pts?.[t.id] || {}) }])),
  mode: "explore",
  step: 0,
  quiz: null,            // { pts, given, ask } and, once answered, `done`
};
const keep = () => { try { localStorage.setItem(KEEP, JSON.stringify({ id: state.id, pts: state.pts })); } catch { /* not kept */ } };
const th = () => theoremById(state.id);
const rng = { int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)) };

/* ── drawing ───────────────────────────────────────────────────────────────*/
const f1 = (x) => Math.round(x * 100) / 100;
const whole = (x) => Math.round(x * 10) / 10;
const unit = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };

/** an angle drawn at v between the rays to p1 and p2: a filled wedge and its label */
function wedge(a, text, cls) {
  const { v, p1, p2, reflex } = a;
  const u1 = unit(v, p1), u2 = unit(v, p2);
  let a1 = Math.atan2(u1[1], u1[0]), a2 = Math.atan2(u2[1], u2[0]);
  let sweep = a2 - a1;
  while (sweep <= -Math.PI) sweep += 2 * Math.PI;
  while (sweep > Math.PI) sweep -= 2 * Math.PI;
  if (reflex) sweep = sweep > 0 ? sweep - 2 * Math.PI : sweep + 2 * Math.PI;
  const span = Math.abs(sweep);
  const r = span > 2.2 ? 8 : span < 0.45 ? 15 : 10.5;
  const e = a1 + sweep;
  const P = (ang, rr) => [v[0] + rr * Math.cos(ang), v[1] + rr * Math.sin(ang)];
  const s = P(a1, r), t = P(e, r);
  const large = span > Math.PI ? 1 : 0, dir = sweep > 0 ? 1 : 0;
  const mid = a1 + sweep / 2;
  const at = P(mid, r + (span < 0.45 ? 9 : 7.5));
  return `<g class="ct-ang ${cls}" data-part="${a.part}"><path class="wedge" d="M${f1(v[0])} ${f1(v[1])}L${f1(s[0])} ${f1(s[1])}A${r} ${r} 0 ${large} ${dir} ${f1(t[0])} ${f1(t[1])}Z"/>`
    + (text ? `<text class="ct-label${text === "?" ? " ask" : ""}" x="${f1(at[0])}" y="${f1(at[1])}">${text}</text>` : "") + `</g>`;
}

function rightMark(m) {
  const u1 = unit(m.v, m.p1), u2 = unit(m.v, m.p2), k = 5.2;
  const a = [m.v[0] + u1[0] * k, m.v[1] + u1[1] * k], c = [m.v[0] + u2[0] * k, m.v[1] + u2[1] * k];
  const b = [a[0] + u2[0] * k, a[1] + u2[1] * k];
  return `<path class="ct-right" data-part="${m.part}" d="M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}L${f1(c[0])} ${f1(c[1])}"/>`;
}

function lengthLabel(l, text) {
  const mx = (l.a[0] + l.b[0]) / 2, my = (l.a[1] + l.b[1]) / 2;
  const u = unit(l.a, l.b);
  /* off the line, on the side away from the centre */
  let nx = -u[1], ny = u[0];
  if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }
  const side = l.side || 1, k = 10 * side;
  return `<text class="ct-label${text === "?" ? " ask" : ""}" data-part="${l.part}" x="${f1(mx + nx * k)}" y="${f1(my + ny * k)}">${text}</text>`;
}

/** What is shown, and what each angle or length says, in the way being used. */
function plan(fig) {
  const T = th();
  if (state.mode === "quiz" && state.quiz) {
    const q = state.quiz;
    const visible = new Set([...fig.base, ...q.given, q.ask.part, ...(q.show || [])]);
    const say = (x, value) => (x.part === q.ask.part ? (q.done ? fmt(value, q.ask.unit) : "?") : q.given.includes(x.part) ? fmt(value, x.unitOf) : "");
    return { visible, lit: null, angleText: (a) => say(a, a.value), lengthText: (l) => say({ ...l, unitOf: "cm" }, l.value) };
  }
  if (state.mode === "why") {
    const step = T.proof[state.step];
    const lit = new Set(step.lit);
    const visible = new Set([...fig.base, ...T.proof.slice(0, state.step + 1).flatMap((s) => s.lit)]);
    const named = (a) => (a.label ? `${a.label} = ${fmt(a.value)}` : fmt(a.value));
    return { visible, lit, angleText: named, lengthText: (l) => fmt(l.value, "cm") };
  }
  return { visible: new Set(fig.base), lit: null, angleText: (a) => fmt(a.value), lengthText: (l) => fmt(l.value, "cm") };
}
const fmt = (v, u) => (u === "cm" ? `${v} cm` : `${whole(v)}°`);

function draw() {
  const T = th();
  const pts = state.mode === "quiz" && state.quiz ? state.quiz.pts : state.pts[state.id];
  const fig = T.figure(pts);
  const P = plan(fig);
  const shown = (x) => !x.part || P.visible.has(x.part);
  /* the circle as big as the space allows: only the two tangents reach far outside it */
  svg.setAttribute("viewBox", T.id === "tangents" ? "-124 -124 248 248" : "-98 -98 196 196");
  let s = `<circle class="ct-circle" cx="0" cy="0" r="${R}"/>`;
  fig.angles.filter(shown).forEach((a) => { s += wedge(a, P.angleText(a), a.cls); });
  fig.segs.filter(shown).forEach((g) => { s += `<line class="ct-seg ${g.cls}" data-part="${g.part}" x1="${f1(g.a[0])}" y1="${f1(g.a[1])}" x2="${f1(g.b[0])}" y2="${f1(g.b[1])}"/>`; });
  fig.rights.filter(shown).forEach((m) => { s += rightMark(m); });
  fig.lengths.filter(shown).forEach((l) => { const t = P.lengthText(l); if (t) s += lengthLabel(l, t); });
  fig.points.filter(shown).forEach((p) => {
    const [x, y] = p.at;
    const d = Math.hypot(x, y);
    const out = d < 1 ? [-7, 7] : [x / d * (d > R + 4 ? 9 : 10.5), y / d * (d > R + 4 ? 9 : 10.5)];
    const grab = p.drag && state.mode !== "quiz";
    s += grab
      ? `<g class="ct-drag" data-drag="${p.id}" data-how="${p.drag}"><circle class="ct-hit" cx="${f1(x)}" cy="${f1(y)}" r="10"/><circle class="ct-handle" cx="${f1(x)}" cy="${f1(y)}" r="3.6"/></g>`
      : `<circle class="ct-pt"${p.part ? ` data-part="${p.part}"` : ""} cx="${f1(x)}" cy="${f1(y)}" r="${p.id === "O" ? 1.9 : 2.2}"/>`;
    s += `<text class="ct-name"${p.part ? ` data-part="${p.part}"` : ""} x="${f1(x + out[0])}" y="${f1(y + out[1])}">${p.label}</text>`;
  });
  svg.innerHTML = s;
  /* lighting: everything named in the step is lit, the rest dims */
  svg.classList.toggle("is-lit", !!P.lit);
  if (P.lit) svg.querySelectorAll("[data-part]").forEach((el) => el.classList.toggle("is-lit", P.lit.has(el.dataset.part)));
  say(T, fig);
}

/* ── the note at the top ───────────────────────────────────────────────────*/
function say(T, fig) {
  const i = THEOREMS.indexOf(T) + 1;
  if (state.mode === "why") {
    $("step-tag").textContent = `${T.name} · why · step ${state.step + 1} of ${T.proof.length}`;
    $("text-content").textContent = T.proof[state.step].say(fig.values);
    $("fact").innerHTML = fig.fact;
  } else if (state.mode === "quiz" && state.quiz) {
    const q = state.quiz;
    $("step-tag").textContent = `${T.name} · find it`;
    $("text-content").innerHTML = q.done
      ? (q.right ? `Right: ${q.ask.label} = ${fmt(q.ask.value, q.ask.unit)}. ${q.ask.why}` : `Not quite: ${q.ask.label} = ${fmt(q.ask.value, q.ask.unit)}. ${q.ask.why}`)
      : `Find ${q.ask.label}. ${T.statement}`;
    $("fact").innerHTML = "";
  } else {
    $("step-tag").textContent = `Theorem ${i} of ${THEOREMS.length} · ${T.name} · drag the yellow points`;
    $("text-content").textContent = T.statement;
    $("fact").innerHTML = fig.fact;
  }
}

/* ── the receipt ───────────────────────────────────────────────────────────*/
$("chips").innerHTML = THEOREMS.map((t, i) => `<button type="button" class="pp-btn ct-chip" role="tab" data-id="${t.id}" title="${t.name} (${i + 1})">${t.name}</button>`).join("");
function paintControls() {
  document.querySelectorAll(".ct-chip").forEach((b) => { const on = b.dataset.id === state.id; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", String(on)); });
  document.querySelectorAll(".ct-mode").forEach((b) => b.classList.toggle("is-on", b.dataset.mode === state.mode));
  $("why-tools").hidden = state.mode !== "why";
  $("quiz-tools").hidden = state.mode !== "quiz";
  $("reset").hidden = state.mode === "quiz";
  if (state.mode === "why") { $("prev").disabled = state.step <= 0; $("next").disabled = state.step >= th().proof.length - 1; }
  if (state.mode === "quiz" && state.quiz) $("ask-label").textContent = `${state.quiz.ask.label} =`;
}
function setTheorem(id) { state.id = id; state.step = 0; if (state.mode === "quiz") newQuiz(); keep(); paintControls(); draw(); }
function setMode(m) {
  state.mode = m; state.step = 0;
  if (m === "quiz") newQuiz(); else state.quiz = null;
  paintControls(); draw();
}
function newQuiz() {
  state.quiz = th().quiz(rng);
  $("answer").value = "";
  paintControls();
  setTimeout(() => $("answer").focus(), 0);
}
function check() {
  const q = state.quiz; if (!q || $("answer").value.trim() === "") return;
  const v = Number($("answer").value);
  q.right = Math.abs(v - q.ask.value) <= (q.ask.tol ?? 0.5);
  q.done = true;
  draw();
}
function stepBy(k) { const n = th().proof.length; state.step = Math.max(0, Math.min(n - 1, state.step + k)); paintControls(); draw(); }

$("chips").addEventListener("click", (e) => { const b = e.target.closest(".ct-chip"); if (b) setTheorem(b.dataset.id); });
document.querySelectorAll(".ct-mode").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
$("prev").addEventListener("click", () => stepBy(-1));
$("next").addEventListener("click", () => stepBy(1));
$("check").addEventListener("click", check);
$("another").addEventListener("click", () => { newQuiz(); draw(); });
$("answer").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); if (state.quiz?.done) { newQuiz(); draw(); } else check(); } });
$("reset").addEventListener("click", () => { state.pts[state.id] = { ...th().start }; keep(); draw(); });

/* the keys (never while typing an answer, and never with Ctrl, Alt or Cmd held) */
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey || e.target.closest?.("input, textarea, select")) return;
  const k = e.key.toLowerCase();
  if (/^[1-8]$/.test(k)) setTheorem(THEOREMS[Number(k) - 1].id);
  else if (k === "e") setMode("explore");
  else if (k === "w") setMode("why");
  else if (k === "q") setMode("quiz");
  else if (k === "arrowright" && state.mode === "why") stepBy(1);
  else if (k === "arrowleft" && state.mode === "why") stepBy(-1);
  else if (k === "n" && state.mode === "quiz") { newQuiz(); draw(); }
  else if (k === "r" && state.mode !== "quiz") $("reset").click();
  else return;
  e.preventDefault();
});

/* ── dragging a point ──────────────────────────────────────────────────────*/
let held = null;
const toFigure = (e) => { const m = svg.getScreenCTM(); if (!m) return [0, 0]; const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); return [p.x, p.y]; };
svg.addEventListener("pointerdown", (e) => {
  const g = e.target.closest?.(".ct-drag"); if (!g) return;
  held = { id: g.dataset.drag, how: g.dataset.how };
  try { svg.setPointerCapture(e.pointerId); } catch { /* it drags without it */ }
  e.preventDefault();
  moveTo(e);
});
function moveTo(e) {
  if (!held) return;
  const [x, y] = toFigure(e);
  const T = th(), pts = state.pts[state.id];
  const next = held.how === "free" ? T.move(pts, held.id, [x, y]) : T.move(pts, held.id, Math.atan2(-y, x) / DEG);
  if (next !== pts) { state.pts[state.id] = next; draw(); svg.querySelector(`[data-drag="${held.id}"]`)?.classList.add("is-held"); }
}
svg.addEventListener("pointermove", moveTo);
const let_go = () => { if (held) { held = null; keep(); draw(); } };
svg.addEventListener("pointerup", let_go);
svg.addEventListener("pointercancel", let_go);

paintControls();
draw();
document.getElementById("loader")?.classList.add("hidden");
