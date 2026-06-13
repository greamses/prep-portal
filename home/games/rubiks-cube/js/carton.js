/* =====================================================================
   The "carton" — a playful printed box that drops over the cube to hide a
   fresh scramble, then lifts away for inspection. This module builds the
   procedurally-textured box mesh, animates the cover/uncover/hide moves,
   and exposes the small on/off helpers the game flow toggles.
   ===================================================================== */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { scene, cubeGroup } from "./scene.js";
import { easeInOut } from "./helpers.js";
import { carton } from "./dom.js";

/* ---------- cover artwork palette + quotes --------------------------- */
const COVER_ACCENTS = [
  "#f4c95d",
  "#6fb7e8",
  "#f07a7a",
  "#7cc47c",
  "#f0a868",
  "#e8c8ff",
];

const CUBER_QUOTES = [
  {
    q: "Solve the cross first — the rest follows.",
    n: "Theo · 0:42",
    img: "photo-1500648767791-00dcc994a43e",
  },
  {
    q: "Slow is smooth, smooth is fast.",
    n: "Mia · 0:31",
    img: "photo-1494790108377-be9c29b29330",
  },
  {
    q: "Look ahead — never pause.",
    n: "Sam · 0:55",
    img: "photo-1507003211169-0a1dd7228f2d",
  },
  {
    q: "F2L is just muscle memory.",
    n: "Ava · 0:38",
    img: "photo-1438761681033-6461ffad8d80",
  },
  {
    q: "Patience first, speed later.",
    n: "Leo · 1:10",
    img: "photo-1502685104226-ee32379fefbe",
  },
];
const unsplashUrl = (id) =>
  `https://images.unsplash.com/${id}?w=160&h=160&fit=crop&crop=faces&q=70`;

/* ---------- canvas drawing helpers ---------------------------------- */
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

function drawDoodle(ctx, x, y, kind, color, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  if (kind === 0) {
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
    ctx.beginPath();
    for (let t = 0; t < 5; t += 0.15) {
      const r = t * s * 0.18;
      const px = Math.cos(t) * r,
        py = Math.sin(t) * r;
      t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  } else if (kind === 2) {
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.quadraticCurveTo(
        i * s * 0.4 + s * 0.2,
        (i % 2 ? -1 : 1) * s * 0.5,
        (i + 1) * s * 0.4,
        0,
      );
    }
    ctx.stroke();
  } else {
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
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, s);
  ctx.lineTo(-s * 0.4, s * 1.3);
  ctx.moveTo(s * 0.4, s);
  ctx.lineTo(s * 0.4, s * 1.3);
  ctx.stroke();
  ctx.restore();
}

function drawQuoteNote(ctx, tex, cx, cy, deg, color, note) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  roundRect(ctx, -86, -96, 176, 200, 8);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-90, -98);
  ctx.lineTo(90, -94);
  ctx.lineTo(86, 96);
  ctx.quadraticCurveTo(0, 116, -88, 96);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(-30, -110, 60, 20);
  ctx.fillStyle = "#2a2723";
  ctx.textAlign = "center";
  ctx.font = "600 17px 'Shantell Sans', cursive, sans-serif";
  wrapText(ctx, '"' + note.q + '"', 0, 24, 150, 22);
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(note.n, 0, 90);
  ctx.fillStyle = "rgba(42,39,35,0.12)";
  ctx.beginPath();
  ctx.arc(0, -52, 34, 0, 7);
  ctx.fill();
  ctx.restore();

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

  ctx.globalAlpha = 0.62;
  for (let i = 0; i < 8; i++) {
    const cx = rnd(i) * 600 - 44;
    const cy = rnd(i + 10) * 600 - 44;
    const r = 84 + rnd(i + 20) * 86;
    drawBlob(ctx, cx, cy, r, COVER_ACCENTS[i % COVER_ACCENTS.length], seed + i);
  }
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 4; i++) {
    drawDoodle(
      ctx,
      40 + rnd(i + 40) * 432,
      40 + rnd(i + 50) * 432,
      (seed + i) % 4,
      COVER_ACCENTS[(seed + i + 2) % COVER_ACCENTS.length],
      16 + rnd(i + 60) * 10,
    );
  }
  drawMascot(
    ctx,
    rnd(70) > 0.5 ? 70 : 442,
    rnd(71) > 0.5 ? 80 : 432,
    26,
    COVER_ACCENTS[(seed + 3) % COVER_ACCENTS.length],
  );
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(42,39,35,0.5)";
  ctx.lineWidth = 7;
  ctx.strokeRect(16, 16, 480, 480);

  const tex = new THREE.CanvasTexture(canvas);
  const logo = new Image();
  logo.onload = () => {
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

  const note = CUBER_QUOTES[seed % CUBER_QUOTES.length];
  drawQuoteNote(ctx, tex, 256, 408, rnd(8) > 0.5 ? -4 : 5, "#fff39a", note);
  return tex;
}

/* ---------- the box mesh -------------------------------------------- */
// Exposed via a ref object because the mesh is built lazily (and the
// pointer/drag code in input.js needs a live handle to it).
export const cartonRef = { mesh: null };
export const getCartonMesh = () => cartonRef.mesh;

export function build3DPlaneCarton() {
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
  const openMat = new THREE.MeshBasicMaterial({ visible: false });

  const materials = [face(1), face(2), face(3), openMat, face(4), face(5)];
  const geo = new RoundedBoxGeometry(4.5, 4.5, 4.5, 4, 0.1);
  const cartonMesh = new THREE.Mesh(geo, materials);
  cartonMesh.castShadow = true;
  cartonMesh.visible = false;
  cubeGroup.add(cartonMesh);
  cartonRef.mesh = cartonMesh;
}

/* ---------- cover / uncover / hide animation ------------------------ */
const CARTON_TOP = new THREE.Vector3(0, 7, 0);
const CARTON_ENCLOSE = new THREE.Vector3(0, 0, 0);
const CARTON_BEHIND = new THREE.Vector3(0, 0.4, -5.6);
let cartonTweenId = null;

function cartonSetOpacity(v) {
  const cartonMesh = cartonRef.mesh;
  if (!cartonMesh) return;
  const mats = Array.isArray(cartonMesh.material)
    ? cartonMesh.material
    : [cartonMesh.material];
  mats.forEach((m) => {
    if (!m.map) return;
    m.opacity = v;
    m.visible = v > 0.02;
  });
  cartonMesh.visible = v > 0.02;
}

function cartonAnimate(mode) {
  const cartonMesh = cartonRef.mesh;
  if (!cartonMesh) return;
  if (cartonTweenId) cancelAnimationFrame(cartonTweenId);

  const mapped = Array.isArray(cartonMesh.material)
    ? cartonMesh.material.find((m) => m.map)
    : cartonMesh.material;
  const oFrom = mapped ? mapped.opacity : 0;
  const sFrom = cartonMesh.scale.x;

  let from, to, arc, sTo, oTo, dur, hideAtEnd;
  if (mode === "cover") {
    cubeGroup.add(cartonMesh);
    cartonMesh.quaternion.identity();
    cartonMesh.visible = true;
    cartonMesh.position.copy(CARTON_TOP);
    from = CARTON_TOP.clone();
    to = CARTON_ENCLOSE.clone();
    arc = 0;
    sTo = 1.0;
    oTo = 1;
    dur = 500;
    hideAtEnd = false;
  } else if (mode === "uncover") {
    scene.attach(cartonMesh);
    cartonMesh.visible = true;
    from = cartonMesh.position.clone();
    to = CARTON_BEHIND.clone();
    arc = 3.6;
    sTo = 0.66;
    oTo = 0.95;
    dur = 720;
    hideAtEnd = false;
  } else {
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

/* ---------- on/off helpers the game flow toggles -------------------- */
export const cartonOn = () => carton && carton.classList.contains("on");

export function cartonCover() {
  if (carton) carton.classList.add("on");
  cartonAnimate("cover");
}
export function cartonUncover() {
  if (carton) carton.classList.remove("on");
  cartonAnimate("uncover");
}
export function cartonHide() {
  if (carton) carton.classList.remove("on");
  cartonAnimate("hide");
}

// True while the box is a free, draggable object floating in the scene.
export const boxDraggable = () =>
  cartonRef.mesh &&
  cartonRef.mesh.visible &&
  cartonRef.mesh.parent === scene;
