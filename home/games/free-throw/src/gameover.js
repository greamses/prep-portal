/**
 * Game Over Screen — 3D pie chart with drag rotation.
 * Colours and typography match the site's dark-mode design tokens.
 *   Swishes → accent-primary  #f0cf6e (warm gold)
 *   Makes   → accent-success  #8ace8a (green)
 *   Misses  → accent-danger   #f08a8a (red)
 */
import * as THREE from 'three';
import { heroPaint } from '../../../../utils/components/nav-icons.js';

/* ---------- Slice geometry (ExtrudeGeometry wedge, all faces closed) ---------- */
function buildSliceGeo(R, height, thetaStart, thetaLen) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.absarc(0, 0, R, thetaStart, thetaStart + thetaLen, false);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
    curveSegments: 48,
  });

  // Shape is in XY; extrude along +Z.
  // Rotate so the pie lies flat in XZ, extrusion along +Y.
  geo.rotateX(-Math.PI / 2);
  // After rotation: bottom at y=0, top at y=height — centre vertically.
  geo.translate(0, -height / 2, 0);
  return geo;
}

/* ---------- Main class ---------- */
export class GameOverScreen {
  constructor() {
    this._overlay    = null;
    this._renderer   = null;
    this._scene      = null;
    this._camera     = null;
    this._group      = null;
    this._animId     = null;
    this._t          = 0;
    this._isDragging = false;
    this._lastDragX  = 0;
    this._dragCleanup = null;
  }

  /**
   * stats: { score, made, attempts, streak, bestStreak, swishes }
   * onRestart: called when "Play Again" is clicked
   */
  show(stats, onRestart) {
    const swishes  = stats.swishes || 0;
    const makes    = Math.max((stats.made    || 0) - swishes, 0);
    const misses   = Math.max((stats.attempts || 0) - (stats.made || 0), 0);
    const accuracy = (stats.attempts || 0) > 0
      ? Math.round((stats.made / stats.attempts) * 100) : 0;

    this._buildOverlay({ ...stats, swishes, makes, misses, accuracy }, onRestart);

    // Build chart after a frame so the canvas has laid out its dimensions.
    requestAnimationFrame(() => {
      this._buildChart({ swishes, makes, misses, total: Math.max(stats.attempts || 0, 1) });
      this._tick();
    });
  }

  destroy() {
    if (this._animId)      { cancelAnimationFrame(this._animId); this._animId = null; }
    if (this._dragCleanup) { this._dragCleanup(); this._dragCleanup = null; }
    if (this._overlay)     { this._overlay.remove(); this._overlay = null; }
    if (this._renderer)    { this._renderer.dispose(); this._renderer = null; }
    this._scene = this._camera = this._group = null;
  }

  /* ---------- HTML overlay ---------- */
  _buildOverlay(d, onRestart) {
    const el = document.createElement('div');
    el.id = 'go-overlay';
    el.innerHTML = `
      <div class="go-panel">
        <div class="go-paint" aria-hidden="true">${heroPaint()}</div>
        <div class="go-panel-inner">
          <div class="go-eyebrow">TIME'S UP</div>
          <div class="go-score-num">${d.score}</div>
          <div class="go-score-lbl">POINTS</div>

          <div class="go-chart-wrap">
            <canvas id="go-canvas" class="go-canvas"></canvas>
            <span class="go-drag-hint">DRAG TO ROTATE</span>
          </div>

          <div class="go-legend">
            <div class="go-legend-row">
              <span class="go-dot" style="background:#f0cf6e"></span>
              <span class="go-lgnd-txt">${d.swishes}&nbsp;Swish${d.swishes !== 1 ? 'es' : ''}&nbsp;&nbsp;&middot;&nbsp;&nbsp;${d.swishes * 3} pts</span>
            </div>
            <div class="go-legend-row">
              <span class="go-dot" style="background:#8ace8a"></span>
              <span class="go-lgnd-txt">${d.makes}&nbsp;Make${d.makes !== 1 ? 's' : ''}&nbsp;&nbsp;&middot;&nbsp;&nbsp;${d.makes * 2} pts</span>
            </div>
            <div class="go-legend-row">
              <span class="go-dot" style="background:#f08a8a"></span>
              <span class="go-lgnd-txt">${d.misses}&nbsp;Miss${d.misses !== 1 ? 'es' : ''}</span>
            </div>
          </div>

          <div class="go-stats">
            <div class="go-stat-box">
              <div class="go-stat-v">${d.accuracy}%</div>
              <div class="go-stat-l">ACCURACY</div>
            </div>
            <div class="go-stat-box">
              <div class="go-stat-v">${d.attempts || 0}</div>
              <div class="go-stat-l">SHOTS</div>
            </div>
            <div class="go-stat-box">
              <div class="go-stat-v">${d.bestStreak || 0}</div>
              <div class="go-stat-l">TOP STREAK</div>
            </div>
          </div>

          <button class="go-btn" id="go-restart">PLAY AGAIN</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    this._overlay = el;

    requestAnimationFrame(() => el.classList.add('go-visible'));

    el.querySelector('#go-restart').addEventListener('click', () => {
      el.classList.remove('go-visible');
      setTimeout(() => { this.destroy(); onRestart(); }, 350);
    });
  }

  /* ---------- Three.js pie chart ---------- */
  _buildChart({ swishes, makes, misses, total }) {
    const canvas = document.getElementById('go-canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const W = Math.max(Math.round(rect.width), 260);
    const H = Math.max(Math.round(rect.height), 190);
    canvas.width  = W;
    canvas.height = H;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);
    this._renderer = renderer;

    const scene = new THREE.Scene();
    this._scene  = scene;

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 50);
    camera.position.set(0, 3.4, 5.2);
    camera.lookAt(0, 0, 0);
    this._camera = camera;

    // Lighting — warm key, cool fill, soft bottom bounce
    scene.add(new THREE.AmbientLight(0xefece3, 0.45));
    const key = new THREE.DirectionalLight(0xfff8e8, 1.1);
    key.position.set(5, 10, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x7cc0ec, 0.28);
    fill.position.set(-5, 4, -4);
    scene.add(fill);
    const bounce = new THREE.DirectionalLight(0xf0b074, 0.18);
    bounce.position.set(0, -6, 3);
    scene.add(bounce);

    // Thin base disc — surface-secondary colour
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.85, 1.85, 0.05, 64),
      new THREE.MeshStandardMaterial({ color: 0x26231d, roughness: 0.7, metalness: 0.2 })
    );
    platform.position.y = -0.48;
    scene.add(platform);

    // Group that holds all slices (rotated together)
    const group = new THREE.Group();
    scene.add(group);
    this._group = group;

    // Slice definitions — filtered to non-zero counts only
    let sliceData = [
      {
        count: swishes,
        color:   0xf0cf6e, // accent-primary  (yellow-gold)
        emissive: new THREE.Color(0.18, 0.12, 0.0),
        height: 0.55,
      },
      {
        count: makes,
        color:   0x8ace8a, // accent-success  (green)
        emissive: new THREE.Color(0.0,  0.18, 0.06),
        height: 0.40,
      },
      {
        count: misses,
        color:   0xf08a8a, // accent-danger   (red)
        emissive: new THREE.Color(0.18, 0.0,  0.0),
        height: 0.28,
      },
    ].filter(d => d.count > 0);

    // If no shots taken, show a single muted disc
    if (sliceData.length === 0) {
      sliceData = [{ count: 1, color: 0x3a3a5a, emissive: new THREE.Color(0.05, 0.05, 0.1), height: 0.35 }];
      total = 1;
    }

    const R   = 1.5;  // outer radius
    const GAP = 0.04; // radian gap between slices
    let angle = -Math.PI / 2; // 12 o'clock start

    sliceData.forEach((d, i) => {
      const fraction = d.count / total;
      const arcLen   = Math.max(fraction * Math.PI * 2 - GAP, 0.01);
      const tStart   = angle + GAP / 2;
      const mid      = tStart + arcLen / 2;

      const mesh = new THREE.Mesh(
        buildSliceGeo(R, d.height, tStart, arcLen),
        new THREE.MeshStandardMaterial({
          color:            d.color,
          emissive:         d.emissive,
          emissiveIntensity: 0.25,
          roughness: 0.28,
          metalness: 0.32,
        })
      );

      // Explode slightly outward from centre
      // Angle `mid` in XY maps to (cos, 0, -sin) in XZ after the rotateX(-π/2)
      mesh.position.set(Math.cos(mid) * 0.08, -5, -Math.sin(mid) * 0.08);
      mesh.userData.delay = i * 0.14;

      group.add(mesh);
      angle += fraction * Math.PI * 2;
    });

    this._t = 0;
    this._addDragRotation(canvas);
  }

  /* ---------- Drag-to-rotate (mouse + touch) ---------- */
  _addDragRotation(canvas) {
    const hint = this._overlay?.querySelector('.go-drag-hint');

    const onDown = (x) => {
      this._isDragging = true;
      this._lastDragX  = x;
      canvas.style.cursor = 'grabbing';
      // Fade the hint the first time the user drags
      if (hint) hint.style.opacity = '0';
    };

    const onMove = (x) => {
      if (!this._isDragging || !this._group) return;
      this._group.rotation.y += (x - this._lastDragX) * 0.008;
      this._lastDragX = x;
    };

    const onUp = () => {
      this._isDragging = false;
      canvas.style.cursor = 'grab';
    };

    // Named handlers so we can remove them on destroy
    const _mm = e => onMove(e.clientX);
    const _mu = ()  => onUp();
    const _ts = e => { e.preventDefault(); onDown(e.touches[0].clientX); };
    const _tm = e => { e.preventDefault(); onMove(e.touches[0].clientX); };
    const _te = ()  => onUp();

    canvas.addEventListener('mousedown', e => onDown(e.clientX));
    window.addEventListener('mousemove', _mm);
    window.addEventListener('mouseup',   _mu);
    canvas.addEventListener('touchstart', _ts, { passive: false });
    canvas.addEventListener('touchmove',  _tm, { passive: false });
    canvas.addEventListener('touchend',   _te);

    this._dragCleanup = () => {
      window.removeEventListener('mousemove', _mm);
      window.removeEventListener('mouseup',   _mu);
    };
  }

  /* ---------- Render loop ---------- */
  _tick() {
    this._animId = requestAnimationFrame(() => this._tick());
    this._t += 0.016;

    if (this._group) {
      // Entry animation — slices rise from below with staggered cubic ease-out
      this._group.children.forEach(mesh => {
        const raw  = (this._t - (mesh.userData.delay || 0)) / 0.55;
        const t    = Math.max(0, Math.min(1, raw));
        const ease = 1 - Math.pow(1 - t, 3);
        // preserve XZ explode offset, animate Y from -5 → 0
        mesh.position.y = -5 * (1 - ease);
      });

      // Slow auto-rotation pauses while the user is dragging
      if (!this._isDragging) {
        this._group.rotation.y += 0.004;
      }
    }

    if (this._renderer) this._renderer.render(this._scene, this._camera);
  }
}
