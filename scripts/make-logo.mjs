/* Generates the Prep Portal logo — five large amoeba "paws" radiating around a
   centre, with a subtle whirl (a spiral that reads quietly as a P/O loop) in
   the middle. Paw blobs use the site's seeded paint algorithm (see
   utils/components/nav-icons.js) so the mark is made of the same paint.
   Run:  node scripts/make-logo.mjs  → writes logo/logo-{light,dark,loading}.svg */
import { writeFileSync } from "node:fs";

const rnd = (s) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// same jitter as heroPaint()/amoebaPath()
function amoeba(r, seed, n = 10) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.72 + 0.34 * rnd(seed * 7.3 + i));
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const f = (v) => v.toFixed(1);
  const s = mid(pts[n - 1], pts[0]);
  let d = `M ${f(s[0])} ${f(s[1])} `;
  for (let i = 0; i < n; i++) {
    const c = pts[i];
    const m = mid(c, pts[(i + 1) % n]);
    d += `Q ${f(c[0])} ${f(c[1])} ${f(m[0])} ${f(m[1])} `;
  }
  return d + "Z";
}

const blob = ({ cx, cy, r, seed, sx = 1, sy = 1, rot = 0, fill, n = 10 }) =>
  `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${sx} ${sy})"><path d="${amoeba(r, seed, n)}" fill="${fill}"/></g>`;

// five large paws radiating from the centre
function paws(cols, { R = 25, r = 16, sx = 1.0, sy = 0.95, lean = 10 } = {}) {
  let out = "";
  for (let i = 0; i < 5; i++) {
    const base = -90 + i * 72; // first paw points up
    const rad = (base * Math.PI) / 180;
    const cx = 50 + Math.cos(rad) * R;
    const cy = 50 + Math.sin(rad) * R;
    out += blob({ cx, cy, r, seed: 3 + i * 9, sx, sy, rot: base + 90 + lean, fill: cols[i], n: 10 });
  }
  return out;
}

// the central whirl — an Archimedean spiral, ~1.8 turns, stroked.
// It quietly suggests the loop of a P / O without announcing it.
function whirl(stroke, { turns = 1.15, r0 = 4.5, r1 = 11, steps = 90, rot = -20, w = 3.2 } = {}) {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = (rot * Math.PI) / 180 + t * turns * Math.PI * 2;
    const rr = r0 + (r1 - r0) * t;
    const x = 50 + Math.cos(ang) * rr;
    const y = 50 + Math.sin(ang) * rr;
    d += (i === 0 ? "M " : "L ") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  }
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

const open = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Prep Portal">`;
const close = `</svg>`;

// blue · yellow · coral · green · orange
const LIGHT = ["#6fb7e8", "#f4c95d", "#f07a7a", "#7cc47c", "#f0a868"];
const DARK  = ["#7cc0ec", "#f0cf6e", "#f08a8a", "#8ace8a", "#f0b074"];
const WHIRL_LIGHT = "#2a2723";
const WHIRL_DARK  = "#efece3";

const mark = (cols, ws) => open + paws(cols) + whirl(ws) + close + "\n";

writeFileSync("logo/logo-light.svg",   mark(LIGHT, WHIRL_LIGHT));
writeFileSync("logo/logo-dark.svg",    mark(DARK,  WHIRL_DARK));
writeFileSync("logo/logo-loading.svg", mark(DARK,  WHIRL_DARK));
console.log("wrote logo-light / logo-dark / logo-loading (5 paws + whirl)");
