/**
 * Classroom — real teacher↔student roster + activity assignment.
 *
 * Server-authoritative (Admin SDK). Roster and per-student assignments are kept
 * in SUBcollections so the broad top-level Firestore read rule can't expose
 * them (see firestore.rules). Both roles are gated by the "classroom" feature
 * (admin state + per-user overrides, lib/access; default premium).
 *
 *   POST /api/classroom/class-code   — teacher's join code (idempotent)
 *   GET  /api/classroom/roster       — teacher's students + class code
 *   GET  /api/classroom/teachers     — admin: every class, with roster sizes
 *   POST /api/classroom/join         — student joins a class via { code }
 *   POST /api/classroom/assign       — teacher assigns an activity to students
 *   POST /api/classroom/assign-cbt   — …a built CBT practice test (by URL)
 *   POST /api/classroom/assign-writing — …a writing task (by library id)
 *   GET  /api/classroom/assignments  — student's "assigned to me" list
 *
 * Every assign route takes { all: true } for the whole class or
 * { studentUids: [...] } for named students, resolved by one helper that
 * intersects the list with the roster. An ADMIN may add { teacherUid } to
 * assign into somebody else's class — see resolveTeacher below; a teacher who
 * sends that field for anyone but themselves gets a 403.
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");
const access = require("../lib/access");

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
  const isTeacher = (req, p) => isAdmin(req) || ["teacher", "admin"].includes(p && p.role);

  // Access resolved through the shared feature registry ("classroom" feature:
  // admin state + per-user overrides via lib/access). 402 shape unchanged.
  function deny(res, verdict) {
    if (verdict.reason === "premium-required") {
      return res.status(402).json({ error: "premium_required", premiumRequired: true });
    }
    return res.status(403).json({ error: "feature_disabled", reason: verdict.reason });
  }
  const displayName = (req, p) => p.name || (req.user.email ? req.user.email.split("@")[0] : "User");

  /* WHOSE class the assignment lands in.

     Normally the caller's own — a teacher assigns to the students who joined
     their code, and `teacherUid` is not a field they ever send. An ADMIN may
     name another teacher, which is the whole point of them being able to see
     every teacher's activities in the library: seeing one is no use without
     being able to put it in front of a class.

     Nobody else may name a teacher AT ALL. Returns null for "you may not touch
     that class", which every caller turns into a 403 — silently falling back
     to the caller's own class would be worse, because they would be told the
     assignment succeeded and it would have gone somewhere else. */
  async function resolveTeacher(req, b) {
    const wanted = String((b && b.teacherUid) || "").trim();
    if (!wanted || wanted === req.user.uid) return req.user.uid;
    if (!isAdmin(req)) return null;
    return wanted;
  }

  /* Who an assignment goes to: the whole class, or the named students.
     Named uids are INTERSECTED with that teacher's roster — the list arrives
     from the browser, and without this a teacher could post any uid at all and
     drop an assignment into a stranger's list. Assigning to "all" reads the
     same roster, so the two paths can never disagree about who is in the class. */
  async function resolveTargets(teacherUid, b) {
    const roster = await db().collection("teacherStudents").doc(teacherUid).collection("roster").get();
    const inClass = new Set(roster.docs.map((d) => d.id));
    if (b.all) return [...inClass];
    if (!Array.isArray(b.studentUids)) return [];
    return b.studentUids.slice(0, 300).map(String).filter((uid) => inClass.has(uid));
  }

  /* The name that goes ON the assignment. It is the OWNING teacher's, never
     the admin's: the student's list says who set them the work, and "assigned
     by the site administrator" is not an answer to that question. Who actually
     pressed the button is recorded separately, as assignedByUid. */
  async function teacherLabel(teacherUid, req, p) {
    if (teacherUid === req.user.uid) return displayName(req, p);
    const t = await profile(teacherUid);
    if (t.name) return t.name;
    const tc = await db().collection("teacherClass").doc(teacherUid).get();
    if (tc.exists && tc.data().teacherName) return tc.data().teacherName;
    return t.email ? String(t.email).split("@")[0] : "Teacher";
  }

  // The shared tail of all three assign routes: resolve the class, resolve the
  // students in it, and fail with the reason rather than a bare empty list.
  async function assignmentTargets(req, b, p) {
    const teacherUid = await resolveTeacher(req, b);
    if (!teacherUid) return { error: "That is not your class.", status: 403 };
    const targets = await resolveTargets(teacherUid, b);
    if (!targets.length) {
      return {
        error: teacherUid === req.user.uid
          ? "No students to assign — add students to your class first."
          : "That teacher has no students in their class yet.",
        status: 400,
      };
    }
    return { teacherUid, targets, teacherName: await teacherLabel(teacherUid, req, p) };
  }

  /* ── GET /teachers — every class an admin could assign into ───────
     Admin only. The picker needs the roster size to be useful ("assign to
     which class" is unanswerable without knowing which ones have anybody in
     them), so each roster is read with .select() — the doc ids alone, none of
     the student data, which is all a count needs. */
  router.get("/teachers", authenticate, async (req, res) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admins only." });
      const snap = await db().collection("users")
        .where("role", "in", ["teacher", "admin"]).limit(200).get();

      const teachers = await Promise.all(snap.docs.map(async (d) => {
        const u = d.data() || {};
        const [roster, tc] = await Promise.all([
          db().collection("teacherStudents").doc(d.id).collection("roster").select().get(),
          db().collection("teacherClass").doc(d.id).get(),
        ]);
        return {
          uid: d.id,
          name: u.name || (u.email ? String(u.email).split("@")[0] : "Teacher"),
          email: u.email || "",
          role: u.role || "teacher",
          code: tc.exists ? tc.data().code || null : null,
          students: roster.size,
        };
      }));

      // Classes with students first — those are the ones worth assigning to.
      teachers.sort((a, b) => b.students - a.students || a.name.localeCompare(b.name));
      res.json({ teachers });
    } catch (e) {
      console.error("[/api/classroom/teachers]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /class-code — the teacher's join code (idempotent) ───────
  router.post("/class-code", authenticate, async (req, res) => {
    try {
      const p = await profile(req.user.uid);
      const verdict = await access.canUse(req, "classroom");
      if (!verdict.allowed) return deny(res, verdict);
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
      const verdict = await access.canUse(req, "classroom");
      if (!verdict.allowed) return deny(res, verdict);
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

      const who = await assignmentTargets(req, b, p);
      if (who.error) return res.status(who.status).json({ error: who.error });

      const batch = db().batch();
      for (const uid of who.targets) {
        const ref = db().collection("studentAssignments").doc(uid).collection("items").doc(act.id);
        batch.set(ref, {
          activityId: act.id,
          shareSlug: act.shareSlug || null,
          activityTitle: act.title || null,
          subject: act.subject || null,
          teacherUid: who.teacherUid,
          teacherName: who.teacherName,
          assignedByUid: req.user.uid,
          status: "assigned",
          assignedAt: stamp(),
        }, { merge: true });
      }
      await batch.commit();
      res.json({ ok: true, assigned: who.targets.length, teacherName: who.teacherName });
    } catch (e) {
      console.error("[/api/classroom/assign]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /assign-cbt — teacher assigns a built CBT practice test ──
  // { url, title, subject?, all?:bool, studentUids?:[] }. The CBT isn't a stored
  // doc (it's a builder config), so we assign the launch URL itself. Re-assigning
  // the same test is idempotent (the doc id is derived from the URL).
  router.post("/assign-cbt", authenticate, async (req, res) => {
    try {
      const p = await profile(req.user.uid);
      if (!isTeacher(req, p)) return res.status(403).json({ error: "Teachers only." });
      const b = req.body || {};

      // Accept only a site-relative launch URL for our own CBT engine.
      const url = String(b.url || "").trim().slice(0, 1000);
      if (!/^\/[^\s]*\bsource=cbt\b/.test(url) || !url.includes("question.html")) {
        return res.status(400).json({ error: "Not a valid practice-test link." });
      }
      const title = String(b.title || "").trim().slice(0, 140) || "Practice test";
      const subject = String(b.subject || "").trim().slice(0, 80) || null;

      const who = await assignmentTargets(req, b, p);
      if (who.error) return res.status(who.status).json({ error: who.error });

      // Stable doc id from the URL so the same config doesn't pile up duplicates.
      let h = 5381;
      for (let i = 0; i < url.length; i++) h = ((h << 5) + h + url.charCodeAt(i)) | 0;
      const docId = "cbt_" + (h >>> 0).toString(36);

      const batch = db().batch();
      for (const uid of who.targets) {
        const ref = db().collection("studentAssignments").doc(uid).collection("items").doc(docId);
        batch.set(ref, {
          kind: "cbt",
          cbtUrl: url,
          activityTitle: title,
          subject,
          teacherUid: who.teacherUid,
          teacherName: who.teacherName,
          assignedByUid: req.user.uid,
          status: "assigned",
          assignedAt: stamp(),
        }, { merge: true });
      }
      await batch.commit();
      res.json({ ok: true, assigned: who.targets.length, teacherName: who.teacherName });
    } catch (e) {
      console.error("[/api/classroom/assign-cbt]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  /* ── POST /assign-writing — a task from the writing library ───────
     { taskId, all?:bool, studentUids?:[] }. The task is already a stored doc
     (writingLibrary, see routes/writing.js), so unlike a CBT there is something
     real to point at: the assignment carries /writing/?task=<id>, which is the
     same link the Share button hands out. Only the owner of the task may set it
     — a library id is guessable enough that anyone could otherwise assign
     somebody else's prompt to their own class. */
  router.post("/assign-writing", authenticate, async (req, res) => {
    try {
      const p = await profile(req.user.uid);
      if (!isTeacher(req, p)) return res.status(403).json({ error: "Teachers only." });
      const b = req.body || {};

      const taskId = String(b.taskId || "").trim().slice(0, 120);
      if (!/^[a-z0-9_-]+$/i.test(taskId)) return res.status(400).json({ error: "Not a valid task." });

      const snap = await db().collection("writingLibrary").doc(taskId).get();
      if (!snap.exists) return res.status(404).json({ error: "Task not found." });
      const task = snap.data() || {};
      if (task.ownerUid !== req.user.uid && !isAdmin(req)) {
        return res.status(403).json({ error: "Not your task." });
      }

      const who = await assignmentTargets(req, b, p);
      if (who.error) return res.status(who.status).json({ error: who.error });

      // The prompt is the title; a summary's task line is generic, so the
      // passage title is what tells one apart from another in a list.
      const title = (task.passage && task.passage.title)
        ? `Summary: ${task.passage.title}`
        : String(task.prompt || "Writing task").slice(0, 140);

      // The short link when the task has one (routes/writing.js mints it on
      // Share), because a student may well be reading this off a phone and
      // typing it into another device.
      const url = task.shortCode
        ? `/w/${task.shortCode}`
        : `/writing/index.html?task=${encodeURIComponent(taskId)}`;

      const batch = db().batch();
      for (const uid of who.targets) {
        const ref = db().collection("studentAssignments").doc(uid).collection("items").doc(`writing_${taskId}`);
        batch.set(ref, {
          kind: "writing",
          writingUrl: url,
          taskId,
          activityTitle: title,
          subject: task.formLabel || "English",
          teacherUid: who.teacherUid,
          teacherName: who.teacherName,
          assignedByUid: req.user.uid,
          status: "assigned",
          assignedAt: stamp(),
        }, { merge: true });
      }
      await batch.commit();
      res.json({ ok: true, assigned: who.targets.length, teacherName: who.teacherName });
    } catch (e) {
      console.error("[/api/classroom/assign-writing]", e.message);
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
