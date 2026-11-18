/* ============================================================================
   THE RESULT SHEET — a marked paper as an OMR sheet
   ----------------------------------------------------------------------------
   (the user, 2026-11-17: "show the failed or unanswered questions and areas to work on. More like
   their omr sheets. No need to write the entire question in the pdf. If a user wants to see the
   question they can visit their dashboard and hover over a wrong answer to see both the question,
   correct answer, wrong answer they chose and solution")

     import { renderOmr, printOmr } from "/utils/components/omr-sheet.js";
     const sheet = await api(`/api/workbooks/paper/${code}/sheet`);   // server/routes/workbooks.js
     renderOmr(host, sheet, { hover: true });    // the grid, the counts and the areas to work on
     printOmr(sheet);                            // the same, printed: no question text

   Every question is a row: its number, then the bubbles A to E for an objective question (the one
   chosen filled, the key ringed in green; a wrong choice red), or a box with what was written for a
   fill-in. A row not answered is greyed. With `hover`, a wrong or blank row opens a card with the
   question, its options, the answer given, the right answer and the worked solution.
   ========================================================================== */
import { textHtml } from "/prep-math/activity/exam-maker/js/model.js";
import { loadMath } from "/utils/components/workbook/mathify.js";

const L = "ABCDE";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const WORD = { r: "Right", w: "Wrong", b: "Not answered", m: "Marked by your teacher" };

function css() {
  if (document.querySelector('link[href*="omr-sheet.css"]')) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "/utils/components/omr-sheet.css";
  document.head.appendChild(l);
}

/** One question's row. */
function rowHtml(it) {
  const marks = it.type === "mcq"
    ? L.slice(0, Math.max(4, it.options.length || 4)).split("").map((ch) => {
      const chosen = it.chosen === ch, key = it.key === ch;
      return `<span class="omr-b${chosen ? " is-chosen" : ""}${key ? " is-key" : ""}">${ch}</span>`;
    }).join("")
    : `<span class="omr-box">${esc(it.chosen || "—")}</span>${it.st === "w" ? `<span class="omr-key">${esc(it.key)}</span>` : ""}`;
  const can = it.st === "w" || it.st === "b";
  return `<div class="omr-row is-${it.st}" data-n="${it.n}" ${can ? 'tabindex="0"' : ""} aria-label="Question ${it.n}: ${WORD[it.st] || ""}">
    <span class="omr-n">${it.n}</span><span class="omr-marks">${marks}</span></div>`;
}

/** The areas to work on: the topics with marks missed, worst first. */
function areasHtml(areas) {
  if (!areas || !areas.length) return `<p class="omr-good">Nothing to work on: every area right.</p>`;
  return `<ul class="omr-areas">${areas.map((a) => `<li><span class="omr-area">${esc(a.topic)}</span>
    <span class="omr-bar"><i style="width:${Math.round((100 * a.missed) / a.total)}%"></i></span>
    <span class="omr-miss">${a.missed} of ${a.total} missed</span></li>`).join("")}</ul>`;
}

/** The sheet on a page: counts, the grid and the areas. */
export function renderOmr(host, sheet, { hover = false } = {}) {
  css();
  if (!sheet || sheet.held) { host.innerHTML = `<p class="omr-note">Your teacher will release this result.</p>`; return; }
  if (sheet.old || !sheet.items || !sheet.items.length) {
    host.innerHTML = `<p class="omr-note">This paper was handed in before answers were kept, so there is no sheet for it: only the score.</p>`;
    return;
  }
  const c = sheet.counts || {};
  host.innerHTML = `<div class="omr">
    <p class="omr-counts"><span class="is-r">${c.right || 0} right</span><span class="is-w">${c.wrong || 0} wrong</span><span class="is-b">${c.blank || 0} not answered</span></p>
    <div class="omr-grid">${sheet.items.map(rowHtml).join("")}</div>
    <p class="omr-sub">Areas to work on</p>${areasHtml(sheet.areas)}
    ${hover ? `<p class="omr-tipnote">Point at a red or grey question to see it, your answer, the right answer and how to work it out.</p>` : ""}
  </div>`;
  if (hover) wireHover(host, sheet);
}

/** A wrong or blank row: the question card beside it, on hover or focus. */
function wireHover(host, sheet) {
  let pop = null;
  const close = () => { pop?.remove(); pop = null; };
  const open = async (row) => {
    const it = sheet.items.find((x) => String(x.n) === row.dataset.n);
    if (!it || (it.st !== "w" && it.st !== "b")) return;
    close();
    pop = document.createElement("div");
    pop.className = "pp-receipt omr-pop";
    pop.setAttribute("role", "tooltip");
    const opts = it.type === "mcq" && it.options.length
      ? `<ol class="omr-opts">${it.options.map((o, i) => `<li class="${L[i] === it.key ? "is-key" : ""}${L[i] === it.chosen ? " is-chosen" : ""}"><b>${L[i]}</b> ${textHtml(o)}</li>`).join("")}</ol>` : "";
    pop.innerHTML = `<div class="pp-receipt__paper">
      <p class="omr-pop__n">Question ${it.n}${it.topic ? ` · ${esc(it.topic)}` : ""}</p>
      <div class="omr-pop__q">${textHtml(it.text)}</div>${opts}
      <p class="omr-pop__ans"><span>Your answer: <b class="${it.st === "b" ? "" : "is-w"}">${it.st === "b" ? "not answered" : (it.type === "mcq" ? it.chosen : textHtml(it.chosen))}</b></span>
        <span>Right answer: <b class="is-r">${it.type === "mcq" ? it.key : textHtml(it.key)}</b></span></p>
      ${it.solution && it.solution.length ? `<p class="omr-pop__h">How to work it out</p><div class="omr-pop__sol">${it.solution.map((x) => `<p>${textHtml(x)}</p>`).join("")}</div>` : ""}
    </div>`;
    document.body.appendChild(pop);
    const r = row.getBoundingClientRect(), w = Math.min(420, window.innerWidth - 24);
    pop.style.width = `${w}px`;
    pop.style.left = `${Math.max(12, Math.min(window.innerWidth - w - 12, r.left))}px`;
    const below = r.bottom + 8, h = pop.offsetHeight;
    pop.style.top = `${below + h < window.innerHeight - 8 ? below : Math.max(8, r.top - h - 8)}px`;
    // the TeX in the question, options and solution, set by MathJax (as the paper page sets its questions)
    try { if (await loadMath()) { await window.MathJax.startup.promise; await window.MathJax.typesetPromise([pop]); } } catch { /* the plain text stands */ }
  };
  host.querySelectorAll(".omr-row.is-w, .omr-row.is-b").forEach((row) => {
    row.addEventListener("mouseenter", () => open(row));
    row.addEventListener("focus", () => open(row));
    row.addEventListener("mouseleave", close);
    row.addEventListener("blur", close);
    row.addEventListener("click", () => (pop ? close() : open(row)));   // a tap on a phone
  });
}

/** The printed sheet's body: the heading, the counts, the grid, the areas (no question text). */
function printBody(sheet) {
  const s = sheet.score || {}, c = sheet.counts || {};
  return `<header class="omr-print__head"><p class="omr-print__kicker">Result sheet</p><h1>${esc(sheet.title)}</h1>
      <p>${sheet.name ? `${esc(sheet.name)}` : ""}${sheet.examNo ? ` · Exam no. ${esc(sheet.examNo)}` : ""}</p>
      <p class="omr-print__score"><b>${s.won} of ${s.outOf}</b> · ${s.pct}%${s.grade ? ` · grade ${esc(s.grade)}` : ""}</p></header>
    <div class="omr"><p class="omr-counts"><span class="is-r">${c.right || 0} right</span><span class="is-w">${c.wrong || 0} wrong</span><span class="is-b">${c.blank || 0} not answered</span></p>
    <div class="omr-grid">${sheet.items.map(rowHtml).join("")}</div>
    <p class="omr-sub">Areas to work on</p>${areasHtml(sheet.areas)}
    <p class="omr-tipnote">To see a question, your answer, the right answer and how to work it out: your dashboard, My results.</p></div>`;
}

/** The sheet printed: no question text. */
export function printOmr(sheet) {
  if (!sheet || !sheet.items || !sheet.items.length) return;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Result sheet · ${esc(sheet.title)}</title>
    <link rel="stylesheet" href="${location.origin}/utils/components/theme.css"><link rel="stylesheet" href="${location.origin}/utils/components/omr-sheet.css">
    </head><body class="omr-print">${printBody(sheet)}
    <script>setTimeout(() => window.print(), 500);<\/script></body></html>`);
  w.document.close();
}

/** The site's Download key beside a sheet's Print button (PDF, Word, Google Docs: doc-export.js), made from
 *  the printed sheet laid out off screen at an A4 width. */
export async function mountSheetDownload(printBtn, sheet) {
  if (!printBtn || !sheet || !sheet.items || !sheet.items.length) return;
  css();
  const box = document.createElement("div");
  box.className = "omr-print omr-print-box";
  box.setAttribute("aria-hidden", "true");
  box.innerHTML = printBody(sheet);
  document.body.appendChild(box);
  const { mountDownload } = await import("/utils/components/doc-export.js");
  mountDownload(printBtn, { root: () => box, name: () => `Result sheet - ${sheet.title}${sheet.name ? ` - ${sheet.name}` : ""}` });
}
