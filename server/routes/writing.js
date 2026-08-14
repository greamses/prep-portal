/**
 * Writing library — every prompt somebody brings to the evaluator is kept.
 *
 * The evaluator can write you a prompt, or you can paste in the one you were
 * actually set (writing/js/own-task.js). The pasted ones are worth more than
 * the session they were typed in: they are real classroom tasks, filed under
 * the FORM they were set for — which is why the site now makes you choose the
 * form before you may type a prompt at all. Nothing arrives uncategorised.
 *
 * Everything lands in one collection, `writingLibrary`, with
 * `category: "writing"` on every document so a future library that also holds
 * maths or science tasks can filter on it rather than on the collection name.
 *
 *   POST /api/writing/prompts              — file the prompt just inserted
 *   GET  /api/writing/prompts?form=…       — yours for that form, plus any
 *                                            that have been published to all
 *   POST /api/writing/prompts/:id/publish  — admin: publish / unpublish one
 *
 * Server-authoritative (Admin SDK) like /api/activities, so the locked-down
 * Firestore rules never have to expose the collection to the browser.
 */

const express = require("express");
const admin = require("firebase-admin");
const { authenticate } = require("../middleware/auth");

// A prompt is a sentence or two. Past this someone is pasting an essay.
const MAX_PROMPT = 2000;
// The families of writing/js/forms.js, plus "general", which stands in for
// "no family" so a stray value can never be written straight through. Keep
// this list in step with FAMILIES there — a family missing here is silently
// filed as "general" and loses its shelf.
const FAMILIES = [
  "narrative", "descriptive", "argumentative", "review", "expository", "summary", "general",
];
// The grade bands of writing/js/levels.js. Mirrored here for the same reason
// FAMILIES is: an unknown value must land on a known one rather than be written
// through, because the level decides how a piece is marked. Keep in step.
const LEVELS = ["primary", "junior", "senior"];
const LEVEL_LABELS = { primary: "Grades 4–6", junior: "Grades 7–9", senior: "Grades 10–12" };
const DEFAULT_LEVEL = "junior";
const cleanLevel = (v) => (LEVELS.includes(v) ? v : DEFAULT_LEVEL);

// djb2 — the same cheap hash utils/solution-steps.js keys its overrides with.
function hash(str) {
  let h = 5381;
  for (let i = 0; i < String(str).length; i++) h = ((h << 5) + h + String(str).charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Whitespace and case are not what makes two prompts different, so the doc id
// ignores both: re-applying the same prompt updates its row instead of adding
// a second one. The id is per-owner, so two teachers who set the same task each
// keep their own copy (and their own count).
const normalise = (s) => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();

/* A SUMMARY's task is a whole passage, not a line, so it can never travel in a
   query string the way a prompt does. Filing it here is what makes a summary
   shareable at all: the link carries ?task=<id> and the passage is fetched back.
   Capped hard — this is a school reading passage, not a document store. */
const MAX_PARAS = 12;
const MAX_PARA = 1200;
function cleanPassage(p) {
  if (!p || typeof p !== "object") return null;
  const paragraphs = (Array.isArray(p.paragraphs) ? p.paragraphs : [])
    .map((s) => String(s || "").trim().slice(0, MAX_PARA))
    .filter(Boolean)
    .slice(0, MAX_PARAS);
  if (!paragraphs.length) return null;
  return { title: String(p.title || "").slice(0, 200), paragraphs };
}

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();
  const col = () => db().collection("writingLibrary");
  const stamp = admin.firestore.FieldValue.serverTimestamp;
  const isAdmin = (req) => !!req.user && req.user.email && req.user.email === process.env.ADMIN_EMAIL;

  const publicPrompt = (id, d, uid) => ({
    id,
    prompt: d.prompt,
    form: d.form || "",
    formLabel: d.formLabel || "",
    family: d.family || "",
    level: cleanLevel(d.level),
    // Handed back as a pasteable link rather than a bare id, offset and all,
    // because that is the field it drops into on the way out.
    video: d.videoId
      ? `https://youtu.be/${d.videoId}${d.videoStart ? `?t=${d.videoStart}` : ""}`
      : "",
    videoId: d.videoId || "",
    videoStart: d.videoStart || 0,
    mine: d.ownerUid === uid,
    published: !!d.published,
    savedAt: d.savedAt && d.savedAt.toMillis ? d.savedAt.toMillis() : null,
  });

  // ── File a prompt ────────────────────────────────────────────────────────
  router.post("/prompts", authenticate, async (req, res) => {
    try {
      const b = req.body || {};
      const prompt = String(b.prompt || "").trim().slice(0, MAX_PROMPT);
      const form = String(b.form || "").trim().slice(0, 40);
      const family = FAMILIES.includes(b.family) ? b.family : "general";
      const level = cleanLevel(b.level);

      if (prompt.length < 8) return res.status(400).json({ error: "prompt is too short to file" });
      // The form is the filing category. Without one there is nowhere to put it,
      // which is exactly why the picker now comes first.
      if (!/^[a-z0-9-]+$/.test(form)) return res.status(400).json({ error: "a writing form is required" });

      const passage = cleanPassage(b.passage);

      const uid = req.user.uid;
      // The passage joins the key: two summaries can share the same task line
      // ("Summarise the passage below…") over completely different readings, and
      // keying on the line alone would file the second one on top of the first.
      const key = normalise(prompt) + (passage ? `|${normalise(passage.title)}|${passage.paragraphs.length}` : "");
      const id = `${hash(uid)}_${form}_${hash(key)}`;
      const ref = col().doc(id);
      const existing = await ref.get();
      const prev = existing.exists ? existing.data() || {} : null;

      const label = String(b.formLabel || "").slice(0, 80);
      const videoId = String(b.videoId || "").slice(0, 20);
      const videoStart = Number.isFinite(+b.videoStart) ? Math.max(0, Math.floor(+b.videoStart)) : 0;

      await ref.set(
        {
          category: "writing",           // what shelf of the library this is on
          // The id already says this is the same prompt, so the wording it was
          // first filed under is kept — a re-file must never downgrade a row to
          // a sloppier copy of itself, or blank a label or video it had.
          prompt: (prev && prev.prompt) || prompt,
          form,
          formLabel: label || (prev && prev.formLabel) || "",
          family,
          // Unlike the wording, the level IS allowed to be changed by a re-file:
          // a teacher who reuses last year's prompt with a younger class is
          // saying something real, and the id is the prompt, not the standard.
          level,
          videoId: videoId || (prev && prev.videoId) || "",
          videoStart: videoStart || (prev && prev.videoStart) || 0,
          passage: passage || (prev && prev.passage) || null,
          ownerUid: uid,
          ownerEmail: req.user.email || null,
          published: prev ? !!prev.published : false,
          usedCount: admin.firestore.FieldValue.increment(1),
          savedAt: (prev && prev.savedAt) || stamp(),
          updatedAt: stamp(),
        },
        { merge: true },
      );

      res.json({ ok: true, id, filed: !existing.exists });
    } catch (err) {
      console.error("[/api/writing/prompts POST]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── What is on the shelf for this form ───────────────────────────────────
  // Two equality-only queries, which Firestore serves by merging its automatic
  // single-field indexes — no composite index to deploy by hand. The sort is
  // done here rather than in the query for the same reason.
  router.get("/prompts", authenticate, async (req, res) => {
    try {
      const form = String(req.query.form || "").trim().slice(0, 40);
      if (!/^[a-z0-9-]+$/.test(form)) return res.json({ prompts: [] });
      const limit = Math.min(30, Math.max(1, parseInt(req.query.limit, 10) || 12));
      const uid = req.user.uid;

      const [mine, shared] = await Promise.all([
        col().where("ownerUid", "==", uid).where("form", "==", form).limit(limit).get(),
        col().where("published", "==", true).where("form", "==", form).limit(limit).get(),
      ]);

      const seen = new Map();
      for (const snap of [mine, shared]) {
        snap.forEach((doc) => {
          if (!seen.has(doc.id)) seen.set(doc.id, publicPrompt(doc.id, doc.data() || {}, uid));
        });
      }

      const prompts = [...seen.values()]
        .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
        .slice(0, limit);

      res.json({ prompts });
    } catch (err) {
      console.error("[/api/writing/prompts GET]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /* ── One filed task, by id ────────────────────────────────────────────────
     What a ?task=<id> share link resolves against. Deliberately UNauthenticated:
     a task is handed to a class, and a student following the link has usually
     not signed in yet — a 401 here would make the link useless to exactly the
     people it was sent to. Only the task itself comes back, never who filed it. */
  const taskShape = (id, d) => ({
    found: true,
    id,
    prompt: d.prompt || "",
    form: d.form || "",
    level: cleanLevel(d.level),
    videoId: d.videoId || "",
    videoStart: d.videoStart || 0,
    passage: d.passage || null,
    code: d.shortCode || "",
  });

  router.get("/task/:id", async (req, res) => {
    try {
      const id = String(req.params.id || "").slice(0, 120);
      if (!/^[a-z0-9_-]+$/i.test(id)) return res.status(400).json({ error: "bad id" });
      const snap = await col().doc(id).get();
      if (!snap.exists) return res.status(404).json({ error: "No such task." });
      res.json(taskShape(id, snap.data() || {}));
    } catch (err) {
      console.error("[/api/writing/task GET]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /* ── Short codes — a link a class can be TOLD ─────────────────────────────
     The share link used to carry the whole task in the query string:
     ?prompt=<a sentence>&form=…&video=…&t=… — well over two hundred
     characters, impossible to read out and impossible to write on a board. A
     code is five characters: prepportal.com.ng/w/K7M2Q.

     The alphabet has no 0/O or 1/I in it, the same choice the class codes in
     routes/classroom.js make, because these are read aloud and copied by
     hand. Minting is IDEMPOTENT: the code is written to the library doc as
     `shortCode` as well as to writingCodes/{CODE}, so sharing the same task
     twice hands out the same link rather than quietly stranding the first
     one — a teacher who re-shares on Monday what they shared on Friday has
     not changed the task, and the students who already have it must not find
     it dead.

       POST /api/writing/prompts/:id/code  — owner (or admin) mints/fetches
       GET  /api/writing/c/:code           — public: resolve → the task
     ──────────────────────────────────────────────────────────────────────── */
  const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const CODE_LEN = 5;
  const codeDoc = (c) => db().collection("writingCodes").doc(c);
  const newCode = () => {
    let s = "";
    for (let i = 0; i < CODE_LEN; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    return s;
  };

  router.post("/prompts/:id/code", authenticate, async (req, res) => {
    try {
      const id = String(req.params.id || "").slice(0, 120);
      if (!/^[a-z0-9_-]+$/i.test(id)) return res.status(400).json({ error: "bad id" });

      const ref = col().doc(id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: "No such task." });
      const d = snap.data() || {};
      // Anyone could otherwise mint a link to somebody else's task and hand it
      // round as their own — the id is derived from a hash, not a secret.
      if (d.ownerUid !== req.user.uid && !isAdmin(req)) {
        return res.status(403).json({ error: "Not your task." });
      }
      if (d.shortCode) return res.json({ ok: true, code: d.shortCode, reused: true });

      // create() rather than set(): it fails if the code is already taken, which
      // is the collision check. Six tries out of 33 million is plenty.
      let code = "";
      for (let i = 0; i < 6 && !code; i++) {
        const c = newCode();
        try {
          await codeDoc(c).create({ taskId: id, ownerUid: d.ownerUid || null, createdAt: stamp() });
          code = c;
        } catch (_) { /* taken — roll again */ }
      }
      if (!code) return res.status(500).json({ error: "Could not make a short link — try again." });

      await ref.set({ shortCode: code }, { merge: true });
      res.json({ ok: true, code, reused: false });
    } catch (err) {
      console.error("[/api/writing/prompts/:id/code]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Public, for the same reason /task/:id is: this is the link the class was
  // given, and most of them will follow it before signing in.
  router.get("/c/:code", async (req, res) => {
    try {
      const code = String(req.params.code || "").trim().toUpperCase().slice(0, 12);
      if (!new RegExp(`^[${CODE_ALPHABET}]{3,12}$`).test(code)) {
        return res.status(400).json({ error: "bad code" });
      }
      const hit = await codeDoc(code).get();
      if (!hit.exists) return res.status(404).json({ error: "No such task." });
      const taskId = String((hit.data() || {}).taskId || "");
      const snap = taskId ? await col().doc(taskId).get() : null;
      // The code outliving its task is a real state (the row was deleted), and
      // it reads to a student exactly like a typo, so answer the same way.
      if (!snap || !snap.exists) return res.status(404).json({ error: "No such task." });
      res.json({ ...taskShape(taskId, snap.data() || {}), code });
    } catch (err) {
      console.error("[/api/writing/c GET]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /* ═══ SUBMISSIONS — the marked piece, and the teacher's last word ═══════
     Until now a marking existed for as long as the tab was open and then went
     nowhere. That is fine for practice and useless for a class: a teacher who
     sets a task has no way to see what came back, and the AI's number is the
     final word on a student's work, which it should never be.

     So a marked piece is filed against the task it answers, and the teacher who
     OWNS that task may overrule any of it — the score, and the comments, per
     paragraph and overall. What the machine said is kept alongside, never
     overwritten: "the AI gave 68, your teacher gave 74" is the honest record,
     and it is also the only way to tell whether the marking is any good.

     WHERE IT LIVES. A SUBcollection of the task, `writingLibrary/{taskId}/
     submissions/{studentUid}`, and not a top-level collection — the live
     Firestore rules OR-grant every signed-in user read on any single-segment
     collection (the blog depends on it), so a top-level writingSubmissions
     would publish the whole school's essays. Same reasoning as the activities
     submissions subcollection; see firestore.rules.

     One document per student per task. A second attempt replaces the first and
     bumps `attempts` — a class list showing the same name four times is a
     worse answer than a class list showing their latest work.

       POST /task/:id/submissions              — student files a marked piece
       GET  /task/:id/submissions              — task owner (or admin) reads them
       GET  /submissions/inbox                 — teacher: everything, all tasks
       POST /task/:id/submissions/:uid/review  — teacher approves or overrules
       GET  /submissions/mine                  — student reads their own back
     ─────────────────────────────────────────────────────────────────────── */
  const MAX_TEXT = 20000;        // a long essay is ~3000; this is the ceiling
  const MAX_ANNOTATED = 60000;   // the same text plus its tags
  const MAX_COMMENT = 2000;
  const subs = (taskId) => col().doc(taskId).collection("submissions");

  const num = (v, lo, hi) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : null;
  };
  const ms = (t) => (t && t.toMillis ? t.toMillis() : null);

  /* The teacher's number when there is one, the machine's otherwise. Written in
     one place because every list, pill and stat has to agree about what "the
     score" means the moment a teacher touches it. */
  const finalScore = (d) => (d.teacherScore != null ? d.teacherScore : d.aiScore);

  const subShape = (id, d, { withText = true } = {}) => ({
    id,
    studentUid: d.studentUid || id,
    studentName: d.studentName || "Student",
    studentEmail: d.studentEmail || "",
    taskId: d.taskId || "",
    taskPrompt: d.taskPrompt || "",
    form: d.form || "",
    formLabel: d.formLabel || "",
    level: cleanLevel(d.level),
    levelLabel: LEVEL_LABELS[cleanLevel(d.level)],
    words: d.words || 0,
    aiScore: d.aiScore == null ? null : d.aiScore,
    teacherScore: d.teacherScore == null ? null : d.teacherScore,
    score: finalScore(d),
    approved: !!d.approved,
    reviewed: !!d.reviewedAt,
    teacherComment: d.teacherComment || "",
    paragraphComments: d.paragraphComments || {},
    rubric: Array.isArray(d.rubric) ? d.rubric : [],
    passes: d.passes || 0,
    attempts: d.attempts || 1,
    submittedAt: ms(d.submittedAt),
    reviewedAt: ms(d.reviewedAt),
    ...(withText ? { text: d.text || "", annotatedText: d.annotatedText || "" } : {}),
  });

  /* Whether this caller may act as the teacher for a task. Ownership of the
     TASK is what confers it, not the role: a teacher may not review a class
     they were not set. An admin may, everywhere. */
  async function ownsTask(req, taskId) {
    const snap = await col().doc(taskId).get();
    if (!snap.exists) return { error: "No such task.", status: 404 };
    const d = snap.data() || {};
    if (d.ownerUid !== req.user.uid && !isAdmin(req)) {
      return { error: "Not your task.", status: 403 };
    }
    return { task: d };
  }

  // ── A student files a marked piece ───────────────────────────────────────
  router.post("/task/:id/submissions", authenticate, async (req, res) => {
    try {
      const taskId = String(req.params.id || "").slice(0, 120);
      if (!/^[a-z0-9_-]+$/i.test(taskId)) return res.status(400).json({ error: "bad id" });
      const taskSnap = await col().doc(taskId).get();
      if (!taskSnap.exists) return res.status(404).json({ error: "No such task." });
      const task = taskSnap.data() || {};

      const b = req.body || {};
      const text = String(b.text || "").slice(0, MAX_TEXT);
      if (text.trim().length < 20) return res.status(400).json({ error: "Nothing to file." });

      const m = b.marking && typeof b.marking === "object" ? b.marking : {};
      const rubric = (Array.isArray(m.rubric) ? m.rubric : []).slice(0, 8).map((r) => ({
        category: String(r.category || "").slice(0, 60),
        score: num(r.score, 0, 200) || 0,
        outOf: num(r.outOf, 0, 200) || 0,
        feedback: String(r.feedback || "").slice(0, 1500),
      }));

      const ref = subs(taskId).doc(req.user.uid);
      const prev = await ref.get();
      const p = prev.exists ? prev.data() || {} : null;

      await ref.set({
        studentUid: req.user.uid,
        studentName: req.user.name || req.user.email || "Student",
        studentEmail: req.user.email || null,
        taskId,
        taskOwnerUid: task.ownerUid || null,
        taskPrompt: String(task.prompt || "").slice(0, 300),
        form: task.form || "",
        formLabel: task.formLabel || "",
        // The level the PIECE was marked at. Read off the task, not off the
        // client: the student's browser is not the authority on the standard
        // their teacher set, and a marking filed under the wrong level would
        // make the whole record incomparable.
        level: cleanLevel(task.level),
        text,
        annotatedText: String(m.annotatedText || "").slice(0, MAX_ANNOTATED),
        words: num(b.words, 0, 100000) || 0,
        aiScore: num(m.totalScore, 0, 100),
        rubric,
        offTopic: !!m.offTopic,
        passes: num(m.passes, 0, 40) || 0,
        attempts: (p && p.attempts ? p.attempts : 0) + 1,
        submittedAt: stamp(),
        /* A resubmission is a NEW piece of work, so the old verdict on the old
           piece cannot stand over it. Cleared rather than kept: a teacher's 74
           sitting on top of an essay they have never read is worse than no
           mark at all. */
        teacherScore: null,
        approved: false,
        teacherComment: "",
        paragraphComments: {},
        reviewedAt: null,
        reviewedBy: null,
      }, { merge: true });

      /* If this task was ASSIGNED, the student's own list should stop saying
         "to do". Fire-and-forget and best-effort — the submission is filed
         either way, and an assignment row that is merely out of date is a much
         smaller problem than a marking that was refused. */
      try {
        await db().collection("studentAssignments").doc(req.user.uid)
          .collection("items").doc(`writing_${taskId}`)
          .set({ status: "submitted", score: num(m.totalScore, 0, 100), submittedAt: stamp() }, { merge: true });
      } catch (_) { /* not assigned, or nothing to update */ }

      res.json({ ok: true, id: req.user.uid, teacher: !!task.ownerUid });
    } catch (err) {
      console.error("[/api/writing/task/:id/submissions POST]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── The class's work on one task (task owner) ────────────────────────────
  router.get("/task/:id/submissions", authenticate, async (req, res) => {
    try {
      const taskId = String(req.params.id || "").slice(0, 120);
      if (!/^[a-z0-9_-]+$/i.test(taskId)) return res.status(400).json({ error: "bad id" });
      const who = await ownsTask(req, taskId);
      if (who.error) return res.status(who.status).json({ error: who.error });

      const snap = await subs(taskId).get();
      const submissions = snap.docs
        .map((d) => subShape(d.id, d.data() || {}))
        .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
      res.json({
        task: { id: taskId, prompt: who.task.prompt || "", formLabel: who.task.formLabel || "", level: cleanLevel(who.task.level) },
        submissions,
      });
    } catch (err) {
      console.error("[/api/writing/task/:id/submissions GET]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /* ── Everything waiting for me ────────────────────────────────────────────
     Deliberately not a collectionGroup query. That would need a composite index
     deployed by hand, and index deploys on this project drift behind the code
     (see docs / npm run check:rules). My tasks are a single-field query, and
     each one's submissions are one more read — a teacher has tens of tasks, not
     thousands, and a page that always works beats a page that is faster once
     somebody remembers to deploy an index. */
  router.get("/submissions/inbox", authenticate, async (req, res) => {
    try {
      const limit = Math.min(40, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const mine = await col().where("ownerUid", "==", req.user.uid).limit(limit).get();
      const tasks = mine.docs.filter((d) => (d.data() || {}).category === "writing");

      const groups = await Promise.all(tasks.map(async (t) => {
        const snap = await subs(t.id).get();
        if (snap.empty) return null;
        const d = t.data() || {};
        const submissions = snap.docs
          .map((s) => subShape(s.id, s.data() || {}, { withText: false }))
          .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
        return {
          taskId: t.id,
          prompt: String(d.prompt || "").slice(0, 300),
          formLabel: d.formLabel || "",
          level: cleanLevel(d.level),
          levelLabel: LEVEL_LABELS[cleanLevel(d.level)],
          count: submissions.length,
          waiting: submissions.filter((s) => !s.reviewed).length,
          latest: submissions[0] ? submissions[0].submittedAt : null,
          submissions,
        };
      }));

      const inbox = groups.filter(Boolean).sort((a, b) => (b.latest || 0) - (a.latest || 0));
      res.json({
        inbox,
        waiting: inbox.reduce((n, g) => n + g.waiting, 0),
        total: inbox.reduce((n, g) => n + g.count, 0),
      });
    } catch (err) {
      console.error("[/api/writing/submissions/inbox]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /* ── The teacher's last word ──────────────────────────────────────────────
     Approve what the machine said, change the number, write comments — on the
     piece as a whole and on any paragraph of it. Every field is optional, so
     the same route serves "approved, no changes" and a full re-mark, and a
     teacher editing one comment does not have to resend the score.

     The AI's score is never touched. It sits beside the teacher's for as long
     as the submission exists. */
  router.post("/task/:id/submissions/:uid/review", authenticate, async (req, res) => {
    try {
      const taskId = String(req.params.id || "").slice(0, 120);
      const uid = String(req.params.uid || "").slice(0, 128);
      if (!/^[a-z0-9_-]+$/i.test(taskId)) return res.status(400).json({ error: "bad id" });
      const who = await ownsTask(req, taskId);
      if (who.error) return res.status(who.status).json({ error: who.error });

      const ref = subs(taskId).doc(uid);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: "No such submission." });

      const b = req.body || {};
      const patch = {
        reviewedAt: stamp(),
        reviewedBy: req.user.uid,
        reviewedByName: req.user.name || req.user.email || "Teacher",
      };
      // undefined = "leave it alone"; null = "take my override off again".
      if (b.score !== undefined) patch.teacherScore = b.score === null ? null : num(b.score, 0, 100);
      if (b.approved !== undefined) patch.approved = !!b.approved;
      if (b.comment !== undefined) patch.teacherComment = String(b.comment || "").slice(0, MAX_COMMENT);
      if (b.paragraphComments !== undefined && b.paragraphComments && typeof b.paragraphComments === "object") {
        const clean = {};
        for (const [k, v] of Object.entries(b.paragraphComments).slice(0, 40)) {
          if (!/^\d{1,2}$/.test(String(k))) continue;
          const t = String(v || "").slice(0, MAX_COMMENT);
          if (t.trim()) clean[String(k)] = t;
        }
        patch.paragraphComments = clean;
      }

      await ref.set(patch, { merge: true });

      /* Push the verdict onto the student's assignment row so they meet it
         where they already look, rather than having to find their way back to
         a results screen they closed. Best-effort for the same reason as above. */
      const after = { ...(snap.data() || {}), ...patch };
      try {
        await db().collection("studentAssignments").doc(uid)
          .collection("items").doc(`writing_${taskId}`)
          .set({
            status: "reviewed",
            score: finalScore(after),
            teacherComment: after.teacherComment || "",
            reviewedAt: stamp(),
          }, { merge: true });
      } catch (_) { /* was never assigned — it was a shared link */ }

      res.json({ ok: true, submission: subShape(uid, after) });
    } catch (err) {
      console.error("[/api/writing/task/:id/submissions/:uid/review]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /* ── A student reads their own back ───────────────────────────────────────
     Keyed by the assignment list rather than by a query over every task, for
     the index reason above: the student already has a list of what they were
     set, and their submission is always at a known path under it. */
  router.get("/submissions/mine", authenticate, async (req, res) => {
    try {
      const items = await db().collection("studentAssignments").doc(req.user.uid)
        .collection("items").limit(40).get();
      const taskIds = items.docs
        .map((d) => (d.data() || {}).taskId)
        .filter((t) => t && /^[a-z0-9_-]+$/i.test(t));

      const found = await Promise.all(taskIds.map(async (t) => {
        const s = await subs(t).doc(req.user.uid).get();
        return s.exists ? subShape(s.id, s.data() || {}) : null;
      }));
      res.json({ submissions: found.filter(Boolean).sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0)) });
    } catch (err) {
      console.error("[/api/writing/submissions/mine]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /* ── Writing-suggestion credits ────────────────────────────────────────
     A student gets a fixed budget of help WHILE WRITING — the planner's
     per-box ideas, and the word and sentence replacements offered on a
     highlight. The point of the budget is not cost: it is that unlimited
     rewriting turns the exercise into a conversation with a machine, and the
     sheet stops being the student's. A thousand is enough that nobody
     reaches it in an honest session and small enough that leaning on it runs
     out.

     Why the count lives HERE and not in the browser: a "max" enforced in
     localStorage is a max until somebody opens devtools, and this one is
     spent by the same student it limits. The decrement is a transaction, so
     two tabs cannot both spend the last credit.

     It has NOTHING to do with marking. The examiner is never told what was
     spent, no score depends on it, and running out costs no marks — it
     simply stops the suggestions. That is deliberate: help taken while
     drafting is drafting, and we do not punish a student for using a tool we
     put on the page.

     Separate from aiUsage/{uid} in routes/ai.js on purpose. That is a
     display-only token meter across the whole site that never blocks; this
     is a hard, countable allowance for one feature.

       GET  /api/writing/credits        — { balance, allocation, spent }
       POST /api/writing/credits/spend  — { cost } → the new balance, or 402
     ──────────────────────────────────────────────────────────────────── */
  const CREDIT_ALLOWANCE = 1000;
  const MAX_SPEND = 10;   // one action can never cost more than this
  const creditDoc = (uid) => db().collection("writingCredits").doc(uid);
  const creditShape = (spent, unlimited) => ({
    spent,
    allocation: unlimited ? null : CREDIT_ALLOWANCE,
    balance: unlimited ? null : Math.max(0, CREDIT_ALLOWANCE - spent),
    unlimited: !!unlimited,
  });

  router.get("/credits", authenticate, async (req, res) => {
    try {
      if (isAdmin(req)) return res.json(creditShape(0, true));
      const snap = await creditDoc(req.user.uid).get();
      const spent = snap.exists ? Number(snap.data().spent) || 0 : 0;
      res.json(creditShape(spent, false));
    } catch (err) {
      console.error("[/api/writing/credits GET]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/credits/spend", authenticate, async (req, res) => {
    try {
      if (isAdmin(req)) return res.json(creditShape(0, true));

      const asked = Math.floor(Number((req.body || {}).cost));
      const cost = Number.isFinite(asked) ? Math.min(MAX_SPEND, Math.max(1, asked)) : 1;
      const ref = creditDoc(req.user.uid);

      // A transaction, not an increment: the balance has to be CHECKED and
      // decremented together, or the last credit gets spent twice by two tabs.
      const spent = await db().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const now = snap.exists ? Number(snap.data().spent) || 0 : 0;
        if (now + cost > CREDIT_ALLOWANCE) {
          const e = new Error("out_of_credits");
          e.balance = Math.max(0, CREDIT_ALLOWANCE - now);
          throw e;
        }
        tx.set(ref, {
          spent: now + cost,
          ownerEmail: req.user.email || null,
          updatedAt: stamp(),
        }, { merge: true });
        return now + cost;
      });

      res.json(creditShape(spent, false));
    } catch (err) {
      if (err.message === "out_of_credits") {
        return res.status(402).json({
          error: "out_of_credits",
          balance: err.balance ?? 0,
          allocation: CREDIT_ALLOWANCE,
        });
      }
      console.error("[/api/writing/credits spend]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Admin: put one in front of everybody (or take it back) ───────────────
  router.post("/prompts/:id/publish", authenticate, async (req, res) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin access only." });
      const id = String(req.params.id || "").slice(0, 120);
      const ref = col().doc(id);
      if (!(await ref.get()).exists) return res.status(404).json({ error: "No such prompt." });
      const published = req.body && req.body.published === false ? false : true;
      await ref.set({ published, publishedAt: published ? stamp() : null }, { merge: true });
      res.json({ ok: true, published });
    } catch (err) {
      console.error("[/api/writing/prompts publish]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
