/* =====================================================================
   RUBIK'S CUBE — realistic 3D, keyboard + on-screen keypad
   ---------------------------------------------------------------------
   The camera is fixed. The whole cube lives in `cubeGroup` whose
   orientation the player changes with the arrow keys (90 degree, no
   limit). Face turns (U D L R F B) are resolved against the *viewer*
   frame, so "F" always twists whatever face is currently in front,
   whatever colour happens to be there — exactly like turning a cube in
   your hands.

   A layer turn reparents the affected cubies under a world-space pivot,
   animates a 90 degree rotation, then bakes the transform back into
   cubeGroup and snaps to the lattice so state never drifts.
   ===================================================================== */

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// GSAP for playful side-menu motion (same CDN module the nav uses).
let gsap = null;
import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm")
  .then((m) => (gsap = m.gsap || m.default || null))
  .catch(() => {});

/* ---------- constants ------------------------------------------------ */
const SP = 1.0; // lattice spacing
const HALF = SP / 2;
const TURN_MS = 160; // face-turn duration
const ROT_MS = 220; // whole-cube rotation duration
const SCRAMBLE_MS = 95; // per-turn duration while shuffling (snappier)
const SCRAMBLE_LEN = 22;

// Solved-state sticker colours, keyed by the cubie-local outward face.
const FACE_COLORS = {
  "0,1,0": 0xf7f4ec, // up      — white
  "0,-1,0": 0xf4c95d, // down    — yellow
  "1,0,0": 0xf07a7a, // right   — red
  "-1,0,0": 0xf0a868, // left    — orange
  "0,0,1": 0x7cc47c, // front   — green
  "0,0,-1": 0x6fb7e8, // back    — blue
};

const WHITE = 0xf7f4ec; // cross colour (the "up" face in the solved state)
const YELLOW = 0xf4c95d; // opposite of white — never part of the white cross
const BLACKOUT = 0x1b1916; // dimmed sticker colour in learning mode

// Viewer-frame outward directions in WORLD space (camera never moves).
const VIEW = {
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  R: new THREE.Vector3(1, 0, 0),
  L: new THREE.Vector3(-1, 0, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1),
};

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);

const DIRS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

/* ---------- DOM ------------------------------------------------------ */
const canvas = document.getElementById("cube-canvas");
const wrap = document.getElementById("cube-canvas-wrap");
const modal = document.getElementById("cube-modal");
const movesEl = document.getElementById("stat-moves");
const timeEl = document.getElementById("stat-time");
const winBanner = document.getElementById("win-banner");
const winDetail = document.getElementById("win-detail");
const segBtns = document.querySelectorAll(".cube-seg-btn");
const carton = document.getElementById("carton");

/* ---------- renderer / scene ----------------------------------------- */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
let camDist = 8.6;
function placeCamera() {
  // fixed three-quarter view so front (+z), right (+x) and top (+y) read
  const d = camDist;
  camera.position.set(d * 0.46, d * 0.4, d * 0.79);
  camera.lookAt(0, 0, 0);
}
placeCamera();

scene.add(new THREE.AmbientLight(0xffffff, 0.62));
const key = new THREE.DirectionalLight(0xffffff, 0.85);
key.position.set(6, 10, 7);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 1;
key.shadow.camera.far = 40;
key.shadow.camera.left = -8;
key.shadow.camera.right = 8;
key.shadow.camera.top = 8;
key.shadow.camera.bottom = -8;
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.32);
fill.position.set(-7, -3, -5);
scene.add(fill);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.ShadowMaterial({ opacity: 0.15 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2.8;
ground.receiveShadow = true;
scene.add(ground);

/* ---------- build the cube ------------------------------------------ */
const cubeGroup = new THREE.Group();
scene.add(cubeGroup);

const cubies = [];
const cubieGeo = new RoundedBoxGeometry(0.96, 0.96, 0.96, 4, 0.12);
const plasticMat = new THREE.MeshStandardMaterial({
  color: 0x26231f,
  roughness: 0.62,
  metalness: 0.05,
});
const stickerGeo = new RoundedBoxGeometry(0.78, 0.78, 0.06, 3, 0.1);

function createCubie(x, y, z) {
  const cubie = new THREE.Mesh(cubieGeo, plasticMat);
  cubie.castShadow = true;
  cubie.receiveShadow = true;
  cubie.position.set(x * SP, y * SP, z * SP);
  cubie.userData.stickers = [];

  const coords = { x, y, z };
  for (const dir of DIRS) {
    const axis = dir.x ? "x" : dir.y ? "y" : "z";
    const sign = dir.x || dir.y || dir.z;
    if (coords[axis] !== sign) continue; // interior face

    const color = FACE_COLORS[`${dir.x},${dir.y},${dir.z}`];
    const sticker = new THREE.Mesh(
      stickerGeo,
      new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0 }),
    );
    sticker.position.copy(dir).multiplyScalar(HALF - 0.01);
    if (axis === "x") sticker.rotation.y = Math.PI / 2;
    else if (axis === "y") sticker.rotation.x = Math.PI / 2;
    sticker.userData.baseColor = color;
    cubie.add(sticker);
    cubie.userData.stickers.push({ dir: dir.clone(), color });
  }

  // Cross-piece identity is fixed to the cubie (its colours never change):
  //  • the white centre and the 4 side centres are reference pieces
  //  • the 4 edges carrying white are the cross edges
  //  • corners and the non-white edges are not part of the white cross
  const colors = cubie.userData.stickers.map((s) => s.color);
  const n = colors.length;
  const hasWhite = colors.includes(WHITE);
  const hasYellow = colors.includes(YELLOW);
  cubie.userData.crossPiece =
    n === 1 ? colors[0] !== YELLOW : n === 2 ? hasWhite : false;
  // First layer = the cross plus the 4 white corners.
  cubie.userData.firstLayerPiece =
    cubie.userData.crossPiece || (n === 3 && hasWhite);
  // Second layer = first layer plus the 4 middle (equator) edges.
  cubie.userData.secondLayerPiece =
    cubie.userData.firstLayerPiece || (n === 2 && !hasWhite && !hasYellow);
  // Last layer = every piece carrying the (yellow) top colour.
  cubie.userData.lastLayerPiece = hasYellow;

  return cubie;
}

// Fill `group` with 26 cubies, collecting them into `arr`.
function populateCube(group, arr) {
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue; // hidden core
        const cubie = createCubie(x, y, z);
        group.add(cubie);
        arr.push(cubie);
      }
}
populateCube(cubeGroup, cubies);

/* ---------- helpers -------------------------------------------------- */
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function snapQuaternion(q) {
  const m = new THREE.Matrix4().makeRotationFromQuaternion(q);
  const e = m.elements;
  [0, 1, 2, 4, 5, 6, 8, 9, 10].forEach((i) => (e[i] = Math.round(e[i])));
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

const easeInOut = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/* ---------- move engine --------------------------------------------- */
const queue = [];
let animating = false;
let moveCount = 0;
let started = false;
let solved = true;
let scrambling = false; // a shuffle sequence is playing
let inspecting = false; // 15s inspection window (arrows only, no face turns)
let gameMode = "challenge"; // "challenge" | "algo"
let prime = false; // keypad prime toggle

function enqueue(move) {
  queue.push(move);
  pump();
}

function pump() {
  if (animating || queue.length === 0) return;
  const move = queue.shift();
  if (move.type === "face") runFaceTurn(move);
  else if (move.type === "rot") runCubeRotate(move);
  else if (move.type === "after") {
    move.fn();
    pump();
  }
}

// Resolve which cubies sit on the viewer's `letter` face, given the
// current whole-cube orientation, and twist them about that world axis.
function runFaceTurn(move) {
  const { letter, prime: pr, scramble: isScramble, dur, double } = move;
  const duration = (double ? 1.5 : 1) * (dur || TURN_MS);
  animating = true;
  const dirWorld = VIEW[letter];
  const q = cubeGroup.quaternion;

  if (!isScramble && move.notation) showMove(move.notation);

  const layer = move.layer ?? 1; // 1 = outer face, 0 = middle slice
  cubeGroup.updateMatrixWorld(true);
  const active = cubies.filter((c) => {
    const wp = c.position.clone().applyQuaternion(q);
    return Math.round(wp.dot(dirWorld) / SP) === layer;
  });

  // Clockwise (seen from outside the face) = negative rotation about +normal.
  // double = a single 180 degree sweep (one rotation, not two quarters).
  const angle = (pr ? 1 : -1) * (Math.PI / 2) * (double ? 2 : 1);
  const pivot = new THREE.Group();
  scene.add(pivot);
  active.forEach((c) => pivot.attach(c));

  const finish = () => {
    pivot.quaternion.setFromAxisAngle(dirWorld, angle);
    pivot.updateMatrixWorld(true);
    active.forEach((c) => {
      cubeGroup.attach(c);
      c.position.set(
        Math.round(c.position.x / SP) * SP,
        Math.round(c.position.y / SP) * SP,
        Math.round(c.position.z / SP) * SP,
      );
      c.quaternion.copy(snapQuaternion(c.quaternion));
    });
    scene.remove(pivot);
    animating = false;
    if (!isScramble) registerMove(); // a turn (incl. a 180) is one move
    pump();
  };

  const start = performance.now();
  (function step(now) {
    const t = Math.min((now - start) / duration, 1);
    pivot.quaternion.setFromAxisAngle(dirWorld, angle * easeInOut(t));
    if (t < 1) requestAnimationFrame(step);
    else finish();
  })(performance.now());
}

// Spin the whole cube 90 degrees about a world axis (no baking needed).
function runCubeRotate({ axis, dir }) {
  animating = true;
  const startQ = cubeGroup.quaternion.clone();
  const deltaQ = new THREE.Quaternion().setFromAxisAngle(
    axis,
    dir * (Math.PI / 2),
  );
  const targetQ = new THREE.Quaternion().multiplyQuaternions(deltaQ, startQ);

  const finish = () => {
    cubeGroup.quaternion.copy(snapQuaternion(targetQ));
    animating = false;
    pump();
  };

  const start = performance.now();
  (function step(now) {
    const t = Math.min((now - start) / ROT_MS, 1);
    cubeGroup.quaternion.copy(startQ).slerp(targetQ, easeInOut(t));
    if (t < 1) requestAnimationFrame(step);
    else finish();
  })(performance.now());
}

/* ---------- solved detection (orientation-invariant) ---------------- */
function isSolved() {
  const faces = {};
  const n = new THREE.Vector3();
  for (const c of cubies) {
    for (const s of c.userData.stickers) {
      n.copy(s.dir).applyQuaternion(c.quaternion).round();
      const k = `${n.x},${n.y},${n.z}`;
      (faces[k] || (faces[k] = new Set())).add(s.color);
    }
  }
  return Object.values(faces).every((set) => set.size === 1);
}

/* ---------- stats / win --------------------------------------------- */
let timerStart = 0;
let timerId = null;

function fmtTime(ms) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function startTimer() {
  if (timerId) return;
  timerStart = performance.now();
  timerId = setInterval(() => {
    timeEl.textContent = fmtTime(performance.now() - timerStart);
  }, 250);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function registerMove(count = true) {
  if (count) {
    moveCount += 1;
    movesEl.textContent = moveCount;
  }
  if (started && !solved && isSolved()) handleSolved();
}

function handleSolved() {
  solved = true;
  started = false;
  stopTimer();
  stopInspection();
  setStatus("");
  winDetail.textContent = `${moveCount} moves · ${fmtTime(
    performance.now() - timerStart,
  )}`;
  winBanner.hidden = false;
  requestAnimationFrame(() => winBanner.classList.add("show"));
}

function hideBanner() {
  winBanner.classList.remove("show");
  winBanner.hidden = true;
}

/* ---------- player actions ------------------------------------------ */
const LONG_MS = 280; // hold a face this long → 180 degree (double) turn

// Middle slices follow the named outer face but on the centre layer (0).
const SLICES = { M: "L", E: "D", S: "F" };

// The solve starts on the first input after inspection (challenge mode only).
function ensureSolveStarted() {
  if (started || gameMode !== "challenge") return;
  solved = false;
  started = true;
  moveCount = 0;
  movesEl.textContent = "0";
  hideBanner();
  stopInspection();
  setStatus("");
  startTimer();
}

// notation = the key shown above the cube (U / R' / M2 …).
// layer: 1 = outer face (default), 0 = middle slice. double = single 180.
function enqueueTurn(notation, letter, layer, isPrime, double) {
  if (scrambling) return;
  ensureSolveStarted();
  const note = notation + (isPrime ? "'" : "") + (double ? "2" : "");
  enqueue({
    type: "face",
    letter,
    layer,
    prime: isPrime,
    double,
    notation: note,
  });
}

// Tap = single 90 (fires on release); hold = a single 180 sweep (fires once
// the long-press threshold passes).
let press = null;
function pressMove(notation, letter, layer, isPrime) {
  // can't turn faces while covered or during inspection (arrows only then)
  if (scrambling || cartonOn() || inspecting) return;
  releaseMove();
  press = { notation, letter, layer, prime: isPrime, timer: null };
  press.timer = setTimeout(() => {
    if (!press) return;
    press.timer = null;
    enqueueTurn(press.notation, press.letter, press.layer, press.prime, true);
  }, LONG_MS);
}
function releaseMove() {
  if (!press) return;
  const p = press;
  press = null;
  if (p.timer) {
    clearTimeout(p.timer);
    enqueueTurn(p.notation, p.letter, p.layer, p.prime, false);
  }
}

function rotateCube(which) {
  if (scrambling) return; // ignore input while a shuffle is playing
  // After inspection (uncovered, challenge), the first rotate starts the timer.
  if (gameMode === "challenge" && !cartonOn() && !inspecting) ensureSolveStarted();
  switch (which) {
    case "left":
      enqueue({ type: "rot", axis: AXIS_Y, dir: 1 });
      break;
    case "right":
      enqueue({ type: "rot", axis: AXIS_Y, dir: -1 });
      break;
    case "up":
      enqueue({ type: "rot", axis: AXIS_X, dir: 1 });
      break;
    case "down":
      enqueue({ type: "rot", axis: AXIS_X, dir: -1 });
      break;
  }
}

const LETTERS = Object.keys(VIEW);

function scramble() {
  if (animating || scrambling) return;
  queue.length = 0;
  hideBanner();
  releaseMove();
  scrambling = true;
  solved = false;
  started = false;
  stopTimer();
  moveCount = 0;
  movesEl.textContent = "0";
  timeEl.textContent = "0:00";

  // Queue the shuffle as animated turns, then finalize once they've all played.
  let prevAxisKey = null;
  for (let i = 0; i < SCRAMBLE_LEN; i++) {
    let letter;
    do {
      letter = LETTERS[(Math.random() * LETTERS.length) | 0];
    } while (axisKey(letter) === prevAxisKey);
    prevAxisKey = axisKey(letter);
    queue.push({
      type: "face",
      letter,
      prime: Math.random() < 0.5,
      scramble: true,
      dur: SCRAMBLE_MS,
    });
  }
  queue.push({ type: "after", fn: finishScramble });
  pump();
}

function finishScramble() {
  scrambling = false;
  moveCount = 0;
  movesEl.textContent = "0";
  timeEl.textContent = "0:00";
  solved = isSolved(); // virtually never solved after a shuffle
  started = false; // the solve timer starts on Shift + Space
  if (cartonOn()) setStatus("Press Space (or tap) to open & inspect");
}

function axisKey(letter) {
  const d = VIEW[letter];
  return `${Math.abs(d.x)}${Math.abs(d.y)}${Math.abs(d.z)}`;
}

/* ---------- move label, carton cover, inspection -------------------- */
const moveLabel = document.getElementById("move-label");
const statusLabel = document.getElementById("status-label");

let moveLabelTimer = null;
function showMove(note) {
  if (!moveLabel) return;
  moveLabel.textContent = note;
  moveLabel.classList.remove("show");
  void moveLabel.offsetWidth; // restart the pop animation
  moveLabel.classList.add("show");
  if (moveLabelTimer) clearTimeout(moveLabelTimer);
  moveLabelTimer = setTimeout(() => moveLabel.classList.remove("show"), 750);
}

function setStatus(text) {
  if (!statusLabel) return;
  statusLabel.textContent = text || "";
  statusLabel.classList.toggle("show", !!text);
}

// The #carton DOM element only tracks state (+ the tap-hint); the visible
// box is a 3D mesh (see cartonAnimate) that rotates with the cube.
const cartonOn = () => carton && carton.classList.contains("on");
function cartonCover() {
  if (carton) carton.classList.add("on");
  cartonAnimate("cover");
}
function cartonUncover() {
  if (carton) carton.classList.remove("on");
  cartonAnimate("uncover");
}
function cartonHide() {
  if (carton) carton.classList.remove("on");
  cartonAnimate("hide");
}

let inspectTimer = null;
function stopInspection() {
  if (inspectTimer) clearInterval(inspectTimer);
  inspectTimer = null;
  inspecting = false;
}
function startInspection() {
  stopInspection();
  inspecting = true; // arrows can rotate to inspect; face turns are locked
  let left = 15;
  setStatus("Inspect (rotate only): " + left);
  inspectTimer = setInterval(() => {
    left -= 1;
    if (left > 0) setStatus("Inspect (rotate only): " + left);
    else {
      stopInspection(); // inspecting → false; now any key starts the solve
      setStatus("Go! Turn or rotate to start");
    }
  }, 1000);
}

// Entry / reset: solve the cube, drop the cover on, then shuffle hidden
// behind it. Only the full cube uses the cover (practice modes skip it).
function newScramble() {
  if (animating || scrambling) return;
  queue.length = 0;
  releaseMove();
  stopInspection();
  hideBanner();
  rebuildSolved();
  cubeGroup.quaternion.identity();
  solved = true;
  started = false;
  moveCount = 0;
  movesEl.textContent = "0";
  timeEl.textContent = "0:00";
  stopTimer();

  if (practiceMode !== "full") {
    cartonHide();
    setStatus("");
    return;
  }
  cartonCover();
  setStatus("");
  setTimeout(scramble, 620); // let the box fully drop + go opaque, then shuffle
}

// Opening the cover is one-way: slide it off → inspect. You cannot re-cover
// or re-shuffle afterwards — only Reset starts a fresh covered scramble.
function openCover() {
  if (!cartonOn() || scrambling) return;
  cartonUncover();
  startInspection();
}


function rebuildSolved() {
  let idx = 0;
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const c = cubies[idx++];
        c.position.set(x * SP, y * SP, z * SP);
        c.quaternion.identity();
      }
}

// Reset = a fresh covered scramble (the only way to re-cover after opening).
function reset() {
  newScramble();
}

function setPrime(on) {
  prime = on;
  segBtns.forEach((b) =>
    b.classList.toggle(
      "cube-seg-btn--active",
      (b.dataset.dir === "ccw") === on
    )
  );
}

/* ---------- practice modes ------------------------------------------ */
// Each mode blacks out the blocks that aren't part of the step being
// practised, so the learner can focus on just those pieces.
//   full  — the whole cube
//   cross — the white cross (centre + 4 cross edges + side centres)
//   first — the full first layer (cross + the 4 white corners)
let practiceMode = "full";

function pieceShown(c) {
  if (practiceMode === "cross") return c.userData.crossPiece;
  if (practiceMode === "first") return c.userData.firstLayerPiece;
  if (practiceMode === "second") return c.userData.secondLayerPiece;
  // OLL & PLL both focus on the last (yellow) layer.
  if (practiceMode === "oll" || practiceMode === "pll")
    return c.userData.lastLayerPiece;
  return true;
}

function applyPractice() {
  for (const c of cubies) {
    const show = pieceShown(c);
    c.children.forEach((sticker) => {
      sticker.material.color.setHex(
        show ? sticker.userData.baseColor : BLACKOUT,
      );
    });
  }
}

function setPractice(mode) {
  practiceMode = mode;
  applyPractice();
}

/* ---------- state picker (left sidebar, three.js previews) ---------- */
// Render a real little cube to a PNG for each selectable state, so the
// sidebar shows photographic previews instead of flat icons.
function buildStateThumbs() {
  const r = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  r.setPixelRatio(2);
  r.setSize(184, 184);

  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  cam.position.set(3.6, 3.9, 5.6);
  cam.lookAt(0, -0.15, 0);
  sc.add(new THREE.AmbientLight(0xffffff, 0.78));
  const dl = new THREE.DirectionalLight(0xffffff, 0.7);
  dl.position.set(5, 9, 6);
  sc.add(dl);

  // Render a fresh cube for each state — optional setup moves (for OLL/PLL),
  // then black out everything that isn't part of the step.
  const shot = (setup, key) => {
    const group = new THREE.Group();
    const arr = [];
    populateCube(group, arr);
    if (setup) applyAlgoInstant(arr, setup);
    if (key)
      arr.forEach((c) =>
        c.children.forEach((s) =>
          s.material.color.setHex(
            c.userData[key] ? s.userData.baseColor : BLACKOUT
          )
        )
      );
    sc.add(group);
    r.render(sc, cam);
    sc.remove(group);
    return r.domElement.toDataURL("image/png");
  };

  const thumbs = {
    full: shot(null, null),
    cross: shot(null, "crossPiece"),
    first: shot(null, "firstLayerPiece"),
    second: shot(null, "secondLayerPiece"),
    // OLL — a real OLL case (last layer mis-oriented) on the last layer.
    oll: shot("R U R' U R U2 R'", "lastLayerPiece"),
    // PLL — a PLL case (oriented, mis-permuted) on the last layer.
    pll: shot("R U R' U' R' F R2 U' R' U' R U R' F'", "lastLayerPiece"),
  };

  r.dispose();
  return thumbs;
}

let statesReady = false;
function ensureStateThumbs() {
  if (statesReady) return;
  statesReady = true;
  const thumbs = buildStateThumbs();
  document.querySelectorAll("[data-state]").forEach((card) => {
    const img = card.querySelector("img");
    if (img) img.src = thumbs[card.dataset.state] || "";
  });
}

function selectState(state) {
  setPractice(state);
  document
    .querySelectorAll("[data-state]")
    .forEach((card) =>
      card.setAttribute("aria-pressed", String(card.dataset.state === state)),
    );
  // The cover/inspection flow is full-cube only; practice modes drop it.
  if (state === "full") newScramble();
  else {
    cartonHide();
    stopInspection();
    setStatus("");
  }
}

// Playful staggered reveal of the side-menu cards (one GSAP call).
function animateSideMenu() {
  if (!gsap) return;
  const items = modal.querySelectorAll(
    gameMode === "algo" ? ".mode-algos .algo-cat" : ".mode-states .state-card"
  );
  gsap.from(items, {
    x: -36,
    autoAlpha: 0,
    stagger: 0.06,
    duration: 0.45,
    ease: "back.out(1.7)",
    overwrite: true,
  });
}

function toggleStates() {
  if (gameMode === "challenge") ensureStateThumbs();
  modal.classList.toggle("states-open");
  if (modal.classList.contains("states-open")) animateSideMenu();
}

/* ---------- Practice (Algo Lab): popular algorithms ----------------- */
// Grouped into accordion categories, easiest → hardest.
const ALGO_GROUPS = [
  {
    cat: "Basics",
    items: [
      { name: "Sexy Move", moves: "R U R' U'" },
      { name: "Sledgehammer", moves: "R' F R F'" },
      { name: "Right F2L pair", moves: "U R U' R'" },
    ],
  },
  {
    cat: "Orient last layer (OLL)",
    items: [
      { name: "OLL cross", moves: "F R U R' U' F'" },
      { name: "Sune", moves: "R U R' U R U2 R'" },
      { name: "Anti-Sune", moves: "R' U' R U' R' U2 R" },
    ],
  },
  {
    cat: "Permute last layer (PLL)",
    items: [
      { name: "T-Perm", moves: "R U R' U' R' F R2 U' R' U' R U R' F'" },
      { name: "Y-Perm", moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
    ],
  },
  {
    cat: "Fun patterns",
    items: [
      { name: "Checkerboard", moves: "M2 E2 S2" },
      { name: "Six spots", moves: "U D' R L' F B' U D'" },
      { name: "Plus / minus", moves: "U2 R2 L2 U2 R2 L2" },
      { name: "Cube in a cube", moves: "F L F U' R U F2 L2 U' L' B D' B' L2 U" },
    ],
  },
];

// Apply a single move instantly to a fresh cube (group is at identity).
function applyMoveInstant(arr, letter, layer, isPrime, double) {
  const dir = VIEW[letter];
  const angle = (isPrime ? 1 : -1) * (Math.PI / 2) * (double ? 2 : 1);
  const q = new THREE.Quaternion().setFromAxisAngle(dir, angle);
  arr.forEach((c) => {
    if (Math.round(c.position.clone().dot(dir)) !== layer) return;
    c.position.applyQuaternion(q);
    c.position.set(
      Math.round(c.position.x),
      Math.round(c.position.y),
      Math.round(c.position.z)
    );
    c.quaternion.premultiply(q);
    c.quaternion.copy(snapQuaternion(c.quaternion));
  });
}

function applyAlgoInstant(arr, moves) {
  const tokens = moves.match(/[URFDLBMES](['2])?/g) || [];
  for (const tok of tokens) {
    const base = tok[0];
    const mod = tok.slice(1);
    const isSlice = SLICES[base] !== undefined;
    applyMoveInstant(
      arr,
      isSlice ? SLICES[base] : base,
      isSlice ? 0 : 1,
      mod === "'",
      mod === "2"
    );
  }
}

// Render a little cube preview for each algorithm (the move sequence applied).
let algoThumbsBuilt = false;
function buildAlgoThumbs() {
  if (algoThumbsBuilt) return;
  algoThumbsBuilt = true;
  const r = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  r.setPixelRatio(2);
  r.setSize(140, 140);
  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  cam.position.set(3.6, 3.9, 5.6);
  cam.lookAt(0, -0.15, 0);
  sc.add(new THREE.AmbientLight(0xffffff, 0.78));
  const dl = new THREE.DirectionalLight(0xffffff, 0.7);
  dl.position.set(5, 9, 6);
  sc.add(dl);
  ALGO_GROUPS.forEach((g) =>
    g.items.forEach((algo) => {
      const group = new THREE.Group();
      const arr = [];
      populateCube(group, arr);
      sc.add(group);
      applyAlgoInstant(arr, algo.moves);
      r.render(sc, cam);
      algo.thumb = r.domElement.toDataURL("image/png");
      sc.remove(group);
    })
  );
  r.dispose();
}

let algoListBuilt = false;
function buildAlgoList() {
  if (algoListBuilt) return;
  algoListBuilt = true;
  buildAlgoThumbs();
  const host = document.getElementById("algo-list");
  if (!host) return;
  let rank = 1;
  ALGO_GROUPS.forEach((grp, gi) => {
    const cat = document.createElement("div");
    cat.className = "algo-cat" + (gi === 0 ? " open" : "");
    const head = document.createElement("button");
    head.className = "algo-cat-head";
    head.innerHTML = `<span>${grp.cat}</span><span class="algo-cat-chev">▾</span>`;
    const body = document.createElement("div");
    body.className = "algo-cat-body";
    if (gi !== 0) body.style.height = "0px"; // closed by default
    head.addEventListener("click", () => toggleAccordion(cat, body));
    grp.items.forEach((algo) => {
      const card = document.createElement("button");
      card.className = "algo-card tc-" + ((rank - 1) % 6);
      card.innerHTML =
        `<span class="algo-rank">${rank++}</span>` +
        `<img class="algo-thumb" alt="" src="${algo.thumb || ""}" />` +
        `<span class="algo-body"><span class="algo-name">${algo.name}</span>` +
        `<span class="algo-moves">${algo.moves}</span></span>`;
      card.addEventListener("click", () => playAlgo(algo, card));
      body.appendChild(card);
    });
    cat.appendChild(head);
    cat.appendChild(body);
    host.appendChild(cat);
  });
}

// Animate an accordion category open/close (GSAP height; instant fallback).
function toggleAccordion(cat, body) {
  const opening = !cat.classList.contains("open");
  cat.classList.toggle("open", opening);
  if (!gsap) {
    body.style.height = opening ? "auto" : "0px";
    return;
  }
  gsap.killTweensOf(body);
  if (opening) {
    gsap.fromTo(
      body,
      { height: 0, opacity: 0 },
      {
        height: "auto",
        opacity: 1,
        duration: 0.34,
        ease: "power2.out",
        onComplete: () => (body.style.height = "auto"),
      }
    );
  } else {
    gsap.to(body, { height: 0, opacity: 0, duration: 0.28, ease: "power2.in" });
  }
}

function playAlgo(algo, card) {
  if (gameMode !== "algo" || animating || scrambling) return;
  queue.length = 0;
  releaseMove();
  rebuildSolved();
  cubeGroup.quaternion.identity();
  moveCount = 0;
  movesEl.textContent = "0";
  setStatus(algo.name + " — " + algo.moves);
  document
    .querySelectorAll(".algo-card")
    .forEach((c) => c.setAttribute("aria-pressed", String(c === card)));

  const tokens = algo.moves.match(/[URFDLBMES](['2])?/g) || [];
  setTimeout(() => {
    for (const tok of tokens) {
      const base = tok[0];
      const mod = tok.slice(1);
      const isSlice = SLICES[base] !== undefined;
      enqueueTurn(
        base,
        isSlice ? SLICES[base] : base,
        isSlice ? 0 : 1,
        mod === "'",
        mod === "2"
      );
    }
  }, 260);
}

/* ---------- modal open / close (fullscreen) ------------------------- */
let modalOpen = false;
const padFab = document.querySelector('[data-act="pad-toggle"]');

// Keypad is hidden by default on large screens; shown by default on small.
function setPad(open) {
  modal.classList.toggle("pad-open", open);
  if (padFab) {
    padFab.setAttribute("aria-pressed", String(open));
    padFab.setAttribute(
      "aria-label",
      open ? "Hide on-screen controls" : "Show on-screen controls",
    );
  }
  resize(); // showing/hiding the pad changes the canvas height
}

function togglePad() {
  setPad(!modal.classList.contains("pad-open"));
}

function openModal(mode) {
  if (modalOpen) return;
  gameMode = mode === "algo" ? "algo" : "challenge";
  modalOpen = true;
  modal.classList.add("open");
  modal.classList.toggle("algo", gameMode === "algo");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("cube-active");
  setPad(window.matchMedia("(max-width: 760px)").matches);
  // try true fullscreen for immersion; the overlay covers the viewport regardless
  if (modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
  startRender();
  requestAnimationFrame(() => {
    resize();
    if (gameMode === "algo") {
      // Algo Lab: no cover/shuffle — pick an algorithm to watch.
      cartonHide();
      stopInspection();
      rebuildSolved();
      cubeGroup.quaternion.identity();
      stopTimer();
      started = false;
      solved = true;
      moveCount = 0;
      movesEl.textContent = "0";
      timeEl.textContent = "0:00";
      buildAlgoList();
      setStatus("Pick an algorithm →");
      modal.classList.add("states-open");
      animateSideMenu();
    } else {
      // Challenge: cover the cube and shuffle (hidden behind the cover).
      newScramble();
    }
  });
}

function closeModal() {
  if (!modalOpen) return;
  modalOpen = false;
  modal.classList.remove("open", "algo", "states-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cube-active");
  stopTimer();
  stopInspection();
  stopRender();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

/* ---------- keyboard ------------------------------------------------- */
window.addEventListener("keydown", (e) => {
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  if (!modalOpen) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal("challenge");
    }
    return;
  }

  const upper = e.key.length === 1 ? e.key.toUpperCase() : e.key;

  // Face / middle-slice turns. Shift = prime (reverse); hold = 180 (double).
  // Auto-repeat is ignored — the long-press is timed, not key-repeat driven.
  if (VIEW[upper]) {
    e.preventDefault();
    if (!e.repeat) pressMove(upper, upper, 1, e.shiftKey);
    return;
  }
  if (SLICES[upper]) {
    e.preventDefault();
    if (!e.repeat) pressMove(upper, SLICES[upper], 0, e.shiftKey);
    return;
  }

  if (e.repeat) return; // ignore held-key repeats for the actions below

  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      rotateCube("left");
      break;
    case "ArrowRight":
      e.preventDefault();
      rotateCube("right");
      break;
    case "ArrowUp":
      e.preventDefault();
      rotateCube("up");
      break;
    case "ArrowDown":
      e.preventDefault();
      rotateCube("down");
      break;
    case " ":
      e.preventDefault();
      openCover(); // slide the cover off (one-way) → inspect, then just turn
      break;
    case "Enter":
      e.preventDefault();
      reset();
      break;
    case "Escape":
      closeModal();
      break;
  }
});

window.addEventListener("keyup", (e) => {
  const upper = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  if (VIEW[upper] || SLICES[upper]) releaseMove();
});
window.addEventListener("blur", () => {
  releaseMove();
  if (spaceTimer) {
    clearTimeout(spaceTimer);
    spaceTimer = null;
  }
});

/* ---------- pointer + wheel ----------------------------------------- */
// Swipe to spin the whole cube one quarter-turn toward the next face
// (quantized, so face turns stay axis-aligned to the viewer); wheel zooms.
const SWIPE = 42; // px threshold
let downX = 0;
let downY = 0;
let swiping = false;

// Once uncovered the box can be dragged anywhere BEHIND the cube (even off
// screen) — never in front. We drag it in a screen-parallel plane fixed at
// its (behind) depth, so it can roam in x/y but stays behind.
const raycaster = new THREE.Raycaster();
const dragPlane = new THREE.Plane();
const dragOffset = new THREE.Vector3();
const ndc = new THREE.Vector2();
const camDir = new THREE.Vector3();
let draggingBox = false;

function setNDC(e) {
  const r = canvas.getBoundingClientRect();
  ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}

const boxDraggable = () =>
  cartonMesh && cartonMesh.visible && cartonMesh.parent === scene;

canvas.addEventListener("pointerdown", (e) => {
  if (boxDraggable()) {
    setNDC(e);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(cartonMesh, false);
    if (hit.length) {
      draggingBox = true;
      camera.getWorldDirection(camDir);
      dragPlane.setFromNormalAndCoplanarPoint(camDir, cartonMesh.position);
      dragOffset.copy(hit[0].point).sub(cartonMesh.position);
      canvas.setPointerCapture(e.pointerId);
      return;
    }
  }
  swiping = true;
  downX = e.clientX;
  downY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!draggingBox) return;
  setNDC(e);
  raycaster.setFromCamera(ndc, camera);
  const pt = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(dragPlane, pt)) {
    pt.sub(dragOffset);
    // keep it behind the cube: never closer to the camera than the cube back
    const behindZ = -1.9;
    if (pt.z > behindZ) pt.z = behindZ;
    cartonMesh.position.copy(pt);
  }
});
canvas.addEventListener("pointerup", (e) => {
  if (draggingBox) {
    draggingBox = false;
    return;
  }
  if (!swiping) return;
  swiping = false;
  const dx = e.clientX - downX;
  const dy = e.clientY - downY;
  if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE) return;
  // natural drag: swiping right pulls the left face into view, etc.
  if (Math.abs(dx) > Math.abs(dy)) rotateCube(dx > 0 ? "left" : "right");
  else rotateCube(dy > 0 ? "up" : "down");
});
canvas.addEventListener("pointercancel", () => {
  swiping = false;
  draggingBox = false;
});
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    camDist = clamp(camDist + e.deltaY * 0.006, 6, 14);
    placeCamera();
  },
  { passive: false },
);

/* ---------- on-screen keypad + buttons ------------------------------ */
document
  .querySelectorAll("[data-rot]")
  .forEach((b) => b.addEventListener("click", () => rotateCube(b.dataset.rot)));
// Face + middle-slice buttons use press/release so a long-press = 180.
function wirePress(b, notation, letter, layer) {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pressMove(notation, letter, layer, prime);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
    b.addEventListener(ev, releaseMove),
  );
}
document
  .querySelectorAll("[data-face]")
  .forEach((b) => wirePress(b, b.dataset.face, b.dataset.face, 1));
document
  .querySelectorAll("[data-slice]")
  .forEach((b) => wirePress(b, b.dataset.slice, SLICES[b.dataset.slice], 0));
// Slide the pill switch to the chosen mode, pause so it's seen, then open.
const startBtns = document.querySelectorAll('[data-act="start"]');
startBtns.forEach((b) =>
  b.addEventListener("click", () => {
    if (b.classList.contains("mode-switch-btn")) {
      startBtns.forEach((o) =>
        o.classList.toggle("mode-switch-btn--active", o === b)
      );
    }
    setTimeout(() => openModal(b.dataset.mode || "challenge"), 320);
  })
);
document
  .querySelectorAll('[data-act="exit"]')
  .forEach((b) => b.addEventListener("click", closeModal));
// Scramble + reset both start a fresh covered scramble.
document
  .querySelectorAll('[data-act="scramble"]')
  .forEach((b) => b.addEventListener("click", newScramble));
document
  .querySelectorAll('[data-act="reset"]')
  .forEach((b) => b.addEventListener("click", reset));
// Tap the cover to slide it off (one-way → inspect).
if (carton) carton.addEventListener("click", openCover);
segBtns.forEach((b) =>
  b.addEventListener("click", () => setPrime(b.dataset.dir === "ccw"))
);
if (padFab) padFab.addEventListener("click", togglePad);
document
  .querySelectorAll('[data-act="states"]')
  .forEach((b) => b.addEventListener("click", toggleStates));
document
  .querySelectorAll("[data-state]")
  .forEach((b) =>
    b.addEventListener("click", () => selectState(b.dataset.state)),
  );

document.addEventListener("fullscreenchange", () => {
  // if the user leaves OS fullscreen via gesture, keep the overlay state sane
  if (!document.fullscreenElement && modalOpen) {
    // overlay still covers the viewport; nothing else to do
  }
});

/* ---------- resize + render loop ------------------------------------ */
function resize() {
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

// Only render while the cube is on screen (the canvas lives in the modal),
// so the landing page doesn't spin the GPU for nothing.
let rendering = false;
function startRender() {
  if (rendering) return;
  rendering = true;
  loop();
}
function stopRender() {
  rendering = false;
}
function loop() {
  if (!rendering) return;
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
}

/* ---------- 3D CARTON MODEL GENERATOR ------------------------------- */
let cartonMesh = null;

// Our paint-blob palette (matches the home hero blobs).
const COVER_ACCENTS = ["#f4c95d", "#6fb7e8", "#f07a7a", "#7cc47c", "#f0a868", "#e8c8ff"];

function drawBlob(ctx, cx, cy, r, color, seed) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.78 + 0.26 * Math.sin(a * 3 + seed));
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// Quotes from "past cubers", paired with an Unsplash portrait.
const CUBER_QUOTES = [
  { q: "Solve the cross first — the rest follows.", n: "Theo · 0:42", img: "photo-1500648767791-00dcc994a43e" },
  { q: "Slow is smooth, smooth is fast.", n: "Mia · 0:31", img: "photo-1494790108377-be9c29b29330" },
  { q: "Look ahead — never pause.", n: "Sam · 0:55", img: "photo-1507003211169-0a1dd7228f2d" },
  { q: "F2L is just muscle memory.", n: "Ava · 0:38", img: "photo-1438761681033-6461ffad8d80" },
  { q: "Patience first, speed later.", n: "Leo · 1:10", img: "photo-1502685104226-ee32379fefbe" },
];
const unsplashUrl = (id) =>
  `https://images.unsplash.com/${id}?w=160&h=160&fit=crop&crop=faces&q=70`;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(" ");
  let line = "";
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, y);
      line = w + " ";
      y += lh;
    } else line = test;
  }
  ctx.fillText(line.trim(), x, y);
}

// A playful doodle (star / spiral / squiggle / sparkle).
function drawDoodle(ctx, x, y, kind, color, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  if (kind === 0) {
    // star
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      ctx.lineTo(Math.cos(a2) * s * 0.45, Math.sin(a2) * s * 0.45);
    }
    ctx.closePath();
    ctx.fill();
  } else if (kind === 1) {
    // spiral
    ctx.beginPath();
    for (let t = 0; t < 5; t += 0.15) {
      const r = t * s * 0.18;
      const px = Math.cos(t) * r,
        py = Math.sin(t) * r;
      t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  } else if (kind === 2) {
    // squiggle
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.quadraticCurveTo(
        i * s * 0.4 + s * 0.2,
        (i % 2 ? -1 : 1) * s * 0.5,
        (i + 1) * s * 0.4,
        0
      );
    }
    ctx.stroke();
  } else {
    // 4-point sparkle
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(0, 0, s, 0);
    ctx.quadraticCurveTo(0, 0, 0, s);
    ctx.quadraticCurveTo(0, 0, -s, 0);
    ctx.quadraticCurveTo(0, 0, 0, -s);
    ctx.fill();
  }
  ctx.restore();
}

// A little cube mascot with a face.
function drawMascot(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  roundRect(ctx, -s + 4, -s + 6, 2 * s, 2 * s, s * 0.32);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, -s, -s, 2 * s, 2 * s, s * 0.32);
  ctx.fill();
  ctx.fillStyle = "#2a2723";
  ctx.beginPath();
  ctx.arc(-s * 0.34, -s * 0.12, s * 0.15, 0, 7);
  ctx.arc(s * 0.34, -s * 0.12, s * 0.15, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "#2a2723";
  ctx.lineWidth = s * 0.12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, s * 0.08, s * 0.42, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();
  // little feet
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, s);
  ctx.lineTo(-s * 0.4, s * 1.3);
  ctx.moveTo(s * 0.4, s);
  ctx.lineTo(s * 0.4, s * 1.3);
  ctx.stroke();
  ctx.restore();
}

// A warped sticky note holding a cuber's photo + quote.
function drawQuoteNote(ctx, tex, cx, cy, deg, color, note) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((deg * Math.PI) / 180);
  // shadow + paper (curled bottom)
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  roundRect(ctx, -86, -96, 176, 200, 8);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-90, -98);
  ctx.lineTo(90, -94);
  ctx.lineTo(86, 96);
  ctx.quadraticCurveTo(0, 116, -88, 96); // warped, curled bottom
  ctx.closePath();
  ctx.fill();
  // tape
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(-30, -110, 60, 20);
  // quote + name
  ctx.fillStyle = "#2a2723";
  ctx.textAlign = "center";
  ctx.font = "600 17px 'Shantell Sans', cursive, sans-serif";
  wrapText(ctx, '"' + note.q + '"', 0, 24, 150, 22);
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(note.n, 0, 90);
  // photo placeholder ring (filled once Unsplash loads)
  ctx.fillStyle = "rgba(42,39,35,0.12)";
  ctx.beginPath();
  ctx.arc(0, -52, 34, 0, 7);
  ctx.fill();
  ctx.restore();

  // async: drop the portrait into the circle (CORS-safe — taints nothing)
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.beginPath();
    ctx.arc(0, -52, 32, 0, 7);
    ctx.clip();
    ctx.drawImage(img, -32, -84, 64, 64);
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -52, 33, 0, 7);
    ctx.stroke();
    ctx.restore();
    tex.needsUpdate = true;
  };
  img.onerror = () => {};
  img.src = unsplashUrl(note.img);
}

// One face texture: paint-blob bg + doodles/mascot + big logo + a quote note.
// `seed` varies placement per face so the wrap reads differently each side,
// and elements bleed off the edges so they continue around corners.
function createCoverTexture(seed) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const rnd = (i) => {
    const v = Math.sin((seed + 1) * 91.7 + i * 53.3) * 43758.5;
    return v - Math.floor(v);
  };

  ctx.fillStyle = "#fbf8f2";
  ctx.fillRect(0, 0, 512, 512);

  // prominent blob background, bleeding past the edges to wrap corners
  ctx.globalAlpha = 0.62;
  for (let i = 0; i < 8; i++) {
    const cx = rnd(i) * 600 - 44;
    const cy = rnd(i + 10) * 600 - 44;
    const r = 84 + rnd(i + 20) * 86;
    drawBlob(ctx, cx, cy, r, COVER_ACCENTS[i % COVER_ACCENTS.length], seed + i);
  }
  ctx.globalAlpha = 1;

  // playful doodles + a mascot to busy the background
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 4; i++) {
    drawDoodle(
      ctx,
      40 + rnd(i + 40) * 432,
      40 + rnd(i + 50) * 432,
      (seed + i) % 4,
      COVER_ACCENTS[(seed + i + 2) % COVER_ACCENTS.length],
      16 + rnd(i + 60) * 10
    );
  }
  drawMascot(
    ctx,
    rnd(70) > 0.5 ? 70 : 442,
    rnd(71) > 0.5 ? 80 : 432,
    26,
    COVER_ACCENTS[(seed + 3) % COVER_ACCENTS.length]
  );
  ctx.globalAlpha = 1;

  // printed frame to the edges
  ctx.strokeStyle = "rgba(42,39,35,0.5)";
  ctx.lineWidth = 7;
  ctx.strokeRect(16, 16, 480, 480);

  const tex = new THREE.CanvasTexture(canvas);
  // big logo across the top + an edge-bleed copy that wraps onto the next face
  const logo = new Image();
  logo.onload = () => {
    // soft light disc so the logo reads clearly over the busy blobs
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(256, 158, 152, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(logo, 108, 12, 296, 296);
    const ex = rnd(30) > 0.5 ? 410 : -74;
    const ey = rnd(31) > 0.5 ? 410 : -74;
    ctx.drawImage(logo, ex, ey, 180, 180);
    tex.needsUpdate = true;
  };
  logo.src = "/logo/logo-light.svg";

  // a cuber quote note along the bottom (draws + async loads its photo)
  const note = CUBER_QUOTES[seed % CUBER_QUOTES.length];
  drawQuoteNote(ctx, tex, 256, 408, rnd(8) > 0.5 ? -4 : 5, "#fff39a", note);
  return tex;
}

// Compiles and inserts the carton mesh as a child of the cube group, so it
// rotates with the cube when the whole cube is spun (arrow keys). The bottom
// (-Y) face is left open, like a real box sliding over the cube.
function build3DPlaneCarton() {
  const face = (seed) => {
    const tex = createCoverTexture(seed);
    tex.anisotropy = 4;
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.82,
      metalness: 0.03,
      transparent: true,
      opacity: 0.0,
    });
  };
  const openMat = new THREE.MeshBasicMaterial({ visible: false }); // open bottom

  // BoxGeometry order: +X, -X, +Y, -Y, +Z, -Z
  const materials = [face(1), face(2), face(3), openMat, face(4), face(5)];

  // Big enough that the cube never pokes out, even mid-turn (a corner sweeps
  // to ≈ 2.1 from centre during a face turn).
  const geo = new RoundedBoxGeometry(4.5, 4.5, 4.5, 4, 0.1);
  cartonMesh = new THREE.Mesh(geo, materials);
  cartonMesh.castShadow = true;
  cartonMesh.visible = false;
  cubeGroup.add(cartonMesh);
}

// Cover / uncover the cube with the carton box.
//   cover   — drops straight down from the top to enclose the cube
//   uncover — lifts up off the top, then settles behind the cube (stays in view)
//   hide    — lifts away and fades out (reset / open)
const CARTON_TOP = new THREE.Vector3(0, 7, 0);
const CARTON_ENCLOSE = new THREE.Vector3(0, 0, 0);
const CARTON_BEHIND = new THREE.Vector3(0, 0.4, -5.6); // world space (behind cube)
let cartonTweenId = null;

function cartonSetOpacity(v) {
  if (!cartonMesh) return;
  const mats = Array.isArray(cartonMesh.material)
    ? cartonMesh.material
    : [cartonMesh.material];
  mats.forEach((m) => {
    if (!m.map) return; // leave the open (mapless) bottom face untouched
    m.opacity = v;
    m.visible = v > 0.02;
  });
  cartonMesh.visible = v > 0.02;
}

function cartonAnimate(mode) {
  if (!cartonMesh) return;
  if (cartonTweenId) cancelAnimationFrame(cartonTweenId);

  const mapped = Array.isArray(cartonMesh.material)
    ? cartonMesh.material.find((m) => m.map)
    : cartonMesh.material;
  const oFrom = mapped ? mapped.opacity : 0;
  const sFrom = cartonMesh.scale.x;

  let from, to, arc, sTo, oTo, dur, hideAtEnd;
  if (mode === "cover") {
    // Parent to the cube so the box rotates WITH the cube while covered.
    cubeGroup.add(cartonMesh);
    cartonMesh.quaternion.identity();
    cartonMesh.visible = true;
    cartonMesh.position.copy(CARTON_TOP); // start above → drop down
    from = CARTON_TOP.clone();
    to = CARTON_ENCLOSE.clone();
    arc = 0;
    sTo = 1.0;
    oTo = 1;
    dur = 500;
    hideAtEnd = false;
  } else if (mode === "uncover") {
    // Detach to world space so spinning the cube leaves the box behind it.
    scene.attach(cartonMesh);
    cartonMesh.visible = true;
    from = cartonMesh.position.clone();
    to = CARTON_BEHIND.clone();
    arc = 3.6; // lift off the top, then settle behind
    sTo = 0.66;
    oTo = 0.95;
    dur = 720;
    hideAtEnd = false;
  } else {
    // hide
    from = cartonMesh.position.clone();
    to = CARTON_TOP.clone();
    arc = 0;
    sTo = 0.9;
    oTo = 0;
    dur = 360;
    hideAtEnd = true;
  }

  const start = performance.now();
  (function step(now) {
    const t = Math.min((now - start) / dur, 1);
    const e = easeInOut(t);
    cartonMesh.position.lerpVectors(from, to, e);
    if (arc) cartonMesh.position.y += Math.sin(Math.PI * t) * arc;
    cartonMesh.scale.setScalar(sFrom + (sTo - sFrom) * e);
    cartonSetOpacity(oFrom + (oTo - oFrom) * e);
    if (t < 1) {
      cartonTweenId = requestAnimationFrame(step);
    } else {
      cartonTweenId = null;
      if (hideAtEnd) cartonMesh.visible = false;
    }
  })(performance.now());
}

// Build Carton mesh inside the active ThreeJS Scene
build3DPlaneCarton();
