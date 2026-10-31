/**
 * A teacher's saved exams: whole papers (the school heading, the settings and every question), kept so
 * one can be opened again, changed and set again.
 *
 *   GET    /api/exams        the list, newest first: { id, title, subject, klass, questions, marks, savedAt }
 *   GET    /api/exams/:id    one exam in full: { id, title, head, questions }
 *   POST   /api/exams        { id?, title?, head, questions }  save it; with an id of theirs it is overwritten
 *   DELETE /api/exams/:id    take it out
 *   GET    /api/exams/built?scope=all   everything built: exams, shared papers, assigned workbooks (all: administrator)
 *   DELETE /api/exams/built   { kind: exam|paper|workbook, id, ownerUid? }  delete one, with what hangs off it
 *
 * It is the caller's own shelf, always: there is no way to name anyone else's. Allowed to the same people
 * as the question bank (teachers, the administrator, anyone the Exam Maker is open to). A SUBcollection of
 * savedExams/{uid}, so no browser rule can read it.
 */

const crypto = require("crypto");
const express = require("express");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");
const access = require("../lib/access");
const { cleanQuestion } = require("../lib/question-bank");
const tasks = require("../lib/tasks");

const MAX_EXAMS = 100;       // per teacher
const MAX_QUESTIONS = 300;   // per exam
const MAX_HEAD_BYTES = 200000; // the school badge is a small picture inside the heading

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();
  const shelf = (uid) => db().collection("savedExams").doc(uid).collection("items");
  const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
  const isAdmin = (req) => !!req.user && !!req.user.email && req.user.email === process.env.ADMIN_EMAIL;
  const clip = (s, n) => String(s == null ? "" : s).slice(0, n);

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
      if (!(await allowed(req))) return res.status(403).json({ error: "Saved exams are for teachers." });
      await fn(req, res);
    } catch (e) {
      console.error("[/api/exams]", e.message);
      res.status(500).json({ error: "Your exams could not be reached." });
    }
  };

  router.get("/", authenticate, guard(async (req, res) => {
    const snap = await shelf(req.user.uid).orderBy("savedAt", "desc").limit(MAX_EXAMS).get();
    res.json({
      ok: true,
      items: snap.docs.map((d) => {
        const x = d.data();
        return { id: d.id, title: x.title || "Untitled exam", subject: x.subject || "", klass: x.klass || "", questions: x.count || 0, marks: x.marks || 0, savedAt: ms(x.savedAt) };
      }),
    });
  }));

  /* ── everything a teacher has built ──────────────────────────────────────
     Saved exams, paper links they shared and workbooks they assigned, in one list, each of which can
     be deleted. The administrator may ask for every teacher's (scope=all) and delete any of it. */
  const marksOf = (qs) => (Array.isArray(qs) ? qs.reduce((n, q) => n + (Number(q && q.marks) || 0), 0) : 0);

  router.get("/built", authenticate, guard(async (req, res) => {
    const everyone = req.query.scope === "all";
    if (everyone && !isAdmin(req)) return res.status(403).json({ error: "Only the administrator can see every teacher's work." });
    const items = [];

    const exam = (uid, owner, d) => {
      const x = d.data();
      items.push({ kind: "exam", id: d.id, title: x.title || "Untitled exam", subject: x.subject || "", klass: x.klass || "", questions: x.count || 0, marks: x.marks || 0, students: 0, savedAt: ms(x.savedAt), owner, ownerUid: uid });
    };
    if (everyone) {
      const names = new Map();
      const who = await db().collection("users").where("role", "in", ["teacher", "admin"]).limit(300).get();
      who.docs.forEach((d) => names.set(d.id, d.data().name || d.data().displayName || "Teacher"));
      if (!names.has(req.user.uid)) names.set(req.user.uid, "You");
      await Promise.all([...names].map(async ([uid, name]) => {
        (await shelf(uid).orderBy("savedAt", "desc").limit(MAX_EXAMS).get()).docs.forEach((d) => exam(uid, name, d));
      }));
    } else {
      (await shelf(req.user.uid).orderBy("savedAt", "desc").limit(MAX_EXAMS).get()).docs.forEach((d) => exam(req.user.uid, "", d));
    }

    const q = (col, field) => (everyone ? db().collection(col).limit(500) : db().collection(col).where(field, "==", req.user.uid).limit(100)).get();
    const [papers, workbooks] = await Promise.all([q("sharedPapers", "ownerUid"), q("workbookAssignments", "teacherUid")]);
    papers.docs.forEach((d) => {
      const a = d.data();
      items.push({ kind: "paper", id: d.id, title: a.title || "Exam paper", subject: (a.head && a.head.subject) || "", klass: (a.head && a.head.klass) || "", questions: (a.questions || []).length, marks: marksOf(a.questions), students: a.students || 0, savedAt: ms(a.createdAt), owner: a.ownerName || "", ownerUid: a.ownerUid || "" });
    });
    workbooks.docs.forEach((d) => {
      const a = d.data();
      items.push({ kind: "workbook", id: d.id, title: a.title || "Workbook", subject: "", klass: "", questions: 0, marks: 0, students: a.students || 0, savedAt: ms(a.createdAt), owner: a.teacherName || "", ownerUid: a.teacherUid || "" });
    });
    items.sort((a, b) => b.savedAt - a.savedAt);
    res.json({ ok: true, admin: isAdmin(req), items });
  }));

  router.delete("/built", authenticate, guard(async (req, res) => {
    const b = req.body || {};
    const kind = String(b.kind || "");
    if (kind === "exam") {
      const id = String(b.id || "");
      if (!/^[a-f0-9]{20}$/.test(id)) return res.status(404).json({ error: "That exam is not there." });
      /* the owner is the caller, unless the administrator names a teacher */
      const owner = isAdmin(req) && /^[A-Za-z0-9_-]{1,128}$/.test(String(b.ownerUid || "")) ? String(b.ownerUid) : req.user.uid;
      await shelf(owner).doc(id).delete();
      return res.json({ ok: true });
    }
    if (!tasks.KINDS[kind]) return res.status(400).json({ error: "Choose an exam, a paper or a workbook." });
    const code = String(b.id || "").toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(code)) return res.status(404).json({ error: "That one is not there." });
    const done = await tasks.deleteTask(db(), kind, code, (owner) => isAdmin(req) || owner === req.user.uid);
    if (done === "forbidden") return res.status(403).json({ error: "That one is not yours to delete." });
    if (!done) return res.status(404).json({ error: "That one is not there." });
    res.json({ ok: true });
  }));

  router.get("/:id", authenticate, guard(async (req, res) => {
    if (!/^[a-f0-9]{20}$/.test(req.params.id)) return res.status(404).json({ error: "That exam is not on your shelf." });
    /* the caller's own shelf; the administrator may open a teacher's by naming them */
    const owner = isAdmin(req) && /^[A-Za-z0-9_-]{1,128}$/.test(String(req.query.ownerUid || "")) ? String(req.query.ownerUid) : req.user.uid;
    const d = await shelf(owner).doc(req.params.id).get();
    if (!d.exists) return res.status(404).json({ error: "That exam is not on your shelf." });
    const x = d.data();
    let head = {};
    try { head = JSON.parse(x.headJson || "{}"); } catch (_) { /* a head that cannot be read is a blank one */ }
    res.json({ ok: true, id: d.id, title: x.title || "", head, questions: x.questions || [] });
  }));

  router.post("/", authenticate, guard(async (req, res) => {
    const b = req.body || {};
    const questions = (Array.isArray(b.questions) ? b.questions : []).slice(0, MAX_QUESTIONS).map(cleanQuestion).filter(Boolean);
    if (!questions.length) return res.status(400).json({ error: "There are no questions to save." });
    if (!b.head || typeof b.head !== "object") return res.status(400).json({ error: "The exam has no heading to save." });
    const headJson = JSON.stringify(b.head);
    if (headJson.length > MAX_HEAD_BYTES) return res.status(413).json({ error: "The school badge is too big to save. Use a smaller picture." });

    let id = /^[a-f0-9]{20}$/.test(String(b.id || "")) ? String(b.id) : "";
    const existing = id ? await shelf(req.user.uid).doc(id).get() : null;
    if (!existing || !existing.exists) {
      id = id || crypto.randomBytes(10).toString("hex");
      const n = (await shelf(req.user.uid).limit(MAX_EXAMS).get()).size;
      if (n >= MAX_EXAMS) return res.status(409).json({ error: `You have ${MAX_EXAMS} saved exams. Delete some to save more.` });
    }
    const head = b.head;
    const title = clip(b.title, 120).trim() || [head.subject, head.klass, head.term].filter(Boolean).map((s) => clip(s, 40)).join(" · ") || "Untitled exam";
    const marks = questions.reduce((n, q) => n + (q.marks || 0), 0);
    await shelf(req.user.uid).doc(id).set({
      title, subject: clip(head.subject, 80), klass: clip(head.klass, 60), count: questions.length, marks,
      headJson, questions, savedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ ok: true, id, title, questions: questions.length });
  }));

  router.delete("/:id", authenticate, guard(async (req, res) => {
    if (!/^[a-f0-9]{20}$/.test(req.params.id)) return res.status(404).json({ error: "That exam is not on your shelf." });
    await shelf(req.user.uid).doc(req.params.id).delete();
    res.json({ ok: true });
  }));

  return router;
};
