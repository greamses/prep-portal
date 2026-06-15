import { phToColor } from '../simulation/pH.js';

const elPH       = document.getElementById('r-ph');
const elTemp     = document.getElementById('r-temp');
const elReaction = document.getElementById('r-reaction');
const elColor    = document.getElementById('r-color');

/** Call with a reaction result object (or null to reset) */
export function updateReadout(result) {
  if (!result) {
    elPH.textContent       = '—';
    elTemp.textContent     = '—';
    elReaction.textContent = '—';
    elColor.style.background = '#fff';
    return;
  }

  elPH.textContent       = result.pH.toFixed(1);
  elTemp.textContent     = `${result.temperature} °C`;
  elReaction.textContent = result.reaction ?? 'Unknown';
  elColor.style.background = phToColor(result.pH);
}
