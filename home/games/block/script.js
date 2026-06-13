const canvas = document.getElementById('game-board');
const arrangementsCanvas = document.getElementById('arrangements-canvas');
const ctx = canvas.getContext('2d');
const arrCtx = arrangementsCanvas.getContext('2d');

const blockSize = 40;
const miniBlockSize = 20;
const cols = Math.floor(canvas.width / blockSize);
const rows = Math.floor(canvas.height / blockSize);

let baseSpeed = 1000;
let currentSpeed = baseSpeed;
const speedIncrease = 50;
const minSpeed = 100;
let level = 1;
let score = 0;
let elapsedSeconds = 0;
let speedTimer = null;
let board = Array(rows).fill().map(() => Array(cols).fill(0));
let currentPiece = null;
let nextPiece = null;
let gameOver = false;

let keyState = {};
let buttonIntervals = {};

// ── Colors for polyominoes ────────────────────────────────────
const colors = [
  '#ffe600', // yellow
  '#0047ff', // blue
  '#00c04b', // green
  '#e5000a', // red
  '#ff6b35', // orange
  '#9b5de5', // purple
  '#00b4d8', // teal
  '#f72585', // pink
  '#06d6a0', // mint
  '#1a1a1a', // ink/black
  '#ff9f1c', // amber
  '#ff006e', // hot pink
  '#8338ec', // violet
  '#3a86ff', // light blue
  '#fb5607', // dark orange
];

// ── Polyomino Generation ──────────────────────────────────────
function generatePolyominoes(maxSize) {
  const all = {};
  
  // Start with monomino (1 block)
  all[1] = [[[0, 0]]];
  
  for (let n = 2; n <= maxSize; n++) {
    const seen = new Set();
    const newShapes = [];
    
    for (const shape of all[n - 1]) {
      for (const [x, y] of shape) {
        const neighbors = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
        for (const [nx, ny] of neighbors) {
          if (!shape.some(([sx, sy]) => sx === nx && sy === ny)) {
            const newShape = [...shape, [nx, ny]];
            const canonical = canonicalize(newShape);
            const key = canonical.map(p => `${p[0]},${p[1]}`).sort().join('|');
            
            if (!seen.has(key)) {
              seen.add(key);
              newShapes.push(canonical);
            }
          }
        }
      }
    }
    all[n] = newShapes;
  }
  
  return all;
}

function canonicalize(shape) {
  // Normalize shape to origin and sort
  const minX = Math.min(...shape.map(p => p[0]));
  const minY = Math.min(...shape.map(p => p[1]));
  const normalized = shape.map(([x, y]) => [x - minX, y - minY]);
  
  // Generate all rotations and reflections
  const transformations = [];
  const seen = new Set();
  
  for (let rot = 0; rot < 4; rot++) {
    for (let reflect = 0; reflect < 2; reflect++) {
      let transformed = normalized.map(([x, y]) => {
        let [rx, ry] = [x, y];
        // Rotate
        for (let i = 0; i < rot; i++) {
          [rx, ry] = [-ry, rx];
        }
        // Reflect
        if (reflect) [rx, ry] = [-rx, ry];
        return [rx, ry];
      });
      
      // Normalize to origin
      const tMinX = Math.min(...transformed.map(p => p[0]));
      const tMinY = Math.min(...transformed.map(p => p[1]));
      transformed = transformed.map(([x, y]) => [x - tMinX, y - tMinY]);
      
      // Sort
      transformed.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      
      const key = transformed.map(p => `${p[0]},${p[1]}`).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        transformations.push(transformed);
      }
    }
  }
  
  // Return the canonical form (first sorted key)
  return transformations.sort((a, b) => {
    const keyA = a.map(p => `${p[0]},${p[1]}`).join('|');
    const keyB = b.map(p => `${p[0]},${p[1]}`).join('|');
    return keyA.localeCompare(keyB);
  })[0];
}

function shapeToArrangements(shape) {
  const arrangements = [];
  const canonical = canonicalize(shape);
  
  const transformations = [];
  const seen = new Set();
  
  for (let rot = 0; rot < 4; rot++) {
    for (let reflect = 0; reflect < 2; reflect++) {
      let transformed = canonical.map(([x, y]) => {
        let [rx, ry] = [x, y];
        for (let i = 0; i < rot; i++) {
          [rx, ry] = [-ry, rx];
        }
        if (reflect) [rx, ry] = [-rx, ry];
        return [rx, ry];
      });
      
      const tMinX = Math.min(...transformed.map(p => p[0]));
      const tMinY = Math.min(...transformed.map(p => p[1]));
      transformed = transformed.map(([x, y]) => [x - tMinX, y - tMinY]);
      
      const width = Math.max(...transformed.map(p => p[0])) + 1;
      const height = Math.max(...transformed.map(p => p[1])) + 1;
      
      // Create grid representation
      const grid = Array(height).fill().map(() => Array(width).fill(false));
      for (const [x, y] of transformed) {
        grid[y][x] = true;
      }
      
      const key = grid.map(row => row.map(c => c ? '1' : '0').join('')).join('-');
      if (!seen.has(key)) {
        seen.add(key);
        arrangements.push({ grid, width, height });
      }
    }
  }
  
  return arrangements;
}

// ── Neobrutalist block renderer ──────────────────────────────
function drawNeoBlock(context, x, y, w, h, color, border = '#1a1a1a') {
  context.fillStyle = color;
  context.fillRect(x, y, w, h);
  context.strokeStyle = border;
  context.lineWidth = 2;
  context.strokeRect(x + 1, y + 1, w - 2, h - 2);
  context.fillStyle = 'rgba(26,26,26,0.35)';
  context.fillRect(x + w, y + 3, 3, h);
  context.fillRect(x + 3, y + h, w, 3);
}

function drawMiniNeoBlock(context, x, y, w, h, color) {
  context.fillStyle = color;
  context.fillRect(x, y, w, h);
  context.strokeStyle = '#1a1a1a';
  context.lineWidth = 1;
  context.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

class Piece {
  constructor(shape) {
    this.shape = shape;
    this.arrangementIndex = 0;
    this.arrangement = shape.arrangements[0];
    this.color = shape.color;
    this.x = Math.floor(cols / 2) - Math.floor(this.arrangement.width / 2);
    this.y = -this.arrangement.height;
  }

  draw() {
    const { grid, width, height } = this.arrangement;
    
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (grid[row][col]) {
          const blockY = this.y + row;
          if (blockY >= 0) {
            drawNeoBlock(
              ctx,
              (this.x + col) * blockSize + 1,
              blockY * blockSize + 1,
              blockSize - 2,
              blockSize - 2,
              this.color
            );
          }
        }
      }
    }

    // Draw bounding box outline
    if (this.y >= 0) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(
        this.x * blockSize + 1,
        this.y * blockSize + 1,
        width * blockSize - 2,
        height * blockSize - 2
      );
      ctx.setLineDash([]);
    }

    // Labels
    const visibleTop = Math.max(this.y, 0);
    if (visibleTop < this.y + height) {
      const piecePixelX = this.x * blockSize;
      const piecePixelY = this.y * blockSize;
      const piecePixelW = width * blockSize;
      const piecePixelH = height * blockSize;
      const centerX = piecePixelX + piecePixelW / 2;
      const centerY = piecePixelY + piecePixelH / 2;

      // Area number
      const areaText = String(this.shape.size);
      const areaSize = Math.min(piecePixelW, piecePixelH) * 0.5;
      const isDark = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 < 128;
      };
      const textColor = isDark(this.color) ? '#ffffff' : '#1a1a1a';
      
      ctx.font = `900 ${Math.max(14, areaSize)}px "Unbounded", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isDark(this.color) ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)';
      ctx.fillText(areaText, centerX + 2, centerY + 2);
      ctx.fillStyle = textColor;
      ctx.fillText(areaText, centerX, centerY);

      // Dimension badges
      const drawBlockSizedBadge = (text, x, y) => {
        drawNeoBlock(ctx, x + 1, y + 1, blockSize - 2, blockSize - 2, '#ffe600');
        ctx.font = `700 ${blockSize * 0.4}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(text, x + blockSize / 2, y + blockSize / 2);
      };

      // Width badge
      const widthBadgeX = piecePixelX + (piecePixelW - blockSize) / 2;
      const widthBadgeY = piecePixelY - blockSize - 4;
      if (widthBadgeY >= 0) {
        drawBlockSizedBadge(String(width), widthBadgeX, widthBadgeY);
      }

      // Height badge
      const rightX = piecePixelX + piecePixelW + 4;
      const leftX = piecePixelX - blockSize - 4;
      const sideBadgeY = piecePixelY + (piecePixelH - blockSize) / 2;
      
      if (rightX + blockSize <= canvas.width) {
        drawBlockSizedBadge(String(height), rightX, sideBadgeY);
      } else if (leftX >= 0) {
        drawBlockSizedBadge(String(height), leftX, sideBadgeY);
      }
    }

    this.drawArrangements();
  }

  drawArrangements() {
    arrCtx.fillStyle = '#f5f0e8';
    arrCtx.fillRect(0, 0, arrangementsCanvas.width, arrangementsCanvas.height);

    const arrangements = this.shape.arrangements;
    const padding = 16;
    let currentX = padding;

    arrangements.forEach((arr, index) => {
      const { grid, width, height } = arr;
      const isCurrent = index === this.arrangementIndex;
      const bw = width * miniBlockSize;
      const bh = height * miniBlockSize;

      if (isCurrent) {
        arrCtx.fillStyle = '#ffe600';
        arrCtx.fillRect(currentX - 4, padding - 4, bw + 8, bh + 8);
        arrCtx.strokeStyle = '#1a1a1a';
        arrCtx.lineWidth = 2;
        arrCtx.strokeRect(currentX - 4, padding - 4, bw + 8, bh + 8);
      }

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          if (grid[row][col]) {
            drawMiniNeoBlock(
              arrCtx,
              currentX + col * miniBlockSize,
              padding + row * miniBlockSize,
              miniBlockSize - 1,
              miniBlockSize - 1,
              this.color
            );
          }
        }
      }

      arrCtx.fillStyle = '#1a1a1a';
      arrCtx.font = `700 12px "JetBrains Mono", monospace`;
      arrCtx.fillText(`${width}×${height}`, currentX, padding + bh + 16);

      currentX += bw + padding * 2;
    });

    document.getElementById('current-arrangement').textContent =
      `Arrangement ${this.arrangementIndex + 1} / ${arrangements.length}`;
  }

  canMove(dx, dy) {
    const { grid, width, height } = this.arrangement;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (grid[row][col]) {
          const newX = this.x + col + dx;
          const newY = this.y + row + dy;
          if (newX < 0 || newX >= cols || newY >= rows ||
            (newY >= 0 && board[newY][newX])) return false;
        }
      }
    }
    return true;
  }

  changeArrangement(delta) {
    const arrangements = this.shape.arrangements;
    this.arrangementIndex = (this.arrangementIndex + delta + arrangements.length) % arrangements.length;
    const { width } = arrangements[this.arrangementIndex];
    this.x = Math.max(0, Math.min(this.x, cols - width));
    const { width: nw, height: nh } = arrangements[this.arrangementIndex];
    if (this.canFit(nw, nh)) this.arrangement = arrangements[this.arrangementIndex];
  }

  canFit(width, height) {
    const { grid } = this.arrangement;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (grid[row][col]) {
          const nx = this.x + col;
          const ny = this.y + row;
          if (nx < 0 || nx >= cols || ny >= rows || (ny >= 0 && board[ny][nx])) return false;
        }
      }
    }
    return true;
  }
}

// ── Build all polyomino shapes ────────────────────────────────
const shapes = [];
const allPolyominoes = generatePolyominoes(5); // Up to pentominoes

for (let size = 3; size <= 5; size++) {
  const pieces = allPolyominoes[size];
  pieces.forEach((piece, i) => {
    shapes.push({
      size,
      shape: piece,
      arrangements: shapeToArrangements(piece),
      color: colors[(size * 10 + i) % colors.length],
    });
  });
}

function drawBoard() {
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(26, 26, 26, 0.07)';
  ctx.lineWidth = 1;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.strokeRect(col * blockSize, row * blockSize, blockSize, blockSize);
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col]) {
        drawNeoBlock(
          ctx,
          col * blockSize + 1,
          row * blockSize + 1,
          blockSize - 2,
          blockSize - 2,
          board[row][col]
        );
      }
    }
  }

  if (currentPiece) currentPiece.draw();
}

function createNewPiece() {
  return new Piece(shapes[Math.floor(Math.random() * shapes.length)]);
}

function updateSpeed() {
  const scoreLevel = Math.floor(score / 1000);
  const timeLevel = Math.floor(elapsedSeconds / 15);
  level = scoreLevel + timeLevel + 1;
  currentSpeed = Math.max(minSpeed, baseSpeed - (level - 1) * speedIncrease);
}

function startSpeedTimer() {
  stopSpeedTimer();
  speedTimer = setInterval(() => {
    if (gameOver) { stopSpeedTimer(); return; }
    elapsedSeconds++;
    updateSpeed();
  }, 1000);
}

function stopSpeedTimer() {
  if (speedTimer) { clearInterval(speedTimer); speedTimer = null; }
}

function checkLines() {
  let linesCleared = 0;
  for (let row = rows - 1; row >= 0; row--) {
    if (board[row].every(cell => cell !== 0)) {
      board.splice(row, 1);
      board.unshift(Array(cols).fill(0));
      linesCleared++;
      score += 100;
    }
  }
  if (linesCleared > 0) {
    document.getElementById('score').textContent = `Score: ${score}`;
    level = Math.floor(score / 1000) + 1;
    updateSpeed();
  }
}

function lockPiece() {
  const { grid, width, height } = currentPiece.arrangement;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (grid[row][col] && currentPiece.y + row >= 0) {
        board[currentPiece.y + row][currentPiece.x + col] = currentPiece.color;
      }
    }
  }
  checkLines();
  currentPiece = nextPiece;
  nextPiece = createNewPiece();
  if (!currentPiece.canMove(0, 0)) {
    gameOver = true;
    stopSpeedTimer();
    alert(`Game Over! Final Score: ${score}`);
  }
}

function gameLoop() {
  if (!gameOver) {
    if (currentPiece.canMove(0, 1)) {
      currentPiece.y++;
    } else {
      lockPiece();
    }
    drawBoard();
    setTimeout(gameLoop, currentSpeed);
  }
}

// ── Overlay controls ──────────────────────────────────────────
function initOverlayControls() {
  ['up', 'left', 'right', 'down', 'rotate', 'm-plus', 'm-minus'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('mousedown', e => { e.preventDefault(); startContinuousAction(id); });
    btn.addEventListener('touchstart', e => { e.preventDefault(); startContinuousAction(id); });
    btn.addEventListener('mouseup', e => { e.preventDefault(); stopContinuousAction(id); });
    btn.addEventListener('mouseleave', e => { e.preventDefault(); stopContinuousAction(id); });
    btn.addEventListener('touchend', e => { e.preventDefault(); stopContinuousAction(id); });
    btn.addEventListener('touchcancel', e => { e.preventDefault(); stopContinuousAction(id); });
  });
}

function startContinuousAction(id) {
  if (gameOver || !currentPiece) return;
  if (buttonIntervals[id]) clearInterval(buttonIntervals[id]);
  handleOverlayButton(id);
  buttonIntervals[id] = setInterval(() => {
    if (gameOver || !currentPiece) { stopContinuousAction(id); return; }
    handleOverlayButton(id);
  }, 100);
}

function stopContinuousAction(id) {
  if (buttonIntervals[id]) { clearInterval(buttonIntervals[id]); buttonIntervals[id] = null; }
}

function handleOverlayButton(id) {
  if (gameOver || !currentPiece) return;
  switch (id) {
    case 'up': case 'rotate': currentPiece.changeArrangement(1); break;
    case 'left': if (currentPiece.canMove(-1, 0)) currentPiece.x--; break;
    case 'right': if (currentPiece.canMove(1, 0)) currentPiece.x++; break;
    case 'down': if (currentPiece.canMove(0, 1)) currentPiece.y++; break;
    case 'm-plus': currentPiece.changeArrangement(1); break;
    case 'm-minus': currentPiece.changeArrangement(-1); break;
  }
  drawBoard();
}

// ── Keyboard controls ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (gameOver || !currentPiece) return;
  if (keyState[e.key]) return;
  keyState[e.key] = true;
  switch (e.key) {
    case 'ArrowLeft': startContinuousKeyAction('ArrowLeft'); break;
    case 'ArrowRight': startContinuousKeyAction('ArrowRight'); break;
    case 'ArrowDown': startContinuousKeyAction('ArrowDown'); break;
    case ' ': case 'r': currentPiece.changeArrangement(1); break;
    case 'm': currentPiece.changeArrangement(-1); break;
  }
  drawBoard();
});

document.addEventListener('keyup', e => {
  keyState[e.key] = false;
  stopContinuousKeyAction(e.key);
});

function startContinuousKeyAction(key) {
  if (gameOver || !currentPiece) return;
  if (buttonIntervals[key]) clearInterval(buttonIntervals[key]);
  handleKeyAction(key);
  buttonIntervals[key] = setInterval(() => {
    if (gameOver || !currentPiece || !keyState[key]) { stopContinuousKeyAction(key); return; }
    handleKeyAction(key);
  }, 100);
}

function stopContinuousKeyAction(key) {
  if (buttonIntervals[key]) { clearInterval(buttonIntervals[key]); buttonIntervals[key] = null; }
}

function handleKeyAction(key) {
  switch (key) {
    case 'ArrowLeft': if (currentPiece.canMove(-1, 0)) currentPiece.x--; break;
    case 'ArrowRight': if (currentPiece.canMove(1, 0)) currentPiece.x++; break;
    case 'ArrowDown': if (currentPiece.canMove(0, 1)) currentPiece.y++; break;
  }
  drawBoard();
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initOverlayControls();
  nextPiece = createNewPiece();
  currentPiece = createNewPiece();
  startSpeedTimer();
  gameLoop();
});