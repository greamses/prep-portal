/**
 * comp-links.js — every competition paper as a Paper Test link with its own password.
 *
 *   node server/scripts/comp-links.js            make or refresh them
 *   node server/scripts/comp-links.js --new      the same, with NEW codes and passwords (old links stop working)
 *
 * For each paper in server/papers/*.paper (written by one-bank-competitions.js; run that first):
 *   • sharedPapers/{code}   the paper in the Paper Test Builder's form, sat at /paper/{code}:
 *                           Scholastic 50 minutes, ANMC 2 hours; 1 try; camera on; OMR sheet;
 *                           no tool rail; locked with `password` (routes/workbooks.js checks it)
 *   • compPasswords/{key}   the SAME password for the paper's CBT on the question page
 *   • the admin's question bank: a set under Mathematics > Competitions > Scholastic|ANMC (> division)
 *     pointing at the paper's questions in the one bank, and the folders it sits in
 *   • compLinks/{key}       name, link and password, which the bank panel copies out for WhatsApp
 * A paper that has its link already keeps its code and password, so links already sent stay good.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });
const db = admin.firestore();

const ADMIN_EMAIL = "eemadanyel@gmail.com";
const SITE = "https://www.prepportal.com.ng";
const ROOT = path.join(__dirname, "..", "..");
const FRESH = process.argv.includes("--new");

const COMP = { scholastic: "Scholastic", anmc: "ANMC" };
const SCHOOL = { scholastic: "Scholastic Champs Maths Competition", anmc: "Annual National Mathematics Competition" };
const DIV = { "upper-primary": "Upper Primary", "junior-secondary": "Junior Secondary" };
const MINUTES = { scholastic: 50, anmc: 120 };
const edition = (comp, div, year) => {
  if (comp === "scholastic" && div === "upper-primary" && year === "2022") return { label: "1st Edition", n: 1 };
  if (comp === "scholastic" && div === "upper-primary" && year === "2025") return { label: "2nd Edition", n: 2 };
  const n = parseInt(year, 10) || 0;
  return { label: `${n}${["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]} Edition`, n };
};
const roundName = (r) => ({ "first-round": "First Round", finals: "Finals", main: "Main Paper" })[String(r).toLowerCase()] || r;

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I: easy to type from a phone
const make = (n) => Array.from({ length: n }, () => ALPHA[crypto.randomInt(ALPHA.length)]).join("");
const docKey = (k) => k.replace(/\|/g, "__").replace(/[^A-Za-z0-9_-]/g, "-");

/* the paper's TeX the Paper Test Builder's way: $…$ rather than \( … \) */
const tex = (s) => String(s || "").replace(/\\\(\s*/g, "$").replace(/\s*\\\)/g, "$").replace(/\\\[\s*/g, "$$").replace(/\s*\\\]/g, "$$");
const svgOf = (url) => {
  if (!url || !/\.svg$/.test(url)) return "";
  try { return fs.readFileSync(path.join(ROOT, url.replace(/^\//, "")), "utf8").slice(0, 30000); } catch { return ""; }
};

(async () => {
  const me = await admin.auth().getUserByEmail(ADMIN_EMAIL);
  const uid = me.uid;
  const files = fs.readdirSync(path.join(__dirname, "..", "papers")).filter((f) => f.endsWith(".paper"));
  const rows = [];
  for (const f of files) {
    const key = f.replace(/\.paper$/, "").split("__").join("|");
    const [comp, div, year, round] = key.split("|");
    if (!COMP[comp]) continue;
    const paper = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "papers", f), "utf8"));
    const ed = edition(comp, div, year);
    const name = `${COMP[comp]} ${DIV[div] || div} · ${ed.label} · ${roundName(round)}`;
    const folder = comp === "scholastic" ? `Competitions/Scholastic/${DIV[div] || div}` : "Competitions/ANMC";
    const minutes = MINUTES[comp];

    /* the questions as the Paper Test Builder holds them */
    const questions = paper.questions.map((q, i) => {
      const opts = Array.isArray(q.options) ? q.options : [];
      const mcq = opts.length >= 2;
      /* every accepted answer, "a | b": the player takes any of them (exam-maker/js/live.js matches) */
      const blankKey = Array.isArray(q.accept) && q.accept.length ? q.accept.join(" | ") : String(q.answer || "").replace(/\\\(|\\\)/g, "");
      return {
        id: `c${i + 1}`, type: mcq ? "mcq" : "fill", text: tex(q.question),
        marks: 1, lines: mcq ? 0 : 1, svg: svgOf(q.image),
        options: mcq ? opts.slice(0, 5).map(tex) : [],
        answer: mcq ? (typeof q.correctIndex === "number" ? q.correctIndex : 0) : blankKey,
      };
    });
    const timeText = minutes >= 60 ? `${minutes / 60} hour${minutes > 60 ? "s" : ""}` : `${minutes} minutes`;
    const head = {
      school: SCHOOL[comp], term: "", year: "", subject: "Mathematics", date: "", klass: DIV[div] || div, time: timeText,
      logo: "", colour: comp === "anmc" ? "forest" : "plum", custom: "", paper: "a4",
      key: false, tint: false, clean: true, omr: true, theorySheet: false, timer: true, camera: true,
      instructions: false, instrText: "", booklet: false, aiMark: false, holdResults: false,
      template: "default", railTools: [], examNo: false, examDigits: 8, breakAt: {},
      tries: 1, attempt: { mcq: 0, fill: 0, sub: 0, theory: 0 }, marksEach: { mcq: 1, fill: 1, sub: 2, theory: 4 },
    };

    const linkRef = db.collection("compLinks").doc(docKey(key));
    const had = (await linkRef.get()).data() || {};
    let code = !FRESH && had.code ? had.code : null;
    if (!code) {
      for (let i = 0; i < 8 && !code; i++) { const c = make(6); if (!(await db.collection("sharedPapers").doc(c).get()).exists) code = c; }
      if (had.code && FRESH) await db.collection("sharedPapers").doc(had.code).delete().catch(() => {});
    }
    const password = !FRESH && had.password ? had.password : make(6);
    const title = name;

    await db.collection("sharedPapers").doc(code).set({
      code, head, questions, title, ownerUid: uid, ownerName: "Prep Portal", password, compKey: key,
      createdAt: had.createdAt || admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection("compPasswords").doc(docKey(key)).set({ key, password, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    /* the bank: a set pointing at the paper's questions in the one bank, in its folder */
    const ids = paper.questions.map((_, n) => `comp_${comp}_${div}_${year}_${round}_${n + 1}`.replace(/[^A-Za-z0-9_-]/g, "-"));
    await db.collection("questionSets").doc(uid).collection("sets").doc(`comp_${docKey(key)}`).set({
      name, subject: "Mathematics", level: DIV[div] || div, folder, ids, count: ids.length, questions: [], comp: true,
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const parts = folder.split("/");
    await db.collection("questionSets").doc(uid).set({ folders: { mathematics: admin.firestore.FieldValue.arrayUnion(...parts.map((_, i) => parts.slice(0, i + 1).join("/"))) } }, { merge: true });

    const order = (comp === "scholastic" ? 0 : 1000) + (div === "junior-secondary" ? 500 : 0) + ed.n * 10 + (round === "finals" ? 1 : 0);
    const row = { key, name, folder, code, password, url: `${SITE}/paper/${code}`, minutes, tries: 1, order, createdAt: had.createdAt || admin.firestore.FieldValue.serverTimestamp() };
    await linkRef.set(row);
    rows.push(row);
    console.log(`  ${row.url}  ${password}  ${name}`);
  }
  console.log(`${rows.length} links`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
