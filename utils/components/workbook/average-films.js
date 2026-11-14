/* ============================================================================
   AVERAGES — three lessons and the competition questions
   ----------------------------------------------------------------------------
   Lessons
     avgMean      the mean is SHARING OUT EQUALLY: columns levelled (the tops
                  above the line fill the gaps below it); total ÷ how many;
                  mean × how many = total; one number rolls, the mean rolls
     avgMMR       median, mode and range: the number cards slide into ORDER;
                  the middle one (or the two middles, averaged); the most
                  often; biggest − smallest — a table, and the traps
     avgTotals    averages through TOTALS: adding, removing, swapping one; and
                  the trap — the mean of two groups is not the mean of means
   Worked questions (competition papers)
     levelFilm    one number added to a group whose mean is known: the 13th
                  number, the sixth number, the grandfather — totals, and
                  levelling (the new one tops every other up to the new mean)
     swapFilm     a boy leaves, a girl joins, the mean drops 0.1
     groupsFilm   30 boys mean 6, x girls mean 8, total 468
     statsFilm    median / mode / mean / range from a list: cards sorted
   Same kit and rules as the ratio and percentage films: one question, numbers
   ROLL when an example changes, boxes cut/merge, MathJax, title cards.
   ========================================================================== */

import { film } from "./film-kit.js";
import { mathLoad } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W } from "./cbt-films.js";
import { rollAsk } from "./film-ask.js";

const INK = "#2a2723", BLUE = "#2f6f8f", GREEN = "#2f7d4a", PURPLE = "#6b4fa0", RED = "#c0453f";
const SKY = "#bfe3ff", BUTTER = "#fff3a8", LEAF = "#c8f0c0", PEACH = "#ffd7a3", PALE = "#e6e0d6";
const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
const main = (pieces, em = 8) => svgBox(150, 30, mathRow(pieces, { cx: 75, y: 17, em }).svg);
const at = (y) => centred(150, y);
const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const keys = (s, prefix) => [...(s?.querySelectorAll(`[data-k^="${prefix}"]`) || [])];
const write = (s, H, ks, start = 0, gap = 0.35) => ks.forEach((k, i) => { const n = key(s, k); if (n) H.write(n, start + i * gap); });
const card = (title, sub) => ({ kind: "card", title, sub, hold: 1.6 });
const line = (s, H, ding = false) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); if (ding) H.sound("ding", 1.5); };
const isInstant = (H) => H.show === H.grow;
const S = (x, y, size, t, anchor = "middle", fill = INK, w = 400) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="STIX Two Text, Cambria Math, serif" font-weight="${w}" font-size="${size}" fill="${fill}">${t}</text>`;
const T = (k, x, y, size, anchor = "middle", fill = INK) => `<text data-k="${k}" x="${x}" y="${y}" text-anchor="${anchor}" font-family="STIX Two Text, Cambria Math, serif" font-size="${size}" fill="${fill}">0</text>`;
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));
const W = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty-one"];
const word = (n) => W[n] || fmt(n);

const roll = (vals) => (s, H) => {
  Object.entries(vals).forEach(([k, v]) => {
    const el = key(s, k);
    if (!el) return;
    if (typeof v === "string") { el.textContent = v; return; }
    const from = Number(el.textContent);
    if (isInstant(H) || !Number.isFinite(from) || from === v) { el.textContent = fmt(v); return; }
    const t0 = performance.now();
    const tick = (now) => {
      if (!el.isConnected) return;
      const t = Math.min(1, (now - t0) / 900);
      const now2 = from + (v - from) * (1 - Math.pow(1 - t, 3));
      el.textContent = fmt(Number.isInteger(v) && Number.isInteger(from) ? Math.round(now2) : Math.round(now2 * 10) / 10);
      if (t < 1) requestAnimationFrame(tick); else el.textContent = fmt(v);
    };
    requestAnimationFrame(tick);
  });
  if (!isInstant(H)) H.sound("tick", 0);
};
const vis = (on = [], off = []) => (s, H) => {
  const instant = isInstant(H);
  on.forEach((k) => { const n = key(s, k); if (!n) return; n.style.transition = instant ? "" : "opacity .5s"; n.style.opacity = "1"; });
  off.forEach((k) => { const n = key(s, k); if (!n) return; n.style.transition = instant ? "" : "opacity .5s"; n.style.opacity = "0"; });
};

/* ── COLUMNS: values side by side, a mean line, the tops that fill the gaps ── */
const CX = 18, CW = 116, CB = 44, CH = 33;
function columns(values, mean, { names = null, unit = null, tones = null } = {}) {
  const n = values.length, w = Math.min(14, (CW / n) * 0.78), gap = CW / n;
  const u = unit || CH / Math.max(...values, mean);
  let o = `<g data-mb="name" data-k="axis"><path d="M${CX - 2} ${CB} H${CX + CW + 2}" stroke="${INK}" stroke-width="0.7"/></g>`;
  values.forEach((v, i) => {
    const x = CX + i * gap + (gap - w) / 2, top = CB - v * u, mTop = CB - mean * u;
    o += `<rect data-mb="bar" data-k="c${i}" x="${x.toFixed(2)}" y="${top.toFixed(2)}" width="${w.toFixed(2)}" height="${(v * u).toFixed(2)}" fill="${tones?.[i] || SKY}" stroke="${INK}" stroke-width="0.6"/>`;
    if (v > mean) o += `<rect data-mb="num" data-k="top${i}" x="${x.toFixed(2)}" y="${top.toFixed(2)}" width="${w.toFixed(2)}" height="${((v - mean) * u).toFixed(2)}" fill="${PEACH}" stroke="${RED}" stroke-width="0.6" stroke-dasharray="1.2 0.8"/>`;
    if (v < mean) o += `<rect data-mb="num" data-k="gap${i}" x="${x.toFixed(2)}" y="${mTop.toFixed(2)}" width="${w.toFixed(2)}" height="${((mean - v) * u).toFixed(2)}" fill="${LEAF}" stroke="${GREEN}" stroke-width="0.6"/>`;
    o += `<g data-mb="num" data-k="v${i}">${S(x + w / 2, top - 1.5, Math.min(4.4, w * 0.6), fmt(v))}</g>`;
    if (names) o += `<g data-mb="name" data-k="n${i}">${S(x + w / 2, CB + 4.5, 3.4, names[i])}</g>`;
  });
  const my = CB - mean * u;
  o += `<g data-mb="brace" data-mb-key="mline"><path d="M${CX - 2} ${my.toFixed(2)} H${CX + CW + 2}" stroke="${BLUE}" stroke-width="0.7" stroke-dasharray="2 1.2"/></g>`;
  o += `<g data-mb="num" data-k="mlab">${S(CX + CW + 3, my + 1.4, 4, `mean ${fmt(mean)}`, "start", BLUE)}</g>`;
  return svgBox(150, 52, o);
}
const growCols = (n) => (s, H) => { const ax = key(s, "axis"); if (ax) H.show(ax); for (let i = 0; i < n; i++) { const c = key(s, `c${i}`); if (c) H.grow(c, 0.2 + i * Math.min(0.2, 2 / n)); const v = key(s, `v${i}`); if (v) H.write(v, 0.6 + i * Math.min(0.2, 2 / n)); const nm = key(s, `n${i}`); if (nm) H.write(nm, 0.4 + i * 0.1); } };
const meanLine = (s, H) => { H.draw(s?.querySelector('[data-mb-key="mline"]'), 0); const l = key(s, "mlab"); if (l) H.write(l, 0.5); };
/** the tops ABOVE the line come off, and the gaps BELOW it are filled: the columns level */
const level = (s, H) => {
  keys(s, "top").forEach((n, i) => { H.show(n); if (!isInstant(H)) { n.style.transition = "opacity .8s .9s"; } n.style.opacity = isInstant(H) ? "0" : "1"; if (!isInstant(H)) requestAnimationFrame(() => { n.style.opacity = "0"; }); });
  keys(s, "gap").forEach((n, i) => H.write(n, 1.2 + i * 0.25));
  keys(s, "v").forEach((n) => { n.style.transition = isInstant(H) ? "" : "opacity .5s 1.6s"; n.style.opacity = "0"; });
  if (!isInstant(H)) H.sound("pop", 1.2);
};
const showTops = (s, H) => keys(s, "top").forEach((n, i) => H.lit(n, 0.2 + i * 0.15, 2.4));

/* ═══ LESSON 1: THE MEAN ════════════════════════════════════════════════════ */
export function avgMean() {
  const V = [2, 7, 4, 6, 6], N = ["Ade", "Bola", "Chidi", "Dayo", "Efe"];
  const q = (pairs) => (svg, H, stage) => { const inner = stage?.querySelector('[data-t="a1"]')?.firstChild; pairs.forEach(([f, t]) => rollAsk(inner, f, t, { instant: isInstant(H) })); };
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "Ade has 2 sweets, Bola has 7, Chidi has 4, and Dayo and Efe have 6 each. If they share them out equally, how many does each get?" }],
    pics: {
      c1: () => columns(V, 5, { names: N }),
      c2: () => columns([7, 7, 4, 6, 6], 6, { names: N, unit: 38 / 7 }),
      mr: () => svgBox(150, 30, `<g data-mb="num" data-k="mr">${S(26, 20, 10, "total", "start")}${T("tot", 68, 20, 11, "end")}${S(82, 20, 11, "÷ 5 =")}${T("mn", 95, 20, 11, "start", GREEN)}</g>`),
      mT: () => main([L("a", "\\text{mean} \\times \\text{how many}"), L("e", "="), L("b", "\\text{total}", BLUE)], 7),
      mT2: () => main([L("a", "5 \\times 5"), L("e", "="), L("b", "25", BLUE)]),
    },
    picAt: { c1: centred(150, 22), c2: centred(150, 22), mr: at(36), mT: at(36), mT2: at(36) },
    lines: [
      { id: "k1", receipt: true, sub: "Idea 1", text: "The mean: share it out equally", y: 50.5 },
      { id: "k2", receipt: true, sub: "Idea 2", text: "Total ÷ how many", y: 50.5 },
      { id: "k3", receipt: true, sub: "Idea 3", text: "Mean × how many = total", y: 50.5 },
    ],
    stages: {
      "c1.grow": growCols(5), "c1.tops": showTops, "c1.line": meanLine, "c1.level": level,
      "mr.v": (s, H) => { H.show(key(s, "mr")); roll({ tot: 25, mn: 5 })(s, H); },
      "q.7": q([["2", 7]]),
      "c2.grow": (s, H) => { growCols(5)(s, H); meanLine(s, H); },
      "mr.v2": roll({ tot: 30, mn: 6 }),
      "q.2": q([["2", 2]]),
      "mT.all": (s, H) => line(s, H), "mT2.all": (s, H) => line(s, H, true),
    },
    steps: ({ push }) => {
      push("Five friends have two, seven, four, six and six sweets. If they share them out fairly, so everybody has the same, how many does each get? That fair share has a name: the MEAN.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Draw each friend's sweets as a column. Ade's is short, Bola's is tall. Not fair at all.",
        { on: ["c1", "k1"], add: ["c1.grow"], cue: { "c1.grow": "draw each" }, transition: card("Idea 1", "The mean: share it out equally"), pause: 0.6 });
      push("Sharing out equally means the tall columns give their tops to the short ones, until every column is the same height. Bola has two extra, Dayo and Efe one each.",
        { add: ["c1.tops"], cue: { "c1.tops": "give their tops" }, pause: 0.6 });
      push("Watch the tops come off and fill the gaps. Ade gets three, Chidi gets one... and now every column stops at the same line: five. The mean is five.",
        { add: ["c1.line", "c1.level"], cue: { "c1.line": "watch the tops", "c1.level": "fill the gaps" }, pause: 0.8 });
      push("You don't have to move sweets every time. Put them all together: two plus seven plus four plus six plus six is twenty-five. Share twenty-five between five friends: five each. Mean equals total divided by how many.",
        { on: ["mr", "k2"], off: ["k1"], add: ["mr.v"], cue: { "mr.v": "put them all" }, transition: card("Idea 2", "Total ÷ how many"), pause: 0.8 });
      push("Same question, new number: watch Ade's two roll up to seven. The total rolls up by five, to thirty, and shared between five, the mean rolls up to six.",
        { on: ["c2"], off: ["c1"], add: ["q.7", "c2.grow", "mr.v2"], cue: { "q.7": "watch Ade's", "mr.v2": "the total rolls" }, pause: 0.8 });
      push("And it works backwards, which is what most competition questions need. If you know the mean and how many, you know the TOTAL: mean times how many.",
        { on: ["c1", "mT", "k3"], off: ["c2", "mr", "k2"], add: ["q.2", "c1.grow", "c1.line", "c1.level", "mT.all"], cue: { "mT.all": "mean times" }, transition: card("Idea 3", "Mean × how many = total"), pause: 0.6 });
      push("Five friends with a mean of five had twenty-five sweets between them, whatever the separate amounts were. Find the total first, and most averages questions open up.",
        { on: ["mT2"], off: ["mT"], add: ["mT2.all"], cue: { "mT2.all": "twenty-five sweets" }, pause: 1 });
      push("So: the mean is what everyone gets when it's shared out equally. Mean is total divided by how many, and total is mean times how many.");
    },
  });
}

/* ── NUMBER CARDS that slide into order ─────────────────────────────────── */
function cards(values) {
  const n = values.length, gap = Math.min(12, 140 / n), w = gap * 0.82, x0 = 75 - (gap * n) / 2;
  const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((p) => p[1]);
  let o = "";
  values.forEach((v, i) => {
    const x = x0 + i * gap;
    o += `<g data-mb="num" data-k="k${i}" data-dx="${((order.indexOf(i) - i) * gap).toFixed(2)}"><rect x="${x.toFixed(2)}" y="6" width="${w.toFixed(2)}" height="${(w * 1.25).toFixed(2)}" fill="#fffdf8" stroke="${INK}" stroke-width="0.6"/>`
      + S(x + w / 2, 6 + w * 0.85, Math.min(6, w * 0.55), fmt(v)) + `</g>`;
  });
  return svgBox(150, 32, o);
}
const dealCards = (n) => (s, H) => { for (let i = 0; i < n; i++) H.write(key(s, `k${i}`), 0.2 + i * Math.min(0.2, 2.4 / n)); };
const sortCards = (s, H) => {
  keys(s, "k").forEach((g) => {
    g.style.transition = isInstant(H) ? "" : "transform 1.2s cubic-bezier(.5,0,.2,1)";
    g.style.transform = `translateX(${g.dataset.dx}px)`;
  });
  if (!isInstant(H)) H.sound("snip", 0.1);
};
/* the card at SORTED position p */
const cardAt = (s, p) => keys(s, "k").find((g) => Math.abs(Number(g.dataset.dx) + Number(g.dataset.k.slice(1)) * 0) >= 0 && order(s).indexOf(g) === p);
const order = (s) => keys(s, "k").slice().sort((a, b) => (Number(a.dataset.k.slice(1)) + Number(a.dataset.dx) / step(s)) - (Number(b.dataset.k.slice(1)) + Number(b.dataset.dx) / step(s)));
const step = (s) => { const ks = keys(s, "k"); if (ks.length < 2) return 1; const a = ks[0].querySelector("rect"), b = ks[1].querySelector("rect"); return Number(b.getAttribute("x")) - Number(a.getAttribute("x")) || 1; };
const litSorted = (positions, hold = 3) => (s, H) => positions.forEach((p, i) => { const g = order(s)[p]; if (g) H.lit(g.querySelector("rect"), 0.2 + i * 0.3, hold, "#c0453f"); });
const litValue = (v, hold = 3) => (s, H) => keys(s, "k").forEach((g, i) => { if (g.textContent.trim() === fmt(v)) H.lit(g.querySelector("rect"), 0.2 + i * 0.08, hold, "#c0453f"); });

/* ═══ LESSON 2: MEDIAN, MODE AND RANGE ═════════════════════════════════════ */
function statsTable() {
  const R = [["Mean", "share out equally", "total ÷ how many"], ["Median", "the middle one", "in ORDER first"], ["Mode", "the most often", "a value, not a count"], ["Range", "the spread", "biggest − smallest"]];
  const X = [10, 40, 85], WD = [30, 45, 55], RH = 7.5;
  let o = "";
  R.forEach((r, i) => {
    o += `<g data-mb="num" data-k="tr${i}">` + r.map((c, j) => `<rect x="${X[j]}" y="${2 + i * RH}" width="${WD[j]}" height="${RH}" fill="${j === 0 ? [SKY, BUTTER, LEAF, PEACH][i] : "#fffdf8"}" stroke="${INK}" stroke-width="0.4"/>`
      + `<text x="${X[j] + WD[j] / 2}" y="${2 + i * RH + 5}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="${j === 0 ? 800 : 600}" font-size="3.4" fill="${INK}">${c}</text>`).join("") + `</g>`;
  });
  return svgBox(150, 4 + 4 * RH, o);
}
export function avgMMR() {
  const V = [7, 3, 9, 3, 5, 8, 4];
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "The marks of seven pupils are 7, 3, 9, 3, 5, 8 and 4. Find the median, the mode and the range." }],
    pics: {
      tb: () => statsTable(),
      cd: () => cards(V),
      c8: () => cards([...V, 6]),
      mM: () => main([L("a", "\\text{median}"), L("e", "="), L("b", "5", GREEN)]),
      mW: () => main([L("a", "\\text{middle of the unsorted list} = 3"), L("e", "\\quad"), L("b", "\\text{wrong!}", RED)], 6.2),
      m8: () => main([L("a", "\\tfrac{5 + 6}{2}"), L("e", "="), L("b", "5.5", GREEN)]),
      mO: () => main([L("a", "\\text{mode}"), L("e", "="), L("b", "3\\ \\ (\\text{not } 2)", GREEN)]),
      mR: () => main([L("a", "9 - 3"), L("e", "="), L("b", "6", GREEN)]),
    },
    picAt: { tb: centred(150, 13), cd: centred(150, 15), c8: centred(150, 15), mM: at(36), mW: at(36), m8: at(36), mO: at(36), mR: at(36) },
    lines: [
      { id: "k1", receipt: true, sub: "The four", text: "mean, median, mode, range", y: 50.5 },
      { id: "k2", receipt: true, sub: "Median", text: "in order, then the middle", y: 50.5 },
      { id: "k3", receipt: true, sub: "Mode and range", text: "most often; biggest − smallest", y: 50.5 },
    ],
    stages: {
      "tb.r0": (s, H) => H.write(key(s, "tr0"), 0), "tb.r1": (s, H) => H.write(key(s, "tr1"), 0), "tb.r2": (s, H) => H.write(key(s, "tr2"), 0), "tb.r3": (s, H) => H.write(key(s, "tr3"), 0),
      "cd.deal": dealCards(7), "cd.wrong": (s, H) => { const g = key(s, "k3"); if (g) H.lit(g.querySelector("rect"), 0.2, 3); },
      "cd.sort": sortCards, "cd.mid": litSorted([3]),
      "c8.deal": (s, H) => { dealCards(8)(s, H); }, "c8.sort": sortCards, "c8.mid": litSorted([3, 4]),
      "cd.mode": litValue(3), "cd.range": litSorted([0, 6]),
      ...Object.fromEntries(["mM", "mW", "m8", "mO", "mR"].map((m) => [`${m}.all`, (s, H) => line(s, H, m !== "mW")])),
    },
    steps: ({ push }) => {
      push("Seven pupils got seven, three, nine, three, five, eight and four. Find the median, the mode and the range. Along with the mean, these are the four averages and spreads you'll meet, so let's put them in one table first.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("The mean, you know: share it out equally, total divided by how many.",
        { on: ["tb", "k1"], add: ["tb.r0"], cue: { "tb.r0": "the mean" }, transition: card("The four", "mean, median, mode, range"), pause: 0.4 });
      push("The median is the MIDDLE one, but only once the numbers are in order.",
        { add: ["tb.r1"], cue: { "tb.r1": "the median" }, pause: 0.4 });
      push("The mode is the value that comes up most often. And the range is how spread out they are: the biggest take away the smallest.",
        { add: ["tb.r2", "tb.r3"], cue: { "tb.r2": "the mode", "tb.r3": "the range" }, pause: 0.8 });
      push("Here are the seven marks as cards, in the order they were given. Here's the trap: the card in the middle of THIS list is a three. That is NOT the median, because the list isn't in order yet.",
        { on: ["cd", "mW", "k2"], off: ["tb", "k1"], add: ["cd.deal", "cd.wrong", "mW.all"], cue: { "cd.wrong": "here's the trap", "mW.all": "is not the median" },
          transition: card("Median", "in order, then the middle"), pause: 0.6 });
      push("So line them up, smallest to biggest. Watch the cards slide into order: three, three, four, five, seven, eight, nine.",
        { off: ["mW"], add: ["cd.sort"], cue: { "cd.sort": "watch the cards" }, pause: 0.6 });
      push("Seven cards: the middle one has three on each side. It's the fourth card, five. The median is five.",
        { on: ["mM"], add: ["cd.mid", "mM.all"], cue: { "cd.mid": "the middle one", "mM.all": "the median is" }, pause: 0.8 });
      push("Add an eighth pupil with six. Now there's no single middle card: two of them share the middle, five and six. Take the number halfway between them, the mean of the two: five and a half.",
        { on: ["c8", "m8"], off: ["cd", "mM"], add: ["c8.deal", "c8.sort", "c8.mid", "m8.all"], cue: { "c8.sort": "add an eighth", "c8.mid": "two of them", "m8.all": "halfway" }, pause: 0.8 });
      push("Back to the seven. The mode: which value comes up most? Three, twice. So the mode is THREE. Not two: two is how many times, and the mode is the value itself.",
        { on: ["cd", "mO", "k3"], off: ["c8", "m8", "k2"], add: ["cd.mode", "mO.all"], cue: { "cd.mode": "which value", "mO.all": "the mode is three" },
          transition: card("Mode and range", "most often; biggest − smallest"), pause: 0.8 });
      push("And the range: the biggest, nine, take away the smallest, three. The range is six.",
        { on: ["mR"], off: ["mO"], add: ["cd.range", "mR.all"], cue: { "cd.range": "the biggest", "mR.all": "the range is six" }, pause: 1 });
      push("So: put the numbers in ORDER before you look for the median, give the mode as a value, and take the smallest from the biggest for the range.");
    },
  });
}

/* ═══ LESSON 3: AVERAGES THROUGH TOTALS ════════════════════════════════════ */
export function avgTotals() {
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [
      { id: "a1", text: "The mean of four numbers is 6. A fifth number is added and the mean becomes 7. What is the fifth number?" },
      { id: "a2", text: "Class A has 10 pupils with a mean score of 8. Class B has 30 pupils with a mean score of 4. What is the mean of all 40 pupils?" },
    ],
    pics: {
      c1: () => columns([6, 6, 6, 6, 11], 7, { unit: 38 / 11, tones: [SKY, SKY, SKY, SKY, BUTTER] }),
      m1: () => main([L("a", "4 \\times 6 = 24"), L("e", ",\\quad"), L("b", "5 \\times 7 = 35", BLUE)], 7),
      m2: () => main([L("a", "35 - 24"), L("e", "="), L("b", "11", GREEN)]),
      m3: () => main([L("a", "7 + 4 \\times 1"), L("e", "="), L("b", "11", GREEN)]),
      mW: () => main([L("a", "\\tfrac{8 + 4}{2} = 6"), L("e", "\\quad"), L("b", "\\text{wrong!}", RED)], 7),
      mA: () => main([L("a", "10 \\times 8 + 30 \\times 4 = 200"), L("e", ",\\quad"), L("b", "\\tfrac{200}{40} = 5", GREEN)], 6.4),
    },
    picAt: { c1: centred(150, 22), m1: at(36), m2: at(36), m3: at(36), mW: at(36), mA: at(36) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Through the totals", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "Top everyone up", y: 50.5 },
      { id: "k3", receipt: true, sub: "The trap", text: "a mean of means", y: 50.5 },
    ],
    stages: {
      "c1.grow": growCols(5), "c1.line": meanLine, "c1.level": level,
      ...Object.fromEntries(["m1", "m2", "m3", "mW", "mA"].map((m) => [`${m}.all`, (s, H) => line(s, H, m !== "mW" && m !== "m1")])),
    },
    steps: ({ push }) => {
      push("The mean of four numbers is six. A fifth number joins, and the mean goes up to seven. What's the fifth number? Two ways, and then a trap.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Method one: totals. Four numbers with a mean of six add up to four sixes, twenty-four. Five numbers with a mean of seven add up to thirty-five.",
        { on: ["m1", "k1"], add: ["m1.all"], cue: { "m1.all": "four numbers" }, transition: card("Method 1", "Through the totals"), pause: 0.6 });
      push("The new number made the difference: thirty-five take away twenty-four, eleven.",
        { on: ["m2"], off: ["m1"], add: ["m2.all"], cue: { "m2.all": "made the difference" }, pause: 0.8 });
      push("Method two, with columns. The four old numbers level out at six. The new one has to be seven itself, AND give one to each of the other four to lift them from six to seven.",
        { on: ["c1", "k2"], off: ["m2", "k1"], add: ["c1.grow", "c1.line", "c1.level"], cue: { "c1.line": "the new one", "c1.level": "give one" }, transition: card("Method 2", "Top everyone up"), pause: 0.6 });
      push("So it's seven, plus four lots of one: eleven. Same answer.",
        { on: ["m3"], add: ["m3.all"], cue: { "m3.all": "seven, plus" }, pause: 0.8 });
      push("Now the trap. Ten pupils have a mean of eight; thirty pupils have a mean of four. It's tempting to say the mean of everyone is halfway, six. That's wrong.",
        { on: ["a2", "mW", "k3"], off: ["a1", "c1", "m3", "k2"], add: ["mW.all"], cue: { "mW.all": "it's tempting" }, transition: card("The trap", "a mean of means"), pause: 0.6 });
      push("There are three times as many pupils in the second class, so they pull harder. Use the totals: ten eights, eighty, and thirty fours, a hundred and twenty. Two hundred, shared between forty pupils... five.",
        { on: ["mA"], off: ["mW"], add: ["mA.all"], cue: { "mA.all": "use the totals" }, pause: 1 });
      push("So whenever groups join, leave or swap, work with TOTALS: mean times how many. And never average two averages unless the groups are the same size.");
    },
  });
}

/* ═══ WORKED: ONE NUMBER JOINS A GROUP ═════════════════════════════════════ */
function levelFilm(cfg) {
  const { n, a, b } = cfg;            // n others with mean a; with the new one, mean b
  const x = b + n * (b - a), T1 = n * a, T2 = (n + 1) * b;
  const vals = [...Array(n).fill(a), x];
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: cfg.question }],
    pics: {
      m1: () => main([L("a", `${n} \\times ${fmt(a)} = ${fmt(T1)}`), L("e", ",\\quad"), L("b", `${n + 1} \\times ${fmt(b)} = ${fmt(T2)}`, BLUE)], 7),
      m2: () => main([L("a", `${fmt(T2)} - ${fmt(T1)}`), L("e", "="), L("b", fmt(x), GREEN)]),
      cl: () => columns(vals, b, { unit: 38 / x, tones: [...Array(n).fill(SKY), BUTTER] }),
      m3: () => main([L("a", `${fmt(b)} + ${n} \\times ${fmt(b - a)}`), L("e", "="), L("b", fmt(x), GREEN)]),
    },
    picAt: { m1: at(30), m2: at(30), cl: centred(150, 22), m3: at(37) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Through the totals", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "Level them up", y: 50.5 },
    ],
    stages: {
      "m1.all": (s, H) => line(s, H), "m2.all": (s, H) => line(s, H, true), "m3.all": (s, H) => line(s, H, true),
      "cl.grow": growCols(n + 1), "cl.line": meanLine, "cl.level": level,
    },
    steps: ({ push }) => {
      push(cfg.story, { on: ["a1"], transition: "iris", pause: 0.6 });
      push(`Method one: totals. ${cfg.groupA}: ${word(n)} times ${fmt(a)}, ${fmt(T1)}. ${cfg.groupB}: ${word(n + 1)} times ${fmt(b)}, ${fmt(T2)}.`,
        { on: ["m1", "k1"], add: ["m1.all"], cue: { "m1.all": "method one" }, transition: card("Method 1", "Through the totals"), pause: 0.8 });
      push(`The only difference between the two totals is ${cfg.it}: ${fmt(T2)} take away ${fmt(T1)}... ${fmt(x)}.`,
        { on: ["m2"], off: ["m1"], add: ["m2.all"], cue: { "m2.all": "take away" }, pause: 0.8 });
      push(`Method two, with columns. The other ${word(n)} level out at ${fmt(a)} each. ${cfg.It} has to be ${fmt(b)} itself, the new mean, AND lift every one of the ${word(n)} others by ${fmt(b - a)}, from ${fmt(a)} up to ${fmt(b)}.`,
        { on: ["cl", "k2"], off: ["m2", "k1"], add: ["cl.grow", "cl.line", "cl.level"], cue: { "cl.line": "has to be", "cl.level": "and lift" }, transition: card("Method 2", "Level them up"), pause: 0.8 });
      push(`So ${cfg.it} is ${fmt(b)}, plus ${word(n)} lots of ${fmt(b - a)}: ${fmt(x)}. Two ways, one answer.`,
        { on: ["m3"], add: ["m3.all"], cue: { "m3.all": "plus" }, pause: 1 });
      push(`Whenever one joins or leaves a group, compare the TOTALS. ${cfg.closing || ""}`);
    },
  });
}
export const avgThirteenth = () => levelFilm({ n: 12, a: 3, b: 5,
  question: "The mean of twelve positive numbers is 3. When another number is added, the mean becomes 5. Find the thirteenth number.",
  story: "Twelve numbers have a mean of three. One more number joins them, and the mean jumps to five. That new number must be a big one. How big?",
  groupA: "Twelve numbers with a mean of three", groupB: "thirteen numbers with a mean of five", it: "the thirteenth number", It: "The new number" });
export const avgSixth = () => levelFilm({ n: 5, a: 50, b: 60,
  question: "The mean of a set of six numbers is 60. If the mean of the first five is 50, find the sixth number in the set.",
  story: "Six numbers have a mean of sixty, but the first five on their own only have a mean of fifty. So the sixth one must be pulling the mean up. By how much?",
  groupA: "The first five, mean fifty", groupB: "all six, mean sixty", it: "the sixth number", It: "The sixth number" });
export const avgGrandfather = () => levelFilm({ n: 20, a: 12, b: 14,
  question: "In a family of 21 people, the average age is 14 years. If the age of the grandfather is not counted, the average age drops to 12 years. What is the age of the grandfather?",
  story: "Twenty-one people in a family have an average age of fourteen. Leave the grandfather out, and the other twenty average only twelve. He's the one pulling the average up.",
  groupA: "The twenty without him, average twelve", groupB: "all twenty-one, average fourteen", it: "the grandfather's age", It: "Grandfather",
  closing: "The grandfather is fifty-four." });

/* ═══ WORKED: A BOY LEAVES, A GIRL JOINS ═══════════════════════════════════ */
export function avgSwap() {
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "The arithmetic mean of the ages of 30 pupils in a class is 15.3 years. One boy leaves the class and one girl is enrolled, and the new average age of 30 pupils in the class becomes 15.2 years. How much older is the boy than the girl?" }],
    pics: {
      m1: () => main([L("a", "30 \\times 15.3 = 459"), L("e", ",\\quad"), L("b", "30 \\times 15.2 = 456", BLUE)], 7),
      m2: () => main([L("a", "459 - 456"), L("e", "="), L("b", "3\\ \\text{years}", GREEN)]),
      m3: () => main([L("a", "30 \\times 0.1"), L("e", "="), L("b", "3\\ \\text{years}", GREEN)]),
    },
    picAt: { m1: at(28), m2: at(28), m3: at(28) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Through the totals", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "Everyone loses a little", y: 50.5 },
    ],
    stages: Object.fromEntries(["m1", "m2", "m3"].map((m) => [`${m}.all`, (s, H) => line(s, H, m !== "m1")])),
    steps: ({ push }) => {
      push("Thirty pupils, average age fifteen point three. A boy leaves, a girl joins, still thirty pupils, and the average drops to fifteen point two. How much older was the boy?",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Method one: totals. Before, thirty times fifteen point three, four hundred and fifty-nine years. After, thirty times fifteen point two, four hundred and fifty-six.",
        { on: ["m1", "k1"], add: ["m1.all"], cue: { "m1.all": "before" }, transition: card("Method 1", "Through the totals"), pause: 0.8 });
      push("Everybody else is the same, so the whole drop is the boy swapped for the girl: three years. The boy is three years older.",
        { on: ["m2"], off: ["m1"], add: ["m2.all"], cue: { "m2.all": "the whole drop" }, pause: 0.8 });
      push("Method two, quicker. The average dropped by point one for each of the thirty pupils. Thirty lots of point one is three years: that's what the swap took out of the class.",
        { on: ["m3", "k2"], off: ["m2", "k1"], add: ["m3.all"], cue: { "m3.all": "thirty lots" }, transition: card("Method 2", "Everyone loses a little"), pause: 1 });
      push("Two ways, one answer: three years. When one is swapped for another, the change in the total is the difference between them.");
    },
  });
}

/* ═══ WORKED: TWO GROUPS, ONE TOTAL ════════════════════════════════════════ */
export function avgGroups() {
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "Thirty boys and x girls sat for a test. The mean of the boys' scores and that of the girls were respectively 6 and 8. Find x if the total score was 468." }],
    pics: {
      m1: () => main([L("a", "30 \\times 6"), L("e", "="), L("b", "180", BLUE)]),
      m2: () => main([L("a", "468 - 180"), L("e", "="), L("b", "288", BLUE)]),
      m3: () => main([L("a", "288 \\div 8"), L("e", "="), L("b", "36", GREEN)]),
      e1: () => main([L("a", "30 \\times 6 + 8x = 468")], 7.4),
      e2: () => main([L("a", "8x = 288"), L("e", "\\Rightarrow"), L("b", "x = 36", GREEN)], 7.4),
    },
    picAt: { m1: at(28), m2: at(28), m3: at(28), e1: at(28), e2: at(28) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Totals, one group at a time", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "An equation", y: 50.5 },
    ],
    stages: { ...Object.fromEntries(["m1", "m2", "m3", "e2"].map((m) => [`${m}.all`, (s, H) => line(s, H, m === "m3" || m === "e2")])), "e1.all": (s, H) => write(s, H, ["a"], 0) },
    steps: ({ push }) => {
      push("Thirty boys and some girls sat a test. The boys averaged six, the girls eight, and all the scores together made four hundred and sixty-eight. How many girls?",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Turn each mean back into a total. Thirty boys averaging six scored thirty times six: a hundred and eighty.",
        { on: ["m1", "k1"], add: ["m1.all"], cue: { "m1.all": "thirty boys" }, transition: card("Method 1", "Totals, one group at a time"), pause: 0.6 });
      push("The rest of the four hundred and sixty-eight belongs to the girls: four sixty-eight take away a hundred and eighty, two hundred and eighty-eight.",
        { on: ["m2"], off: ["m1"], add: ["m2.all"], cue: { "m2.all": "the rest" }, pause: 0.6 });
      push("Each girl scored eight on average, so there are two hundred and eighty-eight divided by eight girls... thirty-six.",
        { on: ["m3"], off: ["m2"], add: ["m3.all"], cue: { "m3.all": "divided by" }, pause: 0.8 });
      push("Method two, as one equation. The boys' total plus the girls' total is the whole: thirty times six, plus eight x, equals four hundred and sixty-eight.",
        { on: ["e1", "k2"], off: ["m3", "k1"], add: ["e1.all"], cue: { "e1.all": "the boys' total" }, transition: card("Method 2", "An equation"), pause: 0.6 });
      push("A hundred and eighty plus eight x is four sixty-eight, so eight x is two hundred and eighty-eight, and x is thirty-six.",
        { on: ["e2"], off: ["e1"], add: ["e2.all"], cue: { "e2.all": "so eight x" }, pause: 1 });
      push("Two ways, one answer: thirty-six girls. A mean and a count always give you a total, and totals can be added and taken away; means can't.");
    },
  });
}

/* ═══ WORKED: STATISTICS FROM A LIST ═══════════════════════════════════════ */
function statsFilm(cfg) {
  const V = cfg.values, n = V.length, sorted = V.slice().sort((p, q) => p - q);
  const mids = n % 2 ? [(n - 1) / 2] : [n / 2 - 1, n / 2];
  const median = mids.reduce((t, i) => t + sorted[i], 0) / mids.length;
  const tally = {}; V.forEach((v) => { tally[v] = (tally[v] || 0) + 1; });
  const most = Math.max(...Object.values(tally)), mode = Number(Object.keys(tally).find((k) => tally[k] === most));
  const sum = V.reduce((t, v) => t + v, 0), mean = sum / n, range = sorted[n - 1] - sorted[0];
  const stat = { median, mode, mean, range };
  const pics = {
    cd: () => cards(V),
    sm: () => main([L("a", sorted.map(fmt).join(",\\ "))], n > 10 ? 4.4 : 6.4),
  };
  const stages = { "cd.deal": dealCards(n), "cd.sort": sortCards, "sm.all": (s, H) => write(s, H, ["a"], 0) };
  const steps = [];
  cfg.find.forEach((what, j) => {
    const id = `w${j}`;
    if (what === "median") {
      pics[id] = () => main([L("a", mids.length > 1 ? `\\tfrac{${fmt(sorted[mids[0]])} + ${fmt(sorted[mids[1]])}}{2}` : `\\text{the middle card}`), L("e", "="), L("b", `\\text{median} = ${fmt(median)}`, GREEN)], 6.6);
      stages[`cd.${id}`] = litSorted(mids);
      steps.push([`The median is the middle of the ORDERED cards. ${n} cards: ${mids.length > 1 ? `no single middle, so take the two middle ones, ${fmt(sorted[mids[0]])} and ${fmt(sorted[mids[1]])}, and go halfway: ${fmt(median)}.` : `the middle one is ${fmt(median)}.`}`, id]);
    } else if (what === "mode") {
      pics[id] = () => main([L("a", `${fmt(mode)}\\ \\text{comes up}\\ ${most}\\ \\text{times}`), L("e", "\\Rightarrow"), L("b", `\\text{mode} = ${fmt(mode)}`, GREEN)], 6.6);
      stages[`cd.${id}`] = litValue(mode);
      steps.push([`The mode is the value that comes up most often. ${fmt(mode)} appears ${word(most)} times, more than any other. So the mode is ${fmt(mode)}, the value, not ${word(most)}.`, id]);
    } else if (what === "mean") {
      pics[id] = () => main([L("a", `\\tfrac{${fmt(sum)}}{${n}}`), L("e", "="), L("b", `\\text{mean} = ${fmt(mean)}`, GREEN)], 6.6);
      stages[`cd.${id}`] = () => {};
      steps.push([`The mean is the total shared out equally. All ${word(n)} add up to ${fmt(sum)}, and ${fmt(sum)} divided by ${word(n)} is ${fmt(mean)}.`, id]);
    } else if (what === "range") {
      pics[id] = () => main([L("a", `${fmt(sorted[n - 1])} - ${fmt(sorted[0])}`), L("e", "="), L("b", `\\text{range} = ${fmt(range)}`, GREEN)], 6.6);
      stages[`cd.${id}`] = litSorted([0, n - 1]);
      steps.push([`The range is the biggest take away the smallest: ${fmt(sorted[n - 1])} take away ${fmt(sorted[0])}, ${fmt(range)}.`, id]);
    }
    stages[`${id}.all`] = (s, H) => line(s, H, true);
  });
  pics.ans = () => main([L("a", cfg.answerTex(stat))], 7.4);
  stages["ans.all"] = (s, H) => { write(s, H, ["a"], 0); H.sound("ding", 0.6); };
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: cfg.question }],
    pics,
    picAt: { cd: centred(150, 15), sm: at(33), ...Object.fromEntries(cfg.find.map((_, j) => [`w${j}`, at(33)])), ans: at(33) },
    lines: [
      { id: "k1", receipt: true, sub: "First", text: "put them in order", y: 50.5 },
      { id: "k2", receipt: true, sub: "Then", text: "read each one off", y: 50.5 },
    ],
    stages,
    steps: ({ push }) => {
      push(cfg.story, { on: ["a1"], transition: "iris", pause: 0.6 });
      push(`Lay the ${word(n)} numbers out as cards, just as they were given. Before anything else, put them in ORDER: watch them slide, smallest to biggest.`,
        { on: ["cd", "k1"], add: ["cd.deal", "cd.sort"], cue: { "cd.sort": "watch them slide" }, transition: card("First", "put them in order"), pause: 0.8 });
      steps.forEach(([say, id], j) => push(say, { on: [id, ...(j ? [] : ["k2"])], off: [...(j ? [`w${j - 1}`] : ["k1"])], add: [`cd.${id}`, `${id}.all`], cue: { [`${id}.all`]: say.split(" ").slice(2, 4).join(" ") },
        ...(j ? {} : { transition: card("Then", "read each one off") }), pause: 0.8 }));
      push(cfg.answerSay(stat), { on: ["ans"], off: [`w${steps.length - 1}`], add: ["ans.all"], cue: { "ans.all": "so" }, pause: 1 });
      push("Order first, then the median is the middle, the mode is the most common value, and the range is biggest minus smallest.");
    },
  });
}
export const avgMedianMode = () => statsFilm({ values: [5, 9, 3, 5, 7, 8], find: ["median", "mode"],
  question: "If M represents the median and D the mode of the measurements 5, 9, 3, 5, 7, 8, then (M, D) is",
  story: "Six measurements: five, nine, three, five, seven and eight. We want the median, M, and the mode, D, as a pair.",
  answerTex: (st) => `(M, D) = (${fmt(st.median)}, ${fmt(st.mode)})`, answerSay: (st) => `So M is ${fmt(st.median)} and D is ${fmt(st.mode)}: the pair is ${fmt(st.median)}, ${fmt(st.mode)}.` });
export const avgMeanMedian = () => statsFilm({ values: [3, 2, 8, 5, 7, 12, 9, 14], find: ["mean", "median"],
  question: "The numbers 3, 2, 8, 5, 7, 12, 9 and 14 are the marks scored by a group of students in a class test. If P is the mean and Q the median, then P + Q is",
  story: "Eight marks: three, two, eight, five, seven, twelve, nine and fourteen. P is the mean, Q the median, and we want P plus Q.",
  answerTex: (st) => `P + Q = ${fmt(st.mean)} + ${fmt(st.median)} = ${fmt(st.mean + st.median)}`, answerSay: (st) => `So P plus Q is ${fmt(st.mean)} plus ${fmt(st.median)}: ${fmt(st.mean + st.median)}.` });
export const avgRangeMode = () => statsFilm({ values: [10, 5, 10, 9, 8, 7, 7, 10, 8, 4, 6, 9, 10, 9, 10, 9, 7, 10, 6, 5], find: ["range", "mode"],
  question: "Find the sum of the range and the mode of the set of numbers 10, 5, 10, 9, 8, 7, 7, 10, 8, 4, 6, 9, 10, 9, 10, 9, 7, 10, 6, 5.",
  story: "Twenty numbers. We want the range and the mode, added together. Twenty is a lot to hold in your head, so let's sort them.",
  answerTex: (st) => `\\text{range} + \\text{mode} = ${fmt(st.range)} + ${fmt(st.mode)} = ${fmt(st.range + st.mode)}`, answerSay: (st) => `So the range plus the mode is ${fmt(st.range)} plus ${fmt(st.mode)}: ${fmt(st.range + st.mode)}.` });
