const chatbotcss = `
/* ════════════════════════════════════════
   PREPBOT — NEO-BRUTALIST THEME (Blue Accent)
   Colors, borders, and style aligned with the main application
   ════════════════════════════════════════ */

/* ── FONTS ── */
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=JetBrains+Mono:wght@400;600&family=DM+Serif+Display&display=swap');

/* ── THEME VARIABLES (Matching Main Theme) ── */
#prepbot,
#prepbot *,
#chat-fab-wrap,
#chat-fab-wrap *,
#chat-fab-restore,
#chat-window,
#chat-window * {
    --bg: #ffffff;
    --app-bg: #f0ece3;
    --ink: #0a0a0a;
    --yellow: #ffe500;
    --blue: #0055ff;
    --red: #ff2200;
    --green: #00a550;
    --amber: #e67e00;
    --muted: #777;
    --light-muted: #888;
    --off: #f7f4ee;
    --paper: #fffef8;
    --ruled: #ece8df;
    --border: 2.5px solid #0a0a0a;
    --cb: cubic-bezier(0.22, 1, 0.36, 1);
    box-sizing: border-box;
}

/* ── FAB WRAP ── */
#chat-fab-wrap {
    position: fixed;
    bottom: 32px;
    right: 32px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: transform 0.25s var(--cb), opacity 0.2s ease;
}

#chat-fab-wrap.fab-hidden {
    transform: translateY(16px);
    opacity: 0;
    pointer-events: none;
}

/* ── DISMISS X ── */
#chat-fab-dismiss {
    width: 22px;
    height: 22px;
    border-radius: 0;
    background: var(--ink);
    border: var(--border);
    color: var(--bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0.7);
    transition: opacity 0.2s ease, transform 0.2s var(--cb), background 0.15s;
    flex-shrink: 0;
    font-size: 16px;
    font-weight: bold;
    font-family: 'JetBrains Mono', monospace;
}

#chat-fab-wrap:hover #chat-fab-dismiss {
    opacity: 1;
    transform: scale(1);
}

#chat-fab-dismiss:hover {
    background: var(--red);
    border-color: var(--ink);
    color: var(--bg);
}

/* ── RESTORE TAB ── */
#chat-fab-restore {
    position: fixed;
    bottom: 50%;
    right: -62px;
    transform: translateY(50%);
    z-index: 9999;
    background: var(--ink);
    color: var(--bg);
    border: var(--border);
    border-right: none;
    padding: 10px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-family: 'Unbounded', sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    transition: right 0.3s var(--cb), background 0.15s;
    box-shadow: -3px 0 0 var(--blue);
}

#chat-fab-restore.fab-restore-visible { right: 0; }

#chat-fab-restore:hover {
    background: var(--blue);
    color: var(--bg);
    border-color: var(--blue);
    box-shadow: -3px 0 0 var(--ink);
}

/* ── FAB BUTTON ── */
#chat-fab {
    z-index: 9999;
    width: auto;
    height: auto;
    background: var(--ink);
    border: var(--border);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px 12px 16px;
    outline: none;
    font-family: 'Unbounded', sans-serif;
    font-weight: 700;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--bg);
    transition: background 0.25s ease, transform 0.2s var(--cb), box-shadow 0.2s ease;
    box-shadow: 4px 4px 0 var(--blue);
}

#chat-fab:hover {
    background: var(--blue);
    color: var(--bg);
    border-color: var(--blue);
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--ink);
}

#chat-fab:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--ink);
}

#chat-fab .fab-dot {
    width: 7px;
    height: 7px;
    background: #4cff91;
    border-radius: 50%;
    flex-shrink: 0;
    animation: pulse-dot 2.4s ease-in-out infinite;
}

@keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.7); }
}

#chat-fab .fab-label { display: none; }

/* ── CHAT WINDOW ── */
#chat-window {
    position: fixed;
    bottom: 100px;
    right: 32px;
    width: 400px;
    height: 580px;
    z-index: 9998;
    background: var(--bg);
    border: var(--border);
    box-shadow: 8px 8px 0 var(--ink);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform: translateY(24px) scale(0.97);
    opacity: 0;
    pointer-events: none;
    transform-origin: bottom right;
    transition: transform 0.3s var(--cb), opacity 0.25s ease;
}

#chat-window.open {
    transform: translateY(0) scale(1);
    opacity: 1;
    pointer-events: all;
}

/* ── HEADER ── */
.chat-header {
    background: var(--ink);
    color: var(--bg);
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    border-bottom: var(--border);
}

.chat-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.chat-avatar {
    width: 36px;
    height: 36px;
    background: var(--blue);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: var(--border);
}

.chat-avatar svg {
    display: block;
    stroke: var(--bg);
}

.chat-header-info h4 {
    font-family: 'Unbounded', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 2px;
    color: var(--bg);
}

.chat-header-info .chat-status {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.62rem;
    font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: rgba(255, 255, 255, 0.4);
}

.chat-status-dot {
    width: 6px;
    height: 6px;
    background: #4cff91;
    border-radius: 50%;
    animation: pulse-dot 2.4s ease-in-out infinite;
}

.chat-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
}

.chat-icon-btn {
    width: 32px;
    height: 32px;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    color: rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
    font-size: 20px;
    font-weight: bold;
    font-family: 'JetBrains Mono', monospace;
}

.chat-icon-btn:hover {
    background: var(--blue);
    color: var(--bg);
    border-color: var(--blue);
}

/* ── QUIZ NAVIGATION PILL ── */
.quiz-nav-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--blue);
    color: var(--bg);
    padding: 8px 16px;
    font-family: 'Unbounded', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 12px 16px;
    border: var(--border);
    box-shadow: 3px 3px 0 var(--ink);
    width: calc(100% - 32px);
}

.quiz-nav-pill:hover {
    background: var(--ink);
    color: var(--blue);
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 var(--blue);
}

.quiz-nav-pill svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
}

/* ── MESSAGES AREA ── */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    scroll-behavior: smooth;
    background: var(--off);
}

.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-track { background: var(--ruled); }
.chat-messages::-webkit-scrollbar-thumb { background: var(--ink); }

/* ── INTRO CARD ── */
.chat-intro-card {
    border: var(--border);
    background: var(--bg);
    padding: 16px 18px;
    position: relative;
    overflow: hidden;
    box-shadow: 4px 4px 0 var(--ink);
}

.chat-intro-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--blue);
}

.chat-intro-card .intro-label {
    font-family: 'Unbounded', sans-serif;
    font-size: 0.58rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--blue);
    margin-bottom: 6px;
}

.chat-intro-card p {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    color: var(--muted);
    line-height: 1.65;
}

.chat-intro-card strong { color: var(--ink); }

/* ── MESSAGE BUBBLES ── */
.msg {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 86%;
    animation: msg-in 0.28s var(--cb) both;
}

@keyframes msg-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
}

.msg.user { align-self: flex-end; align-items: flex-end; }
.msg.bot  { align-self: flex-start; align-items: flex-start; }

.msg-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.56rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--light-muted);
}

.msg-bubble {
    padding: 10px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
    line-height: 1.65;
    position: relative;
    border: var(--border);
}

.msg.user .msg-bubble {
    background: var(--ink);
    color: var(--bg);
    box-shadow: 3px 3px 0 var(--blue);
}

.msg.bot .msg-bubble {
    background: var(--bg);
    color: var(--ink);
    border-left: 4px solid var(--blue);
    box-shadow: 3px 3px 0 var(--ruled);
}

.msg.bot .msg-bubble strong { color: var(--blue); font-weight: 700; }
.msg.bot .msg-bubble em { color: var(--ink); font-style: italic; }

/* Math styling */
.math-inline {
    font-family: 'JetBrains Mono', monospace;
    background: var(--off);
    padding: 2px 4px;
    border: 1px solid var(--ruled);
    display: inline-block;
}

.math-block {
    font-family: 'JetBrains Mono', monospace;
    background: var(--off);
    padding: 12px;
    margin: 12px 0;
    border: var(--border);
    overflow-x: auto;
}

.step-highlight {
    color: var(--blue);
    background: rgba(0, 85, 255, 0.1);
    padding: 2px 4px;
}

/* ── TYPING INDICATOR ── */
.typing-dots {
    display: flex;
    gap: 5px;
    align-items: center;
}

.typing-dots span {
    width: 7px;
    height: 7px;
    background: var(--blue);
    border-radius: 50%;
    animation: bounce 1.2s infinite ease-in-out;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
    40% { transform: translateY(-6px); opacity: 1; }
}

/* ── SUGGESTIONS STRIP ── */
.chat-suggestions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding: 12px 20px;
    border-top: var(--border);
    border-bottom: var(--border);
    background: var(--bg);
    flex-shrink: 0;
    justify-content: center;
    min-height: 0;
}

.chat-suggestions:empty {
    padding: 0;
    border: none;
}

.suggestion-chip {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding: 8px 12px;
    border: var(--border);
    background: var(--bg);
    color: var(--ink);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    box-shadow: 2px 2px 0 var(--ruled);
}

.suggestion-chip:hover {
    background: var(--blue);
    color: var(--bg);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--ink);
}

/* ── INPUT ROW ── */
.chat-input-row {
    display: flex;
    align-items: stretch;
    border-top: var(--border);
    flex-shrink: 0;
    background: var(--bg);
}

.chat-input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 0 4px 0 16px;
    gap: 6px;
}

#chat-input {
    flex: 1;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
    color: var(--ink);
    padding: 14px 0;
    line-height: 1.5;
    max-height: 96px;
    overflow-y: auto;
}

#chat-input::placeholder {
    color: var(--light-muted);
    opacity: 0.5;
}

/* ── SEND BUTTON ── */
#chat-send {
    width: 56px;
    background: var(--ink);
    color: var(--bg);
    border: none;
    border-left: var(--border);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s, color 0.2s;
}

#chat-send:hover:not(:disabled) { background: var(--blue); color: var(--bg); }
#chat-send:disabled { background: var(--light-muted); cursor: default; }
#chat-send .send-icon,
#chat-send .send-spinner { transition: opacity 0.15s; }
#chat-send .send-spinner { display: none; }
#chat-send.loading .send-icon { display: none; }
#chat-send.loading .send-spinner { display: block; }

@keyframes spin { to { transform: rotate(360deg); } }

.send-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--blue);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}

/* ── CLEAR CONFIRM BAR ── */
.chat-clear-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--ink);
    color: var(--bg);
    padding: 12px 20px;
    display: none;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
    border-top: var(--border);
}

.chat-clear-bar.visible { display: flex; }

.chat-clear-bar span {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.66rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.chat-clear-bar-actions { display: flex; gap: 8px; }

#clear-confirm,
#clear-cancel {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding: 6px 12px;
    border: var(--border);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    background: transparent;
}

#clear-confirm { background: var(--blue); color: var(--bg); border-color: var(--blue); }
#clear-confirm:hover { background: var(--ink); color: var(--blue); border-color: var(--ink); }
#clear-cancel { color: rgba(255, 255, 255, 0.6); border-color: rgba(255, 255, 255, 0.3); }
#clear-cancel:hover { color: #fff; border-color: #fff; }

/* ── Q-BUBBLES PANEL ── */
.qbubbles-bar {
    background: var(--bg);
    border-bottom: var(--border);
    padding: 12px 16px;
    flex-shrink: 0;
    animation: qbSlideDown 0.2s var(--cb) both;
}

@keyframes qbSlideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
}

.qbubbles-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.qbubbles-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.58rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--blue);
    display: flex;
    align-items: center;
    gap: 6px;
}

.qbubbles-close {
    background: none;
    border: var(--border);
    cursor: pointer;
    color: var(--ink);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 1;
    transition: all 0.15s;
    font-family: 'JetBrains Mono', monospace;
}

.qbubbles-close:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); }

.qbubbles-grid { display: flex; flex-wrap: wrap; gap: 6px; }

.qbubble {
    width: 34px;
    height: 34px;
    border: var(--border);
    background: var(--bg);
    color: var(--ink);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    box-shadow: 2px 2px 0 var(--ruled);
}

.qbubble:hover {
    background: var(--blue);
    border-color: var(--ink);
    color: var(--bg);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--ink);
}

.qbubble:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }

/* ── MICROPHONE ── */
#chat-mic {
    width: 44px;
    background: transparent;
    color: var(--light-muted);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: color 0.2s, background 0.2s;
}

#chat-mic:hover { color: var(--blue); background: rgba(0, 85, 255, 0.06); }
#chat-mic svg { transition: transform 0.2s var(--cb); }
#chat-mic.mic-active { color: var(--red); animation: pulse-mic 1.5s infinite; }
#chat-mic.mic-active svg { transform: scale(1.15); }

@keyframes pulse-mic {
    0%   { background: transparent; }
    50%  { background: rgba(255, 34, 0, 0.1); }
    100% { background: transparent; }
}

/* ── POPUP NUDGE ── */
/*
 * The popup must support MathJax-rendered content. Key rules:
 * - overflow-x: auto so wide equations scroll rather than clip
 * - min-height prevents the popup from collapsing while MathJax renders
 * - pointer-events: none until .visible is added (after typeset completes)
 * - p tag left as block for natural math layout
 */
#prepbot-popup {
    position: fixed;
    bottom: calc(72px + 1.4rem);
    right: 32px;
    max-width: 300px;
    min-height: 52px;
    background: var(--ink);
    color: var(--bg);
    border: var(--border);
    padding: 12px 36px 14px 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    line-height: 1.55;
    box-shadow: 6px 6px 0 var(--blue);
    cursor: pointer;
    z-index: 9997;
    opacity: 0;
    transform: translateY(8px) scale(0.96);
    pointer-events: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
    user-select: none;
    overflow-x: auto;
}

#prepbot-popup::after {
    content: '';
    position: absolute;
    bottom: -12px;
    right: 24px;
    border-width: 12px 8px 0 8px;
    border-style: solid;
    border-color: var(--ink) transparent transparent transparent;
}

#prepbot-popup.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
}

#prepbot-popup p {
    margin: 0;
    padding: 0;
    /* Allow block-level MathJax elements to lay out naturally */
    display: block;
    overflow-x: auto;
}

/* MathJax inside popup — scale down slightly to fit the compact container */
#prepbot-popup .MJX-TEX,
#prepbot-popup mjx-container {
    font-size: 0.92em !important;
    color: var(--bg);
}

/* Inline math colour fix inside dark popup */
#prepbot-popup mjx-container svg {
    fill: var(--bg);
    color: var(--bg);
}

.prepbot-popup-close {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.45);
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
}

.prepbot-popup-close:hover { color: var(--blue); }

/* ── SPEAKER BUTTON ── */
.speaker-btn {
    background: none;
    border: var(--border);
    cursor: pointer;
    color: var(--blue);
    padding: 5px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    margin-top: 8px;
    width: 28px;
    height: 28px;
}

.speaker-btn:hover { background: var(--blue); color: #fff; border-color: var(--blue); }

.soundwave {
    display: inline-flex;
    align-items: flex-end;
    gap: 2px;
    height: 14px;
    margin-left: 8px;
}

.soundwave span {
    width: 3px;
    background: var(--blue);
    border-radius: 1px;
    animation: wave-anim 1s infinite ease-in-out;
}

.soundwave span:nth-child(2) { animation-delay: 0.2s; height: 100%; }
.soundwave span:nth-child(3) { animation-delay: 0.4s; height: 60%; }

@keyframes wave-anim {
    0%, 100% { height: 4px; }
    50%       { height: 14px; }
}

.msg-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 10px;
    border-top: 1px solid var(--ruled);
    padding-top: 5px;
}

/* ── QUIZ NAV BAR ── */
.quiz-nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: var(--bg);
    border-bottom: var(--border);
    gap: 12px;
}

.quiz-nav-btn {
    font-family: 'Unbounded', sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding: 6px 12px;
    border: var(--border);
    background: var(--ink);
    color: var(--bg);
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 2px 2px 0 var(--blue);
}

.quiz-nav-btn:hover {
    background: var(--blue);
    color: var(--bg);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--ink);
}

.quiz-nav-info {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 600;
}

/* ── CONTEXT BANNER ── */
.chat-context-banner {
    display: none;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--blue);
    color: var(--bg);
    border-bottom: var(--border);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    flex-shrink: 0;
    overflow: hidden;
}

.chat-context-banner.active { display: flex; }

.chat-context-label {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.58rem;
    white-space: nowrap;
    flex-shrink: 0;
}

#chat-context-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.9;
}

.chat-context-clear {
    background: none;
    border: 1px solid rgba(255,255,255,0.4);
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    font-size: 14px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-family: 'JetBrains Mono', monospace;
    transition: all 0.15s;
}

.chat-context-clear:hover { background: rgba(255,255,255,0.2); color: #fff; }

/* ── ACTION PILLS (legacy Quiz.getState pages) ── */
.prepbot-action-bar {
    padding: 10px 16px 0;
    display: flex;
    flex-shrink: 0;
}

.prepbot-action-bar--qnav {
    align-items: center;
    gap: 8px;
    overflow: hidden;
    padding-bottom: 10px;
    border-bottom: var(--border);
}

.prepbot-nav-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    white-space: nowrap;
    flex-shrink: 0;
}

.prepbot-qpills-scroll {
    display: flex;
    gap: 5px;
    overflow-x: auto;
    flex: 1;
    padding-bottom: 4px;
}

.prepbot-qpills-scroll::-webkit-scrollbar { height: 3px; }
.prepbot-qpills-scroll::-webkit-scrollbar-thumb { background: var(--ink); }

.prepbot-pill {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding: 7px 14px;
    border: var(--border);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.18s;
    white-space: nowrap;
}

.prepbot-pill--primary {
    background: var(--blue);
    color: var(--bg);
    box-shadow: 3px 3px 0 var(--ink);
}

.prepbot-pill--primary:hover {
    background: var(--ink);
    color: var(--blue);
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 var(--blue);
}

.prepbot-qpill {
    width: 30px;
    height: 30px;
    min-width: 30px;
    border: var(--border);
    background: var(--bg);
    color: var(--ink);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    box-shadow: 2px 2px 0 var(--ruled);
    flex-shrink: 0;
}

.prepbot-qpill:hover { background: var(--blue); color: var(--bg); }

.prepbot-qpill.qpill--current {
    background: var(--ink);
    color: var(--yellow);
    border-color: var(--ink);
}

.prepbot-qpill.qpill--answered { background: var(--off); color: var(--muted); }
.prepbot-qpill.qpill--correct { background: var(--green); color: var(--bg); border-color: var(--green); }
.prepbot-qpill.qpill--wrong { background: var(--red); color: var(--bg); border-color: var(--red); }

/* ── INLINE VIDEO PLAYER ── */
.chat-video-player {
    border: var(--border);
    background: var(--bg);
    box-shadow: 4px 4px 0 var(--ink);
    overflow: hidden;
    width: 100%;
}

.chat-video-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--ink);
    color: var(--bg);
    gap: 10px;
}

.chat-video-info { flex: 1; overflow: hidden; }

.chat-video-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--bg);
}

.chat-video-channel {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    color: rgba(255,255,255,0.5);
    margin-top: 2px;
}

.chat-video-close {
    background: none;
    border: 1px solid rgba(255,255,255,0.3);
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
    transition: all 0.15s;
    font-family: 'JetBrains Mono', monospace;
}

.chat-video-close:hover { background: var(--red); border-color: var(--red); color: #fff; }

.chat-video-container {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
}

.chat-video-container iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    border: none;
}

.video-play-chip {
    background: var(--red) !important;
    color: var(--bg) !important;
    border-color: var(--red) !important;
}

.video-play-chip:hover {
    background: var(--ink) !important;
    color: var(--bg) !important;
    border-color: var(--ink) !important;
}

/* ── MOBILE ── */
@media (max-width: 480px) {
    #chat-window {
        width: calc(100vw - 16px);
        right: 4px;
        top: 6dvh;
        height: 90dvh;
        max-height: 700px;
    }

    #chat-fab-wrap {
        right: 16px;
        bottom: 20px;
    }

    #chat-fab { padding: 10px 16px 10px 12px; }

    .suggestion-chip {
        font-size: 0.6rem;
        padding: 6px 10px;
    }

    .quiz-nav-pill {
        font-size: 0.65rem;
        padding: 6px 12px;
    }

    #prepbot-popup {
        right: 16px;
        max-width: calc(100vw - 80px);
        font-size: 0.7rem;
    }
}
`;

export default chatbotcss;