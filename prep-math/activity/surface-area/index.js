import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

// --- CONFIGURATION STATE ---
const configState = {
  shape: 'sphere',
  showLabels: true,
  showExplanation: true,
  multicolor: true,
  autoRotate: true
};

// --- PALETTES ---
const paletteMulti = ['#FF4911', '#3B82F6', '#FF007F', '#A6E22E', '#9D4EDD', '#FFD966'];
const paletteMono  = ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A', '#172554'];

function getColorArray(isMulti, count) {
  const p = isMulti ? paletteMulti : paletteMono;
  return Array.from({ length: count }, (_, i) => new THREE.Color(p[i % p.length]));
}

// --- SCENE SETUP ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
// FIX 1: Set scene.background instead of alpha:true to eliminate depth-buffer
// precision issues with premultiplied transparency compositing. Pull the
// colour from the soft-UI theme token so the canvas matches the rest of the
// site (and follows light/dark), falling back to the original cream.
const appBg = getComputedStyle(document.documentElement)
  .getPropertyValue('--app-bg').trim() || '#F4F4F0';
scene.background = new THREE.Color(appBg);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);

// FIX: remove alpha:true — depth sorting artifacts disappeared
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Ensures overlapping coplanar faces (box net) render correctly
renderer.sortObjects = true;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = true;
controls.zoomSpeed = 1.2;
controls.dampingFactor = 0.08;

const sceneGroup = new THREE.Group();
scene.add(sceneGroup);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

let isMobile = window.innerWidth <= 768;

function fitCamera(mobileFlag) {
  const aspect = window.innerWidth / window.innerHeight;
  const targetHeight = mobileFlag ? 18 : 12;
  const targetWidth  = mobileFlag ? 12 : 18;
  const vFov  = (camera.fov * Math.PI) / 180;
  const zH    = targetHeight / (2 * Math.tan(vFov / 2));
  const zW    = targetWidth  / (2 * aspect * Math.tan(vFov / 2));
  const zDist = Math.max(zH, zW);
  // FIX: don't fight gsap with a direct set on the same property
  camera.position.set(camera.position.x || 0, camera.position.y || 2, zDist);
  controls.target.set(0, 0, 0);
  controls.update();
}

window.addEventListener('resize', () => {
  isMobile = window.innerWidth <= 768;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  fitCamera(isMobile);
});
fitCamera(isMobile);

// --- GLOBAL UI UPDATERS ---
const textOverlay   = document.getElementById('explanation-overlay');
const textContent   = document.getElementById('text-content');
const labelsContainer = document.getElementById('labels-container');
const slider        = document.getElementById('progress-slider');
const rotateBtn     = document.getElementById('rotate-btn');

let currentShapeSystem = null;
let domLabels = [];

function clearLabels() {
  labelsContainer.innerHTML = '';
  domLabels = [];
}

function updateUITexts(progress) {
  if (!configState.showExplanation || !currentShapeSystem) {
    textOverlay.style.opacity = '0';
    return;
  }
  textOverlay.style.opacity = '1';

  const texts = currentShapeSystem.texts;
  let activeText = texts[0].text;
  let activeBg   = texts[0].bg;

  for (let i = 0; i < texts.length; i++) {
    if (progress >= texts[i].start && progress <= texts[i].end) {
      activeText = texts[i].text;
      activeBg   = texts[i].bg || '#1a1a2e';
    }
  }

  if (textContent.innerHTML !== activeText) {
    // Banner styling is owned by the soft-UI CSS (surface card + ink text);
    // we only swap the copy. `activeBg` is kept for any future per-step accent.
    void activeBg;
    gsap.to(textContent, {
      opacity: 0, duration: 0.15, onComplete: () => {
        textContent.innerHTML = activeText;
        gsap.to(textContent, { opacity: 1, duration: 0.25 });
      }
    });
  }
}

function updateUILabels(progress) {
  if (!configState.showLabels || !currentShapeSystem) {
    domLabels.forEach(el => { el.div.style.opacity = '0'; });
    return;
  }
  scene.updateMatrixWorld(true);
  const tempVec = new THREE.Vector3();

  domLabels.forEach(el => {
    if (progress >= el.l.min && progress <= el.l.max) {
      el.div.style.opacity = '1';
      tempVec.copy(el.l.getPos());
      tempVec.project(camera);
      const x = (tempVec.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-tempVec.y * 0.5 + 0.5) * window.innerHeight;
      el.div.style.left = `${x}px`;
      el.div.style.top  = `${y}px`;
    } else {
      el.div.style.opacity = '0';
    }
  });
}

function initLabels(labelData) {
  clearLabels();
  labelData.forEach(l => {
    const div = document.createElement('div');
    div.className = 'floating-label';
    div.innerText  = l.text;
    div.style.backgroundColor = l.bg;
    div.style.color = l.textColor || '#fff';
    labelsContainer.appendChild(div);
    domLabels.push({ div, l });
  });
}

// FIX 2: After each shape init, disable frustum culling on all meshes.
// GSAP animates positions/rotations but Three.js culls against the ORIGINAL
// bounding sphere — causing parts to vanish mid-animation.
function disableFrustumCulling() {
  sceneGroup.traverse(obj => {
    if (obj.isMesh || obj.isInstancedMesh) {
      obj.frustumCulled = false;
    }
  });
}

function customAlert(message) {
  document.getElementById('custom-alert-text').innerText = message;
  document.getElementById('alert-backdrop').style.display = 'block';
  document.getElementById('custom-alert').style.display = 'flex';
}
document.getElementById('close-alert').addEventListener('click', () => {
  document.getElementById('alert-backdrop').style.display = 'none';
  document.getElementById('custom-alert').style.display = 'none';
});

// --- ROTATION TOGGLE ---
function syncRotateBtn() {
  if (configState.autoRotate) {
    rotateBtn.classList.add('active');
    rotateBtn.title = 'Auto-rotation ON — click to stop';
  } else {
    rotateBtn.classList.remove('active');
    rotateBtn.title = 'Auto-rotation OFF — click to start';
  }
}

rotateBtn.addEventListener('click', () => {
  configState.autoRotate = !configState.autoRotate;
  syncRotateBtn();
});
syncRotateBtn();

// --- REARRANGE / ANALOG UI ---
const analogStyle = document.createElement('style');
analogStyle.innerHTML = `
  #analog-wrapper {
    position: fixed;
    bottom: 110px;
    right: 20px;
    display: none;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    z-index: 200;
    font-family: 'Space Mono', monospace;
  }
  .analog-btn {
    background: #A6E22E;
    border: 3px solid #000;
    box-shadow: 4px 4px 0px #000;
    padding: 8px 12px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    border-radius: 255px 15px 225px 15px/15px 225px 15px 255px;
    text-transform: uppercase;
    transition: transform 0.1s, background-color 0.2s;
  }
  .analog-btn:active { transform: translate(2px,2px); box-shadow: 2px 2px 0px #000; }
  #joystick-base {
    width: 100px; height: 100px;
    background: rgba(255,255,255,0.9);
    border: 4px solid #000;
    border-radius: 50%;
    box-shadow: 4px 4px 0px #000;
    display: flex; justify-content: center; align-items: center;
    touch-action: none;
  }
  #joystick-thumb {
    width: 40px; height: 40px;
    background: #FF4911;
    border: 3px solid #000;
    border-radius: 50%;
    box-shadow: 2px 2px 0px #000;
    pointer-events: none;
  }
`;
document.head.appendChild(analogStyle);

const analogWrapper = document.createElement('div');
analogWrapper.id = 'analog-wrapper';

const analogBtnRow = document.createElement('div');
analogBtnRow.style.cssText = 'display:flex;gap:10px;';

let zModeActive = false;
const zToggleBtn = document.createElement('button');
zToggleBtn.className = 'analog-btn';
zToggleBtn.innerText  = 'MODE: X/Y';
zToggleBtn.onclick = () => {
  zModeActive = !zModeActive;
  zToggleBtn.innerText = zModeActive ? 'MODE: X/Z' : 'MODE: X/Y';
  zToggleBtn.style.backgroundColor = zModeActive ? '#FF007F' : '#A6E22E';
  zToggleBtn.style.color = zModeActive ? '#fff' : '#000';
};

const doneBtn = document.createElement('button');
doneBtn.className = 'analog-btn';
doneBtn.innerText  = 'DONE';
doneBtn.style.cssText = 'background:#3B82F6;color:#fff;';
doneBtn.onclick = dropObject;

analogBtnRow.appendChild(zToggleBtn);
analogBtnRow.appendChild(doneBtn);

const joystickBase  = document.createElement('div');
joystickBase.id     = 'joystick-base';
const joystickThumb = document.createElement('div');
joystickThumb.id    = 'joystick-thumb';
joystickBase.appendChild(joystickThumb);

analogWrapper.appendChild(analogBtnRow);
analogWrapper.appendChild(joystickBase);
document.body.appendChild(analogWrapper);

let isDragging = false;
let jActive = false;
const jCenter = { x: 0, y: 0 };
const jVector  = { x: 0, y: 0 };
const maxR     = 30;

function startJoystick(e) {
  jActive = true;
  const rect = joystickBase.getBoundingClientRect();
  jCenter.x = rect.left + rect.width  / 2;
  jCenter.y = rect.top  + rect.height / 2;
  moveJoystick(e);
}

function moveJoystick(e) {
  if (!jActive) return;
  const clientX = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
  const clientY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
  let dx = clientX - jCenter.x;
  let dy = clientY - jCenter.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
  joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;
  jVector.x = dx / maxR;
  jVector.y = -dy / maxR; // invert Y: push up = positive
}

function endJoystick() {
  jActive = false;
  joystickThumb.style.transform = 'translate(0px, 0px)';
  jVector.x = 0;
  jVector.y = 0;
}

joystickBase.addEventListener('mousedown', startJoystick);
window.addEventListener('mousemove',  moveJoystick);
window.addEventListener('mouseup',    endJoystick);
joystickBase.addEventListener('touchstart', startJoystick, { passive: false });
window.addEventListener('touchmove',  moveJoystick, { passive: false });
window.addEventListener('touchend',   endJoystick);

// FIX 3: Rearrange now moves sceneGroup — no more fragile parent-traversal that
// picked wrong objects in InstancedMesh / nested Group hierarchies.
function handleDoubleClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = event.clientX !== undefined ? event.clientX : event.touches[0].clientX;
  const clientY = event.clientY !== undefined ? event.clientY : event.touches[0].clientY;

  const mouse = new THREE.Vector2(
    ((clientX - rect.left) / rect.width)  *  2 - 1,
    -((clientY - rect.top)  / rect.height) *  2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(sceneGroup.children, true);

  if (hits.length > 0) {
    isDragging = true;
    controls.enabled = false;
    analogWrapper.style.display = 'flex';
    customAlert('Rearrange mode: use the stick to reposition the shape. Toggle Z to move in depth.');
  }
}

function dropObject() {
  isDragging = false;
  controls.enabled = true;
  analogWrapper.style.display = 'none';
  endJoystick();
}

renderer.domElement.addEventListener('dblclick', handleDoubleClick);

let lastTapTime = 0;
renderer.domElement.addEventListener('touchstart', (e) => {
  const now = Date.now();
  if (now - lastTapTime < 300 && now - lastTapTime > 0 && !isDragging) {
    handleDoubleClick(e);
    e.preventDefault();
  }
  lastTapTime = now;
}, { passive: false });

// --- SHAPE BUILDERS ---

function buildSphere() {
  const N_PER_TRI   = 90;
  const TOTAL_STRIPES = N_PER_TRI * 4;
  const geom = new THREE.PlaneGeometry(1, 1, isMobile ? 64 : 128, 1);
  const indices = new Float32Array(TOTAL_STRIPES);
  const colors  = new Float32Array(TOTAL_STRIPES * 3);

  const cArr = getColorArray(configState.multicolor, 4);
  for (let i = 0; i < TOTAL_STRIPES; i++) {
    indices[i] = i;
    const c = cArr[Math.floor(i / N_PER_TRI) % cArr.length];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geom.setAttribute('aIndex', new THREE.InstancedBufferAttribute(indices, 1));
  geom.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));

  let stripeProgress = new Array(TOTAL_STRIPES).fill(0);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      u_t1: { value: 0.0 }, u_t2: { value: 0.0 }, u_t3: { value: 0.0 },
      u_stripe_progress: { value: stripeProgress },
      u_gap: { value: 0.0 }, u_layout: { value: isMobile ? 1.0 : 0.0 }
    },
    vertexShader: `
      uniform float u_t1, u_t2, u_t3, u_gap, u_layout;
      uniform float u_stripe_progress[${TOTAL_STRIPES}];
      attribute float aIndex; attribute vec3 aColor;
      varying vec3 vColor; varying vec3 vViewPosition;
      #define PI 3.141592653589793
      #define TWO_PI 6.28318530718
      void main() {
        float stripesPerTri = ${N_PER_TRI}.0;
        float tri_idx   = floor(aIndex / stripesPerTri);
        float stripe_idx = mod(aIndex, stripesPerTri);
        int stripe_id   = int(aIndex);
        float R = 1.35;
        float v_local = mix(u_gap, 1.0 - u_gap, uv.y);
        float u_local = uv.x;
        float r = (stripe_idx + v_local) * R / stripesPerTri;
        float circumference = TWO_PI * r;
        float X_rect, Y_rect, X_local, Y_local;
        if (tri_idx == 0.0)      { Y_rect = -r;    X_rect = u_local * circumference; X_local = X_rect; }
        else if (tri_idx == 1.0) { Y_rect = r - R; X_rect = TWO_PI * R - circumference + u_local * circumference; X_local = TWO_PI * R - X_rect; }
        else if (tri_idx == 2.0) { Y_rect = R - r; X_rect = u_local * circumference; X_local = X_rect; }
        else                     { Y_rect = r;     X_rect = TWO_PI * R - circumference + u_local * circumference; X_local = TWO_PI * R - X_rect; }
        Y_local = -r;
        float theta = (X_rect - PI * R) / R;
        vec3 pCyl = vec3(R * sin(theta), Y_rect, R * cos(theta));
        float r_sph = sqrt(max(0.0001, R*R - Y_rect*Y_rect));
        vec3 pSph = vec3(r_sph * sin(theta), Y_rect, r_sph * cos(theta));
        vec3 pRect = vec3(X_rect - PI * R, Y_rect, 0.0);
        vec2 C_d[4]; C_d[0]=vec2(-5.0,3.0); C_d[1]=vec2(5.0,3.0); C_d[2]=vec2(-5.0,-3.0); C_d[3]=vec2(5.0,-3.0);
        vec2 C_m[4]; C_m[0]=vec2(0.0,8.0);  C_m[1]=vec2(0.0,2.8);  C_m[2]=vec2(0.0,-2.8);  C_m[3]=vec2(0.0,-8.0);
        vec2 C_i = mix(C_d[int(tri_idx)], C_m[int(tri_idx)], u_layout);
        vec3 pTri = vec3(C_i.x + X_local - PI * R, C_i.y + Y_local + R * 0.5, 0.0);
        float stripe_roll = u_stripe_progress[stripe_id];
        float safe_r = max(r, 0.001); float s = X_local; float total_len = TWO_PI * safe_r;
        float s_clamped = clamp(s, 0.0, total_len);
        float cx = 0.0; float cy = -safe_r; float X_curl, Y_curl;
        if (stripe_roll <= 0.0) { X_curl = s_clamped; Y_curl = 0.0; }
        else if (stripe_roll >= 1.0) {
          float phi = (s_clamped / total_len) * TWO_PI;
          X_curl = cx + safe_r * sin(phi); Y_curl = cy + safe_r * (1.0 - cos(phi));
        } else {
          float arc_angle = TWO_PI * stripe_roll; float arc_len_curled = safe_r * arc_angle;
          if (s_clamped <= arc_len_curled) {
            float phi = s_clamped / safe_r;
            X_curl = cx + safe_r * sin(phi); Y_curl = cy + safe_r * (1.0 - cos(phi));
          } else {
            float endX = cx + safe_r * sin(arc_angle); float endY = cy + safe_r * (1.0 - cos(arc_angle));
            float tdx = cos(arc_angle); float tdy = sin(arc_angle);
            float sp = s_clamped - arc_len_curled;
            X_curl = endX + sp * tdx; Y_curl = endY + sp * tdy;
          }
        }
        vec3 pCurl = vec3(C_i.x + X_curl, C_i.y + R * 0.5 + Y_curl, (R - r) * 0.025 * stripe_roll);
        vec3 p = mix(pSph, pCyl, u_t1); p = mix(p, pRect, u_t2); p = mix(p, pTri, u_t3);
        p = mix(p, pCurl, stripe_roll);
        vColor = aColor * (stripe_roll > 0.5 ? (0.85 + 0.15 * sin(stripe_idx * 0.5)) : 1.0);
        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        vViewPosition = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vColor; varying vec3 vViewPosition;
      void main() {
        vec3 fdx = dFdx(vViewPosition); vec3 fdy = dFdy(vViewPosition);
        vec3 n = normalize(cross(fdx, fdy)); if (!gl_FrontFacing) n = -n;
        float diff = max(dot(n, normalize(vec3(1.2, 1.5, 1.8))), 0.0) * 0.5 + 0.5;
        gl_FragColor = vec4(vColor * diff, 1.0);
      }
    `,
    side: THREE.DoubleSide, extensions: { derivatives: true }
  });

  const mesh = new THREE.InstancedMesh(geom, mat, TOTAL_STRIPES);
  mesh.frustumCulled = false;
  for (let i = 0; i < TOTAL_STRIPES; i++) mesh.setMatrixAt(i, new THREE.Matrix4());
  sceneGroup.add(mesh);

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  tl.to(mat.uniforms.u_t1, { value: 1.0, duration: 15 }, 0)
    .to(mat.uniforms.u_t2, { value: 1.0, duration: 15 }, 15)
    .to(mat.uniforms.u_t3, { value: 1.0, duration: 15 }, 30)
    .to(mat.uniforms.u_gap, { value: 0.25, duration: 10 }, 45);

  const rollStart = 55; const rollDur = 45; const sDur = rollDur / TOTAL_STRIPES;
  for (let i = 0; i < TOTAL_STRIPES; i++) {
    tl.to({}, {
      duration: sDur,
      onUpdate: function () { stripeProgress[i] = this.progress(); mat.uniforms.u_stripe_progress.value = [...stripeProgress]; },
      onComplete: () => { stripeProgress[i] = 1; mat.uniforms.u_stripe_progress.value = [...stripeProgress]; }
    }, rollStart + (i * sDur * 0.8));
  }

  const texts = [
    { start: 0,  end: 15,  text: 'Mapping sphere surface to cylinder',            bg: '#1a1a2e' },
    { start: 15, end: 30,  text: 'Cylinder unrolls into 2πR × 2R rectangle',       bg: '#16213e' },
    { start: 30, end: 45,  text: 'Deconstructing rectangle into 4 right triangles', bg: '#0f3460' },
    { start: 45, end: 60,  text: 'Peeling triangles into thin horizontal stripes',  bg: '#533483' },
    { start: 60, end: 100, text: 'Rolling stripe by stripe → Circles!',              bg: '#e94560' }
  ];

  const getShapeCenter = (idx) => {
    const d = [new THREE.Vector3(-5.2,3.2,0), new THREE.Vector3(5.2,3.2,0), new THREE.Vector3(-5.2,-3.2,0), new THREE.Vector3(5.2,-3.2,0)];
    const m = [new THREE.Vector3(0,8.2,0),    new THREE.Vector3(0,2.8,0),   new THREE.Vector3(0,-2.8,0),     new THREE.Vector3(0,-8.2,0)];
    return new THREE.Vector3().lerpVectors(d[idx], m[idx], mat.uniforms.u_layout.value);
  };

  const labels = [
    { text: 'Sphere → Cylinder: Area = 4πR²', getPos: () => new THREE.Vector3(0, 2.4, 1.2),  min: 0,  max: 20,  bg: '#FF4911' },
    { text: 'Unroll: 2πR × 2R',               getPos: () => new THREE.Vector3(0, -2.2, 2.0), min: 20, max: 40,  bg: '#A6E22E', textColor: '#000' },
    { text: '4 Right Triangles',               getPos: () => new THREE.Vector3(0, -2.0, 0),   min: 40, max: 55,  bg: '#3B82F6' },
  ];
  for (let i = 0; i < 4; i++) {
    labels.push({ text: 'Area = πR²', getPos: () => getShapeCenter(i).add(new THREE.Vector3(0, -0.8, 1.0)), min: 85, max: 100, bg: '#FFFFFFCC', textColor: '#111' });
  }

  return {
    tl, texts, labels,
    customUpdate: (val) => {
      const ct = (val / 100) * 100;
      for (let i = 0; i < TOTAL_STRIPES; i++) {
        const sStart = rollStart + i * sDur * 0.8;
        if      (ct <= sStart)          stripeProgress[i] = 0;
        else if (ct >= sStart + sDur)   stripeProgress[i] = 1;
        else                            stripeProgress[i] = (ct - sStart) / sDur;
      }
      mat.uniforms.u_stripe_progress.value = [...stripeProgress];
    }
  };
}

function buildCylinder() {
  const R = 1.2; const H = 3.0;
  const cArr = getColorArray(configState.multicolor, 3);

  const tubeMat = new THREE.ShaderMaterial({
    uniforms: { u_unroll: { value: 0.0 }, u_color: { value: cArr[0] } },
    vertexShader: `
      uniform float u_unroll; varying vec3 vNorm;
      #define PI 3.141592653589
      void main() {
        float angle = uv.x * 2.0 * PI;
        vec3 pCyl  = vec3(${R.toFixed(2)} * sin(angle), position.y, ${R.toFixed(2)} * cos(angle));
        vec3 nCyl  = normalize(vec3(sin(angle), 0.0, cos(angle)));
        vec3 pFlat = vec3((uv.x - 0.5) * 2.0 * PI * ${R.toFixed(2)}, position.y, 0.0);
        vec3 nFlat = vec3(0.0, 0.0, 1.0);
        vec3 p = mix(pCyl, pFlat, u_unroll);
        vNorm  = mix(nCyl, nFlat,  u_unroll);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 u_color; varying vec3 vNorm;
      void main() {
        float diff = max(dot(normalize(vNorm), normalize(vec3(1.0, 1.5, 2.0))), 0.2);
        gl_FragColor = vec4(u_color * diff, 1.0);
      }
    `,
    side: THREE.DoubleSide
  });

  const tubeGeom = new THREE.PlaneGeometry(1, H, 64, 1);
  const tube = new THREE.Mesh(tubeGeom, tubeMat);
  tube.frustumCulled = false;
  sceneGroup.add(tube);

  // FIX: polygonOffset prevents z-fighting when the circular caps land on the
  // same z=0 plane as the unrolled tube rectangle
  const capMat1 = new THREE.MeshLambertMaterial({ color: cArr[1], side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const capMat2 = new THREE.MeshLambertMaterial({ color: cArr[2] || cArr[1], side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const circleGeom = new THREE.CircleGeometry(R, 64);

  const topPivot = new THREE.Group(); topPivot.position.set(0, H / 2, -R);
  const topCap   = new THREE.Mesh(circleGeom, capMat1);
  topCap.frustumCulled = false;
  topCap.position.set(0, 0, R); topCap.rotation.x = -Math.PI / 2;
  topPivot.add(topCap); sceneGroup.add(topPivot);
  const topL = new THREE.Group(); topCap.add(topL);

  const botPivot = new THREE.Group(); botPivot.position.set(0, -H / 2, -R);
  const botCap   = new THREE.Mesh(circleGeom, capMat2);
  botCap.frustumCulled = false;
  botCap.position.set(0, 0, R); botCap.rotation.x = Math.PI / 2;
  botPivot.add(botCap); sceneGroup.add(botPivot);
  const botL = new THREE.Group(); botCap.add(botL);

  const tl = gsap.timeline({ paused: true });
  tl.to(tubeMat.uniforms.u_unroll, { value: 1.0, duration: 45, ease: 'power1.inOut' }, 0);
  tl.to(topPivot.position, { z: 0, duration: 45, ease: 'power1.inOut' }, 0);
  tl.to(botPivot.position, { z: 0, duration: 45, ease: 'power1.inOut' }, 0);
  tl.to(topPivot.rotation, { x: -Math.PI / 2, duration: 30, ease: 'power2.inOut' }, 45);
  tl.to(botPivot.rotation, { x:  Math.PI / 2, duration: 30, ease: 'power2.inOut' }, 45);
  tl.to(topPivot.position, { y:  H / 2 + 0.3, duration: 25, ease: 'power1.inOut' }, 75);
  tl.to(botPivot.position, { y: -H / 2 - 0.3, duration: 25, ease: 'power1.inOut' }, 75);

  const texts = [
    { start: 0,  end: 45,  text: '3D Cylinder: Curved surface and two perfectly sealed caps', bg: '#1a1a2e' },
    { start: 45, end: 75,  text: 'Unrolling the curved surface and flattening the caps...',   bg: '#16213e' },
    { start: 75, end: 100, text: 'Exploded 2D Net: Area = (2πr × h) + 2(πr²)',                bg: '#e94560' }
  ];
  const labels = [
    { text: 'Tube: 2πr × h', getPos: () => new THREE.Vector3(0, 0, 0), min: 55, max: 100, bg: '#A6E22E', textColor: '#000' },
    { text: 'Top: πr²',      getPos: () => { const v = new THREE.Vector3(); topL.getWorldPosition(v); return v; }, min: 65, max: 100, bg: '#FF007F' },
    { text: 'Base: πr²',     getPos: () => { const v = new THREE.Vector3(); botL.getWorldPosition(v); return v; }, min: 65, max: 100, bg: '#3B82F6' }
  ];

  return { tl, texts, labels };
}

function buildCone() {
  const R = 1.5; const H = 2.5; const L = Math.sqrt(R * R + H * H);
  const thetaMax = (2.0 * Math.PI * R) / L;
  const cArr = getColorArray(configState.multicolor, 2);

  const coneMat = new THREE.ShaderMaterial({
    uniforms: { u_unroll: { value: 0.0 }, u_color: { value: cArr[0] } },
    vertexShader: `
      uniform float u_unroll; varying vec3 vNorm;
      void main() {
        float R = ${R.toFixed(3)}; float H = ${H.toFixed(3)}; float L = ${L.toFixed(3)};
        float theta_max = ${thetaMax.toFixed(3)};
        float aCone = (uv.x - 0.5) * 6.2831853;
        float rCone = uv.y * R; float yCone = H/2.0 - uv.y * H;
        vec3 pCone = vec3(rCone * sin(aCone), yCone, rCone * cos(aCone));
        vec3 nCone = normalize(vec3(sin(aCone), R/H, cos(aCone)));
        float aFlat = (uv.x - 0.5) * theta_max; float dist = uv.y * L;
        vec3 pFlat = vec3(dist * sin(aFlat), H/2.0 - dist * cos(aFlat), 0.0);
        vec3 nFlat = vec3(0.0, 0.0, 1.0);
        vec3 p = mix(pCone, pFlat, u_unroll);
        vNorm   = mix(nCone, nFlat,  u_unroll);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 u_color; varying vec3 vNorm;
      void main() {
        float diff = max(dot(normalize(vNorm), normalize(vec3(1.0, 1.5, 2.0))), 0.2);
        gl_FragColor = vec4(u_color * diff, 1.0);
      }
    `,
    side: THREE.DoubleSide
  });

  const coneGeom = new THREE.PlaneGeometry(1, 1, 64, 64);
  const cone = new THREE.Mesh(coneGeom, coneMat);
  cone.frustumCulled = false;
  sceneGroup.add(cone);

  // FIX: polygon offset so the base circle doesn't z-fight the sector
  const capMat = new THREE.MeshLambertMaterial({ color: cArr[1], side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const capPivot = new THREE.Group();
  capPivot.position.set(0, -H / 2, R);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(R, 64), capMat);
  cap.frustumCulled = false;
  cap.position.set(0, 0, -R);
  cap.rotation.x = Math.PI / 2;
  capPivot.add(cap); sceneGroup.add(capPivot);
  const capL = new THREE.Group(); cap.add(capL);

  const tl = gsap.timeline({ paused: true });
  tl.to(coneMat.uniforms.u_unroll, { value: 1.0, duration: 45, ease: 'power1.inOut' }, 0);
  tl.to(capPivot.position, { y: H / 2 - L, z: 0, duration: 45, ease: 'power1.inOut' }, 0);
  tl.to(capPivot.rotation, { x: -Math.PI / 2, duration: 30, ease: 'power2.inOut' }, 45);
  tl.to(capPivot.position, { y: H / 2 - L - 0.35, duration: 25, ease: 'power1.inOut' }, 75);

  const texts = [
    { start: 0,  end: 45,  text: '3D Cone: Closed lateral surface and circular base', bg: '#0f3460' },
    { start: 45, end: 75,  text: 'Unrolling along slant height into a flat net...',   bg: '#533483' },
    { start: 75, end: 100, text: 'Exploded 2D Net: Sector (πrl) + Base (πr²)',         bg: '#e94560' }
  ];
  const labels = [
    { text: 'Sector = πrl', getPos: () => new THREE.Vector3(0, H / 2 - L / 2, 0), min: 55, max: 100, bg: '#3B82F6' },
    { text: 'Base = πr²',   getPos: () => { const v = new THREE.Vector3(); capL.getWorldPosition(v); return v; }, min: 65, max: 100, bg: '#FF007F' }
  ];

  return { tl, texts, labels };
}

function buildBox(W, H, D, isCube) {
  const cArr = getColorArray(configState.multicolor, 6);

  // FIX: staggered polygonOffsetFactor so that when all 6 faces land on the
  // same z=0 plane in the exploded net, each face gets a unique depth nudge
  // — eliminates the z-fighting flicker / disappearance
  const getMat = (i) => new THREE.MeshLambertMaterial({
    color: cArr[i],
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -(i + 1),
    polygonOffsetUnits:  -(i + 1)
  });

  const anchor = new THREE.Group();
  anchor.name = 'anchorGroup';
  sceneGroup.add(anchor);

  const mkMesh = (geom, matIdx) => {
    const m = new THREE.Mesh(geom, getMat(matIdx));
    m.frustumCulled = false;
    return m;
  };

  const base  = mkMesh(new THREE.PlaneGeometry(W, D), 0); anchor.add(base);

  const pFront = new THREE.Group(); pFront.position.set(0,  D / 2, 0); anchor.add(pFront);
  const front  = mkMesh(new THREE.PlaneGeometry(W, H), 1); front.position.set(0, H / 2, 0); pFront.add(front);

  const pBack  = new THREE.Group(); pBack.position.set(0, -D / 2, 0); anchor.add(pBack);
  const back   = mkMesh(new THREE.PlaneGeometry(W, H), 2); back.position.set(0, -H / 2, 0); pBack.add(back);

  const pLeft  = new THREE.Group(); pLeft.position.set(-W / 2, 0, 0); anchor.add(pLeft);
  const left   = mkMesh(new THREE.PlaneGeometry(H, D), 3); left.position.set(-H / 2, 0, 0); pLeft.add(left);

  const pRight = new THREE.Group(); pRight.position.set( W / 2, 0, 0); anchor.add(pRight);
  const right  = mkMesh(new THREE.PlaneGeometry(H, D), 4); right.position.set(H / 2, 0, 0); pRight.add(right);

  const pLid   = new THREE.Group(); pLid.position.set(0, H / 2, 0); front.add(pLid);
  const lid    = mkMesh(new THREE.PlaneGeometry(W, D), 5); lid.position.set(0, D / 2, 0); pLid.add(lid);

  pFront.rotation.x = Math.PI / 2;
  pBack.rotation.x  = -Math.PI / 2;
  pLeft.rotation.y  = Math.PI / 2;
  pRight.rotation.y = -Math.PI / 2;
  pLid.rotation.x   = Math.PI / 2;

  anchor.rotation.x = -Math.PI / 2;
  anchor.position.y = -H / 2;

  const baseL  = new THREE.Group(); base.add(baseL);
  const frontL = new THREE.Group(); front.add(frontL);
  const backL  = new THREE.Group(); back.add(backL);
  const leftL  = new THREE.Group(); left.add(leftL);
  const rightL = new THREE.Group(); right.add(rightL);
  const lidL   = new THREE.Group(); lid.add(lidL);

  const tl = gsap.timeline({ paused: true });
  tl.to(anchor.rotation, { x: 0,           duration: 20, ease: 'power2.inOut' }, 0);
  tl.to(anchor.position, { y: 0,           duration: 20, ease: 'power2.inOut' }, 0);
  tl.to(pLid.rotation,   { x: 0,           duration: 20, ease: 'power2.inOut' }, 20);
  tl.to(pFront.rotation, { x: 0,           duration: 35, ease: 'power2.inOut' }, 40);
  tl.to(pBack.rotation,  { x: 0,           duration: 35, ease: 'power2.inOut' }, 40);
  tl.to(pLeft.rotation,  { y: 0,           duration: 35, ease: 'power2.inOut' }, 40);
  tl.to(pRight.rotation, { y: 0,           duration: 35, ease: 'power2.inOut' }, 40);

  const gap = 0.25;
  tl.to(pFront.position, { y:  D / 2 + gap, duration: 25, ease: 'power1.inOut' }, 75);
  tl.to(pBack.position,  { y: -D / 2 - gap, duration: 25, ease: 'power1.inOut' }, 75);
  tl.to(pLeft.position,  { x: -W / 2 - gap, duration: 25, ease: 'power1.inOut' }, 75);
  tl.to(pRight.position, { x:  W / 2 + gap, duration: 25, ease: 'power1.inOut' }, 75);
  tl.to(pLid.position,   { y:  H / 2 + gap, duration: 25, ease: 'power1.inOut' }, 75);

  const texts = isCube ? [
    { start: 0,  end: 20,  text: '3D Cube: Completely sealed box with 6 faces', bg: '#16213e' },
    { start: 20, end: 75,  text: 'Unfolding along edges down to a 2D cross...',  bg: '#533483' },
    { start: 75, end: 100, text: 'Exploded Net: Total Area = 6 × s²',             bg: '#A6E22E' }
  ] : [
    { start: 0,  end: 20,  text: '3D Rectangular Prism (Cuboid): Sealed shape', bg: '#1a1a2e' },
    { start: 20, end: 75,  text: 'Unfolding 3 pairs of opposite faces...',       bg: '#0f3460' },
    { start: 75, end: 100, text: 'Exploded Net: Area = 2lw + 2lh + 2wh',         bg: '#FF007F' }
  ];

  const labels = [
    { text: isCube ? 's²' : 'w × l', getPos: () => { const v=new THREE.Vector3(); baseL.getWorldPosition(v);  return v; }, min: 65, max: 100, bg: '#A6E22E', textColor: '#000' },
    { text: isCube ? 's²' : 'w × h', getPos: () => { const v=new THREE.Vector3(); frontL.getWorldPosition(v); return v; }, min: 65, max: 100, bg: '#FF4911' },
    { text: isCube ? 's²' : 'w × h', getPos: () => { const v=new THREE.Vector3(); backL.getWorldPosition(v);  return v; }, min: 65, max: 100, bg: '#3B82F6' },
    { text: isCube ? 's²' : 'h × l', getPos: () => { const v=new THREE.Vector3(); leftL.getWorldPosition(v);  return v; }, min: 65, max: 100, bg: '#FF007F' },
    { text: isCube ? 's²' : 'h × l', getPos: () => { const v=new THREE.Vector3(); rightL.getWorldPosition(v); return v; }, min: 65, max: 100, bg: '#9D4EDD' },
    { text: isCube ? 's²' : 'w × l', getPos: () => { const v=new THREE.Vector3(); lidL.getWorldPosition(v);   return v; }, min: 65, max: 100, bg: '#FFD966', textColor: '#000' }
  ];

  return { tl, texts, labels };
}

// --- SHAPE MANAGER ---
function initShape(shapeName) {
  while (sceneGroup.children.length > 0) {
    sceneGroup.remove(sceneGroup.children[0]);
  }
  sceneGroup.rotation.set(0, 0, 0);
  sceneGroup.position.set(0, 0, 0);
  if (isDragging) dropObject();

  switch (shapeName) {
    case 'sphere':   currentShapeSystem = buildSphere();                   break;
    case 'cylinder': currentShapeSystem = buildCylinder();                 break;
    case 'cone':     currentShapeSystem = buildCone();                     break;
    case 'cube':     currentShapeSystem = buildBox(1.5, 1.5, 1.5,  true); break;
    case 'cuboid':   currentShapeSystem = buildBox(2.2, 1.2, 1.6, false); break;
  }

  // Guarantee no frustum culling for any newly-added mesh
  disableFrustumCulling();
  initLabels(currentShapeSystem.labels);
  slider.value = 0;
  updateState(0);
}

function updateState(val) {
  if (!currentShapeSystem) return;
  currentShapeSystem.tl.progress(val / 100);
  if (currentShapeSystem.customUpdate) currentShapeSystem.customUpdate(val);
  updateUITexts(val);
  updateUILabels(val);
}

// --- EVENTS ---
slider.addEventListener('input', (e) => updateState(parseFloat(e.target.value)));

const settingsBtn   = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const closeSettingsBtn = document.getElementById('close-settings');

function toggleModal(show) {
  settingsModal.style.display = show ? 'flex' : 'none';
  modalBackdrop.style.display = show ? 'block' : 'none';
}
settingsBtn.addEventListener('click', () => toggleModal(true));
closeSettingsBtn.addEventListener('click', () => toggleModal(false));
modalBackdrop.addEventListener('click', () => toggleModal(false));

const shapeDropdown    = document.getElementById('shape-dropdown');
const shapeSelectedText = document.getElementById('selected-shape-text');
const shapeOptions     = document.getElementById('shape-options');

shapeDropdown.addEventListener('click', (e) => {
  e.stopPropagation();
  shapeOptions.classList.toggle('show');
});
document.addEventListener('click', () => shapeOptions.classList.remove('show'));

document.querySelectorAll('.dropdown-option').forEach(opt => {
  opt.addEventListener('click', (e) => {
    const val  = e.target.getAttribute('data-value');
    shapeSelectedText.innerText = e.target.innerText;
    if (configState.shape !== val) {
      configState.shape = val;
      customAlert(`Initializing Mathematical Proof for: ${e.target.innerText}`);
      initShape(val);
    }
  });
});

document.getElementById('toggle-labels').addEventListener('change', (e) => {
  configState.showLabels = e.target.checked;
  updateState(parseFloat(slider.value));
});
document.getElementById('toggle-explanation').addEventListener('change', (e) => {
  configState.showExplanation = e.target.checked;
  updateState(parseFloat(slider.value));
});
document.getElementById('toggle-colors').addEventListener('change', (e) => {
  configState.multicolor = e.target.checked;
  initShape(configState.shape);
});

// ── Color Legend Modal Logic ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const colorKeyBtn = document.getElementById('color-key-btn');
  const colorLegend = document.getElementById('color-legend');

  // Populate legend from shapes array
  colorLegend.innerHTML = shapes.map(s => {
    const isDark = c => {
      const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16);
      return (r*299 + g*587 + b*114)/1000 < 128;
    };
    return `
      <div style="
        display:flex; align-items:center; gap:6px;
        background:${s.color};
        border:2px solid #1a1a1a;
        box-shadow:2px 2px 0 #1a1a1a;
        padding:4px 10px;
        font-family:'JetBrains Mono',monospace;
        font-weight:700; font-size:13px;
        color:${isDark(s.color) ? '#fff' : '#1a1a1a'};
        white-space:nowrap;
      ">
        <span style="font-size:16px; font-family:'Unbounded',sans-serif;">${s.val}</span>
        ${s.isPrime ? '<span style="font-size:10px;opacity:.8;">★</span>' : ''}
      </div>
    `;
  }).join('');

  colorKeyBtn.addEventListener('click', e => {
  e.preventDefault();
  colorLegend.classList.toggle('hide');
  
  const isHidden = colorLegend.classList.contains('hide');
  colorKeyBtn.innerHTML = isHidden ?
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/>
        <circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
       </svg><span>Color Key</span>` :
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
       </svg><span>Hide Key</span>`;
});
});

// INIT
initShape('sphere');

// --- RENDER LOOP ---
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now   = performance.now();
  const delta = Math.min((now - lastTime) / 16.667, 3); // normalize to 60fps units
  lastTime    = now;

  const progress = parseFloat(slider.value);

  if (isDragging && (jVector.x !== 0 || jVector.y !== 0)) {
    // Moves sceneGroup — predictable regardless of shape type
    const speed = 0.05 * delta;
    if (zModeActive) {
      sceneGroup.position.x += jVector.x * speed;
      sceneGroup.position.z -= jVector.y * speed;
    } else {
      sceneGroup.position.x += jVector.x * speed;
      sceneGroup.position.y += jVector.y * speed;
    }
    updateUILabels(progress);
  } else if (!isDragging) {
    if (configState.autoRotate && progress < 20) {
      sceneGroup.rotation.y += 0.005 * delta;
      if (configState.shape === 'sphere') {
        sceneGroup.rotation.x = Math.sin(Date.now() * 0.0008) * 0.1;
      }
    } else if (!configState.autoRotate || progress >= 20) {
      // Smoothly stop rotation
      sceneGroup.rotation.y = THREE.MathUtils.lerp(sceneGroup.rotation.y, 0, 0.05);
      if (configState.shape === 'sphere') {
        sceneGroup.rotation.x = THREE.MathUtils.lerp(sceneGroup.rotation.x, 0, 0.05);
      }
    }
    updateUILabels(progress);
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();
