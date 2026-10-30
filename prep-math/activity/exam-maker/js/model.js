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
  sub:    { label: "Subjective",      section: "Section B", head: "Short answer",    rule: "Answer every question. Show your working.", marks: 3, lines: 4 },
  theory: { label: "Theory",          section: "Section C", head: "Theory",          rule: "Answer in full. Marks are given for method.", marks: 10, lines: 10 },
};
export const ORDER = ["mcq", "sub", "theory"];

export const COLOURS = [
  { id: "indigo", name: "Indigo", main: "#3b4cca", soft: "#e8ebfb" },
  { id: "teal",   name: "Teal",   main: "#0e8a7d", soft: "#dff4f1" },
  { id: "crimson", name: "Crimson", main: "#c0392b", soft: "#fbe7e4" },
  { id: "amber",  name: "Amber",  main: "#c9780a", soft: "#fdeed5" },
  { id: "forest", name: "Forest", main: "#2f7d32", soft: "#e3f2e4" },
  { id: "plum",   name: "Plum",   main: "#8e3b9c", soft: "#f3e5f6" },
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
  logo: "", colour: "indigo", paper: "a4", key: false, breaks: false,
};

/** Whatever came in (storage, the model), coerced into a well-formed question. */
export function clean(q) {
  const type = TYPES[q && q.type] ? q.type : "mcq";
  const t = TYPES[type];
  const str = (v) => (v == null ? "" : String(v));
  const num = (v, d, lo, hi) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };
  const out = {
    id: str(q && q.id) || newId(), type, text: str(q && q.text).trim(),
    options: [], answer: type === "mcq" ? 0 : str(q && q.answer).trim(),
    marks: num(q && q.marks, t.marks, 0, 100), lines: num(q && q.lines, t.lines, 0, 40),
    svg: str(q && q.svg),
  };
  if (type === "mcq") {
    const o = Array.isArray(q && q.options) ? q.options.map(str) : [];
    while (o.length < 4) o.push("");
    out.options = o.slice(0, 4).map((s) => s.trim());
    let a = q && q.answer;
    if (typeof a === "string" && /^[A-Da-d]$/.test(a.trim())) a = "ABCD".indexOf(a.trim().toUpperCase());
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
  const s = String(src == null ? "" : src);
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
  if (/mcq|multiple|choice|objective/.test(s)) return "mcq";
  if (/theory|essay|long/.test(s)) return "theory";
  return "sub";
}

/** The instructions the model gets. It writes content; it is told nothing about layout. */
export function promptFor({ topic, subject, level, mcq, sub, theory, svg }) {
  const system =
    "You write school examination questions. Reply with ONE JSON object only: " +
    '{"questions":[{"type":"mcq"|"sub"|"theory","text":"...","options":["...","...","...","..."],"answer":0,"marks":1,"svg":""}]}. ' +
    "Rules: 'options' and 'answer' (the index 0-3 of the correct option) are only for mcq; for sub and theory 'answer' is a short model answer or marking note. " +
    "Write every piece of mathematics in TeX between single dollar signs, like $\\frac{3}{4}$ or $x^2+5x+6=0$, and use a double backslash for every TeX command inside the JSON string. " +
    "Never put a raw newline inside a string; write the two characters \\n only where a line break is wanted. " +
    "Questions must be original, correct, unambiguous and suited to the level. MCQ distractors must be plausible and exactly one option is right. " +
    "Marks: mcq 1, sub 2 to 5, theory 6 to 15. Theory questions may have parts (a), (b), (c) separated by \\n. " +
    (svg
      ? "Where a question truly needs a figure (geometry, a graph, a shape, a number line) put a small self-contained SVG in 'svg': one <svg> element with a viewBox, black strokes, no fill colours, no scripts, labels in <text>. Otherwise leave 'svg' empty. "
      : "Leave 'svg' empty. ");
  const counts = [mcq && `${mcq} multiple-choice`, sub && `${sub} subjective (short-answer)`, theory && `${theory} theory`].filter(Boolean).join(", ");
  const prompt = `Subject: ${subject || "Mathematics"}\nLevel: ${level || "secondary school"}\nTopic: ${topic || "a mixed selection of topics"}\nWrite: ${counts}.\nOrder them multiple-choice first, then subjective, then theory.`;
  return { system, prompt };
}

/** Marks added up. */
export const totalMarks = (qs) => qs.reduce((s, q) => s + (Number(q.marks) || 0), 0);
