/* ============================================================================
   Exam Maker — the page
   ----------------------------------------------------------------------------
   The header form, the question editor, the call to the model, and the paper.
   The model supplies content only (model.js promptFor); paper.js owns the look.
   Everything is kept in this browser so a half-written paper is still there
   tomorrow.
   ========================================================================== */

import { TYPES, COLOURS, BLANK_HEAD, blank, clean, parseQuestions, promptFor, svgPrompt, needsDiagram, extractSvg, checkQuestions, limitTo, verifyPrompt, applyChecks, totalMarks, paperMarks, esc } from "./model.js";
import { paperHtml, cleanSvg } from "./paper.js";
import { loadPaper } from "./cbt.js";
import { createLive } from "./live.js";
import { mountTools } from "./tools.js";
import { createClock, minutesFor } from "./timer.js";
import { shrink, loadHead } from "/utils/components/workbook/letterhead.js";
import { loadMath, mathify } from "/utils/components/workbook/mathify.js";
import { UI } from "/utils/components/ui-icons.js";
import { faceOf } from "/utils/components/workbook/icons.js";
import { enhanceSelects } from "/utils/components/pp-select.js";
import { mountTooltips } from "/utils/components/tooltip.js";

const $ = (id) => document.getElementById(id);

/* workbook.css (the bench's fields and toggles) also carries the workbooks'
   print rules, including "no subscription, no pages". This page is already
   behind its own premium guard, so it tells those rules it may print. */
document.documentElement.classList.add("wb-print-ok");
const KEY = "xm-paper-v1";

/* ── what is kept ──────────────────────────────────────────────────────── */

function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { /* private window */ }
  const head = { ...BLANK_HEAD, ...(saved && saved.head) };
  head.marksEach = { ...BLANK_HEAD.marksEach, ...(saved && saved.head && saved.head.marksEach) };
  /* the first version had one switch for every section */
  if (saved && saved.head && saved.head.breaks && !saved.head.breakAt) head.breakAt = { mcq: true, fill: true, sub: true, theory: true };
  delete head.breaks;
  if (!saved) {
    /* a school already set up in a workbook's letterhead is the same school */
    const l = loadHead();
    head.school = l.school || ""; head.logo = l.logo || ""; head.time = l.time || "";
  }
  const questions = saved && Array.isArray(saved.questions) ? saved.questions.map(clean) : [];
  return { head, questions, ai: (saved && saved.ai) || {} };
}

const state = load();
let saveTimer = 0;
const flush = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or off */ } };
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 250); }
/* a reload or a closed tab inside the 250ms still keeps the last edit */
addEventListener("pagehide", flush);

/* ── the paper ─────────────────────────────────────────────────────────── */

const sheet = $("xm-sheet");
let drawTimer = 0;
const live = createLive(sheet, {
  onChange: () => paintScore(),
  getAttempt: () => state.head.attempt,
  /* the OMR toggle on a paper that has no sheet makes one */
  ensureOmr: () => { state.head.omr = true; $("xm-omr").checked = true; clearTimeout(drawTimer); draw(); save(); },
});

function pageRule() {
  let st = $("xm-page");
  if (!st) { st = document.createElement("style"); st.id = "xm-page"; document.head.appendChild(st); }
  /* margin 0 leaves the browser no room for its own date / title / address line,
     so "clean" prints without them; the paper's margins are then padding that
     repeats on every printed page (box-decoration-break), and the page numbers,
     which live in the margin, go with them */
  const margin = state.head.clean ? "0" : "14mm 13mm 16mm";
  st.textContent = `@page { size: ${state.head.paper === "letter" ? "letter" : "A4"}; margin: ${margin}; }`;
  sheet.dataset.clean = state.head.clean ? "1" : "";
  sheet.dataset.paper = state.head.paper === "letter" ? "letter" : "a4";
}

function draw() {
  pageRule();
  const mj = window.MathJax;
  try { mj && mj.typesetClear && mj.typesetClear([sheet]); } catch { /* nothing typeset yet */ }
  sheet.innerHTML = paperHtml(state.head, state.questions);
  live.apply(state.questions);
  const total = paperMarks(state.questions, state.head.attempt);
  $("xm-summary").textContent = `${state.questions.length} question${state.questions.length === 1 ? "" : "s"} · ${total} mark${total === 1 ? "" : "s"}`;
  $("xm-count").textContent = state.questions.length ? `(${state.questions.length})` : "";
  typeset();
}

/* MathJax is asked one paper at a time: two typesettings of the same page
   running together leave formulas raw. Written $maths$ is set by MathJax;
   whatever is left that is plainly maths ("3x + 4 = 19", "x^2") is set by the
   workbooks' own mathify, so a question typed without any $ is still typeset. */
let queue = Promise.resolve();
function typeset() {
  queue = queue.then(async () => {
    if (!(await loadMath())) return;
    try {
      await window.MathJax.startup.promise;
      await window.MathJax.typesetPromise([sheet]);
    } catch {
      /* one bad formula must not leave the whole paper raw: go question by question */
      for (const el of sheet.querySelectorAll(".xp-q, .xp-key li")) {
        try { await window.MathJax.typesetPromise([el]); } catch { /* this one stays as text */ }
      }
    }
    /* mathify sets plain maths, but must never be let at a question whose
       $maths$ is still raw: it would cut the delimiters apart and strand them */
    for (const el of sheet.querySelectorAll(".xp-q, .xp-key li")) {
      if (/\\\(|\\\[/.test(el.textContent)) continue;
      try { mathify(el); } catch { /* nothing to set */ }
    }
  });
  return queue;
}
function redraw() { clearTimeout(drawTimer); drawTimer = setTimeout(draw, 160); save(); }

/* ── the header form ───────────────────────────────────────────────────── */

const heads = document.querySelectorAll("[data-h]");
function fillHead() {
  heads.forEach((el) => { el.value = state.head[el.dataset.h] || ""; });
  $("xm-paper").value = state.head.paper;
  document.querySelectorAll("[data-each]").forEach((el) => { el.value = state.head.marksEach[el.dataset.each]; });
  document.querySelectorAll("[data-attempt]").forEach((el) => { el.value = (state.head.attempt || {})[el.dataset.attempt] || ""; });
  $("xm-key").checked = !!state.head.key;
  $("xm-omr").checked = !!state.head.omr;
  $("xm-timer").checked = !!state.head.timer;
  $("xm-tsheet").checked = !!state.head.theorySheet;
  $("xm-clean").checked = state.head.clean !== false;
  $("xm-tint").checked = !!state.head.tint;
  document.querySelectorAll("[data-break]").forEach((el) => { const at = state.head.breakAt || {}; el.checked = el.dataset.break === "key" ? at.key !== false : !!at[el.dataset.break]; });
  paintLogo(); paintSwatches();
}
heads.forEach((el) => el.addEventListener("input", () => { state.head[el.dataset.h] = el.value; redraw(); }));
/* marks for each question, per section: changing one re-scores that whole section */
document.querySelectorAll("[data-each]").forEach((el) => el.addEventListener("input", () => {
  const t = el.dataset.each, v = Math.max(0, Math.min(100, Math.round(+el.value) || 0));
  state.head.marksEach = { ...state.head.marksEach, [t]: v };
  state.questions.forEach((q) => { if (q.type === t) q.marks = v; });
  renderList(); draw(); save();
}));
/* how many of each kind are to be attempted: empty is all of them */
document.querySelectorAll("[data-attempt]").forEach((el) => el.addEventListener("input", () => {
  const n = Math.max(0, Math.min(200, Math.round(+el.value) || 0));
  state.head.attempt = { ...(state.head.attempt || {}), [el.dataset.attempt]: n };
  redraw(); paintScore();
}));
$("xm-paper").addEventListener("change", (e) => { state.head.paper = e.target.value; redraw(); });
$("xm-clean").addEventListener("change", (e) => { state.head.clean = e.target.checked; redraw(); });
$("xm-timer").addEventListener("change", (e) => { state.head.timer = e.target.checked; save(); syncClock(); });
$("xm-omr").addEventListener("change", (e) => { state.head.omr = e.target.checked; redraw(); });
$("xm-tsheet").addEventListener("change", (e) => { state.head.theorySheet = e.target.checked; redraw(); });
$("xm-key").addEventListener("change", (e) => { state.head.key = e.target.checked; redraw(); });
$("xm-tint").addEventListener("change", (e) => { state.head.tint = e.target.checked; redraw(); });
document.querySelectorAll("[data-break]").forEach((el) => el.addEventListener("change", () => {
  state.head.breakAt = { ...state.head.breakAt, [el.dataset.break]: el.checked };
  redraw();
}));

function paintLogo() {
  const shot = $("xm-logo-shot");
  shot.hidden = !state.head.logo; $("xm-logo-drop").hidden = !state.head.logo;
  if (state.head.logo) shot.src = state.head.logo;
}
$("xm-logo-pick").addEventListener("click", () => $("xm-logo-file").click());
$("xm-logo-drop").addEventListener("click", () => { state.head.logo = ""; $("xm-logo-file").value = ""; paintLogo(); redraw(); });
$("xm-logo-file").addEventListener("change", async (e) => {
  state.head.logo = await shrink(e.target.files && e.target.files[0]);
  paintLogo(); redraw();
});

function paintSwatches() {
  const host = $("xm-swatches");
  host.innerHTML = COLOURS.map((c) =>
    `<button type="button" class="xm-sw pp-plain${c.id === state.head.colour ? " is-on" : ""}" data-c="${c.id}" style="--sw:${c.main}" aria-label="${c.name}" data-tip="${c.name}"></button>`).join("");
}
$("xm-swatches").addEventListener("click", (e) => {
  const b = e.target.closest("[data-c]");
  if (!b) return;
  state.head.colour = b.dataset.c; paintSwatches(); redraw();
});

/* ── the question editor ───────────────────────────────────────────────── */

const list = $("xm-list");
list.classList.add("xm-list");

/* our filled icons, wherever the markup asks for one with data-ui="name" */
const ico = (root = document) => root.querySelectorAll("[data-ui]").forEach((el) => {
  if (!el.firstChild && UI[el.dataset.ui]) el.innerHTML = UI[el.dataset.ui]();
});

/* Every button here is a glyph with its name in the site's tooltip (faceOf), the
   way the workbooks' are. A question type has its own glyph so the four "add"
   and "delete" buttons can be told apart without a word on them. */
const TYPE_ICON = { mcq: "check", fill: "pen", sub: "lines", theory: "doc" };
const typeGlyph = (t, badge) => `<span class="xm-glyph">${UI[TYPE_ICON[t]](20)}${badge ? `<i>${badge}</i>` : ""}</span>`;
const face = (ui, name) => `<span class="wb-btn__ico" aria-hidden="true">${UI[ui](18)}</span><em class="wb-btn__name">${name}</em>`;
const setTip = (b, t) => { b.dataset.tip = t; b.setAttribute("aria-label", t); const n = b.querySelector(".wb-btn__name"); if (n) n.textContent = t; };

function card(q, i) {
  const t = TYPES[q.type];
  const opts = q.type === "mcq"
    ? `<div class="xm-opts">${q.options.map((o, k) => `
        <label class="xm-opt"><input type="radio" name="a-${q.id}" data-f="answer" data-k="${k}" ${q.answer === k ? "checked" : ""} title="The correct answer" />
          <b>${"ABCD"[k]}</b><input class="wb-input" data-f="opt" data-k="${k}" value="${esc(o)}" autocomplete="off" placeholder="Option ${"ABCD"[k]}" /></label>`).join("")}</div>`
    : `<label class="wb-field"><span>Model answer or marking note</span><textarea class="wb-input" data-f="answerText" rows="2">${esc(q.answer)}</textarea></label>`;
  return `<div class="pp-receipt xm-qreceipt"><div class="pp-receipt__paper xm-card" data-id="${q.id}">
    <div class="xm-card__top">
      <span class="xm-card__n">${i + 1}</span>
      <select class="wb-select xm-card__type" data-f="type" aria-label="Question type">
        ${Object.keys(TYPES).map((k) => `<option value="${k}" ${k === q.type ? "selected" : ""}>${TYPES[k].label}</option>`).join("")}
      </select>
      <label class="xm-mini">Marks <input class="wb-input" data-f="marks" type="number" min="0" max="100" value="${q.marks}" /></label>
      ${q.type === "mcq" || q.type === "fill" ? "" : `<label class="xm-mini">Lines <input class="wb-input" data-f="lines" type="number" min="0" max="40" value="${q.lines}" /></label>`}
      <span class="xm-card__tools">
        <button class="pp-btn pp-btn--ghost" type="button" data-do="up" aria-label="Move up" data-tip="Move up">${UI.arrowUp(16)}</button>
        <button class="pp-btn pp-btn--ghost" type="button" data-do="down" aria-label="Move down" data-tip="Move down">${UI.arrowDown(16)}</button>
        <button class="pp-btn pp-btn--ghost" type="button" data-do="del" aria-label="Delete question" data-tip="Delete">${UI.trash(16)}</button>
      </span>
    </div>
    <label class="wb-field"><span>${t.label} question</span><textarea class="wb-input" data-f="text" rows="${q.type === "theory" ? 4 : 3}" placeholder="Type the question. Maths goes between $ signs.">${esc(q.text)}</textarea></label>
    ${opts}
    <details class="xm-svg"${q.svg ? " open" : ""}>
      <summary>${UI.shapes(16)} Diagram (SVG)${q.svg ? " — attached" : ""}</summary>
      <input class="wb-input" data-f="svgbrief" autocomplete="off" maxlength="200" placeholder="What should the diagram show? (optional) For example: a right-angled triangle, base 12 cm, height 5 cm" />
      <textarea class="wb-input xm-code" data-f="svg" rows="4" spellcheck="false" placeholder="Paste SVG code, or upload an .svg file">${esc(q.svg)}</textarea>
      <div class="xm-svg__row">
        <input type="file" accept=".svg,image/svg+xml" data-f="svgfile" hidden />
        <button class="pp-btn" type="button" data-do="svggen" data-tip="Generate diagram" aria-label="Generate diagram">${face("sparkle", "Generate diagram")}</button>
        <button class="pp-btn pp-btn--ghost" type="button" data-do="svgpick" data-tip="Upload an .svg file" aria-label="Upload an .svg file">${face("download", "Upload an .svg file")}</button>
        <button class="pp-btn pp-btn--ghost" type="button" data-do="svgclear"${q.svg ? "" : " hidden"} data-tip="Remove diagram" aria-label="Remove diagram">${face("trash", "Remove diagram")}</button>
        <span class="xm-svg__msg" role="status"></span>
        <span class="xm-svg__bad" hidden>That is not a valid SVG, so it is left off the paper.</span>
      </div>
      <div class="xm-svg__shot">${q.svg ? cleanSvg(q.svg) : ""}</div>
    </details>
  </div></div>`;
}

function renderList() {
  list.innerHTML = state.questions.length
    ? state.questions.map(card).join("")
    : `<p class="xm-hint">Nothing yet. Add a question with the buttons above, or generate a set.</p>`;
  enhanceSelects(list, { className: "pp-select--sm" });
  renderBanks();
}

const find = (el) => {
  const c = el.closest(".xm-card");
  return c ? state.questions.findIndex((q) => q.id === c.dataset.id) : -1;
};

list.addEventListener("input", (e) => {
  const i = find(e.target);
  if (i < 0) return;
  const q = state.questions[i], f = e.target.dataset.f, v = e.target.value;
  if (f === "text") q.text = v;
  else if (f === "opt") q.options[+e.target.dataset.k] = v;
  else if (f === "answerText") q.answer = v;
  else if (f === "marks") q.marks = Math.max(0, Math.min(100, Math.round(+v) || 0));
  else if (f === "lines") q.lines = Math.max(0, Math.min(40, Math.round(+v) || 0));
  else if (f === "svg") {
    q.svg = v;
    const card = e.target.closest(".xm-card");
    const ok = !v.trim() || !!cleanSvg(v);
    card.querySelector(".xm-svg__bad").hidden = ok;
    card.querySelector(".xm-svg__shot").innerHTML = ok ? cleanSvg(v) : "";
    card.querySelector('[data-do="svgclear"]').hidden = !v.trim();
  } else return;
  redraw();
});

list.addEventListener("change", (e) => {
  const i = find(e.target);
  if (i < 0) return;
  const q = state.questions[i], f = e.target.dataset.f;
  if (f === "type") {
    const was = q.type;
    const next = clean({ ...q, type: e.target.value, marks: q.marks === state.head.marksEach[was] ? state.head.marksEach[e.target.value] : q.marks,
      lines: q.lines === TYPES[was].lines ? TYPES[e.target.value].lines : q.lines,
      answer: e.target.value === "mcq" ? 0 : (was === "mcq" ? "" : q.answer) });
    state.questions[i] = next;
    renderList(); draw(); save();
  } else if (f === "answer") { q.answer = +e.target.dataset.k; redraw(); }
  else if (f === "svgfile") {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    file.text().then((t) => {
      q.svg = t; renderList(); draw(); save();
    });
  }
});

list.addEventListener("click", (e) => {
  const b = e.target.closest("[data-do]");
  if (!b) return;
  const i = find(b);
  if (i < 0) return;
  const d = b.dataset.do, qs = state.questions;
  if (d === "del") qs.splice(i, 1);
  else if (d === "up" && i > 0) [qs[i - 1], qs[i]] = [qs[i], qs[i - 1]];
  else if (d === "down" && i < qs.length - 1) [qs[i + 1], qs[i]] = [qs[i], qs[i + 1]];
  else if (d === "svggen") { genDiagram(b, qs[i]); return; }
  else if (d === "svgpick") { b.parentElement.querySelector('[data-f="svgfile"]').click(); return; }
  else if (d === "svgclear") qs[i].svg = "";
  else return;
  renderList(); draw(); save();
});

/* delete a bank, or all of them: two clicks, the first only asks */
const banks = $("xm-banks");
let armTimer = 0;
function renderBanks() {
  const n = (t) => state.questions.filter((q) => q.type === t).length;
  banks.innerHTML = Object.keys(TYPES).filter(n).map((t) =>
    `<button class="pp-btn pp-btn--ghost xm-clear" type="button" data-clear="${t}"></button>`).join("");
  banks.querySelectorAll("[data-clear]").forEach((b) => {
    const t = b.dataset.clear, name = `Delete all ${TYPES[t].label.toLowerCase()} questions (${n(t)})`;
    b.dataset.label = name;
    faceOf(b, typeGlyph(t, UI.trash(11)), name);
  });
  banks.hidden = !banks.children.length;
}
const disarm = () => document.querySelectorAll("[data-clear].is-armed").forEach((b) => {
  b.classList.remove("is-armed");
  setTip(b, b.dataset.label);
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-clear]");
  if (!b) { disarm(); return; }
  const what = b.dataset.clear;
  if (!b.classList.contains("is-armed")) {
    disarm();
    if (!b.dataset.label) b.dataset.label = b.dataset.tip;
    const n = what === "all" ? state.questions.length : state.questions.filter((q) => q.type === what).length;
    if (!n) return;
    b.classList.add("is-armed");
    setTip(b, `Click again to delete ${n}`);
    clearTimeout(armTimer); armTimer = setTimeout(disarm, 4000);
    return;
  }
  clearTimeout(armTimer);
  state.questions = what === "all" ? [] : state.questions.filter((q) => q.type !== what);
  renderList(); draw(); save();
});

/* a diagram for one question, written by the model, drawn to its numbers; a
   reply that is not a valid SVG is sent back once with the reason */
async function drawSvg(q, brief = "") {
  const { groqGenerate, groqText } = await import("/utils/ai-client.js");
  let svg = "", fault = "";
  for (let tries = 0; tries < 2 && !svg; tries++) {
    const { system, prompt } = svgPrompt(q, brief, fault);
    const raw = extractSvg(groqText(await groqGenerate({ system, prompt, temperature: 0.3, maxTokens: 3500 })));
    svg = raw && cleanSvg(raw) ? raw : "";
    if (!svg) fault = raw ? "it was not well-formed SVG" : "it contained no <svg> element";
  }
  return svg;
}

async function genDiagram(btn, q) {
  const card = btn.closest(".xm-card");
  const msg = card.querySelector(".xm-svg__msg");
  const brief = card.querySelector('[data-f="svgbrief"]').value;
  if (!q.text.trim()) { msg.textContent = "Write the question first, so the diagram can match it."; return; }
  btn.disabled = true; msg.textContent = "Drawing…";
  try {
    const svg = await drawSvg(q, brief);
    if (!svg) { msg.textContent = "The model could not draw a valid diagram. Try again, or say what it should show."; return; }
    q.svg = svg;
    renderList(); draw(); save();
  } catch (err) {
    msg.textContent = String(err && err.message || err).slice(0, 140);
  } finally { btn.disabled = false; }
}

/* a diagram for every geometry question that has none, one at a time */
async function drawGeometry(report) {
  const todo = state.questions.filter(needsDiagram);
  let done = 0;
  for (const [i, q] of todo.entries()) {
    report(`Drawing diagram ${i + 1} of ${todo.length}…`);
    try {
      const svg = await drawSvg(q);
      if (svg) { q.svg = svg; done++; renderList(); draw(); save(); }
    } catch { /* this one stays without; the rest go on */ }
  }
  return { found: todo.length, done };
}

$("xm-diagrams").addEventListener("click", async () => {
  const btn = $("xm-diagrams"), out = $("xm-diag-status");
  btn.disabled = true;
  try {
    const r = await drawGeometry((t) => { out.textContent = t; });
    out.textContent = !r.found ? "No geometry question is missing a diagram."
      : `Drew ${r.done} of ${r.found} diagram${r.found === 1 ? "" : "s"}.${r.done < r.found ? " Open the others and press Generate diagram." : ""}`;
  } finally { btn.disabled = false; }
});

document.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
  const q = blank(b.dataset.add);
  q.marks = state.head.marksEach[q.type];
  state.questions.push(q);
  renderList(); draw(); save();
  const last = list.querySelector(".xm-card:last-child textarea");
  if (last) { last.focus(); last.scrollIntoView({ block: "center", behavior: "smooth" }); }
}));

/* ── the model ─────────────────────────────────────────────────────────── */

/* what was asked last time is still there: the prompt is worth keeping */
const AI_IDS = ["xm-ai-topic", "xm-ai-level", "xm-ai-extra", "xm-ai-mcq", "xm-ai-fill", "xm-ai-sub", "xm-ai-theory"];
state.ai = state.ai && typeof state.ai === "object" ? state.ai : {};
AI_IDS.forEach((id) => {
  const el = $(id);
  if (state.ai[id] != null) el.value = state.ai[id];
  el.addEventListener("input", () => { state.ai[id] = el.value; save(); });
});

const status = (msg, bad) => { const s = $("xm-ai-status"); s.textContent = msg; s.classList.toggle("is-bad", !!bad); };

$("xm-ai-go").addEventListener("click", async () => {
  const go = $("xm-ai-go");
  const count = (id, max) => Math.max(0, Math.min(max, Math.round(+$(id).value) || 0));
  const mcq = count("xm-ai-mcq", 40), fill = count("xm-ai-fill", 20), sub = count("xm-ai-sub", 20), theory = count("xm-ai-theory", 10);
  if (!mcq && !fill && !sub && !theory) { status("Ask for at least one question.", true); return; }
  const want = { mcq, fill, sub, theory };
  const level = $("xm-ai-level").value.trim() || state.head.klass;
  const common = { topic: $("xm-ai-topic").value.trim(), subject: state.head.subject, level, svg: $("xm-ai-svg").checked, extra: $("xm-ai-extra").value };
  go.disabled = true;
  try {
    const { groqGenerate, groqText } = await import("/utils/ai-client.js");
    const ask = async ({ system, prompt }, temperature = 0.2) => groqText(await groqGenerate({ system, prompt, json: true, temperature, maxTokens: 8000 }));
    const kept = [];
    let faults = [];
    /* The model is held to the brief in code: every reply is checked, what
       breaks a rule is thrown away, and only the shortfall is asked for again. */
    for (let round = 1; round <= 3; round++) {
      const need = {};
      for (const t of Object.keys(want)) need[t] = want[t] - kept.filter((q) => q.type === t).length;
      if (!Object.values(need).some((n) => n > 0)) break;
      status(round === 1 ? "Writing the questions…" : `Round ${round}: rewriting what broke the brief…`);
      let made = [], faultsNow = [];
      try {
        made = parseQuestions(await ask(promptFor({ ...common, need, seen: kept.map((q) => q.text), faults })));
      } catch (err) { faultsNow.push("the reply was not the JSON object asked for"); }
      const checked = checkQuestions(made, { svg: common.svg, seen: kept.map((q) => q.text), marksEach: state.head.marksEach });
      faultsNow.push(...checked.faults);
      let good = limitTo(checked.good, need);
      good.forEach((q) => { if (q.svg && !cleanSvg(q.svg)) q.svg = ""; });
      const solvable = good.filter((q) => q.type === "mcq" || q.type === "fill");
      if (solvable.length) {
        status(round === 1 ? "Checking the answers…" : `Round ${round}: checking the answers…`);
        try {
          const v = applyChecks(solvable, await ask(verifyPrompt(solvable), 0));
          faultsNow.push(...v.faults);
          good = good.filter((q) => !solvable.includes(q) || v.good.includes(q));
        } catch { /* the check is a second opinion; if it cannot run, the checked questions stand */ }
      }
      kept.push(...good);
      faults = faultsNow;
    }
    const order = Object.keys(want);
    kept.sort((x, y) => order.indexOf(x.type) - order.indexOf(y.type));
    state.questions.push(...kept);
    renderList(); draw(); save();
    if (common.svg && state.questions.some(needsDiagram)) {
      const r = await drawGeometry((t) => status(`${kept.length} questions added. ${t}`));
      if (r.found && r.done < r.found) faults = [`${r.found - r.done} geometry diagram${r.found - r.done === 1 ? "" : "s"} could not be drawn; open the question and press Generate diagram`];
    }
    const wanted = mcq + fill + sub + theory;
    status(kept.length === wanted
      ? `Added ${kept.length} question${kept.length === 1 ? "" : "s"}, each checked against your brief. Read them before you print.`
      : `Added ${kept.length} of ${wanted}. The model could not meet the brief for the rest${faults.length ? `: ${faults[0]}` : ""}. Press Generate again for the remainder.`,
      kept.length === 0);
  } catch (err) {
    status(String(err && err.message || err).slice(0, 200) || "The model could not write the questions. Try again.", true);
  } finally { go.disabled = false; }
});

/* ── printing ──────────────────────────────────────────────────────────── */

$("xm-print").addEventListener("click", async () => {
  clearTimeout(drawTimer); draw();
  try { await typeset(); } catch { /* print plain */ }
  window.print();
});

/* ── a CBT paper sent here by the picker's Paper mode ──────────────────────
   `?cbt=axis|top|subject|topic|paper` (cbt.js). It replaces the paper on the
   bench, so the one that was there is put aside first and one press brings it
   back. The address is cleaned afterwards: a refresh must not load it again
   over whatever has been edited since. */
async function fromCbt() {
  const u = new URL(location.href);
  const spec = u.searchParams.get("cbt");
  if (!spec) return;
  const format = u.searchParams.get("format") || "";
  const attempt = parseInt(u.searchParams.get("attempt") || "0", 10) || 0;
  const timed = u.searchParams.get("timer") === "1";
  u.searchParams.delete("cbt"); u.searchParams.delete("format"); u.searchParams.delete("attempt"); u.searchParams.delete("timer");
  history.replaceState(null, "", u.pathname + u.search + u.hash);

  const out = $("xm-cbt-status");
  let got = null;
  try { got = await loadPaper(spec, format, state.head.marksEach, attempt); } catch { /* reported below */ }
  if (!got || !got.questions.length) {
    out.textContent = "That CBT paper could not be found, so the bench is as you left it.";
    return;
  }
  const had = state.questions.length > 0;
  if (had) {
    try { localStorage.setItem(`${KEY}:before-cbt`, JSON.stringify({ head: state.head, questions: state.questions, ai: state.ai })); } catch { /* storage full */ }
  }
  state.questions = got.questions;
  state.head.subject = got.head.subject;
  state.head.klass = got.head.klass;
  state.head.key = true;
  state.head.attempt = got.head.attempt || {};
  if (timed) state.head.timer = true;
  flush();
  setLive(true);

  const pics = got.pictures ? ` ${got.pictures} of them refer${got.pictures === 1 ? "s" : ""} to a picture the printed paper cannot show yet.` : "";
  out.textContent = `Loaded ${got.questions.length} questions from the CBT paper, with the answer key at the back.${pics}`;
  if (had) {
    const undo = document.createElement("button");
    undo.type = "button"; undo.className = "pp-btn pp-btn--ghost xm-undo";
    faceOf(undo, UI.undo(18), "Bring back my earlier paper");
    undo.onclick = () => {
      try {
        const b = JSON.parse(localStorage.getItem(`${KEY}:before-cbt`) || "null");
        if (!b) return;
        state.head = { ...BLANK_HEAD, ...b.head }; state.questions = (b.questions || []).map(clean); state.ai = b.ai || {};
        localStorage.removeItem(`${KEY}:before-cbt`);
        fillHead(); renderList(); draw(); flush();
        out.textContent = "Your earlier paper is back.";
      } catch { out.textContent = "Could not bring it back."; }
    };
    out.append(" ", undo);
  }
}

/* ── answering on screen, and sharing the paper ────────────────────────────
   The paper can be done where it is shown (live.js): the same design, the
   bubbles shaded by clicking, the blanks typed on. "Share link" keeps a copy of
   the paper on the server and hands back /paper/<code>, which anyone with an
   account can open and sit for mock preparation. */
function paintScore() {
  const el = $("xm-score");
  if (!live.on) { el.textContent = ""; return; }
  const s = live.score(state.questions);
  if (live.checked) {
    el.textContent = `${s.won} of ${s.auto} marks on the questions marked for you` + (s.manual ? ` · ${s.manual} written to mark yourself` : "");
  } else {
    el.textContent = `${s.answered} of ${s.total} answered`;
  }
}

/* the workbook tool rail, for a student sitting the paper */
let tools = null;
function setLive(on) {
  if (!tools) tools = mountTools({ sheet, viewport: document.querySelector(".xm-viewport"), toolbar: document.querySelector(".wb-toolbar") });
  if (on) tools.on(); else tools.off();
  live.setOn(on);
  $("xm-live").setAttribute("aria-pressed", String(on));
  $("xm-live").classList.toggle("is-on", on);
  /* answering leaves only the paper; the same button takes you back to the setup */
  document.documentElement.classList.toggle("xm-focus", on);
  if (on) scrollTo({ top: 0 });
  $("xm-check").hidden = !on; $("xm-clear").hidden = !on;
  clearTimeout(drawTimer); draw(); paintScore(); setLiveFaces();
  clock.stop(); syncClock();
}
/* The countdown: runs while the paper is being answered, if the setup asks for it, and the paper is
   checked when it reaches zero. Checking it, or putting the paper away, stops it. */
const clock = createClock($("xm-clock"), {
  onEnd: () => {
    if (live.on && !live.checked) {
      $("xm-check").click();
      $("xm-score").textContent = "Time is up. " + $("xm-score").textContent;
    }
  },
});
function syncClock() {
  if (live.on && state.head.timer && !live.checked) {
    if (!clock.running) clock.start(minutesFor(state.head.time, state.questions.length) * 60);
  } else clock.stop();
}

function setLiveFaces() {
  faceOf($("xm-live"), live.on ? UI.settings(18) : UI.pen(18), live.on ? "Back to setup" : "Answer on screen");
  faceOf($("xm-check"), live.checked ? UI.undo(18) : UI.check(18), live.checked ? "Answer again" : "Check answers");
  faceOf($("xm-clear"), UI.eraser(18), "Clear answers");
}
$("xm-live").addEventListener("click", () => setLive(!live.on));

$("xm-check").addEventListener("click", () => {
  if (live.checked) live.reopen(); else live.check(state.questions);
  clearTimeout(drawTimer); draw(); paintScore(); setLiveFaces(); syncClock();
});
$("xm-clear").addEventListener("click", () => { live.clear(); clearTimeout(drawTimer); draw(); paintScore(); setLiveFaces(); clock.stop(); syncClock(); });

/* however printing starts (the button, Ctrl+P), empty answer boxes print as ruled
   lines, and the paper is drawn again afterwards so it can still be answered */
addEventListener("beforeprint", () => { if (live.on) live.forPrint(); });
addEventListener("afterprint", () => { if (live.on) { clearTimeout(drawTimer); draw(); } });

$("xm-share").addEventListener("click", async () => {
  const box = $("xm-sharebox"), btn = $("xm-share");
  box.hidden = false;
  if (!state.questions.length) { box.textContent = "Write or generate some questions first, then share the paper."; return; }
  btn.disabled = true; box.textContent = "Making the link…";
  try {
    const { api } = await import("/utils/components/workbook/account.js");
    const title = [state.head.school, state.head.subject].filter(Boolean).join(" · ") || "Exam paper";
    const r = await api("/api/workbooks/paper-share", { title, head: { ...state.head, key: false }, questions: state.questions });
    const url = new URL(r.url, location.origin).href;
    box.replaceChildren();
    const a = document.createElement("a"); a.href = url; a.textContent = url; a.target = "_blank"; a.rel = "noopener";
    const copy = document.createElement("button"); copy.type = "button"; copy.className = "pp-btn pp-btn--ghost"; faceOf(copy, UI.copy(18), "Copy link");
    copy.onclick = async () => { try { await navigator.clipboard.writeText(url); faceOf(copy, UI.check(18), "Copied"); } catch { faceOf(copy, UI.alert(18), "Select the link and copy it"); } };
    box.append("Anyone with an account can sit this paper on screen: ", a, " ", copy);
  } catch (e) {
    box.textContent = String((e && e.message) || e || "Could not make the link.").slice(0, 200);
  } finally { btn.disabled = false; }
});

/* ── go ────────────────────────────────────────────────────────────────── */

await fromCbt();
fillHead(); renderList(); draw(); ico();
faceOf($("xm-logo-pick"), UI.image(18), "Choose a picture");
faceOf($("xm-logo-drop"), UI.trash(18), "Remove the logo");
faceOf($("xm-ai-go"), UI.sparkle(18), "Generate questions");
document.querySelectorAll("[data-add]").forEach((b) => faceOf(b, typeGlyph(b.dataset.add, "+"), `Add a ${TYPES[b.dataset.add].label.toLowerCase()} question`));
faceOf($("xm-diagrams"), UI.shapes(18), "Add diagrams to geometry questions");
document.querySelectorAll('[data-clear="all"]').forEach((b) => { faceOf(b, UI.trash(18), "Delete all questions"); b.dataset.label = "Delete all questions"; });
faceOf($("xm-print"), UI.print(18), "Print");
faceOf($("xm-share"), UI.link(18), "Share link");
setLiveFaces();
enhanceSelects(document.querySelector(".xm-rail"), { className: "pp-select--sm" });
mountTooltips();
