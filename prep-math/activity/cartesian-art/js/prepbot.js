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
  setStroke, setFill, setView, setShapes, activeShape, deleteLastPoint, transformPoints,
} from "./state.js";
import { BUILTIN_PUZZLES } from "./builtin-puzzles.js";
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

/* ── the tutor has the run of the studio ──────────────────────────────────
   teacher.control(): the chat's replies can plot points, start and close
   shapes, colour them, move them (reflect, translate, rotate, enlarge), draw a
   whole picture from the library, and clear the page. Everything goes through
   state.js, the same as a learner's own keys. */
const COLOURS = {
  red: "#e5484d", orange: "#f76b15", yellow: "#f5d90a", green: "#30a46c", blue: "#3b82f6", purple: "#8e4ec6", pink: "#e93d82",
  brown: "#8b5a2b", black: "#14130f", white: "#ffffff", grey: "#8b8d98", gray: "#8b8d98", gold: "#d4a017", sky: "#7dd3fc", none: null, "no": null,
};
const colourOf = (a) => { const s = String(a).trim().toLowerCase(); if (/^#[0-9a-f]{3,8}$/.test(s)) return s; const k = Object.keys(COLOURS).find((n) => s.includes(n)); return k === undefined ? undefined : COLOURS[k]; };
const pairs = (a) => [...String(a).matchAll(/(-?\d+)\s*,\s*(-?\d+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
/** Make sure a point can be seen: widen the square window if it falls outside. */
function reach(pts) {
  const g = state.grid;
  if (pts.every((p) => p.x >= g.xMin && p.x <= g.xMax && p.y >= g.yMin && p.y <= g.yMax)) return;
  const all = [...pts, ...state.shapes.flatMap((s) => s.points)];
  fitViewTo([{ points: all }]);
}
function describeStudio() {
  const shapes = state.shapes.filter((s) => s.points.length);
  const g = state.grid;
  return `The student is in Cartesian Art, a studio for drawing pictures by plotting points on the coordinate plane. A cursor is steered about the plane and a point is marked where it stands; marked points join up in order to make a shape.
NOW: the plane shows x from ${g.xMin} to ${g.xMax} and y from ${g.yMin} to ${g.yMax}. The cursor is at (${state.cursor.x}, ${state.cursor.y}).
${shapes.length ? shapes.slice(0, 8).map((s, i) => `Shape ${i + 1}${s === activeShape() ? " (being drawn)" : ""}: ${s.points.slice(0, 24).map((p) => `(${p.x}, ${p.y})`).join(" ")}${s.points.length > 24 ? " ..." : ""}${s.closed ? ", closed" : ", open"}${s.fillColor ? `, filled ${s.fillColor}` : ""}`).join("\n") : "Nothing has been plotted yet."}
Pictures in the library: ${BUILTIN_PUZZLES.map((b) => b.title).join(", ")}.`;
}
function takeControl() {
  const stroll = async (pts, mark) => {
    reach(pts);
    for (const p of pts) { setCursor(p.x, p.y); await delay(260); if (mark) { addPoint(); await delay(140); } }
  };
  teacher.control({
    title: "the Cartesian Art studio",
    context: describeStudio,
    intro: "You are the tutor in this studio and you can draw on the plane yourself. Coordinates are whole numbers, written x,y. Plot a few points at a time and say each one, so the student reads them with you.",
    commands: {
      plot: { use: "plot <x,y> <x,y> ...", does: "walks the cursor to each point in turn and marks it, joining them into the shape being drawn", direct: true, run: async (a) => { const pts = pairs(a); if (!pts.length) return "Which points?"; await stroll(pts, true); return ""; } },
      move: { use: "move <x,y>", does: "moves the cursor there without marking", direct: true, run: async (a) => { const pts = pairs(a); if (!pts.length) return "Move where?"; await stroll(pts.slice(0, 1), false); return ""; } },
      "new shape": { use: "new shape", does: "starts a fresh shape; the last one is kept", direct: true, run: () => { if (activeShape().points.length) startNewShape(); return ""; } },
      close: { use: "close", does: "joins the last point back to the first", direct: true, run: () => { const s = activeShape(); if (s.points.length < 3) return "A shape needs three points before it can close."; if (!s.closed) toggleClosed(); return ""; } },
      undo: { use: "undo", does: "takes away the last point marked", direct: true, run: () => { deleteLastPoint(); return ""; } },
      outline: { use: "outline <colour>", does: "colours the line of the shape being drawn", run: (a) => { const col = colourOf(a); if (col === undefined) return `I do not have the colour "${a}".`; setStroke(col); return ""; } },
      fill: { use: "fill <colour | none>", does: "fills the shape being drawn (red, orange, yellow, green, blue, purple, pink, brown, black, white, grey, gold, sky, or a #hex)", run: (a) => { const col = colourOf(a); if (col === undefined) return `I do not have the colour "${a}".`; setFill(col); return ""; } },
      reflect: { use: "reflect <x-axis | y-axis>", does: "reflects every shape in that axis", direct: true, run: (a) => { if (/y/i.test(a)) transformPoints((x, y) => ({ x: -x, y })); else if (/x/i.test(a)) transformPoints((x, y) => ({ x, y: -y })); else return "In which axis?"; return ""; } },
      translate: { use: "translate <dx,dy>", does: "slides every shape dx right and dy up", direct: true, run: (a) => { const [d] = pairs(a); if (!d) return "By how much?"; transformPoints((x, y) => ({ x: x + d.x, y: y + d.y })); return ""; } },
      rotate: { use: "rotate <90 | 180 | 270>", does: "turns every shape anticlockwise about the origin", direct: true, run: (a) => { const q = ((Math.round(Number((/-?\d+/.exec(a) || [NaN])[0]) / 90) % 4) + 4) % 4; if (Number.isNaN(q)) return "By what angle?"; const f = [(x, y) => ({ x, y }), (x, y) => ({ x: -y, y: x }), (x, y) => ({ x: -x, y: -y }), (x, y) => ({ x: y, y: -x })][q]; transformPoints(f); return ""; } },
      enlarge: { use: "enlarge <scale factor>", does: "enlarges every shape from the origin by a whole-number scale factor", direct: true, run: (a) => { const k = Number((/-?\d+/.exec(a) || [NaN])[0]); if (!k) return "By what scale factor?"; transformPoints((x, y) => ({ x: x * k, y: y * k })); return ""; } },
      window: { use: "window <n>", does: "shows the plane from -n to n on both axes", run: (a) => { const n = Math.abs(Number((/\d+/.exec(a) || [0])[0])); if (!n) return "How far out?"; setView(-n, n, -n, n, true); return ""; } },
      clear: { use: "clear", does: "wipes the whole page", direct: true, run: () => { token++; setShapes([]); setCursor(0, 0); return ""; } },
      draw: { use: "draw <picture>", does: "draws a whole picture from the library, point by point (names are in the context)", run: (a) => { const want = a.toLowerCase().trim(); const pic = BUILTIN_PUZZLES.find((b) => b.title.toLowerCase() === want) || BUILTIN_PUZZLES.find((b) => b.title.toLowerCase().includes(want) || want.includes(b.title.toLowerCase())); if (!pic) return `There is no picture called "${a}".`; const shapes = normalizeShapes(pic); if (!shapes.length) return `"${pic.title}" has nothing to draw.`; running = true; setShapes([]); runDrawing({ title: pic.title, shapes }); return ""; } },
      stop: { use: "stop", does: "stops a drawing that is under way", direct: true, run: () => { token++; teacher.stop(); return ""; } },
    },
  });
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
    skipKeys: ["t"],        // T is the studio's transform mode
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
  takeControl();

  fabBtn.addEventListener("click", () => {
    const on = !fabBtn.classList.contains("is-active");
    fabBtn.classList.toggle("is-active", on);
    if (on) start();
    else stop();
  });
}
