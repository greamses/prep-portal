/* PrepBot Board — the page.
   Step A: the board plays a lesson from a fixture file (?fixture=projectile),
   timed by an estimate of how long each sentence takes to say. Voice, the
   scheduler and the live AI turn are layered on in the next steps. */

import { createBoard } from "./board/board.js";
import { cleanBeat } from "./protocol/ops.js";
import { loadMath } from "/utils/components/workbook/mathify.js";
import { heroPaint } from "/utils/components/nav-icons.js";

/* theme: this page skips the loader, so restore the saved one here */
try {
  const t = localStorage.getItem("pp-theme");
  if (t) document.documentElement.setAttribute("data-theme", t);
} catch {}

const $ = (id) => document.getElementById(id);
const svg = $("pb-board");
const caption = $("pb-caption");
const status = $("pb-status");

const paint = document.querySelector(".pb-paint");
if (paint) paint.innerHTML = heroPaint();

/* icons: our own filled set */
const ICONS = {
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.6 3.9 7 11.1a1.25 1.25 0 0 0 0 1.8l7.6 7.2a1.3 1.3 0 0 0 1.8-1.9L10 12l6.4-6.2a1.3 1.3 0 0 0-1.8-1.9z" fill="var(--accent-secondary)"/></svg>`,
  again: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 12a7.6 7.6 0 1 1-2.3-5.4" fill="none" stroke="var(--accent-secondary)" stroke-width="3.2" stroke-linecap="round"/><path d="M13.6 7.2l6.4-3.4.4 6.8z" fill="var(--accent-danger)"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.2" y="2.6" width="7.6" height="12.4" rx="3.8" fill="var(--accent-danger)"/><path d="M5.2 11.4a6.8 6.8 0 0 0 13.6 0" fill="none" stroke="var(--accent-secondary)" stroke-width="2.4" stroke-linecap="round"/><rect x="10.8" y="17.6" width="2.4" height="3.6" rx="1.2" fill="var(--accent-secondary)"/></svg>`,
  send: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 4.2 21 12 3.4 19.8l2.2-7.8z" fill="var(--accent-secondary)"/><path d="M5.6 12h7.6" stroke="var(--accent-primary)" stroke-width="2.4" stroke-linecap="round"/></svg>`,
};
document.querySelectorAll("[data-ico]").forEach((n) => { n.innerHTML = ICONS[n.dataset.ico] || ""; });
import("/utils/components/tooltip.js").then((m) => m.mountTooltips()).catch(() => {});

const say = (text, asking = false) => {
  caption.textContent = text || "";
  caption.classList.toggle("is-asking", !!asking);
};
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
/* roughly how long a sentence takes to say aloud */
export const sayTime = (text) => 0.6 + String(text || "").split(/\s+/).filter(Boolean).length * 0.36;

async function ready() {
  status.textContent = "Getting the board ready…";
  const [gsapMod] = await Promise.all([
    import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm"),
    loadMath(),
    document.fonts.load('600 36px "Shantell Sans"').catch(() => {}),
    document.fonts.load('400 19px "JetBrains Mono"').catch(() => {}),
  ]);
  status.textContent = "";
  return gsapMod.gsap || gsapMod.default;
}

const orient = () => (window.innerHeight > window.innerWidth * 1.15 ? "portrait" : "landscape");

async function playFixture(name, board) {
  const res = await fetch(`/prepbot-board/fixtures/${encodeURIComponent(name)}.ndjson`);
  if (!res.ok) { status.textContent = "No such demo."; return; }
  const lines = (await res.text()).split("\n").filter((l) => l.trim());
  for (const line of lines) {
    let beat;
    try { beat = cleanBeat(JSON.parse(line)); } catch { beat = null; }
    if (!beat) continue;
    if (beat.end) break;
    say(beat.say, beat.ask);
    const t = sayTime(beat.say);
    await Promise.all([board.play(beat, t), wait(t)]);
    await wait(0.35);
    if (beat.ask) break;
  }
}

(async () => {
  const gsap = await ready();
  const board = createBoard(svg, { gsap, orient: orient() });
  window.__pbBoard = board; // for tests
  const params = new URLSearchParams(location.search);
  const fixture = params.get("fixture");
  $("pb-new").addEventListener("click", () => { board.reset(); say(""); });
  if (fixture) {
    if (params.get("instant") === "1") {
      /* tests: draw everything at once */
      const text = await (await fetch(`/prepbot-board/fixtures/${encodeURIComponent(fixture)}.ndjson`)).text();
      for (const line of text.split("\n").filter(Boolean)) { const b = cleanBeat(JSON.parse(line)); if (b) await board.play(b, 0); }
      document.body.dataset.done = "1";
      return;
    }
    await playFixture(fixture, board);
    document.body.dataset.done = "1";
  } else {
    say("Ask PrepBot anything, and watch it worked out on the board.");
  }
})();
