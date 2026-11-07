/**
 * The question bank.
 *
 *   GET    /api/bank?type=&subject=&q=     this teacher's questions, newest first (up to 400)
 *   POST   /api/bank                       { questions, subject?, topic?, level? }  keep these
 *   DELETE /api/bank                       { ids }                                  take these out
 *
 * It is the caller's own bank, always: there is no way to name anyone else's. Allowed to a teacher, the
 * administrator, and anyone the Exam Maker is open to (it is where the questions are used).
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");
const access = require("../lib/access");
const { saveQuestions } = require("../lib/question-bank");

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();
  const items = (uid) => db().collection("questionBank").doc(uid).collection("items");
  const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
  const isAdmin = (req) => !!req.user && !!req.user.email && req.user.email === process.env.ADMIN_EMAIL;

  async function allowed(req) {
    if (isAdmin(req)) return true;
    try {
      const s = await db().collection("users").doc(req.user.uid).get();
      if (s.exists && ["teacher", "admin"].includes(s.data().role)) return true;
    } catch (_) { /* fall through to the feature check */ }
    return (await access.canUse(req, "prep-math-activities", "exam-maker")).allowed;
  }
  const guard = (fn) => async (req, res) => {
    try {
      if (!(await allowed(req))) return res.status(403).json({ error: "The question bank is for teachers." });
      await fn(req, res);
    } catch (e) {
      console.error("[/api/bank]", e.message);
      res.status(500).json({ error: "The question bank could not be reached." });
    }
  };

  router.get("/", authenticate, guard(async (req, res) => {
    const type = String(req.query.type || "");
    const subject = String(req.query.subject || "").trim().toLowerCase();
    const q = String(req.query.q || "").trim().toLowerCase();
    const snap = await items(req.user.uid).orderBy("savedAt", "desc").limit(400).get();
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data(), savedAt: ms(d.data().savedAt) }));
    if (type) list = list.filter((x) => x.type === type);
    if (subject) list = list.filter((x) => String(x.subject || "").toLowerCase().includes(subject));
    if (q) list = list.filter((x) => `${x.text} ${(x.options || []).join(" ")} ${x.topic || ""}`.toLowerCase().includes(q));
    const subjects = [...new Set(snap.docs.map((d) => d.data().subject).filter(Boolean))].sort();
    res.json({ ok: true, items: list, subjects });
  }));

  router.post("/", authenticate, guard(async (req, res) => {
    const b = req.body || {};
    if (!Array.isArray(b.questions) || !b.questions.length) return res.status(400).json({ error: "No questions to keep." });
    const saved = await saveQuestions(req.user.uid, b.questions, { subject: b.subject, topic: b.topic, level: b.level });
    res.json({ ok: true, saved });
  }));

  /* ══ NAMED BANKS ══════════════════════════════════════════════════════════
     A bank is a whole set of questions kept under a name the teacher chooses (questionSets/{uid}/sets/{id}),
     not single questions. Saving under a name that exists replaces that bank. Loading puts its questions in
     the editor, where several banks can be merged by ticking what to keep.

       GET    /api/bank/sets            every bank: { id, name, count, subject, level, types, savedAt }
       GET    /api/bank/sets/:id        one bank with its questions
       POST   /api/bank/sets            { name, questions, subject?, level? }   save (replaces a bank of the same name)
       DELETE /api/bank/sets/:id        delete a bank */
  const sets = (uid) => db().collection("questionSets").doc(uid).collection("sets");
  const setId = (name) => require("crypto").createHash("sha1").update(String(name).trim().toLowerCase()).digest("hex").slice(0, 24);
  const { cleanQuestion } = require("../lib/question-bank");
  // One bank (lib/one-bank.js): a named bank lists its questions' ids in cbtQuestions,
  // where they are kept private to this teacher. The embedded copy stays as a fallback.
  const ONE = require("../lib/one-bank");
  const bankCol = () => db().collection(ONE.BANK);
  async function questionsOf(uid, x) {
    const ids = Array.isArray(x.ids) ? x.ids : [];
    if (!ids.length) return x.questions || [];
    const refs = ids.map((id) => bankCol().doc(id));
    const docs = await db().getAll(...refs);
    const got = docs.map((d) => (d.exists && d.data().owner === uid ? ONE.bankToEm(d.data()) : null));
    // a question missing from the bank falls back to the set's own copy of it
    return got.map((q, k) => q || (x.questions || [])[k]).filter(Boolean);
  }
  const metaOf = (d) => { const x = d.data(); const types = {}; (x.questions || []).forEach((q) => { types[q.type] = (types[q.type] || 0) + 1; }); return { id: d.id, name: x.name, count: (x.questions || []).length, subject: x.subject || "", level: x.level || "", types, savedAt: ms(x.savedAt) }; };

  router.get("/sets", authenticate, guard(async (req, res) => {
    const snap = await sets(req.user.uid).orderBy("savedAt", "desc").limit(300).get();
    res.json({ ok: true, sets: snap.docs.map(metaOf) });
  }));
  router.get("/sets/:id", authenticate, guard(async (req, res) => {
    const d = await sets(req.user.uid).doc(String(req.params.id)).get();
    if (!d.exists) return res.status(404).json({ error: "That bank is not there any more." });
    res.json({ ok: true, set: { ...metaOf(d), questions: await questionsOf(req.user.uid, d.data()) } });
  }));
  router.post("/sets", authenticate, guard(async (req, res) => {
    const b = req.body || {};
    const name = String(b.name || "").replace(/\s+/g, " ").trim().slice(0, 100);
    if (!name) return res.status(400).json({ error: "Give the bank a name." });
    const questions = (Array.isArray(b.questions) ? b.questions : []).slice(0, 300).map(cleanQuestion).filter(Boolean);
    if (!questions.length) return res.status(400).json({ error: "There are no questions to keep." });
    if (JSON.stringify(questions).length > 900000) return res.status(400).json({ error: "That is too much for one bank. Save it as two banks." });
    const id = setId(name), ref = sets(req.user.uid).doc(id);
    const had = (await ref.get()).exists;
    // into the one bank, private to this teacher
    const meta = { subject: b.subject, level: b.level };
    const made = questions.map((q) => ONE.emToBank(q, req.user.uid, meta));
    const stamp = admin.firestore.FieldValue.serverTimestamp();
    for (let i = 0; i < made.length; i += 400) {
      const batch = db().batch();
      made.slice(i, i + 400).forEach(({ id: qid, data }) => batch.set(bankCol().doc(qid), { ...data, updatedAt: stamp }, { merge: true }));
      await batch.commit();
    }
    await ref.set({ name, questions, ids: made.map((m) => m.id), subject: String(b.subject || "").slice(0, 80), level: String(b.level || "").slice(0, 60), savedAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ ok: true, id, name, count: questions.length, replaced: had });
  }));
  router.delete("/sets/:id", authenticate, guard(async (req, res) => {
    await sets(req.user.uid).doc(String(req.params.id)).delete();
    res.json({ ok: true });
  }));

  router.delete("/", authenticate, guard(async (req, res) => {
    const ids = (Array.isArray(req.body && req.body.ids) ? req.body.ids : []).slice(0, 200).map(String).filter((id) => /^[a-f0-9]{24}$/.test(id));
    if (!ids.length) return res.status(400).json({ error: "Choose questions to remove." });
    const batch = db().batch();
    ids.forEach((id) => batch.delete(items(req.user.uid).doc(id)));
    await batch.commit();
    res.json({ ok: true, removed: ids.length });
  }));

  /* ══ BROWSING THE ONE BANK ═════════════════════════════════════════════════
     The Exam Maker's "Question bank" browser. Nothing is loaded in bulk:

       GET /api/bank/browse/subjects        the subject cards: count, exams, sources, topics, years
                                            (from one summary document, rebuilt when it is old)
       GET /api/bank/browse?subject=&scheme=&source=&topic=&year=&mine=1&after=
                                            30 questions at a time, as Exam Maker questions

     What a teacher sees: every public question; their own (mine=1); the gated
     competition papers only if they are premium or the admin; verbatim past
     papers only while "hide originals" is off (the admin always sees them). */
  const access = require("../lib/access");
  const SUMMARY_TTL = 6 * 60 * 60 * 1000;
  let summaryMem = null;

  async function siteFlags() {
    try { const s = await db().collection("config").doc("site").get(); return s.exists ? s.data() : {}; } catch (_) { return {}; }
  }

  async function buildSummary() {
    const snap = await bankCol().select("subject", "subjectLabel", "scheme", "source", "topic", "year", "owner", "visibility", "comp").get();
    const subjects = {};
    const bump = (o, k) => { if (k) o[k] = (o[k] || 0) + 1; };
    snap.forEach((d) => {
      const x = d.data();
      if (x.owner || !x.subject) return;                       // a teacher's own: never in the shared summary
      const s = subjects[x.subject] || (subjects[x.subject] = { label: x.subjectLabel || x.subject, count: 0, gated: 0, past: 0, schemes: {}, sources: {}, topics: {}, years: {}, comps: {} });
      if (x.visibility === "gated") { s.gated++; bump(s.comps, x.comp ? `${x.comp.comp}|${x.comp.div}|${x.comp.year}|${x.comp.round}` : null); }
      else s.count++;
      if (x.source === "past") s.past++;
      bump(s.schemes, x.scheme); bump(s.sources, x.source); bump(s.years, x.year);
      bump(s.topics, x.topic && String(x.topic).slice(0, 60));
    });
    // keep the summary small: the 60 biggest topics per subject
    for (const s of Object.values(subjects)) {
      s.topics = Object.fromEntries(Object.entries(s.topics).sort((a, b) => b[1] - a[1]).slice(0, 60));
    }
    const out = { subjects, builtAt: Date.now(), total: snap.size };
    await db().collection("config").doc("bankSummary").set(out);
    return out;
  }
  async function summary(force) {
    if (!force && summaryMem && Date.now() - summaryMem.builtAt < SUMMARY_TTL) return summaryMem;
    if (!force) {
      const d = await db().collection("config").doc("bankSummary").get();
      if (d.exists && Date.now() - (d.data().builtAt || 0) < SUMMARY_TTL) return (summaryMem = d.data());
    }
    return (summaryMem = await buildSummary());
  }

  router.get("/browse/subjects", authenticate, guard(async (req, res) => {
    const sum = await summary(isAdmin(req) && req.query.refresh === "1");
    const premium = (await access.getUserAccess(req.user.uid, req.user.email)).isPremium;
    const flags = await siteFlags();
    const showPast = isAdmin(req) || !flags.hideOriginals;
    const subjects = Object.entries(sum.subjects).map(([key, s]) => ({
      key, label: s.label,
      count: s.count - (showPast ? 0 : s.past) + (premium ? s.gated : 0),
      schemes: s.schemes, sources: s.sources, topics: s.topics, years: s.years,
      comps: premium ? s.comps : {},
    })).filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
    const mine = (await bankCol().where("owner", "==", req.user.uid).count().get()).data().count;
    res.json({ ok: true, subjects, mine, premium, showPast });
  }));

  router.get("/browse", authenticate, guard(async (req, res) => {
    const q = req.query;
    const str = (v) => String(v || "").trim().slice(0, 80);
    const premium = (await access.getUserAccess(req.user.uid, req.user.email)).isPremium;
    const flags = await siteFlags();
    const showPast = isAdmin(req) || !flags.hideOriginals;
    let base = bankCol();
    if (q.mine === "1") base = base.where("owner", "==", req.user.uid);
    if (str(q.subject)) base = base.where("subject", "==", str(q.subject));
    if (str(q.scheme)) base = base.where("scheme", "==", str(q.scheme));
    if (str(q.source)) base = base.where("source", "==", str(q.source));
    if (str(q.topic)) base = base.where("topic", "==", str(q.topic));
    if (str(q.year)) base = base.where("year", "==", str(q.year));
    if (str(q.comp)) base = base.where("compKey", "==", str(q.comp));
    base = base.orderBy(admin.firestore.FieldPath.documentId());
    const ok = (x) => (x.owner ? x.owner === req.user.uid : true)
      && (x.visibility === "gated" ? premium : true)
      && (x.source === "past" ? showPast || x.owner : true);
    const items = [];
    let after = str(q.after) || null, done = false;
    for (let round = 0; round < 6 && items.length < 30 && !done; round++) {
      let page = base.limit(60);
      if (after) page = page.startAfter(after);
      const snap = await page.get();
      if (snap.size < 60) done = true;
      for (const d of snap.docs) {
        after = d.id;
        const x = d.data();
        if (!ok(x)) continue;
        items.push({
          id: d.id, q: ONE.bankToEm(x),
          meta: { source: x.source || "", scheme: x.scheme || "", year: x.year || "", topic: x.topic || "", comp: x.compKey || "", mine: x.owner === req.user.uid },
        });
        if (items.length >= 30) break;
      }
    }
    res.json({ ok: true, items, next: done && items.length < 30 ? null : after });
  }));

  return router;
};
