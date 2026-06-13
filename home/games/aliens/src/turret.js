// turret.js — heavy circular base with legs + armoured turret
import * as THREE from "three";
import { DEG, CONFIG } from "./config.js";

export function buildTurret(scene) {
  // ---------- materials ----------
  const matArmor = new THREE.MeshStandardMaterial({
    color: 0x4a5360,
    roughness: 0.45,
    metalness: 0.8,
  });
  const matGunmetal = new THREE.MeshStandardMaterial({
    color: 0x2a303a,
    roughness: 0.55,
    metalness: 0.7,
  });
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xd0d6e0,
    roughness: 0.25,
    metalness: 0.95,
  });
  const matAccent = new THREE.MeshStandardMaterial({
    color: 0x6e7b8c,
    roughness: 0.3,
    metalness: 0.85,
  });
  const matGlow = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x008899,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });
  const matDark = new THREE.MeshStandardMaterial({
    color: 0x1a1e24,
    roughness: 0.7,
    metalness: 0.5,
  });
  const matLeg = new THREE.MeshStandardMaterial({
    color: 0x3a404a,
    roughness: 0.5,
    metalness: 0.7,
  });

  /* ---------- WIDE CIRCULAR BASE ---------- */
  const baseGroup = new THREE.Group();
  scene.add(baseGroup);

  const BASE_RADIUS = 2.1;
  const BASE_THICKNESS = 0.9;
  const BASE_Y = CONFIG.pivotY - BASE_THICKNESS / 2; // top of disc at pivotY

  // main thick disc
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(BASE_RADIUS, BASE_RADIUS, BASE_THICKNESS, 48),
    matArmor,
  );
  disc.position.y = BASE_Y + BASE_THICKNESS / 2;
  disc.castShadow = true;
  disc.receiveShadow = true;
  baseGroup.add(disc);

  // top ring accent
  const topRing = new THREE.Mesh(
    new THREE.TorusGeometry(BASE_RADIUS, 0.12, 16, 64),
    matAccent,
  );
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = BASE_Y + BASE_THICKNESS;
  topRing.castShadow = true;
  baseGroup.add(topRing);

  // bottom ring
  const bottomRing = new THREE.Mesh(
    new THREE.TorusGeometry(BASE_RADIUS, 0.15, 16, 64),
    matGunmetal,
  );
  bottomRing.rotation.x = Math.PI / 2;
  bottomRing.position.y = BASE_Y;
  bottomRing.castShadow = true;
  baseGroup.add(bottomRing);

  // bolt details on top
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const bolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.25, 6),
      matChrome,
    );
    bolt.position.set(
      Math.cos(a) * (BASE_RADIUS - 0.4),
      BASE_Y + BASE_THICKNESS + 0.12,
      Math.sin(a) * (BASE_RADIUS - 0.4),
    );
    baseGroup.add(bolt);
  }

  /* ---------- ARMOURED TANK HULL (carries the circular base) ---------- */
  const matTrack = new THREE.MeshStandardMaterial({ color: 0x16191f, roughness: 0.92, metalness: 0.2 });
  const tank = new THREE.Group();
  scene.add(tank);

  // lower hull
  const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.9, 3.8), matArmor);
  lowerHull.position.y = -0.35; lowerHull.castShadow = true; lowerHull.receiveShadow = true;
  tank.add(lowerHull);
  // upper deck (top meets the base bottom at ~0.45)
  const upperHull = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.6, 3.2), matArmor);
  upperHull.position.y = 0.15; upperHull.castShadow = true;
  tank.add(upperHull);
  // sloped glacis (front +X)
  const glacis = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.05, 3.2), matAccent);
  glacis.position.set(2.95, 0.02, 0); glacis.rotation.z = -0.7; glacis.castShadow = true;
  tank.add(glacis);
  // rear plate
  const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, 3.0), matGunmetal);
  rearPlate.position.set(-3.0, -0.05, 0); rearPlate.rotation.z = 0.6; tank.add(rearPlate);
  // exhausts
  for (const z of [-0.8, 0.8]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.6, 10), matChrome);
    ex.rotation.z = Math.PI / 2; ex.position.set(-3.15, 0.18, z); tank.add(ex);
  }
  // head/marker lights
  for (const z of [-1.15, 1.15]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), matGlow);
    hl.position.set(3.0, 0.26, z); tank.add(hl);
  }
  // bolt strip along the deck edge
  for (let i = 0; i < 14; i++) {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 6), matChrome);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(-2.6 + i * 0.4, 0.46, 1.55); tank.add(bolt);
    const bolt2 = bolt.clone(); bolt2.position.z = -1.55; tank.add(bolt2);
  }

  // tracks + road wheels (both sides)
  for (const z of [-1.85, 1.85]) {
    const track = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.0, 0.72), matTrack);
    track.position.set(0, -0.5, z); track.castShadow = true; track.receiveShadow = true;
    tank.add(track);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.14, 0.86), matDark);
    guard.position.set(0, 0.08, z); guard.castShadow = true; tank.add(guard);
    for (let i = 0; i < 6; i++) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.56, 16), matDark);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(-2.5 + i * 1.0, -0.78, z); wheel.castShadow = true;
      tank.add(wheel);
    }
    for (const x of [-3.15, 3.15]) {
      const spr = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.62, 14), matGunmetal);
      spr.rotation.x = Math.PI / 2; spr.position.set(x, -0.5, z); spr.castShadow = true;
      tank.add(spr);
    }
  }

  /* ---- YAW TURNTABLE (sits on top of disc) ---- */
  const yawGroup = new THREE.Group();
  yawGroup.position.set(0, CONFIG.pivotY, 0);
  scene.add(yawGroup);

  const turntableDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.75, 0.3, 40),
    matAccent,
  );
  turntableDisc.position.y = 0.15;
  turntableDisc.castShadow = true;
  yawGroup.add(turntableDisc);

  // tooth ring detail
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const tooth = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.15, 0.15),
      matGunmetal,
    );
    tooth.position.set(Math.cos(a) * 1.76, 0.25, Math.sin(a) * 1.76);
    yawGroup.add(tooth);
  }

  // armored sides
  const sideBoxGeo = new THREE.BoxGeometry(0.6, 1.4, 1.8);
  const sideL = new THREE.Mesh(sideBoxGeo, matArmor);
  sideL.position.set(-0.2, 0.9, 0.95);
  sideL.castShadow = true;
  yawGroup.add(sideL);
  const sideR = new THREE.Mesh(sideBoxGeo, matArmor);
  sideR.position.set(-0.2, 0.9, -0.95);
  sideR.castShadow = true;
  yawGroup.add(sideR);

  // forward aiming notch
  const notch = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 4), matGlow);
  notch.position.set(1.7, 0.75, 0);
  notch.rotation.z = -Math.PI / 2;
  yawGroup.add(notch);

  /* ---- PITCH GROUP (ELEVATION) ---- */
  const pitchGroup = new THREE.Group();
  pitchGroup.position.set(0, 1.0, 0);
  yawGroup.add(pitchGroup);

  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 32, 32),
    matGunmetal,
  );
  hub.castShadow = true;
  pitchGroup.add(hub);

  const cylGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.0, 8);
  const cylMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.2,
    metalness: 0.9,
  });
  [0.8, -0.8].forEach((z) => {
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.rotation.z = Math.PI / 2;
    cyl.position.set(1.5, 0, z);
    pitchGroup.add(cyl);
  });

  const barrelGeo = new THREE.CylinderGeometry(0.55, 0.6, 5.8, 32);
  const barrel = new THREE.Mesh(barrelGeo, matChrome);
  barrel.rotation.z = -Math.PI / 2;
  barrel.position.x = 2.9;
  barrel.castShadow = true;
  pitchGroup.add(barrel);

  for (let x of [1.5, 2.9, 4.3]) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.09, 12, 28),
      matAccent,
    );
    band.position.x = x;
    band.rotation.y = Math.PI / 2;
    pitchGroup.add(band);
  }

  for (let i = 0; i < 8; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.2), matDark);
    vent.position.set(2.2 + i * 0.5, 0.3, 0.35);
    pitchGroup.add(vent);
    const vent2 = vent.clone();
    vent2.position.z = -0.35;
    pitchGroup.add(vent2);
  }

  const muzzleBrake = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.6, 1.2, 24),
    matChrome,
  );
  muzzleBrake.rotation.z = -Math.PI / 2;
  muzzleBrake.position.x = 6.0;
  muzzleBrake.castShadow = true;
  pitchGroup.add(muzzleBrake);

  const muzzleRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.12, 12, 28),
    matChrome,
  );
  muzzleRing.position.x = 6.6;
  muzzleRing.rotation.y = Math.PI / 2;
  pitchGroup.add(muzzleRing);

  const rail = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 0.14), matDark);
  rail.position.set(2.9, 0.75, 0);
  pitchGroup.add(rail);

  const feedBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.5, 0.7),
    matGunmetal,
  );
  feedBox.position.set(-0.5, 0.9, 0);
  pitchGroup.add(feedBox);
  for (let i = 0; i < 4; i++) {
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.4, 8),
      matChrome,
    );
    shell.position.set(-0.5, 1.05, -0.3 + i * 0.2);
    pitchGroup.add(shell);
  }

  /* ---- muzzle flash + light ---- */
  const muzzleGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0,
    }),
  );
  muzzleGlow.position.x = 6.8;
  pitchGroup.add(muzzleGlow);

  const muzzleLight = new THREE.PointLight(0xffaa33, 0, 22, 2);
  muzzleLight.position.x = 7.0;
  pitchGroup.add(muzzleLight);

  const dockedSlot = new THREE.Object3D();
  dockedSlot.position.x = 6.8;
  pitchGroup.add(dockedSlot);

  /* ---- animated radar TV display ---- */
  const dispCanvas = document.createElement('canvas');
  dispCanvas.width = 512; dispCanvas.height = 256;
  const dispCtx = dispCanvas.getContext('2d');
  const dispTex = new THREE.CanvasTexture(dispCanvas);
  dispTex.colorSpace = THREE.SRGBColorSpace;
  const TWO_PI = Math.PI * 2;
  let dispText = '—';
  let sweepAng = 0;
  let dispAccum = 0;

  function drawRadarDisplay() {
    const g = dispCtx, W = 512, H = 256;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#02120c'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
    g.strokeStyle = 'rgba(80,255,170,0.5)'; g.lineWidth = 5; g.strokeRect(8, 8, W - 16, H - 16);

    // radar scope with sweeping beam
    const cx = 150, cy = 132, R = 104;
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, TWO_PI); g.clip();
    g.fillStyle = 'rgba(10,44,30,0.55)'; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    g.strokeStyle = 'rgba(70,230,150,0.45)'; g.lineWidth = 1.5;
    [R, R * 0.66, R * 0.33].forEach(r => { g.beginPath(); g.arc(cx, cy, r, 0, TWO_PI); g.stroke(); });
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
    // beaming sweep wedge
    const trail = 0.6;
    g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, sweepAng - trail, sweepAng, false); g.closePath();
    const lg = g.createLinearGradient(
      cx + Math.cos(sweepAng - trail) * R, cy + Math.sin(sweepAng - trail) * R,
      cx + Math.cos(sweepAng) * R, cy + Math.sin(sweepAng) * R);
    lg.addColorStop(0, 'rgba(90,255,170,0)'); lg.addColorStop(1, 'rgba(90,255,170,0.4)');
    g.fillStyle = lg; g.fill();
    g.strokeStyle = 'rgba(180,255,210,0.95)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(sweepAng) * R, cy + Math.sin(sweepAng) * R); g.stroke();
    // contact blip at the target bearing, lights up as the beam passes
    const ta = Math.max(0, Math.min(180, parseInt(dispText) || 90));
    const blipA = -ta * DEG;
    const br = R * 0.82;
    const bx = cx + Math.cos(blipA) * br, by = cy + Math.sin(blipA) * br;
    let dd = Math.abs(((sweepAng - blipA) % TWO_PI + TWO_PI) % TWO_PI);
    if (dd > Math.PI) dd = TWO_PI - dd;
    const lit = Math.max(0.25, 1 - dd * 1.4);
    g.fillStyle = `rgba(255,95,95,${lit})`; g.shadowColor = '#ff5a5a'; g.shadowBlur = 14 * lit;
    g.beginPath(); g.arc(bx, by, 5.5, 0, TWO_PI); g.fill(); g.shadowBlur = 0;
    g.restore();
    g.strokeStyle = 'rgba(120,255,190,0.7)'; g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, R, 0, TWO_PI); g.stroke();

    // target value on the right
    g.textAlign = 'center';
    g.fillStyle = '#3fe89a'; g.font = "700 24px 'Orbitron', monospace";
    g.fillText('TARGET ∡', 366, 72);
    g.shadowColor = '#5dffb0'; g.shadowBlur = 22; g.fillStyle = '#aeffd4';
    g.font = "900 104px 'Orbitron', monospace";
    g.fillText(dispText, 366, 178);
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(120,230,170,0.7)'; g.font = "600 15px 'Orbitron', monospace";
    g.fillText('● CONTACT LOCKED', 366, 214);

    dispTex.needsUpdate = true;
  }
  drawRadarDisplay();

  // larger realistic CRT TV, mounted forward on an arm (clear of the barrel)
  const plasticMat = new THREE.MeshStandardMaterial({ color: 0x2b2f38, roughness: 0.55, metalness: 0.25 });
  const tv = new THREE.Group();
  tv.position.set(-1.8, 4.2, 2.2);       // raised + forward to clear the pipe at the doubled size
  tv.rotation.x = -0.3;
  tv.scale.setScalar(2);                 // doubled TV size
  yawGroup.add(tv);

  const tvBody = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.35, 1.35), plasticMat);
  tvBody.castShadow = true; tv.add(tvBody);
  const tvBack = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.7, 0.9), plasticMat);
  tvBack.position.z = -0.95; tv.add(tvBack);
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(3.72, 2.1, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x363b45, roughness: 0.45, metalness: 0.4 })
  );
  bezel.position.z = 0.66; tv.add(bezel);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 1.7),
    new THREE.MeshBasicMaterial({ map: dispTex, transparent: true })
  );
  screen.position.z = 0.77; tv.add(screen);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 1.7),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glass.position.z = 0.78; tv.add(glass);
  const screenLight = new THREE.PointLight(0x5dffb0, 0.7, 6, 2);
  screenLight.position.set(0, 0, 1.4); tv.add(screenLight);
  // power LED + control knobs
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff5a5a }));
  led.position.set(-1.6, -0.95, 0.7); tv.add(led);
  for (let i = 0; i < 3; i++) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 12), matChrome);
    knob.rotation.x = Math.PI / 2; knob.position.set(1.6, 0.65 - i * 0.4, 0.7); tv.add(knob);
  }
  // rabbit-ear antennas
  for (const s of [-1, 1]) {
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6), matChrome);
    ant.position.set(0.6 * s, 1.9, -0.4); ant.rotation.z = s * 0.5; tv.add(ant);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), matChrome);
    tip.position.set(0.6 * s + s * 0.5, 2.8, -0.4); tv.add(tip);
  }
  // mounting mast: tall vertical post + forward boom to the big TV
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.4, 0.5), matGunmetal);
  post.position.set(-1.8, 1.7, 0.7); post.castShadow = true; yawGroup.add(post);
  const boom = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 2.4), matGunmetal);
  boom.position.set(-1.8, 3.2, 1.5); boom.castShadow = true; yawGroup.add(boom);

  /* ---- holo projector that beams the protractor into view ---- */
  const projHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.5, 16), matGunmetal);
  projHousing.position.set(0.7, 1.95, 0.45); yawGroup.add(projHousing);
  const projLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.19, 20),
    new THREE.MeshBasicMaterial({ color: 0x0a3540 })
  );
  projLens.position.set(0.7, 2.16, 0.45); projLens.rotation.x = -Math.PI / 2 + 0.12; yawGroup.add(projLens);

  const beamGeo = new THREE.ConeGeometry(7, 13, 30, 1, true);
  beamGeo.rotateX(Math.PI); beamGeo.translate(0, 6.5, 0);   // apex at base, widening upward
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
    color: 0x46d8ff, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  beam.position.set(0.7, 2.1, 0.45); beam.rotation.x = -0.12; beam.visible = false;
  yawGroup.add(beam);

  const spot = new THREE.SpotLight(0x66e0ff, 0, 34, 1.15, 0.6, 1.2);
  spot.position.set(0.7, 2.1, 0.45);
  spot.target.position.set(0, 11, -3);
  yawGroup.add(spot); yawGroup.add(spot.target);

  /* ---- API ---- */
  return {
    yawGroup,
    pitchGroup,
    setAim(phiDeg, thetaDeg) {
      yawGroup.rotation.y = -phiDeg * DEG;
      pitchGroup.rotation.z = thetaDeg * DEG;
    },
    setDisplay(text) { dispText = text; },
    setBeam(on) {
      beam.visible = on;
      spot.intensity = on ? 9 : 0;
      projLens.material.color.set(on ? 0x46d8ff : 0x0a3540);
    },
    getMuzzleWorld(out = new THREE.Vector3()) {
      return dockedSlot.getWorldPosition(out);
    },
    flash() {
      muzzleGlow.material.opacity = 1;
      muzzleLight.intensity = 8;
    },
    update(dt) {
      if (muzzleGlow.material.opacity > 0) {
        muzzleGlow.material.opacity = Math.max(
          0,
          muzzleGlow.material.opacity - dt * 5,
        );
        muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * 30);
      }
      notch.material.emissiveIntensity =
        0.8 + Math.sin(Date.now() * 0.01) * 0.4;
      // animate the radar sweep on the TV (throttled to ~30fps)
      sweepAng = (sweepAng + dt * 2.0) % TWO_PI;
      dispAccum += dt;
      if (dispAccum >= 0.033) { dispAccum = 0; drawRadarDisplay(); }
    },
  };
}
