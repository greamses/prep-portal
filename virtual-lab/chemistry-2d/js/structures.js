/* ============================================================================
   CHEMISTRY BENCH — chemical structures: the molecule a learner draws
   ----------------------------------------------------------------------------
   Pure, and testable in node. A molecule is atoms and bonds, nothing else:

     { atoms: [{ id, el, x, y, q }], bonds: [{ a, b, o }], n }

   el is a symbol, q a charge, o the bond order (1, 2, 3); n hands out ids.
   Everything shown about it is WORKED OUT from that: the formula (Hill
   order), Mr, an atom with more bonds than it can make, the hydrogens it is
   still short of (fillH), and for the Lewis view the lone pairs on each
   atom: outer electrons − electrons in bonds − charge, two to a pair.

   It is drawn as a full structural formula, every atom written, carbon
   included: the way a school draws it, not the skeletal shorthand.
   ========================================================================== */

import { bySymbol, placeOf } from "./atoms.js";

export const BOND = 50;     // a bond between two heavy atoms
export const BOND_H = 42;   // a bond to hydrogen is drawn a little shorter

const NORMAL = { H: 1, B: 3, C: 4, Si: 4, N: 3, P: 3, O: 2, S: 2, F: 1, Cl: 1, Br: 1, I: 1 };
const MOST = { H: 1, B: 4, C: 4, Si: 4, N: 4, P: 5, O: 3, S: 6, F: 1, Cl: 7, Br: 7, I: 7 };

export const empty = () => ({ atoms: [], bonds: [], n: 0 });
export const clone = (m) => JSON.parse(JSON.stringify(m));
export const atomOf = (m, id) => m.atoms.find((a) => a.id === id);
export const bondsOf = (m, id) => m.bonds.filter((b) => b.a === id || b.b === id);
export const bondSum = (m, id) => bondsOf(m, id).reduce((t, b) => t + b.o, 0);
export const bondBetween = (m, a, b) => m.bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
const other = (b, id) => (b.a === id ? b.b : b.a);

export function addAtom(m, el, x, y) { const a = { id: ++m.n, el, x, y, q: 0 }; m.atoms.push(a); return a; }
export function addBond(m, a, b, o = 1) {
  if (a === b) return null;
  const old = bondBetween(m, a, b);
  if (old) { old.o = o; return old; }
  const bond = { a, b, o };
  m.bonds.push(bond);
  return bond;
}
export function removeAtom(m, id) { m.atoms = m.atoms.filter((a) => a.id !== id); m.bonds = m.bonds.filter((b) => b.a !== id && b.b !== id); }
export function removeBond(m, bond) { m.bonds = m.bonds.filter((b) => b !== bond); }

/** How many bonds the atom usually makes, allowing for its charge (NH4+ makes four, O− one). */
export function usual(el, q = 0) {
  const n = NORMAL[el];
  if (n == null) return 0;
  const v = outer(el);
  return Math.max(0, v >= 5 ? n + q : n - Math.abs(q));
}
/** Electrons in the outer shell of the free atom. */
export const outer = (el) => { const e = bySymbol(el); return e ? placeOf(e.z).valence : 0; };

const deg = (r) => (r * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;
const norm = (d) => ((d % 360) + 360) % 360;
const gap = (a, b) => { const d = Math.abs(norm(a) - norm(b)); return Math.min(d, 360 - d); };
/** The directions (degrees, y downward) the atom's bonds leave it in. */
export const anglesOf = (m, id) => { const a = atomOf(m, id); return bondsOf(m, id).map((b) => { const t = atomOf(m, other(b, id)); return norm(deg(Math.atan2(t.y - a.y, t.x - a.x))); }); };

/** Where k more bonds should leave an atom that already has bonds going `taken` ways. */
export function freeDirections(taken, k) {
  if (!k) return [];
  const d = taken.length + k;
  if (!taken.length) return ({ 1: [0], 2: [180, 0], 3: [180, 0, 90], 4: [270, 0, 90, 180] })[k] || Array.from({ length: k }, (_, i) => (i * 360) / k);
  if (taken.length === 1) {
    const t = taken[0];
    if (d === 2) return [norm(t + 180)];
    if (d === 3) return [norm(t + 120), norm(t + 240)];
    if (d === 4) return [norm(t + 90), norm(t + 180), norm(t + 270)];
  }
  // otherwise into the widest gap, one at a time
  const out = [], all = taken.slice();
  for (let i = 0; i < k; i++) {
    const s = all.slice().sort((a, b) => a - b);
    let best = 0, at = 0;
    s.forEach((a, j) => { const b = j + 1 < s.length ? s[j + 1] : s[0] + 360; if (b - a > best) { best = b - a; at = a + (b - a) / 2; } });
    out.push(norm(at));
    all.push(norm(at));
  }
  return out;
}

/** Give every atom the hydrogens it is still short of. Returns how many were added. */
export function fillH(m) {
  let added = 0;
  for (const a of m.atoms.slice()) {
    if (a.el === "H") continue;
    const need = usual(a.el, a.q) - bondSum(m, a.id);
    if (need <= 0) continue;
    for (const t of freeDirections(anglesOf(m, a.id), need)) {
      const h = addAtom(m, "H", a.x + BOND_H * Math.cos(rad(t)), a.y + BOND_H * Math.sin(rad(t)));
      addBond(m, a.id, h.id, 1);
      added++;
    }
  }
  return added;
}

/** Lone pairs (and an odd electron) on an atom: what is left of its outer shell after bonding. */
export function lonePairs(m, a) {
  const left = Math.max(0, outer(a.el) - bondSum(m, a.id) - a.q);
  return { pairs: Math.floor(left / 2), odd: left % 2 };
}

// ── what can be said about it ───────────────────────────────────────────────
const counts = (m) => { const c = {}; for (const a of m.atoms) c[a.el] = (c[a.el] || 0) + 1; return c; };
// electronegativity: without carbon the less electronegative element is written first (NaCl, SO2)
const EN = { Na: 0.9, K: 0.8, Li: 1, Ca: 1, Mg: 1.3, Al: 1.6, B: 2, Si: 1.9, P: 2.19, H: 2.2, S: 2.58, I: 2.66, C: 2.55, Br: 2.96, N: 3.04, Cl: 3.16, O: 3.44, F: 3.98 };
/**
 * The order a school writes a formula in. With carbon, Hill order: C, H, then the rest
 * alphabetically (C2H6O). Without it, least electronegative first (H2O, HCl, SO2) — except
 * that the hydrides of nitrogen and phosphorus are NH3 and PH3 by long custom.
 */
export function formulaParts(m) {
  const c = counts(m);
  const keys = Object.keys(c).sort();
  const order = c.C
    ? ["C", ...(c.H ? ["H"] : []), ...keys.filter((k) => k !== "C" && k !== "H")]
    : keys.sort((a, b) => ((a === "N" || a === "P") && b === "H" ? -1 : (b === "N" || b === "P") && a === "H" ? 1 : (EN[a] ?? 2) - (EN[b] ?? 2)));
  return order.map((k) => [k, c[k]]);
}
export const charge = (m) => m.atoms.reduce((t, a) => t + a.q, 0);
const sign = (q) => (q ? `${Math.abs(q) > 1 ? Math.abs(q) : ""}${q > 0 ? "+" : "−"}` : "");
export function formulaHtml(m) {
  const q = charge(m);
  return formulaParts(m).map(([k, n]) => `${k}${n > 1 ? `<sub>${n}</sub>` : ""}`).join("") + (q ? `<sup>${sign(q)}</sup>` : "");
}
export const formulaText = (m) => formulaParts(m).map(([k, n]) => `${k}${n > 1 ? n : ""}`).join("") + sign(charge(m));
export const massOf = (m) => m.atoms.reduce((t, a) => t + (bySymbol(a.el) ? bySymbol(a.el).ar : 0), 0);

/** Atoms with more bonds than they can make, and pieces left lying apart. */
export function problems(m) {
  const out = [];
  for (const a of m.atoms) {
    const most = MOST[a.el];
    const b = bondSum(m, a.id);
    const max = most == null ? null : Math.max(0, most + (outer(a.el) >= 5 ? Math.max(0, a.q) : -Math.abs(a.q)));
    if (max != null && b > max) out.push({ id: a.id, text: `${bySymbol(a.el).name} has ${b} bonds here; it can make ${max === 1 ? "only one" : `at most ${max}`}.` });
  }
  return out;
}
/**
 * Things worth a second look that are not errors: an atom whose octet is complete would carry a
 * different charge from the one drawn (OH with no charge is a radical; O with one bond wants a −),
 * and an odd electron. Only for the atoms a school writes octets for.
 */
const OCTET = new Set(["B", "C", "N", "O", "F", "Cl", "Br", "I"]);
export function hints(m) {
  const out = [];
  for (const a of m.atoms) {
    if (!OCTET.has(a.el)) continue;
    const b = bondSum(m, a.id);
    if (!b) continue;
    const full = outer(a.el) + b - 8;               // the charge that gives it a full shell of eight
    if (full !== a.q && b <= 4 && full >= -3 && full <= 3 && !problems(m).some((p) => p.id === a.id)) {
      const nm = bySymbol(a.el).name;
      out.push({ id: a.id, text: `${nm} with ${b} bond${b > 1 ? "s" : ""} and ${a.q ? `a charge of ${sign(a.q)}` : "no charge"} has ${a.q === full ? "" : "an incomplete or odd outer shell"}: a full shell would make it ${full ? sign(full) : "neutral"}.` });
    }
  }
  return out;
}
/** How many separate pieces (molecules or ions) the drawing is. */
export function pieces(m) {
  const seen = new Set();
  let n = 0;
  for (const a of m.atoms) {
    if (seen.has(a.id)) continue;
    n++;
    const stack = [a.id];
    while (stack.length) { const id = stack.pop(); if (seen.has(id)) continue; seen.add(id); bondsOf(m, id).forEach((b) => stack.push(other(b, id))); }
  }
  return n;
}

// ── drawing it ──────────────────────────────────────────────────────────────
const COLOUR = { O: "var(--accent-danger)", N: "var(--accent-secondary)", F: "var(--accent-success)", Cl: "var(--accent-success)", Br: "#b5562c", I: "#7d4fb0", S: "#b08a00", P: "#c06a1a" };
export const colourOf = (el) => COLOUR[el] || "currentColor";
const f1 = (v) => v.toFixed(1);

/** Choose where an atom's lone pairs sit: as far from its bonds and from one another as they can be. */
function pairSpots(taken, k) {
  if (!k) return [];
  const C = [270, 90, 0, 180, 315, 45, 135, 225];
  let best = null, bestMin = -1, bestSum = -1;
  const choose = (start, pick) => {
    if (pick.length === k) {
      const all = [...taken, ...pick];
      let mn = Infinity, sum = 0;
      all.forEach((a, i) => { let near = Infinity; all.forEach((b, j) => { if (i !== j) near = Math.min(near, gap(a, b)); }); if (near < mn) mn = near; sum += near === Infinity ? 360 : near; });
      if (mn > bestMin + 0.01 || (Math.abs(mn - bestMin) < 0.01 && sum > bestSum + 0.01)) { best = pick.slice(); bestMin = mn; bestSum = sum; }
      return;
    }
    for (let i = start; i < C.length; i++) { pick.push(C[i]); choose(i + 1, pick); pick.pop(); }
  };
  choose(0, []);
  return best;
}

/** The box round a drawing, for a viewBox. */
export function fitBox(m, pad = 22) {
  if (!m.atoms.length) return `0 0 100 60`;
  const xs = m.atoms.map((a) => a.x), ys = m.atoms.map((a) => a.y);
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  return `${f1(x0)} ${f1(y0)} ${f1(Math.max(...xs) - x0 + pad)} ${f1(Math.max(...ys) - y0 + pad)}`;
}

/**
 * The molecule as SVG markup (no <svg> round it). opts.lewis adds lone pairs as dot pairs;
 * opts.bad is a Set of atom ids drawn in red; opts.sel an atom id to ring.
 */
export function moleculeSvg(m, opts = {}) {
  const bad = opts.bad || new Set();
  let bonds = "", atoms = "";
  for (const b of m.bonds) {
    const A = atomOf(m, b.a), B = atomOf(m, b.b);
    if (!A || !B) continue;
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const cut = 11;                        // the line stops short of the letters
    const x1 = A.x + ux * cut, y1 = A.y + uy * cut, x2 = B.x - ux * cut, y2 = B.y - uy * cut;
    const offs = b.o === 1 ? [0] : b.o === 2 ? [-3, 3] : [-4.5, 0, 4.5];
    for (const o of offs) bonds += `<path d="M${f1(x1 + nx * o)} ${f1(y1 + ny * o)}L${f1(x2 + nx * o)} ${f1(y2 + ny * o)}"/>`;
    // a wider, invisible line to tap
    bonds += `<path class="cl-sk-hitb" data-a="${b.a}" data-b="${b.b}" d="M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}"/>`;
  }
  for (const a of m.atoms) {
    const c = bad.has(a.id) ? "var(--accent-danger)" : colourOf(a.el);
    if (opts.sel === a.id) atoms += `<circle cx="${f1(a.x)}" cy="${f1(a.y)}" r="14" fill="none" stroke="var(--accent-primary)" stroke-width="2.5"/>`;
    if (bad.has(a.id)) atoms += `<circle cx="${f1(a.x)}" cy="${f1(a.y)}" r="13" fill="color-mix(in srgb, var(--accent-danger) 18%, transparent)"/>`;
    atoms += `<text x="${f1(a.x)}" y="${f1(a.y)}" fill="${c}">${a.el}</text>`;
    if (a.q) atoms += `<text class="cl-sk-q" x="${f1(a.x + 11)}" y="${f1(a.y - 10)}" fill="${c}">${sign(a.q)}</text>`;
    if (opts.lewis) {
      const { pairs, odd } = lonePairs(m, a);
      const spots = pairSpots(anglesOf(m, a.id), pairs + odd);
      spots.forEach((t, i) => {
        const single = odd && i === spots.length - 1;
        const r = 14, x = a.x + r * Math.cos(rad(t)), y = a.y + r * Math.sin(rad(t));
        const px = -Math.sin(rad(t)) * 3.2, py = Math.cos(rad(t)) * 3.2;
        atoms += single
          ? `<circle class="cl-sk-e" cx="${f1(x)}" cy="${f1(y)}" r="2.1"/>`
          : `<circle class="cl-sk-e" cx="${f1(x + px)}" cy="${f1(y + py)}" r="2.1"/><circle class="cl-sk-e" cx="${f1(x - px)}" cy="${f1(y - py)}" r="2.1"/>`;
      });
    }
  }
  return `<g class="cl-sk-bonds">${bonds}</g><g class="cl-sk-atoms">${atoms}</g>`;
}

// ── molecules to start from ─────────────────────────────────────────────────
const hex = (r = BOND) => Array.from({ length: 6 }, (_, i) => [r * Math.cos(rad(90 + i * 60)), r * Math.sin(rad(90 + i * 60))]);
const S = (atoms, bonds) => ({ atoms, bonds });   // atoms: [el, x, y], bonds: [i, j, order]
export const TEMPLATES = [
  { id: "h2o", name: "Water", skel: S([["O", 0, 0]], []) },
  { id: "nh3", name: "Ammonia", skel: S([["N", 0, 0]], []) },
  { id: "ch4", name: "Methane", skel: S([["C", 0, 0]], []) },
  { id: "hcl", name: "Hydrogen chloride", skel: S([["Cl", 0, 0]], []) },
  { id: "co2", name: "Carbon dioxide", skel: S([["O", -50, 0], ["C", 0, 0], ["O", 50, 0]], [[0, 1, 2], [1, 2, 2]]) },
  { id: "n2", name: "Nitrogen", skel: S([["N", -25, 0], ["N", 25, 0]], [[0, 1, 3]]) },
  { id: "o2", name: "Oxygen", skel: S([["O", -25, 0], ["O", 25, 0]], [[0, 1, 2]]) },
  { id: "c2h6", name: "Ethane", skel: S([["C", -25, 0], ["C", 25, 0]], [[0, 1, 1]]) },
  { id: "c2h4", name: "Ethene", skel: S([["C", -25, 0], ["C", 25, 0]], [[0, 1, 2]]) },
  { id: "c2h2", name: "Ethyne", skel: S([["C", -25, 0], ["C", 25, 0]], [[0, 1, 3]]) },
  { id: "c3h8", name: "Propane", skel: S([["C", -50, 0], ["C", 0, 0], ["C", 50, 0]], [[0, 1, 1], [1, 2, 1]]) },
  { id: "ch3cl", name: "Chloromethane", skel: S([["C", 0, 0], ["Cl", 50, 0]], [[0, 1, 1]]) },
  { id: "c2h5oh", name: "Ethanol", skel: S([["C", -50, 0], ["C", 0, 0], ["O", 50, 0]], [[0, 1, 1], [1, 2, 1]]) },
  { id: "ch3cooh", name: "Ethanoic acid", skel: S([["C", -50, 0], ["C", 0, 0], ["O", 25, -43.3], ["O", 25, 43.3]], [[0, 1, 1], [1, 2, 2], [1, 3, 1]]) },
  { id: "c6h6", name: "Benzene", skel: S(hex().map(([x, y]) => ["C", x, y]), [0, 1, 2, 3, 4, 5].map((i) => [i, (i + 1) % 6, i % 2 ? 1 : 2])) },
];
/** A starting molecule, built from its skeleton with the hydrogens put in. Centred on (cx, cy). */
export function build(id, cx = 0, cy = 0) {
  const t = TEMPLATES.find((x) => x.id === id);
  const m = empty();
  if (!t) return m;
  const ids = t.skel.atoms.map(([el, x, y]) => addAtom(m, el, x, y).id);
  t.skel.bonds.forEach(([i, j, o]) => addBond(m, ids[i], ids[j], o));
  fillH(m);
  // centre it on its own box
  const xs = m.atoms.map((a) => a.x), ys = m.atoms.map((a) => a.y);
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
  m.atoms.forEach((a) => { a.x += cx - mx; a.y += cy - my; });
  return m;
}
