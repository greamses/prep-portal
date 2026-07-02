/* ═══════════════════════════════════════════════════════════
   PREP PORTAL — Practice Paper Quiz Engine
   MODULE 3: Quiz Engine - Core quiz functionality with Exam Type Support
   ═══════════════════════════════════════════════════════════ */

"use strict";

const Quiz = (() => {
  let allQuestions = [];
  let allQuestionsAll = []; // master list for type filtering
  let currentIndex = 0;
  let introVideoDone = false; // watch-first intro is shown once per quiz
  // Free-response types (anything not multiple-choice): short = small input,
  // subjective = inline fill-in-the-blank, theory/essay = textarea.
  const isFree = (t) => t === "theory" || t === "essay" || t === "short" || t === "subjective";

  // Classify a bank question into one of the three learner-facing formats.
  // A question with ≥2 options is multiple-choice regardless of its stored type.
  function qFormat(q) {
    const opts = q && q.options;
    if (Array.isArray(opts) && opts.length >= 2) return "mcq";
    const t = String((q && q.type) || "").toLowerCase();
    if (t === "theory" || t === "essay") return "theory";
    return "short"; // subjective / short / blank / fill-in-the-blank
  }

  // Written-answer questions (Short Answer / Theory) are Premium-only; free users
  // get MCQs. Resolve once from the CACHED profile (0 extra reads when the nav
  // already warmed it). Unknown/anonymous → not premium.
  let _premiumVerdict = null;
  async function isPremiumUser() {
    if (_premiumVerdict !== null) return _premiumVerdict;
    try {
      const { auth } = await import("/firebase-init.js");
      let u = auth.currentUser;
      if (!u) {
        const { onAuthStateChanged } = await import("firebase/auth");
        u = await new Promise((res) => {
          const unsub = onAuthStateChanged(auth, (x) => { unsub(); res(x || null); });
          setTimeout(() => res(auth.currentUser || null), 3000);
        });
      }
      if (!u) return (_premiumVerdict = false);
      const { getProfile } = await import("/utils/data-service.js");
      const p = await getProfile(u.uid);
      _premiumVerdict = !!(p && p.isPremium);
    } catch (_) { _premiumVerdict = false; }
    return _premiumVerdict;
  }
  let userAnswers = {};
  let submitted = false;
  let theoryMarks = {};
  // Immediate-feedback mode (URL ?feedback=on): once a learner picks an option
  // the answer is revealed and that question locks. `revealed[idx]` tracks which
  // questions have been answered-and-shown so navigating back keeps the reveal.
  let immediate = false;
  let revealed = {};

  // ── Helper: Escape HTML ──────────────────────────────────────
  function esc(str) {
    if (!str) return "";
    return String(str)
      .replace(/[&<>]/g, function (m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
      })
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (c) {
        return c;
      });
  }

  // Like esc(), but keeps a whitelist of inline formatting tags the curated
  // files use (<br>, <b>, <i>, <u>, <sub>, <sup>, <em>, <strong>). Everything
  // else is escaped, so it's still XSS-safe. LaTeX "<" survives too: it's
  // escaped to &lt;, which the browser decodes back to "<" in textContent —
  // exactly what MathJax reads — so "$x < 7$" still renders correctly.
  function escFmt(str) {
    if (!str) return "";
    return esc(str).replace(
      /&lt;(\/?)(br|b|i|u|sub|sup|em|strong)\s*\/?&gt;/gi,
      "<$1$2>",
    );
  }

  function typesetEl(el) {
    if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
      MathJax.typesetPromise([el]).catch((e) =>
        console.warn("MathJax error:", e),
      );
    }
  }

  // ── SAT bank formatter ───────────────────────────────────────────────
  // The OpenSAT bank mixes notations the page can't render as-is:
  //   • markdown *…*  → used for BOTH math variables (*f*) and English
  //     emphasis (*not*); routed to \(…\) or <em> accordingly.
  //   • bare numbers / expressions / raw LaTeX (\frac…) with no delimiters.
  //   • currency "$5" — which the page's MathJax would otherwise read as an
  //     inline-math delimiter and garble the sentence.
  // formatSat() wraps every mathematical run in \(…\) so MathJax renders it
  // in one consistent typeface, leaves prose words alone, and protects any
  // genuine LaTeX that's already delimited. <em> survives escFmt()'s
  // whitelist; \(…\) is handed to MathJax by typesetEl().
  function formatSat(str) {
    if (!str) return "";
    let s = String(str).trim();
    if (!s || s === "null") return "";
    const S = String.fromCharCode(1);
    const toL = (t) =>
      t
        .replace(/(\d),(?=\d)/g, "$1{,}")
        .replace(/\^\s*\{([^}]*)\}/g, "^{$1}")
        .replace(/\^\s*(-?[A-Za-z0-9.]+)/g, "^{$1}")
        .replace(/_\s*\{([^}]*)\}/g, "_{$1}")
        .replace(/_\s*([A-Za-z0-9]+)/g, "_{$1}")
        .replace(/%/g, "\\%")
        .replace(/×/g, "\\times ")
        .replace(/÷/g, "\\div ")
        .replace(/·/g, "\\cdot ")
        .replace(/≤/g, "\\le ")
        .replace(/≥/g, "\\ge ")
        .replace(/≠/g, "\\ne ")
        .replace(/±/g, "\\pm ")
        .replace(/π/g, "\\pi ")
        .replace(/√/g, "\\sqrt ")
        .replace(/°/g, "^{\\circ}")
        .replace(/²/g, "^{2}")
        .replace(/³/g, "^{3}")
        .replace(/\s+/g, " ")
        .trim();
    // A $…$ body is real math (not prose between two currency $) when it has
    // no multi-letter English word once LaTeX commands are stripped.
    const mathy = (c) => {
      if (!/[\\^_=<>(){}]|[A-Za-z]|\d/.test(c)) return false;
      if (/[A-Za-z]{3,}/.test(c.replace(/\\[A-Za-z]+/g, " "))) return false;
      return true;
    };
    const parked = [];
    const park = (m) => {
      parked.push(m);
      return S + (parked.length - 1) + S;
    };

    // Park genuine LaTeX so the tokeniser never rewrites its internals.
    s = s.replace(/\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\}/g, (m) =>
      park(m),
    );
    s = s.replace(/\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g, park);
    s = s.replace(/\$([^$\n]+?)\$/g, (m, body) => (mathy(body) ? park(m) : m));
    s = s.replace(/\$\s?(\d[\d,]*(?:\.\d+)?)/g, (_, num) =>
      park("\\(\\$" + toL(num) + "\\)"),
    );
    s = s.replace(/\*\*?(\S(?:[^*\n]*\S)?)\*\*?/g, (_, inner) => {
      inner = inner.trim();
      return mathy(inner)
        ? park("\\(" + toL(inner) + "\\)")
        : park("<em>" + inner + "</em>");
    });

    // Tokenise the rest and group maximal math runs.
    const TOK = new RegExp(
      S +
        "\\d+" +
        S +
        "|\\\\[A-Za-z]+|\\d[\\d,]*(?:\\.\\d+)?|[A-Za-z]+|\\s+|[^\\sA-Za-z0-9]",
      "g",
    );
    const MATHSYM = /^[-+*/=^_<>|()[\]{}%√π°²³±×÷·≤≥≠.,]$/;
    const PARKED = new RegExp("^" + S + "\\d+" + S + "$");
    const ART = /^[aAIO]$/;
    const toks = s.match(TOK) || [];
    const cls = toks.map((tok) => {
      if (PARKED.test(tok)) return "p";
      if (/^\s+$/.test(tok)) return "w";
      if (/^\\[A-Za-z]+$/.test(tok)) return "m";
      if (/^\d[\d,]*(?:\.\d+)?$/.test(tok)) return "m";
      if (/^[A-Za-z]+$/.test(tok))
        return tok.length === 1 && !ART.test(tok) ? "m" : "t";
      if (MATHSYM.test(tok)) return "m";
      return "t";
    });
    // A space/comma/period only stays in a run when math sits on both sides.
    const joins = (i) => {
      let l = i - 1;
      while (l >= 0 && cls[l] === "w") l--;
      let r = i + 1;
      while (r < cls.length && cls[r] === "w") r++;
      return l >= 0 && r < cls.length && cls[l] === "m" && cls[r] === "m";
    };
    let out = "",
      run = "";
    const flush = () => {
      if (!run) return;
      // Peel boundary chars that can't sit at the edge of a math span.
      const m = run.match(/^([\s*/=^_<>.,]*)([\s\S]*?)([\s+\-*/=^_<>.,]*)$/);
      if (!m[2] || !/[0-9A-Za-z\\]/.test(m[2])) {
        out += run;
        run = "";
        return;
      }
      out += m[1] + "\\(" + toL(m[2]) + "\\)" + m[3];
      run = "";
    };
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i],
        c = cls[i];
      if (c === "m") run += t;
      else if (c === "w") {
        if (run && joins(i)) run += t;
        else {
          flush();
          out += t;
        }
      } else if ((t === "," || t === ".") && run && joins(i)) run += t;
      else {
        flush();
        out += t;
      }
    }
    flush();
    // Restore parked LaTeX (iteratively — a parked $…$ may itself hold a
    // placeholder, e.g. a bare environment wrapped in dollar signs).
    const restore = new RegExp(S + "(\\d+)" + S, "g");
    let prev;
    do {
      prev = out;
      out = out.replace(restore, (_, i) => parked[+i]);
    } while (out !== prev && out.indexOf(S) !== -1);
    return out;
  }

  // ── Answer resolver ──────────────────────────────────────
  function resolveAnswer(q) {
    const opts = q.options || [];
    for (const f of [
      "correctIndex",
      "correct_index",
      "answerIndex",
      "answer_index",
    ]) {
      if (q[f] !== undefined && q[f] !== null) {
        const i = parseInt(q[f], 10);
        if (!isNaN(i) && opts[i] !== undefined) return opts[i];
      }
    }
    const raw =
      q.answer ??
      q.correct ??
      q.correctAnswer ??
      q.correctOption ??
      q.correct_answer ??
      q.key ??
      null;
    if (raw === null) return null;
    if (typeof raw === "number") return opts[raw] ?? null;
    const s = String(raw).trim();
    if (/^[A-Ea-e]$/.test(s))
      return opts[s.toUpperCase().charCodeAt(0) - 65] ?? null;
    if (/^\d$/.test(s)) return opts[parseInt(s, 10)] ?? null;
    return s || null;
  }

  // ── Gemini API Key Check ──────────────────────────────────────
  function geminiKey() {
    return typeof GEMINI_API_KEY !== "undefined" && GEMINI_API_KEY;
  }

  // AI-mark a free-response answer via our server (keys stay server-side).
  // `type` lets the server route the model (short/blank → Groq, theory → Gemini).
  async function markTheory(question, answer, markScheme, type) {
    try {
      const headers = { "Content-Type": "application/json" };
      try {
        const u = window.firebaseAuth && window.firebaseAuth.currentUser;
        if (u) headers.Authorization = "Bearer " + (await u.getIdToken());
      } catch (_) {}
      const r = await fetch(`${API_BASE}/api/cbt/mark`, {
        method: "POST",
        headers,
        body: JSON.stringify({ question, answer, modelAnswer: markScheme || "", type: type || "" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Marking failed");
      return d;
    } catch (e) {
      return { score: 0, outOf: 10, feedback: `Marking unavailable — compare with the model answer. (${e.message})` };
    }
  }

  // ── Bootstrap ────────────────────────────────────────────
  function init() {
    immediate = !!PAGE_CONFIG.immediate;
    let subText, metaText, printText;
    if (PAGE_CONFIG.source === "competition") {
      const comp = (PAGE_CONFIG.comp || "").replace(/-/g, " ");
      const div = (PAGE_CONFIG.div || "").replace(/-/g, " ");
      const yr = PAGE_CONFIG.year || "";
      const rnd = (PAGE_CONFIG.round || "").replace(/-/g, " ");
      subText = `${comp || "Competition"} Practice`;
      metaText = [div, yr, rnd].filter(Boolean).join(" · ");
      printText = `Prep Portal · ${subText} · Results`;
    } else if (PAGE_CONFIG.source === "cbt" || PAGE_CONFIG.source === "cbtlocal") {
      // Our own bank — use the descriptive "…-style" scheme label (never an exam body's name).
      const CBT_LABELS = {
        cee: "Common Entrance style", utme: "UTME-style", wassce: "WASSCE-style",
        postutme: "Post-UTME style", sat: "SAT-style", igcse: "IGCSE-style",
        alevel: "A-Level-style", practice: "Practice",
      };
      const schemeLabel = CBT_LABELS[PAGE_CONFIG.scheme] || "Practice";
      const subs = (PAGE_CONFIG.subjects || []).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" & ") || "Practice";
      const bits = [];
      if (PAGE_CONFIG.paper) bits.push(`Paper ${PAGE_CONFIG.paper}`);
      if (PAGE_CONFIG.format === "mcq") bits.push("MCQs");
      else if (PAGE_CONFIG.format === "blank") bits.push("Fill in the Blanks");
      else if (PAGE_CONFIG.format === "theory") bits.push("Theories");
      if (PAGE_CONFIG.topic) bits.push(PAGE_CONFIG.topic);
      subText = `${schemeLabel} • ${subs}`;
      metaText = bits.join(" · ") || "Practice set";
      printText = `Prep Portal · ${schemeLabel} · ${(PAGE_CONFIG.subjects || []).join(", ")} · Results`;
    } else if (PAGE_CONFIG.source === "sat") {
      const secName =
        { math: "Math", english: "Reading & Writing", mixed: "Full Test" }[
          PAGE_CONFIG.section
        ] || "Practice";
      const diff =
        PAGE_CONFIG.difficulty && PAGE_CONFIG.difficulty !== "all"
          ? PAGE_CONFIG.difficulty.charAt(0).toUpperCase() +
            PAGE_CONFIG.difficulty.slice(1)
          : "All levels";
      subText = `SAT • ${secName}`;
      metaText = `${diff} • ${PAGE_CONFIG.limit} questions`;
      printText = `Prep Portal · SAT ${secName} · Results`;
    } else {
      const examTypeName = getExamTypeName(PAGE_CONFIG.examType);
      subText = `${examTypeName} • ${(PAGE_CONFIG.subjects || []).join(" & ") || "Practice Paper"}`;
      metaText = `${PAGE_CONFIG.year || "—"} • ${(PAGE_CONFIG.types || []).join(" & ").toUpperCase()}`;
      printText = `Prep Portal · ${examTypeName} ${PAGE_CONFIG.year || ""} · ${(PAGE_CONFIG.subjects || []).join(", ")} · Results`;
    }

    document.getElementById("display-subject").textContent = subText;
    document.getElementById("display-meta").textContent = metaText;
    document.getElementById("print-header").textContent = printText;

    const quitLink = document.getElementById("quit-link");
    if (quitLink) {
      quitLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.back();
      });
    }

    // Add summary button listener
    const summaryBtn = document.getElementById("summary-btn");
    if (summaryBtn) {
      summaryBtn.addEventListener("click", () => {
        if (submitted) {
          showResults();
        } else {
          confirmSubmit();
        }
      });
    }

    // Show settings modal before loading questions; apply chosen values then start.
    function startExam() {
      if (window.__immediateMode !== undefined) immediate = !!window.__immediateMode;
      loadAndRender();
    }

    if (window.ExamSettings) {
      window.ExamSettings.show(startExam);
    } else {
      startExam();
    }
  }

  function getExamTypeName(examTypeId) {
    const names = {
      waec: "WASSCE",
      neco: "SSCE",
      jamb: "UTME",
    };
    return (
      names[examTypeId] || (examTypeId ? examTypeId.toUpperCase() : "EXAM")
    );
  }

  // ── Shared maps (board + subject normalisation) ──────────────────
  const EXAM_MAP = {
    waec: "wassce",
    jamb: "utme",
    neco: "neco",
    utme: "utme",
    wassce: "wassce",
    "post-utme": "post-utme",
    postutme: "post-utme",
  };
  // Map the exam-picker's subject names → the shared subject keys used by
  // both ALOC and the local question bank.
  const SUBJ_MAP = {
    "english language": "english",
    english: "english",
    mathematics: "mathematics",
    maths: "mathematics",
    math: "mathematics",
    "further mathematics": "mathematics",
    physics: "physics",
    chemistry: "chemistry",
    biology: "biology",
    economics: "economics",
    commerce: "commerce",
    government: "government",
    geography: "geography",
    history: "history",
    "christian religious studies": "crk",
    crk: "crk",
    "islamic religious studies": "irk",
    "literature in english": "englishlit",
    "financial accounting": "accounting",
    "agricultural science": "agriculturalscience",
    "civic education": "civiledu",
    insurance: "insurance",
    "current affairs": "currentaffairs",
  };
  const toSubjKey = (s) =>
    SUBJ_MAP[s.toLowerCase().trim()] || s.toLowerCase().trim().split(/\s+/)[0];

  function shuffleArr(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── Load a curated local file in an isolated scope ───────────────
  // The bank's files are inconsistent: different top-level bindings, some
  // ES-module style (`import …`, trailing `setupQuiz(…)`). We fetch the
  // text, neutralise import/export, eval inside a fresh Function scope so
  // their `const`s never collide across subjects, and return the named
  // binding. A no-op `setupQuiz` swallows any self-registration call.
  async function loadLocalRaw(path, varName) {
    const res = await fetch(path);
    if (!res.ok) throw new Error("HTTP " + res.status);
    let text = await res.text();
    text = text
      .replace(/^\s*import\s.*$/gm, "")
      .replace(/^\s*export\s+default\s+/gm, "")
      .replace(/^\s*export\s+/gm, "");
    const factory = new Function(
      "setupQuiz",
      `${text}\n;return (typeof ${varName} !== 'undefined') ? ${varName} : null;`,
    );
    return factory(function () {});
  }

  function normalizeLocalObjective(items, sub, year) {
    return (items || [])
      .map((q) => {
        const opts = q.options || [];
        const ci =
          typeof q.correctIndex === "number"
            ? q.correctIndex
            : typeof q.correct_index === "number"
              ? q.correct_index
              : -1;
        return {
          question: q.question || "",
          options: opts,
          _answer: ci >= 0 && opts[ci] !== undefined ? opts[ci] : null,
          explanation: Array.isArray(q.explanation)
            ? q.explanation.join("\n")
            : q.explanation || "",
          image: q.image || "",
          hint: q.hint || "",
          type: "objective",
          subject: sub,
          examType: PAGE_CONFIG.examType,
          examYear: year,
        };
      })
      .filter((q) => q.question);
  }

  function normalizeLocalTheory(raw, sub, year) {
    // Theory files are objects keyed question1/question2/… or arrays.
    const items = Array.isArray(raw) ? raw : Object.values(raw || {});
    return items
      .map((q) => {
        const text = typeof q === "string" ? q : (q && q.question) || "";
        return {
          question: text,
          options: [],
          _answer: null,
          explanation:
            q && q.explanation
              ? Array.isArray(q.explanation)
                ? q.explanation.join("\n")
                : q.explanation
              : "",
          image: (q && q.image) || "",
          hint: (q && q.hint) || "",
          type: "theory",
          subject: sub,
          examType: PAGE_CONFIG.examType,
          examYear: year,
        };
      })
      .filter((q) => q.question);
  }

  async function fetchAlocSubject(subKey, examType, year, per, sub) {
    const params = new URLSearchParams({
      subject: subKey,
      type: examType,
      limit: String(per),
      random: "1",
    });
    // The endpoint prioritises the chosen year and tops up from other
    // years if that year is sparse (so a paper is never near-empty).
    if (year) params.set("year", year);
    try {
      const res = await fetch(`${API_BASE}/api/questions?${params}`);
      if (!res.ok) {
        console.warn("ALOC fetch", sub, "→ HTTP", res.status);
        return [];
      }
      const data = await res.json();
      return (data.questions || []).map((q) => {
        const options = q.options || [];
        const ai =
          typeof q.answerIndex === "number"
            ? q.answerIndex
            : typeof q.correctIndex === "number"
              ? q.correctIndex
              : -1;
        return {
          question: q.question,
          options,
          _answer: ai >= 0 && options[ai] !== undefined ? options[ai] : null,
          explanation: q.explanation || "",
          image: q.image || "",
          hint: "",
          type: "objective",
          subject: sub,
          examType: PAGE_CONFIG.examType,
          examYear: q.examYear || year || "",
        };
      });
    } catch (e) {
      console.warn("ALOC load failed for", sub, e.message);
      return [];
    }
  }

  // ── CBT loader (source=cbt): our own AI-generated bank (/api/cbt),
  //    keyed by scheme + subject. Maps onto the engine's question shape. ──
  async function loadFromCbt() {
    const local = PAGE_CONFIG.source === "cbtlocal"; // serve from the static bank (0 reads)
    const cls = PAGE_CONFIG.cbtClass;
    const scheme = PAGE_CONFIG.scheme || "utme";
    const subjects = PAGE_CONFIG.subjects.length ? PAGE_CONFIG.subjects : ["mathematics"];
    // Class/paper mode → one paper (the whole ≤60 set). Legacy scheme mode → `n` per subject.
    const per = (local || cls) ? 60 : (PAGE_CONFIG.limit || 15);
    const all = [];
    for (const subKey of subjects) {
      try {
        let questions = [];
        if (local) {
          // Local-first: the chosen paper, straight from /data/cbt/* (Firestore fallback inside).
          const axis = PAGE_CONFIG.axis === "exam" ? "exam" : "class";
          const top = axis === "exam" ? PAGE_CONFIG.scheme : PAGE_CONFIG.cbtClass;
          const bank = await import("/utils/cbt-bank.js");
          questions = await bank.paperQuestions(axis, top, subKey, PAGE_CONFIG.topic, PAGE_CONFIG.paper);
          // Format filter (mcq | short | theory) + premium gate: written answers
          // (Short Answer / Theory) are Premium-only, so free users only ever
          // receive MCQs — not even under "All".
          const want = PAGE_CONFIG.format;
          const premium = await isPremiumUser();
          questions = questions.filter((q) => {
            const f = qFormat(q);
            if (f !== "mcq" && !premium) return false; // non-MCQs locked for free users
            if (want && f !== want) return false;       // explicit filter
            return true;
          });
        } else {
          const params = new URLSearchParams({ subject: subKey, limit: String(per) });
          if (cls) {
            // Class → Subject → Topic → Paper (a stable paper, no shuffle).
            params.set("class", cls);
            if (PAGE_CONFIG.topic) params.set("topic", PAGE_CONFIG.topic);
            if (PAGE_CONFIG.paper) params.set("paper", PAGE_CONFIG.paper);
          } else {
            // LEGACY scheme mode.
            params.set("scheme", scheme);
            params.set("random", "1");
            if (PAGE_CONFIG.paper) params.set("paper", PAGE_CONFIG.paper);
            if (PAGE_CONFIG.format) params.set("format", PAGE_CONFIG.format);
            if (PAGE_CONFIG.topic) params.set("topic", PAGE_CONFIG.topic);
            if (PAGE_CONFIG.grade) params.set("grade", PAGE_CONFIG.grade);
          }
          const res = await fetch(`${API_BASE}/api/cbt?${params}`);
          if (!res.ok) { console.warn("CBT fetch", subKey, "→ HTTP", res.status); continue; }
          questions = (await res.json()).questions || [];
        }
        questions.forEach((q) => {
          const options = q.options || [];
          const isMcq = Array.isArray(options) && options.length >= 2;
          const ai = typeof q.answerIndex === "number" ? q.answerIndex
            : typeof q.correctIndex === "number" ? q.correctIndex : -1;
          all.push({
            question: q.question,
            options: isMcq ? options : [],
            // MCQ → correct option; free-response → the model answer (revealed + used as mark scheme).
            _answer: isMcq ? (ai >= 0 && options[ai] !== undefined ? options[ai] : null) : (q.answer || null),
            markScheme: isMcq ? "" : (q.answer || ""),
            explanation: q.explanation || "",
            image: q.image || "",
            video: q.video || "",
            videoScope: q.videoScope || "question",
            hint: q.hint || "",
            // Keep the real free-response style (short/subjective/theory) so the
            // viewer can pick the right input; default to theory.
            type: isMcq ? "objective" : (isFree(q.type) ? q.type : "theory"),
            subject: q.subjectLabel || subKey,
            examType: scheme,
            examYear: "",
          });
        });
      } catch (e) { console.warn("CBT load failed for", subKey, e.message); }
    }
    return all;
  }

  // ── Hybrid loader: our curated files for the years we host, ALOC for
  //    every other year. Maps both sources onto the engine's question shape.
  async function loadFromAloc() {
    const examType =
      EXAM_MAP[(PAGE_CONFIG.examType || "").toLowerCase()] ||
      (PAGE_CONFIG.examType || "").toLowerCase();
    const board = (
      window.localBoardKey || ((x) => String(x || "").toLowerCase())
    )(PAGE_CONFIG.examType);
    const subjects = PAGE_CONFIG.subjects.length
      ? PAGE_CONFIG.subjects
      : ["mathematics"];
    const types =
      PAGE_CONFIG.types && PAGE_CONFIG.types.length
        ? PAGE_CONFIG.types
        : ["objective"];
    const per = PAGE_CONFIG.limit || 20;
    const wantYear =
      PAGE_CONFIG.year && PAGE_CONFIG.year !== "all"
        ? String(PAGE_CONFIG.year)
        : null;
    const out = [];

    for (const sub of subjects) {
      const subKey = toSubjKey(sub);
      const localAll = window.localEntries
        ? window.localEntries(board, subKey)
        : [];
      let localPool = [];

      for (const type of types) {
        // Pick local files of this type: the requested year only, or
        // every hosted year when "All Years" / no year is selected.
        const localPicks = localAll.filter(
          (e) => e.type === type && (!wantYear || e.year === wantYear),
        );
        for (const lp of localPicks) {
          try {
            const raw = await loadLocalRaw(lp.entry.path, lp.entry.varName);
            localPool = localPool.concat(
              type === "objective"
                ? normalizeLocalObjective(raw, sub, lp.year)
                : normalizeLocalTheory(raw, sub, lp.year),
            );
          } catch (e) {
            console.warn("Local load failed for", lp.entry.path, e.message);
          }
        }
      }

      // We host the exact year picked → serve OUR full curated paper as-is,
      // in its original order, untrimmed. This is the whole point of the
      // local bank, so don't cap it to `per` or mix in ALOC.
      const haveLocalForWantYear =
        wantYear && localAll.some((e) => e.year === wantYear);
      if (haveLocalForWantYear && localPool.length) {
        out.push(...localPool);
        continue;
      }

      // Otherwise (year we don't host, or "All Years") fall back to ALOC
      // for breadth — objective only, since the API has no theory — and cap
      // the merged pool to `per` questions per subject.
      let pool = localPool;
      if (types.includes("objective")) {
        const aloc = await fetchAlocSubject(
          subKey,
          examType,
          wantYear,
          per,
          sub,
        );
        const seen = new Set(pool.map((q) => (q.question || "").trim()));
        pool = pool.concat(
          aloc.filter((q) => !seen.has((q.question || "").trim())),
        );
      }

      shuffleArr(pool);
      out.push(...pool.slice(0, per));
    }
    return out;
  }

  // ── SAT loader (source=sat) ──────────────────────────────────────────
  // Reads the self-hosted OpenSAT bank (one JSON: { math:[], english:[], … }),
  // filters by section + optional difficulty, and maps onto the engine shape.
  function normalizeSat(it, sec) {
    const q = it.question || {};
    const choices = q.choices || {};
    const order = ["A", "B", "C", "D", "E"];
    // Run every learner-visible field through formatSat() so the bank's
    // markdown italics and bare caret exponents render instead of showing
    // raw asterisks / "^". _answer is taken from the SAME formatted option
    // so the answer-key comparison still matches what the learner clicks.
    const options = order
      .map((k) => choices[k])
      .filter((v) => v !== undefined && v !== null && v !== "null")
      .map(formatSat);
    const clean = (v) => (v && v !== "null" ? String(v).trim() : "");
    const para = formatSat(clean(q.paragraph)),
      stem = formatSat(clean(q.question));
    const ansIdx = order.indexOf(
      String(q.correct_answer || "")
        .trim()
        .toUpperCase(),
    );
    return {
      question: para ? para + "<br><br>" + stem : stem,
      options,
      _answer:
        ansIdx >= 0 && options[ansIdx] !== undefined ? options[ansIdx] : null,
      explanation: formatSat(clean(q.explanation)),
      image: "",
      hint: "",
      type: "objective",
      subject:
        sec === "math"
          ? "Math"
          : sec === "english"
            ? "Reading & Writing"
            : "SAT",
      examType: "sat",
      examYear: "",
      // Hand-authored animation script (see scripts/author-sat-steps.js).
      // An array (even empty) tells the animator to skip the runtime AI call.
      steps: Array.isArray(it.steps) ? it.steps : undefined,
    };
  }

  async function loadFromSat() {
    const section = (PAGE_CONFIG.section || "mixed").toLowerCase();
    const per = PAGE_CONFIG.limit || 20;
    const diff = (PAGE_CONFIG.difficulty || "").toLowerCase();
    const BASE = "../../international/sat/";
    const MATH_FILES = ["advanced-math", "problem-solving", "geometry", "algebra"];
    const ENG_FILES  = ["information-ideas", "conventions", "expression", "craft"];

    const toFetch = [];
    if (section === "math"    || section === "mixed")
      MATH_FILES.forEach(f => toFetch.push(["math",    BASE + "math/"    + f + ".json"]));
    if (section === "english" || section === "mixed")
      ENG_FILES.forEach(f  => toFetch.push(["english", BASE + "english/" + f + ".json"]));

    const pool = [];
    try {
      await Promise.all(toFetch.map(async ([sec, url]) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const arr = await res.json();
        arr.forEach(it => pool.push({ it, sec }));
      }));
    } catch (e) {
      console.warn("SAT bank load failed:", e.message);
      return [];
    }

    let picked =
      diff && diff !== "all"
        ? pool.filter(
            (p) => String(p.it.difficulty || "").toLowerCase() === diff,
          )
        : pool;

    const norm = picked
      .map((p) => normalizeSat(p.it, p.sec))
      .filter((q) => q.question);
    shuffleArr(norm);
    return norm.slice(0, per);
  }

  async function loadFromCompetition() {
    const comp = PAGE_CONFIG.comp || "";
    const div = PAGE_CONFIG.div || "";
    const year = PAGE_CONFIG.year || "";
    const round = PAGE_CONFIG.round || "";
    if (!comp || !div || !year || !round) return [];

    window.__compQuiz = null;
    const scriptPath = `../../../competitions/${comp}/${div}/${year}/${round}/script.js`;
    try {
      await import(scriptPath);
    } catch (e) {
      console.warn("Competition script load failed:", scriptPath, e.message);
      return [];
    }

    const data = window.__compQuiz;
    if (!data?.questions?.length) return [];

    if (data.timeLimit > 0) window.__compTimeLimit = data.timeLimit;

    const imgBase = `../../competitions/${comp}/${div}/${year}/${round}/`;
    return data.questions.map((q) => {
      const opts = q.options || [];
      const ci =
        typeof q.correctIndex === "number"
          ? q.correctIndex
          : typeof q.correct_index === "number"
            ? q.correct_index
            : -1;
      return {
        question: q.question || "",
        options: opts,
        _answer: ci >= 0 && opts[ci] !== undefined ? opts[ci] : null,
        explanation: Array.isArray(q.explanation)
          ? q.explanation.join("\n")
          : q.explanation || "",
        image: q.image
          ? q.image.startsWith("./")
            ? imgBase + q.image.slice(2)
            : q.image
          : "",
        hint: q.hint || "",
        type: q.type || "objective",
        subject: comp,
        examType: comp,
        examYear: year,
      };
    });
  }

  async function loadAndRender() {
    const loadingEl = document.getElementById("loading-state");
    if (loadingEl) loadingEl.style.display = "flex";

    allQuestions = [];

    // CBT source → our own bank. "cbtlocal" serves from /data/cbt/* (0 reads); "cbt" hits the API.
    if (PAGE_CONFIG.source === "cbt" || PAGE_CONFIG.source === "cbtlocal") {
      allQuestions = await loadFromCbt();
      if (loadingEl) loadingEl.style.display = "none";
      if (allQuestions.length === 0) {
        const card = document.getElementById("question-card");
        if (card) {
          card.style.display = "flex";
          card.innerHTML = `<div style="padding:40px;text-align:center">
                    <strong style="font-family:var(--font-display);font-size:15px">No Questions Yet</strong>
                    <p style="font-size:12px;opacity:.6;margin-top:8px">No questions in the bank for this selection yet — check back soon.</p>
                 </div>`;
        }
        return;
      }
      console.log(`Loaded ${allQuestions.length} questions from CBT bank (/api/cbt)`);
      buildDotMap();
      renderQuestion(0);
      const card = document.getElementById("question-card");
      const nav = document.getElementById("nav-bar");
      if (card) card.style.display = "flex";
      if (nav) nav.style.display = "grid";
      showIntroGate(); // watch-first video → hold questions behind a Start button
      return;
    }

    // ALOC / API source → fetch from Firestore-backed endpoint and skip the
    // static per-folder script loading below.
    if (PAGE_CONFIG.source === "aloc" || PAGE_CONFIG.source === "api") {
      allQuestions = await loadFromAloc();
      if (loadingEl) loadingEl.style.display = "none";
      if (allQuestions.length === 0) {
        const card = document.getElementById("question-card");
        if (card) {
          card.style.display = "flex";
          card.innerHTML = `<div style="padding:40px;text-align:center">
                    <strong style="font-family:var(--font-display);font-size:15px">No Questions Found</strong>
                    <p style="font-size:12px;opacity:.6;margin-top:8px">No ${(PAGE_CONFIG.examType || "").toUpperCase()} questions for this selection yet.</p>
                 </div>`;
        }
        return;
      }
      console.log(
        `Loaded ${allQuestions.length} questions from ALOC (/api/questions)`,
      );
      buildDotMap();
      renderQuestion(0);
      const card = document.getElementById("question-card");
      const nav = document.getElementById("nav-bar");
      if (card) card.style.display = "flex";
      if (nav) nav.style.display = "grid";
      return;
    }

    // SAT source → load from the self-hosted OpenSAT bank.
    if (PAGE_CONFIG.source === "sat") {
      allQuestions = await loadFromSat();
      if (loadingEl) loadingEl.style.display = "none";
      if (allQuestions.length === 0) {
        const card = document.getElementById("question-card");
        if (card) {
          card.style.display = "flex";
          card.innerHTML = `<div style="padding:40px;text-align:center">
                    <strong style="font-family:var(--font-display);font-size:15px">No Questions Found</strong>
                    <p style="font-size:12px;opacity:.6;margin-top:8px">Couldn't load the SAT question bank for this selection.</p>
                 </div>`;
        }
        return;
      }
      console.log(`Loaded ${allQuestions.length} SAT questions`);
      buildDotMap();
      renderQuestion(0);
      const card = document.getElementById("question-card");
      const nav = document.getElementById("nav-bar");
      if (card) card.style.display = "flex";
      if (nav) nav.style.display = "grid";
      return;
    }

    // Competition source → dynamically import the round's script.js.
    // The script calls setupQuiz() which stores data in window.__compQuiz.
    if (PAGE_CONFIG.source === "competition") {
      allQuestions = await loadFromCompetition();
      if (loadingEl) loadingEl.style.display = "none";
      if (allQuestions.length === 0) {
        const card = document.getElementById("question-card");
        if (card) {
          card.style.display = "flex";
          card.innerHTML = `<div style="padding:40px;text-align:center">
                    <strong style="font-family:var(--font-display);font-size:15px">No Questions Found</strong>
                    <p style="font-size:12px;opacity:.6;margin-top:8px">Could not load this competition round.</p>
                </div>`;
        }
        return;
      }
      allQuestionsAll = allQuestions.slice();
      const distinctTypes = [...new Set(allQuestionsAll.map((q) => q.type).filter(Boolean))];
      if (distinctTypes.length > 1) injectTypeFilter(distinctTypes);
      console.log(
        `Loaded ${allQuestions.length} questions from competition script`,
      );
      buildDotMap();
      renderQuestion(0);
      const card2 = document.getElementById("question-card");
      const nav2 = document.getElementById("nav-bar");
      if (card2) card2.style.display = "flex";
      if (nav2) nav2.style.display = "grid";
      return;
    }

    const loadedScripts = new Set(); // Track which scripts have been loaded
    const questionMap = new Map(); // Deduplicate by question content

    for (const sub of PAGE_CONFIG.subjects) {
      const subKey = sub.toLowerCase().replace(/\s+/g, "");
      for (const type of PAGE_CONFIG.types) {
        const examFolder = PAGE_CONFIG.examType || "waec";
        const path = `../${examFolder}/${subKey}/${PAGE_CONFIG.year}/${type}.js`;

        // Skip if this exact script path was already loaded
        if (loadedScripts.has(path)) {
          console.log(`Skipping already loaded: ${path}`);
          continue;
        }

        try {
          await injectScript(path);
          loadedScripts.add(path);

          const vName = `${subKey}${type.charAt(0).toUpperCase() + type.slice(1)}`;
          let data;
          try {
            data = window[vName] || eval(vName);
          } catch (_) {}

          if (!data) continue;

          const items =
            type === "objective"
              ? data
              : Array.isArray(data)
                ? data
                : Object.values(data);
          items.forEach((q) => {
            let questionObj;
            if (type === "objective") {
              questionObj = {
                ...q,
                subject: sub,
                type,
                examType: PAGE_CONFIG.examType,
              };
              questionObj._answer = resolveAnswer(questionObj);
            } else {
              if (typeof q === "string") {
                questionObj = {
                  subject: sub,
                  type,
                  examType: PAGE_CONFIG.examType,
                  question: q,
                  _answer: null,
                };
              } else {
                questionObj = {
                  ...q,
                  subject: sub,
                  type,
                  examType: PAGE_CONFIG.examType,
                  _answer: null,
                };
              }
            }

            // Create unique key from question text and type
            const questionText = questionObj.question.trim();
            const key = `${questionText}|${type}`;

            // Only add if not already present
            if (!questionMap.has(key)) {
              questionMap.set(key, questionObj);
            } else {
              console.log(
                `Duplicate avoided: "${questionText.substring(0, 50)}..."`,
              );
            }
          });
        } catch (err) {
          console.warn("Could not load:", path, err.message);
        }
      }
    }

    // Convert Map to array
    allQuestions = Array.from(questionMap.values());
    if (window.__shuffleEnabled) shuffleArr(allQuestions);

    if (loadingEl) loadingEl.style.display = "none";

    if (allQuestions.length === 0) {
      const card = document.getElementById("question-card");
      if (card) {
        card.style.display = "flex";
        card.innerHTML = `<div style="padding:40px;text-align:center">
                <strong style="font-family:var(--font-display);font-size:15px">No Questions Found</strong>
                <p style="font-size:12px;opacity:.6;margin-top:8px">No data for ${PAGE_CONFIG.examType?.toUpperCase() || "selected exam"}.</p>
             </div>`;
      }
      return;
    }

    console.log(
      `Loaded ${allQuestions.length} unique questions from ${loadedScripts.size} script(s)`,
    );

    buildDotMap();
    renderQuestion(0);
    const card = document.getElementById("question-card");
    const nav = document.getElementById("nav-bar");
    if (card) card.style.display = "flex";
    if (nav) nav.style.display = "grid";
  }

  function injectScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // ── Type filter (competition datasets with multiple types) ──
  function injectTypeFilter(types) {
    const existing = document.getElementById("type-filter-bar");
    if (existing) existing.remove();
    const bar = document.createElement("div");
    bar.id = "type-filter-bar";
    ["all", ...types].forEach((t) => {
      const pill = document.createElement("button");
      pill.className = "type-filter-pill" + (t === "all" ? " active" : "");
      pill.dataset.type = t;
      pill.type = "button";
      pill.textContent = t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1);
      pill.addEventListener("click", () => applyTypeFilter(t));
      bar.appendChild(pill);
    });
    const shell = document.querySelector(".quiz-shell");
    const header = document.querySelector(".exam-header");
    if (shell && header) shell.insertBefore(bar, header.nextSibling);
    else if (shell) shell.prepend(bar);
  }

  function applyTypeFilter(type) {
    allQuestions = type === "all"
      ? allQuestionsAll.slice()
      : allQuestionsAll.filter((q) => q.type === type);
    currentIndex = 0;
    userAnswers = {};
    revealed = {};
    submitted = false;
    theoryMarks = {};
    document.querySelectorAll(".type-filter-pill").forEach((p) => {
      p.classList.toggle("active", p.dataset.type === type);
    });
    buildDotMap();
    renderQuestion(0);
  }

  // ── Dot map ──────────────────────────────────────────────
  function buildDotMap() {
    const c = document.getElementById("q-dots");
    if (!c) return;
    c.innerHTML = "";
    allQuestions.forEach((_, i) => {
      const d = document.createElement("button");
      d.className = "q-dot";
      d.title = `Q${i + 1}`;
      d.addEventListener("click", () => renderQuestion(i));
      c.appendChild(d);
    });
    updateDots();
  }

  function updateDots() {
    document.querySelectorAll(".q-dot").forEach((d, i) => {
      d.classList.remove(
        "answered",
        "current",
        "correct",
        "wrong",
        "theory-marked",
      );
      const q = allQuestions[i];
      const chosen = userAnswers[i];
      const ans = q._answer;
      const showResult = submitted || (immediate && revealed[i]);
      if (showResult) {
        if (q.type !== "objective") {
          if (theoryMarks[i]) d.classList.add("theory-marked");
          else if (chosen) d.classList.add("answered");
        } else if (!chosen) {
          // unanswered — grey
        } else if (ans === null) {
          d.classList.add("answered");
        } else if (chosen === ans) {
          d.classList.add("correct");
        } else {
          d.classList.add("wrong");
        }
        // Keep marking the active dot while still in-progress (immediate mode).
        if (!submitted && i === currentIndex) d.classList.add("current");
      } else {
        if (i === currentIndex) d.classList.add("current");
        else if (chosen !== undefined) d.classList.add("answered");
      }
    });
  }

  // ── Image rendering helper ───────────────────────────────
  // Make an inline SVG scale cleanly: guarantee a viewBox (so it has a known
  // aspect ratio), keep it proportional, and drop any hard-coded width/height
  // so the CSS "stage" controls its footprint. This is what lets diagrams of
  // wildly different intrinsic sizes all fit the same box without clipping.
  function normalizeSvg(svg) {
    if (!svg.getAttribute("viewBox")) {
      const w = parseFloat(svg.getAttribute("width"));
      const h = parseFloat(svg.getAttribute("height"));
      if (w > 0 && h > 0) svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    }
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.style.width = "";
    svg.style.height = "";
    svg.style.maxWidth = "100%";
    svg.style.maxHeight = "100%";
    svg.style.display = "block";
  }

  function renderImage(container, imageSrc, altText) {
    container.innerHTML = "";
    if (!imageSrc) return;
    if (typeof imageSrc === "string" && imageSrc.trim().startsWith("<svg")) {
      container.innerHTML = imageSrc;
      const svg = container.querySelector("svg");
      if (svg) normalizeSvg(svg);
    } else {
      const img = document.createElement("img");
      img.className = "q-image";
      img.src = imageSrc;
      img.alt = altText || "";
      container.appendChild(img);
    }
  }

  // ── Video support (YouTube / Vimeo / direct file) ────────
  const ytId = (u) => (String(u).match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/) || [])[1] || null;
  const vimeoId = (u) => (String(u).match(/vimeo\.com\/(?:video\/)?(\d+)/) || [])[1] || null;

  function renderVideo(container, url, scope) {
    container.innerHTML = "";
    if (!url) return;
    const wrap = document.createElement("div");
    wrap.className = "q-video";
    wrap.style.cssText = "margin:.6rem 0; max-width:560px;";
    if (scope === "set") {
      const lbl = document.createElement("div");
      lbl.textContent = "▶ Watch this first";
      lbl.style.cssText = "font-size:.72rem; font-weight:700; margin-bottom:.35rem; color:var(--accent-secondary);";
      wrap.appendChild(lbl);
    }
    const yt = ytId(url), vm = vimeoId(url);
    let media;
    if (yt) {
      media = document.createElement("iframe");
      media.src = "https://www.youtube-nocookie.com/embed/" + yt;
      media.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      media.allowFullscreen = true;
    } else if (vm) {
      media = document.createElement("iframe");
      media.src = "https://player.vimeo.com/video/" + vm;
      media.allow = "autoplay; fullscreen; picture-in-picture";
      media.allowFullscreen = true;
    } else if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) {
      media = document.createElement("video");
      media.src = url; media.controls = true; media.preload = "metadata";
    } else {
      media = document.createElement("iframe");
      media.src = url; media.allowFullscreen = true;
    }
    media.style.cssText = "width:100%; aspect-ratio:16/9; height:auto; border:0; border-radius:12px; background:#000;";
    wrap.appendChild(media);
    // A plain link — shown on print (where the embed can't play) and as a fallback.
    const link = document.createElement("a");
    link.className = "q-video-link";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "▶ Watch video: " + url;
    link.style.cssText = "display:none; margin-top:.35rem; font-size:.8rem; word-break:break-all; color:var(--blue,#0055ff);";
    wrap.appendChild(link);
    container.appendChild(wrap);
  }

  // Lazily create a video container above the question's image.
  function ensureVideoWrap() {
    let w = document.getElementById("q-video-wrap");
    if (!w) {
      w = document.createElement("div");
      w.id = "q-video-wrap";
      const img = document.getElementById("q-image-wrap");
      const txt = document.getElementById("q-text");
      if (img && img.parentNode) img.parentNode.insertBefore(w, img);
      else if (txt && txt.parentNode) txt.parentNode.insertBefore(w, txt.nextSibling);
    }
    return w;
  }

  // Watch-first gate: if the set has intro video(s), show them with a "Start"
  // button and keep the questions hidden until the learner clicks Start.
  function showIntroGate() {
    if (introVideoDone) return false;
    const vids = [...new Set(
      allQuestions.filter((q) => q.videoScope === "set" && q.video).map((q) => q.video)
    )];
    if (!vids.length) return false;
    introVideoDone = true;
    const card = document.getElementById("question-card");
    const nav = document.getElementById("nav-bar");
    let gate = document.getElementById("quiz-intro-gate");
    if (!gate) {
      gate = document.createElement("div");
      gate.id = "quiz-intro-gate";
      gate.className = "question-card"; // reuse the card's styling
      gate.style.cssText = "display:flex; flex-direction:column; gap:.8rem;";
      if (card && card.parentNode) card.parentNode.insertBefore(gate, card);
      else return false;
    }
    gate.innerHTML = "";
    const title = document.createElement("div");
    title.textContent = vids.length > 1 ? "Watch these first" : "Watch this first";
    title.style.cssText = "font-family:var(--font-display); font-size:1rem;";
    gate.appendChild(title);
    vids.forEach((u) => { const c = document.createElement("div"); renderVideo(c, u, "question"); gate.appendChild(c); });
    const start = document.createElement("button");
    start.type = "button";
    start.className = "btn btn-yellow";
    start.textContent = "Start questions →";
    start.style.cssText = "align-self:flex-start;";
    start.onclick = () => {
      gate.remove();
      if (card) card.style.display = "flex";
      if (nav) nav.style.display = "grid";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    gate.appendChild(start);
    // Hide the quiz until Start is clicked.
    if (card) card.style.display = "none";
    if (nav) nav.style.display = "none";
    gate.style.display = "flex";
    return true;
  }

  // ── Render question ──────────────────────────────────────
  function renderQuestion(idx) {
    currentIndex = idx;
    const q = allQuestions[idx];
    const total = allQuestions.length;

    const counterLabel = document.getElementById("q-counter-label");
    const progressFill = document.getElementById("progress-fill");

    // Single counter — lives on the sticky note (the old pill badge is gone).
    if (counterLabel)
      counterLabel.textContent = `Q ${idx + 1} / ${total} · ${q.subject} · ${q.type.toUpperCase()}`;
    if (progressFill)
      progressFill.style.width = `${((idx + 1) / total) * 100}%`;

    const qTextEl = document.getElementById("q-text");
    if (qTextEl) {
      if (q.type === "subjective") {
        // Fill-in-the-blank: render an input inline where the blank sits.
        qTextEl.innerHTML = clozeHtml(q.question, idx);
        const cloze = qTextEl.querySelector("[data-cloze]");
        if (cloze) cloze.addEventListener("input", () => { userAnswers[idx] = cloze.value; updateDots(); });
      } else {
        qTextEl.innerHTML = escFmt(q.question);
      }
    }

    // Per-question videos render inline; the watch-first intro is a separate gate.
    const vidWrap = ensureVideoWrap();
    if (vidWrap) renderVideo(vidWrap, q.videoScope === "set" ? "" : q.video, q.videoScope);

    const imgWrap = document.getElementById("q-image-wrap");
    if (imgWrap) renderImage(imgWrap, q.image, `Q${idx + 1} diagram`);

    // Hint button — only when hints are enabled and the question has one.
    const hintWrap = document.getElementById("q-hint-wrap");
    if (hintWrap) {
      hintWrap.innerHTML = "";
      if (q.hint && window.__hintsEnabled !== false) {
        const hBtn = document.createElement("button");
        hBtn.className = "hint-btn";
        hBtn.type = "button";
        hBtn.textContent = "Show hint";
        const hText = document.createElement("div");
        hText.className = "hint-text";
        hText.innerHTML = escFmt(q.hint);
        hText.hidden = true;
        hBtn.addEventListener("click", () => {
          const open = !hText.hidden;
          hText.hidden = open;
          hBtn.textContent = open ? "Show hint" : "Hide hint";
          if (!open) typesetEl(hText);
        });
        hintWrap.appendChild(hBtn);
        hintWrap.appendChild(hText);
      }
    }

    const optWrap = document.getElementById("q-options");
    if (optWrap) {
      optWrap.innerHTML = "";
      if (q.type === "objective") {
        renderObjectiveOptions(q, idx, optWrap);
      } else {
        renderFreeResponse(q, idx, optWrap);
      }
    }

    renderFeedback(idx);
    updateNavButtons(idx, total);
    updateDots();

    const card = document.getElementById("question-card");
    const strip = document.getElementById("feedback-strip");
    if (card) typesetEl(card);
    if (strip) typesetEl(strip);

    // Let other features (e.g. the GM solver FAB) react to the new question.
    window.dispatchEvent(new CustomEvent("quiz:questionRendered", { detail: { idx } }));
  }

  function renderObjectiveOptions(q, idx, optWrap) {
    const grid = document.createElement("div");
    grid.className = "options-grid";
    const letters = ["A", "B", "C", "D", "E"];
    // Lock + reveal when the paper is submitted, or in immediate-feedback
    // mode once this question has been answered.
    const locked = submitted || (immediate && revealed[idx]);
    (q.options || []).forEach((opt, oi) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      if (locked) {
        btn.disabled = true;
        if (q._answer !== null && opt === q._answer)
          btn.classList.add("correct-ans");
        else if (userAnswers[idx] === opt) btn.classList.add("wrong-ans");
      } else if (userAnswers[idx] === opt) {
        btn.classList.add("selected");
      }
      btn.innerHTML = `<span class="opt-letter">${letters[oi] || oi + 1}</span><span>${escFmt(opt)}</span>`;
      btn.addEventListener("click", () => selectOption(opt, btn, grid, idx));
      grid.appendChild(btn);
    });
    optWrap.appendChild(grid);

    if (!locked && q.hint) {
      const h = document.createElement("div");
      h.className = "hint-row";

      const lbl = document.createElement("button");
      lbl.type = "button";
      lbl.className = "hint-lbl";
      lbl.textContent = "Hint";
      lbl.setAttribute("aria-expanded", "false");

      const body = document.createElement("span");
      body.className = "hint-body";
      body.innerHTML = escFmt(q.hint);
      body.hidden = true;

      lbl.addEventListener("click", () => {
        const opening = body.hidden;
        body.hidden = !opening;
        lbl.setAttribute("aria-expanded", String(opening));
        h.classList.toggle("hint-row--open", opening);
      });

      h.appendChild(lbl);
      h.appendChild(body);
      optWrap.appendChild(h);
    }
  }

  // Stop the browser/password-managers autofilling email/name into answer fields.
  function noAutofill(el, idx) {
    el.autocomplete = "off";
    el.name = "ans-" + idx + "-" + Math.random().toString(36).slice(2, 7);
    el.setAttribute("autocorrect", "off");
    el.setAttribute("autocapitalize", "off");
    el.spellcheck = false;
    el.setAttribute("data-lpignore", "true");
    el.setAttribute("data-1p-ignore", "true");
    el.setAttribute("data-form-type", "other");
  }
  const ATTRS = `autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore="true" data-form-type="other"`;

  // Build question HTML with an inline input where the blank (____ or [blank]) is.
  function clozeHtml(question, idx) {
    const locked = submitted || (immediate && revealed[idx]);
    const inputHtml = `<input type="text" data-cloze="${idx}" name="cz-${idx}-${Math.random().toString(36).slice(2, 7)}" ${ATTRS} value="${esc(userAnswers[idx] || "")}"${locked ? " disabled" : ""} style="display:inline-block;min-width:120px;padding:2px 8px;border:none;border-bottom:2px solid var(--blue,#0055ff);background:transparent;font-family:inherit;font-size:inherit;color:inherit;" />`;
    const q = String(question || "");
    const m = q.match(/_{2,}|\[\s*blank\s*\]|\.{3,}/i);
    if (!m) return escFmt(q) + " " + inputHtml; // no marker → input at the end
    return escFmt(q.slice(0, m.index)) + inputHtml + escFmt(q.slice(m.index + m[0].length));
  }

  function renderFreeResponse(q, idx, optWrap) {
    // Lock the input once submitted, or (immediate mode) once this answer has
    // been marked. The cloze input for subjective is handled in renderQuestion.
    const locked = submitted || (immediate && revealed[idx]);
    if (q.type === "short") {
      // A word or short phrase → a single-line input.
      const inp = document.createElement("input");
      inp.type = "text";
      inp.className = "short-box";
      inp.placeholder = "Your answer…";
      noAutofill(inp, idx);
      // A writing LINE, not a box.
      inp.style.cssText = "width:100%;max-width:360px;box-sizing:border-box;padding:6px 2px;border:none;border-bottom:2px solid color-mix(in srgb, var(--ink) 45%, transparent);border-radius:0;background:transparent;font-family:inherit;font-size:15px;color:inherit;outline:none;";
      inp.value = userAnswers[idx] || "";
      if (locked) inp.disabled = true;
      inp.addEventListener("input", () => { userAnswers[idx] = inp.value; updateDots(); });
      optWrap.appendChild(inp);
    } else if (q.type !== "subjective") {
      // theory / essay → a textarea (subjective's input is inline in the question).
      const ta = document.createElement("textarea");
      ta.className = "theory-box";
      ta.placeholder = "Write your answer here…";
      noAutofill(ta, idx);
      ta.value = userAnswers[idx] || "";
      if (locked) ta.disabled = true;
      ta.addEventListener("input", () => {
        userAnswers[idx] = ta.value;
        updateDots();
      });
      optWrap.appendChild(ta);
    }

    // Immediate mode: a "Mark answer" button so free-response is graded BEFORE
    // moving on (objective questions reveal on pick; these need an explicit step).
    if (immediate && !submitted && !revealed[idx]) {
      const markBtn = document.createElement("button");
      markBtn.type = "button";
      markBtn.className = "btn btn-yellow free-mark-btn";
      markBtn.textContent = "Mark answer";
      markBtn.style.cssText = "margin-top:12px;";
      markBtn.addEventListener("click", () => markFreeResponseNow(idx, markBtn));
      optWrap.appendChild(markBtn);
    }

    const showMark = submitted || (immediate && revealed[idx]);
    if (showMark && theoryMarks[idx]) {
      const m = theoryMarks[idx];
      const mEl = document.createElement("div");
      mEl.style.cssText =
        "margin-top:12px;padding:12px;border:2px solid var(--blue);background:rgba(0,85,255,.05)";
      mEl.innerHTML = `
                <div class="theory-score-badge">AI Mark: ${m.score}/${m.outOf}</div>
                <div class="theory-mark-text">${esc(m.feedback)}</div>`;
      optWrap.appendChild(mEl);
    } else if (showMark && userAnswers[idx]) {
      const sp = document.createElement("div");
      sp.className = "ai-marking-row";
      sp.innerHTML = `<div class="ai-spin"></div>AI Marking…`;
      optWrap.appendChild(sp);
    }
  }

  // Immediate-mode: mark a single free-response answer, lock it, then reveal the
  // score + model answer (and optionally auto-advance, like objective questions).
  async function markFreeResponseNow(idx, btn) {
    const q = allQuestions[idx];
    const answer = (userAnswers[idx] || "").trim();
    if (!answer) { setStatusBtn(btn, "Type an answer first"); return; }
    revealed[idx] = true;
    if (btn) { btn.disabled = true; btn.textContent = "Marking…"; }
    try {
      theoryMarks[idx] = await markTheory(q.question, answer, q.markScheme || q._answer || "", q.type);
    } catch (e) {
      console.warn(`Immediate marking Q${idx + 1}:`, e.message);
    }
    renderQuestion(idx);
    if (window.__autoAdvance && idx < allQuestions.length - 1) {
      setTimeout(() => navigate(1), 1600);
    }
  }

  function setStatusBtn(btn, msg) {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(() => { btn.textContent = orig; }, 1500);
  }

  function updateNavButtons(idx, total) {
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const submitBtn = document.getElementById("submit-btn");

    if (prevBtn) prevBtn.disabled = idx === 0;
    const isLast = idx === total - 1;
    if (nextBtn) nextBtn.style.display = isLast ? "none" : "inline-flex";
    if (submitBtn) submitBtn.style.display = isLast ? "inline-flex" : "none";
  }

  function renderFeedback(idx) {
    const strip = document.getElementById("feedback-strip");
    const label = document.getElementById("feedback-label");
    const expl = document.getElementById("feedback-expl");
    const acts = document.getElementById("feedback-actions");
    const q = allQuestions[idx];
    const ans = q._answer;

    if (!strip) return;
    strip.className = "feedback-strip";
    if (expl) expl.innerHTML = "";
    if (acts) acts.innerHTML = "";

    // Show feedback at submit, or instantly (immediate mode) once answered.
    // Free-response is revealed too — its mark/model-answer show once marked.
    const reveal = submitted || (immediate && revealed[idx]);
    if (!reveal) return;

    function buildExpl(raw) {
      if (!raw) return "";
      const lines = Array.isArray(raw) ? raw : [raw];
      return lines.map((l) => `<p class="expl-line">${escFmt(l)}</p>`).join("");
    }

    if (q.type !== "objective") {
      const mark = theoryMarks[idx];
      let html = "";
      if (mark) {
        strip.classList.add("neutral");
        if (label) label.textContent = `AI Mark: ${mark.score}/${mark.outOf}`;
        html += `<p class="expl-line">${esc(mark.feedback)}</p>`;
      } else if (userAnswers[idx]) {
        strip.classList.add("neutral");
        if (label) label.textContent = "Theory — marking…";
      } else {
        strip.classList.add("wrong");
        if (label) label.textContent = "No answer submitted.";
      }
      // Always reveal the model answer + explanation for self-study.
      if (ans) html += `<p class="expl-line">Model answer: <strong>${escFmt(ans)}</strong></p>`;
      html += buildExpl(q.explanation);
      if (expl) expl.innerHTML = html;
      return;
    }

    const chosen = userAnswers[idx];
    if (!chosen) {
      strip.classList.add("wrong");
      if (label) label.textContent = "Not answered.";
      if (expl)
        expl.innerHTML = ans
          ? `<p class="expl-line">Correct answer: <strong>${escFmt(ans)}</strong></p>` +
            buildExpl(q.explanation)
          : '<p class="expl-line">No answer key for this question.</p>';
    } else if (ans === null) {
      strip.classList.add("neutral");
      if (label) label.textContent = `You selected: ${chosen}`;
      if (expl)
        expl.innerHTML =
          '<p class="expl-line">No answer key — cannot verify.</p>';
    } else if (chosen === ans) {
      strip.classList.add("correct");
      if (label) label.textContent = "Correct!";
      if (expl) expl.innerHTML = buildExpl(q.explanation);
    } else {
      strip.classList.add("wrong");
      if (label) label.textContent = `Wrong — you chose: ${chosen}`;
      if (expl)
        expl.innerHTML =
          `<p class="expl-line">Correct answer: <strong>${escFmt(ans)}</strong></p>` +
          buildExpl(q.explanation);
    }

    // Offer an animated walkthrough for science questions (graph + steps
    // for linear equations, otherwise the explanation revealed step by
    // step). All the heavy lifting lives in animator.js.
    if (acts && window.MathAnimator) window.MathAnimator.mountButton(acts, q);
  }

  function selectOption(opt, btn, grid, idx) {
    if (submitted) return;
    if (immediate && revealed[idx]) return; // already answered & locked
    grid
      .querySelectorAll(".option-btn")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    userAnswers[idx] = opt;
    if (immediate) {
      // Lock the question and re-render so the correct/wrong styling and the
      // feedback strip (with explanation) appear right away.
      revealed[idx] = true;
      renderQuestion(idx);
      if (window.__autoAdvance && idx < allQuestions.length - 1) {
        setTimeout(() => navigate(1), 1400);
      }
      return;
    }
    updateDots();
  }

  function navigate(delta) {
    const n = currentIndex + delta;
    if (n < 0 || n >= allQuestions.length) return;
    renderQuestion(n);
  }

  function goTo(idx) {
    if (idx < 0 || idx >= allQuestions.length) return;
    renderQuestion(idx);
  }

  function confirmSubmit() {
    const answered = Object.keys(userAnswers).filter(
      (k) => userAnswers[k] !== undefined && userAnswers[k] !== "",
    ).length;
    const total = allQuestions.length;
    const confirmBody = document.getElementById("confirm-body");
    if (confirmBody) {
      confirmBody.textContent =
        `You have answered ${answered} of ${total} questions.` +
        (answered < total
          ? ` ${total - answered} unanswered will be skipped.`
          : " Ready to submit?");
    }
    const overlay = document.getElementById("pp-confirm-overlay");
    if (overlay) overlay.classList.add("open");
  }

  function closeConfirm() {
    const overlay = document.getElementById("pp-confirm-overlay");
    if (overlay) overlay.classList.remove("open");
  }

  async function submit() {
    closeConfirm();
    submitted = true;
    renderQuestion(currentIndex);
    const sb = document.getElementById("submit-btn");
    if (sb) {
      sb.disabled = true;
      sb.textContent = "Submitted";
    }
    await runTheoryMarking();
    showResults();
  }

  async function runTheoryMarking() {
    for (let i = 0; i < allQuestions.length; i++) {
      const q = allQuestions[i];
      if (!isFree(q.type)) continue;
      const answer = userAnswers[i] || "";
      if (!answer.trim()) continue;
      if (theoryMarks[i]) continue; // already marked (e.g. in immediate mode)
      try {
        const result = await markTheory(q.question, answer, q.markScheme || q._answer || "", q.type);
        theoryMarks[i] = result;
        updateDots();
        if (currentIndex === i) renderQuestion(i);
        updateReviewTheoryItem(i, result);
      } catch (e) {
        console.warn(`Theory marking Q${i + 1}:`, e.message);
      }
    }
  }

  function updateReviewTheoryItem(idx, mark) {
    const el = document.getElementById(`review-theory-mark-${idx}`);
    if (!el) return;
    el.innerHTML = `
            <div class="theory-score-badge">AI Mark: ${mark.score}/${mark.outOf}</div>
            <div class="theory-mark-text">${esc(mark.feedback)}</div>`;
    typesetEl(el);
  }

  function showResults() {
    const quizScreen = document.getElementById("quiz-screen");
    const resultsScreen = document.getElementById("results-screen");
    if (quizScreen) quizScreen.style.display = "none";
    if (resultsScreen) resultsScreen.style.display = "flex";

    if (typeof PrepBot !== "undefined" && PrepBot.hideFAB) PrepBot.hideFAB();

    let correct = 0,
      wrong = 0,
      skipped = 0;
    const scorable = allQuestions.filter(
      (q) => q.type === "objective" && q._answer !== null,
    );

    allQuestions.forEach((q, i) => {
      if (q.type !== "objective") return;
      const chosen = userAnswers[i];
      const ans = q._answer;
      if (!chosen) skipped++;
      else if (ans === null) {
        /* no key */
      } else if (chosen === ans) correct++;
      else wrong++;
    });

    const pct =
      scorable.length > 0 ? Math.round((correct / scorable.length) * 100) : 0;
    const scoreEl = document.getElementById("res-score");
    const correctEl = document.getElementById("res-correct");
    const wrongEl = document.getElementById("res-wrong");
    const skippedEl = document.getElementById("res-skipped");
    const gradeEl = document.getElementById("res-grade");

    if (scoreEl) scoreEl.textContent = scorable.length > 0 ? `${pct}%` : "N/A";
    if (correctEl) correctEl.textContent = correct;
    if (wrongEl) wrongEl.textContent = wrong;
    if (skippedEl) skippedEl.textContent = skipped;

    let grade = "No answer key.";
    if (scorable.length > 0) {
      if (pct >= 80) grade = "Distinction — Excellent work!";
      else if (pct >= 65) grade = "Credit — Well done.";
      else if (pct >= 50) grade = "Pass — Keep working.";
      else grade = "Fail — Keep practising.";
    }
    if (gradeEl) gradeEl.textContent = grade;

    buildReviewList();
  }

  function buildReviewList() {
    const el = document.getElementById("review-list");
    if (!el) return;
    el.innerHTML = "";

    allQuestions.forEach((q, i) => {
      const chosen = userAnswers[i];
      const ans = q._answer;
      const item = document.createElement("div");
      item.className = "review-item";

      const numEl = document.createElement("div");
      numEl.className = "review-q-num";
      numEl.textContent = i + 1;

      const body = document.createElement("div");
      body.className = "review-body";

      const qTxt = document.createElement("div");
      qTxt.className = "review-q-text";
      qTxt.innerHTML = escFmt(q.question);
      body.appendChild(qTxt);

      if (q.video) {
        const vidDiv = document.createElement("div");
        vidDiv.className = "review-video-wrap";
        body.appendChild(vidDiv);
        renderVideo(vidDiv, q.video, q.videoScope);
      }

      if (q.image) {
        const imgDiv = document.createElement("div");
        imgDiv.className = "review-img-wrap";
        body.appendChild(imgDiv);
        renderImage(imgDiv, q.image, `Q${i + 1}`);
      }

      const ansEl = document.createElement("div");
      ansEl.className = "review-ans";

      if (q.type === "objective") {
        if (!chosen) {
          numEl.classList.add("rq-skip");
          ansEl.textContent = ans
            ? `Not answered — Correct: ${ans}`
            : "Not answered";
        } else if (ans === null) {
          numEl.classList.add("rq-skip");
          ansEl.textContent = `You: ${chosen}  |  No key`;
        } else if (chosen === ans) {
          numEl.classList.add("rq-ok");
          ansEl.classList.add("ok");
          ansEl.textContent = `Correct: ${chosen}`;
        } else {
          numEl.classList.add("rq-bad");
          ansEl.classList.add("bad");
          ansEl.innerHTML = `You: <strong>${escFmt(chosen)}</strong>  |  Correct: <strong>${escFmt(ans)}</strong>`;
        }
        body.appendChild(ansEl);

        if (q.explanation) {
          const explEl = document.createElement("div");
          explEl.className = "review-expl";
          const lines = Array.isArray(q.explanation)
            ? q.explanation
            : [q.explanation];
          explEl.innerHTML = lines
            .map((l) => `<p class="expl-line">${escFmt(l)}</p>`)
            .join("");
          body.appendChild(explEl);
        }
      } else {
        numEl.classList.add(chosen ? "rq-ai" : "rq-skip");
        ansEl.classList.add("ai");
        if (chosen) {
          ansEl.textContent = `Answer: ${chosen.length > 120 ? chosen.slice(0, 120) + "…" : chosen}`;
        } else {
          ansEl.textContent = "Theory — not answered";
        }
        body.appendChild(ansEl);

        const markEl = document.createElement("div");
        markEl.id = `review-theory-mark-${i}`;
        if (theoryMarks[i]) {
          const m = theoryMarks[i];
          markEl.innerHTML = `
                        <div class="theory-score-badge">AI Mark: ${m.score}/${m.outOf}</div>
                        <div class="theory-mark-text">${esc(m.feedback)}</div>`;
        } else if (chosen) {
          markEl.innerHTML = `<div class="ai-marking-row"><div class="ai-spin"></div>Marking…</div>`;
        }
        body.appendChild(markEl);
      }

      item.appendChild(numEl);
      item.appendChild(body);
      el.appendChild(item);
    });

    typesetEl(el);
  }

  function printResults() {
    const reviewEl = document.getElementById("review-list");
    if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
      MathJax.typesetClear([reviewEl]);
      MathJax.typesetPromise([reviewEl])
        .then(() => window.print())
        .catch(() => window.print());
    } else {
      window.print();
    }
  }

  function retake() {
    userAnswers = {};
    theoryMarks = {};
    revealed = {};
    currentIndex = 0;
    submitted = false;

    const resultsScreen = document.getElementById("results-screen");
    const quizScreen = document.getElementById("quiz-screen");
    if (resultsScreen) resultsScreen.style.display = "none";
    if (quizScreen) quizScreen.style.display = "flex";

    const sb = document.getElementById("submit-btn");
    if (sb) {
      sb.disabled = false;
      sb.innerHTML = `Submit <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6h8M7 3l3 3-3 3"/></svg>`;
    }

    if (typeof PrepBot !== "undefined" && PrepBot.showFAB) PrepBot.showFAB();

    buildDotMap();
    renderQuestion(0);
  }

  function getState() {
    return { allQuestions, currentIndex, userAnswers, submitted };
  }

  return {
    init,
    navigate,
    goTo,
    getState,
    confirmSubmit,
    closeConfirm,
    submit,
    retake,
    print: printResults,
  };
})();

// Initialization is handled by main.js after DOMContentLoaded.
