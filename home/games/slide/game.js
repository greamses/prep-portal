// game.js - Slider Game Logic (Classic Sliding Puzzle - Continuous Play)

// ---------- CONFIGURATION ----------
const MODES = {
  fraction: {
    label: 'Fraction',
    format: (val) => {
      const frac = decimalToFraction(val);
      return `${frac.num}/${frac.den}`;
    },
    parse: (str) => fractionToDecimal(str),
  },
  percent: {
    label: 'Percent',
    format: (val) => `${Math.round(val * 100)}%`,
    parse: (str) => parseFloat(str.replace('%', '')) / 100,
  },
  degrees: {
    label: 'Degrees',
    format: (val) => `${Math.round(val * 360)}°`,
    parse: (str) => parseFloat(str.replace('°', '')) / 360,
  },
  decimal: {
    label: 'Decimal',
    format: (val) => val.toFixed(2),
    parse: (str) => parseFloat(str),
  },
  time: {
    label: 'Time',
    format: (val) => `${Math.round(val * 60)} min`,
    parse: (str) => parseFloat(str.replace('min', '').trim()) / 60,
  },
  mixed: {
    label: 'Mixed',
    format: (val) => {
      const modes = ['fraction', 'percent', 'decimal'];
      const idx = Math.floor(val * modes.length) % modes.length;
      return MODES[modes[idx]].format(val);
    },
    parse: (str) => fractionToDecimal(str) || parseFloat(str) || 0,
  },
};

// Distinct color palette for tiles
const TILE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFB347', '#A8E6CF', '#D4A5A5',
  '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C', '#E74C3C',
  '#F39C12', '#2ECC71', '#C0392B', '#16A085', '#8E44AD',
];

// ---------- UTILITIES ----------
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function decimalToFraction(decimal, tolerance = 0.0001) {
  if (decimal === 0) return { num: 0, den: 1 };
  if (decimal === 1) return { num: 1, den: 1 };
  
  let bestNum = 1,
    bestDen = 1;
  let bestError = Math.abs(decimal - bestNum / bestDen);
  
  for (let den = 2; den <= 16; den++) {
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

function fractionToDecimal(str) {
  if (str.includes('/')) {
    const parts = str.split('/');
    return parseFloat(parts[0]) / parseFloat(parts[1]);
  }
  return parseFloat(str);
}

// ---------- STATE ----------
let settings = {
  gridSize: 2,
  mode: 'fraction',
  type: 'bars',
  arrange: 'ascending',
  showValues: true,
  showSplitLines: true,
  fractionType: 'mixed',
};

let gameState = {
  tiles: [],
  positions: [],
  emptyIndex: -1,
  moves: 0,
  solved: 0,
  gameActive: false,
  isGenerating: false,
  winTimeout: null,
};

let sliderGrid, gameFeedback, modalMoves, movesStat, solvedStat;
let shuffleBtn, resetBtn, showValuesModal, showValuesCheck, showSplitLinesCheck;

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
    if (dd.id === 'dd-arrange') settings.arrange = value;
    if (dd.id === 'dd-fraction-type') settings.fractionType = value;
  });
});

// ---------- FRACTION GENERATION ----------
function generateUniqueFractions(count) {
  switch (settings.fractionType) {
    case 'like-denominators':
      return generateLikeDenominators(count);
    case 'like-numerators':
      return generateLikeNumerators(count);
    case 'unit-fractions':
      return generateUnitFractions(count);
    case 'incrementing-numerator':
      return generateIncrementingNumerator(count);
    case 'incrementing-denominator':
      return generateIncrementingDenominator(count);
    default:
      return generateMixedFractions(count);
  }
}

function generateMixedFractions(count) {
  const fractions = [];
  const used = new Set();
  
  // Denominators from 2 to 16
  const denominators = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const shuffledDenoms = [...denominators].sort(() => Math.random() - 0.5);
  
  for (const den of shuffledDenoms) {
    if (fractions.length >= count) break;
    for (let num = 1; num < den; num++) {
      if (fractions.length >= count) break;
      const value = num / den;
      const key = value.toFixed(4);
      const minVal = count <= 8 ? 0.1 : 0.05;
      const maxVal = count <= 8 ? 0.9 : 0.95;
      if (value >= minVal && value <= maxVal && !used.has(key)) {
        used.add(key);
        fractions.push(value);
      }
    }
  }
  
  // Fallback: generate using variations if needed
  while (fractions.length < count) {
    const base = 0.1 + (fractions.length * 0.8 / count);
    const value = Math.min(0.9, base + (Math.random() * 0.05));
    const key = value.toFixed(4);
    if (!used.has(key)) {
      used.add(key);
      fractions.push(value);
    }
  }
  
  return fractions;
}

function generateLikeDenominators(count) {
  const fractions = [];
  
  // Choose a denominator that can provide enough unique fractions
  // For count tiles, we need a denominator > count
  let denominator;
  if (count <= 2) denominator = 3;
  else if (count <= 3) denominator = 4;
  else if (count <= 4) denominator = 5;
  else if (count <= 5) denominator = 6;
  else if (count <= 6) denominator = 7;
  else if (count <= 7) denominator = 8;
  else if (count <= 8) denominator = 9;
  else if (count <= 9) denominator = 10;
  else if (count <= 10) denominator = 11;
  else if (count <= 11) denominator = 12;
  else if (count <= 12) denominator = 13;
  else if (count <= 13) denominator = 14;
  else if (count <= 14) denominator = 15;
  else denominator = 16;
  
  // All numerators from 1 to denominator-1
  for (let num = 1; num < denominator && fractions.length < count; num++) {
    const value = num / denominator;
    // Avoid extremes for better gameplay
    if (value >= 0.1 && value <= 0.9) {
      fractions.push(value);
    }
  }
  
  // If we still need more, use another denominator
  if (fractions.length < count) {
    const secondDen = denominator + 1;
    for (let num = 1; num < secondDen && fractions.length < count; num++) {
      const value = num / secondDen;
      if (value >= 0.1 && value <= 0.9) {
        fractions.push(value);
      }
    }
  }
  
  return fractions.slice(0, count);
}

function generateLikeNumerators(count) {
  const fractions = [];
  
  // Choose a small numerator (max 3 as specified)
  let numerator;
  if (count <= 3) numerator = 2;
  else if (count <= 6) numerator = 2;
  else numerator = 3;
  
  // Denominators from numerator+1 to 16
  const denominators = [];
  for (let den = numerator + 1; den <= 16; den++) {
    denominators.push(den);
  }
  
  // Shuffle denominators for variety
  const shuffledDenoms = [...denominators].sort(() => Math.random() - 0.5);
  
  for (const den of shuffledDenoms) {
    if (fractions.length >= count) break;
    const value = numerator / den;
    // Avoid extremes
    if (value >= 0.1 && value <= 0.9) {
      fractions.push(value);
    }
  }
  
  // If we need more, try another numerator
  if (fractions.length < count && numerator < 3) {
    const secondNum = numerator + 1;
    for (let den = secondNum + 1; den <= 16 && fractions.length < count; den++) {
      const value = secondNum / den;
      if (value >= 0.1 && value <= 0.9) {
        // Check for duplicates
        const key = value.toFixed(4);
        if (!fractions.some(f => f.toFixed(4) === key)) {
          fractions.push(value);
        }
      }
    }
  }
  
  return fractions.slice(0, count);
}

function generateUnitFractions(count) {
  const fractions = [];
  
  // Unit fractions: 1/2, 1/3, 1/4, etc.
  const denominators = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  
  for (const den of denominators) {
    if (fractions.length >= count) break;
    const value = 1 / den;
    fractions.push(value);
  }
  
  return fractions;
}

function generateIncrementingNumerator(count) {
  const fractions = [];
  
  // Pattern: 1/2, 2/3, 3/4, 4/5, 5/6, 6/7, etc.
  // numerator = denominator - 1
  for (let den = 2; den <= 16 && fractions.length < count; den++) {
    const num = den - 1;
    const value = num / den;
    if (value >= 0.1 && value <= 0.9) {
      fractions.push(value);
    }
  }
  
  // If we need more, continue with larger denominators
  if (fractions.length < count) {
    for (let den = 17; den <= 20 && fractions.length < count; den++) {
      const num = den - 1;
      const value = num / den;
      fractions.push(value);
    }
  }
  
  return fractions.slice(0, count);
}

function generateIncrementingDenominator(count) {
  const fractions = [];
  
  // Pattern: 1/2, 1/3, 1/4, 1/5, etc. (unit fractions with increasing denominator)
  // This is essentially the same as unit fractions
  for (let den = 2; den <= 16 && fractions.length < count; den++) {
    const value = 1 / den;
    fractions.push(value);
  }
  
  // If we need more, continue with larger denominators
  if (fractions.length < count) {
    for (let den = 17; den <= 20 && fractions.length < count; den++) {
      const value = 1 / den;
      fractions.push(value);
    }
  }
  
  return fractions.slice(0, count);
}

// ---------- GAME INITIALIZATION ----------
function openGameModal() {
  if (gameState.winTimeout) {
    clearTimeout(gameState.winTimeout);
    gameState.winTimeout = null;
  }
  
  gameState.moves = 0;
  gameState.gameActive = true;
  gameState.isGenerating = false;
  
  sliderGrid = document.getElementById('slider-grid');
  gameFeedback = document.getElementById('game-feedback');
  modalMoves = document.getElementById('modal-moves');
  movesStat = document.getElementById('stat-moves');
  solvedStat = document.getElementById('stat-solved');
  shuffleBtn = document.getElementById('shuffle-btn');
  resetBtn = document.getElementById('reset-btn');
  showValuesModal = document.getElementById('show-values-modal');
  showValuesCheck = document.getElementById('show-values');
  showSplitLinesCheck = document.getElementById('show-split-lines');
  
  if (showValuesModal && showValuesCheck) {
    showValuesModal.checked = settings.showValues;
  }
  
  updateStats();
  
  generateNewPuzzle();
  
  if (shuffleBtn) shuffleBtn.disabled = false;
  if (resetBtn) resetBtn.disabled = false;
  
  document.getElementById('game-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  if (showValuesModal) {
    showValuesModal.replaceWith(showValuesModal.cloneNode(true));
    showValuesModal = document.getElementById('show-values-modal');
    showValuesModal.addEventListener('change', (e) => {
      settings.showValues = e.target.checked;
      if (showValuesCheck) showValuesCheck.checked = e.target.checked;
      if (gameState.gameActive && !gameState.isGenerating) renderGrid();
    });
  }
  
  if (showSplitLinesCheck) {
    showSplitLinesCheck.replaceWith(showSplitLinesCheck.cloneNode(true));
    showSplitLinesCheck = document.getElementById('show-split-lines');
    showSplitLinesCheck.addEventListener('change', (e) => {
      settings.showSplitLines = e.target.checked;
      if (gameState.gameActive && !gameState.isGenerating) renderGrid();
    });
  }
  
  gameFeedback.className = 'gp-feedback-box';
  gameFeedback.textContent = `Arrange tiles in ${settings.arrange} order. Click tiles next to empty space.`;
}

function generateNewPuzzle() {
  if (!gameState.gameActive) return;
  
  gameState.isGenerating = true;
  
  const totalTiles = settings.gridSize * settings.gridSize;
  const tileCount = totalTiles - 1;
  
  let values = generateUniqueFractions(tileCount);
  
  // Ensure we have exactly tileCount values
  while (values.length < tileCount) {
    const newVal = 0.1 + (values.length * 0.8 / tileCount);
    values.push(newVal);
  }
  
  // Take only needed count and sort
  values = values.slice(0, tileCount);
  values.sort((a, b) => a - b);
  gameState.tiles = values;
  
  if (sliderGrid) {
    sliderGrid.setAttribute('data-size', settings.gridSize);
    sliderGrid.style.gridTemplateColumns = `repeat(${settings.gridSize}, 1fr)`;
  }
  
  // Initialize positions (solved state)
  gameState.positions = new Array(totalTiles);
  for (let i = 0; i < tileCount; i++) {
    gameState.positions[i] = i;
  }
  gameState.emptyIndex = totalTiles - 1;
  gameState.positions[gameState.emptyIndex] = -1;
  
  // Apply arrangement order
  if (settings.arrange === 'descending') {
    const nonEmpty = gameState.positions.filter(idx => idx !== -1);
    nonEmpty.sort((a, b) => gameState.tiles[b] - gameState.tiles[a]);
    let idx = 0;
    for (let i = 0; i < gameState.positions.length; i++) {
      if (gameState.positions[i] !== -1) {
        gameState.positions[i] = nonEmpty[idx++];
      }
    }
  }
  
  // Shuffle the puzzle
  performShuffle();
  
  gameState.moves = 0;
  gameState.isGenerating = false;
  
  updateStats();
  renderGrid();
}

function performShuffle() {
  const gridSize = settings.gridSize;
  let emptyPos = gameState.emptyIndex;
  
  if (!gameState.positions || gameState.positions.length === 0) return;
  
  // More shuffles for larger grids
  const shuffleCount = gridSize === 2 ? 100 : (gridSize === 3 ? 150 : 200);
  
  for (let i = 0; i < shuffleCount; i++) {
    const emptyRow = Math.floor(emptyPos / gridSize);
    const emptyCol = emptyPos % gridSize;
    
    const neighbors = [];
    if (emptyRow > 0) neighbors.push(emptyPos - gridSize);
    if (emptyRow < gridSize - 1) neighbors.push(emptyPos + gridSize);
    if (emptyCol > 0) neighbors.push(emptyPos - 1);
    if (emptyCol < gridSize - 1) neighbors.push(emptyPos + 1);
    
    if (neighbors.length === 0) continue;
    
    const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
    
    // Swap
    gameState.positions[emptyPos] = gameState.positions[randomNeighbor];
    gameState.positions[randomNeighbor] = -1;
    emptyPos = randomNeighbor;
  }
  
  gameState.emptyIndex = emptyPos;
}

function closeGameModal() {
  if (gameState.winTimeout) {
    clearTimeout(gameState.winTimeout);
    gameState.winTimeout = null;
  }
  
  document.getElementById('game-modal').classList.remove('active');
  document.body.style.overflow = '';
  gameState.gameActive = false;
  gameState.isGenerating = false;
}

function shuffleTiles() {
  if (!gameState.gameActive || gameState.isGenerating) return;
  
  performShuffle();
  gameState.moves = 0;
  updateStats();
  renderGrid();
  
  gameFeedback.className = 'gp-feedback-box';
  gameFeedback.textContent = `Tiles shuffled. Arrange in ${settings.arrange} order.`;
}

function resetGame() {
  if (!gameState.gameActive || gameState.isGenerating) return;
  
  const totalCells = settings.gridSize * settings.gridSize;
  const tileCount = totalCells - 1;
  
  gameState.positions = new Array(totalCells);
  for (let i = 0; i < tileCount; i++) {
    gameState.positions[i] = i;
  }
  gameState.emptyIndex = totalCells - 1;
  gameState.positions[gameState.emptyIndex] = -1;
  
  if (settings.arrange === 'descending') {
    const nonEmpty = gameState.positions.filter(idx => idx !== -1);
    nonEmpty.sort((a, b) => gameState.tiles[b] - gameState.tiles[a]);
    let idx = 0;
    for (let i = 0; i < gameState.positions.length; i++) {
      if (gameState.positions[i] !== -1) {
        gameState.positions[i] = nonEmpty[idx++];
      }
    }
  }
  
  gameState.moves = 0;
  updateStats();
  renderGrid();
  
  gameFeedback.className = 'gp-feedback-box';
  gameFeedback.textContent = `Game reset. Arrange tiles in ${settings.arrange} order.`;
}

// ---------- RENDERING ----------
function getTileColor(value) {
  if (value === undefined || value === null) return '#e5ddd1';
  const key = value.toFixed(4);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash = hash & hash;
  }
  return TILE_COLORS[Math.abs(hash) % TILE_COLORS.length];
}

function renderGrid() {
  if (!gameState.gameActive || !sliderGrid || gameState.isGenerating) return;
  if (!gameState.positions || gameState.positions.length === 0) return;
  
  const mode = MODES[settings.mode];
  let html = '';
  
  for (let i = 0; i < gameState.positions.length; i++) {
    const tileIndex = gameState.positions[i];
    const isEmpty = (tileIndex === -1);
    
    if (isEmpty) {
      html += `<div class="slider-tile empty" data-index="${i}"></div>`;
    } else {
      const value = gameState.tiles[tileIndex];
      if (value === undefined) continue;
      
      const displayValue = mode.format(value);
      const fillColor = getTileColor(value);
      const fraction = decimalToFraction(value);
      
      html += `<div class="slider-tile" data-index="${i}" data-value="${value}" onclick="handleTileClick(${i})">`;
      html += '<div class="tile-content">';
      html += '<div class="tile-visual">';
      
      if (settings.type === 'bars') {
        html += renderBarSVG(value, fillColor, fraction.den);
      } else if (settings.type === 'circles') {
        html += renderCircleSVG(value, fillColor, fraction.den);
      } else {
        html += `<div class="tile-number">${displayValue}</div>`;
      }
      
      html += '</div>';
      
      if (settings.showValues && settings.type !== 'numbers') {
        html += `<div class="tile-label">${displayValue}</div>`;
      }
      
      html += '</div></div>';
    }
  }
  
  sliderGrid.innerHTML = html;
  if (modalMoves) {
    modalMoves.textContent = `${gameState.moves} ${gameState.moves === 1 ? 'move' : 'moves'}`;
  }
  checkWinCondition();
}

function renderBarSVG(value, fillColor, denominator) {
  const percent = Math.round(value * 100);
  const shadedWidth = percent * 0.9;
  
  let splitLines = '';
  if (settings.showSplitLines && denominator > 1) {
    const partWidth = 90 / denominator;
    for (let i = 1; i < denominator; i++) {
      const x = 5 + (i * partWidth);
      splitLines += `<line x1="${x}" y1="10" x2="${x}" y2="50" stroke="#1a1a1a" stroke-width="2" />`;
    }
  }
  
  const outline = `<rect x="5" y="10" width="90" height="40" fill="none" stroke="#1a1a1a" stroke-width="2.5" />`;
  
  return `
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
      <rect x="5" y="10" width="90" height="40" fill="#e5ddd1" />
      <rect x="5" y="10" width="${shadedWidth}" height="40" fill="${fillColor}" />
      ${splitLines}
      ${outline}
    </svg>
  `;
}

function renderCircleSVG(value, fillColor, denominator) {
  const angle = value * 360;
  const largeArc = angle > 180 ? 1 : 0;
  const endX = 50 + 40 * Math.cos((angle - 90) * Math.PI / 180);
  const endY = 50 + 40 * Math.sin((angle - 90) * Math.PI / 180);
  
  let splitLines = '';
  if (settings.showSplitLines && denominator > 1) {
    const sectorAngle = 360 / denominator;
    for (let i = 1; i < denominator; i++) {
      const lineAngle = (i * sectorAngle - 90) * Math.PI / 180;
      const x = 50 + 40 * Math.cos(lineAngle);
      const y = 50 + 40 * Math.sin(lineAngle);
      splitLines += `<line x1="50" y1="50" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#1a1a1a" stroke-width="1.5" />`;
    }
  }
  
  const outline = `<circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a1a" stroke-width="2.5" />`;
  const shadedSector = `<path d="M 50 50 L 50 10 A 40 40 0 ${largeArc} 1 ${endX.toFixed(1)} ${endY.toFixed(1)} Z" fill="${fillColor}" />`;
  
  return `
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <circle cx="50" cy="50" r="40" fill="#e5ddd1" />
      ${shadedSector}
      ${splitLines}
      ${outline}
    </svg>
  `;
}

// ---------- GAMEPLAY ----------
function handleTileClick(index) {
  if (!gameState.gameActive || gameState.isGenerating) return;
  if (!gameState.positions) return;
  
  const gridSize = settings.gridSize;
  const emptyPos = gameState.emptyIndex;
  
  if (emptyPos === undefined || emptyPos === -1) return;
  
  const clickedRow = Math.floor(index / gridSize);
  const clickedCol = index % gridSize;
  const emptyRow = Math.floor(emptyPos / gridSize);
  const emptyCol = emptyPos % gridSize;
  
  const isAdjacent = (Math.abs(clickedRow - emptyRow) + Math.abs(clickedCol - emptyCol)) === 1;
  
  if (isAdjacent && gameState.positions[index] !== -1) {
    // Swap with empty space
    gameState.positions[emptyPos] = gameState.positions[index];
    gameState.positions[index] = -1;
    gameState.emptyIndex = index;
    
    gameState.moves++;
    updateStats();
    renderGrid();
    
    if (gameState.gameActive) {
      gameFeedback.textContent = `Move ${gameState.moves}. Keep going!`;
    }
  } else if (gameState.positions[index] === -1) {
    gameFeedback.textContent = 'Click a numbered tile next to the empty space.';
  } else {
    gameFeedback.textContent = 'Only tiles next to the empty space can move.';
  }
}

function checkWinCondition() {
  if (!gameState.gameActive || gameState.isGenerating) return;
  if (!gameState.positions || gameState.tiles.length === 0) return;
  
  const nonEmptyPositions = gameState.positions.filter(idx => idx !== -1);
  const tileValues = nonEmptyPositions.map(idx => gameState.tiles[idx]);
  
  if (tileValues.length === 0) return;
  
  let isSorted = true;
  for (let i = 1; i < tileValues.length; i++) {
    if (settings.arrange === 'ascending') {
      if (tileValues[i] < tileValues[i - 1]) { isSorted = false; break; }
    } else {
      if (tileValues[i] > tileValues[i - 1]) { isSorted = false; break; }
    }
  }
  
  const totalCells = settings.gridSize * settings.gridSize;
  const isEmptyAtEnd = (gameState.emptyIndex === totalCells - 1);
  
  if (isSorted && isEmptyAtEnd) {
    gameState.solved++;
    gameState.isGenerating = true;
    updateStats();
    
    gameFeedback.className = 'gp-feedback-box success';
    gameFeedback.textContent = `Puzzle ${gameState.solved} solved in ${gameState.moves} moves! Next puzzle...`;
    
    if (gameState.winTimeout) {
      clearTimeout(gameState.winTimeout);
    }
    
    gameState.winTimeout = setTimeout(() => {
      if (gameState.gameActive) {
        generateNewPuzzle();
        gameFeedback.className = 'gp-feedback-box';
        gameFeedback.textContent = `Puzzle ${gameState.solved + 1}: Arrange tiles in ${settings.arrange} order.`;
        gameState.winTimeout = null;
      }
    }, 800);
  }
}

// ---------- STATS ----------
function updateStats() {
  if (movesStat) movesStat.textContent = gameState.moves;
  if (solvedStat) solvedStat.textContent = gameState.solved;
  if (modalMoves) {
    modalMoves.textContent = `${gameState.moves} ${gameState.moves === 1 ? 'move' : 'moves'}`;
  }
}

// ---------- EXPOSE TO GLOBAL ----------
window.toggleDropdown = toggleDropdown;
window.openGameModal = openGameModal;
window.closeGameModal = closeGameModal;
window.shuffleTiles = shuffleTiles;
window.resetGame = resetGame;
window.handleTileClick = handleTileClick;

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('ticker-track');
  if (track && track.children.length === 0) {
    const words = ['Slider Game', 'Classic Puzzle', 'Fractions · Percents', 'Ascending · Descending', 'Bars · Circles · Numbers', 'Prep Portal 2026'];
    [...words, ...words].forEach(t => {
      const s = document.createElement('span');
      s.className = 'ticker-item';
      s.textContent = t;
      track.appendChild(s);
    });
  }
  
  const showValuesCheck = document.getElementById('show-values');
  if (showValuesCheck) {
    showValuesCheck.addEventListener('change', (e) => {
      settings.showValues = e.target.checked;
      const modalCheck = document.getElementById('show-values-modal');
      if (modalCheck) modalCheck.checked = e.target.checked;
    });
  }
  
  const showSplitLinesCheck = document.getElementById('show-split-lines');
  if (showSplitLinesCheck) {
    showSplitLinesCheck.addEventListener('change', (e) => {
      settings.showSplitLines = e.target.checked;
    });
  }
  
  settings.gridSize = 2;
  settings.mode = 'fraction';
  settings.type = 'bars';
  settings.arrange = 'ascending';
  settings.showValues = true;
  settings.showSplitLines = true;
  settings.fractionType = 'mixed';
});