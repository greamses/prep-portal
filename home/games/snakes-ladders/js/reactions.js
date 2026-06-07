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

// ─── Reaction catalog ─────────────────────────────────────────────────────────
// Each key maps to an array of { emoji, label } objects.
// A random variant is chosen each time, adding natural variety.

const CATALOG = {
  // ── Dice rolls ──────────────────────────────────────────────────────────────
  roll_1:    [{ e:'😬', t:'ROLLED 1…' }, { e:'🙈', t:'JUST 1!' }],
  roll_2:    [{ e:'🎲', t:'ROLLED 2' }],
  roll_3:    [{ e:'🎲', t:'ROLLED 3' }],
  roll_4:    [{ e:'🎲', t:'ROLLED 4' }],
  roll_5:    [{ e:'🎯', t:'ROLLED 5!' }],
  roll_6:    [{ e:'🔥', t:'ROLLED 6!' }, { e:'💪', t:'MAX ROLL!' }, { e:'🚀', t:'SIX!' }],

  // ── Board events ─────────────────────────────────────────────────────────────
  snake:     [{ e:'😱', t:'SNAKE!' }, { e:'🐍', t:'OH NO!' }, { e:'😭', t:'SLITHERING DOWN…' }],
  ladder:    [{ e:'🎉', t:'LADDER!' }, { e:'🚀', t:'CLIMBING UP!' }, { e:'⚡', t:'SHORTCUT!' }],

  // ── Question answers ─────────────────────────────────────────────────────────
  correct_bonus: [
    { e:'🌟', t:'PERFECT!' }, { e:'💯', t:'LOWEST TERMS!' },
    { e:'🧠', t:'GENIUS!' }, { e:'🏅', t:'FLAWLESS!' },
  ],
  correct: [
    { e:'✅', t:'CORRECT!' }, { e:'👍', t:'NICE ONE!' },
    { e:'😎', t:'GOT IT!' }, { e:'🎯', t:'SPOT ON!' },
  ],
  wrong: [
    { e:'😅', t:'NOT QUITE…' }, { e:'🤔', t:'THINK AGAIN' },
    { e:'💭', t:'TRY AGAIN' }, { e:'😬', t:'HMMMM…' },
  ],
  disqualified: [
    { e:'💀', t:'DISQUALIFIED' }, { e:'😵', t:'GAME OVER' }, { e:'🚫', t:'5 STRIKES!' },
  ],

  // ── Win ───────────────────────────────────────────────────────────────────────
  win: [
    { e:'🏆', t:'WINNER!' }, { e:'👑', t:'CHAMPION!' },
    { e:'🎊', t:'VICTORY!' }, { e:'🥇', t:'FIRST PLACE!' },
  ],

  // ── CPU legendary reasoning ───────────────────────────────────────────────────
  cpu_advance: [
    { e:'🤖', t:'ADVANCING…' }, { e:'📊', t:'CALCULATED' }, { e:'🧮', t:'OPTIMAL MOVE' },
  ],
  cpu_block: [
    { e:'🛡️', t:'BLOCKING!' }, { e:'🤖', t:'PREDICTED YOU' }, { e:'🧠', t:'ADAPTED' },
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

  const { e: emoji, t: label } = variants[Math.floor(Math.random() * variants.length)];
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
    <div class="rt-emoji">${emoji}</div>
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
