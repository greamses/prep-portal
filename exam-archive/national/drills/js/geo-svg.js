/* ═══════════════════════════════════════════════════════
   DRILLS — geometry diagrams
   Every shape is drawn at one fixed pixel radius (R) no matter what the
   question's actual radius/diameter value is — the drill explicitly never
   scales the drawing, only the label text changes. Angle convention: 0deg
   points east, increasing clockwise (matches SVG's y-down space), so
   270deg is "straight up" — quadrant/sector both start their wedge there.
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

function outlinePath(shape, angleDeg) {
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
// the true diameter, and a light pass-through line (drawn a touch fainter,
// since it extends past the shape's own boundary) everywhere else.
function referenceLine(shape, given, angleDeg) {
  const ang = refAngle(shape, angleDeg);
  if (given === 'radius') {
    const e = pt(ang);
    const mid = { x: (CX + e.x) / 2, y: (CY + e.y) / 2 };
    return { line: `<line x1="${CX}" y1="${CY}" x2="${f(e.x)}" y2="${f(e.y)}" class="geo-refline" />`, label: labelAt(mid, ang) };
  }
  if (shape === 'semicircle') {
    const w = pt(180), e = pt(0);
    const mid = { x: CX, y: w.y };
    return { line: `<line x1="${f(w.x)}" y1="${f(w.y)}" x2="${f(e.x)}" y2="${f(e.y)}" class="geo-refline geo-refline--dia" />`, label: { x: mid.x, y: mid.y + 16 } };
  }
  const a = pt(ang), b = pt(ang + 180);
  const mid = { x: CX, y: CY };
  return { line: `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" class="geo-refline geo-refline--dia" />`, label: labelAt(mid, ang) };
}

function angleAnnotation(angleDeg) {
  const start = 270, end = 270 + angleDeg;
  const large = angleDeg > 180 ? 1 : 0;
  const s = pt(start, 22), e = pt(end, 22);
  const label = pt(start + angleDeg / 2, 36);
  return {
    wedge: `<path d="M ${fp(s)} A 22 22 0 ${large} 1 ${fp(e)} L ${CX},${CY} Z" class="geo-anglewedge" />`,
    label,
  };
}

export function buildShapeSvg({ shape, given, givenValue, angleDeg }) {
  const outline = outlinePath(shape, angleDeg);
  const centerDot = shape === 'circle' && given !== 'radius' ? '' : `<circle cx="${CX}" cy="${CY}" r="2.6" class="geo-center" />`;
  const ref = referenceLine(shape, given, angleDeg);
  const refLabelText = `${given === 'radius' ? 'r' : 'd'} = ${givenValue}`;

  let angleBits = '';
  if (shape === 'sector') {
    const ann = angleAnnotation(angleDeg);
    angleBits = `${ann.wedge}<text x="${f(ann.label.x)}" y="${f(ann.label.y)}" class="geo-label geo-label--angle" text-anchor="middle" dominant-baseline="middle">${angleDeg}&#176;</text>`;
  }

  return `
    <svg viewBox="0 0 200 190" width="100%" height="100%" role="img" aria-label="${shape} diagram">
      ${angleBits}
      ${outline}
      ${ref.line}
      ${centerDot}
      <text x="${f(ref.label.x)}" y="${f(ref.label.y)}" class="geo-label" text-anchor="middle" dominant-baseline="middle">${refLabelText}</text>
    </svg>
  `;
}
