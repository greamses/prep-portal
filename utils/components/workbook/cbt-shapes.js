/* ============================================================================
   SHAPE AND PATTERN FILMS FOR CBT QUESTIONS
   ----------------------------------------------------------------------------
     stairs-24   Scholastic upper primary 2022 first round, Q24: "Ololade can
                 build this set of 3 stairs with 12 blocks. How many blocks
                 will she need to build a set of 6 stairs?" (42)
                 Method 1, look from the side: 1 + 2 + 3 = 6 squares, so the
                 staircase is 12 / 6 = 2 deep; 1 + ... + 6 = 21, times 2.
                 Method 2, make a rectangle: the back layer turned upside down
                 on the front fills n by (n + 1): 3 x 4 = 12, so 6 x 7 = 42.

   Same layout and kit as ./cbt-films.js: the question small at the top, the
   one picture being worked in the centre, extra sums in the margin, the method
   on a receipt, MathJax, sounds, a title card before each method.
   ========================================================================== */

import { braceOf, film } from "./film-kit.js";
import { mathLoad, texAt } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W } from "./cbt-films.js";

const INK = "#2a2723", RED = "#c0453f", BLUE = "#2f6f8f", GREEN = "#2f7d4a";
const FRONT = "#bfe3ff", BACK = "#ffd9cf";

/* the question's own drawing of the 3-stair staircase (12 cubes, 2 deep) */
const ISO = `<path d="M28.8,92.0 L49.6,104.0 L49.6,80.0 L28.8,68.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,92.0 L49.6,104.0 L49.6,80.0 L70.4,68.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,56.0 L70.4,68.0 L49.6,80.0 L28.8,68.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,68.0 L49.6,80.0 L49.6,56.0 L28.8,44.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,68.0 L49.6,80.0 L49.6,56.0 L70.4,44.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,32.0 L70.4,44.0 L49.6,56.0 L28.8,44.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,44.0 L49.6,56.0 L49.6,32.0 L28.8,20.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,44.0 L49.6,56.0 L49.6,32.0 L70.4,20.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,8.0 L70.4,20.0 L49.6,32.0 L28.8,20.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M8.0,104.0 L28.8,116.0 L28.8,92.0 L8.0,80.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,104.0 L28.8,116.0 L28.8,92.0 L49.6,80.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,68.0 L49.6,80.0 L28.8,92.0 L8.0,80.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,104.0 L70.4,116.0 L70.4,92.0 L49.6,80.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M91.1,104.0 L70.4,116.0 L70.4,92.0 L91.1,80.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,68.0 L91.1,80.0 L70.4,92.0 L49.6,80.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M8.0,80.0 L28.8,92.0 L28.8,68.0 L8.0,56.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,80.0 L28.8,92.0 L28.8,68.0 L49.6,56.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,44.0 L49.6,56.0 L28.8,68.0 L8.0,56.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,80.0 L70.4,92.0 L70.4,68.0 L49.6,56.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M91.1,80.0 L70.4,92.0 L70.4,68.0 L91.1,56.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,44.0 L91.1,56.0 L70.4,68.0 L49.6,56.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M8.0,56.0 L28.8,68.0 L28.8,44.0 L8.0,32.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,56.0 L28.8,68.0 L28.8,44.0 L49.6,32.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,20.0 L49.6,32.0 L28.8,44.0 L8.0,32.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,116.0 L49.6,128.0 L49.6,104.0 L28.8,92.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,116.0 L49.6,128.0 L49.6,104.0 L70.4,92.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,80.0 L70.4,92.0 L49.6,104.0 L28.8,92.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,116.0 L91.1,128.0 L91.1,104.0 L70.4,92.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M111.9,116.0 L91.1,128.0 L91.1,104.0 L111.9,92.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M91.1,80.0 L111.9,92.0 L91.1,104.0 L70.4,92.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28.8,92.0 L49.6,104.0 L49.6,80.0 L28.8,68.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,92.0 L49.6,104.0 L49.6,80.0 L70.4,68.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,56.0 L70.4,68.0 L49.6,80.0 L28.8,68.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M49.6,128.0 L70.4,140.0 L70.4,116.0 L49.6,104.0 Z" fill="#cbd5e1" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M91.1,128.0 L70.4,140.0 L70.4,116.0 L91.1,104.0 Z" fill="#94a3b8" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M70.4,92.0 L91.1,104.0 L70.4,116.0 L49.6,104.0 Z" fill="#f1f5f9" stroke="#1f2937" stroke-width="1.2" stroke-linejoin="round"/>`;

/* a staircase seen from the side: column i is i squares high, built from the bottom */
function profile(n, cell, ox, oy, key = "c") {
  let out = "";
  for (let i = 1; i <= n; i++) {
    for (let h = 1; h <= i; h++) {
      out += `<rect data-mb="cell" data-k="${key}${i}_${h}" x="${(ox + (i - 1) * cell).toFixed(2)}" y="${(oy - h * cell).toFixed(2)}" width="${cell}" height="${cell}" fill="${FRONT}" stroke="${INK}" stroke-width="0.5"/>`;
    }
    out += texAt(String(i), ox + (i - 0.5) * cell, oy + cell * 0.95, { em: Math.min(6, cell * 0.75), color: BLUE, attrs: `data-mb="num" data-k="${key}n${i}"` });
  }
  return out;
}

/* the front layer and the back layer turned upside down on top of it: n across, n + 1 up */
function rectangle(n, cell, ox, oy) {
  let out = "";
  for (let i = 1; i <= n; i++) {
    for (let h = 1; h <= i; h++) {
      out += `<rect data-mb="cell" data-k="f${i}_${h}" x="${(ox + (i - 1) * cell).toFixed(2)}" y="${(oy - h * cell).toFixed(2)}" width="${cell}" height="${cell}" fill="${FRONT}" stroke="${INK}" stroke-width="0.5"/>`;
    }
    for (let h = i + 1; h <= n + 1; h++) {
      out += `<rect data-mb="cell" data-k="b${i}_${h}" x="${(ox + (i - 1) * cell).toFixed(2)}" y="${(oy - h * cell).toFixed(2)}" width="${cell}" height="${cell}" fill="${BACK}" stroke="${INK}" stroke-width="0.5"/>`;
    }
  }
  const W = n * cell, H = (n + 1) * cell;
  /* the rectangle drawn round them, and what its sides are */
  out += `<g data-mb="brace" data-mb-key="frame"><path d="M${ox} ${oy} h${W} v${-H} h${-W} Z" fill="none" stroke="${RED}" stroke-width="1"/></g>`;
  out += texAt(`${n}\\ \\text{across}`, ox + W / 2, oy + cell * 0.95, { em: 5, color: RED, attrs: 'data-mb="num" data-k="wa"' });
  out += texAt(`${n + 1}\\ \\text{up}`, ox + W + 3, oy - H / 2 + 2, { em: 5, color: RED, anchor: "start", attrs: 'data-mb="num" data-k="hu"' });
  return out;
}


/* ── A STAIRCASE OF REAL BLOCKS, each one its own mark, so it can be BUILT ──────
   Isometric cubes: column x is x + 1 blocks high, `depth` blocks deep. They are
   drawn back to front (so a near block covers a far one) but numbered in the
   order a builder lays them: the bottom row first, back before front, left to
   right. A stage drops them in that order. Faces in the question's own greys. */
function isoStairs(n, a, { depth = 2, key = "k", maxW = 140, maxH = 58 } = {}) {
  const c = a * 0.866;
  const P = (x, y, z) => [(x - y) * c, (x + y) * a * 0.5 - z * a];
  const cubes = [];
  for (let x = 0; x < n; x++) for (let y = 0; y < depth; y++) for (let z = 0; z <= x; z++) cubes.push({ x, y, z });
  const pts = cubes.flatMap(({ x, y, z }) => [P(x, y, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z), P(x + 1, y, z + 1), P(x, y, z + 1), P(x + 1, y + 1, z)]);
  const minX = Math.min(...pts.map((q) => q[0])), maxX = Math.max(...pts.map((q) => q[0]));
  const minY = Math.min(...pts.map((q) => q[1])), maxY = Math.max(...pts.map((q) => q[1]));
  const poly = (list, fill) => `<path d="M${list.map((q) => `${(q[0] - minX).toFixed(2)},${(q[1] - minY).toFixed(2)}`).join(" L")} Z" fill="${fill}" stroke="#1f2937" stroke-width="${(a * 0.06).toFixed(2)}" stroke-linejoin="round"/>`;
  /* the builder's order */
  const built = cubes.slice().sort((p1, p2) => p1.z - p2.z || p2.y - p1.y || p1.x - p2.x);
  const order = new Map(built.map((q, i) => [q, i]));
  /* the painter's order */
  const drawn = cubes.slice().sort((p1, p2) => (p1.x + p1.y) - (p2.x + p2.y) || p1.z - p2.z);
  const body = drawn.map((q) => {
    const { x, y, z } = q;
    return `<g data-mb="cell" data-k="${key}${order.get(q)}">`
      + poly([P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], "#cbd5e1")
      + poly([P(x + 1, y, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x + 1, y, z + 1)], "#94a3b8")
      + poly([P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], "#f1f5f9")
      + `</g>`;
  }).join("");
  const w = maxX - minX, h = maxY - minY;
  return { body, w, h, count: cubes.length };
}
/* a built staircase, centred in a drawing 150 wide */
const isoPic = (n, a, key, H = 60) => {
  const st = isoStairs(n, a, { key });
  return svgBox(150, H, `<g transform="translate(${(75 - st.w / 2).toFixed(2)} ${(H - st.h - 2).toFixed(2)})">${st.body}</g>`);
};
/* drop every block in the builder's order, `gap` seconds apart */
const build = (s, H, key, count, gap) => {
  for (let i = 0; i < count; i++) { const n = s?.querySelector(`[data-k="${key}${i}"]`); if (n) H.drop(n, i * gap); }
};

export function stairs24() {
  const K = PIC_W / PAPER;
  const PIC = (h) => svgBox(150, h, "");
  const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
  const write = (s, H, keys, start = 0, gap = 0.3) => keys.forEach((k, i) => { const n = key(s, k); if (n) H.write(n, start + i * gap); });
  const column = (pre, i) => [...Array.from({ length: i }, (_, h) => `${pre}${i}_${h + 1}`)];
  const MAIN_W = 150;
  const main = (pieces, em = 8) => svgBox(MAIN_W, 30, mathRow(pieces, { cx: MAIN_W / 2, y: 17, em }).svg);
  const SIDE_W = 48;
  const side = (rows, em = 5.2) => svgBox(SIDE_W, 12 * rows.length + 4, rows.map((pieces, i) => mathRow(pieces, { cx: SIDE_W / 2, y: 9 + i * 12, em }).svg).join(""));
  const at = (y) => centred(150, y);

  /* every column of a profile, one stage each, so it builds as its number is said */
  const columnStages = (pic, pre, n) => Object.fromEntries(Array.from({ length: n }, (_, j) => {
    const i = j + 1;
    return [`${pic}.c${i}`, (s, H) => { write(s, H, column(pre, i), 0, 0.12); write(s, H, [`${pre}n${i}`], 0.12 * i + 0.1); }];
  }));

  return film({
    paperMm: PAPER,
    picW: PIC_W,
    ready: mathLoad(),
    asks: [{ id: "a1", text: "Ololade Abigail can build this set of 3 stairs with 12 blocks. How many blocks will she need to build a set of 6 stairs?" }],
    pics: {
      /* the staircase in the question, built block by block; and at the end the six-stair one, all 42 */
      iso: () => isoPic(3, 11, "k", 60),
      big: () => isoPic(6, 6.2, "g", 60),
      p3: () => svgBox(150, 48, profile(3, 11, 75 - 16.5, 40)),
      p6: () => svgBox(150, 52, profile(6, 6.4, 75 - 19.2, 46, "d")),
      r3: () => svgBox(150, 52, rectangle(3, 9.5, 75 - 14.25, 46)),
      r6: () => svgBox(150, 56, rectangle(6, 6, 75 - 18, 50)),
      mA: () => main([{ k: "a", tex: "1 + 2 + 3" }, { k: "e", tex: "=" }, { k: "b", tex: "6\\ \\text{squares}", color: BLUE }]),
      mB: () => main([{ k: "a", tex: "12 \\div 6" }, { k: "e", tex: "=" }, { k: "b", tex: "2\\ \\text{deep}", color: BLUE }]),
      mC: () => main([{ k: "a", tex: "1 + 2 + 3 + 4 + 5 + 6" }, { k: "e", tex: "=" }, { k: "b", tex: "21", color: BLUE }]),
      mD: () => main([{ k: "a", tex: "21 \\times 2" }, { k: "e", tex: "=" }, { k: "b", tex: "42", color: GREEN }]),
      mE: () => main([{ k: "a", tex: "6 \\times 7" }, { k: "e", tex: "=" }, { k: "b", tex: "42\\ \\text{blocks}", color: GREEN }], 9),
      sI: () => svgBox(SIDE_W, 46, `<svg x="10" y="0" width="28" height="34.5" viewBox="0 0 120 148">${ISO}</svg>`
        + texAt("\\text{2 blocks deep}", SIDE_W / 2, 43, { em: 4.4, color: RED, attrs: 'data-mb="num" data-k="t"' })),
      s3: () => side([[{ k: "a", tex: "3 \\times 4 = 12" }], [{ k: "b", tex: "\\checkmark\\ \\text{all 12 blocks}", color: GREEN }]]),
    },
    picAt: {
      iso: at(17), big: at(15), p3: at(18), p6: at(17), r3: at(17), r6: at(16),
      mA: at(38.5), mB: at(38.5), mC: at(38.5), mD: at(38.5), mE: at(38),
      sI: { x: 79.5, y: 18 }, s3: { x: 79.5, y: 22 },
    },
    lines: [
      { id: "m1", receipt: true, sub: "Method 1", text: "Look from the side", y: 49 },
      { id: "m2", receipt: true, sub: "Method 2", text: "Make a rectangle", y: 49 },
    ],
    stages: {
      "iso.build": (s, H) => build(s, H, "k", 12, 0.22),
      "big.build": (s, H) => build(s, H, "g", 42, 0.07),
      ...columnStages("p3", "c", 3),
      ...columnStages("p6", "d", 6),
      "mA.sum": (s, H) => write(s, H, ["a"], 0),
      "mA.ans": (s, H) => { write(s, H, ["e", "b"], 0, 0.35); },
      "mB.all": (s, H) => write(s, H, ["a", "e", "b"], 0, 0.45),
      "sI.all": (s, H) => write(s, H, ["t"], 0.6),
      "mC.sum": (s, H) => write(s, H, ["a"], 0),
      "mC.ans": (s, H) => write(s, H, ["e", "b"], 0, 0.35),
      "mD.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.4); write(s, H, ["b"], 1.2); H.sound("ding", 1.4); },
      "r3.front": (s, H) => { for (let i = 1; i <= 3; i++) write(s, H, column("f", i), (i - 1) * 0.4, 0.1); },
      "r3.back": (s, H) => { let d = 0; for (let i = 3; i >= 1; i--) for (let h = 4; h > i; h--) { const n = key(s, `b${i}_${h}`); if (n) H.drop(n, d); d += 0.18; } },
      "r3.frame": (s, H) => { H.draw(braceOf(s, "frame"), 0); write(s, H, ["wa", "hu"], 0.6, 0.5); },
      "s3.all": (s, H) => { write(s, H, ["a"], 0); write(s, H, ["b"], 0.9); H.sound("ding", 1.0); },
      "r6.front": (s, H) => { for (let i = 1; i <= 6; i++) write(s, H, column("f", i), (i - 1) * 0.25, 0.05); },
      "r6.back": (s, H) => { let d = 0; for (let i = 6; i >= 1; i--) for (let h = 7; h > i; h--) { const n = key(s, `b${i}_${h}`); if (n) H.drop(n, d); d += 0.07; } },
      "r6.frame": (s, H) => { H.draw(braceOf(s, "frame"), 0); write(s, H, ["wa", "hu"], 0.6, 0.5); },
      "mE.all": (s, H) => { write(s, H, ["a", "e"], 0, 0.4); write(s, H, ["b"], 1.0); H.sound("ding", 1.2); },
    },
    steps: ({ push }) => {
      push("Ololade built a staircase. Three stairs.", { on: ["a1", "iso"], add: ["iso.build"], transition: "iris", pause: 0.8 });
      push("And it took her twelve blocks.", { pause: 0.6 });
      push("Now she wants six stairs. How many blocks will that take?", { pause: 1.4 });
      push("Here's a trick. Don't count the blocks yet. Look at the staircase from the side.", { pause: 0.6 });
      push("From the side, the first step is one square. The next is two. The top is three.",
        { on: ["p3", "m1"], off: ["iso"], add: ["p3.c1", "p3.c2", "p3.c3"],
          cue: { "p3.c1": "one square", "p3.c2": "two", "p3.c3": "three" },
          transition: { kind: "card", title: "Method 1", sub: "Look from the side", hold: 1.6 }, pause: 0.6 });
      push("One, plus two, plus three... six squares.", { on: ["mA"], add: ["mA.sum", "mA.ans"], cue: { "mA.sum": "one, plus", "mA.ans": "six squares" }, pause: 0.8 });
      push("But she used twelve blocks, not six. So where are the other six?", { pause: 1.6 });
      push("Behind. The staircase is two blocks deep. Twelve divided by six... two.",
        { on: ["sI", "mB"], off: ["mA"], add: ["sI.all", "mB.all"], cue: { "sI.all": "behind", "mB.all": "twelve divided" }, pause: 0.8 });
      push("So every square you see from the side has another block behind it. You follow me?", { pause: 1.4 });
      push("Now six stairs. From the side: one, two, three, four, five, six.",
        { on: ["p6"], off: ["p3", "mB", "sI"], add: ["p6.c1", "p6.c2", "p6.c3", "p6.c4", "p6.c5", "p6.c6"],
          cue: { "p6.c1": "one,", "p6.c2": "two,", "p6.c3": "three,", "p6.c4": "four,", "p6.c5": "five,", "p6.c6": "six." }, pause: 0.6 });
      push("Add them up. One plus two plus three plus four plus five plus six... twenty one.",
        { on: ["mC"], add: ["mC.sum", "mC.ans"], cue: { "mC.sum": "one plus", "mC.ans": "twenty one" }, pause: 0.8 });
      push("Twenty one squares from the side. And every one of them is two blocks deep.", { pause: 0.8 });
      push("Twenty one times two... forty two.", { on: ["mD"], off: ["mC"], add: ["mD.all"], cue: { "mD.all": "twenty one times" }, pause: 0.8 });
      push("So she needs forty two blocks. Here they are, all forty two. Option A.",
        { on: ["big"], off: ["p6"], add: ["big.build"], cue: { "big.build": "here they are" }, pause: 1.4 });

      push("Now a quicker way. It's a lovely one.",
        { on: ["m2"], off: ["p6", "big", "mD", "m1"], transition: { kind: "card", title: "Method 2", sub: "Make a rectangle", hold: 1.6 }, pause: 0.6 });
      push("Back to three stairs. Here's the front layer of the staircase.",
        { on: ["r3"], add: ["r3.front"], cue: { "r3.front": "front layer" }, pause: 0.6 });
      push("Now take the back layer, turn it upside down, and put it on top.",
        { add: ["r3.back"], cue: { "r3.back": "upside down" }, pause: 0.8 });
      push("Look what it makes. A rectangle. Three across, and four up.",
        { add: ["r3.frame"], cue: { "r3.frame": "a rectangle" }, pause: 0.8 });
      push("Three times four is twelve. That's all twelve blocks, both layers.",
        { on: ["s3"], add: ["s3.all"], cue: { "s3.all": "three times four" }, pause: 1 });
      push("So for six stairs, it's the same thing. Six across... and one more than six up. Seven.",
        { on: ["r6"], off: ["r3", "s3"], add: ["r6.front", "r6.back", "r6.frame"],
          cue: { "r6.front": "same thing", "r6.back": "six across", "r6.frame": "one more" }, pause: 0.8 });
      push("Six times seven... forty two.", { on: ["mE"], add: ["mE.all"], cue: { "mE.all": "six times" }, pause: 1 });
      push("Same answer, and no adding up at all.", { pause: 0.8 });
      push("So for a staircase two blocks deep, the blocks are the number of stairs, times one more. Three times four. Six times seven. Try ten stairs yourself.");
    },
  });
}
