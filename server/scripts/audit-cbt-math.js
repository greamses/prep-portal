/**
 * Audit: maths questions in the CBT bank whose question or options carry
 * mathematics without MathJax delimiters (\( … \) or $ … $).
 *   node scripts/audit-cbt-math.js [scheme ...]
 */
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });

const schemes = process.argv.slice(2).length ? process.argv.slice(2) : ["utme", "wassce"];
const hasDelim = (t) => /\\\(|\\\[|\$/.test(t);
const mathy = (t) => /[\^_=]|\d\s*\/\s*\d|sqrt|\\frac|\b[a-z]\d|\d[a-z]\b|[√π×÷≤≥²³]|\blog\b|\bsin\b|\bcos\b|\btan\b/i.test(t);

(async () => {
  const db = admin.firestore();
  for (const sch of schemes) {
    const s = await db.collection("cbtQuestions").where("scheme", "==", sch).where("subject", "==", "mathematics").get();
    let q = 0, o = 0, either = 0;
    const ex = [];
    s.docs.forEach((d) => {
      const x = d.data();
      const text = String(x.question || "");
      const opts = (x.options || []).map(String);
      const qb = mathy(text) && !hasDelim(text);
      const ob = opts.some((t) => mathy(t) && !hasDelim(t));
      if (qb) q++;
      if (ob) o++;
      if (qb || ob) { either++; if (ex.length < 8) ex.push({ id: d.id, source: x.source, q: text.slice(0, 150), o: opts }); }
    });
    console.log(`${sch}: ${s.size} maths questions; ${q} with undelimited maths in the question, ${o} in the options, ${either} in either`);
    ex.forEach((e) => console.log("   ", JSON.stringify(e).slice(0, 420)));
  }
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
