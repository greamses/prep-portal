/* PrepBot Board — the page.
   A lesson is a run of TURNS. In each, beats stream in and the scheduler has
   them said and drawn together; the learner can cut in at any moment by
   tapping the board, typing, or the mic, and their words start the next turn.
   ?fixture=projectile plays a demo turn from a file (no AI). */

import { createBoard } from "./board/board.js";
import { cleanBeat } from "./protocol/ops.js";
import { createVoice } from "./voice.js";
import { createScheduler } from "./scheduler.js";
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
    document.fonts.load('600 36px "Shantell Sans"').catch(() => {}),
    document.fonts.load('400 19px "JetBrains Mono"').catch(() => {}),
  ]);
  status.textContent = "";
  return { gsap: gsapMod.gsap || gsapMod.default, auth: fb?.auth || null };
}

const orient = () => (window.innerHeight > window.innerWidth * 1.15 ? "portrait" : "landscape");

(async () => {
  const { gsap, auth } = await ready();
  const board = createBoard(svg, { gsap, orient: orient() });
  const voice = createVoice({ auth, muted: params.get("mute") === "1" });
  const lesson = { topic: "", transcript: [] }; // [{ role: "tutor"|"learner", text }]
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
    if (said || cut) lesson.transcript.push({ role: "tutor", text: (said + cut).trim() });
    document.body.dataset.state = "listening";
    showSay("Go on, I'm listening.", true);
  }

  /** One turn: beats from `source` (an async iterator of raw beat objects). */
  async function runTurn(source) {
    const turn = scheduler.begin();
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

  /* the live turn is wired in step D */
  async function* liveBeats(text) {
    yield { say: "The live tutor is not switched on yet. Try the demo: add ?fixture=projectile to the address." };
  }

  /* ── the learner's side ─────────────────────────────────────────────── */
  svg.addEventListener("pointerdown", () => cutIn());
  input.addEventListener("keydown", (e) => { if (e.key.length === 1 && scheduler.busy) cutIn(); });
  $("pb-ask").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    if (scheduler.busy) cutIn();
    else keepRecord();
    if (!lesson.topic) lesson.topic = text;
    lesson.transcript.push({ role: "learner", text });
    runTurn(liveBeats(text));
  });
  $("pb-new").addEventListener("click", () => {
    if (scheduler.busy) scheduler.interrupt();
    board.reset();
    lesson.topic = "";
    lesson.transcript = [];
    showSay("");
    document.body.dataset.state = "idle";
  });

  window.__pb = { board, scheduler, voice, lesson, cutIn }; // for tests

  const fixture = params.get("fixture");
  if (fixture && params.get("instant") === "1") {
    for await (const raw of fixtureBeats(fixture)) { const b = cleanBeat(raw); if (b) await board.play(b, 0); }
    document.body.dataset.done = "1";
  } else if (fixture) {
    lesson.topic = fixture;
    runTurn(fixtureBeats(fixture));
  } else {
    showSay("Ask PrepBot anything, and watch it worked out on the board.");
  }
})();
