// fracPopup.js — Fraction question popup + custom numpad input.
// Callbacks: endTurn, triggerWin, showStandardCard, showBonusFlipCards, addLog
// are injected by game.js to avoid circular imports.

import { state } from './state.js';

// ─── Fraction maths helpers ───────────────────────────────────────────────────

export function getGcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}

/**
 * Converts a raw FRAC[] entry into a structured question descriptor.
 *   d:'M'  mixed number   → ask user: convert to improper fraction
 *   d:'I'  improper frac  → ask user: convert to mixed number
 */
export function fracConvLabel(f) {
  if (f.d === 'M') {
    const top = f.w * f.dn + f.n;
    return { type: 'mixed', whole: f.w, num: f.n, den: f.dn, improper: { num: top, den: f.dn } };
  }
  const w = Math.floor(f.n / f.dn);
  const r = f.n % f.dn;
  if (r === 0) return { type: 'whole', whole: w, num: f.n, den: f.dn };
  return { type: 'improper', whole: w, num: r, den: f.dn, improper: { num: f.n, den: f.dn } };
}

// ─── Callback slots ───────────────────────────────────────────────────────────

let _endTurn          = () => {};
let _triggerWin       = () => {};
let _showStandardCard = () => {};
let _showBonusCards   = () => {};
let _addLog           = () => {};

export function registerFracCallbacks({ endTurn, triggerWin, showStandardCard, showBonusFlipCards, addLog }) {
  _endTurn          = endTurn;
  _triggerWin       = triggerWin;
  _showStandardCard = showStandardCard;
  _showBonusCards   = showBonusFlipCards;
  _addLog           = addLog;
}

// ─── Show question ────────────────────────────────────────────────────────────

export function showFracQuestion(f, pi) {
  const s = state;
  s.gameState           = 4; // STATE.WAITING_FRAC_ANSWER
  s.isProcessingAnswer  = false;
  s.currentFracPlayer   = pi;
  s.currentFracAttempts = 0;
  s.currentFracData     = fracConvLabel(f);

  const data = s.currentFracData;
  let html   = '';

  if (data.type === 'mixed') {
    html = `
      <div class="frac-q-row">
        <span class="frac-lg">${data.whole}</span>
        <div class="frac-col">
          <span class="frac-md">${data.num}</span>
          <div class="frac-line"></div>
          <span class="frac-md">${data.den}</span>
        </div>
        <span class="frac-eq">=</span>
        <div class="frac-col">
          <div class="frac-input" id="ans-num" tabindex="0"></div>
          <div class="frac-line"></div>
          <div class="frac-input" id="ans-den" tabindex="0"></div>
        </div>
      </div>
      <button class="btn-check-frac">Check</button>`;
  } else if (data.type === 'improper') {
    html = `
      <div class="frac-q-row">
        <div class="frac-col">
          <span class="frac-lg">${data.improper.num}</span>
          <div class="frac-line"></div>
          <span class="frac-lg">${data.improper.den}</span>
        </div>
        <span class="frac-eq">=</span>
        <div class="frac-q-row">
          <div class="frac-input ans-whole" id="ans-w" tabindex="0"></div>
          <div class="frac-col">
            <div class="frac-input" id="ans-num" tabindex="0"></div>
            <div class="frac-line"></div>
            <div class="frac-input" id="ans-den" tabindex="0"></div>
          </div>
        </div>
      </div>
      <button class="btn-check-frac">Check</button>`;
  } else {
    html = `
      <div class="frac-q-row">
        <div class="frac-col">
          <span class="frac-lg">${data.num}</span>
          <div class="frac-line"></div>
          <span class="frac-lg">${data.den}</span>
        </div>
        <span class="frac-eq">=</span>
        <div class="frac-input ans-whole" id="ans-w" tabindex="0"></div>
      </div>
      <button class="btn-check-frac">Check</button>`;
  }

  s.popupEq.innerHTML = html;
  s.fracPopup.classList.add('show');
  s.numpad.classList.add('show');

  document.querySelectorAll('.frac-input').forEach(el => el.classList.remove('active-focus'));
  const first = s.popupEq.querySelector('.frac-input');
  if (first) { first.classList.add('active-focus'); s.activeInput = first; }

  if (s.vsCPU && pi === 1) setTimeout(() => _simulateCPUAnswer(data), 1500);
}

// ─── CPU auto-answer ──────────────────────────────────────────────────────────

function _simulateCPUAnswer(data) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  if (data.type === 'mixed') {
    const g = getGcd(data.improper.num, data.improper.den);
    set('ans-num', data.improper.num / g);
    set('ans-den', data.improper.den / g);
  } else if (data.type === 'improper') {
    const g = getGcd(data.num, data.den);
    set('ans-w',   data.whole);
    set('ans-num', data.num / g);
    set('ans-den', data.den / g);
  } else {
    set('ans-w', data.whole);
  }
  setTimeout(submitFractionAnswer, 800);
}

// ─── Submit answer ────────────────────────────────────────────────────────────

export function submitFractionAnswer() {
  const s = state;
  if (s.isProcessingAnswer) return;
  s.isProcessingAnswer = true;

  const data   = s.currentFracData;
  const getVal = id => {
    const el = document.getElementById(id);
    return (el && el.textContent.trim() !== '') ? parseInt(el.textContent.trim(), 10) : 0;
  };

  let isCorrect = false, reducible = false, lowestTerms = false;

  if (data.type === 'mixed') {
    const { num: tN, den: tD } = data.improper;
    reducible = getGcd(tN, tD) > 1;
    const uN = getVal('ans-num'), uD = getVal('ans-den');
    if (uD !== 0 && uN * tD === tN * uD) {
      isCorrect  = true;
      lowestTerms= getGcd(uN, uD) === 1;
    }
  } else if (data.type === 'improper') {
    const { num: tN, den: tD } = data.improper;
    reducible = getGcd(tN, tD) > 1;
    const uW = getVal('ans-w'), uN = getVal('ans-num'), uD = getVal('ans-den');
    if (uD !== 0 && uN < uD && (uW * uD + uN) * tD === tN * uD) {
      isCorrect  = true;
      lowestTerms= uN === 0 || getGcd(uN, uD) === 1;
    }
  } else {
    isCorrect = getVal('ans-w') === data.whole;
  }

  if (isCorrect) {
    if (s.currentFracAttempts === 0) {
      if (reducible && lowestTerms) {
        _showBonusCards(s.currentFracPlayer);
      } else if (reducible && !lowestTerms) {
        _addLog(`${s.players[s.currentFracPlayer].name} didn't reduce to lowest terms — no bonus!`, 'info');
        if (s.gameFeedback) s.gameFeedback.textContent = 'Correct! But not lowest terms — no bonus.';
        _showStandardCard(s.currentFracPlayer);
      } else {
        _showStandardCard(s.currentFracPlayer);
      }
    } else {
      s.fracPopup.classList.remove('show');
      s.numpad.classList.remove('show');
      _endTurn();
    }
  } else {
    s.currentFracAttempts++;
    if (s.currentFracAttempts >= 5) {
      s.fracPopup.classList.remove('show');
      s.numpad.classList.remove('show');
      _addLog(`${s.players[s.currentFracPlayer].name} failed 5 attempts — disqualified!`, 'error');
      if (s.gameFeedback) s.gameFeedback.textContent = `${s.players[s.currentFracPlayer].name} disqualified!`;
      _triggerWin(1 - s.currentFracPlayer, 'Opponent failed 5 fraction questions!');
      return;
    }
    s.popupEq.classList.add('error-shake');
    setTimeout(() => { s.popupEq.classList.remove('error-shake'); s.isProcessingAnswer = false; }, 400);
    _addLog(`Incorrect! Attempt ${s.currentFracAttempts}/5.`, 'error');
    if (s.gameFeedback) s.gameFeedback.textContent = `Incorrect! Attempt ${s.currentFracAttempts}/5. Try again.`;
  }
}

// ─── Numpad input handler ─────────────────────────────────────────────────────

export function onNumpadClick(key) {
  const { activeInput } = state;
  if (!activeInput) return;
  if      (key === 'C')  activeInput.textContent = '';
  else if (key === 'OK') submitFractionAnswer();
  else if (activeInput.textContent.length < 3) activeInput.textContent += key;
}
