/**
 * Chemistry Bench practicals, set for a class.
 *
 * A subscribed teacher hands their class one practical for PrepBot to teach.
 * It is one of three things, and may be more than one at once:
 *   - a PRACTICAL from the bench's own list (its steps tick as they are done);
 *   - a DEMONSTRATION PrepBot gives first, which the student then repeats;
 *   - the teacher's OWN BENCH, exactly as they arranged it, with their own
 *     instructions (for an experiment that is in no list).
 * It is given a short code, and the link /virtual-lab/chemistry-2d/?a=<code>
 * opens it for FREE: a student needs an account, not a subscription, and
 * PrepBot teaches the assigned practical whether or not the student is premium.
 *
 *   GET  /api/bench/teacher            may this user assign?
 *   POST /api/bench/assign             { title, practical, demo, note, bench }
 *   GET  /api/bench/assigned           the teacher's assignments, each with who has done it
 *   GET  /api/bench/a/:code            the assignment, to do
 *   POST /api/bench/a/:code/result     { done, total, notes }
 *
 * A teacher's OWN experiments are kept as well, whether or not they are set for
 * anyone: built on the bench with its own pieces, given steps, and saved to be
 * opened again, changed, or set for a class later.
 *
 *   POST   /api/bench/saved            { title, note, steps, bench, id? }   save (or save over)
 *   GET    /api/bench/saved            the teacher's saved experiments
 *   GET    /api/bench/saved/:id        one of them, to put back on the bench
 *   DELETE /api/bench/saved/:id
 *
 * The same shape as a workbook assignment (routes/workbooks.js), and it uses
 * the same class roster, the same "assigned to me" list and the same teacher
 * notices, so a practical turns up on both dashboards with everything else.
 *
 * What a student sends back is worked out in their browser (which steps were
 * ticked, and what they wrote in their notebook). It is feedback for a teacher,
 * not an examination.
 */

const express = require("express");
const crypto = require("crypto");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");
const access = require("../lib/access");

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SUBJECT = "Chemistry Bench";
const urlOf = (code) => `/virtual-lab/chemistry-2d/?a=${code}`;

/* A saved bench comes from one browser and is opened in many: it is kept only
   if it is plain data of a modest size with nothing in it that could be markup.
   (The bench draws some of these values into its own SVG.) */
function cleanBench(b) {
  if (!b || typeof b !== "object" || !Array.isArray(b.items)) return null;
  if (!b.items.length || b.items.length > 80) return null;
  let text;
  try { text = JSON.stringify({ items: b.items }); } catch (_) { return null; }
  if (text.length > 90000 || /[<>&`]|javascript:|\\u003c/i.test(text)) return null;
  const okKey = (k) => /^[A-Za-z0-9_]{1,24}$/.test(k);
  const walk = (v, depth) => {
    if (v === null || typeof v === "number" || typeof v === "boolean") return Number.isFinite(v) || typeof v !== "number";
    if (typeof v === "string") return v.length <= 200;
    if (depth > 7 || typeof v !== "object") return false;
    if (Array.isArray(v)) return v.length <= 200 && v.every((x) => walk(x, depth + 1));
    return Object.keys(v).length <= 60 && Object.entries(v).every(([k, x]) => okKey(k) && walk(x, depth + 1));
  };
  const parsed = JSON.parse(text);
  if (!walk(parsed, 0)) return null;
  if (!parsed.items.every((it) => it && typeof it.id === "string" && typeof it.kind === "string" && typeof it.key === "string")) return null;
  return parsed;
}

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();
  const stamp = () => admin.firestore.FieldValue.serverTimestamp();
  const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
  const isAdmin = (req) => !!req.user && !!req.user.email && req.user.email === process.env.ADMIN_EMAIL;
  const idOk = (s) => typeof s === "string" && /^[a-z0-9-]{1,40}$/.test(s);
  const codeOk = (c) => /^[A-Z2-9]{6}$/.test(String(c || ""));

  async function profile(uid) {
    try { const s = await db().collection("users").doc(uid).get(); return s.exists ? s.data() : {}; }
    catch (_) { return {}; }
  }
  const nameOf = (req, p) => p.name || p.displayName || (req.user.email ? req.user.email.split("@")[0] : "Student");

  /* Teacher (by role) AND subscribed: the same test as the rest of the classroom. */
  async function eligibility(req) {
    const p = await profile(req.user.uid);
    const teacher = isAdmin(req) || ["teacher", "admin"].includes(p.role);
    if (!teacher) return { teacher: false, eligible: false, reason: "Only teachers can set practicals for a class.", p };
    if (isAdmin(req)) return { teacher: true, eligible: true, p };
    const v = await access.canUse(req, "classroom");
    return v.allowed
      ? { teacher: true, eligible: true, p }
      : { teacher: true, eligible: false, reason: "Setting practicals for a class needs a subscription.", p };
  }

  router.get("/teacher", authenticate, async (req, res) => {
    try {
      const e = await eligibility(req);
      res.json({ ok: true, teacher: e.teacher, eligible: e.eligible, reason: e.reason || null });
    } catch (err) {
      console.error("[/api/bench/teacher]", err.message);
      res.status(500).json({ error: "Could not check." });
    }
  });

  router.post("/assign", authenticate, async (req, res) => {
    try {
      const e = await eligibility(req);
      if (!e.eligible) return res.status(e.teacher ? 402 : 403).json({ error: e.reason });
      const b = req.body || {};
      const practical = idOk(b.practical) ? b.practical : null;
      const demo = idOk(b.demo) ? b.demo : null;
      const bench = b.bench ? cleanBench(b.bench) : null;
      if (b.bench && !bench) return res.status(400).json({ error: "That bench could not be saved. Clear anything unusual off it and try again." });
      if (!practical && !demo && !bench) return res.status(400).json({ error: "Choose a practical, a demonstration, or set the bench out first." });
      const title = String(b.title || "").replace(/[<>&`]/g, "").trim().slice(0, 80);
      if (!title) return res.status(400).json({ error: "Give it a title." });
      const note = String(b.note || "").replace(/[<>&`]/g, "").trim().slice(0, 800);
      const steps = Array.isArray(b.steps) ? b.steps.slice(0, 12).map((s) => String(s || "").replace(/[<>&`]/g, "").trim().slice(0, 200)).filter(Boolean) : [];
      const teacherName = nameOf(req, e.p);

      let code = null;
      for (let i = 0; i < 8 && !code; i++) {
        let c = "";
        for (let k = 0; k < 6; k++) c += ALPHA[crypto.randomInt(ALPHA.length)];
        if (!(await db().collection("benchAssignments").doc(c).get()).exists) code = c;
      }
      if (!code) return res.status(500).json({ error: "Could not make a code. Try again." });

      await db().collection("benchAssignments").doc(code).set({
        code, title, note, steps, practical, demo, bench,
        teacherUid: req.user.uid, teacherName, createdAt: stamp(), students: 0,
      });

      /* straight into the list of everyone already in the class */
      const roster = await db().collection("teacherStudents").doc(req.user.uid).collection("roster").get();
      const batch = db().batch();
      roster.docs.forEach((d) => {
        batch.set(db().collection("studentAssignments").doc(d.id).collection("items").doc(`bench_${code}`), {
          kind: "workbook", workbookUrl: urlOf(code), activityTitle: title, subject: SUBJECT,
          teacherUid: req.user.uid, teacherName, assignedByUid: req.user.uid, status: "assigned", assignedAt: stamp(),
        }, { merge: true });
      });
      if (roster.size) await batch.commit();
      res.json({ ok: true, code, url: urlOf(code), sent: roster.size });
    } catch (err) {
      console.error("[/api/bench/assign]", err.message);
      res.status(500).json({ error: "Could not set it." });
    }
  });

  /* The teacher's own list, each with the students who have done it and those who have not. */
  router.get("/assigned", authenticate, async (req, res) => {
    try {
      const snap = await db().collection("benchAssignments").where("teacherUid", "==", req.user.uid).limit(60).get();
      const roster = await db().collection("teacherStudents").doc(req.user.uid).collection("roster").get();
      const names = new Map(roster.docs.map((d) => [d.id, d.data().name || "Student"]));
      const rows = await Promise.all(snap.docs.map(async (d) => {
        const a = d.data();
        const rs = await d.ref.collection("results").get();
        const results = rs.docs.map((x) => {
          const r = x.data();
          return { name: r.name || names.get(x.id) || "Student", done: r.done || 0, total: r.total || 0, pct: r.pct || 0, attempts: r.attempts || 1, notes: r.notes || "", lastAt: ms(r.lastAt) };
        }).sort((x, y) => y.lastAt - x.lastAt);
        const did = new Set(rs.docs.map((x) => x.id));
        return {
          code: a.code, title: a.title, practical: a.practical, demo: a.demo, own: Boolean(a.bench), url: urlOf(a.code), createdAt: ms(a.createdAt),
          results, waiting: [...names.entries()].filter(([uid]) => !did.has(uid)).map(([, n]) => n),
        };
      }));
      rows.sort((x, y) => y.createdAt - x.createdAt);
      res.json({ ok: true, assignments: rows, students: names.size });
    } catch (err) {
      console.error("[/api/bench/assigned]", err.message);
      res.status(500).json({ error: "Could not list them." });
    }
  });

  // ── a teacher's own experiments, kept ──
  const text = (v, max) => String(v || "").replace(/[<>&`]/g, "").trim().slice(0, max);
  const savedId = (s) => typeof s === "string" && /^[A-Za-z0-9]{6,40}$/.test(s);
  router.post("/saved", authenticate, async (req, res) => {
    try {
      const e = await eligibility(req);
      if (!e.teacher) return res.status(403).json({ error: "Only teachers can save experiments." });
      const b = req.body || {};
      const bench = cleanBench(b.bench);
      if (!bench) return res.status(400).json({ error: "Set the bench out first: there is nothing on it to save, or something on it could not be saved." });
      const title = text(b.title, 80);
      if (!title) return res.status(400).json({ error: "Give it a title." });
      const steps = Array.isArray(b.steps) ? b.steps.slice(0, 12).map((s) => text(s, 200)).filter(Boolean) : [];
      const col = db().collection("benchExperiments");
      let ref;
      if (savedId(b.id)) {
        ref = col.doc(b.id);
        const was = await ref.get();
        if (!was.exists || was.data().teacherUid !== req.user.uid) return res.status(404).json({ error: "That saved experiment is not yours to change." });
      } else {
        const mine = await col.where("teacherUid", "==", req.user.uid).limit(81).get();
        if (mine.size > 80) return res.status(400).json({ error: "You have 80 saved experiments. Delete one you no longer use." });
        ref = col.doc();
      }
      await ref.set({ title, note: text(b.note, 800), steps, bench, teacherUid: req.user.uid, updatedAt: stamp() }, { merge: true });
      res.json({ ok: true, id: ref.id });
    } catch (err) {
      console.error("[/api/bench/saved]", err.message);
      res.status(500).json({ error: "Could not save it." });
    }
  });
  router.get("/saved", authenticate, async (req, res) => {
    try {
      const snap = await db().collection("benchExperiments").where("teacherUid", "==", req.user.uid).limit(80).get();
      const list = snap.docs.map((d) => { const x = d.data(); return { id: d.id, title: x.title, steps: (x.steps || []).length, pieces: x.bench && x.bench.items ? x.bench.items.length : 0, updatedAt: ms(x.updatedAt) }; })
        .sort((x, y) => y.updatedAt - x.updatedAt);
      res.json({ ok: true, saved: list });
    } catch (err) {
      console.error("[/api/bench/saved list]", err.message);
      res.status(500).json({ error: "Could not list them." });
    }
  });
  router.get("/saved/:id", authenticate, async (req, res) => {
    try {
      if (!savedId(req.params.id)) return res.status(404).json({ error: "No such experiment." });
      const snap = await db().collection("benchExperiments").doc(req.params.id).get();
      if (!snap.exists || (snap.data().teacherUid !== req.user.uid && !isAdmin(req))) return res.status(404).json({ error: "No such experiment." });
      const x = snap.data();
      res.json({ ok: true, id: snap.id, title: x.title, note: x.note || "", steps: x.steps || [], bench: x.bench });
    } catch (err) {
      console.error("[/api/bench/saved get]", err.message);
      res.status(500).json({ error: "Could not open it." });
    }
  });
  router.delete("/saved/:id", authenticate, async (req, res) => {
    try {
      if (!savedId(req.params.id)) return res.status(404).json({ error: "No such experiment." });
      const ref = db().collection("benchExperiments").doc(req.params.id);
      const snap = await ref.get();
      if (!snap.exists || snap.data().teacherUid !== req.user.uid) return res.status(404).json({ error: "No such experiment." });
      await ref.delete();
      res.json({ ok: true });
    } catch (err) {
      console.error("[/api/bench/saved delete]", err.message);
      res.status(500).json({ error: "Could not delete it." });
    }
  });

  router.get("/a/:code", authenticate, async (req, res) => {
    try {
      const code = String(req.params.code || "").toUpperCase();
      if (!codeOk(code)) return res.status(404).json({ error: "That link is not right." });
      const snap = await db().collection("benchAssignments").doc(code).get();
      if (!snap.exists) return res.status(404).json({ error: "That practical is not set any more." });
      const a = snap.data();
      const owner = a.teacherUid === req.user.uid || isAdmin(req);
      /* Opening the link puts a student in the teacher's class and on their own "assigned to me" list. */
      if (!owner) {
        const p = await profile(req.user.uid);
        const rosterRef = db().collection("teacherStudents").doc(a.teacherUid).collection("roster").doc(req.user.uid);
        if (!(await rosterRef.get()).exists) {
          await rosterRef.set({ name: nameOf(req, p), email: req.user.email || null, joinedAt: stamp(), source: "bench-link" });
        }
        await db().collection("studentAssignments").doc(req.user.uid).collection("items").doc(`bench_${code}`).set({
          kind: "workbook", workbookUrl: urlOf(code), activityTitle: a.title, subject: SUBJECT,
          teacherUid: a.teacherUid, teacherName: a.teacherName, assignedByUid: a.teacherUid, openedAt: stamp(),
        }, { merge: true });
      }
      res.json({
        ok: true, code, title: a.title, note: a.note || "", steps: a.steps || [], practical: a.practical || null, demo: a.demo || null,
        bench: a.bench || null, teacherName: a.teacherName, owner,
      });
    } catch (err) {
      console.error("[/api/bench/a]", err.message);
      res.status(500).json({ error: "Could not open the practical." });
    }
  });

  router.post("/a/:code/result", authenticate, async (req, res) => {
    try {
      const code = String(req.params.code || "").toUpperCase();
      if (!codeOk(code)) return res.status(404).json({ error: "No such practical." });
      const done = Math.round(Number(req.body && req.body.done));
      const total = Math.round(Number(req.body && req.body.total));
      if (!Number.isFinite(done) || !Number.isFinite(total) || total < 1 || total > 40 || done < 0 || done > total) return res.status(400).json({ error: "Bad result." });
      const notes = String((req.body && req.body.notes) || "").replace(/[<>&`]/g, "").slice(0, 2400);
      const aRef = db().collection("benchAssignments").doc(code);
      const rRef = aRef.collection("results").doc(req.user.uid);
      const p = await profile(req.user.uid);
      const pct = Math.round((100 * done) / total);
      const out = await db().runTransaction(async (t) => {
        const [aSnap, rSnap] = [await t.get(aRef), await t.get(rRef)];
        if (!aSnap.exists) return null;
        const prev = rSnap.exists ? rSnap.data() : null;
        const best = Math.max(pct, prev ? prev.bestPct || 0 : 0);
        const attempts = (prev ? prev.attempts || 0 : 0) + 1;
        t.set(rRef, {
          uid: req.user.uid, name: nameOf(req, p), email: req.user.email || null,
          done, total, pct, bestPct: best, notes, attempts,
          firstAt: prev ? prev.firstAt : stamp(), lastAt: stamp(),
        }, { merge: true });
        if (!prev) t.set(aRef, { students: admin.firestore.FieldValue.increment(1) }, { merge: true });
        return { best, attempts, teacherUid: aSnap.data().teacherUid, title: aSnap.data().title };
      });
      if (!out) return res.status(404).json({ error: "No such practical." });
      await db().collection("studentAssignments").doc(req.user.uid).collection("items").doc(`bench_${code}`)
        .set({ status: "done", lastPct: pct, bestPct: out.best, updatedAt: stamp() }, { merge: true });
      /* one notice per student per practical, rewritten each time: where that student stands now */
      try {
        await db().collection("teacherNotices").doc(out.teacherUid).collection("items").doc(`bench_${code}_${req.user.uid}`).set({
          kind: "workbook", code, title: `Practical: ${out.title || "Chemistry Bench"}`,
          uid: req.user.uid, name: nameOf(req, p), right: done, total, pct, bestPct: out.best, attempts: out.attempts,
          at: stamp(), seen: false,
        }, { merge: true });
      } catch (e) { console.error("[bench notice]", e.message); }
      res.json({ ok: true, pct, bestPct: out.best });
    } catch (err) {
      console.error("[/api/bench/a/result]", err.message);
      res.status(500).json({ error: "Could not hand it in." });
    }
  });

  return router;
};

module.exports.cleanBench = cleanBench;
