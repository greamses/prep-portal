/**
 * Questions route — serves past questions from the Firestore `alocQuestions`
 * collection (seeded by scripts/import-aloc.js).
 *
 *   GET /api/questions?subject=mathematics&type=utme&year=2019&limit=20&random=1
 *
 * Equality filters only (subject / examType / examYear) so no composite index
 * is needed. Public read — these are practice questions, like the old static
 * per-folder question scripts.
 */

const express = require("express");
const admin = require("firebase-admin");

// ALOC subject key → display label used by the exam picker.
const SUBJECT_LABELS = {
  english: "English Language", mathematics: "Mathematics", biology: "Biology",
  physics: "Physics", chemistry: "Chemistry", economics: "Economics",
  government: "Government", commerce: "Commerce", geography: "Geography",
  crk: "Christian Religious Studies", irk: "Islamic Religious Studies",
  englishlit: "Literature in English", accounting: "Financial Accounting",
  history: "History", insurance: "Insurance", civiledu: "Civic Education",
  currentaffairs: "Current Affairs",
};

module.exports = function () {
  const router = express.Router();
  const db = () => admin.firestore();

  // ── GET /api/questions/facets?type=utme ──
  // Available subjects (with counts) + years-per-subject (with counts) for a
  // type. Cached briefly since it only changes on import.
  const FACET_TTL = 10 * 60 * 1000;
  const facetCache = {};
  const validYear = (y) => /^(19|20)\d\d$/.test(String(y));

  router.get("/facets", async (req, res) => {
    try {
      const type = String(req.query.type || "").toLowerCase().trim();
      if (!type) return res.status(400).json({ error: "type is required" });

      const cached = facetCache[type];
      if (cached && Date.now() - cached.at < FACET_TTL) return res.json(cached.data);

      const snap = await db().collection("alocQuestions").where("queryType", "==", type).get();
      const subjCount = {};
      const yearsBySubject = {};
      snap.forEach((d) => {
        const x = d.data();
        const s = x.subject;
        if (!s) return;
        subjCount[s] = (subjCount[s] || 0) + 1;
        const y = String(x.examYear || "");
        if (validYear(y)) {
          (yearsBySubject[s] = yearsBySubject[s] || {});
          yearsBySubject[s][y] = (yearsBySubject[s][y] || 0) + 1;
        }
      });

      const subjects = Object.keys(subjCount)
        .map((k) => ({ key: k, label: SUBJECT_LABELS[k] || k, count: subjCount[k] }))
        .filter((s) => s.count > 0)
        .sort((a, b) => a.label.localeCompare(b.label));

      const ybs = {};
      for (const s in yearsBySubject) {
        ybs[s] = Object.entries(yearsBySubject[s])
          .map(([year, count]) => ({ year, count }))
          .sort((a, b) => b.year.localeCompare(a.year));
      }

      const data = { type, total: snap.size, subjects, yearsBySubject: ybs };
      facetCache[type] = { at: Date.now(), data };
      res.json(data);
    } catch (err) {
      console.error("[/api/questions/facets]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const subject = String(req.query.subject || "").toLowerCase().trim();
      const type = String(req.query.type || "").toLowerCase().trim();
      const year = String(req.query.year || "").trim();
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 60);
      const random = req.query.random !== "0";

      const mapDoc = (d) => {
        const x = d.data();
        return {
          id: x.alocId,
          question: x.question,
          options: x.options || [],
          answerIndex: typeof x.answerIndex === "number" ? x.answerIndex : -1,
          correctIndex: typeof x.answerIndex === "number" ? x.answerIndex : -1,
          answer: x.answer || "",
          explanation: x.solution || "",
          image: x.image || "",
          subject: x.subject,
          examType: x.examType,
          examYear: x.examYear,
        };
      };
      const shuffle = (a) => {
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      // Base query (equality filters only → no composite index needed).
      let base = db().collection("alocQuestions");
      if (subject) base = base.where("subject", "==", subject);
      // queryType = the clean type we fetched under (utme/wassce). ALOC's own
      // per-question examtype is dirty ("posr-utme-aaua", "model", years…).
      if (type) base = base.where("queryType", "==", type);

      const pool = random ? Math.max(limit * 4, 80) : limit;
      let questions;

      if (year) {
        // Prefer the selected year, then top up from other years for the same
        // subject/type so sparse years don't yield a near-empty paper.
        const ySnap = await base.where("examYear", "==", year).limit(pool).get();
        questions = shuffle(ySnap.docs.map(mapDoc));
        if (questions.length < limit) {
          const allSnap = await base.limit(pool).get();
          const have = new Set(questions.map((q) => q.id));
          const extra = shuffle(allSnap.docs.map(mapDoc).filter((q) => !have.has(q.id)));
          questions = questions.concat(extra);
        }
      } else {
        const snap = await base.limit(pool).get();
        questions = snap.docs.map(mapDoc);
        if (random) shuffle(questions);
      }

      questions = questions.slice(0, limit);
      res.json({ count: questions.length, subject, type, year: year || null, questions });
    } catch (err) {
      console.error("[/api/questions]", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
