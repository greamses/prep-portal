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
// The four families of writing/js/forms.js, plus the two ids that stand in for
// "no family" so a stray value can never be written straight through.
const FAMILIES = ["narrative", "descriptive", "argumentative", "expository", "summary", "general"];

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

      if (prompt.length < 8) return res.status(400).json({ error: "prompt is too short to file" });
      // The form is the filing category. Without one there is nowhere to put it,
      // which is exactly why the picker now comes first.
      if (!/^[a-z0-9-]+$/.test(form)) return res.status(400).json({ error: "a writing form is required" });

      const uid = req.user.uid;
      const id = `${hash(uid)}_${form}_${hash(normalise(prompt))}`;
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
          videoId: videoId || (prev && prev.videoId) || "",
          videoStart: videoStart || (prev && prev.videoStart) || 0,
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
