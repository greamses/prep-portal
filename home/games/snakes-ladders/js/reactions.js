// reactions.js — Animated emoji toast reactions for game events.
//
// showReaction(type, pi)
//   type — event key (see CATALOG below)
//   pi   — player index (0|1) used to anchor the toast near their token
//
// Toasts are injected into .snakes-game-wrapper as position:absolute divs,
// centred on the player's current drawX/drawY canvas coordinates expressed
// as percentages of the wrapper size. One toast at a time — a new call
// evicts any existing toast immediately.

import { state }       from './state.js';
import { BOARD_SIZE }  from './constants.js';

// ─── Our own inline SVG icon set (NO emoji anywhere on the site) ───────────────
// The reactions' marks, in the site's one icon language (utils/components/ui-icons.js).
const ICONS = {
  dice: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><rect x=\"2.6\" y=\"2.6\" width=\"18.8\" height=\"18.8\" rx=\"4.2\" fill=\"var(--accent-secondary)\"/><circle cx=\"8.2\" cy=\"8.2\" r=\"1.75\" fill=\"#fff\"/><circle cx=\"15.8\" cy=\"8.2\" r=\"1.75\" fill=\"#fff\"/><circle cx=\"12\" cy=\"12\" r=\"1.75\" fill=\"var(--accent-primary)\"/><circle cx=\"8.2\" cy=\"15.8\" r=\"1.75\" fill=\"#fff\"/><circle cx=\"15.8\" cy=\"15.8\" r=\"1.75\" fill=\"#fff\"/></svg>",
  target: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9.6\" fill=\"var(--accent-danger)\"/><circle cx=\"12\" cy=\"12\" r=\"6.6\" fill=\"#fff\"/><circle cx=\"12\" cy=\"12\" r=\"3.6\" fill=\"var(--accent-danger)\"/><circle cx=\"12\" cy=\"12\" r=\"1.4\" fill=\"#fff\"/></svg>",
  fire: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M12 2.2c1.4 3.4 5.6 5.2 5.6 10.4a5.6 5.6 0 0 1-11.2 0c0-2.6 1.4-4.2 2.8-5.4.3 2.6 2.8 2.6 2.8 0z\" fill=\"var(--accent-warning)\"/><path d=\"M12 11.4c.8 1.8 2.8 2.6 2.8 5a2.8 2.8 0 0 1-5.6 0c0-1.4.8-2.4 1.4-3 .2 1.2 1.4 1.2 1.4 0z\" fill=\"var(--accent-primary)\"/></svg>",
  snake: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M6 6.8a2.8 2.8 0 0 1 5.6 0c0 3.4-6.6 3.2-6.6 7.4a4.4 4.4 0 0 0 8.8.6c.2-2.8 3.2-3.8 5.8-2\" fill=\"none\" stroke=\"var(--accent-success)\" stroke-width=\"3.2\" stroke-linecap=\"round\"/><circle cx=\"7.8\" cy=\"6.2\" r=\"1\" fill=\"#fff\"/></svg>",
  ladder: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><rect x=\"5.6\" y=\"2.6\" width=\"2.6\" height=\"18.8\" rx=\"1.3\" fill=\"var(--accent-warning)\"/><rect x=\"15.8\" y=\"2.6\" width=\"2.6\" height=\"18.8\" rx=\"1.3\" fill=\"var(--accent-warning)\"/><rect x=\"8.2\" y=\"6.4\" width=\"7.6\" height=\"2.2\" rx=\"1.1\" fill=\"var(--accent-primary)\"/><rect x=\"8.2\" y=\"11\" width=\"7.6\" height=\"2.2\" rx=\"1.1\" fill=\"var(--accent-primary)\"/><rect x=\"8.2\" y=\"15.6\" width=\"7.6\" height=\"2.2\" rx=\"1.1\" fill=\"var(--accent-primary)\"/></svg>",
  star: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M12 2.6l2.6 5.35 5.9.85-4.27 4.16 1.01 5.88L12 16.13l-5.24 2.76 1.01-5.88L3.5 8.8l5.9-.85z\" fill=\"var(--accent-primary)\"/><circle cx=\"12\" cy=\"10.4\" r=\"1.9\" fill=\"#fff\" opacity=\"0.85\"/></svg>",
  check: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9.6\" fill=\"var(--accent-success)\"/><path d=\"M7.4 12.4l3 3 6.2-6.7\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
  think: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9.6\" fill=\"var(--accent-secondary)\"/><path d=\"M9.4 9.4a2.7 2.7 0 0 1 5.1 1.2c0 1.8-2.4 2.1-2.4 3.6\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.3\" stroke-linecap=\"round\"/><circle cx=\"12.1\" cy=\"17.2\" r=\"1.3\" fill=\"#fff\"/></svg>",
  cross: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9.6\" fill=\"var(--accent-danger)\"/><rect x=\"7.19\" y=\"10.85\" width=\"9.62\" height=\"2.3\" rx=\"1.15\" fill=\"#fff\" transform=\"rotate(45.00 12.00 12.00)\"/><rect x=\"7.19\" y=\"10.85\" width=\"9.62\" height=\"2.3\" rx=\"1.15\" fill=\"#fff\" transform=\"rotate(135.00 12.00 12.00)\"/></svg>",
  trophy: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M7 4h10v4a5 5 0 0 1-10 0z\" fill=\"var(--accent-primary)\"/><path d=\"M7 5H4.4v1.6A3 3 0 0 0 7 9.5V7.2A1 1 0 0 1 7 7zm10 0v2c0 .07 0 .14-.01.2v2.3A3 3 0 0 0 19.6 6.6V5z\" fill=\"var(--accent-primary)\"/><rect x=\"10.7\" y=\"12.4\" width=\"2.6\" height=\"3.1\" rx=\"0\" fill=\"var(--accent-primary)\"/><rect x=\"7.4\" y=\"15\" width=\"9.2\" height=\"2.3\" rx=\"1.15\" fill=\"var(--accent-secondary)\"/><rect x=\"8.4\" y=\"17.7\" width=\"7.2\" height=\"2.5\" rx=\"1.25\" fill=\"var(--accent-secondary)\"/><path d=\"M12 5.3l.85 1.75 1.9.25-1.4 1.3.35 1.9L12 9.4l-1.7.95.35-1.9-1.4-1.3 1.9-.25z\" fill=\"#fff\"/></svg>",
  robot: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><rect x=\"3.4\" y=\"8\" width=\"17.2\" height=\"12\" rx=\"3\" fill=\"var(--accent-secondary)\"/><circle cx=\"9\" cy=\"13.4\" r=\"1.8\" fill=\"#fff\"/><circle cx=\"15\" cy=\"13.4\" r=\"1.8\" fill=\"#fff\"/><rect x=\"9\" y=\"16.6\" width=\"6\" height=\"1.6\" rx=\"0.8\" fill=\"#fff\"/><rect x=\"10.9\" y=\"3.4\" width=\"2.2\" height=\"5.2\" rx=\"1.1\" fill=\"var(--text-tertiary)\"/><circle cx=\"12\" cy=\"3\" r=\"1.8\" fill=\"var(--accent-danger)\"/></svg>",
  shield: "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M12 2.4l8 2.7v6.3c0 5-3.4 8.5-8 10.6-4.6-2.1-8-5.6-8-10.6V5.1z\" fill=\"var(--accent-secondary)\"/><path d=\"M8.4 12l2.6 2.6 4.8-5\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
};

// ─── Reaction catalog ─────────────────────────────────────────────────────────
// Each key maps to an array of { i: iconKey, t: label } objects.
// A random variant is chosen each time, adding natural variety.

const CATALOG = {
  // ── Dice rolls ──────────────────────────────────────────────────────────────
  roll_1:    [{ i:'dice', t:'ROLLED 1…' }, { i:'dice', t:'JUST 1!' }],
  roll_2:    [{ i:'dice', t:'ROLLED 2' }],
  roll_3:    [{ i:'dice', t:'ROLLED 3' }],
  roll_4:    [{ i:'dice', t:'ROLLED 4' }],
  roll_5:    [{ i:'target', t:'ROLLED 5!' }],
  roll_6:    [{ i:'fire', t:'ROLLED 6!' }, { i:'fire', t:'MAX ROLL!' }, { i:'fire', t:'SIX!' }],

  // ── Board events ─────────────────────────────────────────────────────────────
  snake:     [{ i:'snake', t:'SNAKE!' }, { i:'snake', t:'OH NO!' }, { i:'snake', t:'SLITHERING DOWN…' }],
  ladder:    [{ i:'ladder', t:'LADDER!' }, { i:'ladder', t:'CLIMBING UP!' }, { i:'ladder', t:'SHORTCUT!' }],

  // ── Question answers ─────────────────────────────────────────────────────────
  correct_bonus: [
    { i:'star', t:'PERFECT!' }, { i:'star', t:'LOWEST TERMS!' },
    { i:'star', t:'GENIUS!' }, { i:'star', t:'FLAWLESS!' },
  ],
  correct: [
    { i:'check', t:'CORRECT!' }, { i:'check', t:'NICE ONE!' },
    { i:'check', t:'GOT IT!' }, { i:'target', t:'SPOT ON!' },
  ],
  wrong: [
    { i:'think', t:'NOT QUITE…' }, { i:'think', t:'THINK AGAIN' },
    { i:'think', t:'TRY AGAIN' }, { i:'think', t:'HMMMM…' },
  ],
  disqualified: [
    { i:'cross', t:'DISQUALIFIED' }, { i:'cross', t:'GAME OVER' }, { i:'cross', t:'5 STRIKES!' },
  ],

  // ── Win ───────────────────────────────────────────────────────────────────────
  win: [
    { i:'trophy', t:'WINNER!' }, { i:'trophy', t:'CHAMPION!' },
    { i:'trophy', t:'VICTORY!' }, { i:'trophy', t:'FIRST PLACE!' },
  ],

  // ── CPU legendary reasoning ───────────────────────────────────────────────────
  cpu_advance: [
    { i:'robot', t:'ADVANCING…' }, { i:'robot', t:'CALCULATED' }, { i:'robot', t:'OPTIMAL MOVE' },
  ],
  cpu_block: [
    { i:'shield', t:'BLOCKING!' }, { i:'robot', t:'PREDICTED YOU' }, { i:'shield', t:'ADAPTED' },
  ],
};

// ─── Duration map ─────────────────────────────────────────────────────────────
// How long (ms) each type stays visible. Matches the CSS animation duration.

const DURATION = {
  roll_1: 1100, roll_2: 900, roll_3: 900,
  roll_4: 900,  roll_5: 1000, roll_6: 1400,
  snake:  1800, ladder:  1800,
  correct_bonus: 2200, correct: 1600,
  wrong: 1400, disqualified: 2400,
  win: 2800,
  cpu_advance: 1400, cpu_block: 1600,
};

// ─── Active toast reference ───────────────────────────────────────────────────

let _activeToast = null;
let _activeTimer = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Show an animated emoji reaction toast anchored near player `pi`'s token.
 * @param {string} type   - Catalog key
 * @param {number} pi     - Player index (0 or 1)
 * @param {string} [override] - Optional extra context appended to label
 */
export function showReaction(type, pi, override = '') {
  const wrapper = state.gameWrapper;
  if (!wrapper || !state.gameActive) return;

  const variants = CATALOG[type];
  if (!variants) return;

  const { i: iconKey, t: label } = variants[Math.floor(Math.random() * variants.length)];
  const icon = ICONS[iconKey] || ICONS.dice;
  const fullLabel = override ? `${label} ${override}` : label;

  _evictToast();

  // Convert canvas-logical player position → fixed screen coords.
  // This avoids clipping by the wrapper's overflow:hidden.
  const rect   = wrapper.getBoundingClientRect();
  const scale  = rect.width / BOARD_SIZE;
  const p      = state.players[pi];
  const rawX   = rect.left + p.drawX * scale;
  const rawY   = rect.top  + p.drawY * scale;

  // Clamp so the toast stays within the wrapper's screen bounds
  const screenX = Math.min(Math.max(rawX, rect.left + 30), rect.right  - 30);
  const screenY = Math.min(Math.max(rawY, rect.top  + 50), rect.bottom - 80);

  const toast = document.createElement('div');
  toast.className = 'reaction-toast';
  toast.style.left = `${screenX}px`;
  toast.style.top  = `${screenY}px`;
  toast.innerHTML = `
    <div class="rt-emoji">${icon}</div>
    <div class="rt-label">${fullLabel}</div>
  `;

  const ms = DURATION[type] ?? 1600;
  toast.style.setProperty('--rt-dur', `${ms}ms`);

  document.body.appendChild(toast);
  _activeToast = toast;

  _activeTimer = setTimeout(_evictToast, ms + 80);
}

/** Remove the current toast if one is showing. */
function _evictToast() {
  if (_activeTimer) { clearTimeout(_activeTimer); _activeTimer = null; }
  if (_activeToast) { _activeToast.remove(); _activeToast = null; }
}

/** Evict without animation — call on game reset / modal close. */
export function clearReactions() {
  _evictToast();
}
