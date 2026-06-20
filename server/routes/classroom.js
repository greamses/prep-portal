/**
 * Classroom — real teacher↔student roster + activity assignment.
 *
 * Server-authoritative (Admin SDK). Roster and per-student assignments are kept
 * in SUBcollections so the broad top-level Firestore read rule can't expose
 * them (see firestore.rules). Both roles need a subscription.
 *
 *   POST /api/classroom/class-code   — teacher's join code (idempotent)
 *   GET  /api/classroom/roster       — teacher's students + class code
 *   POST /api/classroom/join         — student joins a class via { code }
 *   POST /api/classroom/assign       — teacher assigns an activity to students
 *   GET  /api/classroom/assignments  — student's "assigned to me" list
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");

function makeCode() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let s = "";
  for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
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
  const displayName = (req, p) => p.name || (req.user.email ? req.user.email.split("@")[0] : "User");

  // ── POST /class-code — the teacher's join code (idempotent) ───────
  router.post("/class-code", authenticate, async (req, res) => {
    try {
      const p = await profile(req.user.uid);
      if (!hasSub(req, p)) return res.status(402).json({ error: "premium_required", premiumRequired: true });
      if (!isTeacher(req, p)) return res.status(403).json({ error: "Only teachers have a class code." });

      const tcRef = db().collection("teacherClass").doc(req.user.uid);
      const tc = await tcRef.get();
      if (tc.exists && tc.data().code) return res.json({ ok: true, code: tc.data().code });

      let code;
      for (let i = 0; i < 6; i++) {
        const c = makeCode();
        if (!(await db().collection("classCodes").doc(c).get()).exists) { code = c; break; }
      }
      if (!code) return res.status(500).json({ error: "Could not generate a code — try again." });

      const teacherName = displayName(req, p);
      await db().collection("classCodes").doc(code).set({ teacherUid: req.user.uid, teacherName, createdAt: stamp() });
      await tcRef.set({ code, teacherName, createdAt: stamp() }, { merge: true });
      res.json({ ok: true, code });
    } catch (e) {
      console.error("[/api/classroom/class-code]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /roster — teacher's students + class code ────────────────
  router.get("/roster", authenticate, async (req, res) => {
    try {
      const p = await profile(req.user.uid);
      if (!isTeacher(req, p)) return res.status(403).json({ error: "Teachers only." });
      const snap = await db().collection("teacherStudents").doc(req.user.uid).collection("roster").get();
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
      const students = snap.docs.map((d) => ({ studentUid: d.id, ...d.data() })).sort((a, b) => ms(b.joinedAt) - ms(a.joinedAt));
      const tc = await db().collection("teacherClass").doc(req.user.uid).get();
      res.json({ code: tc.exists ? tc.data().code || null : null, students });
    } catch (e) {
      console.error("[/api/classroom/roster]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /join — student joins a class via code ──────────────────
  router.post("/join", authenticate, async (req, res) => {
    try {
      const p = await profile(req.user.uid);
      if (!hasSub(req, p)) return res.status(402).json({ error: "premium_required", premiumRequired: true });
      const code = String((req.body && req.body.code) || "").trim().toUpperCase();
      if (!code) return res.status(400).json({ error: "Enter a class code." });

      const cc = await db().collection("classCodes").doc(code).get();
      if (!cc.exists) return res.status(404).json({ error: "That class code isn't valid." });
      const teacherUid = cc.data().teacherUid;
      if (teacherUid === req.user.uid) return res.status(400).json({ error: "That's your own class code." });

      await db().collection("teacherStudents").doc(teacherUid).collection("roster").doc(req.user.uid).set({
        name: displayName(req, p),
        email: req.user.email || null,
        joinedAt: stamp(),
        source: "code",
      }, { merge: true });
      res.json({ ok: true, teacherName: cc.data().teacherName || "your teacher" });
    } catch (e) {
      console.error("[/api/classroom/join]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /assign — teacher assigns an activity to students ────────
  // { activityId, all?:bool, studentUids?:[] }
  router.post("/assign", authenticate, async (req, res) => {
    try {
      const p = await profile(req.user.uid);
      if (!isTeacher(req, p)) return res.status(403).json({ error: "Teachers only." });
      const b = req.body || {};

      const actSnap = await db().collection("activities").doc(String(b.activityId || "")).get();
      if (!actSnap.exists) return res.status(404).json({ error: "Activity not found." });
      const act = { id: actSnap.id, ...actSnap.data() };
      if (act.ownerUid !== req.user.uid && !isAdmin(req)) return res.status(403).json({ error: "Not your activity." });

      let targets = [];
      if (b.all) {
        const r = await db().collection("teacherStudents").doc(req.user.uid).collection("roster").get();
        targets = r.docs.map((d) => d.id);
      } else if (Array.isArray(b.studentUids)) {
        targets = b.studentUids.slice(0, 300).map(String);
      }
      if (!targets.length) return res.status(400).json({ error: "No students to assign — add students to your class first." });

      const batch = db().batch();
      for (const uid of targets) {
        const ref = db().collection("studentAssignments").doc(uid).collection("items").doc(act.id);
        batch.set(ref, {
          activityId: act.id,
          shareSlug: act.shareSlug || null,
          activityTitle: act.title || null,
          subject: act.subject || null,
          teacherUid: req.user.uid,
          teacherName: displayName(req, p),
          status: "assigned",
          assignedAt: stamp(),
        }, { merge: true });
      }
      await batch.commit();
      res.json({ ok: true, assigned: targets.length });
    } catch (e) {
      console.error("[/api/classroom/assign]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /my-stats — the student's real dashboard figures ─────────
  router.get("/my-stats", authenticate, async (req, res) => {
    try {
      const snap = await db().collection("studentStats").doc(req.user.uid).collection("private").doc("summary").get();
      const d = snap.exists ? snap.data() : {};
      const accuracyPct = d.maxSum ? Math.round((d.scoreSum / d.maxSum) * 100) : 0;
      const subjects = Object.values(d.subjects || {})
        .map((x) => ({ name: x.name || "Subject", pct: x.maxSum ? Math.round((x.scoreSum / x.maxSum) * 100) : 0, count: x.count || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      res.json({ submissions: d.submissions || 0, problemsSolved: d.problemsSolved || 0, accuracyPct, subjects });
    } catch (e) {
      console.error("[/api/classroom/my-stats]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /assignments — the student's "assigned to me" list ───────
  router.get("/assignments", authenticate, async (req, res) => {
    try {
      const snap = await db().collection("studentAssignments").doc(req.user.uid).collection("items").get();
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
      const assignments = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b.assignedAt) - ms(a.assignedAt));
      res.json({ assignments });
    } catch (e) {
      console.error("[/api/classroom/assignments]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
