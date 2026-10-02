// =============================================
// Flip Card Matching Game - Prep Portal 2026
// =============================================

const MODES = {
  "decimal-fraction": { left: "decimal", right: "fraction", label: "Decimal → Fraction" },
  "fraction-percent": { left: "fraction", right: "percent", label: "Fraction → Percent" },
  "decimal-percent": { left: "decimal", right: "percent", label: "Decimal → Percent" },
  "fraction-degrees": { left: "fraction", right: "degrees", label: "Fraction → Degrees" },
  "degrees-decimal": { left: "degrees", right: "decimal", label: "Degrees → Decimal" },
  "mixed": { left: "mixed", right: "mixed", label: "Mixed Conversions" }
};

// What a card's drawing is painted with. The shaded part is a pastel in the
// site's own key (golden-angle hues, as on the Slider game and the Drills
// fraction bars); everything else is a theme token, so the drawing follows the
// page into dark mode.
const SVG_INK = 'var(--ink)';
const SVG_EMPTY = 'var(--surface-primary)';
const pairColor = (i) => `hsl(${Math.round((i * 137.5 + 20) % 360)} 72% 74%)`;

// ---------- UTILITIES ----------
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function decimalToFraction(decimal) {
  if (decimal === 0) return { num: 0, den: 1 };
  if (decimal === 1) return { num: 1, den: 1 };

  // Handle common fractions exactly
  const commonFractions = {
    0.25: { num: 1, den: 4 },
    0.33: { num: 1, den: 3 },
    0.5: { num: 1, den: 2 },
    0.67: { num: 2, den: 3 },
    0.75: { num: 3, den: 4 },
    0.2: { num: 1, den: 5 },
    0.4: { num: 2, den: 5 },
    0.6: { num: 3, den: 5 },
    0.8: { num: 4, den: 5 },
    0.125: { num: 1, den: 8 },
    0.375: { num: 3, den: 8 },
    0.625: { num: 5, den: 8 },
    0.875: { num: 7, den: 8 },
    0.167: { num: 1, den: 6 },
    0.833: { num: 5, den: 6 }
  };

  // Check for common fractions first (with tolerance)
  const rounded = Math.round(decimal * 1000) / 1000;
  if (commonFractions[rounded]) {
    return commonFractions[rounded];
  }

  let bestNum = 1,
    bestDen = 1;
  let bestError = Math.abs(decimal - bestNum / bestDen);

  for (let den = 1; den <= 16; den++) {
    const num = Math.round(decimal * den);
    const error = Math.abs(decimal - num / den);
    if (error < bestError) {
      bestError = error;
      bestNum = num;
      bestDen = den;
    }
  }

  const divisor = gcd(bestNum, bestDen);
  return { num: bestNum / divisor, den: bestDen / divisor };
}

function formatValue(val, type) {
  if (type === "fraction") {
    const f = decimalToFraction(val);
    return `${f.num}/${f.den}`;
  }
  // One decimal where it is needed: 1/8 is 12.5%, and a card that said 13%
  // would be matching two values that are not equal.
  if (type === "percent") return `${parseFloat((val * 100).toFixed(1))}%`;
  if (type === "degrees") return `${Math.round(val * 360)}°`;
  if (type === "decimal") {
    // Remove trailing zeros for cleaner display
    const str = val.toFixed(3);
    return parseFloat(str).toString();
  }
  return val.toFixed(2);
}

// Update the settings default
let settings = {
  gridSize: 2, // Changed from 4 to 2
  mode: "decimal-fraction",
  type: "bars",
  showValues: true,
};

let gameState = {
  cards: [],
  flipped: [],
  matched: new Set(),
  moves: 0,
  pairsFound: 0,
  gameActive: false,
  lockBoard: false,
  winTimeout: null
};

let flipGrid, gameFeedback, modalFlips, movesStat, pairsStat;

// ---------- SETTINGS ----------
// Each group of sticky-note radios carries data-setting="<key>"; ticking one
// writes straight into `settings`.
document.querySelectorAll('[data-setting]').forEach((group) => {
  group.addEventListener('change', (e) => {
    const key = group.dataset.setting;
    settings[key] = key === 'gridSize' ? parseInt(e.target.value, 10) : e.target.value;
  });
});

// ---------- CARD GENERATION ----------
function generateUniqueValues(count) {
  // Values that are EXACT as a fraction, a decimal, a percent and an angle.
  // Thirds are left out: 0.33, 33% and 119° are not equal to 1/3.
  const commonValues = [
    0.1, 0.125, 0.2, 0.25, 0.3, 0.375, 0.4,
    0.5, 0.6, 0.625, 0.7, 0.75, 0.8, 0.875, 0.9
  ];

  // Shuffle and take first 'count' values
  const shuffled = [...commonValues].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function createCards() {
  const pairCount = (settings.gridSize * settings.gridSize) / 2;
  const values = generateUniqueValues(pairCount);
  const cards = [];
  const modeConfig = MODES[settings.mode];

  values.forEach((val, i) => {
    let leftType = modeConfig.left;
    let rightType = modeConfig.right;

    if (modeConfig.left === "mixed") {
      leftType = ["decimal", "fraction", "percent"][i % 3];
    }
    if (modeConfig.right === "mixed") {
      rightType = ["fraction", "percent", "degrees"][i % 3];
    }

    // Left card
    cards.push({
      id: i * 2,
      value: val,
      display: formatValue(val, leftType),
      type: leftType,
      color: pairColor(i)
    });

    // Right card (matching pair)
    cards.push({
      id: i * 2 + 1,
      value: val,
      display: formatValue(val, rightType),
      type: rightType,
      color: pairColor(i)
    });
  });

  // Shuffle cards
  cards.sort(() => Math.random() - 0.5);
  return cards;
}

// ---------- GAME FUNCTIONS ----------
function openGameModal() {
  if (gameState.winTimeout) clearTimeout(gameState.winTimeout);

  gameState.moves = 0;
  gameState.pairsFound = 0;
  gameState.matched.clear();
  gameState.flipped = [];
  gameState.gameActive = true;
  gameState.lockBoard = false;

  flipGrid = document.getElementById('flip-grid');
  gameFeedback = document.getElementById('game-feedback');
  modalFlips = document.getElementById('modal-flips');
  movesStat = document.getElementById('stat-moves');
  pairsStat = document.getElementById('stat-pairs');

  const showValuesModal = document.getElementById('show-values-modal');
  const showValuesCheck = document.getElementById('show-values');

  if (showValuesModal && showValuesCheck) {
    showValuesModal.checked = settings.showValues;
  }

  const modal = document.getElementById('game-modal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  // Game mode: the nav goes away, as it does in every other game's play view.
  document.body.classList.add('pgame-nav-hidden');
  document.body.style.overflow = 'hidden';

  newGame();
}

function newGame() {
  if (!gameState.gameActive) return;

  gameState.cards = createCards();
  gameState.flipped = [];
  gameState.matched.clear();
  gameState.moves = 0;
  gameState.pairsFound = 0;
  gameState.lockBoard = false;

  if (flipGrid) {
    flipGrid.setAttribute('data-size', settings.gridSize);
  }

  renderGrid();
  updateStats();

  gameFeedback.className = 'pgame-feedback';
  gameFeedback.textContent = 'Flip two cards to find matching values. Keep the pair if they match!';
}

function resetGame() {
  newGame();
}

// Builds the grid. Called for a new game and when the labels are toggled —
// NOT on a click: paintState() turns the cards that changed, so the flip is
// seen (re-rendering every card replaced the turn with a jump cut).
function renderGrid() {
  if (!flipGrid || !gameState.cards) return;

  let html = '';

  gameState.cards.forEach((card, index) => {
    const isFlipped = gameState.flipped.includes(index) || gameState.matched.has(card.value);
    const isMatched = gameState.matched.has(card.value);

    let visualHTML = '';

    if (settings.type === 'bars') {
      visualHTML = renderBarSVG(card);
    } else if (settings.type === 'circles') {
      visualHTML = renderCircleSVG(card);
    } else {
      // Numbers only: plain ink. A colour per pair would give the match away.
      visualHTML = `<span class="tile-number">${card.display}</span>`;
    }

    html += `
      <button type="button" class="flip-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}"
           data-index="${index}" aria-label="Card ${index + 1}" onclick="handleCardClick(${index})">
        <span class="flip-card-inner">
          <span class="flip-card-front"></span>
          <span class="flip-card-back">
            <span class="tile-visual">
              ${visualHTML}
            </span>
            ${settings.showValues && settings.type !== 'none' ? `<span class="tile-label">${card.display}</span>` : ''}
          </span>
        </span>
      </button>`;
  });

  flipGrid.innerHTML = html;
}

function paintState() {
  if (!flipGrid) return;
  flipGrid.querySelectorAll('.flip-card').forEach((el) => {
    const index = Number(el.dataset.index);
    const card = gameState.cards[index];
    if (!card) return;
    const isMatched = gameState.matched.has(card.value);
    el.classList.toggle('flipped', isMatched || gameState.flipped.includes(index));
    el.classList.toggle('matched', isMatched);
  });
}

function renderBarSVG(card) {
  const percent = Math.round(card.value * 100);
  return `
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
      <rect x="5" y="10" width="90" height="40" rx="3" fill="${SVG_EMPTY}" />
      <rect x="5" y="10" width="${percent * 0.9}" height="40" fill="${card.color}" />
      <rect x="5" y="10" width="90" height="40" rx="3" fill="none" stroke="${SVG_INK}" stroke-width="2.2" />
    </svg>`;
}

function renderCircleSVG(card) {
  const angle = card.value * 360;
  const largeArc = angle > 180 ? 1 : 0;
  const endX = 50 + 40 * Math.cos((angle - 90) * Math.PI / 180);
  const endY = 50 + 40 * Math.sin((angle - 90) * Math.PI / 180);

  return `
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <circle cx="50" cy="50" r="40" fill="${SVG_EMPTY}" />
      <path d="M 50 50 L 50 10 A 40 40 0 ${largeArc} 1 ${endX.toFixed(1)} ${endY.toFixed(1)} Z" fill="${card.color}" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="${SVG_INK}" stroke-width="2.2" />
    </svg>`;
}

// ---------- GAMEPLAY ----------
window.handleCardClick = function(index) {
  if (!gameState.gameActive || gameState.lockBoard) return;
  if (gameState.flipped.includes(index) || gameState.matched.has(gameState.cards[index].value)) return;
  if (gameState.flipped.length === 2) return;

  gameState.flipped.push(index);
  paintState();

  if (gameState.flipped.length === 2) {
    gameState.moves++;
    updateStats();
    gameState.lockBoard = true;

    const [idx1, idx2] = gameState.flipped;
    const card1 = gameState.cards[idx1];
    const card2 = gameState.cards[idx2];

    if (Math.abs(card1.value - card2.value) < 0.001) {
      // Match found
      gameState.matched.add(card1.value);
      gameState.pairsFound++;

      gameFeedback.className = 'pgame-feedback is-success';
      gameFeedback.textContent = `Match found! ${gameState.pairsFound} pair${gameState.pairsFound === 1 ? '' : 's'} complete.`;

      gameState.flipped = [];
      gameState.lockBoard = false;
      paintState();
      updateStats();

      // Check if game is complete
      if (gameState.pairsFound === gameState.cards.length / 2) {
        gameState.winTimeout = setTimeout(() => {
          gameFeedback.className = 'pgame-feedback is-success';
          gameFeedback.textContent = `All pairs matched in ${gameState.moves} flips!`;
        }, 600);
      }
    } else {
      // No match - flip cards back
      setTimeout(() => {
        gameState.flipped = [];
        gameState.lockBoard = false;
        paintState();
        gameFeedback.className = 'pgame-feedback';
        gameFeedback.textContent = 'No match. Try again!';
      }, 1100);
    }
  }
};

function updateStats() {
  if (movesStat) movesStat.textContent = gameState.moves;
  if (pairsStat) pairsStat.textContent = gameState.pairsFound;
  if (modalFlips) {
    modalFlips.textContent = `${gameState.moves} flip${gameState.moves === 1 ? '' : 's'}`;
  }
}

function closeGameModal() {
  if (gameState.winTimeout) clearTimeout(gameState.winTimeout);

  const modal = document.getElementById('game-modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('pgame-nav-hidden');
  document.body.style.overflow = '';
  gameState.gameActive = false;
  gameState.lockBoard = false;
}

// ---------- GLOBAL EXPOSURE ----------
window.openGameModal = openGameModal;
window.closeGameModal = closeGameModal;
window.newGame = newGame;
window.resetGame = resetGame;

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', () => {
  // The play view's own Labels tick — wired once here, not on every open.
  const showValuesModal = document.getElementById('show-values-modal');
  if (showValuesModal) {
    showValuesModal.addEventListener('change', (e) => {
      settings.showValues = e.target.checked;
      const setupCheck = document.getElementById('show-values');
      if (setupCheck) setupCheck.checked = e.target.checked;
      if (gameState.gameActive) renderGrid();
    });
  }

  // Sync checkboxes
  const showValuesCheck = document.getElementById('show-values');
  if (showValuesCheck) {
    showValuesCheck.addEventListener('change', (e) => {
      settings.showValues = e.target.checked;
      const modalCheck = document.getElementById('show-values-modal');
      if (modalCheck) modalCheck.checked = e.target.checked;
    });
  }
});