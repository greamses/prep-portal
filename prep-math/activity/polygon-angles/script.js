const SVG_NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("polygon-svg");
const gTransform = document.getElementById("transform-group");

let VW = 500,
  VH = 500,
  CX = 250,
  CY = 250;
let isInitialized = false;

const POLY_NAMES = [
  "",
  "",
  "",
  "Triangle",
  "Quadrilateral",
  "Pentagon",
  "Hexagon",
  "Heptagon",
  "Octagon",
  "Nonagon",
  "Decagon",
  "Undecagon",
  "Dodecagon",
];

const state = {
  sides: 6,
  radius: 155,
  rotation: 270,
  showProtractors: true,
  showLabels: true,
  showVertices: true,
  showCenter: true,
  showSideLabels: true,
  showDiagonals: false,
  showRadii: false,
  fill: true,
  grid: true,
  animMode: "interior",
  animProgress: 0,
  customVerts: null,
  activeVerts: new Set(),
};

let vX = 0,
  vY = 0,
  vScale = 1;

function updateView() {
  gTransform.setAttribute(
    "transform",
    `translate(${vX}, ${vY}) scale(${vScale})`,
  );
  gTransform.classList.toggle("zoomed", vScale >= 1.6);
}

function rad(deg) {
  return (deg * Math.PI) / 180;
}
function deg(r) {
  return (r * 180) / Math.PI;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function lerpPt(p1, p2, t) {
  return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
}
function lerpAngle(a1, a2, t) {
  let diff = (((a2 - a1) % 360) + 360) % 360;
  if (diff > 180) diff -= 360;
  return a1 + diff * t;
}

function getRegularVerts() {
  const pts = [];
  for (let i = 0; i < state.sides; i++) {
    const a = rad(state.rotation + (360 / state.sides) * i);
    pts.push({
      x: CX + state.radius * Math.cos(a),
      y: CY + state.radius * Math.sin(a),
    });
  }
  return pts;
}

function getVertices() {
  return state.customVerts || getRegularVerts();
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function el(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function txt(content, attrs = {}) {
  const t = el("text", attrs);
  t.textContent = content;
  return t;
}

function createWedge(origin, p1, p2, vertIdx, triIdx) {
  let a1 = deg(Math.atan2(p1.y - origin.y, p1.x - origin.x));
  let a2 = deg(Math.atan2(p2.y - origin.y, p2.x - origin.x));
  let diff = (((a2 - a1) % 360) + 360) % 360;
  if (diff > 180) diff -= 360;
  let sweep = Math.abs(diff);
  let start = diff > 0 ? a1 : a2;
  return { origin, start, sweep, vertIdx, triIdx };
}

function getVertexAngleInfo(verts, i) {
  const n = verts.length;
  const pPrev = verts[(i - 1 + n) % n],
    v = verts[i],
    pNext = verts[(i + 1) % n];
  let aPrev = deg(Math.atan2(pPrev.y - v.y, pPrev.x - v.x));
  let aNext = deg(Math.atan2(pNext.y - v.y, pNext.x - v.x));
  let sweep = (aPrev - aNext + 360) % 360;
  if (sweep === 0) sweep = 360;
  return { sweep, start: aNext };
}

function getSectorPath(cx, cy, startDeg, sweepDeg, r) {
  if (sweepDeg <= 0.01) return "";
  if (sweepDeg >= 359.99)
    return `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} Z M ${cx} ${cy} Z`;
  let sR = rad(startDeg),
    eR = rad(startDeg + sweepDeg);
  let x1 = cx + r * Math.cos(sR),
    y1 = cy + r * Math.sin(sR);
  let x2 = cx + r * Math.cos(eR),
    y2 = cy + r * Math.sin(eR);
  let largeArc = sweepDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function getArcPath(cx, cy, startDeg, sweepDeg, r) {
  if (sweepDeg <= 0.01) return "";
  if (sweepDeg >= 359.99)
    return `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  let sR = rad(startDeg),
    eR = rad(startDeg + sweepDeg);
  let x1 = cx + r * Math.cos(sR),
    y1 = cy + r * Math.sin(sR);
  let x2 = cx + r * Math.cos(eR),
    y2 = cy + r * Math.sin(eR);
  let largeArc = sweepDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function getArcArrow(cx, cy, startDeg, sweepDeg, r, isCCW) {
  if (sweepDeg < 5) return "";
  let headDeg = isCCW ? startDeg : startDeg + sweepDeg;
  let tangent = isCCW ? headDeg - 90 : headDeg + 90;
  let headX = cx + r * Math.cos(rad(headDeg)),
    headY = cy + r * Math.sin(rad(headDeg));
  let arrowSize = 6,
    a1 = rad(tangent + 145),
    a2 = rad(tangent - 145);
  return `M ${headX + arrowSize * Math.cos(a1)} ${headY + arrowSize * Math.sin(a1)} L ${headX} ${headY} L ${headX + arrowSize * Math.cos(a2)} ${headY + arrowSize * Math.sin(a2)}`;
}

function drawGuideCompass(cx, cy, radius, type, opacity) {
  const g = el("g", { opacity: opacity });
  const tickGroup = el("g", {
    "font-family": "JetBrains Mono,monospace",
    "font-size": "8",
    fill: "#0a0a0a",
    "font-weight": "700",
    "text-anchor": "middle",
    "dominant-baseline": "middle",
  });

  if (type === "interior") {
    g.appendChild(
      el("path", {
        d: `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`,
        fill: "none",
        stroke: "#0a0a0a",
        "stroke-width": "1.5",
        "stroke-opacity": "0.3",
      }),
    );
    g.appendChild(
      el("line", {
        x1: cx - radius - 25,
        y1: cy,
        x2: cx + radius + 25,
        y2: cy,
        stroke: "#0a0a0a",
        "stroke-width": "1.5",
      }),
    );
    for (let d = 0; d <= 180; d += 10) {
      const rA = rad(180 + d),
        isMain = d % 30 === 0,
        isMid = d % 10 === 0 && !isMain;
      const rOuter = radius + (isMain ? 9 : isMid ? 5 : 3);
      tickGroup.appendChild(
        el("line", {
          x1: cx + radius * Math.cos(rA),
          y1: cy + radius * Math.sin(rA),
          x2: cx + rOuter * Math.cos(rA),
          y2: cy + rOuter * Math.sin(rA),
          stroke: "#0a0a0a",
          "stroke-width": isMain ? "1.5" : "1",
        }),
      );
      if (isMain)
        tickGroup.appendChild(
          txt(d.toString(), {
            x: cx + (radius + 18) * Math.cos(rA),
            y: cy + (radius + 18) * Math.sin(rA),
          }),
        );
    }
  } else {
    g.appendChild(
      el("circle", {
        cx,
        cy,
        r: radius,
        fill: "none",
        stroke: "#0a0a0a",
        "stroke-width": "1.5",
        "stroke-opacity": "0.3",
      }),
    );
    g.appendChild(
      el("line", {
        x1: cx - radius - 25,
        y1: cy,
        x2: cx + radius + 25,
        y2: cy,
        stroke: "#0a0a0a",
        "stroke-width": "1.5",
      }),
    );
    g.appendChild(
      el("line", {
        x1: cx,
        y1: cy - radius - 25,
        x2: cx,
        y2: cy + radius + 25,
        stroke: "#0a0a0a",
        "stroke-width": "1.5",
      }),
    );
    for (let d = 0; d < 360; d += 10) {
      const rA = rad(d),
        isMain = d % 30 === 0,
        rOuter = radius + (isMain ? 9 : 4);
      tickGroup.appendChild(
        el("line", {
          x1: cx + radius * Math.cos(rA),
          y1: cy + radius * Math.sin(rA),
          x2: cx + rOuter * Math.cos(rA),
          y2: cy + rOuter * Math.sin(rA),
          stroke: "#0a0a0a",
          "stroke-width": isMain ? "1.5" : "1",
        }),
      );
      if (isMain)
        tickGroup.appendChild(
          txt(d.toString(), {
            x: cx + (radius + 18) * Math.cos(rA),
            y: cy + (radius + 18) * Math.sin(rA),
          }),
        );
    }
  }
  g.appendChild(tickGroup);
  return g;
}

function render() {
  gTransform.innerHTML = "";
  if (!document.getElementById("base-defs")) {
    const defs = el("defs", { id: "base-defs" });
    const pat = el("pattern", {
      id: "grid-def",
      width: "30",
      height: "30",
      patternUnits: "userSpaceOnUse",
    });
    pat.appendChild(el("circle", { cx: "0", cy: "0", r: "1", fill: "#ccc" }));
    ["30,0", "0,30", "30,30"].forEach((p) =>
      pat.appendChild(
        el("circle", {
          cx: p.split(",")[0],
          cy: p.split(",")[1],
          r: "1",
          fill: "#ccc",
        }),
      ),
    );
    defs.appendChild(pat);
    const patNeg = el("pattern", {
      id: "neg-def",
      width: "12",
      height: "12",
      patternUnits: "userSpaceOnUse",
      patternTransform: "rotate(45)",
    });
    patNeg.appendChild(
      el("rect", { width: "12", height: "12", fill: "rgba(255, 0, 60, 0.85)" }),
    );
    patNeg.appendChild(
      el("line", {
        x1: "0",
        y1: "0",
        x2: "0",
        y2: "12",
        stroke: "#ffffff",
        "stroke-width": "4",
      }),
    );
    defs.appendChild(patNeg);
    svg.appendChild(defs);
  }

  const n = state.sides,
    verts = getVertices(),
    pts = verts.map((v) => `${v.x},${v.y}`).join(" ");
  let eT = state.animProgress,
    animPhase1 = Math.min(eT / 0.4, 1.0),
    animPhase2 = Math.max(0, (eT - 0.6) / 0.4);
  const animBaseOpacity =
    state.animMode !== "none" ? Math.max(0.1, 1 - animPhase1 * 2) : 1;
  const isIrregular = !!state.customVerts;

  if (state.grid)
    gTransform.appendChild(
      el("rect", {
        x: "-50000",
        y: "-50000",
        width: "100000",
        height: "100000",
        fill: "url(#grid-def)",
      }),
    );

  let triangles = [],
    allWedges = [];
  for (let k = 1; k < n - 1; k++) {
    let v0 = verts[0],
      v1 = verts[k],
      v2 = verts[k + 1];
    let centroid = { x: (v0.x + v1.x + v2.x) / 3, y: (v0.y + v1.y + v2.y) / 3 };
    let w0 = createWedge(v0, v1, v2, 0, k),
      w1 = createWedge(v1, v2, v0, k, k),
      w2 = createWedge(v2, v0, v1, k + 1, k);
    let offset = {
      x: (centroid.x - CX) * 0.4 * animPhase1,
      y: (centroid.y - CY) * 0.4 * animPhase1,
    };
    let triColor = `hsl(${(k * 360) / (n - 2)}, 75%, 60%)`;
    w0.color = w1.color = w2.color = triColor;
    w0.offset = w1.offset = w2.offset = offset;
    triangles.push({ k, centroid, offset, p0: v0, p1: v1, p2: v2 });
    allWedges.push(w0, w1, w2);
  }

  const gBase = el("g", { opacity: animBaseOpacity });
  if (state.showRadii)
    verts.forEach((v) =>
      gBase.appendChild(
        el("line", {
          x1: CX,
          y1: CY,
          x2: v.x,
          y2: v.y,
          stroke: "#0055ff",
          "stroke-width": "1",
          "stroke-dasharray": "6,4",
          opacity: "0.35",
        }),
      ),
    );
  if (state.showDiagonals) {
    for (let i = 0; i < n; i++)
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        gBase.appendChild(
          el("line", {
            x1: verts[i].x,
            y1: verts[i].y,
            x2: verts[j].x,
            y2: verts[j].y,
            stroke: "#0055ff",
            "stroke-width": "1",
            "stroke-dasharray": "5,4",
            opacity: "0.25",
          }),
        );
      }
  }
  if (state.fill)
    gBase.appendChild(
      el("polygon", {
        points: pts,
        fill: "rgba(255,229,0,0.22)",
        stroke: "none",
      }),
    );
  gBase.appendChild(
    el("polygon", {
      points: pts,
      fill: "none",
      stroke: "#0a0a0a",
      "stroke-width": "2.5",
      "stroke-linejoin": "miter",
    }),
  );
  gTransform.appendChild(gBase);

  const gOverlay = el("g"),
    pSize = Math.min(46, state.radius * 0.27);
  let bucketSpacing = 90,
    startY = CY - ((n - 3) * bucketSpacing) / 2;

  if (state.animMode === "interior") {
    if (animPhase1 > 0) {
      triangles.forEach((t) => {
        let tp0 = { x: t.p0.x + t.offset.x, y: t.p0.y + t.offset.y },
          tp1 = { x: t.p1.x + t.offset.x, y: t.p1.y + t.offset.y },
          tp2 = { x: t.p2.x + t.offset.x, y: t.p2.y + t.offset.y };
        gTransform.appendChild(
          el("polygon", {
            points: `${tp0.x},${tp0.y} ${tp1.x},${tp1.y} ${tp2.x},${tp2.y}`,
            fill: "rgba(0,0,0,0.03)",
            stroke: "#0a0a0a",
            "stroke-width": "1.5",
            "stroke-dasharray": "4,4",
            opacity: 1 - animPhase2,
          }),
        );
      });
    }
    let tFill = {};
    allWedges.forEach((w) => {
      let tId = w.triIdx;
      if (!tFill[tId]) tFill[tId] = 0;
      w.targCenter = { x: CX, y: startY + (tId - 1) * bucketSpacing };
      w.targStart = 180 + tFill[tId];
      tFill[tId] += w.sweep;
    });
    allWedges.forEach((w) => {
      let currentOrigin = lerpPt(
        { x: w.origin.x + w.offset.x, y: w.origin.y + w.offset.y },
        w.targCenter,
        animPhase2,
      );
      let currentStart = lerpAngle(w.start, w.targStart, animPhase2);
      let wG = el("g");
      wG.appendChild(
        el("path", {
          d: getSectorPath(
            currentOrigin.x,
            currentOrigin.y,
            currentStart,
            w.sweep,
            pSize,
          ),
          fill: w.color,
          stroke: "#0a0a0a",
          "stroke-width": "1.5",
          opacity: 0.85,
        }),
      );
      let rArc = pSize * 0.75;
      wG.appendChild(
        el("path", {
          d: getArcPath(
            currentOrigin.x,
            currentOrigin.y,
            currentStart,
            w.sweep,
            rArc,
          ),
          fill: "none",
          stroke: "#0a0a0a",
          "stroke-width": "1.5",
          opacity: 0.7,
        }),
      );
      wG.appendChild(
        el("path", {
          d: getArcArrow(
            currentOrigin.x,
            currentOrigin.y,
            currentStart,
            w.sweep,
            rArc,
            false,
          ),
          fill: "none",
          stroke: "#0a0a0a",
          "stroke-width": "1",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          opacity: 0.9,
        }),
      );
      gTransform.appendChild(wG);
    });
    if (animPhase2 > 0) {
      for (let k = 1; k < n - 1; k++)
        gTransform.appendChild(
          drawGuideCompass(
            CX,
            startY + (k - 1) * bucketSpacing,
            pSize,
            "interior",
            animPhase2,
          ),
        );
    }
  } else if (state.animMode === "exterior") {
    let extPieces = [],
      currentTargStart = 0,
      totalDiff = 0,
      diffs = [];
    for (let i = 0; i < n; i++) {
      let pPrev = verts[(i - 1 + n) % n],
        pCurr = verts[i],
        pNext = verts[(i + 1) % n];
      let a1 = deg(Math.atan2(pCurr.y - pPrev.y, pCurr.x - pPrev.x)),
        a2 = deg(Math.atan2(pNext.y - pCurr.y, pNext.x - pCurr.x));
      let diff = (((a2 - a1) % 360) + 360) % 360;
      if (diff > 180) diff -= 360;
      diffs.push({ a1, a2, diff, pCurr });
      totalDiff += diff;
    }
    let polySign = totalDiff > 0 ? 1 : -1;
    diffs.forEach((d, i) => {
      let normDiff = d.diff * polySign,
        isReflex = normDiff < 0,
        sweep = Math.abs(normDiff);
      let tStart = isReflex ? currentTargStart + normDiff : currentTargStart,
        actualStart = d.diff > 0 ? d.a1 : d.a2;
      let color = isReflex
        ? "url(#neg-def)"
        : `hsl(${(i * 360) / n}, 85%, 55%)`;
      extPieces.push({
        origin: d.pCurr,
        start: actualStart,
        sweep: sweep,
        targStart: tStart,
        color: color,
        isReflex: isReflex,
      });
      currentTargStart += normDiff;
    });
    extPieces.forEach((p) => {
      let cx = lerp(p.origin.x, CX, eT),
        cy = lerp(p.origin.y, CY, eT),
        cAngle = lerpAngle(p.start, p.targStart, eT);
      let wG = el("g");
      wG.appendChild(
        el("path", {
          d: getSectorPath(cx, cy, cAngle, p.sweep, pSize),
          fill: p.color,
          stroke: "#0a0a0a",
          "stroke-width": "1.5",
          opacity: 0.95,
        }),
      );
      let rArc = pSize * 0.75;
      wG.appendChild(
        el("path", {
          d: getArcPath(cx, cy, cAngle, p.sweep, rArc),
          fill: "none",
          stroke: p.isReflex ? "#ffffff" : "#0a0a0a",
          "stroke-width": "1.5",
          opacity: 0.9,
        }),
      );
      wG.appendChild(
        el("path", {
          d: getArcArrow(cx, cy, cAngle, p.sweep, rArc, p.isReflex),
          fill: "none",
          stroke: p.isReflex ? "#ffffff" : "#0a0a0a",
          "stroke-width": "1",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          opacity: 0.9,
        }),
      );
      gTransform.appendChild(wG);
    });
    if (eT > 0)
      gTransform.appendChild(drawGuideCompass(CX, CY, pSize, "exterior", eT));
  } else if (state.animMode === "none") {
    if (state.showProtractors) {
      verts.forEach((v, i) => {
        let { start, sweep } = getVertexAngleInfo(verts, i);
        let wG = el("g"),
          rArc = pSize * 0.75;
        wG.appendChild(
          el("path", {
            d: getSectorPath(v.x, v.y, start, sweep, pSize),
            fill: `hsl(${(i * 360) / n}, 85%, 55%)`,
            stroke: "#0a0a0a",
            "stroke-width": "1.5",
            opacity: 0.85,
          }),
        );
        wG.appendChild(
          el("path", {
            d: getArcPath(v.x, v.y, start, sweep, rArc),
            fill: "none",
            stroke: "#0a0a0a",
            "stroke-width": "1.5",
            opacity: 0.7,
          }),
        );
        wG.appendChild(
          el("path", {
            d: getArcArrow(v.x, v.y, start, sweep, rArc, false),
            fill: "none",
            stroke: "#0a0a0a",
            "stroke-width": "1",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            opacity: 0.9,
          }),
        );
        let gTicks = el("g", {
          class: "zoom-reveal",
          "font-family": "JetBrains Mono,monospace",
          "font-size": "5",
          fill: "#0a0a0a",
          "font-weight": "700",
          "text-anchor": "middle",
          "dominant-baseline": "middle",
        });
        for (let d = 0; d <= sweep + 0.1; d += 10) {
          let rA = rad(start + d),
            isMain = Math.round(d) % 30 === 0,
            isMid = Math.round(d) % 10 === 0 && !isMain;
          let tR1 = pSize,
            tR2 = pSize - (isMain ? 6 : isMid ? 3 : 2);
          gTicks.appendChild(
            el("line", {
              x1: v.x + tR1 * Math.cos(rA),
              y1: v.y + tR1 * Math.sin(rA),
              x2: v.x + tR2 * Math.cos(rA),
              y2: v.y + tR2 * Math.sin(rA),
              stroke: "#0a0a0a",
              "stroke-width": isMain ? "1" : "0.5",
            }),
          );
          if (isMain)
            gTicks.appendChild(
              txt(Math.round(d).toString(), {
                x: v.x + (pSize - 10) * Math.cos(rA),
                y: v.y + (pSize - 10) * Math.sin(rA),
              }),
            );
        }
        wG.appendChild(gTicks);
        gTransform.appendChild(wG);
      });
    }
  }

  if (state.showSideLabels) {
    const alpha = "abcdefghijklmnopqrstuvwxyz";
    verts.forEach((v, i) => {
      const b = verts[(i + 1) % n],
        mx = (v.x + b.x) / 2,
        my = (v.y + b.y) / 2;
      const dx = mx - CX,
        dy = my - CY,
        dist = Math.hypot(dx, dy) || 1;
      gOverlay.appendChild(
        txt(alpha[i], {
          x: mx + (dx / dist) * 18,
          y: my + (dy / dist) * 18,
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          "font-family": "JetBrains Mono,monospace",
          "font-size": "11",
          "font-weight": "600",
          fill: "#0a0a0a",
          opacity: "0.4",
          "font-style": "italic",
        }),
      );
    });
  }

  if (state.showLabels) {
    verts.forEach((v, i) => {
      let { sweep } = getVertexAngleInfo(verts, i);
      const dx = v.x - CX,
        dy = v.y - CY,
        dist = Math.hypot(dx, dy) || 1,
        inset = Math.min(32, state.radius * 0.2);
      const lx = v.x - (dx / dist) * inset,
        ly = v.y - (dy / dist) * inset,
        textStr = sweep.toFixed(1) + "°";
      const wStr = textStr.length * 6.5 + 10;
      gOverlay.appendChild(
        el("rect", {
          x: lx - wStr / 2,
          y: ly - 9,
          width: wStr,
          height: 17,
          fill: "#ffe500",
          stroke: "#0a0a0a",
          "stroke-width": "1.5",
        }),
      );
      gOverlay.appendChild(
        txt(textStr, {
          x: lx,
          y: ly + 0.5,
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          "font-family": "JetBrains Mono,monospace",
          "font-size": "9",
          "font-weight": "700",
          fill: "#0a0a0a",
        }),
      );
    });
  }

  if (state.showCenter) {
    gOverlay.appendChild(
      el("line", {
        x1: CX - 7,
        y1: CY,
        x2: CX + 7,
        y2: CY,
        stroke: "#0a0a0a",
        "stroke-width": "1.5",
      }),
    );
    gOverlay.appendChild(
      el("line", {
        x1: CX,
        y1: CY - 7,
        x2: CX,
        y2: CY + 7,
        stroke: "#0a0a0a",
        "stroke-width": "1.5",
      }),
    );
    gOverlay.appendChild(
      el("circle", { cx: CX, cy: CY, r: "3.5", fill: "#0055ff" }),
    );
  }

  if (state.showVertices) {
    verts.forEach((v, i) => {
      let isActive = state.activeVerts.has(i);
      gOverlay.appendChild(
        el("circle", {
          cx: v.x,
          cy: v.y,
          r: isActive ? "8" : "6",
          class: `vert-handle ${isActive ? "active" : ""}`,
          "data-idx": i,
        }),
      );
    });
  }

  gTransform.appendChild(gOverlay);
  document.getElementById("s-sides").textContent = n;

  if (isIrregular) {
    document.getElementById("s-interior").textContent = "VARIES";
    document.getElementById("s-exterior").textContent = "VARIES";
    document.getElementById("poly-badge").textContent = "Irregular";
    document.getElementById("poly-name-panel").textContent =
      `Irregular ${POLY_NAMES[n] || n + "-gon"}`;
  } else {
    document.getElementById("s-interior").textContent =
      (((n - 2) * 180) / n).toFixed(1) + "°";
    document.getElementById("s-exterior").textContent =
      (360 / n).toFixed(1) + "°";
    document.getElementById("poly-badge").textContent =
      POLY_NAMES[n] || n + "-gon";
    document.getElementById("poly-name-panel").textContent =
      `Regular ${POLY_NAMES[n] || n + "-gon"}`;
  }

  document.getElementById("s-sum").textContent = (n - 2) * 180 + "°";

  // PrepBot names the shape once the dragging settles (see prepbot.js).
  window.PolygonPrepbot?.noteShape({
    sides: n,
    interior: isIrregular ? NaN : ((n - 2) * 180) / n,
    sum: (n - 2) * 180,
  });
  document.getElementById("f-interior").textContent = isIrregular
    ? `Varies`
    : `(${n}−2)×180/${n} = ${(((n - 2) * 180) / n).toFixed(1)}°`;
  document.getElementById("f-exterior").textContent = isIrregular
    ? `Varies`
    : `360/${n} = ${(360 / n).toFixed(1)}°`;
  document.getElementById("f-sum").textContent =
    `(${n}−2)×180 = ${(n - 2) * 180}°`;
  document.getElementById("f-diag").textContent =
    `${n}(${n}−3)/2 = ${Math.max(0, (n * (n - 3)) / 2)}`;
}

const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    const { width, height } = entry.contentRect;
    if (width > 0 && height > 0) {
      if (Math.abs(VW - width) > 2 || Math.abs(VH - height) > 2) {
        VW = width;
        VH = height;
        CX = VW / 2;
        CY = VH / 2;
        svg.setAttribute("viewBox", `0 0 ${VW} ${VH}`);
        if (isInitialized) render();
      }
    }
  }
});
resizeObserver.observe(document.querySelector(".canvas-frame"));

function resetPolygon() {
  state.customVerts = null;
  state.activeVerts.clear();
  render();
}

const modalOverlay = document.getElementById("modal");

function wire(id, key, transform, displayId, displayFmt) {
  const elem = document.getElementById(id),
    dv = displayId ? document.getElementById(displayId) : null;

  elem.addEventListener("pointerdown", () => {
    modalOverlay.style.opacity = "0.15";
  });
  elem.addEventListener("pointerup", () => {
    modalOverlay.style.opacity = "1";
  });

  elem.addEventListener("input", () => {
    state[key] = transform(elem.value);
    if (dv) dv.textContent = displayFmt ? displayFmt(state[key]) : state[key];
    if (key === "sides" || key === "radius" || key === "rotation")
      resetPolygon();
    else render();
  });

  elem.addEventListener("change", () => {
  });
}

function wireToggle(id, key) {
  document.getElementById(id).addEventListener("change", (e) => {
    state[key] = e.target.checked;
    render();
  });
}

wire("sl-sides", "sides", parseInt, "dv-sides", null);
wire("sl-rot", "rotation", parseInt, "dv-rot", (v) => v + "°");
wire("sl-radius", "radius", parseInt, "dv-radius", null);
wire(
  "sl-anim",
  "animProgress",
  parseFloat,
  "dv-anim-val",
  (v) => Math.round(v * 100) + "%",
);
[
  "protractors",
  "labels",
  "vertices",
  "center",
  "sidelabels",
  "diagonals",
  "radii",
].forEach((k) => {
  wireToggle("t-" + k, "show" + k.charAt(0).toUpperCase() + k.slice(1));
});
wireToggle("t-fill", "fill");
wireToggle("t-grid", "grid");

document.querySelectorAll(".anim-mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".anim-mode-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.animMode = btn.dataset.mode;
    document.getElementById("sl-anim").disabled = state.animMode === "none";
    if (state.animMode === "none") {
      state.animProgress = 0;
      document.getElementById("sl-anim").value = 0;
      document.getElementById("dv-anim-val").textContent = "0%";
    }
    render();
  });
});

document
  .querySelector('.anim-mode-btn[data-mode="interior"]')
  .classList.add("active");
document.getElementById("sl-anim").disabled = false;

function applyZoom(zoomFactor, svgMx = VW / 2, svgMy = VH / 2) {
  let newScale = Math.max(0.2, Math.min(vScale * zoomFactor, 20));
  vX = svgMx - (svgMx - vX) * (newScale / vScale);
  vY = svgMy - (svgMy - vY) * (newScale / vScale);
  vScale = newScale;
  updateView();
}

svg.addEventListener("dblclick", () => {
  resetPolygon();
});

document.getElementById("btn-zoom-in").onclick = () => {
  applyZoom(1.25);
};
document.getElementById("btn-zoom-out").onclick = () => {
  applyZoom(0.8);
};
document.getElementById("btn-zoom-reset").onclick = () => {
  vX = 0;
  vY = 0;
  vScale = 1;
  updateView();
};

let isDragging = false,
  isVertDragging = false;
let startX,
  startY,
  startVx,
  startVy,
  panDistance = 0;
let dragVertIdx = null,
  vertDragStart = null,
  startCustomVerts = null;

svg.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    applyZoom(
      e.deltaY < 0 ? 1.15 : 0.85,
      (e.clientX - rect.left) * (VW / rect.width),
      (e.clientY - rect.top) * (VW / rect.width),
    );
  },
  { passive: false },
);

svg.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".anim-panel") || e.target.closest(".zoom-controls"))
    return;

  const rect = svg.getBoundingClientRect(),
    scaleRatio = VW / rect.width;
  const mx = (e.clientX - rect.left) * scaleRatio,
    my = (e.clientY - rect.top) * scaleRatio;
  const verts = getVertices(),
    n = verts.length;

  const handle = e.target.closest(".vert-handle");
  if (handle) {
    dragVertIdx = parseInt(handle.dataset.idx);
    vertDragStart = { x: e.clientX, y: e.clientY };
    startCustomVerts = state.customVerts
      ? JSON.parse(JSON.stringify(state.customVerts))
      : getRegularVerts();
    isVertDragging = false;
    svg.setPointerCapture(e.pointerId);
    e.stopPropagation();
    return;
  }

  const threshold = 12 / vScale;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    if (
      distToSegment(mx, my, verts[i].x, verts[i].y, verts[j].x, verts[j].y) <
      threshold
    ) {
      dragVertIdx = [i, j];
      vertDragStart = { x: e.clientX, y: e.clientY };
      startCustomVerts = state.customVerts
        ? JSON.parse(JSON.stringify(state.customVerts))
        : getRegularVerts();
      isVertDragging = false;
      svg.setPointerCapture(e.pointerId);
      e.stopPropagation();
      return;
    }
  }

  isDragging = true;
  panDistance = 0;
  startX = e.clientX;
  startY = e.clientY;
  startVx = vX;
  startVy = vY;
  svg.setPointerCapture(e.pointerId);
});

svg.addEventListener("pointermove", (e) => {
  const rect = svg.getBoundingClientRect(),
    scaleRatio = VW / rect.width;

  if (dragVertIdx !== null) {
    let dx = ((e.clientX - vertDragStart.x) * scaleRatio) / vScale;
    let dy = ((e.clientY - vertDragStart.y) * scaleRatio) / vScale;
    if (!state.customVerts) state.customVerts = startCustomVerts;

    if (Array.isArray(dragVertIdx)) {
      if (!isVertDragging && Math.hypot(dx, dy) > 3) isVertDragging = true;
      if (isVertDragging) {
        let newVerts = JSON.parse(JSON.stringify(startCustomVerts));
        newVerts[dragVertIdx[0]].x += dx;
        newVerts[dragVertIdx[0]].y += dy;
        newVerts[dragVertIdx[1]].x += dx;
        newVerts[dragVertIdx[1]].y += dy;
        state.customVerts = newVerts;
        render();
      }
    } else {
      if (!isVertDragging && Math.hypot(dx, dy) > 3) isVertDragging = true;
      if (isVertDragging) {
        let newVerts = JSON.parse(JSON.stringify(startCustomVerts));
        if (state.activeVerts.has(dragVertIdx)) {
          state.activeVerts.forEach((i) => {
            newVerts[i].x += dx;
            newVerts[i].y += dy;
          });
        } else {
          newVerts[dragVertIdx].x += dx;
          newVerts[dragVertIdx].y += dy;
        }
        state.customVerts = newVerts;
        render();
      }
    }
    return;
  }
  if (!isDragging) return;
  panDistance += Math.hypot(e.movementX, e.movementY);
  vX = startVx + (e.clientX - startX) * scaleRatio;
  vY = startVy + (e.clientY - startY) * scaleRatio;
  updateView();
});

svg.addEventListener("pointerup", (e) => {
  if (dragVertIdx !== null) {
    if (!isVertDragging) {
      if (Array.isArray(dragVertIdx)) {
        const [i, j] = dragVertIdx;
        if (state.activeVerts.has(i) && state.activeVerts.has(j)) {
          state.activeVerts.delete(i);
          state.activeVerts.delete(j);
        } else {
          state.activeVerts.add(i);
          state.activeVerts.add(j);
        }
        render();
      } else {
        if (state.activeVerts.has(dragVertIdx))
          state.activeVerts.delete(dragVertIdx);
        else state.activeVerts.add(dragVertIdx);
        render();
      }
    } else {
    }
    dragVertIdx = null;
    isVertDragging = false;
    startCustomVerts = null;
    svg.releasePointerCapture(e.pointerId);
    return;
  }

  if (isDragging && panDistance > 10) {
  }

  isDragging = false;
  panDistance = 0;
  svg.releasePointerCapture(e.pointerId);
});

svg.addEventListener("pointercancel", () => {
  isDragging = false;
  dragVertIdx = null;
});

let initialPinchDist = null,
  initialScale = 1;
svg.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 2) {
      isDragging = false;
      dragVertIdx = null;
      initialPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      initialScale = vScale;
    }
  },
  { passive: false },
);

svg.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length === 2 && initialPinchDist) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      const scaleFactor = dist / initialPinchDist;
      const newScale = Math.max(0.2, Math.min(initialScale * scaleFactor, 20));
      const rect = svg.getBoundingClientRect();
      const svgMx = (center.x - rect.left) * (VW / rect.width);
      const svgMy = (center.y - rect.top) * (VW / rect.width);
      vX = svgMx - (svgMx - vX) * (newScale / vScale);
      vY = svgMy - (svgMy - vY) * (newScale / vScale);
      vScale = newScale;
      initialScale = newScale;
      initialPinchDist = dist;
      updateView();
    }
  },
  { passive: false },
);

svg.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) initialPinchDist = null;
});

let lastTapTime = 0;
svg.addEventListener("touchend", (e) => {
  if (dragVertIdx !== null || isDragging) return;
  const now = Date.now();
  if (now - lastTapTime < 300) {
    resetPolygon();
  }
  lastTapTime = now;
});

const overlay = document.getElementById("overlay"),
  fab = document.getElementById("fab"),
  close = document.getElementById("modal-close");
fab.addEventListener("click", () => overlay.classList.add("open"));
close.addEventListener("click", () => overlay.classList.remove("open"));
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) overlay.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") overlay.classList.remove("open");
});

isInitialized = true;
