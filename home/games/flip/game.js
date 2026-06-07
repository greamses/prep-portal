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

const TILE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFB347', '#A8E6CF', '#D4A5A5',
  '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C', '#E74C3C',
  '#F39C12', '#2ECC71', '#C0392B', '#16A085', '#8E44AD'
];

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
  if (type === "percent") return `${Math.round(val * 100)}%`;
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

// ---------- DROPDOWN LOGIC ----------
function toggleDropdown(id) {
  const dd = document.getElementById(id);
  if (!dd) return;
  const isOpen = dd.classList.contains('open');
  document.querySelectorAll('.pp-dropdown.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) dd.classList.add('open');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.pp-dropdown')) {
    document.querySelectorAll('.pp-dropdown.open').forEach(el => el.classList.remove('open'));
  }
});

document.querySelectorAll('.pp-dropdown-list').forEach(list => {
  list.addEventListener('click', (e) => {
    const item = e.target.closest('.pp-dropdown-item');
    if (!item) return;
    const dd = item.closest('.pp-dropdown');
    const value = item.dataset.value;
    const headerSpan = dd.querySelector('.dd-selected');
    
    list.querySelectorAll('.pp-dropdown-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    if (headerSpan) headerSpan.textContent = item.textContent.trim();
    dd.classList.remove('open');
    
    if (dd.id === 'dd-tiles') settings.gridSize = parseInt(value);
    if (dd.id === 'dd-mode') settings.mode = value;
    if (dd.id === 'dd-type') settings.type = value;
  });
});

// ---------- CARD GENERATION ----------
function generateUniqueValues(count) {
  // Use fraction-friendly values for cleaner displays
  const commonValues = [
    0.1, 0.125, 0.2, 0.25, 0.3, 0.33, 0.375, 0.4, 
    0.5, 0.6, 0.625, 0.66, 0.7, 0.75, 0.8, 0.875, 0.9
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
      color: TILE_COLORS[i % TILE_COLORS.length]
    });
    
    // Right card (matching pair)
    cards.push({
      id: i * 2 + 1,
      value: val,
      display: formatValue(val, rightType),
      type: rightType,
      color: TILE_COLORS[i % TILE_COLORS.length]
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
    showValuesModal.addEventListener('change', (e) => {
      settings.showValues = e.target.checked;
      showValuesCheck.checked = e.target.checked;
      if (gameState.gameActive) renderGrid();
    });
  }
  
  document.getElementById('game-modal').classList.add('active');
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
  
  gameFeedback.className = 'gp-feedback-box';
  gameFeedback.textContent = 'Flip two cards to find matching values. Keep the pair if they match!';
}

function resetGame() {
  newGame();
}

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
      visualHTML = `<div class="tile-number" style="color: ${card.color}">${card.display}</div>`;
    }
    
    html += `
      <div class="flip-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}" 
           data-index="${index}" onclick="handleCardClick(${index})">
        <div class="flip-card-inner">
          <div class="flip-card-front"></div>
          <div class="flip-card-back">
            <div class="tile-visual">
              ${visualHTML}
            </div>
            ${settings.showValues ? `<div class="tile-label">${card.display}</div>` : ''}
          </div>
        </div>
      </div>`;
  });
  
  flipGrid.innerHTML = html;
}

function renderBarSVG(card) {
  const percent = Math.round(card.value * 100);
  return `
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
      <rect x="5" y="10" width="90" height="40" fill="#e5ddd1" />
      <rect x="5" y="10" width="${percent * 0.9}" height="40" fill="${card.color}" />
      <rect x="5" y="10" width="90" height="40" fill="none" stroke="#1a1a1a" stroke-width="2.5" />
    </svg>`;
}

function renderCircleSVG(card) {
  const angle = card.value * 360;
  const largeArc = angle > 180 ? 1 : 0;
  const endX = 50 + 40 * Math.cos((angle - 90) * Math.PI / 180);
  const endY = 50 + 40 * Math.sin((angle - 90) * Math.PI / 180);
  
  return `
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <circle cx="50" cy="50" r="40" fill="#e5ddd1" />
      <path d="M 50 50 L 50 10 A 40 40 0 ${largeArc} 1 ${endX.toFixed(1)} ${endY.toFixed(1)} Z" fill="${card.color}" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a1a" stroke-width="2.5" />
    </svg>`;
}

// ---------- GAMEPLAY ----------
window.handleCardClick = function(index) {
  if (!gameState.gameActive || gameState.lockBoard) return;
  if (gameState.flipped.includes(index) || gameState.matched.has(gameState.cards[index].value)) return;
  if (gameState.flipped.length === 2) return;
  
  gameState.flipped.push(index);
  renderGrid();
  
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
      
      gameFeedback.className = 'gp-feedback-box success';
      gameFeedback.textContent = `Match found! ${gameState.pairsFound} pair${gameState.pairsFound === 1 ? '' : 's'} complete.`;
      
      gameState.flipped = [];
      gameState.lockBoard = false;
      renderGrid();
      updateStats();
      
      // Check if game is complete
      if (gameState.pairsFound === gameState.cards.length / 2) {
        gameState.winTimeout = setTimeout(() => {
          gameFeedback.className = 'gp-feedback-box success';
          gameFeedback.textContent = `🎉 Congratulations! You matched all pairs in ${gameState.moves} flips!`;
        }, 600);
      }
    } else {
      // No match - flip cards back
      setTimeout(() => {
        gameState.flipped = [];
        gameState.lockBoard = false;
        renderGrid();
        gameFeedback.className = 'gp-feedback-box';
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
  
  document.getElementById('game-modal').classList.remove('active');
  document.body.style.overflow = '';
  gameState.gameActive = false;
  gameState.lockBoard = false;
}

// ---------- GLOBAL EXPOSURE ----------
window.toggleDropdown = toggleDropdown;
window.openGameModal = openGameModal;
window.closeGameModal = closeGameModal;
window.newGame = newGame;
window.resetGame = resetGame;

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('ticker-track');
  if (track && track.children.length === 0) {
    const words = ['Flip Card Game', 'Memory Match', 'Decimal ↔ Fraction', 'Percent • Degrees', 'Bars • Circles', 'Prep Portal 2026'];
    [...words, ...words].forEach(t => {
      const s = document.createElement('span');
      s.className = 'ticker-item';
      s.textContent = t;
      track.appendChild(s);
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