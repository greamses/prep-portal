/* ============================================================================
   Exam Maker — the data and the pure parts
   ----------------------------------------------------------------------------
   Nothing here touches the page, so it can be tested in node. A question is

     { id, type: "mcq" | "sub" | "theory", text, options[4], answer, marks,
       lines, svg }

   and the paper is a header plus a list of those. The model that writes the
   questions only ever fills these fields; how they sit on the page is decided
   by paper.js, never by the model.
   ========================================================================== */

export const TYPES = {
  mcq:    { label: "Multiple choice", section: "Section A", head: "Multiple choice", rule: "Choose the one correct answer, A, B, C or D.", marks: 1, lines: 0 },
  fill:   { label: "Fill in the blank", section: "Section B", head: "Fill in the blank", rule: "Write the missing word or number on the line.", marks: 1, lines: 0 },
  sub:    { label: "Subjective",      section: "Section B", head: "Short answer",    rule: "Answer every question. Show your working.", marks: 2, lines: 4 },
  theory: { label: "Theory",          section: "Section C", head: "Theory",          rule: "Answer in full. Marks are given for method.", marks: 4, lines: 10 },
};
export const ORDER = ["mcq", "fill", "sub", "theory"];

/* Muted on purpose: `main` is the glass and the fills, `soft` the tint of the
   section receipts, `ink` the deeper tone every small text and badge is set in.
   (The ids are the first palette's and stay, so a saved choice still resolves.) */
export const COLOURS = [
  { id: "indigo",  name: "Slate blue", main: "#7c8bbd", soft: "#eceff7", ink: "#3d4a7a" },
  { id: "teal",    name: "Sage",       main: "#7fb0a3", soft: "#e8f1ee", ink: "#35695d" },
  { id: "crimson", name: "Rose",       main: "#c98f8a", soft: "#f7ebe9", ink: "#86413c" },
  { id: "amber",   name: "Sand",       main: "#cfaa73", soft: "#f7efe1", ink: "#7a5a22" },
  { id: "forest",  name: "Moss",       main: "#96b07f", soft: "#edf2e6", ink: "#476233" },
  { id: "plum",    name: "Mauve",      main: "#b093b8", soft: "#f2eaf4", ink: "#6b4a74" },
];

let n = 0;
export const newId = () => `q${Date.now().toString(36)}${(n++).toString(36)}`;

export function blank(type) {
  const t = TYPES[type] || TYPES.mcq;
  return {
    id: newId(), type: TYPES[type] ? type : "mcq", text: "",
    options: type === "mcq" ? ["", "", "", ""] : [],
    answer: type === "mcq" ? 0 : "", marks: t.marks, lines: t.lines, svg: "",
  };
}

export const BLANK_HEAD = {
  school: "", term: "", year: "", subject: "", date: "", klass: "", time: "",
  logo: "", colour: "indigo", paper: "a4", key: false, breakAt: {},
  /* what each question in a section is worth; every question follows its section
     until its own marks are changed */
  marksEach: { mcq: 1, fill: 1, sub: 2, theory: 4 },
};

/* ── TeX as models actually write it ───────────────────────────────────── */

const CMD = "times|div|frac|dfrac|sqrt|pi|cdot|neq|leq|geq|le|ge|pm|theta|alpha|beta|angle|triangle|circ|infty|approx|rightarrow|sum|int|log|sin|cos|tan|ldots|overline|vec|hat|mathrm|text|left|right";

/**
 * A model's TeX, made the way this page writes it ($…$, one backslash):
 *   \\times           (escaped twice by the model)  →  \times
 *   \( … \) / \[ … \]                                →  $ … $ / $$ … $$
 *   2\times4 with no dollars at all                  →  $2\times4$
 * `whole` wraps a short string (an option) entire when it holds a command.
 * Safe to run again: a clean string comes back unchanged.
 */
export function fixTex(src, whole = false) {
  let s = String(src == null ? "" : src);
  /* no \b after the name: "\\times1" has no word boundary between s and 1 */
  s = s.replace(new RegExp("\\\\{2,}(?=(?:" + CMD + "))", "g"), "\\");
  s = s.replace(/\\{1,2}\(([\s\S]*?)\\{1,2}\)/g, "$$$1$$");
  s = s.replace(/\\{1,2}\[([\s\S]*?)\\{1,2}\]/g, "$$$$$1$$$$");
  if (s.indexOf("\\") < 0) return s;
  if (whole && s.indexOf("$") < 0) return `$${s.trim()}$`;
  const run = /(?:[A-Za-z0-9]+\s*)?\\[a-zA-Z]+(?:\{[^{}]*\})*(?:\s*[A-Za-z0-9^]+)?/g;
  return s.split("$").map((seg, i) => (i % 2 ? seg : seg.replace(run, (m) => `$${m.trim()}$`))).join("$");
}

/** Whatever came in (storage, the model), coerced into a well-formed question. */
export function clean(q) {
  const type = TYPES[q && q.type] ? q.type : "mcq";
  const t = TYPES[type];
  const str = (v) => (v == null ? "" : String(v));
  const num = (v, d, lo, hi) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };
  const out = {
    id: str(q && q.id) || newId(), type, text: fixTex(str(q && q.text)).trim(),
    options: [], answer: type === "mcq" ? 0 : fixTex(str(q && q.answer)).trim(),
    marks: num(q && q.marks, t.marks, 0, 100), lines: num(q && q.lines, t.lines, 0, 40),
    svg: str(q && q.svg),
  };
  if (type === "mcq") {
    const o = Array.isArray(q && q.options) ? q.options.map(str) : [];
    while (o.length < 4) o.push("");
    out.options = o.slice(0, 4).map((s) => fixTex(s, true).trim());
    let a = q && q.answer;
    if (typeof a === "string" && /^[A-Da-d]$/.test(a.trim())) a = "ABCD".indexOf(a.trim().toUpperCase());
    /* an answer given as the option's own text, not its index */
    if (typeof a === "string" && !/^\d$/.test(a.trim())) {
      const k = out.options.findIndex((o) => norm(o) === norm(a));
      if (k >= 0) a = k;
    }
    out.answer = num(a, 0, 0, 3);
  }
  return out;
}

/* ── maths in the text ─────────────────────────────────────────────────── */

const ESC = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export { ESC as esc };

/**
 * Plain text with $maths$ in it → safe HTML MathJax can typeset.
 * $…$ becomes \(…\) and $$…$$ becomes \[…\]; text outside is escaped, new
 * lines become <br>. A lone "$" (a price) is left alone when it has no partner.
 */
export function textHtml(src) {
  const s = fixTex(src);
  let out = "", i = 0;
  const plain = (t) => ESC(t).replace(/\r?\n/g, "<br>");
  while (i < s.length) {
    const d = s.indexOf("$", i);
    if (d < 0) { out += plain(s.slice(i)); break; }
    const dbl = s[d + 1] === "$";
    const open = dbl ? "$$" : "$";
    const close = s.indexOf(open, d + open.length);
    if (close < 0 || close === d + open.length) { out += plain(s.slice(i, d + 1)); i = d + 1; continue; }
    out += plain(s.slice(i, d));
    const tex = ESC(s.slice(d + open.length, close));
    out += dbl ? `\\[${tex}\\]` : `\\(${tex}\\)`;
    i = close + open.length;
  }
  return out;
}

/**
 * A fill-in-the-blank's HTML, with its blank drawn as `blank`.
 *
 * The blank is often INSIDE the maths ("$7,842 + 1,159 = ______$"). An HTML
 * element cannot sit in the middle of a formula: MathJax reads a delimiter pair
 * only inside one run of text, so the whole sentence stayed raw as "\(7,842 …
 * \)". So the formula is cut around the blank instead: "$7,842 + 1,159 =$"
 * blank "$$". Where the blank is inside braces (a fraction) it cannot be cut,
 * and becomes a blank drawn by TeX itself.
 */
export function blankHtml(src, blank) {
  const s = fixTex(src);
  let out, inTex = false;
  if (s.indexOf("$$") >= 0) out = s;
  else {
    out = s.split("$").map((seg, i) => {
      if (i % 2 === 0 || !/_{3,}/.test(seg)) return i % 2 ? `$${seg}$` : seg;
      if (/[{}]/.test(seg)) { inTex = true; return `$${seg.replace(/_{3,}/g, "\\underline{\\phantom{0000}}")}$`; }
      return seg.split(/_{3,}/).map((b, k) => (k ? "\u0001" : "") + (b.trim() ? `$${b.trim()}$` : "")).join("");
    }).join("");
  }
  const html = textHtml(out);
  return /\u0001|_{3,}/.test(html) ? html.replace(/\u0001|_{3,}/g, blank) : inTex ? html : `${html} ${blank}`;
}

/* ── the model's JSON ──────────────────────────────────────────────────── */

/**
 * Models write TeX into JSON strings with a single backslash ("\frac"), which
 * JSON.parse either rejects or quietly turns into a form feed. Every lone
 * backslash is doubled; ones already doubled, or escaping a quote, are kept.
 */
export function repairJson(raw) {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c !== "\\") { out += c; continue; }
    const nx = raw[i + 1];
    if (nx === "\\") { out += "\\\\"; i++; continue; }
    if (nx === '"' || nx === "/") { out += c + nx; i++; continue; }
    out += "\\\\";
  }
  return out;
}

/** The model's reply → clean questions. Throws if there is nothing usable. */
export function parseQuestions(text) {
  let t = String(text || "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  const arr = t.indexOf("["), arrEnd = t.lastIndexOf("]");
  if (a < 0 && arr < 0) throw new Error("The model did not send any questions.");
  const useArr = arr >= 0 && (a < 0 || arr < a);
  const body = useArr ? t.slice(arr, arrEnd + 1) : t.slice(a, b + 1);
  const data = JSON.parse(repairJson(body));
  const list = Array.isArray(data) ? data : data.questions;
  if (!Array.isArray(list) || !list.length) throw new Error("The model did not send any questions.");
  /* repairJson doubled the model's "\n", so a line break arrives as a literal
     backslash-n. Only the stretches OUTSIDE $ $ are touched: inside, "\neq"
     is TeX. (Splitting on "$" puts the maths at the odd positions.) */
  const br = (v) => (typeof v === "string"
    ? v.split("$").map((seg, i) => (i % 2 ? seg : seg.replace(/\\n/g, "\n"))).join("$")
    : v);
  return list.map((q) => clean({
    ...q, type: normType(q && q.type), text: br(q && q.text), answer: br(q && q.answer),
    options: Array.isArray(q && q.options) ? q.options.map(br) : q && q.options,
  })).filter((q) => q.text);
}

function normType(t) {
  const s = String(t || "").toLowerCase();
  if (/fill|blank|cloze/.test(s)) return "fill";
  if (/mcq|multiple|choice|objective/.test(s)) return "mcq";
  if (/theory|essay|long/.test(s)) return "theory";
  return "sub";
}

/** The instructions the model gets. It writes content; it is told nothing about layout. */
export function promptFor({ topic, subject, level, need, svg, extra, seen = [], faults = [] }) {
  const system =
    "You are setting a school examination paper. The teacher's brief is BINDING: obey every rule below exactly, and never add, skip or swap anything. " +
    "Reply with ONE JSON object and nothing else, in this shape: " +
    '{"questions":[{"type":"mcq"|"fill"|"sub"|"theory","text":"...","options":["...","...","...","..."],"answer":0,"svg":""}]}. ' +
    "RULES. " +
    "1. COUNTS: write exactly the number of each type asked for, no more and no fewer, ordered mcq, fill, sub, theory. " +
    "2. SCOPE: every question is about the TOPIC given, at the LEVEL given, in the SUBJECT given. Do not drift to other topics or other levels. " +
    "3. MCQ: exactly four options, all different, exactly one correct. 'answer' is the index 0 to 3 of the correct option. Solve the question yourself before you choose the index. Distractors must be plausible. " +
    "4. FILL: ONE sentence with exactly one blank written as six underscores (______). 'answer' is the missing word or number; 'options' is []. " +
    "5. SUB and THEORY: 'answer' is a model answer or marking note and is never empty; 'options' is []. Do not choose marks: the teacher sets them. Theory may have parts (a), (b), (c) separated by \\n. " +
    "6. MATHS: write every piece of mathematics in TeX between single dollar signs, like $\\frac{3}{4}$ or $x^2+5x+6=0$, with a double backslash for each TeX command inside the JSON string. Never write maths as plain text. " +
    "7. Never put a raw newline inside a string; write the two characters \\n where a line break is wanted. " +
    "8. Every question is original, correct, unambiguous and answerable from what is written. Never repeat a question listed under ALREADY WRITTEN. " +
    (svg
      ? "9. DIAGRAMS: where a question truly needs a figure (geometry, a graph, a shape, a number line) put a small self-contained SVG in 'svg': one <svg> element with a viewBox, black strokes, no fill colours, no scripts, labels in <text>. Otherwise 'svg' is \"\". "
      : "9. DIAGRAMS: 'svg' is always \"\". ") +
    "10. The teacher's FURTHER INSTRUCTIONS are part of the brief and equally binding. If one conflicts with the JSON format or rules 3 to 7, the format wins.";
  const label = { mcq: "multiple-choice (mcq)", fill: "fill-in-the-blank (fill)", sub: "subjective short-answer (sub)", theory: "theory (theory)" };
  const counts = Object.keys(label).filter((t) => need && need[t] > 0).map((t) => `${need[t]} ${label[t]}`).join(", ");
  const prompt =
    `SUBJECT: ${subject || "Mathematics"}\nLEVEL: ${level || "secondary school"}\nTOPIC: ${topic || "a mixed selection of the subject's topics"}\n` +
    `WRITE EXACTLY: ${counts}.` +
    (extra && extra.trim() ? `\nFURTHER INSTRUCTIONS (binding):\n${extra.trim()}` : "") +
    (seen.length ? `\nALREADY WRITTEN (do not repeat or paraphrase):\n${seen.map((s) => `- ${String(s).replace(/\s+/g, " ").slice(0, 110)}`).join("\n")}` : "") +
    (faults.length ? `\nFAULTS IN YOUR LAST ATTEMPT (put them right; write only what is asked above):\n${faults.map((f) => `- ${f}`).join("\n")}` : "");
  return { system, prompt };
}

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").replace(/\$/g, "").trim();

/**
 * The model's questions held to the brief, in code, not on trust.
 *   opts.svg   diagrams were asked for
 *   opts.seen  texts already kept (a repeat is a fault)
 *   opts.marksEach  what each type is worth (the teacher's scheme)
 * → { good: the ones that obey every rule, faults: what was wrong with the rest }
 */
export function checkQuestions(list, { svg = false, seen = [], marksEach = {} } = {}) {
  const good = [], faults = [], texts = new Set(seen.map(norm));
  list.forEach((q, i) => {
    const tag = `${TYPES[q.type].label} question "${q.text.slice(0, 40)}"`;
    const bad = (why) => faults.push(`${tag}: ${why}`);
    if (q.text.length < 8) return bad("the question is too short to be a question");
    if (texts.has(norm(q.text))) return bad("it repeats a question already written");
    if (q.type === "mcq") {
      const o = q.options.map(norm);
      if (o.some((x) => !x)) return bad("it needs exactly four non-empty options");
      if (new Set(o).size !== 4) return bad("the four options must all be different");
    } else {
      q.options = [];
      if (!q.answer) return bad("it has no model answer");
    }
    if (q.type === "fill") {
      const blanks = q.text.match(/_{3,}/g) || [];
      if (blanks.length !== 1) return bad("a fill question needs exactly one blank written as ______");
      q.text = q.text.replace(/_{3,}/, "______");
    }
    /* equal scoring: a section's questions are all worth what the teacher set for it */
    q.marks = Number.isFinite(marksEach[q.type]) ? marksEach[q.type] : TYPES[q.type].marks;
    if (!svg) q.svg = "";
    texts.add(norm(q.text));
    good.push(q);
  });
  return { good, faults };
}

/** Questions beyond what was asked for are dropped (the model was told: exactly). */
export function limitTo(list, need) {
  const left = { ...need };
  return list.filter((q) => (left[q.type] > 0 ? (left[q.type]--, true) : false));
}

/**
 * A second, independent look: the model is given each multiple-choice and
 * fill question WITHOUT its answer and asked to solve it. A disagreement means
 * the question or its key is wrong, so it is dropped and rewritten.
 */
export function verifyPrompt(qs) {
  const system =
    "You are checking examination questions. For each question work out the correct answer yourself, carefully. " +
    'Reply with ONE JSON object only: {"checks":[{"n":1,"answer":2}]}. For a multiple-choice question "answer" is the index 0 to 3 of the only correct option, or -1 if none or more than one option is correct. ' +
    'For a fill question "answer" is the missing word or number. Write TeX with a double backslash for each command.';
  const prompt = qs.map((q, i) => q.type === "mcq"
    ? `${i + 1}. [mcq] ${q.text}\n   0) ${q.options[0]}\n   1) ${q.options[1]}\n   2) ${q.options[2]}\n   3) ${q.options[3]}`
    : `${i + 1}. [fill] ${q.text}`).join("\n");
  return { system, prompt };
}

/** Apply the checker's reply: → { good, faults }. An unreadable reply drops nothing. */
export function applyChecks(qs, reply) {
  let checks;
  try {
    const t = String(reply || "");
    const data = JSON.parse(repairJson(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)));
    checks = Array.isArray(data.checks) ? data.checks : null;
  } catch { checks = null; }
  if (!checks) return { good: qs, faults: [] };
  const good = [], faults = [];
  const same = (a, b) => {
    const x = norm(a).replace(/[\s,]/g, ""), y = norm(b).replace(/[\s,]/g, "");
    return x === y || (x !== "" && Number.isFinite(+x) && Number.isFinite(+y) && +x === +y);
  };
  qs.forEach((q, i) => {
    const c = checks.find((k) => +k.n === i + 1);
    if (!c) { good.push(q); return; }
    const ok = q.type === "mcq" ? Number(c.answer) === q.answer : same(c.answer, q.answer);
    if (ok) good.push(q);
    else faults.push(`${TYPES[q.type].label} question "${q.text.slice(0, 40)}": the stated answer is not what solving it gives, so the question or its key is wrong`);
  });
  return { good, faults };
}

/**
 * The prompt that draws ONE question's diagram. The model is shown the whole
 * question (text and options) so the drawing carries the numbers and labels the
 * question uses, plus whatever the teacher says it should show.
 */
export function svgPrompt(q, brief = "", fault = "") {
  const system =
    "You draw diagrams for school examination questions as SVG. Reply with the SVG markup only, no explanation and no code fence. " +
    "Rules: one <svg> element with xmlns and a viewBox (for example 0 0 220 150), and no width or height. " +
    "Draw in black lines (stroke='#1d1b18', stroke-width='1.6'), fill='none' or a very light grey (#eeeeee) only. Leave a margin of 12 units inside the viewBox. " +
    "Every length, angle, point and name the question mentions must be labelled in <text> (font-size='11', text-anchor set), placed beside what it labels and never over a line. " +
    "Draw to scale where the numbers allow it, and mark right angles with a small square. For a graph draw labelled axes with ticks. " +
    "Use single quotes for every attribute. No scripts, no images, no foreignObject, no external links. " +
    "The diagram must show what the question describes and must not reveal the answer.";
  const opts = q.type === "mcq" ? `\nOptions: ${q.options.join(" | ")}` : "";
  const prompt = `Question: ${q.text.replace(/\s+/g, " ")}${opts}` +
    (brief.trim() ? `\nThe teacher wants the diagram to show: ${brief.trim()}` : "") +
    (fault ? `\nYour last attempt was rejected: ${fault}. Reply with one valid, well-formed SVG element.` : "");
  return { system, prompt };
}

/** The <svg> out of a model's reply, however it was wrapped (fence, JSON string, prose). */
export function extractSvg(text) {
  const t = String(text || "");
  const a = t.indexOf("<svg"), b = t.lastIndexOf("</svg>");
  if (a < 0 || b < a) return "";
  return t.slice(a, b + 6)
    .replace(/\\"/g, '"').replace(/\\\//g, "/").replace(/\\n/g, " ").replace(/\\t/g, " ");
}

/** Marks added up. */
export const totalMarks = (qs) => qs.reduce((s, q) => s + (Number(q.marks) || 0), 0);
