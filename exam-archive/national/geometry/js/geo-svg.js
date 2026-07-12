/* ═══════════════════════════════════════════════════════
   GEOMETRY — shape diagrams
   Every shape is drawn at one fixed pixel size no matter what the
   question's actual radius/diameter/side value is — the drill explicitly
   never scales the drawing, only the label text changes. Angle convention
   for the circular shapes: 0deg points east, increasing clockwise (matches
   SVG's y-down space), so 270deg is "straight up".
═══════════════════════════════════════════════════════ */

const R = 66;
const CX = 100;
const CY = 96;

function pt(angleDeg, radius = R) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}
const f = (n) => n.toFixed(1);
const fp = (p) => `${f(p.x)},${f(p.y)}`;

function label(x, y, text, extraClass = '') {
  return `<text x="${f(x)}" y="${f(y)}" class="geo-label ${extraClass}" text-anchor="middle" dominant-baseline="middle">${text}</text>`;
}

/* ── Circular shapes (circle/semicircle/quadrant/sector) ─────────────── */

function circularOutline(shape, angleDeg) {
  if (shape === 'circle') return `<circle cx="${CX}" cy="${CY}" r="${R}" class="geo-shape" />`;
  if (shape === 'semicircle') {
    const w = pt(180), e = pt(0);
    return `<path d="M ${fp(w)} A ${R} ${R} 0 0 1 ${fp(e)} Z" class="geo-shape" />`;
  }
  if (shape === 'quadrant') {
    const n = pt(270), e = pt(0);
    return `<path d="M ${CX},${CY} L ${fp(n)} A ${R} ${R} 0 0 1 ${fp(e)} Z" class="geo-shape" />`;
  }
  const start = 270, end = 270 + angleDeg;
  const large = angleDeg > 180 ? 1 : 0;
  const s = pt(start), e = pt(end);
  return `<path d="M ${CX},${CY} L ${fp(s)} A ${R} ${R} 0 ${large} 1 ${fp(e)} Z" class="geo-shape" />`;
}

// The wedge's own angular midpoint — for a quadrant/circle/semicircle this
// is a fixed constant, for a sector it tracks the drawn angle so the r/d
// reference line always lands inside the wedge instead of drifting outside
// a narrow slice.
function refAngle(shape, angleDeg) {
  return shape === 'sector' ? 270 + angleDeg / 2 : 315;
}

function labelAt(mid, lineAngleDeg) {
  const normalRad = ((lineAngleDeg - 90) * Math.PI) / 180;
  return { x: mid.x + 15 * Math.cos(normalRad), y: mid.y + 15 * Math.sin(normalRad) };
}

// The straight reference line carrying the "r = " / "d = " label. Radius is
// center-to-arc along the wedge's own midline; diameter runs straight
// through the center — using the semicircle's actual flat base when that IS
// the true diameter, and a light pass-through line (extends past the
// shape's own boundary) everywhere else.
function referenceLine(shape, given, angleDeg) {
  const ang = refAngle(shape, angleDeg);
  if (given === 'radius') {
    const e = pt(ang);
    const mid = { x: (CX + e.x) / 2, y: (CY + e.y) / 2 };
    return { line: `<line x1="${CX}" y1="${CY}" x2="${f(e.x)}" y2="${f(e.y)}" class="geo-refline" />`, labelPt: labelAt(mid, ang) };
  }
  if (shape === 'semicircle') {
    const w = pt(180), e = pt(0);
    return { line: `<line x1="${f(w.x)}" y1="${f(w.y)}" x2="${f(e.x)}" y2="${f(e.y)}" class="geo-refline geo-refline--dia" />`, labelPt: { x: CX, y: w.y + 16 } };
  }
  const a = pt(ang), b = pt(ang + 180);
  return { line: `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" class="geo-refline geo-refline--dia" />`, labelPt: labelAt({ x: CX, y: CY }, ang) };
}

function angleAnnotation(angleDeg) {
  const start = 270, end = 270 + angleDeg;
  const large = angleDeg > 180 ? 1 : 0;
  const s = pt(start, 22), e = pt(end, 22);
  const labelPt = pt(start + angleDeg / 2, 36);
  return {
    wedge: `<path d="M ${fp(s)} A 22 22 0 ${large} 1 ${fp(e)} L ${CX},${CY} Z" class="geo-anglewedge" />`,
    labelPt,
  };
}

function buildCircular({ shape, given, givenValue, angleDeg }) {
  const outline = circularOutline(shape, angleDeg);
  const centerDot = shape === 'circle' && given !== 'radius' ? '' : `<circle cx="${CX}" cy="${CY}" r="2.6" class="geo-center" />`;
  const ref = referenceLine(shape, given, angleDeg);
  const refLabelText = `${given === 'radius' ? 'r' : 'd'} = ${givenValue}`;

  let angleBits = '';
  if (shape === 'sector') {
    const ann = angleAnnotation(angleDeg);
    angleBits = `${ann.wedge}${label(ann.labelPt.x, ann.labelPt.y, `${angleDeg}&#176;`, 'geo-label--angle')}`;
  }

  return `${angleBits}${outline}${ref.line}${centerDot}${label(ref.labelPt.x, ref.labelPt.y, refLabelText)}`;
}

/* ── Polygon shapes (square/rectangle/triangle) ──────────────────────── */

function buildSquare({ side }) {
  const half = 55;
  const x0 = CX - half, x1 = CX + half, y0 = CY - half, y1 = CY + half;
  const outline = `<rect x="${x0}" y="${y0}" width="${half * 2}" height="${half * 2}" class="geo-shape" />`;
  return `${outline}${label(CX, y1 + 16, `s = ${side}`)}`;
}

function buildRectangle({ length, width }) {
  const halfW = 66, halfH = 42;
  const x0 = CX - halfW, x1 = CX + halfW, y0 = CY - halfH, y1 = CY + halfH;
  const outline = `<rect x="${x0}" y="${y0}" width="${halfW * 2}" height="${halfH * 2}" class="geo-shape" />`;
  const lLabel = label(CX, y1 + 16, `l = ${length}`);
  const wLabel = `<text x="${f(x1 + 20)}" y="${f(CY)}" class="geo-label" text-anchor="middle" dominant-baseline="middle" transform="rotate(90 ${f(x1 + 20)} ${f(CY)})">w = ${width}</text>`;
  return `${outline}${lLabel}${wLabel}`;
}

// A single fixed scalene silhouette — only the three edge labels change
// with the question's actual side lengths, the triangle itself never
// reshapes to "look like" a,b,c.
const TRI_TOP = { x: CX - 6, y: CY - 62 };
const TRI_LEFT = { x: CX - 64, y: CY + 54 };
const TRI_RIGHT = { x: CX + 58, y: CY + 44 };

function midOffset(p1, p2, dist) {
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  // Push the label away from the triangle's centroid, not just "a" side.
  const cx = (TRI_TOP.x + TRI_LEFT.x + TRI_RIGHT.x) / 3, cy = (TRI_TOP.y + TRI_LEFT.y + TRI_RIGHT.y) / 3;
  const sign = (mid.x - cx) * nx + (mid.y - cy) * ny >= 0 ? 1 : -1;
  return { x: mid.x + sign * nx * dist, y: mid.y + sign * ny * dist };
}

function buildTriangle({ sides }) {
  const [a, b, c] = sides;
  const outline = `<path d="M ${fp(TRI_TOP)} L ${fp(TRI_RIGHT)} L ${fp(TRI_LEFT)} Z" class="geo-shape" />`;
  const labelTopRight = midOffset(TRI_TOP, TRI_RIGHT, 14);
  const labelRightLeft = midOffset(TRI_RIGHT, TRI_LEFT, 14);
  const labelLeftTop = midOffset(TRI_LEFT, TRI_TOP, 14);
  return [
    outline,
    label(labelTopRight.x, labelTopRight.y, a),
    label(labelRightLeft.x, labelRightLeft.y, b),
    label(labelLeftTop.x, labelLeftTop.y, c),
  ].join('');
}

export function buildShapeSvg(geo) {
  let inner;
  if (geo.shape === 'square') inner = buildSquare(geo);
  else if (geo.shape === 'rectangle') inner = buildRectangle(geo);
  else if (geo.shape === 'triangle') inner = buildTriangle(geo);
  else inner = buildCircular(geo);

  return `
    <svg viewBox="0 0 200 190" width="100%" height="100%" role="img" aria-label="${geo.shape} diagram">
      ${inner}
    </svg>
  `;
}
