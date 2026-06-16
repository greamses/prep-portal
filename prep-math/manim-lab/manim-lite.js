/* ═══════════════════════════════════════════════════════════
   PREP PORTAL — Manim-Lite (hybrid animated math, proof-of-concept)
   ───────────────────────────────────────────────────────────
   Demonstrates the "hybrid" approach: one GSAP timeline drives BOTH
   • the symbolic worked solution (MathJax-rendered steps), and
   • a coordinate graph (canvas) — in lockstep.

   The scene here is a parametric template for linear equations
   ax + b = c. A real product would add one such template per topic
   (quadratics, circle theorems, trig graphs, …); the engine below
   (state object + render() + GSAP-tweened progress vars) is reusable.
   ═══════════════════════════════════════════════════════════ */

'use strict';

(function () {
  const canvas = document.getElementById('graph');
  const ctx = canvas.getContext('2d');
  const stepsEl = document.getElementById('steps');
  const playBtn = document.getElementById('play-btn');
  const eqInput = document.getElementById('eq-input');
  const presetWrap = document.getElementById('presets');

  // ── Theme colours (read once from CSS custom properties) ──────────
  const css = getComputedStyle(document.documentElement);
  const cvar = (n, f) => (css.getPropertyValue(n).trim() || f);
  const COL = {
    ink:   cvar('--ink', '#2a2723'),
    sub:   cvar('--text-secondary', '#6b655c'),
    line1: cvar('--accent-secondary', '#6fb7e8'),
    line2: cvar('--accent-danger', '#f07a7a'),
    dot:   cvar('--accent-primary', '#f4c95d'),
    grid:  'rgba(120,110,95,.14)'
  };

  // ── Animation state: render() draws purely from this; GSAP tweens it ─
  const state = { W: 0, H: 0, axis: 0, line1: 0, line2: 0, dot: 0, drop: 0, a: 2, b: 3, c: 11 };
  let view = { xmin: -1, xmax: 6, ymin: -2, ymax: 14 };
  let tl = null;
  let currentScene = null;

  const PAD = 30;
  const X = (x) => PAD + ((x - view.xmin) / (view.xmax - view.xmin)) * (state.W - 2 * PAD);
  const Y = (y) => (state.H - PAD) - ((y - view.ymin) / (view.ymax - view.ymin)) * (state.H - 2 * PAD);

  function computeView(a, b, c) {
    const xs = (c - b) / a;
    const xmin = Math.min(0, xs) - 2, xmax = Math.max(0, xs) + 2;
    const ys = [a * xmin + b, a * xmax + b, c, 0, b];
    view = { xmin, xmax, ymin: Math.min.apply(null, ys) - 2, ymax: Math.max.apply(null, ys) + 2 };
  }

  function niceStep(raw) {
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / pow;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * pow;
  }

  // ── DPI-aware sizing ──────────────────────────────────────────────
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.W = rect.width; state.H = rect.height;
    render();
  }

  // ── Drawing primitives ────────────────────────────────────────────
  function drawGrid() {
    const xs = niceStep((view.xmax - view.xmin) / 8);
    const ys = niceStep((view.ymax - view.ymin) / 8);
    ctx.lineWidth = 1; ctx.strokeStyle = COL.grid;
    ctx.beginPath();
    for (let x = Math.ceil(view.xmin / xs) * xs; x <= view.xmax; x += xs) { ctx.moveTo(X(x), Y(view.ymin)); ctx.lineTo(X(x), Y(view.ymax)); }
    for (let y = Math.ceil(view.ymin / ys) * ys; y <= view.ymax; y += ys) { ctx.moveTo(X(view.xmin), Y(y)); ctx.lineTo(X(view.xmax), Y(y)); }
    ctx.stroke();
  }

  function drawAxes(p) {
    ctx.save();
    ctx.globalAlpha = p;
    ctx.lineWidth = 2; ctx.strokeStyle = COL.sub;
    ctx.beginPath();
    ctx.moveTo(X(view.xmin), Y(0)); ctx.lineTo(X(view.xmax), Y(0));  // x-axis
    ctx.moveTo(X(0), Y(view.ymin)); ctx.lineTo(X(0), Y(view.ymax));  // y-axis
    ctx.stroke();
    ctx.restore();
  }

  function drawFn(fn, color, p, label) {
    const x0 = view.xmin, x1 = view.xmin + p * (view.xmax - view.xmin);
    ctx.lineWidth = 3; ctx.strokeStyle = color; ctx.lineJoin = 'round';
    ctx.beginPath();
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const x = x0 + (x1 - x0) * (i / N);
      const px = X(x), py = Y(fn(x));
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    if (p > 0.98 && label) {
      ctx.fillStyle = color; ctx.font = '600 12px ' + cvar('--font-mono', 'monospace');
      ctx.fillText(label, X(x1) - 4, Y(fn(x1)) - 8);
    }
  }

  function drawDot(px, py) {
    ctx.save();
    ctx.shadowColor = COL.dot; ctx.shadowBlur = 12;
    ctx.fillStyle = COL.dot; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.stroke();
  }

  function drawDrop(xs, p) {
    const yTop = Y(state.c), yBot = Y(0);
    ctx.save();
    ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.strokeStyle = COL.dot;
    ctx.beginPath();
    ctx.moveTo(X(xs), yTop); ctx.lineTo(X(xs), yTop + (yBot - yTop) * p);
    ctx.stroke();
    ctx.restore();
    if (p > 0.9) {
      ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.arc(X(xs), Y(0), 4, 0, Math.PI * 2); ctx.fill();
      ctx.font = '700 13px ' + cvar('--font-mono', 'monospace');
      ctx.fillStyle = COL.ink;
      const label = 'x = ' + (Number.isInteger(xs) ? xs : xs.toFixed(2));
      ctx.fillText(label, X(xs) + 8, Y(0) + 18);
    }
  }

  function render() {
    if (!state.W) return;
    ctx.clearRect(0, 0, state.W, state.H);
    drawGrid();
    drawAxes(state.axis);
    if (state.line1 > 0) drawFn((x) => state.a * x + state.b, COL.line1, state.line1, 'y = ax+b');
    if (state.line2 > 0) drawFn(() => state.c, COL.line2, state.line2, 'y = c');
    if (state.dot > 0) {
      const xs = (state.c - state.b) / state.a, x0 = view.xmin;
      const x = x0 + state.dot * (xs - x0);
      drawDot(X(x), Y(state.a * x + state.b));
    }
    if (state.drop > 0) drawDrop((state.c - state.b) / state.a, state.drop);
  }

  // ── Scene: linear equation ax + b = c ─────────────────────────────
  const coef = (a) => a === 1 ? '' : a === -1 ? '-' : String(a);
  const signed = (n) => n < 0 ? '- ' + Math.abs(n) : '+ ' + n;

  function buildLinearSteps(a, b, c) {
    const steps = [];
    if (b !== 0) {
      steps.push(`${coef(a)}x ${signed(b)} = ${c}`);
      steps.push(`${coef(a)}x = ${c} ${signed(-b)}`);
      steps.push(`${coef(a)}x = ${c - b}`);
    } else {
      steps.push(`${coef(a)}x = ${c}`);
    }
    // When a !== 1 we show the division then the value. When a === 1 the
    // previous line ("x = c - b") is already the answer, so don't duplicate it.
    if (a !== 1) {
      steps.push(`x = \\frac{${c - b}}{${a}}`);
      const val = (c - b) / a;
      steps.push(`x = ${Number.isInteger(val) ? val : val.toFixed(2)}`);
    }
    return steps;
  }

  function makeScene(a, b, c) {
    return { a, b, c, hasMove: b !== 0, hasDiv: a !== 1, steps: buildLinearSteps(a, b, c) };
  }

  function parseLinear(str) {
    const s = (str || '').replace(/\s+/g, '').replace(/−/g, '-').toLowerCase();
    const m = s.match(/^([+-]?\d*)x([+-]\d+)?=([+-]?\d+)$/);
    if (!m) return null;
    let a = m[1]; a = (a === '' || a === '+') ? 1 : (a === '-' ? -1 : parseInt(a, 10));
    const b = m[2] ? parseInt(m[2], 10) : 0;
    const c = parseInt(m[3], 10);
    if (!a || isNaN(c)) return null;
    return makeScene(a, b, c);
  }

  function renderSteps(latexArr) {
    stepsEl.innerHTML = '';
    const nodes = latexArr.map((tex) => {
      const d = document.createElement('div');
      d.className = 'step';
      d.innerHTML = `\\(${tex}\\)`;
      stepsEl.appendChild(d);
      return d;
    });
    const done = (window.MathJax && MathJax.typesetPromise) ? MathJax.typesetPromise([stepsEl]) : Promise.resolve();
    return done.then(() => nodes);
  }

  // ── Static "poster" (fully drawn) so the stage is never blank ──────
  function loadScene(scene, poster) {
    currentScene = scene;
    computeView(scene.a, scene.b, scene.c);
    Object.assign(state, { a: scene.a, b: scene.b, c: scene.c });
    const v = poster ? 1 : 0;
    Object.assign(state, { axis: v, line1: v, line2: v, dot: v, drop: v });
    render();
    renderSteps(scene.steps).then((nodes) => { if (poster) gsap.set(nodes, { opacity: 1, y: 0 }); else gsap.set(nodes, { opacity: 0, y: 10 }); });
  }

  // ── Play: GSAP timeline drives state (graph) + step reveals in sync ─
  function play(scene) {
    if (!scene) return;
    if (tl) tl.kill();
    currentScene = scene;
    computeView(scene.a, scene.b, scene.c);
    Object.assign(state, { a: scene.a, b: scene.b, c: scene.c, axis: 0, line1: 0, line2: 0, dot: 0, drop: 0 });
    render();

    renderSteps(scene.steps).then((nodes) => {
      const N = nodes.length;
      gsap.set(nodes, { opacity: 0, y: 10 });
      tl = gsap.timeline({ defaults: { ease: 'power2.out' }, onUpdate: render });
      tl.to(state, { axis: 1, duration: .7 });
      tl.to(nodes[0], { opacity: 1, y: 0, duration: .4 }, '<');             // equation appears with axes
      tl.to(state, { line1: 1, duration: .9 }, '>-0.1');                    // draw y = ax + b
      for (let k = 1; k < N - 1; k++)                                       // intermediate working
        tl.to(nodes[k], { opacity: 1, y: 0, duration: .35 });
      tl.to(state, { line2: 1, duration: .7 }, '>-0.05');                   // draw y = c
      tl.to(state, { dot: 1, duration: 1.0 }, '>-0.05');                    // dot rides to intersection
      tl.to(nodes[N - 1], { opacity: 1, y: 0, duration: .4 }, '>-0.2');     // final answer
      tl.to(state, { drop: 1, duration: .6 }, '<');                        // dashed drop + solution
    });
  }

  // ── Wiring ────────────────────────────────────────────────────────
  function setActiveChip(chip) {
    presetWrap.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === chip));
  }

  presetWrap.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const scene = parseLinear(chip.dataset.eq);
      if (!scene) return;
      setActiveChip(chip);
      eqInput.value = '';
      play(scene);
    });
  });

  eqInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const scene = parseLinear(eqInput.value);
    if (!scene) { eqInput.style.borderColor = COL.line2; return; }
    eqInput.style.borderColor = '';
    setActiveChip(null);
    play(scene);
  });

  playBtn.addEventListener('click', () => {
    const scene = parseLinear(eqInput.value) || currentScene;
    play(scene);
  });

  window.addEventListener('resize', resizeCanvas);

  // Boot: size the canvas, then show the first preset as a static poster.
  function boot() {
    resizeCanvas();
    const start = parseLinear('2x+3=11');
    const show = () => loadScene(start, true);
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(show);
    else setTimeout(show, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
