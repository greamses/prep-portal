/* Shared SVG-flattening machinery for the sourced organ generators
   (gen-heart-map.mjs, gen-brain-map.mjs). Turns a Wikimedia SVG's paths into
   baked absolute M/L/C/Z paths in a fitted box: a tiny XML reader, a full
   relative-path parser, affine transforms (translate/matrix/scale), a
   curve-sampled bounding box, and an anchor (centroid of the biggest subpath).
   Absolute-only callers (the anatomogram) don't need this; Inkscape/Wikimedia
   output uses relative commands and matrix transforms, which this handles. */

// ── A very small XML reader: elements, attrs, nesting, parent links ────────
export function parseXML(src) {
  const root = { tag: '#root', attrs: {}, kids: [], parent: null };
  const stack = [root];
  const tagRe = /<(\/)?([A-Za-z_][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/)?>/g;
  let m;
  while ((m = tagRe.exec(src))) {
    const [, close, name, attrSrc, selfClose] = m;
    if (name === '?xml' || name.startsWith('!')) continue;
    if (close) { if (stack.length > 1) stack.pop(); continue; }
    const attrs = {};
    const aRe = /([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let a;
    while ((a = aRe.exec(attrSrc))) attrs[a[1]] = a[3] !== undefined ? a[3] : a[4];
    const node = { tag: name.replace(/^.*:/, ''), attrs, kids: [], parent: stack[stack.length - 1] };
    stack[stack.length - 1].kids.push(node);
    if (!selfClose) stack.push(node);
  }
  return root;
}

export function buildIndex(root) {
  const byId = {};
  const all = [];
  (function walk(n) { all.push(n); if (n.attrs.id) byId[n.attrs.id] = n; n.kids.forEach(walk); })(root);
  return { byId, all };
}

// ── Affine transforms [a,b,c,d,e,f]: x' = a·x + c·y + e, y' = b·x + d·y + f ──
export const I = [1, 0, 0, 1, 0, 0];
export function compose(A, B) {
  return [
    A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
  ];
}
export function parseTransform(s) {
  let T = I;
  for (const m of (s || '').matchAll(/([a-zA-Z]+)\s*\(([^)]*)\)/g)) {
    const n = m[2].split(/[\s,]+/).map(Number).filter((v) => !Number.isNaN(v));
    let U;
    if (m[1] === 'translate') U = [1, 0, 0, 1, n[0], n[1] || 0];
    else if (m[1] === 'matrix') U = n.slice(0, 6);
    else if (m[1] === 'scale') U = [n[0], 0, 0, n.length > 1 ? n[1] : n[0], 0, 0];
    else throw new Error(`unhandled transform "${m[1]}"`);
    T = compose(T, U);
  }
  return T;
}
export function chainT(node) {
  let T = I;
  const stack = [];
  for (let n = node; n; n = n.parent) stack.push(n);
  for (const n of stack.reverse()) T = compose(T, parseTransform(n.attrs.transform));
  return T;
}

// ── Path: parse (absolute+relative M L H V C Z) → absolute segments ────────
export function parsePath(d) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || [];
  let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = null;
  const segs = [];
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'M') {
      let x = num(), y = num(); if (rel) { x += cx; y += cy; }
      cx = x; cy = y; sx = x; sy = y; segs.push(['M', x, y]);
      cmd = rel ? 'l' : 'L'; // extra coord pairs after an M are implicit linetos
    } else if (C === 'L') {
      let x = num(), y = num(); if (rel) { x += cx; y += cy; } cx = x; cy = y; segs.push(['L', x, y]);
    } else if (C === 'H') {
      let x = num(); if (rel) x += cx; cx = x; segs.push(['L', cx, cy]);
    } else if (C === 'V') {
      let y = num(); if (rel) y += cy; cy = y; segs.push(['L', cx, cy]);
    } else if (C === 'C') {
      let x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
      if (rel) { x1 += cx; y1 += cy; x2 += cx; y2 += cy; x += cx; y += cy; }
      cx = x; cy = y; segs.push(['C', x1, y1, x2, y2, x, y]);
    } else if (C === 'Z') {
      cx = sx; cy = sy; segs.push(['Z']);
    } else {
      throw new Error(`unhandled path command "${cmd}" (expected M L H V C Z)`);
    }
  }
  return segs;
}
export function applyAffine(segs, T) {
  const [a, b, c, d, e, f] = T;
  const pt = (x, y) => [a * x + c * y + e, b * x + d * y + f];
  return segs.map((s) => {
    if (s[0] === 'M' || s[0] === 'L') { const [x, y] = pt(s[1], s[2]); return [s[0], x, y]; }
    if (s[0] === 'C') {
      const [x1, y1] = pt(s[1], s[2]), [x2, y2] = pt(s[3], s[4]), [x, y] = pt(s[5], s[6]);
      return ['C', x1, y1, x2, y2, x, y];
    }
    return s;
  });
}

const num1 = (v) => { const s = v.toFixed(1); return s.endsWith('.0') ? s.slice(0, -2) : s; };
export function segStr(segs) {
  return segs.map((s) => {
    if (s[0] === 'M' || s[0] === 'L') return `${s[0]}${num1(s[1])},${num1(s[2])}`;
    if (s[0] === 'C') return `C${num1(s[1])},${num1(s[2])} ${num1(s[3])},${num1(s[4])} ${num1(s[5])},${num1(s[6])}`;
    return 'Z';
  }).join('');
}

// Curve-sampled bounds — control points can sit far outside the curve, so a
// bezier is sampled along its length instead of bounded by its control hull.
export function bounds(segLists) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  const see = (x, y) => { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); };
  for (const segs of segLists) {
    let px = 0, py = 0;
    for (const s of segs) {
      if (s[0] === 'M' || s[0] === 'L') { see(s[1], s[2]); px = s[1]; py = s[2]; }
      else if (s[0] === 'C') {
        for (let n = 1; n <= 8; n++) {
          const t = n / 8, u = 1 - t;
          see(u * u * u * px + 3 * u * u * t * s[1] + 3 * u * t * t * s[3] + t * t * t * s[5],
            u * u * u * py + 3 * u * u * t * s[2] + 3 * u * t * t * s[4] + t * t * t * s[6]);
        }
        px = s[5]; py = s[6];
      }
    }
  }
  return { minx, miny, maxx, maxy };
}

// Area-weighted centroid of the biggest subpath (endpoints only) — the ring.
export function anchor(segs) {
  const subs = [];
  let cur = [];
  for (const s of segs) {
    if (s[0] === 'M') { if (cur.length) subs.push(cur); cur = [[s[1], s[2]]]; }
    else if (s[0] === 'L') cur.push([s[1], s[2]]);
    else if (s[0] === 'C') cur.push([s[5], s[6]]);
  }
  if (cur.length) subs.push(cur);
  let best = null, bestA = -1;
  for (const pts of subs) {
    if (pts.length < 3) continue;
    let A = 0, cxs = 0, cys = 0;
    for (let k = 0; k < pts.length; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % pts.length];
      const cr = x0 * y1 - x1 * y0; A += cr; cxs += (x0 + x1) * cr; cys += (y0 + y1) * cr;
    }
    A /= 2;
    if (Math.abs(A) > bestA) { bestA = Math.abs(A); best = Math.abs(A) > 1e-6 ? [cxs / (6 * A), cys / (6 * A)] : pts[0]; }
  }
  return best;
}

// Read a shape's fill, from inline style then the fill attribute.
export function fillOf(node) {
  const m = /fill:\s*([^;]+)/.exec(node.attrs.style || '');
  return ((m ? m[1] : node.attrs.fill) || '').trim().toLowerCase();
}
