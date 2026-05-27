import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas2D = document.getElementById('game-board');
const canvas3DContainer = document.getElementById('game-board-3d');
const arrangementsCanvas = document.getElementById('arrangements-canvas');
const ctx = canvas2D.getContext('2d');
const arrCtx = arrangementsCanvas.getContext('2d');

// 15x20 Grid Setup
const cols = 15;
const rows = 20;
const depth = 15;
const blockSize = canvas2D.width / cols; // 450 / 15 = 30px
const miniBlockSize = 15;

let baseSpeed = 1000;
let currentSpeed = baseSpeed;
const speedIncrease = 50;
const minSpeed = 100;
let level = 1;
let score = 0;
let elapsedSeconds = 0;
let speedTimer = null;

// Boards
let board2D = Array(rows).fill().map(() => Array(cols).fill(0));
let board3D = Array(rows).fill().map(() => Array(depth).fill().map(() => Array(cols).fill(0)));

let currentPiece = null;
let nextPiece = null;

// Game States
let gameOver = false;
let isPaused = false;
let lockedPiecesCount = 0;

// Settings States
let renderMode = 'single'; // 'single' | 'merged'
let dimensionMode = '2d'; // '2d' | '3d'
let shapeTypeMode = 'regular'; // 'regular' | 'irregular'

let keyState = {};
let buttonIntervals = {};

// Three.js Globals
let scene, camera, renderer, orbitControls, blocks3DGroup;

// ── Prep Portal block palette ────────────────────────────────
const colors = [
  '#ffe600', '#0047ff', '#00c04b', '#e5000a', '#ff6b35',
  '#9b5de5', '#00b4d8', '#f72585', '#06d6a0', '#1a1a1a', '#ff9f1c',
];

const shapes = [];

function isPrime(num) {
  if (num < 2) return false;
  for (let i = 2; i <= Math.sqrt(num); i++)
    if (num % i === 0) return false;
  return true;
}

// ── Geometry Engine (Polyominoes & Polycubes) ────────────────
function normalizeBlocks(blocks) {
  let minX = Math.min(...blocks.map(b => b.x));
  let minY = Math.min(...blocks.map(b => b.y));
  let minZ = Math.min(...blocks.map(b => b.z));
  let norm = blocks.map(b => ({ x: b.x - minX, y: b.y - minY, z: b.z - minZ }));
  norm.sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z);
  return norm;
}

function rotate2D(blocks) {
  return normalizeBlocks(blocks.map(b => ({ x: -b.y, y: b.x, z: b.z })));
}

function rotate3D_X(blocks) { return normalizeBlocks(blocks.map(b => ({ x: b.x, y: -b.z, z: b.y }))); }

function rotate3D_Y(blocks) { return normalizeBlocks(blocks.map(b => ({ x: b.z, y: b.y, z: -b.x }))); }

function rotate3D_Z(blocks) { return normalizeBlocks(blocks.map(b => ({ x: -b.y, y: b.x, z: b.z }))); }

function getUniqueArrangements(baseBlocks, is3D) {
  const arrs = [];
  const sigs = new Set();
  
  function addIfUnique(blocks) {
    const norm = normalizeBlocks(blocks);
    const sig = norm.map(b => `${b.x},${b.y},${b.z}`).join('|');
    if (!sigs.has(sig)) {
      sigs.add(sig);
      arrs.push({
        w: Math.max(...norm.map(b => b.x)) + 1,
        h: Math.max(...norm.map(b => b.y)) + 1,
        d: Math.max(...norm.map(b => b.z)) + 1,
        blocks: norm
      });
    }
  }
  
  let current = baseBlocks;
  if (!is3D) {
    for (let i = 0; i < 4; i++) {
      addIfUnique(current);
      current = rotate2D(current);
    }
  } else {
    for (let rx = 0; rx < 4; rx++) {
      for (let ry = 0; ry < 4; ry++) {
        for (let rz = 0; rz < 4; rz++) {
          addIfUnique(current);
          current = rotate3D_Z(current);
        }
        current = rotate3D_Y(current);
      }
      current = rotate3D_X(current);
    }
  }
  return arrs;
}

function getRegArrs(val, is3D) {
  const baseBlocksSets = [];
  if (!is3D) {
    for (let w = 1; w <= val; w++) {
      if (val % w === 0) {
        let blocks = [];
        for (let x = 0; x < w; x++)
          for (let y = 0; y < (val / w); y++) blocks.push({ x, y, z: 0 });
        baseBlocksSets.push(blocks);
      }
    }
  } else {
    for (let w = 1; w <= val; w++) {
      for (let h = 1; h <= val; h++) {
        if (val % (w * h) === 0) {
          let blocks = [];
          for (let x = 0; x < w; x++)
            for (let y = 0; y < h; y++)
              for (let z = 0; z < (val / (w * h)); z++) blocks.push({ x, y, z });
          baseBlocksSets.push(blocks);
        }
      }
    }
  }
  
  let allUnique = [];
  baseBlocksSets.forEach(bs => {
    getUniqueArrangements(bs, is3D).forEach(arr => {
      if (!allUnique.some(u => JSON.stringify(u.blocks) === JSON.stringify(arr.blocks))) allUnique.push(arr);
    });
  });
  return allUnique;
}

function strToBlocks(str) {
  let blocks = [];
  str.trim().split('\n').forEach((line, y) => {
    [...line.trim()].forEach((char, x) => {
      if (char !== '.') blocks.push({ x, y, z: 0 });
    });
  });
  return normalizeBlocks(blocks);
}

function make3DIrreg(blocks, vol) {
  let b3d = JSON.parse(JSON.stringify(blocks));
  let needed = vol - b3d.length;
  let i = 0;
  while (needed > 0 && i < b3d.length) {
    b3d.push({ x: b3d[i].x, y: b3d[i].y, z: b3d[i].z + 1 });
    needed--;
    i++;
  }
  return normalizeBlocks(b3d);
}


const baseIrreg2D = {
  2: strToBlocks(`##`),
  3: strToBlocks(`##\n#.`), // V
  4: strToBlocks(`###\n.#.`), // T
  5: strToBlocks(`##.\n.##\n..#`), // W
  6: strToBlocks(`###\n#..\n#..`) // Corner
};

// Build all shapes (Values 2 to 12)
for (let val = 2; val <= 12; val++) {
  shapes.push({
    val,
    isPrime: isPrime(val),
    color: colors[val - 2],
    regular2d: getRegArrs(val, false),
    regular3d: getRegArrs(val, true),
    irregular2d: val <= 6 ? getUniqueArrangements(baseIrreg2D[val], false) : null,
    irregular3d: val <= 6 ? getUniqueArrangements(make3DIrreg(baseIrreg2D[val], val), true) : null
  });
}


// ── 3D Initialization ─────────────────────────────────────────
function initThreeJS() {
  if (scene) return;
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#f5f0e8');
  
  const aspect = canvas3DContainer.clientWidth / canvas3DContainer.clientHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(cols * 1.5, rows * 1.2, depth * 2);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvas3DContainer.clientWidth, canvas3DContainer.clientHeight);
  canvas3DContainer.appendChild(renderer.domElement);
  
  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.target.set(cols / 2, rows / 2, depth / 2);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.05;
  
  const gridHelperBottom = new THREE.GridHelper(Math.max(cols, depth), Math.max(cols, depth), 0x1a1a1a, 0xcccccc);
  gridHelperBottom.position.set(cols / 2, 0, depth / 2);
  scene.add(gridHelperBottom);
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(cols, rows * 2, depth);
  scene.add(dirLight);
  
  blocks3DGroup = new THREE.Group();
  scene.add(blocks3DGroup);
  
  // Pure red ceiling plane for game over
  const ceilingGeo = new THREE.PlaneGeometry(cols + 2, depth + 2);
  const ceilingMat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7
  });
  const ceilingPlane = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceilingPlane.rotation.x = -Math.PI / 2;
  ceilingPlane.position.set(cols / 2, rows, depth / 2);
  ceilingPlane.name = 'ceilingGrid';
  ceilingPlane.visible = false;
  scene.add(ceilingPlane);
  
  window.addEventListener('resize', () => {
    if (dimensionMode === '3d' && canvas3DContainer.clientWidth) {
      camera.aspect = canvas3DContainer.clientWidth / canvas3DContainer.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas3DContainer.clientWidth, canvas3DContainer.clientHeight);
    }
  });
  
  animate3D();
}

function animate3D() {
  requestAnimationFrame(animate3D);
  if (dimensionMode === '3d') {
    orbitControls.update();
    renderer.render(scene, camera);
  }
}

// ── Shared NeoBrutalist Utils ────────────────────────────────
function drawNeoBlock(context, x, y, w, h, color) {
  context.fillStyle = color;
  context.fillRect(x, y, w, h);
  context.strokeStyle = '#1a1a1a';
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

function createMesh3D(color, w, h, d, px, py, pz, isPrime) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshToonMaterial({ color: color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(px + w / 2, py + h / 2, pz + d / 2);
  
  const edges = new THREE.EdgesGeometry(geo);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x1a1a1a });
  const line = new THREE.LineSegments(edges, lineMat);
  mesh.add(line);
  
  if (isPrime) {
    const wireGeo = new THREE.WireframeGeometry(geo);
    const wireMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.2, gapSize: 0.1 });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    wire.computeLineDistances();
    mesh.add(wire);
  }
  return mesh;
}

// ── Generic Piece Class (Handles 2D & 3D & Irregular) ────────
class Piece {
  constructor(shape) {
    this.shape = shape;
    this.color = shape.color;
    
    const modeStr = `${shapeTypeMode}${dimensionMode}`;
    this.arrangements = shape[modeStr] || shape[`regular${dimensionMode}`];
    this.arrangementIndex = 0;
    this.arrangement = this.arrangements[0];
    
    this.x = Math.floor(cols / 2) - Math.floor(this.arrangement.w / 2);
    
    if (dimensionMode === '2d') {
      this.y = -this.arrangement.h;
      this.z = 0;
    } else {
      this.y = rows;
      this.z = Math.floor(depth / 2) - Math.floor(this.arrangement.d / 2);
    }
    
    this.updatePrimeIndicator();
  }
  
  updatePrimeIndicator() {
    const el = document.getElementById('prime-indicator');
    const type = dimensionMode === '3d' ? 'Volume' : 'Area';
    el.textContent = `${type}: ${this.shape.val} (${this.shape.isPrime ? 'PRIME ★' : 'Not Prime'})`;
    el.className = this.shape.isPrime ? 'prime' : 'not-prime';
  }
  
  draw() {
    if (dimensionMode === '2d') this.draw2D();
  }
  
  draw2D() {
    if (renderMode === 'single') {
      for (let b of this.arrangement.blocks) {
        const by = this.y + b.y;
        if (by >= 0) {
          drawNeoBlock(ctx, (this.x + b.x) * blockSize + 1, by * blockSize + 1, blockSize - 2, blockSize - 2, this.color);
        }
      }
    } else {
      // Merged Mode for the Piece
      for (let b of this.arrangement.blocks) {
        const by = this.y + b.y;
        if (by >= 0) {
          ctx.fillStyle = this.color;
          ctx.fillRect((this.x + b.x) * blockSize, by * blockSize, blockSize, blockSize);
        }
      }
      
      const hasBlock = (x, y) => this.arrangement.blocks.some(bl => bl.x === x && bl.y === y);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(26,26,26,0.35)';
      
      for (let b of this.arrangement.blocks) {
        const by = this.y + b.y;
        if (by >= 0) {
          const px = (this.x + b.x) * blockSize;
          const py = by * blockSize;
          
          if (!hasBlock(b.x, b.y - 1)) { ctx.beginPath();
            ctx.moveTo(px, py + 1);
            ctx.lineTo(px + blockSize, py + 1);
            ctx.stroke(); }
          if (!hasBlock(b.x, b.y + 1)) {
            ctx.beginPath();
            ctx.moveTo(px, py + blockSize - 1);
            ctx.lineTo(px + blockSize, py + blockSize - 1);
            ctx.stroke();
            ctx.fillRect(px + 3, py + blockSize, blockSize, 3);
          }
          if (!hasBlock(b.x - 1, b.y)) { ctx.beginPath();
            ctx.moveTo(px + 1, py);
            ctx.lineTo(px + 1, py + blockSize);
            ctx.stroke(); }
          if (!hasBlock(b.x + 1, b.y)) {
            ctx.beginPath();
            ctx.moveTo(px + blockSize - 1, py);
            ctx.lineTo(px + blockSize - 1, py + blockSize);
            ctx.stroke();
            ctx.fillRect(px + blockSize, py + 3, 3, blockSize);
          }
        }
      }
    }
    
    if (this.shape.isPrime && this.y >= 0) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(this.x * blockSize + 2, this.y * blockSize + 2, this.arrangement.w * blockSize - 4, this.arrangement.h * blockSize - 4);
      ctx.setLineDash([]);
    }
    
    // Draw labels only when piece is visible
    if (this.y + this.arrangement.h > 0) {
      this.drawLabels();
    }
    
    this.drawArrangementsTray();
  }
  
  drawLabels() {
    const px = this.x * blockSize;
    const py = Math.max(0, this.y * blockSize); // Clamp to visible area
    const pw = this.arrangement.w * blockSize;
    const ph = this.arrangement.h * blockSize;
    const cx = px + pw / 2;
    const cy = py + ph / 2;
    
    const isDark = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return ((r * 299 + g * 587 + b * 114) / 1000) < 128;
    };
    
    const valText = String(this.shape.val);
    const valSize = Math.min(pw, ph) * 0.45;
    const textColor = isDark(this.color) ? '#ffffff' : '#1a1a1a';
    
    // Only draw value if piece is partially visible
    if (this.y + this.arrangement.h > 0) {
      ctx.font = `900 ${Math.max(14, valSize)}px "Unbounded", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isDark(this.color) ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)';
      ctx.fillText(valText, cx + 2, cy + 2);
      ctx.fillStyle = textColor;
      ctx.fillText(valText, cx, cy);
    }
    
    const drawBadge = (txt, bx, by) => {
      // Only draw if within canvas bounds
      if (bx >= 0 && bx + blockSize <= canvas2D.width && by >= 0 && by + blockSize <= canvas2D.height) {
        drawNeoBlock(ctx, bx + 1, by + 1, blockSize - 2, blockSize - 2, '#ffe600');
        ctx.font = `700 ${blockSize * 0.45}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(txt, bx + blockSize / 2, by + blockSize / 2);
      }
    };
    
    const widthBadgeX = px + (pw - blockSize) / 2;
    const widthBadgeY = py - blockSize - 4;
    drawBadge(String(this.arrangement.w), widthBadgeX, widthBadgeY);
    
    const rightX = px + pw + 4;
    const leftX = px - blockSize - 4;
    const sideBadgeY = py + (ph - blockSize) / 2;
    
    if (rightX + blockSize <= canvas2D.width) {
      drawBadge(String(this.arrangement.h), rightX, sideBadgeY);
    } else if (leftX >= 0) {
      drawBadge(String(this.arrangement.h), leftX, sideBadgeY);
    }
  }
  
  drawArrangementsTray() {
    arrCtx.fillStyle = '#f5f0e8';
    arrCtx.fillRect(0, 0, arrangementsCanvas.width, arrangementsCanvas.height);
    
    const padding = 16;
    let currentX = padding;
    
    this.arrangements.forEach((arr, index) => {
      const bw = arr.w * miniBlockSize;
      const bh = arr.h * miniBlockSize;
      
      if (index === this.arrangementIndex) {
        arrCtx.fillStyle = '#ffe600';
        arrCtx.fillRect(currentX - 4, padding - 4, bw + 8, bh + 8);
        arrCtx.strokeStyle = '#1a1a1a';
        arrCtx.lineWidth = 2;
        arrCtx.strokeRect(currentX - 4, padding - 4, bw + 8, bh + 8);
      }
      
      if (renderMode === 'single') {
        arr.blocks.forEach(b => {
          drawMiniNeoBlock(arrCtx, currentX + b.x * miniBlockSize, padding + b.y * miniBlockSize, miniBlockSize - 1, miniBlockSize - 1, this.color);
        });
      } else {
        arrCtx.fillStyle = this.color;
        arr.blocks.forEach(b => {
          arrCtx.fillRect(currentX + b.x * miniBlockSize, padding + b.y * miniBlockSize, miniBlockSize, miniBlockSize);
        });
        
        const hasB = (x, y) => arr.blocks.some(bl => bl.x === x && bl.y === y);
        arrCtx.strokeStyle = '#1a1a1a';
        arrCtx.lineWidth = 1;
        arr.blocks.forEach(b => {
          const px = currentX + b.x * miniBlockSize;
          const py = padding + b.y * miniBlockSize;
          if (!hasB(b.x, b.y - 1)) { arrCtx.beginPath();
            arrCtx.moveTo(px, py);
            arrCtx.lineTo(px + miniBlockSize, py);
            arrCtx.stroke(); }
          if (!hasB(b.x, b.y + 1)) { arrCtx.beginPath();
            arrCtx.moveTo(px, py + miniBlockSize);
            arrCtx.lineTo(px + miniBlockSize, py + miniBlockSize);
            arrCtx.stroke(); }
          if (!hasB(b.x - 1, b.y)) { arrCtx.beginPath();
            arrCtx.moveTo(px, py);
            arrCtx.lineTo(px, py + miniBlockSize);
            arrCtx.stroke(); }
          if (!hasB(b.x + 1, b.y)) { arrCtx.beginPath();
            arrCtx.moveTo(px + miniBlockSize, py);
            arrCtx.lineTo(px + miniBlockSize, py + miniBlockSize);
            arrCtx.stroke(); }
        });
      }
      
      arrCtx.fillStyle = '#1a1a1a';
      arrCtx.font = `700 12px "JetBrains Mono", monospace`;
      const label = dimensionMode === '2d' ? `${arr.w}×${arr.h}` : `${arr.w}×${arr.h}×${arr.d}`;
      arrCtx.fillText(label, currentX, padding + bh + 16);
      
      currentX += bw + padding * 2;
    });
    
    document.getElementById('current-arrangement').textContent = `Current: ${this.arrangementIndex + 1} of ${this.arrangements.length}`;
  }
  
  canMove(dx, dy, dz = 0) {
    for (let b of this.arrangement.blocks) {
      const nx = this.x + b.x + dx;
      const ny = this.y + b.y + dy;
      const nz = this.z + b.z + dz;
      
      if (dimensionMode === '2d') {
        if (nx < 0 || nx >= cols || ny >= rows) return false;
        if (ny >= 0 && board2D[ny][nx]) return false;
      } else {
        if (nx < 0 || nx >= cols || ny < 0 || nz < 0 || nz >= depth) return false;
        if (ny < rows && board3D[ny][nz][nx]) return false;
      }
    }
    return true;
  }
  
  changeArrangement(delta) {
    this.arrangementIndex = (this.arrangementIndex + delta + this.arrangements.length) % this.arrangements.length;
    this.arrangement = this.arrangements[this.arrangementIndex];
    
    this.x = Math.max(0, Math.min(this.x, cols - this.arrangement.w));
    if (dimensionMode === '3d') {
      this.z = Math.max(0, Math.min(this.z, depth - this.arrangement.d));
    }
    this.updatePrimeIndicator();
  }
}

// ── Game Loop & Render ─────────────────────────────────────────
function drawGame() {
  if (dimensionMode === '2d') drawBoard2D();
  else drawBoard3D();
}

function drawBoard2D() {
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, canvas2D.width, canvas2D.height);
  
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.07)';
  ctx.lineWidth = 1;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.strokeRect(col * blockSize, row * blockSize, blockSize, blockSize);
    }
  }
  
  if (renderMode === 'single') {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (board2D[row][col]) {
          drawNeoBlock(ctx, col * blockSize + 1, row * blockSize + 1, blockSize - 2, blockSize - 2, board2D[row][col]);
        }
      }
    }
  } else {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const color = board2D[row][col];
        if (color) {
          const x = col * blockSize;
          const y = row * blockSize;
          ctx.fillStyle = color;
          ctx.fillRect(x, y, blockSize, blockSize);
          
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(26,26,26,0.35)';
          
          const top = row > 0 ? board2D[row - 1][col] : null;
          const bottom = row < rows - 1 ? board2D[row + 1][col] : null;
          const left = col > 0 ? board2D[row][col - 1] : null;
          const right = col < cols - 1 ? board2D[row][col + 1] : null;
          
          if (top !== color) { ctx.beginPath();
            ctx.moveTo(x, y + 1);
            ctx.lineTo(x + blockSize, y + 1);
            ctx.stroke(); }
          if (bottom !== color) { ctx.beginPath();
            ctx.moveTo(x, y + blockSize - 1);
            ctx.lineTo(x + blockSize, y + blockSize - 1);
            ctx.stroke();
            ctx.fillRect(x + 3, y + blockSize, blockSize, 3); }
          if (left !== color) { ctx.beginPath();
            ctx.moveTo(x + 1, y);
            ctx.lineTo(x + 1, y + blockSize);
            ctx.stroke(); }
          if (right !== color) { ctx.beginPath();
            ctx.moveTo(x + blockSize - 1, y);
            ctx.lineTo(x + blockSize - 1, y + blockSize);
            ctx.stroke();
            ctx.fillRect(x + blockSize, y + 3, 3, blockSize); }
        }
      }
    }
  }
  
  if (currentPiece) currentPiece.draw();
}

function drawBoard3D() {
  if (!blocks3DGroup) return;
  
  while (blocks3DGroup.children.length > 0) {
    blocks3DGroup.remove(blocks3DGroup.children[0]);
  }
  
  // For merged mode: track contiguous blocks of same color
  if (renderMode === 'merged') {
    const visited = new Set();
    
    for (let y = 0; y < rows; y++) {
      for (let z = 0; z < depth; z++) {
        for (let x = 0; x < cols; x++) {
          if (board3D[y][z][x] && !visited.has(`${x},${y},${z}`)) {
            const color = board3D[y][z][x];
            
            // Find all connected blocks of the same color
            const blocks = [];
            const stack = [{ x, y, z }];
            visited.add(`${x},${y},${z}`);
            
            while (stack.length > 0) {
              const curr = stack.pop();
              blocks.push(curr);
              
              // Check all 6 adjacent directions
              const neighbors = [
                { x: curr.x + 1, y: curr.y, z: curr.z },
                { x: curr.x - 1, y: curr.y, z: curr.z },
                { x: curr.x, y: curr.y + 1, z: curr.z },
                { x: curr.x, y: curr.y - 1, z: curr.z },
                { x: curr.x, y: curr.y, z: curr.z + 1 },
                { x: curr.x, y: curr.y, z: curr.z - 1 },
              ];
              
              for (let n of neighbors) {
                const key = `${n.x},${n.y},${n.z}`;
                if (!visited.has(key) &&
                  n.x >= 0 && n.x < cols &&
                  n.y >= 0 && n.y < rows &&
                  n.z >= 0 && n.z < depth &&
                  board3D[n.y]?.[n.z]?.[n.x] === color) {
                  visited.add(key);
                  stack.push(n);
                }
              }
            }
            
            // Calculate bounding box of the connected group
            const minX = Math.min(...blocks.map(b => b.x));
            const maxX = Math.max(...blocks.map(b => b.x));
            const minY = Math.min(...blocks.map(b => b.y));
            const maxY = Math.max(...blocks.map(b => b.y));
            const minZ = Math.min(...blocks.map(b => b.z));
            const maxZ = Math.max(...blocks.map(b => b.z));
            
            const width = maxX - minX + 1;
            const height = maxY - minY + 1;
            const depthVal = maxZ - minZ + 1;
            
            const mesh = createMesh3D(color, width, height, depthVal, minX, minY, minZ, false);
            blocks3DGroup.add(mesh);
          }
        }
      }
    }
  } else {
    // Single mode: render each block individually
    for (let y = 0; y < rows; y++) {
      for (let z = 0; z < depth; z++) {
        for (let x = 0; x < cols; x++) {
          if (board3D[y][z][x]) {
            const mesh = createMesh3D(board3D[y][z][x], 1, 1, 1, x, y, z, false);
            blocks3DGroup.add(mesh);
          }
        }
      }
    }
  }
  
  if (currentPiece) {
    if (renderMode === 'merged' && currentPiece.arrangement) {
      const mesh = createMesh3D(
        currentPiece.color,
        currentPiece.arrangement.w,
        currentPiece.arrangement.h,
        currentPiece.arrangement.d,
        currentPiece.x,
        currentPiece.y,
        currentPiece.z,
        currentPiece.shape.isPrime
      );
      blocks3DGroup.add(mesh);
    } else {
      for (let b of currentPiece.arrangement.blocks) {
        if (currentPiece.y + b.y < rows && currentPiece.y + b.y >= 0) {
          const mesh = createMesh3D(
            currentPiece.color,
            1, 1, 1,
            currentPiece.x + b.x,
            currentPiece.y + b.y,
            currentPiece.z + b.z,
            currentPiece.shape.isPrime
          );
          blocks3DGroup.add(mesh);
        }
      }
    }
    currentPiece.drawArrangementsTray();
  }
}


function createNewPiece() {
  let pool = shapes;
  // Enforce irregular block limit by filtering shapes where area/volume > 6
  if (shapeTypeMode === 'irregular') {
    pool = shapes.filter(s => s.val <= 6);
  }
  return new Piece(pool[Math.floor(Math.random() * pool.length)]);
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
    if (gameOver || isPaused) return;
    elapsedSeconds++;
    updateSpeed();
  }, 1000);
}

function stopSpeedTimer() {
  if (speedTimer) { clearInterval(speedTimer);
    speedTimer = null; }
}

function checkLines2D() {
  let linesCleared = 0;
  for (let row = rows - 1; row >= 0; row--) {
    if (board2D[row].every(cell => cell !== 0)) {
      board2D.splice(row, 1);
      board2D.unshift(Array(cols).fill(0));
      linesCleared++;
      score += 100;
    }
  }
  if (linesCleared > 0) {
    document.getElementById('score').textContent = `Score: ${score}`;
    updateSpeed();
  }
}

function checkPlanes3D() {
  let planesCleared = 0;
  for (let y = rows - 1; y >= 0; y--) {
    let planeFull = true;
    for (let z = 0; z < depth; z++) {
      if (!board3D[y][z].every(cell => cell !== 0)) {
        planeFull = false;
        break;
      }
    }
    if (planeFull) {
      board3D.splice(y, 1);
      board3D.push(Array(depth).fill().map(() => Array(cols).fill(0)));
      planesCleared++;
      score += 500;
    }
  }
  if (planesCleared > 0) {
    document.getElementById('score').textContent = `Score: ${score}`;
    updateSpeed();
  }
}

function lockPiece() {
  for (let b of currentPiece.arrangement.blocks) {
    const nx = currentPiece.x + b.x;
    const ny = currentPiece.y + b.y;
    const nz = currentPiece.z + b.z;
    if (dimensionMode === '2d') {
      if (ny >= 0) board2D[ny][nx] = currentPiece.color;
    } else {
      if (ny < rows) board3D[ny][nz][nx] = currentPiece.color;
    }
  }
  
  if (dimensionMode === '2d') checkLines2D();
  else checkPlanes3D();
  
  lockedPiecesCount++;
  currentPiece = nextPiece;
  nextPiece = createNewPiece();
  
  if (!currentPiece.canMove(0, 0, 0)) {
    gameOver = true;
    stopSpeedTimer();
    if (dimensionMode === '3d' && scene) {
      const ceiling = scene.getObjectByName('ceilingGrid');
      if (ceiling) ceiling.visible = true;
    }
    alert(`Game Over! Final Score: ${score}`);
    return;
  }
  
  if (lockedPiecesCount >= 10) triggerQuiz();
}

function gameLoop() {
  if (!gameOver && !isPaused) {
    if (dimensionMode === '2d') {
      if (currentPiece.canMove(0, 1)) currentPiece.y++;
      else lockPiece();
    } else {
      if (currentPiece.canMove(0, -1, 0)) currentPiece.y--;
      else lockPiece();
    }
    drawGame();
  }
  if (!gameOver) setTimeout(gameLoop, currentSpeed);
}

// ── Overlay & Keyboard Controls ───────────────────────────────
function initControls() {
  ['up', 'left', 'right', 'down', 'rotate', 'm-plus', 'm-minus', 'z-in', 'z-out'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('mousedown', e => { e.preventDefault();
      startContinuousAction(id); });
    btn.addEventListener('touchstart', e => { e.preventDefault();
      startContinuousAction(id); });
    btn.addEventListener('mouseup', e => { e.preventDefault();
      stopContinuousAction(id); });
    btn.addEventListener('mouseleave', e => { e.preventDefault();
      stopContinuousAction(id); });
    btn.addEventListener('touchend', e => { e.preventDefault();
      stopContinuousAction(id); });
    btn.addEventListener('touchcancel', e => { e.preventDefault();
      stopContinuousAction(id); });
  });
  
  document.addEventListener('keydown', e => {
    if (gameOver || isPaused || !currentPiece || keyState[e.key]) return;
    keyState[e.key] = true;
    switch (e.key) {
      case 'ArrowLeft':
        startContinuousKeyAction('ArrowLeft');
        break;
      case 'ArrowRight':
        startContinuousKeyAction('ArrowRight');
        break;
      case 'ArrowDown':
        startContinuousKeyAction('ArrowDown');
        break;
      case 'w':
        startContinuousKeyAction('w');
        break;
      case 's':
        startContinuousKeyAction('s');
        break;
      case ' ':
      case 'r':
        currentPiece.changeArrangement(1);
        drawGame();
        break;
      case 'm':
        currentPiece.changeArrangement(-1);
        drawGame();
        break;
    }
  });
  
  document.addEventListener('keyup', e => {
    keyState[e.key] = false;
    stopContinuousKeyAction(e.key);
  });
}

function startContinuousAction(id) {
  if (gameOver || isPaused || !currentPiece) return;
  if (buttonIntervals[id]) clearInterval(buttonIntervals[id]);
  handleOverlayButton(id);
  buttonIntervals[id] = setInterval(() => {
    if (gameOver || isPaused || !currentPiece) { stopContinuousAction(id); return; }
    handleOverlayButton(id);
  }, 100);
}

function stopContinuousAction(id) {
  if (buttonIntervals[id]) { clearInterval(buttonIntervals[id]);
    buttonIntervals[id] = null; }
}

function handleOverlayButton(id) {
  if (dimensionMode === '2d') {
    switch (id) {
      case 'up':
      case 'rotate':
        currentPiece.changeArrangement(1);
        break;
      case 'left':
        if (currentPiece.canMove(-1, 0)) currentPiece.x--;
        break;
      case 'right':
        if (currentPiece.canMove(1, 0)) currentPiece.x++;
        break;
      case 'down':
        if (currentPiece.canMove(0, 1)) currentPiece.y++;
        break;
      case 'm-plus':
        currentPiece.changeArrangement(1);
        break;
      case 'm-minus':
        currentPiece.changeArrangement(-1);
        break;
    }
  } else {
    switch (id) {
      case 'up':
      case 'rotate':
        currentPiece.changeArrangement(1);
        break;
      case 'left':
        if (currentPiece.canMove(-1, 0, 0)) currentPiece.x--;
        break;
      case 'right':
        if (currentPiece.canMove(1, 0, 0)) currentPiece.x++;
        break;
      case 'down':
        if (currentPiece.canMove(0, -1, 0)) currentPiece.y--;
        break;
      case 'z-in':
        if (currentPiece.canMove(0, 0, -1)) currentPiece.z--;
        break;
      case 'z-out':
        if (currentPiece.canMove(0, 0, 1)) currentPiece.z++;
        break;
      case 'm-plus':
        currentPiece.changeArrangement(1);
        break;
      case 'm-minus':
        currentPiece.changeArrangement(-1);
        break;
    }
  }
  drawGame();
}

function startContinuousKeyAction(key) {
  if (gameOver || isPaused || !currentPiece) return;
  if (buttonIntervals[key]) clearInterval(buttonIntervals[key]);
  handleKeyAction(key);
  buttonIntervals[key] = setInterval(() => {
    if (gameOver || isPaused || !currentPiece || !keyState[key]) { stopContinuousKeyAction(key); return; }
    handleKeyAction(key);
  }, 100);
}

function stopContinuousKeyAction(key) {
  if (buttonIntervals[key]) { clearInterval(buttonIntervals[key]);
    buttonIntervals[key] = null; }
}

function handleKeyAction(key) {
  if (dimensionMode === '2d') {
    switch (key) {
      case 'ArrowLeft':
        if (currentPiece.canMove(-1, 0)) currentPiece.x--;
        break;
      case 'ArrowRight':
        if (currentPiece.canMove(1, 0)) currentPiece.x++;
        break;
      case 'ArrowDown':
        if (currentPiece.canMove(0, 1)) currentPiece.y++;
        break;
    }
  } else {
    switch (key) {
      case 'ArrowLeft':
        if (currentPiece.canMove(-1, 0, 0)) currentPiece.x--;
        break;
      case 'ArrowRight':
        if (currentPiece.canMove(1, 0, 0)) currentPiece.x++;
        break;
      case 'ArrowDown':
        if (currentPiece.canMove(0, -1, 0)) currentPiece.y--;
        break;
      case 'w':
        if (currentPiece.canMove(0, 0, -1)) currentPiece.z--;
        break;
      case 's':
        if (currentPiece.canMove(0, 0, 1)) currentPiece.z++;
        break;
    }
  }
  drawGame();
}

// ── Settings UI Logic ─────────────────────────────────────────
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsModal = document.getElementById('settings-modal');

settingsBtn.addEventListener('click', () => {
  isPaused = true;
  settingsModal.classList.remove('hide');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('hide');
  isPaused = false;
});

function switchDimensionMode(mode) {
  dimensionMode = mode;
  board2D = Array(rows).fill().map(() => Array(cols).fill(0));
  board3D = Array(rows).fill().map(() => Array(depth).fill().map(() => Array(cols).fill(0)));
  score = 0;
  gameOver = false;
  document.getElementById('score').textContent = `Score: 0`;
  
  const zControls = document.getElementById('z-controls');
  
  if (mode === '3d') {
    canvas2D.classList.add('hide');
    canvas3DContainer.classList.remove('hide');
    zControls.classList.remove('hide');
    initThreeJS();
  } else {
    canvas3DContainer.classList.add('hide');
    canvas2D.classList.remove('hide');
    zControls.classList.add('hide');
  }
  
  // Hide red ceiling on reset
  if (scene) {
    const ceiling = scene.getObjectByName('ceilingGrid');
    if (ceiling) ceiling.visible = false;
  }
  
  nextPiece = createNewPiece();
  currentPiece = createNewPiece();
  drawGame();
}

document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const parent = btn.closest('.toggle-group');
    parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const setting = btn.dataset.setting;
    const value = btn.dataset.value;
    
    if (setting === 'view') {
      renderMode = value;
      drawGame();
    } else if (setting === 'dimension') {
      switchDimensionMode(value);
    } else if (setting === 'shapeType') {
      shapeTypeMode = value;
      // Refresh pieces to matching context
      nextPiece = createNewPiece();
      currentPiece = createNewPiece();
      drawGame();
    }
  });
});

// ── Color Key Legend ──────────────────────────────────────────
function buildColorLegend() {
  const legend = document.getElementById('color-legend');
  if (!legend) return;

  const isDark = hex => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  legend.innerHTML = shapes.map(s => `
    <div class="color-chip" style="background:${s.color}; color:${isDark(s.color) ? '#fff' : '#1a1a1a'};">
      <span class="chip-val">${s.val}</span>
      ${s.isPrime ? `
        <svg class="chip-star" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>` : ''}
    </div>
  `).join('');
}

function initColorKeyToggle() {
  const btn = document.getElementById('color-key-btn');
  const legend = document.getElementById('color-legend');
  const icon = document.getElementById('color-key-icon');
  const label = document.getElementById('color-key-label');
  if (!btn || !legend) return;

  btn.addEventListener('click', e => {
    e.preventDefault();
    const isHidden = legend.classList.toggle('hide');

    if (isHidden) {
      icon.innerHTML = `
        <circle cx="13.5" cy="6.5" r="1.5"/>
        <circle cx="17.5" cy="10.5" r="1.5"/>
        <circle cx="8.5" cy="7.5" r="1.5"/>
        <circle cx="6.5" cy="12.5" r="1.5"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
      `;
      label.textContent = 'Color Key';
    } else {
      icon.innerHTML = `
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      `;
      label.textContent = 'Hide Key';
    }
  });
}

// ── Area / Volume Quiz Logic ──────────────────────────────────
const quizModal = document.getElementById('quiz-modal');
const areaInput = document.getElementById('area-input');

function triggerQuiz() {
  isPaused = true;
  areaInput.textContent = '';

  // Reset color key to closed state each time quiz opens
  const legend = document.getElementById('color-legend');
  const icon = document.getElementById('color-key-icon');
  const label = document.getElementById('color-key-label');
  if (legend) legend.classList.add('hide');
  if (icon) icon.innerHTML = `
    <circle cx="13.5" cy="6.5" r="1.5"/>
    <circle cx="17.5" cy="10.5" r="1.5"/>
    <circle cx="8.5" cy="7.5" r="1.5"/>
    <circle cx="6.5" cy="12.5" r="1.5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  `;
  if (label) label.textContent = 'Color Key';
  
  const h2 = quizModal.querySelector('h2');
  const p = quizModal.querySelector('p');
  
  if (dimensionMode === '3d') {
    h2.textContent = 'Total Volume Check!';
    p.textContent = '10 pieces locked in. What is the total volume of all blocks currently on the board?';
  } else {
    h2.textContent = 'Total Area Check!';
    p.textContent = '10 pieces locked in. What is the total area of the ground blocks currently on the board?';
  }
  
  // Populate picture carousel of blocks currently on the board
  const carousel = document.getElementById('quiz-carousel');
  carousel.innerHTML = '';
  
  if (dimensionMode === '2d') {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    const canvas = document.createElement('canvas');
    canvas.width = 65;
    canvas.height = 65;
    const c = canvas.getContext('2d');
    const cellW = 65 / cols;
    const cellH = 65 / rows;
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 65, 65);
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        if (board2D[r][col]) {
          c.fillStyle = board2D[r][col];
          c.fillRect(Math.floor(col * cellW), Math.floor(r * cellH), Math.ceil(cellW), Math.ceil(cellH));
        }
      }
    }
    c.strokeStyle = '#1a1a1a';
    c.lineWidth = 2;
    c.strokeRect(0, 0, 65, 65);
    card.appendChild(canvas);
    carousel.appendChild(card);
  } else {
    // 3D: one picture card per Y-layer that contains blocks
    for (let y = 0; y < rows; y++) {
      let hasAny = false;
      for (let z = 0; z < depth; z++) {
        for (let x = 0; x < cols; x++) {
          if (board3D[y][z][x]) { hasAny = true; break; }
        }
        if (hasAny) break;
      }
      if (!hasAny) continue;
      
      const card = document.createElement('div');
      card.className = 'carousel-card';
      const canvas = document.createElement('canvas');
      canvas.width = 65;
      canvas.height = 65;
      const c = canvas.getContext('2d');
      const cellW = 65 / cols;
      const cellH = 65 / depth;
      c.fillStyle = '#ffffff';
      c.fillRect(0, 0, 65, 65);
      for (let z = 0; z < depth; z++) {
        for (let x = 0; x < cols; x++) {
          if (board3D[y][z][x]) {
            c.fillStyle = board3D[y][z][x];
            c.fillRect(Math.floor(x * cellW), Math.floor(z * cellH), Math.ceil(cellW), Math.ceil(cellH));
          }
        }
      }
      c.strokeStyle = '#1a1a1a';
      c.lineWidth = 2;
      c.strokeRect(0, 0, 65, 65);
      const lbl = document.createElement('div');
      lbl.textContent = `Y${y}`;
      lbl.style.fontSize = '10px';
      lbl.style.fontWeight = '700';
      lbl.style.marginTop = '2px';
      card.appendChild(canvas);
      card.appendChild(lbl);
      carousel.appendChild(card);
    }
  }
  
  quizModal.classList.remove('hide');
}

function checkQuizAnswer() {
  const userInput = parseInt(areaInput.textContent.trim(), 10);
  
  let actualAmount = 0;
  if (dimensionMode === '2d') {
    actualAmount = board2D.flat().filter(cell => cell !== 0).length;
  } else {
    actualAmount = board3D.flat(2).filter(cell => cell !== 0).length;
  }
  
  if (userInput === actualAmount) {
    score += actualAmount * 10;
    document.getElementById('score').textContent = `Score: ${score}`;
    lockedPiecesCount = 0;
    quizModal.classList.add('hide');
    isPaused = false;
  } else {
    areaInput.style.color = 'var(--red)';
    areaInput.style.transform = 'translateX(-5px)';
    setTimeout(() => areaInput.style.transform = 'translateX(5px)', 50);
    setTimeout(() => areaInput.style.transform = 'translateX(0)', 100);
    
    setTimeout(() => {
      areaInput.style.color = 'var(--ink)';
      areaInput.textContent = '';
    }, 600);
  }
}

document.querySelectorAll('.numpad-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (btn.classList.contains('action-del')) {
      areaInput.textContent = areaInput.textContent.slice(0, -1);
    } else if (btn.classList.contains('action-enter')) {
      checkQuizAnswer();
    } else {
      areaInput.textContent += btn.textContent;
    }
  });
});

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Fix strictly 450x600 layout logic (15 * 30px, 20 * 30px)
  canvas2D.width = 450;
  canvas2D.height = 600;

  buildColorLegend();
  initColorKeyToggle();

  initControls();
  nextPiece = createNewPiece();
  currentPiece = createNewPiece();
  startSpeedTimer();
  gameLoop();
});
