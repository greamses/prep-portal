// ui.js — DOM helpers: dropdowns, numpad, HUD, log, fullscreen, event wiring.
// Bug fix 1: initColorDropdowns() is called at DOMContentLoaded (not just openGameModal).
// Bug fix 2: fullscreen buttons use getElementById so they never rely on stale module vars.

import { PLAYER_COLORS }                      from './constants.js';
import { state }                               from './state.js';
import { drawBoard }                           from './renderer.js';
import { setActivePlugin, getAllPlugins }       from './mathPlugins.js';

// ─── Log ──────────────────────────────────────────────────────────────────────

// Speech synthesis state — module-level, never touches state.js
let _speakerOn = false;
let _voices    = [];

// Pre-load voices (Chrome requires this)
if ('speechSynthesis' in window) {
  const loadVoices = () => { _voices = window.speechSynthesis.getVoices(); };
  loadVoices();
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

/** Returns the best available English voice, or null for the system default. */
function _pickVoice() {
  return _voices.find(v => v.lang.startsWith('en') && v.localService)
    ?? _voices.find(v => v.lang.startsWith('en'))
    ?? null;
}

/** Toggle the log speaker on/off. */
export function toggleSpeaker() {
  _speakerOn = !_speakerOn;
  const btn = document.getElementById('btn-speaker');
  if (btn) {
    btn.classList.toggle('active', _speakerOn);
    btn.setAttribute('aria-pressed', String(_speakerOn));
    btn.title = _speakerOn ? 'Speaker ON — click to mute' : 'Read log aloud';
  }
  if (!_speakerOn) stopSpeech();
}

/** Cancel any in-progress speech. Called on reset and modal close. */
export function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function addLog(msg, type = 'info') {
  const s = state;
  if (!s.logActive) { s.logActive = true; s.logOverlay?.classList.add('active'); }
  const el = document.createElement('div');
  el.className  = `snakes-log-entry ${type}`;
  el.textContent= msg;
  s.logOverlay?.appendChild(el);
  if (s.logOverlay) s.logOverlay.scrollTop = s.logOverlay.scrollHeight;

  // ── Log speaker ────────────────────────────────────────────────────────────
  if (_speakerOn && 'speechSynthesis' in window) {
    // Cancel previous utterance so the latest event always wins
    window.speechSynthesis.cancel();
    const utt  = new SpeechSynthesisUtterance(msg);
    utt.rate   = 1.1;
    utt.pitch  = 1;
    const v    = _pickVoice();
    if (v) utt.voice = v;
    window.speechSynthesis.speak(utt);
  }
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
// Turn badge: dark background + player's TOKEN COLOR as text.
// Satisfies: "selected tokens text colors should be same as the tokens colors."

export function updateHUD() {
  const { players, turn, turnHud, modalTurn } = state;
  const p = players[turn];

  if (turnHud) {
    turnHud.textContent       = `${p.name}'S TURN`;
    turnHud.style.background  = '#1a1a1a';
    turnHud.style.color       = p.color;
    turnHud.style.borderColor = p.color;
  }
  if (modalTurn) {
    modalTurn.textContent      = `${p.name}'s Turn`;
    modalTurn.style.background = '#1a1a1a';
    modalTurn.style.color      = p.color;
  }
}

// ─── Fullscreen ───────────────────────────────────────────────────────────────
// Always reads from DOM — never relies on module-level var being set.

function _fsBtn()      { return document.getElementById('fullscreen-btn'); }
function _fsBtnEnter() { return document.getElementById('fullscreen-btn-enter'); }

export function toggleFullscreen() {
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                  document.mozFullScreenElement || document.msFullscreenElement);

  if (!isFs) {
    // Request on documentElement — universally supported, no CSP/permissions-policy
    // restrictions that can affect sub-div elements on hosted environments.
    const el  = document.documentElement;
    const req = (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen);
    if (!req) return;                          // browser doesn't support fullscreen at all

    req.call(el)
      .then(() => updateFullscreenUI())        // button swap on success
      .catch(err => {
        // Fullscreen was blocked (sandboxed iframe, permissions-policy, etc.).
        // Gracefully degrade: toggle the CSS-only fullscreen-mode class so the
        // game wrapper still expands to fill the viewport visually.
        console.warn('Fullscreen API unavailable, using CSS fallback:', err.message);
        const wrapper = state.gameWrapper ?? document.getElementById('gameWrapper');
        wrapper?.classList.add('fullscreen-mode');
        const btnExit  = _fsBtn();
        const btnEnter = _fsBtnEnter();
        if (btnExit)  btnExit.style.display  = 'inline-flex';
        if (btnEnter) btnEnter.style.display = 'none';
        // Wire a one-time click on the exit button to undo the CSS fallback
        btnExit?.addEventListener('click', _exitCssFallback, { once: true });
      });
  } else {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (exit) exit.call(document).then(() => updateFullscreenUI()).catch(() => updateFullscreenUI());
    else       _exitCssFallback();
  }
}

function _exitCssFallback() {
  const wrapper = state.gameWrapper ?? document.getElementById('gameWrapper');
  wrapper?.classList.remove('fullscreen-mode');
  const btnExit  = _fsBtn();
  const btnEnter = _fsBtnEnter();
  if (btnExit)  btnExit.style.display  = 'none';
  if (btnEnter) btnEnter.style.display = 'inline-flex';
}

export function updateFullscreenUI() {
  const wrapper = state.gameWrapper ?? document.getElementById('gameWrapper');
  const isFs    = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                     document.mozFullScreenElement || document.msFullscreenElement);

  wrapper?.classList.toggle('fullscreen-mode', isFs);

  // Always use getElementById so the swap works even before openGameModal runs
  const btnExit  = _fsBtn();
  const btnEnter = _fsBtnEnter();
  if (btnExit)  btnExit.style.display  = isFs ? 'inline-flex' : 'none';
  if (btnEnter) btnEnter.style.display = isFs ? 'none' : 'inline-flex';
}

['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
  .forEach(ev => document.addEventListener(ev, updateFullscreenUI));

// ─── Dropdown helpers ─────────────────────────────────────────────────────────

export function toggleDropdown(id) {
  const dd   = document.getElementById(id);
  if (!dd) return;
  const open = dd.classList.contains('open');
  document.querySelectorAll('.pp-dropdown.open').forEach(el => el.classList.remove('open'));
  if (!open) dd.classList.add('open');
}

export function colorLabelHTML(value, name) {
  return `
    <span style="display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:16px;height:16px;border-radius:50%;
                   background:${value};border:2px solid #1a1a1a;flex-shrink:0;"></span>
      <span style="color:${value};font-weight:700;">${name}</span>
    </span>`;
}

/**
 * Populates the P1/P2 colour dropdown lists.
 * BUG FIX: called both at DOMContentLoaded (settings page) AND in openGameModal.
 */
export function initColorDropdowns() {
  [
    { id: 'dd-p1-color', pi: 0 },
    { id: 'dd-p2-color', pi: 1 },
  ].forEach(({ id, pi }) => {
    const dd = document.getElementById(id);
    if (!dd) return;

    const list = dd.querySelector('.pp-dropdown-list');
    if (!list) return;
    list.innerHTML = '';

    PLAYER_COLORS.forEach(c => {
      const item = document.createElement('div');
      item.className    = 'pp-dropdown-item' + (c.value === state.players[pi].color ? ' selected' : '');
      item.dataset.value= c.value;
      item.innerHTML    = colorLabelHTML(c.value, c.name);
      list.appendChild(item);
    });

    const sel = PLAYER_COLORS.find(c => c.value === state.players[pi].color) ?? PLAYER_COLORS[pi];
    const hdr = dd.querySelector('.dd-selected');
    if (hdr) hdr.innerHTML = colorLabelHTML(sel.value, sel.name);
  });
}

// ─── Dynamic UI injection ─────────────────────────────────────────────────────

export function injectDynamicUI() {
  // ── Numpad ──────────────────────────────────────────────────────────────
  if (!document.getElementById('snakes-numpad')) {
    state.numpad = document.createElement('div');
    state.numpad.id        = 'snakes-numpad';
    state.numpad.className = 'snakes-numpad';
    state.numpad.innerHTML = `
      <div class="np-header">::: DRAG :::</div>
      <div class="np-grid">
        <button data-key="1">1</button><button data-key="2">2</button><button data-key="3">3</button>
        <button data-key="4">4</button><button data-key="5">5</button><button data-key="6">6</button>
        <button data-key="7">7</button><button data-key="8">8</button><button data-key="9">9</button>
        <button data-key="C" class="np-util">C</button>
        <button data-key="0">0</button>
        <button data-key="OK" class="np-ok">OK</button>
      </div>`;
    document.body.appendChild(state.numpad);
    _setupNumpadDrag();
  } else {
    state.numpad = document.getElementById('snakes-numpad');
  }

  // ── Standard lucky card overlay ─────────────────────────────────────────
  if (!document.getElementById('lucky-card-overlay')) {
    state.luckyCardOverlay = document.createElement('div');
    state.luckyCardOverlay.id        = 'lucky-card-overlay';
    state.luckyCardOverlay.className = 'snakes-lucky-overlay';
    state.luckyCardOverlay.innerHTML = `
      <div class="lc-box">
        <div class="lc-icon">🎟️</div>
        <h3 id="lc-title">Lucky Strike!</h3>
        <p  id="lc-desc">Move forward 2 spaces.</p>
        <div class="lc-actions">
          <button class="btn-check-frac" id="btn-use-card">USE</button>
          <button class="btn-secondary"  id="btn-discard-card">DISCARD</button>
        </div>
      </div>`;
    document.body.appendChild(state.luckyCardOverlay);
  } else {
    state.luckyCardOverlay = document.getElementById('lucky-card-overlay');
  }

  // ── Bonus wish-card overlay ─────────────────────────────────────────────
  if (!document.getElementById('bonus-card-overlay')) {
    state.bonusCardOverlay = document.createElement('div');
    state.bonusCardOverlay.id        = 'bonus-card-overlay';
    state.bonusCardOverlay.className = 'snakes-lucky-overlay';
    state.bonusCardOverlay.innerHTML = `
      <div class="lc-box lc-box--wide">
        <h3 class="bonus-title">BONUS EARNED!</h3>
        <p  class="bonus-sub">You reduced to lowest terms! Pick 1 Wish Card.</p>
        <div class="bc-cards" id="bc-cards-container"></div>
        <div class="lc-actions" id="bc-actions" style="display:none;">
          <button class="btn-check-frac" id="btn-use-bonus">USE REVEALED</button>
          <button class="btn-secondary"  id="btn-discard-bonus">DISCARD</button>
        </div>
      </div>`;
    document.body.appendChild(state.bonusCardOverlay);
  } else {
    state.bonusCardOverlay = document.getElementById('bonus-card-overlay');
  }
}

function _setupNumpadDrag() {
  const numpad = state.numpad;
  const header = numpad.querySelector('.np-header');
  const drag   = state.numpadDragState;

  header.addEventListener('pointerdown', e => {
    drag.isDragging = true;
    const r = numpad.getBoundingClientRect();
    drag.startX = e.clientX - r.left;
    drag.startY = e.clientY - r.top;
    e.preventDefault();
  });
  window.addEventListener('pointermove', e => {
    if (!drag.isDragging) return;
    numpad.style.left   = (e.clientX - drag.startX) + 'px';
    numpad.style.top    = (e.clientY - drag.startY) + 'px';
    numpad.style.right  = 'auto';
    numpad.style.bottom = 'auto';
  });
  window.addEventListener('pointerup', () => { drag.isDragging = false; });
}

// ─── Global UI event wiring (buttons + dropdowns) ────────────────────────────
// Called once at DOMContentLoaded. Receives game-flow callbacks to avoid circular deps.

export function wireUI({ openGameModal, closeGameModal, resetGame }) {
  // ── Colour dropdowns need items BEFORE the modal opens ──────────────────
  initColorDropdowns();

  // ── Math-concept dropdown — populate from plugin registry ───────────────
  const conceptDD = document.getElementById('dd-math-concept');
  if (conceptDD) {
    const list = conceptDD.querySelector('.pp-dropdown-list');
    if (list) {
      list.innerHTML = '';
      getAllPlugins().forEach(plugin => {
        const item = document.createElement('div');
        item.className    = 'pp-dropdown-item' + (plugin.id === state.mathConcept ? ' selected' : '');
        item.dataset.value= plugin.id;
        item.textContent  = plugin.label;
        list.appendChild(item);
      });
      const hdr = conceptDD.querySelector('.dd-selected');
      if (hdr) {
        const active = getAllPlugins().find(p => p.id === state.mathConcept);
        if (active) hdr.textContent = active.label;
      }
    }
  }

  // ── Close dropdowns on outside click ────────────────────────────────────
  document.addEventListener('click', e => {
    if (!e.target.closest('.pp-dropdown'))
      document.querySelectorAll('.pp-dropdown.open').forEach(el => el.classList.remove('open'));
  });

  // ── Dropdown header toggle via data-toggle-dropdown ─────────────────────
  document.addEventListener('click', e => {
    const hdr = e.target.closest('[data-toggle-dropdown]');
    if (hdr) toggleDropdown(hdr.dataset.toggleDropdown);
  });

  // ── Dropdown item selection (capture so it fires before close handler) ───
  document.addEventListener('click', e => {
    const item = e.target.closest('.pp-dropdown-item');
    if (!item) return;
    const dd  = item.closest('.pp-dropdown');
    if (!dd)  return;

    const val  = item.dataset.value;
    const span = dd.querySelector('.dd-selected');
    dd.querySelectorAll('.pp-dropdown-item').forEach(el => el.classList.remove('selected'));
    item.classList.add('selected');

    switch (dd.id) {
      case 'dd-opponent':   state.vsCPU    = val === 'cpu'; span.textContent = item.textContent.trim(); break;
      case 'dd-cpu-intel':  state.cpuIntel = val;           span.textContent = item.textContent.trim(); break;
      case 'dd-movement':   state.autoMove = val === 'auto';span.textContent = item.textContent.trim(); break;
      case 'dd-difficulty':                                  span.textContent = item.textContent.trim(); break;
      case 'dd-math-concept':
        state.mathConcept = val;
        setActivePlugin(val);
        span.textContent = item.textContent.trim();
        break;
      case 'dd-p1-color':
      case 'dd-p2-color': {
        const c = PLAYER_COLORS.find(c => c.value === val);
        if (c) {
          span.innerHTML = colorLabelHTML(c.value, c.name);
          if (dd.id === 'dd-p1-color') state.players[0].color = val;
          if (dd.id === 'dd-p2-color') state.players[1].color = val;
          if (state.gameActive) { drawBoard(); updateHUD(); }
        }
        break;
      }
      default: span.textContent = item.textContent.trim();
    }
    dd.classList.remove('open');
  }, true);

  // ── Static buttons ───────────────────────────────────────────────────────
  document.getElementById('btn-start-game')       ?.addEventListener('click', openGameModal);
  document.getElementById('btn-close-modal')      ?.addEventListener('click', closeGameModal);
  document.getElementById('reset-game-btn')       ?.addEventListener('click', resetGame);
  document.getElementById('btn-play-again')       ?.addEventListener('click', resetGame);
  document.getElementById('btn-speaker')          ?.addEventListener('click', toggleSpeaker);
  // Fullscreen buttons: use getElementById in handler (stale-var safe)
  document.getElementById('fullscreen-btn')       ?.addEventListener('click', toggleFullscreen);
  document.getElementById('fullscreen-btn-enter') ?.addEventListener('click', toggleFullscreen);
}
