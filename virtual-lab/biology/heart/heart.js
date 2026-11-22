// Interactive heart: take apart, cross-section, and a beating cardiac cycle.
// Model geometry comes from models/heart.glb (one mesh per part, in "anatomical
// units" under a node named "heart" that scales units to metres). Valves and
// chordae are built here from models/heart.meta.json so they can open and close.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { I } from '/home/js/dashboard/icons.js';
import { heroPaint, SVG_SUN, SVG_MOON } from '/utils/components/nav-icons.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- page chrome
document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = I[el.dataset.icon] || ''; });
$('paint').innerHTML = heroPaint();

const root = document.documentElement;
function currentTheme() { return root.getAttribute('data-theme') || 'light'; }
function paintThemeIcon() {
  $('iconTheme').innerHTML = currentTheme() === 'dark' ? SVG_SUN : SVG_MOON;
  $('btnTheme').setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}
let savedTheme = null;
try { savedTheme = localStorage.getItem('pp-theme'); } catch (e) { /* storage blocked */ }
root.setAttribute('data-theme', savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
paintThemeIcon();
$('btnTheme').addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('pp-theme', next); } catch (e) { /* ignore */ }
  paintThemeIcon();
});

// ---------------------------------------------------------------- renderer
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.localClippingEnabled = true;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const key = new THREE.DirectionalLight(0xfff4e0, 1.6);
key.position.set(0.4, 0.6, 0.8);
scene.add(key);
const rim = new THREE.DirectionalLight(0xc8dcff, 0.7);
rim.position.set(-0.6, 0.2, -0.6);
scene.add(rim);

const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 10);
const HOME_DIST = 0.42;
const EXPLODED_DIST = 0.74;
const EXPLODE_SPREAD = 1.35; // how far parts fly apart when disassembled
camera.position.set(0, 0.03, HOME_DIST);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.08;
controls.maxDistance = 1.4;
controls.autoRotate = !reducedMotion;
controls.autoRotateSpeed = 0.7;

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 0.8 ? 48 : 35;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// on phones the notes sit just above the control dock, whose height varies
const dock = document.querySelector('.heart-controls');
new ResizeObserver(() => {
  root.style.setProperty('--dock-h', `${Math.round(dock.getBoundingClientRect().height) + 26}px`);
}).observe(dock);

// ------------------------------------------------------ the beat (shader + CPU)
// One continuous displacement field moves every part, so the pieces stay joined
// while it beats. It runs in anatomical units on the untransformed vertex.
const U = {
  uV: { value: 0 },   // ventricular contraction 0..1
  uA: { value: 0 },   // atrial contraction (negative = atria filling)
  uE: { value: 0 },   // great arteries stretching as blood is ejected
  uCap: { value: new THREE.Color(0.80, 0.46, 0.44) }, // colour of a cut face (sRGB)
};
const BEAT_GLSL = /* glsl */`
uniform float uV;
uniform float uA;
uniform float uE;
vec3 segRadial(vec3 p, vec3 a, vec3 b) {
  vec3 ba = b - a;
  float h = clamp(dot(p - a, ba) / dot(ba, ba), 0.0, 1.0);
  return p - (a + h * ba);
}
vec3 beatDisp(vec3 p) {
  vec3 B = vec3(0.30, 0.35, 0.10);
  vec3 ax = normalize(vec3(0.78, -1.80, 0.14) - B);
  float s = dot(p - B, ax);
  vec3 r = (p - B) - s * ax;
  float wv = 1.0 - smoothstep(0.20, 0.70, p.y);
  vec3 d = -uV * wv * (0.12 * r + 0.07 * max(s, 0.0) * ax);
  vec3 ra = p - vec3(-0.92, 0.72, -0.30);
  vec3 la = p - vec3(0.10, 0.92, -0.72);
  d -= uA * (0.12 * (1.0 - smoothstep(0.45, 1.05, length(ra))) * ra
           + 0.12 * (1.0 - smoothstep(0.40, 1.00, length(la))) * la);
  vec3 ao = segRadial(p, vec3(0.05, 0.55, 0.25), vec3(-0.05, 1.45, 0.10));
  vec3 pt = segRadial(p, vec3(0.10, 0.62, 1.00), vec3(0.40, 1.40, 0.30));
  d += uE * 0.08 * ((1.0 - smoothstep(0.30, 0.50, length(ao))) * ao
                  + (1.0 - smoothstep(0.28, 0.48, length(pt))) * pt);
  return d;
}
`;
const BEAT_B = new THREE.Vector3(0.30, 0.35, 0.10);
const BEAT_AX = new THREE.Vector3(0.78, -1.80, 0.14).sub(BEAT_B).normalize();
const RA_C = new THREE.Vector3(-0.92, 0.72, -0.30);
const LA_C = new THREE.Vector3(0.10, 0.92, -0.72);
const AO = [new THREE.Vector3(0.05, 0.55, 0.25), new THREE.Vector3(-0.05, 1.45, 0.10)];
const PT = [new THREE.Vector3(0.10, 0.62, 1.00), new THREE.Vector3(0.40, 1.40, 0.30)];
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _t3 = new THREE.Vector3();
function segRadial(p, a, b, out) {
  _t3.copy(b).sub(a);
  const h = Math.min(1, Math.max(0, _t2.copy(p).sub(a).dot(_t3) / _t3.lengthSq()));
  return out.copy(p).sub(a).addScaledVector(_t3, -h);
}
/** CPU copy of beatDisp() for the parts built in JavaScript. Adds into p. */
function applyBeat(p) {
  const v = U.uV.value, a = U.uA.value, e = U.uE.value;
  if (v === 0 && a === 0 && e === 0) return p;
  const s = _t1.copy(p).sub(BEAT_B).dot(BEAT_AX);
  const r = _t1.copy(p).sub(BEAT_B).addScaledVector(BEAT_AX, -s);
  const wv = 1 - smoothstep(0.20, 0.70, p.y);
  const dx = new THREE.Vector3().addScaledVector(r, -v * wv * 0.12).addScaledVector(BEAT_AX, -v * wv * 0.07 * Math.max(s, 0));
  const ra = _t2.copy(p).sub(RA_C);
  dx.addScaledVector(ra, -a * 0.12 * (1 - smoothstep(0.45, 1.05, ra.length())));
  const la = _t2.copy(p).sub(LA_C);
  dx.addScaledVector(la, -a * 0.12 * (1 - smoothstep(0.40, 1.00, la.length())));
  const ao = segRadial(p, AO[0], AO[1], _t2);
  dx.addScaledVector(ao, e * 0.08 * (1 - smoothstep(0.30, 0.50, ao.length())));
  const pt = segRadial(p, PT[0], PT[1], _t2);
  dx.addScaledVector(pt, e * 0.08 * (1 - smoothstep(0.28, 0.48, pt.length())));
  return p.add(dx);
}

// Clipping plane for the cross-section. "Off" = pushed far away.
const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e3);

function partMaterial() {
  const m = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.45, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.3,
    side: THREE.DoubleSide, clippingPlanes: [clip],
  });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = BEAT_GLSL + shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\n  transformed += beatDisp(position);');
    // Every part is a closed solid, so the only back faces you can ever see are
    // the inside of a wall exposed by the cut. Paint them as flat cut tissue.
    shader.fragmentShader = 'uniform vec3 uCap;\n' + shader.fragmentShader.replace(
      '#include <dithering_fragment>', '#include <dithering_fragment>\n  if (!gl_FrontFacing) gl_FragColor = vec4(uCap, 1.0);');
  };
  m.customProgramCacheKey = () => 'heart-part';
  return m;
}

// ---------------------------------------------------------------- cardiac cycle
const PHASES = [
  { until: 0.12, name: 'Atrial systole', desc: 'The atria squeeze the last blood into the ventricles. Mitral and tricuspid valves are open.' },
  { until: 0.18, name: 'Isovolumetric contraction', desc: 'The ventricles start to squeeze. All four valves are shut: the "lub" sound.' },
  { until: 0.44, name: 'Ventricular ejection', desc: 'The ventricles push blood out. Aortic and pulmonary valves are open.' },
  { until: 0.54, name: 'Isovolumetric relaxation', desc: 'The ventricles relax. Aortic and pulmonary valves snap shut: the "dub" sound.' },
  { until: 1.01, name: 'Ventricular filling', desc: 'Blood flows from the atria into the relaxed ventricles through the open mitral and tricuspid valves.' },
];
function cycle(t) {
  const atr = smoothstep(0.00, 0.06, t) * (1 - smoothstep(0.10, 0.18, t));
  const ven = smoothstep(0.14, 0.28, t) * (1 - smoothstep(0.42, 0.58, t));
  const sl = smoothstep(0.18, 0.23, t) * (1 - smoothstep(0.40, 0.45, t));
  const av = Math.min(1, Math.max(0, 1 - smoothstep(0.12, 0.16, t) + smoothstep(0.52, 0.58, t)));
  return { uV: ven, uA: atr - 0.35 * ven, uE: sl, av, sl, phase: PHASES.find((p) => t < p.until) };
}

// ---------------------------------------------------------------- state
const parts = new Map();      // name -> { mesh, explode: Vector3, label, description, group }
const valves = [];            // built in JS
const pickables = [];
let heartNode = null;
let chordae = null, chordList = [];
let meta = null;

const state = {
  beat: !reducedMotion, t: 0.7, bpm: 60,
  explodeTarget: 0, explode: 0,
  section: false, axis: 'front', depth: 0.2,
  av: 1, sl: 0,
};
const AXES = {
  front: { normal: new THREE.Vector3(0, 0, -1), min: -1.3, max: 1.3, def: 0.20, cam: new THREE.Vector3(0, 0.02, 1) },
  top: { normal: new THREE.Vector3(0, -1, 0), min: -1.8, max: 2.4, def: 0.42, cam: new THREE.Vector3(0, 1, 0.12) },
  side: { normal: new THREE.Vector3(-1, 0, 0), min: -1.3, max: 1.3, def: 0.22, cam: new THREE.Vector3(1, 0.05, 0) },
};

// ---------------------------------------------------------------- valves
const VALVE_SHAPE = {
  av: { bulge: 0.22, len: 0.95, tilt: 0.22 },
  semilunar: { bulge: 0.30, len: 0.90, tilt: 0.05 },
};
function buildValve(v) {
  const c = new THREE.Vector3(...v.center);
  const n = new THREE.Vector3(...v.axis).normalize();
  const ref = new THREE.Vector3(...v.ref);
  const e1 = ref.addScaledVector(n, -ref.dot(n)).normalize();
  const e2 = new THREE.Vector3().crossVectors(n, e1);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f1e2c8'), roughness: 0.55, side: THREE.DoubleSide, clippingPlanes: [clip],
  });
  const group = new THREE.Group();
  group.name = v.name;
  const leaflets = [];
  let th = -THREE.MathUtils.degToRad(v.sectors[0]) / 2;
  v.sectors.forEach((deg, i) => {
    const span = THREE.MathUtils.degToRad(deg);
    const NU = 16, NV = 8;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((NU + 1) * (NV + 1) * 3), 3));
    const idx = [];
    for (let u = 0; u < NU; u++) {
      for (let w = 0; w < NV; w++) {
        const a = u * (NV + 1) + w, b = a + NV + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, material);
    mesh.userData.part = v.name;
    group.add(mesh);
    pickables.push(mesh);
    leaflets.push({ th0: th + 0.015, th1: th + span - 0.015, depth: v.depth[i] ?? 1, mesh, NU, NV });
    th += span;
  });
  heartNode.add(group);
  const valve = { ...v, c, n, e1, e2, R: v.radius, shape: VALVE_SHAPE[v.type], leaflets, material };
  valves.push(valve);
  return valve;
}
const _A = new THREE.Vector3(), _in = new THREE.Vector3(), _cl = new THREE.Vector3(), _op = new THREE.Vector3();
function leafletPoint(valve, lf, u, t, k, out) {
  const th = lf.th0 + (lf.th1 - lf.th0) * u;
  const { c, n, e1, e2, R, shape } = valve;
  _A.copy(c).addScaledVector(e1, Math.cos(th) * R).addScaledVector(e2, Math.sin(th) * R);
  _in.copy(c).sub(_A).divideScalar(R);
  _cl.copy(_A).lerp(c, t * lf.depth).addScaledVector(n, -shape.bulge * R * Math.sin(Math.PI * t));
  _op.copy(_A).addScaledVector(n, t * shape.len * R).addScaledVector(_in, shape.tilt * R * t);
  return applyBeat(out.copy(_cl).lerp(_op, k));
}
const _p = new THREE.Vector3();
function updateValves() {
  for (const valve of valves) {
    const k = valve.type === 'av' ? state.av : state.sl;
    for (const lf of valve.leaflets) {
      const pos = lf.mesh.geometry.attributes.position;
      let i = 0;
      for (let u = 0; u <= lf.NU; u++) {
        for (let w = 0; w <= lf.NV; w++) {
          leafletPoint(valve, lf, u / lf.NU, w / lf.NV, k, _p);
          pos.setXYZ(i++, _p.x, _p.y, _p.z);
        }
      }
      pos.needsUpdate = true;
      lf.mesh.geometry.computeVertexNormals();
      lf.mesh.geometry.computeBoundingSphere();
    }
  }
}

// chordae tendineae: thin cords from AV leaflet edges to the papillary tips
function buildChordae() {
  const tips = meta.papillary.map((p) => ({ ...p, tip: new THREE.Vector3(...p.tip) }));
  for (const valve of valves.filter((v) => v.type === 'av')) {
    const own = tips.filter((p) => p.valve === valve.name);
    valve.leaflets.forEach((lf) => {
      [0.22, 0.5, 0.78].forEach((u) => {
        const edge = leafletPoint(valve, lf, u, 0.85, 0, new THREE.Vector3());
        const tip = own.reduce((best, p) => (p.tip.distanceTo(edge) < best.tip.distanceTo(edge) ? p : best), own[0]);
        chordList.push({ valve, lf, u, tip });
      });
    });
  }
  const geo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#f4ecdc'), roughness: 0.6, clippingPlanes: [clip], side: THREE.DoubleSide });
  chordae = new THREE.InstancedMesh(geo, mat, chordList.length);
  chordae.userData.part = 'chordae';
  heartNode.add(chordae);
  pickables.push(chordae);
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
const _s = new THREE.Vector3(), _mid = new THREE.Vector3(), _dir = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
function updateChordae() {
  if (!chordae) return;
  chordae.visible = state.explode < 0.02;
  if (!chordae.visible) return;
  chordList.forEach((ch, i) => {
    leafletPoint(ch.valve, ch.lf, ch.u, 0.85, state.av, _a);
    applyBeat(_b.copy(ch.tip));
    _dir.copy(_b).sub(_a);
    const len = _dir.length();
    _mid.copy(_a).addScaledVector(_dir, 0.5);
    _q.setFromUnitVectors(UP, _dir.normalize());
    _m.compose(_mid, _q, _s.set(0.012, len, 0.012));
    chordae.setMatrixAt(i, _m);
  });
  chordae.instanceMatrix.needsUpdate = true;
  chordae.computeBoundingSphere();
}

// ---------------------------------------------------------------- loading
const loadingText = $('loadingText');
const glbUrl = new URL('./models/heart.glb', import.meta.url).href;
const metaUrl = new URL('./models/heart.meta.json', import.meta.url).href;

Promise.all([
  fetch(metaUrl).then((r) => { if (!r.ok) throw new Error('meta ' + r.status); return r.json(); }),
  new Promise((resolve, reject) => new GLTFLoader().load(glbUrl, resolve, (evt) => {
    if (evt.total) loadingText.textContent = `Loading heart… ${Math.round(evt.loaded / evt.total * 100)}%`;
  }, reject)),
]).then(([m, gltf]) => {
  meta = m;
  heartNode = gltf.scene.getObjectByName('heart');
  heartNode.traverse((obj) => {
    if (!obj.isMesh) return;
    const info = meta.parts[obj.name];
    if (!info) return;
    if (!obj.geometry.attributes.normal) obj.geometry.computeVertexNormals();
    obj.material = partMaterial();
    obj.userData.part = obj.name;
    parts.set(obj.name, { ...info, mesh: obj, explode: new THREE.Vector3(...info.explode).multiplyScalar(EXPLODE_SPREAD) });
    pickables.push(obj);
  });
  meta.valves.forEach(buildValve);
  buildChordae();
  // centre the assembled heart on the orbit pivot
  const centre = new THREE.Box3().setFromObject(gltf.scene).getCenter(new THREE.Vector3());
  gltf.scene.position.sub(centre);
  scene.add(gltf.scene);
  applyCycle();
  updateValves();
  updateChordae();
  $('loading').classList.add('done');
}).catch((err) => {
  console.error(err);
  loadingText.textContent = 'Could not load the heart model. Check your connection and reload.';
});

// ---------------------------------------------------------------- controls
function setPressed(btn, on) { btn.setAttribute('aria-pressed', String(on)); }
function isPressed(btn) { return btn.getAttribute('aria-pressed') === 'true'; }

// camera fly-to
let fly = null;
function flyTo(dir, dist) {
  const target = new THREE.Vector3(0, 0, 0);
  fly = {
    from: camera.position.clone(), fromT: controls.target.clone(),
    to: dir.clone().normalize().multiplyScalar(dist), toT: target, k: 0,
  };
}
function stopAutoRotate() { controls.autoRotate = false; setPressed($('btnRotate'), false); }

$('btnExplode').addEventListener('click', () => {
  const on = !isPressed($('btnExplode'));
  setPressed($('btnExplode'), on);
  $('explodeLabel').textContent = on ? 'Assemble' : 'Disassemble';
  state.explodeTarget = on ? 1 : 0;
  const dir = camera.position.clone().sub(controls.target);
  flyTo(dir, on ? EXPLODED_DIST : HOME_DIST);
});

function applySectionUI() {
  $('sectionGroup').hidden = !state.section;
  const ax = AXES[state.axis];
  const depth = $('depth');
  depth.min = ax.min; depth.max = ax.max;
  depth.value = state.depth;
  document.querySelectorAll('[data-axis]').forEach((b) => setPressed(b, b.dataset.axis === state.axis));
}
$('btnSection').addEventListener('click', () => {
  state.section = !isPressed($('btnSection'));
  setPressed($('btnSection'), state.section);
  if (state.section) {
    state.depth = AXES[state.axis].def;
    stopAutoRotate();
    flyTo(AXES[state.axis].cam, HOME_DIST);
  }
  applySectionUI();
});
document.querySelectorAll('[data-axis]').forEach((btn) => btn.addEventListener('click', () => {
  state.axis = btn.dataset.axis;
  state.depth = AXES[state.axis].def;
  stopAutoRotate();
  flyTo(AXES[state.axis].cam, HOME_DIST);
  applySectionUI();
}));
$('depth').addEventListener('input', (e) => { state.depth = parseFloat(e.target.value); });

$('btnBeat').addEventListener('click', () => {
  state.beat = !isPressed($('btnBeat'));
  setPressed($('btnBeat'), state.beat);
});
setPressed($('btnBeat'), state.beat);
$('rate').addEventListener('input', (e) => {
  state.bpm = parseInt(e.target.value, 10);
  $('rateValue').textContent = `${state.bpm} bpm`;
});

$('btnCoronary').addEventListener('click', () => {
  const on = !isPressed($('btnCoronary'));
  setPressed($('btnCoronary'), on);
  parts.forEach((p) => { if (p.group === 'coronary' || p.group === 'cardiac_vein') p.mesh.visible = on; });
});
$('btnRotate').addEventListener('click', () => {
  controls.autoRotate = !isPressed($('btnRotate'));
  setPressed($('btnRotate'), controls.autoRotate);
});
setPressed($('btnRotate'), controls.autoRotate);
$('btnWire').addEventListener('click', () => {
  const on = !isPressed($('btnWire'));
  setPressed($('btnWire'), on);
  parts.forEach((p) => { p.mesh.material.wireframe = on; });
});
$('btnReset').addEventListener('click', () => {
  flyTo(new THREE.Vector3(0, 0.07, 1), state.explodeTarget ? EXPLODED_DIST : HOME_DIST);
});

// ---------------------------------------------------------------- tap to name
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;
let selected = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false)
    .filter((h) => h.object.visible && (!state.section || clip.distanceToPoint(h.point) >= 0));
  select(hits.length ? hits[0].object.userData.part : null);
});
function infoFor(name) {
  if (parts.has(name)) return parts.get(name);
  const v = meta.valves.find((x) => x.name === name);
  if (v) return v;
  if (name === 'chordae') return meta.chordae;
  return null;
}
function highlight(name, on) {
  const c = on ? 0x3a2400 : 0x000000;
  if (parts.has(name)) parts.get(name).mesh.material.emissive.setHex(c);
  const v = valves.find((x) => x.name === name);
  if (v) v.material.emissive.setHex(c);
  if (name === 'chordae' && chordae) chordae.material.emissive.setHex(c);
}
function select(name) {
  if (selected) highlight(selected, false);
  selected = name;
  const info = name && infoFor(name);
  $('partNote').hidden = !info;
  document.body.classList.toggle('has-part', !!info);
  if (!info) return;
  highlight(name, true);
  $('partName').textContent = info.label;
  $('partDesc').textContent = info.description;
}

// ---------------------------------------------------------------- frame loop
let lastPhase = null;
function applyCycle() {
  const cyc = cycle(state.t);
  U.uV.value = cyc.uV;
  U.uA.value = cyc.uA;
  U.uE.value = cyc.uE;
  state.av = cyc.av;
  state.sl = cyc.sl;
  if (cyc.phase !== lastPhase) {
    lastPhase = cyc.phase;
    $('phaseName').textContent = cyc.phase.name;
    $('phaseDesc').textContent = cyc.phase.desc;
  }
}
const _w = new THREE.Vector3();
function updateClip() {
  if (!state.section || !heartNode) { clip.set(AXES.front.normal, 1e3); return; }
  const ax = AXES[state.axis];
  const local = new THREE.Vector3();
  if (state.axis === 'front') local.z = state.depth;
  if (state.axis === 'top') local.y = state.depth;
  if (state.axis === 'side') local.x = state.depth;
  heartNode.localToWorld(_w.copy(local));
  clip.setFromNormalAndCoplanarPoint(ax.normal, _w);
}

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (heartNode) {
    if (state.beat) {
      state.t = (state.t + dt * state.bpm / 60) % 1;
      applyCycle();
    }
    state.explode += (state.explodeTarget - state.explode) * (1 - Math.exp(-dt * 4));
    if (Math.abs(state.explodeTarget - state.explode) < 1e-4) state.explode = state.explodeTarget;
    parts.forEach((p) => p.mesh.position.copy(p.explode).multiplyScalar(state.explode));
    updateValves();
    updateChordae();
    updateClip();
  }
  if (fly) {
    fly.k = Math.min(1, fly.k + dt / 0.8);
    const e = fly.k * fly.k * (3 - 2 * fly.k);
    camera.position.lerpVectors(fly.from, fly.to, e);
    controls.target.lerpVectors(fly.fromT, fly.toT, e);
    if (fly.k >= 1) fly = null;
  }
  controls.update();
  renderer.render(scene, camera);
});
