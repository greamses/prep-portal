import * as THREE from 'three';
import { RoomEnvironment }  from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer }   from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }       from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }  from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }       from 'three/addons/postprocessing/OutputPass.js';

import { FirstPersonControls } from '../../shared/js/engine/FirstPersonControls.js';
import { VirtualJoystick }     from '../../shared/js/ui/VirtualJoystick.js';
import { RoomManager }         from '../../shared/js/engine/RoomManager.js';
import { ChemistryRoom }       from './ChemistryRoom.js';
import { StorageRoom }         from './StorageRoom.js';
import { Boundary }            from './lab/Boundary.js';
import { Economy }             from './lab/Economy.js';
import { Hands }               from './lab/Hands.js';

// ── Renderer ──────────────────────────────────────────────────────────────────

const canvas   = document.getElementById('lab-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled     = true;
renderer.shadowMap.type        = THREE.PCFSoftShadowMap;
renderer.toneMapping           = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure   = 0.92;

// ── Scene + camera ────────────────────────────────────────────────────────────

const scene  = new THREE.Scene();
scene.fog    = new THREE.Fog(0x9ab0c0, 12, 22);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 50);
camera.position.set(0, 1.65, 2.5);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// Camera must be in the scene graph so its child hands get rendered
scene.add(camera);

// ── Post-processing ───────────────────────────────────────────────────────────

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Gentle glow only — keep the threshold high and the strength low so the bright
// ceiling fixtures/windows don't bloom into blinding white flares.
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.12, 0.4, 0.92,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ── Loading screen ────────────────────────────────────────────────────────────

const loadingScreen = document.getElementById('loading-screen');
let _loadingDone = false;
function finishLoading() {
  if (_loadingDone || !loadingScreen) return;
  _loadingDone = true;
  loadingScreen.classList.add('loaded');
  setTimeout(() => { loadingScreen.style.display = 'none'; }, 550);
}
// Safety net: never trap the user behind the loader if a fetch stalls
setTimeout(finishLoading, 9000);

// ── Player rig ────────────────────────────────────────────────────────────────
// The player IS the camera: movement, look and collision drive it directly, and
// the hands (with the held-object holder between them) are its children. Hands
// and the economy are player-global (they persist across rooms), so they live
// here, not in a room.
const hands   = new Hands(camera, { onReady: finishLoading });
const economy = new Economy({ max: 3, cost: 5, currency: '$' });

// ── Rooms ─────────────────────────────────────────────────────────────────────
// Each room is a lazily-built, self-contained module. The manager keeps the
// current room + any neighbour through an OPEN door active; the rest is dropped.
// `portalDoor` is the shared gate the connecting door writes; both rooms read it.
const portalDoor = { isOpen: false };
const rooms = new RoomManager(scene, { camera, holder: hands.holder, economy, portalDoor });
rooms.register('chemistry', (scn, ctx) => new ChemistryRoom(scn, ctx));
rooms.register('storage',   (scn, ctx) => new StorageRoom(scn, ctx));
const startRoom = rooms.start('chemistry');
camera.position.copy(startRoom.spawn);

// The shared wall + connecting door between the two rooms. Owned by neither room
// and never hidden, so the opening stays sealed from whichever side you're on.
const boundary = new Boundary(scene, { gate: portalDoor });

// ── Controls ──────────────────────────────────────────────────────────────────
// Colliders come from the active rooms and are refreshed each frame; the room
// bounds are generous because walls (real colliders) keep the player contained.
const controls = new FirstPersonControls(camera, canvas, {
  colliders : rooms.colliders,
  roomMin   : new THREE.Vector3(-40, 0, -40),
  roomMax   : new THREE.Vector3( 40, 0,  40),
});

const joystick = new VirtualJoystick(controls, {
  backHref: '../index.html',
  onPinchZoom: factor => applyZoom(zoom * factor),   // two-finger pinch on mobile
});

// ── Start overlay ─────────────────────────────────────────────────────────────

const overlay  = document.getElementById('start-overlay');
const enterBtn = document.getElementById('enter-btn');
const backLink = document.getElementById('desktop-back');

// On phones, force landscape once we're fullscreen. Unsupported on desktop /
// iOS Safari, where lock() is absent or rejects — ignore it there.
function lockLandscape() {
  const o = screen.orientation;
  if (o && typeof o.lock === 'function') {
    Promise.resolve(o.lock('landscape')).catch(() => {});
  }
}

function enterLab() {
  overlay.classList.add('hidden');
  backLink.classList.add('visible');
  hands.show();

  // Go fullscreen, THEN grab pointer lock. Requesting the lock during the
  // fullscreen transition makes the browser reject it silently (which leaves
  // you with a free mouse cursor and no movement) — so wait for fullscreen
  // to settle, and fall back to locking immediately if fullscreen is blocked.
  const el = document.documentElement;
  const fsReq = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (fsReq && !document.fullscreenElement) {
    Promise.resolve(fsReq.call(el)).then(
      () => { lockLandscape(); controls.lock(); },
      () => controls.lock(),
    );
  } else {
    lockLandscape();
    controls.lock();
  }
}

enterBtn.addEventListener('click', enterLab);

// On touch devices there's no pointer lock — entering just reveals the room
enterBtn.addEventListener('touchend', e => { e.preventDefault(); enterLab(); }, { passive: false });

controls.on('unlock', () => {
  overlay.classList.remove('hidden');
  backLink.classList.remove('visible');
  hands.hide();
});

// ── Raycasting for interactable objects ───────────────────────────────────────

const raycaster     = new THREE.Raycaster();
const crosshair     = document.getElementById('crosshair');
const hint          = document.getElementById('interact-hint');
const flameControls = document.getElementById('flame-controls');   // mobile +/- buttons
const REACH         = 1.8;   // must be close to an object before it's interactable

let _activeTarget = null;

function checkInteraction() {
  // Active room(s) + the always-present boundary door.
  const interactables = [...rooms.interactables, ...boundary.interactables];

  // While holding something, keep it as the target so E always drops it —
  // even when you're not looking at anything.
  const held = interactables.find(i => i.held);

  let target = null;
  if (held) {
    target = held;
  } else {
    // Cast through the screen-centre crosshair.
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const hits = raycaster.intersectObjects(interactables.map(i => i.mesh), true);
    if (hits.length > 0 && hits[0].distance < REACH) {
      const hitObj = hits[0].object;
      target = interactables.find(i => i.mesh === hitObj || i.mesh.getObjectById(hitObj.id) !== undefined);
      // Skip pickups that are mid-fall / shattered (not grabbable right now)
      if (target && target.isInteractable === false) target = null;
    }
  }

  const changed = target !== _activeTarget;
  _activeTarget = target;

  const hot = !!target;
  if (crosshair) crosshair.classList.toggle('hot', hot);
  hands.setHolding(!!held);           // both hands cradle the held object
  hands.setReaching(hot && !held);    // reaching only when a hand is free
  hint.classList.toggle('visible', hot);

  if (target) {
    const verb = target.hintText ?? (target.isOpen ? 'close' : 'open');
    hint.innerHTML = target.isBunsen
      ? `Press <kbd>E</kbd> to ${verb} · <kbd>+</kbd>/<kbd>−</kbd> flame`
      : `Press <kbd>E</kbd> to ${verb}`;
  }

  // Show the on-screen flame trim buttons only while aiming at a burner.
  if (flameControls) flameControls.classList.toggle('show', !!(target && target.isBunsen));

  if (changed) controls.setInteractTarget(target);
}

// Clench the hand when the player actually grabs something.
function tryGrabPulse() {
  if (_activeTarget) hands.pulseGrab();
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyE' && !e.repeat) tryGrabPulse();
  // Trim the flame of the burner you're aiming at: + / − (or [ / ]).
  const t = controls.interactTarget;
  if (t && t.isBunsen) {
    if (e.code === 'Equal' || e.code === 'NumpadAdd'      || e.code === 'BracketRight') t.increase();
    if (e.code === 'Minus' || e.code === 'NumpadSubtract' || e.code === 'BracketLeft')  t.decrease();
  }
});

const mobileInteract = document.getElementById('btn-interact-mobile');
if (mobileInteract) {
  mobileInteract.addEventListener('touchstart', tryGrabPulse, { passive: true });
}

// Mobile flame trim buttons (shown only while aiming at a burner — see checkInteraction)
function bindFlameBtn(id, dir) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = controls.interactTarget;
    if (t && t.isBunsen) (dir > 0 ? t.increase() : t.decrease());
  }, { passive: false });
}
bindFlameBtn('btn-flame-up',    1);
bindFlameBtn('btn-flame-down', -1);

// ── Resize ────────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloom.resolution.set(window.innerWidth, window.innerHeight);
});

// ── Zoom (narrow the FOV to see distant apparatus) ────────────────────────────

const zoomBtn  = document.getElementById('btn-zoom');
const BASE_FOV = camera.fov;
let zoom = 1;
function applyZoom(z) {
  zoom = THREE.MathUtils.clamp(z, 1, 3.5);
  camera.fov = BASE_FOV / zoom;
  camera.updateProjectionMatrix();
  if (zoomBtn) zoomBtn.textContent = `${Math.round(zoom * 10) / 10}×`;
}
// Desktop wheel: while aiming at a burner, trim its flame; otherwise zoom.
window.addEventListener('wheel', e => {
  const t = controls.interactTarget;
  if (t && t.isBunsen) { (e.deltaY < 0 ? t.increase() : t.decrease()); return; }
  applyZoom(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
}, { passive: true });
// Mobile: a button that cycles 1× → 2× → 3× (two-finger pinch is smooth — see VirtualJoystick)
if (zoomBtn) {
  zoomBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    applyZoom(zoom >= 3 ? 1 : Math.round(zoom) + 1);
  }, { passive: false });
}

// ── Focus mode ─────────────────────────────────────────────────────────────────
// Toggle: zoom in on whatever you're looking at and pin the view into a small
// cone around it (no walking, no drifting away) so you can examine an apparatus.
// Toggle again to release back to free movement.
const focusBtn = document.getElementById('btn-focus');
const _focusBox    = new THREE.Box3();
const _focusCenter = new THREE.Vector3();
let _focused = false;

function toggleFocus() {
  if (_focused) {
    controls.setFocus(null);
    applyZoom(1);
    _focused = false;
  } else {
    const t = controls.interactTarget || _activeTarget;
    if (t && t.mesh) {
      _focusBox.setFromObject(t.mesh);          // true geometry centre (groups sit at the origin)
      _focusBox.getCenter(_focusCenter);
    } else {
      camera.getWorldDirection(_focusCenter);
      _focusCenter.multiplyScalar(1.6).add(camera.position);
    }
    controls.setFocus(_focusCenter);
    applyZoom(2.4);
    _focused = true;
  }
  if (focusBtn) focusBtn.classList.toggle('on', _focused);
}

document.addEventListener('keydown', e => { if (e.code === 'KeyF' && !e.repeat) toggleFocus(); });
if (focusBtn) {
  focusBtn.addEventListener('touchstart', e => { e.preventDefault(); toggleFocus(); }, { passive: false });
}

// Leaving the lab (Esc / unlock) drops focus so you never get stuck zoomed-in.
controls.on('unlock', () => { if (_focused) toggleFocus(); });

// ── Hand clearance ────────────────────────────────────────────────────────────
// Cast forward from the camera each frame; if a surface is close, the hands
// retract so they sit in front of it instead of poking through.

const clearRay = new THREE.Raycaster();
const _fwd     = new THREE.Vector3();

function under(obj, root) { for (let p = obj; p; p = p.parent) if (p === root) return true; return false; }

function handClearance() {
  camera.getWorldDirection(_fwd);
  clearRay.set(camera.position, _fwd);
  clearRay.far = 3;
  const hits = clearRay.intersectObjects(scene.children, true);
  for (const h of hits) {
    if (under(h.object, camera)) continue;      // skip the hands / holder / held object
    return h.distance;
  }
  return Infinity;
}

// ── Loop ──────────────────────────────────────────────────────────────────────

const clock = new THREE.Clock();
const _prevPos = new THREE.Vector3().copy(camera.position);
let _frame = 0;

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.08);
  _frame++;

  // Resolve the active room set, tick its contents, and feed its colliders to
  // the controls before moving the player.
  rooms.update(delta, camera.position);
  boundary.update(delta);
  controls.colliders = [...rooms.colliders, ...boundary.colliders];

  controls.update(delta);
  const moving = Math.hypot(camera.position.x - _prevPos.x, camera.position.z - _prevPos.z) > 1e-3;
  _prevPos.copy(camera.position);

  checkInteraction();

  // The clearance ray walks the whole scene, so only recast every few frames.
  if (_frame % 3 === 0) hands.setClearance(handClearance());
  hands.update(delta, moving);

  composer.render();
});
