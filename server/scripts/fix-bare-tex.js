/**
 * Mechanical MathJax repairs across the one bank (no model involved):
 *   inside \( \) or $ $   bare pi, infty, sqrt, sin/cos/tan/log, theta… get their backslash;
 *                         sqrt(x) becomes \sqrt{x}
 *   outside the maths     π, √N, ∞ (with a number in front: 8π, 2√3) are put into \( \)
 *                         a literal "\n" (left by an earlier run) becomes a line break
 * Each changed question keeps its text before the repair in `preTexFix` (undo).
 * Archive copies (alocQuestions) of a "past" question are repaired the same way.
 *
 *   node scripts/fix-bare-tex.js --dry [--subject=mathematics]
 *   node scripts/fix-bare-tex.js
 *   node scripts/fix-bare-tex.js --undo
 */
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const DRY = !!args.dry, UNDO = !!args.undo, SUBJECT = args.subject || "mathematics";

const NAMES = "pi|infty|sqrt|int|sin|cos|tan|cot|sec|csc|log|ln|theta|alpha|beta|gamma|delta|lambda|mu|sigma|omega|phi|leq|geq|neq|cdot|times|div|pm|circ";
const BARE = new RegExp(`(^|[^\\\\a-zA-Z])(${NAMES})(?![a-zA-Z])`, "g");

/** Inside one piece of maths: give the bare names their backslash; sqrt(x) -> \sqrt{x}. */
function fixInside(m) {
  let s = m.replace(BARE, (_, pre, name) => `${pre}\\${name}${/^(sin|cos|tan|cot|sec|csc|log|ln)$/.test(name) ? " " : ""}`);
  s = s.replace(/\\sqrt\s*\(([^()]*)\)/g, "\\sqrt{$1}");
  return s.replace(/\\(sin|cos|tan|cot|sec|csc|log|ln) {2,}/g, "\\$1 ");
}

/** Outside the maths: put the stray symbols into \( \), and turn a literal \n into a line break. */
function fixOutside(t) {
  let s = t.replace(/\\n/g, "\n");
  s = s.replace(/(\d*(?:\.\d+)?)\s*π/g, (_, n) => `\\(${n}\\pi\\)`);
  s = s.replace(/(\d*)\s*√\s*\(?(\d+(?:\.\d+)?|[a-z])\)?/g, (_, n, r) => `\\(${n}\\sqrt{${r}}\\)`);
  s = s.replace(/∞/g, "\\(\\infty\\)");
  return s;
}

/** Repair one string: the maths pieces and the text between them separately. */
function repair(text) {
  if (typeof text !== "string" || !text) return text;
  const parts = text.split(/(\\\(.*?\\\)|\$[^$]+\$)/s);
  return parts.map((p, i) => {
    if (i % 2 === 0) return fixOutside(p);
    if (p.startsWith("$")) {
      // $ … $ is left as it is (the viewer reads it) and repaired only when it
      // really is maths: a dollar sign in "earns $120 for … $____" spans words.
      const body = p.slice(1, -1);
      const words = (body.match(/[A-Za-z]{3,}/g) || []).filter((w) => !new RegExp(`^(${NAMES}|int)$`).test(w));
      if (body.includes("\\(") || words.length > 1) return p;
      return `$${fixInside(body)}$`;
    }
    return `\\(${fixInside(p.slice(2, -2))}\\)`;
  }).join("");
}

(async () => {
  const db = admin.firestore();
  const snap = await db.collection("cbtQuestions").where("subject", "==", SUBJECT).get();
  let changed = 0;
  const shown = [];
  for (const d of snap.docs) {
    const x = d.data();
    if (UNDO) {
      if (!x.preTexFix) continue;
      const back = { question: x.preTexFix.question, options: x.preTexFix.options, preTexFix: admin.firestore.FieldValue.delete() };
      await d.ref.update(back);
      if (x.source === "past" && d.id.startsWith("aloc_")) await db.collection("alocQuestions").doc(d.id).update({ question: back.question, options: back.options });
      changed++;
      continue;
    }
    const q = repair(x.question);
    const opts = (x.options || []).map(repair);
    if (q === x.question && JSON.stringify(opts) === JSON.stringify(x.options || [])) continue;
    changed++;
    if (shown.length < 40) shown.push(`${d.id} [${x.source}]\n   was: ${JSON.stringify(x.question).slice(0, 150)} | ${JSON.stringify(x.options || []).slice(0, 120)}\n   now: ${JSON.stringify(q).slice(0, 150)} | ${JSON.stringify(opts).slice(0, 120)}`);
    if (!DRY) {
      await d.ref.update({ question: q, options: opts, preTexFix: { question: x.question, options: x.options || [] } });
      if (x.source === "past" && d.id.startsWith("aloc_")) await db.collection("alocQuestions").doc(d.id).update({ question: q, options: opts });
    }
  }
  if (!UNDO) shown.forEach((l) => console.log(l));
  console.log(`\n${SUBJECT}: ${UNDO ? "put back" : DRY ? "would repair" : "repaired"} ${changed} questions`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
