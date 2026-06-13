// constants.js — Immutable game constants

export const BOARD_SIZE = 1024;
export const CELL       = BOARD_SIZE / 8;   // 128

/** Game-flow state machine values */
export const STATE = Object.freeze({
  WAITING_ROLL:             0,
  ROLLING:                  1,
  WAITING_DRAG:             2,
  WAITING_DRAG_SNAKELADDER: 3,
  WAITING_FRAC_ANSWER:      4,
  CPU_THINKING:             5,
  GAME_OVER:                6,
});

/** Per-player token draw offsets so two tokens on the same square don't overlap */
export const OFFSETS = Object.freeze([
  { dx: -22, dy: -18 },
  { dx:  22, dy:  18 },
]);

export const PLAYER_COLORS = Object.freeze([
  { name: 'Blue',   value: '#0055ff' },
  { name: 'Red',    value: '#ff2200' },
  { name: 'Green',  value: '#00a550' },
  { name: 'Purple', value: '#9b59b6' },
  { name: 'Orange', value: '#e67e22' },
  { name: 'Pink',   value: '#e84393' },
]);
