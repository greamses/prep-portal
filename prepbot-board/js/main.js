/* PrepBoard — the page.
   A lesson is a run of TURNS. In each, beats stream in and the scheduler has
   them said and drawn together; the learner can cut in at any moment by
   tapping the board, typing, or the mic, and their words start the next turn.
   ?fixture=projectile plays a demo turn from a file (no AI). */

import { createBoard } from "./board/board.js";
import { makeCanvas } from "./board/layout.js";
import { HANDS, setHand } from "./board/render.js";
import { cleanBeat } from "./protocol/ops.js";
import { createVoice, VOICES } from "./voice.js";
import { local } from "./kokoro-local.js";
import { createToolDriver, TOOL_NAMES } from "./tools.js";
import { mountTools, TOOL_IDS } from "/utils/components/workbook/toolbar.js";
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
/* A KEY MEANT FOR A TOOL is left to it: typing a figure into a bar model or a
   calculator must not raise PrepBoard's hand, and the arrows on a bar model
   move a bar, not the board. (A tool that has taken a key says so with
   preventDefault.) */
const inTool = (e) => e.defaultPrevented
  || !!e.target?.closest?.(".wb-panel, .wb-tools, .wb-tools__fly, .pp-tool-access, textarea, select, [contenteditable='true'], input:not(#pb-input)");
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
  checkin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.4h16a1.6 1.6 0 0 1 1.6 1.6v9.6a1.6 1.6 0 0 1-1.6 1.6h-9l-4.6 3.6v-3.6H4a1.6 1.6 0 0 1-1.6-1.6V6A1.6 1.6 0 0 1 4 4.4z" fill="var(--accent-secondary)"/><path d="M10 9.2a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="14.4" r="1.1" fill="#fff"/></svg>`,
  lecture: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.4" y="3" width="14" height="10" fill="#fffdf6" stroke="var(--accent-secondary)" stroke-width="1.6"/><path d="M10 10.2c1.6-2.8 3-3.8 4.4-3.8s2.4 1.2 4.2.6" fill="none" stroke="var(--accent-danger)" stroke-width="1.5" stroke-linecap="round"/><circle cx="5" cy="9.4" r="2.4" fill="var(--accent-primary)"/><path d="M1.6 21.4v-4.6a3.4 3.4 0 0 1 6.8 0v4.6z" fill="var(--accent-primary)"/><path d="M7 15.4l3.4-2.6" stroke="var(--accent-warning)" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  homework: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.4" y="2.6" width="13.6" height="18.8" fill="var(--accent-secondary)"/><rect x="5.6" y="2.6" width="1.4" height="18.8" fill="#fff" opacity="0.5"/><rect x="8.6" y="7" width="6" height="1.6" fill="#fff"/><rect x="8.6" y="10.4" width="4.4" height="1.6" fill="#fff"/><path d="M19.2 8.2l2 2-7.4 7.4-2.8.8.8-2.8z" fill="var(--accent-primary)"/><path d="M19.2 8.2l2 2 .8-.8a1.4 1.4 0 0 0-2-2z" fill="var(--accent-danger)"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.9 14.6 11.1 7a1.25 1.25 0 0 1 1.8 0l7.2 7.6a1.3 1.3 0 0 1-1.9 1.8L12 10l-6.2 6.4a1.3 1.3 0 0 1-1.9-1.8z" fill="var(--accent-secondary)" transform="rotate(-90 12 12)"/></svg>`,
  next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.9 14.6 11.1 7a1.25 1.25 0 0 1 1.8 0l7.2 7.6a1.3 1.3 0 0 1-1.9 1.8L12 10l-6.2 6.4a1.3 1.3 0 0 1-1.9-1.8z" fill="var(--accent-secondary)" transform="rotate(90 12 12)"/></svg>`,
  overview: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.4" y="5" width="8.6" height="6.4" fill="var(--accent-secondary)"/><rect x="13" y="5" width="8.6" height="6.4" fill="var(--accent-primary)"/><rect x="2.4" y="13.4" width="8.6" height="6.4" fill="var(--accent-primary)"/><rect x="13" y="13.4" width="8.6" height="6.4" fill="var(--accent-danger)"/></svg>`,
  follow: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4" fill="none" stroke="var(--accent-secondary)" stroke-width="2.4"/><circle cx="12" cy="12" r="3.4" fill="var(--accent-danger)"/></svg>`,
  toolbox: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h18v11H3z" fill="var(--accent-secondary)"/><path d="M8.6 9V6.2c0-.7.5-1.2 1.2-1.2h4.4c.7 0 1.2.5 1.2 1.2V9" fill="none" stroke="var(--accent-secondary)" stroke-width="2"/><path d="M3 13.4h18" stroke="#fff" stroke-width="1.6"/><rect x="10.4" y="12" width="3.2" height="3" fill="var(--accent-primary)"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.8h8.2L19 7.6v13.6H6z" fill="var(--accent-secondary)"/><path d="M14.2 2.8v4.8H19z" fill="var(--accent-primary)"/><path d="M12.5 18v-6.6M9.6 14.2l2.9-2.9 2.9 2.9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  doc: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.8h8.2L19 7.6v13.6H6z" fill="var(--accent-secondary)"/><path d="M14.2 2.8v4.8H19z" fill="var(--accent-primary)"/><path d="M8.8 12h7.4M8.8 15.4h7.4M8.8 18.4h4.6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  keys: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1.8" y="5.6" width="20.4" height="12.8" fill="var(--accent-secondary)"/><path d="M5 9h2M9 9h2M13 9h2M17 9h2M5 12h2M9 12h2M13 12h2M17 12h2M7.5 15.2h9" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/></svg>`,
  voice: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.2h3.6L12 5v14l-4.9-4.2H3.5z" fill="var(--accent-secondary)"/><path d="M15 9a4.2 4.2 0 0 1 0 6M17.6 6.4a7.8 7.8 0 0 1 0 11.2" fill="none" stroke="var(--accent-danger)" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  font: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19.4 8.4 4.6h2.4l5.4 14.8h-2.6l-1.3-3.8H6.9l-1.3 3.8zm4.6-6h3.9L9.6 7.6z" fill="var(--accent-secondary)"/><path d="M16.6 14.6c0-1.8 1.4-2.8 3.2-2.8 1 0 1.8.3 2.2.7v6.9h-2v-.6c-.5.5-1.1.8-1.9.8-1.7 0-2.9-1.1-2.9-2.6zm2.2.1c0 .7.5 1.1 1.2 1.1s1.3-.4 1.3-1.1-.6-1.1-1.3-1.1-1.2.4-1.2 1.1z" fill="var(--accent-danger)"/></svg>`,
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
  let onTap = () => {};   // set once the learner's side is wired, below
  let onMore = () => {};
  /* pictures: the site's image generator draws it, then Gemini (looking at
     the picture) says where each part to be labelled is, as 0–1 spots */
  const pictureService = {
    async make(prompt, labels) {
      const user = auth?.currentUser;
      if (!user) throw new Error("signed out");
      const token = await user.getIdToken();
      const base = location.port === "5500" ? "http://127.0.0.1:5000" : "";
      const styled = `A clear, colourful school textbook illustration of ${prompt}. Simple flat shapes, bold outlines, plain white background. No text, no letters, no labels, no numbers, no words anywhere.`;
      const res = await fetch(`${base}/api/ai/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: styled, feature: "whiteboard" }),
      });
      if (!res.ok) throw new Error("image " + res.status);
      const data = await res.json();
      if (!data.image) throw new Error("no image");
      const src = `data:image/jpeg;base64,${data.image}`;
      const size = await new Promise((r) => { const im = new Image(); im.onload = () => r({ w: im.naturalWidth || 1024, h: im.naturalHeight || 1024 }); im.onerror = () => r({ w: 1024, h: 1024 }); im.src = src; });
      let spots = {};
      if (labels.length) {
        try {
          const lr = await fetch(`${base}/api/whiteboard/locate`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ image: data.image, parts: labels, about: prompt }),
          });
          if (lr.ok) spots = (await lr.json()).spots || {};
        } catch {}
      }
      return { src, ...size, spots };
    },
  };
  function build(replay = []) {
    builtAspect = aspectNow();
    current = createBoard(svg, { gsap, canvas: makeCanvas(builtAspect), onTap: (e) => onTap(e), onMore: (idea) => onMore(idea), picture: pictureService });
    if (replay.length) current.restore(replay);
    window.__pbBoard = current;
  }
  /* the site's tools, on a rail of their own (hidden until the Tools key or PrepBot puts one up) */
  /* THE FULL TOOLS RAIL, in every teaching mode: every tool the site's rail has
     (but PrepBoard itself), minus any the admin has switched off for students */
  const toolRail = mountTools(document.body, { tools: TOOL_IDS.filter((id) => id !== "board"), at: "left" });
  const railShut = () => toolRail.el.classList.contains("is-shut");
  let tools = null; // the driver, made once the voice exists (below)
  let toolsAuto = false; // the rail was brought out by PrepBot (not the learner), so it goes away again
  const board = {
    /* a beat that puts up a TOOL: drawn and said first, then the tool is used (a sum worked on it) */
    play: async (beat, s) => {
      const t0 = Date.now();
      await current.play(beat, s);
      const uses = (beat?.do || []).filter((o) => o.op === "tool");
      if (!uses.length || !s || !tools) return;
      /* the rail comes out for the tool, and goes back when PrepBot puts the tool away */
      if (railShut()) { toolsAuto = true; toolRail.slide(false); }
      await new Promise((r) => setTimeout(r, Math.max(0, s * 1000 - (Date.now() - t0) + 150)));
      for (const op of uses) await tools.use(op);
    },
    finishNow: () => current.finishNow(),
    summary: () => current.summary(),
    pages: () => current.pages(),
    reset: () => current.reset(),
  };
  const redraw = () => {
    current.finishNow();
    build(current.pages());
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

  /* the hand picker: the site's own dropdown (pp-select.js, a receipt list)
     over a real <select>, its trigger shown as the rail's "Aa" icon */
  const picker = $("pb-hand");
  picker.innerHTML = Object.entries(HANDS).map(([k, h]) => `<option value="${k}">${h.label}</option>`).join("");
  picker.value = handKey;
  const { enhanceSelect } = await import("/utils/components/pp-select.js");
  const fontSel = enhanceSelect(picker, { className: "pb-fontsel" });
  const fontTrigger = fontSel?.querySelector(".pp-select-trigger");
  if (fontTrigger) {
    fontTrigger.insertAdjacentHTML("afterbegin", `<span class="pb-fontsel__icon" aria-hidden="true">${ICONS.font}</span>`);
    fontTrigger.setAttribute("aria-label", "The hand PrepBoard writes in");
    fontTrigger.dataset.tip = "The hand PrepBoard writes in";
    fontTrigger.dataset.tipSide = "bottom";
  }
  picker.addEventListener("change", async () => {
    handKey = picker.value;
    try { localStorage.setItem(HAND_KEY, handKey); } catch {}
    await loadHand(handKey);
    setHand(handKey);
    redraw();
  });
  /* the voice PrepBoard speaks in: the site's dropdown again, an icon key in Talk */
  const VOICE_KEY = "pb-voice";
  let voiceKey = VOICES[0].id;
  try { const v = localStorage.getItem(VOICE_KEY); if (VOICES.some((x) => x.id === v)) voiceKey = v; } catch {}
  const voice = createVoice({
    auth, muted: params.get("mute") === "1", voiceId: voiceKey,
    /* Kokoro's twelve voices only when its host is up; otherwise the one standard free voice */
    onEngine: (engine, hf) => {
      const keep = (v) => v.kind === "eleven" || (v.kind === "local" && local.supported) || (v.kind === "hf" && hf) || v.kind === (engine === "kokoro" ? "kokoro" : "melo");
      [...voicePicker.options].forEach((o) => { const v = VOICES.find((x) => x.id === o.value); if (v && !keep(v)) o.remove(); });
      if (!VOICES.some((v) => v.id === voicePicker.value && keep(v)) || ![...voicePicker.options].some((o) => o.value === voiceKey)) {
        voiceKey = engine === "kokoro" ? "af_heart" : "melo";
        voicePicker.value = voiceKey;
        voice.setVoice(voiceKey);
      }
      voiceSel?.refresh?.();
    },
  });
  const voicePicker = $("pb-voice");
  voicePicker.innerHTML = VOICES.map((v) => `<option value="${v.id}">${v.label}</option>`).join("");
  voicePicker.value = voiceKey;
  const voiceSel = enhanceSelect(voicePicker, { className: "pb-fontsel" });
  const voiceTrigger = voiceSel?.querySelector(".pp-select-trigger");
  if (voiceTrigger) {
    voiceTrigger.insertAdjacentHTML("afterbegin", `<span class="pb-fontsel__icon" aria-hidden="true">${ICONS.voice}</span>`);
    voiceTrigger.setAttribute("aria-label", "The voice PrepBoard speaks in");
    voiceTrigger.dataset.tip = "The voice PrepBoard speaks in";
    voiceTrigger.dataset.tipSide = "bottom";
  }
  if (params.get("mute") !== "1") setTimeout(() => voice.wake(), 400);
  /* PrepBot working a sum on a tool talks in the lesson's voice, a sentence at a time */
  tools = createToolDriver({
    api: toolRail,
    onIdle: () => { if (toolsAuto) { toolsAuto = false; toolRail.slide(true); } },
    speak: async (text) => {
      console.debug("[tool]", text);
      showSay(text, false);
      const clip = voice.prepare(text);
      await Promise.race([clip.ready, new Promise((r) => setTimeout(r, (clip.patience || 3) * 1000))]);
      await clip.play();
    },
  });
  /* the natural voice on this device: downloaded once (about 90 MB), then from the browser's cache */
  function getLocalVoice() {
    if (!local.supported) return;
    const first = !local.downloaded;
    if (first) showSay("Getting the natural voice ready on this device (a download of 90 to 330 MB, only once)…", true);
    local.load((pct) => {
      if (!first) return;
      if (pct < 100) status.textContent = `Downloading the natural voice: ${pct}%`;
    }).then(() => {
      if (local.fast) { if (first) showSay("The natural voice is ready. It works on this device from now on.", true); }
      else showSay("This device is too slow to make the natural voice in time, so the free online voice will speak. It may work on a newer computer.", true);
    }).catch(() => showSay("The natural voice could not be downloaded. The free online voice will speak instead.", true));
  }
  if (voiceKey.startsWith("local:") && params.get("mute") !== "1") getLocalVoice();
  voicePicker.addEventListener("change", () => {
    voiceKey = voicePicker.value;
    try { localStorage.setItem(VOICE_KEY, voiceKey); } catch {}
    voice.setVoice(voiceKey);
    if (voiceKey.startsWith("local:")) getLocalVoice();
  });
  let openMicForLesson = () => {}, heardSaid = () => {}, stillAt = 0; // stillAt: when PrepBot last stopped talking
  const lesson = { topic: "", grade: Math.min(12, Math.max(1, Number(params.get("grade")) || 8)), transcript: [] }; // transcript: [{ role: "tutor"|"learner", text }]
  let streamCtrl = null;

  const scheduler = createScheduler({
    board,
    voice,
    onBeat: (beat) => { heardSaid(beat.say || beat.ask); showSay(beat.say, false); if (status.textContent && !lesson.hold) status.textContent = ""; },
    onAsk: () => { stillAt = Date.now(); document.body.dataset.state = "asking"; showSay("Your turn: answer with the mic, or raise your hand to type."); },
    /* a lecture carries on by itself; checking in waits for the learner */
    onIdle: () => { stillAt = Date.now(); document.body.dataset.state = "idle"; if (style === "lecture") carryOn(); },
    onEnd: () => { stillAt = Date.now(); document.body.dataset.state = "idle"; lesson.ended = true; showSay("That's the lesson. Ask anything you want to go over again."); },
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
    tools?.stop();
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
    showSay(style === "lecture" ? "Paused. Talk, raise your hand to type, or tap the board to carry on." : "Go on, I'm listening.");
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
        const sug = beat?.do?.find((o) => o.op === "suggest");
        if (sug) setPills(sug.pills);
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
      ...(lesson.material ? { material: lesson.material, materialName: lesson.materialName } : {}),
    };
    return liveTurn({
      auth,
      body,
      signal: streamCtrl.signal,
      onStart: (evt) => { if (evt.voice === false) voice.useBrowser(); },
      onLimited: (evt) => showSay(evt.text, true),
      onRefused: (info) => {
        if (info.reason === "signed-out") showSay("Sign in to talk to PrepBot on the board.", true);
        else if (info.premiumRequired) showSay("PrepBoard is part of Prep Portal Premium.", true);
        else showSay("PrepBoard isn't open to you yet.", true);
      },
    });
  }

  /* ── the learner's side ─────────────────────────────────────────────── */
  /* a TAP on the board cuts in (a drag only looks around the canvas) */
  onTap = () => {
    if (!scheduler.busy && lesson.hold && style === "lecture" && form.hidden && lesson.topic && !lesson.ended) {
      lesson.hold = false; status.textContent = ""; lesson.run = 0; carryOn(); return;
    }
    cutIn();
  };
  input.addEventListener("keydown", (e) => { if (e.key.length === 1 && scheduler.busy) cutIn(); });
  /** The learner said something (typed or spoken): the next turn. */
  function ask(text) {
    text = String(text || "").trim();
    if (!text) return;
    if (scheduler.busy) cutIn();
    else keepRecord();
    if (!lesson.topic && text !== HINT) lesson.topic = text;
    lesson.transcript.push({ role: "learner", text });
    openMicForLesson();
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

  /* THE RAISED HAND. The mic is always there to talk; raising a hand is how
     you TYPE: it stops PrepBot and opens the typing box. Lowered again, the
     box shuts and (in a lecture) PrepBot carries on. */
  const raise = $("pb-raise");
  const form = $("pb-ask");
  function setRaise(up) {
    raise.innerHTML = ICONS[up ? (style === "lecture" ? "play" : "hand") : "hand"];
    raise.dataset.tip = up ? (style === "lecture" ? "Lower your hand and carry on" : "Lower your hand") : "Raise your hand to type a question";
    raise.setAttribute("aria-label", up ? "Lower your hand" : "Raise your hand");
    raise.classList.toggle("is-up", up);
    raise.setAttribute("aria-pressed", String(up));
    form.hidden = !up;
    if (up) setTimeout(() => input.focus({ preventScroll: true }), 30);
    else input.blur();
  }
  function handUp() {
    cutIn();
    lesson.hold = true;
    setRaise(true);
    showSay(style === "lecture" ? "Hand up. Type your question, or lower your hand to carry on." : "Hand up. Type your question.");
  }
  raise.addEventListener("click", () => {
    if (lesson.hold || !form.hidden) {
      lesson.hold = false;
      setRaise(false);
      status.textContent = "";
      if (style === "lecture" && lesson.topic && !lesson.ended) { lesson.run = 0; carryOn(); }
      return;
    }
    handUp();
  });
  /* starting to type anywhere is a raised hand too */
  document.addEventListener("keydown", (e) => {
    if (inTool(e)) return;
    if (e.target === input || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || e.key === " ") return;
    if (form.hidden) { handUp(); input.value = e.key; e.preventDefault(); }
  });
  $("pb-ask").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    input.value = "";
    ask(text);
  });

  /* ── the open mic ──────────────────────────────────────────────────────
     Once the lesson starts the mic stays ON, like talking to a teacher in the
     room: speak at any time and PrepBot stops at once; after a second of
     silence what you said is sent and PrepBot answers. Tap the mic to turn it
     off (and on again). With it off, hold the mic (or Space) to talk once.
     PrepBot's own voice comes back through the mic on a laptop's speakers, so
     words that are mostly what PrepBot has just said are not taken as yours. */
  const mic = $("pb-mic");
  const MIC_KEY = "pb-mic-off";
  let micOpen = false;                    // listening all the time
  let micOff = false;                     // the learner turned it off
  try { micOff = localStorage.getItem(MIC_KEY) === "1"; } catch {}
  let restartTimer = null, failures = 0;
  let pushToTalk = false;                 // one held utterance while the open mic is off
  const said = [];                        // PrepBot's last few sentences, to know its echo
  const words = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
  /* PrepBot's own voice coming back through the mic. Judged on the words that
     carry meaning only, and only on four or more of them: a short answer
     ("in the chloroplast") naturally reuses the question's words, and was
     being thrown away as an echo — which is why the mic seemed deaf. */
  const SMALL = new Set("a an the and or but so to of in on at for with is are was were be it its this that these those i you we he she they my your our their me him her us them do does did not no yes".split(" "));
  function isEcho(text) {
    const heard = words(text).filter((w) => !SMALL.has(w));
    if (heard.length < 4) return false;
    const pool = new Set(said.flatMap(words));
    if (!pool.size) return false;
    const hits = heard.filter((w) => pool.has(w)).length;
    return hits / heard.length >= 0.75;
  }
  /* while PrepBot is still TALKING, anything that is mostly its own words is its echo
     (strict: this decides whether to stop it mid-sentence) */
  function isEchoNow(text) {
    const heard = words(text);
    if (!heard.length) return true;
    const pool = new Set(said.flatMap(words));
    if (!pool.size) return false;
    return heard.filter((w) => pool.has(w)).length / heard.length >= 0.6;
  }
  const speaking = () => scheduler.busy || document.body.dataset.state === "talking";
  /* PrepBot is talking, or only just stopped (its echo is still arriving) */
  const echoing = () => speaking() || Date.now() - stillAt < 1500;
  /* what the learner said after PrepBot's echo, without the echo in front of it */
  function ownWords(text) {
    const pool = new Set(said.flatMap(words));
    const w = String(text || "").trim().split(/\s+/);
    let i = 0;
    while (i < w.length - 1 && pool.has(words(w[i])[0])) i++;
    return i >= 3 ? w.slice(i).join(" ") : text;
  }
  const ear = createListener({
    quietMs: 1000,
    /* say WHY nothing was heard, instead of a silent mic */
    onError: (code) => {
      const WHY = {
        "no-speech": "I didn't hear anything. Check the right microphone is chosen, and speak a little closer.",
        "audio-capture": "No microphone was found. Plug one in or choose it in your computer's sound settings.",
        network: "Talking needs the internet for this browser's speech service. Check the connection, or type instead.",
        "service-not-allowed": "This browser won't let pages listen. Chrome or Edge work best; or type instead.",
        "language-not-supported": "Switching the listening language to standard English.",
      };
      if (WHY[code] && (code !== "no-speech" || pushToTalk)) showSay(WHY[code], true);
    },
    onText: (t) => {
      if (speaking() && isEchoNow(t)) return;
      status.textContent = `“${t}”`;
      /* the learner is talking: PrepBot stops at once (two words, so a cough does not) */
      if (speaking() && words(t).length >= 2) cutIn();
    },
    onState: (st) => {
      mic.classList.toggle("is-on", st === "listening");
      mic.setAttribute("aria-pressed", String(micOpen || st === "listening"));
      if (st === "denied") { setOpen(false, false); showSay("I can't hear you: the microphone is blocked. Click the lock icon by the address, allow the microphone, then try again.", true); }
      else if (st === "error") failures++;
      else if (st === "idle" && micOpen) {
        /* the browser stops listening by itself now and then: start again */
        clearTimeout(restartTimer);
        restartTimer = setTimeout(() => { if (micOpen && !ear.listening) ear.start(); }, failures > 3 ? 3000 : 250);
      }
    },
    onFinal: (t) => {
      const was = pushToTalk;
      pushToTalk = false;
      if (t && !(speaking() ? isEchoNow(t) : echoing() && isEcho(t))) { failures = 0; ask(ownWords(t)); return; }
      if (was) showSay("I didn't catch that. Hold the mic and try again, or type.", true);
    },
  });
  function showMic() {
    mic.classList.toggle("is-open", micOpen);
    mic.dataset.tip = micOpen ? "The mic is on: just talk. Tap to turn it off" : "Tap to turn the mic on, or hold it to talk once";
    mic.setAttribute("aria-label", micOpen ? "Turn the mic off" : "Turn the mic on");
    mic.setAttribute("aria-pressed", String(micOpen));
  }
  function setOpen(on, byLearner = true) {
    micOpen = on && ear.supported;
    if (byLearner) { micOff = !on; try { localStorage.setItem(MIC_KEY, micOff ? "1" : "0"); } catch {} }
    clearTimeout(restartTimer);
    if (micOpen) { failures = 0; if (!ear.listening) ear.start(); }
    else ear.cancel();
    showMic();
  }
  /* the lesson has started: the mic opens by itself, unless it was turned off */
  /* the mic stays OFF until the learner turns it on (a tap) */
  openMicForLesson = () => {};
  heardSaid = (t) => { if (t) { said.push(t); if (said.length > 3) said.shift(); } };
  if (!ear.supported) {
    mic.disabled = true;
    mic.dataset.tip = "Talking isn't available in this browser: type instead";
  } else showMic();

  let downAt = 0, held = false;
  const HOLD_MS = 350;
  function micDown() {
    if (!ear.supported) return;
    if (micOpen) { held = false; setOpen(false); showSay("Mic off. Tap it to talk again.", true); return; }
    cutIn();
    downAt = Date.now();
    held = true;
    pushToTalk = true;
    ear.start();
  }
  function micUp() {
    if (!held) return;
    held = false;
    if (Date.now() - downAt >= HOLD_MS) { ear.stop(); return; } // held: letting go sends
    /* a quick tap: the mic stays on from now on */
    pushToTalk = false;
    setOpen(true);
    showSay("The mic is on. Just talk, and pause when you're done.", true);
  }
  mic.addEventListener("pointerdown", (e) => { e.preventDefault(); micDown(); });
  mic.addEventListener("pointerup", micUp);
  mic.addEventListener("pointerleave", micUp);
  mic.addEventListener("click", (e) => e.preventDefault());
  /* Space, held, when not typing: talk once (with the mic off) */
  document.addEventListener("keydown", (e) => {
    if (inTool(e)) return;
    if (e.code !== "Space" || e.repeat || e.target === input || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    if (micOpen) return;
    micDown();
  });
  document.addEventListener("keyup", (e) => {
    if (e.code !== "Space" || e.target === input) return;
    e.preventDefault();
    if (!held) return;
    held = false;
    ear.stop();
  });
  /* ── another way, or more on one idea ────────────────────────────────────
     Pills under the board: the ways PrepBot could explain it again (it says
     which fit the topic at the end of each turn). And every section of the
     board is one idea, with an "Explain more" key of its own. */
  const pillsBox = $("pb-pills");
  const MATHS = /\d|equation|fraction|ratio|percent|algebra|area|angle|sum|divide|multipl|solve|graph|shape|number/i;
  const ASK_FOR = {
    "simpler": "Explain that again more simply, please.",
    "quiz me": "Ask me a question to check I understood.",
    "step by step": "Go through it again step by step, slower.",
    "worked example": "Show me a worked example of it.",
    "real-life example": "Give me a real-life example of it.",
    "analogy": "Explain it with an analogy.",
  };
  function setPills(list) {
    const pills = (list || []).slice(0, 6);
    pillsBox.innerHTML = pills.map((p) => `<button type="button" class="pp-pill pb-pill">${p.replace(/[<>&"]/g, "")}</button>`).join("");
    pillsBox.hidden = !pills.length;
  }
  const defaultPills = () => (MATHS.test(lesson.topic || "") ? ["Bar model", "Number line", "Step by step", "Worked example", "Simpler"] : ["Diagram", "Real-life example", "Analogy", "Step by step", "Simpler", "Quiz me"]);
  pillsBox.addEventListener("click", (e) => {
    const b = e.target.closest(".pb-pill");
    if (!b) return;
    const label = b.textContent.trim();
    ask(ASK_FOR[label.toLowerCase()] || `Explain it again using a ${label.toLowerCase()}, please.`);
  });
  /* the turn is over and PrepBot did not suggest any: the usual ones for the subject */
  const afterTurn = () => { if (lesson.topic && pillsBox.hidden) setPills(defaultPills()); };
  setInterval(() => { if (!scheduler.busy && document.body.dataset.state !== "talking") afterTurn(); }, 1200);
  onMore = (idea) => {
    const what = idea.title ? ` ("${idea.title}")` : "";
    ask(`Explain part ${idea.n}${what} more, in more detail and in a different way.`);
  };

  /* ── the learner's own document ─────────────────────────────────────────
     A PDF (its text read here, in the browser) or a photo of a page (read by
     the server's vision model, as are PDF pages that are only scans). The
     text goes with every turn and PrepBoard teaches from it. */
  const fileIn = $("pb-file");
  const docChip = $("pb-doc");
  const showDoc = () => {
    docChip.hidden = !lesson.material;
    $("pb-doc-name").textContent = lesson.materialName || "";
  };
  const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  async function pdfLib() {
    if (!window.pdfjsLib) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    return window.pdfjsLib;
  }
  const toJpeg = (canvas) => canvas.toDataURL("image/jpeg", 0.72);
  function imageJpeg(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(toJpeg(c));
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("not an image")); };
      im.src = url;
    });
  }
  async function readPictures(images) {
    const user = auth?.currentUser;
    if (!user) throw new Error("signed out");
    const r = await fetch("/api/whiteboard/read", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ images }),
    });
    if (!r.ok) throw new Error("read " + r.status);
    return (await r.json()).text || "";
  }
  async function readPdf(file) {
    const lib = await pdfLib();
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 15) && text.length < 9000; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      text += tc.items.map((it) => it.str + (it.hasEOL ? "\n" : " ")).join("") + "\n\n";
    }
    if (text.replace(/\s+/g, "").length >= 80) return text;
    /* only pictures of pages: let the vision model read the first three */
    const images = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: Math.min(2, 1400 / page.getViewport({ scale: 1 }).width) });
      const c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height;
      await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      images.push(toJpeg(c));
    }
    return readPictures(images);
  }
  $("pb-upload").addEventListener("click", () => fileIn.click());
  /* the tools rail: hidden until wanted (PrepBot putting a tool up shows it too) */
  const toolsBtn = $("pb-toolsbtn");
  /* the ribbon's Tools key slides the rail away and back (as the rail's own tab does) */
  const syncTools = () => toolsBtn.classList.toggle("is-up", !railShut());
  toolsBtn.addEventListener("click", () => { toolRail.slide(!railShut()); syncTools(); });
  new MutationObserver(syncTools).observe(toolRail.el, { attributes: true, attributeFilter: ["class"] });
  syncTools();
  fileIn.addEventListener("change", async () => {
    const file = fileIn.files?.[0];
    fileIn.value = "";
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { showSay("That file is too big. Try one under 25 MB, or a photo of the page.", true); return; }
    if (scheduler.busy) cutIn();
    thinking(true, `Reading ${file.name}`);
    try {
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      const text = isPdf ? await readPdf(file) : await readPictures([await imageJpeg(file)]);
      thinking(false);
      if (!text.trim()) { showSay("I couldn't find any words in that file. Try a clearer photo or another PDF.", true); return; }
      lesson.material = text.slice(0, 9000);
      lesson.materialName = file.name.slice(0, 80);
      showDoc();
      ask(style === "homework"
        ? `I've uploaded "${lesson.materialName}". Help me work through it.`
        : `I've uploaded "${lesson.materialName}". Can you teach me what's in it?`);
    } catch (e) {
      console.warn("[board] upload", e);
      thinking(false);
      showSay(String(e?.message || "").includes("signed out") ? "Sign in to upload a document." : "Sorry, I couldn't read that file. Try another one, or a photo of the page.", true);
    }
  });
  $("pb-doc-x").addEventListener("click", () => { lesson.material = ""; lesson.materialName = ""; showDoc(); showSay("Okay, I've put the document away.", true); });

  $("pb-new").addEventListener("click", () => {
    lesson.material = ""; lesson.materialName = ""; showDoc(); setPills([]); tools?.closeAll();
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

  /* the whole canvas at once, or back to where PrepBot is working */
  const seeAll = $("pb-overview");
  const showSeeAll = () => {
    const all = current.following;
    seeAll.innerHTML = ICONS[all ? "overview" : "follow"];
    seeAll.dataset.tip = all ? "See the whole canvas" : "Back to where PrepBot is working";
    seeAll.setAttribute("aria-label", seeAll.dataset.tip);
  };
  $("pb-prev").addEventListener("click", () => { current.step(-1); showSeeAll(); });
  $("pb-next").addEventListener("click", () => { current.step(1); showSeeAll(); });
  document.addEventListener("keydown", (e) => {
    if (inTool(e)) return;
    if (e.target === input || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") { current.step(-1); showSeeAll(); e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") { current.step(1); showSeeAll(); e.preventDefault(); }
  });
  seeAll.addEventListener("click", () => {
    if (current.following) current.overview(); else current.follow();
    showSeeAll();
  });
  svg.addEventListener("pointerup", () => setTimeout(showSeeAll, 0));
  svg.addEventListener("wheel", () => setTimeout(showSeeAll, 0), { passive: true });
  setInterval(showSeeAll, 1500);

  /* the ribbon slides up out of the way (and back down from its pull tab) */
  const ribbon = $("pb-ribbon");
  const FOLD_KEY = "pb-ribbon-folded";
  const fold = (on) => {
    ribbon.classList.toggle("is-folded", on);
    $("pb-fold").setAttribute("aria-expanded", String(!on));
    try { localStorage.setItem(FOLD_KEY, on ? "1" : "0"); } catch {}
  };
  $("pb-fold").addEventListener("click", () => fold(true));
  $("pb-unfold").addEventListener("click", () => fold(false));
  try { if (localStorage.getItem(FOLD_KEY) === "1") fold(true); } catch {}

  /* ── keyboard shortcuts ────────────────────────────────────────────────
     Plain letters belong to typing (any letter raises the hand and starts
     the question), so the shortcuts are Alt + a letter; Space (hold) talks,
     the arrows move between sections, ? lists them all and Esc steps back. */
  const click = (id) => () => $(id)?.click();
  const openPicker = (sel) => () => sel?.querySelector(".pp-select-trigger")?.click();
  const SHORTCUTS = [
    { keys: "Space (hold)", what: "Talk while held, let go to send" },
    { code: "KeyM", keys: "Alt+M", what: "Mic on or off", run: () => { if (!ear.supported) return; setOpen(!micOpen); showSay(micOpen ? "The mic is on. Just talk, and pause when you're done." : "Mic off.", true); } },
    { code: "KeyH", keys: "Alt+H", what: "Raise or lower your hand (type a question)", run: click("pb-raise") },
    { code: "KeyK", keys: "Alt+K", what: "A hint (homework)", run: () => { if (style === "homework") $("pb-hint").click(); } },
    { code: "Digit1", keys: "Alt+1", what: "Teaching: checks in", run: () => document.querySelector('.pb-style__btn[data-style="check"]')?.click() },
    { code: "Digit2", keys: "Alt+2", what: "Teaching: lecture", run: () => document.querySelector('.pb-style__btn[data-style="lecture"]')?.click() },
    { code: "Digit3", keys: "Alt+3", what: "Teaching: homework", run: () => document.querySelector('.pb-style__btn[data-style="homework"]')?.click() },
    { code: "KeyU", keys: "Alt+U", what: "Upload a PDF or a photo", run: click("pb-upload") },
    { code: "KeyN", keys: "Alt+N", what: "New board", run: click("pb-new") },
    { code: "KeyO", keys: "Alt+O", what: "Whole canvas / back to PrepBot", run: click("pb-overview") },
    { keys: "← →", what: "The section before / after" },
    { code: "KeyW", keys: "Alt+W", what: "Choose the handwriting", run: openPicker(fontSel) },
    { code: "KeyV", keys: "Alt+V", what: "Choose the voice", run: openPicker(voiceSel) },
    { code: "KeyT", keys: "Alt+T", what: "Hide or show the tools", run: () => fold(!ribbon.classList.contains("is-folded")) },
    { keys: "?", what: "This list" },
    { keys: "Esc", what: "Close this list, lower your hand, or stop PrepBot" },
  ];
  /* the list itself: the site's receipt, under the ribbon */
  const keysBtn = $("pb-keys");
  const keysPanel = document.createElement("div");
  keysPanel.className = "pb-keys pp-receipt";
  keysPanel.hidden = true;
  keysPanel.setAttribute("role", "dialog");
  keysPanel.setAttribute("aria-label", "Keyboard shortcuts");
  keysPanel.innerHTML = `<div class="pp-receipt__paper pb-keys__paper"><div class="pb-keys__list"><p class="pb-keys__title">Keyboard shortcuts</p>${SHORTCUTS.map((s) => `<div class="pb-keys__row"><kbd>${s.keys}</kbd><span>${s.what}</span></div>`).join("")}</div></div>`;
  document.body.appendChild(keysPanel);
  const showKeys = (on) => { keysPanel.hidden = !on; keysBtn.setAttribute("aria-expanded", String(on)); };
  keysBtn.addEventListener("click", () => showKeys(keysPanel.hidden));
  document.addEventListener("pointerdown", (e) => { if (!keysPanel.hidden && !keysPanel.contains(e.target) && e.target !== keysBtn && !keysBtn.contains(e.target)) showKeys(false); });
  /* the keys named in each tooltip */
  const tipKey = { "pb-mic": "Alt+M", "pb-raise": "Alt+H", "pb-hint": "Alt+K", "pb-upload": "Alt+U", "pb-new": "Alt+N", "pb-overview": "Alt+O", "pb-prev": "←", "pb-next": "→", "pb-fold": "Alt+T" };
  for (const [id, k] of Object.entries(tipKey)) { const n = $(id); if (n?.dataset.tip) n.dataset.tip += ` (${k})`; }
  document.querySelectorAll(".pb-style__btn").forEach((b, i) => { b.dataset.tip += ` (Alt+${i + 1})`; });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" && inTool(e)) return;
    if (e.ctrlKey || e.metaKey) return;
    const typing = e.target === input || e.target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || "");
    if (e.key === "Escape") {
      if (!keysPanel.hidden) { showKeys(false); return; }
      if (!form.hidden) { raise.click(); return; }
      if (scheduler.busy || document.body.dataset.state === "talking") cutIn();
      return;
    }
    if (e.altKey) {
      const sc = SHORTCUTS.find((s) => s.code === e.code);
      if (sc?.run) { e.preventDefault(); e.stopImmediatePropagation(); sc.run(); }
      return;
    }
    if (e.key === "?" && !typing) { e.preventDefault(); e.stopImmediatePropagation(); showKeys(keysPanel.hidden); }
  }, true);

  window.__pb = { board, scheduler, voice, lesson, cutIn, redraw }; // for tests

  /* opened from a side rail or PrepBot's chat: a frame inside another page */
  if (params.get("embed") === "1") document.body.classList.add("pb-embed");

  /* "Load question" on the page around the frame (rail-tool.js sendQuestion): a fresh
     board, the question laid down as the lesson's material (the learner's own line is
     cut at 400 characters, a question with its options can be longer), and PrepBot
     asked to explain it. Only a page of this site may send one. */
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.data?.type !== "pp-board-question") return;
    const text = String(e.data.text || "").trim().slice(0, 8000);
    if (!text) return;
    $("pb-new").click();
    lesson.material = text;
    lesson.materialName = String(e.data.name || "This question").slice(0, 80);
    showDoc();
    ask(style === "homework"
      ? `Help me work through ${lesson.materialName.toLowerCase()} one step at a time.`
      : `Explain ${lesson.materialName.toLowerCase()} to me.`);
  });
  if (window.parent !== window) { try { window.parent.postMessage({ type: "pp-board-ready" }, location.origin); } catch { /* not our page */ } }

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
    openMicForLesson();
    runTurn(liveBeats(asked));
  } else {
    showSay("Tap the mic and ask PrepBot anything, or raise your hand to type.");
  }
})();
