/**
 * Audit: maths in the past-question archive (alocQuestions) — how much is
 * written without MathJax delimiters, and samples of what it looks like.
 *   node scripts/audit-aloc-math.js
 */
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });

const hasDelim = (t) => /\\\(|\\\[|\$/.test(t);
const mathy = (t) => /[\^_=]|\d\s*\/\s*\d|sqrt|\\frac|\b[a-z]\d|\d[a-z]\b|[√π×÷≤≥²³]|\blog\b|\bsin\b|\bcos\b|\btan\b|<sup>|<sub>/i.test(t);

(async () => {
  const db = admin.firestore();
  const cfg = await db.collection("config").doc("site").get();
  console.log("archiveEnabled:", cfg.exists ? cfg.data().archiveEnabled : "(no config)");
  const s = await db.collection("alocQuestions").where("subject", "==", "mathematics").get();
  console.log("maths docs:", s.size);
  if (s.size) console.log("fields:", Object.keys(s.docs[0].data()).join(", "));
  const by = {};
  const ex = [];
  s.docs.forEach((d) => {
    const x = d.data();
    const key = `${x.examType || x.type || "?"}`;
    by[key] = by[key] || { n: 0, q: 0, o: 0 };
    by[key].n++;
    const text = String(x.question || "");
    const opts = x.option ? Object.values(x.option).map(String) : (x.options || []).map(String);
    const qb = mathy(text) && !hasDelim(text);
    const ob = opts.some((t) => mathy(t) && !hasDelim(t));
    if (qb) by[key].q++;
    if (ob) by[key].o++;
    if ((qb || ob) && ex.length < 12) ex.push({ id: d.id, q: text.slice(0, 160), o: opts });
  });
  Object.entries(by).forEach(([k, v]) => console.log(`${k}: ${v.n} maths; ${v.q} undelimited in the question, ${v.o} in the options`));
  ex.forEach((e) => console.log("   ", JSON.stringify(e).slice(0, 380)));
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
