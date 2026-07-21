/* Generates data/vocab/body-map.js — 37 organs across 7 body systems — from
   the EBI anatomogram (CC-BY-4.0), the same build-time bake as the two maps.
   Hand-curated on top of it, exactly as gen-nigeria-map.mjs curates states:
     - KEEP     the anatomogram carries 76 tagged regions; most are not quiz
                answers. Tissues (blood, adipose, bone marrow, skin, muscle
                tissue), reproductive organs, and sub-parts too fine to see on
                a whole-body figure (heart valves, brain subregions) are all
                left out. What remains is what a school actually asks for.
     - RENAME   UBERON's clinical labels are not classroom words: "oral
                cavity" is the mouth, "vermiform appendix" the appendix. The
                site is Nigerian, so British spelling — "oesophagus".
     - HINT     one line per organ, and a clue must NEVER contain its own
                answer (asserted below).

   ATTRIBUTION. Unlike Natural Earth (public domain) the anatomogram artwork is
   CC-BY-4.0, so the page that draws this owes a visible credit. That is a real
   obligation, not a nicety — see the banner written into the output file.

   RUNNING IT (rarely needed — only to re-curate). Unlike the map generators
   this one needs NOTHING installed; the SVG is parsed by the small reader
   below. From any scratch directory:
     curl -LO https://raw.githubusercontent.com/ebi-gene-expression-group/anatomogram/master/src/svg/homo_sapiens.male.svg
     node /path/to/prep-portal/scripts/gen-body-map.mjs
   Writes the data file into the repo next to itself.

   WHY THE GEOMETRY WORK IS SAFE. Three properties of this SVG were measured
   before any of it was written, and every one is ASSERTED at run time rather
   than trusted — if a future version of the artwork breaks one, this script
   stops instead of quietly emitting wrong shapes:
     1. no transform has rotation or skew, so a transform is only
        x' = a*x + e, y' = d*y + f;
     2. no tagged region nests inside another, and none has a transformed
        ancestor, so transforms accumulate only downward;
     3. path data is absolute throughout.
   Together those also make the handful of elliptical arcs safe: an
   axis-aligned ellipse stays axis-aligned under scale+translate, so the radii
   scale and the flags are untouched. No arc-to-cubic conversion is needed.

   Output is pure `M..L..Z` polylines — the same shape nigeria-map.js already
   is, so the game's existing map renderer draws this with no new code. */
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'vocab', 'body-map.js');
const SRC = 'homo_sapiens.male.svg';

const W = 1000;      // final box width, matching the two maps
const TOL = 0.4;     // simplification tolerance, in final units (sub-pixel)
const MIN_AREA = 1.5; // drop specks smaller than this, in final units²

// ── The curation ────────────────────────────────────────────────────────
const S = { CIRC: 0, RESP: 1, DIG: 2, NERV: 3, URIN: 4, ENDO: 5, LYMPH: 6 };
const SYSTEM_KEYS = ['circulatory', 'respiratory', 'digestive', 'nervous',
  'urinary', 'endocrine', 'lymphatic'];
// One soft, distinct colour per system, so the whole body reads as its systems
// at a glance (and a scoped round is a bright band of one colour). Lock-step
// with SYSTEM_KEYS. Muted to sit inside the soft-UI theme.
const SYSTEM_COLORS = {
  circulatory: '#e28a8a', // soft red — blood
  respiratory: '#8ec2e2', // soft blue — air
  digestive: '#eab97a', // soft orange — gut
  nervous: '#b89bd6', // soft purple — nerves
  urinary: '#cdd579', // soft lime — kidneys
  endocrine: '#7fc9bb', // soft teal — glands
  lymphatic: '#e6a4c6', // soft pink — lymph
};

// UBERON id -> [system, classroom name, clue, minGrade]
//
// minGrade tiers the organs by difficulty (the topic is offered from Grade 3;
// each organ is only ASKED once the room is at its grade). The everyday organs
// a young child already names come in at 3; the fine gut/gland anatomy waits
// for the senior-biology grades. `topicPool(…, grade)` does the filtering, so a
// Grade 3 room and a Grade 12 room derive different pools from the one file.
const KEEP = {
  // ── Circulatory ──
  UBERON_0000948: [S.CIRC, 'heart', 'The muscular pump that keeps blood moving through the body.', 3],
  UBERON_0000947: [S.CIRC, 'aorta', "The body's largest vessel, carrying blood out of the left ventricle.", 7],
  UBERON_0001637: [S.CIRC, 'artery', 'A thick-walled vessel that carries blood away from the pump.', 6],
  UBERON_0001621: [S.CIRC, 'coronary artery', 'The vessel that feeds the heart muscle itself.', 9],
  // ── Respiratory ──
  UBERON_0002048: [S.RESP, 'lung', 'The spongy organ where oxygen crosses into the blood.', 3],
  UBERON_0003126: [S.RESP, 'trachea', 'The windpipe — a tube held open by rings of cartilage.', 5],
  UBERON_0002185: [S.RESP, 'bronchus', 'One of the two branches the windpipe splits into.', 7],
  UBERON_0001103: [S.RESP, 'diaphragm', 'The sheet of muscle below the ribs that drives breathing.', 6],
  UBERON_0000004: [S.RESP, 'nose', 'Where air is warmed and filtered on its way in.', 3],
  UBERON_0000341: [S.RESP, 'throat', 'The passage where the food and air pathways cross.', 4],
  // ── Digestive ──
  UBERON_0000167: [S.DIG, 'mouth', 'Where digestion begins, with chewing and saliva.', 3],
  UBERON_0001723: [S.DIG, 'tongue', 'The muscle that tastes food and shapes speech.', 3],
  UBERON_0001043: [S.DIG, 'oesophagus', 'The tube that carries a swallowed bite down to the stomach.', 6],
  UBERON_0000945: [S.DIG, 'stomach', 'The muscular bag where food is churned with acid.', 3],
  UBERON_0002114: [S.DIG, 'duodenum', 'The first C-shaped stretch of gut just past the stomach.', 9],
  UBERON_0002116: [S.DIG, 'ileum', 'The last and longest stretch of the small intestine.', 9],
  UBERON_0002108: [S.DIG, 'small intestine', 'The long coiled tube where most nutrients are absorbed.', 5],
  UBERON_0001153: [S.DIG, 'caecum', 'The pouch at the very start of the large bowel.', 9],
  UBERON_0001154: [S.DIG, 'appendix', 'A narrow dead-end tube at the start of the large bowel.', 7],
  UBERON_0001155: [S.DIG, 'colon', 'The large bowel, where water is reclaimed from waste.', 5],
  UBERON_0001052: [S.DIG, 'rectum', 'The final straight section, where waste waits to leave.', 6],
  UBERON_0002107: [S.DIG, 'liver', 'The largest internal organ; it makes bile and cleans the blood.', 3],
  UBERON_0002110: [S.DIG, 'gallbladder', 'The small sac that stores bile until a meal arrives.', 6],
  UBERON_0001264: [S.DIG, 'pancreas', 'It makes insulin, and juices that break down food.', 5],
  // ── Nervous ──
  UBERON_0000955: [S.NERV, 'brain', 'The control centre inside the skull.', 3],
  UBERON_0002037: [S.NERV, 'cerebellum', 'The small folded part at the back that keeps you balanced.', 7],
  UBERON_0002240: [S.NERV, 'spinal cord', 'The thick cable of tissue running down inside the backbone.', 5],
  UBERON_0001021: [S.NERV, 'nerve', 'A fibre carrying signals between the brain and the body.', 6],
  UBERON_0000970: [S.NERV, 'eye', 'The organ that focuses light to form an image.', 3],
  // ── Urinary ──
  UBERON_0002113: [S.URIN, 'kidney', 'One of a pair of bean-shaped filters for the blood.', 3],
  UBERON_0001255: [S.URIN, 'bladder', 'The stretchy bag that stores urine.', 4],
  // ── Endocrine ──
  UBERON_0002046: [S.ENDO, 'thyroid gland', "The butterfly-shaped gland in the neck that sets the body's pace.", 7],
  UBERON_0002369: [S.ENDO, 'adrenal gland', 'A small cap on top of each kidney, releasing the fight-or-flight hormone.', 9],
  UBERON_0000007: [S.ENDO, 'pituitary gland', 'The pea-sized master gland at the base of the brain.', 9],
  // ── Lymphatic ──
  UBERON_0002106: [S.LYMPH, 'spleen', 'It filters blood and recycles worn-out red cells.', 5],
  UBERON_0000029: [S.LYMPH, 'lymph node', "A small filter station on the body's drainage network.", 7],
  UBERON_0002372: [S.LYMPH, 'tonsil', 'A patch of guard tissue at the back of the mouth.', 6],
};

/* DELIBERATELY EXCLUDED, so a future edit does not "restore" them by mistake:
   - retina (UBERON_0000966) draws the IDENTICAL path to the eye. Shipping both
     would put one picture on the board with two correct answers.
   - blood vessel (UBERON_0001981) is likewise identical to artery.
   - Ammon's horn / hippocampal formation are identical to each other, and both
     are far past school level anyway. */

// ── A very small XML reader ─────────────────────────────────────────────
// Enough for this file and nothing more: elements, attributes, nesting. Text
// nodes, entities, CDATA and namespaces beyond the prefix are all ignored,
// because none of them carry geometry.
function parseXML(src) {
  const root = { tag: '#root', attrs: {}, kids: [] };
  const stack = [root];
  const tagRe = /<(\/)?([A-Za-z_][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/)?>/g;
  let m;
  while ((m = tagRe.exec(src))) {
    const [, close, name, attrSrc, selfClose] = m;
    if (name === '?xml' || name.startsWith('!')) continue;
    if (close) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const attrs = {};
    const aRe = /([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let a;
    while ((a = aRe.exec(attrSrc))) attrs[a[1]] = a[3] !== undefined ? a[3] : a[4];
    const node = { tag: name.replace(/^.*:/, ''), attrs, kids: [] };
    stack[stack.length - 1].kids.push(node);
    if (!selfClose) stack.push(node);
  }
  return root;
}

const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
const nums = (s) => (s.match(NUM) || []).map(Number);

// ── Transforms: [a, d, e, f] for x' = a*x + e, y' = d*y + f ─────────────
function parseTransform(s, who) {
  let t = [1, 1, 0, 0];
  for (const [, name, args] of (s || '').matchAll(/([a-zA-Z]+)\s*\(([^)]*)\)/g)) {
    const n = nums(args);
    let u;
    if (name === 'matrix') {
      if (Math.abs(n[1]) > 1e-9 || Math.abs(n[2]) > 1e-9) {
        throw new Error(`rotation/skew in a transform on ${who} — the flattening `
          + 'here assumes scale+translate only; this artwork needs a full matrix path');
      }
      u = [n[0], n[3], n[4], n[5]];
    } else if (name === 'translate') u = [1, 1, n[0], n[1] || 0];
    else if (name === 'scale') u = [n[0], n.length > 1 ? n[1] : n[0], 0, 0];
    else throw new Error(`unhandled transform "${name}" on ${who}`);
    t = [t[0] * u[0], t[1] * u[1], t[0] * u[2] + t[2], t[1] * u[3] + t[3]];
  }
  return t;
}
const compose = (p, c) => [p[0] * c[0], p[1] * c[1], p[0] * c[2] + p[2], p[1] * c[3] + p[3]];
const xf = (t, x, y) => [t[0] * x + t[2], t[1] * y + t[3]];

// ── Geometry -> point rings ─────────────────────────────────────────────
function cubic(p0, p1, p2, p3, out, steps) {
  for (let k = 1; k <= steps; k++) {
    const t = k / steps, u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
}

// Endpoint -> centre parameterisation, SVG spec F.6.5. xRot is 0 everywhere in
// this artwork but is honoured rather than assumed away.
function arc(p0, rx, ry, xRot, laf, sf, p1, out, steps = 24) {
  if (!rx || !ry) { out.push(p1); return; }
  const phi = (xRot * Math.PI) / 180, cp = Math.cos(phi), sp = Math.sin(phi);
  const dx = (p0[0] - p1[0]) / 2, dy = (p0[1] - p1[1]) / 2;
  const x1 = cp * dx + sp * dy, y1 = -sp * dx + cp * dy;
  const lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s; }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const co = Math.sqrt(Math.max(0, num / den)) * (laf === sf ? -1 : 1);
  const cx1 = (co * rx * y1) / ry, cy1 = (-co * ry * x1) / rx;
  const cx = cp * cx1 - sp * cy1 + (p0[0] + p1[0]) / 2;
  const cy = sp * cx1 + cp * cy1 + (p0[1] + p1[1]) / 2;
  const ang = (ux, uy, vx, vy) => {
    const d = Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1;
    return (ux * vy - uy * vx < 0 ? -1 : 1)
      * Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / d)));
  };
  const th0 = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let dth = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!sf && dth > 0) dth -= 2 * Math.PI;
  else if (sf && dth < 0) dth += 2 * Math.PI;
  for (let k = 1; k <= steps; k++) {
    const th = th0 + (dth * k) / steps;
    out.push([cx + rx * Math.cos(th) * cp - ry * Math.sin(th) * sp,
      cy + rx * Math.cos(th) * sp + ry * Math.sin(th) * cp]);
  }
}

function pathRings(d, t, who, rings) {
  const toks = d.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || [];
  let cur = [], cmd = null, i = 0;
  const at = () => (cur.length ? cur[cur.length - 1] : [0, 0]);
  const v = (k) => toks.slice(i, i + k).map(Number);
  while (i < toks.length) {
    if (/^[A-Za-z]$/.test(toks[i])) {
      cmd = toks[i++];
      if (cmd === 'Z' || cmd === 'z') { if (cur.length) rings.push(cur); cur = []; continue; }
      if (cmd !== cmd.toUpperCase()) {
        throw new Error(`relative path command "${cmd}" on ${who} — this reader `
          + 'only handles absolute data');
      }
    }
    if (cmd === 'M' || cmd === 'L') {
      const a = v(2); i += 2;
      if (cmd === 'M') { if (cur.length) rings.push(cur); cur = [xf(t, a[0], a[1])]; }
      else cur.push(xf(t, a[0], a[1]));
      // A command letter governs every following coordinate group until the
      // next letter — and the repeats after an M are implicit LINETOS, not
      // more moveTos. Treating them as moveTos shatters one outline into
      // hundreds of single-point rings, which is silent and looks like data
      // corruption much later. Inkscape output is full of this.
      if (cmd === 'M') cmd = 'L';
    } else if (cmd === 'C') {
      const a = v(6); i += 6;
      const p0 = at();
      const steps = Math.max(3, Math.min(24,
        Math.round(Math.hypot(a[4] - p0[0], a[5] - p0[1]) * SCALE / 6) + 3));
      cubic(p0, xf(t, a[0], a[1]), xf(t, a[2], a[3]), xf(t, a[4], a[5]), cur, steps);
      // control points already transformed; p0 is too, so this is consistent
    } else if (cmd === 'A') {
      const a = v(7); i += 7;
      if (t[0] * t[1] < 0) throw new Error(`mirroring transform on an arc on ${who}`);
      arc(at(), Math.abs(t[0]) * a[0], Math.abs(t[1]) * a[1], a[2], a[3], a[4],
        xf(t, a[5], a[6]), cur);
    } else {
      throw new Error(`unhandled path command "${cmd}" on ${who}`);
    }
  }
  if (cur.length) rings.push(cur);
}

let SCALE = 1; // set once the viewBox is known; used to size curve stepping

function collect(node, t, who, rings, byId, depth = 0) {
  if (depth > 40) throw new Error(`nesting too deep (a <use> cycle?) on ${who}`);
  t = compose(t, parseTransform(node.attrs.transform, who));
  const A = node.attrs;
  if (node.tag === 'path') {
    if ((A.d || '').trim()) pathRings(A.d, t, who, rings);
  } else if (node.tag === 'ellipse' || node.tag === 'circle') {
    const cx = +(A.cx || 0), cy = +(A.cy || 0);
    const rx = +(A.rx ?? A.r ?? 0), ry = +(A.ry ?? A.r ?? 0);
    const c = xf(t, cx, cy), RX = Math.abs(t[0]) * rx, RY = Math.abs(t[1]) * ry;
    const ring = [];
    for (let k = 0; k < 32; k++) {
      const th = (2 * Math.PI * k) / 32;
      ring.push([c[0] + RX * Math.cos(th), c[1] + RY * Math.sin(th)]);
    }
    rings.push(ring);
  } else if (node.tag === 'rect') {
    const x = +(A.x || 0), y = +(A.y || 0), w = +(A.width || 0), h = +(A.height || 0);
    rings.push([xf(t, x, y), xf(t, x + w, y), xf(t, x + w, y + h), xf(t, x, y + h)]);
  } else if (node.tag === 'use') {
    const href = (A['xlink:href'] || A.href || '').replace(/^#/, '');
    const tgt = byId[href];
    if (!tgt) throw new Error(`<use> points at a missing id "${href}" on ${who}`);
    collect(tgt, compose(t, [1, 1, +(A.x || 0), +(A.y || 0)]), who, rings, byId, depth + 1);
    return;
  }
  for (const k of node.kids) collect(k, t, who, rings, byId, depth + 1);
}

// ── Ramer-Douglas-Peucker ───────────────────────────────────────────────
function rdp(pts, tol) {
  if (pts.length < 3) return pts;
  const [x0, y0] = pts[0], [x1, y1] = pts[pts.length - 1];
  const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy);
  let worst = -1, wi = 0;
  for (let k = 1; k < pts.length - 1; k++) {
    const [px, py] = pts[k];
    const dist = n ? Math.abs(dy * px - dx * py + x1 * y0 - y1 * x0) / n
      : Math.hypot(px - x0, py - y0);
    if (dist > worst) { worst = dist; wi = k; }
  }
  if (worst <= tol) return [pts[0], pts[pts.length - 1]];
  return rdp(pts.slice(0, wi + 1), tol).slice(0, -1).concat(rdp(pts.slice(wi), tol));
}

const signedArea = (p) => {
  let A = 0;
  for (let k = 0; k < p.length; k++) {
    const [x0, y0] = p[k], [x1, y1] = p[(k + 1) % p.length];
    A += x0 * y1 - x1 * y0;
  }
  return A / 2;
};

// ── Read, flatten, bake ─────────────────────────────────────────────────
if (!fs.existsSync(SRC)) {
  console.error(`${SRC} not found in ${process.cwd()}.\nFetch it first:\n  curl -LO `
    + 'https://raw.githubusercontent.com/ebi-gene-expression-group/anatomogram/'
    + 'master/src/svg/homo_sapiens.male.svg');
  process.exit(1);
}
const doc = parseXML(fs.readFileSync(SRC, 'utf8'));

const all = [];
(function walk(n) { all.push(n); n.kids.forEach(walk); })(doc);
const byId = {};
for (const n of all) if (n.attrs.id) byId[n.attrs.id] = n;

const svgEl = all.find((n) => n.tag === 'svg');
const vb = nums(svgEl.attrs.viewBox);
SCALE = W / vb[2];
const H = Math.round(vb[3] * SCALE);

// Assert property 2 — nothing above a region moves it, nothing nests.
const parentOf = new Map();
(function link(n) { for (const k of n.kids) { parentOf.set(k, n); link(k); } })(doc);
const tagged = all.filter((n) => (n.attrs.id || '').startsWith('UBERON_'));
for (const n of tagged) {
  for (let p = parentOf.get(n); p; p = parentOf.get(p)) {
    if (p.attrs.transform) throw new Error(`${n.attrs.id} has a transformed ancestor`);
    if ((p.attrs.id || '').startsWith('UBERON_')) {
      throw new Error(`${n.attrs.id} is nested inside ${p.attrs.id}`);
    }
  }
}

const fmt = (v) => {
  const s = v.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
};

const rows = [];
for (const [uid, [system, name, hint, minGrade]] of Object.entries(KEEP)) {
  const node = byId[uid];
  if (!node) throw new Error(`${uid} (${name}) is not in ${SRC}`);
  const raw = [];
  collect(node, [1, 1, 0, 0], `${uid} (${name})`, raw, byId);

  const rings = [];
  for (const r of raw) {
    if (r.length < 3) continue;
    const scaled = r.map(([x, y]) => [x * SCALE, y * SCALE]);
    const s = rdp(scaled, TOL);
    if (s.length >= 3 && Math.abs(signedArea(s)) >= MIN_AREA) rings.push(s);
  }
  if (!rings.length) throw new Error(`${uid} (${name}) flattened to nothing`);

  // Anchor on the biggest ring, same idea as a state's biggest landmass.
  const big = rings.reduce((a, b) => (Math.abs(signedArea(a)) > Math.abs(signedArea(b)) ? a : b));
  let A = 0, cxs = 0, cys = 0;
  for (let k = 0; k < big.length; k++) {
    const [x0, y0] = big[k], [x1, y1] = big[(k + 1) % big.length];
    const cr = x0 * y1 - x1 * y0;
    A += cr; cxs += (x0 + x1) * cr; cys += (y0 + y1) * cr;
  }
  A /= 2;
  const d = rings.map((p) => `M${p.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join('L')}Z`).join('');
  rows.push({
    uid, name, hint, system, grade: minGrade, d,
    cx: Math.round((cxs / (6 * A)) * 10) / 10,
    cy: Math.round((cys / (6 * A)) * 10) / 10,
    area: rings.reduce((s, p) => s + Math.abs(signedArea(p)), 0),
  });
}
rows.sort((a, b) => a.name.localeCompare(b.name));

// ── Validate ────────────────────────────────────────────────────────────
let bad = 0;
const fail = (m) => { console.error('  !!', m); bad++; };
for (const r of rows) {
  if (r.hint.toLowerCase().includes(r.name.toLowerCase())) fail(`clue names itself: ${r.name}`);
  if (!/^[a-z][a-z ]*$/.test(r.name)) fail(`odd name: ${r.name}`);
  if (r.cx < 0 || r.cx > W || r.cy < 0 || r.cy > H) fail(`anchor off-canvas: ${r.name}`);
  if (!(r.grade >= 3 && r.grade <= 12)) fail(`grade out of 3–12: ${r.name} (${r.grade})`);
}
// The topic opens at Grade 3, so at least one organ must actually be askable
// there — otherwise the first grade that offers it deals an empty round.
if (!rows.some((r) => r.grade <= 3)) fail('no organ is askable at Grade 3');
// A duplicate outline would put one picture on the board with two answers —
// this is exactly how retina/eye and artery/blood vessel would have slipped in.
const seen = new Map();
for (const r of rows) {
  if (seen.has(r.d)) fail(`${r.name} draws the identical path to ${seen.get(r.d)}`);
  seen.set(r.d, r.name);
}
const perSystem = {};
for (const r of rows) perSystem[SYSTEM_KEYS[r.system]] = (perSystem[SYSTEM_KEYS[r.system]] || 0) + 1;
for (const k of SYSTEM_KEYS) if (!perSystem[k]) fail(`system "${k}" has no organs`);
if (bad) { console.error(`\n${bad} problem(s) — nothing written.`); process.exit(1); }

console.log(`organs baked: ${rows.length}`);
console.log('per system:', JSON.stringify(perSystem));
// Cumulative count askable AT each grade — this is what a room of that grade
// actually deals, so it is the number that matters for a playable round.
const askable = {};
for (let g = 3; g <= 12; g++) askable[g] = rows.filter((r) => r.grade <= g).length;
console.log('askable by grade:', JSON.stringify(askable));
const smallest = rows.slice().sort((a, b) => a.area - b.area).slice(0, 3);
console.log('smallest on screen:', smallest.map((r) => `${r.name} (${Math.round(r.area)}u²)`).join(', '));

// ── Emit ────────────────────────────────────────────────────────────────
const body = rows.map((r) => `  [${JSON.stringify(r.name)}, ${JSON.stringify(r.hint)}, `
  + `${r.system}, ${r.grade}, ${r.cx}, ${r.cy}, ${JSON.stringify(r.uid)}, ${JSON.stringify(r.d)}],`).join('\n');

const out = `/* ═══════════════════════════════════════════════════════
   MAP OF THE BODY — 37 organs across 7 body systems, outlines from the EBI
   anatomogram, flattened and baked to SVG paths at build time by
   scripts/gen-body-map.mjs. Systems, names and clues are hand-curated there.

   ATTRIBUTION IS REQUIRED. The artwork is © EMBL-EBI, used under CC-BY-4.0
   (https://github.com/ebi-gene-expression-group/anatomogram). Unlike the
   public-domain Natural Earth maps, any page that draws this owes a visible
   credit line. Do not ship it without one.

   Same drawn-topic shape as the two maps: the game lights ONE organ on the
   whole figure and you name it; a scoped round asks one body system.

   The topic opens at Grade 3, but each organ carries its own \`grade\` — the
   everyday organs a child already names (heart, brain, lungs…) come in at 3,
   the fine gut/gland anatomy waits for senior biology. topicPool filters by
   the room's grade, so one file feeds every grade a fair pool.

   Each row: [name, hint, system, grade, cx, cy, uberon, path]. cx/cy anchor
   the clue's locator ring on the organ's largest part. \`uberon\` is the
   ontology id the outline came from — kept only so a future re-curation can
   trace a row back to the source artwork. This file is LAZY-LOADED — never
   import it statically from index.js.
═══════════════════════════════════════════════════════ */

export const MAP_W = ${W};
export const MAP_H = ${H};

export const SYSTEM_KEYS = ${JSON.stringify(SYSTEM_KEYS)};

// One colour per system — the renderer paints each organ its system's colour,
// so the whole body reads as its systems. Derived at load, not stored per row.
export const SYSTEM_COLORS = ${JSON.stringify(SYSTEM_COLORS)};

const RAW = [
${body}
];

export const ORGANS = RAW.map(([name, hint, system, grade, cx, cy, uberon, d]) => ({
  name, hint, system: SYSTEM_KEYS[system], grade, cx, cy, uberon, d,
  fill: SYSTEM_COLORS[SYSTEM_KEYS[system]],
}));

// What the game quizzes, shaped like any other topic's words: the organ's
// NAME is the word, its one-line description is the clue, \`s\` is the body-
// system scope key a scoped round filters on, and \`g\` is the minimum grade
// topicPool uses to tier the organs by difficulty.
export const GAME_ORGANS = ORGANS.map((c) => ({ w: c.name, d: c.hint, s: c.system, g: c.grade, organ: c }));
`;

fs.writeFileSync(OUT, out);
console.log(`wrote data/vocab/body-map.js (${Math.round(fs.statSync(OUT).size / 1024)} KB, `
  + `viewBox ${W}x${H})`);
