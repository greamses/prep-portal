// main.js — Alien Angle: shoot hidden saucers by their angular position (0–180°)
import * as THREE from 'three';
import { CONFIG, DEG, makeAimDir } from './config.js';
import { initAudio, setSoundEnabled, setMusicEnabled, startMusic, playShoot, playHit, playMiss } from './audio.js';
import { buildEnvironment, updateEnvironment } from './environment.js';
import { buildTurret } from './turret.js';
import { buildSpaceship } from './spaceship.js';
import { buildProjectile } from './projectile.js';
import { buildProtractor } from './protractors.js';
import { setupControls } from './controls.js';
import { setupHUD } from './hud.js';

/* ---------- renderer / scene / camera ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: CONFIG.render.antialias, powerPreference: 'high-performance' });
renderer.setPixelRatio(CONFIG.render.pixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = CONFIG.render.shadows;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1.5, 0.1, 400);
const clock = new THREE.Clock();

/* ---------- world ---------- */
const env = buildEnvironment(scene);
const turret = buildTurret(scene);
const ship = buildSpaceship(scene);
const proj = buildProjectile(scene);
const protractor = buildProtractor(scene);
const controls = setupControls();
const hud = setupHUD();

/* ---------- game state ---------- */
const game = {
  currentAngle: 90,
  difficulty: 'easy',
  showProtractor: false,
  alive: false,
  flying: false,
  spawnT: 1,
  reveal: null,                 // 'hit' | 'miss' | null
  basePos: new THREE.Vector3(),
  target: { angle: 90, dist: 14, size: 1, hue: 120 },
  stats: { score: 0, made: 0, attempts: 0 },
};
const _dir = new THREE.Vector3();
const _muzzle = new THREE.Vector3();

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

// Frame the protractor + play area on any aspect ratio (incl. portrait phones)
function frameCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const fovV = CONFIG.camera.fov * DEG;
  const halfNeed = 12.5;                      // half of the ~25-unit play box
  const distH = halfNeed / Math.tan(fovV / 2);
  const distW = halfNeed / (Math.tan(fovV / 2) * aspect);
  const dist = Math.max(22, distH, distW);
  camera.aspect = aspect;
  camera.fov = CONFIG.camera.fov;
  camera.position.set(0, 8.5, dist);
  camera.lookAt(0, 6.5, 0);
  camera.updateProjectionMatrix();
}

function setAngle(deg) {
  game.currentAngle = clamp(deg, CONFIG.aimClamp[0], CONFIG.aimClamp[1]);
  turret.setAim(0, game.currentAngle);
  protractor.setCurrent(game.currentAngle);
  controls.setKnob(game.currentAngle);
  hud.setCurrent(game.showProtractor ? game.currentAngle : null);
}

function spawnWave() {
  const t = game.target;
  t.angle = Math.round(rand(CONFIG.spawnAngle[0], CONFIG.spawnAngle[1]));
  t.dist = rand(CONFIG.distMin, CONFIG.distMax);
  t.size = rand(CONFIG.sizeMin, CONFIG.sizeMax);
  t.hue = rand(0, 360);
  ship.setHue(t.hue);
  makeAimDir(t.angle, game.basePos).multiplyScalar(t.dist);
  ship.group.position.copy(game.basePos);
  ship.group.scale.setScalar(0.001);
  ship.group.visible = false;            // saucer is HIDDEN — you only get its angle
  protractor.setTarget(t.angle);
  turret.setDisplay(`${t.angle}°`);      // target shown on the turret's screen
  game.alive = true;
  game.flying = false;
  game.reveal = null;
  hud.message(`NEW CONTACT · ${t.angle}°`, '', 1300);
}

function fire() {
  if (!game.alive || game.flying || game.reveal) return;
  game.flying = true;
  game.stats.attempts++;
  makeAimDir(game.currentAngle, _dir);
  turret.getMuzzleWorld(_muzzle);
  proj.launch(_muzzle, _dir, game.target.dist);
  turret.flash();
  playShoot();
  hud.updateStats(game.stats);
}

function resolve(detPoint) {
  game.flying = false;
  game.alive = false;
  const t = game.target;
  const angErr = Math.abs(game.currentAngle - t.angle);
  const angSize = Math.atan((1.7 * t.size) / t.dist) / DEG;   // apparent radius
  const tol = CONFIG.baseTolDeg[game.difficulty] + angSize;

  // reveal the saucer at its true angular position
  makeAimDir(t.angle, game.basePos).multiplyScalar(t.dist);
  ship.group.position.copy(game.basePos);
  ship.group.scale.setScalar(t.size);
  ship.group.visible = true;
  game.spawnT = 0;

  if (angErr <= tol) {
    game.reveal = 'hit';
    game.stats.made++;
    game.stats.score += baseScore() + Math.round((CONFIG.sizeMax - t.size) * 12);
    proj.explode(game.basePos);
    playHit();
    hud.message('DIRECT HIT!', 'success', 1500);
    setTimeout(() => { ship.group.visible = false; }, 260);
    setTimeout(spawnWave, 1300);
  } else {
    game.reveal = 'miss';
    proj.explode(detPoint);
    playMiss();
    hud.message(`MISS · off by ${angErr.toFixed(0)}°`, 'miss', 1600);
    setTimeout(() => { ship.group.visible = false; }, 1300);
    setTimeout(spawnWave, 1500);
  }
  hud.updateStats(game.stats);
}

function baseScore() { return game.difficulty === 'hard' ? 30 : game.difficulty === 'medium' ? 20 : 10; }

/* ---------- input ---------- */
controls.onAim(setAngle);
controls.onShoot(fire);

const keys = new Set();
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) fire(); return; }
  if (e.repeat) return;
  if (e.code === 'KeyP') setProtractor();
  else if (e.code === 'KeyF') toggleFullscreen();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

/* ---------- settings ---------- */
function setProtractor(force) {
  game.showProtractor = force !== undefined ? force : !game.showProtractor;
  protractor.setVisible(game.showProtractor);
  turret.setBeam(game.showProtractor);      // turret beams light to reveal it
  hud.setCurrent(game.showProtractor ? game.currentAngle : null);
  const c = document.getElementById('set-protractor'); if (c) c.checked = game.showProtractor;
}
function requestFullscreenSafe(el) {
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (fn) { try { fn.call(el); } catch (_) {} }
}
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else requestFullscreenSafe(document.documentElement);
}
function wireSettings() {
  const gear = document.getElementById('gear-btn');
  const panel = document.getElementById('settings-panel');
  if (gear && panel) gear.addEventListener('click', () => panel.classList.toggle('open'));
  document.querySelectorAll('#settings-panel [data-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      game.difficulty = btn.dataset.diff;
      document.querySelectorAll('#settings-panel [data-diff]').forEach(b => b.classList.toggle('active', b === btn));
    });
  });
  const a = document.getElementById('set-protractor');
  if (a) a.addEventListener('change', (e) => setProtractor(e.target.checked));
  const s = document.getElementById('set-sound');
  if (s) s.addEventListener('change', (e) => setSoundEnabled(e.target.checked));
  const m = document.getElementById('set-music');
  if (m) m.addEventListener('change', (e) => setMusicEnabled(e.target.checked));
  const fs = document.getElementById('fullscreen-btn');
  if (fs) fs.addEventListener('click', toggleFullscreen);
}

/* ---------- resize ---------- */
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  frameCamera();
}
window.addEventListener('resize', resize);

/* ---------- loop ---------- */
let loaderHidden = false;
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // keyboard aim
  if (!game.flying && !game.reveal) {
    let dA = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) dA += 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) dA -= 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) dA += 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) dA -= 1;
    if (dA) setAngle(game.currentAngle + dA * CONFIG.panRateDeg * dt);
  }

  turret.update(dt);
  protractor.pulse(t);

  if (ship.group.visible) {
    if (game.spawnT < 1) {
      game.spawnT = Math.min(1, game.spawnT + dt * 3);
      ship.group.scale.setScalar(game.target.size * (1 - Math.pow(1 - game.spawnT, 3)));
    }
    ship.update(t);
    ship.group.position.copy(game.basePos);
    ship.group.position.y += Math.sin(t * 1.6) * 0.2;
  }

  if (game.flying) {
    const det = proj.update(dt);
    if (det) resolve(det);
  } else {
    proj.dock(turret.getMuzzleWorld(_muzzle), makeAimDir(game.currentAngle, _dir));
  }
  proj.updateExplosion(dt);
  updateEnvironment(env, dt);

  renderer.render(scene, camera);
  if (!loaderHidden) { loaderHidden = true; hud.hideLoader(); }
}

/* ---------- boot ---------- */
function boot() {
  const kick = () => { initAudio(); startMusic(); window.removeEventListener('pointerdown', kick); };
  window.addEventListener('pointerdown', kick);
  wireSettings();
  resize();
  setAngle(90);
  spawnWave();
  hud.updateStats(game.stats);
  renderer.setAnimationLoop(animate);
}
boot();
