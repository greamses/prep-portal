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
const S = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICONS = {
  dice: S('<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/>'),
  target: S('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>'),
  fire: S('<path d="M12 3c1 2.5 4 3.8 4 7.5a4 4 0 0 1-8 0c0-1.8 1-3 2-3.8.2 1.8 2 1.8 2 0 0-1.6 0-2.6 0-3.7Z"/>'),
  snake: S('<path d="M6 6.5a2.5 2.5 0 0 1 5 0c0 3-6 2.8-6 6.5a4 4 0 0 0 8 .5"/><circle cx="6" cy="6" r="0.9" fill="currentColor" stroke="none"/>'),
  ladder: S('<path d="M7.5 21V4M16.5 21V4M7.5 8h9M7.5 12h9M7.5 16h9"/>'),
  star: S('<path d="M12 3l2.5 6.1 6.5.5-5 4.2 1.6 6.3L12 16.9l-5.6 3.2 1.6-6.3-5-4.2 6.5-.5L12 3Z"/>'),
  check: S('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9"/>'),
  think: S('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.4a2.5 2.5 0 0 1 4.6 1.3c0 1.6-2.1 2-2.1 3.3"/><circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none"/>'),
  cross: S('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
  trophy: S('<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5a2 2 0 0 0 0 4H7M17 6h2.5a2 2 0 0 1 0 4H17"/><path d="M12 14v3M9.5 21h5M10 17h4l-.4 4h-3.2L10 17Z"/>'),
  robot: S('<rect x="5" y="8" width="14" height="11" rx="2.5"/><path d="M12 5v3M8.5 13v.01M15.5 13v.01M9 16h6"/><circle cx="12" cy="4" r="1.2" fill="currentColor" stroke="none"/>'),
  shield: S('<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z"/><path d="M9 12l2 2 4-4"/>'),
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
