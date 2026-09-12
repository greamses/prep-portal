/* ============================================================================
   Maths Workbook — ANGLES, and the protractor
   ----------------------------------------------------------------------------
   The last family on the paper, and the one that needs an instrument.

   NAMING COMES BEFORE MEASURING. A child who can say "that one is obtuse"
   already knows it is more than ninety before they measure it, which is what
   stops them writing 60 for an angle that is plainly wider than a corner. So
   the first exercises are about the right angle and nothing else: is it
   smaller, exactly, or bigger.

   THEN READING A SCALE, WITH THE PROTRACTOR ALREADY IN PLACE. Lining an
   instrument up and reading it are two different skills and they fail
   separately. The reading questions print the protractor centred on the vertex
   with its baseline along the arm, so the only thing left to do is choose the
   right ring of numbers — which is where it goes wrong.

   THEN LINING IT UP YOURSELF. A protractor to cut out is printed at the head
   of the section, and the angles are drawn tilted so no two are lined up the
   same way. A page of angles all sitting on a horizontal line teaches a child
   to read a protractor in exactly one position.

   BOTH RINGS OF NUMBERS, ALWAYS. See protractor.js.
   ========================================================================== */

import { angleSvg, protractorSvg, KINDS, kindOf, kindNamed } from "./protractor.js";
import { levelOf } from "./ex-remainder.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="rw-answer"></span>`;
const line = (size = "md") => `<span class="wb-line wb-line--${size}"></span>`;

export const ANGLE_GROUPS = [
  {
    chapter: "Chapter 6 · Angles",
    id: "angle-name",
    label: "Naming angles",
    blurb: "Smaller than a right angle, exactly one, or bigger. Before any measuring.",
  },
  {
    id: "angle-measure",
    label: "The protractor",
    blurb: "Read the scale with it laid on for you, then lay it on yourself.",
  },
];

/* ── how big the angles are ────────────────────────────────────────────────
   Tied to the same dial as everything else. At the gentle level every angle a
   child measures is a multiple of ten, because reading 40 off a scale and
   reading 43 off it are different lessons and only one of them is about
   protractors. */
function step(o) {
  const L = levelOf(o);
  return L.max <= 20 ? 10 : L.max <= 34 ? 5 : 1;
}

/** An angle that is unambiguously one kind — never 89 when the answer is acute. */
function drawAngle(r, o, { min = 10, max = 170 } = {}) {
  const s = step(o);
  const lo = Math.ceil(min / s);
  const hi = Math.floor(max / s);
  let deg = r.int(lo, hi) * s;
  /* Nothing within five degrees of a right angle unless it IS one: an angle of
     87° drawn on paper cannot be told from 90° by eye, and the naming
     questions are answered by eye. */
  if (deg !== 90 && Math.abs(deg - 90) < 5) deg = 90 - 5 * Math.sign(90 - deg || 1);
  return deg;
}

const tiltFor = (r) => r.int(0, 11) * 15;

/* ── naming ────────────────────────────────────────────────────────────────*/

const nameAngle = {
  id: "angle-name-it",
  group: "angle-name",
  label: "Name the angle",
  blurb: "Acute, right, obtuse, straight or reflex — by eye, with no measuring.",
  heading: "Name each angle",
  instruction: () =>
    "Do not measure these. Compare each one with a right angle — the corner of " +
    "a page — and write what it is called.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    /* Dealt across the kinds, so a page of six is not five acute ones. */
    const pick = r.pick(["acute", "right", "obtuse", "straight", "reflex"]);
    const deg =
      pick === "right" ? 90
        : pick === "straight" ? 180
          : pick === "acute" ? drawAngle(r, o, { min: 15, max: 80 })
            : pick === "obtuse" ? drawAngle(r, o, { min: 100, max: 170 })
              : drawAngle(r, o, { min: 200, max: 330 });
    return { deg, tilt: tiltFor(r) };
  },
  render(item) {
    return (
      `<div class="ma-art">${angleSvg(item.deg, { tilt: item.tilt })}</div>` +
      `<p class="wb-ask">This angle is ${line("sm")}</p>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="ma-five">` +
      KINDS.map((k) => {
        const deg = { acute: 45, right: 90, obtuse: 130, straight: 180, reflex: 250 }[k.id];
        return (
          `<span><div class="ma-art">${angleSvg(deg, { tilt: 0, mm: 26 })}</div>` +
          `<p class="wb-ask ma-five__name"><b>${k.name}</b><em>${k.says}</em></p></span>`
        );
      }).join("") +
      `</div></div>`
    );
  },
  key(item) {
    const name = kindNamed(kindOf(item.deg)).name;
    return [want.words(name, `${name} angle`, `an ${name} angle`, `a ${name} angle`)];
  },
  answer(item) {
    return [kindNamed(kindOf(item.deg)).name];
  },
};

const sortAngles = {
  id: "angle-bigger",
  group: "angle-name",
  label: "Bigger or smaller than a right angle",
  blurb: "The one comparison everything else rests on. Tick a box.",
  heading: "Bigger or smaller than a right angle?",
  instruction: () =>
    "A right angle is a square corner. Tick whether each angle is smaller than " +
    "one, exactly one, or bigger than one.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    const which = r.pick(["small", "right", "big"]);
    const deg =
      which === "right" ? 90
        : which === "small" ? drawAngle(r, o, { min: 15, max: 80 })
          : drawAngle(r, o, { min: 100, max: 170 });
    return { deg, tilt: tiltFor(r) };
  },
  render(item) {
    return (
      `<div class="ma-art">${angleSvg(item.deg, { tilt: item.tilt })}</div>` +
      `<span class="wb-tick">` +
      `<span class="wb-tick__one"><span class="wb-box"></span>smaller</span>` +
      `<span class="wb-tick__one"><span class="wb-box"></span>exactly</span>` +
      `<span class="wb-tick__one"><span class="wb-box"></span>bigger</span>` +
      `</span>`
    );
  },
  key(item) {
    return [want.tick(item.deg === 90 ? 1 : item.deg < 90 ? 0 : 2)];
  },
  answer(item) {
    return [item.deg === 90 ? "exactly a right angle" : item.deg < 90 ? "smaller" : "bigger"];
  },
};

/* ── measuring ─────────────────────────────────────────────────────────────*/

const readScale = {
  id: "angle-read",
  group: "angle-measure",
  label: "Read the protractor",
  blurb: "It is already lined up. All that is left is choosing the right ring of numbers.",
  heading: "Read the angle off the protractor",
  instruction: () =>
    "The protractor is already in place: its middle is on the corner and its " +
    "flat edge is along one arm. Follow the OTHER arm out to the scale. Start " +
    "from the arm that reads zero, and use the ring of numbers that starts there.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    return { deg: drawAngle(r, o, { min: 20, max: 160 }), tilt: tiltFor(r) };
  },
  render(item) {
    return (
      `<div class="ma-art">${angleSvg(item.deg, { tilt: item.tilt, protractor: true, mark: false })}</div>` +
      `<p class="wb-ask">The angle is ${box()}°</p>`
    );
  },
  worked() {
    return (
      `<div class="rw-worked"><p class="rw-worked__tag">One done for you</p>` +
      `<div class="ma-art">${angleSvg(50, { tilt: 0, protractor: true, mark: false })}</div>` +
      `<p class="wb-ask">The angle is <b>50</b>°</p>` +
      `<p class="wb-ask rw-worked__say">The bottom arm points at the <b>0</b> on the outer ` +
      `ring, so the outer ring is the one to read — and the other arm crosses it at 50. ` +
      `The inner ring says 130 there, which is the same angle measured the other way ` +
      `round: read the ring whose zero your first arm is on.</p></div>`
    );
  },
  key(item) {
    return [want.num(item.deg)];
  },
  answer(item) {
    return [`${item.deg}°`];
  },
};

const measureAngle = {
  id: "angle-measure-it",
  group: "angle-measure",
  label: "Measure it yourself",
  blurb: "Cut the protractor out, lay it on, and read it. The angles are all tilted.",
  heading: "Measure each angle",
  instruction: () =>
    "Cut out the protractor at the top of this section. Put its middle dot on " +
    "the corner, turn it until its flat edge lies along one arm, and read where " +
    "the other arm crosses.",
  cols: 2,
  defaultCount: 6,
  make(r, o) {
    return { deg: drawAngle(r, o, { min: 20, max: 160 }), tilt: tiltFor(r) };
  },
  render(item) {
    return (
      `<div class="ma-art">${angleSvg(item.deg, { tilt: item.tilt })}</div>` +
      `<p class="wb-ask">${box()}°</p>`
    );
  },
  /* The instrument itself, at the head of the section. It is a `worked` only in
     the sense that it is the thing printed above the questions; unlike every
     other one on this paper it prints at EVERY help level, because a page that
     says "cut out the protractor" and has no protractor on it is broken. */
  worked() {
    return (
      `<div class="rw-worked ma-cut"><p class="rw-worked__tag">Cut this out</p>` +
      `<div class="ma-art">${protractorSvg()}</div></div>`
    );
  },
  alwaysWorked: true,
  key(item) {
    return [want.num(item.deg, 2)];
  },
  answer(item) {
    return [`${item.deg}°`];
  },
};

const drawAngleEx = {
  id: "angle-draw",
  group: "angle-measure",
  label: "Draw the angle",
  blurb: "The skill backwards: one arm is drawn, put the other one where it belongs.",
  heading: "Draw each angle",
  instruction: () =>
    "One arm is drawn for you and the corner is marked. Lay the protractor along " +
    "that arm, find the number, make a dot, and rule the second arm from the corner.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return { deg: drawAngle(r, o, { min: 20, max: 160 }), tilt: tiltFor(r) };
  },
  render(item) {
    /* Only the base arm is drawn — an angle of zero is one arm and a corner. */
    return (
      `<p class="wb-ask wb-ask--lead">Draw an angle of <b>${item.deg}°</b>.</p>` +
      `<div class="ma-art">${angleSvg(0, { tilt: item.tilt, mark: false })}</div>`
    );
  },
  /* The second arm is ruled from the corner (the line snaps onto it). It is
     right within 3° of the angle asked for, on either side of the first arm. */
  key(item) {
    return [
      want.draw({
        free: true,
        on: "svg.ma-angle",
        says: `an arm ${item.deg}° round from the one drawn`,
        check(lines, fig) {
          const [v, a] = fig.pts;
          if (!v || !a) return false;
          const base = Math.atan2(a[1] - v[1], a[0] - v[0]);
          return lines.some(([p, q]) => {
            const near = (u) => Math.hypot(u[0] - v[0], u[1] - v[1]) < 2.5;
            const far = near(p) ? q : near(q) ? p : null;
            if (!far || Math.hypot(far[0] - v[0], far[1] - v[1]) < 6) return false;
            let d = Math.abs(Math.atan2(far[1] - v[1], far[0] - v[0]) - base) * 180 / Math.PI;
            if (d > 180) d = 360 - d;
            return Math.abs(d - item.deg) <= 3;
          });
        },
      }),
    ];
  },
  answer(item) {
    return [`${item.deg}° from the arm drawn`];
  },
};

const estimateAngle = {
  id: "angle-estimate",
  group: "angle-measure",
  label: "Guess, then measure",
  blurb: "Write a guess before measuring — the habit that catches a misread scale.",
  heading: "Guess first, then measure",
  instruction: () =>
    "Write down what you think each angle is BEFORE you measure it. Then measure " +
    "it and write that too. A guess that is miles from the measurement usually " +
    "means the wrong ring of numbers was read.",
  cols: 2,
  defaultCount: 4,
  make(r, o) {
    return { deg: drawAngle(r, o, { min: 20, max: 160 }), tilt: tiltFor(r) };
  },
  render(item) {
    return (
      `<div class="ma-art">${angleSvg(item.deg, { tilt: item.tilt })}</div>` +
      `<p class="wb-ask"><span class="rw-slot"><em>My guess</em>${box()}</span></p>` +
      `<p class="wb-ask"><span class="rw-slot"><em>Measured</em>${box()}</span></p>`
    );
  },
  /* the guess is not marked — only how near it was matters, and that is the
     child's own lesson */
  key(item) {
    return [want.free(), want.num(item.deg, 2)];
  },
  answer(item) {
    return [`${item.deg}°`];
  },
};

export const ANGLE_EXERCISES = [
  nameAngle, sortAngles,
  readScale, measureAngle, drawAngleEx, estimateAngle,
];
