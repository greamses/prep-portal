// robot-teacher.js v3.2.2 – Ask button toggles question mode (stays highlighted)
import { GROQ_DEFAULT_MODEL } from '../../../utils/ai-models.js';
import { auth, db } from '../../../firebase-init.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

(function(global) {
  'use strict';
  if (global.RobotTeacher) return;

  const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
  const MODEL = GROQ_DEFAULT_MODEL;
  
  const S = {
    grade: 'JSS2',
    apiKey: null,
    tutorialSteps: [],
    currentModuleId: null,
    currentLessonId: null,
    onLessonComplete: null
  };
  
  let currentStepIndex = 0;
  let reminderTimer = null;
  let isTyping = false,
    isFetching = false,
    isTransitioning = false,
    currentTypeSession = 0;
  let isMuted = false,
    isSleeping = false,
    mounted = false,
    isTeachingMode = false;
  let currentHighlightEl = null,
    lastObservation = { key: '', time: 0 },
    lastAppState = null;
  let stepVerified = false,
    completedStepIndices = {};
  let isDraggingBot = false,
    dragStartX, dragStartY, initialBotX, initialBotY;
  let recognition = null,
    isListening = false;
  let isAskMode = false;

  /* ── FIREBASE PROGRESS CACHE ──────────────────────────────────── */
  let _progress = { completedSteps: {}, completedLessons: {}, currentModule: null, currentStep: 0, appState: null };
  let _saveTimer = null;

  function _progressRef() {
    const user = auth.currentUser;
    return user ? doc(db, 'users', user.uid, 'activity', 'polygon-angles') : null;
  }

  async function _loadProgress() {
    const ref = _progressRef();
    if (ref) {
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) _progress = { ..._progress, ...snap.data() };
      } catch (e) {}
    } else {
      try {
        _progress.completedSteps   = JSON.parse(localStorage.getItem('rt_completed_steps')   || '{}');
        _progress.completedLessons = JSON.parse(localStorage.getItem('rt_completed_lessons') || '{}');
        _progress.currentModule    = JSON.parse(localStorage.getItem('rt_current_module')    || 'null');
        _progress.currentStep      = parseInt(localStorage.getItem('rt_current_step')        || '0', 10) || 0;
        _progress.appState         = JSON.parse(localStorage.getItem('rt_app_state')         || 'null');
      } catch (e) {}
    }
    completedStepIndices = _progress.completedSteps;
  }

  function _scheduleProgress() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(_flushProgress, 1500);
  }

  async function _flushProgress() {
    const ref = _progressRef();
    if (ref) {
      try { await setDoc(ref, _progress, { merge: true }); } catch (e) {}
    } else {
      try {
        localStorage.setItem('rt_completed_steps',   JSON.stringify(_progress.completedSteps));
        localStorage.setItem('rt_completed_lessons', JSON.stringify(_progress.completedLessons));
        localStorage.setItem('rt_current_module',    JSON.stringify(_progress.currentModule));
        localStorage.setItem('rt_current_step',      String(_progress.currentStep));
        if (_progress.appState) localStorage.setItem('rt_app_state', JSON.stringify(_progress.appState));
      } catch (e) {}
    }
  }
  
  /* ── SVG ICONS ────────────────────────────────────────────────── */
  const SVG_MIC = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
  const SVG_SLEEP = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`;
  const SVG_ASK = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  const SVG_CLOSE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  const SVG_ARROW_LEFT = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
  const SVG_ARROW_RIGHT = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
  
  /* ── SYNONYM MATCHING (unchanged) ──────────────────────────────── */
  const VOCAB_SYNONYMS = {
    'equal': ['same', 'identical', 'matching'],
    'sides': ['edges', 'side'],
    'angles': ['corners', 'angle'],
    'straight': ['direct', 'flat'],
    'closed': ['shut', 'enclosed'],
    'shape': ['figure', 'form'],
    'polygon': ['shape', 'figure'],
    'yes': ['yeah', 'yep', 'correct', 'right'],
    'no': ['nope', 'wrong', 'incorrect'],
  };
  const STOP_WORDS = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'to', 'from', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'then', 'than', 'so', 'very', 'just', 'also', 'that', 'this', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'how', 'all', 'both', 'each', 'every', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'too', 'can', 'will', 'should', 'would']);
  
  function looseMatch(expected, transcript) {
    const cleanExpected = expected.toLowerCase().trim();
    const cleanTrans = transcript.toLowerCase().trim();
    if (/^\d+$/.test(cleanExpected)) return cleanTrans.includes(cleanExpected);
    let keywords = cleanExpected.split(/\s+/).filter(w => !STOP_WORDS.has(w));
    let groupsCovered = 0;
    keywords.forEach(kw => {
      const group = [kw, ...(VOCAB_SYNONYMS[kw] || [])];
      if (group.some(w => cleanTrans.includes(w))) groupsCovered++;
    });
    return groupsCovered >= Math.ceil(keywords.length * 0.75);
  }
  
  
  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
#rt-guide-wrapper { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; z-index: 9999; pointer-events: none; }
.rt-bubble-container { position: relative; background: #ffffff; border: 2.5px solid #0a0a0a; box-shadow: 6px 6px 0 #0a0a0a; padding: 16px 20px 36px; width: 340px; max-width: calc(100vw - 40px); pointer-events: auto; transform: scale(0); transform-origin: bottom right; opacity: 0; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s; display: flex; flex-direction: column; gap: 10px; }
.rt-bubble-container.rt-show { transform: scale(1); opacity: 1; }
.rt-bubble-container::after { content: ''; position: absolute; bottom: -11px; right: 24px; width: 20px; height: 20px; background: #ffffff; border-bottom: 2.5px solid #0a0a0a; border-right: 2.5px solid #0a0a0a; transform: rotate(45deg); box-shadow: 4px 4px 0 #0a0a0a; z-index: -1; }
.rt-bubble-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(10,10,10,0.1); padding-bottom: 6px; }
.rt-bubble-title { font-family: 'Unbounded', sans-serif; font-size: 0.65rem; font-weight: 900; color: #0055ff; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; }
.rt-status-dot { width: 8px; height: 8px; background: #10b981; border: 1.5px solid #0a0a0a; transition: background 0.3s; }
.rt-offline .rt-status-dot { background: #ffe500; }
.rt-listening .rt-status-dot { background: #ff003c; animation: rt-pulse-red 1s infinite; }
.rt-step-verified .rt-status-dot { background: #10b981; }
.rt-step-unverified .rt-status-dot { background: #0055ff; animation: rt-pulse-blue 1.5s infinite; }
.rt-header-actions { display: flex; align-items: center; gap: 6px; }
.rt-icon-btn { background: none; border: none; font-family: 'JetBrains Mono', monospace; font-size: 1rem; font-weight: 700; color: #0a0a0a; cursor: pointer; opacity: 0.5; display: flex; align-items: center; justify-content: center; padding: 4px; transition: opacity 0.2s, color 0.2s; }
.rt-icon-btn:hover { opacity: 1; color: #0055ff; }
.rt-icon-btn.rt-active { opacity: 1; color: #ff003c; }
.rt-close-bubble:hover { color: #ff003c; }
.rt-bubble-text { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; line-height: 1.6; color: #0a0a0a; min-height: 40px; }
.rt-typing { display: inline-flex; gap: 4px; align-items: center; height: 1.5em; }
.rt-typing span { width: 6px; height: 6px; background: #0a0a0a; animation: rt-bounce 1s infinite; }
.rt-typing span:nth-child(2) { animation-delay: 0.2s; }
.rt-typing span:nth-child(3) { animation-delay: 0.4s; }
.rt-nav-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 32px; display: flex; border-top: 1.5px solid rgba(10,10,10,0.1); }
.rt-nav-zone { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; transition: background 0.15s; user-select: none; touch-action: manipulation; font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; font-weight: 700; color: rgba(10,10,10,0.5); }
.rt-nav-zone:hover { background: rgba(0,85,255,0.05); color: rgba(10,10,10,0.8); }
.rt-nav-zone:active { background: rgba(0,85,255,0.12); }
.rt-nav-divider { width: 1.5px; background: rgba(10,10,10,0.1); }
.rt-bot-wrapper { position: relative; pointer-events: auto; cursor: grab; transition: transform 0.2s, filter 0.3s, opacity 0.3s; user-select: none; touch-action: none; }
.rt-bot-wrapper:active { cursor: grabbing; transform: translateY(2px); }
.rt-anim-hover { animation: rt-float 3s ease-in-out infinite; }
.rt-anim-blink { transform-origin: 32px 27px; animation: rt-blink 4s infinite; }
.rt-bot-wrapper.rt-sleeping { filter: grayscale(100%); opacity: 0.6; }
.rt-bot-wrapper.rt-sleeping .rt-anim-hover { animation: none; }
.rt-bot-wrapper.rt-sleeping::after { content: 'Zzz...'; position: absolute; top: -10px; right: -20px; font-family: 'Unbounded', sans-serif; font-size: 0.7rem; font-weight: 900; color: #0055ff; text-shadow: 2px 2px 0 #fff, -2px -2px 0 #fff; animation: rt-float 3s ease-in-out infinite; }
.rt-highlight-target { box-shadow: 0 0 0 3px #0055ff, 0 0 0 6px rgba(0, 85, 255, 0.35) !important; border-radius: 6px; animation: rt-pulse-glow 1.5s infinite; z-index: 1000; }
@keyframes rt-pulse-glow { 0% { box-shadow: 0 0 0 3px #0055ff, 0 0 0 6px rgba(0, 85, 255, 0.35) !important; } 70% { box-shadow: 0 0 0 3px #ffe500, 0 0 0 14px rgba(255, 229, 0, 0) !important; } 100% { box-shadow: 0 0 0 3px #0055ff, 0 0 0 6px rgba(0, 85, 255, 0.35) !important; } }
@keyframes rt-pulse-red { 0% { box-shadow: 0 0 0 0 rgba(255,0,60,0.7); } 70% { box-shadow: 0 0 0 8px rgba(255,0,60,0); } 100% { box-shadow: 0 0 0 0 rgba(255,0,60,0); } }
@keyframes rt-pulse-blue { 0% { box-shadow: 0 0 0 0 rgba(0,85,255,0.6); } 70% { box-shadow: 0 0 0 8px rgba(0,85,255,0); } 100% { box-shadow: 0 0 0 0 rgba(0,85,255,0); } }
@keyframes rt-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes rt-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes rt-blink { 0%, 96%, 98%, 100% { transform: scaleY(1); } 97%, 99% { transform: scaleY(0.1); } }
`;
  
  let $root, $bubble, $text, $closeBtn, $micBtn, $powerBtn, $askBtn, $botAvatar, $status;
  let $navLeft, $navRight;
  
  function buildHTML() {
    return `
      <div class="rt-bubble-container rt-step-unverified" id="rt-bubble">
        <div class="rt-bubble-header">
          <div class="rt-bubble-title" id="rt-status">
            <div class="rt-status-dot"></div> <span id="rt-title-text">TUTORIAL</span>
          </div>
          <div class="rt-header-actions">
            <button class="rt-icon-btn" id="rt-ask-btn" title="Toggle question mode">${SVG_ASK}</button>
            <button class="rt-icon-btn" id="rt-mic-btn" aria-label="Voice answer">${SVG_MIC}</button>
            <button class="rt-icon-btn" id="rt-power-btn" aria-label="Turn off">${SVG_SLEEP}</button>
            <button class="rt-icon-btn rt-close-bubble" id="rt-close-bubble" aria-label="Close">${SVG_CLOSE}</button>
          </div>
        </div>
        <div class="rt-bubble-text" id="rt-text"></div>
        <div class="rt-nav-bar">
          <div class="rt-nav-zone" id="rt-nav-left" title="Previous step">${SVG_ARROW_LEFT} Back</div>
          <div class="rt-nav-divider"></div>
          <div class="rt-nav-zone" id="rt-nav-right" title="Next step">Next ${SVG_ARROW_RIGHT}</div>
        </div>
      </div>
      <div class="rt-bot-wrapper" id="rt-bot-avatar">
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="rt-anim-hover">
          <line x1="32" y1="4" x2="32" y2="14" stroke="#0a0a0a" stroke-width="2.5" stroke-linecap="square"/>
          <circle cx="32" cy="4" r="3" fill="#ffe500" stroke="#0a0a0a" stroke-width="2"/>
          <rect x="6" y="24" width="8" height="16" fill="#0055ff" stroke="#0a0a0a" stroke-width="2.5"/>
          <rect x="50" y="24" width="8" height="16" fill="#0055ff" stroke="#0a0a0a" stroke-width="2.5"/>
          <rect x="12" y="14" width="40" height="38" fill="#ffffff" stroke="#0a0a0a" stroke-width="2.5"/>
          <rect x="18" y="20" width="28" height="14" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="2"/>
          <g class="rt-anim-blink">
            <rect x="23" y="24" width="4" height="6" fill="#ffe500"/>
            <rect x="37" y="24" width="4" height="6" fill="#ffe500"/>
          </g>
          <rect x="22" y="40" width="20" height="4" fill="#0a0a0a"/>
        </svg>
      </div>
    `;
  }
  
  
  /* ── COMPLETED STEPS ─────────────────────────────────────────────── */
  function getCompletedKey() {
    if (!S.currentModuleId || !S.currentLessonId) return null;
    return `${S.currentModuleId}_${S.currentLessonId}`;
  }
  
  function loadCompletedSteps() {
    completedStepIndices = _progress.completedSteps;
  }

  function saveCompletedSteps() {
    _progress.completedSteps = completedStepIndices;
    _scheduleProgress();
  }
  
  function isStepCompleted(index) {
    const key = getCompletedKey();
    if (!key) return false;
    return completedStepIndices[key] && completedStepIndices[key].includes(index);
  }
  
  function markStepCompleted(index) {
    const key = getCompletedKey();
    if (!key) return;
    if (!completedStepIndices[key]) completedStepIndices[key] = [];
    if (!completedStepIndices[key].includes(index)) {
      completedStepIndices[key].push(index);
      saveCompletedSteps();
    }
  }
  
  function clearCompletedForLesson() {
    const key = getCompletedKey();
    if (key && completedStepIndices[key]) {
      delete completedStepIndices[key];
      saveCompletedSteps();
    }
  }
  
  function setStepVerified(verified) {
    stepVerified = verified;
    if ($bubble) {
      $bubble.classList.toggle('rt-step-verified', verified);
      $bubble.classList.toggle('rt-step-unverified', !verified);
    }
  }
  
  /* ── TOGGLE MAP ──────────────────────────────────────────────────── */
  const TOGGLE_MAP = {
    't-protractors': 'showProtractors',
    't-labels': 'showLabels',
    't-vertices': 'showVertices',
    't-center': 'showCenter',
    't-sidelabels': 'showSideLabels',
    't-diagonals': 'showDiagonals',
    't-radii': 'showRadii',
    't-fill': 'fill',
    't-grid': 'grid'
  };
  
  function getLiveAppState() {
    const st = {};
    Object.entries(TOGGLE_MAP).forEach(([id, feature]) => {
      const el = document.getElementById(id);
      if (el) st[feature] = el.checked;
    });
    const sl = document.getElementById('sl-sides');
    if (sl) st.sides = parseInt(sl.value, 10);
    const sr = document.getElementById('sl-radius');
    if (sr) st.radius = parseInt(sr.value, 10);
    const ro = document.getElementById('sl-rot');
    if (ro) st.rotation = parseInt(ro.value, 10);
    const sa = document.getElementById('sl-anim');
    if (sa) st.animProgress = parseFloat(sa.value);
    const activeBtn = document.querySelector('.anim-mode-btn.active');
    if (activeBtn) st.animMode = activeBtn.dataset.mode;
    const overlay = document.getElementById('overlay');
    st.settingsOpen = overlay ? overlay.classList.contains('open') : false;
    if (window.__polygonState) st.customVerts = window.__polygonState.customVerts;
    return st;
  }
  
  function getStateSummary() {
    const s = getLiveAppState();
    return `Polygon sides: ${s.sides || 6}, irregular: ${s.customVerts ? 'yes' : 'no'}, protractors: ${s.showProtractors ? 'on' : 'off'}, labels: ${s.showLabels ? 'on' : 'off'}`;
  }
  
  function precheckStep(step) {
    if (!step || !step.action || !step.expectedData) return false;
    const live = getLiveAppState();
    const exp = step.expectedData;
    if (['reset_polygon', 'drag_vertex', 'speak_answer', 'change_animProgress', 'pan_canvas', 'zoom_in', 'zoom_out', 'zoom_reset'].includes(step.action)) return false;
    if (step.action === 'open_settings') return live.settingsOpen === true;
    if (step.action === 'close_settings') return live.settingsOpen === false;
    if (step.action === 'toggle_feature' && exp.feature) {
      return live[exp.feature] === exp.enabled;
    }
    if (step.action === 'change_sides' && exp.value !== undefined) return live.sides === exp.value;
    if (step.action === 'change_rotation' && exp.value !== undefined) return live.rotation === exp.value;
    if (step.action === 'change_radius' && exp.value !== undefined) return live.radius === exp.value;
    if (step.action === 'change_anim_mode' && exp.mode) return live.animMode === exp.mode;
    return false;
  }
  
  /* ── FREE‑CHAT & LESSON GEN ──────────────────────────────────────── */
  async function handleFreeChatQuery(question) {
    if (!S.apiKey) {
      typeText("The AI teacher needs an API key. Add it in the settings.");
      showBubble();
      return;
    }
    isFetching = true;
    showLoading();
    try {
      const stateSummary = getStateSummary();
      const prompt = `You are ROBO-TEACH, a friendly math teacher for JSS2 students. The user is exploring a polygon explorer app. Current polygon state: ${stateSummary}. The user asks: "${question}". Give a clear, short, and encouraging answer (2‑4 sentences). Use simple language. Mention the current polygon if relevant.`;
      const res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${S.apiKey}` },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: prompt }], temperature: 0.5, max_tokens: 200 })
      });
      const result = await res.json();
      const reply = result.choices[0].message.content.trim();
      isFetching = false;
      await typeText(reply);
      showBubble();
    } catch (e) {
      isFetching = false;
      typeText("Sorry, I couldn't reach the AI. Check your connection.");
      showBubble();
    }
  }
  
  async function requestCustomLesson(topic) {
    if (!S.apiKey) {
      typeText("The AI teacher needs an API key to create custom lessons.");
      showBubble();
      return;
    }
    if (isSleeping) {
      isSleeping = false;
      $botAvatar.classList.remove('rt-sleeping');
    }
    isFetching = true;
    showBubble();
    showLoading();
    try {
      const stateSummary = getStateSummary();
      const prompt = `You are ROBO-TEACH, an expert math teacher for JSS2. Create a mini‑lesson (4‑5 steps) teaching the user about: "${topic}". The lesson should be a JSON array of steps. Each step needs: target, action, expectedData (if needed), instruction, reminder, success. Use actions: reset_polygon, open_settings, close_settings, change_sides, toggle_feature (feature names: showProtractors, showLabels, showVertices, showCenter, showSideLabels, showDiagonals, showRadii, fill, grid), change_anim_mode (interior/exterior/none), change_animProgress, drag_vertex, speak_answer (with expectedAnswer), return_to_map. The FINAL two steps must be a speak_answer question followed by return_to_map. Current polygon: ${stateSummary}. Return ONLY valid JSON array. No markdown.`;
      const res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${S.apiKey}` },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: prompt }], temperature: 0.7, max_tokens: 1200 })
      });
      const result = await res.json();
      const content = result.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const newSteps = JSON.parse(jsonMatch[0]);
        S.tutorialSteps = newSteps;
        currentStepIndex = 0;
        isTeachingMode = false;
        saveModuleState();
        displayCurrentStep();
      } else {
        throw new Error("No JSON array found");
      }
      isFetching = false;
    } catch (e) {
      isFetching = false;
      typeText("Sorry, I couldn't generate a lesson right now.");
      showBubble();
    }
  }
  
  /* ── SLEEP / SHOW ────────────────────────────────────────────────── */
  function toggleSleep() {
    if (isSleeping) {
      isSleeping = false;
      $botAvatar.classList.remove('rt-sleeping');
      showBubble();
      displayCurrentStep();
    } else {
      isSleeping = true;
      $botAvatar.classList.add('rt-sleeping');
      removeHighlight();
      clearTimeout(reminderTimer);
      hideBubble();
      if (isListening && recognition) recognition.stop();
    }
  }
  
  function showBubble() {
    if (isSleeping) return;
    isMuted = false;
    $bubble.classList.add('rt-show');
  }
  
  function hideBubble() {
    isMuted = true;
    $bubble.classList.remove('rt-show');
  }
  
  /* ── VOICE ───────────────────────────────────────────────────────── */
  function initSpeechRecognition() {
    const SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onstart = () => {
      isListening = true;
      $micBtn.classList.add('rt-active');
      $status.classList.add('rt-listening');
      document.getElementById('rt-title-text').innerText = isAskMode ? 'LISTENING (Ask)' : 'LISTENING...';
    };
    rec.onend = () => {
      isListening = false;
      $micBtn.classList.remove('rt-active');
      $status.classList.remove('rt-listening');
      updateTitleText();
    };
    rec.onresult = (e) => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      if (e.results[e.results.length - 1].isFinal) processVoiceInput(t.trim());
    };
    rec.onerror = () => {
      if (isSleeping) return;
      isListening = false;
      $micBtn.classList.remove('rt-active');
      $status.classList.remove('rt-listening');
      updateTitleText();
      typeText("Sorry, I didn't catch that. Please try again.");
      showBubble();
    };
    return rec;
  }
  
  function updateTitleText() {
    if (isAskMode) {
      document.getElementById('rt-title-text').innerText = 'ASK MODE';
      return;
    }
    let title = isTeachingMode ? 'TEACHING MODE' : 'TUTORIAL';
    if (S.currentModuleId) {
      const mod = window.PolygonModules && window.PolygonModules[S.currentModuleId];
      if (mod) title = mod.title + ' - L' + S.currentLessonId;
    } else if (S.tutorialSteps.length > 0 && currentStepIndex < S.tutorialSteps.length) {
      title = `STEP ${currentStepIndex + 1}/${S.tutorialSteps.length}`;
    }
    document.getElementById('rt-title-text').innerText = title;
  }
  
  function toggleMic() {
    if (isSleeping) return;
    if (!recognition) {
      typeText("Voice input not supported.");
      showBubble();
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      showBubble();
      if (isAskMode) {
        typeText("Ask anything! Speak now.");
      } else {
        typeText("I'm listening... speak now.");
      }
      recognition.start();
    }
  }
  
  async function processVoiceInput(transcript) {
    if (!transcript || isSleeping) return;
    showBubble();
    
    if (isAskMode) {
      await typeText(`You asked: "${transcript}"`);
      handleFreeChatQuery(transcript);
      return;
    }
    
    // Normal tutorial flow
    await typeText(`You said: "${transcript}"`);
    const step = S.tutorialSteps[currentStepIndex];
    if (!step) return;
    
    if (step.action === 'speak_answer' && step.expectedAnswer) {
      const correct = looseMatch(step.expectedAnswer, transcript);
      if (correct) {
        setStepVerified(true);
        markStepCompleted(currentStepIndex);
        await typeText(step.success || "Correct! Tap Next to continue.");
        removeHighlight();
        clearTimeout(reminderTimer);
        return;
      }
      if (!S.apiKey) {
        await typeText(step.reminder || "Not quite. Try again!");
        startReminderTimer();
        return;
      }
      await interpretTutorialVoice(transcript, step);
    } else if (S.apiKey) await interpretTutorialVoice(transcript, step);
    else setTimeout(() => {
      typeText("Got it! Keep exploring.");
      showBubble();
    }, 800);
  }
  
  async function interpretTutorialVoice(transcript, step) {
    isFetching = true;
    showLoading();
    try {
      const stateSummary = getStateSummary();
      const prompt = `You are ROBO-TEACH. Step: "${step.instruction}" Action: "${step.action}". User said: "${transcript}". Current polygon: ${stateSummary}. Evaluate if they completed the step. Reply JSON: {"completed":true/false, "reason":"One sentence praise or gentle correction."}`;
      const res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${S.apiKey}` },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: prompt }], temperature: 0.3, max_tokens: 120 })
      });
      const result = await res.json();
      const content = result.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { completed: false };
      isFetching = false;
      if (parsed.completed) {
        setStepVerified(true);
        markStepCompleted(currentStepIndex);
        await typeText(parsed.reason || "Spot on!");
        removeHighlight();
        clearTimeout(reminderTimer);
      } else {
        await typeText(parsed.reason || step.reminder);
        startReminderTimer();
      }
    } catch (e) {
      isFetching = false;
      typeText("I heard you! Try again.");
      startReminderTimer();
    }
  }
  
  /* ── HIGHLIGHTING ────────────────────────────────────────────────── */
  function applyHighlight(selector) {
    removeHighlight();
    if (!selector) return;
    const el = document.querySelector(selector);
    if (el) {
      if (el.type === 'range') currentHighlightEl = el.closest('.slider-wrap') || el;
      else if (el.type === 'checkbox') currentHighlightEl = el.closest('.toggle') || el;
      else currentHighlightEl = el;
      if (window.getComputedStyle(currentHighlightEl).position === 'static') {
        currentHighlightEl.style.position = 'relative';
        currentHighlightEl.dataset.rtAddedPosition = 'true';
      }
      currentHighlightEl.classList.add('rt-highlight-target');
    }
  }
  
  function removeHighlight() {
    if (currentHighlightEl) {
      currentHighlightEl.classList.remove('rt-highlight-target');
      if (currentHighlightEl.dataset.rtAddedPosition) {
        currentHighlightEl.style.position = '';
        delete currentHighlightEl.dataset.rtAddedPosition;
      }
    }
    currentHighlightEl = null;
  }
  
  /* ── TYPEWRITER ──────────────────────────────────────────────────── */
  async function typeText(htmlString) {
    isTyping = true;
    currentTypeSession++;
    const session = currentTypeSession;
    $text.innerHTML = '';
    const parts = htmlString.split(/(<[^>]+>)/g);
    for (let part of parts) {
      if (isMuted || session !== currentTypeSession) break;
      if (part.startsWith('<')) $text.innerHTML += part;
      else
        for (let i = 0; i < part.length; i++) {
          if (isMuted || session !== currentTypeSession) break;
          $text.innerHTML += part.charAt(i);
          await new Promise(r => setTimeout(r, 20));
        }
    }
    if (session === currentTypeSession) isTyping = false;
  }
  
  function showLoading() {
    currentTypeSession++;
    isTyping = false;
    $text.innerHTML = '<div class="rt-typing"><span></span><span></span><span></span></div>';
  }
  
  /* ── PERSISTENCE ─────────────────────────────────────────────────── */
  function saveAppState(state) {
    if (!state) return;
    lastAppState = state;
    _progress.appState = state;
    _scheduleProgress();
  }

  function getAppState() { return _progress.appState; }

  function saveModuleState() {
    _progress.currentModule = { moduleId: S.currentModuleId, lessonId: S.currentLessonId, stepIndex: currentStepIndex };
    _scheduleProgress();
  }

  function restoreModuleState() { return _progress.currentModule; }
  
  function handleReturnToMap() {
    removeHighlight();
    clearTimeout(reminderTimer);
    hideBubble();
    const mId = S.currentModuleId,
      lId = S.currentLessonId;
    if (mId && lId) {
      _progress.completedLessons[`${mId}_${lId}`] = true;
      clearCompletedForLesson();
      _progress.currentModule = null;
      _progress.currentStep = 0;
      _scheduleProgress();
    }
    if (S.onLessonComplete) S.onLessonComplete(mId, lId);
    S.tutorialSteps = [];
    S.currentModuleId = null;
    S.currentLessonId = null;
    currentStepIndex = 0;
    setStepVerified(false);
    isTeachingMode = false;
  }
  
  /* ── SINGLE‑TAP NAVIGATION ───────────────────────────────────────── */
  function onNavZoneClick(side) {
    if (isTransitioning) return;
    if (side === 'right') {
      const step = S.tutorialSteps[currentStepIndex];
      if (!step) return;
      if (step.action === 'return_to_map') { handleReturnToMap(); return; }
      if (stepVerified) {
        const next = currentStepIndex + 1;
        if (next >= S.tutorialSteps.length) { handleReturnToMap(); return; }
        if (S.tutorialSteps[next].action === 'return_to_map') {
          currentStepIndex = next;
          saveModuleState();
          handleReturnToMap();
          return;
        }
        currentStepIndex = next;
        saveModuleState();
        while (currentStepIndex < S.tutorialSteps.length) {
          const cur = S.tutorialSteps[currentStepIndex];
          if (!cur || cur.action === 'return_to_map') break;
          if (precheckStep(cur)) {
            markStepCompleted(currentStepIndex);
            currentStepIndex++;
            saveModuleState();
          } else break;
        }
        if (currentStepIndex >= S.tutorialSteps.length || S.tutorialSteps[currentStepIndex].action === 'return_to_map') {
          handleReturnToMap();
        } else {
          setStepVerified(isStepCompleted(currentStepIndex));
          displayCurrentStep();
        }
      } else {
        showBubble();
        typeText(step.reminder || "Complete this step first, then tap Next.");
        startReminderTimer();
      }
    } else if (side === 'left') {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        saveModuleState();
        setStepVerified(isStepCompleted(currentStepIndex));
        displayCurrentStep();
      } else {
        showBubble();
        typeText("You're at the first step.");
      }
    }
  }
  
  function displayCurrentStep() {
    const step = S.tutorialSteps[currentStepIndex];
    if (!step || step.action === 'return_to_map') { handleReturnToMap(); return; }
    removeHighlight();
    clearTimeout(reminderTimer);
    showBubble();
    updateTitleText();
    setStepVerified(isStepCompleted(currentStepIndex));
    typeText(step.instruction);
    applyHighlight(step.target);
    startReminderTimer();
  }
  
  /* ── TUTORIAL ENGINE ─────────────────────────────────────────────── */
  function startTutorial() {
    if (isSleeping) return;
    const saved = restoreModuleState();
    if (saved && saved.moduleId && saved.lessonId) {
      const mod = window.PolygonModules && window.PolygonModules[saved.moduleId];
      if (mod) {
        const les = mod.lessons[saved.lessonId - 1];
        if (les) {
          S.currentModuleId = saved.moduleId;
          S.currentLessonId = saved.lessonId;
          S.tutorialSteps = [...les.steps];
          currentStepIndex = saved.stepIndex || 0;
          isTeachingMode = false;
          updateTitleText();
          showBubble();
          setStepVerified(isStepCompleted(currentStepIndex));
          displayCurrentStep();
          return;
        }
      }
    }
    currentStepIndex = _progress.currentStep || 0;
    lastAppState = getAppState();
    if (currentStepIndex >= S.tutorialSteps.length && S.tutorialSteps.length > 0) {
      isTeachingMode = true;
      displayCurrentStep();
    } else if (currentStepIndex > 0) {
      showBubble();
      setStepVerified(isStepCompleted(currentStepIndex));
      displayCurrentStep();
    }
    else displayCurrentStep();
  }
  
  function playCurrentStep() {
    if (isSleeping) return;
    const step = S.tutorialSteps[currentStepIndex];
    if (step && step.action === 'return_to_map') { handleReturnToMap(); return; }
    if (!step) {
      isTeachingMode = true;
      removeHighlight();
      updateTitleText();
      requestCustomLesson("Polygons");
      return;
    }
    displayCurrentStep();
  }
  
  function startReminderTimer() {
    clearTimeout(reminderTimer);
    if (isSleeping) return;
    reminderTimer = setTimeout(() => {
      if (!isMuted && !stepVerified) {
        const step = S.tutorialSteps[currentStepIndex];
        if (step) typeText(step.reminder || "Complete this step, then tap Next.");
      }
      startReminderTimer();
    }, 15000);
  }
  
  /* ── DATA MATCHING ───────────────────────────────────────────────── */
  function dataMatches(expected, actual) {
    if (!expected || Object.keys(expected).length === 0) return true;
    for (const [k, v] of Object.entries(expected)) {
      if (!(k in actual)) return false;
      if (String(actual[k]) === String(v)) continue;
      if (typeof v === 'boolean' && Boolean(actual[k]) === v) continue;
      return false;
    }
    return true;
  }
  
  async function handleObservation(actionName, data = {}) {
    if (isSleeping) return;
    const obsKey = actionName + JSON.stringify(data);
    const now = Date.now();
    if (obsKey === lastObservation.key && now - lastObservation.time < 800) return;
    lastObservation = { key: obsKey, time: now };
    if (data && data.state) saveAppState(data.state);
    const step = S.tutorialSteps[currentStepIndex];
    if (!step || isTransitioning) return;
    if (step.action === 'return_to_map') return;
    let isMatch = (actionName === step.action);
    if (isMatch && step.expectedData) isMatch = dataMatches(step.expectedData, data);
    if (isMatch) {
      clearTimeout(reminderTimer);
      removeHighlight();
      setStepVerified(true);
      markStepCompleted(currentStepIndex);
      saveModuleState();
      _progress.currentStep = currentStepIndex;
      _scheduleProgress();
      showBubble();
      await typeText(step.success || "Done! Tap Next to continue.");
      return;
    }
    if (S.apiKey && !isFetching && !isTyping && actionName !== 'speak_answer') {
      showBubble();
      fetchSmartCorrection(actionName, data, step);
    } else startReminderTimer();
  }
  
  async function fetchSmartCorrection(wrongAction, data, step) {
    isFetching = true;
    showLoading();
    clearTimeout(reminderTimer);
    try {
      const stateSummary = getStateSummary();
      const prompt = `Goal: "${step.instruction}". User performed: '${wrongAction}' (data: ${JSON.stringify(data)}). Current polygon: ${stateSummary}. Write ONE short sentence gently explaining what they did differently, and ONE sentence guiding them back to the correct action.`;
      const res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${S.apiKey}` },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: prompt }], temperature: 0.5, max_tokens: 100 })
      });
      if (!res.ok) throw new Error("API Error");
      const result = await res.json();
      isFetching = false;
      await typeText(result.choices[0].message.content.trim());
      startReminderTimer();
    } catch (e) {
      isFetching = false;
      typeText(step.reminder);
      startReminderTimer();
    }
  }
  
  /* ── AUTO‑OBSERVE UI ─────────────────────────────────────────────── */
  function setupControlObservers() {
    Object.entries(TOGGLE_MAP).forEach(([id, feature]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => handleObservation('toggle_feature', { feature, enabled: el.checked }));
    });
    const sliders = [
      { id: 'sl-sides', action: 'change_sides', key: 'value', num: true },
      { id: 'sl-rot', action: 'change_rotation', key: 'value', num: true },
      { id: 'sl-radius', action: 'change_radius', key: 'value', num: true },
      { id: 'sl-anim', action: 'change_animProgress', key: null, num: false }
    ];
    sliders.forEach(({ id, action, key, num }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        const data = key ? {
          [key]: num ? parseInt(el.value, 10) : el.value
        } : {};
        handleObservation(action, data);
      });
    });
    document.querySelectorAll('.anim-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => handleObservation('change_anim_mode', { mode: btn.dataset.mode }));
    });
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => handleObservation('zoom_in'));
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => handleObservation('zoom_out'));
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => handleObservation('zoom_reset'));
    document.getElementById('fab')?.addEventListener('click', () => handleObservation('open_settings'));
    document.getElementById('modal-close')?.addEventListener('click', () => handleObservation('close_settings'));
  }
  
  function setupDraggableBot() {
    $botAvatar.addEventListener('pointerdown', (e) => {
      const rect = $root.getBoundingClientRect();
      if (!$root.style.left && !$root.style.top) {
        $root.style.left = rect.left + 'px';
        $root.style.top = rect.top + 'px';
        $root.style.bottom = 'auto';
        $root.style.right = 'auto';
      }
      isDraggingBot = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialBotX = $root.offsetLeft;
      initialBotY = $root.offsetTop;
      $botAvatar.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });
    $botAvatar.addEventListener('pointermove', (e) => {
      if ($botAvatar.hasPointerCapture(e.pointerId)) {
        const dx = e.clientX - dragStartX,
          dy = e.clientY - dragStartY;
        if (Math.hypot(dx, dy) > 5) isDraggingBot = true;
        if (isDraggingBot) {
          $root.style.left = `${initialBotX + dx}px`;
          $root.style.top = `${initialBotY + dy}px`;
        }
      }
    });
    $botAvatar.addEventListener('pointerup', (e) => {
      $botAvatar.releasePointerCapture(e.pointerId);
      if (!isDraggingBot) {
        if (isSleeping) toggleSleep();
        else {
          showBubble();
          if (S.tutorialSteps.length > 0 && currentStepIndex < S.tutorialSteps.length) displayCurrentStep();
          else requestCustomLesson("Polygons");
        }
      }
      isDraggingBot = false;
    });
  }
  
  function loadModuleLesson(moduleId, lessonId) {
    const mod = window.PolygonModules && window.PolygonModules[moduleId];
    if (!mod) {
      typeText("Oops! That lesson isn't available yet.");
      showBubble();
      return;
    }
    const les = mod.lessons[lessonId - 1];
    if (!les) {
      typeText("Oops! That lesson isn't available yet.");
      showBubble();
      return;
    }
    if (isSleeping) {
      isSleeping = false;
      $botAvatar.classList.remove('rt-sleeping');
    }
    S.tutorialSteps = [...les.steps];
    S.currentModuleId = moduleId;
    S.currentLessonId = lessonId;
    currentStepIndex = 0;
    isTeachingMode = false;
    isTransitioning = false;
    clearTimeout(reminderTimer);
    saveModuleState();
    loadCompletedSteps();
    const allDone = S.tutorialSteps.every((_, i) => isStepCompleted(i) || S.tutorialSteps[i].action === 'return_to_map');
    if (allDone) clearCompletedForLesson();
    showBubble();
    updateTitleText();
    while (currentStepIndex < S.tutorialSteps.length) {
      const step = S.tutorialSteps[currentStepIndex];
      if (!step || step.action === 'return_to_map') break;
      if (precheckStep(step)) {
        markStepCompleted(currentStepIndex);
        currentStepIndex++;
        saveModuleState();
      } else break;
    }
    if (currentStepIndex >= S.tutorialSteps.length || S.tutorialSteps[currentStepIndex].action === 'return_to_map') {
      handleReturnToMap();
    } else {
      const first = S.tutorialSteps[currentStepIndex];
      setStepVerified(isStepCompleted(currentStepIndex));
      typeText("<strong>" + mod.title + " - Lesson " + lessonId + ": " + les.title + "</strong><br><br>" + les.explanation + "<br><br>" + first.instruction);
      applyHighlight(first.target);
      startReminderTimer();
    }
  }
  
  function mount() {
    if (mounted) return;
    mounted = true;
    if (!document.getElementById('rt-guide-styles')) {
      const style = document.createElement('style');
      style.id = 'rt-guide-styles';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    $root = document.createElement('div');
    $root.id = 'rt-guide-wrapper';
    $root.innerHTML = buildHTML();
    document.body.appendChild($root);
    $bubble = document.getElementById('rt-bubble');
    $text = document.getElementById('rt-text');
    $closeBtn = document.getElementById('rt-close-bubble');
    $powerBtn = document.getElementById('rt-power-btn');
    $micBtn = document.getElementById('rt-mic-btn');
    $askBtn = document.getElementById('rt-ask-btn');
    $botAvatar = document.getElementById('rt-bot-avatar');
    $status = document.getElementById('rt-status');
    $navLeft = document.getElementById('rt-nav-left');
    $navRight = document.getElementById('rt-nav-right');
    if (!S.apiKey) $status.classList.add('rt-offline');
    $closeBtn.addEventListener('click', hideBubble);
    $powerBtn.addEventListener('click', toggleSleep);
    $micBtn.addEventListener('click', toggleMic);
    $askBtn.addEventListener('click', () => {
      if (isSleeping) return;
      isAskMode = !isAskMode;
      if (isAskMode) {
        $askBtn.classList.add('rt-active');
        typeText("Question mode ON. Tap Mic to ask anything about the shape.");
      } else {
        $askBtn.classList.remove('rt-active');
        typeText("Question mode OFF. Mic will answer lesson questions.");
      }
      updateTitleText();
      showBubble();
    });
    $navLeft.addEventListener('click', (e) => {
      e.stopPropagation();
      onNavZoneClick('left');
    });
    $navRight.addEventListener('click', (e) => {
      e.stopPropagation();
      onNavZoneClick('right');
    });
    $bubble.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
    _loadProgress();
    setupDraggableBot();
    recognition = initSpeechRecognition();
    setTimeout(setupControlObservers, 300);
  }
  
  global.RobotTeacher = {
    init(c) {
      Object.assign(S, c);
      if (S.onLessonComplete === undefined && c.onLessonComplete) S.onLessonComplete = c.onLessonComplete;
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
      else mount();
      return this;
    },
    observe(a, d) {
      if (!mounted || isSleeping) return;
      handleObservation(a, d);
    },
    startTargetedLesson(topic) { requestCustomLesson(topic); },
    startTutorial() { startTutorial(); },
    loadModuleLesson(m, l) { if (!mounted) { setTimeout(() => loadModuleLesson(m, l), 500); return; } loadModuleLesson(m, l); },
    disable() { if (!isSleeping) toggleSleep(); }
  };
})(window);