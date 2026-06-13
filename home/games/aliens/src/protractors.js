// protractors.js — the hero: one big vertical 180° protractor
import * as THREE from 'three';
import { DEG, CONFIG } from './config.js';

const R = CONFIG.protractorR;

export function buildProtractor(scene) {
  const group = new THREE.Group();
  group.position.z = -0.4;
  group.visible = false;          // hidden on entry; toggled from settings
  scene.add(group);

  /* ---- graduated arc texture on a plane ---- */
  const W = 2048, H = 1024;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const cx = W / 2, cy = H - 8;
  const ppu = (W - 40) / (2 * R);
  const PX = (a, rw) => ({ x: cx + rw * ppu * Math.cos(a * DEG), y: cy - rw * ppu * Math.sin(a * DEG) });

  // soft band under the arc
  g.beginPath();
  g.moveTo(PX(0, R).x, PX(0, R).y);
  g.arc(cx, cy, R * ppu, Math.PI, 0);
  g.arc(cx, cy, (R - 1.5) * ppu, 0, Math.PI, true);
  g.closePath();
  g.fillStyle = 'rgba(60, 180, 230, 0.06)';
  g.fill();

  // arcs
  g.strokeStyle = 'rgba(150, 225, 255, 0.85)';
  g.lineWidth = 4;
  g.beginPath(); g.arc(cx, cy, R * ppu, Math.PI, 0); g.stroke();
  g.lineWidth = 2;
  g.beginPath(); g.arc(cx, cy, (R - 1.5) * ppu, Math.PI, 0); g.stroke();
  // baseline
  g.beginPath(); g.moveTo(cx - R * ppu, cy); g.lineTo(cx + R * ppu, cy); g.stroke();

  for (let a = 0; a <= 180; a++) {
    const major = a % 10 === 0, mid = a % 5 === 0;
    const len = major ? 0.8 : mid ? 0.45 : 0.22;
    const s = PX(a, R), e = PX(a, R - len);
    g.strokeStyle = major ? 'rgba(180,235,255,0.95)' : 'rgba(150,210,235,0.6)';
    g.lineWidth = major ? 3 : mid ? 2 : 1;
    g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(e.x, e.y); g.stroke();
    if (major) {
      const t = PX(a, R - 1.15);
      g.save(); g.translate(t.x, t.y); g.rotate((90 - a) * DEG);
      g.fillStyle = a % 30 === 0 ? 'rgba(255,255,255,0.98)' : 'rgba(170,220,245,0.8)';
      g.font = `${a % 30 === 0 ? 'bold ' : ''}${a % 30 === 0 ? 40 : 30}px 'JetBrains Mono', monospace`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(a), 0, 0);
      g.restore();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * R + 0.4, R + 0.1),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.96, depthWrite: false })
  );
  plane.position.set(0, (R + 0.1) / 2 - 0.05, 0);
  group.add(plane);

  /* ---- aim line (always shows where the cannon points) ---- */
  const aim = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, R - 0.5, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd24d, transparent: true, opacity: 0.7, depthWrite: false })
  );
  beam.rotation.z = -Math.PI / 2; beam.position.x = (R - 0.5) / 2;
  aim.add(beam);
  aim.position.z = 0.25;
  group.add(aim);

  /* ---- target marker (assist only): glowing notch on the rim ---- */
  const target = new THREE.Group();
  const tri = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 1.1, 4),
    new THREE.MeshBasicMaterial({ color: 0xff6b6b })
  );
  tri.position.x = R - 0.3; tri.rotation.z = Math.PI / 2;     // points inward
  target.add(tri);
  const tdot = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.08, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xff6b6b })
  );
  tdot.position.x = R; target.add(tdot);
  target.position.z = 0.3;
  group.add(target);

  return {
    group,
    setVisible(on) { group.visible = on; },
    setCurrent(deg) { aim.rotation.z = deg * DEG; },
    setTarget(deg) { target.rotation.z = deg * DEG; },
    pulse(t) {
      if (!group.visible) return;
      target.scale.setScalar(1 + Math.sin(t * 5) * 0.12);
    },
  };
}
