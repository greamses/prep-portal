/* ═══════════════════════════════════════════════════════
   SHARED LEADERBOARD VIEW  —  utils/games/leaderboard-view.js

   The end-of-round leaderboard RENDER, shared by every exam-archive game. Each
   game used to carry its own byte-for-byte copy of the row-building loop (avatar,
   rank, tie/winner logic, deal-in animation) plus the confetti burst and the
   trophy SVG in its own main.js. Now they all call `renderLeaderboard`.

   This is the VIEW only. The scoring/ranking transport is `leaderboard.js`
   (`createLeaderboard`); the styling is `.pp-lb-*` in game-overlays.css. A game
   supplies just what differs: the per-row detail line (`meta`), the "still
   playing" wording (`pendingLabel`), and the detail element's class (`metaClass`).
═══════════════════════════════════════════════════════ */
import { avatarUrl } from '/utils/components/avatar-picker.js';

export const TROPHY_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z" fill="var(--ink)"/>
  <path d="M7 5H4a3 3 0 0 0 3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M17 5h3a3 3 0 0 1-3 3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>
  <rect x="10.5" y="12" width="3" height="4" fill="var(--ink)"/>
  <rect x="8" y="16.4" width="8" height="2.4" rx="1" fill="var(--ink)"/>
</svg>`;

// A short vanilla confetti burst — no library, just falling/rotating divs —
// fired once when the signed-in player takes first place.
export function launchConfetti() {
  const colors = ['#f4c95d', '#6fb7e8', '#7cc47c', '#f07a7a', '#e8c8ff', '#ffd7a3'];
  const container = document.createElement('div');
  container.className = 'pp-confetti';
  document.body.appendChild(container);
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('span');
    piece.className = 'pp-confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.animationDuration = `${2.2 + Math.random() * 1.2}s`;
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 160}px`);
    piece.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`);
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 3800);
}

/**
 * Render `ranked` rows into `listEl` (the results <ol>). Handles the whole shared
 * behaviour: competition ranking with ties, the crowned winner (no crown on a
 * top-tie), the staggered deal-in (skipped on a repaint of an already-open
 * board), and the winner's confetti.
 *
 * @param {HTMLElement} listEl               the results list container
 * @param {Array}       ranked               rows { name, score, isSelf, pending, avatarSeed, ... }
 * @param {object}      [o]
 * @param {boolean}     [o.settled=true]     final board (vs a live in-progress paint)
 * @param {boolean}     [o.repaint=false]    the board was already open (no re-deal, no re-confetti stagger)
 * @param {function}    [o.meta]             (row, ctx) -> detail string for a FINISHED row, or null
 * @param {function}    [o.pendingLabel]     (settled) -> detail string for a PENDING row
 * @param {string}      [o.metaClass]        class for the detail <small> (default 'pp-lb-meta')
 * @returns {{ sorted: Array, topTie: boolean }}
 */
export function renderLeaderboard(listEl, ranked, o = {}) {
  const {
    settled = true,
    repaint = false,
    meta = null,
    pendingLabel = (s) => (s ? 'no score' : 'still playing…'),
    metaClass = 'pp-lb-meta',
  } = o;

  listEl.innerHTML = '';
  const total = ranked.length;
  // Players who haven't submitted are ranked on nothing — excluded until a score
  // exists. A score shared with anyone shows a tie marker; a tie for the top has
  // NO winner (nobody crowned, no confetti on a draw).
  const done = ranked.filter((r) => !r.pending);
  const topScore = done.length ? Math.max(...done.map((r) => r.score)) : 0;
  const topTie = done.filter((r) => r.score === topScore).length > 1;
  const sorted = ranked.slice().sort((a, b) => ((a.pending ? 1 : 0) - (b.pending ? 1 : 0)) || (b.score - a.score));

  sorted.forEach((row, i) => {
    const rankNum = 1 + done.filter((r) => r.score > row.score).length;
    const tiedHere = done.filter((r) => r.score === row.score).length > 1;
    const isWinner = settled && !row.pending && rankNum === 1 && !topTie;
    const tilt = (i % 2 === 0 ? -1 : 1) * (1.5 + (i % 3));

    const li = document.createElement('li');
    li.className = [
      'pp-lb-row', 'pp-sticky', 'pp-sticky--tape',
      isWinner ? '' : `pp-sticky--c${i % 6}`,
      row.isSelf ? 'is-self' : '', isWinner ? 'is-winner' : '', row.pending ? 'is-pending' : '',
    ].filter(Boolean).join(' ');
    li.style.setProperty('--delay', repaint ? '0ms' : `${(total - 1 - i) * 130}ms`);
    li.style.setProperty('--pp-note-tilt', `${tilt}deg`);

    const avatar = document.createElement('span');
    avatar.className = 'pp-lb-avatar';
    avatar.innerHTML = `<img src="${avatarUrl(row.avatarSeed || row.name)}" alt="" loading="lazy" />`;

    const rank = document.createElement('span');
    rank.className = 'pp-lb-rank';
    if (row.pending) rank.textContent = '·';
    else if (isWinner) rank.innerHTML = TROPHY_SVG;
    else rank.textContent = tiedHere ? '=' : String(rankNum);

    const name = document.createElement('span');
    name.className = 'pp-lb-name';
    name.textContent = row.name;
    const detail = row.pending ? pendingLabel(settled) : (meta ? meta(row, { settled, rankNum, isWinner }) : null);
    if (detail != null) {
      const m = document.createElement('small');
      m.className = metaClass;
      m.textContent = detail;
      name.appendChild(m);
    }

    const scoreEl = document.createElement('span');
    scoreEl.className = 'pp-lb-score';
    scoreEl.textContent = row.pending ? '–' : String(row.score);

    li.append(avatar, rank, name, scoreEl);
    listEl.appendChild(li);
  });

  // The winner's note lands last (delay = (total-1)*130ms); fire the confetti as
  // it settles, only on the final board and only when the signed-in player won.
  if (settled && sorted[0] && sorted[0].isSelf && !sorted[0].pending && !topTie) {
    setTimeout(launchConfetti, repaint ? 400 : (total - 1) * 130 + 400);
  }
  return { sorted, topTie };
}
