import * as THREE from 'three';
import { ROOM } from './Room.js';

/**
 * Decorative dressing for the lab — the things that make it feel lived-in and
 * kid-friendly rather than an empty box: spinning ceiling fans, a wall-mounted
 * air-conditioner, accurate science wall-charts (a real periodic table, a 0–14
 * pH scale, a lab-safety checklist), colourful SVG icon stickers, and a working
 * wall clock whose hands actually run. Everything is parented into the room
 * group so it gates with the room.
 *
 * Nothing here collides or is interactive; `update(delta)` spins the fans and
 * advances the clock hands.
 */

// ── Canvas / SVG texture helpers ──────────────────────────────────────────────
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Rasterise an SVG string into a texture (drawn once the data-URI image loads).
function svgTexture(svg, w = 128, h = 128) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const img = new Image();
  img.onload = () => {
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    t.needsUpdate = true;
  };
  img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
  return t;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// A framed wall poster: thin dark frame + a textured face plane.
function poster(scene, { x, y, z, ry = 0, w, h, tex }) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.05, h + 0.05, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x2c2a26, roughness: 0.6, envMapIntensity: 0.3 }),
  );
  g.add(frame);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, envMapIntensity: 0.2 }),
  );
  face.position.z = 0.014;
  g.add(face);
  g.position.set(x, y, z);
  g.rotation.y = ry;
  scene.add(g);
  return g;
}

// A flat SVG-icon "sticker" stuck on a surface.
function sticker(scene, { x, y, z, ry = 0, size = 0.26, icon }) {
  const tex = svgTexture(ICONS[icon], 128, 128);
  tex.transparent = true;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  m.position.set(x, y, z);
  m.rotation.y = ry;
  scene.add(m);
  return m;
}

export class Decor {
  constructor(scene) {
    this.scene  = scene;
    this._fans  = [];     // blade groups to spin
    this._hands = null;   // { hour, minute, second }
    this._build();
  }

  _build() {
    this._ceilingFans();
    this._airConditioner();
    this._posters();
    this._stickers();
    this._wallClock();
  }

  // ── Ceiling fans ────────────────────────────────────────────────────────────
  _ceilingFans() {
    const rodMat   = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.5, metalness: 0.7 });
    const hubMat   = new THREE.MeshStandardMaterial({ color: 0x3a4a55, roughness: 0.4, metalness: 0.8 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide });

    // Down the centre of the room, tucked between the three ceiling light strips.
    [-2.3, 2.3].forEach((z, i) => {
      const g = new THREE.Group();
      g.position.set(0, ROOM.h - 0.02, z);

      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10), rodMat);
      rod.position.y = -0.17;
      g.add(rod);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.09, 18), hubMat);
      hub.position.y = -0.36;
      g.add(hub);

      const blades = new THREE.Group();
      blades.position.y = -0.345;
      for (let b = 0; b < 4; b++) {
        const arm = new THREE.Group();
        arm.rotation.y = (b / 4) * Math.PI * 2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.13), bladeMat);
        blade.position.set(0.42, 0, 0);
        blade.rotation.z = 0.12;             // slight pitch
        blade.castShadow = true;
        arm.add(blade);
        blades.add(arm);
      }
      g.add(blades);
      this.scene.add(g);
      this._fans.push({ blades, speed: 2.4 + i * 0.3 });
    });
  }

  // ── Wall split air-conditioner (high on the back wall) ───────────────────────
  _airConditioner() {
    const innerZ = ROOM.d / 2;            // back-wall inner face (≈ 5.0)
    const g = new THREE.Group();
    g.position.set(-4.4, 2.55, innerZ - 0.12);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.3, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xf4f5f3, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.3 }),
    );
    body.castShadow = true;
    g.add(body);

    const lip = new THREE.Mesh(
      new THREE.BoxGeometry(0.97, 0.06, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xe6e8e6, roughness: 0.5 }),
    );
    lip.position.set(0, -0.13, -0.1);
    g.add(lip);

    const slatMat = new THREE.MeshStandardMaterial({ color: 0xcfd2d0, roughness: 0.6 });
    for (let i = 0; i < 3; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.018, 0.05), slatMat);
      slat.position.set(0, -0.15 - i * 0.022, -0.085);
      slat.rotation.x = -0.5;
      g.add(slat);
    }

    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x3fd07a, emissive: 0x2fa85e, emissiveIntensity: 1.6 }),
    );
    led.position.set(0.34, -0.05, -0.101);
    g.add(led);

    g.rotation.y = Math.PI;               // face into the room (−z)
    this.scene.add(g);
  }

  // ── Science wall-charts ──────────────────────────────────────────────────────
  _posters() {
    const frontZ = -ROOM.d / 2 + 0.08;    // front wall, facing +z
    const backZ  =  ROOM.d / 2 - 0.08;    // back wall, facing −z

    poster(this.scene, {                  // real periodic table — front wall, left
      x: -4.0, y: 1.75, z: frontZ, ry: 0, w: 1.85, h: 1.15,
      tex: periodicTableTexture(),
    });
    poster(this.scene, {                  // lab-safety checklist — front wall, right
      x: 4.1, y: 1.75, z: frontZ, ry: 0, w: 1.2, h: 1.05,
      tex: safetyTexture(),
    });
    poster(this.scene, {                  // 0–14 pH scale — back wall, high right
      x: 4.2, y: 2.3, z: backZ, ry: Math.PI, w: 1.7, h: 0.6,
      tex: phScaleTexture(),
    });
    poster(this.scene, {                  // motivational chart — back wall, high left
      x: -1.0, y: 2.45, z: backZ, ry: Math.PI, w: 1.3, h: 0.7,
      tex: curiousTexture(),
    });
  }

  // ── Colourful SVG icon stickers ──────────────────────────────────────────────
  _stickers() {
    const frontZ = -ROOM.d / 2 + 0.07;
    const backZ  =  ROOM.d / 2 - 0.07;
    const leftX  = -ROOM.w / 2 + 0.07;

    [['flask', -5.0, 2.5], ['beaker', 5.0, 2.5], ['molecule', -5.2, 0.9], ['star', 5.2, 1.1]]
      .forEach(([ic, x, y]) => sticker(this.scene, { x, y, z: frontZ, ry: 0, icon: ic, size: 0.3 }));

    [['flame', -2.2, 2.55], ['droplet', 3.1, 0.95], ['atom', 0.0, 2.7], ['dish', -4.9, 1.0]]
      .forEach(([ic, x, y]) => sticker(this.scene, { x, y, z: backZ, ry: Math.PI, icon: ic, size: 0.28 }));

    [['thermometer', 2.55], ['tube', -1.5]]
      .forEach(([ic, z]) => sticker(this.scene, { x: leftX, y: 2.6, z, ry: Math.PI / 2, icon: ic, size: 0.26 }));
  }

  // ── Working wall clock (front wall, upper-right — clear of board & posters) ───
  _wallClock() {
    const z = -ROOM.d / 2 + 0.06;
    const R = 0.19;
    const g = new THREE.Group();
    g.position.set(2.9, 2.45, z);          // faces the room (+z), so hands read right

    // Round white case
    const caseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.05, 36),
      new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.55, metalness: 0.05 }),
    );
    caseMesh.rotation.x = Math.PI / 2;     // circular faces point ±z
    caseMesh.castShadow = true;
    g.add(caseMesh);

    // Brushed-metal bezel ring at the front edge
    const bezel = new THREE.Mesh(
      new THREE.TorusGeometry(R, 0.012, 12, 40),
      new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.85, envMapIntensity: 0.5 }),
    );
    bezel.position.z = 0.028;
    g.add(bezel);

    // Dial face
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(R - 0.004, 40),
      new THREE.MeshStandardMaterial({ map: clockDialTexture(), roughness: 0.7 }),
    );
    face.position.z = 0.024;
    g.add(face);

    // Hands pivot at the centre and rotate about +z (which points into the room).
    const handMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
    const secMat  = new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.5 });
    const makeHand = (len, wid, zoff, mat) => {
      const grp = new THREE.Group();
      const m = new THREE.Mesh(new THREE.BoxGeometry(wid, len, 0.004), mat);
      m.position.y = len / 2 - len * 0.16;   // small tail past the centre
      grp.add(m);
      grp.position.z = zoff;
      g.add(grp);
      return grp;
    };
    this._hands = {
      hour:   makeHand(0.095, 0.013, 0.027, handMat),
      minute: makeHand(0.150, 0.010, 0.029, handMat),
      second: makeHand(0.160, 0.005, 0.031, secMat),
    };
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.012, 14),
      new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.4 }),
    );
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.033;
    g.add(cap);

    // Glass cover (subtle sheen over the dial)
    const glass = new THREE.Mesh(
      new THREE.CircleGeometry(R - 0.002, 40),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transmission: 0.9, roughness: 0.06, transparent: true,
        opacity: 0.4, ior: 1.45, thickness: 0.01, envMapIntensity: 0.7,
      }),
    );
    glass.position.z = 0.037;
    g.add(glass);

    this.scene.add(g);
  }

  update(delta) {
    for (const f of this._fans) f.blades.rotation.y += f.speed * delta;

    if (this._hands) {
      const now = new Date();
      const s = now.getSeconds() + now.getMilliseconds() / 1000;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;
      // Negative z so the hands sweep clockwise when viewed from inside the room.
      this._hands.second.rotation.z = -(s / 60) * Math.PI * 2;
      this._hands.minute.rotation.z = -(m / 60) * Math.PI * 2;
      this._hands.hour.rotation.z   = -(h / 12) * Math.PI * 2;
    }
  }
}

// ── Periodic table (real element data, standard 18-column layout) ─────────────
const PT = [
  [1,'H',1,1],[2,'He',18,1],
  [3,'Li',1,2],[4,'Be',2,2],[5,'B',13,2],[6,'C',14,2],[7,'N',15,2],[8,'O',16,2],[9,'F',17,2],[10,'Ne',18,2],
  [11,'Na',1,3],[12,'Mg',2,3],[13,'Al',13,3],[14,'Si',14,3],[15,'P',15,3],[16,'S',16,3],[17,'Cl',17,3],[18,'Ar',18,3],
  [19,'K',1,4],[20,'Ca',2,4],[21,'Sc',3,4],[22,'Ti',4,4],[23,'V',5,4],[24,'Cr',6,4],[25,'Mn',7,4],[26,'Fe',8,4],
  [27,'Co',9,4],[28,'Ni',10,4],[29,'Cu',11,4],[30,'Zn',12,4],[31,'Ga',13,4],[32,'Ge',14,4],[33,'As',15,4],
  [34,'Se',16,4],[35,'Br',17,4],[36,'Kr',18,4],
  [37,'Rb',1,5],[38,'Sr',2,5],[39,'Y',3,5],[40,'Zr',4,5],[41,'Nb',5,5],[42,'Mo',6,5],[43,'Tc',7,5],[44,'Ru',8,5],
  [45,'Rh',9,5],[46,'Pd',10,5],[47,'Ag',11,5],[48,'Cd',12,5],[49,'In',13,5],[50,'Sn',14,5],[51,'Sb',15,5],
  [52,'Te',16,5],[53,'I',17,5],[54,'Xe',18,5],
  [55,'Cs',1,6],[56,'Ba',2,6],[72,'Hf',4,6],[73,'Ta',5,6],[74,'W',6,6],[75,'Re',7,6],[76,'Os',8,6],[77,'Ir',9,6],
  [78,'Pt',10,6],[79,'Au',11,6],[80,'Hg',12,6],[81,'Tl',13,6],[82,'Pb',14,6],[83,'Bi',15,6],[84,'Po',16,6],
  [85,'At',17,6],[86,'Rn',18,6],
  [87,'Fr',1,7],[88,'Ra',2,7],[104,'Rf',4,7],[105,'Db',5,7],[106,'Sg',6,7],[107,'Bh',7,7],[108,'Hs',8,7],
  [109,'Mt',9,7],[110,'Ds',10,7],[111,'Rg',11,7],[112,'Cn',12,7],[113,'Nh',13,7],[114,'Fl',14,7],[115,'Mc',15,7],
  [116,'Lv',16,7],[117,'Ts',17,7],[118,'Og',18,7],
  // Lanthanides (row 8) and actinides (row 9)
  [57,'La',3,8],[58,'Ce',4,8],[59,'Pr',5,8],[60,'Nd',6,8],[61,'Pm',7,8],[62,'Sm',8,8],[63,'Eu',9,8],[64,'Gd',10,8],
  [65,'Tb',11,8],[66,'Dy',12,8],[67,'Ho',13,8],[68,'Er',14,8],[69,'Tm',15,8],[70,'Yb',16,8],[71,'Lu',17,8],
  [89,'Ac',3,9],[90,'Th',4,9],[91,'Pa',5,9],[92,'U',6,9],[93,'Np',7,9],[94,'Pu',8,9],[95,'Am',9,9],[96,'Cm',10,9],
  [97,'Bk',11,9],[98,'Cf',12,9],[99,'Es',13,9],[100,'Fm',14,9],[101,'Md',15,9],[102,'No',16,9],[103,'Lr',17,9],
];

function ptColor(n) {
  const has = a => a.includes(n);
  if (has([3,11,19,37,55,87]))          return '#f6a4a0'; // alkali metals
  if (has([4,12,20,38,56,88]))          return '#f8cf8c'; // alkaline earth metals
  if (has([5,14,32,33,51,52]))          return '#7fd1a8'; // metalloids
  if (has([1,6,7,8,15,16,34]))          return '#8fd0ec'; // reactive nonmetals
  if (has([9,17,35,53,85,117]))         return '#4aa8e0'; // halogens
  if (has([2,10,18,36,54,86,118]))      return '#c79ae0'; // noble gases
  if (n >= 57 && n <= 71)               return '#f2b06a'; // lanthanides
  if (n >= 89 && n <= 103)              return '#ef9090'; // actinides
  if (has([13,31,49,50,81,82,83,84]))   return '#a7d3a0'; // post-transition metals
  if (has([113,114,115,116]))           return '#cfd2d0'; // unknown properties
  return '#f7d774';                                       // transition metals
}

function periodicTableTexture() {
  const W = 780, H = 480;
  return canvasTexture(W, H, (g) => {
    g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#16324f'; g.fillRect(0, 0, W, 44);
    g.fillStyle = '#fff'; g.font = 'bold 24px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('PERIODIC TABLE OF THE ELEMENTS', W / 2, 23);

    const pad = 8, top = 52, gap = 12;
    const cw = (W - 2 * pad) / 18;
    const ch = (H - top - pad - gap) / 9;
    const xOf = c => pad + (c - 1) * cw;
    const yOf = r => r <= 7 ? top + (r - 1) * ch : top + 7 * ch + gap + (r - 8) * ch;

    const cell = (num, sym, col, row) => {
      const x = xOf(col), y = yOf(row);
      g.fillStyle = ptColor(num);
      roundRect(g, x + 1, y + 1, cw - 2, ch - 2, 3); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.55)';
      g.textAlign = 'left'; g.textBaseline = 'top';
      g.font = `${Math.floor(ch * 0.22)}px sans-serif`;
      g.fillText(num, x + 3, y + 2);
      g.fillStyle = 'rgba(0,0,0,0.9)';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `bold ${Math.floor(ch * 0.38)}px sans-serif`;
      g.fillText(sym, x + cw / 2, y + ch * 0.6);
    };
    PT.forEach(e => cell(e[0], e[1], e[2], e[3]));

    // Placeholder cells where the f-block lifts out of the main grid
    g.fillStyle = '#e3e3e0';
    [[3, 6, '57–71'], [3, 7, '89–103']].forEach(([c, r, label]) => {
      const x = xOf(c), y = yOf(r);
      g.fillStyle = '#e3e3e0';
      roundRect(g, x + 1, y + 1, cw - 2, ch - 2, 3); g.fill();
      g.fillStyle = '#777'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `${Math.floor(ch * 0.24)}px sans-serif`;
      g.fillText(label, x + cw / 2, y + ch / 2);
    });
  });
}

// ── 0–14 pH scale ─────────────────────────────────────────────────────────────
function phScaleTexture() {
  const W = 640, H = 220;
  // Standard universal-indicator colours, pH 0 → 14
  const cols = ['#e2231a', '#ee4d2e', '#f37021', '#f8971d', '#fdc70c', '#d9d800',
                '#a7c521', '#3fa535', '#159b6e', '#1aa6a0', '#2196c8', '#2a6fb0',
                '#3b4a9e', '#5b3a93', '#71338a'];
  return canvasTexture(W, H, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#16324f'; g.font = 'bold 26px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('pH SCALE', W / 2, 28);
    const bw = (W - 40) / cols.length;
    cols.forEach((c, i) => {
      const x = 20 + i * bw;
      g.fillStyle = c; g.fillRect(x, 58, bw - 2, 96);
      g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif';
      g.textAlign = 'center';
      g.fillText(String(i), x + bw / 2, 106);
    });
    g.font = 'bold 18px sans-serif';
    g.fillStyle = '#c62828'; g.textAlign = 'left';   g.fillText('ACIDIC', 24, 188);
    g.fillStyle = '#2e7d32'; g.textAlign = 'center'; g.fillText('NEUTRAL (7)', W / 2, 188);
    g.fillStyle = '#5b3a93'; g.textAlign = 'right';  g.fillText('BASIC', W - 24, 188);
  });
}

// ── Lab-safety checklist (no emoji; colour-coded bullets) ────────────────────
function safetyTexture() {
  const W = 440, H = 380;
  return canvasTexture(W, H, (g) => {
    g.fillStyle = '#fff6d8'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#d6a72e'; g.lineWidth = 10; g.strokeRect(6, 6, W - 12, H - 12);
    g.fillStyle = '#9a6b00'; g.font = 'bold 30px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('LAB SAFETY RULES', W / 2, 46);

    const rules = [
      'Wear safety goggles',
      'Wear gloves & lab coat',
      'No eating or drinking',
      'No open flames near chemicals',
      'Label every container',
      'Report all spills at once',
    ];
    g.textAlign = 'left';
    rules.forEach((r, i) => {
      const y = 96 + i * 44;
      g.fillStyle = '#2e7d32';
      g.beginPath(); g.arc(40, y, 9, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath();
      g.moveTo(35, y); g.lineTo(39, y + 4); g.lineTo(46, y - 5); g.stroke();
      g.fillStyle = '#5a4300'; g.font = '22px sans-serif';
      g.textBaseline = 'middle';
      g.fillText(r, 62, y);
    });
  });
}

// ── "Stay Curious" motivational chart with a drawn atom ──────────────────────
function curiousTexture() {
  const W = 420, H = 230;
  return canvasTexture(W, H, (g) => {
    g.fillStyle = '#eaf4fb'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#1d6fb8'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);

    // Atom emblem
    const cx = W / 2, cy = 78, r = 46, color = '#1d6fb8';
    g.strokeStyle = color; g.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      g.save(); g.translate(cx, cy); g.rotate((i * Math.PI) / 3);
      g.beginPath(); g.ellipse(0, 0, r, r * 0.38, 0, 0, Math.PI * 2); g.stroke();
      g.restore();
    }
    g.fillStyle = color; g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.fill();

    g.fillStyle = color; g.font = 'bold 40px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('STAY CURIOUS', W / 2, 178);
  });
}

// ── Clock dial (numerals + ticks; the hands are real meshes) ─────────────────
function clockDialTexture() {
  return canvasTexture(256, 256, (g) => {
    const cx = 128, cy = 128, R = 122;
    g.fillStyle = '#fdfdfb'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#16324f';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const major = i % 5 === 0;
      g.lineWidth = major ? 5 : 2;
      const r0 = R - (major ? 18 : 9);
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      g.lineTo(cx + Math.cos(a) * (R - 5), cy + Math.sin(a) * (R - 5));
      g.stroke();
    }
    g.fillStyle = '#16324f'; g.font = 'bold 26px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let n = 1; n <= 12; n++) {
      const a = (n / 12) * Math.PI * 2 - Math.PI / 2;
      g.fillText(String(n), cx + Math.cos(a) * (R - 36), cy + Math.sin(a) * (R - 36));
    }
  });
}

// ── SVG icon library for the wall stickers ───────────────────────────────────
const ICONS = {
  flask: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect x="24" y="5" width="16" height="5" rx="2" fill="#2b6f9c"/>
    <path d="M27 9 V26 L13 50 a5 5 0 0 0 4.3 7.5 h29.4 a5 5 0 0 0 4.3 -7.5 L37 26 V9 Z" fill="#d4ecf7" stroke="#2b6f9c" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M21 41 H43 L47.7 49 a5 5 0 0 1 -4.3 7.5 H20.6 A5 5 0 0 1 16.3 49 Z" fill="#39a7df"/>
    <circle cx="27" cy="50" r="2" fill="#bfe3f5"/><circle cx="35" cy="53" r="1.6" fill="#bfe3f5"/></svg>`,

  beaker: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <path d="M18 12 H46 L42 18 V48 a6 6 0 0 1 -6 6 H28 a6 6 0 0 1 -6 -6 V18 Z" fill="#d2f3ec" stroke="#1f8a78" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M22 34 H42 V48 a6 6 0 0 1 -6 6 H28 a6 6 0 0 1 -6 -6 Z" fill="#23b89c"/>
    <path d="M16 12 H48" stroke="#1f8a78" stroke-width="3" stroke-linecap="round"/></svg>`,

  tube: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect x="25" y="5" width="14" height="5" rx="2.5" fill="#3a8a55"/>
    <path d="M27 8 V46 a5 5 0 0 0 10 0 V8" fill="#dff3e6" stroke="#3a8a55" stroke-width="2.5"/>
    <path d="M27 30 V46 a5 5 0 0 0 10 0 V30 Z" fill="#54c07a"/></svg>`,

  droplet: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <path d="M32 6 C20 26 16 34 16 42 a16 16 0 0 0 32 0 C48 34 44 26 32 6 Z" fill="#3fa9e0"/>
    <path d="M26 40 a6 6 0 0 0 6 8" fill="none" stroke="#bfe3f5" stroke-width="3" stroke-linecap="round"/></svg>`,

  atom: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <g fill="none" stroke="#8e44ad" stroke-width="2.5">
      <ellipse cx="32" cy="32" rx="22" ry="9"/>
      <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(60 32 32)"/>
      <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(120 32 32)"/></g>
    <circle cx="32" cy="32" r="5" fill="#8e44ad"/></svg>`,

  molecule: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <g stroke="#34495e" stroke-width="3"><line x1="20" y1="44" x2="32" y2="24"/>
      <line x1="32" y1="24" x2="46" y2="40"/><line x1="32" y1="24" x2="32" y2="9"/></g>
    <circle cx="20" cy="44" r="7" fill="#e74c3c"/><circle cx="46" cy="40" r="7" fill="#3498db"/>
    <circle cx="32" cy="24" r="8" fill="#2ecc71"/><circle cx="32" cy="9" r="5" fill="#f1c40f"/></svg>`,

  star: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <path d="M32 6 L39 24 L58 24 L43 36 L48 55 L32 44 L16 55 L21 36 L6 24 L25 24 Z" fill="#f6c945" stroke="#d6a72e" stroke-width="2" stroke-linejoin="round"/></svg>`,

  thermometer: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <path d="M26 10 a6 6 0 0 1 12 0 v28 a10 10 0 1 1 -12 0 Z" fill="#fff" stroke="#c0392b" stroke-width="2.5"/>
    <circle cx="32" cy="48" r="8" fill="#e74c3c"/><rect x="30" y="22" width="4" height="26" rx="2" fill="#e74c3c"/></svg>`,

  flame: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <path d="M32 6 C40 18 50 22 46 38 a14 14 0 1 1 -28 0 C16 30 22 28 24 22 C26 28 30 28 30 22 C30 16 30 10 32 6 Z" fill="#f39c12"/>
    <path d="M32 30 c5 5 6 10 3 15 a8 8 0 1 1 -10 -2 c2 4 6 3 5 -2 Z" fill="#f1c40f"/></svg>`,

  dish: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <ellipse cx="32" cy="40" rx="26" ry="10" fill="#f6d4e4" stroke="#c2487a" stroke-width="2.5"/>
    <ellipse cx="32" cy="34" rx="26" ry="10" fill="#fbe6f0" stroke="#c2487a" stroke-width="2.5"/>
    <circle cx="26" cy="33" r="3" fill="#c2487a"/><circle cx="38" cy="36" r="2.4" fill="#c2487a"/>
    <circle cx="33" cy="31" r="1.8" fill="#c2487a"/></svg>`,
};
