/**
 * Workbook print passes — see lib/workbook-prints.js for what a pass is.
 *
 *   POST /api/workbooks/pass      { workbook, key }            may I print this?
 *   POST /api/workbooks/checkout  { workbook, key, summary }   open a ₦5,000 order
 *   POST /api/workbooks/verify    { reference }                after the popup
 *
 * All three need a signed-in user. The admin may always print, and is told so
 * by /pass without an order. Paystack's webhook reaches the same grant through
 * routes/payments.js, which hands print charges over rather than treating
 * them as a subscription.
 */

const express = require("express");
const { authenticate } = require("../middleware/auth");
const P = require("../lib/workbook-prints");

module.exports = function () {
  const router = express.Router();
  const isAdmin = (req) => !!req.user && !!req.user.email && req.user.email === process.env.ADMIN_EMAIL;

  function checkBody(req, res) {
    const { workbook, key } = req.body || {};
    if (!P.validWorkbook(workbook)) { res.status(400).json({ error: "Unknown workbook." }); return null; }
    if (!P.validKey(key)) { res.status(400).json({ error: "Bad workbook key." }); return null; }
    return { workbook, key };
  }

  router.post("/pass", authenticate, async (req, res) => {
    try {
      const b = checkBody(req, res);
      if (!b) return;
      if (isAdmin(req)) {
        return res.json({ ok: true, paid: true, admin: true, buyer: "Prep Portal", order: "ADMIN" });
      }
      const pass = await P.findPass(req.user.uid, b.workbook, b.key);
      if (pass) return res.json({ ok: true, paid: true, ...pass });
      res.json({ ok: true, paid: false, price: P.PRICE_KOBO / 100 });
    } catch (e) {
      console.error("[/api/workbooks/pass]", e.message);
      res.status(500).json({ error: "Could not check the print pass." });
    }
  });

  router.post("/checkout", authenticate, async (req, res) => {
    try {
      const b = checkBody(req, res);
      if (!b) return;
      if (isAdmin(req)) return res.status(400).json({ error: "The admin prints free." });
      if (await P.findPass(req.user.uid, b.workbook, b.key)) {
        return res.status(409).json({ error: "This workbook is already paid for." });
      }
      const order = await P.openOrder({
        uid: req.user.uid, email: req.user.email, workbook: b.workbook, key: b.key,
        summary: req.body.summary,
      });
      res.json({ ok: true, ...order, email: req.user.email, kind: P.KIND, label: P.WORKBOOKS[b.workbook] });
    } catch (e) {
      console.error("[/api/workbooks/checkout]", e.message);
      res.status(500).json({ error: "Could not open the order." });
    }
  });

  router.post("/verify", authenticate, async (req, res) => {
    try {
      const reference = req.body && req.body.reference;
      if (!reference || typeof reference !== "string") return res.status(400).json({ error: "reference required" });
      const tx = await P.paystackVerify(reference);
      if (!tx) return res.status(400).json({ ok: false, error: "Payment not found." });
      const out = await P.applyPrintCharge(tx, req.user.uid);
      if (!out.ok) return res.status(400).json(out);
      res.json(out);
    } catch (e) {
      console.error("[/api/workbooks/verify]", e.message);
      res.status(500).json({ error: "Could not confirm the payment." });
    }
  });

  /* ══ ASSIGNMENTS ═══════════════════════════════════════════════════════
     A subscribed teacher hands one exact workbook to their class. It is
     saved (the options that build it, not the pages), given a short code,
     and put in the "assigned to me" list of every student already in their
     class. The link /wb/<code> opens it on screen, marked, for FREE — a
     student needs an account, not a subscription — and every "Check my
     answers" sends the score back here for the teacher to see.

       GET  /api/workbooks/teacher            may this user assign?
       POST /api/workbooks/assign             { workbook, options, title }
       GET  /api/workbooks/assigned           the teacher's assignments
       GET  /api/workbooks/a/:code            the assignment, to play
       POST /api/workbooks/a/:code/result     { right, total }
       GET  /api/workbooks/a/:code/results    the teacher's view of scores

     Scores are worked out in the browser, from the same keys that mark the
     page; a determined student could send a made-up score. It is practice
     feedback for a teacher, not an exam, and it says so on the results. */

  const admin = require("firebase-admin");
  const access = require("../lib/access");
  const db = () => admin.firestore();
  const stamp = () => admin.firestore.FieldValue.serverTimestamp();
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  async function profile(uid) {
    try { const s = await db().collection("users").doc(uid).get(); return s.exists ? s.data() : {}; }
    catch (_) { return {}; }
  }
  const nameOf = (req, p) => p.name || p.displayName || (req.user.email ? req.user.email.split("@")[0] : "Student");

  /* Teacher (by role) AND subscribed (the classroom feature, premium by
     default — the same test the rest of the classroom uses). */
  async function eligibility(req) {
    const p = await profile(req.user.uid);
    const teacher = isAdmin(req) || ["teacher", "admin"].includes(p.role);
    if (!teacher) return { teacher: false, eligible: false, reason: "Only teachers can assign workbooks.", p };
    if (isAdmin(req)) return { teacher: true, eligible: true, p };
    const v = await access.canUse(req, "classroom");
    return v.allowed
      ? { teacher: true, eligible: true, p }
      : { teacher: true, eligible: false, reason: "Assigning workbooks needs a subscription.", p };
  }

  /* Only the options that BUILD the paper, each checked — they come from the
     browser, are stored, and are handed to every student who opens the link. */
  function cleanOptions(o) {
    if (!o || typeof o !== "object") return null;
    const chosen = Array.isArray(o.chosen) ? o.chosen.slice(0, 80)
      .filter((c) => c && typeof c.id === "string" && /^[a-z0-9-]{1,40}$/.test(c.id))
      .map((c) => ({ id: c.id, count: Math.max(1, Math.min(40, Math.round(Number(c.count) || 1))) })) : [];
    if (!chosen.length) return null;
    const out = { chosen, seed: Number(o.seed) >>> 0 };
    if (typeof o.code === "string" && /^[A-Z2-9]{1,8}$/.test(o.code)) out.code = o.code;
    for (const k of ["level", "help"]) if (typeof o[k] === "string" && /^[a-z]{1,16}$/.test(o[k])) out[k] = o[k];
    if (Number.isInteger(o.base) && o.base >= 2 && o.base <= 10) out.base = o.base;
    if (Number.isInteger(o.places) && o.places >= 1 && o.places <= 9) out.places = o.places;
    if (typeof o.zeros === "number" && o.zeros >= 0 && o.zeros <= 1) out.zeros = o.zeros;
    if (typeof o.blocksKey === "boolean") out.blocksKey = o.blocksKey;
    return out;
  }

  router.get("/teacher", authenticate, async (req, res) => {
    try {
      const e = await eligibility(req);
      res.json({ ok: true, teacher: e.teacher, eligible: e.eligible, reason: e.reason || null });
    } catch (err) {
      console.error("[/api/workbooks/teacher]", err.message);
      res.status(500).json({ error: "Could not check." });
    }
  });

  router.post("/assign", authenticate, async (req, res) => {
    try {
      const e = await eligibility(req);
      if (!e.eligible) return res.status(e.teacher ? 402 : 403).json({ error: e.reason });
      const b = req.body || {};
      if (!P.validWorkbook(b.workbook)) return res.status(400).json({ error: "Unknown workbook." });
      const options = cleanOptions(b.options);
      if (!options) return res.status(400).json({ error: "Tick at least one exercise first." });
      const title = String(b.title || P.WORKBOOKS[b.workbook]).trim().slice(0, 80) || P.WORKBOOKS[b.workbook];
      const teacherName = nameOf(req, e.p);

      let code = null;
      for (let i = 0; i < 8 && !code; i++) {
        let c = "";
        for (let k = 0; k < 6; k++) c += ALPHA[require("crypto").randomInt(ALPHA.length)];
        if (!(await db().collection("workbookAssignments").doc(c).get()).exists) code = c;
      }
      if (!code) return res.status(500).json({ error: "Could not make a code — try again." });

      await db().collection("workbookAssignments").doc(code).set({
        code, workbook: b.workbook, options, title,
        teacherUid: req.user.uid, teacherName,
        createdAt: stamp(), students: 0,
      });

      /* straight into the list of everyone already in the class */
      const roster = await db().collection("teacherStudents").doc(req.user.uid).collection("roster").get();
      const batch = db().batch();
      roster.docs.forEach((d) => {
        batch.set(db().collection("studentAssignments").doc(d.id).collection("items").doc(`wb_${code}`), {
          kind: "workbook", workbookUrl: `/wb/${code}`, activityTitle: title,
          subject: P.WORKBOOKS[b.workbook], teacherUid: req.user.uid, teacherName,
          assignedByUid: req.user.uid, status: "assigned", assignedAt: stamp(),
        }, { merge: true });
      });
      if (roster.size) await batch.commit();
      res.json({ ok: true, code, url: `/wb/${code}`, sent: roster.size });
    } catch (err) {
      console.error("[/api/workbooks/assign]", err.message);
      res.status(500).json({ error: "Could not assign it." });
    }
  });

  router.get("/assigned", authenticate, async (req, res) => {
    try {
      const snap = await db().collection("workbookAssignments").where("teacherUid", "==", req.user.uid).limit(100).get();
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
      const list = snap.docs.map((d) => {
        const a = d.data();
        return { code: a.code, title: a.title, workbook: a.workbook, students: a.students || 0, createdAt: ms(a.createdAt) };
      }).sort((x, y) => y.createdAt - x.createdAt);
      res.json({ ok: true, assignments: list });
    } catch (err) {
      console.error("[/api/workbooks/assigned]", err.message);
      res.status(500).json({ error: "Could not list assignments." });
    }
  });

  const codeOk = (c) => /^[A-Z2-9]{6}$/.test(String(c || ""));

  router.get("/a/:code", authenticate, async (req, res) => {
    try {
      const code = String(req.params.code || "").toUpperCase();
      if (!codeOk(code)) return res.status(404).json({ error: "That link isn't right." });
      const snap = await db().collection("workbookAssignments").doc(code).get();
      if (!snap.exists) return res.status(404).json({ error: "That assignment doesn't exist any more." });
      const a = snap.data();
      const owner = a.teacherUid === req.user.uid || isAdmin(req);

      /* Opening the link puts a student in the teacher's class (so their
         scores have a name in it) and on their own "assigned to me" list. */
      if (!owner) {
        const p = await profile(req.user.uid);
        const rosterRef = db().collection("teacherStudents").doc(a.teacherUid).collection("roster").doc(req.user.uid);
        if (!(await rosterRef.get()).exists) {
          await rosterRef.set({ name: nameOf(req, p), email: req.user.email || null, joinedAt: stamp(), source: "workbook-link" });
        }
        await db().collection("studentAssignments").doc(req.user.uid).collection("items").doc(`wb_${code}`).set({
          kind: "workbook", workbookUrl: `/wb/${code}`, activityTitle: a.title,
          subject: P.WORKBOOKS[a.workbook] || "Workbook", teacherUid: a.teacherUid, teacherName: a.teacherName,
          assignedByUid: a.teacherUid, openedAt: stamp(),
        }, { merge: true });
      }
      res.json({
        ok: true, code, workbook: a.workbook, options: a.options, title: a.title,
        teacherName: a.teacherName, owner,
      });
    } catch (err) {
      console.error("[/api/workbooks/a]", err.message);
      res.status(500).json({ error: "Could not open the assignment." });
    }
  });

  router.post("/a/:code/result", authenticate, async (req, res) => {
    try {
      const code = String(req.params.code || "").toUpperCase();
      if (!codeOk(code)) return res.status(404).json({ error: "No such assignment." });
      const right = Math.round(Number(req.body && req.body.right));
      const total = Math.round(Number(req.body && req.body.total));
      if (!Number.isFinite(right) || !Number.isFinite(total) || total < 1 || total > 5000 || right < 0 || right > total) {
        return res.status(400).json({ error: "Bad score." });
      }
      const aRef = db().collection("workbookAssignments").doc(code);
      const rRef = aRef.collection("results").doc(req.user.uid);
      const p = await profile(req.user.uid);
      const pct = Math.round((100 * right) / total);
      const out = await db().runTransaction(async (t) => {
        const [aSnap, rSnap] = [await t.get(aRef), await t.get(rRef)];
        if (!aSnap.exists) return null;
        const prev = rSnap.exists ? rSnap.data() : null;
        const best = Math.max(pct, prev ? prev.bestPct || 0 : 0);
        t.set(rRef, {
          uid: req.user.uid, name: nameOf(req, p), email: req.user.email || null,
          lastRight: right, lastTotal: total, lastPct: pct, bestPct: best,
          attempts: (prev ? prev.attempts || 0 : 0) + 1,
          firstAt: prev ? prev.firstAt : stamp(), lastAt: stamp(),
        }, { merge: true });
        if (!prev) t.set(aRef, { students: admin.firestore.FieldValue.increment(1) }, { merge: true });
        return { best, teacherUid: aSnap.data().teacherUid };
      });
      if (!out) return res.status(404).json({ error: "No such assignment." });
      await db().collection("studentAssignments").doc(req.user.uid).collection("items").doc(`wb_${code}`)
        .set({ status: "done", lastPct: pct, bestPct: out.best, updatedAt: stamp() }, { merge: true });
      res.json({ ok: true, pct, bestPct: out.best });
    } catch (err) {
      console.error("[/api/workbooks/a/result]", err.message);
      res.status(500).json({ error: "Could not save the score." });
    }
  });

  router.get("/a/:code/results", authenticate, async (req, res) => {
    try {
      const code = String(req.params.code || "").toUpperCase();
      if (!codeOk(code)) return res.status(404).json({ error: "No such assignment." });
      const aSnap = await db().collection("workbookAssignments").doc(code).get();
      if (!aSnap.exists) return res.status(404).json({ error: "No such assignment." });
      const a = aSnap.data();
      if (a.teacherUid !== req.user.uid && !isAdmin(req)) return res.status(403).json({ error: "Only the teacher who set it can see the scores." });
      const rs = await aSnap.ref.collection("results").get();
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
      const results = rs.docs.map((d) => {
        const r = d.data();
        return {
          name: r.name, email: r.email, lastPct: r.lastPct, lastRight: r.lastRight, lastTotal: r.lastTotal,
          bestPct: r.bestPct, attempts: r.attempts, lastAt: ms(r.lastAt),
        };
      }).sort((x, y) => (x.name || "").localeCompare(y.name || ""));
      /* who opened it but has not checked yet: the class roster, less those */
      const roster = await db().collection("teacherStudents").doc(a.teacherUid).collection("roster").get();
      const done = new Set(rs.docs.map((d) => d.id));
      const waiting = roster.docs.filter((d) => !done.has(d.id)).map((d) => d.data().name || "Student");
      res.json({ ok: true, title: a.title, workbook: a.workbook, results, waiting });
    } catch (err) {
      console.error("[/api/workbooks/a/results]", err.message);
      res.status(500).json({ error: "Could not load the scores." });
    }
  });

  return router;
};
