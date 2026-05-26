import chatbotcss from "./prepbotcss.js";

import { auth } from "/firebase-init.js";

(function () {
  /* ── 1. STYLE INJECTION ── */
  (function injectStyles() {
    const style = document.createElement("style");
    style.id = "prepbot-core-styles";
    style.textContent = chatbotcss;
    document.head.appendChild(style);
  })();

  /* ── 2. CONFIG ── */
  const BOT_NAME = "PrepBot";
  const API_CHAT_URL = "/api/ai/chat";
  const API_YOUTUBE_URL = "/api/ai/youtube";
  let botReady = false;

  /* ── 3. QUIZ DATA BRIDGE ─────────────────────────────────────────
   * Normalises quiz data from two sources:
   *   A) window.__prepbotQuizData  (modern pages — exam/quiz runners)
   *   B) window.Quiz.getState()   (legacy question.html / quiz-engine)
   * Returns a unified object or null.
   * ────────────────────────────────────────────────────────────── */
  const LETTERS = ["A", "B", "C", "D", "E"];

  function getQuizData() {
    if (window.__prepbotQuizData && window.__prepbotQuizData.length > 0) {
      return {
        questions: window.__prepbotQuizData,
        currentIndex: window.__prepbotCurrentQuestionIndex || 0,
        userAnswers: [],
        submitted: false,
        goTo: window.__prepbotJumpToQuestion || null,
        source: "modern",
      };
    }

    if (window.Quiz && typeof window.Quiz.getState === "function") {
      const s = window.Quiz.getState();
      if (s && s.allQuestions && s.allQuestions.length > 0) {
        const questions = s.allQuestions.map((q) => ({
          question: q.question,
          options: q.options || [],
          correctIndex: q._answer
            ? LETTERS.indexOf(q._answer.toUpperCase())
            : -1,
          _answer: q._answer || null,
          type: q.type,
          explanation: Array.isArray(q.explanation)
            ? q.explanation.join("\n")
            : q.explanation || "",
          solutions: "",
          hint: "",
        }));
        return {
          questions,
          currentIndex: s.currentIndex || 0,
          userAnswers: s.userAnswers || [],
          submitted: s.submitted || false,
          goTo: window.Quiz.goTo ? (i) => window.Quiz.goTo(i) : null,
          source: "legacy",
        };
      }
    }

    return null;
  }

  /* ── 4. READY HANDLERS ── */
  function isKeySet() {
    return botReady;
  }

  function onKeyReady() {
    botReady = true;

    const messagesEl = document.getElementById("chat-messages");
    if (messagesEl) {
      messagesEl.innerHTML =
        '<div class="chat-intro-card"><div class="intro-label">SYSTEM READY</div><p>I am reading the page with you. Ask about the current question, navigate to a number, or use the Mic to talk.</p></div>';
    }

    const inp = document.getElementById("chat-input");
    const sndBtn = document.getElementById("chat-send");
    const micB = document.getElementById("chat-mic");
    if (inp) inp.disabled = false;
    if (sndBtn) sndBtn.disabled = false;
    if (micB) micB.disabled = false;

    const qd = getQuizData();
    if (qd && qd.source === "legacy") {
      renderActionPills();
      // Patch Quiz.goTo once so navigation always refreshes action pills
      if (window.Quiz?.goTo && !window.Quiz._prepbotPatched) {
        const orig = window.Quiz.goTo;
        window.Quiz.goTo = function (i) {
          orig(i);
          window.dispatchEvent(new CustomEvent("prepbot:quizUpdated"));
        };
        window.Quiz._prepbotPatched = true;
      }
    } else {
      addQuizNavigationPill();
      updateQuizNavigationPill();
    }
    startNudgeInterval();
  }

  function showNoKeyMessage() {
    const messagesEl = document.getElementById("chat-messages");
    if (!messagesEl) return;
    messagesEl.innerHTML = `
      <div class="chat-intro-card" style="display:flex;flex-direction:column;gap:14px">
        <div class="intro-label">SIGN IN REQUIRED</div>
        <p style="margin:0;font-size:13px;line-height:1.6">
          Please <strong>sign in</strong> to use PrepBot.<br><br>
          Once signed in, PrepBot is powered by AI — no extra API key needed.
        </p>
        <button id="retry-key-check" type="button"
          style="margin-top:8px;padding:8px 16px;border:2px solid var(--ink,#1f1f1f);background:var(--yellow,#ffe500);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;border-radius:4px;">
          I've Signed In — Retry
        </button>
      </div>`;
    document.getElementById("retry-key-check")?.addEventListener("click", () => {
      initializePrepBot();
    });
  }

  /* ── 5. INIT ── */
  async function initializePrepBot() {
    if (botReady) return;

    await new Promise((resolve) => {
      if (auth.currentUser) return resolve();
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
      setTimeout(resolve, 5000);
    });

    if (auth.currentUser) {
      onKeyReady();
    } else {
      showNoKeyMessage();
    }
  }

  /* ── 6. SITE MAP — non-quiz nudges ── */
  const SITE_MAP = [
    {
      match: (p) => p === "/" || p === "/index.html",
      title: "Home",
      nudges: [
        "Select an exam category to begin your preparation.",
        "Browse available quiz sets or visit the Math Hub.",
        "Not sure where to start? I can guide you to the right section.",
      ],
    },
    {
      match: (p) => p.includes("waec"),
      title: "WAEC",
      nudges: [
        "WAEC questions follow predictable patterns. I can walk you through any topic.",
        "Working on WAEC prep? Ask me to explain a concept or break down past questions.",
        "Need a summary of key WAEC topics for this subject? Just ask.",
      ],
    },
    {
      match: (p) => p.includes("jamb") || p.includes("utme"),
      title: "JAMB / UTME",
      nudges: [
        "JAMB questions test speed and accuracy. Want a quick drill on any topic?",
        "Preparing for UTME? I can help you revise core concepts fast.",
        "Ask me to generate practice questions or explain any JAMB topic.",
      ],
    },
    {
      match: (p) => p.includes("igcse"),
      title: "IGCSE",
      nudges: [
        "IGCSE marking relies on key terms. I can help you use the right language.",
        "Revising for IGCSE? Ask me to explain any concept with worked examples.",
      ],
    },
    {
      match: (p) =>
        p.includes("cambridge") || p.includes("a-level") || p.includes("alevel"),
      title: "Cambridge A-Level",
      nudges: [
        "Cambridge A-Level demands deep understanding. I can unpack any concept.",
        "Ask me for a structured revision plan or topic explanation.",
        "Need model answers or mark scheme guidance? I can help.",
      ],
    },
    {
      match: (p) => p.includes("common-entrance") || p.includes("entrance"),
      title: "Common Entrance",
      nudges: [
        "Common Entrance needs solid basics. Ask me to explain any topic simply.",
        "Working through Common Entrance prep? I can guide you step by step.",
      ],
    },
    {
      match: (p) =>
        p.includes("math-hub") || p.includes("maths") || p.includes("mathematics"),
      title: "Math Hub",
      nudges: [
        "The Math Hub has tools, games, and videos. Want a guided tour?",
        "Stuck on a concept? Ask me and I will give a worked example.",
      ],
    },
    {
      match: (p) => p.includes("theory") || p.includes("essay"),
      title: "Theory Practice",
      nudges: [
        "Theory questions reward structure. Ask me to review your approach.",
        "Want model answer structure for any theory question? Just ask.",
        "I can mark a draft answer or suggest how to improve your response.",
      ],
    },
  ];

  const FALLBACK_CHIPS = ["Explain More", "Give Example", "Summarize"];

  let lastSuggestionIndex = -1;
  let suggestionHistory = [];
  let currentPopupTimeout = null;
  let lastBotReply = "";
  let lastUserMessage = "";

  /* ── 7. PAGE CONTEXT ── */
  function getPageContext() {
    const qd = getQuizData();

    if (qd && qd.questions.length > 0) {
      const q = qd.questions[qd.currentIndex];
      const opts = (q.options || [])
        .map((o, i) => `${LETTERS[i] || i + 1}. ${o}`)
        .join("\n");

      let solutionsText = "";
      if (q.solutions) {
        solutionsText = Array.isArray(q.solutions)
          ? q.solutions.map((s, i) => `Step ${i + 1}: ${s}`).join("\n")
          : q.solutions;
      }

      let explanationText = q.explanation || "";
      if (Array.isArray(explanationText)) {
        explanationText = explanationText
          .map((s, i) => `Step ${i + 1}: ${s}`)
          .join("\n");
      }

      return {
        mode: "quiz",
        qNum: qd.currentIndex + 1,
        totalQs: qd.questions.length,
        title: `Question ${qd.currentIndex + 1}`,
        content: `Active Quiz Question: ${q.question}\nOptions:\n${opts}`,
        explanation: explanationText,
        questionText: q.question,
        hint: q.hint || "",
        solutions: solutionsText,
        correctIndex: q.correctIndex,
        correctAnswer: q._answer || null,
        options: q.options,
        fullData: q,
      };
    }

    const selectors = ["main", "article", ".study-content", ".content"];
    let scrapedText = "";
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const clone = el.cloneNode(true);
        clone.querySelectorAll("#prepbot, script, style").forEach((n) => n.remove());
        scrapedText = clone.innerText.replace(/\s+/g, " ").trim();
        break;
      }
    }
    return {
      mode: "study",
      title: document.querySelector("h1")?.innerText || "this lesson",
      content: scrapedText.substring(0, 3000),
      explanation: "",
      totalQs: 0,
      qNum: 0,
      questionText: "",
      hint: "",
      solutions: "",
      correctIndex: -1,
      correctAnswer: null,
      options: [],
      fullData: null,
    };
  }

  function getPageMeta() {
    return {
      title: document.title || "",
      h1: document.querySelector("h1")?.innerText?.trim() || "",
      description: document.querySelector('meta[name="description"]')?.content || "",
      path: window.location.pathname.toLowerCase(),
    };
  }

  function getNonQuizNudge() {
    const meta = getPageMeta();
    const entry = SITE_MAP.find((e) => e.match(meta.path));
    if (entry) {
      const nudge = entry.nudges[Math.floor(Math.random() * entry.nudges.length)];
      return { text: nudge, prompt: nudge };
    }
    const topic =
      meta.h1 || meta.title.split("|")[0].split("-")[0].trim() || "this section";
    const text = `Need help understanding ${topic}? I am reading this page with you.`;
    return { text, prompt: `Help me understand this page: ${topic}` };
  }

  /* ── 8. INJECT HTML ── */
  const mount = document.getElementById("prepbot");
  if (!mount) return;

  mount.innerHTML = `
    <div id="chat-fab-wrap">
      <button id="chat-fab" title="Open AI Assistant">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="fab-dot"></span>
      </button>
      <button id="chat-fab-dismiss">×</button>
    </div>
    <div id="prepbot-popup"><button class="prepbot-popup-close" id="prepbot-popup-close">×</button><p id="prepbot-popup-text"></p></div>
    <button id="chat-fab-restore" title="Show AI"><span>AI</span></button>

    <div id="chat-window" role="dialog">
      <div class="chat-header">
        <div class="chat-header-left">
          <div class="chat-avatar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="chat-header-info"><h4>${BOT_NAME}</h4><div class="chat-status"><span class="chat-status-dot"></span><span>AI & Voice Synced</span></div></div>
        </div>
        <div class="chat-header-actions">
          <button class="chat-icon-btn" id="chat-clear-btn" title="Clear Chat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
          <button class="chat-icon-btn" id="chat-close">×</button>
        </div>
      </div>

      <div class="chat-context-banner" id="chat-context-banner">
        <span class="chat-context-label">Current Question</span>
        <span id="chat-context-text"></span>
        <button class="chat-context-clear" id="chat-context-clear" title="Clear context">×</button>
      </div>

      <div class="quiz-nav-bar" id="quiz-nav-bar" style="display:none">
        <button class="quiz-nav-btn" id="quiz-nav-prev">← Prev</button>
        <div class="quiz-nav-info">
          <span id="quiz-nav-current">1</span> / <span id="quiz-nav-total">0</span>
        </div>
        <button class="quiz-nav-btn" id="quiz-nav-next">Next →</button>
      </div>

      <div class="qbubbles-bar" id="qbubbles-bar" style="display:none">
        <div class="qbubbles-header"><span class="qbubbles-title">Quiz Navigation</span><button class="qbubbles-close" id="qbubbles-close">×</button></div>
        <div class="qbubbles-grid" id="qbubbles-grid"></div>
      </div>

      <div class="chat-messages" id="chat-messages">
        <div class="chat-intro-card">
          <div class="intro-label">LOADING</div>
          <p>Checking sign-in status…</p>
        </div>
      </div>
      <div class="chat-suggestions" id="chat-suggestions"></div>
      <div class="chat-input-row">
        <div class="chat-input-wrap"><textarea id="chat-input" rows="1" placeholder="Type or click Mic..." disabled></textarea></div>
        <button id="chat-mic" title="Voice Input" disabled>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>
        <button id="chat-send" disabled>
          <svg class="send-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          <div class="send-spinner"></div>
        </button>
      </div>
      <div class="chat-clear-bar" id="chat-clear-bar">
        <span>Clear history</span>
        <div class="chat-clear-bar-actions"><button id="clear-cancel">No</button><button id="clear-confirm">Clear</button></div>
      </div>
    </div>
  `;

  /* ── 9. REFS & STATE ── */
  const win = document.getElementById("chat-window"),
    fabWrap = document.getElementById("chat-fab-wrap"),
    input = document.getElementById("chat-input"),
    messages = document.getElementById("chat-messages"),
    sendBtn = document.getElementById("chat-send"),
    micBtn = document.getElementById("chat-mic"),
    qbBar = document.getElementById("qbubbles-bar"),
    qbGrid = document.getElementById("qbubbles-grid"),
    popup = document.getElementById("prepbot-popup"),
    popupText = document.getElementById("prepbot-popup-text"),
    suggBox = document.getElementById("chat-suggestions"),
    quizNavBar = document.getElementById("quiz-nav-bar"),
    quizNavPrev = document.getElementById("quiz-nav-prev"),
    quizNavNext = document.getElementById("quiz-nav-next"),
    quizNavCurrent = document.getElementById("quiz-nav-current"),
    quizNavTotal = document.getElementById("quiz-nav-total");

  let isBusy = false,
    history = [],
    currentNudgePrompt = "",
    currentNudgeDisplayText = "",
    synth = window.speechSynthesis,
    recognition = null,
    nudgeInterval = null,
    nudgeStepCounter = 0,
    lastQuestionId = null,
    questionStartTime = null,
    userProficiency = "beginner";

  /* ── 10. VOICE ── */
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "en-NG";
    recognition.onstart = () => micBtn.classList.add("mic-active");
    recognition.onend = () => micBtn.classList.remove("mic-active");
    recognition.onresult = (e) => {
      input.value = e.results[0][0].transcript;
      sendMessage();
    };
  }

  function speak(text, btn) {
    synth.cancel();
    const cleanText = text.replace(/\\\(|\\\)|\\\[|\\\]/g, "");
    const utter = new SpeechSynthesisUtterance(cleanText);
    const wave = document.createElement("div");
    wave.className = "soundwave";
    wave.innerHTML = "<span></span><span></span><span></span>";
    utter.onstart = () => btn.appendChild(wave);
    utter.onend = () => wave.remove();
    synth.speak(utter);
  }

  /* ── 11. SOLUTION STEPS ── */
  function getSolutionSteps(questionData) {
    if (!questionData) return [];
    let steps = [];
    for (const key of ["solutions", "explanation", "solutionSteps"]) {
      if (!questionData[key]) continue;
      steps = Array.isArray(questionData[key])
        ? questionData[key]
        : questionData[key].split("\n").filter((s) => s.trim());
      if (steps.length > 0) break;
    }
    return steps.filter((s) => s.length > 0);
  }

  /* ── 12. PROGRESSIVE HINT ── */
  function generateProgressiveHint() {
    const qd = getQuizData();
    if (!qd || !qd.questions.length) return null;

    const q = qd.questions[qd.currentIndex];
    const questionId = `${qd.currentIndex}_${q.question.substring(0, 50)}`;

    if (lastQuestionId !== questionId) {
      lastQuestionId = questionId;
      nudgeStepCounter = 0;
      questionStartTime = Date.now();
      suggestionHistory = [];
    }

    const timeSpent = questionStartTime
      ? Math.floor((Date.now() - questionStartTime) / 1000)
      : 0;
    let steps = getSolutionSteps(q);

    if (steps.length === 0) {
      steps = [
        `Read the question carefully: ${q.question.substring(0, 100)}`,
        "Identify what is being asked",
        "Review the given information",
        "Consider which formula or concept applies",
        "Apply the concept step by step",
        "Check your answer against the options",
      ];
    }

    let stepIndex = Math.min(nudgeStepCounter, steps.length - 1);
    let suggestionText = "";
    let promptForAI = "";

    if (timeSpent < 15) {
      suggestionText = `Try starting with: "${steps[0]?.substring(0, 60)}..."`;
      promptForAI = `Give me a beginner-friendly hint for: ${q.question}`;
    } else if (timeSpent < 30) {
      stepIndex = Math.min(1, steps.length - 1);
      suggestionText = `Next step: ${steps[stepIndex]?.substring(0, 80)}`;
      promptForAI = `What is the next step after considering the basics for: ${q.question}`;
    } else if (timeSpent < 45) {
      stepIndex = Math.min(2, steps.length - 1);
      suggestionText = `Focus on: ${steps[stepIndex]?.substring(0, 80)}`;
      promptForAI = `Explain this step in detail: ${steps[stepIndex]}`;
    } else if (timeSpent < 60) {
      stepIndex = Math.min(3, steps.length - 1);
      suggestionText = `Let us work through: ${steps[stepIndex]?.substring(0, 80)}`;
      promptForAI = `Provide a detailed walkthrough of: ${steps[stepIndex]}`;
    } else {
      suggestionText = `Let me guide you through the complete solution. ${steps[0]?.substring(0, 60)}...`;
      promptForAI = `Provide a complete step-by-step solution with explanations for: ${q.question}`;
    }

    nudgeStepCounter = Math.min(nudgeStepCounter + 1, steps.length - 1);
    return { suggestionText, promptForAI, stepIndex };
  }

  /* ── 13. ACTION PILLS — rendered for legacy Quiz.getState() pages ── */
  function renderActionPills() {
    const qd = getQuizData();
    if (!qd || qd.source !== "legacy") return;

    messages.querySelectorAll(".prepbot-action-bar").forEach((el) => el.remove());

    const state = window.Quiz.getState();
    if (!state || !state.allQuestions.length) return;

    const idx = state.currentIndex;

    // Primary pill: Ask about this question
    const bar1 = document.createElement("div");
    bar1.className = "prepbot-action-bar";
    const thisQBtn = document.createElement("button");
    thisQBtn.className = "prepbot-pill prepbot-pill--primary";
    thisQBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="5"/><path d="M6 5v4M6 3h.01"/></svg> Q${idx + 1} — Ask about this question`;
    thisQBtn.addEventListener("click", () => injectCurrentQuestion());
    bar1.appendChild(thisQBtn);
    messages.insertBefore(bar1, messages.firstChild);

    // Q-nav pills
    const bar2 = document.createElement("div");
    bar2.className = "prepbot-action-bar prepbot-action-bar--qnav";
    const label = document.createElement("span");
    label.className = "prepbot-nav-label";
    label.textContent = "Go to:";
    bar2.appendChild(label);

    const scroll = document.createElement("div");
    scroll.className = "prepbot-qpills-scroll";

    state.allQuestions.forEach((question, i) => {
      const pill = document.createElement("button");
      pill.className = "prepbot-qpill";
      pill.textContent = i + 1;
      pill.title = question.question.length > 70
        ? question.question.slice(0, 70) + "..."
        : question.question;

      const chosen = state.userAnswers[i];
      if (i === idx) {
        pill.classList.add("qpill--current");
      } else if (chosen !== undefined && chosen !== "") {
        if (state.submitted && question.type === "objective") {
          const correctLetter = question._answer?.toUpperCase();
          pill.classList.add(chosen.toUpperCase() === correctLetter ? "qpill--correct" : "qpill--wrong");
        } else if (!state.submitted) {
          pill.classList.add("qpill--answered");
        }
      }

      pill.addEventListener("click", () => {
        if (qd.goTo) qd.goTo(i);
        renderActionPills();
        messages.scrollTop = 0;
      });
      scroll.appendChild(pill);
    });
    bar2.appendChild(scroll);
    messages.insertBefore(bar2, bar1.nextSibling);
  }

  /* ── 14. INJECT CURRENT QUESTION ── */
  function injectCurrentQuestion() {
    const ctx = getPageContext();
    if (ctx.mode !== "quiz") return;

    // Update context banner
    const banner = document.getElementById("chat-context-banner");
    const bannerText = document.getElementById("chat-context-text");
    if (banner && bannerText) {
      bannerText.textContent = ctx.questionText.length > 120
        ? ctx.questionText.slice(0, 120) + "..."
        : ctx.questionText;
      banner.classList.add("active");
    }

    messages.innerHTML = "";

    const qd = getQuizData();
    if (qd?.source === "legacy") renderActionPills();

    // Show question card as user message
    const LETTERS_DISPLAY = ["A", "B", "C", "D", "E"];
    let questionBlock = `Q${ctx.qNum}: ${ctx.questionText}`;
    if (ctx.options && ctx.options.length) {
      questionBlock += "\n\n" + ctx.options
        .map((opt, i) => `${LETTERS_DISPLAY[i] || i + 1}) ${opt}`)
        .join("\n");
    }
    if (ctx.correctAnswer) {
      questionBlock += `\n\nCorrect answer: ${ctx.correctAnswer}`;
    }

    const qCard = document.createElement("div");
    qCard.className = "msg user";
    qCard.innerHTML = `<div class="msg-meta">You</div><div class="msg-bubble" style="font-size:.8rem;line-height:1.65">${questionBlock.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</div>`;
    messages.appendChild(qCard);
    messages.scrollTop = messages.scrollHeight;

    // Build AI prompt including explanation context
    const aiPrompt = [
      `Explain Q${ctx.qNum} step by step: ${ctx.questionText}`,
      ctx.options?.length ? "Options: " + ctx.options.map((o, i) => `${LETTERS_DISPLAY[i]}) ${o}`).join(", ") : "",
      ctx.correctAnswer ? `The correct answer is ${ctx.correctAnswer}.` : "",
      ctx.explanation ? `Explanation context: ${ctx.explanation}` : "",
    ].filter(Boolean).join(" ");

    sendMessage(aiPrompt, true);
  }

  /* ── 15. YOUTUBE VIDEO PLAYER ── */
  async function searchAndPlayVideo() {
    const ctx = getPageContext();
    if (ctx.mode !== "quiz") return;

    showTyping();

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Please sign in to search videos.");

      let cleanQuery = ctx.questionText
        .replace(/WAEC|JAMB|NECO|exam|question|practice test/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);

      const params = new URLSearchParams({
        part: "snippet",
        type: "video",
        maxResults: "5",
        q: cleanQuery + " lesson tutorial",
      });

      const res = await fetch(`${API_YOUTUBE_URL}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      hideTyping();

      if (!res.ok) throw new Error("Video search failed.");

      const data = await res.json();
      const item = data.items?.[0];

      if (!item?.id?.videoId) {
        appendMessage("bot", "No video found for this topic. Try asking me to explain it directly.");
        return;
      }

      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const channel = item.snippet.channelTitle;

      const safe = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const playerWrap = document.createElement("div");
      playerWrap.className = "msg bot";
      playerWrap.innerHTML = `
        <div class="chat-video-player">
          <div class="chat-video-header">
            <div class="chat-video-info">
              <div class="chat-video-title">${safe(title)}</div>
              <div class="chat-video-channel">${safe(channel)}</div>
            </div>
            <button class="chat-video-close" title="Close video">✕</button>
          </div>
          <div class="chat-video-container">
            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1"
              title="YouTube video player" frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
          </div>
        </div>`;

      playerWrap.querySelector(".chat-video-close").addEventListener("click", () => playerWrap.remove());
      messages.appendChild(playerWrap);
      messages.scrollTop = messages.scrollHeight;
    } catch (err) {
      hideTyping();
      appendMessage("bot", `Could not load video: ${err.message}`);
    }
  }

  function addVideoChip() {
    if (!suggBox) return;
    if (suggBox.querySelector(".video-play-chip")) return;
    const btn = document.createElement("button");
    btn.className = "suggestion-chip video-play-chip";
    btn.innerHTML = "▶ Watch Video Lesson";
    btn.addEventListener("click", () => searchAndPlayVideo());
    suggBox.appendChild(btn);
  }

  /* ── 16. QUIZ NAV PILL (modern source) ── */
  function addQuizNavigationPill() {
    const qd = getQuizData();
    if (!qd || qd.source !== "modern" || qd.questions.length === 0) return;
    if (document.getElementById("quiz-nav-pill")) return;

    const pill = document.createElement("button");
    pill.id = "quiz-nav-pill";
    pill.className = "quiz-nav-pill";
    pill.innerHTML = `Question ${qd.currentIndex + 1} of ${qd.questions.length}`;
    pill.onclick = () => {
      const bar = document.getElementById("qbubbles-bar");
      if (bar) {
        bar.style.display = bar.style.display === "none" ? "block" : "none";
        if (bar.style.display === "block") buildQuizNav();
      }
    };
    messages.insertBefore(pill, messages.firstChild);
  }

  function updateQuizNavigationPill() {
    const pill = document.getElementById("quiz-nav-pill");
    if (!pill) return;
    const qd = getQuizData();
    if (!qd || qd.source !== "modern" || qd.questions.length === 0) {
      pill.style.display = "none";
      return;
    }
    pill.style.display = "inline-flex";
    pill.innerHTML = `Question ${qd.currentIndex + 1} of ${qd.questions.length}`;
  }

  /* ── 17. SEND MESSAGE ── */
  async function sendMessage(text, skipUserBubble = false) {
    if (!isKeySet()) {
      initializePrepBot();
      return;
    }

    text = text || input.value.trim();
    if (!text || isBusy) return;

    lastUserMessage = text;
    input.value = "";
    isBusy = true;
    sendBtn.classList.add("loading");
    suggBox.innerHTML = "";

    if (!skipUserBubble) await appendMessage("user", text);
    showTyping();

    const ctx = getPageContext();

    let stepByStepContext = "";
    if (ctx.solutions) stepByStepContext = `\n\nCOMPLETE STEP-BY-STEP SOLUTION:\n${ctx.solutions}\n\n`;
    if (ctx.explanation) stepByStepContext += `DETAILED EXPLANATION:\n${ctx.explanation}\n\n`;

    const systemPrompt = `You are ${BOT_NAME}, a friendly expert Nigerian secondary school exam tutor. You help with WAEC, JAMB, IGCSE, and Common Entrance exams. Be concise, clear, and encouraging. Explain step by step.

CONTEXT: ${ctx.content}
${stepByStepContext}

RULES:
1. Use LaTeX ONLY for scientific equations: \\(...\\) for inline, \\[...\\] for blocks.
2. Do NOT use LaTeX for normal words.
3. Be encouraging and provide DETAILED STEP-BY-STEP explanations.
4. Break down solutions into clear, numbered steps.
5. Explain the reasoning behind each step.
6. Use simple language appropriate for a ${userProficiency} level learner.
7. Do not use emojis.
8. At the very end of EVERY response, on a new line, append exactly:
[SUGGESTIONS: "short follow-up prompt 1", "short follow-up prompt 2"]
The two suggestions must be short (2-5 words), relevant, phrased as natural student follow-ups. Nothing after this line.`;

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Please sign in to use PrepBot.");

      const res = await fetch(API_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [...history, { role: "user", content: text }],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      hideTyping();

      const { cleanReply, chips } = parseSuggestions(data.text || "Connection error. Please try again.");

      lastBotReply = cleanReply;
      history.push(
        { role: "user", content: text },
        { role: "assistant", content: cleanReply }
      );
      if (history.length > 10) history = history.slice(-10);
      await appendMessage("bot", cleanReply);

      renderSuggestionChips(chips);

      // Add video chip when in quiz context
      if (ctx.mode === "quiz") addVideoChip();
    } catch (err) {
      hideTyping();
      console.error("PrepBot API Error:", err);
      const errorMessage = err.message.includes("sign in")
        ? err.message
        : "Connection error. Please check your connection and try again.";
      await appendMessage("bot", errorMessage);
      renderSuggestionChips(["Try Again", "Check Settings"]);
    } finally {
      isBusy = false;
      sendBtn.classList.remove("loading");
    }
  }

  /* ── 18. SUGGESTION CHIPS ── */
  function parseSuggestions(raw) {
    const pattern = /\[SUGGESTIONS:\s*([^\]]+)\]\s*$/is;
    const match = raw.match(pattern);
    let chips = FALLBACK_CHIPS.slice(0, 2);
    if (match) {
      const extracted = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1].trim()).filter(Boolean);
      if (extracted.length >= 1) chips = extracted.slice(0, 3);
    }
    const cleanReply = raw.replace(/\n?\[SUGGESTIONS:[^\]]*\]\s*$/is, "").trimEnd();
    return { cleanReply, chips };
  }

  function renderSuggestionChips(chips) {
    if (!suggBox) return;
    suggBox.innerHTML = "";
    chips.forEach((label) => {
      const b = document.createElement("button");
      b.className = "suggestion-chip";
      b.textContent = label;
      b.onclick = () => sendMessage(label);
      suggBox.appendChild(b);
    });
  }

  /* ── 19. MESSAGE RENDERER ── */
  async function appendMessage(role, text) {
    const wrap = document.createElement("div");
    wrap.className = `msg ${role}`;

    const content = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/Step (\d+):/gi, '<strong class="step-highlight">Step $1:</strong>')
      .replace(/^\d+\./gm, "<strong>$&</strong>")
      .replace(/\\\((.*?)\\\)/g, '<span class="math-inline">\\($1\\)</span>')
      .replace(/\\\[(.*?)\\\]/g, '<div class="math-block">\\[$1\\]</div>')
      .replace(/\n/g, "<br>");

    wrap.innerHTML = `<div class="msg-meta">${role === "user" ? "You" : BOT_NAME}</div><div class="msg-bubble">${content}</div>`;

    if (role === "bot") {
      const footer = document.createElement("div");
      footer.className = "msg-footer";
      const sBtn = document.createElement("button");
      sBtn.className = "speaker-btn";
      sBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
      sBtn.onclick = () => speak(text, sBtn);
      footer.appendChild(sBtn);
      wrap.querySelector(".msg-bubble").appendChild(footer);
    }

    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;

    if (window.MathJax) {
      try { await MathJax.typesetPromise([wrap]); } catch (_) {}
    }
    return Promise.resolve();
  }

  function formatForPopup(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\\\((.+?)\\\)/g, "\\($1\\)")
      .replace(/\\\[(.+?)\\\]/g, "\\[$1\\]");
  }

  function showTyping() {
    const t = document.createElement("div");
    t.id = "typing";
    t.className = "msg bot";
    t.innerHTML = `<div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
    messages.appendChild(t);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    document.getElementById("typing")?.remove();
  }

  /* ── 20. TOGGLE CHAT ── */
  function toggleChat(force) {
    const isOpen = force !== undefined ? force : !win.classList.contains("open");
    win.classList.toggle("open", isOpen);
    if (isOpen) {
      fabWrap.classList.add("fab-hidden");
      popup.classList.remove("visible");
      if (!isKeySet()) {
        initializePrepBot();
        return;
      }
      const qd = getQuizData();
      if (qd?.source === "legacy") {
        // Action pills already in messages
      } else {
        updateQuizNavBar();
        addQuizNavigationPill();
        updateQuizNavigationPill();
      }
      if (input) input.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      if (micBtn && recognition) micBtn.disabled = false;
      setTimeout(() => input.focus(), 300);
    } else {
      if (!document.getElementById("chat-fab-restore").classList.contains("fab-restore-visible")) {
        fabWrap.classList.remove("fab-hidden");
      }
    }
  }

  function updateQuizNavBar() {
    const qd = getQuizData();
    if (qd && qd.source === "modern" && qd.questions.length > 0) {
      quizNavBar.style.display = "flex";
      if (quizNavCurrent) quizNavCurrent.innerText = qd.currentIndex + 1;
      if (quizNavTotal) quizNavTotal.innerText = qd.questions.length;
      updateQuizNavigationPill();
    } else {
      quizNavBar.style.display = "none";
      const pill = document.getElementById("quiz-nav-pill");
      if (pill) pill.style.display = "none";
    }
  }

  function buildQuizNav() {
    const qd = getQuizData();
    if (!qd) return;
    qbGrid.innerHTML = "";
    qd.questions.forEach((_, i) => {
      const b = document.createElement("button");
      b.className = "qbubble";
      b.textContent = i + 1;
      b.onclick = () => {
        if (qd.goTo) qd.goTo(i);
        if (qd.source === "legacy") renderActionPills();
        sendMessage(`Explain question ${i + 1} step by step`);
        qbBar.style.display = "none";
      };
      qbGrid.appendChild(b);
    });
    qbBar.style.display = "block";
  }

  /* ── 21. POPUP SUGGESTION ── */
  async function showPopupSuggestion() {
    if (!isKeySet()) return;
    if (win.classList.contains("open") || isBusy || fabWrap.classList.contains("fab-hidden")) return;

    const ctx = getPageContext();

    if (ctx.mode === "quiz") {
      const hint = generateProgressiveHint();
      if (!hint) return;
      currentNudgeDisplayText = hint.suggestionText;
      currentNudgePrompt = hint.promptForAI;
      popupText.innerHTML = formatForPopup(hint.suggestionText);
      if (/\\\(|\\\[/.test(hint.suggestionText) && window.MathJax) {
        try { await MathJax.typesetPromise([popup]); } catch (_) {}
      }
      popup.classList.add("visible");
    } else {
      const nudge = getNonQuizNudge();
      currentNudgeDisplayText = nudge.text;
      currentNudgePrompt = nudge.prompt;
      popupText.innerHTML = formatForPopup(nudge.text);
      popup.classList.add("visible");
    }

    if (currentPopupTimeout) clearTimeout(currentPopupTimeout);
    currentPopupTimeout = setTimeout(() => {
      popup.classList.remove("visible");
      currentPopupTimeout = null;
    }, 10000);
  }

  /* ── 22. NUDGE INTERVAL ── */
  function startNudgeInterval() {
    if (nudgeInterval) clearInterval(nudgeInterval);
    function scheduleNext() {
      const delay = Math.floor(Math.random() * 10001 + 40000);
      nudgeInterval = setTimeout(() => {
        showPopupSuggestion();
        scheduleNext();
      }, delay);
    }
    scheduleNext();
  }

  function stopNudgeInterval() {
    if (nudgeInterval) { clearTimeout(nudgeInterval); nudgeInterval = null; }
    if (currentPopupTimeout) { clearTimeout(currentPopupTimeout); currentPopupTimeout = null; }
  }

  /* ── 23. EVENT LISTENERS ── */
  document.getElementById("chat-fab").onclick = () => toggleChat();
  document.getElementById("chat-close").onclick = () => toggleChat(false);
  document.getElementById("chat-clear-btn").onclick = () =>
    document.getElementById("chat-clear-bar").classList.add("visible");
  document.getElementById("clear-cancel").onclick = () =>
    document.getElementById("chat-clear-bar").classList.remove("visible");
  document.getElementById("clear-confirm").onclick = () => {
    history = [];
    messages.innerHTML =
      '<div class="chat-intro-card"><div class="intro-label">SYSTEM READY</div><p>I am reading the page with you. Ask about the current question, navigate to a number, or use the Mic to talk.</p></div>';
    document.getElementById("chat-clear-bar").classList.remove("visible");
    const qd = getQuizData();
    if (qd?.source === "legacy") {
      renderActionPills();
    } else {
      addQuizNavigationPill();
      updateQuizNavigationPill();
    }
    document.getElementById("chat-context-banner")?.classList.remove("active");
  };

  document.getElementById("chat-context-clear")?.addEventListener("click", () => {
    document.getElementById("chat-context-banner")?.classList.remove("active");
  });

  sendBtn.onclick = () => sendMessage();
  micBtn.onclick = () => {
    if (recognition && isKeySet()) recognition.start();
  };
  input.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (quizNavPrev) {
    quizNavPrev.onclick = () => {
      const qd = getQuizData();
      if (qd && qd.goTo && qd.currentIndex > 0) {
        qd.goTo(qd.currentIndex - 1);
        if (quizNavCurrent) quizNavCurrent.innerText = qd.currentIndex;
        sendMessage(`Explain question ${qd.currentIndex} step by step`);
      }
    };
  }

  if (quizNavNext) {
    quizNavNext.onclick = () => {
      const qd = getQuizData();
      if (qd && qd.goTo && qd.currentIndex < qd.questions.length - 1) {
        qd.goTo(qd.currentIndex + 1);
        if (quizNavCurrent) quizNavCurrent.innerText = qd.currentIndex + 2;
        sendMessage(`Explain question ${qd.currentIndex + 2} step by step`);
      }
    };
  }

  document.getElementById("qbubbles-close").onclick = () => (qbBar.style.display = "none");

  popup.onclick = async (e) => {
    if (e.target.classList.contains("prepbot-popup-close")) return;
    if (currentPopupTimeout) { clearTimeout(currentPopupTimeout); currentPopupTimeout = null; }
    toggleChat(true);
    setTimeout(() => { if (currentNudgePrompt) sendMessage(currentNudgePrompt); }, 300);
  };

  document.getElementById("prepbot-popup-close").onclick = (e) => {
    e.stopPropagation();
    popup.classList.remove("visible");
    if (currentPopupTimeout) { clearTimeout(currentPopupTimeout); currentPopupTimeout = null; }
  };

  document.getElementById("chat-fab-dismiss").onclick = (e) => {
    e.stopPropagation();
    fabWrap.classList.add("fab-hidden");
    document.getElementById("chat-fab-restore").classList.add("fab-restore-visible");
    stopNudgeInterval();
  };

  document.getElementById("chat-fab-restore").onclick = () => {
    fabWrap.classList.remove("fab-hidden");
    document.getElementById("chat-fab-restore").classList.remove("fab-restore-visible");
    if (!nudgeInterval && isKeySet()) startNudgeInterval();
  };

  /* ── 24. QUIZ UPDATE EVENT ── */
  window.addEventListener("prepbot:quizUpdated", () => {
    const qd = getQuizData();
    if (qd?.source === "legacy") {
      renderActionPills();
    } else {
      if (qbBar.style.display === "block") buildQuizNav();
      updateQuizNavBar();
      addQuizNavigationPill();
      updateQuizNavigationPill();
    }
    const newQd = getQuizData();
    if (newQd && newQd.questions.length > 0) {
      const q = newQd.questions[newQd.currentIndex];
      const questionId = `${newQd.currentIndex}_${q.question.substring(0, 50)}`;
      if (lastQuestionId !== questionId) {
        lastQuestionId = questionId;
        nudgeStepCounter = 0;
        questionStartTime = Date.now();
        suggestionHistory = [];
      }
    }
  });

  /* ── 25. BOOT ── */
  setTimeout(() => initializePrepBot(), 500);

  setTimeout(() => {
    const qd = getQuizData();
    if (qd?.source === "modern") {
      updateQuizNavBar();
      addQuizNavigationPill();
      updateQuizNavigationPill();
    }
  }, 100);

  window.__prepbotRefreshContext = () => {
    const qd = getQuizData();
    if (qd?.source === "legacy") {
      renderActionPills();
    } else {
      updateQuizNavBar();
      addQuizNavigationPill();
      updateQuizNavigationPill();
      if (qbBar.style.display === "block" && qd) buildQuizNav();
    }
  };
})();
