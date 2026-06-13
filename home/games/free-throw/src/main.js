/**
 * FPV Free Throw — Slower, More Relaxed Version
 * REDUCED SPEED: Ball launches slower, gravity reduced, movement more deliberate
 */
import * as THREE from "three";
import { buildScene } from "./environment/index.js";
import { createBall } from "./ball.js";
import { BallPhysics } from "./physics.js";
import { setupControls } from "./controls.js";
import {
  createScoreboard,
  updateScoreboardDisplay,
  startTimer,
  stopTimer,
  resetTimer,
  addScoreboardLighting
} from "./scoreboard.js";

/* ---------- Mobile Detection ---------- */
const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || 
                 window.innerWidth < 1024;

/* ---------- Configuration ---------- */
const CONFIG = {
  RENDER: {
    pixelRatio: isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5),
    antialias: !isMobile,
    shadows: !isMobile,
    toneMapping: isMobile ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping,
    exposure: 1.0
  },
  CAMERA: {
    fov: 62,
    near: 0.05,
    far: 200,
    playerHeight: 1.72,
    playerDistance: -3.0
  },
  PHYSICS: {
    fixedDelta: isMobile ? 1/60 : 1/120,
    maxDelta: 0.04,
    gravity: 6.5 // REDUCED gravity (was 9.81)
  },
  AIM: {
    arcMin: 0.35, // More arc (was 0.32) - makes ball float higher
    arcMax: 0.65, // More arc (was 0.60)
    followSpeed: 10.0 // Slower follow speed (was 14.0)
  },
  SCORING: {
    swish: 3,
    regular: 2,
    hudUpdateInterval: 0.5,
    resetDelay: 800, // Longer wait for reset (was 500)
    scoreResetDelay: 3000 // Longer celebration (was 2500)
  },
  BALL: {
    radius: 0.121,
    readyOffset: new THREE.Vector3(0, -0.32, -0.55)
  },
  TIMER: {
    duration: 60,
    autoStart: true
  }
};

/* ---------- State Management ---------- */
class GameState {
  constructor() {
    this.stats = { score: 0, made: 0, attempts: 0, streak: 0 };
    this.canShoot = true;
    this.isPaused = false;
    this.gameActive = true;
    this.lastShotTime = 0;
    this.shotCooldown = 0.8; // Longer cooldown (was 0.5)
    this.frameCount = 0;
    this.lastFPSUpdate = 0;
    this.currentFPS = 60;
  }
  
  reset() {
    this.stats = { score: 0, made: 0, attempts: 0, streak: 0 };
    this.canShoot = true;
    this.gameActive = true;
    this.lastShotTime = 0;
  }
  
  canAttemptShot() {
    const now = performance.now() / 1000;
    return this.canShoot && !this.isPaused && this.gameActive && 
           (now - this.lastShotTime) >= this.shotCooldown;
  }
  
  recordShot() {
    this.lastShotTime = performance.now() / 1000;
    this.stats.attempts++;
  }
  
  recordScore(type) {
    if (type === 'swish') {
      this.stats.score += CONFIG.SCORING.swish;
      this.stats.made++;
      this.stats.streak++;
      return { points: CONFIG.SCORING.swish, message: 'SWISH! +3', className: 'swish' };
    } else if (type === 'score') {
      this.stats.score += CONFIG.SCORING.regular;
      this.stats.made++;
      this.stats.streak++;
      return { points: CONFIG.SCORING.regular, message: '+2', className: 'score' };
    }
    return null;
  }
  
  recordMiss() {
    this.stats.streak = 0;
    return { message: 'Miss', className: 'miss' };
  }
}

const gameState = new GameState();

/* ---------- Renderer Setup ---------- */
const canvas = document.getElementById("scene");
if (!canvas) throw new Error("Canvas element #scene not found");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: CONFIG.RENDER.antialias,
  powerPreference: "high-performance",
  stencil: false,
  depth: true,
  preserveDrawingBuffer: false
});

renderer.setPixelRatio(CONFIG.RENDER.pixelRatio);
renderer.shadowMap.enabled = CONFIG.RENDER.shadows;
if (CONFIG.RENDER.shadows) {
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = CONFIG.RENDER.toneMapping;
renderer.toneMappingExposure = CONFIG.RENDER.exposure;

/* ---------- Scene & Environment ---------- */
const { scene, hoop } = buildScene();
scene.background = new THREE.Color(0x0a0a1a);
if (!isMobile) {
  scene.fog = new THREE.FogExp2(0x0a0a1a, 0.012);
}

/* ---------- Scoreboard ---------- */
const scoreboard = createScoreboard();
scoreboard.position.set(0, 8.5, -13.5);
scoreboard.rotation.y = 0;
scene.add(scoreboard);
if (!isMobile) {
  addScoreboardLighting(scene);
}

if (CONFIG.TIMER.autoStart) {
  startTimer(scoreboard, CONFIG.TIMER.duration);
}

/* ---------- Camera Setup ---------- */
const camera = new THREE.PerspectiveCamera(
  CONFIG.CAMERA.fov,
  window.innerWidth / window.innerHeight,
  CONFIG.CAMERA.near,
  CONFIG.CAMERA.far
);

const PLAYER_POS = new THREE.Vector3(0, CONFIG.CAMERA.playerHeight, CONFIG.CAMERA.playerDistance);
camera.position.copy(PLAYER_POS);
camera.lookAt(hoop.rimCenter);

// Camera shake
let cameraShake = { active: false, intensity: 0, duration: 0 };
const _shakeOffset = new THREE.Vector3();

/* ---------- Ball & Physics ---------- */
const ball = createBall(CONFIG.BALL.radius);
scene.add(ball);

const physics = new BallPhysics(ball, hoop);
physics.gravity = CONFIG.PHYSICS.gravity;

/* ---------- Vector Pool (zero GC) ---------- */
const Vectors = {
  readyOffset: CONFIG.BALL.readyOffset.clone(),
  tempOffset: new THREE.Vector3(),
  camForward: new THREE.Vector3(),
  camRight: new THREE.Vector3(),
  launchDir: new THREE.Vector3(),
  lookAtTarget: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
  spin: new THREE.Vector3(),
  arcVec: new THREE.Vector3(),
  baseLookDir: new THREE.Vector3(),
};

/* ---------- Ball Placement ---------- */
function placeReadyBall() {
  Vectors.tempOffset.copy(Vectors.readyOffset).applyQuaternion(camera.quaternion);
  ball.position.copy(camera.position).add(Vectors.tempOffset);
}

placeReadyBall();

/* ---------- Controls ---------- */
const controls = setupControls();

let debugMode = false;
window.toggleDebug = () => {
  debugMode = !debugMode;
  console.log(`Debug mode: ${debugMode ? 'ON' : 'OFF'}`);
};

/* ---------- HUD Elements ---------- */
const HUD = {
  score: document.getElementById("score"),
  shots: document.getElementById("shots"),
  streak: document.getElementById("streak"),
  message: document.getElementById("message"),
  fps: document.getElementById("fps") || (() => {
    const el = document.createElement('div');
    el.id = 'fps';
    el.style.cssText = 'position:fixed;top:10px;right:10px;color:#0f0;font-family:monospace;z-index:1000;font-size:12px';
    document.body.appendChild(el);
    return el;
  })(),
  timer: document.getElementById("timer")
};

let messageTimeout = null;
function showMessage(text, className, duration = 1100) {
  if (!HUD.message) return;
  if (messageTimeout) clearTimeout(messageTimeout);
  HUD.message.textContent = text;
  HUD.message.className = `message show ${className}`;
  messageTimeout = setTimeout(() => {
    HUD.message.classList.remove("show");
    messageTimeout = null;
  }, duration);
}

function updateHUD() {
  const { stats } = gameState;
  if (HUD.score) HUD.score.textContent = String(stats.score);
  if (HUD.shots) HUD.shots.textContent = `${stats.made}/${stats.attempts}`;
  if (HUD.streak) HUD.streak.textContent = String(stats.streak);
  
  if (HUD.timer && scoreboard.userData.timer !== undefined) {
    const timer = scoreboard.userData.timer;
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    HUD.timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    if (timer <= 10) {
      HUD.timer.setAttribute('data-warning', 'true');
    } else {
      HUD.timer.removeAttribute('data-warning');
    }
  }
  
  updateScoreboardDisplay(scoreboard, stats);
}

/* ---------- Aim & Movement System ---------- */
const MOVEMENT_SPEED = 2.5; // SLOWER movement (was 4.0)
const PAN_SENSITIVITY = 0.002; // Less sensitive panning (was 0.003)

let aimYaw = 0;
let aimPitch = 0;
let baseYaw = 0;
let basePitch = 0;

function recomputeBaseAim() {
  Vectors.baseLookDir.subVectors(hoop.rimCenter, PLAYER_POS).normalize();
  baseYaw = Math.atan2(Vectors.baseLookDir.x, -Vectors.baseLookDir.z);
  basePitch = Math.asin(Vectors.baseLookDir.y);
}

recomputeBaseAim();
aimYaw = baseYaw;
aimPitch = basePitch;

function updateCameraAndPlayer(dt) {
  camera.fov = CONFIG.CAMERA.fov * controls.state.zoom;
  camera.updateProjectionMatrix();
  
  const stick = controls.state.aim;
  if (stick.x !== 0 || stick.y !== 0) {
    PLAYER_POS.x += stick.x * MOVEMENT_SPEED * dt;
    PLAYER_POS.z += stick.y * MOVEMENT_SPEED * dt;
    
    PLAYER_POS.z = Math.max(-7.5, Math.min(PLAYER_POS.z, 0));
    PLAYER_POS.x = Math.max(-7.0, Math.min(PLAYER_POS.x, 7.0));
    
    recomputeBaseAim();
  }
  
  const pan = controls.consumePan();
  aimYaw -= pan.x * PAN_SENSITIVITY;
  aimPitch -= pan.y * PAN_SENSITIVITY;
  
  const MAX_YAW_OFFSET = THREE.MathUtils.degToRad(75);
  aimYaw = THREE.MathUtils.clamp(aimYaw, baseYaw - MAX_YAW_OFFSET, baseYaw + MAX_YAW_OFFSET);
  aimPitch = THREE.MathUtils.clamp(aimPitch, basePitch - 0.2, basePitch + 0.3);
  
  Vectors.camForward.set(
    Math.sin(aimYaw) * Math.cos(aimPitch),
    Math.sin(aimPitch),
    -Math.cos(aimYaw) * Math.cos(aimPitch)
  ).normalize();
  
  if (cameraShake.active) {
    cameraShake.duration -= dt;
    if (cameraShake.duration <= 0) {
      cameraShake.active = false;
    } else {
      _shakeOffset.set(
        (Math.random() - 0.5) * cameraShake.intensity,
        (Math.random() - 0.5) * cameraShake.intensity,
        (Math.random() - 0.5) * cameraShake.intensity
      );
      Vectors.lookAtTarget.copy(camera.position).add(Vectors.camForward).add(_shakeOffset);
    }
  } else {
    Vectors.lookAtTarget.copy(camera.position).add(Vectors.camForward);
  }
  
  camera.lookAt(Vectors.lookAtTarget);
  camera.position.copy(PLAYER_POS);
}

/* ---------- Shooting System ---------- */
function triggerCameraShake(intensity = 0.05, duration = 0.15) {
  cameraShake.active = true;
  cameraShake.intensity = intensity;
  cameraShake.duration = duration;
}

function resetBall() {
  physics.reset(new THREE.Vector3());
  placeReadyBall();
  gameState.canShoot = true;
}

controls.setOnShoot((power) => {
  if (!gameState.canAttemptShot() || physics.active) return;
  if (power < 0.06) return;
  
  gameState.canShoot = false;
  gameState.recordShot();
  
  const TARGET_POWER = 0.5;
  const TOLERANCE = 0.05;
  const isPerfect = Math.abs(power - TARGET_POWER) <= TOLERANCE;
  
  if (isPerfect) {
    power = TARGET_POWER;
    showMessage("PERFECT", "swish", 1500);
    
    Vectors.camForward.subVectors(hoop.rimCenter, ball.position);
    Vectors.camForward.y += 0.2;
    Vectors.camForward.normalize();
  }
  
  const arc = THREE.MathUtils.lerp(CONFIG.AIM.arcMin, CONFIG.AIM.arcMax, power);
  Vectors.arcVec.set(0, arc, 0);
  Vectors.launchDir.copy(Vectors.camForward).add(Vectors.arcVec).normalize();
  
  // REDUCED launch speed calculation
  const idealSpeed = computeIdealSpeed(ball.position, hoop.rimCenter, Vectors.launchDir);
  const speedFactor = THREE.MathUtils.lerp(0.6, 1.1, power); // Lower max speed (was 0.7-1.3)
  const speed = idealSpeed * speedFactor;
  
  Vectors.velocity.copy(Vectors.launchDir).multiplyScalar(speed);
  
  Vectors.camRight.crossVectors(Vectors.camForward, camera.up).normalize();
  Vectors.spin.copy(Vectors.camRight).multiplyScalar(-speed * 4.0); // Less spin (was 5.5)
  
  triggerCameraShake(isPerfect ? 0.08 : 0.03, isPerfect ? 0.2 : 0.1);
  physics.launch(Vectors.velocity, Vectors.spin);
});

/* ---------- Score Handling ---------- */
physics.onScore = (kind) => {
  if (kind === 'miss') {
    const miss = gameState.recordMiss();
    showMessage(miss.message, miss.className, 800);
    triggerCameraShake(0.02, 0.1);
    updateHUD();
    
    if (scoreboard.userData.timer <= 0) endGame();
    return;
  }
  
  const result = gameState.recordScore(kind);
  
  if (result) {
    showMessage(result.message, result.className, 1500); // Longer message (was 1300)
    triggerCameraShake(kind === 'swish' ? 0.06 : 0.04, kind === 'swish' ? 0.18 : 0.12); // Gentler shake
  }
  
  updateHUD();
  
  setTimeout(() => {
    if (gameState.gameActive) resetBall();
  }, CONFIG.SCORING.scoreResetDelay);
  
  if (scoreboard.userData.timer <= 0) endGame();
};

physics.onRest = () => {
  setTimeout(() => {
    if (gameState.gameActive) resetBall();
  }, CONFIG.SCORING.resetDelay);
};

/* ---------- Game Flow ---------- */
function endGame() {
  gameState.gameActive = false;
  stopTimer(scoreboard);
  showMessage(`Final: ${gameState.stats.score}`, 'gameover', 5000);
}

function placePlayerOnParabolaArc() {
  const ARC_RADIUS = 6.75;
  const angle = (Math.random() - 0.5) * Math.PI * 0.8;
  
  PLAYER_POS.x = hoop.rimCenter.x + Math.sin(angle) * ARC_RADIUS;
  PLAYER_POS.z = hoop.rimCenter.z + Math.cos(angle) * ARC_RADIUS;
  
  recomputeBaseAim();
  aimYaw = baseYaw;
  aimPitch = basePitch;
}

function restartGame() {
  gameState.reset();
  placePlayerOnParabolaArc();
  resetTimer(scoreboard, CONFIG.TIMER.duration);
  startTimer(scoreboard, CONFIG.TIMER.duration);
  updateHUD();
  showMessage('New Game!', 'restart', 1500);
  gameState.gameActive = true;
  resetBall();
}

window.restartGame = restartGame;

/* ---------- Physics Calculations ---------- */
function computeIdealSpeed(from, to, dir) {
  const g = CONFIG.PHYSICS.gravity; // Now uses reduced gravity!
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const horiz = Math.sqrt(dx * dx + dz * dz);
  const dy = to.y - from.y;
  const horizDir = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
  
  if (horizDir < 1e-4) return 6.0; // Lower default speed (was 8.5)
  
  const tanTheta = dir.y / horizDir;
  const inv = 1 / (1 + tanTheta * tanTheta);
  const denom = 2 * inv * (horiz * tanTheta - dy);
  
  if (denom <= 0.001) return 6.0;
  
  const s2 = (g * horiz * horiz) / denom;
  return Math.sqrt(Math.max(s2, 3.5)); // Lower minimum speed (was 4.0)
}

/* ---------- Performance Monitoring ---------- */
function updateFPS(dt) {
  gameState.frameCount++;
  gameState.lastFPSUpdate += dt;
  
  if (gameState.lastFPSUpdate >= 0.5) {
    gameState.currentFPS = Math.round(gameState.frameCount / gameState.lastFPSUpdate);
    
    if (HUD.fps) {
      HUD.fps.textContent = `${String(gameState.currentFPS).padStart(3, '0')} FPS`;
      HUD.fps.style.color = gameState.currentFPS > 50 ? '#6ee7b7' :
                            gameState.currentFPS > 30 ? '#ffb347' : '#ff4d4d';
    }
    
    gameState.frameCount = 0;
    gameState.lastFPSUpdate = 0;
  }
}

/* ---------- Main Loop ---------- */
let lastTime = 0;
let accumulator = 0;
let hudTimer = 0;
let netUpdateCounter = 0;
const NET_UPDATE_RATE = 1/30;

function animate(currentTime) {
  requestAnimationFrame(animate);
  
  if (!lastTime) {
    lastTime = currentTime;
    return;
  }
  
  let dt = Math.min((currentTime - lastTime) / 1000, CONFIG.PHYSICS.maxDelta);
  lastTime = currentTime;
  
  if (gameState.isPaused) {
    renderer.render(scene, camera);
    return;
  }
  
  updateFPS(dt);
  updateCameraAndPlayer(dt);
  
  accumulator += dt;
  hudTimer += dt;
  netUpdateCounter += dt;
  
  while (accumulator >= CONFIG.PHYSICS.fixedDelta) {
    if (physics.active) {
      physics.update(CONFIG.PHYSICS.fixedDelta);
    }
    accumulator -= CONFIG.PHYSICS.fixedDelta;
  }
  
  if (hoop.netPhysics) {
    while (netUpdateCounter >= NET_UPDATE_RATE) {
      hoop.netPhysics.update(NET_UPDATE_RATE);
      netUpdateCounter -= NET_UPDATE_RATE;
    }
  }
  
  if (!physics.active) {
    placeReadyBall();
  }
  
  if (hudTimer >= CONFIG.SCORING.hudUpdateInterval) {
    updateHUD();
    hudTimer = 0;
  }
  
  if (gameState.gameActive && scoreboard.userData.timer <= 0) {
    endGame();
  }
  
  renderer.render(scene, camera);
}

/* ---------- Window Management ---------- */
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    gameState.isPaused = true;
  } else {
    gameState.isPaused = false;
    lastTime = performance.now();
  }
});

window.addEventListener("beforeunload", () => {
  stopTimer(scoreboard);
  renderer.dispose();
});

window.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case 'r':
      if (!gameState.gameActive || confirm('Restart game?')) restartGame();
      break;
    case 'p':
      gameState.isPaused = !gameState.isPaused;
      showMessage(gameState.isPaused ? 'PAUSED' : 'RESUMED', 'pause', 800);
      break;
    case 'd':
      toggleDebug();
      break;
  }
});

/* ---------- Start ---------- */
console.log(`FPV Free Throw - Relaxed Mode ${isMobile ? '(Mobile)' : '(Desktop)'}`);
requestAnimationFrame(animate);
updateHUD();
showMessage('Starting...', 'ready', 2000);