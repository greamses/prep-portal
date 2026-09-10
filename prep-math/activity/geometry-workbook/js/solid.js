/* ============================================================================
   Geometry Workbook — solids, and the nets they unfold into
   ----------------------------------------------------------------------------
   Chapter three draws prisms, pyramids, frustums and the round solids, and
   every drawing here is a real 3D model looked at from a little above and to
   one side, not a picture traced by hand. That is what makes the counting
   questions honest: the edges at the back are there (dashed), so a child who
   counts twelve edges on a cuboid can find all twelve on the page.

   THE MODEL. A solid is corners (x, y, z — y is up), edges (pairs of
   corners) and faces (loops of corners, wound so their normals point out).
   The view turns it about the upright by `yaw` and tips it towards you by
   `pitch`, and projects straight on. A face is seen when its normal points
   at you; an edge is solid if either face beside it is seen, dashed if both
   are round the back — which is exactly right for a convex solid, and every
   solid in this chapter is convex.

   Everything else — which face is a base, which are side faces — is kept on
   the model, so a question can shade "the bases" or number "the side faces"
   without knowing anything about the drawing.
   ========================================================================== */

const INK = "#2a2723";
const HIDDEN = "#8f887c";
const BASE_FILL = "#bfe3ff";
const SIDE_FILL = "#fff3a8";
const PICK = "#f4c95d";
const PAPER = "#fffdf8";

const rad = (d) => (d * Math.PI) / 180;
const f = (n) => n.toFixed(2);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/* ── bases: polygons in the ground plane, as [x, z] ────────────────────────*/

/** A regular n-gon of circumradius r, turned so it does not sit edge-on. */
export function regularBase(n, r = 20, turn = 0) {
  return Array.from({ length: n }, (_, i) => {
    const a = rad(turn + (360 * i) / n + (n === 4 ? 45 : 90));
    return [r * Math.cos(a), r * Math.sin(a)];
  });
}

/** A w by d rectangle, centred. */
export const rectBase = (w, d) => [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];

/** A right-angled triangle with legs a and b, the right angle at the origin. */
export const rightTriBase = (a, b) => [[-a / 2, -b / 3], [a / 2, -b / 3], [-a / 2, (2 * b) / 3]];

/* ── the solids ────────────────────────────────────────────────────────────*/

function faceNormal(pts, v) {
  const [a, b, c] = v.map((i) => pts[i]);
  return cross(sub(b, a), sub(c, a));
}

/* Wind every face so its normal points away from the middle. */
function orient(pts, faces) {
  const mid = pts.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]).map((v) => v / pts.length);
  return faces.map((fc) => {
    const n = faceNormal(pts, fc.v);
    const c = fc.v.reduce((s, i) => [s[0] + pts[i][0], s[1] + pts[i][1], s[2] + pts[i][2]], [0, 0, 0]).map((v) => v / fc.v.length);
    return dot(n, sub(c, mid)) < 0 ? { ...fc, v: fc.v.slice().reverse() } : fc;
  });
}

function edgesOf(faces) {
  const seen = new Map();
  faces.forEach((fc, k) => {
    fc.v.forEach((a, i) => {
      const b = fc.v[(i + 1) % fc.v.length];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!seen.has(key)) seen.set(key, { a: Math.min(a, b), b: Math.max(a, b), faces: [] });
      seen.get(key).faces.push(k);
    });
  });
  return [...seen.values()];
}

/** A prism: the base, the same base h above it, and a rectangle on every side. */
export function prism(base, h) {
  const n = base.length;
  const pts = [...base.map(([x, z]) => [x, 0, z]), ...base.map(([x, z]) => [x, h, z])];
  const faces = [
    { v: base.map((_, i) => i), kind: "base" },
    { v: base.map((_, i) => n + i), kind: "base" },
    ...base.map((_, i) => ({ v: [i, (i + 1) % n, n + ((i + 1) % n), n + i], kind: "side" })),
  ];
  const o = orient(pts, faces);
  return { kind: "prism", n, pts, faces: o, edges: edgesOf(o) };
}

/** A pyramid: the base, and a triangle from every side up to one apex. */
export function pyramid(base, h, apex = [0, 0]) {
  const n = base.length;
  const pts = [...base.map(([x, z]) => [x, 0, z]), [apex[0], h, apex[1]]];
  const faces = [
    { v: base.map((_, i) => i), kind: "base" },
    ...base.map((_, i) => ({ v: [i, (i + 1) % n, n], kind: "side" })),
  ];
  const o = orient(pts, faces);
  return { kind: "pyramid", n, pts, faces: o, edges: edgesOf(o) };
}

/** A frustum: a pyramid with its top cut off level — two bases, trapezium sides. */
export function frustum(base, h, k = 0.5) {
  const n = base.length;
  const pts = [...base.map(([x, z]) => [x, 0, z]), ...base.map(([x, z]) => [x * k, h, z * k])];
  const faces = [
    { v: base.map((_, i) => i), kind: "base" },
    { v: base.map((_, i) => n + i), kind: "base" },
    ...base.map((_, i) => ({ v: [i, (i + 1) % n, n + ((i + 1) % n), n + i], kind: "side" })),
  ];
  const o = orient(pts, faces);
  return { kind: "frustum", n, pts, faces: o, edges: edgesOf(o) };
}

/** The same solid with some faces taken away — an open box, a tube. */
export function without(solid, faceIdx) {
  const drop = new Set(faceIdx);
  const faces = solid.faces.filter((_, i) => !drop.has(i));
  return { ...solid, faces, edges: edgesOf(faces), open: true };
}

/** The same solid lying on its side (turned a quarter about the depth axis) —
    a tube looks like a tube lying down, open at both ends. */
export function lieDown(solid) {
  const pts = solid.pts.map(([x, y, z]) => [y, -x, z]);
  return { ...solid, pts };
}

/* ── drawing ───────────────────────────────────────────────────────────────*/

function viewOf(yaw, pitch) {
  const cy = Math.cos(rad(yaw)), sy = Math.sin(rad(yaw));
  const cp = Math.cos(rad(pitch)), sp = Math.sin(rad(pitch));
  const turn = ([x, y, z]) => {
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    return [x1, y * cp - z1 * sp, z1 * cp + y * sp]; // screen x, screen up, depth toward you
  };
  return turn;
}

/**
 * Draw a solid.
 *   show     "solid" (faces tinted: bases blue, sides yellow) | "plain" | "sticks"
 *   pick     face indices to shade in the pick colour (a face to name)
 *   numbers  write a number on every face you can see
 *   dots     a dot on every corner
 *   markEdge [a, b] corner indices of one edge to draw thick (an edge to name)
 *   markCorner  a corner index to ring (a corner to name)
 *   dims     [{ a, b, text }] a measurement written beside the edge a–b
 *   grid     rule the unit squares on every face you can see (a cuboid built
 *            in whole units, for counting cubes)
 *   box      { w, h } in millimetres
 */
export function solidSvg(solid, {
  yaw = 28, pitch = 22, show = "plain", pick = [], numbers = false, dots = false,
  markEdge = null, markCorner = null, dims = [], grid = false, box = { w: 60, h: 50 }, label = "",
} = {}) {
  const turn = viewOf(yaw, pitch);
  const P = solid.pts.map(turn);
  const xs = P.map((p) => p[0]);
  const ys = P.map((p) => -p[1]);
  const pad = 4;
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const s = Math.min((box.w - 2 * pad) / (maxX - minX || 1), (box.h - 2 * pad) / (maxY - minY || 1));
  const T = (p) => [(p[0] - minX) * s + pad, (-p[1] - minY) * s + pad];
  const W = (maxX - minX) * s + 2 * pad;
  const H = (maxY - minY) * s + 2 * pad;

  /* which faces look at you: the normal's depth component, after the turn */
  const origin = turn([0, 0, 0]);
  const facing = solid.faces.map((fc) => {
    const n = faceNormal(solid.pts, fc.v);
    const tn = sub(turn(n), origin);
    return tn[2] > 1e-6;
  });

  let body = "";
  /* An OPEN solid shows its inside through the gap, so it is painted like a
     real box: the far walls first (their inside, tinted), then the near ones
     over them, each with its own edges — whatever the near walls do not
     cover, you can see. */
  if (solid.open && show !== "sticks") {
    const depth = (fc) => fc.v.reduce((acc, k) => acc + P[k][2], 0) / fc.v.length;
    const order = solid.faces.map((_, i) => i).sort((i, j) => (facing[i] - facing[j]) || (depth(solid.faces[i]) - depth(solid.faces[j])));
    order.forEach((i) => {
      const fc = solid.faces[i];
      const fill = pick.includes(i) ? PICK : facing[i] ? PAPER : "#e9e1d0";
      const pts2 = fc.v.map((k) => T(P[k]).map(f).join(",")).join(" ");
      body += `<polygon points="${pts2}" fill="${fill}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>`;
    });
  }
  /* faces, back ones first */
  const order = solid.faces.map((fc, i) => i).sort((a, b) => facing[a] - facing[b]);
  if (show !== "sticks" && !solid.open) {
    order.forEach((i) => {
      const fc = solid.faces[i];
      if (!facing[i] && !solid.open) return;
      const fill = pick.includes(i) ? PICK
        : show === "solid" ? (fc.kind === "base" ? BASE_FILL : SIDE_FILL) : PAPER;
      const pts = fc.v.map((k) => T(P[k]).map(f).join(",")).join(" ");
      body += `<polygon points="${pts}" fill="${fill}" fill-opacity="${facing[i] ? 1 : 0.55}" stroke="none"/>`;
    });
  }
  /* the unit squares on the faces you can see: each face's two edge
     directions, cut at every whole unit */
  if (grid) {
    solid.faces.forEach((fc, i) => {
      if (!facing[i] || fc.v.length !== 4) return;
      const [v0, v1, , v3] = fc.v.map((k) => solid.pts[k]);
      const u = sub(v1, v0);
      const w = sub(v3, v0);
      const nu = Math.round(Math.hypot(...u));
      const nw = Math.round(Math.hypot(...w));
      const at = (a, b) => T(turn([v0[0] + u[0] * a + w[0] * b, v0[1] + u[1] * a + w[1] * b, v0[2] + u[2] * a + w[2] * b]));
      for (let k = 1; k < nu; k++) {
        const [p, q] = [at(k / nu, 0), at(k / nu, 1)];
        body += `<line x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}" stroke="${INK}" stroke-width="0.25" stroke-opacity="0.6"/>`;
      }
      for (let k = 1; k < nw; k++) {
        const [p, q] = [at(0, k / nw), at(1, k / nw)];
        body += `<line x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}" stroke="${INK}" stroke-width="0.25" stroke-opacity="0.6"/>`;
      }
    });
  }
  /* edges: solid if a seen face is on either side, dashed if both are hidden
     (an open solid has drawn its own, above) */
  (solid.open && show !== "sticks" ? [] : solid.edges).forEach((e) => {
    const seen = show === "sticks" || e.faces.some((k) => facing[k]) || e.faces.length < 2;
    const [a, b] = [T(P[e.a]), T(P[e.b])];
    body += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" ` +
      (show === "sticks"
        ? `stroke="#8a5a2b" stroke-width="1.3" stroke-linecap="round"/>`
        : seen
          ? `stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>`
          : `stroke="${HIDDEN}" stroke-width="0.5" stroke-dasharray="1.6 1.2"/>`);
  });
  if (show === "sticks" || dots) {
    P.forEach((p) => {
      const [x, y] = T(p);
      body += show === "sticks"
        ? `<circle cx="${f(x)}" cy="${f(y)}" r="1.9" fill="#c0453f" stroke="${INK}" stroke-width="0.3"/>`
        : `<circle cx="${f(x)}" cy="${f(y)}" r="1.1" fill="${INK}"/>`;
    });
  }
  if (markEdge) {
    const [a, b] = [T(P[markEdge[0]]), T(P[markEdge[1]])];
    body += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="#c0453f" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  if (markCorner !== null && markCorner !== undefined) {
    const [x, y] = T(P[markCorner]);
    body += `<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="#c0453f" stroke="${PAPER}" stroke-width="0.5"/>`;
  }
  /* A measurement beside its edge, pushed out square to the edge on the side
     away from the middle of the solid. { up: true } means "the height", and
     is put on the upright at the far left, which is always in view. The
     labels can reach past the lines, so the drawing is grown to hold them. */
  const labels = [];
  if (dims.length) {
    const mid = P.map((p) => T(p)).reduce((acc, p) => [acc[0] + p[0] / P.length, acc[1] + p[1] / P.length], [0, 0]);
    dims.forEach((dm) => {
      let { a, b } = dm;
      if (dm.along) {
        /* the length: an edge between two side faces, the highest on the
           page (the top of the silhouette — always in view, and clear of the
           labels round the end) */
        const long = solid.edges.filter((e) => e.faces.every((k) => solid.faces[k].kind === "side"))
          .sort((e1, e2) => (T(P[e1.a])[1] + T(P[e1.b])[1]) - (T(P[e2.a])[1] + T(P[e2.b])[1]))[0];
        if (!long) return;
        ({ a, b } = long);
      } else if (dm.up) {
        const ups = solid.edges.filter((e) => {
          const [u, v] = [solid.pts[e.a], solid.pts[e.b]];
          return Math.abs(u[0] - v[0]) < 1e-6 && Math.abs(u[2] - v[2]) < 1e-6 && Math.abs(u[1] - v[1]) > 1e-6;
        });
        const left = ups.sort((e1, e2) => T(P[e1.a])[0] - T(P[e2.a])[0])[0];
        if (!left) return;
        ({ a, b } = left);
      }
      const [p, q] = [T(P[a]), T(P[b])];
      const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
      let d = [-(q[1] - p[1]) / len, (q[0] - p[0]) / len];
      /* "inside" is the face this edge belongs to that you can see — a top
         edge's label goes outside the top face, not across it — or the whole
         solid when neither face is in view */
      const own = solid.faces.findIndex((fc, i) => facing[i] && fc.v.includes(a) && fc.v.includes(b));
      const ref = own >= 0 && !dm.up && !dm.along
        ? solid.faces[own].v.map((k) => T(P[k])).reduce((acc, pt, _, arr) => [acc[0] + pt[0] / arr.length, acc[1] + pt[1] / arr.length], [0, 0])
        : mid;
      if (d[0] * (m[0] - ref[0]) + d[1] * (m[1] - ref[1]) < 0) d = [-d[0], -d[1]];
      const w = String(dm.text).length * 2.05;
      const reach = 2.4 + Math.abs(d[0]) * (w / 2) + Math.abs(d[1]) * 1.4;
      labels.push({ x: m[0] + d[0] * reach, y: m[1] + d[1] * reach, w, text: dm.text });
    });
    labels.forEach(({ x, y, text }) => {
      body += `<text x="${f(x)}" y="${f(y + 1.2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.3" font-weight="700" fill="${INK}">${text}</text>`;
    });
  }
  if (numbers) {
    let k = 0;
    solid.faces.forEach((fc, i) => {
      if (!facing[i]) return;
      const c = fc.v.map((j) => T(P[j])).reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]).map((v) => v / fc.v.length);
      k++;
      body += `<text x="${f(c[0])}" y="${f(c[1] + 1.2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.4" font-weight="700" fill="${INK}">${k}</text>`;
    });
  }
  const pts = P.map((p) => T(p).map(f).join(",")).join(" ");
  /* grow the drawing to take in every label */
  let x0 = 0, y0 = 0, x1 = W, y1 = H;
  labels.forEach(({ x, y, w }) => {
    x0 = Math.min(x0, x - w / 2 - 1); x1 = Math.max(x1, x + w / 2 + 1);
    y0 = Math.min(y0, y - 2.5); y1 = Math.max(y1, y + 2.5);
  });
  return (
    `<svg viewBox="${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}" width="${f(x1 - x0)}mm" height="${f(y1 - y0)}mm" class="gw-fig gw-solid" data-pts="${pts}" ` +
    `role="img" aria-label="${label || `A ${solid.kind}`}">${body}</svg>`
  );
}

/** The faces of a solid that face you in solidSvg with the same view. */
export function visibleFaces(solid, { yaw = 28, pitch = 22 } = {}) {
  const turn = viewOf(yaw, pitch);
  const origin = turn([0, 0, 0]);
  return solid.faces.map((fc, i) => (sub(turn(faceNormal(solid.pts, fc.v)), origin)[2] > 1e-6 ? i : -1)).filter((i) => i >= 0);
}

/* ── the round solids, for "faces and surfaces" ────────────────────────────
   Drawn, not modelled: an ellipse is an ellipse. */

function ell(cx, cy, rx, ry, { back = false, fill = "none" } = {}) {
  if (!back) return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" stroke="${INK}" stroke-width="0.7"/>`;
  /* the far half dashed, the near half solid */
  return (
    `<path d="M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx)} ${f(cy)}" fill="none" stroke="${HIDDEN}" stroke-width="0.5" stroke-dasharray="1.6 1.2"/>` +
    `<path d="M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(cy)}" fill="none" stroke="${INK}" stroke-width="0.7"/>`
  );
}

/** cylinder | cone | sphere | hemisphere, in a w by h box of millimetres. */
export function roundSvg(kind, { w = 40, h = 44 } = {}) {
  const cx = w / 2;
  const rx = w * 0.36;
  const ry = rx * 0.32;
  let body = "";
  const curved = "#fff3a8";
  const flat = "#bfe3ff";
  if (kind === "cylinder") {
    const top = h * 0.2, bot = h * 0.8;
    body += `<path d="M${f(cx - rx)} ${f(top)} L${f(cx - rx)} ${f(bot)} A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(bot)} L${f(cx + rx)} ${f(top)} Z" fill="${curved}" stroke="${INK}" stroke-width="0.7"/>`;
    body += ell(cx, bot, rx, ry, { back: true });
    body += ell(cx, top, rx, ry, { fill: flat });
  } else if (kind === "cone") {
    const apex = h * 0.12, bot = h * 0.8;
    body += `<path d="M${f(cx)} ${f(apex)} L${f(cx - rx)} ${f(bot)} A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(bot)} Z" fill="${curved}" stroke="${INK}" stroke-width="0.7"/>`;
    body += ell(cx, bot, rx, ry, { back: true });
  } else if (kind === "sphere") {
    const cy = h / 2;
    body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rx)}" fill="${curved}" stroke="${INK}" stroke-width="0.7"/>`;
    body += ell(cx, cy, rx, ry, { back: true });
  } else {
    /* hemisphere: the dome, and the flat circle it stands on */
    const cy = h * 0.62;
    body += `<path d="M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(rx)} 0 0 1 ${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx)} ${f(cy)} Z" fill="${curved}" stroke="${INK}" stroke-width="0.7"/>`;
    body += ell(cx, cy, rx, ry, { fill: flat });
  }
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm" class="gw-fig gw-solid" role="img" aria-label="A ${kind}">${body}</svg>`;
}

/* ── nets ──────────────────────────────────────────────────────────────────
   Flat, in millimetres, every face a polygon with a fold line where it meets
   its neighbour. Built from the same numbers as the solid, so a net can be
   cut out and folded and it closes. */

function netSvg(polys, { box = { w: 70, h: 60 }, labels = [], label = "A net" } = {}) {
  const all = polys.flat();
  const minX = Math.min(...all.map((p) => p[0])), maxX = Math.max(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1])), maxY = Math.max(...all.map((p) => p[1]));
  const pad = 3;
  const s = Math.min((box.w - 2 * pad) / (maxX - minX || 1), (box.h - 2 * pad) / (maxY - minY || 1), 1.6);
  const T = ([x, y]) => [(x - minX) * s + pad, (y - minY) * s + pad];
  const W = (maxX - minX) * s + 2 * pad;
  const H = (maxY - minY) * s + 2 * pad;
  let body = "";
  polys.forEach((poly, i) => {
    body += `<polygon points="${poly.map((p) => T(p).map(f).join(",")).join(" ")}" fill="${i === 0 ? BASE_FILL : PAPER}" fill-opacity="0.6" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round"/>`;
  });
  labels.forEach(({ at, text }) => {
    const [x, y] = T(at);
    body += `<text x="${f(x)}" y="${f(y + 1.2)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.2" font-weight="700" fill="${INK}">${text}</text>`;
  });
  return `<svg viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm" class="gw-fig gw-net" role="img" aria-label="${label}">${body}</svg>`;
}

/* A regular polygon of side a standing on the edge from p to q, on the side
   of that edge given by sign (+1 left, -1 right, looking from p to q). */
function polyOnEdge(n, p, q, sign = 1) {
  const out = [p, q];
  const ext = (2 * Math.PI) / n;
  let dir = Math.atan2(q[1] - p[1], q[0] - p[0]);
  const a = Math.hypot(q[0] - p[0], q[1] - p[1]);
  let cur = q;
  for (let i = 2; i < n; i++) {
    dir += sign * ext;
    cur = [cur[0] + a * Math.cos(dir), cur[1] + a * Math.sin(dir)];
    out.push(cur);
  }
  return out;
}

/** The net of a prism on a regular n-gon base of side a, height h. */
export function prismNet(n, a, h, opts = {}) {
  const polys = [];
  for (let i = 0; i < n; i++) polys.push([[i * a, 0], [(i + 1) * a, 0], [(i + 1) * a, h], [i * a, h]]);
  /* the two bases hang off the top and bottom of the second rectangle */
  const k = Math.min(1, n - 1);
  const top = polyOnEdge(n, [(k + 1) * a, 0], [k * a, 0], 1);
  const bot = polyOnEdge(n, [k * a, h], [(k + 1) * a, h], 1);
  return netSvg([top, ...polys, bot], { label: `The net of a prism with ${n} sides`, ...opts });
}

/** The net of a pyramid on a regular n-gon base of side a, slant height s. */
export function pyramidNet(n, a, s, opts = {}) {
  const R = a / (2 * Math.sin(Math.PI / n));
  const base = Array.from({ length: n }, (_, i) => {
    const t = (2 * Math.PI * i) / n - Math.PI / 2 + (n % 2 ? 0 : Math.PI / n);
    return [R * Math.cos(t), R * Math.sin(t)];
  });
  const tris = base.map((p, i) => {
    const q = base[(i + 1) % n];
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const len = Math.hypot(m[0], m[1]) || 1;
    return [p, q, [m[0] + (m[0] / len) * s, m[1] + (m[1] / len) * s]];
  });
  return netSvg([base, ...tris], { label: `The net of a pyramid with ${n} sides`, ...opts });
}

/** A cuboid's net (w by d base, height h), in the usual cross. */
export function cuboidNet(w, d, h, opts = {}) {
  const polys = [
    [[d, d], [d + w, d], [d + w, d + h], [d, d + h]],             // front — the first is shaded: a base
    [[d, 0], [d + w, 0], [d + w, d], [d, d]],                     // top
    [[0, d], [d, d], [d, d + h], [0, d + h]],                     // left
    [[d + w, d], [2 * d + w, d], [2 * d + w, d + h], [d + w, d + h]], // right
    [[d, d + h], [d + w, d + h], [d + w, 2 * d + h], [d, 2 * d + h]], // bottom
    [[d, 2 * d + h], [d + w, 2 * d + h], [d + w, 2 * d + 2 * h], [d, 2 * d + 2 * h]], // back
  ];
  return netSvg(polys, { label: "The net of a cuboid", ...opts });
}

/** The net of a frustum on a square base: two squares and four trapezia. */
export function frustumNet(a, b, s, opts = {}) {
  /* big square in the middle, a trapezium on each side, the small square on one */
  const A = a / 2, B = b / 2;
  const big = [[-A, -A], [A, -A], [A, A], [-A, A]];
  const traps = [
    [[-A, -A], [A, -A], [B, -A - s], [-B, -A - s]],
    [[A, -A], [A, A], [A + s, B], [A + s, -B]],
    [[A, A], [-A, A], [-B, A + s], [B, A + s]],
    [[-A, A], [-A, -A], [-A - s, -B], [-A - s, B]],
  ];
  const small = [[-B, -A - s], [B, -A - s], [B, -A - s - b], [-B, -A - s - b]];
  return netSvg([big, ...traps, small], { label: "The net of a frustum", ...opts });
}

/* Two nets that do NOT fold into a cube — six squares, wrongly arranged. */
export function cubeNet(kind, a = 10, opts = {}) {
  const cells = {
    cross: [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]],
    tee: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [1, 3]],
    stairs: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3]],
    zig: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2]],
    line: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]],       // not a cube
    block: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],       // not a cube
    ell: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3]],         // not a cube
  }[kind];
  const polys = cells.map(([c, r]) => [[c * a, r * a], [(c + 1) * a, r * a], [(c + 1) * a, (r + 1) * a], [c * a, (r + 1) * a]]);
  return netSvg(polys, { label: "Six squares joined edge to edge", ...opts });
}
export const CUBE_NETS = { yes: ["cross", "tee", "stairs", "zig"], no: ["line", "block", "ell"] };
