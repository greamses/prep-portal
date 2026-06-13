// questionEngine.js — Plugin-driven question popup + numpad controller.
// Drop-in replacement for fracPopup.js.
// game.js imports from here; fracPopup.js is left as dead code.

import { state }           from './state.js';
import { getActivePlugin } from './mathPlugins.js';
import { recordFracResult } from './ai.js';
import { showReaction }    from './reactions.js';

// ─── Callback slots (filled by game.js) ──────────────────────────────────────

let _endTurn          = () => {};
let _triggerWin       = () => {};
let _showStandardCard = () => {};
let _showBonusCards   = () => {};
let _addLog           = () => {};

export function registerQuestionCallbacks({ endTurn, triggerWin, showStandardCard, showBonusFlipCards, addLog }) {
  _endTurn          = endTurn;
  _triggerWin       = triggerWin;
  _showStandardCard = showStandardCard;
  _showBonusCards   = showBonusFlipCards;
  _addLog           = addLog;
}

// ─── Show question ────────────────────────────────────────────────────────────

export function showQuestion(raw, pi) {
  const s     = state;
  const plugin = getActivePlugin();

  s.gameState           = 4; // STATE.WAITING_FRAC_ANSWER
  s.isProcessingAnswer  = false;
  s.currentFracPlayer   = pi;
  s.currentFracAttempts = 0;
  s.currentFracData     = raw;          // raw question stored for checkAnswer

  // Update popup label to reflect active concept
  const labelEl = s.fracPopup.querySelector('.snakes-frac-popup-label');
  if (labelEl) labelEl.textContent = plugin.popupLabel;

  s.popupEq.innerHTML = plugin.renderHTML(raw) + `<button class="btn-check-frac">Check</button>`;
  s.fracPopup.classList.add('show');
  s.numpad.classList.add('show');

  // Auto-focus first input
  document.querySelectorAll('.frac-input').forEach(el => el.classList.remove('active-focus'));
  const first = s.popupEq.querySelector('.frac-input');
  if (first) { first.classList.add('active-focus'); s.activeInput = first; }

  if (s.vsCPU && pi === 1) {
    setTimeout(() => {
      plugin.cpuFill(raw);
      setTimeout(submitAnswer, 600);
    }, 1500);
  }
}

// ─── Submit answer ────────────────────────────────────────────────────────────

export function submitAnswer() {
  const s = state;
  if (s.isProcessingAnswer) return;
  s.isProcessingAnswer = true;

  const plugin = getActivePlugin();
  const { isCorrect, bonusEligible = false, penaltyMessage = null }
    = plugin.checkAnswer(s.currentFracData);

  if (isCorrect) {
    // Record the result for AI adaptive profiling
    recordFracResult(s.currentFracPlayer, s.currentFracAttempts + 1, true);

    if (s.currentFracAttempts === 0) {
      if (bonusEligible) {
        showReaction('correct_bonus', s.currentFracPlayer);
        _showBonusCards(s.currentFracPlayer);
      } else {
        showReaction('correct', s.currentFracPlayer);
        if (penaltyMessage) {
          _addLog(penaltyMessage, 'info');
          if (s.gameFeedback) s.gameFeedback.textContent = penaltyMessage;
        }
        _showStandardCard(s.currentFracPlayer);
      }
    } else {
      showReaction('correct', s.currentFracPlayer);
      s.fracPopup.classList.remove('show');
      s.numpad.classList.remove('show');
      _endTurn();
    }
  } else {
    showReaction('wrong', s.currentFracPlayer);
    s.currentFracAttempts++;

    if (s.currentFracAttempts >= 5) {
      recordFracResult(s.currentFracPlayer, 5, false);
      showReaction('disqualified', s.currentFracPlayer);
      s.fracPopup.classList.remove('show');
      s.numpad.classList.remove('show');
      _addLog(`${s.players[s.currentFracPlayer].name} failed 5 attempts — disqualified!`, 'error');
      if (s.gameFeedback) s.gameFeedback.textContent = `${s.players[s.currentFracPlayer].name} disqualified!`;
      _triggerWin(1 - s.currentFracPlayer, 'Opponent failed 5 questions!');
      return;
    }

    s.popupEq.classList.add('error-shake');
    setTimeout(() => {
      s.popupEq.classList.remove('error-shake');
      s.isProcessingAnswer = false;
    }, 400);
    _addLog(`Incorrect! Attempt ${s.currentFracAttempts}/5.`, 'error');
    if (s.gameFeedback) s.gameFeedback.textContent = `Incorrect! Attempt ${s.currentFracAttempts}/5. Try again.`;
  }
}

// ─── Numpad key handler ───────────────────────────────────────────────────────

export function onNumpadClick(key) {
  const { activeInput } = state;
  if (!activeInput) return;
  if      (key === 'C')  activeInput.textContent = '';
  else if (key === 'OK') submitAnswer();
  else if (activeInput.textContent.length < 3) activeInput.textContent += key;
}

// ─── Re-export for drop-in compatibility with any lingering fracPopup refs ────
// (nothing currently imports these under the old name, but kept as safety net)
export { showQuestion as showFracQuestion };
export { submitAnswer as submitFractionAnswer };
