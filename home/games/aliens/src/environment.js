// environment.js — professional game environment system
// Architecture: modular, event-driven, pool-based, LOD-aware
import * as THREE from "three";
import { isMobile, COLORS } from "./config.js";

// ─── Asset Cache (prevents texture regeneration) ───
const AssetCache = new Map();

function getCached(key, factory) {
  if (!AssetCache.has(key)) AssetCache.set(key, factory());
  return AssetCache.get(key);
}

// ─── Object Pool for particles ───
class ParticlePool {
  constructor(scene, maxCount = 500) {
    this.scene = scene;
    this.maxCount = maxCount;
    this.active = [];
    this.inactive = [];

    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < maxCount; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.visible = false;
      scene.add(mesh);
      this.inactive.push({ mesh, life: 0, velocity: new THREE.Vector3() });
    }
  }

  spawn(position, velocity, color, size, life) {
    if (this.inactive.length === 0) return null;
    const p = this.inactive.pop();
    p.mesh.position.copy(position);
    p.mesh.scale.setScalar(size);
    p.mesh.material.color.set(color);
    p.mesh.material.opacity = 1;
    p.mesh.visible = true;
    p.mesh.lookAt(camera.position); // billboard
    p.velocity.copy(velocity);
    p.life = life;
    p.maxLife = life;
    this.active.push(p);
    return p;
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        this.inactive.push(p);
        this.active.splice(i, 1);
        continue;
      }
      const t = p.life / p.maxLife;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.material.opacity = t;
      p.mesh.scale.setScalar(p.mesh.scale.x * (1 - dt * 0.5));
      p.mesh.lookAt(camera.position);
    }
  }

  dispose() {
    [...this.active, ...this.inactive].forEach((p) => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    });
  }
}

// ─── LOD Terrain Manager ───
class TerrainLOD {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.config = {
      size: 120,
      segments: 256,
      displacementScale: 3.8,
      ...config,
    };
    this.chunks = new Map();
    this.camera = null;
    this.chunkSize = this.config.size / 4;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  generateHeightmap(size = 512) {
    return getCached("heightmap", () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const nx = x / size - 0.5;
          const ny = y / size - 0.5;
          const dist = Math.sqrt(nx * nx + ny * ny) * 2;

          let h = 0;
          h += Math.sin(x * 0.02) * Math.cos(y * 0.03) * 0.5;
          h += Math.sin(x * 0.05 + 2) * Math.cos(y * 0.06) * 0.3;
          h += Math.sin(x * 0.1) * Math.cos(y * 0.11) * 0.15;
          h += Math.sin(x * 0.2 + 1) * Math.cos(y * 0.22) * 0.08;

          const centerFlat = dist < 0.12 ? 0.0 : (dist - 0.12) * 1.2;
          h *= Math.min(1, centerFlat);
          h = Math.max(0, Math.min(1, h * 0.5 + 0.5));

          const val = Math.floor(h * 255);
          const idx = (y * size + x) * 4;
          data[idx] = data[idx + 1] = data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.LinearSRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  buildTerrain() {
    const heightTex = this.generateHeightmap();
    const groundTex = this.generateGroundTexture();

    const geo = new THREE.PlaneGeometry(
      this.config.size,
      this.config.size,
      this.config.segments,
      this.config.segments,
    );
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      map: groundTex,
      displacementMap: heightTex,
      displacementScale: this.config.displacementScale,
      displacementBias: -0.5,
      roughness: 0.9,
      metalness: 0.08,
      color: 0x7a6a90,
    });

    const terrain = new THREE.Mesh(geo, mat);
    terrain.position.y = -1.2;
    terrain.receiveShadow = true;
    terrain.name = "terrain";
    this.scene.add(terrain);

    return terrain;
  }

  generateGroundTexture() {
    return getCached("ground", () => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 1024;
      const g = c.getContext("2d");
      g.fillStyle = "#1e1828";
      g.fillRect(0, 0, 1024, 1024);

      for (let i = 0; i < 12000; i++) {
        const x = Math.random() * 1024,
          y = Math.random() * 1024;
        const r = 0.3 + Math.random() * 2.2;
        g.fillStyle =
          Math.random() > 0.55
            ? `rgba(90,70,120,${0.05 + Math.random() * 0.15})`
            : `rgba(15,10,25,${0.1 + Math.random() * 0.3})`;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }

      for (let i = 0; i < 200; i++) {
        const x = Math.random() * 1024,
          y = Math.random() * 1024;
        const r = 8 + Math.random() * 35;
        const rg = g.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, "rgba(50,35,70,0.3)");
        rg.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = rg;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 8);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = isMobile ? 4 : 16;
      return tex;
    });
  }

  dispose() {
    this.scene.traverse((child) => {
      if (child.name === "terrain") {
        child.geometry.dispose();
        child.material.dispose();
        this.scene.remove(child);
      }
    });
  }
}

// ─── Starfield System (instanced, GPU-driven) ───
class StarfieldSystem {
  constructor(scene, count = 1800) {
    this.scene = scene;
    this.count = isMobile ? 800 : count;
    this.mesh = this.build();
  }

  build() {
    const positions = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);
    const colors = new Float32Array(this.count * 3);
    const phases = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      const r = 120 + Math.random() * 140;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.65;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = 8 + Math.abs(r * Math.cos(phi)) * 0.75;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      sizes[i] = 0.3 + Math.random() * 2.2;
      phases[i] = Math.random() * Math.PI * 2;

      const warm = Math.random() > 0.7;
      const tint = 0.65 + Math.random() * 0.35;
      colors[i * 3] = warm ? tint : tint * 0.8;
      colors[i * 3 + 1] = tint * 0.9;
      colors[i * 3 + 2] = warm ? tint * 0.7 : tint;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("phase", new THREE.BufferAttribute(phases, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: /* glsl */ `
        attribute float size;
        attribute vec3 color;
        attribute float phase;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
          vColor = color;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        uniform float uTime;

        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float alpha = 1.0 - smoothstep(0.0, 1.0, d);
          alpha *= 0.8 + 0.2 * sin(uTime * 2.5 + vColor.r * 6.28);
          if (alpha < 0.02) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });

    const stars = new THREE.Points(geo, mat);
    stars.name = "starfield";
    this.scene.add(stars);
    return stars;
  }

  update(deltaTime) {
    this.mesh.material.uniforms.uTime.value += deltaTime;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.scene.remove(this.mesh);
  }
}

// ─── Celestial Body Manager ───
class CelestialManager {
  constructor(scene) {
    this.scene = scene;
    this.bodies = [];
  }

  addMoon(config = {}) {
    const {
      position = [60, 44, -130],
      radius = 7,
      color = 0x9aa0b2,
      emissive = 0x2a3850,
    } = config;

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 48, 48),
      new THREE.MeshStandardMaterial({
        map: this.generateMoonTexture(),
        roughness: 1,
        metalness: 0,
        emissive,
        emissiveIntensity: 0.3,
        fog: false,
      }),
    );
    moon.position.set(...position);
    moon.name = "moon";
    this.scene.add(moon);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.2, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x9ab4ff,
        transparent: true,
        opacity: 0.09,
        side: THREE.BackSide,
        fog: false,
      }),
    );
    glow.position.copy(moon.position);
    glow.name = "moonGlow";
    this.scene.add(glow);

    this.bodies.push({ mesh: moon, glow, type: "moon" });
    return moon;
  }

  addPlanet(config = {}) {
    const {
      position = [-70, 35, -170],
      radius = 28,
      ringInner = 32,
      ringOuter = 38,
    } = config;

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 64, 64),
      new THREE.MeshStandardMaterial({
        map: this.generatePlanetTexture(),
        roughness: 0.85,
        metalness: 0.05,
        fog: false,
      }),
    );
    planet.position.set(...position);
    planet.name = "planet";
    this.scene.add(planet);

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.05, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x3355aa,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
        fog: false,
      }),
    );
    atmo.position.copy(planet.position);
    atmo.name = "atmosphere";
    this.scene.add(atmo);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(ringInner, ringOuter, 96),
      new THREE.MeshBasicMaterial({
        color: 0x4466aa,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
        fog: false,
      }),
    );
    ring.position.copy(planet.position);
    ring.rotation.x = Math.PI / 3.2;
    ring.rotation.y = 0.3;
    ring.name = "ring";
    this.scene.add(ring);

    this.bodies.push({ mesh: planet, atmo, ring, type: "planet" });
    return planet;
  }

  addAurora(config = {}) {
    const { position = [-10, 58, -125], width = 200, height = 44 } = config;

    const aurora = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        map: this.generateAuroraTexture(),
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
    );
    aurora.position.set(...position);
    aurora.rotation.x = 0.18;
    aurora.name = "aurora";
    this.scene.add(aurora);

    this.bodies.push({ mesh: aurora, type: "aurora" });
    return aurora;
  }

  addMonoliths(count = 12) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x241f33,
      roughness: 0.95,
      metalness: 0.05,
    });

    const group = new THREE.Group();
    group.name = "monoliths";

    for (let i = 0; i < count; i++) {
      const a = -Math.PI + Math.random() * Math.PI;
      const r = 44 + Math.random() * 28;
      const h = 8 + Math.random() * 18;
      const mono = new THREE.Mesh(
        new THREE.ConeGeometry(1.4 + Math.random() * 2, h, 5),
        mat,
      );
      mono.position.set(Math.cos(a) * r, h / 2 - 2.2, Math.sin(a) * r - 22);
      mono.rotation.y = Math.random() * Math.PI;
      mono.castShadow = false;
      group.add(mono);
    }

    this.scene.add(group);
    this.bodies.push({ mesh: group, type: "monoliths" });
    return group;
  }

  generateMoonTexture() {
    return getCached("moon", () => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const g = c.getContext("2d");
      g.fillStyle = "#9aa0b2";
      g.fillRect(0, 0, 256, 256);

      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 256,
          y = Math.random() * 256;
        const r = 1 + Math.random() * 9;
        g.fillStyle = `rgba(${70 + Math.random() * 40},${75 + Math.random() * 40},${95 + Math.random() * 40},${0.2 + Math.random() * 0.3})`;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
  }

  generatePlanetTexture() {
    return getCached("planet", () => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 512;
      const g = c.getContext("2d");
      g.fillStyle = "#3a2850";
      g.fillRect(0, 0, 1024, 512);

      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * 1024,
          y = Math.random() * 512;
        const r = 1 + Math.random() * 12;
        g.fillStyle =
          Math.random() > 0.4
            ? `hsla(${260 + Math.random() * 40},30%,${25 + Math.random() * 25}%,0.15)`
            : `hsla(30,20%,${10 + Math.random() * 15}%,0.1)`;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }

      for (let i = 0; i < 60; i++) {
        const x = Math.random() * 1024,
          y = Math.random() * 512;
        const r = 8 + Math.random() * 30;
        g.fillStyle = "rgba(20,10,30,0.5)";
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "rgba(180,160,200,0.25)";
        g.lineWidth = 2;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
      }

      const capGradTop = g.createLinearGradient(0, 0, 0, 80);
      capGradTop.addColorStop(0, "rgba(180,200,255,0.7)");
      capGradTop.addColorStop(1, "rgba(180,200,255,0)");
      g.fillStyle = capGradTop;
      g.fillRect(0, 0, 1024, 80);

      const capGradBottom = g.createLinearGradient(0, 432, 0, 512);
      capGradBottom.addColorStop(0, "rgba(180,200,255,0)");
      capGradBottom.addColorStop(1, "rgba(180,200,255,0.7)");
      g.fillStyle = capGradBottom;
      g.fillRect(0, 432, 1024, 80);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
  }

  generateAuroraTexture() {
    return getCached("aurora", () => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 128;
      const g = c.getContext("2d");
      g.clearRect(0, 0, 512, 128);

      for (let i = 0; i < 60; i++) {
        const x = Math.random() * 512;
        const w = 6 + Math.random() * 26;
        const grad = g.createLinearGradient(0, 0, 0, 128);
        const hue = 140 + Math.random() * 80;
        grad.addColorStop(0, `hsla(${hue},90%,60%,0)`);
        grad.addColorStop(
          0.5,
          `hsla(${hue},90%,62%,${0.18 + Math.random() * 0.25})`,
        );
        grad.addColorStop(1, `hsla(${hue},90%,60%,0)`);
        g.fillStyle = grad;
        g.fillRect(x, 0, w, 128);
      }

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
  }

  update(deltaTime) {
    // Subtle rotation for planets
    this.bodies.forEach((body) => {
      if (body.type === "planet" && body.mesh) {
        body.mesh.rotation.y += deltaTime * 0.02;
        if (body.ring) body.ring.rotation.z += deltaTime * 0.01;
      }
      if (body.type === "aurora" && body.mesh) {
        body.mesh.material.opacity = 0.3 + Math.sin(Date.now() * 0.001) * 0.1;
      }
    });
  }

  dispose() {
    this.bodies.forEach((body) => {
      if (body.mesh) this.scene.remove(body.mesh);
      if (body.glow) this.scene.remove(body.glow);
      if (body.atmo) this.scene.remove(body.atmo);
      if (body.ring) this.scene.remove(body.ring);
    });
    this.bodies = [];
  }
}

// ─── Lighting System ───
class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.lights = new Map();
    this.setup();
  }

  setup() {
    // Hemisphere (sky/ground ambient)
    const hemi = new THREE.HemisphereLight(0x5577bb, 0x110822, 0.6);
    hemi.name = "hemi";
    this.scene.add(hemi);
    this.lights.set("hemi", hemi);

    // Ambient fill
    const ambient = new THREE.AmbientLight(0x222244, 0.45);
    ambient.name = "ambient";
    this.scene.add(ambient);
    this.lights.set("ambient", ambient);

    // Key light (sun/moon)
    const key = new THREE.DirectionalLight(0xfff5e0, 1.3);
    key.position.set(18, 28, 14);
    key.name = "key";

    if (!isMobile) {
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.camera.near = 1;
      key.shadow.camera.far = 100;
      key.shadow.camera.left = -30;
      key.shadow.camera.right = 30;
      key.shadow.camera.top = 30;
      key.shadow.camera.bottom = -15;
      key.shadow.bias = -0.0004;
      key.shadow.normalBias = 0.02;
    }

    this.scene.add(key);
    this.lights.set("key", key);

    // Rim light (cool fill from opposite side)
    const rim = new THREE.DirectionalLight(0x4060ff, 0.65);
    rim.position.set(-18, 6, -14);
    rim.name = "rim";
    this.scene.add(rim);
    this.lights.set("rim", rim);
  }

  setIntensity(name, intensity) {
    const light = this.lights.get(name);
    if (light) light.intensity = intensity;
  }

  setColor(name, color) {
    const light = this.lights.get(name);
    if (light) light.color.set(color);
  }

  dispose() {
    this.lights.forEach((light) => this.scene.remove(light));
    this.lights.clear();
  }
}

// ─── Landing Pad System ───
class LandingPad {
  constructor(scene) {
    this.scene = scene;
    this.build();
  }

  build() {
    // Main pad
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.8, 0.25, 48),
      new THREE.MeshStandardMaterial({
        color: 0x2a2e38,
        roughness: 0.55,
        metalness: 0.6,
      }),
    );
    pad.position.y = 0.15;
    pad.castShadow = true;
    pad.receiveShadow = true;
    pad.name = "landingPad";
    this.scene.add(pad);

    // Glow ring
    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.7, 0.08, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x39e0ff }),
    );
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.28;
    glowRing.name = "padGlow";
    this.scene.add(glowRing);

    // Animated pulse light
    this.pulseLight = new THREE.PointLight(0x39e0ff, 0.5, 8, 2);
    this.pulseLight.position.set(0, 0.5, 0);
    this.scene.add(this.pulseLight);

    this.pad = pad;
    this.glowRing = glowRing;
  }

  update(deltaTime, elapsedTime) {
    const pulse = 0.5 + Math.sin(elapsedTime * 2) * 0.3;
    this.pulseLight.intensity = pulse;
    this.glowRing.material.opacity = 0.6 + pulse * 0.4;
  }

  dispose() {
    this.scene.remove(this.pad);
    this.scene.remove(this.glowRing);
    this.scene.remove(this.pulseLight);
    this.pad.geometry.dispose();
    this.pad.material.dispose();
    this.glowRing.geometry.dispose();
    this.glowRing.material.dispose();
  }
}

// ─── Rock Scatter System (instanced) ───
class RockScatter {
  constructor(scene, count = 180) {
    this.scene = scene;
    this.count = isMobile ? 60 : count;
    this.mesh = this.build();
  }

  build() {
    const geo = new THREE.IcosahedronGeometry(0.3, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x554466,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });

    const mesh = new THREE.InstancedMesh(geo, mat, this.count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "rocks";

    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 45;
      dummy.position.set(
        Math.cos(angle) * radius,
        -0.2 + Math.random() * 0.6,
        Math.sin(angle) * radius,
      );
      dummy.scale.setScalar(0.6 + Math.random() * 1.4);
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(mesh);
    return mesh;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.scene.remove(this.mesh);
  }
}

// ─── Background System (sky + gradient) ───
class BackgroundSystem {
  constructor(scene) {
    this.scene = scene;
    this.build();
  }

  build() {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 512;
    const g = c.getContext("2d");

    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, "#01020a");
    grad.addColorStop(0.3, "#0a1228");
    grad.addColorStop(0.55, "#111d40");
    grad.addColorStop(0.8, "#1e1a38");
    grad.addColorStop(1.0, "#2a2038");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 512);

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 64,
        y = 40 + Math.random() * 400;
      const rad = 30 + Math.random() * 80;
      const rg = g.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, `hsla(${220 + Math.random() * 80},70%,55%,0.08)`);
      rg.addColorStop(1, "hsla(0,0%,0%,0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, 64, 512);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.scene.background = tex;
  }

  dispose() {
    if (this.scene.background) {
      this.scene.background.dispose();
      this.scene.background = null;
    }
  }
}

// ═══════════════════════════════════════════════════════
// MAIN ENVIRONMENT BUILDER
// ═══════════════════════════════════════════════════════

export class Environment {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.config = config;
    this.systems = new Map();
    this.elapsedTime = 0;
    this.isActive = true;

    // Initialize fog
    scene.fog = new THREE.FogExp2(COLORS.spaceBg, 0.0055);

    // Build all subsystems
    this.build();
  }

  build() {
    // Background (sky gradient)
    this.systems.set("background", new BackgroundSystem(this.scene));

    // Lighting
    this.systems.set("lighting", new LightingSystem(this.scene));

    // Terrain
    const terrainLOD = new TerrainLOD(this.scene);
    const terrain = terrainLOD.buildTerrain();
    this.systems.set("terrain", terrainLOD);

    // Starfield
    const stars = new StarfieldSystem(this.scene);
    this.systems.set("starfield", stars);

    // Celestials
    const celestials = new CelestialManager(this.scene);
    celestials.addMoon();
    celestials.addPlanet();
    celestials.addAurora();
    celestials.addMonoliths(12);
    this.systems.set("celestials", celestials);

    // Landing pad
    this.systems.set("pad", new LandingPad(this.scene));

    // Rocks
    this.systems.set("rocks", new RockScatter(this.scene));

    // Particle pool (for future effects)
    this.systems.set("particles", new ParticlePool(this.scene));
  }

  // ─── Update loop (call every frame) ───
  update(deltaTime) {
    if (!this.isActive) return;
    this.elapsedTime += deltaTime;

    this.systems.get("starfield")?.update(deltaTime);
    this.systems.get("celestials")?.update(deltaTime);
    this.systems.get("pad")?.update(deltaTime, this.elapsedTime);
    this.systems.get("particles")?.update(deltaTime);
  }

  // ─── Event: Ship landed ───
  onShipLanded() {
    const lighting = this.systems.get("lighting");
    lighting?.setIntensity("key", 2.0);
    lighting?.setColor("key", 0x66ffcc);

    const pad = this.systems.get("pad");
    if (pad) {
      pad.glowRing.material.color.set(0x66ffcc);
      pad.pulseLight.color.set(0x66ffcc);
    }
  }

  // ─── Event: Ship took off ───
  onShipDeparted() {
    const lighting = this.systems.get("lighting");
    lighting?.setIntensity("key", 1.3);
    lighting?.setColor("key", 0xfff5e0);

    const pad = this.systems.get("pad");
    if (pad) {
      pad.glowRing.material.color.set(0x39e0ff);
      pad.pulseLight.color.set(0x39e0ff);
    }
  }

  // ─── Getters for external systems ───
  getTerrain() {
    return this.systems.get("terrain");
  }

  getStarfield() {
    return this.systems.get("starfield");
  }

  getParticlePool() {
    return this.systems.get("particles");
  }

  // ─── Cleanup ───
  dispose() {
    this.isActive = false;
    this.systems.forEach((system) => {
      if (system && typeof system.dispose === "function") {
        system.dispose();
      }
    });
    this.systems.clear();

    if (this.scene.fog) {
      this.scene.fog = null;
    }

    // Clear asset cache
    AssetCache.clear();
  }
}

// ─── Legacy API (backward compatible) ───
export function buildEnvironment(scene) {
  const env = new Environment(scene);
  return {
    starField: env.getStarfield().mesh,
    terrain: env.getTerrain(),
    update: (dt) => env.update(dt),
    dispose: () => env.dispose(),
    // Expose event methods
    onShipLanded: () => env.onShipLanded(),
    onShipDeparted: () => env.onShipDeparted(),
  };
}

export function updateEnvironment(env, deltaTime) {
  env.update(deltaTime);
}
