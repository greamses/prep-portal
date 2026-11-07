/**
 * Audit: maths written as bare words inside MathJax — "pi", "infty", "sqrt",
 * "frac", "times" with no backslash, or a LaTeX command outside \( \).
 *   node scripts/audit-bare-tex.js [scheme] [subject]
 */
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });

const scheme = process.argv[2] || "utme", subject = process.argv[3] || "mathematics";
const WORDS = /(^|[^\\a-zA-Z])(pi|infty|sqrt|frac|times|theta|alpha|beta|leq|geq|neq|cdot|div)\b/;
const inside = (t) => (String(t).match(/\\\((.*?)\\\)/gs) || []).join(" ");
const outside = (t) => String(t).replace(/\\\((.*?)\\\)/gs, " ");

(async () => {
  const s = await admin.firestore().collection("cbtQuestions").where("scheme", "==", scheme).where("subject", "==", subject).get();
  const bad = [];
  s.docs.forEach((d) => {
    const x = d.data();
    for (const [where, t] of [["question", x.question], ...(x.options || []).map((o, k) => [`option ${k + 1}`, o])]) {
      const why = WORDS.test(inside(t)) ? "bare word inside \\( \\)"
        : /\\[a-zA-Z]+/.test(outside(t)) ? "LaTeX outside \\( \\)"
        : /[π√∞]/.test(outside(t)) ? "symbol outside \\( \\)" : null;
      if (why) { bad.push({ id: d.id, source: x.source, where, why, text: String(t).slice(0, 120) }); break; }
    }
  });
  console.log(`${scheme} ${subject}: ${s.size} questions, ${bad.length} with problems`);
  const by = {};
  bad.forEach((b) => { by[b.source] = (by[b.source] || 0) + 1; });
  console.log("by source:", JSON.stringify(by));
  bad.forEach((b) => console.log(`  ${b.id} [${b.source}] ${b.where}: ${b.why} | ${b.text}`));
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
