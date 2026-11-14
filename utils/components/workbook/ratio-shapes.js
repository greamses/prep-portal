/* ============================================================================
   RATIO WITH SHAPES AND AGES — a lesson and four worked questions
   ----------------------------------------------------------------------------
     ratioSquareCube   lesson 4: lengths and perimeters keep a ratio, areas
                       SQUARE it, volumes CUBE it (and back again with roots)
     ratioPerimeter    sides 2 : 3, smaller perimeter 24 cm: the larger
     ratioArea         sides 2 : 3, smaller area 36 cm²: the larger
     ratioVolume       edges 2 : 3, smaller volume 40 cm³: the larger
     ratioAges         father 4 times his son; in 20 years, twice: the son now

   The squares are drawn on a grid so an area can be COUNTED (4 little squares
   against 9), and a cube is drawn as its layers (2 layers of 4 against 3 layers
   of 9). The box method is the workbook's own bars; the ages question cuts its
   boxes so the age gap, which never changes, is the same number of boxes.
   ========================================================================== */

import { modelSvg } from "/prep-math/activity/maths-workbook/js/modelart.js";
import { braceOf, film, mb, part } from "./film-kit.js";
import { mathLoad, mathifyPic, texAt } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W, K_ } from "./cbt-films.js";

const INK = "#2a2723", BLUE = "#2f6f8f", GREEN = "#2f7d4a", PURPLE = "#6b4fa0";
const SKY = "#bfe3ff", BUTTER = "#fff3a8", LEAF = "#c8f0c0", PEACH = "#ffd7a3";
const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
const main = (pieces, em = 8) => svgBox(150, 30, mathRow(pieces, { cx: 75, y: 17, em }).svg);
const at = (y) => centred(150, y);
const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const keys = (s, prefix) => [...(s?.querySelectorAll(`[data-k^="${prefix}"]`) || [])];
const write = (s, H, ks, start = 0, gap = 0.35) => ks.forEach((k, i) => { const n = key(s, k); if (n) H.write(n, start + i * gap); });
const card = (title, sub) => ({ kind: "card", title, sub, hold: 1.6 });
const line3 = (s, H, ding = false) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); write(s, H, ["f"], 2.3); if (ding) H.sound("ding", 1.5); };

/* ── the pictures ─────────────────────────────────────────────────────── */
/** A square of side n on a grid of c: its paper, its numbered little squares, its grid lines, its side label. */
function gridSq(p, x, base, n, c, fill, { cells = true, label = null } = {}) {
  const y = base - n * c;
  let o = `<rect data-mb="bar" data-k="${p}-o" x="${x}" y="${y}" width="${n * c}" height="${n * c}" fill="#fffdf8" stroke="${INK}" stroke-width="0.8"/>`;
  if (cells) {
    for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) {
      const i = r * n + q;
      o += `<g data-mb="num" data-k="${p}-c${String(i).padStart(2, "0")}"><rect x="${x + q * c + 0.4}" y="${y + r * c + 0.4}" width="${c - 0.8}" height="${c - 0.8}" fill="${fill}"/>`
        + `<text x="${x + q * c + c / 2}" y="${y + r * c + c * 0.66}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="${(c * 0.42).toFixed(1)}" fill="${INK}">${i + 1}</text></g>`;
    }
  } else {
    o += `<rect data-mb="num" data-k="${p}-f" x="${x + 0.4}" y="${y + 0.4}" width="${n * c - 0.8}" height="${n * c - 0.8}" fill="${fill}"/>`;
  }
  for (let i = 1; i < n; i++) {
    o += `<g data-mb="brace" data-mb-key="${p}-v${i}"><path d="M${x + i * c} ${y} V${base}" fill="none" stroke="${INK}" stroke-width="0.45"/></g>`;
    o += `<g data-mb="brace" data-mb-key="${p}-h${i}"><path d="M${x} ${y + i * c} H${x + n * c}" fill="none" stroke="${INK}" stroke-width="0.45"/></g>`;
  }
  o += `<rect x="${x}" y="${y}" width="${n * c}" height="${n * c}" fill="none" stroke="${INK}" stroke-width="0.8" data-mb="bar" data-k="${p}-e"/>`;
  if (label != null) o += texAt(String(label), x + (n * c) / 2, base + 6.5, { em: 5, attrs: `data-mb="name" data-k="${p}-s"` });
  return o;
}
/** Two squares, sides a and b, on a grid (cells numbered for counting) */
function squares(a, b, { cells = true, labels = [a, b] } = {}) {
  const c = 9;
  return svgBox(150, 50, gridSq("A", 40, 40, a, c, SKY, { cells, label: labels[0] }) + gridSq("B", 82, 40, b, c, BUTTER, { cells, label: labels[1] }));
}
/** Two cubes as their layers: n layers of n by n, stacked back to front */
function cubes(a, b) {
  const c = 7, d = 4;
  const stack = (p, x, base, n, fill) => {
    let o = "";
    for (let j = n - 1; j >= 0; j--) o += gridSq(`${p}${j}`, x + j * d, base - j * d, n, c, fill, { cells: false });
    return o + texAt(String(n), x + (n * c) / 2, base + 6.5, { em: 5, attrs: `data-mb="name" data-k="${p}-s"` });
  };
  return svgBox(150, 50, stack("CA", 38, 42, a, SKY) + stack("CB", 80, 42, b, BUTTER));
}
const sqDraw = (prefixes) => (s, H) => prefixes.forEach((p, i) => {
  [key(s, `${p}-o`), key(s, `${p}-e`)].forEach((n) => n && H.grow(n, 0.2 + i * 0.5));
  const lab = key(s, `${p}-s`); if (lab) H.write(lab, 0.8 + i * 0.5);
});
const sqGrid = (prefixes) => (s, H) => prefixes.forEach((p, i) =>
  [...(s?.querySelectorAll(`[data-mb-key^="${p}-v"], [data-mb-key^="${p}-h"]`) || [])].forEach((g, j) => H.draw(g, 0.1 + i * 0.6 + j * 0.12)));
const sqCount = (prefixes) => (s, H) => {
  let t = 0.2;
  prefixes.forEach((p) => { keys(s, `${p}-c`).forEach((n) => { H.write(n, t); t += 0.28; }); t += 0.4; });
};
const sqLit = (prefixes) => (s, H) => prefixes.forEach((p, i) => { const n = key(s, `${p}-e`); if (n) H.lit(n, 0.2 + i * 0.6, 2.6); });
/** a cube built layer by layer, bottom (front) layer last so it lands on top */
const cubeBuild = (s, H) => {
  let t = 0.2;
  [["CA", 2], ["CB", 3]].forEach(([p, n]) => {
    for (let j = n - 1; j >= 0; j--) {
      const q = `${p}${j}`;
      [key(s, `${q}-o`), key(s, `${q}-e`)].forEach((m) => m && H.grow(m, t));
      const f = key(s, `${q}-f`); if (f) H.write(f, t + 0.2);
      [...(s?.querySelectorAll(`[data-mb-key^="${q}-v"], [data-mb-key^="${q}-h"]`) || [])].forEach((g) => H.draw(g, t + 0.3));
      t += 0.55;
    }
    const lab = key(s, `${p}-s`); if (lab) H.write(lab, t);
    t += 0.5;
  });
};

/** The box method: two rows of equal boxes, a known brace on one, numbers to fill */
function twoRows(names, counts, { text = "", known = null, ask = null } = {}) {
  const maxR = Math.max(...counts);
  const cap = Math.min(22, 104 / maxR);
  const rows = counts.map((n, i) => ({
    name: names[i],
    parts: Array.from({ length: n }, () => part(text, 1, i ? "b" : "a")),
    ...(known && known.row === i ? { below: [{ from: 0, to: n, text: known.text }] } : {}),
    ...(ask && ask.row === i ? { below: [{ from: 0, to: n, text: ask.text }] } : {}),
  }));
  return mathifyPic(modelSvg(rows, { cap, label: "" }));
}
const twoAt = (maxR) => { const cap = Math.min(22, 104 / maxR); const W = 18 + maxR * cap; return { x: 50 - (W * K_) / 2 + 18 * K_, y: 15 }; };
const rowGrow = (i) => (s, H) => { const ns = mb(s, "name")[i]; if (ns) H.write(ns, 0); mb(s, "bar", i).forEach((b, j) => H.grow(b, 0.3 + j * 0.2)); };
const showBars = (s, H) => { mb(s, "name").forEach((n) => H.show(n)); mb(s, "bar").forEach((n) => H.show(n)); };
const fill = (s, H) => mb(s, "num").forEach((n, i) => H.write(n, i * 0.1));

/* ═══ LESSON 4: SQUARE AND CUBE RATIOS ═════════════════════════════════════ */
export function ratioSquareCube() {
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "Two squares have sides in the ratio 2:3. What is the ratio of their perimeters, and of their areas?" },
      { id: "a2", text: "Two cubes have edges in the ratio 2:3. What is the ratio of their volumes?" },
    ],
    pics: {
      sq: () => squares(2, 3),
      cu: () => cubes(2, 3),
      mL: () => main([L("a", "\\text{sides } 2 : 3")]),
      mP: () => main([L("a", "4 \\times 2 : 4 \\times 3"), L("e", "="), L("b", "8 : 12 = 2 : 3", BLUE), L("g", "\\qquad"), L("f", "\\text{same ratio}", PURPLE)], 6.6),
      mA: () => main([L("a", "2^{2} : 3^{2}"), L("e", "="), L("b", "4 : 9", BLUE), L("g", "\\qquad"), L("f", "\\text{square ratio}", PURPLE)], 7),
      mV: () => main([L("a", "2^{3} : 3^{3}"), L("e", "="), L("b", "8 : 27", BLUE), L("g", "\\qquad"), L("f", "\\text{cube ratio}", PURPLE)], 7),
      mB1: () => main([L("a", "\\text{areas } 4 : 9"), L("e", "\\xrightarrow{\\ \\sqrt{\\ }\\ }"), L("b", "\\text{sides } 2 : 3", BLUE)], 6.6),
      mB2: () => main([L("a", "\\text{volumes } 8 : 27"), L("e", "\\xrightarrow{\\ \\sqrt[3]{\\ }\\ }"), L("b", "\\text{sides } 2 : 3", BLUE)], 6.6),
    },
    picAt: { sq: centred(150, 17), cu: centred(150, 17), mL: at(37.5), mP: at(37.5), mA: at(37.5), mV: at(37.5), mB1: at(37.5), mB2: at(37.5) },
    lines: [
      { id: "k1", receipt: true, sub: "Idea 1", text: "Lengths keep the ratio", y: 50.5 },
      { id: "k2", receipt: true, sub: "Idea 2", text: "Areas square it", y: 50.5 },
      { id: "k3", receipt: true, sub: "Idea 3", text: "Volumes cube it", y: 50.5 },
      { id: "k4", receipt: true, sub: "Idea 4", text: "Going back: the roots", y: 50.5 },
    ],
    stages: {
      "sq.draw": sqDraw(["A", "B"]),
      "sq.perim": sqLit(["A", "B"]),
      "sq.grid": sqGrid(["A", "B"]),
      "sq.count": sqCount(["A", "B"]),
      "cu.build": cubeBuild,
      "mL.all": (s, H) => write(s, H, ["a"], 0),
      "mP.all": (s, H) => line3(s, H), "mA.all": (s, H) => line3(s, H, true), "mV.all": (s, H) => line3(s, H, true),
      "mB1.all": (s, H) => line3(s, H), "mB2.all": (s, H) => line3(s, H),
    },
    steps: ({ push }) => {
      push("Two squares have sides in the ratio two to three. Is the ratio of their areas also two to three? Almost everybody says yes... and it isn't. Let's see why with the squares themselves.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Here's a square with sides of two, and a square with sides of three. The SIDES are in the ratio two to three, because the sides are what we were told about.",
        { on: ["sq", "mL", "k1"], add: ["sq.draw", "mL.all"], cue: { "sq.draw": "here's a square" }, transition: card("Idea 1", "Lengths keep the ratio"), pause: 0.6 });
      push("Walk round the edges. The perimeter of the small square is four sides of two, eight. The big one is four sides of three, twelve. Eight to twelve is two to three again. A perimeter is just a LENGTH, so it keeps the same ratio as the sides.",
        { on: ["mP"], off: ["mL"], add: ["sq.perim", "mP.all"], cue: { "sq.perim": "walk round", "mP.all": "the perimeter of" }, pause: 0.8 });
      push("Now the area: how many little squares fit inside. Draw the grid, and count them. The small square holds one, two, three, four. The big one holds nine.",
        { on: ["k2"], off: ["k1", "mP"], add: ["sq.grid", "sq.count"], cue: { "sq.grid": "draw the grid", "sq.count": "count them" }, transition: card("Idea 2", "Areas square it"), pause: 0.6 });
      push("So the areas are FOUR to NINE, not two to three. Why? Because an area grows in two directions at once: across AND up. Two times two to three times three. We call this the square ratio: square both numbers of the side ratio.",
        { on: ["mA"], add: ["mA.all"], cue: { "mA.all": "four to nine" }, pause: 0.8 });
      push("A cube goes one direction further. A cube with edges of two is two layers, each of two by two, four. That's eight little cubes. A cube with edges of three is three layers of nine: twenty-seven.",
        { on: ["a2", "cu", "k3"], off: ["a1", "sq", "mA", "k2"], add: ["cu.build"], cue: { "cu.build": "a cube with edges of two" }, transition: card("Idea 3", "Volumes cube it"), pause: 0.6 });
      push("So the volumes are eight to twenty-seven. A volume grows in THREE directions: across, up and back. Two cubed to three cubed. That's the cube ratio: cube both numbers of the side ratio.",
        { on: ["mV"], add: ["mV.all"], cue: { "mV.all": "eight to twenty-seven" }, pause: 0.8 });
      push("And you can go backwards. If two areas are in the ratio four to nine, the sides are the square roots: two to three.",
        { on: ["sq", "mB1", "k4"], off: ["cu", "mV", "k3", "a2"], add: ["sq.draw", "sq.grid", "sq.count", "mB1.all"], cue: { "mB1.all": "square roots" },
          transition: card("Idea 4", "Going back: the roots"), pause: 0.6 });
      push("If two volumes are in the ratio eight to twenty-seven, the edges are the cube roots: two to three again.",
        { on: ["cu", "mB2"], off: ["sq", "mB1"], add: ["cu.build", "mB2.all"], cue: { "mB2.all": "cube roots" }, pause: 0.8 });
      push("So: lengths and perimeters keep the ratio. Areas square it. Volumes cube it. And before you use any ratio, ask whether it's a length, an area or a volume you're looking at.");
    },
  });
}

/* ═══ THE SHAPE QUESTIONS: one film, three kinds ═══════════════════════════ */
function shapeFilm({ kind }) {
  const C = {
    perimeter: { q: "Two squares have sides in the ratio 2:3. The perimeter of the smaller square is 24 cm. Find the perimeter of the larger square.",
      r: [2, 3], small: 24, unit: "cm", word: "perimeter", how: "same", tex: "2 : 3" },
    area: { q: "The sides of two squares are in the ratio 2:3. The area of the smaller square is 36 cm². Find the area of the larger square.",
      r: [4, 9], small: 36, unit: "square centimetres", word: "area", how: "square", tex: "2^{2} : 3^{2} = 4 : 9" },
    volume: { q: "Two cubes have edges in the ratio 2:3. The volume of the smaller cube is 40 cm³. Find the volume of the larger cube.",
      r: [8, 27], small: 40, unit: "cubic centimetres", word: "volume", how: "cube", tex: "2^{3} : 3^{3} = 8 : 27" },
  }[kind];
  const [a, b] = C.r;
  const box = C.small / a, big = box * b;
  const unitTex = { perimeter: "\\text{ cm}", area: "\\text{ cm}^{2}", volume: "\\text{ cm}^{3}" }[kind];
  const pic = kind === "volume" ? () => cubes(2, 3) : () => squares(2, 3, { cells: kind === "area" });
  const ways = {
    perimeter: ["The small square's side is twenty-four shared into four sides... six centimetres.", "six", "The big square's side is three over two of that... nine. Four sides of nine: thirty-six centimetres.",
      "24 \\div 4 = 6", "6 \\times \\tfrac{3}{2} = 9,\\ \\ 4 \\times 9 = 36"],
    area: ["The small square's area is thirty-six, so its side is the square root... six centimetres.", "six", "The big square's side is three over two of six... nine. Nine times nine: eighty-one.",
      "\\sqrt{36} = 6", "6 \\times \\tfrac{3}{2} = 9,\\ \\ 9^{2} = 81"],
    volume: ["Every length of the big cube is three over two times the small one's, in three directions.", "", "So its volume is forty times three over two, cubed: forty times twenty-seven over eight... one hundred and thirty-five.",
      "\\left(\\tfrac{3}{2}\\right)^{3} = \\tfrac{27}{8}", "40 \\times \\tfrac{27}{8} = 135"],
  }[kind];
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: C.q }],
    pics: {
      sh: pic,
      mR: () => main([L("a", `\\text{${C.word}s}`), L("e", "="), L("b", C.tex, BLUE)], 7),
      b1: () => twoRows(["Smaller", "Larger"], [a, b], { known: { row: 0, text: String(C.small) } }),
      b2: () => twoRows(["Smaller", "Larger"], [a, b], { text: String(box), known: { row: 0, text: String(C.small) } }),
      mU: () => main([L("a", `${C.small} \\div ${a}`), L("e", "="), L("b", String(box), BLUE)]),
      mX: () => main([L("a", `${b} \\times ${box}`), L("e", "="), L("b", `${big}${unitTex}`, GREEN)]),
      w1: () => main([L("a", ways[3])], 7),
      w2: () => main([L("a", ways[4])], 6.6),
    },
    picAt: { sh: centred(150, 17), mR: at(37.5), b1: twoAt(b), b2: twoAt(b), mU: at(37.5), mX: at(37.5), w1: at(37.5), w2: at(37.5) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: kind === "perimeter" ? "Same ratio, box method" : `The ${C.how} ratio`, y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: kind === "volume" ? "The scale factor, cubed" : "Find the side first", y: 50.5 },
    ],
    stages: {
      "sh.draw": (s, H) => (kind === "volume" ? cubeBuild(s, H) : sqDraw(["A", "B"])(s, H)),
      "sh.more": (s, H) => { if (kind === "perimeter") sqLit(["A", "B"])(s, H); if (kind === "area") { sqGrid(["A", "B"])(s, H); sqCount(["A", "B"])(s, H); } },
      "b1.r0": rowGrow(0), "b1.r1": rowGrow(1), "b1.known": (s, H) => H.draw(braceOf(s, "below-0-0"), 0),
      "b2.base": (s, H) => { showBars(s, H); H.show(braceOf(s, "below-0-0")); }, "b2.fill": fill,
      "b2.big": (s, H) => mb(s, "bar", 1).forEach((n) => H.lit(n, 0.2, 2.4)),
      "mR.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); },
      "mU.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); },
      "mX.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); H.sound("ding", 1.5); },
      "w1.all": (s, H) => write(s, H, ["a"], 0), "w2.all": (s, H) => { write(s, H, ["a"], 0); H.sound("ding", 1.2); },
    },
    steps: ({ push }) => {
      push(`Two ${kind === "volume" ? "cubes" : "squares"}, with ${kind === "volume" ? "edges" : "sides"} in the ratio two to three. We know the smaller one's ${C.word}, and we want the larger one's. The first question is always: is the ${C.word} a length, an area or a volume?`,
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push(kind === "perimeter"
        ? "A perimeter is a length: the distance round the edge. So the perimeters keep the SAME ratio as the sides, two to three."
        : kind === "area"
          ? "An area grows two ways, across and up. Count the little squares: four in the small one, nine in the big one. So the areas are in the SQUARE ratio, four to nine, not two to three."
          : "A volume grows three ways. The small cube is two layers of four, eight little cubes; the big one is three layers of nine, twenty-seven. So the volumes are in the CUBE ratio, eight to twenty-seven.",
        { on: ["sh", "mR", "k1"], add: ["sh.draw", "sh.more", "mR.all"], cue: { "mR.all": kind === "perimeter" ? "keep the same" : kind === "area" ? "four to nine" : "eight to twenty" },
          transition: card("Method 1", kind === "perimeter" ? "Same ratio, box method" : `The ${C.how} ratio`), pause: 0.8 });
      push(`Now it's an ordinary ratio question. The smaller ${C.word} is ${a === 2 ? "two" : a === 4 ? "four" : "eight"} boxes, and the larger is ${b === 3 ? "three" : b === 9 ? "nine" : "twenty-seven"} boxes of the same size. And the smaller is ${C.small}.`,
        { on: ["b1"], off: ["sh", "mR"], add: ["b1.r0", "b1.r1", "b1.known"], cue: { "b1.known": "and the smaller" }, pause: 0.6 });
      push(`So one box is ${C.small} shared into ${a}... ${box}. Write ${box} in every box.`,
        { on: ["b2", "mU"], off: ["b1"], add: ["b2.base", "mU.all", "b2.fill"], cue: { "mU.all": "shared into", "b2.fill": `write ${box}` }, pause: 0.8 });
      push(`The larger is ${b} boxes. ${b} times ${box}... ${big} ${C.unit}.`,
        { on: ["mX"], off: ["mU"], add: ["b2.big", "mX.all"], cue: { "mX.all": `${b} times` }, pause: 1 });
      push(`Now another way. ${ways[0]}`,
        { on: ["w1", "k2"], off: ["b2", "mX", "k1"], add: ["w1.all"], cue: { "w1.all": "another way" },
          transition: card("Method 2", kind === "volume" ? "The scale factor, cubed" : "Find the side first"), pause: 0.6 });
      push(ways[2], { on: ["w2"], off: ["w1"], add: ["w2.all"], cue: { "w2.all": kind === "volume" ? "so its volume" : "the big square" }, pause: 1 });
      push(`Two ways, one answer: ${big}. Lengths keep a ratio, areas square it, volumes cube it.`);
    },
  });
}
export const ratioPerimeter = () => shapeFilm({ kind: "perimeter" });
export const ratioArea = () => shapeFilm({ kind: "area" });
export const ratioVolume = () => shapeFilm({ kind: "volume" });

/* ═══ AGES ═════════════════════════════════════════════════════════════════ */
/* The rows share one small box (a sixth of the bar). Now: son 1 box, father 4. Later: son 1 BIG
   box, father 2 big boxes. The age GAP never changes, so the later gap (1 big box) is the gap now
   (3 small boxes): cut the big boxes into three, and the son grew by 2 small boxes = 20 years. */
function ageRows() {
  const X0 = 30, ROW = 9, GAP = 4.5, TOP = 3, U = 100 / 6;
  const rows = [
    { name: "Son now", n: 1, every: 1, fill: SKY }, { name: "Father now", n: 4, every: 1, fill: BUTTER },
    { name: "Son later", n: 3, every: 3, fill: LEAF }, { name: "Father later", n: 6, every: 3, fill: PEACH },
  ];
  let o = "";
  rows.forEach((r, i) => {
    const y = TOP + i * (ROW + GAP) + (i >= 2 ? 3 : 0), w = r.n * U;
    o += texAt(`\\text{${r.name}}`, X0 - 3, y + ROW * 0.68, { em: 4, anchor: "end", attrs: `data-mb="name" data-k="n${i}"` });
    o += `<rect data-mb="bar" data-k="r${i}" x="${X0}" y="${y}" width="${w.toFixed(2)}" height="${ROW}" fill="${r.fill}" stroke="${INK}" stroke-width="0.7"/>`;
    for (let k = 1; k < r.n; k++) {
      o += `<g data-mb="brace" data-mb-key="d${i}-${k}" data-cut="${k % r.every === 0 ? "base" : "cut"}"><path d="M${(X0 + k * U).toFixed(2)} ${y} V${y + ROW}" fill="none" stroke="${INK}" stroke-width="0.55"/></g>`;
    }
    if (i === 2) o += `<g data-mb="brace" data-mb-key="grow"><path d="M${(X0 + U).toFixed(2)} ${y + ROW + 1.5} Q${(X0 + 2 * U).toFixed(2)} ${y + ROW + 5} ${(X0 + 3 * U).toFixed(2)} ${y + ROW + 1.5}" fill="none" stroke="#c0453f" stroke-width="0.7"/>`
      + `<text x="${(X0 + 2 * U).toFixed(2)}" y="${y + ROW + 8.5}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="3.6" fill="#c0453f">20 years</text></g>`;
  });
  return svgBox(150, TOP * 2 + 4 * ROW + 3 * GAP + 13, o);
}
export function ratioAges() {
  const row = (i) => (s, H) => {
    const n = key(s, `n${i}`), r = key(s, `r${i}`);
    if (n) H.write(n, 0);
    if (r) H.grow(r, 0.2);
    [...(s?.querySelectorAll(`[data-mb-key^="d${i}-"][data-cut="base"]`) || [])].forEach((g, j) => H.draw(g, 0.8 + j * 0.15));
  };
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "A father is 4 times as old as his son. In 20 years' time, he will be twice as old as his son. How old is the son now?" }],
    pics: {
      ag: () => ageRows(),
      mG: () => main([L("a", "\\text{gap now} = 3\\ \\text{boxes}"), L("e", ",\\quad"), L("b", "\\text{gap later} = 1\\ \\text{big box}", BLUE)], 6),
      mC: () => main([L("a", "1\\ \\text{big box}"), L("e", "="), L("b", "3\\ \\text{boxes}", BLUE)]),
      mY: () => main([L("a", "2\\ \\text{boxes} = 20"), L("e", ",\\quad"), L("b", "1\\ \\text{box} = 10", GREEN)], 7),
      e1: () => main([L("a", "\\text{son } x,\\ \\ \\text{father } 4x")], 7),
      e2: () => main([L("a", "4x + 20 = 2(x + 20)")], 7.4),
      e3: () => main([L("a", "4x + 20 = 2x + 40"), L("e", "\\Rightarrow"), L("b", "x = 10", GREEN)], 6.8),
      sK: () => svgBox(48, 30, mathRow([L("a", "30 : 60 = 1 : 2\\ \\checkmark", GREEN)], { cx: 24, y: 12, em: 4.6 }).svg),
    },
    picAt: { ag: centred(150, 12), mG: at(40), mC: at(40), mY: at(40), e1: at(30), e2: at(30), e3: at(30), sK: { x: 79.5, y: 16 } },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "The gap never changes", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "An equation", y: 50.5 },
    ],
    stages: {
      "ag.r0": row(0), "ag.r1": row(1), "ag.r2": row(2), "ag.r3": row(3),
      "ag.cut": (s, H) => [2, 3].forEach((i) => [...(s?.querySelectorAll(`[data-mb-key^="d${i}-"][data-cut="cut"]`) || [])].forEach((g, j) => H.draw(g, 0.2 + j * 0.15))),
      "ag.grow": (s, H) => H.draw(braceOf(s, "grow"), 0.2),
      "mG.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["e", "b"], 1.4, 0.4); },
      "mC.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); },
      "mY.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["e", "b"], 1.4, 0.4); H.sound("ding", 1.9); },
      "e1.all": (s, H) => write(s, H, ["a"], 0), "e2.all": (s, H) => write(s, H, ["a"], 0),
      "e3.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.6); write(s, H, ["b"], 1.4); H.sound("ding", 1.6); },
      "sK.all": (s, H) => { write(s, H, ["a"], 0); H.sound("ding", 0.8); },
    },
    steps: ({ push }) => {
      push("A father is four times as old as his son. In twenty years, he'll be only twice as old. How old is the son now? Age questions have one secret, and once you see it they all open up.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Draw now. The son is one box, and the father is four of the same boxes, because he's four times as old.",
        { on: ["ag", "k1"], add: ["ag.r0", "ag.r1"], cue: { "ag.r0": "the son is one", "ag.r1": "the father is four" }, transition: card("Method 1", "The gap never changes"), pause: 0.6 });
      push("Twenty years later he's twice as old. So the son later is one BIG box, and the father two big boxes. But careful: these big boxes are NOT the same size as the boxes now, because both of them have grown older.",
        { add: ["ag.r2", "ag.r3"], cue: { "ag.r2": "the son later", "ag.r3": "the father two" }, pause: 0.6 });
      push("Here's the secret. The gap between their ages NEVER changes: when the son gets twenty years older, so does the father. Now, the gap is three boxes. Later, the gap is one big box.",
        { on: ["mG"], add: ["mG.all"], cue: { "mG.all": "now, the gap" }, pause: 0.8 });
      push("The same gap, so one big box must be three small boxes. CUT every big box into three. The son later is three boxes, and the father later is six.",
        { on: ["mC"], off: ["mG"], add: ["ag.cut", "mC.all"], cue: { "ag.cut": "cut every big box", "mC.all": "must be three" }, pause: 0.8 });
      push("Now compare the son. He was one box, and twenty years later he's three boxes. So those two extra boxes are the twenty years. One box is ten. The son is ten years old now.",
        { on: ["mY"], off: ["mC"], add: ["ag.grow", "mY.all"], cue: { "ag.grow": "two extra boxes", "mY.all": "one box is ten" }, pause: 0.8 });
      push("Check it. The son is ten and the father forty, four times as old. In twenty years they're thirty and sixty, and sixty is twice thirty. It works.",
        { on: ["sK"], add: ["sK.all"], cue: { "sK.all": "thirty and sixty" }, pause: 1 });
      push("Now with an equation. Call the son's age x. Then the father's age is four x.",
        { on: ["e1", "k2"], off: ["ag", "mY", "sK", "k1"], add: ["e1.all"], cue: { "e1.all": "call the son" }, transition: card("Method 2", "An equation"), pause: 0.6 });
      push("In twenty years both add twenty: the father is four x plus twenty, the son x plus twenty, and the father is twice the son.",
        { on: ["e2"], off: ["e1"], add: ["e2.all"], cue: { "e2.all": "the father is four x" }, pause: 0.6 });
      push("Open the bracket: four x plus twenty equals two x plus forty. Take two x and twenty from both sides: two x is twenty, so x is ten.",
        { on: ["e3"], off: ["e2"], add: ["e3.all"], cue: { "e3.all": "open the bracket" }, pause: 1 });
      push("Two ways, one answer: ten. In any age question, remember that everybody gets older by the same amount, so the GAP between two ages never changes.");
    },
  });
}
