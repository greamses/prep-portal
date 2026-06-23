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
    date: e.date,
    time: e.time || null,
    color: e.color || null,
    teacherUid: e.teacherUid || null,
    teacherName: e.teacherName || null,
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
      const time = String(b.time || "").trim().slice(0, 20) || null;
      const color = COLORS.includes(b.color) ? b.color : COLORS[Math.floor(Math.random() * COLORS.length)];

      const tp = await profile(teacherUid);
      const teacherName = tp.name || (tp.email ? tp.email.split("@")[0] : "Teacher");

      const ref = db().collection("calendarEvents").doc();
      const ev = {
        teacherUid, teacherName, title, className, date, time, color,
        createdBy: req.user.uid, createdAt: stamp(),
      };
      await ref.set(ev);

      // Fan out to the teacher's roster so each of their students sees it.
      const roster = await db().collection("teacherStudents").doc(teacherUid).collection("roster").get();
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
