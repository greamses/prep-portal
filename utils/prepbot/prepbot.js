import chatbotcss from "./prepbotcss.js";

// REPLACE the Firebase imports at the top of prepbot.js with:
import { auth, db } from "/firebase-init.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

(function () {
  /* ── 1. STYLE INJECTION ── */
  (function injectStyles() {
    const style = document.createElement("style");
    style.id = "prepbot-core-styles";
    style.textContent = chatbotcss;
    document.head.appendChild(style);
  })();

  /* ── 2. CONFIG ── */
  const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
  const BOT_NAME = "PrepBot";
  let GROQ_KEY = "";
  let keyLoadAttempted = false;
  let firebaseReady = false;

  /* ── 2b. KEY RESOLUTION — use shared Firebase instances ── */
  let authInstance = null;
  let dbInstance = null;
  let _cachedKey = null; // <-- ADD THIS MISSING VARIABLE

  // Wait for Firebase to be ready
  async function waitForFirebase() {
    if (auth && db) {
      authInstance = auth;
      dbInstance = db;
      console.log("PrepBot: Firebase ready");
      return true;
    }

    // Wait for Firebase to initialize (up to 5 seconds)
    return new Promise((resolve) => {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (auth && db) {
          authInstance = auth;
          dbInstance = db;
          clearInterval(checkInterval);
          console.log("PrepBot: Firebase ready after check");
          resolve(true);
        } else if (attempts >= 50) {
          // 5 seconds max
          clearInterval(checkInterval);
          console.warn("PrepBot: Firebase not available after 5 seconds");
          resolve(false);
        }
      }, 100);
    });
  }

  /* ── IMPROVED FIRESTORE KEY LOADER ── */
  async function tryLoadFromFirestore() {
    try {
      // Wait for Firebase to be ready
      await waitForFirebase();

      if (!authInstance || !dbInstance) {
        console.log("Firebase not available");
        return null;
      }

      const user = authInstance.currentUser;
      if (!user) {
        console.log("No user logged in");
        return null;
      }

      console.log("Loading Groq key for user:", user.uid);

      // Try users/{uid} document first
      const userSnap = await getDoc(doc(dbInstance, "users", user.uid));
      if (userSnap.exists()) {
        const groqKey = userSnap.data().groqKey;
        if (groqKey && groqKey.trim()) {
          console.log("Found Groq key in users document");
          return groqKey;
        }
      }

      // Try users/{uid}/settings/keys subcollection
      const settingsSnap = await getDoc(
        doc(dbInstance, "users", user.uid, "settings", "keys"),
      );
      if (settingsSnap.exists()) {
        const groqKey = settingsSnap.data().groqKey;
        if (groqKey && groqKey.trim()) {
          console.log("Found Groq key in settings document");
          return groqKey;
        }
      }

      console.log("No Groq key found for user");
    } catch (e) {
      console.warn("Firestore key load error:", e.message);
    }
    return null;
  }

  /* ── 2c. KEY READY HANDLER ── */
  function onKeyReady(key) {
    GROQ_KEY = key;
    keyLoadAttempted = true;

    const messagesEl = document.getElementById("chat-messages");
    if (messagesEl) {
      messagesEl.innerHTML =
        '<div class="chat-intro-card"><div class="intro-label"> SYSTEM READY</div><p>I am reading the page with you. Ask about the current question, navigate to a number, or use the Mic to talk.</p></div>';
    }

    const inp = document.getElementById("chat-input");
    const sndBtn = document.getElementById("chat-send");
    const micB = document.getElementById("chat-mic");
    if (inp) inp.disabled = false;
    if (sndBtn) sndBtn.disabled = false;
    if (micB) micB.disabled = false;

    addQuizNavigationPill();
    updateQuizNavigationPill();
    startNudgeInterval();
  }

  /* ── 2d. KEY CHECK ── */
  function isKeySet() {
    return !!GROQ_KEY && GROQ_KEY.trim().length > 0;
  }

  /* ── 2e. SHOW ERROR MESSAGE (NO INPUT) ── */
  function showNoKeyMessage() {
    const messagesEl = document.getElementById("chat-messages");
    if (!messagesEl) return;

    messagesEl.innerHTML = `
      <div class="chat-intro-card" style="display:flex;flex-direction:column;gap:14px">
        <div class="intro-label"> API KEY NOT FOUND</div>
        <p style="margin:0;font-size:13px;line-height:1.6">
          PrepBot needs a <strong>Groq API key</strong> to work.<br><br>
          Please add your Groq API key in the 
          <a href="../auth/account.html" style="color:var(--blue,#0b57d0);text-decoration:underline;font-weight:bold;">
            API Keys Settings
          </a> page first.
        </p>
        <p style="margin:8px 0 0;font-size:12px;color:var(--muted,#666);">
          Get your free key at 
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener" style="color:var(--blue,#0b57d0);">
            console.groq.com/keys
          </a>
        </p>
        <button id="retry-key-check" type="button"
          style="margin-top:8px;padding:8px 16px;border:2px solid var(--ink,#1f1f1f);background:var(--yellow,#ffe500);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;border-radius:4px;">
          Retry Loading Key
        </button>
      </div>`;

    const retryBtn = document.getElementById("retry-key-check");
    if (retryBtn) {
      retryBtn.addEventListener("click", async () => {
        retryBtn.textContent = "Checking...";
        retryBtn.disabled = true;
        keyLoadAttempted = false; // Reset so we can try again
        await initializePrepBot();
        retryBtn.textContent = "Retry Loading Key";
        retryBtn.disabled = false;
      });
    }
  }

  /* ── 3. INITIALIZE PREPBOT ── */
  async function initializePrepBot() {
    if (keyLoadAttempted && GROQ_KEY) {
      console.log("PrepBot: Already initialized with key");
      return;
    }

    // First, ensure Firebase is ready
    await waitForFirebase();

    // Listen for keysReady event from API keys module
    window.addEventListener("prepportal:keysReady", (e) => {
      if (e.detail?.groq && !GROQ_KEY) {
        console.log("PrepBot: Received keys from event");
        _cachedKey = e.detail.groq;
        onKeyReady(_cachedKey);
      }
    });

    // ① Check if keys are already available from window
    if (window.PrepPortalKeys?.groq) {
      console.log("PrepBot: using key from window.PrepPortalKeys");
      onKeyReady(window.PrepPortalKeys.groq);
      return;
    }

    // ② Try Firestore directly with current user
    if (authInstance && authInstance.currentUser) {
      const firestoreKey = await tryLoadFromFirestore();
      if (firestoreKey) {
        console.log("PrepBot: got key from Firestore directly");
        onKeyReady(firestoreKey);
        return;
      }
    }

    // ③ Wait for keysReady event (user might be logging in)
    if (!keyLoadAttempted) {
      keyLoadAttempted = true;
      console.log("PrepBot: Waiting for keysReady event...");

      // Wait up to 10 seconds for the event
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log("PrepBot: Timeout waiting for keys");
          resolve();
        }, 10000);

        const handler = (e) => {
          if (e.detail?.groq) {
            clearTimeout(timeout);
            window.removeEventListener("prepportal:keysReady", handler);
            resolve();
          }
        };
        window.addEventListener("prepportal:keysReady", handler);
      });

      // Check again after waiting
      if (window.PrepPortalKeys?.groq && !GROQ_KEY) {
        console.log("PrepBot: got key after waiting");
        onKeyReady(window.PrepPortalKeys.groq);
        return;
      }
    }

    // ④ No key found - show setup message
    if (!GROQ_KEY) {
      console.warn("PrepBot: no key found, showing setup message");
      showNoKeyMessage();
    }
  }

  /* ── SITE MAP — for non-quiz page nudges ── */
  const SITE_MAP = [
    {
      match: (p) => p === "/" || p === "/index.html",
      title: "Home",
      section: "Prep Portal",
      nudges: [
        "Select an exam category to begin your preparation.",
        "Browse available quiz sets or visit the Math Hub.",
        "Not sure where to start? I can guide you to the right section.",
      ],
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`,
    },
    {
      match: (p) => p.includes("waec"),
      title: "WAEC",
      section: "WAEC Prep",
      nudges: [
        "WAEC questions follow predictable patterns. I can walk you through any topic.",
        "Working on WAEC prep? Ask me to explain a concept or break down past questions.",
        "Need a summary of key WAEC topics for this subject? Just ask.",
      ],
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="0"/><path d="M3 9h18M9 21V9"/></svg>`,
    },
    {
      match: (p) => p.includes("jamb") || p.includes("utme"),
      title: "JAMB / UTME",
      section: "JAMB Prep",
      nudges: [
        "JAMB questions test speed and accuracy. Want a quick drill on any topic?",
        "Preparing for UTME? I can help you revise core concepts fast.",
        "Ask me to generate practice questions or explain any JAMB topic.",
      ],
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>`,
    },
    {
      match: (p) => p.includes("igcse"),
      title: "IGCSE",
      section: "IGCSE Prep",
      nudges: [
        "IGCSE marking relies on key terms. I can help you use the right language.",
        "Revising for IGCSE? Ask me to explain any concept with worked examples.",
        "Want a breakdown of what examiners look for in this topic?",
      ],
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
    },
    {
      match: (p) =>
        p.includes("cambridge") ||
        p.includes("a-level") ||
        p.includes("alevel"),
      title: "Cambridge A-Level",
      section: "Cambridge Prep",
      nudges: [
        "Cambridge A-Level demands deep understanding. I can unpack any concept.",
        "Ask me for a structured revision plan or topic explanation.",
        "Need model answers or mark scheme guidance? I can help.",
      ],
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.74V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v13.26"/><path d="M2 20h20"/><path d="M8 8h8M8 12h5"/></svg>`,
    },
    {
      match: (p) => p.includes("common-entrance") || p.includes("entrance"),
      title: "Common Entrance",
      section: "Common Entrance Prep",
      nudges: [
        "Common Entrance needs solid basics. Ask me to explain any topic simply.",
        "Working through Common Entrance prep? I can guide you step by step.",
        "Ask me a question from any subject and I will break it down clearly.",
      ],
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    },
    {
      match: (p) =>
        p.includes("scholastic") || p.includes("sat") || p.includes("gre"),
      title: "Scholastic",
      section: "Scholastic Exams",
      nudges: [
        "Scholastic exams reward strategy. Want tips on approaching question types?",
        "Ask me to drill vocabulary, math reasoning, or reading comprehension.",
        "Need timed practice guidance? I can set up a mini drill session.",
      ],
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    },
    {
      match: (p) =>
        p.includes("math-hub") ||
        p.includes("maths") ||
        p.includes("mathematics"),
      title: "Math Hub",
      section: "Math Hub",
      nudges: [
        "The Math Hub has tools, games, and videos. Want a guided tour?",
        "Stuck on a concept? Ask me and I will give a worked example.",
        "Need an interactive explanation of any math topic? I am ready.",
      ],
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4v16h16"/><path d="M8 16l4-8 4 8"/><path d="M10 13h4"/></svg>`,
    },
    {
      match: (p) => p.includes("theory") || p.includes("essay"),
      title: "Theory Practice",
      section: "Theory / Essay",
      nudges: [
        "Theory questions reward structure. Ask me to review your approach.",
        "Want model answer structure for any theory question? Just ask.",
        "I can mark a draft answer or suggest how to improve your response.",
      ],
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    },
  ];

  const FALLBACK_CHIPS = ["Explain More", "Give Example", "Summarize"];

  let lastSuggestionIndex = -1;
  let suggestionHistory = [];
  let currentPopupTimeout = null;
  let lastBotReply = "";
  let lastUserMessage = "";

  /* ── 4. DOM & QUIZ SCRAPER ── */
  function getPageContext() {
    const quizData = window.__prepbotQuizData || null;
    const currentIdx = window.__prepbotCurrentQuestionIndex || 0;

    if (quizData && quizData[currentIdx]) {
      const q = quizData[currentIdx];
      const opts = (q.options || [])
        .map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`)
        .join("\n");

      let solutionsText = "";
      if (q.solutions) {
        if (Array.isArray(q.solutions)) {
          solutionsText = q.solutions
            .map((step, i) => `Step ${i + 1}: ${step}`)
            .join("\n");
        } else if (typeof q.solutions === "string") {
          solutionsText = q.solutions;
        }
      }

      let explanationText = q.explanation || "";
      if (Array.isArray(explanationText)) {
        explanationText = explanationText
          .map((step, i) => `Step ${i + 1}: ${step}`)
          .join("\n");
      }

      return {
        mode: "quiz",
        qNum: currentIdx + 1,
        totalQs: quizData.length,
        title: `Question ${currentIdx + 1}`,
        content: `Active Quiz Question: ${q.question}\nOptions:\n${opts}`,
        explanation: explanationText,
        questionText: q.question,
        hint: q.hint || "",
        solutions: solutionsText,
        correctIndex: q.correctIndex,
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
        clone
          .querySelectorAll("#prepbot, script, style")
          .forEach((n) => n.remove());
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
      options: [],
      fullData: null,
    };
  }

  /* ── PAGE META READER ── */
  function getPageMeta() {
    return {
      title: document.title || "",
      h1: document.querySelector("h1")?.innerText?.trim() || "",
      description:
        document.querySelector('meta[name="description"]')?.content || "",
      ogDescription:
        document.querySelector('meta[property="og:description"]')?.content ||
        "",
      keywords: document.querySelector('meta[name="keywords"]')?.content || "",
      path: window.location.pathname.toLowerCase(),
    };
  }

  /* ── SITE MAP LOOKUP ── */
  function getSiteMapEntry(path) {
    return SITE_MAP.find((entry) => entry.match(path)) || null;
  }

  /* ── NON-QUIZ NUDGE GENERATOR ── */
  function getNonQuizNudge() {
    const meta = getPageMeta();
    const entry = getSiteMapEntry(meta.path);

    if (entry) {
      const nudge =
        entry.nudges[Math.floor(Math.random() * entry.nudges.length)];
      return { text: nudge, prompt: nudge };
    }

    const topic =
      meta.h1 ||
      meta.title.split("|")[0].split("-")[0].trim() ||
      "this section";
    const desc = meta.description || meta.ogDescription;

    const fallbackNudges = [
      desc
        ? `${desc.substring(0, 90).trimEnd()}. Ask me anything about this.`
        : `On ${topic} — I can explain, summarise, or quiz you on any part of this page.`,
      `Need help understanding ${topic}? I am reading this page with you.`,
      `Ask me a question about ${topic} and I will break it down clearly.`,
    ];

    const text =
      fallbackNudges[Math.floor(Math.random() * fallbackNudges.length)];
    return { text, prompt: `Help me understand this page: ${topic}` };
  }

  /* ── 5. INJECT HTML ── */
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

      <div class="quiz-nav-bar" id="quiz-nav-bar" style="display:none">
        <button class="quiz-nav-btn" id="quiz-nav-prev" title="Previous Question">← Prev</button>
        <div class="quiz-nav-info">
          <span id="quiz-nav-current">1</span> / <span id="quiz-nav-total">0</span>
        </div>
        <button class="quiz-nav-btn" id="quiz-nav-next" title="Next Question">Next →</button>
      </div>

      <div class="qbubbles-bar" id="qbubbles-bar" style="display:none">
        <div class="qbubbles-header"><span class="qbubbles-title">Quiz Navigation</span><button class="qbubbles-close" id="qbubbles-close">×</button></div>
        <div class="qbubbles-grid" id="qbubbles-grid"></div>
      </div>

      <div class="chat-messages" id="chat-messages">
        <div class="chat-intro-card">
          <div class="intro-label">LOADING</div>
          <p>Checking for API key...</p>
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

  /* ── 6. REFS & STATE ── */
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

  /* ── 7. VOICE ENGINE ── */
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
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

  /* ── 8. GET SOLUTION STEPS ── */
  function getSolutionSteps(questionData) {
    if (!questionData) return [];
    let steps = [];
    if (questionData.solutions) {
      if (Array.isArray(questionData.solutions)) steps = questionData.solutions;
      else if (typeof questionData.solutions === "string")
        steps = questionData.solutions.split("\n").filter((s) => s.trim());
    }
    if (steps.length === 0 && questionData.explanation) {
      if (Array.isArray(questionData.explanation))
        steps = questionData.explanation;
      else if (typeof questionData.explanation === "string")
        steps = questionData.explanation.split("\n").filter((s) => s.trim());
    }
    if (steps.length === 0 && questionData.solutionSteps) {
      if (Array.isArray(questionData.solutionSteps))
        steps = questionData.solutionSteps;
      else if (typeof questionData.solutionSteps === "string")
        steps = questionData.solutionSteps.split("\n").filter((s) => s.trim());
    }
    return steps.filter((s) => s.length > 0);
  }

  /* ── 9. PROGRESSIVE HINT GENERATION ── */
  function generateProgressiveHint() {
    const quizData = window.__prepbotQuizData;
    const currentIdx = window.__prepbotCurrentQuestionIndex || 0;
    if (!quizData || !quizData[currentIdx]) return null;

    const currentQuestion = quizData[currentIdx];
    const questionId = `${currentIdx}_${currentQuestion.question.substring(0, 50)}`;

    if (lastQuestionId !== questionId) {
      lastQuestionId = questionId;
      nudgeStepCounter = 0;
      questionStartTime = Date.now();
      suggestionHistory = [];
    }

    const timeSpent = questionStartTime
      ? Math.floor((Date.now() - questionStartTime) / 1000)
      : 0;
    const steps = getSolutionSteps(currentQuestion);

    let availableSteps = steps;
    if (availableSteps.length === 0) {
      availableSteps = [
        `Read the question carefully: ${currentQuestion.question.substring(0, 100)}`,
        "Identify what is being asked",
        "Review the given information",
        "Consider which formula or concept applies",
        "Apply the concept step by step",
        "Check your answer against the options",
      ];
    }

    let stepIndex = Math.min(nudgeStepCounter, availableSteps.length - 1);
    let suggestionText = "";
    let promptForAI = "";

    if (timeSpent < 15) {
      suggestionText = `Try starting with: "${availableSteps[0]?.substring(0, 60)}..."`;
      promptForAI = `Give me a beginner-friendly hint for: ${currentQuestion.question}`;
    } else if (timeSpent < 30) {
      stepIndex = Math.min(1, availableSteps.length - 1);
      suggestionText = `Next step: ${availableSteps[stepIndex]?.substring(0, 80)}`;
      promptForAI = `What is the next step after considering the basics for: ${currentQuestion.question}`;
    } else if (timeSpent < 45) {
      stepIndex = Math.min(2, availableSteps.length - 1);
      suggestionText = `Focus on: ${availableSteps[stepIndex]?.substring(0, 80)}`;
      promptForAI = `Explain this step in detail: ${availableSteps[stepIndex]}`;
    } else if (timeSpent < 60) {
      stepIndex = Math.min(3, availableSteps.length - 1);
      suggestionText = `Let us work through: ${availableSteps[stepIndex]?.substring(0, 80)}`;
      promptForAI = `Provide a detailed walkthrough of: ${availableSteps[stepIndex]}`;
    } else {
      suggestionText = `Let me guide you through the complete solution. ${availableSteps[0]?.substring(0, 60)}...`;
      promptForAI = `Provide a complete step-by-step solution with explanations for: ${currentQuestion.question}`;
    }

    nudgeStepCounter = Math.min(
      nudgeStepCounter + 1,
      availableSteps.length - 1,
    );
    return { suggestionText, promptForAI, stepIndex };
  }

  /* ── 10. ADD QUIZ NAVIGATION PILL ── */
  function addQuizNavigationPill() {
    const messagesContainer = document.getElementById("chat-messages");
    if (!messagesContainer) return;
    if (document.getElementById("quiz-nav-pill")) return;

    const quizData = window.__prepbotQuizData;
    if (!quizData || quizData.length === 0) return;

    const currentIdx = window.__prepbotCurrentQuestionIndex || 0;
    const total = quizData.length;

    const pill = document.createElement("button");
    pill.id = "quiz-nav-pill";
    pill.className = "quiz-nav-pill";
    pill.innerHTML = `Question ${currentIdx + 1} of ${total}`;

    pill.onclick = () => {
      const qbBarEl = document.getElementById("qbubbles-bar");
      if (qbBarEl) {
        qbBarEl.style.display =
          qbBarEl.style.display === "none" ? "block" : "none";
        if (qbBarEl.style.display === "block" && window.__prepbotQuizData)
          buildQuizNav();
      }
    };

    messagesContainer.insertBefore(pill, messagesContainer.firstChild);
  }

  function updateQuizNavigationPill() {
    const pill = document.getElementById("quiz-nav-pill");
    if (!pill) return;

    const quizData = window.__prepbotQuizData;
    if (!quizData || quizData.length === 0) {
      pill.style.display = "none";
      return;
    }

    pill.style.display = "inline-flex";
    const currentIdx = window.__prepbotCurrentQuestionIndex || 0;
    const total = quizData.length;
    pill.innerHTML = `Question ${currentIdx + 1} of ${total}`;
  }

  /* ── 11. SEND MESSAGE ── */
  async function sendMessage(text) {
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

    await appendMessage("user", text);
    showTyping();

    const ctx = getPageContext();

    let stepByStepContext = "";
    if (ctx.solutions)
      stepByStepContext = `\n\nCOMPLETE STEP-BY-STEP SOLUTION:\n${ctx.solutions}\n\n`;
    if (ctx.explanation)
      stepByStepContext += `DETAILED EXPLANATION:\n${ctx.explanation}\n\n`;

    const systemPrompt = `You are ${BOT_NAME}, an expert study assistant specializing in step-by-step teaching.

CONTEXT: ${ctx.content}
${stepByStepContext}

STRICT RULES:
1. Use LaTeX ONLY for scientific equations/formulas: \\(...\\) for inline, \\[...\\] for blocks.
2. Do NOT use LaTeX for normal words.
3. Be encouraging and provide DETAILED STEP-BY-STEP explanations.
4. Break down the solution into clear, sequential steps with numbers.
5. Explain the reasoning behind each step.
6. Use simple, clear language appropriate for a ${userProficiency} level learner.
7. Provide examples when helpful.
8. Keep responses concise but informative.
9. Do not use emojis.
10. At the very end of EVERY response, on a new line, append exactly this format:
[SUGGESTIONS: "short follow-up prompt 1", "short follow-up prompt 2"]
The two suggestions must be short (2-5 words), relevant to what you just explained, and phrased as things the student would naturally ask next. Do not number them. Do not add anything after this line.`;

    // CORS PROXIES - try each until one works
    const corsProxies = [
      "https://corsproxy.io/?",
      "https://api.allorigins.win/raw?url=",
      "https://cors-anywhere.herokuapp.com/",
    ];

    let res = null;
    let data = null;
    let success = false;

    try {
      // Try each proxy
      for (const proxy of corsProxies) {
        try {
          console.log(`Trying proxy: ${proxy}`);
          const targetUrl = encodeURIComponent(GROQ_URL);

          res = await fetch(proxy + targetUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GROQ_KEY}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: text },
              ],
              temperature: 0.3,
              max_tokens: 2000,
            }),
          });

          if (res.ok) {
            data = await res.json();
            success = true;
            break;
          }
        } catch (proxyErr) {
          console.warn(`Proxy ${proxy} failed:`, proxyErr.message);
          continue;
        }
      }

      // If all proxies fail, try direct connection
      if (!success) {
        console.log("All proxies failed, trying direct connection...");
        res = await fetch(GROQ_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: systemPrompt },
              ...history,
              { role: "user", content: text },
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        });
        data = await res.json();
      }

      hideTyping();

      if (!data || !data.choices || !data.choices[0]) {
        throw new Error("Invalid response from API");
      }

      let reply =
        data.choices[0]?.message?.content ||
        "Connection error. Please try again.";

      const { cleanReply, chips } = parseSuggestions(reply);

      lastBotReply = cleanReply;
      history.push(
        { role: "user", content: text },
        { role: "assistant", content: cleanReply },
      );
      if (history.length > 10) history = history.slice(-10);
      await appendMessage("bot", cleanReply);

      renderSuggestionChips(chips);
    } catch (err) {
      hideTyping();
      console.error("PrepBot API Error:", err);

      let errorMessage = "Connection error. ";
      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")
      ) {
        errorMessage +=
          "CORS restriction detected. Try using a CORS unblocker extension.";
      } else {
        errorMessage += "Please check your connection and try again.";
      }

      await appendMessage("bot", errorMessage);
      renderSuggestionChips(["Try Again", "Check Settings"]);
    } finally {
      isBusy = false;
      sendBtn.classList.remove("loading");
    }
  }

  /* ── 12. AI-GENERATED SUGGESTION CHIPS ── */
  function parseSuggestions(raw) {
    const pattern = /\[SUGGESTIONS:\s*([^\]]+)\]\s*$/is;
    const match = raw.match(pattern);

    let chips = FALLBACK_CHIPS.slice(0, 2);

    if (match) {
      const extracted = [];
      const quoted = match[1].matchAll(/"([^"]+)"/g);
      for (const m of quoted) {
        const label = m[1].trim();
        if (label) extracted.push(label);
      }
      if (extracted.length >= 1) chips = extracted.slice(0, 3);
    }

    const cleanReply = raw
      .replace(/\n?\[SUGGESTIONS:[^\]]*\]\s*$/is, "")
      .trimEnd();

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

  /* ── 13. UI RENDERERS WITH MATHJAX SUPPORT ── */
  async function appendMessage(role, text) {
    const wrap = document.createElement("div");
    wrap.className = `msg ${role}`;

    let content = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(
        /Step (\d+):/gi,
        '<strong class="step-highlight">Step $1:</strong>',
      )
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
      try {
        await MathJax.typesetPromise([wrap]);
      } catch (err) {
        console.log("MathJax error:", err);
      }
    }

    return Promise.resolve();
  }

  /* ── FORMAT TEXT FOR POPUP ── */
  function formatForPopup(text) {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped
      .replace(/\\\((.+?)\\\)/g, "\\($1\\)")
      .replace(/\\\[(.+?)\\\]/g, "\\[$1\\]");
  }

  function hasMath(text) {
    return /\\\(|\\\[/.test(text);
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

  function toggleChat(force) {
    const isOpen =
      force !== undefined ? force : !win.classList.contains("open");
    win.classList.toggle("open", isOpen);
    if (isOpen) {
      fabWrap.classList.add("fab-hidden");
      popup.classList.remove("visible");
      if (!isKeySet()) {
        initializePrepBot();
        return;
      }
      updateQuizNavBar();
      addQuizNavigationPill();
      updateQuizNavigationPill();
      if (input) input.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      if (micBtn && recognition) micBtn.disabled = false;
      setTimeout(() => input.focus(), 300);
    } else {
      if (
        !document
          .getElementById("chat-fab-restore")
          .classList.contains("fab-restore-visible")
      ) {
        fabWrap.classList.remove("fab-hidden");
      }
    }
  }

  function updateQuizNavBar() {
    const quizData = window.__prepbotQuizData;
    if (quizData && quizData.length > 0) {
      quizNavBar.style.display = "flex";
      const currentIdx = window.__prepbotCurrentQuestionIndex || 0;
      if (quizNavCurrent) quizNavCurrent.innerText = currentIdx + 1;
      if (quizNavTotal) quizNavTotal.innerText = quizData.length;
      updateQuizNavigationPill();
    } else {
      quizNavBar.style.display = "none";
      const pill = document.getElementById("quiz-nav-pill");
      if (pill) pill.style.display = "none";
    }
  }

  function buildQuizNav() {
    const data = window.__prepbotQuizData;
    if (!data) return;
    qbGrid.innerHTML = "";
    data.forEach((_, i) => {
      const b = document.createElement("button");
      b.className = "qbubble";
      b.textContent = i + 1;
      b.onclick = () => {
        if (window.__prepbotJumpToQuestion) window.__prepbotJumpToQuestion(i);
        sendMessage(`Explain question ${i + 1} step by step`);
        qbBar.style.display = "none";
      };
      qbGrid.appendChild(b);
    });
    qbBar.style.display = "block";
  }

  /* ── 14. POPUP SUGGESTION — MathJax-first, site-aware ── */
  async function showPopupSuggestion() {
    if (!isKeySet()) return;
    if (
      win.classList.contains("open") ||
      isBusy ||
      fabWrap.classList.contains("fab-hidden")
    )
      return;

    const ctx = getPageContext();

    if (ctx.mode === "quiz") {
      const hint = generateProgressiveHint();
      if (!hint) return;

      currentNudgeDisplayText = hint.suggestionText;
      currentNudgePrompt = hint.promptForAI;

      popupText.innerHTML = formatForPopup(hint.suggestionText);

      if (hasMath(hint.suggestionText) && window.MathJax) {
        try {
          await MathJax.typesetPromise([popup]);
        } catch (err) {
          console.log("MathJax popup error:", err);
        }
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

  /* ── 15. NUDGE INTERVAL — 40 to 50 seconds ── */
  function startNudgeInterval() {
    if (nudgeInterval) clearInterval(nudgeInterval);

    function scheduleNext() {
      const delay = Math.floor(Math.random() * (50000 - 40000 + 1) + 40000);
      nudgeInterval = setTimeout(() => {
        showPopupSuggestion();
        scheduleNext();
      }, delay);
    }

    scheduleNext();
  }

  function stopNudgeInterval() {
    if (nudgeInterval) {
      clearTimeout(nudgeInterval);
      nudgeInterval = null;
    }
    if (currentPopupTimeout) {
      clearTimeout(currentPopupTimeout);
      currentPopupTimeout = null;
    }
  }

  /* ── 16. ENABLE INPUTS WHEN KEY IS LOADED ── */
  function enableChatInputs() {
    if (input) input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    if (micBtn && recognition) micBtn.disabled = false;
  }

  /* ── 17. EVENT LISTENERS ── */
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
    addQuizNavigationPill();
    updateQuizNavigationPill();
  };
  sendBtn.onclick = () => sendMessage();
  micBtn.onclick = () => {
    if (recognition && isKeySet()) recognition.start();
  };
  input.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (quizNavPrev) {
    quizNavPrev.onclick = () => {
      const quizData = window.__prepbotQuizData;
      if (quizData && window.__prepbotJumpToQuestion) {
        const currentIdx = window.__prepbotCurrentQuestionIndex || 0;
        if (currentIdx > 0) {
          window.__prepbotJumpToQuestion(currentIdx - 1);
          if (quizNavCurrent) quizNavCurrent.innerText = currentIdx;
          sendMessage(`Explain question ${currentIdx} step by step`);
        }
      }
    };
  }

  if (quizNavNext) {
    quizNavNext.onclick = () => {
      const quizData = window.__prepbotQuizData;
      if (quizData && window.__prepbotJumpToQuestion) {
        const currentIdx = window.__prepbotCurrentQuestionIndex || 0;
        if (currentIdx < quizData.length - 1) {
          window.__prepbotJumpToQuestion(currentIdx + 1);
          if (quizNavCurrent) quizNavCurrent.innerText = currentIdx + 2;
          sendMessage(`Explain question ${currentIdx + 2} step by step`);
        }
      }
    };
  }

  popup.onclick = async (e) => {
    if (e.target.classList.contains("prepbot-popup-close")) return;
    if (currentPopupTimeout) {
      clearTimeout(currentPopupTimeout);
      currentPopupTimeout = null;
    }
    toggleChat(true);
    setTimeout(() => {
      if (currentNudgePrompt) sendMessage(currentNudgePrompt);
    }, 300);
  };

  document.getElementById("prepbot-popup-close").onclick = (e) => {
    e.stopPropagation();
    popup.classList.remove("visible");
    if (currentPopupTimeout) {
      clearTimeout(currentPopupTimeout);
      currentPopupTimeout = null;
    }
  };

  document.getElementById("qbubbles-close").onclick = () =>
    (qbBar.style.display = "none");

  document.getElementById("chat-fab-dismiss").onclick = (e) => {
    e.stopPropagation();
    fabWrap.classList.add("fab-hidden");
    document
      .getElementById("chat-fab-restore")
      .classList.add("fab-restore-visible");
    stopNudgeInterval();
  };

  document.getElementById("chat-fab-restore").onclick = () => {
    fabWrap.classList.remove("fab-hidden");
    document
      .getElementById("chat-fab-restore")
      .classList.remove("fab-restore-visible");
    if (!nudgeInterval && isKeySet()) startNudgeInterval();
  };
  /* ── 18. INIT ── */
  // Start initialization after a short delay to ensure DOM is ready
  setTimeout(() => {
    initializePrepBot();
  }, 500);

  window.addEventListener("prepbot:quizUpdated", () => {
    if (qbBar.style.display === "block") buildQuizNav();
    updateQuizNavBar();
    addQuizNavigationPill();
    updateQuizNavigationPill();
    const currentIdx = window.__prepbotCurrentQuestionIndex || 0;
    const quizData = window.__prepbotQuizData;
    if (quizData && quizData[currentIdx]) {
      const questionId = `${currentIdx}_${quizData[currentIdx].question.substring(0, 50)}`;
      if (lastQuestionId !== questionId) {
        lastQuestionId = questionId;
        nudgeStepCounter = 0;
        questionStartTime = Date.now();
        suggestionHistory = [];
      }
    }
  });

  setTimeout(() => {
    updateQuizNavBar();
    addQuizNavigationPill();
    updateQuizNavigationPill();
  }, 100);

  window.__prepbotRefreshContext = () => {
    updateQuizNavBar();
    addQuizNavigationPill();
    updateQuizNavigationPill();
    if (qbBar.style.display === "block" && window.__prepbotQuizData)
      buildQuizNav();
  };

  console.log(`${BOT_NAME} ready — Auto-detects Groq key from Firestore`);
})();
