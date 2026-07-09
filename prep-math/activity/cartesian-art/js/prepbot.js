/* ============================================================================
   Cartesian Art — PrepBot draws a picture
   ----------------------------------------------------------------------------
   The SAME shared teaching mascot as Mental Math ×11 (shared/prepbot-teacher.js
   — avatar, typewriter bubble, beep/talk voice, idle impulses, ask/sleep/poke
   menu). Toggled from the hamburger FAB: wipes the canvas and opens the
   REAL puzzle picker (every builtin + saved puzzle, not a hardcoded pair) so
   the learner can pick any picture; PrepBot then draws its real coordinates
   with the studio's own navigation.

   Three modes (gear FAB → settings):
     • Coach     — PrepBot narrates the move, then WAITS for the learner to
                   actually steer there and drop the point themselves.
     • Demo      — PrepBot narrates AND moves itself; watch it play straight
                   through, or (step toggle) advance one move at a time.
     • Quick Draw — PrepBot just moves, silently, no narration.
   Movement reading (also in settings):
     • Relative  — keep going from wherever the last point landed (default).
     • Absolute  — walk back to the origin before every single point, so
                   each leg reads as that point's raw (x, y) from (0, 0).

   Hovering/clicking the avatar (or opening settings) freezes the current
   draw at the next step boundary until the learner is done there.
   ========================================================================== */

import {
  state, subscribe, setCursor, addPoint, toggleClosed, startNewShape,
  setStroke, setFill, setView, setShapes, activeShape,
} from "./state.js";
import { normalizeShapes } from "./thumb.js";
import { openPickerForPrepbot } from "./library.js";
import { PrepbotTeacher } from "/prep-math/mental-math/shared/prepbot-teacher.js";
import { auth } from "/firebase-init.js";

const GLIDE_MS = 320; // beat after each cursor glide (Demo) so the move reads
const QUICK_MS = 90; // much shorter beat for Quick Draw

function loadPref(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function savePref(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

let drawMode = loadPref("ca-prepbot-mode", "demo"); // 'coach' | 'demo' | 'quick'
let stepMode = loadPref("ca-prepbot-step", "0") === "1"; // Demo only: step vs watch-full
let moveType = loadPref("ca-prepbot-movetype", "relative"); // 'relative' | 'absolute'

let teacher = null;
let running = false;
let token = 0;

// Ref-counted freeze: several things (avatar hover, its pinned menu, the
// settings modal) can each want PrepBot paused; it only resumes once none
// of them do.
const freezeSources = new Set();
let paused = false;
let resumeWaiters = [];
function freeze(id) { freezeSources.add(id); paused = true; }
function unfreeze(id) {
  freezeSources.delete(id);
  if (freezeSources.size) return;
  paused = false;
  const waiters = resumeWaiters;
  resumeWaiters = [];
  waiters.forEach((r) => r());
}
/** Block at a step boundary while frozen; wakes immediately if cancelled. */
async function gate() {
  while (paused) await new Promise((r) => resumeWaiters.push(r));
}

let $widget = null;
let $next = null;
let fabBtn = null;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (t) => running && t === token;

function say(text, mode = "speech") {
  return teacher.speak([{ text, mode }]);
}

/** Wait for a state change matching `pred`; resolves false if cancelled. */
function waitForCondition(pred, reasons, t) {
  return new Promise((resolve) => {
    let unsub;
    const check = () => {
      if (!ok(t)) { unsub?.(); resolve(false); return true; }
      if (pred()) { unsub?.(); resolve(true); return true; }
      return false;
    };
    if (check()) return;
    unsub = subscribe((reason) => { if (!reasons || reasons.includes(reason)) check(); });
  });
}
const waitForCursorX = (x, t) => waitForCondition(() => state.cursor.x === x, ["cursor"], t);
const waitForCursorY = (y, t) => waitForCondition(() => state.cursor.y === y, ["cursor"], t);
function waitForMarked(target, t) {
  const before = activeShape().points.length;
  return waitForCondition(() => {
    const pts = activeShape().points;
    const last = pts[pts.length - 1];
    return pts.length > before && last && last.x === target.x && last.y === target.y;
  }, ["points"], t);
}

/** Demo + step mode: show the Next pill and wait for it (or cancellation). */
function waitForNext(t) {
  if (!$next) return Promise.resolve(ok(t));
  return new Promise((resolve) => {
    $next.hidden = false;
    let done = false;
    const finish = (val) => {
      if (done) return;
      done = true;
      $next.hidden = true;
      $next.removeEventListener("click", onClick);
      clearInterval(poll);
      resolve(val);
    };
    const onClick = () => finish(ok(t));
    $next.addEventListener("click", onClick);
    const poll = setInterval(() => { if (!ok(t)) finish(false); }, 200);
  });
}

/** Grow the view so the whole picture fits (square, centred on the origin). */
function fitViewTo(shapes) {
  let m = 0;
  for (const s of shapes) for (const p of s.points) m = Math.max(m, Math.abs(p.x), Math.abs(p.y));
  const half = Math.ceil((m + 4) / 5) * 5;
  setView(-half, half, -half, half, true);
}

/** Move from the current cursor to (tx, ty), narrating/waiting per mode. */
async function gotoPoint(tx, ty, t) {
  const dx = tx - state.cursor.x;
  const dy = ty - state.cursor.y;
  const glide = drawMode === "quick" ? QUICK_MS : GLIDE_MS;

  if (dx) {
    await gate(); if (!ok(t)) return false;
    if (drawMode !== "quick") {
      await say(`Move ${dx > 0 ? "right" : "left"} ${Math.abs(dx)}.`, "thinking");
      await gate(); if (!ok(t)) return false;
    }
    if (drawMode === "coach") { if (!(await waitForCursorX(tx, t))) return false; }
    else { setCursor(state.cursor.x + dx, state.cursor.y); await delay(glide); }
  }
  await gate(); if (!ok(t)) return false;

  if (dy) {
    if (drawMode !== "quick") {
      await say(`Move ${dy > 0 ? "up" : "down"} ${Math.abs(dy)}.`, "thinking");
      await gate(); if (!ok(t)) return false;
    }
    if (drawMode === "coach") { if (!(await waitForCursorY(ty, t))) return false; }
    else { setCursor(state.cursor.x, state.cursor.y + dy); await delay(glide); }
  }
  await gate(); if (!ok(t)) return false;

  if (drawMode === "demo" && stepMode && (dx || dy)) return waitForNext(t);
  return ok(t);
}

async function markPoint(target, t) {
  await gate(); if (!ok(t)) return false;
  if (drawMode !== "quick") {
    await say(`Mark! That's (${target.x}, ${target.y}).`);
    await gate(); if (!ok(t)) return false;
  }
  if (drawMode === "coach") { if (!(await waitForMarked(target, t))) return false; }
  else addPoint();
  if (drawMode === "demo" && stepMode) return waitForNext(t);
  return ok(t);
}

/** Walk one shape's vertices with the real navigation. */
async function drawShape(shape, t) {
  if (activeShape().points.length) startNewShape();
  if (shape.strokeColor) setStroke(shape.strokeColor);
  if (shape.fillColor) setFill(shape.fillColor);

  for (const p of shape.points) {
    if (!ok(t)) return false;
    // Absolute reading: walk back to the origin before every point (except
    // the first, which already starts there).
    if (moveType === "absolute" && (state.cursor.x !== 0 || state.cursor.y !== 0)) {
      if (!(await gotoPoint(0, 0, t))) return false;
    }
    if (!(await gotoPoint(p.x, p.y, t))) return false;
    if (!(await markPoint(p, t))) return false;
  }

  if (!ok(t)) return false;
  if (drawMode !== "quick") {
    await say("Return to origin.");
    await gate(); if (!ok(t)) return false;
  }
  if (shape.closed && activeShape().points.length > 2 && !activeShape().closed) toggleClosed();
  if (drawMode === "coach") {
    if (!(await waitForCursorX(0, t))) return false;
    if (!(await waitForCursorY(0, t))) return false;
  } else {
    setCursor(0, 0);
    await delay(drawMode === "quick" ? QUICK_MS : GLIDE_MS);
  }
  return ok(t);
}

async function runDrawing(drawing) {
  const t = ++token;
  fitViewTo(drawing.shapes);
  setCursor(0, 0);
  if (drawMode !== "quick") {
    await say(`Let's draw the ${drawing.title}!`);
    await gate(); if (!ok(t)) return;
  }
  for (let i = 0; i < drawing.shapes.length; i++) {
    if (!ok(t)) return;
    if (drawing.shapes.length > 1 && drawMode !== "quick") {
      await say(`Shape ${i + 1} of ${drawing.shapes.length}.`, "thinking");
      await gate(); if (!ok(t)) return;
    }
    if (!(await drawShape(drawing.shapes[i], t))) return;
  }
  if (!ok(t)) return;
  if (drawMode !== "quick") await say(`We drew the ${drawing.title}! Pick another whenever you like.`);
}

function pickAndDraw() {
  openPickerForPrepbot((doc) => {
    const shapes = normalizeShapes(doc);
    if (!shapes.length) return;
    runDrawing({ title: doc.title || "picture", shapes });
  });
}

function start() {
  if (running) return;
  running = true;
  token++;
  if ($widget) $widget.hidden = false;
  teacher.scheduleIdle();
  setShapes([]); // wipe the canvas — a fresh page for whatever gets picked
  pickAndDraw();
}

function stop() {
  running = false;
  token++;
  teacher.stop();
  teacher.stopIdle();
  const waiters = resumeWaiters;
  resumeWaiters = [];
  paused = false;
  waiters.forEach((r) => r());
  if ($next) $next.hidden = true;
  if ($widget) $widget.hidden = true;
}

/* ── settings modal (gear FAB): mode + movement type ──────────────────── */
function initSettings(scope) {
  const btn = scope.querySelector("#ca-prepbot-settings-btn");
  const overlay = scope.querySelector("#ca-prepbot-settings");
  const closeBtn = scope.querySelector("#prepbot-settings-close");
  const modeButtons = [...scope.querySelectorAll(".ca-prepbot-modes .ca-tool")];
  const moveButtons = [...scope.querySelectorAll(".ca-prepbot-movetype .ca-tool")];
  const stepToggle = scope.querySelector("#prepbot-step-toggle");
  const stepRow = scope.querySelector("#prepbot-step-row");
  if (!btn || !overlay) return;

  const applyModeUI = () => {
    modeButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.mode === drawMode));
    if (stepRow) stepRow.hidden = drawMode !== "demo";
  };
  const applyMoveUI = () => {
    moveButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.move === moveType));
  };
  applyModeUI();
  applyMoveUI();
  if (stepToggle) stepToggle.checked = stepMode;

  modeButtons.forEach((b) => b.addEventListener("click", () => {
    drawMode = b.dataset.mode;
    savePref("ca-prepbot-mode", drawMode);
    applyModeUI();
  }));
  moveButtons.forEach((b) => b.addEventListener("click", () => {
    moveType = b.dataset.move;
    savePref("ca-prepbot-movetype", moveType);
    applyMoveUI();
  }));
  stepToggle?.addEventListener("change", () => {
    stepMode = stepToggle.checked;
    savePref("ca-prepbot-step", stepMode ? "1" : "0");
  });

  const open = () => { overlay.classList.add("is-open"); freeze("settings"); };
  const close = () => { overlay.classList.remove("is-open"); unfreeze("settings"); };
  btn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
}

export function initPrepbot(scope = document) {
  $widget = scope.querySelector("#ca-prepbot");
  $next = scope.querySelector("#caBotNext");
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

  // Hovering/clicking the avatar (its shared ask/voice/sleep/poke menu)
  // freezes the current draw at the next step boundary until it's done.
  teacher.avatarWrap?.addEventListener("mouseenter", () => freeze("hover"));
  teacher.avatarWrap?.addEventListener("mouseleave", () => unfreeze("hover"));
  teacher.avatar?.addEventListener("click", () => {
    if (teacher.avatarWrap?.classList.contains("is-menu-open")) freeze("menu");
    else unfreeze("menu");
  });

  // The teacher's body animations want GSAP; the studio doesn't ship it, so
  // pull the same CDN build ×11 uses. Everything else (narration, voice,
  // menu) works before/without it, so failure is fine to swallow.
  import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm")
    .then(({ gsap }) => { teacher.gsap = gsap; if (running) teacher.scheduleIdle(); })
    .catch(() => {});

  initSettings(scope);

  fabBtn.addEventListener("click", () => {
    const on = !fabBtn.classList.contains("is-active");
    fabBtn.classList.toggle("is-active", on);
    if (on) start();
    else stop();
  });
}
