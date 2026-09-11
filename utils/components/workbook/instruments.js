/* ============================================================================
   PRINTABLE WORKBOOK — the toolbox: a ruler, a protractor, a set square
   ----------------------------------------------------------------------------
   The instruments a child would take out of a pencil case, drawn in real
   millimetres so that on screen, laid on the paper, they measure what the
   paper measures: the ruler's centimetres are the paper's centimetres at any
   zoom, because both are drawn at the same scale inside the same scaler.

   Each instrument says, in its own millimetres:
     pivot   the point that is placed — the ruler's zero, the protractor's
             centre, the set square's square corner. It turns about this
             point and it is this point that clicks onto a corner.
     knob    where the handle that turns it sits — anywhere on the tool that
             stays in reach; turning is "point the knob", measured from the
             direction the knob already lies in from the pivot.
     edges   the directions, from the pivot, that line up with a side: the
             ruler's measuring edge, the protractor's baseline (either way),
             the set square's two square edges.
     close   where the × that puts it back in the box sits — clear of the
             scale and of the knob.

   The protractor is the workbook's own (it is also printed, to cut out), so
   it is passed in; the ruler and the set square are the same everywhere.
   ========================================================================== */

const INK = "#2a2723";
const f = (n) => n.toFixed(2);

/* our own glyphs, for the toolbox buttons — 24 × 24, drawn in currentColor */
const glyph = (inner) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
export const TOOL_ICONS = {
  box: glyph(`<path d="M3.5 9h17v10.5h-17zM8.5 9V6.5h7V9"/><path d="M3.5 13h17"/>`),
  ruler: glyph(`<path d="M2.5 8h19v8h-19z"/><path d="M6 8v3M9.5 8v2M13 8v3M16.5 8v2M20 8v3"/>`),
  protractor: glyph(`<path d="M3 17a9 9 0 0 1 18 0z"/><path d="M12 17V13M7.2 12.2l1.6 1.6M16.8 12.2l-1.6 1.6"/>`),
  setsquare: glyph(`<path d="M4 20V4l16 16z"/><path d="M7.5 16.5V12l4.5 4.5z"/>`),
  close: glyph(`<path d="M7 7l10 10M17 7 7 17"/>`),
  /* the written boards, and the algebra sheet — the tools that are not
     instruments but working paper */
  longdiv: glyph(`<path d="M9 7.5h11"/><path d="M9 7.5v11"/><path d="M4.5 10c1.5 0 2.2 1 2.2 2.8s-.7 2.8-2.2 2.8"/><path d="M12 4.5h5"/><path d="M12 12h4M12 16h6"/>`),
  column: glyph(`<path d="M11 6h8M11 10.5h8"/><path d="M5 8.5v4M3 10.5h4"/><path d="M3.5 14h16"/><path d="M11 18h8"/>`),
  times: glyph(`<path d="M11 6h8M11 10.5h8"/><path d="M3.4 8.9 6.6 12.1M6.6 8.9 3.4 12.1"/><path d="M3.5 14h16"/><path d="M11 18h8"/>`),
  gm: glyph(`<path d="M3.5 18.5c3.4 0 3-13 6.4-13s3 13 6.4 13"/><path d="M14 11.5h7"/>`),
  side: glyph(`<path d="M3.5 4.5h17v15h-17z"/><path d="M9 4.5v15"/>`),
};

/* ── the ruler ─────────────────────────────────────────────────────────────*/

const RULER_CM = 15;
const RULER_END = 5; // mm of ruler before the 0 and after the 15

/** A 15 cm ruler: millimetres, half centimetres, centimetres numbered. The
    measuring edge is the top one, and the 0 is where the pivot is. */
function rulerSvg() {
  const len = RULER_CM * 10;
  const W = len + 2 * RULER_END;
  const H = 15;
  let body = `<rect x="0.25" y="0.25" width="${f(W - 0.5)}" height="${f(H - 0.5)}" rx="1" fill="#fff3a8" fill-opacity="0.82" stroke="${INK}" stroke-width="0.5"/>`;
  for (let mm = 0; mm <= len; mm++) {
    const x = RULER_END + mm;
    const cm = mm % 10 === 0;
    const half = mm % 5 === 0;
    body += `<line x1="${f(x)}" y1="0.25" x2="${f(x)}" y2="${cm ? 5 : half ? 3.6 : 2.3}" stroke="${INK}" stroke-width="${cm ? 0.32 : 0.2}"/>`;
    if (cm) {
      body += `<text x="${f(x)}" y="8.4" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.7" font-weight="700" fill="${INK}">${mm / 10}</text>`;
    }
  }
  body += `<text x="${f(W - 3)}" y="${f(H - 2)}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="2.4" fill="${INK}" opacity="0.7">cm</text>`;
  return `<svg viewBox="0 0 ${f(W)} ${H}" width="${f(W)}mm" height="${H}mm" role="img" aria-label="A 15 centimetre ruler">${body}</svg>`;
}

/* ── the set square ────────────────────────────────────────────────────────*/

const SQ_LEG = 75;
const SQ_PAD = 1;

/** A 45° set square, its square corner at the bottom left, a millimetre
    scale along the bottom edge from that corner, and the cut-out in the
    middle a real one has. */
function setSquareSvg() {
  const C = [SQ_PAD, SQ_PAD + SQ_LEG];          // the square corner
  const A = [SQ_PAD + SQ_LEG, SQ_PAD + SQ_LEG]; // along the bottom
  const B = [SQ_PAD, SQ_PAD];                   // up the side
  const W = SQ_LEG + 2 * SQ_PAD;
  const H = SQ_LEG + 2 * SQ_PAD;
  let body = `<path d="M${f(C[0])} ${f(C[1])} L${f(A[0])} ${f(A[1])} L${f(B[0])} ${f(B[1])} Z" fill="#c8f0c0" fill-opacity="0.6" stroke="${INK}" stroke-width="0.5" stroke-linejoin="round"/>`;
  /* The cut-out: the same triangle, smaller, every side parallel to the
     outside and the same distance g in from it. The two square edges move in
     by g; the long edge moves in by g too, which along a square edge is
     g × √2 — so each inner square edge is g(2 + √2) shorter. */
  const g = 14;
  const inner = SQ_LEG - g * (2 + Math.SQRT2);
  const c2 = [C[0] + g, C[1] - g];
  const a2 = [c2[0] + inner, c2[1]];
  const b2 = [c2[0], c2[1] - inner];
  body += `<path d="M${f(c2[0])} ${f(c2[1])} L${f(a2[0])} ${f(a2[1])} L${f(b2[0])} ${f(b2[1])} Z" fill="#fffdf8" fill-opacity="0.55" stroke="${INK}" stroke-width="0.35" stroke-linejoin="round"/>`;
  /* the scale, along the bottom edge from the square corner */
  for (let mm = 0; mm <= SQ_LEG - 8; mm++) {
    const x = C[0] + mm;
    const cm = mm % 10 === 0;
    const half = mm % 5 === 0;
    body += `<line x1="${f(x)}" y1="${f(C[1])}" x2="${f(x)}" y2="${f(C[1] - (cm ? 4.4 : half ? 3.2 : 2))}" stroke="${INK}" stroke-width="${cm ? 0.3 : 0.18}"/>`;
    if (cm && mm) {
      body += `<text x="${f(x)}" y="${f(C[1] - 5.8)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.4" font-weight="700" fill="${INK}">${mm / 10}</text>`;
    }
  }
  /* the square corner, marked */
  body += `<polyline points="${f(C[0] + 5)},${f(C[1])} ${f(C[0] + 5)},${f(C[1] - 5)} ${f(C[0])},${f(C[1] - 5)}" fill="none" stroke="#c0453f" stroke-width="0.4"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" role="img" aria-label="A 45 degree set square">${body}</svg>`;
}

/* ── the protractor, whatever the workbook printed ─────────────────────────*/

function protractorSpec(svg) {
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1]?.split(/\s+/).map(Number) || [0, 0, 74, 47];
  const dot = svg.match(/<circle cx="([\d.]+)" cy="([\d.]+)" r="1"/);
  const pivot = dot ? [Number(dot[1]), Number(dot[2])] : [vb[2] / 2, vb[3] - 6];
  return {
    id: "protractor",
    label: "Protractor",
    svg,
    pivot,
    knob: [vb[2] + 1, pivot[1]],
    /* top right: the angle it is turned to is shown top left */
    close: [vb[2] - 4, 4],
    edges: [{ deg: 0, both: true }],
    readout: true,
  };
}

/**
 * The toolbox: every instrument this workbook has, in the order a child
 * would reach for them.
 */
export function instruments({ protractor = null } = {}) {
  const len = RULER_CM * 10;
  const out = [{
    id: "ruler",
    label: "Ruler",
    svg: rulerSvg(),
    pivot: [RULER_END, 0],
    /* halfway along, on the plain lower edge: a knob past the 15 is off the
       paper as often as not */
    knob: [RULER_END + len / 2, 12],
    /* just past the far end of the ruler */
    close: [RULER_END * 2 + len + 4, 7.5],
    edges: [{ deg: 0, both: false }],
    readout: false,
  }];
  if (protractor) out.push(protractorSpec(protractor));
  out.push({
    id: "setsquare",
    label: "Set square",
    svg: setSquareSvg(),
    pivot: [SQ_PAD, SQ_PAD + SQ_LEG],
    knob: [SQ_PAD + SQ_LEG + 4, SQ_PAD + SQ_LEG],
    /* up by the top corner, where the triangle is narrow and nothing is printed */
    close: [SQ_PAD + 6, SQ_PAD + 16],
    edges: [{ deg: 0, both: false }, { deg: -90, both: false }],
    readout: false,
  });
  return out;
}
