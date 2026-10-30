/* ============================================================================
   Exam Maker — the paper
   ----------------------------------------------------------------------------
   Questions in, HTML out. The layout is decided here and only here: a coloured
   header on page one, then Section A (multiple choice, two columns), Section B
   (short answer, ruled space) and Section C (theory, longer ruled space), and
   optionally the answer key on a page of its own. All maths goes through
   textHtml() so it is written as \( \) for MathJax to typeset afterwards.
   ========================================================================== */

import { TYPES, ORDER, COLOURS, textHtml, esc, totalMarks } from "./model.js";

/* ── diagrams ──────────────────────────────────────────────────────────── */

/**
 * A pasted or uploaded SVG made safe to put on the page: only an <svg> root,
 * no scripts, no foreignObject, no event handlers, no outside links.
 * → the cleaned markup, or "" if it is not an SVG.
 */
export function cleanSvg(src) {
  const text = String(src || "").trim();
  if (!text) return "";
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
  return new XMLSerializer().serializeToString(root);
}

/* ── the pieces ────────────────────────────────────────────────────────── */

const figure = (q) => {
  const s = cleanSvg(q.svg);
  return s ? `<div class="xp-svg">${s}</div>` : "";
};

const letter = (i) => "ABCD"[i];

function mcq(q, no) {
  return `<div class="xp-q xp-q--mcq">
    <span class="xp-n" data-nomath>${no}</span>
    <div class="xp-body">
      <div class="xp-text">${textHtml(q.text)}</div>
      ${figure(q)}
      <ol class="xp-opts">${q.options.map((o, i) => `<li><b data-nomath>${letter(i)}</b><span>${textHtml(o)}</span></li>`).join("")}</ol>
    </div>
  </div>`;
}

function written(q, no) {
  const rows = Math.max(0, q.lines | 0);
  return `<div class="xp-q xp-q--${q.type}">
    <span class="xp-n" data-nomath>${no}</span>
    <div class="xp-body">
      <div class="xp-text">${textHtml(q.text)}${q.marks ? `<span class="xp-marks" data-nomath>[${q.marks} ${q.marks === 1 ? "mark" : "marks"}]</span>` : ""}</div>
      ${figure(q)}
      ${rows ? `<div class="xp-lines" style="--rows:${rows}"></div>` : ""}
    </div>
  </div>`;
}

/** A fill-in-the-blank: the sentence, and ONE short line where the answer goes.
    "______" in the text is the blank; with none, the line follows the sentence. */
function fill(q, no) {
  const blank = `<span class="xp-blank"></span>`;
  let html = textHtml(q.text);
  html = /_{3,}/.test(html) ? html.replace(/_{3,}/g, blank) : `${html} ${blank}`;
  return `<div class="xp-q xp-q--fill">
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

/**
 * The whole paper as HTML.
 *   head       the header fields (model.js BLANK_HEAD)
 *   questions  clean questions, in the order they were written
 */
export function paperHtml(head, questions) {
  const col = COLOURS.find((c) => c.id === head.colour) || COLOURS[0];
  const groups = ORDER.map((t) => [t, questions.filter((q) => q.type === t)]).filter(([, l]) => l.length);
  let no = 0;
  const numbered = [];
  const body = groups.map(([t, list], gi) => {
    const html = list.map((q) => { numbered.push(q); return t === "mcq" ? mcq(q, ++no) : t === "fill" ? fill(q, ++no) : written(q, ++no); }).join("");
    return `<section class="xp-sec xp-sec--${t}${gi && head.breakAt && head.breakAt[t] ? " xp-sec--page" : ""}">${banner(t, list, gi)}${t === "mcq" ? `<div class="xp-cols">${html}</div>` : html}</section>`;
  }).join("");
  const empty = groups.length ? "" : `<p class="xp-empty">No questions yet. Write some, or ask the model for a set.</p>`;
  /* the school's logo, very faint, behind every page: a page-sized tile on screen,
     a fixed image (repeated on every printed page) in print */
  const wm = head.logo
    ? "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297"><image href="${head.logo}" x="65" y="103" width="80" height="80" preserveAspectRatio="xMidYMid meet" opacity="0.07"/></svg>`)
    : "";
  return `<article class="xp${wm ? " xp--wm" : ""}" style="--c:${col.main};--cs:${col.soft};--ci:${col.ink}${wm ? `;--wm:url(&quot;${wm}&quot;)` : ""}">
    ${head.logo ? `<img class="xp-wm" src="${head.logo}" alt="" />` : ""}
    ${header(head, totalMarks(questions))}
    ${body}${empty}
    ${head.key && numbered.length ? key(numbered, head) : ""}
  </article>`;
}
