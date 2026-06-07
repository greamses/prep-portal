// state.js — Single shared mutable state object.
// All modules import this and read/write through it to avoid circular deps.

import { STATE, OFFSETS } from './constants.js';

export const state = {
  // ── Canvas ────────────────────────────────────────────────────────────
  canvas:  null,
  ctx:     null,

  // ── Board data (overwritten each new game) ────────────────────────────
  FRAC:        {},
  SNAKES:      {},
  SNAKE_COLORS:{},
  LADDERS:     {},

  // ── Players ───────────────────────────────────────────────────────────
  players: [
    { pos: 1, color: '#0055ff', name: 'P1', drawX: 0, drawY: 0 },
    { pos: 1, color: '#ff2200', name: 'P2', drawX: 0, drawY: 0 },
  ],

  // ── Game settings ─────────────────────────────────────────────────────
  vsCPU:       false,
  cpuIntel:    'advanced',
  autoMove:    false,
  mathConcept: 'fractions',   // active question plugin id

  // ── Legendary AI scratch-pad ──────────────────────────────────────────
  _legendaryReason: '',

  // ── Round state ───────────────────────────────────────────────────────
  turn:           0,
  gameState:      STATE.WAITING_ROLL,
  expectedSquare: null,
  currentRoll:    0,
  gameActive:     false,
  logActive:      false,

  // ── Drag state ────────────────────────────────────────────────────────
  dragState:      { isDragging: false, pi: -1 },
  diceDragState:  { isDragging: false, startX: 0, startY: 0, origX: 0, origY: 0 },
  numpadDragState:{ isDragging: false, startX: 0, startY: 0 },
  diceSetupDone:  false,
  lastTapTime:    0,

  // ── Fraction question ─────────────────────────────────────────────────
  currentFracPlayer:   0,
  currentFracAttempts: 0,
  currentFracData:     null,
  isProcessingAnswer:  false,
  activeInput:         null,

  // ── DOM references (set in openGameModal) ────────────────────────────
  gameModal:          null,
  gameFeedback:       null,
  turnHud:            null,
  dtHint:             null,
  fracPopup:          null,
  popupEq:            null,
  winOverlay:         null,
  winName:            null,
  cube:               null,
  logOverlay:         null,
  modalTurn:          null,
  gameWrapper:        null,
  diceScene:          null,
  fullscreenBtn:      null,
  fullscreenBtnEnter: null,
  numpad:             null,
  luckyCardOverlay:   null,
  bonusCardOverlay:   null,
};
