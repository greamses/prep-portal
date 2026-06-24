/* ============================================================================
   Cartesian Art — controls
   ----------------------------------------------------------------------------
   Three ways to steer the mascot, all driving the same state setters:
     • Keyboard  — arrows move, Enter drops a point, Del removes, C closes.
     • Arrow pad — a soft d-pad (press-and-hold repeats); centre key drops.
     • Analog    — a joystick knob; tilt to glide in 4 directions.
   The player toggles between the arrow pad and the analog stick; the choice is
   remembered in localStorage.
   ========================================================================== */

import {
  moveCursor,
  addPoint,
  deletePointAtCursor,
  deleteLastPoint,
  toggleClosed,
  clearPoints,
  state,
} from "./state.js";
import { undo, redo } from "./history.js";

const DIRS = {
  up: { dx: 0, dy: 1 },
  down: { dx: 0, dy: -1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const PAD_KEY = "ca-pad-mode";

function isTyping(t) {
  return (
    t &&
    (t.tagName === "INPUT" ||
      t.tagName === "TEXTAREA" ||
      t.tagName === "SELECT" ||
      t.isContentEditable)
  );
}

/* ── keyboard ──────────────────────────────────────────────────────────── */
function initKeyboard() {
  window.addEventListener("keydown", (e) => {
    if (isTyping(e.target)) return;
    // undo / redo (Ctrl/Cmd+Z, Ctrl/Cmd+Y, Ctrl/Cmd+Shift+Z)
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
      e.preventDefault();
      e.shiftKey ? redo() : undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
      e.preventDefault();
      redo();
      return;
    }
    switch (e.key) {
      case "ArrowUp": e.preventDefault(); moveCursor(0, 1); break;
      case "ArrowDown": e.preventDefault(); moveCursor(0, -1); break;
      case "ArrowLeft": e.preventDefault(); moveCursor(-1, 0); break;
      case "ArrowRight": e.preventDefault(); moveCursor(1, 0); break;
      case "Enter": e.preventDefault(); addPoint(); break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        if (!deletePointAtCursor()) deleteLastPoint();
        break;
      case "c":
      case "C": toggleClosed(); break;
    }
  });
}

/* ── arrow d-pad (press-and-hold repeats) ──────────────────────────────── */
function initDpad(root) {
  let timer = null;
  const stop = () => { clearInterval(timer); timer = null; };

  root.querySelectorAll("[data-dir]").forEach((btn) => {
    const dir = DIRS[btn.dataset.dir];
    const start = (e) => {
      e.preventDefault();
      moveCursor(dir.dx, dir.dy);
      stop();
      timer = setInterval(() => moveCursor(dir.dx, dir.dy), 150);
      btn.setPointerCapture?.(e.pointerId);
    };
    btn.addEventListener("pointerdown", start);
    btn.addEventListener("pointerup", stop);
    btn.addEventListener("pointerleave", stop);
    btn.addEventListener("pointercancel", stop);
  });

  const drop = root.querySelector("#dpad-drop");
  drop?.addEventListener("click", () => addPoint());
}

/* ── analog joystick ───────────────────────────────────────────────────── */
function initJoystick(ring, knob) {
  const RADIUS = 34; // knob travel
  const DEAD = 12; // deadzone before it moves
  let active = false;
  let dir = null;
  let timer = null;

  const recenter = () => { knob.style.transform = "translate(0px, 0px)"; };
  const stop = () => {
    clearInterval(timer);
    timer = null;
    dir = null;
    active = false;
    ring.classList.remove("ca-dragging");
    recenter();
  };

  const setDir = (next) => {
    const key = next ? `${next.dx},${next.dy}` : null;
    const cur = dir ? `${dir.dx},${dir.dy}` : null;
    if (key === cur) return;
    dir = next;
    clearInterval(timer);
    timer = null;
    if (dir) {
      moveCursor(dir.dx, dir.dy); // immediate step
      timer = setInterval(() => dir && moveCursor(dir.dx, dir.dy), 160);
    }
  };

  const onMove = (e) => {
    if (!active) return;
    const r = ring.getBoundingClientRect();
    let vx = e.clientX - (r.left + r.width / 2);
    let vy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(vx, vy);
    // clamp the knob to the ring
    const k = Math.min(1, RADIUS / (dist || 1));
    knob.style.transform = `translate(${vx * k}px, ${vy * k}px)`;
    if (dist < DEAD) { setDir(null); return; }
    // 4-way: pick the dominant axis (screen-y is inverted vs math-y)
    if (Math.abs(vx) > Math.abs(vy)) setDir(vx > 0 ? DIRS.right : DIRS.left);
    else setDir(vy > 0 ? DIRS.down : DIRS.up);
  };

  const onDown = (e) => {
    e.preventDefault();
    active = true;
    ring.classList.add("ca-dragging");
    ring.setPointerCapture?.(e.pointerId);
    onMove(e);
  };

  ring.addEventListener("pointerdown", onDown);
  ring.addEventListener("pointermove", onMove);
  ring.addEventListener("pointerup", stop);
  ring.addEventListener("pointercancel", stop);
  ring.addEventListener("lostpointercapture", stop);
}

/* ── pad mode toggle (arrows ↔ analog) ─────────────────────────────────── */
function initToggle(scope) {
  const wrap = scope.querySelector(".ca-pad");
  const btns = scope.querySelectorAll(".ca-pad-toggle [data-pad]");
  const apply = (mode) => {
    wrap?.setAttribute("data-mode", mode);
    btns.forEach((b) => b.classList.toggle("is-active", b.dataset.pad === mode));
    try { localStorage.setItem(PAD_KEY, mode); } catch {}
  };
  btns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.pad)));
  let saved = "arrows";
  try { saved = localStorage.getItem(PAD_KEY) || "arrows"; } catch {}
  apply(saved);
}

/* ── action buttons ────────────────────────────────────────────────────── */
function initActions(scope) {
  scope.querySelector("#act-drop")?.addEventListener("click", () => addPoint());
  scope.querySelector("#act-delete")?.addEventListener("click", () => {
    if (!deletePointAtCursor()) deleteLastPoint();
  });
  scope.querySelector("#act-close")?.addEventListener("click", () => toggleClosed());
  scope.querySelector("#act-clear")?.addEventListener("click", () => {
    if (state.points.length && confirm("Clear all points?")) clearPoints();
  });
}

export function initControls(scope = document) {
  initKeyboard();
  const dpad = scope.querySelector("#ca-dpad");
  if (dpad) initDpad(dpad);
  const ring = scope.querySelector("#joy-ring");
  const knob = scope.querySelector("#joy-knob");
  if (ring && knob) initJoystick(ring, knob);
  initToggle(scope);
  initActions(scope);
}
