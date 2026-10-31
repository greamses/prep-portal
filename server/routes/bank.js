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

  router.delete("/", authenticate, guard(async (req, res) => {
    const ids = (Array.isArray(req.body && req.body.ids) ? req.body.ids : []).slice(0, 200).map(String).filter((id) => /^[a-f0-9]{24}$/.test(id));
    if (!ids.length) return res.status(400).json({ error: "Choose questions to remove." });
    const batch = db().batch();
    ids.forEach((id) => batch.delete(items(req.user.uid).doc(id)));
    await batch.commit();
    res.json({ ok: true, removed: ids.length });
  }));

  return router;
};
