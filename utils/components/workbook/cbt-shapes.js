/* ============================================================================
   SHAPE AND PATTERN FILMS FOR CBT QUESTIONS
   ----------------------------------------------------------------------------
     stairs-24   Scholastic upper primary 2022 first round, Q24: "Ololade can
                 build this set of 3 stairs with 12 blocks. How many blocks
                 will she need to build a set of 6 stairs?" (42)
                 Method 1, look from the side: 1 + 2 + 3 = 6 squares, so the
                 staircase is 12 / 6 = 2 deep; 1 + ... + 6 = 21, times 2.
                 Method 2, make a rectangle: the back layer turned upside down
                 on the front fills n by (n + 1): 3 x 4 = 12, so 6 x 7 = 42.

   Same layout and kit as ./cbt-films.js: the question small at the top, the
   one picture being worked in the centre, extra sums in the margin, the method
   on a receipt, MathJax, sounds, a title card before each method.
   ========================================================================== */

import { braceOf, film } from "./film-kit.js";
import { mathLoad, texAt } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W } from "./cbt-films.js";

const INK = "#2a2723", RED = "#c0453f", BLUE = "#2f6f8f", GREEN = "#2f7d4a";
const FRONT = "#bfe3ff", BACK = "#ffd9cf";

/* the question's own drawing of the 3-stair staircase (12 cubes, 2 deep) */
const ISO = `<path d="M28.8,92.0 L49.6,104.0 L49.6,80.0 L28.8,68.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,92.0 L49.6,104.0 L49.6,80.0 L70.4,68.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,56.0 L70.4,68.0 L49.6,80.0 L28.8,68.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,68.0 L49.6,80.0 L49.6,56.0 L28.8,44.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,68.0 L49.6,80.0 L49.6,56.0 L70.4,44.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,32.0 L70.4,44.0 L49.6,56.0 L28.8,44.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,44.0 L49.6,56.0 L49.6,32.0 L28.8,20.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,44.0 L49.6,56.0 L49.6,32.0 L70.4,20.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,8.0 L70.4,20.0 L49.6,32.0 L28.8,20.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M8.0,104.0 L28.8,116.0 L28.8,92.0 L8.0,80.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,104.0 L28.8,116.0 L28.8,92.0 L49.6,80.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,68.0 L49.6,80.0 L28.8,92.0 L8.0,80.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,104.0 L70.4,116.0 L70.4,92.0 L49.6,80.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M91.1,104.0 L70.4,116.0 L70.4,92.0 L91.1,80.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,68.0 L91.1,80.0 L70.4,92.0 L49.6,80.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M8.0,80.0 L28.8,92.0 L28.8,68.0 L8.0,56.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,80.0 L28.8,92.0 L28.8,68.0 L49.6,56.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,44.0 L49.6,56.0 L28.8,68.0 L8.0,56.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,80.0 L70.4,92.0 L70.4,68.0 L49.6,56.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M91.1,80.0 L70.4,92.0 L70.4,68.0 L91.1,56.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,44.0 L91.1,56.0 L70.4,68.0 L49.6,56.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M8.0,56.0 L28.8,68.0 L28.8,44.0 L8.0,32.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,56.0 L28.8,68.0 L28.8,44.0 L49.6,32.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,20.0 L49.6,32.0 L28.8,44.0 L8.0,32.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,116.0 L49.6,128.0 L49.6,104.0 L28.8,92.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,116.0 L49.6,128.0 L49.6,104.0 L70.4,92.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,80.0 L70.4,92.0 L49.6,104.0 L28.8,92.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,116.0 L91.1,128.0 L91.1,104.0 L70.4,92.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M111.9,116.0 L91.1,128.0 L91.1,104.0 L111.9,92.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M91.1,80.0 L111.9,92.0 L91.1,104.0 L70.4,92.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,92.0 L49.6,104.0 L49.6,80.0 L28.8,68.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,92.0 L49.6,104.0 L49.6,80.0 L70.4,68.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,56.0 L70.4,68.0 L49.6,80.0 L28.8,68.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,128.0 L70.4,140.0 L70.4,116.0 L49.6,104.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M91.1,128.0 L70.4,140.0 L70.4,116.0 L91.1,104.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,92.0 L91.1,104.0 L70.4,116.0 L49.6,104.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>`;

/* a staircase seen from the side: column i is i squares high, built from the bottom */
function profile(n, cell, ox, oy, key = "c") {
  let out = "";
  for (let i = 1; i <= n; i++) {
    for (let h = 1; h <= i; h++) {
      out += `<rect data-mb="cell" data-k="${key}${i}_${h}" x="${(ox + (i - 1) * cell).toFixed(2)}" y="${(oy - h * cell).toFixed(2)}" width="${cell}" height="${cell}" fill="${FRONT}" stroke="${INK}" stroke-width="0.5"/>`;
    }
    out += texAt(String(i), ox + (i - 0.5) * cell, oy + cell * 0.95, { em: Math.min(6, cell * 0.75), color: BLUE, attrs: `data-mb="num" data-k="${key}n${i}"` });
  }
  return out;
}

/* the front layer and the back layer turned upside down on top of it: n across, n + 1 up */
function rectangle(n, cell, ox, oy) {
  let out = "";
  for (let i = 1; i <= n; i++) {
    for (let h = 1; h <= i; h++) {
      out += `<rect data-mb="cell" data-k="f${i}_${h}" x="${(ox + (i - 1) * cell).toFixed(2)}" y="${(oy - h * cell).toFixed(2)}" width="${cell}" height="${cell}" fill="${FRONT}" stroke="${INK}" stroke-width="0.5"/>`;
    }
    for (let h = i + 1; h <= n + 1; h++) {
      out += `<rect data-mb="cell" data-k="b${i}_${h}" x="${(ox + (i - 1) * cell).toFixed(2)}" y="${(oy - h * cell).toFixed(2)}" width="${cell}" height="${cell}" fill="${BACK}" stroke="${INK}" stroke-width="0.5"/>`;
    }
  }
  const W = n * cell, H = (n + 1) * cell;
  /* the rectangle drawn round them, and what its sides are */
  out += `<g data-mb="brace" data-mb-key="frame"><path d="M${ox} ${oy} h${W} v${-H} h${-W} Z" fill="none" stroke="${RED}" stroke-width="1"/></g>`;
  out += texAt(`${n}\\ \\text{across}`, ox + W / 2, oy + cell * 0.95, { em: 5, color: RED, attrs: 'data-mb="num" data-k="wa"' });
  out += texAt(`${n + 1}\\ \\text{up}`, ox + W + 3, oy - H / 2 + 2, { em: 5, color: RED, anchor: "start", attrs: 'data-mb="num" data-k="hu"' });
  return out;
}


/* ── A STAIRCASE OF REAL BLOCKS, each one its own mark, so it can be BUILT ──────
   Isometric cubes: column x is x + 1 blocks high, `depth` blocks deep. They are
   drawn back to front (so a near block covers a far one) but numbered in the
   order a builder lays them: the bottom row first, back before front, left to
   right. A stage drops them in that order. Faces in the question's own greys. */
function isoStairs(n, a, { depth = 2, key = "k", maxW = 140, maxH = 58 } = {}) {
  const c = a * 0.866;
  const P = (x, y, z) => [(x - y) * c, (x + y) * a * 0.5 - z * a];
  const cubes = [];
  for (let x = 0; x < n; x++) for (let y = 0; y < depth; y++) for (let z = 0; z <= x; z++) cubes.push({ x, y, z });
  const pts = cubes.flatMap(({ x, y, z }) => [P(x, y, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z), P(x + 1, y, z + 1), P(x, y, z + 1), P(x + 1, y + 1, z)]);
  const minX = Math.min(...pts.map((q) => q[0])), maxX = Math.max(...pts.map((q) => q[0]));
  const minY = Math.min(...pts.map((q) => q[1])), maxY = Math.max(...pts.map((q) => q[1]));
  const poly = (list, fill) => `<path d="M${list.map((q) => `${(q[0] - minX).toFixed(2)},${(q[1] - minY).toFixed(2)}`).join(" L")} Z" fill="${fill}" stroke="#1f2937" stroke-width="${(a * 0.06).toFixed(2)}" stroke-linejoin="round"/>`;
  /* the builder's order */
  const built = cubes.slice().sort((p1, p2) => p1.z - p2.z || p2.y - p1.y || p1.x - p2.x);
  const order = new Map(built.map((q, i) => [q, i]));
  /* the painter's order */
  const drawn = cubes.slice().sort((p1, p2) => (p1.x + p1.y) - (p2.x + p2.y) || p1.z - p2.z);
  const body = drawn.map((q) => {
    const { x, y, z } = q;
    return `<g data-mb="cell" data-k="${key}${order.get(q)}">`
      + poly([P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], "#cbd5e1")
      + poly([P(x + 1, y, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x + 1, y, z + 1)], "#94a3b8")
      + poly([P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], "#f1f5f9")
      + `</g>`;
  }).join("");
  const w = maxX - minX, h = maxY - minY;
  return { body, w, h, count: cubes.length };
}
/* a built staircase, centred in a drawing 150 wide */
const isoPic = (n, a, key, H = 60) => {
  const st = isoStairs(n, a, { key });
  return svgBox(150, H, `<g transform="translate(${(75 - st.w / 2).toFixed(2)} ${(H - st.h - 2).toFixed(2)})">${st.body}</g>`);
};
/* drop every block in the builder's order, `gap` seconds apart */
const build = (s, H, key, count, gap) => {
  for (let i = 0; i < count; i++) { const n = s?.querySelector(`[data-k="${key}${i}"]`); if (n) H.drop(n, i * gap); }
};


/* ── A STAIRCASE THAT TURNS ────────────────────────────────────────────────
   (*"adding the rotation of the staircase to different perspectives and
   numbering can add more details to the visuals"*) A tiny 3D renderer: real
   cubes, seen from any side, drawn back to front, with the faces between two
   touching cubes left out. Blocks can DROP in one at a time, carry their
   NUMBERS, take a colour by layer, and the whole staircase can TURN.
   It runs its own frames and stops when its drawing leaves the screen; a step
   replayed at once is drawn at its last frame. */
function liveStairs(host, { n = 3, depth = 2, size = 9, cx = 75, cy = 32, tilt = 0.52 } = {}) {
  const NS = "http://www.w3.org/2000/svg";
  const g = document.createElementNS(NS, "g");
  host.replaceChildren(g);   // one staircase per drawing: a new view replaces the last
  const cubes = [];
  for (let x = 0; x < n; x++) for (let y = 0; y < depth; y++) for (let z = 0; z <= x; z++) cubes.push({ x, y, z });
  /* the builder's order: bottom first, back before front, left to right */
  cubes.sort((a, b) => a.z - b.z || b.y - a.y || a.x - b.x);
  cubes.forEach((c, i) => { c.i = i; });
  const has = new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`));
  const ox = n / 2, oy = depth / 2, oz = n / 2;
  const FACES = [
    { d: [0, 0, 1], q: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
    { d: [0, 0, -1], q: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
    { d: [1, 0, 0], q: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
    { d: [-1, 0, 0], q: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
    { d: [0, 1, 0], q: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
    { d: [0, -1, 0], q: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  ];
  const shade = (base, k) => {
    const h = base.replace("#", "");
    const ch = [0, 2, 4].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * k));
    return `rgb(${ch.map((v) => Math.max(0, Math.min(255, v))).join(",")})`;
  };
  return {
    count: cubes.length,
    /* t: { th: turn (radians), tilt: how far we look down on it (0 = level, straight from the side),
       shown: (i) => 0..1 how far block i has fallen in, label: (i) => text|"", colour: (c) => hex } */
    draw({ th = -0.6, tilt: tl = tilt, shown = () => 1, label = () => "", colour = () => "#e8edf3" } = {}) {
      const ct = Math.cos(th), st = Math.sin(th);
      const sinT = Math.sin(tl), cosT = Math.cos(tl);
      const P = (x, y, z) => {
        const X = x - ox, Y = y - oy, Z = z - oz;
        const xr = X * ct - Y * st, yr = X * st + Y * ct;
        return [cx + xr * size, cy + (yr * sinT - Z * cosT) * size, yr * cosT + Z * sinT];
      };
      const vis = (dx, dy, dz) => (dx * st + dy * ct) * cosT + dz * sinT > 0.0001;
      const parts = [];
      cubes.forEach((c) => {
        const k = shown(c.i);
        if (k <= 0) return;
        const drop = (1 - k) * 2.6;
        const centre = P(c.x + 0.5, c.y + 0.5, c.z + 0.5 + drop);
        let svg = "";
        const base = colour(c);
        let best = null;   // the face turned most towards us: the number is printed on it
        FACES.forEach(({ d, q }) => {
          if (has.has(`${c.x + d[0]},${c.y + d[1]},${c.z + d[2]}`)) return;
          if (!vis(...d)) return;
          const light = d[2] === 1 ? 1.04 : d[2] === -1 ? 0.6 : 0.78 + 0.14 * (d[0] * ct - d[1] * st);
          const pts = q.map(([a, b, e]) => P(c.x + a, c.y + b, c.z + e + drop));
          svg += `<path d="M${pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}Z" fill="${shade(base, light)}" stroke="#1f2937" stroke-width="${(size * 0.055).toFixed(2)}" stroke-linejoin="round"/>`;
          const facing = (d[0] * st + d[1] * ct) * cosT + d[2] * sinT;
          if (!best || facing > best.facing) best = { facing, pts };
        });
        const lab = label(c.i);
        /* (*"the number labels on the blocks are not perfectly positioned"*) a number sits ON a face,
           in its middle, and lies flat on it: the face's two edges are the text's own axes, chosen so
           it always reads left to right and the right way up */
        if (lab && best && best.facing > 0.18) {
          const [p0, p1, , p3] = best.pts;
          let u = [p1[0] - p0[0], p1[1] - p0[1]], v = [p3[0] - p0[0], p3[1] - p0[1]];
          if (Math.abs(v[0]) > Math.abs(u[0])) [u, v] = [v, u];
          if (u[0] < 0) u = [-u[0], -u[1]];
          if (v[1] < 0) v = [-v[0], -v[1]];
          const mid = best.pts.reduce((m, q) => [m[0] + q[0] / 4, m[1] + q[1] / 4], [0, 0]);
          const m = [u[0], u[1], v[0], v[1], mid[0], mid[1]].map((n) => n.toFixed(3)).join(" ");
          svg += `<text transform="matrix(${m})" x="0" y="0.2" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="800" font-size="0.56" fill="#c0453f" opacity="${Math.min(1, k * 1.4).toFixed(2)}">${lab}</text>`;
        }
        parts.push([centre[2], svg]);
      });
      parts.sort((a, b) => a[0] - b[0]);
      g.innerHTML = parts.map((p) => p[1]).join("");
    },
  };
}
/** Run `frame(t)` for `secs` seconds (t from 0 to 1), unless the drawing has left the screen; at once when replayed. */
function animate(host, H, secs, frame, delay = 0) {
  const instant = H.grow === H.show;
  if (instant) { frame(1); return; }
  frame(0);
  const t0 = performance.now() + delay * 1000;
  const tick = (now) => {
    if (!host.isConnected) return;
    const t = Math.max(0, Math.min(1, (now - t0) / (secs * 1000)));
    frame(t);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function stairs24() {
  const K = PIC_W / PAPER;
  const PIC = (h) => svgBox(150, h, "");
  const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
  const write = (s, H, keys, start = 0, gap = 0.3) => keys.forEach((k, i) => { const n = key(s, k); if (n) H.write(n, start + i * gap); });
  const column = (pre, i) => [...Array.from({ length: i }, (_, h) => `${pre}${i}_${h + 1}`)];
  const MAIN_W = 150;
  const main = (pieces, em = 8) => svgBox(MAIN_W, 30, mathRow(pieces, { cx: MAIN_W / 2, y: 17, em }).svg);
  const SIDE_W = 48;
  const side = (rows, em = 5.2) => svgBox(SIDE_W, 12 * rows.length + 4, rows.map((pieces, i) => mathRow(pieces, { cx: SIDE_W / 2, y: 9 + i * 12, em }).svg).join(""));
  const at = (y) => centred(150, y);

  /* every column of a profile, one stage each, so it builds as its number is said */
  const columnStages = (pic, pre, n) => Object.fromEntries(Array.from({ length: n }, (_, j) => {
    const i = j + 1;
    return [`${pic}.c${i}`, (s, H) => { write(s, H, column(pre, i), 0, 0.12); write(s, H, [`${pre}n${i}`], 0.12 * i + 0.1); }];
  }));

  return film({
    paperMm: PAPER,
    picW: PIC_W,
    ready: mathLoad(),
    asks: [{ id: "a1", text: "Ololade Abigail can build this set of 3 stairs with 12 blocks. How many blocks will she need to build a set of 6 stairs?" }],
    pics: {
      /* the staircase in the question, built block by block; and at the end the six-stair one, all 42 */
      iso: () => svgBox(150, 60, `<g data-live="iso"></g>`),
      big: () => svgBox(150, 60, `<g data-live="big"></g>`),
      p3: () => svgBox(150, 48, profile(3, 11, 75 - 16.5, 40)),
      p6: () => svgBox(150, 52, profile(6, 6.4, 75 - 19.2, 46, "d")),
      r3: () => svgBox(150, 52, rectangle(3, 9.5, 75 - 14.25, 46)),
      r6: () => svgBox(150, 56, rectangle(6, 6, 75 - 18, 50)),
      mA: () => main([{ k: "a", tex: "1 + 2 + 3" }, { k: "e", tex: "=" }, { k: "b", tex: "6\\ \\text{squares}", color: BLUE }]),
      mB: () => main([{ k: "a", tex: "12 \\div 6" }, { k: "e", tex: "=" }, { k: "b", tex: "2\\ \\text{deep}", color: BLUE }]),
      mC: () => main([{ k: "a", tex: "1 + 2 + 3 + 4 + 5 + 6" }, { k: "e", tex: "=" }, { k: "b", tex: "21", color: BLUE }]),
      mD: () => main([{ k: "a", tex: "21 \\times 2" }, { k: "e", tex: "=" }, { k: "b", tex: "42", color: GREEN }]),
      mE: () => main([{ k: "a", tex: "6 \\times 7" }, { k: "e", tex: "=" }, { k: "b", tex: "42\\ \\text{blocks}", color: GREEN }], 9),
      /* GAUSS'S PAIRS: 1 + 2 + ... + 6 with the ends joined, each pair making 7 */
      gp: () => {
        const r = mathRow([1, 2, 3, 4, 5, 6].flatMap((v, i) => (i ? [{ k: `p${i}`, tex: "+" }, { k: `n${v}`, tex: String(v) }] : [{ k: `n${v}`, tex: String(v) }])),
          { cx: 75, y: 44, em: 9 });
        const x = (v) => r.at[`n${v}`].x;
        const arc = (a, b, lift, key) => {
          const y0 = 34, top = y0 - lift;
          return `<g data-mb="brace" data-mb-key="${key}"><path d="M${x(a).toFixed(2)} ${y0} C${x(a).toFixed(2)} ${top} ${x(b).toFixed(2)} ${top} ${x(b).toFixed(2)} ${y0}" fill="none" stroke="${RED}" stroke-width="0.9" stroke-linecap="round"/>`
            + texAt("7", (x(a) + x(b)) / 2, top + lift * 0.25 - 1.5, { em: 5.5, color: RED }) + `</g>`;
        };
        return svgBox(150, 50, r.svg + arc(1, 6, 26, "a1") + arc(2, 5, 17, "a2") + arc(3, 4, 9, "a3"));
      },
      fA: () => main([{ k: "a", tex: "3 \\times 7" }, { k: "e", tex: "=" }, { k: "b", tex: "\\dfrac{6 \\times 7}{2}" }, { k: "e2", tex: "=" }, { k: "c", tex: "21", color: BLUE }]),
      fB: () => main([{ k: "a", tex: "1 + 2 + \\cdots + n" }, { k: "e", tex: "=" }, { k: "b", tex: "\\dfrac{n(n+1)}{2}", color: BLUE }]),
      fC: () => main([{ k: "a", tex: "\\text{blocks}" }, { k: "e", tex: "=" }, { k: "b", tex: "2 \\times \\dfrac{n(n+1)}{2}" }, { k: "e2", tex: "=" }, { k: "c", tex: "n(n+1)", color: GREEN }]),
      fD: () => main([{ k: "a", tex: "n = 100:" }, { k: "b", tex: "100 \\times 101" }, { k: "e", tex: "=" }, { k: "c", tex: "10{,}100", color: GREEN }]),
      gR: () => main([{ k: "a", tex: "\\text{blocks}" }, { k: "e", tex: "=" }, { k: "b", tex: "n \\times (n + 1)", color: GREEN }]),
      sF: () => side([[{ k: "a", tex: "n = 3:\\ 3 \\times 4 = 12\\ \\checkmark" }], [{ k: "b", tex: "n = 6:\\ 6 \\times 7 = 42\\ \\checkmark" }]], 4.6),
      sG: () => side([[{ k: "a", tex: "10 \\times 11 = 110" }], [{ k: "b", tex: "100 \\times 101 = 10{,}100" }]], 4.8),
      sI: () => svgBox(SIDE_W, 46, `<g data-live="side"></g>`
        + texAt("\\text{2 blocks deep}", SIDE_W / 2, 43, { em: 4.4, color: RED, attrs: 'data-mb="num" data-k="t"' })),
      s3: () => side([[{ k: "a", tex: "3 \\times 4 = 12" }], [{ k: "b", tex: "\\checkmark\\ \\text{all 12 blocks}", color: GREEN }]]),
    },
    picAt: {
      iso: at(17), big: at(15), p3: at(18), p6: at(17), r3: at(17), r6: at(13.5),
      mA: at(38.5), mB: at(38.5), mC: at(38.5), mD: at(38.5), mE: at(38),
      sI: { x: 79.5, y: 18 }, s3: { x: 79.5, y: 22 }, sF: { x: 79.5, y: 20 }, sG: { x: 79.5, y: 20 },
      gp: at(14), fA: at(38.5), fB: at(38.5), fC: at(20), fD: at(31), gR: at(37.5),
    },
    lines: [
      { id: "m1", receipt: true, sub: "Method 1", text: "Look from the side", y: 50.5 },
      { id: "m2", receipt: true, sub: "Method 2", text: "Make a rectangle", y: 50.5 },
    ],
    stages: {
      "iso.build": (s, H) => {
        const st = liveStairs(s.querySelector('[data-live="iso"]'), { n: 3, size: 10.5, cy: 34 });
        const gap = 0.22;
        if (H.grow !== H.show) for (let i = 0; i < st.count; i++) H.sound("pop", 0.2 + i * gap);
        animate(s, H, 0.4 + st.count * gap, (t) => {
          const now = t * (0.4 + st.count * gap);
          st.draw({ th: -0.6, shown: (i) => Math.max(0, Math.min(1, (now - i * gap) / 0.35)) });
        });
      },
      /* "And it took her twelve blocks": a full turn, every block numbered as it is counted */
      "iso.count": (s, H) => {
        const st = liveStairs(s.querySelector('[data-live="iso"]'), { n: 3, size: 10.5, cy: 34 });
        if (H.grow !== H.show) for (let i = 0; i < st.count; i++) H.sound("tick", 0.3 + i * 0.32);
        animate(s, H, 5.2, (t) => {
          const now = t * 5.2;
          st.draw({ th: -0.6 + ease(t) * Math.PI * 2, label: (i) => (now >= 0.3 + i * 0.32 ? String(i + 1) : "") });
        });
      },
      /* "Look at the staircase from the side" (*"the rotation is use to show the side view"*): the
         staircase turns square on and the eye comes down level, until all you see is its side,
         one square, two, three: the very picture Method 1 then draws */
      "iso.side": (s, H) => {
        const st = liveStairs(s.querySelector('[data-live="iso"]'), { n: 3, size: 10.5, cy: 34 });
        if (H.grow !== H.show) H.sound("whoosh", 0.1);
        animate(s, H, 2.4, (t) => {
          const k = ease(t);
          st.draw({ th: -0.6 + 0.6 * k, tilt: 0.52 * (1 - k), colour: (c) => (k > 0.6 && c.y === 1 ? FRONT : "#e8edf3") });
        });
      },
      /* the 42, built fast, then turned to be seen from the other side, and counted */
      "big.build": (s, H) => {
        const host = s.querySelector('[data-live="big"]');
        const st = liveStairs(host, { n: 6, size: 6.4, cy: 36 });
        const gap = 0.06, build = 0.4 + st.count * gap;
        if (H.grow !== H.show) for (let i = 0; i < st.count; i += 3) H.sound("pop", 0.2 + i * gap);
        animate(s, H, build + 3.2, (t) => {
          const now = t * (build + 3.2);
          const turn = Math.max(0, now - build) / 3.2;
          st.draw({ th: -0.6 + ease(Math.min(1, turn)) * Math.PI, shown: (i) => Math.max(0, Math.min(1, (now - i * gap) / 0.3)) });
          let tag = host.querySelector(".big-count");
          if (now >= build) {
            if (!tag) { tag = document.createElementNS("http://www.w3.org/2000/svg", "text"); tag.setAttribute("class", "big-count"); host.appendChild(tag); }
            tag.setAttribute("x", "128"); tag.setAttribute("y", "14"); tag.setAttribute("text-anchor", "middle");
            tag.setAttribute("font-family", "JetBrains Mono, monospace"); tag.setAttribute("font-weight", "800"); tag.setAttribute("font-size", "7");
            tag.setAttribute("fill", "#2f7d4a"); tag.textContent = "42 blocks";
          }
        });
      },
      ...columnStages("p3", "c", 3),
      ...columnStages("p6", "d", 6),
      "mA.sum": (s, H) => write(s, H, ["a"], 0),
      "mA.ans": (s, H) => { write(s, H, ["e", "b"], 0, 0.35); },
      "mB.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.45),
      /* "Behind": the margin's staircase starts square on, the side view, then turns to show the layer behind it, in its own colour */
      "sI.all": (s, H) => {
        write(s, H, ["t"], 0.6);
        const st = liveStairs(s.querySelector('[data-live="side"]'), { n: 3, size: 6.2, cx: 24, cy: 20 });
        animate(s, H, 2.6, (t) => st.draw({ th: -ease(t) * 1.9, tilt: 0.52 * ease(t), colour: (c) => (c.y === 0 ? "#ffd9cf" : "#bfe3ff") }));
      },
      "mC.sum": (s, H) => write(s, H, ["a"], 0),
      "mC.ans": (s, H) => write(s, H, ["e", "b"], 0, 0.35),
      "mD.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.4); write(s, H, ["b"], 1.2); H.sound("ding", 1.4); },
      "r3.front": (s, H) => { for (let i = 1; i <= 3; i++) write(s, H, column("f", i), (i - 1) * 0.4, 0.1); },
      "r3.back": (s, H) => { let d = 0; for (let i = 3; i >= 1; i--) for (let h = 4; h > i; h--) { const n = key(s, `b${i}_${h}`); if (n) H.drop(n, d); d += 0.18; } },
      "r3.frame": (s, H) => { H.draw(braceOf(s, "frame"), 0); write(s, H, ["wa", "hu"], 0.6, 0.5); },
      "s3.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["b"], 0.9); H.sound("ding", 1.0); },
      "r6.front": (s, H) => { for (let i = 1; i <= 6; i++) write(s, H, column("f", i), (i - 1) * 0.25, 0.05); },
      "r6.back": (s, H) => { let d = 0; for (let i = 6; i >= 1; i--) for (let h = 7; h > i; h--) { const n = key(s, `b${i}_${h}`); if (n) H.drop(n, d); d += 0.07; } },
      "r6.frame": (s, H) => { H.draw(braceOf(s, "frame"), 0); write(s, H, ["wa", "hu"], 0.6, 0.5); },
      "gp.row": (s, H) => write(s, H, ["n1", "p1", "n2", "p2", "n3", "p3", "n4", "p4", "n5", "p5", "n6"], 0, 0.12),
      "gp.a1": (s, H) => H.draw(braceOf(s, "a1"), 0),
      "gp.a2": (s, H) => H.draw(braceOf(s, "a2"), 0),
      "gp.a3": (s, H) => H.draw(braceOf(s, "a3"), 0),
      "fA.all": (s, H) => write(s, H, ["a", "e", "b", "e2", "c"], 0, 0.45),
      "fB.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.6),
      "fC.all": (s, H) => { write(s, H, ["a", "e", "b"], 0, 0.5); write(s, H, ["e2", "c"], 2.2, 0.5); H.sound("ding", 2.8); },
      "fD.all": (s, H) => { write(s, H, ["a", "b", "e"], 0, 0.4); write(s, H, ["c"], 1.8); H.sound("ding", 2.0); },
      "gR.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.5),
      "sF.a": (s, H) => write(s, H, ["a"], 0),
      "sF.b": (s, H) => write(s, H, ["b"], 0),
      "sG.a": (s, H) => write(s, H, ["a"], 0),
      "sG.b": (s, H) => { write(s, H, ["b"], 0); H.sound("ding", 0.6); },
      "mE.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.4); write(s, H, ["b"], 1.0); H.sound("ding", 1.2); },
    },
    steps: ({ push }) => {
      push("Ololade built a staircase. Three stairs.", { on: ["a1", "iso"], add: ["iso.build"], transition: "iris", pause: 0.8 });
      push("And it took her twelve blocks.", { add: ["iso.count"], pause: 0.6 });
      push("Now she wants six stairs. How many blocks will that take?", { pause: 1.4 });
      push("Here's a trick. Don't count the blocks yet. Look at the staircase from the side.", { add: ["iso.side"], cue: { "iso.side": "look at" }, pause: 0.6 });
      push("From the side, the first step is one square. The next is two. The top is three.",
        { on: ["p3", "m1"], off: ["iso"], add: ["p3.c1", "p3.c2", "p3.c3"],
          cue: { "p3.c1": "one square", "p3.c2": "two", "p3.c3": "three" },
          transition: { kind: "card", title: "Method 1", sub: "Look from the side", hold: 1.6 }, pause: 0.6 });
      push("One, plus two, plus three... six squares.", { on: ["mA"], add: ["mA.sum", "mA.ans"], cue: { "mA.sum": "one, plus", "mA.ans": "six squares" }, pause: 0.8 });
      push("But she used twelve blocks, not six. So where are the other six?", { pause: 1.6 });
      push("Behind. The staircase is two blocks deep. Twelve divided by six... two.",
        { on: ["sI", "mB"], off: ["mA"], add: ["sI.all", "mB.all"], cue: { "sI.all": "behind", "mB.all": "twelve divided" }, pause: 0.8 });
      push("So every square you see from the side has another block behind it. You follow me?", { pause: 1.4 });
      push("Now six stairs. From the side: one, two, three, four, five, six.",
        { on: ["p6"], off: ["p3", "mB", "sI"], add: ["p6.c1", "p6.c2", "p6.c3", "p6.c4", "p6.c5", "p6.c6"],
          cue: { "p6.c1": "one,", "p6.c2": "two,", "p6.c3": "three,", "p6.c4": "four,", "p6.c5": "five,", "p6.c6": "six." }, pause: 0.6 });
      push("Add them up. One plus two plus three plus four plus five plus six... twenty one.",
        { on: ["mC"], add: ["mC.sum", "mC.ans"], cue: { "mC.sum": "one plus", "mC.ans": "twenty one" }, pause: 0.8 });
      push("Twenty one squares from the side. And every one of them is two blocks deep.", { pause: 0.8 });
      push("Twenty one times two... forty two.", { on: ["mD"], off: ["mC"], add: ["mD.all"], cue: { "mD.all": "twenty one times" }, pause: 0.8 });
      push("So she needs forty two blocks. Here they are, all forty two. Option A.",
        { on: ["big"], off: ["p6"], add: ["big.build"], cue: { "big.build": "here they are" }, pause: 1.4 });

      push("Now, what if she wanted a hundred stairs? Nobody wants to add up a hundred numbers. Let's find a shortcut.",
        { on: ["gp"], off: ["big", "mD"], add: ["gp.row"], cue: { "gp.row": "add up" }, pause: 0.8 });
      push("Pair them from the ends. One and six make seven. Two and five, seven. Three and four, seven.",
        { add: ["gp.a1", "gp.a2", "gp.a3"], cue: { "gp.a1": "one and six", "gp.a2": "two and five", "gp.a3": "three and four" }, pause: 0.6 });
      push("Three pairs of seven. Twenty one, the same as before. And three pairs is half of six.",
        { on: ["fA"], add: ["fA.all"], cue: { "fA.all": "three pairs" }, pause: 0.8 });
      push("So for any number of stairs, call it n: there are n over two pairs, and each pair makes n plus one. So the side is n times n plus one, over two.",
        { on: ["fB"], off: ["fA"], add: ["fB.all"], cue: { "fB.all": "so the side" }, pause: 0.8 });
      push("And the staircase is two blocks deep, so we double it. The two cancels the half. Blocks equal n times n plus one.",
        { on: ["fC"], off: ["fB", "gp"], add: ["fC.all"], cue: { "fC.all": "double it" }, pause: 0.8 });
      push("Check it. Three stairs: three times four, twelve. Six stairs: six times seven, forty two.",
        { on: ["sF"], add: ["sF.a", "sF.b"], cue: { "sF.a": "three stairs", "sF.b": "six stairs" }, pause: 0.8 });
      push("So a hundred stairs is a hundred times a hundred and one. Ten thousand one hundred blocks.",
        { on: ["fD"], add: ["fD.all"], cue: { "fD.all": "a hundred times" }, pause: 1.2 });

      push("Now a quicker way. It's a lovely one.",
        { on: ["m2"], off: ["p6", "big", "mD", "m1", "fC", "fD", "sF"], transition: { kind: "card", title: "Method 2", sub: "Make a rectangle", hold: 1.6 }, pause: 0.6 });
      push("Back to three stairs. Here's the front layer of the staircase.",
        { on: ["r3"], add: ["r3.front"], cue: { "r3.front": "front layer" }, pause: 0.6 });
      push("Now take the back layer, turn it upside down, and put it on top.",
        { add: ["r3.back"], cue: { "r3.back": "upside down" }, pause: 0.8 });
      push("Look what it makes. A rectangle. Three across, and four up.",
        { add: ["r3.frame"], cue: { "r3.frame": "a rectangle" }, pause: 0.8 });
      push("Three times four is twelve. That's all twelve blocks, both layers.",
        { on: ["s3"], add: ["s3.all"], cue: { "s3.all": "three times four" }, pause: 1 });
      push("So for six stairs, it's the same thing. Six across... and one more than six up. Seven.",
        { on: ["r6"], off: ["r3", "s3"], add: ["r6.front", "r6.back", "r6.frame"],
          cue: { "r6.front": "same thing", "r6.back": "six across", "r6.frame": "one more" }, pause: 0.8 });
      push("Six times seven... forty two.", { on: ["mE"], add: ["mE.all"], cue: { "mE.all": "six times" }, pause: 1 });
      push("Same answer, and no adding up at all.", { pause: 0.8 });
      push("And the rectangle gives us the formula straight away. It's always n across, and one more, n plus one, up. So the blocks are n times n plus one.",
        { on: ["gR"], off: ["mE"], add: ["gR.all"], cue: { "gR.all": "so the blocks" }, pause: 0.8 });
      push("Ten stairs: ten times eleven, a hundred and ten.", { on: ["sG"], add: ["sG.a"], cue: { "sG.a": "ten times" }, pause: 0.6 });
      push("A hundred stairs: a hundred times a hundred and one. Ten thousand one hundred.",
        { add: ["sG.b"], cue: { "sG.b": "a hundred times" }, pause: 1 });
      push("Two ways, one formula. For a staircase two blocks deep, the blocks are n times n plus one. Try twenty stairs yourself.");
    },
  });
}


/* ═══ PATTERN FILMS: sums, odd numbers, stair rows, a repeating series ═══════
   The same kit, one small toolkit per film (`kit()`): a centred working line,
   the margin, places on the screen, and writing marks by name. */
function kit() {
  const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
  const write = (s, H, keys, start = 0, gap = 0.3) => keys.forEach((k, i) => {
    const n = key(s, k);
    if (!n) return;
    if (n.getAttribute("data-mb") === "cut") H.score(n, start + i * gap, 0.4); else H.write(n, start + i * gap);
  });
  const main = (pieces, em = 8) => svgBox(150, 30, mathRow(pieces, { cx: 75, y: 17, em }).svg);
  const side = (rows, em = 5) => svgBox(48, 12 * rows.length + 4, rows.map((pieces, i) => mathRow(pieces, { cx: 24, y: 9 + i * 12, em }).svg).join(""));
  const at = (y) => centred(150, y);
  const SIDE = { x: 79.5, y: 18 };
  const line = (k, tex, color) => ({ k, tex, ...(color ? { color } : {}) });
  return { key, write, main, side, at, SIDE, line };
}
/* a row of figures with arcs joining the ends, each arc labelled with what its pair makes */
function pairedRow(numbers, pairs, label, em = 8.5) {
  const pieces = numbers.flatMap((v, i) => (i ? [{ k: `p${i}`, tex: "+" }, { k: `n${i}`, tex: String(v) }] : [{ k: `n${i}`, tex: String(v) }])).filter((x) => x.tex !== "");
  const r = mathRow(pieces, { cx: 75, y: 44, em });
  const x = (i) => r.at[`n${i}`].x;
  const arcs = pairs.map(([a, b, lift], j) => {
    const y0 = 34, top = y0 - lift;
    return `<g data-mb="brace" data-mb-key="a${j + 1}"><path d="M${x(a).toFixed(2)} ${y0} C${x(a).toFixed(2)} ${top} ${x(b).toFixed(2)} ${top} ${x(b).toFixed(2)} ${y0}" fill="none" stroke="${RED}" stroke-width="0.9" stroke-linecap="round"/>`
      + texAt(label, (x(a) + x(b)) / 2, top + lift * 0.25 - 1.5, { em: 5, color: RED }) + `</g>`;
  }).join("");
  return svgBox(150, 50, r.svg + arcs);
}
const rowKeys = (n) => Array.from({ length: n }, (_, i) => (i ? [`p${i}`, `n${i}`] : [`n${i}`])).flat();

/* ── ANMC 13th first round, Q14: 1 + 2 + ... + 200 ── */
export function sum200() {
  const { write, main, side, at, SIDE, line } = kit();
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "The sum of the first n positive integers is n(n+1)/2. Evaluate 1 + 2 + 3 + ... + 200." }],
    pics: {
      row: () => pairedRow([1, 2, 3, "\\cdots", 198, 199, 200], [[0, 6, 26], [1, 5, 17], [2, 4, 9]], "201"),
      sP: () => side([[line("a", "200 \\div 2 = 100")], [line("b", "\\text{pairs}")]]),
      mA: () => main([line("a", "100 \\times 201"), line("e", "="), line("b", "20{,}100", GREEN)]),
      r6: () => svgBox(150, 56, rectangle(6, 6, 75 - 18, 50)),
      m6: () => main([line("a", "1 + 2 + \\cdots + 6"), line("e", "="), line("b", "\\dfrac{6 \\times 7}{2}"), line("e2", "="), line("c", "21", BLUE)]),
      mN: () => main([line("a", "1 + 2 + \\cdots + n"), line("e", "="), line("b", "\\dfrac{n(n+1)}{2}", BLUE)]),
      mH: () => main([line("a", "\\dfrac{200 \\times 201}{2}"), line("e", "="), line("b", "\\dfrac{40{,}200}{2}"), line("e2", "="), line("c", "20{,}100", GREEN)]),
    },
    picAt: { row: at(15), sP: SIDE, mA: at(36), r6: at(13.5), m6: at(37.5), mN: at(37.5), mH: at(37.5) },
    lines: [
      { id: "m1", receipt: true, sub: "Method 1", text: "Pair from the ends", y: 50.5 },
      { id: "m2", receipt: true, sub: "Method 2", text: "Two staircases", y: 50.5 },
    ],
    stages: {
      "row.all": (s, H) => write(s, H, rowKeys(7), 0, 0.12),
      "row.a1": (s, H) => H.draw(braceOf(s, "a1"), 0),
      "row.a2": (s, H) => H.draw(braceOf(s, "a2"), 0),
      "row.a3": (s, H) => H.draw(braceOf(s, "a3"), 0),
      "sP.all": (s, H) => write(s, H, ["a", "b"], 0, 0.5),
      "mA.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.4); write(s, H, ["b"], 1.6); H.sound("ding", 1.8); },
      "r6.front": (s, H) => { for (let i = 1; i <= 6; i++) for (let h = 1; h <= i; h++) { const n = s?.querySelector(`[data-k="f${i}_${h}"]`); if (n) H.write(n, (i - 1) * 0.3 + h * 0.05); } },
      "r6.back": (s, H) => { let d = 0; for (let i = 6; i >= 1; i--) for (let h = 7; h > i; h--) { const n = s?.querySelector(`[data-k="b${i}_${h}"]`); if (n) H.drop(n, d); d += 0.07; } },
      "r6.frame": (s, H) => { H.draw(braceOf(s, "frame"), 0); write(s, H, ["wa", "hu"], 0.6, 0.5); },
      "m6.all": (s, H) => write(s, H, ["a", "e", "b", "e2", "c"], 0, 0.45),
      "mN.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.6),
      "mH.a": (s, H) => write(s, H, ["a"], 0),
      "mH.b": (s, H) => { write(s, H, ["e", "b", "e2"], 0, 0.6); write(s, H, ["c"], 2.4); H.sound("ding", 2.6); },
    },
    steps: ({ push }) => {
      push("Add up every whole number from one to two hundred.", { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Two hundred numbers. Adding them one by one would take all day. There's a quicker way.", { pause: 0.8 });
      push("Write them out. One, two, three, all the way to two hundred.",
        { on: ["row", "m1"], add: ["row.all"], cue: { "row.all": "write them" },
          transition: { kind: "card", title: "Method 1", sub: "Pair from the ends", hold: 1.6 }, pause: 0.5 });
      push("Pair the first with the last. One and two hundred make two hundred and one.", { add: ["row.a1"], cue: { "row.a1": "one and two hundred" }, pause: 0.6 });
      push("Two and a hundred and ninety nine. Two hundred and one again.", { add: ["row.a2"], cue: { "row.a2": "two and" }, pause: 0.5 });
      push("Three and a hundred and ninety eight. Two hundred and one. Every pair makes the same.", { add: ["row.a3"], cue: { "row.a3": "three and" }, pause: 0.8 });
      push("How many pairs? Two hundred numbers, two in each pair. A hundred pairs.", { on: ["sP"], add: ["sP.all"], cue: { "sP.all": "two hundred numbers" }, pause: 0.6 });
      push("A hundred pairs of two hundred and one... twenty thousand one hundred.", { on: ["mA"], add: ["mA.all"], cue: { "mA.all": "a hundred pairs of" }, pause: 1.2 });
      push("Now let's see why the formula in the question works. Here's a small staircase. One, two, three, four, five, six.",
        { on: ["r6", "m2"], off: ["row", "sP", "mA", "m1"], add: ["r6.front"], cue: { "r6.front": "small staircase" },
          transition: { kind: "card", title: "Method 2", sub: "Two staircases", hold: 1.6 }, pause: 0.5 });
      push("Put a second staircase on top, upside down.", { add: ["r6.back"], cue: { "r6.back": "second staircase" }, pause: 0.6 });
      push("It makes a rectangle. Six across, seven up. Six times seven, forty two.", { add: ["r6.frame"], cue: { "r6.frame": "a rectangle" }, pause: 0.6 });
      push("But that's two staircases. One staircase is half of it. Forty two over two, twenty one. One plus two, up to six.",
        { on: ["m6"], add: ["m6.all"], cue: { "m6.all": "one staircase" }, pause: 0.8 });
      push("So for any number n, the sum is n times n plus one, over two. That's the formula in the question.",
        { on: ["mN"], off: ["m6"], add: ["mN.all"], cue: { "mN.all": "the sum is" }, pause: 0.8 });
      push("For two hundred: two hundred times two hundred and one, over two.", { on: ["mH"], off: ["mN"], add: ["mH.a"], cue: { "mH.a": "two hundred times" }, pause: 0.6 });
      push("That's forty thousand two hundred, over two... twenty thousand one hundred.", { add: ["mH.b"], cue: { "mH.b": "forty thousand" }, pause: 1 });
      push("Two ways, one answer. Pair from the ends, or make a rectangle and take half.");
    },
  });
}

/* ── the sum of the first n odd numbers: ANMC 13th finals Q12 (to 29), 14th Q68 (to 21) ── */
function lSquare(n, cell, ox, oy) {
  const tone = ["#bfe3ff", "#ffd9cf", "#d6f0cf", "#fff3a8", "#e2dbf3"];
  let out = "";
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const layer = Math.max(i, j) + 1;
    out += `<rect data-mb="cell" data-k="L${layer}_${i}_${j}" x="${(ox + i * cell).toFixed(2)}" y="${(oy - (j + 1) * cell).toFixed(2)}" width="${cell}" height="${cell}" fill="${tone[(layer - 1) % tone.length]}" stroke="${INK}" stroke-width="0.5"/>`;
  }
  return out;
}
function oddSum({ last, question, answerSay }) {
  const n = (last + 1) / 2, sq = n * n, pairSum = last + 1;
  const { write, main, side, at, SIDE, line } = kit();
  const layer = (s, H, L, start = 0) => { for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) if (Math.max(i, j) + 1 === L) { const c = s?.querySelector(`[data-k="L${L}_${i}_${j}"]`); if (c) H.write(c, start + (i + j) * 0.08); } };
  const cells = (L) => Array.from({ length: L }, (_, k) => 2 * k + 1).join(" + ");
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: question }],
    pics: {
      sqr: () => svgBox(150, 46, lSquare(4, 9, 75 - 18, 44)),
      m1: () => main([line("a", "1"), line("e", "="), line("b", "1 \\times 1", BLUE)]),
      m2: () => main([line("a", cells(2)), line("e", "= 4 ="), line("b", "2 \\times 2", BLUE)]),
      m3: () => main([line("a", cells(3)), line("e", "= 9 ="), line("b", "3 \\times 3", BLUE)]),
      m4: () => main([line("a", cells(4)), line("e", "= 16 ="), line("b", "4 \\times 4", BLUE)]),
      sN: () => side([[line("a", `(${last} + 1) \\div 2`)], [line("b", `= ${n}\\ \\text{odds}`, BLUE)]]),
      mS: () => main([line("a", `${n} \\times ${n}`), line("e", "="), line("b", String(sq), GREEN)]),
      row: () => pairedRow([1, 3, 5, "\\cdots", last - 4, last - 2, last], [[0, 6, 26], [1, 5, 17], [2, 4, 9]], String(pairSum)),
      mM: () => main([line("a", `\\text{middle} = (1 + ${last}) \\div 2`), line("e", "="), line("b", String(n), BLUE)]),
      mT: () => main([line("a", `${n}\\ \\text{numbers} \\times ${n}`), line("e", "="), line("b", String(sq), GREEN)]),
    },
    picAt: { sqr: at(14), m1: at(38), m2: at(38), m3: at(38), m4: at(38), sN: SIDE, mS: at(38), row: at(15), mM: at(36), mT: at(36) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Build a square", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "Middle times count", y: 50.5 },
    ],
    stages: {
      "sqr.l1": (s, H) => layer(s, H, 1), "sqr.l2": (s, H) => layer(s, H, 2), "sqr.l3": (s, H) => layer(s, H, 3), "sqr.l4": (s, H) => layer(s, H, 4),
      "m1.all": (s, H) => write(s, H, ["a", "e", "b"], 0.3, 0.3),
      "m2.all": (s, H) => write(s, H, ["a", "e", "b"], 0.3, 0.3),
      "m3.all": (s, H) => write(s, H, ["a", "e", "b"], 0.3, 0.3),
      "m4.all": (s, H) => write(s, H, ["a", "e", "b"], 0.3, 0.3),
      "sN.all": (s, H) => write(s, H, ["a", "b"], 0, 0.8),
      "mS.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.4); write(s, H, ["b"], 1.4); H.sound("ding", 1.6); },
      "row.all": (s, H) => write(s, H, rowKeys(7), 0, 0.12),
      "row.a1": (s, H) => H.draw(braceOf(s, "a1"), 0),
      "row.a2": (s, H) => H.draw(braceOf(s, "a2"), 0),
      "row.a3": (s, H) => H.draw(braceOf(s, "a3"), 0),
      "mM.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.5),
      "mT.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.4); write(s, H, ["b"], 1.4); H.sound("ding", 1.6); },
    },
    steps: ({ push }) => {
      push(`Add up the odd numbers. One, three, five, all the way to ${last}.`, { on: ["a1"], transition: "iris", pause: 0.6 });
      push("There's a picture hiding in these numbers. Let's draw it.", { pause: 0.6 });
      push("Start with one square.",
        { on: ["sqr", "k1", "m1"], add: ["sqr.l1", "m1.all"], cue: { "sqr.l1": "one square" },
          transition: { kind: "card", title: "Method 1", sub: "Build a square", hold: 1.6 }, pause: 0.5 });
      push("Add three, wrapped round the corner. Now it's a two by two square.", { on: ["m2"], off: ["m1"], add: ["sqr.l2", "m2.all"], cue: { "sqr.l2": "add three", "m2.all": "two by two" }, pause: 0.6 });
      push("Add five. Three by three.", { on: ["m3"], off: ["m2"], add: ["sqr.l3", "m3.all"], cue: { "sqr.l3": "add five", "m3.all": "three by three" }, pause: 0.6 });
      push("Add seven. Four by four. Every odd number wraps one more layer round the square.",
        { on: ["m4"], off: ["m3"], add: ["sqr.l4", "m4.all"], cue: { "sqr.l4": "add seven", "m4.all": "four by four" }, pause: 0.8 });
      push("So the answer is always a square. The only question is, how big?", { pause: 1.2 });
      push(`How many odd numbers are there from one to ${last}? Add one, and halve it. ${n} odd numbers.`,
        { on: ["sN"], add: ["sN.all"], cue: { "sN.all": "add one" }, pause: 0.8 });
      push(`So it's a ${n} by ${n} square. ${n} times ${n}... ${sq}.`, { on: ["mS"], off: ["m4"], add: ["mS.all"], cue: { "mS.all": "times" }, pause: 1.2 });
      push(`Now another way. Pair from the ends. One and ${last} make ${pairSum}.`,
        { on: ["row", "k2"], off: ["sqr", "mS", "sN", "k1"], add: ["row.all", "row.a1"], cue: { "row.a1": `one and ${last}` },
          transition: { kind: "card", title: "Method 2", sub: "Middle times count", hold: 1.6 }, pause: 0.6 });
      push(`Three and ${last - 2}, ${pairSum} again. Five and ${last - 4}, ${pairSum}. Every pair makes the same.`,
        { add: ["row.a2", "row.a3"], cue: { "row.a2": "three and", "row.a3": "five and" }, pause: 0.6 });
      push(`So the numbers balance round the middle. The middle is half of ${pairSum}. That's ${n}.`, { on: ["mM"], add: ["mM.all"], cue: { "mM.all": "the middle" }, pause: 0.8 });
      push(`${n} numbers, all balancing at ${n}. ${n} times ${n}... ${sq}.`, { on: ["mT"], off: ["mM"], add: ["mT.all"], cue: { "mT.all": "balancing" }, pause: 1.2 });
      push(`Two ways, one answer. ${answerSay} The sum of the first n odd numbers is n squared.`);
    },
  });
}
export const odd29 = () => oddSum({ last: 29, question: "The sum of the first n odd numbers is n². Evaluate 1 + 3 + 5 + ... + 29.", answerSay: "Two hundred and twenty five." });
export const odd21 = () => oddSum({ last: 21, question: "What is the value of 1 + 3 + 5 + 7 + ... + 17 + 19 + 21?", answerSay: "Eleven times eleven." });

/* ── Scholastic 2022 finals Q27: a stair-step of black and white squares ── */
function bwRows(n, cell, cx, top) {
  let out = "";
  for (let r = 1; r <= n; r++) {
    const count = 2 * r - 1, x0 = cx - (count * cell) / 2, y = top + (r - 1) * cell;
    for (let i = 0; i < count; i++) {
      out += `<rect data-mb="cell" data-k="r${r}_${i}" x="${(x0 + i * cell).toFixed(2)}" y="${y.toFixed(2)}" width="${cell}" height="${cell}" fill="${i % 2 ? INK : "#fffdf8"}" stroke="${INK}" stroke-width="0.5"/>`;
    }
    out += texAt(`\\text{row ${r}}`, x0 - 3, y + cell * 0.72, { em: 4.2, color: BLUE, anchor: "end", attrs: `data-mb="num" data-k="rl${r}"` });
  }
  return out;
}
export function stairRows37() {
  const { write, main, side, at, SIDE, line } = kit();
  const row = (s, H, r, start = 0) => { write(s, H, [`rl${r}`], start); for (let i = 0; i < 2 * r - 1; i++) { const c = s?.querySelector(`[data-k="r${r}_${i}"]`); if (c) H.write(c, start + 0.2 + i * 0.1); } };
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "A 'stair-step' figure is made of alternating black and white squares in each row. All rows begin and end with a white square. The number of black squares in the 37th row is?" }],
    pics: {
      bw: () => svgBox(150, 46, bwRows(4, 8.5, 75, 4)),
      sT: () => side([[line("a", "\\text{row 1: } 0")], [line("b", "\\text{row 2: } 1")], [line("c", "\\text{row 3: } 2")], [line("d", "\\text{row 4: } 3")]], 4.6),
      mR: () => main([line("a", "\\text{black}"), line("e", "="), line("b", "\\text{row} - 1", BLUE)]),
      m37: () => main([line("a", "37 - 1"), line("e", "="), line("b", "36", GREEN)]),
      sO: () => side([[line("a", "1,\\ 3,\\ 5,\\ 7")], [line("b", "\\text{row } n: 2n - 1", BLUE)]], 4.8),
      m73: () => main([line("a", "2 \\times 37 - 1"), line("e", "="), line("b", "73\\ \\text{squares}", BLUE)]),
      mB: () => main([line("a", "(73 - 1) \\div 2"), line("e", "="), line("b", "36", GREEN)]),
    },
    picAt: { bw: at(14), sT: { x: 79.5, y: 15 }, mR: at(38), m37: at(38), sO: SIDE, m73: at(38), mB: at(38) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Spot the pattern", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "Count every square", y: 50.5 },
    ],
    stages: {
      "bw.r1": (s, H) => row(s, H, 1), "bw.r2": (s, H) => row(s, H, 2), "bw.r3": (s, H) => row(s, H, 3), "bw.r4": (s, H) => row(s, H, 4),
      "sT.a": (s, H) => write(s, H, ["a"], 0), "sT.b": (s, H) => write(s, H, ["b"], 0), "sT.c": (s, H) => write(s, H, ["c"], 0), "sT.d": (s, H) => write(s, H, ["d"], 0),
      "mR.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.5),
      "m37.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.4); write(s, H, ["b"], 1.3); H.sound("ding", 1.5); },
      "sO.all": (s, H) => write(s, H, ["a", "b"], 0, 1.2),
      "m73.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.5),
      "mB.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.6); H.sound("ding", 1.8); },
    },
    steps: ({ push }) => {
      push("Here's a stair-step figure. Row one... row two... row three... row four.",
        { on: ["a1", "bw"], add: ["bw.r1", "bw.r2", "bw.r3", "bw.r4"], cue: { "bw.r1": "row one", "bw.r2": "row two", "bw.r3": "row three", "bw.r4": "row four" }, transition: "iris", pause: 0.6 });
      push("Every row starts white and ends white, and the colours take turns.", { pause: 0.6 });
      push("We want the black squares in row thirty seven. We won't draw thirty seven rows.", { pause: 1 });
      push("Count the black squares in each row. Row one, none. Row two, one. Row three, two. Row four, three.",
        { on: ["sT", "k1"], add: ["sT.a", "sT.b", "sT.c", "sT.d"], cue: { "sT.a": "row one,", "sT.b": "row two,", "sT.c": "row three,", "sT.d": "row four," },
          transition: { kind: "card", title: "Method 1", sub: "Spot the pattern", hold: 1.6 }, pause: 0.6 });
      push("The black squares are always one less than the row number.", { on: ["mR"], add: ["mR.all"], cue: { "mR.all": "always" }, pause: 0.8 });
      push("So row thirty seven has thirty seven take away one... thirty six black squares.", { on: ["m37"], off: ["mR"], add: ["m37.all"], cue: { "m37.all": "thirty seven take away" }, pause: 1.2 });
      push("Another way. How many squares are in each row? One, three, five, seven. The odd numbers.",
        { on: ["sO", "k2"], off: ["sT", "m37", "k1"], add: ["sO.all"], cue: { "sO.all": "one, three" },
          transition: { kind: "card", title: "Method 2", sub: "Count every square", hold: 1.6 }, pause: 0.6 });
      push("Row thirty seven: two times thirty seven, take away one. Seventy three squares.", { on: ["m73"], add: ["m73.all"], cue: { "m73.all": "two times" }, pause: 0.8 });
      push("It starts and ends white, so there's one more white than black. Take that one away, and halve it. Thirty six.",
        { on: ["mB"], off: ["m73"], add: ["mB.all"], cue: { "mB.all": "take that one away" }, pause: 1 });
      push("Two ways, one answer. Thirty six black squares in row thirty seven.");
    },
  });
}

/* ── ANMC 12th main, Q55 and Q57: the series 1, 2, 2, 3, 3, 3, ... ── */
function seriesRows(k, cell, ox, top) {
  let out = "";
  let total = 0;
  for (let j = 1; j <= k; j++) {
    total += j;
    const y = top + (j - 1) * cell;
    for (let i = 0; i < j; i++) {
      out += `<g data-mb="cell" data-k="s${j}_${i}"><rect x="${(ox + i * cell).toFixed(2)}" y="${y.toFixed(2)}" width="${cell}" height="${cell}" fill="${j % 2 ? "#bfe3ff" : "#d6f0cf"}" stroke="${INK}" stroke-width="0.45"/>`
        + texAt(String(j), ox + (i + 0.5) * cell, y + cell * 0.72, { em: cell * 0.62 }) + `</g>`;
    }
    out += texAt(`\\to ${total}`, ox + j * cell + 2.5, y + cell * 0.72, { em: cell * 0.62, color: RED, anchor: "start", attrs: `data-mb="num" data-k="t${j}"` });
  }
  return out;
}
export function series123() {
  const { write, main, side, at, SIDE, line } = kit();
  const rowIn = (s, H, j, start = 0) => { for (let i = 0; i < j; i++) { const c = s?.querySelector(`[data-k="s${j}_${i}"]`); if (c) H.write(c, start + i * 0.12); } };
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "Series: 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, ... (each number is repeated as many times as its value). What is the 25th number? What is the sum of the first 20 numbers?" }],
    pics: {
      st: () => svgBox(150, 54, seriesRows(7, 6.4, 75 - 30, 2)),
      mQ: () => main([line("a", "21 < 25 \\le 28")]),
      m25: () => main([line("a", "25\\text{th number}"), line("e", "="), line("b", "7", GREEN)]),
      mS: () => main([line("a", "1 + 4 + 9 + 16 + 25"), line("e", "="), line("b", "55", BLUE)]),
      s6: () => side([[line("a", "5 \\times 6 = 30")]]),
      mT: () => main([line("a", "55 + 30"), line("e", "="), line("b", "85", GREEN)]),
      mF: () => main([line("a", "\\text{row } n \\text{ ends at}"), line("b", "\\dfrac{n(n+1)}{2}", BLUE)]),
      sF: () => side([[line("a", "\\tfrac{6 \\times 7}{2} = 21")], [line("b", "\\tfrac{7 \\times 8}{2} = 28")]], 4.8),
      mR: () => main([line("a", "\\text{row } n \\text{ adds to}"), line("b", "n \\times n", BLUE)]),
    },
    picAt: { st: at(13), mQ: at(38.5), m25: at(38.5), mS: at(38.5), s6: SIDE, mT: at(38.5), mF: at(38.5), sF: SIDE, mR: at(38.5) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Build the staircase", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "Use the formula", y: 50.5 },
    ],
    stages: {
      "st.r1": (s, H) => rowIn(s, H, 1), "st.r2": (s, H) => rowIn(s, H, 2), "st.r3": (s, H) => rowIn(s, H, 3),
      "st.r47": (s, H) => { [4, 5, 6, 7].forEach((j, n) => rowIn(s, H, j, n * 0.6)); },
      ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((j) => [`st.t${j}`, (s, H) => write(s, H, [`t${j}`], 0)])),
      "mQ.all": (s, H) => write(s, H, ["a"], 0),
      "m25.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.4); write(s, H, ["b"], 1.2); H.sound("ding", 1.4); },
      "mS.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.8),
      "s6.all": (s, H) => write(s, H, ["a"], 0),
      "mT.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.4); write(s, H, ["b"], 1.2); H.sound("ding", 1.4); },
      "mF.all": (s, H) => write(s, H, ["a", "b"], 0, 0.6),
      "sF.a": (s, H) => write(s, H, ["a"], 0), "sF.b": (s, H) => write(s, H, ["b"], 0),
      "mR.all": (s, H) => write(s, H, ["a", "b"], 0, 0.6),
    },
    steps: ({ push, look }) => {
      push("Here's a series. One, two, two, three, three, three. Each number appears as many times as it says.", { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Two questions. What's the twenty fifth number? And what do the first twenty add up to?", { pause: 1 });
      push("Put each number on its own row. One. Two, two. Three, three, three.",
        { on: ["st", "k1"], add: ["st.r1", "st.r2", "st.r3"], cue: { "st.r1": "one.", "st.r2": "two, two", "st.r3": "three, three" },
          transition: { kind: "card", title: "Method 1", sub: "Build the staircase", hold: 1.6 }, pause: 0.5 });
      push("Four, four, four, four. And so on, down to the sevens.", { add: ["st.r47"], cue: { "st.r47": "four, four" }, pause: 0.6 });
      push("Now count where each row ends. One... three... six... ten... fifteen... twenty one... twenty eight.",
        { add: ["st.t1", "st.t2", "st.t3", "st.t4", "st.t5", "st.t6", "st.t7"],
          cue: { "st.t1": "one...", "st.t2": "three...", "st.t3": "six...", "st.t4": "ten...", "st.t5": "fifteen...", "st.t6": "twenty one...", "st.t7": "twenty eight" }, pause: 0.8 });
      push("Those are the staircase numbers again. One plus two plus three, and so on.", { pause: 0.8 });
      push("Row six ends at twenty one. Row seven ends at twenty eight. So the twenty fifth number is in row seven.",
        { on: ["mQ"], add: ["mQ.all"], cue: { "mQ.all": "so the twenty fifth" }, pause: 0.8 });
      push("Every number in row seven is a seven. So the twenty fifth number is seven.", { on: ["m25"], off: ["mQ"], add: ["m25.all"], cue: { "m25.all": "so the twenty fifth" }, pause: 1.2 });
      push("Now the sum of the first twenty. Row five ends at fifteen, so the first fifteen numbers are rows one to five.", { off: ["m25"], pause: 0.8 });
      push("Row one adds to one. Row two, four. Row three, nine. Row four, sixteen. Row five, twenty five. Fifty five.",
        { on: ["mS"], add: ["mS.all"], cue: { "mS.all": "row one adds" }, pause: 0.8 });
      push("That's fifteen numbers. Five more to reach twenty, and they're all sixes. Five sixes, thirty.", { on: ["s6"], add: ["s6.all"], cue: { "s6.all": "five sixes" }, pause: 0.8 });
      push("Fifty five and thirty... eighty five.", { on: ["mT"], off: ["mS"], add: ["mT.all"], cue: { "mT.all": "fifty five and" }, pause: 1.2 });
      push("Now with the formula. Row n ends at n times n plus one, over two.",
        { on: ["mF", "k2"], off: ["mT", "s6", "k1"], add: ["mF.all"], cue: { "mF.all": "row n ends" },
          transition: { kind: "card", title: "Method 2", sub: "Use the formula", hold: 1.6 }, pause: 0.6 });
      push("Try six: six times seven over two, twenty one. Too small. Seven: seven times eight over two, twenty eight. That passes twenty five.",
        { on: ["sF"], add: ["sF.a", "sF.b"], cue: { "sF.a": "try six", "sF.b": "seven:" }, pause: 0.8 });
      push("So the twenty fifth number is in row seven. It's seven.", { pause: 0.8 });
      push("And row n adds to n times n, because it's n copies of n. That's how we got one, four, nine, sixteen, twenty five.",
        { on: ["mR"], off: ["mF"], add: ["mR.all"], cue: { "mR.all": "row n adds" }, pause: 0.8 });
      push("Two answers: the twenty fifth number is seven, and the first twenty add up to eighty five.");
    },
  });
}
