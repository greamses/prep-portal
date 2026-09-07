/* ============================================================================
   PYTHAGORAS — the figure  (prep-math/activity/pythagoras/figure.js)
   ----------------------------------------------------------------------------
   Pure geometry. No THREE, no DOM — it hands back plain [x, y] polygons so the
   scene file only has to turn them into meshes and move them.

   The proof drawn here is Perigal's dissection (Henry Perigal, 1830):

     • Squares are raised on all three sides of a right triangle.
     • The square on the LONGER leg is cut by two perpendicular lines through
       its centre, one of them parallel to the hypotenuse. That gives four
       congruent quadrilaterals.
     • Those four pieces sit in the four corners of the square on the
       hypotenuse and leave a square hole of side = the SHORTER leg, which the
       remaining (uncut) square drops straight into.

   Everything below is exact, so the pieces land on the hypotenuse square to the
   last decimal for any pair of legs.
   ========================================================================== */

/* rotate a point 90° CCW about the origin */
const rot90 = ([x, y]) => [-y, x];

/* rotate 90° CCW about the centre of the canonical c-square, (c/2, c/2) */
const rot90c = ([x, y], c) => [c - y, x];

const centroid = (poly) => [
  poly.reduce((s, v) => s + v[0], 0) / poly.length,
  poly.reduce((s, v) => s + v[1], 0) / poly.length,
];

/* ---------------------------------------------------------------------------
   buildFigure(a, b) — a is the vertical leg, b the horizontal leg.

   The construction only works with the longer leg horizontal, so when a > b we
   build the mirror figure (legs swapped) and reflect the whole thing back
   across y = x. Reflecting start AND end positions together keeps every piece's
   journey a plain turn-and-slide, which is all the scene needs to animate.
--------------------------------------------------------------------------- */
export function buildFigure(a, b) {
  const flip = a > b;
  const p = flip ? b : a;          // shorter leg — its square travels whole
  const q = flip ? a : b;          // longer leg  — its square is the one cut
  const c = Math.hypot(p, q);

  /* Triangle: right angle at the origin, short leg up, long leg right. */
  const C = [0, 0], B = [q, 0], A = [0, p];

  /* Hypotenuse square, raised away from the origin. u runs along the
     hypotenuse, n is the outward normal, and M carries a point given in the
     square's own coordinates (0…c on each axis) out into the figure. */
  const u = [q / c, -p / c];
  const n = [p / c,  q / c];
  const M = ([x, y]) => [A[0] + x * u[0] + y * n[0], A[1] + x * u[1] + y * n[1]];

  const cSquare = [A, B, M([c, c]), M([0, c])];

  /* Square on the long leg, hanging below the x-axis, and its centre. */
  const qSquare = [C, B, [q, -q], [0, -q]];
  const O = [q / 2, -q / 2];

  /* Square on the short leg, sitting to the left of the y-axis. */
  const pSquare = [C, A, [-p, p], [-p, 0]];

  /* --- the cut ----------------------------------------------------------
     Two lines through O: one parallel to the hypotenuse (direction u), one
     across it (direction n). They leave the square through the middle of four
     different sides, so each of the four pieces keeps one corner. One piece,
     written relative to O: */
  const V = [
    [0, 0],                 // the centre
    [ p / 2,  q / 2],       // meets the top edge   (along n, length c/2)
    [ q / 2,  q / 2],       // the square's own corner
    [ q / 2, -p / 2],       // meets the right edge (along u, length c/2)
  ];

  /* The other three are this one turned 90°, 180° and 270° about O — a quarter
     turn maps the square onto itself and swaps the two cut lines. */
  const pieceStart = [0, 1, 2, 3].map((i) => {
    let vs = V;
    for (let k = 0; k < i; k++) vs = vs.map(rot90);
    return vs.map(([x, y]) => [O[0] + x, O[1] + y]);
  });

  /* --- where the pieces land -------------------------------------------
     R stands a piece up in the corner of the hypotenuse square: it sends the
     two cut edges (both length c/2) onto the two half-sides meeting at that
     corner. In the square's own coordinates the corner piece is R(V); the
     other three are quarter turns of it about the square's centre. */
  const R = ([x, y]) => [(q * x - p * y) / c, (p * x + q * y) / c];

  const pieceEndFor = (corner) => {
    let vs = V.map(R);
    for (let k = 0; k < corner; k++) vs = vs.map((v) => rot90c(v, c));
    return vs.map(M);
  };

  /* Piece i goes to corner i, and that pairing is the whole charm of Perigal:
     M turns by -φ, R turns by +φ and the corners step round by 90°, so piece i
     ends up turned by exactly 90·(i - i) = 0. Every piece — and the uncut
     square below — only ever SLIDES. Sending piece i to corner i+1 instead
     would still tile the square, but each piece would have to spin a quarter
     turn on the way, and a proof you can follow beats one you can't. */
  const pieces = pieceStart.map((start, i) => ({ start, end: pieceEndFor(i) }));

  /* --- the hole the four pieces leave ------------------------------------
     Their inner corners are R(V[2]) turned about the centre; those four points
     make a square of side p exactly, which is what the uncut square fills. */
  const hole = [0, 1, 2, 3].map((i) => {
    let v = R(V[2]);
    for (let k = 0; k < i; k++) v = rot90c(v, c);
    return M(v);
  });

  /* Match the small square's corners to the hole's, again choosing the shift
     that turns it the least. Both lists run the same way round. */
  const edgeAngle = (poly, i) => Math.atan2(
    poly[(i + 1) % 4][1] - poly[i][1],
    poly[(i + 1) % 4][0] - poly[i][0],
  );
  let bestShift = 0, bestTurn = Infinity;
  for (let s = 0; s < 4; s++) {
    const d = wrap(edgeAngle(hole, 0) - edgeAngle(pSquare, s));
    if (Math.abs(d) < bestTurn) { bestTurn = Math.abs(d); bestShift = s; }
  }
  const whole = {
    start: [0, 1, 2, 3].map((i) => pSquare[(i + bestShift) % 4]),
    end: hole,
  };

  /* The two cut lines, already clipped to the square they cut. */
  const cuts = [
    [[O[0] + V[1][0], O[1] + V[1][1]], [O[0] - V[1][0], O[1] - V[1][1]]],
    [[O[0] + V[3][0], O[1] + V[3][1]], [O[0] - V[3][0], O[1] - V[3][1]]],
  ];

  const out = {
    a: flip ? q : p,
    b: flip ? p : q,
    c,
    /* [right-angle vertex, end of the horizontal leg, end of the vertical leg] */
    triangle: [C, B, A],
    /* Each square carries the edge it grows out of, oriented so the square
       lies to the LEFT of base[0] → base[1]. `cut` marks the one that breaks. */
    squares: {
      short: { verts: pSquare, side: p, base: [C, A], cut: false },
      long:  { verts: qSquare, side: q, base: [B, C], cut: true  },
      hyp:   { verts: cSquare, side: c, base: [A, B], cut: false },
    },
    /* which drawn leg — 'a' (vertical) or 'b' (horizontal) — is which */
    shortLeg: flip ? 'b' : 'a',
    longLeg:  flip ? 'a' : 'b',
    cuts,
    pieces,
    whole,
    hole,
  };

  return flip ? mirror(out) : out;
}

/* Reflect the whole figure across y = x (used when the short leg is the
   horizontal one). Base edges are reversed so "the square is on the left of
   its base edge" still holds once the handedness flips. */
function mirror(f) {
  const m = ([x, y]) => [y, x];
  const mp = (poly) => poly.map(m);
  const msq = (s) => ({ ...s, verts: mp(s.verts), base: [m(s.base[1]), m(s.base[0])] });
  return {
    ...f,
    /* the reflection swaps which leg is horizontal, so the last two vertices
       trade places to keep the [right angle, horizontal, vertical] order */
    triangle: [m(f.triangle[0]), m(f.triangle[2]), m(f.triangle[1])],
    squares: {
      short: msq(f.squares.short),
      long:  msq(f.squares.long),
      hyp:   msq(f.squares.hyp),
    },
    cuts: f.cuts.map(mp),
    pieces: f.pieces.map((p) => ({ start: mp(p.start), end: mp(p.end) })),
    whole: { start: mp(f.whole.start), end: mp(f.whole.end) },
    hole: mp(f.hole),
  };
}

const wrap = (t) => Math.atan2(Math.sin(t), Math.cos(t));

/* ---------------------------------------------------------------------------
   rigidMotion(start, end) — start and end are the same polygon in two places,
   so the trip between them is a turn about its centre plus a slide. Handing
   the scene an angle and two centres means a piece can stay one mesh whose
   geometry is never rebuilt.
--------------------------------------------------------------------------- */
export function rigidMotion(start, end) {
  const from = centroid(start), to = centroid(end);
  const theta = wrap(
    Math.atan2(end[1][1] - end[0][1], end[1][0] - end[0][0])
    - Math.atan2(start[1][1] - start[0][1], start[1][0] - start[0][0]),
  );
  return {
    from, to, theta,
    local: start.map(([x, y]) => [x - from[0], y - from[1]]),
  };
}

/* Axis-aligned box round a list of polygons — the scene uses it to frame the
   camera on the finished figure so nothing jumps as the slider runs. */
export function boundsOf(polys) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const poly of polys) {
    for (const [x, y] of poly) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
           w: maxX - minX, h: maxY - minY };
}
