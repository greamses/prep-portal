import * as THREE from "three";

export function createSkyTexture() {
  const c = document.createElement("canvas");
  c.width = 16; c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, "#2c7bb6"); // Deep sky blue
  g.addColorStop(0.6, "#82c5eb"); // Soft horizon blue
  g.addColorStop(1.0, "#e0f2f9"); // Hazy horizon
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createAsphaltTexture() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#2d343e";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const shade = Math.random() < 0.5 ? 20 : 70;
    ctx.fillStyle = `rgba(${shade}, ${shade + 4}, ${shade + 10}, ${Math.random() * 0.15})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createGrassTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#4a7c36";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 20000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(55, 100, 40, 0.4)" : "rgba(80, 140, 60, 0.4)";
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 8 + Math.random() * 10);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBrickTexture(color1, color2) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#b0aba2"; // mortar
  ctx.fillRect(0, 0, 512, 512);
  
  const rows = 24, cols = 12;
  const w = 512 / cols, h = 512 / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = -1; col < cols + 1; col++) {
      let x = col * w + (r % 2 ? w / 2 : 0);
      let y = r * h;
      let ratio = Math.random();
      
      // Interpolate colors
      let rC = Math.round(color1[0] + (color2[0] - color1[0]) * ratio);
      let gC = Math.round(color1[1] + (color2[1] - color1[1]) * ratio);
      let bC = Math.round(color1[2] + (color2[2] - color1[2]) * ratio);
      
      ctx.fillStyle = `rgb(${rC}, ${gC}, ${bC})`;
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      
      // Add dirt/noise to bricks
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(x + 2, y + 2, (w - 4) * Math.random(), (h - 4) * Math.random());
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRoofTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#2c2f33";
  ctx.fillRect(0, 0, 512, 512);
  
  const rows = 16, cols = 16;
  const w = 512 / cols, h = 512 / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = -1; col < cols; col++) {
      let x = col * w + (r % 2 ? w / 2 : 0);
      let y = r * h;
      
      ctx.fillStyle = `hsl(215, 10%, ${20 + Math.random() * 10}%)`;
      ctx.fillRect(x + 1, y, w - 2, h + 2);
      
      // Shingle shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(x + 1, y + h - 2, w - 2, 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWoodTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#5c3a21";
  ctx.fillRect(0, 0, 256, 512);
  
  ctx.fillStyle = "rgba(40, 20, 10, 0.4)";
  for (let i = 0; i < 200; i++) {
    ctx.fillRect(Math.random() * 256, 0, 1 + Math.random() * 3, 512);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createChainLinkTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  // Thicker, more metallic-looking wires
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 2;
  ctx.strokeStyle = "rgba(200, 210, 220, 0.9)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  const step = 32;
  for (let x = -size; x <= size * 2; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + size, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, size); ctx.lineTo(x + size, 0);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 4);
  tex.anisotropy = 16;
  return tex;
}