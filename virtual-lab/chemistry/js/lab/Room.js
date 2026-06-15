import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

RectAreaLightUniformsLib.init();

// Room constants (meters)
export const ROOM = { w: 12, d: 10, h: 3 };

const _mat = (color, roughness = 0.82, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.6 });

// A seamless 2×2 ceramic-tile texture (two alternating shades with grout lines),
// so the floor reads as a real tiled lab floor rather than a flat slab.
function makeTileTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#b6b3aa';                 // grout
  x.fillRect(0, 0, 256, 256);
  const shades = ['#e9e7df', '#dde1e2'];   // two tile colours → checker
  const g = 7;                             // grout width (px)
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      x.fillStyle = shades[(i + j) % 2];
      x.fillRect(i * 128 + g / 2, j * 128 + g / 2, 128 - g, 128 - g);
      // subtle sheen streak per tile
      x.fillStyle = 'rgba(255,255,255,0.05)';
      x.fillRect(i * 128 + g / 2, j * 128 + g / 2, 128 - g, 12);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function box(scene, w, h, d, mat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.receiveShadow = shadow;
  scene.add(m);
  return m;
}

function collider(list, cx, cy, cz, w, h, d) {
  list.push(new THREE.Box3(
    new THREE.Vector3(cx - w / 2, cy,         cz - d / 2),
    new THREE.Vector3(cx + w / 2, cy + h, cz + d / 2)
  ));
}

export class Room {
  constructor(scene, opts = {}) {
    this.scene     = scene;
    this.colliders = [];
    // Optional opening cut into a wall so an adjoining room connects through it.
    // e.g. { wall:'right', z: 3, w: 1.2, h: 2.1 }
    this.doorway   = opts.doorway || null;
    // When true, the right wall is built elsewhere (a shared Boundary) so it can
    // render from both rooms — see Boundary.js.
    this.omitRight = opts.omitRight || false;
    this._build();
  }

  _build() {
    this._floor();
    this._ceiling();
    this._wallFront();
    this._wallBack();
    if (!this.omitRight) this._wallRight();
    this._wallLeftWithWindows();
    this._blackboard();
    this._ceilingLights();
    this._lighting();
  }

  // ── Floor ──────────────────────────────────────────────────────────────────
  _floor() {
    const s = ROOM;
    // Ceramic-tiled floor (light, matte so it doesn't glare under the lights)
    const tex = makeTileTexture();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(s.w / 1.2, s.d / 1.2);   // ~0.6 m per tile (canvas holds 2×2)
    tex.anisotropy = 8;
    const floorMat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.6, metalness: 0.0, envMapIntensity: 0.25,
    });
    box(this.scene, s.w, 0.12, s.d, floorMat, 0, -0.06, 0);
    // Skirting boards (cream strip around perimeter)
    const bMat = _mat(0xedeae0, 0.75);
    const bh = 0.10, bt = 0.05;
    box(this.scene, s.w, bh, bt, bMat, 0,        bh / 2, -s.d / 2 + bt / 2);
    box(this.scene, s.w, bh, bt, bMat, 0,        bh / 2,  s.d / 2 - bt / 2);
    box(this.scene, bt,  bh, s.d, bMat, -s.w / 2 + bt / 2, bh / 2, 0);
    box(this.scene, bt,  bh, s.d, bMat,  s.w / 2 - bt / 2, bh / 2, 0);
  }

  // ── Ceiling ─────────────────────────────────────────────────────────────────
  _ceiling() {
    // Acoustic tile ceiling (white)
    box(this.scene, ROOM.w, 0.1, ROOM.d, _mat(0xf4f2ee, 0.92), 0, ROOM.h + 0.05, 0);
    // Grid lines (shallow channels every 0.6m) — done via thin dark strips
    const gMat = _mat(0xd0cec8, 0.9);
    for (let z = -4.8; z <= 4.8; z += 0.6) {
      box(this.scene, ROOM.w, 0.005, 0.015, gMat, 0, ROOM.h, z);
    }
    for (let x = -5.7; x <= 5.7; x += 0.6) {
      box(this.scene, 0.015, 0.005, ROOM.d, gMat, x, ROOM.h, 0);
    }
  }

  // ── Walls ──────────────────────────────────────────────────────────────────
  _wallFront() {
    // Front wall: blackboard end
    const t = 0.14, h = ROOM.h, w = ROOM.w, z = -ROOM.d / 2 - t / 2;
    box(this.scene, w, h, t, _mat(0xe4dfd3, 0.84), 0, h / 2, z);
    collider(this.colliders, 0, 0, -ROOM.d / 2, w, h, t + 0.3);
  }

  _wallBack() {
    // Back wall: cabinet wall
    const t = 0.14, h = ROOM.h, w = ROOM.w, z = ROOM.d / 2 + t / 2;
    box(this.scene, w, h, t, _mat(0xe4dfd3, 0.84), 0, h / 2, z);
    collider(this.colliders, 0, 0, ROOM.d / 2, w, h, t + 0.3);
  }

  _wallRight() {
    // Right wall: fume hood side (and, optionally, the doorway to the next room)
    const t = 0.14, h = ROOM.h, d = ROOM.d, x = ROOM.w / 2 + t / 2;
    const mat = _mat(0xe4dfd3, 0.84);
    const dw = (this.doorway && this.doorway.wall === 'right') ? this.doorway : null;

    if (!dw) {
      box(this.scene, t, h, d, mat, x, h / 2, 0);
      collider(this.colliders, ROOM.w / 2, 0, 0, t + 0.3, h, d);
      return;
    }

    // Split the wall into the segments either side of the opening, plus a lintel
    // above it, and leave a real gap (no collider) so the player can walk through.
    const gz0 = dw.z - dw.w / 2, gz1 = dw.z + dw.w / 2;

    const frontLen = gz0 - (-d / 2);
    if (frontLen > 0.01) {
      const cz = (-d / 2 + gz0) / 2;
      box(this.scene, t, h, frontLen, mat, x, h / 2, cz);
      collider(this.colliders, ROOM.w / 2, 0, cz, t + 0.3, h, frontLen);
    }
    const backLen = (d / 2) - gz1;
    if (backLen > 0.01) {
      const cz = (gz1 + d / 2) / 2;
      box(this.scene, t, h, backLen, mat, x, h / 2, cz);
      collider(this.colliders, ROOM.w / 2, 0, cz, t + 0.3, h, backLen);
    }
    const lintelH = h - dw.h;
    if (lintelH > 0.01) {
      box(this.scene, t, lintelH, dw.w, mat, x, dw.h + lintelH / 2, dw.z);
    }

    // Door frame (jambs + head) for a finished opening
    const jMat = _mat(0xcfc8ba, 0.7), fw = 0.06;
    box(this.scene, t + 0.05, dw.h, fw, jMat, x, dw.h / 2, gz0 - fw / 2);
    box(this.scene, t + 0.05, dw.h, fw, jMat, x, dw.h / 2, gz1 + fw / 2);
    box(this.scene, t + 0.05, fw, dw.w + fw * 2, jMat, x, dw.h + fw / 2, dw.z);
  }

  _wallLeftWithWindows() {
    // Left wall with 3 sash windows
    const t = 0.14, x = -ROOM.w / 2 - t / 2;
    const wW = 1.3, wH = 1.35; // window width(Z) and height(Y)
    const wY = 1.05;             // sill height
    const wTop = wY + wH;        // 2.40
    const wallMat = _mat(0xe4dfd3, 0.84);

    // Belt below windows
    box(this.scene, t, wY, ROOM.d, wallMat, x, wY / 2, 0);
    // Belt above windows
    const aboveH = ROOM.h - wTop;
    box(this.scene, t, aboveH, ROOM.d, wallMat, x, wTop + aboveH / 2, 0);

    // Window centers along Z
    const wCenters = [-3, 0, 3];
    // Piers between/beside windows (mid-height belt)
    const pierZs = [
      [-ROOM.d / 2, -3 - wW / 2],
      [-3 + wW / 2, 0  - wW / 2],
      [ 0  + wW / 2, 3 - wW / 2],
      [ 3  + wW / 2,  ROOM.d / 2],
    ];
    pierZs.forEach(([z0, z1]) => {
      const cz = (z0 + z1) / 2, wd = Math.abs(z1 - z0);
      if (wd > 0.01) box(this.scene, t, wH, wd, wallMat, x, wY + wH / 2, cz);
    });

    // Glass panes + window frames
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x90cce8, transmission: 0.88, roughness: 0.04,
      transparent: true, opacity: 0.28, side: THREE.DoubleSide,
    });
    const fMat = _mat(0xf0ede3, 0.62);
    const fw = 0.045; // frame bar

    wCenters.forEach(wz => {
      // Glass
      const g = new THREE.Mesh(new THREE.PlaneGeometry(wW, wH), glassMat);
      g.position.set(x, wY + wH / 2, wz);
      g.rotation.y = Math.PI / 2;
      this.scene.add(g);

      // Frame bars
      const fy = wY + wH / 2;
      box(this.scene, fw, fw, wW + fw * 2, fMat, x, wY - fw / 2,  wz); // sill
      box(this.scene, fw, fw, wW + fw * 2, fMat, x, wTop + fw / 2, wz); // top
      box(this.scene, fw, wH + fw * 2, fw, fMat, x, fy, wz - wW / 2); // left
      box(this.scene, fw, wH + fw * 2, fw, fMat, x, fy, wz + wW / 2); // right
      // Mid-rail (sash rail)
      box(this.scene, fw, fw, wW, fMat, x, wY + wH / 2, wz);
    });

    collider(this.colliders, -ROOM.w / 2, 0, 0, t + 0.3, ROOM.h, ROOM.d);
  }

  // ── Blackboard ─────────────────────────────────────────────────────────────
  _blackboard() {
    const bW = 4.8, bH = 1.35, bY = 1.35;
    const z = -ROOM.d / 2 + 0.02;

    // Board
    box(this.scene, bW, bH, 0.04, _mat(0x2a5424, 0.94), 0, bY + bH / 2, z);
    // Chalk tray
    box(this.scene, bW, 0.06, 0.1, _mat(0x7a6e5e, 0.75), 0, bY - 0.01, z - 0.02);
    // Frame
    const fr = _mat(0x5a4e40, 0.72), fw = 0.06;
    box(this.scene, bW + fw * 2, fw, 0.06, fr, 0, bY + bH + fw / 2, z);
    box(this.scene, bW + fw * 2, fw, 0.06, fr, 0, bY - fw / 2,      z);
    box(this.scene, fw, bH + fw * 2, 0.06, fr, -bW / 2 - fw / 2, bY + bH / 2, z);
    box(this.scene, fw, bH + fw * 2, 0.06, fr,  bW / 2 + fw / 2, bY + bH / 2, z);
  }

  // ── Ceiling strip lights ────────────────────────────────────────────────────
  _ceilingLights() {
    const fixtureMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xfff8e8, emissiveIntensity: 1.0,
      roughness: 0.6,
    });
    // 3 rows across the room, each at a different Z
    [-3.5, 0, 3.5].forEach(z => {
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 2.2), fixtureMat);
      fixture.position.set(0, ROOM.h - 0.02, z);
      this.scene.add(fixture);

      const light = new THREE.RectAreaLight(0xfff5e0, 6.5, 0.12, 2.0);
      light.position.set(0, ROOM.h - 0.06, z);
      light.rotation.x = -Math.PI / 2;
      this.scene.add(light);
    });
  }

  // ── Scene lighting ─────────────────────────────────────────────────────────
  _lighting() {
    // Sun: warm, angled through the left-wall windows
    const sun = new THREE.DirectionalLight(0xfff4cc, 1.35);
    sun.position.set(-9, 7, -1.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left   = -10;
    sun.shadow.camera.right  =  10;
    sun.shadow.camera.top    =   8;
    sun.shadow.camera.bottom =  -8;
    sun.shadow.camera.near   = 0.5;
    sun.shadow.camera.far    = 35;
    sun.shadow.bias = -0.001;
    this.scene.add(sun);

    // Cool fill from opposite side
    const fill = new THREE.DirectionalLight(0xc8dff5, 0.35);
    fill.position.set(6, 4, 2);
    this.scene.add(fill);

    // Hemisphere (sky/ground bounce)
    const hemi = new THREE.HemisphereLight(0xccd8e8, 0x3a3228, 0.55);
    this.scene.add(hemi);
  }
}
