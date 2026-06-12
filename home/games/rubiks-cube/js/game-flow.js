/* =====================================================================
   Game flow — stats/timer, win detection, the player's turn/rotate
   actions, and the scramble lifecycle (cover → shuffle → inspect).
   ===================================================================== */
import {
  VIEW,
  AXIS_X,
  AXIS_Y,
  LETTERS,
  LONG_MS,
  SCRAMBLE_MS,
  SCRAMBLE_LEN,
} from "./constants.js";
import { cubeGroup, rebuildSolved } from "./scene.js";
import { S } from "./state.js";
import { movesEl, timeEl, winBanner, winDetail } from "./dom.js";
import { queue, enqueue, pump, isSolved } from "./engine.js";
import { setStatus, startInspection, stopInspection } from "./ui.js";
import {
  cartonOn,
  cartonCover,
  cartonUncover,
  cartonHide,
} from "./carton.js";
import { clearSolution, checkAttemptProgress } from "./scan-play.js";

/* ---------- stats / timer ------------------------------------------- */
let timerStart = 0;
let timerId = null;

export function fmtTime(ms) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function startTimer() {
  if (timerId) return;
  timerStart = performance.now();
  timerId = setInterval(() => {
    timeEl.textContent = fmtTime(performance.now() - timerStart);
  }, 250);
}

export function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

export function registerMove(count = true) {
  if (count) {
    S.moveCount += 1;
    movesEl.textContent = S.moveCount;
  }
  if (S.started && !S.solved && isSolved()) handleSolved();
  checkAttemptProgress();
}

function handleSolved() {
  S.solved = true;
  S.started = false;
  stopTimer();
  stopInspection();
  setStatus("");
  winDetail.textContent = `${S.moveCount} moves · ${fmtTime(
    performance.now() - timerStart,
  )}`;
  winBanner.hidden = false;
  requestAnimationFrame(() => winBanner.classList.add("show"));
}

export function hideBanner() {
  winBanner.classList.remove("show");
  winBanner.hidden = true;
}

/* ---------- player actions ------------------------------------------ */
export function ensureSolveStarted() {
  if (S.started || S.gameMode !== "challenge") return;
  S.solved = false;
  S.started = true;
  S.moveCount = 0;
  movesEl.textContent = "0";
  hideBanner();
  stopInspection();
  setStatus("");
  startTimer();
}

function enqueueTurn(notation, letter, layer, isPrime, double) {
  if (S.scrambling) return;
  ensureSolveStarted();
  clearSolution(); // Invalidate loaded scan solution if user manually twists

  const note = notation + (isPrime ? "'" : "") + (double ? "2" : "");
  enqueue({
    type: "face",
    letter,
    layer,
    prime: isPrime,
    double,
    notation: note,
  });
}

let press = null;
export function pressMove(notation, letter, layer, isPrime) {
  if (S.scrambling || cartonOn() || S.inspecting) return;
  releaseMove();
  press = { notation, letter, layer, prime: isPrime, timer: null };
  press.timer = setTimeout(() => {
    if (!press) return;
    press.timer = null;
    enqueueTurn(press.notation, press.letter, press.layer, press.prime, true);
  }, LONG_MS);
}
export function releaseMove() {
  if (!press) return;
  const p = press;
  press = null;
  if (p.timer) {
    clearTimeout(p.timer);
    enqueueTurn(p.notation, p.letter, p.layer, p.prime, false);
  }
}

export function rotateCube(which) {
  if (S.scrambling) return;
  if (S.gameMode === "challenge" && !cartonOn() && !S.inspecting)
    ensureSolveStarted();
  switch (which) {
    case "left":
      enqueue({ type: "rot", axis: AXIS_Y, dir: 1 });
      break;
    case "right":
      enqueue({ type: "rot", axis: AXIS_Y, dir: -1 });
      break;
    case "up":
      enqueue({ type: "rot", axis: AXIS_X, dir: 1 });
      break;
    case "down":
      enqueue({ type: "rot", axis: AXIS_X, dir: -1 });
      break;
  }
}

/* ---------- scramble lifecycle -------------------------------------- */
function axisKey(letter) {
  const d = VIEW[letter];
  return `${Math.abs(d.x)}${Math.abs(d.y)}${Math.abs(d.z)}`;
}

function scramble() {
  if (S.animating || S.scrambling) return;
  queue.length = 0;
  hideBanner();
  releaseMove();
  S.scrambling = true;
  S.solved = false;
  S.started = false;
  stopTimer();
  S.moveCount = 0;
  movesEl.textContent = "0";
  timeEl.textContent = "0:00";

  let prevAxisKey = null;
  for (let i = 0; i < SCRAMBLE_LEN; i++) {
    let letter;
    do {
      letter = LETTERS[(Math.random() * LETTERS.length) | 0];
    } while (axisKey(letter) === prevAxisKey);
    prevAxisKey = axisKey(letter);
    queue.push({
      type: "face",
      letter,
      prime: Math.random() < 0.5,
      scramble: true,
      dur: SCRAMBLE_MS,
    });
  }
  queue.push({ type: "after", fn: finishScramble });
  pump();
}

function finishScramble() {
  S.scrambling = false;
  S.moveCount = 0;
  movesEl.textContent = "0";
  timeEl.textContent = "0:00";
  S.solved = isSolved();
  S.started = false;
  if (cartonOn()) setStatus("Tap the box to open & inspect");
}

export function newScramble() {
  if (S.animating || S.scrambling) return;
  clearSolution();
  queue.length = 0;
  releaseMove();
  stopInspection();
  hideBanner();
  rebuildSolved();
  cubeGroup.quaternion.identity();
  S.solved = true;
  S.started = false;
  S.moveCount = 0;
  movesEl.textContent = "0";
  timeEl.textContent = "0:00";
  stopTimer();

  if (S.practiceMode !== "full") {
    cartonHide();
    setStatus("");
    return;
  }
  cartonCover();
  setStatus("");
  setTimeout(scramble, 620);
}

export function openCover() {
  if (!cartonOn() || S.scrambling) return;
  cartonUncover();
  startInspection();
}

export function reset() {
  newScramble();
}
