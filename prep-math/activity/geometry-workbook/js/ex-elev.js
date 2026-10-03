/* ============================================================================
   Geometry Workbook — CHAPTER 16: ANGLES OF ELEVATION AND DEPRESSION
   ----------------------------------------------------------------------------
   Both are measured FROM THE HORIZONTAL at the eye of the person looking.

     ELEVATION    looking UP: the angle between the level line and the line
                  of sight to something higher
     DEPRESSION   looking DOWN: the angle between the level line and the line
                  of sight to something lower — NOT the angle with the cliff

     up or down?          which of the two a story is about
     the same angle       the depression from the top equals the elevation
                          from the bottom (alternate angles: the two level
                          lines are parallel)
     find a height        opposite = adjacent × tan, with an eye height added
                          at Stretch
     find a distance      from a cliff or a tower: adjacent = opposite ÷ tan,
                          and the length of the line of sight
     find the angle       height over distance is the tangent: look it up
     two sightings        (Middle+) two boats in a line; a tower seen from
                          two places

   The numbers are exact, as in chapter 15: only the angles with tidy ratios
   are used, and each question prints the value it needs.
   ========================================================================== */

import { levelOf } from "./levels.js";
import { want } from "/utils/components/workbook/want.js";

const box = () => `<span class="wb-answer"></span>`;
const ask = (html) => `<p class="wb-ask">${html}</p>`;
const art = (svg) => `<div class="gw-art">${svg}</div>`;
const side = (figure, words) => `<div class="gw-side">${figure}<div class="gw-lines">${words}</div></div>`;
const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
const tier = (o) => levelOf(o).id;
const f = (n) => (+n).toFixed(2);
const INK = "#2a2723", RED = "#c0453f", BLUE = "#2f6ea8", GREY = "#8a837a";
const tidy = (v) => Math.round(v * 100) / 100;

/**
 * The picture of a sighting.
 *   down      false: an eye on the ground looking UP at the top of something
 *             true: an eye at the top of a cliff looking DOWN at something
 *   angle     what is written in the angle (a number of degrees, or "θ")
 *   height    what is written beside the upright; dist: along the ground;
 *             sight: along the line of sight
 *   deg       the angle the picture is drawn with
 */
function sightSvg({ down = false, angle = "θ", height = null, dist = null, sight = null, deg = 37, also = null }) {
  const rad = (deg * Math.PI) / 180;
  const w = 46, h = Math.min(34, Math.max(14, w * Math.tan(rad)));
  const L = 9, T = 8;
  const t = (x, y, s, anchor = "middle", col = INK, size = 3.5) => `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" font-family="JetBrains Mono, monospace" font-size="${size}" font-weight="700" fill="${col}">${s}</text>`;
  const ln = (a, b, col = INK, wd = 0.55, dash = "") => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${col}" stroke-width="${wd}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
  let s = "";
  if (!down) {
    /* the eye bottom-left, the upright on the right */
    const O = [L, T + h], F = [L + w, T + h], P = [L + w, T];
    s += ln(O, F) + `<rect x="${f(P[0] - 1.6)}" y="${f(P[1])}" width="3.2" height="${f(h)}" fill="#d9d4c9" stroke="${INK}" stroke-width="0.4"/>`;
    s += ln(O, P, BLUE, 0.6);
    s += `<path d="M${f(O[0] + 8)} ${f(O[1])}A8 8 0 0 0 ${f(O[0] + 8 * Math.cos(rad))} ${f(O[1] - 8 * Math.sin(rad))}" fill="none" stroke="${RED}" stroke-width="0.5"/>`;
    s += t(O[0] + 12.5 * Math.cos(rad / 2), O[1] - 12.5 * Math.sin(rad / 2) + 1.2, angle, "middle", RED);
    s += `<circle cx="${f(O[0])}" cy="${f(O[1])}" r="0.9" fill="${INK}"/>`;
    if (dist != null) s += t((O[0] + F[0]) / 2, O[1] + 4.8, dist);
    if (height != null) s += t(P[0] + 3.2, (P[1] + F[1]) / 2 + 1.2, height, "start");
    if (sight != null) s += t((O[0] + P[0]) / 2 - 2, (O[1] + P[1]) / 2 - 2, sight, "end", BLUE);
    return `<svg class="gw-fig" viewBox="0 0 ${f(w + 30)} ${f(h + 18)}" width="${f(w + 30)}mm" height="${f(h + 18)}mm" role="img" aria-label="Looking up: an angle of elevation">${s}</svg>`;
  }
  /* the eye top-left on a cliff, the thing seen bottom-right */
  const E = [L, T], B = [L, T + h], S = [L + w, T + h], H = [L + w + 6, T];
  s += `<rect x="${f(B[0] - 5)}" y="${f(E[1])}" width="5" height="${f(h)}" fill="#d9d4c9" stroke="${INK}" stroke-width="0.4"/>`;
  s += ln(B, [S[0] + 6, S[1]]) + ln(E, H, GREY, 0.45, "1.4 1") + ln(E, S, BLUE, 0.6);
  s += `<path d="M${f(E[0] + 9)} ${f(E[1])}A9 9 0 0 1 ${f(E[0] + 9 * Math.cos(rad))} ${f(E[1] + 9 * Math.sin(rad))}" fill="none" stroke="${RED}" stroke-width="0.5"/>`;
  s += t(E[0] + 13.5 * Math.cos(rad / 2), E[1] + 13.5 * Math.sin(rad / 2) + 1.2, angle, "middle", RED);
  if (also != null) {
    /* the matching angle at the thing seen: its angle of elevation of the eye */
    s += `<path d="M${f(S[0] - 8)} ${f(S[1])}A8 8 0 0 1 ${f(S[0] - 8 * Math.cos(rad))} ${f(S[1] - 8 * Math.sin(rad))}" fill="none" stroke="${RED}" stroke-width="0.5"/>`;
    s += t(S[0] - 12.5 * Math.cos(rad / 2), S[1] - 12.5 * Math.sin(rad / 2) + 1.2, also, "middle", RED);
  }
  s += `<circle cx="${f(E[0])}" cy="${f(E[1])}" r="0.9" fill="${INK}"/><circle cx="${f(S[0])}" cy="${f(S[1])}" r="1.1" fill="${BLUE}"/>`;
  s += t(H[0] - 1, H[1] - 1.6, "level", "end", GREY, 2.8);
  if (height != null) s += t(B[0] - 6.4, (E[1] + B[1]) / 2 + 1.2, height, "end");
  if (dist != null) s += t((B[0] + S[0]) / 2, B[1] + 4.8, dist);
  if (sight != null) s += t((E[0] + S[0]) / 2 + 3, (E[1] + S[1]) / 2 - 1, sight, "start", BLUE);
  return `<svg class="gw-fig" viewBox="-8 0 ${f(w + 34)} ${f(h + 18)}" width="${f(w + 34)}mm" height="${f(h + 18)}mm" role="img" aria-label="Looking down: an angle of depression">${s}</svg>`;
}

export const EL_GROUPS = [
  { id: "el-meaning", chapter: "Chapter 16 · Elevation and depression", label: "What the two angles are", blurb: "Both are measured from the level line at the eye: up, or down." },
  { id: "el-use", label: "Heights and distances", blurb: "A height, a distance, an angle — and two sightings at once." },
];

/* ═══ up or down? ══════════════════════════════════════════════════════════*/

const LOOKS = [
  ["A boy on the ground watches a bird at the top of a tree.", 0],
  ["A sailor in a boat looks at the lamp of a lighthouse.", 0],
  ["A girl on a field watches a kite flying.", 0],
  ["A surveyor on the ground sights the top of a mast.", 0],
  ["A guard at the top of a tower watches a car on the road below.", 1],
  ["A pilot looks at the runway from the air.", 1],
  ["A woman on a cliff top watches a boat out at sea.", 1],
  ["A boy on a balcony looks at a ball lying in the yard.", 1],
];

const elName = {
  id: "el-name",
  group: "el-meaning",
  label: "Elevation or depression?",
  blurb: "Looking up, or looking down?",
  heading: "Elevation and depression: which is it?",
  instruction: () =>
    "Stand and look straight ahead: that is the HORIZONTAL, the level line. If you have to raise your eyes to " +
    "see something, the angle you raise them through is the ANGLE OF ELEVATION. If you have to lower them, the " +
    "angle you lower them through is the ANGLE OF DEPRESSION. Both are measured from the level line — never " +
    "from the wall or the cliff.",
  cols: 1,
  defaultCount: 4,
  make: (r) => ({ k: r.int(0, LOOKS.length - 1) }),
  render: (it) => ask(LOOKS[it.k][0]) + ask(`This is an angle of ${tick("elevation", "depression")}`),
  worked: () => worked(side(art(sightSvg({ down: true, angle: "35°", deg: 35 })),
    say("From the cliff top the eye drops from the level line to the boat: an angle of DEPRESSION of 35°. " +
      "It is the angle with the dashed level line, not the angle with the cliff."))),
  key: (it) => [want.tick(LOOKS[it.k][1])],
  answer: (it) => [LOOKS[it.k][1] ? "depression" : "elevation"],
};

/* ═══ the same angle, seen from the other end ══════════════════════════════*/

const elAlt = {
  id: "el-alt",
  group: "el-meaning",
  label: "The same angle from the other end",
  blurb: "Depression from the top = elevation from the bottom.",
  heading: "Elevation and depression: alternate angles",
  instruction: () =>
    "The level line at the top and the level ground at the bottom are PARALLEL, and the line of sight crosses " +
    "both. So the angle of depression from the top and the angle of elevation from the bottom are alternate " +
    "angles: they are EQUAL. And the angle between the line of sight and the upright cliff is what is left of " +
    "90°.",
  cols: 1,
  defaultCount: 3,
  make: (r) => ({ a: r.int(4, 14) * 5 - r.pick([0, 0, 2, 3]) }),
  render: (it) => side(art(sightSvg({ down: true, angle: `${it.a}°`, also: "x", deg: Math.min(36, Math.max(22, it.a)) })),
    ask(`From the cliff top, the angle of depression of the boat is ${it.a}°.`) +
    ask(`The angle of elevation of the cliff top from the boat, x = ${box()}°`) +
    ask(`The angle between the line of sight and the cliff = ${box()}°`)),
  worked: () => worked(say("Depression 35° from the top: the elevation from the boat is also 35° (alternate angles). " +
    "The angle with the cliff is 90° − 35° = 55°.")),
  key: (it) => [want.num(it.a), want.num(90 - it.a)],
  answer: (it) => [`x = ${it.a}°; with the cliff ${90 - it.a}°`],
};

/* ═══ find a height ════════════════════════════════════════════════════════*/

/* tangents that come out exactly: [degrees, tan, the distance must be a multiple of] */
const TANS = [[45, 1, 1], [37, 0.75, 4]];
const THINGS = ["a tree", "a flagpole", "a tower", "a building", "a mast"];

const elHeight = {
  id: "el-height",
  group: "el-use",
  label: "Find a height",
  blurb: "Height = distance × tan (angle of elevation).",
  heading: "Elevation: how high?",
  instruction: () =>
    "The ground, the upright and the line of sight make a right-angled triangle. The distance along the ground " +
    "is ADJACENT to the angle of elevation and the height is OPPOSITE it, so height = distance × tan (angle). " +
    "If the angle is measured from a person's EYE, that gives the height above the eye: add the eye's height " +
    "to finish.",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const [deg, tan, step] = r.pick(t === "gentle" ? TANS.slice(0, 1) : TANS);
    const d = step * r.int(3, 12);
    const eye = t === "stretch" ? r.pick([1.5, 1.6, 1.8]) : 0;
    return { deg, tan, d, eye, what: r.pick(THINGS) };
  },
  render(it) {
    const from = it.eye ? `A surveyor whose eye is ${it.eye} m above the ground stands ${it.d} m from the foot of ${it.what}.` : `A point on the ground is ${it.d} m from the foot of ${it.what}.`;
    return side(art(sightSvg({ angle: `${it.deg}°`, dist: `${it.d} m`, height: "h", deg: it.deg })),
      ask(`${from} The angle of elevation of the top is ${it.deg}°. (tan ${it.deg}° = ${it.tan})`) +
      ask(`Height of ${it.what.replace(/^a /, "the ")} = ${box()} m`));
  },
  worked: () => worked(say("20 m from the foot of a tower, the angle of elevation of its top is 37°, and tan 37° = 0.75. " +
    "Height = 20 × 0.75 = 15 m. From an eye 1.5 m up, it would be 15 + 1.5 = 16.5 m.")),
  key: (it) => [want.num(tidy(it.d * it.tan + it.eye))],
  answer: (it) => [`${it.d} × ${it.tan}${it.eye ? ` + ${it.eye}` : ""} = ${tidy(it.d * it.tan + it.eye)} m`],
};

/* ═══ find a distance ══════════════════════════════════════════════════════*/

const elDist = {
  id: "el-dist",
  group: "el-use",
  label: "Find a distance",
  blurb: "From a cliff: distance = height ÷ tan; line of sight = height ÷ sin.",
  heading: "Depression: how far?",
  instruction: () =>
    "From the top of a cliff the angle of depression of a boat is given. Put that angle at the boat as well " +
    "(alternate angles): the cliff is OPPOSITE it and the distance along the sea is ADJACENT, so distance = " +
    "height ÷ tan (angle). The line of sight is the hypotenuse: line of sight = height ÷ sin (angle).",
  cols: 1,
  defaultCount: 3,
  make(r, o) {
    const t = tier(o);
    const kind = r.pick(t === "gentle" ? ["tan45", "sin30"] : ["tan45", "tan37", "sin30", "sin37"]);
    const h = 3 * r.int(4, 20);
    const spec = {
      tan45: { deg: 45, give: "tan 45° = 1", v: h, wants: "dist", how: `${h} ÷ 1` },
      tan37: { deg: 37, give: "tan 37° = 0.75", v: (h * 4) / 3, wants: "dist", how: `${h} ÷ 0.75` },
      sin30: { deg: 30, give: "sin 30° = 0.5", v: h * 2, wants: "sight", how: `${h} ÷ 0.5` },
      sin37: { deg: 37, give: "sin 37° = 0.6", v: (h * 5) / 3, wants: "sight", how: `${h} ÷ 0.6` },
    }[kind];
    return { h, ...spec };
  },
  render(it) {
    const lab = it.wants === "dist" ? { dist: "d" } : { sight: "d" };
    return side(art(sightSvg({ down: true, angle: `${it.deg}°`, height: `${it.h} m`, deg: it.deg, ...lab })),
      ask(`From the top of a cliff ${it.h} m high, the angle of depression of a boat is ${it.deg}°. (${it.give})`) +
      ask(`${it.wants === "dist" ? "How far is the boat from the foot of the cliff?" : "How long is the line of sight from the cliff top to the boat?"} d = ${box()} m`));
  },
  worked: () => worked(say("A cliff 30 m high, depression 37°, tan 37° = 0.75: distance = 30 ÷ 0.75 = 40 m. " +
    "With sin 37° = 0.6 the line of sight is 30 ÷ 0.6 = 50 m — a 30, 40, 50 triangle.")),
  key: (it) => [want.num(it.v)],
  answer: (it) => [`${it.how} = ${it.v} m`],
};

/* ═══ find the angle ═══════════════════════════════════════════════════════*/

const TABLE = "tan 37° = 0.75, tan 45° = 1, sin 30° = 0.5, sin 37° = 0.6, sin 53° = 0.8";

const elAngle = {
  id: "el-angle",
  group: "el-use",
  label: "Find the angle",
  blurb: "Height ÷ distance is the tangent: look the angle up.",
  heading: "Elevation and depression: what angle?",
  instruction: () =>
    `Divide the two lengths you are given to get a ratio — height ÷ distance is the TANGENT; height ÷ line of ` +
    `sight is the SINE — and find the angle with that value: ${TABLE}.`,
  cols: 1,
  defaultCount: 3,
  make(r) {
    const down = r.chance(0.5);
    const [ratio, deg, val, mul] = r.pick([["tan", 37, 0.75, 4], ["tan", 45, 1, 1], ["sin", 30, 0.5, 2], ["sin", 37, 0.6, 5], ["sin", 53, 0.8, 5]]);
    const base = mul * r.int(2, 9);
    return { down, ratio, deg, val, base, h: tidy(base * val) };
  },
  render(it) {
    const far = it.ratio === "tan" ? { dist: `${it.base} m` } : { sight: `${it.base} m` };
    const story = it.down
      ? `From the top of a tower ${it.h} m high, a car is seen ${it.ratio === "tan" ? `${it.base} m from the foot of the tower` : `along a line of sight ${it.base} m long`}.`
      : `A kite is ${it.h} m above the ground, ${it.ratio === "tan" ? `over a point ${it.base} m from the boy holding it` : `on ${it.base} m of straight string`}.`;
    return side(art(sightSvg({ down: it.down, angle: "θ", height: `${it.h} m`, deg: it.deg === 53 ? 36 : it.deg, ...far })),
      ask(story) + ask(`${it.ratio} θ = ${box()} &nbsp; so the angle of ${it.down ? "depression" : "elevation"} is ${box()}°`));
  },
  worked: () => worked(say("A tower 15 m high, a car 20 m from its foot: tan θ = 15 ÷ 20 = 0.75, so the angle of depression is 37°.")),
  key: (it) => [want.num(it.val), want.num(it.deg)],
  answer: (it) => [`${it.ratio} θ = ${it.h} ÷ ${it.base} = ${it.val}; ${it.deg}°`],
};

/* ═══ two sightings ════════════════════════════════════════════════════════*/

const elTwo = {
  id: "el-two",
  group: "el-use",
  label: "Two sightings",
  blurb: "Two boats in a line; a tower seen from two places.",
  heading: "Elevation and depression: two angles at once",
  instruction: () =>
    "Two angles mean two right-angled triangles that SHARE the upright. Work each one out separately — distance " +
    "= height ÷ tan (angle) — then add or take away the two distances as the picture says. Use tan 45° = 1 and " +
    "tan 37° = 0.75.",
  cols: 1,
  defaultCount: 2,
  make(r, o) {
    const h = 3 * r.int(4, tier(o) === "gentle" ? 10 : 25);
    return { h, kind: r.int(0, tier(o) === "gentle" ? 0 : 2) };
  },
  render(it) {
    const near = it.h, far = (it.h * 4) / 3;
    void near; void far;
    const text = [
      `From the top of a cliff ${it.h} m high, two boats are seen in a straight line out to sea, on the same side. Their angles of depression are 45° and 37°.`,
      `From the top of a tower ${it.h} m high, two cars are seen on opposite sides of the tower, in line with its foot. Their angles of depression are 45° and 37°.`,
      `From a point on the ground the angle of elevation of the top of a tower ${it.h} m high is 37°. A man walks straight towards the tower until the angle of elevation is 45°.`,
    ][it.kind];
    const q = ["How far apart are the boats?", "How far apart are the cars?", "How far did he walk?"][it.kind];
    return ask(text) + ask(`Distance for 45° = ${box()} m &nbsp; distance for 37° = ${box()} m`) + ask(`${q} ${box()} m`);
  },
  worked: () => worked(say("A cliff 30 m high; boats at depressions 45° and 37°. The nearer is 30 ÷ 1 = 30 m out, the farther " +
    "30 ÷ 0.75 = 40 m out. On the same side they are 40 − 30 = 10 m apart; on opposite sides it would be 40 + 30 = 70 m.")),
  key(it) {
    const near = it.h, far = (it.h * 4) / 3;
    return [want.num(near), want.num(far), want.num(it.kind === 1 ? far + near : far - near)];
  },
  answer(it) {
    const near = it.h, far = (it.h * 4) / 3;
    return [`${near} m and ${far} m; ${it.kind === 1 ? `${far} + ${near} = ${far + near}` : `${far} − ${near} = ${far - near}`} m`];
  },
};

export const EL_EXERCISES = [elName, elAlt, elHeight, elDist, elAngle, elTwo];
