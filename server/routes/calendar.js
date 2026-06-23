/**
 * Calendar — admin pins class sessions to a teacher's calendar; the teacher and
 * every student in that teacher's roster then see the same pinned events.
 *
 * Server-authoritative (Admin SDK). The canonical event lives in `calendarEvents`
 * (teacher reads it filtered by teacherUid; admin reads all); a copy is fanned out
 * to studentCalendar/{uid}/items for each roster student so students see it too —
 * the same fan-out pattern the assignment feature uses.
 *
 *   GET    /api/calendar          — events for the caller (role-scoped)
 *   GET    /api/calendar/teachers — admin: pick-list of teachers to pin to
 *   POST   /api/calendar/pin      — admin: pin a class to a teacher's calendar
 *   DELETE /api/calendar/:id      — admin: unpin everywhere
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");

// Sticky-note palette (mirrors the dashboard's pp-sticky colours).
const COLORS = ["#bfe3ff", "#c8f0c0", "#fff39a", "#ffd9a8", "#ffc9de", "#e8d5ff"];
const isoDate = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) ? String(s) : null);

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();
  const stamp = admin.firestore.FieldValue.serverTimestamp;

  async function profile(uid) {
    try { const s = await db().collection("users").doc(uid).get(); return s.exists ? s.data() : {}; }
    catch (_) { return {}; }
  }
  // The platform admin: the ADMIN_EMAIL super-admin, or any user with role "admin".
  async function isAdmin(req) {
    if (req.user?.email && req.user.email === process.env.ADMIN_EMAIL) return true;
    const p = await profile(req.user.uid);
    return p.role === "admin";
  }

  const publicEvent = (e) => ({
    id: e.id,
    title: e.title,
    className: e.className || null,
    subject: e.subject || null,
    date: e.date,
    time: e.time || null,
    endTime: e.endTime || null,
    location: e.location || null,
    notes: e.notes || null,
    color: e.color || null,
    teacherUid: e.teacherUid || null,
    teacherName: e.teacherName || null,
    studentCount: typeof e.studentCount === "number" ? e.studentCount : null,
  });

  const byDate = (a, b) =>
    String(a.date).localeCompare(String(b.date)) ||
    String(a.time || "").localeCompare(String(b.time || ""));

  // ── GET / — events for the caller ─────────────────────────────────
  // admin → all events; teacher → events pinned to them; student → events
  // fanned out to them from their teacher's roster.
  router.get("/", authenticate, async (req, res) => {
    try {
      let docs = [];
      if (await isAdmin(req)) {
        const snap = await db().collection("calendarEvents").get();
        docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } else {
        const p = await profile(req.user.uid);
        if (p.role === "teacher") {
          const snap = await db().collection("calendarEvents").where("teacherUid", "==", req.user.uid).get();
          docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } else {
          const snap = await db().collection("studentCalendar").doc(req.user.uid).collection("items").get();
          docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
      }
      docs.sort(byDate);
      res.json({ events: docs.map(publicEvent), admin: await isAdmin(req) });
    } catch (e) {
      console.error("[/api/calendar GET]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /teachers — admin: who can I pin a class to? ──────────────
  router.get("/teachers", authenticate, async (req, res) => {
    try {
      if (!(await isAdmin(req))) return res.status(403).json({ error: "Admin access only." });
      const snap = await db().collection("users").where("role", "==", "teacher").get();
      const teachers = snap.docs
        .map((d) => {
          const x = d.data();
          return { uid: d.id, name: x.name || (x.email ? x.email.split("@")[0] : "Teacher"), email: x.email || null };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      res.json({ teachers });
    } catch (e) {
      console.error("[/api/calendar/teachers]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /students — admin: the pool of students to assign ─────────
  router.get("/students", authenticate, async (req, res) => {
    try {
      if (!(await isAdmin(req))) return res.status(403).json({ error: "Admin access only." });
      const snap = await db().collection("users").where("role", "==", "student").get();
      const students = snap.docs
        .map((d) => {
          const x = d.data();
          return { uid: d.id, name: x.name || (x.email ? x.email.split("@")[0] : "Student"), email: x.email || null };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      res.json({ students });
    } catch (e) {
      console.error("[/api/calendar/students]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /roster/:teacherUid — admin: who's in a teacher's class ───
  router.get("/roster/:teacherUid", authenticate, async (req, res) => {
    try {
      if (!(await isAdmin(req))) return res.status(403).json({ error: "Admin access only." });
      const snap = await db().collection("teacherStudents").doc(String(req.params.teacherUid)).collection("roster").get();
      const students = snap.docs.map((d) => ({ uid: d.id, name: d.data().name || "Student", email: d.data().email || null }));
      res.json({ students });
    } catch (e) {
      console.error("[/api/calendar/roster GET]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Keep each of a teacher's events' studentCount in sync with their roster size.
  async function syncCount(teacherUid) {
    const r = await db().collection("teacherStudents").doc(teacherUid).collection("roster").get();
    const count = r.docs.length;
    const evs = await db().collection("calendarEvents").where("teacherUid", "==", teacherUid).get();
    for (let i = 0; i < evs.docs.length; i += 400) {
      const batch = db().batch();
      evs.docs.slice(i, i + 400).forEach((d) => batch.update(d.ref, { studentCount: count }));
      await batch.commit();
    }
    return count;
  }

  // ── POST /assign-student — admin adds a student to a teacher ──────
  // { teacherUid, studentUid }. Also back-fills that teacher's already-pinned
  // events to the new student so they immediately see the class schedule.
  router.post("/assign-student", authenticate, async (req, res) => {
    try {
      if (!(await isAdmin(req))) return res.status(403).json({ error: "Admin access only." });
      const b = req.body || {};
      const teacherUid = String(b.teacherUid || "").trim();
      const studentUid = String(b.studentUid || "").trim();
      if (!teacherUid || !studentUid) return res.status(400).json({ error: "Pick a teacher and a student." });

      const sp = await profile(studentUid);
      const name = sp.name || (sp.email ? sp.email.split("@")[0] : "Student");
      await db().collection("teacherStudents").doc(teacherUid).collection("roster").doc(studentUid).set(
        { name, email: sp.email || null, joinedAt: stamp(), source: "admin" },
        { merge: true },
      );

      // Back-fill the teacher's existing pinned events onto this student's calendar.
      const evs = await db().collection("calendarEvents").where("teacherUid", "==", teacherUid).get();
      for (let i = 0; i < evs.docs.length; i += 400) {
        const batch = db().batch();
        evs.docs.slice(i, i + 400).forEach((d) =>
          batch.set(
            db().collection("studentCalendar").doc(studentUid).collection("items").doc(d.id),
            { ...d.data(), eventId: d.id },
            { merge: true },
          ));
        await batch.commit();
      }
      const count = await syncCount(teacherUid);
      res.json({ ok: true, student: { uid: studentUid, name, email: sp.email || null }, count });
    } catch (e) {
      console.error("[/api/calendar/assign-student]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── DELETE /roster/:teacherUid/:studentUid — admin removes a student
  router.delete("/roster/:teacherUid/:studentUid", authenticate, async (req, res) => {
    try {
      if (!(await isAdmin(req))) return res.status(403).json({ error: "Admin access only." });
      const teacherUid = String(req.params.teacherUid);
      const studentUid = String(req.params.studentUid);
      await db().collection("teacherStudents").doc(teacherUid).collection("roster").doc(studentUid).delete();

      // Pull that teacher's pinned events back off the student's calendar.
      const evs = await db().collection("calendarEvents").where("teacherUid", "==", teacherUid).get();
      for (let i = 0; i < evs.docs.length; i += 400) {
        const batch = db().batch();
        evs.docs.slice(i, i + 400).forEach((d) =>
          batch.delete(db().collection("studentCalendar").doc(studentUid).collection("items").doc(d.id)));
        await batch.commit();
      }
      const count = await syncCount(teacherUid);
      res.json({ ok: true, count });
    } catch (e) {
      console.error("[/api/calendar/roster DELETE]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /pin — admin pins a class to a teacher's calendar ────────
  // { teacherUid, title, className?, date (YYYY-MM-DD), time?, color? }
  router.post("/pin", authenticate, async (req, res) => {
    try {
      if (!(await isAdmin(req))) return res.status(403).json({ error: "Admin access only." });
      const b = req.body || {};
      const teacherUid = String(b.teacherUid || "").trim();
      if (!teacherUid) return res.status(400).json({ error: "Pick a teacher." });
      const date = isoDate(b.date);
      if (!date) return res.status(400).json({ error: "Pick a valid date." });
      const title = String(b.title || "").trim().slice(0, 120) || "Class";
      const className = String(b.className || "").trim().slice(0, 120) || null;
      const subject = String(b.subject || "").trim().slice(0, 80) || null;
      const time = String(b.time || "").trim().slice(0, 20) || null;
      const endTime = String(b.endTime || "").trim().slice(0, 20) || null;
      const location = String(b.location || "").trim().slice(0, 160) || null;
      const notes = String(b.notes || "").trim().slice(0, 600) || null;
      const color = COLORS.includes(b.color) ? b.color : COLORS[Math.floor(Math.random() * COLORS.length)];

      const tp = await profile(teacherUid);
      const teacherName = tp.name || (tp.email ? tp.email.split("@")[0] : "Teacher");

      // The teacher's roster is the set of children this class is assigned to.
      const roster = await db().collection("teacherStudents").doc(teacherUid).collection("roster").get();
      const studentCount = roster.docs.length;

      const ref = db().collection("calendarEvents").doc();
      const ev = {
        teacherUid, teacherName, title, className, subject, date, time, endTime,
        location, notes, color, studentCount,
        createdBy: req.user.uid, createdAt: stamp(),
      };
      await ref.set(ev);

      // Fan out to the teacher's roster so each of their students sees it.
      let fan = 0;
      for (let i = 0; i < roster.docs.length; i += 400) {
        const batch = db().batch();
        roster.docs.slice(i, i + 400).forEach((d) => {
          batch.set(
            db().collection("studentCalendar").doc(d.id).collection("items").doc(ref.id),
            { ...ev, eventId: ref.id },
            { merge: true },
          );
          fan++;
        });
        await batch.commit();
      }
      res.json({ ok: true, event: publicEvent({ id: ref.id, ...ev }), students: fan });
    } catch (e) {
      console.error("[/api/calendar/pin]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── DELETE /:id — admin unpins an event everywhere ────────────────
  router.delete("/:id", authenticate, async (req, res) => {
    try {
      if (!(await isAdmin(req))) return res.status(403).json({ error: "Admin access only." });
      const id = String(req.params.id);
      const ref = db().collection("calendarEvents").doc(id);
      const snap = await ref.get();
      if (snap.exists) {
        const teacherUid = snap.data().teacherUid;
        if (teacherUid) {
          const roster = await db().collection("teacherStudents").doc(teacherUid).collection("roster").get();
          for (let i = 0; i < roster.docs.length; i += 400) {
            const batch = db().batch();
            roster.docs.slice(i, i + 400).forEach((d) =>
              batch.delete(db().collection("studentCalendar").doc(d.id).collection("items").doc(id)));
            await batch.commit();
          }
        }
        await ref.delete();
      }
      res.json({ ok: true });
    } catch (e) {
      console.error("[/api/calendar/:id DELETE]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
