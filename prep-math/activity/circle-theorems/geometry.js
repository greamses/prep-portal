/* ============================================================================
   CIRCLE THEOREMS — the geometry  (prep-math/activity/circle-theorems/geometry.js)
   ----------------------------------------------------------------------------
   Pure: no DOM. Every theorem is described here — where its points start, how
   they may move, and what the figure is made of for any position of them —
   and index.js only draws what this says. Node can import it to check that
   every theorem holds wherever its points are put.

   THE CIRCLE is centred on O = (0, 0) with radius R, in figure units (the
   SVG's viewBox). A point ON the circle is kept as an angle in degrees,
   counted anticlockwise from the right, with y DOWN on the screen — so 90° is
   the top. Points on the circle snap to EVEN degrees: then every angle at the
   centre is a whole even number and every angle at the circumference a whole
   number, and "twice" and "equal" hold to the degree on screen.

   A FIGURE is plain data:
     segs     [{ a, b, cls, part }]                lines between two points
     points   [{ id, at, label, drag }]            drag: "circle" | "free" | null
     angles   [{ v, p1, p2, value, cls, part, reflex, label }]
     rights   [{ v, p1, p2, part }]                right-angle marks
     lengths  [{ a, b, value, cls, part }]         a length written on a line
     fact     the theorem with the live numbers, as HTML
   `part` names a piece so a proof step can light it (and dim the rest).
   ========================================================================== */

export const R = 62;
const DEG = Math.PI / 180;
export const LENGTH_SCALE = 5 / R;           // the radius is called 5 cm

export const on = (deg) => [R * Math.cos(deg * DEG), -R * Math.sin(deg * DEG)];
export const norm = (d) => ((d % 360) + 360) % 360;
export const snap = (d, step = 2) => norm(Math.round(d / step) * step);
export const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const O = [0, 0];

/** the angle at v between the rays to p1 and p2, in degrees (0 to 180) */
export function angleAt(v, p1, p2) {
  const a = sub(p1, v), b = sub(p2, v);
  const c = (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b));
  return Math.acos(Math.max(-1, Math.min(1, c))) / DEG;
}
/** the arc from a to b going anticlockwise, in degrees */
const arcCCW = (a, b) => norm(b - a);
/** is the circle point at x on the anticlockwise arc from a to b? */
const between = (a, b, x) => arcCCW(a, x) < arcCCW(a, b) && arcCCW(a, x) > 0;
/** the whole-number value of an angle that should be one (snapping makes it so) */
const whole = (x) => Math.round(x * 10) / 10;
const cm = (len) => Math.round(len * LENGTH_SCALE * 10) / 10;

/* the two points where the tangents from an outside point P touch the circle */
function tangentPoints(P) {
  const d = Math.hypot(...P);
  const base = Math.atan2(-P[1], P[0]) / DEG;           // P's direction, in circle degrees
  const spread = Math.acos(R / d) / DEG;
  return [base + spread, base - spread].map((deg) => on(deg));
}

/* how far a tangent line is drawn either side of its point of contact */
const TAN = 58;
const tangentAt = (deg) => { const t = on(deg); const dir = [-Math.sin(deg * DEG), -Math.cos(deg * DEG)]; return [add(t, mul(dir, TAN)), add(t, mul(dir, -TAN))]; };

const n = (x) => `<b>${whole(x)}°</b>`;

/* ═══ THE THEOREMS ════════════════════════════════════════════════════════
   Each: id, name (its chip), statement, start (where its points begin),
   move(pts, id, deg | xy) → pts (the theorem's own rules for moving a point),
   figure(pts), proof (steps: say(fig values) and the parts it lights),
   quiz(rng) → { pts, given, ask }. */

export const THEOREMS = [
  /* ── 1 ── the angle at the centre is twice the angle at the circumference ── */
  {
    id: "centre",
    name: "Angle at the centre",
    statement: "The angle at the centre is TWICE the angle at the circumference standing on the same arc.",
    start: { A: 214, B: 326, C: 92 },
    move: (p, id, deg) => {
      const q = { ...p, [id]: snap(deg) };
      if (new Set([q.A, q.B, q.C]).size < 3) return p;
      return q;
    },
    figure(p) {
      const A = on(p.A), B = on(p.B), C = on(p.C);
      /* the arc AB that does NOT hold C is the one both angles stand on */
      const arc = between(p.A, p.B, p.C) ? 360 - arcCCW(p.A, p.B) : arcCCW(p.A, p.B);
      const atO = arc, atC = arc / 2;
      const E = mul(C, -1);
      const x = angleAt(C, O, A), y = angleAt(C, O, B);
      return {
        segs: [{ a: O, b: A, cls: "radius", part: "radii" }, { a: O, b: B, cls: "radius", part: "radii" },
          { a: C, b: A, cls: "chord", part: "chords" }, { a: C, b: B, cls: "chord", part: "chords" },
          { a: C, b: E, cls: "aux", part: "diam" }],
        points: [{ id: "O", at: O, label: "O" }, { id: "A", at: A, label: "A", drag: "circle" }, { id: "B", at: B, label: "B", drag: "circle" },
          { id: "C", at: C, label: "C", drag: "circle" }, { id: "E", at: E, label: "E", part: "diam" }],
        angles: [{ v: O, p1: A, p2: B, value: atO, cls: "a2", part: "atO", reflex: atO > 180 },
          { v: C, p1: A, p2: B, value: atC, cls: "a1", part: "atC" },
          { v: C, p1: O, p2: A, value: x, cls: "a3", part: "x", label: "x" }, { v: C, p1: O, p2: B, value: y, cls: "a4", part: "y", label: "y" }],
        rights: [], lengths: [],
        fact: `∠AOB = ${n(atO)} &nbsp; ∠ACB = ${n(atC)} &nbsp; ${whole(atO)} = 2 × ${whole(atC)}`,
        values: { atO, atC, x, y },
        base: ["radii", "chords", "atO", "atC"],
      };
    },
    proof: [
      { say: () => "Draw the diameter from C through the centre O, to E. It cuts the angle at C into two parts, x and y.", lit: ["diam", "chords", "x", "y"] },
      { say: () => "OA, OB and OC are all radii, so they are all the same length. That makes triangles AOC and BOC isosceles.", lit: ["radii", "chords", "diam"] },
      { say: (v) => `In triangle AOC the two base angles are equal: both are x = ${whole(v.x)}°. The outside angle ∠AOE is x + x = 2x = ${whole(2 * v.x)}°.`, lit: ["radii", "chords", "diam", "x"] },
      { say: (v) => `In the same way, in triangle BOC both base angles are y = ${whole(v.y)}°, so ∠BOE is 2y = ${whole(2 * v.y)}°.`, lit: ["radii", "chords", "diam", "y"] },
      { say: (v) => `So ∠AOB = 2x + 2y = 2(x + y) = 2 × ∠ACB = 2 × ${whole(v.atC)}° = ${whole(v.atO)}°.`, lit: ["atO", "atC", "radii", "chords"] },
    ],
    quiz(r) {
      const A = 180 + 2 * r.int(10, 30), B = 360 - 2 * r.int(10, 30), C = 2 * r.int(25, 65);
      const pts = { A, B, C };
      const f = this.figure(pts);
      return r.int(0, 1)
        ? { pts, given: ["atO"], ask: { part: "atC", label: "∠ACB", value: f.values.atC, why: "The angle at the centre is twice the angle at the circumference: halve it." } }
        : { pts, given: ["atC"], ask: { part: "atO", label: "∠AOB", value: f.values.atO, why: "The angle at the centre is twice the angle at the circumference: double it." } };
    },
  },

  /* ── 2 ── the angle in a semicircle is a right angle ── */
  {
    id: "semicircle",
    name: "Angle in a semicircle",
    statement: "The angle in a SEMICIRCLE is a right angle: a triangle on a diameter has 90° at the circle.",
    start: { A: 192, C: 70 },
    move: (p, id, deg) => {
      const q = { ...p, [id]: snap(deg) };
      if (id === "C" && (q.C === q.A || q.C === norm(q.A + 180))) return p;
      if (id === "A" && (q.A === q.C || norm(q.A + 180) === q.C)) return p;
      return q;
    },
    figure(p) {
      const A = on(p.A), B = on(p.A + 180), C = on(p.C);
      const atC = angleAt(C, A, B), a = angleAt(A, B, C), b = angleAt(B, A, C);
      return {
        segs: [{ a: A, b: B, cls: "diameter", part: "diam" }, { a: C, b: A, cls: "chord", part: "chords" }, { a: C, b: B, cls: "chord", part: "chords" },
          { a: O, b: C, cls: "aux", part: "oc" }],
        points: [{ id: "O", at: O, label: "O" }, { id: "A", at: A, label: "A", drag: "circle" }, { id: "B", at: B, label: "B" }, { id: "C", at: C, label: "C", drag: "circle" }],
        angles: [{ v: A, p1: B, p2: C, value: a, cls: "a3", part: "x", label: "x" }, { v: B, p1: A, p2: C, value: b, cls: "a4", part: "y", label: "y" }],
        rights: [{ v: C, p1: A, p2: B, part: "atC" }],
        lengths: [],
        fact: `∠ACB = ${n(atC)} &nbsp; wherever C goes`,
        values: { atC, a, b },
        base: ["diam", "chords", "atC"],
      };
    },
    proof: [
      { say: () => "AB is a diameter, so the angle at the centre, ∠AOB, is a straight line: 180°.", lit: ["diam"] },
      { say: () => "∠ACB stands on the same arc, so it is half of that: 180 ÷ 2 = 90°.", lit: ["diam", "chords", "atC"] },
      { say: (v) => `Or with the triangle: OC is a radius too, so triangles AOC and BOC are isosceles. The base angles are x = ${whole(v.a)}° and y = ${whole(v.b)}°, and the angle at C is x + y.`, lit: ["chords", "oc", "x", "y"] },
      { say: (v) => `The three angles of triangle ABC add to 180°: x + y + (x + y) = 180°, so x + y = 90°. Here ${whole(v.a)} + ${whole(v.b)} = 90.`, lit: ["chords", "diam", "x", "y", "atC"] },
    ],
    quiz(r) {
      const A = 2 * r.int(85, 100), C = 2 * r.int(20, 70);
      const pts = { A, C };
      const f = this.figure(pts);
      return { pts, given: ["x"], ask: { part: "y", label: "y", value: f.values.b, why: "The angle in a semicircle is 90°, so x + y = 90°." } };
    },
  },

  /* ── 3 ── angles in the same segment are equal ── */
  {
    id: "segment",
    name: "Same segment",
    statement: "Angles in the SAME SEGMENT are equal: every angle standing on chord AB from the same side is the same.",
    start: { A: 206, B: 334, C: 62, D: 128 },
    move: (p, id, deg) => {
      const q = { ...p, [id]: snap(deg) };
      if (new Set([q.A, q.B, q.C, q.D]).size < 4) return p;
      return q;
    },
    figure(p) {
      const A = on(p.A), B = on(p.B), C = on(p.C), D = on(p.D);
      const atC = angleAt(C, A, B), atD = angleAt(D, A, B);
      const same = between(p.A, p.B, p.C) === between(p.A, p.B, p.D);
      const arc = between(p.A, p.B, p.C) ? 360 - arcCCW(p.A, p.B) : arcCCW(p.A, p.B);
      return {
        segs: [{ a: A, b: B, cls: "chord", part: "ab" }, { a: C, b: A, cls: "chord", part: "c" }, { a: C, b: B, cls: "chord", part: "c" },
          { a: D, b: A, cls: "chord", part: "d" }, { a: D, b: B, cls: "chord", part: "d" },
          { a: O, b: A, cls: "aux", part: "centre" }, { a: O, b: B, cls: "aux", part: "centre" }],
        points: [{ id: "O", at: O, label: "O", part: "centre" }, { id: "A", at: A, label: "A", drag: "circle" }, { id: "B", at: B, label: "B", drag: "circle" },
          { id: "C", at: C, label: "C", drag: "circle" }, { id: "D", at: D, label: "D", drag: "circle" }],
        angles: [{ v: C, p1: A, p2: B, value: atC, cls: "a1", part: "atC" }, { v: D, p1: A, p2: B, value: atD, cls: same ? "a1" : "a2", part: "atD" },
          { v: O, p1: A, p2: B, value: arc, cls: "a2", part: "centre", reflex: arc > 180 }],
        rights: [], lengths: [],
        fact: same ? `∠ACB = ${n(atC)} &nbsp; ∠ADB = ${n(atD)} &nbsp; equal`
          : `C and D are on OPPOSITE sides of AB: ∠ACB + ∠ADB = ${whole(atC)} + ${whole(atD)} = <b>180°</b>`,
        values: { atC, atD, arc, same },
        base: ["ab", "c", "d", "atC", "atD"],
      };
    },
    proof: [
      { say: () => "Both angles stand on the same chord AB, from the same side of it.", lit: ["ab", "c", "d", "atC", "atD"] },
      { say: (v) => `Join A and B to the centre. The angle at the centre on that arc is ${whole(v.arc)}°.`, lit: ["ab", "centre"] },
      { say: (v) => `Each angle at the circumference is half of it: ${whole(v.arc)} ÷ 2 = ${whole(v.arc / 2)}°. Both are half of the same angle, so they are equal.`, lit: ["centre", "c", "d", "atC", "atD"] },
      { say: () => "Drag D across the chord AB and see: on the other side the two angles are no longer equal — they add up to 180° instead.", lit: ["ab", "d", "atD"] },
    ],
    quiz(r) {
      const A = 2 * r.int(95, 110), B = 2 * r.int(160, 175), C = 2 * r.int(15, 40), D = 2 * r.int(50, 80);
      const pts = { A, B, C, D };
      const f = this.figure(pts);
      return { pts, given: ["atC"], ask: { part: "atD", label: "∠ADB", value: f.values.atD, why: "C and D are in the same segment, so the two angles are equal." } };
    },
  },

  /* ── 4 ── opposite angles of a cyclic quadrilateral add to 180° ── */
  {
    id: "cyclic",
    name: "Cyclic quadrilateral",
    statement: "In a CYCLIC QUADRILATERAL — all four corners on the circle — opposite angles add up to 180°.",
    start: { A: 112, B: 204, C: 296, D: 22 },
    move: (p, id, deg) => {
      /* a corner stays between its two neighbours, so the shape never crosses itself */
      const order = ["A", "B", "C", "D"], i = order.indexOf(id);
      const prev = p[order[(i + 3) % 4]], next = p[order[(i + 1) % 4]];
      const d = snap(deg);
      if (!between(prev, next, d)) return p;
      return { ...p, [id]: d };
    },
    figure(p) {
      const [A, B, C, D] = ["A", "B", "C", "D"].map((k) => on(p[k]));
      const a = angleAt(A, D, B), b = angleAt(B, A, C), c = angleAt(C, B, D), d = angleAt(D, C, A);
      return {
        segs: [{ a: A, b: B, cls: "chord", part: "quad" }, { a: B, b: C, cls: "chord", part: "quad" }, { a: C, b: D, cls: "chord", part: "quad" }, { a: D, b: A, cls: "chord", part: "quad" },
          { a: O, b: B, cls: "aux", part: "centre" }, { a: O, b: D, cls: "aux", part: "centre" }],
        points: [{ id: "O", at: O, label: "O", part: "centre" }, ...["A", "B", "C", "D"].map((k) => ({ id: k, at: on(p[k]), label: k, drag: "circle" }))],
        angles: [{ v: A, p1: D, p2: B, value: a, cls: "a1", part: "pA" }, { v: C, p1: B, p2: D, value: c, cls: "a1", part: "pC" },
          { v: B, p1: A, p2: C, value: b, cls: "a2", part: "pB" }, { v: D, p1: C, p2: A, value: d, cls: "a2", part: "pD" },
          { v: O, p1: B, p2: D, value: 2 * a, cls: "a3", part: "centre", reflex: 2 * a > 180, label: "2A" }],
        rights: [], lengths: [],
        fact: `∠A + ∠C = ${whole(a)} + ${whole(c)} = <b>180°</b> &nbsp; ∠B + ∠D = ${whole(b)} + ${whole(d)} = <b>180°</b>`,
        values: { a, b, c, d },
        base: ["quad", "pA", "pB", "pC", "pD"],
      };
    },
    proof: [
      { say: () => "Look at the opposite corners A and C. ∠A stands on one arc BD, and ∠C on the other arc BD.", lit: ["quad", "pA", "pC"] },
      { say: (v) => `Join B and D to the centre. The angle at the centre under ∠A is twice it: 2 × ${whole(v.a)} = ${whole(2 * v.a)}°.`, lit: ["quad", "centre", "pA"] },
      { say: (v) => `The angle at the centre under ∠C is the rest of the turn: 360 − ${whole(2 * v.a)} = ${whole(360 - 2 * v.a)}°, and ∠C is half of it, ${whole(v.c)}°.`, lit: ["quad", "centre", "pC"] },
      { say: () => "So 2∠A + 2∠C = 360°, and halving it, ∠A + ∠C = 180°. The same works for B and D.", lit: ["pA", "pC", "pB", "pD"] },
    ],
    quiz(r) {
      const A = 2 * r.int(45, 60), B = 2 * r.int(95, 110), C = 2 * r.int(140, 155), D = 2 * r.int(2, 15);
      const pts = { A, B, C, D };
      const f = this.figure(pts);
      return r.int(0, 1)
        ? { pts, given: ["pA"], ask: { part: "pC", label: "∠C", value: f.values.c, why: "Opposite angles of a cyclic quadrilateral add up to 180°." } }
        : { pts, given: ["pB"], ask: { part: "pD", label: "∠D", value: f.values.d, why: "Opposite angles of a cyclic quadrilateral add up to 180°." } };
    },
  },

  /* ── 5 ── a tangent meets the radius at 90° ── */
  {
    id: "tangent",
    name: "Tangent and radius",
    statement: "A TANGENT meets the radius at its point of contact at 90°.",
    start: { T: 58 },
    move: (p, id, deg) => ({ ...p, [id]: snap(deg) }),
    figure(p) {
      const T = on(p.T), [L1, L2] = tangentAt(p.T);
      const P = L1;                                        // a point along the tangent
      const atO = angleAt(O, T, P), atP = angleAt(P, O, T);
      return {
        segs: [{ a: L1, b: L2, cls: "tangent", part: "tangent" }, { a: O, b: T, cls: "radius", part: "radius" }, { a: O, b: P, cls: "aux", part: "op" }],
        points: [{ id: "O", at: O, label: "O" }, { id: "T", at: T, label: "T", drag: "circle" }, { id: "P", at: P, label: "P", part: "op" }],
        angles: [{ v: O, p1: T, p2: P, value: atO, cls: "a3", part: "tO" }, { v: P, p1: O, p2: T, value: atP, cls: "a4", part: "tP" }],
        rights: [{ v: T, p1: O, p2: P, part: "right" }],
        lengths: [{ a: O, b: T, value: cm(R), part: "radius" }, { a: O, b: P, value: cm(dist(O, P)), part: "op" }],
        fact: `∠OTP = <b>90°</b> &nbsp; wherever the tangent touches`,
        values: { atO, atP },
        base: ["tangent", "radius", "right"],
      };
    },
    proof: [
      { say: () => "The tangent touches the circle at T and nowhere else: every other point of it is OUTSIDE the circle.", lit: ["tangent"] },
      { say: () => `So OT, a radius, is the SHORTEST way from O to the tangent line. Any other way, like OP, is longer than a radius.`, lit: ["radius", "op"] },
      { say: () => "The shortest way from a point to a line always meets it at right angles. So the radius meets the tangent at 90°.", lit: ["radius", "tangent", "right"] },
      { say: (v) => `That makes OTP a right-angled triangle: ∠TOP + ∠OPT = 90°. Here ${whole(v.atO)} + ${whole(v.atP)} = 90.`, lit: ["op", "radius", "right", "tO", "tP"] },
    ],
    quiz(r) {
      const pts = { T: 2 * r.int(10, 170) };
      const f = this.figure(pts);
      return { pts, given: ["tO"], show: ["op"], ask: { part: "tP", label: "∠OPT", value: f.values.atP, why: "The tangent meets the radius at 90°, so the other two angles of triangle OTP add up to 90°." } };
    },
  },

  /* ── 6 ── two tangents from a point are equal ── */
  {
    id: "tangents",
    name: "Two tangents",
    statement: "The two TANGENTS from a point outside the circle are the SAME LENGTH.",
    start: { P: [64, -88] },
    move: (p, id, xy) => {
      const d = Math.hypot(...xy);
      if (d < R * 1.25 || d > 118) return { ...p, [id]: mul(xy, Math.max(R * 1.25, Math.min(118, d)) / d) };
      return { ...p, [id]: xy };
    },
    figure(p) {
      const P = p.P, [A, B] = tangentPoints(P);
      /* equal by the theorem; measured once, so a rounding can never make them differ on screen */
      const pa = cm(dist(P, A)), pb = pa;
      const atP = angleAt(P, A, B), atO = angleAt(O, A, B);
      return {
        segs: [{ a: P, b: A, cls: "tangent", part: "pa" }, { a: P, b: B, cls: "tangent", part: "pb" },
          { a: O, b: A, cls: "radius", part: "radii" }, { a: O, b: B, cls: "radius", part: "radii" }, { a: O, b: P, cls: "aux", part: "op" }],
        points: [{ id: "O", at: O, label: "O" }, { id: "P", at: P, label: "P", drag: "free" }, { id: "A", at: A, label: "A" }, { id: "B", at: B, label: "B" }],
        angles: [{ v: P, p1: A, p2: B, value: atP, cls: "a1", part: "atP" }, { v: O, p1: A, p2: B, value: atO, cls: "a2", part: "atO" }],
        rights: [{ v: A, p1: O, p2: P, part: "rights" }, { v: B, p1: O, p2: P, part: "rights" }],
        lengths: [{ a: P, b: A, value: pa, part: "pa", cls: "len1" }, { a: P, b: B, value: pb, part: "pb", cls: "len1" }],
        fact: `PA = <b>${pa} cm</b> &nbsp; PB = <b>${pb} cm</b> &nbsp; ∠APB + ∠AOB = ${whole(atP)} + ${whole(atO)} = 180°`,
        values: { pa, pb, atP, atO },
        base: ["pa", "pb", "radii", "rights"],
      };
    },
    proof: [
      { say: () => "Join the centre O to A, to B and to P.", lit: ["radii", "op"] },
      { say: () => "Each tangent meets its radius at 90°, so triangles OAP and OBP are both right-angled.", lit: ["radii", "rights", "pa", "pb"] },
      { say: () => "OA = OB, because both are radii. And OP is in both triangles.", lit: ["radii", "op"] },
      { say: (v) => `Right angle, hypotenuse, side: the two triangles are congruent (RHS). So PA = PB: both are ${v.pa} cm.`, lit: ["pa", "pb", "op", "radii", "rights"] },
      { say: (v) => `And the four angles of OAPB add to 360°, with two right angles: ∠APB + ∠AOB = 180°. Here ${whole(v.atP)} + ${whole(v.atO)} = 180.`, lit: ["atP", "atO", "rights"] },
    ],
    quiz(r) {
      const a = (r.int(0, 359)) * DEG, d = R * (1.35 + r.int(0, 30) / 100);
      const pts = { P: [d * Math.cos(a), -d * Math.sin(a)] };
      const f = this.figure(pts);
      return r.int(0, 1)
        ? { pts, given: ["pa"], ask: { part: "pb", label: "PB (cm)", value: f.values.pb, unit: "cm", why: "The two tangents from P are the same length." } }
        : { pts, given: ["atP"], ask: { part: "atO", label: "∠AOB", value: Math.round(f.values.atO), why: "The quadrilateral OAPB has two right angles, so ∠APB + ∠AOB = 180°.", tol: 1 } };
    },
  },

  /* ── 7 ── the perpendicular from the centre halves a chord ── */
  {
    id: "chord",
    name: "Chord and centre",
    statement: "The line from the CENTRE at right angles to a CHORD cuts it exactly in HALF.",
    start: { A: 198, B: 312 },
    move: (p, id, deg) => {
      const q = { ...p, [id]: snap(deg) };
      if (q.A === q.B || norm(q.A - q.B) === 180) return p;
      return q;
    },
    figure(p) {
      const A = on(p.A), B = on(p.B), M = mul(add(A, B), 0.5);
      const am = cm(dist(A, M)), mb = cm(dist(M, B)), om = cm(dist(O, M));
      return {
        segs: [{ a: A, b: B, cls: "chord", part: "chord" }, { a: O, b: M, cls: "radius", part: "om" },
          { a: O, b: A, cls: "aux", part: "radii" }, { a: O, b: B, cls: "aux", part: "radii" }],
        points: [{ id: "O", at: O, label: "O" }, { id: "A", at: A, label: "A", drag: "circle" }, { id: "B", at: B, label: "B", drag: "circle" }, { id: "M", at: M, label: "M" }],
        angles: [], rights: [{ v: M, p1: O, p2: B, part: "right" }],
        lengths: [{ a: A, b: M, value: am, part: "am", cls: "len1" }, { a: M, b: B, value: mb, part: "mb", cls: "len1" }, { a: O, b: M, value: om, part: "om", cls: "len2" },
          { a: A, b: B, value: cm(dist(A, B)), part: "ab", cls: "len2", side: -1 }],
        fact: `AM = <b>${am} cm</b> &nbsp; MB = <b>${mb} cm</b> &nbsp; the chord is cut in half`,
        values: { am, mb, om },
        base: ["chord", "om", "right", "am", "mb"],
      };
    },
    proof: [
      { say: () => "Join the centre to both ends of the chord. OA and OB are radii, so they are equal.", lit: ["radii", "chord"] },
      { say: () => "That makes triangle OAB isosceles, with O at its top.", lit: ["radii", "chord"] },
      { say: () => "The line from the top of an isosceles triangle at right angles to its base is its line of symmetry. It cuts the base in half.", lit: ["om", "right", "radii"] },
      { say: (v) => `So AM = MB = ${v.am} cm. And by Pythagoras, OM² + AM² = OA²: ${v.om}² + ${v.am}² ≈ 5².`, lit: ["am", "mb", "om", "right"] },
    ],
    quiz(r) {
      const A = 2 * r.int(95, 110), B = 2 * r.int(140, 170);
      const pts = { A, B };
      const f = this.figure(pts);
      /* AB is given to an even number of millimetres' worth, so that AM is exact */
      return { pts, given: ["ab"], ask: { part: "am", label: "AM (cm)", value: f.values.am, unit: "cm", tol: 0.1, why: "The line from the centre at right angles to the chord cuts it in half: AM is half of AB." } };
    },
  },

  /* ── 8 ── the alternate segment theorem ── */
  {
    id: "alternate",
    name: "Alternate segment",
    statement: "The angle between a TANGENT and a CHORD equals the angle in the ALTERNATE SEGMENT.",
    start: { T: 270, B: 34, C: 146 },
    move: (p, id, deg) => {
      const q = { ...p, [id]: snap(deg) };
      if (new Set([q.T, q.B, q.C]).size < 3) return p;
      return q;
    },
    figure(p) {
      const T = on(p.T), B = on(p.B), C = on(p.C), [L1, L2] = tangentAt(p.T);
      const atC = angleAt(C, T, B);
      /* of the two angles between the tangent and the chord TB, the one in the
         alternate segment is the one equal to ∠TCB; the other is its supplement */
      const t1 = angleAt(T, L1, B), t2 = angleAt(T, L2, B);
      const [L, tv] = Math.abs(t1 - atC) < Math.abs(t2 - atC) ? [L1, t1] : [L2, t2];
      const E = mul(T, -1);
      return {
        segs: [{ a: L1, b: L2, cls: "tangent", part: "tangent" }, { a: T, b: B, cls: "chord", part: "tb" },
          { a: C, b: T, cls: "chord", part: "c" }, { a: C, b: B, cls: "chord", part: "c" },
          { a: T, b: E, cls: "aux", part: "diam" }, { a: B, b: E, cls: "aux", part: "diam" }],
        points: [{ id: "O", at: O, label: "O", part: "diam" }, { id: "T", at: T, label: "T", drag: "circle" }, { id: "B", at: B, label: "B", drag: "circle" },
          { id: "C", at: C, label: "C", drag: "circle" }, { id: "E", at: E, label: "E", part: "diam" }],
        angles: [{ v: T, p1: L, p2: B, value: tv, cls: "a1", part: "atT" }, { v: C, p1: T, p2: B, value: atC, cls: "a1", part: "atC" },
          { v: E, p1: T, p2: B, value: angleAt(E, T, B), cls: "a2", part: "diam" }],
        rights: [{ v: B, p1: T, p2: E, part: "diam" }],
        lengths: [],
        fact: `tangent and chord: ${n(tv)} &nbsp; ∠TCB = ${n(atC)} &nbsp; equal`,
        values: { tv, atC, atE: angleAt(E, T, B) },
        base: ["tangent", "tb", "c", "atT", "atC"],
      };
    },
    proof: [
      { say: () => "Draw the diameter from T through O, to E, and join E to B.", lit: ["diam", "tb"] },
      { say: () => "∠TBE stands on a diameter, so it is 90° (the angle in a semicircle). And the tangent meets the diameter TE at 90°.", lit: ["diam", "tangent", "tb"] },
      { say: (v) => `In triangle TBE: ∠TEB = 90° − ∠BTE. At T: the tangent angle = 90° − ∠BTE too. So the tangent angle = ∠TEB = ${whole(v.atE)}°.`, lit: ["diam", "atT", "tb", "tangent"] },
      { say: (v) => `E and C are in the same segment on chord TB, so ∠TEB = ∠TCB = ${whole(v.atC)}°. The angle between the tangent and the chord equals the angle in the alternate segment.`, lit: ["atT", "atC", "c", "diam"] },
    ],
    quiz(r) {
      const T = 270, B = 2 * r.int(5, 40), C = 2 * r.int(55, 85);
      const pts = { T, B, C };
      const f = this.figure(pts);
      return r.int(0, 1)
        ? { pts, given: ["atT"], ask: { part: "atC", label: "∠TCB", value: f.values.atC, why: "The angle between the tangent and the chord equals the angle in the alternate segment." } }
        : { pts, given: ["atC"], ask: { part: "atT", label: "the tangent angle", value: f.values.tv, why: "The angle between the tangent and the chord equals the angle in the alternate segment." } };
    },
  },
];

export const theoremById = (id) => THEOREMS.find((t) => t.id === id) || THEOREMS[0];
