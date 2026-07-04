/* ═══════════════════════════════════════════════════════
   RECALL PRESS — THE PRINTING FLOW
   Calls the AI, then "prints" each card into the tray one
   at a time before handing them off to deck-store.
═══════════════════════════════════════════════════════ */
import { $, state, safe } from './config.js';
import { printCards } from './api.js';
import { appendCards } from './deck-store.js';

const runBtn = $('run-press-btn');
const statusEl = $('press-status');
const tray = $('press-tray');

function stampCard(card, i) {
  const el = document.createElement('div');
  el.className = 'tray-card';
  el.style.setProperty('--i', i);
  el.innerHTML = `<span class="tray-card-front">${safe(card.front)}</span>`;
  tray.appendChild(el);
  // Force reflow so the animation class re-triggers per card.
  requestAnimationFrame(() => el.classList.add('printed'));
}

export function initPress({ onPrinted } = {}) {
  document.addEventListener('recall-press:run', async () => {
    if (!state.cls || !state.subject || !state.topic) return;

    runBtn.disabled = true;
    statusEl.textContent = 'Warming up…';
    tray.innerHTML = '';
    tray.classList.add('running');

    try {
      const cards = await printCards({
        classLabel: state.clsLabel,
        subject: state.subject,
        topic: state.topic,
        count: state.count,
      });

      if (!cards.length) throw new Error('Empty deck — try another topic.');

      statusEl.textContent = 'Printing…';
      for (let i = 0; i < cards.length; i++) {
        stampCard(cards[i], i);
        await new Promise((r) => setTimeout(r, 140));
      }

      const deck = await appendCards({
        classLabel: state.clsLabel,
        subject: state.subject,
        topic: state.topic,
        cards,
      });

      statusEl.textContent = `${cards.length} card${cards.length > 1 ? 's' : ''} printed. Opening the editor…`;
      onPrinted?.(deck);
    } catch (err) {
      console.error('[Recall Press] print failed:', err);
      statusEl.textContent = err.message || 'Press jammed — try again.';
    } finally {
      runBtn.disabled = false;
      setTimeout(() => {
        tray.classList.remove('running');
        tray.innerHTML = '';
      }, 2200);
    }
  });
}
