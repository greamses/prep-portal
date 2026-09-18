/* ============================================================================
   PRINTABLE WORKBOOK — folding a shape along a line, on screen
   ----------------------------------------------------------------------------
   On paper a line of symmetry is tested by cutting the shape out and folding
   it: if the two halves lie exactly on each other, the fold is a line of
   symmetry. This is that, on the screen, for any figure that says what its
   outline is:

     <svg data-fold="x,y x,y …">     the outline, in the svg's own units
       <line data-foldline …/>       a line that can be tapped to fold along

   and for any line a child rules on such a figure (interactive.js calls
   foldAlong after every line that goes down).

   The half on one side of the line turns over — squashed across the line and
   back out the other side, which is how a fold looks from above — and stays
   over the other half long enough to see whether it fits. It is drawn in the
   colour of the BACK of the paper, so an overhang, or a gap where the other
   half shows through, is plain to see; the edge goes green when the halves
   match and red when they do not. Then it opens out again.

   The geometry is pure (clipHalf, reflect, foldFits) and has no DOM in it, so
   the checks can run it in Node.
   ========================================================================== */

const NS = "http://www.w3.org/2000/svg";
const FRONT = "#fff3a8";
const BACK = "#e8d98a";
const FIT = "#3f8f4f";
const MISS = "#c0453f";

const parse = (s) => (s ? s.trim().split(/\s+/).map((q) => q.split(",").map(Number)) : []);
const cross = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);

/** The part of a polygon on one side of the line a→b (side 1: left, −1: right). */
export function clipHalf(poly, a, b, side) {
  const out = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const P = poly[i];
    const Q = poly[(i + 1) % n];
    const cp = side * cross(a, b, P);
    const cq = side * cross(a, b, Q);
    if (cp >= 0) out.push(P);
    if ((cp >= 0) !== (cq >= 0)) {
      const t = cp / (cp - cq);
      out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]);
    }
  }
  return out;
}

/** A point reflected in the line through a and b. */
export function reflect(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = dx * dx + dy * dy || 1;
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L;
  const f = [a[0] + dx * t, a[1] + dy * t];
  return [2 * f[0] - p[0], 2 * f[1] - p[1]];
}

export const areaOf = (poly) =>
  Math.abs(poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

function toBoundary(p, poly) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
    best = Math.min(best, Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t));
  }
  return best;
}

/**
 * Is the line through a and b a line of symmetry of the polygon? Every corner,
 * folded over, must land on the outline, and the two halves must be the same
 * size (which rules out a line that only grazes the shape).
 */
export function foldFits(poly, a, b, tol = 0.006) {
  const L = areaOf(clipHalf(poly, a, b, 1));
  const R = areaOf(clipHalf(poly, a, b, -1));
  const whole = areaOf(poly) || 1;
  if (Math.min(L, R) < whole * 0.02) return false;
  if (Math.abs(L - R) > whole * 0.01) return false;
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const size = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  return poly.every((p) => toBoundary(reflect(p, a, b), poly) < tol * size);
}

/* ── on screen ─────────────────────────────────────────────────────────── */

const pathOf = (poly) => `M${poly.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("L")}Z`;

/** The colour behind the figure — what the lifted half leaves uncovered. */
function paperOf(svg) {
  for (let el = svg.parentElement; el; el = el.parentElement) {
    const c = getComputedStyle(el).backgroundColor;
    if (c && c !== "transparent" && !/rgba\(.*,\s*0\)$/.test(c)) return c;
  }
  return "#ffffff";
}

/** The matrix that squashes the plane across the line a→b by k (1 flat, −1 folded over). */
function squash(a, b, k) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const n = [-dy / L, dx / L];
  const m00 = 1 + (k - 1) * n[0] * n[0];
  const m01 = (k - 1) * n[0] * n[1];
  const m11 = 1 + (k - 1) * n[1] * n[1];
  const e = a[0] - (m00 * a[0] + m01 * a[1]);
  const f = a[1] - (m01 * a[0] + m11 * a[1]);
  return `matrix(${m00.toFixed(4)} ${m01.toFixed(4)} ${m01.toFixed(4)} ${m11.toFixed(4)} ${e.toFixed(3)} ${f.toFixed(3)})`;
}

const still = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fold the figure along the line through a and b, show whether it fits, open it again. */
export function foldAlong(svg, a, b, { ms = 650, hold = 1500 } = {}) {
  if (svg.__wbFolding) return null;
  const poly = parse(svg.dataset.fold);
  if (poly.length < 3 || (a[0] === b[0] && a[1] === b[1])) return null;
  const L = clipHalf(poly, a, b, 1);
  const R = clipHalf(poly, a, b, -1);
  const whole = areaOf(poly);
  const fits = foldFits(poly, a, b);
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", "wb-fold");
  g.setAttribute("pointer-events", "none");
  svg.appendChild(g);

  if (Math.min(areaOf(L), areaOf(R)) < whole * 0.02) {
    /* a line that does not cut the shape in two cannot be folded along */
    g.innerHTML = `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${MISS}" stroke-width="0.8" stroke-dasharray="1.4 1"/>`;
    setTimeout(() => g.remove(), 900);
    return false;
  }

  svg.__wbFolding = true;
  /* the half that turns over: the smaller, so a fold that is off-centre leaves
     part of the bigger half showing */
  const lift = areaOf(L) <= areaOf(R) ? L : R;
  const cover = document.createElementNS(NS, "path");
  cover.setAttribute("d", pathOf(lift));
  cover.setAttribute("fill", paperOf(svg));
  const flap = document.createElementNS(NS, "path");
  flap.setAttribute("d", pathOf(lift));
  flap.setAttribute("fill", svg.dataset.foldFill || FRONT);
  flap.setAttribute("stroke", "#2a2723");
  flap.setAttribute("stroke-width", "0.55");
  flap.setAttribute("stroke-linejoin", "round");
  const crease = document.createElementNS(NS, "line");
  [["x1", a[0]], ["y1", a[1]], ["x2", b[0]], ["y2", b[1]]].forEach(([k, v]) => crease.setAttribute(k, v));
  crease.setAttribute("stroke", "#2a2723");
  crease.setAttribute("stroke-width", "0.4");
  crease.setAttribute("stroke-dasharray", "1.4 1");
  g.append(cover, flap, crease);

  const finish = () => {
    flap.setAttribute("stroke", fits ? FIT : MISS);
    flap.setAttribute("stroke-width", "0.9");
    svg.closest(".wb-drawhost, .gw-art")?.setAttribute("data-folded", fits ? "fits" : "misses");
  };
  const done = () => {
    g.remove();
    svg.__wbFolding = false;
    svg.closest(".wb-drawhost, .gw-art")?.removeAttribute("data-folded");
  };

  if (still()) {
    flap.setAttribute("transform", squash(a, b, -1));
    flap.setAttribute("fill", BACK);
    finish();
    setTimeout(done, hold + 400);
    return fits;
  }

  const run = (from, to, then) => {
    const t0 = performance.now();
    const tick = (now) => {
      const u = Math.min(1, (now - t0) / ms);
      const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
      const k = Math.cos(Math.PI * (from + (to - from) * e));
      flap.setAttribute("transform", squash(a, b, k));
      flap.setAttribute("fill", k < 0 ? BACK : svg.dataset.foldFill || FRONT);
      if (u < 1) requestAnimationFrame(tick);
      else then();
    };
    requestAnimationFrame(tick);
  };
  run(0, 1, () => {
    finish();
    setTimeout(() => {
      flap.setAttribute("stroke", "#2a2723");
      flap.setAttribute("stroke-width", "0.55");
      run(1, 0, done);
    }, hold);
  });
  return fits;
}

/** Make the dashed lines on a figure tappable: tap one, and the shape folds along it. */
export function makeFoldable(svg) {
  svg.dataset.foldable = "1";
  svg.querySelectorAll("line[data-foldline]").forEach((ln) => {
    if (ln.nextElementSibling?.classList?.contains("wb-foldhit")) return;
    const hit = document.createElementNS(NS, "line");
    ["x1", "y1", "x2", "y2"].forEach((k) => hit.setAttribute(k, ln.getAttribute(k)));
    hit.setAttribute("class", "wb-foldhit");
    hit.setAttribute("data-tip", "Fold along this line");
    ln.after(hit);
  });
  if (svg.__wbFoldBound) return;
  svg.__wbFoldBound = true;
  svg.addEventListener("click", (e) => {
    if (!svg.dataset.foldable) return;
    const hit = e.target.closest?.(".wb-foldhit");
    if (!hit) return;
    const g = (k) => Number(hit.getAttribute(k));
    foldAlong(svg, [g("x1"), g("y1")], [g("x2"), g("y2")]);
  });
}

export function unFoldable(svg) {
  svg.removeAttribute("data-foldable");
  svg.querySelectorAll(".wb-foldhit, .wb-fold").forEach((n) => n.remove());
  svg.__wbFolding = false;
}
