/**
 * Printing a workbook, and setting one for a class.
 *
 *   POST /api/workbooks/pass   { workbook }   may I print this?
 *
 * Printing is part of the subscription — it is no longer sold per workbook, so
 * there is no checkout and no order to verify here any more. The admin always
 * prints. The answer does not depend on what is on the paper, which is why the
 * content fingerprint the old pass was keyed by is gone from this route.
 */

const express = require("express");
const { authenticate } = require("../middleware/auth");
const P = require("../lib/workbook-prints");
const access = require("../lib/access");
const { notifyStudents } = require("../lib/notices");
const { saveQuestions } = require("../lib/question-bank");

module.exports = function () {
  const router = express.Router();
  const isAdmin = (req) => !!req.user && !!req.user.email && req.user.email === process.env.ADMIN_EMAIL;

  router.post("/pass", authenticate, async (req, res) => {
    try {
      const workbook = req.body && req.body.workbook;
      if (!P.validWorkbook(workbook)) return res.status(400).json({ error: "Unknown workbook." });
      if (isAdmin(req)) return res.json({ ok: true, allowed: true, admin: true, who: "Prep Portal" });

      const v = await access.canUse(req, P.FEATURE, workbook);
      if (!v.allowed) {
        return res.json({
          ok: true, allowed: false,
          reason: v.reason === "premium-required"
            ? "A subscription prints every workbook on the site, as often as you need — this one, the others, and the answer key with them."
            : "This workbook is not available to print at the moment.",
        });
      }
      res.json({ ok: true, allowed: true, who: await P.buyerName(req.user.uid, req.user.email) });
    } catch (e) {
      console.error("[/api/workbooks/pass]", e.message);
      res.status(500).json({ error: "Could not check your subscription." });
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
       GET  /api/workbooks/results            EVERY assignment's scores, at once
       GET  /api/workbooks/notices            what has come in since you looked
       POST /api/workbooks/notices/seen       you have looked

     The last three are for the dashboard: chasing one /wb/<code> link per
     assignment to find out whether anybody has done it is not a way to teach a
     class, so the whole lot arrives in one call and a hand-in leaves a notice
     behind that waits on the dashboard until it is read.

     Scores are worked out in the browser, from the same keys that mark the
     page; a determined student could send a made-up score. It is practice
     feedback for a teacher, not an exam, and it says so on the results. */

  const admin = require("firebase-admin");
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
      await notifyStudents(roster.docs.map((d) => d.id), { kind: "task", title, text: `${teacherName} set you a workbook.`, url: `/wb/${code}`, from: teacherName }, `task_workbook_${code}`);
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
        return {
          best, teacherUid: aSnap.data().teacherUid, title: aSnap.data().title,
          attempts: (prev ? prev.attempts || 0 : 0) + 1,
        };
      });
      if (!out) return res.status(404).json({ error: "No such assignment." });
      await db().collection("studentAssignments").doc(req.user.uid).collection("items").doc(`wb_${code}`)
        .set({ status: "done", lastPct: pct, bestPct: out.best, updatedAt: stamp() }, { merge: true });
      /* the teacher's notice. ONE per student per assignment — a child who
         checks their answers eight times as they work down the paper has not
         handed it in eight times, and eight notices would bury the one from
         the child who has only just started. It is rewritten each time, so
         what the teacher reads is where that child stands now. */
      try {
        await db().collection("teacherNotices").doc(out.teacherUid).collection("items").doc(`wb_${code}_${req.user.uid}`)
          .set({
            kind: "workbook", code, title: out.title || "Workbook",
            uid: req.user.uid, name: nameOf(req, p),
            right, total, pct, bestPct: out.best, attempts: out.attempts,
            at: stamp(), seen: false,
          }, { merge: true });
      } catch (e) { console.error("[workbook notice]", e.message); }
      await notifyStudents([req.user.uid], { kind: "result", title: out.title || "Workbook", text: `Your result went in: ${pct}% (best ${out.best}%).`, url: `/wb/${code}`, from: "Prep Portal" }, `result_workbook_${code}`);
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

  /* ── the whole lot, for the dashboard ─────────────────────────────────
     Every assignment this teacher has set, each with the scores under it and
     the names of the students in the class who have not sent one yet. One
     call: the dashboard has no business making twenty. */
  router.get("/results", authenticate, async (req, res) => {
    try {
      const snap = await db().collection("workbookAssignments")
        .where("teacherUid", "==", req.user.uid).limit(60).get();
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
      const roster = await db().collection("teacherStudents").doc(req.user.uid).collection("roster").get();
      const names = new Map(roster.docs.map((d) => [d.id, d.data().name || "Student"]));

      const rows = await Promise.all(snap.docs.map(async (d) => {
        const a = d.data();
        const rs = await d.ref.collection("results").get();
        const results = rs.docs.map((x) => {
          const r = x.data();
          return {
            uid: x.id, name: r.name || names.get(x.id) || "Student", email: r.email || null,
            lastRight: r.lastRight, lastTotal: r.lastTotal, lastPct: r.lastPct,
            bestPct: r.bestPct, attempts: r.attempts || 0, lastAt: ms(r.lastAt),
          };
        }).sort((x, y) => y.lastAt - x.lastAt);
        const done = new Set(rs.docs.map((x) => x.id));
        return {
          code: a.code, title: a.title, workbook: a.workbook,
          createdAt: ms(a.createdAt), url: `/wb/${a.code}`,
          results,
          waiting: [...names.entries()].filter(([uid]) => !done.has(uid)).map(([, n]) => n),
          lastAt: results.length ? results[0].lastAt : 0,
        };
      }));

      rows.sort((x, y) => (y.lastAt || y.createdAt) - (x.lastAt || x.createdAt));
      const scored = rows.reduce((n, r) => n + r.results.length, 0);
      res.json({ ok: true, assignments: rows, students: names.size, scored });
    } catch (err) {
      console.error("[/api/workbooks/results]", err.message);
      res.status(500).json({ error: "Could not load the scores." });
    }
  });

  /* ── what has come in ─────────────────────────────────────────────────
     A short list, newest first, with the unread ones counted. Read is a
     state, not a deletion: the teacher can still see last week's hand-ins. */
  router.get("/notices", authenticate, async (req, res) => {
    try {
      const snap = await db().collection("teacherNotices").doc(req.user.uid).collection("items")
        .limit(60).get();
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);
      const items = snap.docs.map((d) => {
        const n = d.data();
        return {
          id: d.id, kind: n.kind || "workbook", code: n.code, title: n.title,
          name: n.name, right: n.right, total: n.total, pct: n.pct, bestPct: n.bestPct,
          attempts: n.attempts || 1, at: ms(n.at), seen: !!n.seen,
        };
      }).sort((x, y) => y.at - x.at).slice(0, 40);
      res.json({ ok: true, notices: items, unseen: items.filter((x) => !x.seen).length });
    } catch (err) {
      console.error("[/api/workbooks/notices]", err.message);
      res.status(500).json({ error: "Could not load your notices." });
    }
  });

  router.post("/notices/seen", authenticate, async (req, res) => {
    try {
      const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.slice(0, 60) : null;
      const col = db().collection("teacherNotices").doc(req.user.uid).collection("items");
      const snap = ids ? null : await col.where("seen", "==", false).limit(60).get();
      const docs = ids ? ids.filter((x) => typeof x === "string" && x.length < 120).map((x) => col.doc(x))
        : snap.docs.map((d) => d.ref);
      if (!docs.length) return res.json({ ok: true, marked: 0 });
      const batch = db().batch();
      docs.forEach((ref) => batch.set(ref, { seen: true }, { merge: true }));
      await batch.commit();
      res.json({ ok: true, marked: docs.length });
    } catch (err) {
      console.error("[/api/workbooks/notices/seen]", err.message);
      res.status(500).json({ error: "Could not mark them read." });
    }
  });

  /* ══ SHARED PAPERS ═══════════════════════════════════════════════════════
     The Exam Maker's paper, kept so others can sit it for mock preparation.

       POST /api/workbooks/paper-share   { title, head, questions }   → { code, url }
       GET  /api/workbooks/paper/:code                                → the paper, to play

     Making a link is the Exam Maker's own gate (the same feature part, so the
     admin's switch and per-user grants apply); opening one needs an account and
     nothing else, like an assigned workbook. Everything stored comes from the
     browser and goes to every visitor, so each field is checked and clipped
     here; the page cleans it again before it draws. The answers travel with the
     paper (the learner's browser marks it), which is fine for practice and says
     so on the page. */

  const clip = (s, n) => String(s == null ? "" : s).slice(0, n);
  const TYPES = ["mcq", "fill", "sub", "theory"];
  const COLOURS = ["indigo", "teal", "crimson", "amber", "forest", "plum"];

  function cleanPaper(b) {
    if (!b || !Array.isArray(b.questions)) return null;
    const questions = b.questions.slice(0, 120).map((q, i) => {
      const type = TYPES.includes(q && q.type) ? q.type : "mcq";
      const out = {
        id: clip(q && q.id, 40).replace(/[^A-Za-z0-9_-]/g, "") || `q${i}`,
        type, text: clip(q && q.text, 3000),
        marks: Math.max(0, Math.min(100, Math.round(Number(q && q.marks)) || 0)),
        lines: Math.max(0, Math.min(40, Math.round(Number(q && q.lines)) || 0)),
        svg: typeof (q && q.svg) === "string" && /^\s*<svg[\s>]/i.test(q.svg) ? clip(q.svg, 30000) : "",
      };
      if (type === "mcq") {
        out.options = [0, 1, 2, 3].map((k) => clip(q && q.options && q.options[k], 400));
        out.answer = Math.max(0, Math.min(3, Math.round(Number(q && q.answer)) || 0));
      } else { out.options = []; out.answer = clip(q && q.answer, 3000); }
      return out;
    }).filter((q) => q.text.trim());
    if (!questions.length) return null;

    const h = (b.head && typeof b.head === "object") ? b.head : {};
    const head = {};
    for (const k of ["school", "term", "year", "subject", "date", "klass", "time"]) head[k] = clip(h[k], 120);
    head.logo = typeof h.logo === "string" && /^data:image\//.test(h.logo) && h.logo.length <= 200000 ? h.logo : "";
    head.colour = COLOURS.includes(h.colour) || (h.colour === "custom" && /^#[0-9a-f]{6}$/i.test(String(h.custom))) ? h.colour : "indigo";
    head.custom = head.colour === "custom" ? String(h.custom).toLowerCase() : "";
    head.paper = h.paper === "letter" ? "letter" : "a4";
    for (const k of ["tint", "clean", "omr", "theorySheet", "timer"]) head[k] = !!h[k];
    head.key = false;
    head.breakAt = {};
    for (const t of TYPES) if (h.breakAt && h.breakAt[t]) head.breakAt[t] = true;
    const tries = Math.round(Number(h.tries));
    head.tries = Number.isFinite(tries) ? Math.max(0, Math.min(20, tries)) : 1;
    head.attempt = {};
    for (const t of TYPES) head.attempt[t] = Math.max(0, Math.min(200, Math.round(Number(h.attempt && h.attempt[t])) || 0));
    head.marksEach = {};
    for (const t of TYPES) head.marksEach[t] = Math.max(0, Math.min(100, Math.round(Number(h.marksEach && h.marksEach[t])) || 0));
    const paper = { head, questions };
    return JSON.stringify(paper).length > 900000 ? "too-big" : paper;
  }

  router.post("/paper-share", authenticate, async (req, res) => {
    try {
      if (!isAdmin(req)) {
        const v = await access.canUse(req, "prep-math-activities", "exam-maker");
        if (!v.allowed) {
          return res.status(v.reason === "premium-required" ? 402 : 403).json({
            error: v.reason === "premium-required" ? "Sharing a paper needs a subscription." : "Sharing papers is not available at the moment.",
          });
        }
      }
      const paper = cleanPaper(req.body);
      if (paper === "too-big") return res.status(413).json({ error: "That paper is too big to share. Try a smaller logo or fewer diagrams." });
      if (!paper) return res.status(400).json({ error: "Write some questions first." });

      let code = null;
      for (let i = 0; i < 8 && !code; i++) {
        let c = "";
        for (let k = 0; k < 6; k++) c += ALPHA[require("crypto").randomInt(ALPHA.length)];
        if (!(await db().collection("sharedPapers").doc(c).get()).exists) code = c;
      }
      if (!code) return res.status(500).json({ error: "Could not make a code — try again." });
      const p = await profile(req.user.uid);
      await db().collection("sharedPapers").doc(code).set({
        code, ...paper, title: clip(req.body.title, 120) || "Exam paper",
        ownerUid: req.user.uid, ownerName: nameOf(req, p), createdAt: stamp(),
      });
      /* what was shared is kept in the sharer's bank too, so it can go on another paper */
      saveQuestions(req.user.uid, paper.questions, { subject: paper.head.subject });
      res.json({ ok: true, code, url: `/paper/${code}` });
    } catch (err) {
      console.error("[/api/workbooks/paper-share]", err.message);
      res.status(500).json({ error: "Could not make the link." });
    }
  });

  router.get("/paper/:code", authenticate, async (req, res) => {
    try {
      const code = String(req.params.code || "").toUpperCase();
      if (!codeOk(code)) return res.status(404).json({ error: "That link isn't right." });
      const snap = await db().collection("sharedPapers").doc(code).get();
      if (!snap.exists) return res.status(404).json({ error: "That paper doesn't exist any more." });
      const a = snap.data();
      /* how many tries this person has used already, so a returning student is not offered another */
      const mine = await snap.ref.collection("results").doc(req.user.uid).get();
      res.json({ ok: true, code, title: a.title, head: a.head, questions: a.questions, ownerName: a.ownerName, owner: a.ownerUid === req.user.uid,
        tries: a.head && a.head.tries != null ? a.head.tries : 1, used: mine.exists ? mine.data().attempts || 0 : 0 });
    } catch (err) {
      console.error("[/api/workbooks/paper]", err.message);
      res.status(500).json({ error: "Could not open the paper." });
    }
  });

  /* ══ CBT SHARE LINKS ═════════════════════════════════════════════════════
     Sharing a CBT paper from the picker. The plain link works for anyone, but a free learner who
     opens it is held to the free formats (multiple choice). A link made by someone who HAS written
     answers (Short Answer / Theory, premium by default) carries `k=<code>`: a stored pass for that
     one paper, so whoever opens it gets everything in it, the written questions, the paper mode and
     the tool rail, free.

       POST /api/workbooks/cbt-share        { axis, top, subject, topic, paper }  → { code }
       GET  /api/workbooks/cbt-share/:code                                       → { key }

     The code names one paper; the page compares that key with the paper in its own address, so a
     code from one paper opens nothing else. Making one needs the access it hands out (the admin,
     or the written-answers feature), so a free account cannot mint a pass. Opening needs an account
     only. The same limits as every client-side gate apply: it is practice, and the question bank is
     static, so this is a way in that is honest about who it is for, not a lock on the files. */

  const cbtKey = (b) => [b.axis === "exam" ? "exam" : "class", b.top, b.subject, b.topic, String(b.paper || 1)].join("|");
  const cbtOk = (b) => b && ["top", "subject", "topic"].every((k) => typeof b[k] === "string" && b[k].trim() && b[k].length <= 160);

  router.post("/cbt-share", authenticate, async (req, res) => {
    try {
      const b = req.body || {};
      if (!cbtOk(b)) return res.status(400).json({ error: "Choose a paper first." });
      if (!isAdmin(req)) {
        const [s, t] = await Promise.all([access.canUse(req, "cbt-written", "short"), access.canUse(req, "cbt-written", "theory")]);
        if (!(s.allowed || t.allowed)) {
          return res.status(402).json({ error: "A link that unlocks the paper needs a subscription. The plain link still works." });
        }
      }
      const key = cbtKey(b);
      /* one code per paper per person: pressing Share again hands back the same one */
      const had = await db().collection("cbtShares").where("ownerUid", "==", req.user.uid).where("key", "==", key).limit(1).get();
      if (!had.empty) return res.json({ ok: true, code: had.docs[0].id });
      let code = null;
      for (let i = 0; i < 8 && !code; i++) {
        let c = "";
        for (let k = 0; k < 6; k++) c += ALPHA[require("crypto").randomInt(ALPHA.length)];
        if (!(await db().collection("cbtShares").doc(c).get()).exists) code = c;
      }
      if (!code) return res.status(500).json({ error: "Could not make a code, try again." });
      await db().collection("cbtShares").doc(code).set({ code, key, ownerUid: req.user.uid, createdAt: stamp() });
      res.json({ ok: true, code });
    } catch (err) {
      console.error("[/api/workbooks/cbt-share]", err.message);
      res.status(500).json({ error: "Could not make the link." });
    }
  });

  router.get("/cbt-share/:code", authenticate, async (req, res) => {
    try {
      const code = String(req.params.code || "").toUpperCase();
      if (!codeOk(code)) return res.status(404).json({ error: "That link isn't right." });
      const snap = await db().collection("cbtShares").doc(code).get();
      if (!snap.exists) return res.status(404).json({ error: "That link doesn't exist any more." });
      res.json({ ok: true, key: snap.data().key });
    } catch (err) {
      console.error("[/api/workbooks/cbt-share/:code]", err.message);
      res.status(500).json({ error: "Could not check the link." });
    }
  });

  /* ══ SHARED-PAPER SCORES, AND THE WEEKLY COMPILER ═══════════════════════
     A learner who finishes a shared mock paper sends the score back under the name they typed on the
     paper, the way an assigned workbook does. The compiler then gathers every score the teacher has
     received, from workbook assignments and shared papers alike, into weeks.

       POST /api/workbooks/paper/:code/result   { name, won, outOf, first }
       GET  /api/workbooks/compile?weeks=4&start=YYYY-MM-DD

     A completed assignment counts in the week of its LAST attempt, at that attempt's score. Scores are
     worked out in the learner's browser (the same as every score here), so they are practice
     feedback for a teacher and say so. */

  const GRADES = [[70, "A"], [60, "B"], [50, "C"], [45, "D"], [40, "E"], [0, "F"]];
  const gradeOf = (pct) => (GRADES.find(([min]) => pct >= min) || GRADES[GRADES.length - 1])[1];

  router.post("/paper/:code/result", authenticate, async (req, res) => {
    try {
      const code = String(req.params.code || "").toUpperCase();
      if (!codeOk(code)) return res.status(404).json({ error: "No such paper." });
      const b = req.body || {};
      const won = Math.round(Number(b.won)), outOf = Math.round(Number(b.outOf));
      if (!Number.isFinite(won) || !Number.isFinite(outOf) || outOf < 1 || outOf > 5000 || won < 0 || won > outOf) {
        return res.status(400).json({ error: "Bad score." });
      }
      const pRef = db().collection("sharedPapers").doc(code);
      const rRef = pRef.collection("results").doc(req.user.uid);
      const p = await profile(req.user.uid);
      const typed = clip(String(b.name || "").replace(/\s+/g, " ").trim(), 60);
      const pct = Math.round((100 * won) / outOf);
      const out = await db().runTransaction(async (t) => {
        const [pSnap, rSnap] = [await t.get(pRef), await t.get(rRef)];
        if (!pSnap.exists) return null;
        const prev = rSnap.exists ? rSnap.data() : null;
        /* the teacher's number of tries: a new try past it is refused (the owner may always sit their own) */
        const allowed = pSnap.data().head && pSnap.data().head.tries != null ? pSnap.data().head.tries : 1;
        if (b.first === true && prev && allowed > 0 && (prev.attempts || 0) >= allowed && pSnap.data().ownerUid !== req.user.uid) return { noTries: allowed };
        const attempts = (prev ? prev.attempts || 0 : 0) + (b.first === true || !prev ? 1 : 0);
        const best = Math.max(pct, prev ? prev.bestPct || 0 : 0);
        t.set(rRef, {
          uid: req.user.uid, name: typed || (prev && prev.name) || nameOf(req, p), email: req.user.email || null,
          lastWon: won, lastOutOf: outOf, lastPct: pct, grade: gradeOf(pct), bestPct: best, attempts,
          firstAt: prev ? prev.firstAt : stamp(), lastAt: stamp(),
        }, { merge: true });
        if (!prev) t.set(pRef, { students: admin.firestore.FieldValue.increment(1) }, { merge: true });
        return { ownerUid: pSnap.data().ownerUid, title: pSnap.data().title, best, attempts };
      });
      if (!out) return res.status(404).json({ error: "No such paper." });
      if (out.noTries) return res.status(403).json({ error: `You have used all ${out.noTries} ${out.noTries === 1 ? "try" : "tries"} on this paper.` });
      try {
        await db().collection("teacherNotices").doc(out.ownerUid).collection("items").doc(`paper_${code}_${req.user.uid}`).set({
          kind: "paper", code, title: out.title || "Mock paper", uid: req.user.uid, name: typed || nameOf(req, p),
          right: won, total: outOf, pct, bestPct: out.best, attempts: out.attempts, at: stamp(), seen: false,
        }, { merge: true });
      } catch (e) { console.error("[paper notice]", e.message); }
      try {
        await db().collection("studentAssignments").doc(req.user.uid).collection("items").doc(`paper_${code}`).set({
          kind: "paper", paperUrl: `/paper/${code}`, activityTitle: out.title || "Mock paper", status: "done", lastPct: pct, bestPct: out.best, updatedAt: stamp(),
        }, { merge: true });
      } catch (e) { console.error("[paper item]", e.message); }
      if (b.first === true) await notifyStudents([req.user.uid], { kind: "result", title: out.title || "Mock paper", text: `Your result went in: ${won} of ${outOf}, grade ${gradeOf(pct)}.`, url: `/paper/${code}`, from: "Prep Portal" }, `result_paper_${code}`);
      res.json({ ok: true, pct, grade: gradeOf(pct) });
    } catch (err) {
      console.error("[/api/workbooks/paper/result]", err.message);
      res.status(500).json({ error: "Could not save the score." });
    }
  });

  router.get("/compile", authenticate, async (req, res) => {
    try {
      const me = await profile(req.user.uid);
      if (!isAdmin(req) && !["teacher", "admin"].includes(me.role)) {
        return res.status(403).json({ error: "Only teachers can compile results." });
      }
      const DAY = 86400000;
      const weeks = Math.max(1, Math.min(8, Math.round(Number(req.query.weeks)) || 4));
      /* weeks run Monday to Sunday (UTC), and the default is the four ending with this one */
      const monday = (ms) => { const d = new Date(ms); d.setUTCHours(0, 0, 0, 0); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; };
      let startMs = NaN;
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.start || ""))) startMs = Date.parse(`${req.query.start}T00:00:00Z`);
      startMs = Number.isFinite(startMs) ? monday(startMs) : monday(Date.now()) - (weeks - 1) * 7 * DAY;
      const endMs = startMs + weeks * 7 * DAY;
      const ms = (x) => (x && x.toMillis ? x.toMillis() : 0);

      const roster = await db().collection("teacherStudents").doc(req.user.uid).collection("roster").get();
      const people = new Map(); // uid -> { name, items: [] }
      const person = (uid, name) => {
        if (!people.has(uid)) people.set(uid, { uid, name: name || "Student", items: [] });
        else if (name && people.get(uid).name === "Student") people.get(uid).name = name;
        return people.get(uid);
      };
      roster.docs.forEach((d) => person(d.id, d.data().name));
      /* the class each student sits in: the name of the group the teacher put them in */
      const groupNames = new Map();
      try { (await db().collection("teacherGroups").doc(req.user.uid).collection("groups").get()).docs.forEach((g) => groupNames.set(g.id, g.data().name || "")); } catch (_) { /* a report card without a class is still a report card */ }
      roster.docs.forEach((d) => { people.get(d.id).klass = groupNames.get(d.data().groupId) || ""; });

      const [wbs, papers] = await Promise.all([
        db().collection("workbookAssignments").where("teacherUid", "==", req.user.uid).limit(80).get(),
        db().collection("sharedPapers").where("ownerUid", "==", req.user.uid).limit(80).get(),
      ]);
      const seen = new Set();
      const take = async (snap, kind) => {
        await Promise.all(snap.docs.map(async (d) => {
          const a = d.data();
          const rs = await d.ref.collection("results").get();
          rs.docs.forEach((x) => {
            const r = x.data();
            const at = ms(r.lastAt);
            if (at < startMs || at >= endMs) return;
            const pct = Number.isFinite(r.lastPct) ? r.lastPct : 0;
            person(x.id, r.name).items.push({
              kind, code: a.code || d.id, title: a.title || (kind === "paper" ? "Mock paper" : "Workbook"),
              pct, at, week: Math.floor((at - startMs) / (7 * DAY)), attempts: r.attempts || 1,
            });
            seen.add(`${kind}:${d.id}`);
          });
        }));
      };
      await Promise.all([take(wbs, "workbook"), take(papers, "paper")]);

      const mean = (a) => (a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length) : null);
      const students = [...people.values()].map((p) => {
        const wk = Array.from({ length: weeks }, (_, w) => {
          const items = p.items.filter((i) => i.week === w).sort((x, y) => x.at - y.at);
          return { completed: items.length, avg: mean(items.map((i) => i.pct)), items };
        });
        return { uid: p.uid, name: p.name, klass: p.klass || "", weeks: wk, completed: p.items.length, avg: mean(p.items.map((i) => i.pct)) };
      }).sort((a, b) => a.name.localeCompare(b.name));

      const all = [...people.values()].flatMap((p) => p.items);
      const classWeeks = Array.from({ length: weeks }, (_, w) => {
        const items = all.filter((i) => i.week === w);
        return { completed: items.length, avg: mean(items.map((i) => i.pct)), students: new Set(students.filter((s) => s.weeks[w].completed).map((s) => s.uid)).size };
      });
      res.json({
        ok: true, teacher: me.name || me.displayName || "", weeks,
        from: new Date(startMs).toISOString().slice(0, 10), to: new Date(endMs - DAY).toISOString().slice(0, 10),
        weekStarts: Array.from({ length: weeks }, (_, w) => new Date(startMs + w * 7 * DAY).toISOString().slice(0, 10)),
        assignments: seen.size, students, classWeeks,
      });
    } catch (err) {
      console.error("[/api/workbooks/compile]", err.message);
      res.status(500).json({ error: "Could not compile the results." });
    }
  });

  return router;
};
