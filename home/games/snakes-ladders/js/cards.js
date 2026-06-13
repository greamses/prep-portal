// cards.js — Card data + standard/bonus overlay logic.
// Depends on: state, ai, renderer (animateCPUToken).
// Game-flow functions (endTurn, triggerWin, addLog) are injected via registerCardCallbacks().

import { state }                                    from './state.js';
import { evaluateCardTactics, recordCardChoice }    from './ai.js';
import { animateCPUToken }                          from './renderer.js';
import { showReaction }                             from './reactions.js';

// ─── Card definitions ──────────────────────────────────────────────────────────

export const STANDARD_CARDS = [
  { title: 'Lucky Strike', desc: 'Move forward 2 spaces.', type: 'self',     amount:  2 },
  { title: 'Minor Boost',  desc: 'Move forward 3 spaces.', type: 'self',     amount:  3 },
  { title: 'Sabotage',     desc: 'Opponent moves back 2.', type: 'opponent', amount: -2 },
  { title: 'Tripwire',     desc: 'Opponent moves back 3.', type: 'opponent', amount: -3 },
];

export const BONUS_HUGE_WINS = [
  { title: 'MEGA BOOST!', desc: 'Move forward 8 spaces.', type: 'self', amount: 8 },
  { title: 'SUPER LEAP!', desc: 'Move forward 6 spaces.', type: 'self', amount: 6 },
];

export const BONUS_SMALL_WINS = [
  { title: 'Tiny Step',  desc: 'Move forward 1 space.',  type: 'self',     amount:  1 },
  { title: 'Small Jump', desc: 'Move forward 2 spaces.', type: 'self',     amount:  2 },
  { title: 'Minor Snag', desc: 'Opponent moves back 1.', type: 'opponent', amount: -1 },
];

// ─── Callback slots (filled by game.js) ──────────────────────────────────────

let _endTurn  = () => {};
let _triggerWin = () => {};
let _addLog     = () => {};

export function registerCardCallbacks({ endTurn, triggerWin, addLog }) {
  _endTurn    = endTurn;
  _triggerWin = triggerWin;
  _addLog     = addLog;
}

// ─── Card move ────────────────────────────────────────────────────────────────

export function applyCardMove(targetPi, amount) {
  const { players, SNAKES, LADDERS } = state;
  const newPos = Math.min(64, Math.max(1, players[targetPi].pos + amount));
  _addLog(`Card! ${players[targetPi].name} moves ${amount > 0 ? 'forward' : 'back'} ${Math.abs(amount)}.`, 'action');

  animateCPUToken(targetPi, players[targetPi].pos, newPos, () => {
    players[targetPi].pos = newPos;

    if (newPos in SNAKES) {
      const tail = SNAKES[newPos];
      _addLog(`Card put ${players[targetPi].name} on a snake!`, 'snake');
      setTimeout(() => animateCPUToken(targetPi, newPos, tail, () => {
        players[targetPi].pos = tail; _finalizeCardMove(targetPi, tail);
      }), 600);
    } else if (newPos in LADDERS) {
      const top = LADDERS[newPos];
      _addLog(`Card put ${players[targetPi].name} on a ladder!`, 'ladder');
      setTimeout(() => animateCPUToken(targetPi, newPos, top, () => {
        players[targetPi].pos = top; _finalizeCardMove(targetPi, top);
      }), 600);
    } else {
      _finalizeCardMove(targetPi, newPos);
    }
  });
}

function _finalizeCardMove(pi, sq) {
  if (sq === 64) _triggerWin(pi);
  else           _endTurn();
}

function _execCard(pi, card) {
  const tPi = card.type === 'opponent' ? 1 - pi : pi;
  applyCardMove(tPi, card.amount);
}

// ─── Standard lucky card ──────────────────────────────────────────────────────

export function showStandardCard(pi) {
  const { fracPopup, numpad, luckyCardOverlay, vsCPU, cpuIntel, players } = state;
  fracPopup?.classList.remove('show');
  numpad?.classList.remove('show');

  const card = STANDARD_CARDS[Math.floor(Math.random() * STANDARD_CARDS.length)];
  document.getElementById('lc-title').textContent = card.title;
  document.getElementById('lc-desc').textContent  = card.desc;
  luckyCardOverlay.classList.add('show');

  const btnUse    = document.getElementById('btn-use-card');
  const btnDiscard= document.getElementById('btn-discard-card');
  const newUse    = btnUse.cloneNode(true);
  const newDiscard= btnDiscard.cloneNode(true);
  btnUse.replaceWith(newUse);
  btnDiscard.replaceWith(newDiscard);

  let done = false;
  const use = () => {
    if (done) return; done = true;
    recordCardChoice(pi, true);
    luckyCardOverlay.classList.remove('show');
    _execCard(pi, card);
  };
  const discard = () => {
    if (done) return; done = true;
    recordCardChoice(pi, false);
    luckyCardOverlay.classList.remove('show');
    _addLog(`${players[pi].name} discarded the card.`, 'info');
    _endTurn();
  };

  newUse.addEventListener('click', use);
  newDiscard.addEventListener('click', discard);

  if (vsCPU && pi === 1) {
    newUse.style.display = newDiscard.style.display = 'none';
    setTimeout(() => {
      state._legendaryReason = '';
      const willUse = evaluateCardTactics(card, pi, cpuIntel);
      const reason  = state._legendaryReason;

      // Show adaptive emoji reaction for Legendary level decisions
      if (cpuIntel === 'legendary' && reason) {
        const reactionType = reason.includes('blocking') ? 'cpu_block' : 'cpu_advance';
        showReaction(reactionType, pi);
      }

      if (willUse) {
        const logReason = reason ? ` [${reason}]` : '';
        _addLog(`CPU used the card${logReason}.`, 'action'); use();
      } else {
        const logReason = reason ? ` [${reason}]` : '';
        _addLog(`CPU discarded the card${logReason}.`, 'info'); discard();
      }
    }, 2500);
  } else {
    newUse.style.display = newDiscard.style.display = '';
  }
}

// ─── Bonus flip cards ─────────────────────────────────────────────────────────

export function showBonusFlipCards(pi) {
  const { fracPopup, numpad, bonusCardOverlay, vsCPU, cpuIntel, players } = state;
  fracPopup?.classList.remove('show');
  numpad?.classList.remove('show');

  const pool = [
    BONUS_HUGE_WINS [Math.floor(Math.random() * BONUS_HUGE_WINS.length)],
    BONUS_SMALL_WINS[Math.floor(Math.random() * BONUS_SMALL_WINS.length)],
    BONUS_SMALL_WINS[Math.floor(Math.random() * BONUS_SMALL_WINS.length)],
  ];
  for (let i = 2; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }

  const container = document.getElementById('bc-cards-container');
  container.innerHTML = '';
  let picked = false;

  pool.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'bc-card';
    el.innerHTML = `
      <div class="bc-card-inner">
        <div class="bc-face bc-front">✨</div>
        <div class="bc-face bc-back">
          <strong class="bc-card-title">${card.title}</strong>
          <span class="bc-card-desc">${card.desc}</span>
        </div>
      </div>`;
    el.addEventListener('click', () => {
      if (picked || (vsCPU && pi === 1)) return;
      picked = true;
      el.classList.add('flipped');
      _showBonusActions(pi, container, pool, idx, card);
    });
    container.appendChild(el);
  });

  document.getElementById('bc-actions').style.display = 'none';
  bonusCardOverlay.classList.add('show');
  _addLog(`${players[pi].name} earned Bonus Wish Cards! Pick one.`, 'info');

  if (vsCPU && pi === 1) {
    setTimeout(() => {
      const idx = Math.floor(Math.random() * 3);
      picked = true;
      container.children[idx].classList.add('flipped');
      setTimeout(() => {
        Array.from(container.children).forEach((el, i) => { if (i !== idx) el.classList.add('flipped'); });
        const chosen = pool[idx];
        const useIt  = evaluateCardTactics(chosen, pi, cpuIntel);
        setTimeout(() => {
          bonusCardOverlay.classList.remove('show');
          if (useIt) { _addLog('CPU used the bonus card!', 'action'); _execCard(pi, chosen); }
          else       { _addLog('CPU discarded the bonus.', 'info');   _endTurn(); }
        }, 2500);
      }, 1500);
    }, 1200);
  }
}

function _showBonusActions(pi, container, pool, chosenIdx, card) {
  const wrap     = document.getElementById('bc-actions');
  const btnUse   = document.getElementById('btn-use-bonus');
  const btnDisc  = document.getElementById('btn-discard-bonus');
  const newUse   = btnUse.cloneNode(true);
  const newDisc  = btnDisc.cloneNode(true);
  btnUse.replaceWith(newUse);
  btnDisc.replaceWith(newDisc);
  wrap.style.display = 'flex';

  let resolved = false;
  const resolve = (used) => {
    if (resolved) return; resolved = true;
    wrap.style.display = 'none';
    Array.from(container.children).forEach((el, i) => { if (i !== chosenIdx) el.classList.add('flipped'); });
    setTimeout(() => {
      state.bonusCardOverlay.classList.remove('show');
      if (used) _execCard(pi, card);
      else { _addLog(`${state.players[pi].name} discarded the bonus.`, 'info'); _endTurn(); }
    }, 2500);
  };

  newUse.addEventListener('click',  () => resolve(true));
  newDisc.addEventListener('click', () => resolve(false));
}
