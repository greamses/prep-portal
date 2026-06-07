/**
 * Black Scoreboard for FPV Free Throw
 * Metallic frame with textured display, score and timer
 * PERF: scanlines pre-baked to offscreen canvas (was 150 stroke calls/frame)
 * PERF: glow layers reduced from 5 to 2
 * PERF: display throttled to ~15fps (66ms) — was 30fps with no real benefit
 */
import * as THREE from "three";

// Constants for better maintainability
const CONFIG = {
  BOARD_SIZE: { width: 4.4, height: 1.8, depth: 0.2 },
  SCREEN_SIZE: { width: 3.8, height: 1.3, depth: 0.03 },
  CANVAS_SIZE: { width: 1024, height: 300 },
  DEFAULT_TIMER: 60,
  COLORS: {
    SCORE: '#00ff66',
    TIMER: '#ff3333',
    ACCENT: '#ffaa00',
    GOLD: '#ffd700'
  }
};

/* ---------- Scanline cache (built once, reused every frame) ---------- */
let _scanlineCache = null;

function getScanlineCanvas(w, h) {
  if (_scanlineCache && _scanlineCache.width === w && _scanlineCache.height === h) {
    return _scanlineCache;
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cx = c.getContext('2d');
  cx.globalAlpha = 0.08;
  cx.lineWidth = 0.5;
  for (let i = 0; i < h; i += 2) {
    cx.beginPath();
    cx.moveTo(0, i);
    cx.lineTo(w, i);
    cx.strokeStyle = i % 4 === 0 ? '#0a0a0a' : '#151515';
    cx.stroke();
  }
  _scanlineCache = c;
  return c;
}

// Utility function to create textures
function createProceduralTexture(type, options = {}) {
  const { width = 256, height = 256 } = options;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  switch (type) {
    case 'metal':
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < height; i += 2) {
        const brightness = 30 + Math.sin(i * 0.05) * 15 + Math.random() * 20;
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        ctx.fillRect(0, i, width, 2);
      }

      for (let i = 0; i < 30; i++) {
        const x = Math.random() * width;
        const gradient = ctx.createLinearGradient(x, 0, x + 2, 0);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#2a2a2a');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, 0, 2, height);
      }
      break;

    case 'pole':
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(0.2, '#2a2a2a');
      gradient.addColorStop(0.4, '#4a4a4a');
      gradient.addColorStop(0.6, '#3a3a3a');
      gradient.addColorStop(0.8, '#2a2a2a');
      gradient.addColorStop(1, '#1a1a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      break;

    case 'screen':
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 15;
        data[i] = noise;
        data[i + 1] = noise;
        data[i + 2] = noise;
      }
      ctx.putImageData(imageData, 0, 0);
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (type === 'metal') {
    texture.repeat.set(2, 1);
  }

  return texture;
}

// Material factory for consistency
const MaterialFactory = {
  metal: (texture, options = {}) => new THREE.MeshStandardMaterial({
    map: texture,
    color: options.color || 0x222222,
    roughness: options.roughness || 0.4,
    metalness: options.metalness || 0.85,
    emissive: new THREE.Color(0x050505),
    emissiveIntensity: 0.1,
    ...options
  }),

  bezel: () => new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.3,
    metalness: 0.9
  }),

  screen: (texture) => new THREE.MeshStandardMaterial({
    map: texture,
    color: 0x000000,
    roughness: 0.6,
    metalness: 0.0,
    emissive: new THREE.Color(0x0a0a0a),
    emissiveIntensity: 0.5
  }),

  accent: (color, emissive = true) => new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.2,
    metalness: 0.8,
    emissive: emissive ? color : new THREE.Color(0x000000),
    emissiveIntensity: 0.3
  })
};

export function createScoreboard() {
  const group = new THREE.Group();

  // Create textures
  const metalTexture = createProceduralTexture('metal', { width: 256, height: 256 });
  const screenTexture = createProceduralTexture('screen', { width: 128, height: 128 });
  const poleTexture = createProceduralTexture('pole', { width: 64, height: 256 });

  // Main board assembly
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(CONFIG.BOARD_SIZE.width, CONFIG.BOARD_SIZE.height, CONFIG.BOARD_SIZE.depth),
    MaterialFactory.metal(metalTexture)
  );
  board.castShadow = true;
  board.receiveShadow = true;
  group.add(board);

  // Inner bezel
  const bezelOuter = new THREE.Mesh(
    new THREE.BoxGeometry(4.15, 1.6, 0.06),
    MaterialFactory.bezel()
  );
  bezelOuter.position.z = 0.11;
  bezelOuter.castShadow = true;
  bezelOuter.receiveShadow = true;
  group.add(bezelOuter);

  const bezelInner = new THREE.Mesh(
    new THREE.BoxGeometry(3.85, 1.35, 0.04),
    MaterialFactory.bezel()
  );
  bezelInner.position.z = 0.13;
  bezelInner.castShadow = true;
  bezelInner.receiveShadow = true;
  group.add(bezelInner);

  // Screen area
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(CONFIG.SCREEN_SIZE.width, CONFIG.SCREEN_SIZE.height, CONFIG.SCREEN_SIZE.depth),
    MaterialFactory.screen(screenTexture)
  );
  screen.position.z = 0.15;
  group.add(screen);

  // Center divider with LED effect
  const dividerGroup = new THREE.Group();

  const dividerMain = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 1.15, 0.05),
    MaterialFactory.bezel()
  );
  dividerMain.position.z = 0.16;
  dividerGroup.add(dividerMain);

  const dotMaterial = MaterialFactory.accent(CONFIG.COLORS.GOLD);
  for (let y = -0.45; y <= 0.45; y += 0.18) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 8),
      dotMaterial
    );
    dot.position.set(0, y, 0.17);
    dividerGroup.add(dot);
  }

  group.add(dividerGroup);

  // High-resolution canvas for dynamic text
  const canvas = document.createElement('canvas');
  canvas.width = CONFIG.CANVAS_SIZE.width;
  canvas.height = CONFIG.CANVAS_SIZE.height;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const textMat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0x111111),
    emissiveIntensity: 0.3
  });

  const textPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.7, 1.2),
    textMat
  );
  textPlane.position.z = 0.17;
  group.add(textPlane);

  addDecorativeElements(group);
  addSupportStructure(group, poleTexture);

  // Pre-bake the scanline overlay now that canvas size is known
  getScanlineCanvas(CONFIG.CANVAS_SIZE.width, CONFIG.CANVAS_SIZE.height);

  group.userData = {
    canvas, ctx, texture,
    timer: CONFIG.DEFAULT_TIMER,
    timerInterval: null,
    animationFrame: null,
    lastUpdate: 0
  };

  return group;
}

function addDecorativeElements(group) {
  const bracketMaterial = MaterialFactory.accent(0x555555, false);
  const bracketPositions = [
    [-2.05, 0.8], [2.05, 0.8], [-2.05, -0.8], [2.05, -0.8]
  ];

  bracketPositions.forEach(([x, y]) => {
    const bracket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.08, 6),
      bracketMaterial
    );
    bracket.position.set(x, y, 0.13);
    bracket.rotation.z = Math.PI / 2;
    group.add(bracket);
  });

  const accentStrip = new THREE.Mesh(
    new THREE.BoxGeometry(3.9, 0.03, 0.04),
    MaterialFactory.accent(CONFIG.COLORS.GOLD)
  );
  accentStrip.position.set(0, 0.77, 0.16);
  group.add(accentStrip);
}

function addSupportStructure(group, poleTexture) {
  const poleMaterial = new THREE.MeshStandardMaterial({
    map: poleTexture,
    roughness: 0.35,
    metalness: 0.85
  });

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.3,
    metalness: 0.9
  });

  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.12, 2.8, 16);

  [-1.6, 1.6].forEach(x => {
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, -1.9, -0.3);
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.05, 8),
      baseMaterial
    );
    cap.position.set(x, -0.5, -0.3);
    cap.castShadow = true;
    group.add(cap);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.24, 0.15, 8),
      baseMaterial
    );
    base.position.set(x, -3.25, -0.3);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const flange = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.04, 8),
      baseMaterial
    );
    flange.position.set(x, -3.32, -0.3);
    flange.castShadow = true;
    group.add(flange);
  });

  const braceMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.4,
    metalness: 0.85
  });

  const horizontalBrace = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.06, 0.08),
    braceMaterial
  );
  horizontalBrace.position.set(0, -0.8, -0.3);
  horizontalBrace.castShadow = true;
  horizontalBrace.receiveShadow = true;
  group.add(horizontalBrace);

  const diagonalGeometry = new THREE.BoxGeometry(2.3, 0.05, 0.06);

  const diagonal1 = new THREE.Mesh(diagonalGeometry, braceMaterial);
  diagonal1.position.set(0.8, -1.5, -0.3);
  diagonal1.rotation.z = 0.4;
  diagonal1.castShadow = true;
  group.add(diagonal1);

  const diagonal2 = new THREE.Mesh(diagonalGeometry, braceMaterial);
  diagonal2.position.set(-0.8, -1.5, -0.3);
  diagonal2.rotation.z = -0.4;
  diagonal2.castShadow = true;
  group.add(diagonal2);
}

/**
 * Draw digital text with LED glow.
 * PERF: reduced from 5 shadow layers to 2 — eliminates 3 full canvas redraws per call.
 */
export function drawDigitalText(ctx, text, x, y, fontSize, color, glowColor) {
  ctx.font = `bold ${fontSize}px 'Orbitron', 'Obitron', 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.save();

  // 2 layers instead of 5 — visually near-identical, ~60% cheaper
  const layers = [
    { blur: 14, alpha: 0.55, color: glowColor },
    { blur: 3,  alpha: 1.0,  color: '#ffffff'  }
  ];

  layers.forEach(layer => {
    ctx.shadowColor = layer.color;
    ctx.shadowBlur = layer.blur;
    ctx.fillStyle = layer.color;
    ctx.globalAlpha = layer.alpha;
    ctx.fillText(text, x, y);
  });

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y - 2);

  ctx.restore();
}

/**
 * Throttled display update.
 * PERF: throttle raised to 66ms (~15fps) — scoreboard doesn't need 30fps redraws.
 */
export function updateScoreboardDisplay(scoreboard, stats) {
  const { canvas, ctx, texture } = scoreboard.userData;
  const now = performance.now();

  // ~15fps is plenty for a scoreboard
  if (now - scoreboard.userData.lastUpdate < 66) {
    if (!scoreboard.userData.animationFrame) {
      scoreboard.userData.animationFrame = requestAnimationFrame(() => {
        renderDisplay(scoreboard, stats);
        scoreboard.userData.animationFrame = null;
        scoreboard.userData.lastUpdate = performance.now();
      });
    }
    return;
  }

  renderDisplay(scoreboard, stats);
  scoreboard.userData.lastUpdate = now;
}

function renderDisplay(scoreboard, stats) {
  const { canvas, ctx, texture } = scoreboard.userData;
  const w = canvas.width;
  const h = canvas.height;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#0a0a0a');
  gradient.addColorStop(0.5, '#000000');
  gradient.addColorStop(1, '#050505');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // PERF: scanlines drawn from pre-baked offscreen canvas (was 150 stroke calls)
  ctx.drawImage(getScanlineCanvas(w, h), 0, 0);

  // Center divider
  const centerX = w / 2;
  ctx.beginPath();
  ctx.moveTo(centerX, h * 0.1);
  ctx.lineTo(centerX, h * 0.9);
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX - 2, h * 0.1);
  ctx.lineTo(centerX - 2, h * 0.9);
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX - 1, h * 0.1);
  ctx.lineTo(centerX - 1, h * 0.9);
  ctx.strokeStyle = CONFIG.COLORS.GOLD;
  ctx.lineWidth = 1;
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#ff8800';
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Left side — SCORE
  drawLabel(ctx, 'SCORE', w * 0.25, 40, CONFIG.COLORS.SCORE);
  drawDigitalText(
    ctx,
    String(stats.score).padStart(3, '0'),
    w * 0.25,
    h / 2 + 15,
    80,
    CONFIG.COLORS.SCORE,
    '#00ff44'
  );

  // Right side — TIMER
  drawLabel(ctx, 'TIMER', w * 0.75, 40, CONFIG.COLORS.TIMER);

  const timerValue = scoreboard.userData.timer || CONFIG.DEFAULT_TIMER;
  const minutes = Math.floor(timerValue / 60);
const seconds = timerValue % 60;
const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const timerColor = timerValue <= 10 ? '#ff0000' :
                     timerValue <= 30 ? '#ff6600' : CONFIG.COLORS.TIMER;

  drawDigitalText(
    ctx,
    timerText,
    w * 0.75,
    h / 2 + 15,
    72,
    timerColor,
    timerColor
  );

  // Bottom stats
  drawStatBox(ctx, 'SHOTS', `${stats.made}/${stats.attempts}`,
              w * 0.25, h - 45, stats.made / Math.max(stats.attempts, 1));

  drawStatBox(ctx, 'STREAK', String(stats.streak),
              w * 0.75, h - 45, Math.min(stats.streak / 10, 1));

  texture.needsUpdate = true;
}

function drawLabel(ctx, text, x, y, color) {
  ctx.save();
  ctx.font = "bold 18px 'Orbitron', 'Courier New', monospace";
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.shadowBlur = 8;
  ctx.shadowColor = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawStatBox(ctx, label, value, x, y, progress) {
  ctx.save();

  ctx.font = "bold 14px 'Orbitron', 'Courier New', monospace";
  ctx.fillStyle = '#888888';
  ctx.shadowBlur = 4;
  ctx.shadowColor = '#000000';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 25);

  ctx.font = "38px 'Orbitron', 'Courier New', monospace";
  ctx.fillStyle = CONFIG.COLORS.ACCENT;
  ctx.shadowColor = '#ff8800';
  ctx.fillText(value, x, y);

  const barWidth = 120;
  const barHeight = 4;
  const barX = x - barWidth / 2;
  const barY = y + 15;

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#222222';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
  progressGradient.addColorStop(0, CONFIG.COLORS.ACCENT);
  progressGradient.addColorStop(1, '#ff6600');

  ctx.fillStyle = progressGradient;
  ctx.fillRect(barX, barY, barWidth * Math.min(progress, 1), barHeight);

  ctx.restore();
}

export function startTimer(scoreboard, duration = CONFIG.DEFAULT_TIMER) {
  stopTimer(scoreboard);
  scoreboard.userData.timer = duration;
  scoreboard.userData.timerPaused = false;
  scoreboard.userData.timerInterval = setInterval(() => {
    if (!scoreboard.userData.timerPaused && scoreboard.userData.timer > 0) {
      scoreboard.userData.timer--;
    }
  }, 1000);
}

export function pauseTimer(scoreboard) {
  scoreboard.userData.timerPaused = true;
}

export function resumeTimer(scoreboard) {
  scoreboard.userData.timerPaused = false;
}

export function stopTimer(scoreboard) {
  if (scoreboard.userData.timerInterval) {
    clearInterval(scoreboard.userData.timerInterval);
    scoreboard.userData.timerInterval = null;
  }
  if (scoreboard.userData.animationFrame) {
    cancelAnimationFrame(scoreboard.userData.animationFrame);
    scoreboard.userData.animationFrame = null;
  }
}

export function resetTimer(scoreboard, duration = CONFIG.DEFAULT_TIMER) {
  scoreboard.userData.timer = duration;
  scoreboard.userData.timerPaused = false;
}

export function addScoreboardLighting(scene) {
  const keyLight = new THREE.SpotLight(0xffffff, 1.2);
  keyLight.position.set(-2, 8, -6);
  keyLight.target.position.set(0, 6.5, -10);
  keyLight.angle = 0.5;
  keyLight.penumbra = 0.4;
  keyLight.decay = 1;
  keyLight.distance = 35;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);
  scene.add(keyLight.target);

  const fillLightLeft = new THREE.PointLight(0x557799, 0.4);
  fillLightLeft.position.set(-4, 5, -8);
  scene.add(fillLightLeft);

  const fillLightRight = new THREE.PointLight(0x775555, 0.3);
  fillLightRight.position.set(4, 5, -8);
  scene.add(fillLightRight);

  const edgeLightTop = new THREE.PointLight(0xaaaaaa, 0.2);
  edgeLightTop.position.set(0, 7, -9);
  scene.add(edgeLightTop);

  const edgeLightBottom = new THREE.PointLight(0x666666, 0.15);
  edgeLightBottom.position.set(0, 4, -11);
  scene.add(edgeLightBottom);

  const screenGlow = new THREE.PointLight(0x224466, 0.25);
  screenGlow.position.set(0, 5.5, -9.5);
  scene.add(screenGlow);

  return {
    keyLight,
    fillLightLeft,
    fillLightRight,
    screenGlow
  };
}
