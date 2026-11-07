/**
 * Put the maths in the past-question archive (alocQuestions) into MathJax.
 *
 * The archive came in as plain text: 5/3 for a fraction, x<sup>2</sup> for a
 * power, × and π loose in the sentence, and options the same way. This asks the
 * model to rewrite ONLY the formatting of a question, its options and its
 * solution as \( … \) LaTeX, never the words, the numbers or the option order,
 * then checks that before writing:
 *   - the same number of options, in the same order (the answer index stays right)
 *   - the same numbers, in the same order, in the question and in every option
 * Anything that fails a check is left as it was and listed for a person to fix.
 * The original text is kept on the document (raw.question / raw.options /
 * raw.solution) so any rewrite can be undone.
 *
 *   node scripts/format-aloc-math.js --dry --limit=5     show, write nothing
 *   node scripts/format-aloc-math.js                     do every maths question that needs it
 *   node scripts/format-aloc-math.js --undo              put the originals back
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });
const { callModelRaw, safeJson } = require("../routes/cbt").helpers;

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const DRY = !!args.dry, UNDO = !!args.undo, LIMIT = args.limit ? Number(args.limit) : Infinity;
const SUBJECT = args.subject || "mathematics";

const hasDelim = (t) => /\\\(|\\\[|\$/.test(t);
const mathy = (t) => /[\^_=]|\d\s*\/\s*\d|sqrt|\\frac|\b[a-z]\d|\d[a-z]\b|[√π×÷≤≥²³]|\blog\b|\bsin\b|\bcos\b|\btan\b|<sup>|<sub>/i.test(t);
const needs = (x) => {
  const all = [x.question, ...(x.options || []), typeof x.solution === "string" ? x.solution : ""].map((v) => String(v || ""));
  return all.some((t) => mathy(t) && !hasDelim(t));
};

/* JSON turns \frac, \times, \beta… into form-feed, tab, backspace: put them back */
function fixLatex(s) {
  let out = "";
  for (const ch of String(s)) {
    const c = ch.charCodeAt(0);
    if (c === 12) out += "\\f"; else if (c === 9) out += "\\t"; else if (c === 8) out += "\\b";
    else if (c === 13) out += "\\r"; else out += ch;   // a newline stays a newline (below)
  }
  // A newline that is really the \n of \nu, \neq, \nabla, \not… (JSON made it a line
  // break) is put back; any other newline was a line break in the source.
  return out.replace(/\n(?=(?:u|eq|abla|ot|e|i|leq|geq|mid|parallel|subseteq)\b)/g, "\\n");
}

/* The model's JSON, read even when it writes LaTeX with ONE backslash (\( \sqrt …),
   which is not a JSON escape: such a backslash is doubled before parsing. The real
   escapes (\" \\ \/ \b \f \n \r \t \u) are left to JSON, and fixLatex turns the
   ones that were really \beta, \frac, \neq, \rightarrow, \times back afterwards. */
function parseLoose(text) {
  let t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const m = t.match(/\{[\s\S]*\}/);
  if (m) t = m[0];
  try { return JSON.parse(t); } catch (_) { /* fall through */ }
  try { return JSON.parse(t.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")); } catch (_) { /* fall through */ }
  return safeJson(text);
}

/* the numbers in a piece of text, in order, read the same way from both forms */
function numbersOf(t) {
  const s = String(t)
    .replace(/<sup>(.*?)<\/sup>/gi, " $1 ").replace(/<sub>(.*?)<\/sub>/gi, " $1 ").replace(/<[^>]+>/g, " ")
    .replace(/\\[a-zA-Z]+/g, " ").replace(/[²]/g, " 2 ").replace(/[³]/g, " 3 ");
  return (s.match(/\d+(?:\.\d+)?/g) || []).join(" ");
}

const PROMPT = (x) => `You format exam questions for MathJax. Rewrite ONLY the formatting of this past mathematics question, its options and its solution.

Rules:
- Put every piece of mathematics inside \\( ... \\) inline LaTeX: fractions as \\frac{a}{b}, powers as x^{2} (the source writes them as <sup>2</sup>), roots as \\sqrt{...}, \\times, \\div, \\pi, \\theta, degrees as ^{\\circ}, matrices as \\begin{pmatrix}...\\end{pmatrix}.
- Remove HTML tags (<sup>, <sub>, <br>) once they are turned into LaTeX.
- Do NOT change any word, number, unit or value. Do NOT solve, correct or improve the question. Do NOT reorder, add or remove options.
- Ordinary words stay outside the \\( \\). Units may sit outside: \\(24\\text{ cm}^{2}\\) or \\(24\\) cm\\(^{2}\\) are both fine.
- If the source is garbled and you cannot tell what was meant, format it as it is.
- Return JSON only: {"question": "...", "options": ["...", ...], "solution": "..."}. In JSON, write every backslash doubled (\\\\frac).

Question: ${JSON.stringify(String(x.question || ""))}
Options: ${JSON.stringify((x.options || []).map(String))}
Solution: ${JSON.stringify(typeof x.solution === "string" ? x.solution : "")}`;

(async () => {
  const db = admin.firestore();
  const snap = await db.collection("alocQuestions").where("subject", "==", SUBJECT).get();

  if (UNDO) {
    let n = 0;
    for (const d of snap.docs) {
      const raw = d.data().raw;
      if (!raw) continue;
      await d.ref.update({ question: raw.question, options: raw.options, solution: raw.solution ?? "", raw: admin.firestore.FieldValue.delete(), formattedAt: admin.firestore.FieldValue.delete() });
      // and the one bank's copy of it
      const inBank = db.collection("cbtQuestions").doc(d.id);
      if ((await inBank.get()).exists) {
        await inBank.update({ question: raw.question, options: raw.options, explanation: raw.solution ?? "", raw: admin.firestore.FieldValue.delete(), formattedAt: admin.firestore.FieldValue.delete() });
      }
      n++;
    }
    console.log(`put back ${n} originals`);
    process.exit(0);
  }

  // --shard=k/n: this run takes every n-th question starting at k (run n of them side by side)
  const [K, N] = String(args.shard || "0/1").split("/").map(Number);
  const todo = snap.docs.filter((d) => !d.data().raw && needs(d.data())).filter((_, i) => i % N === K).slice(0, LIMIT);
  console.log(`${snap.size} ${SUBJECT} questions; ${todo.length} to format${DRY ? " (dry run)" : ""}`);
  const done = [], held = [];
  for (const d of todo) {
    const x = d.data();
    let out;
    const t0 = Date.now();
    try { out = parseLoose(await callModelRaw(PROMPT(x), true, ["groq", "gemini"])); }
    catch (e) { held.push({ id: d.id, why: `model: ${e.message}` }); continue; }
    if (!out || typeof out.question !== "string" || !Array.isArray(out.options)) { held.push({ id: d.id, why: "no usable reply" }); continue; }
    const q = fixLatex(out.question).trim();
    const opts = out.options.map((o) => fixLatex(String(o)).trim());
    const sol = fixLatex(String(out.solution ?? "")).trim();
    const was = (x.options || []).map(String);
    // the checks
    if (opts.length !== was.length) { held.push({ id: d.id, why: `options ${was.length} -> ${opts.length}` }); continue; }
    if (numbersOf(q) !== numbersOf(x.question)) { held.push({ id: d.id, why: `question numbers changed: [${numbersOf(x.question)}] -> [${numbersOf(q)}]` }); continue; }
    const badOpt = opts.findIndex((o, k) => numbersOf(o) !== numbersOf(was[k]));
    if (badOpt >= 0) { held.push({ id: d.id, why: `option ${badOpt + 1} numbers changed: [${numbersOf(was[badOpt])}] -> [${numbersOf(opts[badOpt])}]` }); continue; }
    // the rewrite must actually have put the maths in delimiters
    if (mathy(q) && !hasDelim(q)) { held.push({ id: d.id, why: "question still has maths outside \\( \\)" }); continue; }
    const looseOpt = opts.findIndex((o) => mathy(o) && !hasDelim(o));
    if (looseOpt >= 0) { held.push({ id: d.id, why: `option ${looseOpt + 1} still has maths outside \\( \\)` }); continue; }
    done.push({ id: d.id, before: { q: x.question, o: was }, after: { q, o: opts } });
    console.log(`  ok ${d.id} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    if (!DRY) {
      await d.ref.update({
        question: q, options: opts, ...(typeof x.solution === "string" && sol ? { solution: sol } : {}),
        raw: { question: x.question ?? "", options: x.options ?? [], solution: x.solution ?? "" },
        formattedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      // the one bank's copy of this question (lib/one-bank.js), if it has been moved there
      const inBank = db.collection("cbtQuestions").doc(d.id);
      if ((await inBank.get()).exists) {
        await inBank.update({
          question: q, options: opts, ...(typeof x.solution === "string" && sol ? { explanation: sol } : {}),
          raw: { question: x.question ?? "", options: x.options ?? [], solution: x.solution ?? "" },
          formattedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }
  const show = DRY ? done : done.slice(0, 3);
  show.forEach((r) => console.log(`\n${r.id}\n  before: ${String(r.before.q).replace(/\s+/g, " ").slice(0, 160)}  |  ${r.before.o.join("  ·  ")}\n  after:  ${r.after.q.slice(0, 200)}  |  ${r.after.o.join("  ·  ")}`));
  console.log(`\n${DRY ? "would format" : "formatted"} ${done.length}; held back ${held.length}`);
  held.forEach((h) => console.log(`  held ${h.id}: ${h.why}`));
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
