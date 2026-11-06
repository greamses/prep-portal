/* PrepBot Board — the page.
   A lesson is a run of TURNS. In each, beats stream in and the scheduler has
   them said and drawn together; the learner can cut in at any moment by
   tapping the board, typing, or the mic, and their words start the next turn.
   ?fixture=projectile plays a demo turn from a file (no AI). */

import { createBoard } from "./board/board.js";
import { makeCanvas } from "./board/layout.js";
import { HANDS, setHand } from "./board/render.js";
import { cleanBeat } from "./protocol/ops.js";
import { createVoice } from "./voice.js";
import { createScheduler } from "./scheduler.js";
import { liveTurn } from "./turn.js";
import { createListener } from "/utils/prepbot/listen.js";
import { loadMath } from "/utils/components/workbook/mathify.js";
import { heroPaint } from "/utils/components/nav-icons.js";

try {
  const t = localStorage.getItem("pp-theme");
  if (t) document.documentElement.setAttribute("data-theme", t);
} catch {}

const $ = (id) => document.getElementById(id);
const svg = $("pb-board");
const caption = $("pb-caption");
const status = $("pb-status");
const input = $("pb-input");
const params = new URLSearchParams(location.search);

const paint = document.querySelector(".pb-paint");
if (paint) paint.innerHTML = heroPaint();

const ICONS = {
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.6 3.9 7 11.1a1.25 1.25 0 0 0 0 1.8l7.6 7.2a1.3 1.3 0 0 0 1.8-1.9L10 12l6.4-6.2a1.3 1.3 0 0 0-1.8-1.9z" fill="var(--accent-secondary)"/></svg>`,
  again: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 12a7.6 7.6 0 1 1-2.3-5.4" fill="none" stroke="var(--accent-secondary)" stroke-width="3.2" stroke-linecap="round"/><path d="M13.6 7.2l6.4-3.4.4 6.8z" fill="var(--accent-danger)"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.2" y="2.6" width="7.6" height="12.4" rx="3.8" fill="var(--accent-danger)"/><path d="M5.2 11.4a6.8 6.8 0 0 0 13.6 0" fill="none" stroke="var(--accent-secondary)" stroke-width="2.4" stroke-linecap="round"/><rect x="10.8" y="17.6" width="2.4" height="3.6" rx="1.2" fill="var(--accent-secondary)"/></svg>`,
  hand: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 11V5.4a1.4 1.4 0 0 1 2.8 0V10h.4V3.8a1.4 1.4 0 0 1 2.8 0V10h.4V5a1.4 1.4 0 0 1 2.8 0v6.4h.3V8.6a1.3 1.3 0 0 1 2.6 0v5.6c0 4.2-3 7.4-7 7.4-3.1 0-5.1-1.6-6.4-4l-2.3-4.4a1.4 1.4 0 0 1 2.3-1.5z" fill="var(--accent-primary)"/><path d="M8.2 11v2.4" stroke="var(--accent-warning)" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6a7 7 0 0 0-4.2 12.6c.8.6 1.2 1.4 1.2 2.3v.5h6v-.5c0-.9.4-1.7 1.2-2.3A7 7 0 0 0 12 2.6z" fill="var(--accent-primary)"/><rect x="9" y="18.8" width="6" height="1.8" rx="0.9" fill="var(--accent-secondary)"/><rect x="10" y="21.2" width="4" height="1.6" rx="0.8" fill="var(--accent-secondary)"/><path d="M10.4 11.4l1.6 1.8 1.6-1.8" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.8 20.4 12 6.6 20.2z" fill="var(--accent-success)"/></svg>`,
  send: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 4.2 21 12 3.4 19.8l2.2-7.8z" fill="var(--accent-secondary)"/><path d="M5.6 12h7.6" stroke="var(--accent-primary)" stroke-width="2.4" stroke-linecap="round"/></svg>`,
};
document.querySelectorAll("[data-ico]").forEach((n) => { n.innerHTML = ICONS[n.dataset.ico] || ""; });
import("/utils/components/tooltip.js").then((m) => m.mountTooltips()).catch(() => {});

/* PrepBot's words are heard, not printed: the sentence goes to a hidden live
   region (screen readers), and the board's own notes to the small status line */
const showSay = (text, note = true) => {
  if (note) status.textContent = text || "";
  else caption.textContent = text || "";
};

async function ready() {
  status.textContent = "Getting the board ready…";
  const [gsapMod, , fb] = await Promise.all([
    import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm"),
    loadMath(),
    import("/firebase-init.js").catch(() => null),
    document.fonts.load('400 19px "JetBrains Mono"').catch(() => {}),
  ]);
  status.textContent = "";
  return { gsap: gsapMod.gsap || gsapMod.default, auth: fb?.auth || null };
}

/* ── the hand the board writes in ───────────────────────────────────────── */
const HAND_KEY = "pb-hand";
const loadedHands = new Set();
async function loadHand(key) {
  const h = HANDS[key] || HANDS.trad;
  if (!loadedHands.has(h.family)) {
    /* the stylesheet has to ARRIVE before the font can be asked for: until it
       has, fonts.load() finds no such face, resolves at once, and the words get
       measured in a fallback (gaps between words, the wrong hand) */
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${h.css}&display=swap`;
    const arrived = new Promise((r) => { link.onload = r; link.onerror = r; setTimeout(r, 5000); });
    document.head.appendChild(link);
    await arrived;
    loadedHands.add(h.family);
  }
  await Promise.all([
    document.fonts.load(`${h.text} 36px "${h.family}"`),
    document.fonts.load(`${h.title} 46px "${h.family}"`),
  ]).catch(() => {});
  return h;
}
let handKey = "trad";
try { handKey = HANDS[localStorage.getItem(HAND_KEY)] ? localStorage.getItem(HAND_KEY) : "trad"; } catch {}

(async () => {
  const { gsap, auth } = await ready();
  await loadHand(handKey);
  setHand(handKey);

  /* ── the board, shaped like the space it is shown in ─────────────────────
     The paper fills the whole of its frame (the page, a rail panel, a phone).
     When the frame changes shape, or the hand changes, the board is built
     again and this page is drawn back on at once — a board is just its ops. */
  const wrap = $("pb-boardwrap");
  const aspectNow = () => {
    const r = wrap.getBoundingClientRect();
    return r.width > 40 && r.height > 40 ? r.width / r.height : 16 / 9;
  };
  let current = null;
  let builtAspect = 0;
  function build(replay = []) {
    builtAspect = aspectNow();
    current = createBoard(svg, { gsap, canvas: makeCanvas(builtAspect) });
    if (replay.length) current.play({ do: replay }, 0);
    window.__pbBoard = current;
  }
  const board = {
    play: (beat, s) => current.play(beat, s),
    finishNow: () => current.finishNow(),
    summary: () => current.summary(),
    pages: () => current.pages(),
    reset: () => current.reset(),
  };
  const redraw = () => {
    current.finishNow();
    const pages = current.pages();
    build(pages[pages.length - 1] || []);
  };
  build();
  let resizeT = null;
  new ResizeObserver(() => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      const a = aspectNow();
      if (Math.abs(a - builtAspect) / builtAspect > 0.06) redraw();
    }, 220);
  }).observe(wrap);

  /* the hand picker */
  const picker = $("pb-hand");
  picker.innerHTML = Object.entries(HANDS).map(([k, h]) => `<option value="${k}">${h.label}</option>`).join("");
  picker.value = handKey;
  picker.addEventListener("change", async () => {
    handKey = picker.value;
    try { localStorage.setItem(HAND_KEY, handKey); } catch {}
    await loadHand(handKey);
    setHand(handKey);
    redraw();
  });
  const voice = createVoice({ auth, muted: params.get("mute") === "1" });
  const lesson = { topic: "", grade: Math.min(12, Math.max(1, Number(params.get("grade")) || 8)), transcript: [] }; // transcript: [{ role: "tutor"|"learner", text }]
  let streamCtrl = null;

  const scheduler = createScheduler({
    board,
    voice,
    onBeat: (beat) => { showSay(beat.say, false); if (status.textContent && !lesson.hold) status.textContent = ""; },
    onAsk: () => { document.body.dataset.state = "asking"; showSay("Your turn: answer PrepBot's question."); input.focus({ preventScroll: true }); },
    /* a lecture carries on by itself; checking in waits for the learner */
    onIdle: () => { document.body.dataset.state = "idle"; if (style === "lecture") carryOn(); },
    onEnd: () => { document.body.dataset.state = "idle"; lesson.ended = true; showSay("That's the lesson. Ask anything you want to go over again."); },
  });

  /* what was said, into the lesson's transcript (only what the learner heard) */
  function keepRecord() {
    if (lesson.recorded) return;
    lesson.recorded = true;
    const { spoken, partial } = scheduler.record();
    const said = spoken.map((b) => b.say).join(" ");
    const cut = partial ? ` [cut in during: "${partial.say}"]` : "";
    if (said || cut) lesson.transcript.push({ role: "tutor", text: (said + cut).trim() });
  }

  /** The learner cut in (tap, typing, mic). Stops everything at once. */
  function cutIn() {
    if (!scheduler.busy && document.body.dataset.state !== "talking") return;
    streamCtrl?.abort();
    streamCtrl = null;
    thinking(false);
    const rec = scheduler.interrupt();
    const said = rec.spoken.map((b) => b.say).join(" ");
    const cut = rec.partial ? ` [cut in during: "${rec.partial.say}"]` : "";
    if (!lesson.recorded && (said || cut)) lesson.transcript.push({ role: "tutor", text: (said + cut).trim() });
    lesson.recorded = true;
    document.body.dataset.state = "listening";
    lesson.hold = true;
    setRaise(true);
    showSay(style === "lecture" ? "Hand up. Ask your question, or press play to carry on." : "Go on, I'm listening.");
  }

  /** One turn: beats from `source` (an async iterator of raw beat objects). */
  /* PrepBot is thinking: from the moment the learner sends until the first
     sentence arrives — the pencil hovers where it will write, the status line
     says so with moving dots, and the send key turns over. Nothing is silent. */
  const sendBtn = $("pb-send");
  function thinking(on, label = "PrepBot is thinking") {
    document.body.classList.toggle("is-thinking", on);
    sendBtn.classList.toggle("is-busy", on);
    sendBtn.setAttribute("aria-busy", String(on));
    if (on) {
      status.innerHTML = `${label}<span class="pb-dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
      current.think?.(true);
    } else {
      if (status.querySelector(".pb-dots")) status.textContent = "";
      current.think?.(false);
    }
  }

  async function runTurn(source, { label } = {}) {
    const turn = scheduler.begin();
    lesson.recorded = false;
    document.body.dataset.state = "talking";
    thinking(true, label);
    let first = true;
    try {
      for await (const raw of source) {
        if (turn !== scheduler.turn) return;
        const beat = cleanBeat(raw);
        if (beat) {
          if (first) { first = false; thinking(false); }
          scheduler.push(beat, turn);
        }
      }
    } catch (e) {
      if (e?.name !== "AbortError") { console.warn("[board] turn failed", e); thinking(false); showSay("Sorry, I lost my place. Ask me again?"); }
    } finally {
      if (first && turn === scheduler.turn) thinking(false);
      scheduler.done(turn);
    }
  }

  /* demo: a fixture file, streamed a line at a time as the AI would */
  async function* fixtureBeats(name) {
    const res = await fetch(`/prepbot-board/fixtures/${encodeURIComponent(name)}.ndjson`);
    if (!res.ok) return;
    for (const line of (await res.text()).split("\n")) {
      if (!line.trim()) continue;
      try { yield JSON.parse(line); } catch { /* skip a bad line */ }
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  /* the live turn: beats streamed from /api/whiteboard/turn */
  function liveBeats(text, { continuing = false } = {}) {
    streamCtrl = new AbortController();
    const body = {
      grade: lesson.grade,
      style,
      topic: lesson.topic,
      learner: text,
      // the learner's own words go in `learner` (a continuation has none in the transcript)
      transcript: continuing ? lesson.transcript.slice() : lesson.transcript.slice(0, -1),
      board: board.summary(),
    };
    return liveTurn({
      auth,
      body,
      signal: streamCtrl.signal,
      onStart: (evt) => { if (evt.voice === false) voice.useBrowser(); },
      onLimited: (evt) => showSay(evt.text, true),
      onRefused: (info) => {
        if (info.reason === "signed-out") showSay("Sign in to talk to PrepBot on the board.", true);
        else if (info.premiumRequired) showSay("The PrepBot Board is part of Prep Portal Premium.", true);
        else showSay("The PrepBot Board isn't open to you yet.", true);
      },
    });
  }

  /* ── the learner's side ─────────────────────────────────────────────── */
  svg.addEventListener("pointerdown", () => cutIn());
  input.addEventListener("keydown", (e) => { if (e.key.length === 1 && scheduler.busy) cutIn(); });
  /** The learner said something (typed or spoken): the next turn. */
  function ask(text) {
    text = String(text || "").trim();
    if (!text) return;
    if (scheduler.busy) cutIn();
    else keepRecord();
    if (!lesson.topic && text !== HINT) lesson.topic = text;
    lesson.transcript.push({ role: "learner", text });
    lesson.hold = false;
    lesson.ended = false;
    lesson.run = 0;
    setRaise(false);
    status.textContent = "";
    runTurn(liveBeats(text), { label: text === HINT ? "Finding you a hint" : style === "homework" && lesson.transcript.length > 1 ? "PrepBot is checking your step" : "PrepBot is thinking" });
  }

  /* ── two ways to teach ──────────────────────────────────────────────────
     Checks in: PrepBot asks and waits. Lecture: PrepBot teaches turn after
     turn until the topic is done; a raised hand (or the mic, or typing)
     pauses it, and once the question is answered it carries on. */
  const STYLE_KEY = "pb-style";
  let style = "check";
  try { const st = localStorage.getItem(STYLE_KEY); if (st === "lecture" || st === "homework") style = st; } catch {}
  const HINT = "[hint please]";
  const PLACEHOLDER = {
    check: "Ask anything, or cut in while PrepBot talks…",
    lecture: "Ask anything, or raise your hand to ask…",
    homework: "Type your homework problem, then each step you try…",
  };
  const styleBtns = [...document.querySelectorAll(".pb-style__btn")];
  const showStyle = () => {
    styleBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.style === style)));
    input.placeholder = PLACEHOLDER[style] || PLACEHOLDER.check;
  };
  showStyle();
  styleBtns.forEach((b) => b.addEventListener("click", () => {
    style = b.dataset.style;
    try { localStorage.setItem(STYLE_KEY, style); } catch {}
    showStyle();
    document.body.dataset.style = style;
  }));
  document.body.dataset.style = style;

  const MAX_RUN = 10; // a lecture goes on for at most this many turns by itself
  function carryOn() {
    if (style !== "lecture" || lesson.hold || lesson.ended || !lesson.topic || params.get("fixture")) return;
    if ((lesson.run = (lesson.run || 0) + 1) > MAX_RUN) { showSay("Let's stop there. Ask anything to go on."); return; }
    keepRecord();
    runTurn(liveBeats("[continue the lesson]", { continuing: true }));
  }

  /* homework: the hint key — "I'm stuck on this step" */
  $("pb-hint").addEventListener("click", () => {
    if (!lesson.topic) { showSay("Type your homework problem first, then ask for a hint."); input.focus({ preventScroll: true }); return; }
    ask(HINT);
  });

  /* the raised hand: pause the lecture; pressed again (now a play key), carry on */
  const raise = $("pb-raise");
  function setRaise(up) {
    raise.innerHTML = ICONS[up ? "play" : "hand"];
    raise.dataset.tip = up ? "Carry on with the lesson" : "Raise your hand to ask a question";
    raise.setAttribute("aria-label", up ? "Carry on" : "Raise your hand");
    raise.classList.toggle("is-up", up);
  }
  raise.addEventListener("click", () => {
    if (lesson.hold) {
      lesson.hold = false;
      setRaise(false);
      status.textContent = "";
      if (lesson.topic && !lesson.ended) { lesson.run = 0; carryOn(); }
      return;
    }
    cutIn();
    if (!lesson.hold) { lesson.hold = true; setRaise(true); showSay("Hand up. Ask your question, or press play to carry on."); }
    input.focus({ preventScroll: true });
  });
  $("pb-ask").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    input.value = "";
    ask(text);
  });

  /* ── push-to-talk ──────────────────────────────────────────────────────
     Hold the mic (or Space) and talk, let go to send. A quick tap instead
     starts listening hands-free, and a pause of a second or two sends it.
     Either way PrepBot stops talking the moment the mic opens. */
  const mic = $("pb-mic");
  const ear = createListener({
    onText: (t) => { input.value = t; },
    onState: (st) => {
      mic.classList.toggle("is-on", st === "listening");
      mic.setAttribute("aria-pressed", String(st === "listening"));
      if (st === "denied") showSay("I can't hear you: the microphone is blocked. Allow it in your browser, or type instead.", true);
      else if (st === "listening") showSay("I'm listening…", true);
    },
    onFinal: (t) => {
      input.value = "";
      if (t) ask(t);
      else showSay("I didn't catch that. Hold the mic and try again, or type.", true);
    },
  });
  if (!ear.supported) {
    mic.disabled = true;
    mic.dataset.tip = "Talking isn't available in this browser: type instead";
  }
  let downAt = 0, held = false;
  const HOLD_MS = 350;
  function micDown() {
    if (!ear.supported) return;
    if (ear.listening) { ear.stop(); return; } // a second tap sends
    cutIn();
    downAt = Date.now();
    held = true;
    ear.start();
  }
  function micUp() {
    if (!held) return;
    held = false;
    if (Date.now() - downAt >= HOLD_MS) ear.stop(); // held: letting go sends
    /* a quick tap: keep listening until a pause */
  }
  mic.addEventListener("pointerdown", (e) => { e.preventDefault(); micDown(); });
  mic.addEventListener("pointerup", micUp);
  mic.addEventListener("pointerleave", micUp);
  mic.addEventListener("click", (e) => e.preventDefault());
  /* Space, held, when not typing */
  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.repeat || e.target === input || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    micDown();
  });
  document.addEventListener("keyup", (e) => {
    if (e.code !== "Space" || e.target === input) return;
    e.preventDefault();
    micUp();
  });
  $("pb-new").addEventListener("click", () => {
    if (scheduler.busy) scheduler.interrupt();
    board.reset();
    lesson.topic = "";
    lesson.transcript = [];
    lesson.recorded = true; // the old lesson's words do not follow it onto the new board
    lesson.hold = false;
    lesson.ended = false;
    lesson.run = 0;
    setRaise(false);
    showSay("");
    document.body.dataset.state = "idle";
  });

  window.__pb = { board, scheduler, voice, lesson, cutIn, redraw }; // for tests

  /* opened from a side rail or PrepBot's chat: a frame inside another page */
  if (params.get("embed") === "1") document.body.classList.add("pb-embed");

  const fixture = params.get("fixture");
  const asked = (params.get("q") || "").trim().slice(0, 400);
  if (fixture && params.get("instant") === "1") {
    for await (const raw of fixtureBeats(fixture)) { const b = cleanBeat(raw); if (b) await board.play(b, 0); }
    document.body.dataset.done = "1";
  } else if (fixture) {
    lesson.topic = fixture;
    runTurn(fixtureBeats(fixture));
  } else if (asked) {
    /* "/explainer <question>" from the chat: start on it straight away */
    lesson.topic = asked;
    lesson.transcript.push({ role: "learner", text: asked });
    runTurn(liveBeats(asked));
  } else {
    showSay("Ask PrepBot anything, and watch it worked out on the board.");
  }
})();
