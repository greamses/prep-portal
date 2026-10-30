/* ============================================================================
   Exam Maker — the page
   ----------------------------------------------------------------------------
   The header form, the question editor, the call to the model, and the paper.
   The model supplies content only (model.js promptFor); paper.js owns the look.
   Everything is kept in this browser so a half-written paper is still there
   tomorrow.
   ========================================================================== */

import { TYPES, COLOURS, BLANK_HEAD, blank, clean, parseQuestions, promptFor, totalMarks, esc } from "./model.js";
import { paperHtml, cleanSvg } from "./paper.js";
import { shrink, loadHead } from "/utils/components/workbook/letterhead.js";
import { loadMath } from "/utils/components/workbook/mathify.js";

const $ = (id) => document.getElementById(id);
const KEY = "xm-paper-v1";

/* ── what is kept ──────────────────────────────────────────────────────── */

function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { /* private window */ }
  const head = { ...BLANK_HEAD, ...(saved && saved.head) };
  if (!saved) {
    /* a school already set up in a workbook's letterhead is the same school */
    const l = loadHead();
    head.school = l.school || ""; head.logo = l.logo || ""; head.time = l.time || "";
  }
  const questions = saved && Array.isArray(saved.questions) ? saved.questions.map(clean) : [];
  return { head, questions };
}

const state = load();
let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or off */ }
  }, 250);
}

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
  loadMath().then((ok) => { if (ok && window.MathJax.typesetPromise) window.MathJax.typesetPromise([sheet]).catch(() => {}); });
}
function redraw() { clearTimeout(drawTimer); drawTimer = setTimeout(draw, 160); save(); }

/* ── the header form ───────────────────────────────────────────────────── */

const heads = document.querySelectorAll("[data-h]");
function fillHead() {
  heads.forEach((el) => { el.value = state.head[el.dataset.h] || ""; });
  $("xm-paper").value = state.head.paper;
  $("xm-key").checked = !!state.head.key;
  paintLogo(); paintSwatches();
}
heads.forEach((el) => el.addEventListener("input", () => { state.head[el.dataset.h] = el.value; redraw(); }));
$("xm-paper").addEventListener("change", (e) => { state.head.paper = e.target.value; redraw(); });
$("xm-key").addEventListener("change", (e) => { state.head.key = e.target.checked; redraw(); });

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
    `<button type="button" class="xm-sw pp-plain${c.id === state.head.colour ? " is-on" : ""}" data-c="${c.id}" style="--sw:${c.main}" aria-label="${c.name}" title="${c.name}"></button>`).join("");
}
$("xm-swatches").addEventListener("click", (e) => {
  const b = e.target.closest("[data-c]");
  if (!b) return;
  state.head.colour = b.dataset.c; paintSwatches(); redraw();
});

/* ── the question editor ───────────────────────────────────────────────── */

const list = $("xm-list");

function card(q, i) {
  const t = TYPES[q.type];
  const opts = q.type === "mcq"
    ? `<div class="xm-opts">${q.options.map((o, k) => `
        <label class="xm-opt"><input type="radio" name="a-${q.id}" data-f="answer" data-k="${k}" ${q.answer === k ? "checked" : ""} title="The correct answer" />
          <b>${"ABCD"[k]}</b><input class="xm-input" data-f="opt" data-k="${k}" value="${esc(o)}" autocomplete="off" placeholder="Option ${"ABCD"[k]}" /></label>`).join("")}</div>`
    : `<label class="xm-field"><span>Model answer or marking note</span><textarea class="xm-input" data-f="answerText" rows="2">${esc(q.answer)}</textarea></label>`;
  return `<div class="xm-card" data-id="${q.id}">
    <div class="xm-card__top">
      <span class="xm-card__n">${i + 1}</span>
      <select class="xm-input xm-card__type" data-f="type" aria-label="Question type">
        ${Object.keys(TYPES).map((k) => `<option value="${k}" ${k === q.type ? "selected" : ""}>${TYPES[k].label}</option>`).join("")}
      </select>
      <label class="xm-mini">Marks <input class="xm-input" data-f="marks" type="number" min="0" max="100" value="${q.marks}" /></label>
      ${q.type === "mcq" ? "" : `<label class="xm-mini">Lines <input class="xm-input" data-f="lines" type="number" min="0" max="40" value="${q.lines}" /></label>`}
      <span class="xm-card__tools">
        <button class="pp-btn pp-btn--ghost pp-plain" type="button" data-do="up" aria-label="Move up" title="Move up">↑</button>
        <button class="pp-btn pp-btn--ghost pp-plain" type="button" data-do="down" aria-label="Move down" title="Move down">↓</button>
        <button class="pp-btn pp-btn--ghost pp-plain" type="button" data-do="del" aria-label="Delete question" title="Delete">×</button>
      </span>
    </div>
    <label class="xm-field"><span>${t.label} question</span><textarea class="xm-input" data-f="text" rows="${q.type === "theory" ? 4 : 3}" placeholder="Type the question. Maths goes between $ signs.">${esc(q.text)}</textarea></label>
    ${opts}
    <details class="xm-svg"${q.svg ? " open" : ""}>
      <summary>Diagram (SVG)${q.svg ? " — attached" : ""}</summary>
      <textarea class="xm-input xm-code" data-f="svg" rows="4" spellcheck="false" placeholder="Paste SVG code, or upload an .svg file">${esc(q.svg)}</textarea>
      <div class="xm-svg__row">
        <input type="file" accept=".svg,image/svg+xml" data-f="svgfile" hidden />
        <button class="pp-btn pp-btn--ghost pp-plain" type="button" data-do="svgpick">Upload .svg</button>
        <button class="pp-btn pp-btn--ghost pp-plain" type="button" data-do="svgclear"${q.svg ? "" : " hidden"}>Remove diagram</button>
        <span class="xm-svg__bad" hidden>That is not a valid SVG, so it is left off the paper.</span>
      </div>
      <div class="xm-svg__shot">${q.svg ? cleanSvg(q.svg) : ""}</div>
    </details>
  </div>`;
}

function renderList() {
  list.innerHTML = state.questions.length
    ? state.questions.map(card).join("")
    : `<p class="xm-hint">Nothing yet. Add a question with the buttons above, or generate a set.</p>`;
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
    const next = clean({ ...q, type: e.target.value, marks: q.marks === TYPES[was].marks ? TYPES[e.target.value].marks : q.marks,
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

document.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
  state.questions.push(blank(b.dataset.add));
  renderList(); draw(); save();
  const last = list.querySelector(".xm-card:last-child textarea");
  if (last) { last.focus(); last.scrollIntoView({ block: "center", behavior: "smooth" }); }
}));

/* ── the model ─────────────────────────────────────────────────────────── */

const status = (msg, bad) => { const s = $("xm-ai-status"); s.textContent = msg; s.classList.toggle("is-bad", !!bad); };

$("xm-ai-go").addEventListener("click", async () => {
  const go = $("xm-ai-go");
  const count = (id, max) => Math.max(0, Math.min(max, Math.round(+$(id).value) || 0));
  const mcq = count("xm-ai-mcq", 40), sub = count("xm-ai-sub", 20), theory = count("xm-ai-theory", 10);
  if (!mcq && !sub && !theory) { status("Ask for at least one question.", true); return; }
  const { system, prompt } = promptFor({
    topic: $("xm-ai-topic").value.trim(), subject: state.head.subject, level: $("xm-ai-level").value.trim(),
    mcq, sub, theory, svg: $("xm-ai-svg").checked,
  });
  go.disabled = true; status("Writing the questions…");
  try {
    const { groqGenerate, groqText } = await import("/utils/ai-client.js");
    const data = await groqGenerate({ system, prompt, json: true, temperature: 0.5, maxTokens: 8000 });
    const made = parseQuestions(groqText(data));
    state.questions.push(...made);
    renderList(); draw(); save();
    status(`Added ${made.length} question${made.length === 1 ? "" : "s"}. Read each one before you print.`);
  } catch (err) {
    status(String(err && err.message || err).slice(0, 200) || "The model could not write the questions. Try again.", true);
  } finally { go.disabled = false; }
});

/* ── printing ──────────────────────────────────────────────────────────── */

$("xm-print").addEventListener("click", async () => {
  clearTimeout(drawTimer); draw();
  try { await loadMath(); await (window.MathJax.startup && window.MathJax.startup.promise); } catch { /* print plain */ }
  window.print();
});

/* ── go ────────────────────────────────────────────────────────────────── */

fillHead(); renderList(); draw();
