// game.js — Main entry point.
// Imports all modules, provides game-flow callbacks, wires everything together.

import { generateRandomBoard } from "./boardGenerator.js";
import { BOARD_SIZE, STATE, OFFSETS } from "./constants.js";
import { state } from "./state.js";
import {
  drawBoard,
  snapToken,
  animateCPUToken,
  getCanvasPoint,
  getSquareFromPoint,
  squareCenter,
} from "./renderer.js";
import {
  addLog,
  updateHUD,
  initColorDropdowns,
  injectDynamicUI,
  wireUI,
  updateFullscreenUI,
  stopSpeech,
} from "./ui.js";
import {
  registerCardCallbacks,
  showStandardCard,
  showBonusFlipCards,
} from "./cards.js";
import {
  registerQuestionCallbacks,
  showQuestion,
  submitAnswer,
  onNumpadClick,
} from "./questionEngine.js";
import { getActivePlugin, setActivePlugin } from "./mathPlugins.js";
import { recordRoll, resetProfiles } from "./ai.js";
import { showReaction, clearReactions } from "./reactions.js";

// ─── One-time setup guards ────────────────────────────────────────────────────

let _fracEventsWired = false;
let _tokenDragWired = false;
let _actionBtnWired = false;

// ─── Register cross-module callbacks ─────────────────────────────────────────

registerCardCallbacks({ endTurn, triggerWin, addLog });
registerQuestionCallbacks({
  endTurn,
  triggerWin,
  showStandardCard,
  showBonusFlipCards,
  addLog,
});

// ─── Nav hiding helpers ───────────────────────────────────────────────────────

function hideSiteNav() {
  const nav = document.querySelector('.site-nav[data-nav="main"]');
  if (nav) {
    nav.style.display = "none";
  }
}

function showSiteNav() {
  const nav = document.querySelector('.site-nav[data-nav="main"]');
  if (nav) {
    nav.style.display = "";
  }
}

// ─── Game flow ────────────────────────────────────────────────────────────────

export function startTurn() {
  updateHUD();
  const s = state;

  if (s.vsCPU && s.turn === 1) {
    s.gameState = STATE.CPU_THINKING;
    addLog(`${s.players[1].name} is thinking…`, "info");
    if (s.gameFeedback)
      s.gameFeedback.textContent = `${s.players[1].name} is taking their turn…`;
    setTimeout(executeRoll, 1200);
  } else {
    s.gameState = STATE.WAITING_ROLL;
    addLog(
      `${s.players[s.turn].name}'s turn. Press Roll Dice (or drag the dice).`,
      "info",
    );
    s.dtHint?.classList.add("show");
    setTimeout(() => s.dtHint?.classList.remove("show"), 2000);
    if (s.gameFeedback)
      s.gameFeedback.textContent = `${s.players[s.turn].name}'s turn — press Roll Dice!`;
  }
  refreshActionButton();
}

// ─── Context-aware movement button (Roll / Move) ───────────────────────────────
// Players can drive the whole game from buttons: it rolls when waiting to roll,
// and advances the token to the required square when waiting to move.

export function refreshActionButton() {
  const s = state;
  const btn = document.getElementById("btn-game-action");
  const lbl = document.getElementById("btn-game-action-label");
  if (!btn || !lbl) return;

  let label = "Roll Dice";
  let enabled = false;
  let isMove = false;

  if (!s.gameActive) {
    enabled = false;
  } else if (s.vsCPU && s.turn === 1) {
    label = "CPU Turn…";
  } else if (s.gameState === STATE.WAITING_ROLL) {
    label = "Roll Dice";
    enabled = true;
  } else if (s.gameState === STATE.WAITING_DRAG) {
    label = `Move to ${s.expectedSquare}`;
    enabled = true;
    isMove = true;
  } else if (s.gameState === STATE.WAITING_DRAG_SNAKELADDER) {
    label = s.expectedSquare < s.players[s.turn].pos
      ? `Slide to ${s.expectedSquare}`
      : `Climb to ${s.expectedSquare}`;
    enabled = true;
    isMove = true;
  }

  lbl.textContent = label;
  btn.disabled = !enabled;
  btn.classList.toggle("is-move", isMove);
}

function onGameAction() {
  const s = state;
  if (!s.gameActive || (s.vsCPU && s.turn === 1)) return;

  if (s.gameState === STATE.WAITING_ROLL) {
    executeRoll();
  } else if (s.gameState === STATE.WAITING_DRAG) {
    s.players[s.turn].pos = s.expectedSquare;
    snapToken(s.turn, s.players[s.turn].pos);
    checkSquareLogic(s.turn, s.players[s.turn].pos);
  } else if (s.gameState === STATE.WAITING_DRAG_SNAKELADDER) {
    s.players[s.turn].pos = s.expectedSquare;
    snapToken(s.turn, s.players[s.turn].pos);
    checkFraction(s.turn, s.players[s.turn].pos);
  }
  refreshActionButton();
}

function roll3DDice(result) {
  const rot = {
    1: { x: 0, y: 0 },
    2: { x: -90, y: 0 },
    3: { x: 0, y: -90 },
    4: { x: 0, y: 90 },
    5: { x: 90, y: 0 },
    6: { x: 0, y: 180 },
  };
  const spX = (Math.floor(Math.random() * 2) + 2) * 360;
  const spY = (Math.floor(Math.random() * 2) + 2) * 360;
  state.cube.style.transform = `translateZ(-30px) rotateX(${rot[result].x + spX}deg) rotateY(${rot[result].y + spY}deg)`;
}

export function executeRoll() {
  const s = state;
  if (
    (s.gameState !== STATE.WAITING_ROLL &&
      s.gameState !== STATE.CPU_THINKING) ||
    !s.gameActive
  )
    return;

  s.gameState = STATE.ROLLING;
  refreshActionButton();
  s.currentRoll = Math.floor(Math.random() * 6) + 1;
  roll3DDice(s.currentRoll);
  showReaction(`roll_${s.currentRoll}`, s.turn);

  setTimeout(() => {
    if (!s.gameActive) return;
    recordRoll(s.turn, s.currentRoll);
    const target = s.players[s.turn].pos + s.currentRoll;

    if (target > 64) {
      const need = 64 - s.players[s.turn].pos;
      addLog(
        `${s.players[s.turn].name} rolled ${s.currentRoll} but needs exactly ${need} to win. Turn skipped.`,
        "error",
      );
      if (s.gameFeedback)
        s.gameFeedback.textContent = `Rolled ${s.currentRoll} — need exactly ${need} to win!`;
      endTurn();
      return;
    }

    if ((s.vsCPU && s.turn === 1) || s.autoMove) {
      addLog(`${s.players[s.turn].name} rolled ${s.currentRoll}!`, "action");
      if (s.gameFeedback)
        s.gameFeedback.textContent = `Rolled ${s.currentRoll}! Moving to ${target}…`;
      animateCPUToken(s.turn, s.players[s.turn].pos, target, () => {
        s.players[s.turn].pos = target;
        checkSquareLogic(s.turn, target);
      });
    } else {
      s.expectedSquare = target;
      s.gameState = STATE.WAITING_DRAG;
      addLog(
        `${s.players[s.turn].name} rolled ${s.currentRoll}! Press Move (or drag) to square ${target}.`,
        "action",
      );
      if (s.gameFeedback)
        s.gameFeedback.textContent = `Rolled ${s.currentRoll}! Press Move to ${target} (or drag the token).`;
      refreshActionButton();
    }
  }, 600);
}

export function checkSquareLogic(pi, sq) {
  const s = state;
  if (sq in s.SNAKES) {
    const tail = s.SNAKES[sq];
    addLog(`OH NO! ${s.players[pi].name} hit a snake!`, "snake");
    showReaction("snake", pi);
    if ((s.vsCPU && pi === 1) || s.autoMove) {
      setTimeout(
        () =>
          animateCPUToken(pi, sq, tail, () => {
            s.players[pi].pos = tail;
            checkFraction(pi, tail);
          }),
        700,
      );
    } else {
      s.expectedSquare = tail;
      s.gameState = STATE.WAITING_DRAG_SNAKELADDER;
      if (s.gameFeedback)
        s.gameFeedback.textContent = `Snake! Press Slide (or drag) down to ${tail}.`;
      refreshActionButton();
    }
  } else if (sq in s.LADDERS) {
    const top = s.LADDERS[sq];
    addLog(`YAY! ${s.players[pi].name} found a ladder!`, "ladder");
    showReaction("ladder", pi);
    if ((s.vsCPU && pi === 1) || s.autoMove) {
      setTimeout(
        () =>
          animateCPUToken(pi, sq, top, () => {
            s.players[pi].pos = top;
            checkFraction(pi, top);
          }),
        700,
      );
    } else {
      s.expectedSquare = top;
      s.gameState = STATE.WAITING_DRAG_SNAKELADDER;
      if (s.gameFeedback)
        s.gameFeedback.textContent = `Ladder! Press Climb (or drag) up to ${top}.`;
      refreshActionButton();
    }
  } else if (sq === 64) {
    triggerWin(pi);
  } else {
    checkFraction(pi, sq);
  }
}

export function checkFraction(pi, sq) {
  const f = state.FRAC[sq];
  if (f && f.d !== "W") showQuestion(f, pi);
  else if (sq === 64) triggerWin(pi);
  else endTurn();
}

export function endTurn() {
  state.turn = 1 - state.turn;
  startTurn();
}

export function triggerWin(pi, reason = null) {
  const s = state;
  s.gameState = STATE.GAME_OVER;
  s.gameActive = false;
  addLog(`${s.players[pi].name} WON THE GAME!`, "action");
  showReaction("win", pi);
  s.winName.textContent = `${s.players[pi].name} WINS!`;
  s.winName.style.color = s.players[pi].color;
  const sub = document.getElementById("winSub");
  if (sub) sub.textContent = reason ?? "Reached square 64 first!";
  setTimeout(() => s.winOverlay.classList.add("show"), 800);
}

// ─── Dice drag ────────────────────────────────────────────────────────────────

function setupDiceDrag() {
  const s = state;
  if (s.diceSetupDone || !s.diceScene) return;

  s.diceScene.addEventListener("pointerdown", (e) => {
    if (!s.gameActive || s.gameState !== STATE.WAITING_ROLL) return;
    const now = Date.now();
    if (now - s.lastTapTime < 400) {
      executeRoll();
      s.lastTapTime = 0;
      e.preventDefault();
      return;
    }
    s.lastTapTime = now;
    const r = s.diceScene.getBoundingClientRect();
    s.diceDragState = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: e.clientX,
      origY: e.clientY,
    };
    s.diceScene.classList.add("dragging");
    s.diceScene.style.right = "auto";
    s.diceScene.style.left = r.left + "px";
    s.diceScene.style.top = r.top + "px";
    e.preventDefault();
  });

  window.addEventListener("pointermove", (e) => {
    if (!s.diceDragState.isDragging) return;
    const wr = s.gameWrapper.getBoundingClientRect();
    const dx = e.clientX - s.diceDragState.startX;
    const dy = e.clientY - s.diceDragState.startY;
    s.diceScene.style.left =
      Math.max(
        0,
        Math.min(wr.width - 60, parseFloat(s.diceScene.style.left) + dx),
      ) + "px";
    s.diceScene.style.top =
      Math.max(
        0,
        Math.min(wr.height - 60, parseFloat(s.diceScene.style.top) + dy),
      ) + "px";
    s.diceDragState.startX = e.clientX;
    s.diceDragState.startY = e.clientY;
  });

  window.addEventListener("pointerup", (e) => {
    if (!s.diceDragState.isDragging) return;
    s.diceScene.classList.remove("dragging");
    s.diceDragState.isDragging = false;
    if (
      Math.hypot(
        e.clientX - s.diceDragState.origX,
        e.clientY - s.diceDragState.origY,
      ) > 15 &&
      s.gameState === STATE.WAITING_ROLL
    ) {
      executeRoll();
    }
  });

  s.diceSetupDone = true;
}

// ─── Token drag on canvas ─────────────────────────────────────────────────────

function setupTokenDrag() {
  if (_tokenDragWired) return;
  _tokenDragWired = true;
  const s = state;

  s.canvas.addEventListener("pointerdown", (e) => {
    if (!s.gameActive) return;
    if (
      s.gameState !== STATE.WAITING_DRAG &&
      s.gameState !== STATE.WAITING_DRAG_SNAKELADDER
    )
      return;
    const pt = getCanvasPoint(e);
    const p = s.players[s.turn];
    if (Math.hypot(pt.x - p.drawX, pt.y - p.drawY) < 50) {
      s.dragState = { isDragging: true, pi: s.turn };
      e.preventDefault();
      drawBoard();
    }
  });

  window.addEventListener("pointermove", (e) => {
    if (!s.dragState.isDragging || !s.gameActive) return;
    const pt = getCanvasPoint(e);
    s.players[s.dragState.pi].drawX = pt.x;
    s.players[s.dragState.pi].drawY = pt.y;
    drawBoard();
  });

  window.addEventListener("pointerup", (e) => {
    if (!s.dragState.isDragging || !s.gameActive) return;
    const pi = s.dragState.pi;
    s.dragState = { isDragging: false, pi: -1 };
    const pt = getCanvasPoint(e);
    const drop = getSquareFromPoint(pt.x, pt.y);

    if (drop === s.expectedSquare) {
      s.players[pi].pos = s.expectedSquare;
      snapToken(pi, s.players[pi].pos);
      if (s.gameState === STATE.WAITING_DRAG)
        checkSquareLogic(pi, s.players[pi].pos);
      else if (s.gameState === STATE.WAITING_DRAG_SNAKELADDER)
        checkFraction(pi, s.players[pi].pos);
    } else {
      addLog(`Wrong square. Drop on ${s.expectedSquare}.`, "error");
      if (s.gameFeedback)
        s.gameFeedback.textContent = `Wrong square! Drop on ${s.expectedSquare}.`;
      snapToken(pi, s.players[pi].pos);
    }
  });
}

// ─── Fraction input events ────────────────────────────────────────────────────

function setupFracInputEvents() {
  if (_fracEventsWired) return;
  _fracEventsWired = true;
  const s = state;

  document.addEventListener("pointerdown", (e) => {
    if (e.target.classList.contains("frac-input")) {
      document
        .querySelectorAll(".frac-input")
        .forEach((el) => el.classList.remove("active-focus"));
      e.target.classList.add("active-focus");
      s.activeInput = e.target;
    }
  });

  document.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("btn-check-frac") &&
      s.fracPopup?.contains(e.target)
    )
      submitAnswer();
  });

  document.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest("#snakes-numpad button");
    if (btn) {
      e.preventDefault();
      onNumpadClick(btn.dataset.key);
    }
  });

  window.addEventListener("keydown", (e) => {
    if (!s.fracPopup?.classList.contains("show") || !s.activeInput) return;
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      onNumpadClick(e.key);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      s.activeInput.textContent = s.activeInput.textContent.slice(0, -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      submitAnswer();
    } else if (e.key === "Escape" || e.key.toLowerCase() === "c") {
      e.preventDefault();
      onNumpadClick("C");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const inputs = Array.from(s.popupEq.querySelectorAll(".frac-input"));
      const idx = inputs.indexOf(s.activeInput);
      if (idx >= 0) {
        const next = e.shiftKey
          ? (idx - 1 + inputs.length) % inputs.length
          : (idx + 1) % inputs.length;
        inputs.forEach((el) => el.classList.remove("active-focus"));
        s.activeInput = inputs[next];
        s.activeInput.classList.add("active-focus");
      }
    }
  });
}

// ─── Game reset ───────────────────────────────────────────────────────────────

export function resetGame() {
  const s = state;
  s.players[0].name = "P1";
  s.players[1].name = s.vsCPU ? "CPU" : "P2";

  s.players.forEach((p, i) => {
    p.pos = 1;
    const c = squareCenter(1);
    p.drawX = c.x + OFFSETS[i].dx;
    p.drawY = c.y + OFFSETS[i].dy;
  });

  resetProfiles();
  clearReactions();
  stopSpeech();

  const diffDD = document.getElementById("dd-difficulty");
  const selItem = diffDD?.querySelector(".pp-dropdown-item.selected");
  const diff = selItem?.dataset.value ?? "standard";

  setActivePlugin(s.mathConcept);

  const board = generateRandomBoard(diff, getActivePlugin());
  s.SNAKES = board.snakes;
  s.SNAKE_COLORS = board.snakeColors;
  s.LADDERS = board.ladders;
  s.FRAC = board.fractions;

  s.turn = 0;
  s.logActive = false;
  s.logOverlay.innerHTML = "";
  s.logOverlay.classList.remove("active");
  s.winOverlay.classList.remove("show");
  s.fracPopup?.classList.remove("show");
  s.numpad?.classList.remove("show");
  s.luckyCardOverlay?.classList.remove("show");
  s.bonusCardOverlay?.classList.remove("show");

  s.gameActive = true;
  s.gameState = STATE.WAITING_ROLL;

  if (s.diceScene) {
    s.diceScene.style.left = "";
    s.diceScene.style.top = "";
    s.diceScene.style.right = "16px";
  }

  const btnEnter = document.getElementById("fullscreen-btn-enter");
  const btnExit = document.getElementById("fullscreen-btn");
  if (btnEnter) btnEnter.style.display = "inline-flex";
  if (btnExit) btnExit.style.display = "none";

  drawBoard();
  startTurn();
  refreshActionButton();
  if (s.gameFeedback)
    s.gameFeedback.textContent = "New game! Press Roll Dice to begin.";
}

// ─── Open / close modal ───────────────────────────────────────────────────────

export function openGameModal() {
  const s = state;

  s.gameModal = document.getElementById("game-modal");
  s.canvas = document.getElementById("boardCanvas");
  s.ctx = s.canvas.getContext("2d");
  s.canvas.width = s.canvas.height = BOARD_SIZE;

  s.gameFeedback = document.getElementById("game-feedback");
  s.turnHud = document.getElementById("turnHud");
  s.dtHint = document.getElementById("dtHint");
  s.fracPopup = document.getElementById("fracPopup");
  s.popupEq = document.getElementById("popupEq");
  s.winOverlay = document.getElementById("winOverlay");
  s.winName = document.getElementById("winName");
  s.cube = document.getElementById("cube");
  s.logOverlay = document.getElementById("logOverlay");
  s.modalTurn = document.getElementById("modal-turn");
  s.gameWrapper = document.getElementById("gameWrapper");
  s.diceScene = document.getElementById("diceScene");
  s.fullscreenBtn = document.getElementById("fullscreen-btn");
  s.fullscreenBtnEnter = document.getElementById("fullscreen-btn-enter");

  injectDynamicUI();
  setupTokenDrag();
  setupFracInputEvents();

  if (!_actionBtnWired) {
    document
      .getElementById("btn-game-action")
      ?.addEventListener("click", onGameAction);
    _actionBtnWired = true;
  }

  s.gameModal.classList.add("active");
  document.body.style.overflow = "hidden";

  // Hide site nav when game opens
  hideSiteNav();

  initColorDropdowns();
  resetGame();
  setupDiceDrag();
}

export function closeGameModal() {
  const s = state;
  s.gameActive = false;
  clearReactions();
  stopSpeech();

  if (document.fullscreenElement || document.webkitFullscreenElement)
    (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);

  s.gameWrapper?.classList.remove("fullscreen-mode");

  s.gameModal?.classList.remove("active");
  document.body.style.overflow = "";

  s.winOverlay?.classList.remove("show");
  s.fracPopup?.classList.remove("show");
  s.numpad?.classList.remove("show");
  s.luckyCardOverlay?.classList.remove("show");
  s.bonusCardOverlay?.classList.remove("show");

  // Restore site nav when game closes
  showSiteNav();

  updateFullscreenUI();
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("ticker-track");
  if (track) {
    const words = [
      "Snakes",
      "Ladders",
      "Fractions",
      "Prep Portal",
      "Drag Dice",
      "Climb Up",
      "Slide Down",
    ];
    [...words, ...words].forEach((t) => {
      const s = document.createElement("span");
      s.className = "ticker-item";
      s.textContent = t;
      track.appendChild(s);
    });
  }

  wireUI({ openGameModal, closeGameModal, resetGame });

  const canvas = document.getElementById("boardCanvas");
  if (canvas) {
    state.canvas = canvas;
    state.ctx = canvas.getContext("2d");
    canvas.width = canvas.height = BOARD_SIZE;
  }
});
