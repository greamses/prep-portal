/* ============================================================================
   Geometry Workbook — CHAPTER 8: constructions
   ----------------------------------------------------------------------------
   Drawing exactly, with a ruler, a pencil, compasses and a protractor — and
   then MEASURING what was drawn. The measurement is the answer that is marked,
   and it is a real check: a triangle built from three sides has only one set
   of angles, so an angle that comes out wrong is a triangle that was built
   wrong. A construction nobody measures is a picture.

     using the compass       a circle from its radius · copying a length
     constructing triangles  three sides · two sides and the angle between ·
                             two angles and the side between
     bisecting               a line · an angle · a perpendicular from a point
     special angles          60° and 30° with compasses alone · 90° and 45°

   Every figure is drawn at TRUE SIZE by construct.js. The lengths are whole
   centimetres at Gentle, half centimetres at Middle and millimetres at
   Stretch; the angles follow the level's step like the rest of the book.

   Measuring by hand is never exact, so the marks allow for a pencil's width:
   2 mm on a length, 3° on an angle.
   ========================================================================== */

import { space, at, crossing, dist, dirTo, cm } from "./construct.js";
import { levelOf, stepped } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

/** A short arc about c, radius r, centred on the direction of `through`. */
const arcThrough = (c, r, through, spread = 15) => {
  const d = dirTo(c, through);
  return { arc: [c, r, d - spread, d + spread] };
};

const box = () => `<span class="wb-answer"></span>`;
const slot = (label, unit = "") => `<span class="wb-slot"><em>${label}</em>${box()}${unit}</span>`;
const art = (svg) => `<div class="gw-art co-art">${svg}</div>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
/* The done-for-you figure and its steps side by side: stacked, a worked
   construction and the first question under it were taller than what is left
   of page one under the title, and the engine rightly will not strand a
   heading — so the whole section went to page two and page one stood empty. */
const worked = (tag, body) =>
  `<div class="wb-worked"><p class="wb-worked__tag">${tag}</p><div class="co-worked">${body}</div></div>`;
const steps = (list) =>
  `<div class="co-worked__steps">${list.map((s, i) => `<p class="wb-ask wb-worked__say">${i + 1}. ${s}</p>`).join("")}</div>`;

const LEN_TOL = 0.2;       // cm
const ANG_TOL = 3;         // degrees

const tier = (o) => levelOf(o).id;

/** A length in mm, as a whole cm, half cm or mm depending on the level. */
function lengthMm(r, o, loCm, hiCm) {
  const t = tier(o);
  if (t === "gentle") return r.int(loCm, hiCm) * 10;
  if (t === "middle") return r.int(loCm * 2, hiCm * 2) * 5;
  return r.int(loCm * 10, hiCm * 10);
}

const oneDp = (v) => Math.round(v * 10) / 10;
const angleAt = (a, b, c) => Math.round((Math.acos((b * b + c * c - a * a) / (2 * b * c)) * 180) / Math.PI);

/* ── the groups ────────────────────────────────────────────────────────────*/

export const CO_GROUPS = [
  { id: "cn-compass", chapter: "Chapter 9 · Constructions", label: "Using the compass" },
  { id: "cn-triangles", label: "Constructing triangles" },
  { id: "cn-bisect", label: "Bisecting lines and angles" },
  { id: "cn-angles", label: "Special angles" },
];

/* Said in full once, at the head of the chapter; after that, only the part that
   is easy to forget. Every line of instruction is paper a question could have
   stood on. */
const TOOLS_FIRST =
  "You need a sharp pencil, a ruler, compasses and a protractor. Keep the compass " +
  "arcs light and leave them showing — they are how the construction is checked.";
const TOOLS_NOTE = "Leave the compass arcs showing.";

/* ═══ using the compass ════════════════════════════════════════════════════*/

const coCircle = {
  id: "cn-circle",
  group: "cn-compass",
  label: "A circle from its radius",
  blurb: "Open the compass to the radius, put the needle on the centre, and turn.",
  heading: "Draw the circle, then measure across it",
  instruction: () =>
    `${TOOLS_FIRST} Open your compasses against a ruler until the pencil is the radius away from ` +
    "the needle. Put the needle on O and turn the top all the way round. Then rule a line through O " +
    "from one side of the circle to the other — that is the diameter — and measure it.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { rad: lengthMm(r, o, 2, 4) };
  },
  render(item) {
    const h = item.rad * 2 + 16;
    const O = [75, h / 2];
    return (
      ask(`Draw a circle with centre O and radius <b>${cm(item.rad)}</b>.`) +
      art(space({ w: 150, h, parts: [{ dot: [O, "O", "below"] }], snap: [O] })) +
      ask(slot("The diameter is", " cm"))
    );
  },
  worked() {
    const O = [40, 34];
    return worked("One done for you",
      art(space({
        w: 90, h: 68,
        parts: [
          { arc: [O, 30, 0, 360, { col: "#6b655c", w: 0.4 }] },
          { seg: [at(O, 30, 180), at(O, 30, 0), { w: 0.4 }] },
          { dot: [O, "O", "below"] },
        ],
      })) +
      steps([
        "Put the compass needle on the 0 of the ruler and open the pencil to 3 cm.",
        "Put the needle on O and turn the top all the way round without squeezing.",
        "Rule a line through O from edge to edge, and measure it: <b>6 cm</b> — twice the radius.",
      ]));
  },
  key(item) {
    return [want.num(oneDp((item.rad * 2) / 10), LEN_TOL)];
  },
  answer(item) {
    return [`diameter ${cm(item.rad * 2)}`];
  },
};

const coCopy = {
  id: "cn-copy",
  group: "cn-compass",
  label: "Copy a length",
  blurb: "The compass carries a length from one place to another without a number.",
  heading: "Copy the length of AB onto the line",
  instruction: () =>
    `${TOOLS_NOTE} Put the needle on A and open the compass until the pencil is on B. Without ` +
    "changing it, put the needle on P and draw an arc that crosses the line. Label the crossing Q, " +
    "then measure PQ.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { len: lengthMm(r, o, 3, 9) };
  },
  render(item) {
    const A = [12, 12];
    const B = [12 + item.len, 12];
    const P = [14, 44];
    return (
      art(space({
        w: 150, h: 56,
        parts: [
          { seg: [A, B] },
          { seg: [[8, 44], [144, 44]] },
          { dot: [A, "A", "below"] }, { dot: [B, "B", "below"] }, { dot: [P, "P", "below"] },
        ],
        snap: [A, B, P],
      })) +
      ask(slot("PQ is", " cm"))
    );
  },
  worked() {
    const A = [8, 10];
    const B = [48, 10];
    const P = [10, 36];
    const Q = [50, 36];
    return worked("One done for you",
      art(space({
        w: 90, h: 46,
        parts: [
          { seg: [A, B] }, { seg: [[6, 36], [86, 36]] },
          { arc: [P, 40, -12, 12] },
          { dot: [A, "A", "below"] }, { dot: [B, "B", "below"] },
          { dot: [P, "P", "below"] }, { dot: [Q, "Q", "below"] },
        ],
      })) +
      steps([
        "Needle on A, pencil on B: the compass now holds the length AB.",
        "Needle on P, and an arc across the line. Where it crosses is Q.",
        "PQ is the same length as AB — here both are <b>4 cm</b>.",
      ]));
  },
  key(item) {
    return [want.num(oneDp(item.len / 10), LEN_TOL)];
  },
  answer(item) {
    return [`PQ = ${cm(item.len)}`];
  },
};

/* ═══ constructing triangles ═══════════════════════════════════════════════*/

/** A base AB of `c` mm, laid out so a triangle over it fits the space. */
const baseAt = (c, left = 20, y = 70) => [[left, y], [left + c, y]];

/* three sides, all between 4 and 9 cm, making angles a child can measure */
function sssSides(r, o) {
  for (let g = 0; g < 400; g++) {
    const a = lengthMm(r, o, 4, 9);
    const b = lengthMm(r, o, 4, 9);
    const c = lengthMm(r, o, 5, 9);
    if (a + b <= c + 10 || a + c <= b + 10 || b + c <= a + 10) continue;
    const angs = [angleAt(a, b, c), angleAt(b, a, c), angleAt(c, a, b)];
    if (Math.min(...angs) < 30 || Math.max(...angs) > 115) continue;
    const A = [20, 70];
    const B = [20 + c, 70];
    const C = crossing(A, b, B, a, true);
    if (!C || C[1] < 8 || C[0] < 6 || C[0] > 144) continue;
    return { a, b, c };
  }
  return { a: 50, b: 60, c: 70 };
}

const coSSS = {
  id: "cn-sss",
  group: "cn-triangles",
  label: "Three sides",
  blurb: "Two arcs from the ends of the base cross at the third corner.",
  heading: "Construct the triangle from its three sides",
  instruction: () =>
    `${TOOLS_NOTE} Rule the base AB. Open the compass to the length of AC, put the needle on A and ` +
    "draw an arc above the base. Open it to BC, put the needle on B and draw an arc that crosses the " +
    "first. Where they cross is C. Join AC and BC, then measure the angle at C.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return sssSides(r, o);
  },
  render(item) {
    const [A] = baseAt(item.c);
    return (
      ask(`AB = <b>${cm(item.c)}</b> &nbsp; BC = <b>${cm(item.a)}</b> &nbsp; AC = <b>${cm(item.b)}</b>`) +
      art(space({ w: 150, h: 78, parts: [{ dot: [A, "A", "below"] }], snap: [A] })) +
      ask(slot("∠ACB measures", "°"))
    );
  },
  worked() {
    const [A, B] = baseAt(60, 12, 52);
    const C = crossing(A, 50, B, 40, true);
    return worked("One done for you",
      art(space({
        w: 90, h: 58,
        parts: [
          { seg: [A, B] }, { seg: [A, C, { w: 0.4 }] }, { seg: [B, C, { w: 0.4 }] },
          arcThrough(A, 50, C), arcThrough(B, 40, C),
          { dot: [A, "A", "below"] }, { dot: [B, "B", "below"] }, { dot: [C, "C", "above"] },
        ],
      })) +
      steps([
        "AB = 6 cm, BC = 4 cm, AC = 5 cm. Rule AB.",
        "Compass open to 5 cm, needle on A: an arc above the base.",
        "Compass open to 4 cm, needle on B: an arc that crosses it. That is C.",
        "Join AC and BC. The angle at C measures <b>83°</b>.",
      ]));
  },
  key(item) {
    return [want.num(angleAt(item.c, item.a, item.b), ANG_TOL)];
  },
  answer(item) {
    return [`∠ACB ≈ ${angleAt(item.c, item.a, item.b)}°`];
  },
};

const coSAS = {
  id: "cn-sas",
  group: "cn-triangles",
  label: "Two sides and the angle between",
  blurb: "Measure the angle with the protractor, then mark the second side along it.",
  heading: "Construct the triangle from two sides and the angle between them",
  instruction: () =>
    `${TOOLS_NOTE} Rule the base AB. Put the protractor on A and mark the angle, then rule a line ` +
    "from A through the mark. Open the compass to the length of AC, put the needle on A and mark C " +
    "on that line. Join BC and measure it.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    for (let g = 0; g < 400; g++) {
      const c = lengthMm(r, o, 5, 9);
      const b = lengthMm(r, o, 4, 8);
      const A = stepped(r, o, 30, 110);
      const C = at([40, 70], b, A);
      if (C[1] < 8 || C[0] < 6 || C[0] > 144) continue;
      const bc = dist(C, [40 + c, 70]);
      if (bc < 30) continue;
      return { b, c, A };
    }
    return { b: 50, c: 70, A: 60 };
  },
  render(item) {
    const A = [40, 70];
    return (
      ask(`AB = <b>${cm(item.c)}</b> &nbsp; AC = <b>${cm(item.b)}</b> &nbsp; ∠BAC = <b>${item.A}°</b>`) +
      art(space({ w: 150, h: 78, parts: [{ dot: [A, "A", "below"] }], snap: [A] })) +
      ask(slot("BC measures", " cm"))
    );
  },
  worked() {
    const A = [12, 52];
    const B = [72, 52];
    const C = at(A, 45, 50);
    return worked("One done for you",
      art(space({
        w: 90, h: 58,
        parts: [
          { seg: [A, B] }, { seg: [A, at(A, 58, 50), { w: 0.3, col: "#8a837a" }] },
          { seg: [B, C, { w: 0.4 }] }, { mark: [A, 0, 50, "50°"] },
          { arc: [A, 45, 42, 58] },
          { dot: [A, "A", "below"] }, { dot: [B, "B", "below"] }, { dot: [C, "C", "left"] },
        ],
      })) +
      steps([
        "AB = 6 cm, AC = 4.5 cm, ∠BAC = 50°. Rule AB.",
        "Protractor on A, baseline along AB: mark 50° and rule a line from A through it.",
        "Compass open to 4.5 cm, needle on A: mark C on that line.",
        `Join BC and measure it: <b>${cm(dist(B, C))}</b>.`,
      ]));
  },
  key(item) {
    const bc = dist(at([40, 70], item.b, item.A), [40 + item.c, 70]);
    return [want.num(oneDp(bc / 10), LEN_TOL)];
  },
  answer(item) {
    return [`BC ≈ ${cm(dist(at([40, 70], item.b, item.A), [40 + item.c, 70]))}`];
  },
};

const coASA = {
  id: "cn-asa",
  group: "cn-triangles",
  label: "Two angles and the side between",
  blurb: "An angle at each end of the base; the two lines meet at the third corner.",
  heading: "Construct the triangle from two angles and the side between them",
  instruction: () =>
    `${TOOLS_NOTE} Rule the base AB. Mark the angle at A with the protractor and rule a long line ` +
    "from A through it. Do the same at B. Where the two lines cross is C. Measure AC.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    for (let g = 0; g < 400; g++) {
      const c = lengthMm(r, o, 5, 9);
      const A = stepped(r, o, 30, 75);
      const B = stepped(r, o, 30, 75);
      if (A + B > 140) continue;
      const ac = (c * Math.sin((B * Math.PI) / 180)) / Math.sin(((A + B) * Math.PI) / 180);
      const C = at([20, 70], ac, A);
      if (C[1] < 8 || C[0] > 144) continue;
      return { c, A, B };
    }
    return { c: 70, A: 50, B: 60 };
  },
  render(item) {
    const A = [20, 70];
    return (
      ask(`AB = <b>${cm(item.c)}</b> &nbsp; ∠CAB = <b>${item.A}°</b> &nbsp; ∠CBA = <b>${item.B}°</b>`) +
      art(space({ w: 150, h: 78, parts: [{ dot: [A, "A", "below"] }], snap: [A] })) +
      ask(slot("AC measures", " cm"))
    );
  },
  worked() {
    const A = [12, 52];
    const B = [72, 52];
    const acLen = (60 * Math.sin((60 * Math.PI) / 180)) / Math.sin((100 * Math.PI) / 180);
    const C = at(A, acLen, 40);
    return worked("One done for you",
      art(space({
        w: 90, h: 58,
        parts: [
          { seg: [A, B] }, { seg: [A, C, { w: 0.4 }] }, { seg: [B, C, { w: 0.4 }] },
          { mark: [A, 0, 40, "40°"] }, { mark: [B, 120, 180, "60°"] },
          { dot: [A, "A", "below"] }, { dot: [B, "B", "below"] }, { dot: [C, "C", "above"] },
        ],
      })) +
      steps([
        "AB = 6 cm, ∠CAB = 40°, ∠CBA = 60°. Rule AB.",
        "Protractor on A: 40°, and a long line from A.",
        "Protractor on B: 60°, and a long line from B. They cross at C.",
        `Measure AC: <b>${cm(acLen)}</b>.`,
      ]));
  },
  key(item) {
    const ac = (item.c * Math.sin((item.B * Math.PI) / 180)) / Math.sin(((item.A + item.B) * Math.PI) / 180);
    return [want.num(oneDp(ac / 10), LEN_TOL)];
  },
  answer(item) {
    const ac = (item.c * Math.sin((item.B * Math.PI) / 180)) / Math.sin(((item.A + item.B) * Math.PI) / 180);
    return [`AC ≈ ${cm(ac)}`];
  },
};

/* ═══ bisecting ════════════════════════════════════════════════════════════*/

const coPerpBisector = {
  id: "cn-perp-bisector",
  group: "cn-bisect",
  label: "Bisect a line",
  blurb: "Two pairs of arcs, and the line through their crossings cuts it exactly in half.",
  heading: "Construct the perpendicular bisector of AB",
  instruction: () =>
    `${TOOLS_NOTE} Open the compass to MORE than half of AB. With the needle on A, draw an arc above ` +
    "the line and one below it. Without changing the compass, do the same from B. Rule a line through " +
    "the two places the arcs cross. It meets AB at M, the middle. Measure AM.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { len: lengthMm(r, o, 5, 11) };
  },
  render(item) {
    const x0 = (150 - item.len) / 2;
    const A = [x0, 40];
    const B = [x0 + item.len, 40];
    return (
      art(space({
        w: 150, h: 80,
        parts: [{ seg: [A, B] }, { dot: [A, "A", "left"] }, { dot: [B, "B", "right"] }],
        snap: [A, B],
      })) +
      ask(slot("AM measures", " cm"))
    );
  },
  worked() {
    const A = [15, 34];
    const B = [75, 34];
    const R = 40;
    const up = crossing(A, R, B, R, true);
    const down = crossing(A, R, B, R, false);
    return worked("One done for you",
      art(space({
        w: 90, h: 68,
        parts: [
          { seg: [A, B] },
          arcThrough(A, R, up), arcThrough(A, R, down),
          arcThrough(B, R, up), arcThrough(B, R, down),
          { seg: [up, down, { w: 0.4 }] },
          { dot: [A, "A", "left"] }, { dot: [B, "B", "right"] }, { dot: [[45, 34], "M", "right"] },
        ],
      })) +
      steps([
        "AB is 6 cm. Open the compass to 4 cm — more than half of it.",
        "Needle on A: an arc above and an arc below. Needle on B: the same.",
        "Rule through the two crossings. It meets AB at M, at a right angle.",
        "AM measures <b>3 cm</b> — exactly half of AB.",
      ]));
  },
  key(item) {
    return [want.num(oneDp(item.len / 20), LEN_TOL)];
  },
  answer(item) {
    return [`AM = ${cm(item.len / 2)}`];
  },
};

const coAngleBisector = {
  id: "cn-angle-bisector",
  group: "cn-bisect",
  label: "Bisect an angle",
  blurb: "An arc across both arms, two more from where it crosses, and the angle is halved.",
  heading: "Construct the bisector of the angle at V",
  instruction: () =>
    `${TOOLS_NOTE} Put the needle on V and draw an arc that crosses both arms; call the crossings P ` +
    "and Q. Put the needle on P and draw an arc inside the angle; do the same from Q without changing " +
    "the compass. Rule a line from V through where those two arcs cross. Measure one of the two halves.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { th: stepped(r, o, 40, 140) };
  },
  render(item) {
    const V = item.th > 90 ? [75, 72] : [22, 72];
    const P = at(V, 60, 0);
    const Q = at(V, 60, item.th);
    return (
      art(space({
        w: 150, h: 82,
        parts: [{ seg: [V, P] }, { seg: [V, Q] }, { dot: [V, "V", "below"] }],
        snap: [V],
      })) +
      ask(slot("Each half measures", "°"))
    );
  },
  worked() {
    const V = [12, 60];
    const arm1 = at(V, 70, 0);
    const arm2 = at(V, 70, 70);
    const P = at(V, 30, 0);
    const Q = at(V, 30, 70);
    /* of the two places the arcs from P and Q cross, the one away from V */
    const c1 = crossing(P, 26, Q, 26, true);
    const c2 = crossing(P, 26, Q, 26, false);
    const R = dist(V, c1) > dist(V, c2) ? c1 : c2;
    return worked("One done for you",
      art(space({
        w: 90, h: 68,
        parts: [
          { seg: [V, arm1] }, { seg: [V, arm2] },
          { arc: [V, 30, -8, 78] },
          arcThrough(P, 26, R), arcThrough(Q, 26, R),
          { seg: [V, at(V, 66, 35), { w: 0.4 }] },
          { mark: [V, 0, 35, "35°"] },
          { dot: [V, "V", "below"] }, { dot: [P, "P", "below"] }, { dot: [Q, "Q", "left"] },
          { dot: [R, "", "below"] },
        ],
      })) +
      steps([
        "The angle at V is 70°. Needle on V: one arc across both arms, at P and Q.",
        "Needle on P: an arc inside the angle. Needle on Q, same opening: another. They cross.",
        "Rule from V through the crossing. Each half measures <b>35°</b>.",
      ]));
  },
  key(item) {
    return [want.num(item.th / 2, ANG_TOL)];
  },
  answer(item) {
    return [`${item.th / 2}°`];
  },
};

const coPerpFromPoint = {
  id: "cn-perp-point",
  group: "cn-bisect",
  label: "A perpendicular from a point",
  blurb: "The shortest way from a point to a line meets it at a right angle.",
  heading: "Construct the perpendicular from P to the line",
  instruction: () =>
    `${TOOLS_NOTE} Put the needle on P and draw an arc that crosses the line twice, at X and Y. With ` +
    "the needle on X and then on Y, and the same opening, draw two arcs on the OTHER side of the line " +
    "that cross. Rule from P through that crossing. Measure how far P is from the line, along it.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    return { d: lengthMm(r, o, 2, 5), x: r.int(55, 95) };
  },
  render(item) {
    const y = 64;
    const P = [item.x, y - item.d];
    return (
      art(space({
        w: 150, h: 92,
        parts: [{ seg: [[8, y], [142, y]] }, { dot: [P, "P", "above"] }],
        snap: [P],
      })) +
      ask(slot("P is this far from the line:", " cm"))
    );
  },
  worked() {
    const y = 34;
    const P = [45, 12];
    const R = 34;
    const X = [45 - Math.sqrt(R * R - 22 * 22), y];
    const Y = [45 + Math.sqrt(R * R - 22 * 22), y];
    return worked("One done for you",
      art(space({
        w: 90, h: 68,
        parts: [
          { seg: [[4, y], [86, y]] },
          { arc: [P, R, 215, 325] },
          arcThrough(X, R, crossing(X, R, Y, R, false)),
          arcThrough(Y, R, crossing(X, R, Y, R, false)),
          { seg: [P, [45, 64], { w: 0.4 }] },
          { dot: [P, "P", "above"] }, { dot: [X, "X", "below"] }, { dot: [Y, "Y", "below"] },
        ],
      })) +
      steps([
        "Needle on P: an arc crossing the line at X and Y.",
        "Needle on X, then on Y, same opening: two arcs below the line that cross.",
        "Rule from P through the crossing. Along it, P is <b>2.2 cm</b> from the line.",
      ]));
  },
  key(item) {
    return [want.num(oneDp(item.d / 10), LEN_TOL)];
  },
  answer(item) {
    return [cm(item.d)];
  },
};

/* ═══ special angles ═══════════════════════════════════════════════════════*/

const co60 = {
  id: "cn-60",
  group: "cn-angles",
  label: "60° and 30° with compasses",
  blurb: "An equilateral triangle hides inside two arcs; halve it for 30°.",
  heading: "Construct 60° at A, then bisect it",
  instruction: () =>
    `${TOOLS_NOTE} With the needle on A, draw a big arc that crosses the line at X. Keep the same ` +
    "opening: put the needle on X and draw an arc that crosses the first one at Y. The angle YAX is " +
    "60°, because A, X and Y make an equilateral triangle. Now bisect it, and measure the smaller angle.",
  cols: 1,
  defaultCount: 1,
  make() {
    return {};
  },
  render() {
    const A = [22, 74];
    return (
      art(space({
        w: 150, h: 78,
        parts: [{ seg: [A, [140, 74]] }, { dot: [A, "A", "below"] }],
        snap: [A],
      })) +
      ask(slot("The bisected angle measures", "°"))
    );
  },
  worked() {
    const A = [10, 60];
    const R = 45;
    const X = at(A, R, 0);
    const Y = at(A, R, 60);
    return worked("One done for you",
      art(space({
        w: 90, h: 68,
        parts: [
          { seg: [A, [86, 60]] },
          { arc: [A, R, -6, 70] }, arcThrough(X, R, Y),
          { seg: [A, at(A, 58, 60), { w: 0.4 }] },
          { seg: [A, at(A, 70, 30), { w: 0.3, col: "#8a837a" }] },
          { mark: [A, 0, 30, "30°"] },
          { dot: [A, "A", "below"] }, { dot: [X, "X", "below"] }, { dot: [Y, "Y", "left"] },
        ],
      })) +
      steps([
        "Needle on A: a big arc crossing the line at X.",
        "Same opening, needle on X: an arc crossing the first at Y. Rule AY — that is 60°.",
        "Bisect the angle YAX. The smaller angle is <b>30°</b>.",
      ]));
  },
  key() {
    return [want.num(30, ANG_TOL)];
  },
  answer() {
    return ["30°"];
  },
};

const co90 = {
  id: "cn-90",
  group: "cn-angles",
  label: "90° and 45° with compasses",
  blurb: "A perpendicular at a point on the line, then halve the right angle.",
  heading: "Construct 90° at P, then bisect it",
  instruction: () =>
    `${TOOLS_NOTE} With the needle on P, draw an arc crossing the line on both sides, at X and Y. ` +
    "Open the compass wider. From X and from Y, draw arcs above the line that cross. Rule from P " +
    "through the crossing — that is 90°. Bisect one of the right angles and measure the half.",
  cols: 1,
  defaultCount: 1,
  make() {
    return {};
  },
  render() {
    const P = [75, 70];
    return (
      art(space({
        w: 150, h: 82,
        parts: [{ seg: [[10, 70], [140, 70]] }, { dot: [P, "P", "below"] }],
        snap: [P],
      })) +
      ask(slot("The bisected angle measures", "°"))
    );
  },
  worked() {
    const P = [45, 58];
    const X = [25, 58];
    const Y = [65, 58];
    const top = crossing(X, 32, Y, 32, true);
    return worked("One done for you",
      art(space({
        w: 90, h: 68,
        parts: [
          { seg: [[4, 58], [86, 58]] },
          { arc: [P, 20, 160, 200] }, { arc: [P, 20, -20, 20] },
          arcThrough(X, 32, top), arcThrough(Y, 32, top),
          { seg: [P, [45, 8], { w: 0.4 }] },
          { seg: [P, at(P, 50, 45), { w: 0.3, col: "#8a837a" }] },
          { mark: [P, 0, 45, "45°"] },
          { dot: [P, "P", "below"] }, { dot: [X, "X", "below"] }, { dot: [Y, "Y", "below"] },
          { dot: [top, "", "above"] },
        ],
      })) +
      steps([
        "Needle on P: an arc crossing the line at X and at Y.",
        "Wider: arcs from X and from Y that cross above P. Rule from P through the crossing — 90°.",
        "Bisect the right angle. Each half is <b>45°</b>.",
      ]));
  },
  key() {
    return [want.num(45, ANG_TOL)];
  },
  answer() {
    return ["45°"];
  },
};

export const CO_EXERCISES = [
  coCircle, coCopy,
  coSSS, coSAS, coASA,
  coPerpBisector, coAngleBisector, coPerpFromPoint,
  co60, co90,
];
