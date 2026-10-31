/* ============================================================================
   Exam Maker — the paper
   ----------------------------------------------------------------------------
   Questions in, HTML out. The layout is decided here and only here: a coloured
   header on page one, then Section A (multiple choice, two columns), Section B
   (short answer, ruled space) and Section C (theory, longer ruled space), and
   optionally the answer key on a page of its own. All maths goes through
   textHtml() so it is written as \( \) for MathJax to typeset afterwards.
   ========================================================================== */

import { TYPES, ORDER, COLOURS, customColour, textHtml, blankHtml, esc, paperMarks, attemptOf } from "./model.js";
import { instructionSections, structureRows } from "./instructions-data.js";

/* ── diagrams ──────────────────────────────────────────────────────────── */

/**
 * A pasted or uploaded SVG made safe to put on the page: only an <svg> root,
 * no scripts, no foreignObject, no event handlers, no outside links.
 * → the cleaned markup, or "" if it is not an SVG.
 */
export function cleanSvg(src, { cols = false } = {}) {
  const text = String(src || "").trim();
  if (!text) return "";
  const key = `${cols ? "c" : "f"}|${text}`;
  if (FITTED.has(key)) return FITTED.get(key);
  const out = cleanSvgNow(text, cols);
  if (FITTED.size > 60) FITTED.clear();
  FITTED.set(key, out);
  return out;
}
const FITTED = new Map();

/* The space a figure has on the paper, in millimetres: a question that runs the
   full width, or one inside a multiple-choice column. */
const SPACE = { full: { w: 112, h: 70 }, cols: { w: 74, h: 46 } };

/**
 * Make any drawing fill its frame, whatever canvas the model drew it on:
 *  - the viewBox is tightened to the drawing's own bounding box (plus a margin),
 *    so a figure drawn small in the middle of a big canvas is not small on paper;
 *  - its printed size is set in millimetres (--w), and --u says how many user
 *    units make a millimetre, so the CSS can give every label and line the same
 *    real size (3.4 mm type, 0.5 mm lines) however big the model's numbers were.
 */
function fitSvg(root, cols) {
  const space = cols ? SPACE.cols : SPACE.full;
  const host = document.createElement("div");
  host.className = "xp xp-measure";
  host.style.cssText = "position:absolute;left:-9999px;top:0;width:480px;visibility:hidden;pointer-events:none";
  const probe = document.importNode(root, true);
  host.appendChild(probe);
  document.body.appendChild(host);
  try {
    const bbox = () => { const b = probe.getBBox(); return b.width > 0 && b.height > 0 ? b : null; };
    const size = (b) => {
      const pad = Math.max(b.width, b.height) * 0.05;
      const vw = b.width + 2 * pad, vh = b.height + 2 * pad;
      const mm = Math.min(space.w, space.h * (vw / vh));
      return { x: b.x - pad, y: b.y - pad, vw, vh, mm, u: vw / mm };
    };
    let b = bbox();
    if (!b) return;
    let s = size(b);
    /* labels change size once --u is set, so measure again with it in place */
    probe.setAttribute("style", `--u:${s.u};--w:${s.mm}`);
    b = bbox() || b;
    s = size(b);
    root.setAttribute("viewBox", `${s.x.toFixed(2)} ${s.y.toFixed(2)} ${s.vw.toFixed(2)} ${s.vh.toFixed(2)}`);
    root.setAttribute("style", `--u:${s.u.toFixed(4)};--w:${s.mm.toFixed(1)}`);
  } catch { /* the drawing keeps the model's own viewBox */ } finally { host.remove(); }
}

function cleanSvgNow(text, cols) {
  let doc;
  try { doc = new DOMParser().parseFromString(text, "image/svg+xml"); } catch { return ""; }
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) return "";
  const BAD = new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "set", "animatetransform", "animatemotion"]);
  const walk = (el) => {
    for (const c of [...el.children]) {
      if (BAD.has(c.nodeName.toLowerCase())) { c.remove(); continue; }
      walk(c);
    }
    for (const a of [...el.attributes]) {
      const nm = a.name.toLowerCase(), v = a.value.trim().toLowerCase();
      if (nm.startsWith("on")) el.removeAttribute(a.name);
      else if ((nm === "href" || nm === "xlink:href") && !v.startsWith("#")) el.removeAttribute(a.name);
      else if (/javascript:|url\(\s*["']?\s*(https?:|data:)/.test(v)) el.removeAttribute(a.name);
    }
  };
  walk(root);
  if (!root.getAttribute("viewBox")) {
    const w = parseFloat(root.getAttribute("width")), h = parseFloat(root.getAttribute("height"));
    if (w > 0 && h > 0) root.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }
  root.removeAttribute("width");
  root.removeAttribute("height");
  root.setAttribute("class", "xp-svg__art");
  root.setAttribute("role", "img");
  if (!root.getAttribute("xmlns")) root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  fitSvg(root, cols);
  return new XMLSerializer().serializeToString(root);
}

/* ── the pieces ────────────────────────────────────────────────────────── */

/* a diagram is a numbered figure in a frame; the count restarts with each paper */
let figNo = 0;
const figure = (q, cols = false) => {
  const s = cleanSvg(q.svg, { cols });
  return s ? `<figure class="xp-svg"><div class="xp-svg__frame">${s}</div><figcaption data-nomath>Figure ${++figNo}</figcaption></figure>` : "";
};

const letter = (i) => "ABCD"[i];

function mcq(q, no) {
  return `<div class="xp-q xp-q--mcq" data-qid="${q.id}">
    <span class="xp-n" data-nomath>${no}</span>
    <div class="xp-body">
      <div class="xp-text">${textHtml(q.text)}</div>
      ${figure(q, true)}
      <ol class="xp-opts">${q.options.map((o, i) => `<li><b data-nomath>${letter(i)}</b><span>${textHtml(o)}</span></li>`).join("")}</ol>
    </div>
  </div>`;
}

function written(q, no, sheeted = false) {
  const rows = sheeted ? 0 : Math.max(0, q.lines | 0);
  return `<div class="xp-q xp-q--${q.type}${sheeted ? " xp-q--sheeted" : ""}" data-qid="${q.id}">
    <span class="xp-n" data-nomath>${no}</span>
    <div class="xp-body">
      <div class="xp-text">${textHtml(q.text)}${q.marks ? `<span class="xp-marks" data-nomath>[${q.marks} ${q.marks === 1 ? "mark" : "marks"}]</span>` : ""}</div>
      ${figure(q)}
      ${rows ? `<div class="xp-lines">${"<i></i>".repeat(rows)}</div>` : ""}
    </div>
  </div>`;
}

/** A fill-in-the-blank: the sentence, and ONE short line where the answer goes.
    "______" in the text is the blank; with none, the line follows the sentence. */
function fill(q, no) {
  const blank = `<span class="xp-blank"></span>`;
  const html = blankHtml(q.text, blank);
  return `<div class="xp-q xp-q--fill" data-qid="${q.id}">
    <span class="xp-n" data-nomath>${no}</span>
    <div class="xp-body">
      <div class="xp-text">${html}${q.marks ? `<span class="xp-marks" data-nomath>[${q.marks} ${q.marks === 1 ? "mark" : "marks"}]</span>` : ""}</div>
      ${figure(q)}
    </div>
  </div>`;
}

/** A section's head: a receipt (the site's .pp-receipt, used whole) with the
    section's name stuck on it as a sticky note. */
function bar(tag, name, rule, marks) {
  return `<div class="pp-receipt xp-sec-receipt" data-nomath><div class="pp-receipt__paper xp-banner">
    <span class="xp-banner__tag">${tag}</span>
    <span class="xp-banner__name">${name}</span>
    ${rule ? `<span class="xp-banner__rule">${rule}</span>` : ""}
    ${marks ? `<span class="xp-banner__marks">${marks}</span>` : ""}
  </div></div>`;
}

function banner(type, qs, idx, attempt) {
  const t = TYPES[type];
  const n = attemptOf(attempt, type, qs.length);
  const marks = paperMarks(qs, { [type]: n });
  /* "Answer any 3 of the 5." says it once, in place of the section's usual rule */
  const rule = n < qs.length ? `Answer any ${n} of the ${qs.length} questions. ${t.rule.replace(/^Answer every question\.\s*/, "")}`.trim() : t.rule;
  return bar(`Section ${letter(idx)}`, t.head, rule, `${marks} ${marks === 1 ? "mark" : "marks"}`);
}

function header(h, total, mini = false) {
  const tl = [h.term, h.year].filter(Boolean).join(" · ");
  const cell = (k, v) => `<div class="xp-cell"><span>${k}</span><b>${esc(v) || "&nbsp;"}</b></div>`;
  return `<header class="xp-head${mini ? " xp-head--mini" : ""}" data-nomath>
    <div class="pp-receipt xp-receipt"><div class="pp-receipt__paper xp-receipt__paper">
      <div class="xp-top">
        ${h.logo
          ? `<span class="xp-head__logo"><img src="${h.logo}" alt="" /></span>`
          : `<span class="xp-head__logo xp-head__logo--none"><i>School<br>logo</i></span>`}
        <div class="xp-head__words">
          <p class="xp-head__school">${esc(h.school) || "School name"}</p>
          <p class="xp-head__term">${esc(tl) || "Term · Year"} Examination</p>
        </div>
        <div class="xp-head__subject">${esc(h.subject) || "Subject"}</div>
      </div>
      ${mini ? "" : `<div class="xp-meta">
        ${cell("Exam date", h.date)}
        ${cell("Class", h.klass)}
        ${cell("Time allowed", h.time)}
        ${cell("Total marks", total ? String(total) : "")}
      </div>`}
      ${mini === "slim" ? "" : `<div class="xp-student"><span>Student's name</span><i></i><span>Score</span><em></em></div>`}
    </div></div>
  </header>`;
}

function key(qs, head) {
  const rows = qs.map((q, i) => {
    let a;
    if (q.type === "mcq") a = `<b>${letter(q.answer)}</b> ${textHtml(q.options[q.answer] || "")}`;
    else a = q.answer ? textHtml(q.answer) : "—";
    return `<li><span class="xp-key__no" data-nomath>${i + 1}</span><div>${a}</div></li>`;
  }).join("");
  return `<section class="xp-keypage${head.breakAt && head.breakAt.key === false ? " xp-keypage--flow" : ""}">${bar("Marking", "Answer key")}<ol class="xp-key">${rows}</ol></section>`;
}


/* ── the answer sheets ─────────────────────────────────────────────────────
   A standard paper has the questions on one set of pages and the answers on
   another. Both are optional (header switches) and each starts a page of its
   own. The OMR sheet is for the multiple choice: a row of four bubbles for every
   question, numbered as on the paper. The theory sheet gives every written
   question a numbered block of ruled lines. The question paper itself loses the
   things the sheets replace: plain letters instead of bubbles, no ruled space. */

const who = () => `<div class="xp-student xp-sheetwho" data-nomath><span>Student's name</span><i></i><span>Class</span><i class="xp-sheetwho__short"></i><span>Candidate no.</span><span class="xp-boxes">${"<u></u>".repeat(8)}</span></div>`;

/** The rows of bubbles, A to D for each multiple-choice question; "" if there are none. */
function omrGrid(numbered) {
  const rows = numbered.map((q, i) => ({ q, n: i + 1 })).filter((r) => r.q.type === "mcq");
  if (!rows.length) return "";
  const PER = 15;
  const cols = [];
  for (let i = 0; i < rows.length; i += PER) cols.push(rows.slice(i, i + PER));
  const li = ({ q, n }) => `<li data-qid="${q.id}"><span class="xp-omr__n" data-nomath>${n}</span>${[0, 1, 2, 3].map((i) => `<b data-i="${i}" data-nomath>${letter(i)}</b>`).join("")}</li>`;
  return `<div class="xp-omr__grid">${cols.map((c) => `<ol>${c.map(li).join("")}</ol>`).join("")}</div>`;
}

/** The exam number: a box for each digit, and under it that column of bubbles 0 to 9 to shade (live.js wires them). */
function examNoGrid(head) {
  const n = Math.max(4, Math.min(12, Math.round(Number(head.examDigits)) || 8));
  const col = (c) => `<div class="xp-exno__col" data-c="${c}"><u class="xp-exno__box"></u>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<b data-d="${d}" data-nomath>${d}</b>`).join("")}</div>`;
  return `<div class="xp-exno" data-n="${n}" data-nomath><p class="xp-exno__cap"><b>Exam number</b> Write each digit in its box, then shade the same digit in the column below it.</p><div class="xp-exno__grid">${Array.from({ length: n }, (_, c) => col(c)).join("")}</div></div>`;
}

function omrSheet(numbered, extra = "", title = ["Answer sheet", "Multiple choice"], head = null) {
  const grid = omrGrid(numbered);
  const exno = head && head.examNo ? examNoGrid(head) : "";
  if (!grid && !exno) return "";
  return `<section class="xp-sheetpage xp-omr" data-nomath>
    <i class="xp-reg xp-reg--tl"></i><i class="xp-reg xp-reg--tr"></i><i class="xp-reg xp-reg--bl"></i><i class="xp-reg xp-reg--br"></i>
    ${bar(title[0], grid ? title[1] : "Exam number", grid ? "Shade ONE bubble for each question, completely, with a pencil." : "")}
    ${who()}${extra}${exno}
    ${grid}
    ${grid ? `<p class="xp-omr__note" data-nomath>Do not write outside the bubbles. To change an answer, rub the first one out completely.</p>` : ""}
  </section>`;
}

function theorySheet(numbered) {
  const rows = numbered.map((q, i) => ({ q, n: i + 1 })).filter((r) => r.q.type === "sub" || r.q.type === "theory");
  if (!rows.length) return "";
  const block = ({ q, n }) => {
    const lines = Math.max(q.type === "theory" ? 10 : 4, q.lines | 0);
    return `<div class="xp-ans" data-qid="${q.id}"><div class="xp-ans__tag" data-nomath><b>Question ${n}</b><span>${q.marks} ${q.marks === 1 ? "mark" : "marks"}</span></div><div class="xp-lines">${"<i></i>".repeat(lines)}</div></div>`;
  };
  return `<section class="xp-sheetpage xp-tsheet">
    ${bar("Answer sheet", "Written answers", "Write each answer in the space for its own question number.")}
    ${who()}
    ${rows.map(block).join("")}
  </section>`;
}

/* ── the answer booklet ────────────────────────────────────────────────────
   A separate booklet the student answers in: the OMR sheet on its front cover, then lined pages,
   the written questions' blocks packed onto them in order, each page numbered "page k of N". It
   replaces the paper's own OMR sheet and theory sheet, and reuses their markup (.xp-omr, .xp-ans)
   so everything that types into, marks and prints those works on it unchanged. */
const BOOKLET_PAGE = 27;   // ruled lines one page holds under its running head (a question's tag costs two)

function bookletPlan(numbered) {
  const written = numbered.map((q, i) => ({ q, n: i + 1 })).filter((r) => r.q.type === "sub" || r.q.type === "theory");
  const pages = [];
  let cur = [], used = 0;
  for (const r of written) {
    const lines = Math.min(BOOKLET_PAGE - 2, Math.max(r.q.type === "theory" ? 12 : 5, r.q.lines | 0));
    const need = lines + 2;
    if (used + need > BOOKLET_PAGE && cur.length) { pages.push(cur); cur = []; used = 0; }
    cur.push({ ...r, lines });
    used += need;
  }
  if (cur.length) pages.push(cur);
  return pages;
}

function booklet(numbered, head) {
  const pages = bookletPlan(numbered);
  const total = pages.length + 1;
  const intro = `<p class="xp-bintro" data-nomath>This booklet has ${total} page${total === 1 ? "" : "s"}: this front page${pages.length ? `, then ${pages.length} lined page${pages.length === 1 ? "" : "s"} for the written answers. Write each answer under its own question number.` : "."}</p>`;
  const grid = omrGrid(numbered);
  const cover = `<section class="xp-sheetpage xp-omr xp-bcover" data-nomath>
    <i class="xp-reg xp-reg--tl"></i><i class="xp-reg xp-reg--tr"></i><i class="xp-reg xp-reg--bl"></i><i class="xp-reg xp-reg--br"></i>
    ${header(head, paperMarks(numbered, head.attempt))}
    ${bar("Answer booklet", grid ? "Multiple choice" : "Written answers", grid ? "Shade ONE bubble for each question, completely, with a pencil." : "Write each answer under its own question number.")}
    ${intro}
    ${head.examNo ? examNoGrid(head) : ""}
    ${grid}
    ${grid ? `<p class="xp-omr__note" data-nomath>Do not write outside the bubbles. To change an answer, rub the first one out completely.</p>` : ""}
  </section>`;
  const run = [head.school, head.subject, head.klass].filter(Boolean).map(esc).join(" · ");
  const block = ({ q, n, lines }) => `<div class="xp-ans" data-qid="${q.id}"><div class="xp-ans__tag" data-nomath><b>Question ${n}</b><span>${q.marks} ${q.marks === 1 ? "mark" : "marks"}</span></div><div class="xp-lines">${"<i></i>".repeat(lines)}</div></div>`;
  const sheets = pages.map((list, k) => `<section class="xp-sheetpage xp-tsheet xp-bpage">
    <div class="xp-bpage__run" data-nomath>${head.logo ? `<img class="xp-bpage__logo" src="${head.logo}" alt="" />` : ""}<span>${run || "Answer booklet"}</span><span>Answer booklet · page ${k + 2} of ${total}</span></div>
    ${list.map(block).join("")}
  </section>`).join("");
  return `<div class="xp-booklet">${cover}${sheets}</div>`;
}

/* ── the instructions page ──────────────────────────────────────────────────
   The first page of the paper when the teacher turns instructions on: the school's header with its logo, the
   structure of the paper as a table, the numbered instructions (instructions-data.js), and a declaration to
   sign. It prints with the paper. On screen it is read before the exam starts (instructions.js) and then
   stays out of the way, like the OMR page. */
function instructionsPage(head, numbered) {
  const total = paperMarks(numbered, head.attempt);
  const rows = structureRows(head, numbered);
  const table = rows.length
    ? `<table class="xp-itable" data-nomath><thead><tr><th>Section</th><th>Kind of question</th><th>Questions</th><th>To answer</th><th>Marks</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.section}</td><td>${esc(r.kind)}</td><td>${r.questions}</td><td>${r.toAnswer}</td><td>${r.marks}</td></tr>`).join("")}<tr class="xp-itable__tot"><td colspan="4">Total</td><td>${total}</td></tr></tbody></table>`
    : "";
  /* the numbered parts in two columns, in reading order, split where the two come out nearest in height
     (the browser's own columns break at the page edge and spill the rest onto a second page) */
  const secs = instructionSections(head, numbered);
  const weight = (s) => 1.4 + s.lines.reduce((n, l) => n + Math.ceil(l.length / 48), 0);
  const wsum = secs.reduce((n, s) => n + weight(s), 0);
  let split = 1, run = 0, best = Infinity;
  secs.forEach((s, i) => { run += weight(s); const gap = Math.abs(wsum - 2 * run); if (i < secs.length - 1 && gap < best) { best = gap; split = i + 1; } });
  const part = (s, i) => `<section class="xp-isec"><h3 class="xp-ih"><span>${i + 1}</span>${esc(s.title)}</h3><ol class="xp-il">${s.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ol></section>`;
  const parts = `<div>${secs.slice(0, split).map((s, i) => part(s, i)).join("")}</div><div>${secs.slice(split).map((s, i) => part(s, split + i)).join("")}</div>`;
  const facts = [["Exam date", head.date], ["Class", head.klass], ["Time allowed", head.time], ["Total marks", total ? String(total) : ""]].map(([k, v]) => `<div><span>${k}</span><b>${esc(v) || "&nbsp;"}</b></div>`).join("");
  return `<section class="xp-sheetpage xp-instrpage" data-nomath>
    ${header(head, total, "slim")}
    <div class="xp-ifacts">${facts}</div>
    <div class="xp-ititle"><b>Instructions</b><em>Read this page before you begin</em></div>
    ${rows.length ? `<div class="xp-istruct"><h3 class="xp-ih"><span>0</span>Structure of the paper</h3>${table}</div>` : ""}
    <div class="xp-icols">${parts}</div>
    <p class="xp-inotice">Do not turn over this page, or press Begin, until you are told to start.</p>
    <div class="xp-idecl"><span>I have read and understood these instructions.</span><div class="xp-idecl__sign"><i></i><em>Signature</em><i></i><em>Date</em></div></div>
  </section>`;
}

/** The paper's opening tag: its colours, and the school's logo very faint behind every page. */
function articleOpen(head) {
  const col = head.colour === "custom" && head.custom ? customColour(head.custom) : COLOURS.find((c) => c.id === head.colour) || COLOURS[0];
  const wm = head.logo
    ? "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297"><image href="${head.logo}" x="65" y="103" width="80" height="80" preserveAspectRatio="xMidYMid meet" opacity="0.045"/></svg>`)
    : "";
  return `<article class="xp${wm ? " xp--wm" : ""}${head.tint ? " xp--tint" : ""}${head.omr || head.booklet ? " xp--omr" : ""}" style="--c:${col.main};--cs:${col.soft};--ci:${col.ink}${wm ? `;--wm:url(&quot;${wm}&quot;)` : ""}">
    ${head.logo ? `<img class="xp-wm" src="${head.logo}" alt="" />` : ""}`;
}

/** Just the instructions page, in the paper's own dress: what the student reads before the exam begins. */
export function instructionsArticle(head, questions) {
  const numbered = ORDER.flatMap((t) => questions.filter((q) => q.type === t));
  return `${articleOpen(head)}${instructionsPage(head, numbered)}</article>`;
}

/**
 * The whole paper as HTML.
 *   head       the header fields (model.js BLANK_HEAD)
 *   questions  clean questions, in the order they were written
 */
export function paperHtml(head, questions) {
  figNo = 0;
  const groups = ORDER.map((t) => [t, questions.filter((q) => q.type === t)]).filter(([, l]) => l.length);
  let no = 0;
  const numbered = [];
  const body = groups.map(([t, list], gi) => {
    const html = list.map((q) => { numbered.push(q); return t === "mcq" ? mcq(q, ++no) : t === "fill" ? fill(q, ++no) : written(q, ++no, !!head.theorySheet || !!head.booklet); }).join("");
    return `<section class="xp-sec xp-sec--${t}${gi && head.breakAt && head.breakAt[t] ? " xp-sec--page" : ""}">${banner(t, list, gi, head.attempt)}${t === "mcq" ? `<div class="xp-cols">${html}</div>` : html}</section>`;
  }).join("");
  const empty = groups.length ? "" : `<p class="xp-empty">No questions yet. Write some, or ask the model for a set.</p>`;
  /* an exam number needs a sheet to be shaded on: the OMR sheet, or a front sheet of its own */
  const front = head.omr || head.examNo;
  return `${articleOpen(head)}
    ${head.instructions && numbered.length ? instructionsPage(head, numbered) : ""}
    ${header(head, paperMarks(questions, head.attempt), !!(head.instructions && numbered.length))}
    ${body}${empty}
    ${head.booklet && numbered.length ? booklet(numbered, head) : `${front && numbered.length ? omrSheet(numbered, "", undefined, head) : ""}
    ${head.theorySheet && numbered.length ? theorySheet(numbered) : ""}`}
    ${head.key && numbered.length ? key(numbered, head) : ""}
  </article>`;
}
