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
  send: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 4.2 21 12 3.4 19.8l2.2-7.8z" fill="var(--accent-secondary)"/><path d="M5.6 12h7.6" stroke="var(--accent-primary)" stroke-width="2.4" stroke-linecap="round"/></svg>`,
};
document.querySelectorAll("[data-ico]").forEach((n) => { n.innerHTML = ICONS[n.dataset.ico] || ""; });
import("/utils/components/tooltip.js").then((m) => m.mountTooltips()).catch(() => {});

const showSay = (text, asking = false) => {
  caption.textContent = text || "";
  caption.classList.toggle("is-asking", !!asking);
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
    onBeat: (beat) => showSay(beat.say, beat.ask),
    onAsk: () => { document.body.dataset.state = "asking"; input.focus({ preventScroll: true }); },
    onIdle: () => { document.body.dataset.state = "idle"; },
    onEnd: () => { document.body.dataset.state = "idle"; },
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
    const rec = scheduler.interrupt();
    const said = rec.spoken.map((b) => b.say).join(" ");
    const cut = rec.partial ? ` [cut in during: "${rec.partial.say}"]` : "";
    if (!lesson.recorded && (said || cut)) lesson.transcript.push({ role: "tutor", text: (said + cut).trim() });
    lesson.recorded = true;
    document.body.dataset.state = "listening";
    showSay("Go on, I'm listening.", true);
  }

  /** One turn: beats from `source` (an async iterator of raw beat objects). */
  async function runTurn(source) {
    const turn = scheduler.begin();
    lesson.recorded = false;
    document.body.dataset.state = "talking";
    try {
      for await (const raw of source) {
        if (turn !== scheduler.turn) return;
        const beat = cleanBeat(raw);
        if (beat) scheduler.push(beat, turn);
      }
    } catch (e) {
      if (e?.name !== "AbortError") { console.warn("[board] turn failed", e); showSay("Sorry, I lost my place. Ask me again?"); }
    } finally {
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
  function liveBeats(text) {
    streamCtrl = new AbortController();
    const body = {
      grade: lesson.grade,
      topic: lesson.topic,
      learner: text,
      transcript: lesson.transcript.slice(0, -1), // the learner's own words go in `learner`
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
    if (!lesson.topic) lesson.topic = text;
    lesson.transcript.push({ role: "learner", text });
    runTurn(liveBeats(text));
  }
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
