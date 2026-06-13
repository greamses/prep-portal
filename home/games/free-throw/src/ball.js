/**
 * Realistic basketball mesh + visual.
 */
import * as THREE from "three";

export function createBall(radius = 0.121) {
  const mat = new THREE.MeshStandardMaterial({
    map: makeBallTexture(),
    bumpMap: makeBumpTexture(),
    bumpScale: 0.002,
    roughness: 0.72,
    roughnessMap: makeRoughnessTexture(),
    metalness: 0.02,
    color: new THREE.Color(1, 1, 1),
  });
  
  // Higher segment count for a perfectly smooth sphere
  const geo = new THREE.SphereGeometry(radius, 64, 64);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeBallTexture() {
  const W = 2048, H = 1024; // double resolution
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  // ---- Base colour: rich basketball orange with subtle tonal variation ----
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0.0, "#e56e1a");  // slightly lighter on top
  grad.addColorStop(0.3, "#da5a1a");
  grad.addColorStop(0.5, "#cc4f12");  // richest orange at equator
  grad.addColorStop(0.7, "#da5a1a");
  grad.addColorStop(1.0, "#c24810");  // darker at bottom
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ---- Leather grain / pebble texture ----
  // Dark micro-dimples
  for (let i = 0; i < 35000; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 0.8 + Math.random() * 2.2;
    const alpha = 0.04 + Math.random() * 0.14;

    // Dark speck
    ctx.fillStyle = `rgba(20, 8, 2, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Highlight on some pebbles
    if (Math.random() < 0.35) {
      ctx.fillStyle = `rgba(255, 190, 130, ${Math.random() * 0.07})`;
      ctx.beginPath();
      ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Black rubber seam channels ----
  ctx.strokeStyle = "#0d0500";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Horizontal equator line
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();

  // Two vertical full-circumference lines (wrapping through poles)
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(W * 0.25, 0);
  ctx.lineTo(W * 0.25, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W * 0.75, 0);
  ctx.lineTo(W * 0.75, H);
  ctx.stroke();

  // ---- Arced seams (the classic "C" channels) ----
  ctx.lineWidth = 11;

  // Left arcs
  ctx.beginPath();
  ctx.moveTo(0, H * 0.2);
  ctx.bezierCurveTo(W * 0.25, H * 0.2, W * 0.25, H * 0.8, 0, H * 0.8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, H * 0.1);
  ctx.bezierCurveTo(W * 0.12, H * 0.1, W * 0.12, H * 0.9, 0, H * 0.9);
  ctx.quadraticCurveTo(W * 0.06, H * 0.65, 0, H * 0.5);
  ctx.stroke();

  // Right arcs (mirror)
  ctx.beginPath();
  ctx.moveTo(W, H * 0.2);
  ctx.bezierCurveTo(W * 0.75, H * 0.2, W * 0.75, H * 0.8, W, H * 0.8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(W, H * 0.1);
  ctx.bezierCurveTo(W * 0.88, H * 0.1, W * 0.88, H * 0.9, W, H * 0.9);
  ctx.quadraticCurveTo(W * 0.94, H * 0.65, W, H * 0.5);
  ctx.stroke();

  // ---- Subtle seam shading for depth ----
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();
  ctx.restore();

  // ---- Slight dirty/used marks ----
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 3 + Math.random() * 12;
    const a = Math.random() * 0.05;
    ctx.fillStyle = `rgba(30, 15, 5, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapU = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeBumpTexture() {
  const W = 1024, H = 512;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  // Base mid-grey (flat)
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, W, H);

  // Pebble grain — tiny specks brighter/darker than mid-grey
  for (let i = 0; i < 25000; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 0.7 + Math.random() * 2.2;
    // 0 = black (recessed), 255 = white (raised)
    const grey = 90 + Math.random() * 110;
    ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Seam channels painted black (recessed)
  ctx.fillStyle = "#000000";

  // Equator
  ctx.fillRect(0, H / 2 - 7, W, 14);

  // Vertical seams
  ctx.fillRect(W * 0.25 - 7, 0, 14, H);
  ctx.fillRect(W * 0.75 - 7, 0, 14, H);

  // Arced channels (thick strokes in black)
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 13;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(0, H * 0.2);
  ctx.bezierCurveTo(W * 0.25, H * 0.2, W * 0.25, H * 0.8, 0, H * 0.8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(W, H * 0.2);
  ctx.bezierCurveTo(W * 0.75, H * 0.2, W * 0.75, H * 0.8, W, H * 0.8);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.LinearSRGBColorSpace; // bump maps should be linear
  return tex;
}

function makeRoughnessTexture() {
  const W = 512, H = 256;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  // Base roughness around 0.7 (so grey ~179)
  ctx.fillStyle = "#b3b3b3";
  ctx.fillRect(0, 0, W, H);

  // Variation in roughness
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 1 + Math.random() * 3;
    const grey = 140 + Math.random() * 90;
    ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Seam rubber is shinier → lower roughness → darker
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, H / 2 - 6, W, 12);
  ctx.fillRect(W * 0.25 - 6, 0, 12, H);
  ctx.fillRect(W * 0.75 - 6, 0, 12, H);

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 11;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(0, H * 0.2);
  ctx.bezierCurveTo(W * 0.25, H * 0.2, W * 0.25, H * 0.8, 0, H * 0.8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(W, H * 0.2);
  ctx.bezierCurveTo(W * 0.75, H * 0.2, W * 0.75, H * 0.8, W, H * 0.8);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  return tex;
}