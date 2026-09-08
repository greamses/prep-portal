/* ============================================================================
   PYTHAGORAS — the scene  (prep-math/activity/pythagoras/index.js)
   ----------------------------------------------------------------------------
   One slider runs the whole proof, the way the Surface Area tab runs a net:
   drag from left to right and the triangle grows its three squares, the big
   leg square is cut into four, and the pieces slide across to fill the square
   on the hypotenuse.

   The geometry all comes from ./figure.js and is exact. Because Perigal's
   dissection is a TRANSLATION dissection, no piece ever has to turn — each one
   is a single mesh whose geometry is built once and only slid about, which is
   also why the pieces meet edge-to-edge at the end instead of nearly meeting.
   ========================================================================== */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildFigure, rigidMotion, boundsOf } from './figure.js';

/* --- CONFIGURATION STATE --------------------------------------------------- */
const configState = {
  a: 3,
  b: 4,
  showLabels: true,
  showExplanation: true,
  multicolor: true,
};

/* --- THE SCRIPT -----------------------------------------------------------
   Every number below is a position on the 0–100 slider. Keeping them in one
   table means the pacing can be retuned without hunting through the code. */
const T = {
  triangle:  [0,  10],
  growShort: [11, 21],
  growLong:  [15, 26],
  growHyp:   [21, 34],
  cut:       [44, 52],
  part:      [52, 60],
  /* The four pieces go first and the small square goes last, so you watch the
     hole appear and only then see what fits it. */
  movePiece: (i) => [58 + i * 3, 78 + i * 3],   // the last one lands at 87
  moveWhole: [86, 97],
  settle:    [97, 100],
};
const LAST_LANDING = T.movePiece(3)[1];

/* --- PALETTE --------------------------------------------------------------
   Read from theme.css rather than written here, so the figure is in the site's
   own accents and follows a re-theme. The four pieces are four shades of ONE
   token on purpose: however far they travel they still read as the square they
   were cut from. */
function shades(token, count) {
  const base = new THREE.Color(themeToken(token, '#7cc47c'));
  const hsl = base.getHSL({ h: 0, s: 0, l: 0 });
  return Array.from({ length: count }, (_, i) =>
    new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l * (1 - i * 0.17)).getStyle());
}

function palette() {
  return configState.multicolor
    ? {
        triangle: themeToken('--accent-warning', '#f0a868'),
        short:    themeToken('--accent-secondary', '#6fb7e8'),
        hyp:      themeToken('--accent-danger', '#f07a7a'),
        pieces:   shades('--accent-success', 4),
      }
    : {
        triangle: shades('--accent-secondary', 4)[3],
        short:    themeToken('--accent-secondary', '#6fb7e8'),
        hyp:      shades('--accent-secondary', 4)[2],
        pieces:   shades('--accent-secondary', 4),
      };
}

/* --- EASING / TIMING ------------------------------------------------------- */
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const span = (v, [s, e]) => clamp01((v - s) / (e - s));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eased = (v, range) => easeInOut(span(v, range));
const lerp = (x, y, t) => x + (y - x) * t;

/* --- SCENE SETUP ----------------------------------------------------------- */
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const themeToken = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

let inkColor = new THREE.Color(themeToken('--ink', '#2a2723'));

/* Transparent, not filled with --app-bg: the site's paint-blob wash is painted
   into <body> behind this canvas, and it is meant to show on every page. */
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
/* The proof is a plane figure — you may tip it for a look at the tiles, but
   never far enough to be reading it edge-on. */
controls.minPolarAngle = Math.PI / 2 - 0.7;
controls.maxPolarAngle = Math.PI / 2 + 0.7;
controls.minAzimuthAngle = -0.7;
controls.maxAzimuthAngle = 0.7;

const sceneGroup = new THREE.Group();
scene.add(sceneGroup);

/* Lit almost flat on purpose: this is a plane figure, and a tile should read as
   the colour it is named by. Three's Lambert BRDF carries a 1/π, so an
   intensity of PI is what renders a material at exactly its own colour —
   anything less and #A6E22E arrives on screen as olive. These two add up to
   about 1.0 head-on, leaving just enough shading to pick out the tile edges. */
scene.add(new THREE.AmbientLight(0xffffff, Math.PI * 0.82));
const dirLight = new THREE.DirectionalLight(0xffffff, Math.PI * 0.26);
dirLight.position.set(-4, 6, 10);
scene.add(dirLight);

/* --- DOM HANDLES ----------------------------------------------------------- */
const textOverlay   = document.getElementById('explanation-overlay');
const textContent   = document.getElementById('text-content');
const stepTag       = document.getElementById('step-tag');
const labelsContainer = document.getElementById('labels-container');
const slider        = document.getElementById('progress-slider');
const playBtn       = document.getElementById('play-btn');

/* --- MESH HELPERS ---------------------------------------------------------- */
const DEPTH = 0.07;

/* --- UNIT SQUARES ---------------------------------------------------------
   The squares on the legs are ruled into 1×1 cells, so a² and b² are numbers
   you can count rather than take on trust.

   It is one repeating cell used as a colour map, not a mesh of little squares:
   the map multiplies the tile's own colour, so the ruling is always a darker
   shade of whatever the tile is and needs no second draw call. Both shape and
   extrude geometries give a vertex its own x,y as its uv, so one repeat lands
   on exactly one unit — and because the map rides the mesh, the cells travel
   with a piece when it slides, which is the whole point: you watch b² worth of
   unit squares arrive inside c². */
let gridCanvas = null;
function unitCell() {
  if (!gridCanvas) {
    const S = 64, LINE = 3;
    gridCanvas = document.createElement('canvas');
    gridCanvas.width = gridCanvas.height = S;
    const g = gridCanvas.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, S, S);
    /* Only two edges are ruled: repeated, each meets its neighbour's and
       makes a single line, so the tiling stays seamless. */
    g.fillStyle = 'rgba(20, 19, 15, 0.3)';
    g.fillRect(0, 0, LINE, S);
    g.fillRect(0, 0, S, LINE);
  }
  return gridCanvas;
}

/* Line up a tile's ruling with the figure's own lattice. A mesh is built about
   its local origin, so the cells only fall on whole-number coordinates if the
   map is shifted by wherever that origin sits between them.

   Each tile gets its OWN texture off the shared canvas rather than a clone:
   clones share a GPU source behind a reference count, and disposing them on
   rebuild would pull that source out from under a cached original. A 64px cell
   per tile costs nothing. */
const frac = (v) => ((v % 1) + 1) % 1;
function griddedAt(originX, originY) {
  const t = new THREE.CanvasTexture(unitCell());
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  t.offset.set(frac(originX), frac(originY));
  return t;
}

/* A polygon given as [[x, y], …] becomes a shallow extruded tile with an inked
   outline, built in whatever local frame the caller passes the points in. */
function tileMesh(points2d, color, { opacity = 1, z = 0, fade = false, flat = false, grid = null } = {}) {
  /* When the legs are equal two of a piece's corners coincide, which would
     leave a zero-length edge for the triangulator and the outline to chew on. */
  const pts = points2d.filter(([x, y], i) => {
    const [px, py] = points2d[(i + points2d.length - 1) % points2d.length];
    return Math.hypot(x - px, y - py) > 1e-9;
  });
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  /* A see-through tile is built flat. Extruded, you would be looking through
     its front cap, its back cap AND its side walls, and three coats of 20%
     stack up to something much more solid than 20%. */
  const geo = flat
    ? new THREE.ShapeGeometry(shape)
    : new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false });
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({
      color: new THREE.Color(color),
      side: THREE.DoubleSide,
      transparent: fade || opacity < 1,
      opacity,
      map: grid ? griddedAt(grid[0], grid[1]) : null,
    }),
  );
  mesh.position.z = z;
  mesh.frustumCulled = false;

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({
      color: inkColor,
      transparent: true,
      opacity: 0.55,
    }),
  );
  outline.frustumCulled = false;
  mesh.add(outline);
  mesh.userData.outline = outline;
  return mesh;
}

/* A square that unfolds out of the edge it stands on. The geometry is built
   with that edge along local x, so growing it is just scale.y from 0 to 1.

   Its local origin is the START of the base edge rather than the middle, which
   costs nothing and means the unit ruling begins at the square's own corner —
   from the middle, an odd-sided square would be ruled off by half a cell. */
function growingSquare(base, side, color, opts = {}) {
  const [P, Q] = base;
  const mesh = tileMesh(
    [[0, 0], [side, 0], [side, side], [0, side]],
    color,
    { ...opts, grid: opts.grid ? [0, 0] : null },
  );
  mesh.position.x = P[0];
  mesh.position.y = P[1];
  mesh.rotation.z = Math.atan2(Q[1] - P[1], Q[0] - P[0]);

  /* An empty at the square's middle so a floating label can ride along as the
     square grows out of its edge. */
  const marker = new THREE.Object3D();
  marker.position.set(side / 2, side / 2, 0);
  mesh.add(marker);
  mesh.userData.marker = marker;
  return mesh;
}

/* A cut: a hairline bar laid along the line, opened from the middle out. */
function cutBar(from, to, thickness) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(len, thickness, DEPTH * 1.5),
    new THREE.MeshBasicMaterial({ color: inkColor, transparent: true, opacity: 0 }),
  );
  mesh.position.set((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, DEPTH * 0.7);
  mesh.rotation.z = Math.atan2(to[1] - from[1], to[0] - from[0]);
  mesh.frustumCulled = false;
  return mesh;
}

/* A grab handle: the yellow key colour the rest of the site uses for the thing
   you are meant to take hold of, with a ring so it reads on any tile under it.
   `leg` says which leg this corner runs along. */
function mkHandle(leg, at) {
  const g = new THREE.Group();
  g.position.set(at[0], at[1], DEPTH * 3);
  g.userData.leg = leg;

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 24, 16),
    new THREE.MeshLambertMaterial({ color: new THREE.Color(themeToken('--accent-primary', '#f4c95d')) }),
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.045, 10, 28),
    new THREE.MeshBasicMaterial({ color: inkColor }),
  );
  knob.frustumCulled = false;
  ring.frustumCulled = false;
  g.add(knob, ring);
  return g;
}

/* --- THE FIGURE ------------------------------------------------------------ */
let fig = null;          // the geometry, straight from figure.js
let parts = null;        // the meshes, keyed for applyProgress
let labelSpecs = [];
let domLabels = [];

function disposeFigure() {
  sceneGroup.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      o.material.map?.dispose();     // each tile clones the ruling for its own offset
      o.material.dispose();
    }
  });
  sceneGroup.clear();
}

function buildScene() {
  disposeFigure();
  const pal = palette();
  fig = buildFigure(configState.a, configState.b);
  const { a, b, c, squares } = fig;

  /* The triangle itself, sitting a hair proud of the squares so its edges
     stay readable where they touch. */
  const triangle = tileMesh(fig.triangle, pal.triangle, { z: DEPTH * 0.25, fade: true });

  /* The little square that marks the right angle. */
  const [C, B, A] = fig.triangle;
  const ux = [(B[0] - C[0]) / b, (B[1] - C[1]) / b];
  const uy = [(A[0] - C[0]) / a, (A[1] - C[1]) / a];
  const m = Math.min(a, b) * 0.16;
  const rightAngle = tileMesh(
    [
      [C[0], C[1]],
      [C[0] + ux[0] * m, C[1] + ux[1] * m],
      [C[0] + (ux[0] + uy[0]) * m, C[1] + (ux[1] + uy[1]) * m],
      [C[0] + uy[0] * m, C[1] + uy[1] * m],
    ],
    themeToken('--surface-primary', '#fffdf8'),
    { z: DEPTH * 1.3 },
  );

  /* The three squares, each grown out of the side it stands on. The one on the
     hypotenuse is left mostly see-through: it is the container being filled,
     not another tile. */
  /* The two leg squares are ruled into unit cells; the one on the hypotenuse
     is not. It is the container being filled, and its side is usually
     irrational anyway — you find c² by counting what lands inside it, not by
     ruling it up. A second grid at a different angle under the pieces would
     only be noise. */
  const shortSq = growingSquare(squares.short.base, squares.short.side, pal.short,
                                { grid: true });
  const longSq  = growingSquare(squares.long.base,  squares.long.side,  pal.pieces[0],
                                { grid: true });
  const hypSq   = growingSquare(squares.hyp.base,   squares.hyp.side,   pal.hyp,
                                { opacity: 0.26, z: -DEPTH * 0.6, flat: true });
  hypSq.userData.outline.material.opacity = 0.85;

  /* The two cuts across the big square. */
  const cuts = fig.cuts.map(([p, q]) => cutBar(p, q, squares.long.side * 0.012));

  /* The four pieces, and the small square once it starts travelling. Each is
     built about its own centre so it can be positioned by that centre. */
  const O = [
    (squares.long.verts[0][0] + squares.long.verts[2][0]) / 2,
    (squares.long.verts[0][1] + squares.long.verts[2][1]) / 2,
  ];
  const gap = squares.long.side * 0.09;

  const pieceMeshes = fig.pieces.map((p, i) => {
    const motion = rigidMotion(p.start, p.end);
    /* Ruled from where the piece STARTED, so its cells are the very cells it
       had while it was still part of the big square. */
    const mesh = tileMesh(motion.local, pal.pieces[i],
                          { z: DEPTH * 0.9, grid: motion.from });
    /* which way it steps aside when the square first comes apart */
    const dx = motion.from[0] - O[0], dy = motion.from[1] - O[1];
    const d = Math.hypot(dx, dy) || 1;
    mesh.userData.motion = motion;
    mesh.userData.parted = [motion.from[0] + (dx / d) * gap, motion.from[1] + (dy / d) * gap];
    mesh.userData.marker = new THREE.Object3D();
    mesh.add(mesh.userData.marker);
    return mesh;
  });

  const wholeMotion = rigidMotion(fig.whole.start, fig.whole.end);
  const wholeMesh = tileMesh(wholeMotion.local, pal.short,
                             { z: DEPTH * 0.9, grid: wholeMotion.from });
  wholeMesh.userData.motion = wholeMotion;
  wholeMesh.userData.marker = new THREE.Object3D();
  wholeMesh.add(wholeMesh.userData.marker);

  /* Grab handles on the two free corners. Each one runs along its own leg, so
     dragging changes that leg and nothing else — the right angle can't be
     pulled out of true. */
  const handles = [
    mkHandle('b', [B[0], B[1]]),
    mkHandle('a', [A[0], A[1]]),
  ];

  sceneGroup.add(hypSq, shortSq, longSq, triangle, rightAngle, ...cuts,
                 ...pieceMeshes, wholeMesh, ...handles);

  parts = { triangle, rightAngle, shortSq, longSq, hypSq, cuts, pieceMeshes,
            wholeMesh, handles };

  /* Centre the figure on the origin so orbiting spins it about itself. */
  const bounds = boundsOf([
    fig.triangle, squares.short.verts, squares.long.verts, squares.hyp.verts,
  ]);
  sceneGroup.position.set(-bounds.cx, -bounds.cy, 0);
  sceneGroup.userData.bounds = bounds;

  buildLabels();
  fitCamera();
}

/* --- FLOATING LABELS ------------------------------------------------------- */
/* Two decimals would round 0.0625 to 0.06; trimming a fixed precision instead
   keeps small numbers honest and still sweeps up float noise like
   0.30000000000000004. */
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toPrecision(12))));

function buildLabels() {
  const pal = palette();
  const { a, b, c, squares } = fig;
  const [C, B, A] = fig.triangle;

  /* Every at() below hands back a point in WORLD space, which is what the
     projection wants. Fixed points live in the figure's own coordinates and
     get pushed out through sceneGroup; markers already come back in world. */
  const fromFigure = (x, y) => sceneGroup.localToWorld(new THREE.Vector3(x, y, 0.4));
  const world = (obj) => obj.getWorldPosition(new THREE.Vector3());

  /* Side labels are nudged from the middle of a side towards the middle of the
     triangle. Every side then gets its name on the inside, where none of the
     three squares is about to grow over it. */
  const mid = [
    (C[0] + B[0] + A[0]) / 3,
    (C[1] + B[1] + A[1]) / 3,
  ];
  const onSide = (P, Q) => fromFigure(
    (P[0] + Q[0]) / 2 + (mid[0] - (P[0] + Q[0]) / 2) * 0.26,
    (P[1] + Q[1]) / 2 + (mid[1] - (P[1] + Q[1]) / 2) * 0.26,
  );

  /* c² is parked just beyond the far edge of the hypotenuse square. That square
     is the one being filled, so a label sitting inside it would end up under
     the pieces — and on top of the a² label that lands in the middle. */
  const hv = squares.hyp.verts;
  const nOut = [(hv[3][0] - hv[0][0]) / c, (hv[3][1] - hv[0][1]) / c];
  const cLabelAt = [
    (hv[2][0] + hv[3][0]) / 2 + nOut[0] * c * 0.13,
    (hv[2][1] + hv[3][1]) / 2 + nOut[1] * c * 0.13,
  ];

  /* Which square gets cut is decided by which leg is LONGER, not by which one
     we happen to call b — so with a = 6 and b = 2 it is a's square that breaks
     up. Name the two squares from the figure rather than from a and b, or the
     labels swap over the moment the taller leg is the vertical one. */
  const shortName = fig.shortLeg;                 // 'a' or 'b'
  const longName  = fig.longLeg;
  const sideOf = (name) => (name === 'a' ? a : b);

  /* The side names hand straight over to the areas at 30, so the two never
     crowd the same corner of the same square. */
  labelSpecs = [
    { text: 'a', bg: shortName === 'a' ? pal.short : pal.pieces[0], min: 4, max: 29, at: () => onSide(C, A) },
    { text: 'b', bg: shortName === 'b' ? pal.short : pal.pieces[0], min: 4, max: 29, at: () => onSide(C, B) },
    { text: 'c', bg: pal.hyp, min: 4, max: 29, at: () => onSide(A, B) },
    {
      text: `${shortName}² = ${fmt(sideOf(shortName) ** 2)}`, bg: pal.short, min: 30, max: 100,
      /* rides the small square, whether it is still growing or already on
         its way across */
      at: () => world(parts.shortSq.visible
        ? parts.shortSq.userData.marker
        : parts.wholeMesh.userData.marker),
    },
    {
      text: `${longName}² = ${fmt(sideOf(longName) ** 2)}`, bg: pal.pieces[0], min: 30, max: T.part[0] + 2,
      at: () => world(parts.longSq.userData.marker),
    },
    {
      text: `c² = ${fmt(c * c)}`, bg: pal.hyp, min: 34, max: 100,
      at: () => fromFigure(cLabelAt[0], cLabelAt[1]),
    },
  ];

  labelsContainer.innerHTML = '';
  domLabels = labelSpecs.map((spec) => {
    const el = document.createElement('div');
    el.className = 'float-label';
    el.textContent = spec.text;
    /* paper label, tile colour as the stripe down its side — printing on a
       saturated fill would fight the rest of the page */
    el.style.setProperty('--tile', spec.bg);
    el.style.opacity = '0';
    labelsContainer.appendChild(el);
    return el;
  });
}

const projected = new THREE.Vector3();
function updateLabels(progress) {
  /* applyProgress can run before the first render, so the transforms the
     label positions are read through may not be current yet. */
  sceneGroup.updateMatrixWorld(true);
  domLabels.forEach((el, i) => {
    const spec = labelSpecs[i];
    const on = configState.showLabels && progress >= spec.min && progress <= spec.max;
    el.style.opacity = on ? '1' : '0';
    if (!on) return;
    projected.copy(spec.at());
    projected.project(camera);
    el.style.left = `${(projected.x * 0.5 + 0.5) * window.innerWidth}px`;
    el.style.top = `${(-projected.y * 0.5 + 0.5) * window.innerHeight}px`;
  });
}

/* --- THE BANNER ------------------------------------------------------------ */
function steps() {
  const { a, b, c } = fig;
  const big = Math.max(a, b), small = Math.min(a, b);
  return [
    { until: T.triangle[1],
      text: 'A right-angled triangle. The two short sides are the legs, <em>a</em> and <em>b</em>; the long one, opposite the right angle, is the hypotenuse <em>c</em>.' },
    { until: T.growHyp[1],
      text: 'Stand a square on every side. The two on the legs are ruled into unit squares, so their areas are there to be counted: <em>a²</em> and <em>b²</em>.' },
    { until: T.cut[0],
      text: `Count them: a² = ${fmt(a * a)} unit squares and b² = ${fmt(b * b)}, which is ${fmt(a * a + b * b)} between them. c² = ${fmt(c * c)}. The question is whether those ${fmt(a * a + b * b)} really do fill the big square.` },
    { until: T.part[0],
      text: `Cut the larger square — the one on <em>${fig.longLeg}</em>, side ${fmt(big)} — with two lines through its centre: one parallel to the hypotenuse, one straight across it.` },
    { until: T.movePiece(0)[0],
      text: 'Four pieces, all the same shape and size. Watch what they do next: they only ever slide, never turn.' },
    { until: LAST_LANDING,
      text: `Each piece slides into a corner of the square on the hypotenuse. Between them they leave a square hole — and its side is exactly ${fmt(small)}, the length of <em>${fig.shortLeg}</em>.` },
    { until: 100,
      text: `So the smaller square drops straight in: ${fmt(a * a)} + ${fmt(b * b)} = ${fmt(c * c)}. That is <em>a² + b² = c²</em>.` },
  ];
}

let cachedSteps = [];
function updateBanner(progress) {
  if (!configState.showExplanation) {
    textOverlay.style.opacity = '0';
    return;
  }
  textOverlay.style.opacity = '1';
  let i = cachedSteps.findIndex((s) => progress <= s.until);
  if (i < 0) i = cachedSteps.length - 1;
  const html = cachedSteps[i].text;
  if (textContent.innerHTML !== html) textContent.innerHTML = html;
  const tag = `Step ${i + 1} of ${cachedSteps.length}`;
  if (stepTag.textContent !== tag) stepTag.textContent = tag;
}

/* --- DRIVING THE PROOF ----------------------------------------------------- */
function applyProgress(v) {
  if (!parts) return;
  const { triangle, rightAngle, shortSq, longSq, hypSq, cuts, pieceMeshes, wholeMesh } = parts;

  /* 1 — the triangle draws itself in */
  const tIn = eased(v, T.triangle);
  triangle.scale.setScalar(Math.max(tIn, 0.0001));
  triangle.material.opacity = tIn;
  triangle.material.transparent = tIn < 1;
  rightAngle.visible = v > T.triangle[1] * 0.6;

  /* 2 — the three squares unfold out of the sides */
  shortSq.scale.y = Math.max(eased(v, T.growShort), 0.0001);
  longSq.scale.y  = Math.max(eased(v, T.growLong),  0.0001);
  hypSq.scale.y   = Math.max(eased(v, T.growHyp),   0.0001);

  /* 3 — the cuts open from the centre of the big square outwards, then fade
     as the pieces themselves come apart and show the cut for real */
  const cutIn  = eased(v, T.cut);
  const cutOut = eased(v, [T.part[0], T.part[0] + 6]);
  cuts.forEach((bar) => {
    bar.scale.x = Math.max(cutIn, 0.0001);
    bar.material.opacity = 0.75 * cutIn * (1 - cutOut);
    bar.visible = bar.material.opacity > 0.01;
  });

  /* 4 — the solid squares hand over to the pieces. At the moment of the swap
     the pieces are exactly where the square was, so nothing appears to move.
     They are also hidden before they start growing: a square flattened onto
     its base edge still draws that edge, which would trace a full triangle
     outline around a triangle that is only half drawn. */
  longSq.visible  = v >= T.growLong[0]  && v < T.part[0];
  shortSq.visible = v >= T.growShort[0] && v < T.moveWhole[0];
  hypSq.visible   = v >= T.growHyp[0];
  const shown = v >= T.part[0];
  pieceMeshes.forEach((mesh) => { mesh.visible = shown; });
  wholeMesh.visible = v >= T.moveWhole[0];

  /* 5 — the pieces step apart, then slide across */
  pieceMeshes.forEach((mesh, i) => {
    const { motion, parted } = mesh.userData;
    const apart = eased(v, T.part);
    const from = [
      lerp(motion.from[0], parted[0], apart),
      lerp(motion.from[1], parted[1], apart),
    ];
    const travel = eased(v, T.movePiece(i));
    mesh.position.x = lerp(from[0], motion.to[0], travel);
    mesh.position.y = lerp(from[1], motion.to[1], travel);
    mesh.rotation.z = motion.theta * travel;
    /* they ride a little above the board while in transit, so a piece never
       looks like it is cutting through the one it passes */
    mesh.position.z = DEPTH * 0.9 + Math.sin(Math.PI * travel) * DEPTH * 2.2;
  });

  const wt = eased(v, T.moveWhole);
  const wm = wholeMesh.userData.motion;
  wholeMesh.position.x = lerp(wm.from[0], wm.to[0], wt);
  wholeMesh.position.y = lerp(wm.from[1], wm.to[1], wt);
  wholeMesh.rotation.z = wm.theta * wt;
  wholeMesh.position.z = DEPTH * 0.9 + Math.sin(Math.PI * wt) * DEPTH * 2.2;

  /* 6 — once everything has landed the outline of the filled square brightens,
     which is the only cue the proof is finished */
  const settled = eased(v, T.settle);
  hypSq.userData.outline.material.opacity = 0.85 + 0.15 * settled;
  hypSq.material.opacity = 0.26 * (1 - settled * 0.6);

  updateBanner(v);
  updateLabels(v);
}

/* --- CAMERA ---------------------------------------------------------------- */
/* The banner and the slider bar float over the canvas, so the figure gets the
   band of screen between them rather than the whole viewport. Measuring the two
   means the fit survives a banner that wraps to three lines on a phone. */
function freeBand() {
  const H = window.innerHeight;
  const top = document.getElementById('page-top')?.getBoundingClientRect().bottom ?? 120;
  const bottom = document.getElementById('controls')?.getBoundingClientRect().top ?? H - 90;
  const a = top + 14;
  const b = Math.max(a + 160, bottom - 14);
  return { top: a, bottom: b, height: b - a, centre: (a + b) / 2 };
}

/* Where the camera wants to be. animate() eases towards it rather than
   snapping, which matters while the triangle is being dragged: the figure
   changes size on every half-unit and a hard refit each time would make the
   corner jump out from under the pointer. */
let fitTarget = null;

function fitCamera({ straighten = false } = {}) {
  const b = sceneGroup.userData.bounds;
  if (!b) return;
  const W = window.innerWidth, H = window.innerHeight;
  const band = freeBand();
  const vFov = (camera.fov * Math.PI) / 180;

  /* How much world has to be visible top-to-bottom for the figure to fill the
     band, and separately for it to fit the width. Take whichever is larger. */
  const fill = W <= 768 ? 0.88 : 0.92;
  const worldHforBand = (b.h * H) / (band.height * fill);
  const worldHforWidth = (b.w * H) / (W * fill);
  const worldH = Math.max(worldHforBand, worldHforWidth);

  const dist = worldH / (2 * Math.tan(vFov / 2));
  /* Lift the camera so the figure sits in the middle of the band, not the
     middle of the window. */
  const offsetY = ((band.centre - H / 2) / H) * worldH;

  controls.minDistance = dist * 0.4;
  controls.maxDistance = dist * 2.2;
  fitTarget = { dist, offsetY, straighten };
  if (!camera.position.lengthSq()) {
    camera.position.set(0, offsetY, dist);   // first frame: no easing to do
    controls.target.set(0, offsetY, 0);
    controls.update();
    fitTarget = null;
  }
}

/* One step of that easing. Runs only while a fit is outstanding, so it never
   fights the user's own zoom. */
function stepCameraFit() {
  if (!fitTarget) return;
  const { dist, offsetY, straighten } = fitTarget;
  const k = 0.16;
  const facing = new THREE.Vector3(0, 0, 1);
  const here = camera.position.clone().sub(controls.target);
  const dir = here.clone().normalize();
  if (straighten) dir.lerp(facing, k).normalize();

  const nextDist = lerp(here.length() || dist, dist, k);
  controls.target.x = lerp(controls.target.x, 0, k);
  controls.target.y = lerp(controls.target.y, offsetY, k);
  camera.position.copy(controls.target).addScaledVector(dir, nextDist);

  const settled =
    Math.abs(nextDist - dist) < dist * 0.002 &&
    Math.abs(controls.target.y - offsetY) < 0.002 &&
    (!straighten || dir.angleTo(facing) < 0.004);
  if (settled) fitTarget = null;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  fitCamera();
});

/* A longer step can push the banner onto another line, which shrinks the band
   the figure has to live in. Refit when it actually moves by something worth
   reacting to, so a one-pixel reflow doesn't nudge the camera. */
let lastBandHeight = 0;
new ResizeObserver(() => {
  const h = freeBand().height;
  if (Math.abs(h - lastBandHeight) < 10) return;
  lastBandHeight = h;
  fitCamera();
}).observe(document.getElementById('page-top'));

/* --- PLAYBACK -------------------------------------------------------------- */
const RUN_MS = 26000;
let playing = false;
let lastFrame = 0;

function setProgress(v, { fromUser = false } = {}) {
  const clamped = Math.max(0, Math.min(100, v));
  slider.value = String(clamped);
  applyProgress(clamped);
  if (fromUser && playing) stopPlaying();
}

function startPlaying() {
  if (parseFloat(slider.value) >= 99.9) setProgress(0);
  playing = true;
  lastFrame = performance.now();
  playBtn.classList.add('is-playing', 'active');
  playBtn.title = 'Pause';
}
function stopPlaying() {
  playing = false;
  playBtn.classList.remove('is-playing', 'active');
  playBtn.title = 'Play the proof';
}

playBtn.addEventListener('click', () => (playing ? stopPlaying() : startPlaying()));
slider.addEventListener('input', (e) => setProgress(parseFloat(e.target.value), { fromUser: true }));

document.addEventListener('keydown', (e) => {
  if (e.target instanceof Element && e.target.matches('input, textarea, [contenteditable]')) return;
  if (e.code === 'Space') { e.preventDefault(); playing ? stopPlaying() : startPlaying(); }
  if (e.key === 'ArrowRight') setProgress(parseFloat(slider.value) + 2, { fromUser: true });
  if (e.key === 'ArrowLeft')  setProgress(parseFloat(slider.value) - 2, { fromUser: true });
});

/* --- SETTINGS -------------------------------------------------------------- */
const settingsModal = document.getElementById('settings-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const legA = document.getElementById('leg-a');
const legB = document.getElementById('leg-b');
const legAVal = document.getElementById('leg-a-val');
const legBVal = document.getElementById('leg-b-val');

const toggleModal = (show) => {
  settingsModal.classList.toggle('open', show);
  modalBackdrop.classList.toggle('open', show);
};
document.getElementById('settings-btn').addEventListener('click', () => toggleModal(true));
document.getElementById('close-settings').addEventListener('click', () => toggleModal(false));
modalBackdrop.addEventListener('click', () => toggleModal(false));
document.getElementById('reset-view-btn').addEventListener('click', () => fitCamera({ straighten: true }));

/* --- DRAGGING THE TRIANGLE -------------------------------------------------
   Pick up either free corner and the leg it sits on follows the pointer. The
   figure is rebuilt from the new legs, so the squares, the cut and the whole
   dissection re-derive themselves — the identity holds for whatever triangle
   you drag out, which is rather the point. */
/* Whole numbers only. The squares are ruled into unit cells and the point of
   that is being able to count them, which a half-cell along one edge ruins. */
const LEG_MIN = 1, LEG_MAX = 8, LEG_STEP = 1;

/* The hint has done its job either way once you have read it — it goes on the
   first drag, and on a timer for anyone who is only here to watch. */
const dismissHint = () => document.getElementById('drag-hint')?.classList.add('gone');
setTimeout(dismissHint, 14000);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const figurePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const canvasEl = renderer.domElement;
let dragging = null;
let hasDragged = false;

function setPointer(e) {
  const r = canvasEl.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

const handleUnder = () =>
  parts?.handles.find((h) => raycaster.intersectObject(h, true).length > 0) || null;

/* Where the pointer meets the plane the figure lies in, in figure coordinates. */
function pointerInFigure() {
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(figurePlane, hit)) return null;
  sceneGroup.worldToLocal(hit);
  return hit;
}

const snapLeg = (v) =>
  Math.min(LEG_MAX, Math.max(LEG_MIN, Math.round(v / LEG_STEP) * LEG_STEP));

canvasEl.addEventListener('pointerdown', (e) => {
  setPointer(e);
  const h = handleUnder();
  if (!h) return;
  dragging = h.userData.leg;
  controls.enabled = false;
  canvasEl.setPointerCapture(e.pointerId);
  canvasEl.style.cursor = 'grabbing';
});

canvasEl.addEventListener('pointermove', (e) => {
  setPointer(e);
  if (!dragging) {
    canvasEl.style.cursor = handleUnder() ? 'grab' : '';
    return;
  }
  const p = pointerInFigure();
  if (!p) return;
  /* The b corner runs along the horizontal leg and the a corner up the
     vertical one, so only one coordinate of the pointer is listened to. */
  const want = snapLeg(dragging === 'b' ? Math.abs(p.x) : Math.abs(p.y));
  if (want === configState[dragging]) return;
  configState[dragging] = want;
  (dragging === 'b' ? legB : legA).value = String(want);
  legAVal.textContent = fmt(configState.a);
  legBVal.textContent = fmt(configState.b);
  if (!hasDragged) {
    hasDragged = true;
    dismissHint();
  }
  rebuild();
});

for (const ev of ['pointerup', 'pointercancel']) {
  canvasEl.addEventListener(ev, (e) => {
    if (!dragging) return;
    dragging = null;
    controls.enabled = true;
    canvasEl.style.cursor = '';
    try { canvasEl.releasePointerCapture(e.pointerId); } catch { /* already gone */ }
  });
}

/* Whole-number triples, so the arithmetic in the banner comes out clean. */
const TRIPLES = [
  [3, 4, 5],
  [6, 8, 10],
];
const tripleRow = document.getElementById('triple-row');
TRIPLES.forEach(([a, b, c], i) => {
  const chip = document.createElement('button');
  chip.type = 'button';
  /* A preset is a note you pick up, so it is one — colour-rotated like every
     other row of choices on the site. */
  chip.className = `pp-sticky pp-sticky--c${i % 6} triple-chip`;
  chip.style.setProperty('--pp-note-tilt', `${i % 2 ? 1.6 : -2}deg`);
  chip.textContent = `${fmt(a)} · ${fmt(b)} · ${fmt(c)}`;
  chip.addEventListener('click', () => {
    legA.value = String(a);
    legB.value = String(b);
    onLegsChanged();
  });
  tripleRow.appendChild(chip);
});

/* --- IS IT A TRIPLE? -------------------------------------------------------
   Three lengths in, a verdict out. Deliberately not restricted to the triangle
   the figure can draw: the interesting question is often about numbers too big
   for the board, and being told "yes, but I can't show you" is a real answer.
   Where it CAN be drawn, the verdict comes with a button that draws it. */
const triA = document.getElementById('tri-a');
const triB = document.getElementById('tri-b');
const triC = document.getElementById('tri-c');
const triVerdict = document.getElementById('tri-verdict');
const triDraw = document.getElementById('tri-draw');

const drawable = (n) =>
  Number.isInteger(n) && n >= LEG_MIN && n <= LEG_MAX;

function say(text, tone) {
  triVerdict.textContent = text;
  triVerdict.className = `pp-sticky tri-verdict pp-sticky--${tone}`;
}

function checkTriple() {
  const a = parseFloat(triA.value);
  const b = parseFloat(triB.value);
  const c = parseFloat(triC.value);
  triDraw.hidden = true;

  if (![a, b, c].every((n) => Number.isFinite(n) && n > 0)) {
    say('Put three lengths in — the longest one last.', 'c3');
    return;
  }

  const legs = a * a + b * b;
  const hyp = c * c;
  /* Compared with a relative tolerance, so 0.3, 0.4, 0.5 is still a triple
     rather than a victim of binary fractions. */
  const same = Math.abs(legs - hyp) <= 1e-9 * Math.max(legs, hyp, 1);

  if (c <= Math.max(a, b) && !same) {
    say(`c has to be the longest side, and ${fmt(c)} is not. Try the three the other way round.`, 'c4');
    return;
  }

  if (same) {
    const sum = `${fmt(a)}² + ${fmt(b)}² = ${fmt(a * a)} + ${fmt(b * b)} = ${fmt(legs)}, and ${fmt(c)}² = ${fmt(hyp)}.`;
    const canDraw = drawable(a) && drawable(b);
    say(canDraw
      ? `${sum} Yes — a right-angled triangle.`
      : `${sum} Yes — a right-angled triangle, though the legs are outside what the board draws (whole numbers up to ${LEG_MAX}).`,
      'c2');
    if (canDraw) {
      triDraw.hidden = false;
      triDraw.dataset.a = String(a);
      triDraw.dataset.b = String(b);
    }
    return;
  }

  const off = legs - hyp;
  say(`${fmt(a)}² + ${fmt(b)}² = ${fmt(legs)}, but ${fmt(c)}² = ${fmt(hyp)} — ${fmt(Math.abs(off))} ${off > 0 ? 'over' : 'short'}. Not a right-angled triangle.`, 'c4');
}

for (const el of [triA, triB, triC]) el.addEventListener('input', checkTriple);
checkTriple();   // paint the resting state from the same place as every other

triDraw.addEventListener('click', () => {
  legA.value = triDraw.dataset.a;
  legB.value = triDraw.dataset.b;
  onLegsChanged();
  setProgress(0);
  startPlaying();
  toggleModal(false);
});

function onLegsChanged() {
  configState.a = parseFloat(legA.value);
  configState.b = parseFloat(legB.value);
  legAVal.textContent = fmt(configState.a);
  legBVal.textContent = fmt(configState.b);
  rebuild();
}
legA.addEventListener('input', onLegsChanged);
legB.addEventListener('input', onLegsChanged);

document.getElementById('toggle-labels').addEventListener('change', (e) => {
  configState.showLabels = e.target.checked;
  applyProgress(parseFloat(slider.value));
});
document.getElementById('toggle-explanation').addEventListener('change', (e) => {
  configState.showExplanation = e.target.checked;
  applyProgress(parseFloat(slider.value));
});
document.getElementById('toggle-colors').addEventListener('change', (e) => {
  configState.multicolor = e.target.checked;
  rebuild();
});

/* Keep the slider where it was when a setting changes — you are usually
   fiddling with the legs to see the same step with different numbers. */
function rebuild() {
  const at = parseFloat(slider.value);
  buildScene();
  cachedSteps = steps();
  applyProgress(at);
}

/* Follow the site's light/dark switch — the tile colours are theme tokens, so
   they have to be read again. */
const themeObserver = new MutationObserver(() => {
  inkColor = new THREE.Color(themeToken('--ink', '#2a2723'));
  rebuild();
});
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

/* --- GO -------------------------------------------------------------------- */
buildScene();
cachedSteps = steps();
applyProgress(0);

function animate(now) {
  requestAnimationFrame(animate);
  if (playing) {
    const step = ((now - lastFrame) / RUN_MS) * 100;
    lastFrame = now;
    const next = parseFloat(slider.value) + step;
    if (next >= 100) { setProgress(100); stopPlaying(); }
    else setProgress(next);
  }
  stepCameraFit();
  controls.update();
  if (!playing) updateLabels(parseFloat(slider.value));
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

/* Give the figure a moment on screen, then run it once so the page arrives
   already explaining itself. */
setTimeout(() => { if (parseFloat(slider.value) === 0) startPlaying(); }, 1400);
