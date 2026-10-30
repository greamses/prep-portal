/* ============================================================================
   Exam Maker — the page
   ----------------------------------------------------------------------------
   The header form, the question editor, the call to the model, and the paper.
   The model supplies content only (model.js promptFor); paper.js owns the look.
   Everything is kept in this browser so a half-written paper is still there
   tomorrow.
   ========================================================================== */

import { TYPES, COLOURS, BLANK_HEAD, blank, clean, parseQuestions, promptFor, checkQuestions, limitTo, verifyPrompt, applyChecks, totalMarks, esc } from "./model.js";
import { paperHtml, cleanSvg } from "./paper.js";
import { shrink, loadHead } from "/utils/components/workbook/letterhead.js";
import { loadMath, mathify } from "/utils/components/workbook/mathify.js";
import { UI } from "/utils/components/ui-icons.js";
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

function pageRule() {
  let st = $("xm-page");
  if (!st) { st = document.createElement("style"); st.id = "xm-page"; document.head.appendChild(st); }
  st.textContent = `@page { size: ${state.head.paper === "letter" ? "letter" : "A4"}; margin: 14mm 13mm 16mm; }`;
  sheet.dataset.paper = state.head.paper === "letter" ? "letter" : "a4";
}

function draw() {
  pageRule();
  const mj = window.MathJax;
  try { mj && mj.typesetClear && mj.typesetClear([sheet]); } catch { /* nothing typeset yet */ }
  sheet.innerHTML = paperHtml(state.head, state.questions);
  const total = totalMarks(state.questions);
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
    try { mathify(sheet); } catch { /* nothing to set */ }
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
  $("xm-key").checked = !!state.head.key;
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
$("xm-paper").addEventListener("change", (e) => { state.head.paper = e.target.value; redraw(); });
$("xm-key").addEventListener("change", (e) => { state.head.key = e.target.checked; redraw(); });
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
      <textarea class="wb-input xm-code" data-f="svg" rows="4" spellcheck="false" placeholder="Paste SVG code, or upload an .svg file">${esc(q.svg)}</textarea>
      <div class="xm-svg__row">
        <input type="file" accept=".svg,image/svg+xml" data-f="svgfile" hidden />
        <button class="pp-btn pp-btn--ghost" type="button" data-do="svgpick">${UI.download(16)} Upload .svg</button>
        <button class="pp-btn pp-btn--ghost" type="button" data-do="svgclear"${q.svg ? "" : " hidden"}>${UI.trash(16)} Remove diagram</button>
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
    `<button class="pp-btn pp-btn--ghost xm-clear" type="button" data-clear="${t}">${UI.trash(16)} <b>Delete ${TYPES[t].label.toLowerCase()} (${n(t)})</b></button>`).join("");
  banks.hidden = !banks.children.length;
}
const disarm = () => document.querySelectorAll("[data-clear].is-armed").forEach((b) => {
  b.classList.remove("is-armed");
  b.querySelector("b").textContent = b.dataset.label;
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-clear]");
  if (!b) { disarm(); return; }
  const what = b.dataset.clear;
  if (!b.classList.contains("is-armed")) {
    disarm();
    const label = b.querySelector("b");
    b.dataset.label = label.textContent;
    const n = what === "all" ? state.questions.length : state.questions.filter((q) => q.type === what).length;
    if (!n) return;
    b.classList.add("is-armed");
    label.textContent = `Delete ${n}? Click again`;
    clearTimeout(armTimer); armTimer = setTimeout(disarm, 4000);
    return;
  }
  clearTimeout(armTimer);
  state.questions = what === "all" ? [] : state.questions.filter((q) => q.type !== what);
  renderList(); draw(); save();
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

/* ── go ────────────────────────────────────────────────────────────────── */

fillHead(); renderList(); draw(); ico();
enhanceSelects(document.querySelector(".xm-rail"), { className: "pp-select--sm" });
mountTooltips();
