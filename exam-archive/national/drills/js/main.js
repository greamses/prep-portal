/* ═══════════════════════════════════════════════════════
   DRILLS — page orchestrator
   Wires the setup form to matchmaking.js -> game.js -> leaderboard.js and
   switches between the lobby/play/results overlays.
═══════════════════════════════════════════════════════ */
import { auth } from '/firebase-init.js';
import { matchmake } from './matchmaking.js';
import { startRound } from './game.js';
import { finishRound } from './leaderboard.js';

const $ = (id) => document.getElementById(id);

const modeToggle = $('drill-mode-toggle');
const sizeField = $('drill-size-field');
const sizeRow = $('drill-size-row');
const timeRow = $('drill-time-row');
const startBtn = $('drill-start-btn');

const lobbyBd = $('drill-lobby-bd');
const lobbyStatus = $('drill-lobby-status');
const lobbyCount = $('drill-lobby-count');
const lobbyCancel = $('drill-lobby-cancel');

const resultsBd = $('drill-results-bd');
const leaderboardEl = $('drill-leaderboard');
const againBtn = $('drill-again-btn');

let mode = 'multiplayer';
let size = 5;
let timeLimit = 60;
let cancelled = false;

function getCurrentUser() {
  return new Promise((resolve) => {
    if (auth.currentUser) { resolve(auth.currentUser); return; }
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) { unsub(); resolve(user); }
    });
  });
}

function setMode(next) {
  mode = next;
  modeToggle.querySelectorAll('.drill-tile').forEach((b) => b.classList.toggle('active', b.dataset.mode === next));
  sizeField.hidden = mode === 'versus';
}

modeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.drill-tile');
  if (!btn) return;
  setMode(btn.dataset.mode);
});

sizeRow.addEventListener('click', (e) => {
  const btn = e.target.closest('.drill-tile');
  if (!btn) return;
  size = parseInt(btn.dataset.size, 10);
  sizeRow.querySelectorAll('.drill-tile').forEach((b) => b.classList.toggle('active', b === btn));
});

timeRow.addEventListener('click', (e) => {
  const btn = e.target.closest('.drill-tile');
  if (!btn) return;
  timeLimit = parseInt(btn.dataset.time, 10);
  timeRow.querySelectorAll('.drill-tile').forEach((b) => b.classList.toggle('active', b === btn));
});

function showLobby() {
  cancelled = false;
  lobbyStatus.textContent = 'Waiting for other players…';
  lobbyCount.textContent = `1 / ${mode === 'versus' ? 2 : size}`;
  lobbyBd.classList.add('open');
  lobbyBd.setAttribute('aria-hidden', 'false');
}
function hideLobby() {
  lobbyBd.classList.remove('open');
  lobbyBd.setAttribute('aria-hidden', 'true');
}

function renderResults(ranked) {
  leaderboardEl.innerHTML = '';
  ranked.forEach((row, i) => {
    const li = document.createElement('li');
    li.className = `drill-lb-row${row.isSelf ? ' is-self' : ''}`;
    const rank = document.createElement('span');
    rank.className = 'drill-lb-rank';
    rank.textContent = String(i + 1);
    const name = document.createElement('span');
    name.className = 'drill-lb-name';
    name.textContent = row.name + (row.isBot ? ' (Bot)' : '');
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
  showLobby();

  let room;
  try {
    room = await matchmake(
      { mode, size: mode === 'versus' ? 2 : size, timeLimit },
      {
        onWaiting: ({ playerCount, size: roomSize }) => {
          lobbyCount.textContent = `${playerCount} / ${roomSize}`;
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

  const myScore = await startRound({
    seed: room.seed,
    timeLimit: room.timeLimit,
    startAt: room.startAt,
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
if (initialMode === 'versus' || initialMode === 'multiplayer') setMode(initialMode);
