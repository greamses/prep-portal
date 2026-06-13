/**
 * Outdoor cartoon basketball court scene.
 * Matches the supplied reference: blue sky, distant mountains, suburban
 * houses, conifer trees, hedges, chain-link fence with colourful bunting,
 * red curb, dark asphalt court with white lines, glass backboard with a
 * cyan trim, orange rim, white net.
 *
 * Returns { scene, hoop } — `hoop` exposes the collision data physics needs.
 */
import * as THREE from "three";

/* =========================================================================
   Public entry
   ========================================================================= */
export function buildScene() {
  const scene = new THREE.Scene();

  // Soft sky-blue background + matching distance fog so the world fades
  // gracefully into the horizon instead of clipping against a hard edge.
  scene.background = makeSkyTexture();
  scene.fog = new THREE.Fog(0x9bd3ff, 30, 110);

  buildLighting(scene);
  buildCourt(scene);
  buildSurroundings(scene);
  const hoop = buildHoop(scene);
  buildFence(scene);
  buildPropsAroundCourt(scene);

  return { scene, hoop };
}

/* =========================================================================
   Lighting — bright sunny outdoor look
   ========================================================================= */
function buildLighting(scene) {
  // warm sky / cool ground hemisphere fill
  const hemi = new THREE.HemisphereLight(0xfff6e0, 0x4b6a4a, 0.85);
  scene.add(hemi);

  // soft ambient so shadows never go pure black
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  // sun — slightly behind / above-left of the player
  const sun = new THREE.DirectionalLight(0xfff1cf, 1.55);
  sun.position.set(-8, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far  = 60;
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  // subtle bounce light from the court back toward the camera
  const bounce = new THREE.DirectionalLight(0x8fb4ff, 0.25);
  bounce.position.set(0, 4, 8);
  scene.add(bounce);
}

/* =========================================================================
   Court — asphalt + painted lines + red curb border
   ========================================================================= */
function buildCourt(scene) {
  // Big grass / ground plane behind the court so nothing looks unfinished.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({ color: 0x6aa84f, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  // Court asphalt — dark slate blue, slightly mottled
  const courtMat = new THREE.MeshStandardMaterial({
    map: makeAsphaltTexture(),
    roughness: 0.95,
    metalness: 0.0,
  });
  const court = new THREE.Mesh(new THREE.PlaneGeometry(16, 18), courtMat);
  court.rotation.x = -Math.PI / 2;
  court.position.set(0, 0.0, -3);
  court.receiveShadow = true;
  scene.add(court);

  // Red curb running around the court edge — the bright orange-red strip
  // visible at the back of the reference image.
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.7 });
  const curbThickness = 0.4;
  const curbHeight = 0.18;
  const courtZFront =  6;     // +z = toward camera
  const courtZBack  = -12;    // -z = toward hoop / fence
  const courtXHalf  = 8;

  // back curb (most visible in reference)
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(courtXHalf * 2 + curbThickness * 2, curbHeight, curbThickness),
    curbMat
  );
  back.position.set(0, curbHeight / 2, courtZBack - curbThickness / 2);
  back.castShadow = true; back.receiveShadow = true;
  scene.add(back);

  // side curbs
  const sideGeo = new THREE.BoxGeometry(curbThickness, curbHeight, courtZFront - courtZBack);
  const left  = new THREE.Mesh(sideGeo, curbMat);
  left.position.set(-courtXHalf - curbThickness / 2, curbHeight / 2, (courtZFront + courtZBack) / 2);
  left.castShadow = true; left.receiveShadow = true;
  scene.add(left);
  const right = new THREE.Mesh(sideGeo, curbMat);
  right.position.set( courtXHalf + curbThickness / 2, curbHeight / 2, (courtZFront + courtZBack) / 2);
  right.castShadow = true; right.receiveShadow = true;
  scene.add(right);

  addCourtLines(scene);
}

function addCourtLines(scene) {
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const line = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.012, z);
    scene.add(m);
  };

  // Free-throw lane (key) — 3.66m wide × 4.6m deep, baseline at z = -8
  line(3.66, 0.06, 0, -8);             // baseline
  line(3.66, 0.06, 0, -3.4);           // free throw line
  line(0.06, 4.6, -1.83, -5.7);        // left lane
  line(0.06, 4.6,  1.83, -5.7);        // right lane

  // Free-throw circle
  const circle = new THREE.Mesh(
    new THREE.RingGeometry(1.78, 1.84, 64),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(0, 0.012, -3.4);
  scene.add(circle);

  // 3pt arc (approx 6.75m from rim center)
  const arc = new THREE.Mesh(
    new THREE.RingGeometry(6.72, 6.78, 96, 1, Math.PI * 0.18, Math.PI * 0.64),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  arc.rotation.x = -Math.PI / 2;
  arc.position.set(0, 0.012, -8);
  scene.add(arc);

  // Court border line just inside the curb
  const border = new THREE.Mesh(
    new THREE.RingGeometry(0, 0, 4),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  // Build as 4 thin rectangles instead — cleaner look
  const bx = 7.85, bz1 = -11.85, bz2 = 5.85;
  line(bx * 2, 0.06, 0, bz1);
  line(bx * 2, 0.06, 0, bz2);
  line(0.06, bz2 - bz1, -bx, (bz1 + bz2) / 2);
  line(0.06, bz2 - bz1,  bx, (bz1 + bz2) / 2);
  scene.remove(border);
}

/* =========================================================================
   Hoop — pole, glass backboard with cyan trim, orange rim, procedural net
   ========================================================================= */
function buildHoop(scene) {
  const HOOP_Z = -8;
  const RIM_Y  = 3.05;
  const RIM_R  = 0.2286;

  // Pole + base + arm (single dark-grey metal)
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x9aa3ad, metalness: 0.55, roughness: 0.45,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.9), poleMat);
  base.position.set(0, 0.09, HOOP_Z - 1.1);
  base.castShadow = true; base.receiveShadow = true;
  scene.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 4.0, 20), poleMat);
  pole.position.set(0, 2.0, HOOP_Z - 1.1);
  pole.castShadow = true;
  scene.add(pole);

  // Curved-feel arm (two short segments) joining pole to backboard
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.0), poleMat);
  arm.position.set(0, 3.55, HOOP_Z - 0.6);
  arm.castShadow = true;
  scene.add(arm);

  // ---------- Backboard ----------
  // Light blue translucent glass with a thick cyan frame matching the ref.
  const boardGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xb9e6ff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.7,
    thickness: 0.05,
    transparent: true,
    opacity: 0.55,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    side: THREE.DoubleSide,
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.05, 0.04), boardGlassMat);
  board.position.set(0, 3.55, HOOP_Z - 0.1);
  board.castShadow = true; board.receiveShadow = true;
  scene.add(board);

  // Thick cyan/blue frame around the glass (the bright trim in ref)
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x2aa6df, metalness: 0.4, roughness: 0.35,
  });
  const trimT = 0.07; // thickness
  const trimD = 0.06; // depth
  const trimTop = new THREE.Mesh(new THREE.BoxGeometry(1.94, trimT, trimD), trimMat);
  trimTop.position.set(0, 3.55 + 1.05 / 2 + trimT / 2, HOOP_Z - 0.1);
  scene.add(trimTop);
  const trimBot = trimTop.clone();
  trimBot.position.y = 3.55 - 1.05 / 2 - trimT / 2;
  scene.add(trimBot);
  const trimSideGeo = new THREE.BoxGeometry(trimT, 1.05 + trimT * 2, trimD);
  const trimL = new THREE.Mesh(trimSideGeo, trimMat);
  trimL.position.set(-1.8 / 2 - trimT / 2, 3.55, HOOP_Z - 0.1);
  scene.add(trimL);
  const trimR = trimL.clone();
  trimR.position.x = 1.8 / 2 + trimT / 2;
  scene.add(trimR);

  // Inner shooter's square (white outline)
  const sqOuter = new THREE.Mesh(
    new THREE.PlaneGeometry(0.59, 0.45),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  sqOuter.position.set(0, 3.30, HOOP_Z - 0.079);
  scene.add(sqOuter);
  const sqInner = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.41),
    new THREE.MeshBasicMaterial({ color: 0xb9e6ff, transparent: true, opacity: 0.0 })
  );
  sqInner.position.set(0, 3.30, HOOP_Z - 0.078);
  scene.add(sqInner);

  // ---------- Rim ----------
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xff5a1f, metalness: 0.6, roughness: 0.35,
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RIM_R, 0.022, 14, 48), rimMat);
  rim.position.set(0, RIM_Y, HOOP_Z + RIM_R + 0.12);
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  scene.add(rim);

  // Rim mount plate
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.18), rimMat);
  mount.position.set(0, RIM_Y, HOOP_Z + 0.0);
  scene.add(mount);

  // ---------- Net ----------
  const net = buildNet(RIM_R);
  net.position.set(0, RIM_Y, HOOP_Z + RIM_R + 0.12);
  scene.add(net);

  return {
    rimCenter: new THREE.Vector3(0, RIM_Y, HOOP_Z + RIM_R + 0.12),
    rimRadius: RIM_R,
    rimTubeRadius: 0.022,
    backboard: {
      center: new THREE.Vector3(0, 3.55, HOOP_Z - 0.1),
      halfWidth: 0.9,
      halfHeight: 0.525,
      z: HOOP_Z - 0.08,
    },
    net,
  };
}

function buildNet(rimRadius) {
  const group = new THREE.Group();
  const segments = 18;
  const rings = 7;
  const netHeight = 0.5;

  const mat = new THREE.LineBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.92,
  });

  const points = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    // pinch in toward the bottom (cone-ish), with a slight bell curve
    const taper = 1 - t * 0.6 + Math.sin(t * Math.PI) * 0.04;
    const radius = rimRadius * taper;
    const y = -t * netHeight;
    const ring = [];
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      ring.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
    }
    points.push(ring);
  }

  // diagonal zig-zag strands (classic net look)
  for (let i = 0; i < segments; i++) {
    const verts = [];
    for (let r = 0; r <= rings; r++) {
      const idx = (r % 2 === 0) ? i : (i + 1) % segments;
      verts.push(points[r][idx]);
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(verts), mat));
  }

  // bottom hoop ring
  group.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([...points[rings], points[rings][0]]),
    mat
  ));

  return group;
}

/* =========================================================================
   Surroundings — distant mountains, suburban houses, conifer trees, hedges
   ========================================================================= */
function buildSurroundings(scene) {
  // ----- Mountains (low-poly silhouettes far behind the fence) -----
  const mountainMat = new THREE.MeshStandardMaterial({
    color: 0x6e8aa6, roughness: 1, flatShading: true,
  });
  const mountainCapMat = new THREE.MeshStandardMaterial({
    color: 0xe9c8d4, roughness: 1, flatShading: true,
  });
  const mtnPositions = [
    [-22, 0, -28, 9, 7],
    [-12, 0, -32, 11, 9],
    [  2, 0, -34, 13, 10],
    [ 16, 0, -30, 10, 8],
    [ 26, 0, -28,  9, 7],
  ];
  mtnPositions.forEach(([x, y, z, r, h]) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), mountainMat);
    m.position.set(x, y + h / 2 - 0.5, z);
    m.rotation.y = Math.random() * Math.PI;
    scene.add(m);
    // pink/white snow cap
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.45, h * 0.32, 4), mountainCapMat);
    cap.position.set(x, y + h - h * 0.18 - 0.5, z);
    cap.rotation.y = m.rotation.y;
    scene.add(cap);
  });

  // ----- Houses behind the fence (left + right clusters) -----
  buildHouse(scene,  6.5, -16, 0xc94f6d, 0x6f4ea8); // pink walls, purple roof (right)
  buildHouse(scene,  9.5, -17, 0xeae0c8, 0x4a6fa5); // cream + blue
  buildHouse(scene, -7.0, -16, 0xe8c9b4, 0x8d3a52); // peach + maroon roof (left)

  // ----- Conifer trees scattered behind fence -----
  const treeSpots = [
    [-13, -14], [-10, -15], [-6.5, -15.5], [-4, -16],
    [ 4, -16],  [ 8, -15.5], [11, -15], [14, -14.5],
    [-15, -18], [15, -18], [-2, -18], [3, -18],
  ];
  treeSpots.forEach(([x, z]) => buildTree(scene, x, z));

  // ----- Hedge row right behind the fence (the vivid green wall in ref) -----
  const hedgeMat = new THREE.MeshStandardMaterial({
    color: 0x9bc24a, roughness: 1, flatShading: true,
  });
  for (let x = -14; x <= 14; x += 0.9) {
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.7 + Math.random() * 0.25, 8, 6),
      hedgeMat
    );
    bush.position.set(x + (Math.random() - 0.5) * 0.2, 0.55, -12.6 + (Math.random() - 0.5) * 0.2);
    bush.scale.y = 0.85;
    scene.add(bush);
  }
}

function buildHouse(scene, x, z, wallColor, roofColor) {
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.8, flatShading: true });

  const w = 3.4, h = 2.0, d = 2.6;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.set(x, h / 2, z);
  scene.add(body);

  // Pitched roof (4-sided pyramid)
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.1, 1.2, 4), roofMat);
  roof.position.set(x, h + 0.6, z);
  roof.rotation.y = Math.PI / 4;
  scene.add(roof);

  // Window
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xcfe6ff, emissive: 0x4a6fa5, emissiveIntensity: 0.15, roughness: 0.4,
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.55), winMat);
  win.position.set(x, h * 0.55, z + d / 2 + 0.01);
  scene.add(win);

  // Window cross
  const cross = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const c1 = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.04), cross);
  c1.position.set(x, h * 0.55, z + d / 2 + 0.012);
  scene.add(c1);
  const c2 = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.57), cross);
  c2.position.set(x, h * 0.55, z + d / 2 + 0.012);
  scene.add(c2);
}

function buildTree(scene, x, z) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 });
  const leafColors = [0x2f7a3a, 0x3a8a3f, 0x4ea05a, 0x256d33];
  const c = leafColors[Math.floor(Math.random() * leafColors.length)];
  const leafMat = new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8), trunkMat);
  trunk.position.set(x, 0.45, z);
  scene.add(trunk);

  // Three stacked cones for a conifer
  const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.4, 7), leafMat);
  cone1.position.set(x, 1.3, z); scene.add(cone1);
  const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.78, 1.2, 7), leafMat);
  cone2.position.set(x, 2.0, z); scene.add(cone2);
  const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.0, 7), leafMat);
  cone3.position.set(x, 2.7, z); scene.add(cone3);
}

/* =========================================================================
   Chain-link fence + colourful bunting
   ========================================================================= */
function buildFence(scene) {
  const fenceTex = makeChainLinkTexture();
  const fenceMat = new THREE.MeshStandardMaterial({
    map: fenceTex,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    metalness: 0.4,
    roughness: 0.6,
    color: 0xdadfe4,
  });

  const postMat = new THREE.MeshStandardMaterial({
    color: 0xb8bec5, metalness: 0.6, roughness: 0.4,
  });

  // Fence sits just behind the back curb
  const fenceZ = -12.2;
  const fenceHeight = 3.2;
  const fenceWidth = 18;

  const fence = new THREE.Mesh(
    new THREE.PlaneGeometry(fenceWidth, fenceHeight),
    fenceMat
  );
  fence.position.set(0, fenceHeight / 2, fenceZ);
  scene.add(fence);

  // Top + bottom rails
  const railGeo = new THREE.CylinderGeometry(0.04, 0.04, fenceWidth, 8);
  const top = new THREE.Mesh(railGeo, postMat);
  top.rotation.z = Math.PI / 2;
  top.position.set(0, fenceHeight, fenceZ);
  scene.add(top);
  const bot = top.clone();
  bot.position.y = 0.05;
  scene.add(bot);

  // Posts every 3m
  for (let x = -fenceWidth / 2; x <= fenceWidth / 2 + 0.001; x += 3) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, fenceHeight + 0.2, 10),
      postMat
    );
    post.position.set(x, (fenceHeight + 0.2) / 2, fenceZ);
    post.castShadow = true;
    scene.add(post);
  }

  // Bunting flags strung along the top rail
  buildBunting(scene, -fenceWidth / 2 + 0.4, fenceWidth / 2 - 0.4, fenceHeight - 0.05, fenceZ + 0.02);
}

function buildBunting(scene, xStart, xEnd, y, z) {
  const colors = [0xff5a5f, 0xffd23f, 0x3ec1d3, 0xff9a3c, 0x6cc24a, 0xe05fbf];
  const flagW = 0.28;
  const flagH = 0.36;
  const spacing = 0.42;

  // String (thin dark line) — drawn as a long thin box that sags slightly
  // (sag is purely visual; the flags hang from a straight line for simplicity).
  const stringMat = new THREE.MeshStandardMaterial({ color: 0x222428 });
  const stringMesh = new THREE.Mesh(
    new THREE.BoxGeometry(xEnd - xStart, 0.015, 0.015),
    stringMat
  );
  stringMesh.position.set((xStart + xEnd) / 2, y, z);
  scene.add(stringMesh);

  let i = 0;
  for (let x = xStart; x <= xEnd; x += spacing, i++) {
    const flagMat = new THREE.MeshStandardMaterial({
      color: colors[i % colors.length],
      side: THREE.DoubleSide,
      roughness: 0.85,
    });
    // triangular flag
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      -flagW / 2, 0,    0,
       flagW / 2, 0,    0,
       0,        -flagH, 0,
    ]);
    geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    geo.setIndex([0, 1, 2]);
    geo.computeVertexNormals();
    const flag = new THREE.Mesh(geo, flagMat);
    flag.position.set(x, y - 0.02, z + 0.005);
    // slight random sway for hand-made feel
    flag.rotation.z = (Math.random() - 0.5) * 0.12;
    scene.add(flag);
  }
}

/* =========================================================================
   Props on / around the court — bench, water cooler, trophy, cup
   ========================================================================= */
function buildPropsAroundCourt(scene) {
  // Wooden bench off to the right (out of the player's main view)
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.7 });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.5), woodMat);
  bench.position.set(7.2, 0.55, 1.5);
  bench.castShadow = true; bench.receiveShadow = true;
  scene.add(bench);
  for (const lx of [-1.0, 1.0]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.5), woodMat);
    leg.position.set(7.2 + lx, 0.275, 1.5);
    leg.castShadow = true;
    scene.add(leg);
  }

  // Trophy on the bench (gold cup)
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf2c038, metalness: 0.85, roughness: 0.25,
  });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.10, 0.32, 16), goldMat);
  cup.position.set(7.7, 0.78, 1.5);
  cup.castShadow = true;
  scene.add(cup);
  const cupBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.10, 0.28), goldMat);
  cupBase.position.set(7.7, 0.66, 1.5);
  scene.add(cupBase);
  // tiny handles
  const handleGeo = new THREE.TorusGeometry(0.08, 0.018, 8, 16, Math.PI);
  const hL = new THREE.Mesh(handleGeo, goldMat);
  hL.position.set(7.55, 0.86, 1.5); hL.rotation.z = -Math.PI / 2; scene.add(hL);
  const hR = new THREE.Mesh(handleGeo, goldMat);
  hR.position.set(7.85, 0.86, 1.5); hR.rotation.z =  Math.PI / 2; scene.add(hR);

  // Red paper cup near the bench
  const cupMat = new THREE.MeshStandardMaterial({ color: 0xd64545, roughness: 0.7 });
  const paperCup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.13, 14), cupMat);
  paperCup.position.set(6.7, 0.66, 1.45);
  scene.add(paperCup);

  // Blue water cooler off to the left
  const coolerMat = new THREE.MeshStandardMaterial({ color: 0x2f6fb0, roughness: 0.5 });
  const cooler = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.45), coolerMat);
  cooler.position.set(-7.5, 0.25, 1.5);
  cooler.castShadow = true; cooler.receiveShadow = true;
  scene.add(cooler);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.47),
    new THREE.MeshStandardMaterial({ color: 0xe6e6e6, roughness: 0.6 }));
  lid.position.set(-7.5, 0.53, 1.5);
  scene.add(lid);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 10),
    new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.7, roughness: 0.3 }));
  spout.rotation.x = Math.PI / 2;
  spout.position.set(-7.5, 0.18, 1.78);
  scene.add(spout);
}

/* =========================================================================
   Procedural textures (canvas-based — no external assets needed)
   ========================================================================= */
function makeSkyTexture() {
  const c = document.createElement("canvas");
  c.width = 16; c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.00, "#3aa1ea");
  g.addColorStop(0.55, "#7cc4f0");
  g.addColorStop(1.00, "#cdeaf7");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeAsphaltTexture() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext("2d");

  // base dark slate
  ctx.fillStyle = "#3b4654";
  ctx.fillRect(0, 0, 1024, 1024);

  // add subtle blue/grey speckle for asphalt feel
  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const a = 0.04 + Math.random() * 0.10;
    const shade = Math.random() < 0.5 ? 30 : 200;
    ctx.fillStyle = `rgba(${shade},${shade + 8},${shade + 18},${a})`;
    ctx.fillRect(x, y, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeChainLinkTexture() {
  // Build a tileable chain-link diamond pattern using transparent canvas.
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(225, 230, 235, 0.95)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  // diamond / chain-link pattern
  const step = 16;
  for (let x = -size; x <= size * 2; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + size, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, size);
    ctx.lineTo(x + size, 0);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(28, 5);
  tex.anisotropy = 8;
  return tex;
}
