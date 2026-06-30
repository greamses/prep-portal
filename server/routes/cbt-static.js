/**
 * cbt-static.js — LOCAL admin editor backed by the static bank (data/cbt/*),
 * NOT Firestore. Mounted on /api/cbt ONLY when CBT_STATIC_STORE=1 (local dev),
 * BEFORE the real routes/cbt.js. It overrides exactly the editor endpoints and
 * calls next() on everything else, so serving (GET /), /template, /mark and
 * /facets fall through to the real router unchanged.
 *
 * Every write goes straight to the committed data/cbt files (≈0 Firestore ops);
 * the admin commits locally and pushes the delta to Firestore — the write-only
 * backup — with scripts/sync-cbt-firestore.js when happy.
 */

const express = require("express");
const { authenticate, requireAdmin } = require("../middleware/auth");
const S = require("../lib/cbt-static");
const H = require("./cbt").helpers;

const clamp = (n, lo, hi) => Math.min(Math.max(parseInt(n, 10) || lo, lo), hi);

// Resolve the one video URL/scope for an item (mirrors routes/cbt.js).
function pickVideo(item, batch) {
  if (batch.url && batch.scope === "set") return { video: batch.url, videoScope: "set" };
  if (item.video) return { video: item.video, videoScope: item.videoScope || "question" };
  if (batch.url) return { video: batch.url, videoScope: batch.scope };
  return { video: null, videoScope: "question" };
}

module.exports = function () {
  const router = express.Router();

  // ── GET /stats (admin) — counts from the static files, no scan/quota ──
  router.get("/stats", authenticate, requireAdmin, (_req, res) => {
    const st = S.stats();
    res.json({ ...st, schemes: H.SCHEMES, subjectLabels: H.SUBJECT_LABELS, static: true });
  });

  // ── GET /classes — only when class-first (?scheme= legacy → fall through) ──
  router.get("/classes", (_req, res) => res.json({ classes: S.classes() }));

  router.get("/subjects", (req, res, next) => {
    const cls = H.classKey(req.query.class);
    if (!cls) return next(); // legacy ?scheme= → real router
    res.json({ class: cls, classLabel: S.CLASS_LABELS[cls] || cls, subjects: S.subjectsForClass(cls) });
  });

  router.get("/topics", (req, res, next) => {
    const cls = H.classKey(req.query.class);
    const subject = H.subjKey(req.query.subject);
    if (!cls || !subject) return next(); // legacy ?scheme= → real router
    res.json({ class: cls, subject, topics: S.topicsForClassSubject(cls, subject) });
  });

  router.get("/papers", (req, res) => {
    const cls = H.classKey(req.query.class);
    const subject = H.subjKey(req.query.subject);
    const topic = String(req.query.topic || "").trim();
    if (!cls || !subject || !topic) return res.status(400).json({ error: "class, subject and topic are required." });
    res.json({ class: cls, subject, topic, ...S.papers(cls, subject, topic) });
  });

  // ── GET /list (admin) — full docs for the browse/edit table ──
  router.get("/list", authenticate, requireAdmin, (req, res, next) => {
    const cls = H.classKey(req.query.class);
    const subject = H.subjKey(req.query.subject);
    if (!subject) return res.status(400).json({ error: "subject required." });
    if (!cls) return next(); // legacy ?scheme= → real router
    const topic = String(req.query.topic || "").trim();
    const paper = parseInt(req.query.paper, 10) || 0;
    const questions = S.listQuestions({ cls, subject, topic, paper });
    res.json({ count: questions.length, questions });
  });

  // ── Topic registry (admin) ──
  router.get("/topic-list", authenticate, requireAdmin, (req, res) => {
    const cls = H.classKey(req.query.class), subject = H.subjKey(req.query.subject);
    if (!cls || !subject) return res.status(400).json({ error: "class and subject required." });
    res.json({ class: cls, subject, topics: S.topicList(cls, subject) });
  });
  router.post("/topic-list", authenticate, requireAdmin, (req, res) => {
    const b = req.body || {};
    const cls = H.classKey(b.class), subject = H.subjKey(b.subject);
    const name = String(b.name || "").trim().slice(0, 120);
    if (!cls || !subject || !name) return res.status(400).json({ error: "class, subject and name required." });
    const topics = b.action === "remove" ? S.removeTopic(cls, subject, name) : S.addTopic(cls, subject, name);
    res.json({ ok: true, topics });
  });

  // ── POST /generate (admin) — AI builds questions → static files ──
  router.post("/generate", authenticate, requireAdmin, async (req, res) => {
    try {
      const b = req.body || {};
      const scheme = String(b.scheme || "").toLowerCase().trim();
      if (!H.SCHEMES[scheme]) return res.status(400).json({ error: "Unknown scheme." });
      const key = H.subjKey(b.subject);
      if (!key) return res.status(400).json({ error: "Subject is required." });
      const label = H.subjLabel(key, b.subject);
      const topic = String(b.topic || "").trim().slice(0, 120);
      const count = clamp(b.count, 1, 30);
      const types = Array.isArray(b.types) ? b.types.filter((t) => typeof t === "string" && t.trim()).slice(0, 6) : [];
      const wantImages = b.images === true || b.wantImages === true;
      const video = { url: H.safeUrl(b.video), text: String(b.videoText || "").trim().slice(0, 6000), scope: H.videoScopeOf(b.videoScope) };
      const grade = String(b.grade || "").trim().slice(0, 60);

      const text = await H.callModelRaw(H.genPrompt(scheme, label, topic, count, types, wantImages, video, grade), false);
      let arr = H.parseExamJs(text);
      if (!arr.length) { try { const j = H.safeJson(text); arr = j.questions || j.items || (Array.isArray(j) ? j : []); } catch (_) {} }
      const questions = H.cleanQuestions(arr);
      if (!questions.length) return res.status(502).json({ error: "The model returned no usable questions — try again." });

      const batchClass = H.classKey(grade);
      const topicName = topic || H.GENERAL_TOPIC;
      const records = [];
      for (const q of questions) {
        const cl = H.classKey(q.grade) || batchClass;
        if (!cl) continue;
        const v = pickVideo(q, video);
        records.push({
          scheme, subject: key, subjectLabel: label,
          type: q.type || "objective", question: q.question, options: q.options || null,
          answerIndex: typeof q.answerIndex === "number" ? q.answerIndex : null, answer: q.answer || null,
          explanation: q.explanation, hint: q.hint || "", image: q.image || null,
          ...v, topic: topicName, classLevel: cl, grade: H.classLabel(cl),
        });
      }
      if (!records.length) return res.status(400).json({ error: "Pick a class/grade — generated questions need a class to file under." });
      S.addRecords(records);
      res.json({ ok: true, saved: records.length, static: true });
    } catch (e) {
      console.error("[static /cbt/generate]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /question (admin) — add one manually ──
  router.post("/question", authenticate, requireAdmin, (req, res) => {
    try {
      const b = req.body || {};
      const scheme = H.SCHEMES[String(b.scheme || "").toLowerCase().trim()] ? String(b.scheme).toLowerCase().trim() : "practice";
      const key = H.subjKey(b.subject);
      if (!key) return res.status(400).json({ error: "Subject is required." });
      const v = H.validBody(b);
      if (v.error) return res.status(400).json({ error: v.error });
      const record = { ...v, scheme, subject: key, subjectLabel: H.subjLabel(key, b.subject) };
      const [id] = S.addRecords([record]);
      res.json({ ok: true, id, paper: S.papers(v.classLevel, key, v.topic).papers });
    } catch (e) {
      console.error("[static /cbt/question POST]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── PUT /question/:id (admin) — edit ──
  router.put("/question/:id", authenticate, requireAdmin, (req, res) => {
    try {
      const b = req.body || {};
      const cur = S.findRecord(req.params.id);
      if (!cur) return res.status(404).json({ error: "Question not found." });
      const v = H.validBody(b);
      if (v.error) return res.status(400).json({ error: v.error });
      const scheme = H.SCHEMES[String(b.scheme || "").toLowerCase().trim()] ? String(b.scheme).toLowerCase().trim() : (cur.scheme || "practice");
      const key = H.subjKey(b.subject) || cur.subject;
      const merged = S.updateRecord(req.params.id, { ...v, scheme, subject: key, subjectLabel: H.subjLabel(key, b.subject || key) });
      if (!merged) return res.status(404).json({ error: "Question not found." });
      res.json({ ok: true, paper: S.papers(merged.classLevel, merged.subject, merged.topic).papers });
    } catch (e) {
      console.error("[static /cbt/question PUT]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── DELETE /question/:id (admin) ──
  router.delete("/question/:id", authenticate, requireAdmin, (req, res) => {
    try {
      S.deleteRecord(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      console.error("[static /cbt/question DELETE]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /import (admin) — bulk-import a question-library .js file ──
  router.post("/import", authenticate, requireAdmin, (req, res) => {
    try {
      const b = req.body || {};
      const scheme = String(b.scheme || "").toLowerCase().trim();
      const key = H.subjKey(b.subject);
      if (!H.SCHEMES[scheme]) return res.status(400).json({ error: "Unknown scheme." });
      if (!key) return res.status(400).json({ error: "Subject is required." });
      const batch = { url: H.safeUrl(b.video), scope: H.videoScopeOf(b.videoScope) };
      const batchClass = H.classKey(b.grade);
      const topicName = String(b.topic || "").trim().slice(0, 120) || H.GENERAL_TOPIC;

      let arr;
      try { arr = H.parseExamJs(b.jsCode || ""); }
      catch (e) { return res.status(400).json({ error: "Couldn't parse the JS file: " + e.message }); }
      const parsed = H.importQuestions(arr);
      if (!parsed.length) return res.status(400).json({ error: "No questions found (expected `const examQuestions = [ … ]`)." });

      const records = [];
      for (const q of parsed) {
        const cl = H.classKey(q.grade) || batchClass;
        if (!cl) continue;
        const v = pickVideo(q, batch);
        records.push({
          scheme, subject: key, subjectLabel: H.subjLabel(key, b.subject),
          type: q.type, question: q.question, options: q.options || null,
          answerIndex: typeof q.answerIndex === "number" ? q.answerIndex : null, answer: q.answer || null,
          explanation: q.explanation, hint: q.hint || "", image: q.image || null,
          ...v, topic: topicName, classLevel: cl, grade: H.classLabel(cl),
        });
      }
      if (!records.length) return res.status(400).json({ error: "Pick a class/grade — imported questions need a class to file under." });
      S.addRecords(records);
      res.json({ ok: true, imported: records.length, static: true });
    } catch (e) {
      console.error("[static /cbt/import]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /rephrase (admin) — no-op in static mode ──
  // Rephrase targets verbatim "past" originals; the static student bank holds none.
  router.post("/rephrase", authenticate, requireAdmin, (_req, res) => {
    res.json({ ok: true, created: 0, processed: 0, remaining: 0, note: "Rephrase applies to verbatim past-paper originals — none in the static bank." });
  });

  return router;
};
