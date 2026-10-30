/* ============================================================================
   Exam Maker — the paper
   ----------------------------------------------------------------------------
   Questions in, HTML out. The layout is decided here and only here: a coloured
   header on page one, then Section A (multiple choice, two columns), Section B
   (short answer, ruled space) and Section C (theory, longer ruled space), and
   optionally the answer key on a page of its own. All maths goes through
   textHtml() so it is written as \( \) for MathJax to typeset afterwards.
   ========================================================================== */

import { TYPES, ORDER, COLOURS, textHtml, blankHtml, esc, totalMarks } from "./model.js";

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

function banner(type, qs, idx) {
  const t = TYPES[type];
  const marks = totalMarks(qs);
  return bar(`Section ${letter(idx)}`, t.head, t.rule, `${marks} ${marks === 1 ? "mark" : "marks"}`);
}

function header(h, total) {
  const tl = [h.term, h.year].filter(Boolean).join(" · ");
  const cell = (k, v) => `<div class="xp-cell"><span>${k}</span><b>${esc(v) || "&nbsp;"}</b></div>`;
  return `<header class="xp-head" data-nomath>
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
      <div class="xp-meta">
        ${cell("Exam date", h.date)}
        ${cell("Class", h.klass)}
        ${cell("Time allowed", h.time)}
        ${cell("Total marks", total ? String(total) : "")}
      </div>
      <div class="xp-student"><span>Student's name</span><i></i><span>Score</span><em></em></div>
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

function omrSheet(numbered) {
  const rows = numbered.map((q, i) => ({ q, n: i + 1 })).filter((r) => r.q.type === "mcq");
  if (!rows.length) return "";
  const PER = 15;
  const cols = [];
  for (let i = 0; i < rows.length; i += PER) cols.push(rows.slice(i, i + PER));
  const li = ({ q, n }) => `<li data-qid="${q.id}"><span class="xp-omr__n" data-nomath>${n}</span>${[0, 1, 2, 3].map((i) => `<b data-i="${i}" data-nomath>${letter(i)}</b>`).join("")}</li>`;
  return `<section class="xp-sheetpage xp-omr" data-nomath>
    <i class="xp-reg xp-reg--tl"></i><i class="xp-reg xp-reg--tr"></i><i class="xp-reg xp-reg--bl"></i><i class="xp-reg xp-reg--br"></i>
    ${bar("Answer sheet", "Multiple choice", "Shade ONE bubble for each question, completely, with a pencil.")}
    ${who()}
    <div class="xp-omr__grid">${cols.map((c) => `<ol>${c.map(li).join("")}</ol>`).join("")}</div>
    <p class="xp-omr__note" data-nomath>Do not write outside the bubbles. To change an answer, rub the first one out completely.</p>
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

/**
 * The whole paper as HTML.
 *   head       the header fields (model.js BLANK_HEAD)
 *   questions  clean questions, in the order they were written
 */
export function paperHtml(head, questions) {
  figNo = 0;
  const col = COLOURS.find((c) => c.id === head.colour) || COLOURS[0];
  const groups = ORDER.map((t) => [t, questions.filter((q) => q.type === t)]).filter(([, l]) => l.length);
  let no = 0;
  const numbered = [];
  const body = groups.map(([t, list], gi) => {
    const html = list.map((q) => { numbered.push(q); return t === "mcq" ? mcq(q, ++no) : t === "fill" ? fill(q, ++no) : written(q, ++no, !!head.theorySheet); }).join("");
    return `<section class="xp-sec xp-sec--${t}${gi && head.breakAt && head.breakAt[t] ? " xp-sec--page" : ""}">${banner(t, list, gi)}${t === "mcq" ? `<div class="xp-cols">${html}</div>` : html}</section>`;
  }).join("");
  const empty = groups.length ? "" : `<p class="xp-empty">No questions yet. Write some, or ask the model for a set.</p>`;
  /* the school's logo, very faint, behind every page: a page-sized tile on screen,
     a fixed image (repeated on every printed page) in print */
  const wm = head.logo
    ? "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297"><image href="${head.logo}" x="65" y="103" width="80" height="80" preserveAspectRatio="xMidYMid meet" opacity="0.045"/></svg>`)
    : "";
  return `<article class="xp${wm ? " xp--wm" : ""}${head.tint ? " xp--tint" : ""}${head.omr ? " xp--omr" : ""}" style="--c:${col.main};--cs:${col.soft};--ci:${col.ink}${wm ? `;--wm:url(&quot;${wm}&quot;)` : ""}">
    ${head.logo ? `<img class="xp-wm" src="${head.logo}" alt="" />` : ""}
    ${header(head, totalMarks(questions))}
    ${body}${empty}
    ${head.omr && numbered.length ? omrSheet(numbered) : ""}
    ${head.theorySheet && numbered.length ? theorySheet(numbered) : ""}
    ${head.key && numbered.length ? key(numbered, head) : ""}
  </article>`;
}
