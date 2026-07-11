/* ═══════════════════════════════════════════════════════
   DRILLS — page orchestrator
   Wires the setup form to matchmaking.js -> game.js -> leaderboard.js and
   switches between the lobby/play/results overlays.
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { ALL_TABLES } from './rng.js';
import { botName } from './bots.js';
import { matchmake } from './matchmaking.js';
import { startRound } from './game.js';
import { finishRound } from './leaderboard.js';

const $ = (id) => document.getElementById(id);
const stickyColor = (i) => `pp-sticky--c${i % 6}`;

const TROPHY_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z" fill="var(--accent-primary)"/>
  <path d="M7 5H4a3 3 0 0 0 3 3" fill="none" stroke="var(--accent-primary)" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M17 5h3a3 3 0 0 1-3 3" fill="none" stroke="var(--accent-primary)" stroke-width="1.6" stroke-linecap="round"/>
  <rect x="10.5" y="12" width="3" height="4" fill="var(--accent-primary)"/>
  <rect x="8" y="16.4" width="8" height="2.4" rx="1" fill="var(--accent-primary)"/>
</svg>`;

const modeToggle = $('drill-mode-toggle');
const sizeField = $('drill-size-field');
const tablesGrid = $('drill-tables-grid');
const startBtn = $('drill-start-btn');

const lobbyBd = $('drill-lobby-bd');
const lobbyStatus = $('drill-lobby-status');
const lobbySeats = $('drill-lobby-seats');
const lobbyCount = $('drill-lobby-count');
const lobbyCancel = $('drill-lobby-cancel');

const resultsBd = $('drill-results-bd');
const leaderboardEl = $('drill-leaderboard');
const againBtn = $('drill-again-btn');

let cancelled = false;
const tables = new Set(); // nothing checked by default — user ticks which tables to drill

function getCurrentUser() {
  return new Promise((resolve) => {
    if (auth.currentUser) { resolve(auth.currentUser); return; }
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) { unsub(); resolve(user); }
    });
  });
}

function getMode() { return document.querySelector('input[name="drill-mode"]:checked').value; }
function getSize() { return parseInt(document.querySelector('input[name="drill-size"]:checked').value, 10); }
function getTimeLimit() { return parseInt(document.querySelector('input[name="drill-time"]:checked').value, 10); }
function getOperation() { return document.querySelector('input[name="drill-operation"]:checked').value; }

function renderTablesGrid() {
  tablesGrid.innerHTML = '';
  ALL_TABLES.forEach((n, i) => {
    const label = document.createElement('label');
    label.className = `pp-sticky pp-sticky--tape sticky-choice ${stickyColor(i)}`;
    label.innerHTML = `<input type="checkbox" value="${n}" ${tables.has(n) ? 'checked' : ''} /><span>${n}</span>`;
    tablesGrid.appendChild(label);
  });
}
renderTablesGrid();
startBtn.disabled = tables.size === 0; // nothing picked yet

tablesGrid.addEventListener('change', (e) => {
  const cb = e.target.closest('input[type="checkbox"]');
  if (!cb) return;
  const n = parseInt(cb.value, 10);
  if (cb.checked) tables.add(n);
  else tables.delete(n);
  startBtn.disabled = tables.size === 0;
});

modeToggle.addEventListener('change', () => {
  sizeField.hidden = getMode() === 'versus';
});

// Seats fill in (and pop) as real players join — re-rendered on every
// playerCount change from the room-doc listener.
function renderLobbySeats(playerCount, size) {
  lobbySeats.innerHTML = '';
  for (let i = 0; i < size; i++) {
    const seat = document.createElement('span');
    seat.className = `drill-seat${i < playerCount ? ' filled' : ''}`;
    lobbySeats.appendChild(seat);
  }
}

function showLobby(size) {
  cancelled = false;
  lobbyStatus.textContent = 'Waiting for other players…';
  lobbyCount.textContent = `1 / ${size}`;
  renderLobbySeats(1, size);
  lobbyBd.classList.add('open');
  lobbyBd.setAttribute('aria-hidden', 'false');
}
function hideLobby() {
  lobbyBd.classList.remove('open');
  lobbyBd.setAttribute('aria-hidden', 'true');
}

// Builds the room-entry roster shown during the "get ready" beat: you,
// other real players (names aren't known until the round-end read, so they
// show generically), and bots — who get real names, indistinguishable from
// a human opponent at a glance.
function buildRoster({ size, botsNeeded, seed }, myName) {
  const realOthers = Math.max(0, size - botsNeeded - 1);
  const roster = [{ name: myName, isSelf: true }];
  for (let i = 0; i < realOthers; i++) roster.push({ name: 'Player', isSelf: false });
  for (let i = 0; i < botsNeeded; i++) roster.push({ name: botName(seed, i), isSelf: false });
  return roster;
}

// Reveals from last place up to the winner, one row at a time, for a bit of
// suspense — the winner's row lands last and carries a trophy.
function renderResults(ranked) {
  leaderboardEl.innerHTML = '';
  const total = ranked.length;
  ranked.forEach((row, i) => {
    const isWinner = i === 0;
    const li = document.createElement('li');
    li.className = `drill-lb-row${row.isSelf ? ' is-self' : ''}${isWinner ? ' is-winner' : ''}`;
    li.style.setProperty('--delay', `${(total - 1 - i) * 130}ms`);
    const rank = document.createElement('span');
    rank.className = 'drill-lb-rank';
    if (isWinner) rank.innerHTML = TROPHY_SVG;
    else rank.textContent = String(i + 1);
    const name = document.createElement('span');
    name.className = 'drill-lb-name';
    name.textContent = row.name;
    const scoreEl = document.createElement('span');
    scoreEl.className = 'drill-lb-score';
    scoreEl.textContent = String(row.score);
    li.append(rank, name, scoreEl);
    leaderboardEl.appendChild(li);
  });
  resultsBd.classList.add('open');
  resultsBd.setAttribute('aria-hidden', 'false');
}
function hideResults() {
  resultsBd.classList.remove('open');
  resultsBd.setAttribute('aria-hidden', 'true');
}

async function runDrill() {
  startBtn.disabled = true;
  await getCurrentUser();

  const mode = getMode();
  const size = mode === 'versus' ? 2 : getSize();
  const timeLimit = getTimeLimit();
  const operation = getOperation();
  const tablesList = [...tables];

  showLobby(size);

  let room;
  try {
    room = await matchmake(
      { mode, size, timeLimit, operation, tables: tablesList },
      {
        onWaiting: ({ playerCount, size: roomSize }) => {
          lobbyCount.textContent = `${playerCount} / ${roomSize}`;
          renderLobbySeats(playerCount, roomSize);
        },
      },
    );
  } catch (e) {
    hideLobby();
    startBtn.disabled = false;
    alert(e && e.quotaBlocked ? e.message : "Couldn't start a room — please try again.");
    return;
  }

  if (cancelled) return;
  hideLobby();

  const roster = buildRoster(room, auth.currentUser.displayName || 'You');
  const myScore = await startRound({
    seed: room.seed,
    timeLimit: room.timeLimit,
    startAt: room.startAt,
    operation: room.operation,
    tables: room.tables,
    roster,
  });

  let ranked;
  try {
    ranked = await finishRound({
      roomId: room.roomId,
      seed: room.seed,
      timeLimit: room.timeLimit,
      botsNeeded: room.botsNeeded,
      myScore,
    });
  } catch (e) {
    ranked = [{ name: 'You', score: myScore, isBot: false, isSelf: true }];
  }

  startBtn.disabled = false;
  renderResults(ranked);
}

startBtn.addEventListener('click', runDrill);
lobbyCancel.addEventListener('click', () => {
  // v1 doesn't retract the Firestore join/room-create on cancel — the
  // abandon-fallback timers on other clients (or a solo bot-fill) resolve
  // an orphaned room naturally, and unread docs aren't billed.
  cancelled = true;
  hideLobby();
  startBtn.disabled = false;
});
againBtn.addEventListener('click', hideResults);

// Preselect mode from nav links like ?mode=versus
const initialMode = new URLSearchParams(location.search).get('mode');
if (initialMode === 'versus' || initialMode === 'multiplayer') {
  const radio = document.querySelector(`input[name="drill-mode"][value="${initialMode}"]`);
  if (radio) { radio.checked = true; sizeField.hidden = initialMode === 'versus'; }
}
