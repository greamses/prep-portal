/* ═══════════════════════════════════════════════════════════════════════════
   ALGEBRA MOVES

   Tap a term, pick a named move, and the equation writes its next line.

   The student names the move rather than dragging one term onto another. That
   is the design decision the whole thing rests on: naming it removes the
   guesswork about what a drag meant, which is where a drag-driven tool spends
   most of its difficulty and produces most of its wrong answers. It is also
   what an exam asks a student to be able to say.

   Nothing reaches the canvas unchecked. Every move is applied to a copy and run
   past the numeric verifier first — see verify.js — so a rewrite that cannot be
   proved to keep the same solutions is refused out loud instead of drawn.
   ═══════════════════════════════════════════════════════════════════════════ */

import { parse } from "./parse.js";
import { plain, fontReady } from "./layout.js";
import { createCanvas } from "./canvas.js";
import { createCard } from "./card.js";
import { createMenu } from "./menu.js";
import { createKeypad } from "./keypad.js";
import { solve } from "./solve.js";
import { heroPaint } from "/utils/components/nav-icons.js";

const $ = (sel) => document.querySelector(sel);

const STARTERS = [
  "3x + 5 = 20",
  "2x - 7 = 4x + 1",
  "3(x + 1) = 9",
  "(3x + 5)/4 = 5",
  "5 - x = 2",
  "7 = 2x - 3",
];

let canvas = null;
let menu = null;
let keypad = null;
let cards = [];
let active = null;

/* ── Saying things ──────────────────────────────────────────────────────── */
let sayTimer = null;
function say(text, tone = "") {
  const el = $("#am-say");
  el.textContent = text || "";
  el.className = `am-say${tone ? ` is-${tone}` : ""}`;
  clearTimeout(sayTimer);
  if (text) sayTimer = setTimeout(() => { el.textContent = ""; el.className = "am-say"; }, 4200);
}

function countUp() {
  $("#am-count").textContent =
    cards.length === 0 ? "nothing on the canvas yet"
    : `${cards.length} ${cards.length === 1 ? "problem" : "problems"}`;
}

/* ── The menu that follows the picked term ──────────────────────────────── */
function openMenuFor(card) {
  const picked = card.picked;
  if (!picked) return menu.close();

  const moves = card.movesForPicked();
  if (!moves.length) {
    menu.close();
    // The only things filtered out are carrying a term to the side it is
    // already on and turning a line round for nothing, so this is almost
    // always literally true — and it is the thing worth saying.
    return say("That one is already where it belongs.");
  }

  menu.open(moves, () => card.rectFor(picked), (offer) => {
    const result = card.apply(offer);
    menu.close();
    if (result.refused) return say(`I will not do that — ${result.refused}.`, "no");
    say(result.note, "ok");
    canvas.revealCard(card.el);
  });
}

/* ── Putting a problem on the paper ─────────────────────────────────────── */
function addCard(eq) {
  const spot = canvas.freeSpot(cards.map((c) => ({
    x: parseFloat(c.el.style.left), y: parseFloat(c.el.style.top),
    // offsetWidth/Height are the card's own pixels, untouched by the canvas
    // zoom — the same space its left/top are written in.
    w: c.el.offsetWidth, h: c.el.offsetHeight,
  })));

  const card = createCard(eq, {
    x: spot.x, y: spot.y,
    onPick: (picked, self) => {
      // Only one card can hold the menu at a time.
      for (const other of cards) if (other !== self) other.clearPick();
      active = self;
      // Cards grow downward as the working piles up, so one will eventually
      // reach under its neighbour. Touching a card brings it to the top of the
      // pile, which is what stops that mattering.
      if (picked) canvas.raise(self.el);
      if (picked) openMenuFor(self); else menu.close();
    },
    onChange: (self) => { if (self.picked) openMenuFor(self); else menu.close(); },
    onRemove: (self) => {
      cards = cards.filter((c) => c !== self);
      if (active === self) { active = null; menu.close(); }
      countUp();
    },
  });

  cards.push(card);
  canvas.add(card.el);
  countUp();
  canvas.revealCard(card.el);
  return card;
}

/* ── Wiring ─────────────────────────────────────────────────────────────── */
async function boot() {
  const paint = $(".am-paint");
  if (paint) paint.innerHTML = heroPaint();

  // Every width in the layout comes from measuring this font. Measure before it
  // has loaded and the whole equation is set to the fallback's metrics.
  await fontReady();

  canvas = createCanvas($("#am-canvas"));
  menu = createMenu($("#am-frame"));
  canvas.onMove(() => menu.reposition());

  keypad = createKeypad($("#am-keypad"), {
    onSubmit: (eq) => {
      addCard(eq);
      say(`${plain(eq)} is on the canvas.`, "ok");
      closeDrawer();
    },
  });

  const chips = $("#am-starters");
  for (const src of STARTERS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pp-pill am-starter";
    chip.textContent = src;
    chip.addEventListener("click", () => keypad.set(src));
    chips.appendChild(chip);
  }

  // Tapping bare paper puts the menu away.
  $("#am-canvas").addEventListener("click", (e) => {
    if (e.target.closest(".am-card")) return;
    for (const c of cards) c.clearPick();
    menu.close();
  });

  $("#am-add").addEventListener("click", () => openDrawer());
  $("#am-drawer-close").addEventListener("click", () => closeDrawer());
  $("#am-zoom-in").addEventListener("click", () => canvas.zoomBy(1.25));
  $("#am-zoom-out").addEventListener("click", () => canvas.zoomBy(0.8));
  $("#am-zoom-reset").addEventListener("click", () => canvas.reset());
  wireFullScreen();

  $("#am-work").addEventListener("click", () => {
    if (!active) return say("Tap a problem first.");
    const worked = solve(active.equation);
    if (!worked.solved) return say(worked.stuck || "I could not finish that one.", "no");
    say(`${worked.steps.length - 1} more ${worked.steps.length === 2 ? "step" : "steps"} to ${worked.steps[worked.steps.length - 1].equation}.`, "ok");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { menu.close(); closeDrawer(); }
  });

  for (const src of STARTERS.slice(0, 2)) addCard(parse(src));
  canvas.reset();
  countUp();
  openDrawer();
}

/* ── Filling the screen ─────────────────────────────────────────────────────
   The FRAME goes fullscreen, not the document: the rail, the drawer and the
   menu of moves are all inside it, so they come along and keep working. The nav
   does not, which is the point — an endless sheet wants the whole window. */
const EXPAND = '<path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/>';
const SHRINK = '<path d="M9 4v4a1 1 0 0 1-1 1H4M15 4v4a1 1 0 0 0 1 1h4M9 20v-4a1 1 0 0 0-1-1H4M15 20v-4a1 1 0 0 1 1-1h4"/>';

const fullNow = () => document.fullscreenElement || document.webkitFullscreenElement;

function wireFullScreen() {
  const btn = $("#am-full");
  const frame = $("#am-frame");
  if (!btn || !frame) return;

  // Nothing here can promise fullscreen: an iframe without `allowfullscreen`,
  // and iPhone Safari, both refuse it outright. Take the button away rather
  // than leave one that does nothing when pressed.
  if (!(frame.requestFullscreen || frame.webkitRequestFullscreen)) { btn.hidden = true; return; }

  btn.addEventListener("click", async () => {
    try {
      if (fullNow()) await (document.exitFullscreen?.() ?? document.webkitExitFullscreen?.());
      else await (frame.requestFullscreen?.() ?? frame.webkitRequestFullscreen?.());
    } catch {
      say("This browser will not let the page fill the screen.", "no");
    }
  });

  const sync = () => {
    const on = !!fullNow();
    btn.querySelector("svg").innerHTML = on ? SHRINK : EXPAND;
    btn.title = on ? "Back to the page" : "Fill the screen";
    btn.setAttribute("aria-label", btn.title);
    btn.setAttribute("aria-pressed", String(on));
    // Every position on the canvas is measured off the frame, and the frame
    // just changed size under everything.
    menu.close();
    canvas.reset();
  };
  document.addEventListener("fullscreenchange", sync);
  document.addEventListener("webkitfullscreenchange", sync);
}

/* ── The keypad drawer ──────────────────────────────────────────────────────
   A shut drawer is slid off the bottom of the frame rather than removed, so it
   can come back with an animation — which leaves the keys and the line still in
   the tab order, and tabbing lands you in a keypad nobody can see. `inert` takes
   the whole thing out of reach without touching the transform. */
function openDrawer() {
  const drawer = $("#am-drawer");
  drawer.classList.add("is-open");
  drawer.inert = false;
  $("#am-add").setAttribute("aria-expanded", "true");
  keypad?.focus();
}
function closeDrawer() {
  const drawer = $("#am-drawer");
  drawer.classList.remove("is-open");
  drawer.inert = true;
  $("#am-add").setAttribute("aria-expanded", "false");
}

boot();
