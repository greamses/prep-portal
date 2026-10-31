/**
 * Classes — groups, students, assigning papers, the bell, and old tasks.
 *
 * Builds on routes/classroom.js (one class per teacher, joined by a code, the
 * roster kept in teacherStudents/{teacher}/roster). This adds:
 *
 *   GET    /api/classes/overview            groups + students (a teacher's own; an admin may add ?teacherUid=)
 *   POST   /api/classes/groups              { name }
 *   PATCH  /api/classes/groups/:id          { name }
 *   DELETE /api/classes/groups/:id          its students become ungrouped
 *   POST   /api/classes/students/add        { email | uid, groupId? }  put a student in the class
 *   POST   /api/classes/students/move       { uids, groupId|null }     regroup
 *   POST   /api/classes/students/remove     { uids }
 *   POST   /api/classes/assign-paper        { code, all? | groupId? | studentUids? }
 *   GET    /api/classes/bell                the bell: this person's notices, newest first
 *   POST   /api/classes/bell/seen           { all: true }
 *   GET    /api/classes/tasks?older=30      ADMIN: every task, optionally only those older than N days
 *   DELETE /api/classes/tasks               ADMIN: { kind, code }
 *
 * A teacher or an admin manages a class; an admin may name any teacher's class
 * with `teacherUid`, and nobody else may (a 403, never a quiet fallback to
 * their own). Students are only ever added to, moved in or removed from THAT
 * teacher's roster: every uid arrives from a browser and is intersected with it.
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");
const { notifyStudents } = require("../lib/notices");

module.exports = function () {
  const router = express.Router();
  // a class list is read straight after it is changed: never let a browser or proxy replay an old one
  router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  const db = () => admin.firestore();
  const stamp = () => admin.firestore.FieldValue.serverTimestamp();
  const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
  const clip = (s, n) => String(s == null ? "" : s).slice(0, n);

  const isAdmin = (req) => !!req.user && !!req.user.email && req.user.email === process.env.ADMIN_EMAIL;
  async function profile(uid) {
    try { const s = await db().collection("users").doc(uid).get(); return s.exists ? s.data() : {}; } catch (_) { return {}; }
  }
  const isTeacher = (req, p) => isAdmin(req) || ["teacher", "admin"].includes(p && p.role);
  const rosterOf = (t) => db().collection("teacherStudents").doc(t).collection("roster");
  const groupsOf = (t) => db().collection("teacherGroups").doc(t).collection("groups");
  const codeOk = (c) => /^[A-Z2-9]{6}$/.test(String(c || ""));

  /** Whose class: the caller's own, or (admin only) the teacher named. Null means "not yours". */
  async function whose(req) {
    const wanted = String((req.query && req.query.teacherUid) || (req.body && req.body.teacherUid) || "").trim();
    const p = await profile(req.user.uid);
    if (!isTeacher(req, p)) return { error: "Teachers only.", status: 403 };
    if (!wanted || wanted === req.user.uid) return { teacherUid: req.user.uid, me: p };
    if (!isAdmin(req)) return { error: "That is not your class.", status: 403 };
    return { teacherUid: wanted, me: p };
  }

  async function groupExists(t, id) {
    if (!id) return true;
    return (await groupsOf(t).doc(String(id)).get()).exists;
  }

  /* ── the class ───────────────────────────────────────────────────────── */

  router.get("/overview", authenticate, async (req, res) => {
    try {
      const w = await whose(req);
      if (w.error) return res.status(w.status).json({ error: w.error });
      const [gs, rs, tc] = await Promise.all([
        groupsOf(w.teacherUid).get(),
        rosterOf(w.teacherUid).get(),
        db().collection("teacherClass").doc(w.teacherUid).get(),
      ]);
      const students = rs.docs.map((d) => {
        const r = d.data();
        return { uid: d.id, name: r.name || "Student", email: r.email || null, groupId: r.groupId || null, joinedAt: ms(r.joinedAt) };
      }).sort((a, b) => a.name.localeCompare(b.name));
      const groups = gs.docs.map((d) => ({ id: d.id, name: d.data().name, count: students.filter((s) => s.groupId === d.id).length }))
        .sort((a, b) => a.name.localeCompare(b.name));
      const out = { ok: true, teacherUid: w.teacherUid, code: tc.exists ? tc.data().code || null : null, teacherName: tc.exists ? tc.data().teacherName || "" : "", groups, students, admin: isAdmin(req) };
      if (isAdmin(req)) {
        const all = await db().collection("teacherClass").limit(300).get();
        out.teachers = all.docs.map((d) => ({ uid: d.id, name: d.data().teacherName || "Teacher" })).sort((a, b) => a.name.localeCompare(b.name));
      }
      res.json(out);
    } catch (e) {
      console.error("[/api/classes/overview]", e.message);
      res.status(500).json({ error: "Could not load the class." });
    }
  });

  router.post("/groups", authenticate, async (req, res) => {
    try {
      const w = await whose(req);
      if (w.error) return res.status(w.status).json({ error: w.error });
      const name = clip(String(req.body.name || "").replace(/\s+/g, " ").trim(), 40);
      if (!name) return res.status(400).json({ error: "Give the group a name." });
      const had = await groupsOf(w.teacherUid).get();
      if (had.size >= 40) return res.status(400).json({ error: "That is plenty of groups." });
      if (had.docs.some((d) => String(d.data().name).toLowerCase() === name.toLowerCase())) return res.status(409).json({ error: "There is already a group with that name." });
      const ref = groupsOf(w.teacherUid).doc();
      await ref.set({ name, createdAt: stamp() });
      res.json({ ok: true, id: ref.id, name });
    } catch (e) {
      console.error("[/api/classes/groups]", e.message);
      res.status(500).json({ error: "Could not make the group." });
    }
  });

  router.patch("/groups/:id", authenticate, async (req, res) => {
    try {
      const w = await whose(req);
      if (w.error) return res.status(w.status).json({ error: w.error });
      const name = clip(String(req.body.name || "").replace(/\s+/g, " ").trim(), 40);
      if (!name) return res.status(400).json({ error: "Give the group a name." });
      if (!(await groupExists(w.teacherUid, req.params.id))) return res.status(404).json({ error: "No such group." });
      await groupsOf(w.teacherUid).doc(req.params.id).set({ name }, { merge: true });
      res.json({ ok: true });
    } catch (e) {
      console.error("[/api/classes/groups/:id]", e.message);
      res.status(500).json({ error: "Could not rename it." });
    }
  });

  router.delete("/groups/:id", authenticate, async (req, res) => {
    try {
      const w = await whose(req);
      if (w.error) return res.status(w.status).json({ error: w.error });
      const id = String(req.params.id);
      if (!(await groupExists(w.teacherUid, id))) return res.status(404).json({ error: "No such group." });
      const inGroup = await rosterOf(w.teacherUid).where("groupId", "==", id).get();
      const batch = db().batch();
      inGroup.docs.forEach((d) => batch.set(d.ref, { groupId: null }, { merge: true }));
      batch.delete(groupsOf(w.teacherUid).doc(id));
      await batch.commit();
      res.json({ ok: true, ungrouped: inGroup.size });
    } catch (e) {
      console.error("[/api/classes/groups/delete]", e.message);
      res.status(500).json({ error: "Could not remove the group." });
    }
  });

  /* ── students ──────────────────────────────────────────────────────── */

  router.post("/students/add", authenticate, async (req, res) => {
    try {
      const w = await whose(req);
      if (w.error) return res.status(w.status).json({ error: w.error });
      const b = req.body || {};
      if (!(await groupExists(w.teacherUid, b.groupId))) return res.status(404).json({ error: "No such group." });

      let uid = clip(b.uid, 128), user = null;
      if (uid) {
        const s = await db().collection("users").doc(uid).get();
        if (s.exists) user = s.data();
      } else {
        const email = clip(String(b.email || "").trim().toLowerCase(), 160);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "Type the student's email address." });
        const q = await db().collection("users").where("email", "==", email).limit(1).get();
        if (q.empty) return res.status(404).json({ error: "No account has that email yet. Ask them to sign up first, or share your class code." });
        uid = q.docs[0].id; user = q.docs[0].data();
      }
      if (!user) return res.status(404).json({ error: "No such student." });
      if (uid === w.teacherUid) return res.status(400).json({ error: "That is the teacher's own account." });
      await rosterOf(w.teacherUid).doc(uid).set({
        name: user.name || user.displayName || (user.email ? String(user.email).split("@")[0] : "Student"),
        email: user.email || null, groupId: b.groupId || null, joinedAt: stamp(), source: "teacher",
      }, { merge: true });
      res.json({ ok: true, uid });
    } catch (e) {
      console.error("[/api/classes/students/add]", e.message);
      res.status(500).json({ error: "Could not add the student." });
    }
  });

  /** The uids that really are in this class, out of those the browser sent. */
  async function inClass(teacherUid, uids) {
    const have = new Set((await rosterOf(teacherUid).get()).docs.map((d) => d.id));
    return (Array.isArray(uids) ? uids : []).slice(0, 300).map(String).filter((u) => have.has(u));
  }

  router.post("/students/move", authenticate, async (req, res) => {
    try {
      const w = await whose(req);
      if (w.error) return res.status(w.status).json({ error: w.error });
      const gid = req.body.groupId || null;
      if (!(await groupExists(w.teacherUid, gid))) return res.status(404).json({ error: "No such group." });
      const uids = await inClass(w.teacherUid, req.body.uids);
      if (!uids.length) return res.status(400).json({ error: "Choose students from your class." });
      const batch = db().batch();
      uids.forEach((u) => batch.set(rosterOf(w.teacherUid).doc(u), { groupId: gid }, { merge: true }));
      await batch.commit();
      res.json({ ok: true, moved: uids.length });
    } catch (e) {
      console.error("[/api/classes/students/move]", e.message);
      res.status(500).json({ error: "Could not regroup them." });
    }
  });

  router.post("/students/remove", authenticate, async (req, res) => {
    try {
      const w = await whose(req);
      if (w.error) return res.status(w.status).json({ error: w.error });
      const uids = await inClass(w.teacherUid, req.body.uids);
      if (!uids.length) return res.status(400).json({ error: "Choose students from your class." });
      const batch = db().batch();
      uids.forEach((u) => batch.delete(rosterOf(w.teacherUid).doc(u)));
      await batch.commit();
      res.json({ ok: true, removed: uids.length });
    } catch (e) {
      console.error("[/api/classes/students/remove]", e.message);
      res.status(500).json({ error: "Could not remove them." });
    }
  });

  /* ── assigning a shared paper to a class ───────────────────────────── */

  router.post("/assign-paper", authenticate, async (req, res) => {
    try {
      const w = await whose(req);
      if (w.error) return res.status(w.status).json({ error: w.error });
      const b = req.body || {};
      const code = String(b.code || "").toUpperCase();
      if (!codeOk(code)) return res.status(400).json({ error: "Share the paper first." });
      const pSnap = await db().collection("sharedPapers").doc(code).get();
      if (!pSnap.exists) return res.status(404).json({ error: "That paper doesn't exist." });
      const paper = pSnap.data();
      if (paper.ownerUid !== req.user.uid && !isAdmin(req)) return res.status(403).json({ error: "That is not your paper." });

      const roster = await rosterOf(w.teacherUid).get();
      let targets;
      if (b.all) targets = roster.docs.map((d) => d.id);
      else if (b.groupId) targets = roster.docs.filter((d) => d.data().groupId === String(b.groupId)).map((d) => d.id);
      else targets = await inClass(w.teacherUid, b.studentUids);
      if (!targets.length) return res.status(400).json({ error: "No students to assign it to. Add some to the class (or group) first." });

      const tc = await db().collection("teacherClass").doc(w.teacherUid).get();
      const teacherName = (tc.exists && tc.data().teacherName) || w.me.name || "Your teacher";
      const url = `/paper/${code}`;
      for (let i = 0; i < targets.length; i += 400) {
        const batch = db().batch();
        targets.slice(i, i + 400).forEach((uid) => {
          batch.set(db().collection("studentAssignments").doc(uid).collection("items").doc(`paper_${code}`), {
            kind: "paper", paperUrl: url, activityTitle: paper.title || "Mock paper", subject: (paper.head && paper.head.subject) || "",
            teacherUid: w.teacherUid, teacherName, assignedByUid: req.user.uid, status: "assigned", assignedAt: stamp(),
          }, { merge: true });
        });
        await batch.commit();
      }
      await notifyStudents(targets, { kind: "task", title: paper.title || "New paper", text: `${teacherName} set you a paper.`, url, from: teacherName }, `task_paper_${code}`);
      res.json({ ok: true, assigned: targets.length, url });
    } catch (e) {
      console.error("[/api/classes/assign-paper]", e.message);
      res.status(500).json({ error: "Could not assign it." });
    }
  });

  /* ── the bell ──────────────────────────────────────────────────────── */

  router.get("/bell", authenticate, async (req, res) => {
    try {
      const uid = req.user.uid;
      const [mine, theirs] = await Promise.all([
        db().collection("studentNotices").doc(uid).collection("items").orderBy("at", "desc").limit(25).get(),
        db().collection("teacherNotices").doc(uid).collection("items").orderBy("at", "desc").limit(25).get(),
      ]);
      const items = [];
      mine.docs.forEach((d) => {
        const n = d.data();
        items.push({ id: d.id, src: "s", kind: n.kind, title: n.title, text: n.text, url: n.url, at: ms(n.at), seen: !!n.seen });
      });
      /* a teacher's own notices (a score came in) share the bell */
      theirs.docs.forEach((d) => {
        const n = d.data();
        const link = n.kind === "paper" ? `/paper/${n.code}` : n.kind === "workbook" ? `/wb/${n.code}` : "/dashboard.html";
        items.push({ id: d.id, src: "t", kind: "result", title: n.title || "Score in", text: `${n.name || "A student"} scored ${n.pct}%.`, url: link, at: ms(n.at), seen: !!n.seen });
      });
      items.sort((a, b) => b.at - a.at);
      res.json({ ok: true, items: items.slice(0, 30), unread: items.filter((i) => !i.seen).length });
    } catch (e) {
      console.error("[/api/classes/bell]", e.message);
      res.status(500).json({ error: "Could not load notices." });
    }
  });

  router.post("/bell/seen", authenticate, async (req, res) => {
    try {
      const uid = req.user.uid;
      for (const col of [db().collection("studentNotices").doc(uid).collection("items"), db().collection("teacherNotices").doc(uid).collection("items")]) {
        const unseen = await col.where("seen", "==", false).limit(200).get();
        if (unseen.empty) continue;
        const batch = db().batch();
        unseen.docs.forEach((d) => batch.set(d.ref, { seen: true }, { merge: true }));
        await batch.commit();
      }
      res.json({ ok: true });
    } catch (e) {
      console.error("[/api/classes/bell/seen]", e.message);
      res.status(500).json({ error: "Could not mark them read." });
    }
  });

  /* ── old tasks (admin) ─────────────────────────────────────────────── */

  const KINDS = { workbook: { col: "workbookAssignments", item: (c) => `wb_${c}`, noticeKind: "workbook" }, paper: { col: "sharedPapers", item: (c) => `paper_${c}`, noticeKind: "paper" } };

  router.get("/tasks", authenticate, async (req, res) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ error: "Only the administrator can see every task." });
      const days = Math.max(0, Math.round(Number(req.query.older)) || 0);
      const cutoff = days ? Date.now() - days * 86400000 : Infinity;
      const tasks = [];
      for (const [kind, k] of Object.entries(KINDS)) {
        const snap = await db().collection(k.col).limit(500).get();
        snap.docs.forEach((d) => {
          const a = d.data();
          const at = ms(a.createdAt);
          if (at && at >= cutoff) return;
          tasks.push({ kind, code: d.id, title: a.title || (kind === "paper" ? "Mock paper" : "Workbook"), owner: a.teacherName || a.ownerName || "", students: a.students || 0, createdAt: at });
        });
      }
      tasks.sort((a, b) => a.createdAt - b.createdAt);
      res.json({ ok: true, tasks });
    } catch (e) {
      console.error("[/api/classes/tasks]", e.message);
      res.status(500).json({ error: "Could not list the tasks." });
    }
  });

  async function deleteTask(kind, code) {
    const k = KINDS[kind];
    const ref = db().collection(k.col).doc(code);
    const snap = await ref.get();
    if (!snap.exists) return false;
    const a = snap.data();
    const results = await ref.collection("results").get();
    /* everyone who has it in their list: those who sent a score, and the owner's whole class */
    const who = new Set(results.docs.map((d) => d.id));
    const owner = a.teacherUid || a.ownerUid;
    if (owner) (await rosterOf(owner).get()).docs.forEach((d) => who.add(d.id));
    const refs = [...results.docs.map((d) => d.ref)];
    who.forEach((uid) => {
      refs.push(db().collection("studentAssignments").doc(uid).collection("items").doc(k.item(code)));
      refs.push(db().collection("studentNotices").doc(uid).collection("items").doc(`task_${kind}_${code}`));
    });
    if (owner) {
      const notes = await db().collection("teacherNotices").doc(owner).collection("items").where("code", "==", code).get();
      notes.docs.forEach((d) => refs.push(d.ref));
    }
    for (let i = 0; i < refs.length; i += 400) {
      const batch = db().batch();
      refs.slice(i, i + 400).forEach((r) => batch.delete(r));
      await batch.commit();
    }
    await ref.delete();
    return true;
  }

  router.delete("/tasks", authenticate, async (req, res) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ error: "Only the administrator can delete tasks." });
      const list = Array.isArray(req.body.tasks) ? req.body.tasks.slice(0, 200) : [req.body];
      let removed = 0;
      for (const t of list) {
        const kind = String(t.kind || "");
        const code = String(t.code || "").toUpperCase();
        if (!KINDS[kind] || !codeOk(code)) continue;
        if (await deleteTask(kind, code)) removed++;
      }
      res.json({ ok: true, removed });
    } catch (e) {
      console.error("[/api/classes/tasks/delete]", e.message);
      res.status(500).json({ error: "Could not delete them." });
    }
  });

  return router;
};
