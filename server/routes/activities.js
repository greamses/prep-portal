/**
 * Activities — teacher-authored question sets that students answer.
 *
 * Server-authoritative (Admin SDK), so the locked-down Firestore rules never
 * need to expose these collections to the browser. Both creating (teacher) and
 * answering (student) require an active subscription, mirroring PrepBot.
 *
 *   POST /api/activities              — teacher creates an activity (+ share link)
 *   GET  /api/activities/mine         — teacher's own activities + submission counts
 *   GET  /api/activities/:idOrSlug    — fetch an activity to answer
 *   POST /api/activities/:id/submit   — student submits answers (+ marked result)
 *   GET  /api/activities/:id/submissions — teacher reviews submissions (owner only)
 *
 * Phase 1: shareable-link delivery. Roster assignment + review UI come later.
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");

const MAX_QUESTIONS = 20;

// Short, unambiguous share slug (no 0/O/1/I).
function makeSlug() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 7; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

function cleanQuestions(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((q) => q && typeof q === "object")
    .slice(0, MAX_QUESTIONS)
    .map((q) => ({
      text: String(q.text || "").slice(0, 4000),
      marks: Number.isFinite(+q.marks) ? Math.max(0, Math.min(100, Math.floor(+q.marks))) : null,
      compulsory: !!q.compulsory,
    }))
    .filter((q) => q.text.trim().length >= 3);
}

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();
  const stamp = admin.firestore.FieldValue.serverTimestamp;
  const usersDoc = (uid) => db().collection("users").doc(uid);

  async function profile(uid) {
    try { const s = await usersDoc(uid).get(); return s.exists ? s.data() : {}; }
    catch (_) { return {}; }
  }
  const isAdmin = (req) => !!req.user && req.user.email && req.user.email === process.env.ADMIN_EMAIL;
  const hasSub = (req, p) => isAdmin(req) || !!(p && p.isPremium);
  const isTeacher = (req, p) => isAdmin(req) || ["teacher", "admin"].includes(p && p.role);

  const publicActivity = (a) => ({
    id: a.id,
    title: a.title,
    subject: a.subject || null,
    classLevel: a.classLevel || null,
    track: a.track || null,
    ownerName: a.ownerName || null,
    ownerUid: a.ownerUid,
    shareSlug: a.shareSlug,
    questions: (a.questions || []).map((q) => ({ text: q.text, marks: q.marks, compulsory: q.compulsory })),
    status: a.status || "open",
  });

  async function findActivity(idOrSlug) {
    const byId = await db().collection("activities").doc(idOrSlug).get();
    if (byId.exists) return { id: byId.id, ...byId.data() };
    const slug = String(idOrSlug || "").toUpperCase();
    const snap = await db().collection("activities").where("shareSlug", "==", slug).limit(1).get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }

  // ── POST / — teacher creates an activity ──────────────────────────
  router.post("/", authenticate, async (req, res) => {
    try {
      const p = await profile(req.user.uid);
      if (!hasSub(req, p)) return res.status(402).json({ error: "premium_required", premiumRequired: true });
      if (!isTeacher(req, p)) return res.status(403).json({ error: "Only teachers can create activities." });

      const b = req.body || {};
      const questions = cleanQuestions(b.questions);
      if (!questions.length) return res.status(400).json({ error: "Add at least one question." });
      const title = String(b.title || "").trim().slice(0, 140) || "Untitled activity";

      // Unique share slug.
      let shareSlug;
      for (let i = 0; i < 6; i++) {
        const s = makeSlug();
        if ((await db().collection("activities").where("shareSlug", "==", s).limit(1).get()).empty) { shareSlug = s; break; }
      }
      if (!shareSlug) return res.status(500).json({ error: "Could not generate a link — try again." });

      const ref = db().collection("activities").doc();
      await ref.set({
        ownerUid: req.user.uid,
        ownerName: p.name || (req.user.email ? req.user.email.split("@")[0] : "Teacher"),
        title,
        subject: String(b.subject || "").slice(0, 80) || null,
        classLevel: String(b.classLevel || "").slice(0, 40) || null,
        track: String(b.track || "").slice(0, 40) || null,
        questions,
        visibility: "link",
        shareSlug,
        status: "open",
        submissionCount: 0,
        createdAt: stamp(),
        updatedAt: stamp(),
      });
      res.json({ ok: true, activity: publicActivity({ id: ref.id, ownerUid: req.user.uid, ownerName: p.name, title, subject: b.subject, classLevel: b.classLevel, track: b.track, questions, shareSlug, status: "open" }) });
    } catch (e) {
      console.error("[/api/activities POST]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /mine — teacher's activities ──────────────────────────────
  router.get("/mine", authenticate, async (req, res) => {
    try {
      const snap = await db().collection("activities").where("ownerUid", "==", req.user.uid).get();
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => ms(b.createdAt) - ms(a.createdAt))
        .map((a) => ({ ...publicActivity(a), questionCount: (a.questions || []).length, submissionCount: a.submissionCount || 0 }));
      res.json({ activities: items });
    } catch (e) {
      console.error("[/api/activities/mine]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /:idOrSlug — fetch an activity to answer ──────────────────
  router.get("/:idOrSlug", authenticate, async (req, res) => {
    try {
      const p = await profile(req.user.uid);
      if (!hasSub(req, p)) return res.status(402).json({ error: "premium_required", premiumRequired: true });
      const a = await findActivity(req.params.idOrSlug);
      if (!a) return res.status(404).json({ error: "Activity not found." });
      res.json({ activity: publicActivity(a) });
    } catch (e) {
      console.error("[/api/activities/:id GET]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /:id/submit — student submits answers + marked result ────
  // Marking is run client-side through /api/ai/generate (so it draws on the
  // student's own token pool); we persist the answers and the marked outcome.
  router.post("/:idOrSlug/submit", authenticate, async (req, res) => {
    try {
      const p = await profile(req.user.uid);
      if (!hasSub(req, p)) return res.status(402).json({ error: "premium_required", premiumRequired: true });

      const a = await findActivity(req.params.idOrSlug);
      if (!a) return res.status(404).json({ error: "Activity not found." });

      const b = req.body || {};
      const answers = Array.isArray(b.answers)
        ? b.answers.slice(0, MAX_QUESTIONS).map((x) => ({ text: String((x && x.text) || "").slice(0, 8000) }))
        : [];
      if (!answers.length) return res.status(400).json({ error: "No answers submitted." });

      let marked = null;
      try { marked = JSON.parse(JSON.stringify(b.marked ?? null)); } catch (_) { marked = null; }
      if (marked && JSON.stringify(marked).length > 60000) marked = { note: "result too large to store" };

      // Stored as a SUBCOLLECTION of the activity so the broad top-level
      // Firestore read rule can't expose private student answers/scores.
      const ref = db().collection("activities").doc(a.id).collection("submissions").doc();
      await ref.set({
        activityId: a.id,
        activityTitle: a.title || null,
        ownerUid: a.ownerUid,
        studentUid: req.user.uid,
        studentName: String((b.studentName || "")).trim().slice(0, 80) ||
          p.name || (req.user.email ? req.user.email.split("@")[0] : "Student"),
        studentEmail: req.user.email || null,
        answers,
        marked,
        score: Number.isFinite(+b.score) ? +b.score : null,
        totalMarks: Number.isFinite(+b.totalMarks) ? +b.totalMarks : null,
        tokensCharged: Number.isFinite(+b.tokensCharged) ? +b.tokensCharged : null,
        submittedAt: stamp(),
      });
      await db().collection("activities").doc(a.id)
        .set({ submissionCount: admin.firestore.FieldValue.increment(1) }, { merge: true });

      // Aggregate the student's dashboard stats (one cheap doc, no indexes).
      try {
        const inc = admin.firestore.FieldValue.increment;
        const sc = Number.isFinite(+b.score) ? +b.score : 0;
        const mx = Number.isFinite(+b.totalMarks) ? +b.totalMarks : 0;
        const subjName = a.subject || "General";
        const subjKey = subjName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40) || "general";
        await db().collection("studentStats").doc(req.user.uid).collection("private").doc("summary").set({
          submissions: inc(1),
          problemsSolved: inc(answers.length),
          scoreSum: inc(sc),
          maxSum: inc(mx),
          lastSubmitAt: stamp(),
          subjects: { [subjKey]: { name: subjName, scoreSum: inc(sc), maxSum: inc(mx), count: inc(1) } },
        }, { merge: true });
      } catch (_) {}

      // If this student was assigned the activity, mark it done on their list.
      try {
        const asgRef = db().collection("studentAssignments").doc(req.user.uid).collection("items").doc(a.id);
        if ((await asgRef.get()).exists) {
          await asgRef.set({
            status: "submitted",
            score: Number.isFinite(+b.score) ? +b.score : null,
            totalMarks: Number.isFinite(+b.totalMarks) ? +b.totalMarks : null,
            submittedAt: stamp(),
          }, { merge: true });
        }
      } catch (_) {}

      res.json({ ok: true, id: ref.id });
    } catch (e) {
      console.error("[/api/activities/:id/submit]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /:id/submissions — teacher review (owner only) ────────────
  router.get("/:idOrSlug/submissions", authenticate, async (req, res) => {
    try {
      const a = await findActivity(req.params.idOrSlug);
      if (!a) return res.status(404).json({ error: "Activity not found." });
      if (a.ownerUid !== req.user.uid && !isAdmin(req)) {
        return res.status(403).json({ error: "Not your activity." });
      }
      const snap = await db().collection("activities").doc(a.id).collection("submissions").get();
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((x, y) => ms(y.submittedAt) - ms(x.submittedAt));
      res.json({ activity: publicActivity(a), submissions: items });
    } catch (e) {
      console.error("[/api/activities/:id/submissions]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
