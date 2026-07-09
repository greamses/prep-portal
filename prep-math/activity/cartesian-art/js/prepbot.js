/* ============================================================================
   Cartesian Art — PrepBot draws a picture
   ----------------------------------------------------------------------------
   The SAME shared teaching mascot as Mental Math ×11 (shared/prepbot-teacher.js
   — avatar, typewriter bubble, beep/talk voice, idle impulses, ask/sleep/poke
   menu). Toggled from the hamburger FAB. The learner picks a picture and
   PrepBot draws it with the studio's own navigation, narrating every leg the
   way a learner would steer: "Move right 3" → "Move up 2" → "Mark!" — vertex
   by vertex until a shape completes — then "Return to origin" and on to the
   picture's next shape, colours and all.
   ========================================================================== */

import {
  state, setCursor, addPoint, toggleClosed, startNewShape,
  setStroke, setFill, setView, activeShape,
} from "./state.js";
import { parseWorksheet } from "./parse.js";
import { WORLD_CUP_WORKSHEET } from "./reference-art.js";
import { BUILTIN_PUZZLES } from "./builtin-puzzles.js";
import { PrepbotTeacher } from "/prep-math/mental-math/shared/prepbot-teacher.js";
import { auth } from "/firebase-init.js";

/* Worksheet-authored pictures only — the parametric 300-point curves in the
   builtins would take forever to narrate point by point. */
const DRAWINGS = [
  { title: "World Cup Trophy", shapes: parseWorksheet(WORLD_CUP_WORKSHEET) },
  ...BUILTIN_PUZZLES.filter((p) => p.id === "builtin-santa").map((p) => ({
    title: p.title,
    shapes: p.shapes,
  })),
];

const GLIDE_MS = 320; // beat after each cursor glide so the move reads

let teacher = null;
let running = false;
let token = 0;
let $widget = null;
let $pick = null;
let fabBtn = null;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (t) => running && t === token;

function say(text, mode = "speech") {
  return teacher.speak([{ text, mode }]);
}

/** Grow the view so the whole picture fits (square, centred on the origin). */
function fitViewTo(shapes) {
  let m = 0;
  for (const s of shapes)
    for (const p of s.points) m = Math.max(m, Math.abs(p.x), Math.abs(p.y));
  const half = Math.ceil((m + 4) / 5) * 5;
  setView(-half, half, -half, half, true);
}

/** Walk one shape's vertices with the real navigation, narrating each leg. */
async function drawShape(shape, t) {
  // a fresh shape carrying the worksheet's colours (keep any existing art)
  if (activeShape().points.length) startNewShape();
  if (shape.strokeColor) setStroke(shape.strokeColor);
  if (shape.fillColor) setFill(shape.fillColor);

  for (const p of shape.points) {
    if (!ok(t)) return;
    const dx = p.x - state.cursor.x;
    const dy = p.y - state.cursor.y;
    if (dx) {
      await say(`Move ${dx > 0 ? "right" : "left"} ${Math.abs(dx)}.`, "thinking");
      if (!ok(t)) return;
      setCursor(state.cursor.x + dx, state.cursor.y);
      await delay(GLIDE_MS);
    }
    if (dy) {
      await say(`Move ${dy > 0 ? "up" : "down"} ${Math.abs(dy)}.`, "thinking");
      if (!ok(t)) return;
      setCursor(state.cursor.x, state.cursor.y + dy);
      await delay(GLIDE_MS);
    }
    if (!ok(t)) return;
    await say(`Mark! That's (${p.x}, ${p.y}).`);
    if (!ok(t)) return;
    addPoint();
  }

  if (!ok(t)) return;
  await say("Return to origin.");
  if (!ok(t)) return;
  if (shape.closed && activeShape().points.length > 2 && !activeShape().closed) toggleClosed();
  setCursor(0, 0);
}

async function runDrawing(drawing) {
  const t = ++token;
  fitViewTo(drawing.shapes);
  setCursor(0, 0);
  await say(`Let's draw the ${drawing.title} — watch my moves and follow along!`);
  for (let i = 0; i < drawing.shapes.length; i++) {
    if (!ok(t)) return;
    if (drawing.shapes.length > 1) {
      await say(`Shape ${i + 1} of ${drawing.shapes.length}.`, "thinking");
      if (!ok(t)) return;
    }
    await drawShape(drawing.shapes[i], t);
  }
  if (!ok(t)) return;
  await say(`We drew the ${drawing.title}! What shall we draw next?`);
  if (ok(t)) showPicker(false);
}

/** Offer the pictures as small pills above the avatar. */
function showPicker(greet = true) {
  if (!$pick) return;
  $pick.innerHTML = "";
  for (const d of DRAWINGS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ca-soft-btn ca-soft-btn--sm";
    b.textContent = d.title;
    b.addEventListener("click", () => {
      $pick.hidden = true;
      runDrawing(d);
    });
    $pick.appendChild(b);
  }
  $pick.hidden = false;
  if (greet) say("Hello! Pick a picture and I'll draw it with you.");
}

function start() {
  if (running) return;
  running = true;
  token++;
  if ($widget) $widget.hidden = false;
  teacher.scheduleIdle();
  showPicker(true);
}

function stop() {
  running = false;
  token++;
  teacher.stop();
  teacher.stopIdle();
  if ($pick) $pick.hidden = true;
  if ($widget) $widget.hidden = true;
}

export function initPrepbot(scope = document) {
  $widget = scope.querySelector("#ca-prepbot");
  $pick = scope.querySelector("#caBotPick");
  fabBtn = scope.querySelector("#ca-prepbot-btn");
  if (!$widget || !fabBtn) return;

  teacher = new PrepbotTeacher({
    root: $widget,
    boundsEl: scope.querySelector("#ca-studio"),
    auth,
    menu: {
      ask: scope.querySelector("#caBotAsk"),
      voice: scope.querySelector("#caBotVoice"),
      sleep: scope.querySelector("#caBotSleep"),
      poke: scope.querySelector("#caBotPoke"),
    },
  });

  // The teacher's body animations want GSAP; the studio doesn't ship it, so
  // pull the same CDN build ×11 uses. Everything else (narration, voice,
  // menu) works before/without it, so failure is fine to swallow.
  import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm")
    .then(({ gsap }) => { teacher.gsap = gsap; if (running) teacher.scheduleIdle(); })
    .catch(() => {});

  fabBtn.addEventListener("click", () => {
    const on = !fabBtn.classList.contains("is-active");
    fabBtn.classList.toggle("is-active", on);
    if (on) start();
    else stop();
  });
}
