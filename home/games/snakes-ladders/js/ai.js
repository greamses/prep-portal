// ai.js — CPU intelligence + player profiling + dice prediction.
//
// Five existing levels: basic, standard, advanced, expert, grandmaster
// New level: legendary — adaptive (learns from player) + probability-based dice prediction

import { state } from './state.js';

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER PROFILING
// ─────────────────────────────────────────────────────────────────────────────

const _profiles = [
  { rolls: [], fracResults: [], cardChoices: [], landings: [] },
  { rolls: [], fracResults: [], cardChoices: [], landings: [] },
];

const MAX_ROLL    = 30;
const MAX_FRAC    = 20;
const MAX_CARD    = 15;
const MAX_LANDING = 20;

function _push(arr, val, max) { arr.push(val); if (arr.length > max) arr.shift(); }

export function recordRoll(pi, value)              { _push(_profiles[pi].rolls,       value,           MAX_ROLL);    }
export function recordFracResult(pi, attempts, ok) { _push(_profiles[pi].fracResults, { attempts, ok },MAX_FRAC);    }
export function recordCardChoice(pi, used)         { _push(_profiles[pi].cardChoices, used,            MAX_CARD);    }
export function recordLanding(pi, sq)              { _push(_profiles[pi].landings,    sq,              MAX_LANDING); }
export function resetProfiles() { _profiles.forEach(p => { p.rolls=[]; p.fracResults=[]; p.cardChoices=[]; p.landings=[]; }); }

// ─────────────────────────────────────────────────────────────────────────────
// DICE PREDICTION — Bayesian Dirichlet estimator
// weights[i] = (count[i] + α) / (N + 6α),  α=2 (prior strength)
// ─────────────────────────────────────────────────────────────────────────────

const ALPHA = 2;

export function getRollWeights(pi) {
  const hist   = _profiles[pi].rolls;
  const counts = [0,0,0,0,0,0];
  hist.forEach(r => counts[r-1]++);
  const N = hist.length;
  return counts.map(c => (c + ALPHA) / (N + 6 * ALPHA));
}

export function getExpectedAdvance(pi) {
  const weights = getRollWeights(pi);
  const pos     = state.players[pi].pos;
  let expected  = 0;
  for (let r = 1; r <= 6; r++) {
    if (pos + r > 64) continue;
    const finalPos = simulateChain(pos, r);
    expected += weights[r-1] * (finalPos - pos);
  }
  return expected;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE FACTORS
// ─────────────────────────────────────────────────────────────────────────────

function _threatFactor(oppi) {
  const rec = _profiles[oppi].fracResults;
  if (rec.length < 3) return 1.0;
  const accuracy    = rec.filter(r => r.ok).length / rec.length;
  const avgAttempts = rec.reduce((s,r) => s + r.attempts, 0) / rec.length;
  return Math.min(2.0, Math.max(0.4, 0.5 + accuracy * 1.5 - (avgAttempts - 1) * 0.15));
}

function _cardUseRate(pi) {
  const choices = _profiles[pi].cardChoices;
  if (choices.length === 0) return 0.5;
  return choices.filter(Boolean).length / choices.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAIN SIMULATOR
// ─────────────────────────────────────────────────────────────────────────────

export function simulateChain(startPos, delta) {
  const { SNAKES, LADDERS } = state;
  let pos   = Math.min(64, Math.max(1, startPos + delta));
  let depth = 0;
  while ((SNAKES[pos] !== undefined || LADDERS[pos] !== undefined) && depth < 6) {
    pos = SNAKES[pos] ?? LADDERS[pos];
    depth++;
  }
  return pos;
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateCardTactics(card, pi, level) {
  if (level === 'basic') return true;

  const { SNAKES, LADDERS, players } = state;
  const oppi   = 1 - pi;
  const myPos  = players[pi].pos;
  const oppPos = players[oppi].pos;

  if (level === 'standard') {
    if (card.type === 'self') {
      const target = Math.min(64, Math.max(1, myPos + card.amount));
      if (SNAKES[target]) return false;
    }
    return true;
  }

  if (level === 'advanced') {
    let score = 0;
    if (card.type === 'self') {
      const t = Math.min(64, Math.max(1, myPos + card.amount));
      score += card.amount * 2;
      if (SNAKES[t])  score -= (t - SNAKES[t])  * 2;
      if (LADDERS[t]) score += (LADDERS[t] - t) * 2;
    } else {
      const t = Math.min(64, Math.max(1, oppPos + card.amount));
      score += Math.abs(card.amount) * 2;
      if (LADDERS[t]) score -= (LADDERS[t] - t) * 3;
      if (SNAKES[t])  score += (t - SNAKES[t])  * 2;
    }
    return score >= 0;
  }

  if (level === 'expert') {
    let score = 0;
    if (card.type === 'self') {
      const t     = Math.min(64, Math.max(1, myPos + card.amount));
      const final = SNAKES[t] ?? (LADDERS[t] ?? t);
      score += (final - myPos);
      if (final >= 58) score += 12;
      if (final === 64) score += 40;
      if (oppPos >= 58) score -= 6;
    } else {
      const t     = Math.min(64, Math.max(1, oppPos + card.amount));
      const final = SNAKES[t] ?? (LADDERS[t] ?? t);
      score += (oppPos - final);
      if (oppPos >= 55) score += 14;
      if (LADDERS[t])   score -= (LADDERS[t] - t) * 4;
    }
    return score >= 0;
  }

  if (level === 'grandmaster') {
    let score = 0;
    if (card.type === 'self') {
      const final = simulateChain(myPos, card.amount);
      score += (final - myPos) * 3;
      if (final >= 60) score += 25;
      if (final === 64) score += 80;
      if (oppPos >= 58 && card.amount < 4) score -= 10;
    } else {
      const final = simulateChain(oppPos, card.amount);
      score += (oppPos - final) * 3;
      if (oppPos >= 55) score += 20;
      if (final >= myPos) score -= 8;
      if (final === 1)    score += 30;
    }
    return score >= 0;
  }

  // ── Legendary: adaptive + dice-prediction ──────────────────────────────────
  if (level === 'legendary') {
    const threat         = _threatFactor(oppi);
    const oppAdvance     = getExpectedAdvance(oppi);
    const oppCardUseRate = _cardUseRate(oppi);

    let score = 0;

    if (card.type === 'self') {
      const final = simulateChain(myPos, card.amount);
      score += (final - myPos) * 4;
      if (final >= 60) score += 30;
      if (final === 64) score += 100;
      if (oppAdvance > 5) score += 14;
      if (myPos - oppPos > 22) score -= 8;
    } else {
      const final  = simulateChain(oppPos, card.amount);
      const target = Math.min(64, Math.max(1, oppPos + card.amount));

      score += (oppPos - final) * 3 * threat;
      if (oppAdvance > 6) score += 16;
      if (oppPos >= 50)   score += 20 * threat;
      if (myPos - oppPos > 28) score -= 20;
      if (LADDERS[target]) score -= (LADDERS[target] - target) * 5 * threat;
      if (oppCardUseRate > 0.7) score += 8;
    }

    // Annotate decision reason for game-log display in cards.js
    const why = card.type === 'self'
      ? `${score >= 0 ? 'advancing' : 'skipping'} (opp predicted +${oppAdvance.toFixed(1)} sq)`
      : `${score >= 0 ? 'blocking' : 'skipping'} (threat×${threat.toFixed(2)}, opp predicted +${oppAdvance.toFixed(1)} sq)`;
    state._legendaryReason = why;

    return score >= 0;
  }

  return true;
}
