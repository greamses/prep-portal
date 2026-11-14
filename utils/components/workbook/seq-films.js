/* ============================================================================
   SEQUENCES AND SERIES — three lessons and the competition questions
   ----------------------------------------------------------------------------
   The picture is always the same: the terms as NUMBER CARDS in a row, with a
   jump ARC drawn from each card to the next and the gap written on it; a sum
   pairs cards with arcs UNDERNEATH (first with last). The cards' figures roll
   when the example changes, as in the ratio, percentage and averages films.
     seqRule     the rule is in the GAPS: +2, −2, then gaps that grow (+1, +2,
                 +3 …) and gaps that double — look at the gaps of the gaps
     seqNth      the nth term: first + (n − 1) jumps; the fence-post trap; how
                 many terms from 10 to 106
     seqSum      adding a series: pair first with last; average × how many;
                 the alternating series in pairs of −1
   Worked: ruleFilm (next / missing / wrong term), sumFilm (an arithmetic
   series, two ways), and four one-offs.
   ========================================================================== */

import { film } from "./film-kit.js";
import { mathLoad } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W } from "./cbt-films.js";

const INK = "#2a2723", BLUE = "#2f6f8f", GREEN = "#2f7d4a", RED = "#c0453f", PURPLE = "#6b4fa0";
const BUTTER = "#fff3a8", LEAF = "#c8f0c0";
const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
const main = (pieces, em = 8) => svgBox(150, 30, mathRow(pieces, { cx: 75, y: 17, em }).svg);
const at = (y) => centred(150, y);
const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const write = (s, H, ks, start = 0, gap = 0.35) => ks.forEach((k, i) => { const n = key(s, k); if (n) H.write(n, start + i * gap); });
const card = (title, sub) => ({ kind: "card", title, sub, hold: 1.6 });
const line = (s, H, ding = false) => { write(s, H, ["a", "e"], 0, 0.5); write(s, H, ["b"], 1.3); if (ding) H.sound("ding", 1.5); };
const isInstant = (H) => H.show === H.grow;
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");

/* ── THE ROW OF CARDS ───────────────────────────────────────────────────── */
/** terms: strings for the cards; arcs above every gap (labels later); pairs: [[i, j, label]] below */
function row(terms, { pairs = [], answer = -1 } = {}) {
  const n = terms.length, gap = Math.min(17, 136 / n), w = gap * 0.74, x0 = 75 - (gap * n) / 2 + (gap - w) / 2;
  const cx = (i) => x0 + i * gap + w / 2, Y = 15, HC = 11;
  let o = "";
  for (let i = 0; i < n - 1; i++) {
    const a = cx(i) + 1, b = cx(i + 1) - 1;
    o += `<g data-mb="brace" data-mb-key="arc${i}"><path d="M${a.toFixed(2)} ${Y - 0.5} Q${((a + b) / 2).toFixed(2)} ${Y - 7} ${b.toFixed(2)} ${Y - 0.5}" fill="none" stroke="${BLUE}" stroke-width="0.6"/></g>`;
    o += `<g data-mb="num" data-k="g${i}"><text data-k="gt${i}" x="${((a + b) / 2).toFixed(2)}" y="${Y - 6.2}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="${Math.min(4.4, gap * 0.34).toFixed(2)}" fill="${BLUE}"></text></g>`;
  }
  pairs.forEach(([i, j, lab], p) => {
    /* the widest pair hangs lowest, so the arcs nest and their labels never meet */
    const a = cx(i), b = cx(j), depth = 4 + (pairs.length - 1 - p) * 4.2;
    o += `<g data-mb="brace" data-mb-key="pr${p}"><path d="M${a.toFixed(2)} ${Y + HC + 0.5} Q${((a + b) / 2).toFixed(2)} ${Y + HC + depth * 2} ${b.toFixed(2)} ${Y + HC + 0.5}" fill="none" stroke="${PURPLE}" stroke-width="0.6"/>`
      + `<text x="${(b + 2).toFixed(2)}" y="${(Y + HC + depth * 0.62 + 2.6).toFixed(2)}" text-anchor="start" font-family="STIX Two Text, serif" font-size="3.6" fill="${PURPLE}">${esc(lab)}</text></g>`;
  });
  terms.forEach((t, i) => {
    const x = x0 + i * gap, isA = i === answer;
    o += `<g data-mb="num" data-k="k${i}"><rect x="${x.toFixed(2)}" y="${Y}" width="${w.toFixed(2)}" height="${HC}" fill="${isA ? BUTTER : "#fffdf8"}" stroke="${INK}" stroke-width="0.6"/>`
      + `<text data-k="t${i}" x="${(x + w / 2).toFixed(2)}" y="${Y + 7.6}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="${Math.min(5.4, w * 0.42).toFixed(2)}" fill="${isA ? GREEN : INK}">${esc(t)}</text></g>`;
  });
  return svgBox(150, 54, o);
}
const deal = (from, to) => (s, H) => { for (let i = from; i < to; i++) H.write(key(s, `k${i}`), 0.15 + (i - from) * 0.18); };
/** the arcs from..to-1, each with its gap written on it */
const arcs = (from, to, labels, color = null) => (s, H) => {
  for (let i = from; i < to; i++) {
    const g = s?.querySelector(`[data-mb-key="arc${i}"]`), t = key(s, `gt${i}`);
    if (t && labels[i - from] != null) { t.textContent = labels[i - from]; if (color) t.setAttribute("fill", color); }
    if (color && g) g.querySelector("path")?.setAttribute("stroke", color);
    H.draw(g, 0.2 + (i - from) * 0.45);
    H.write(key(s, `g${i}`), 0.45 + (i - from) * 0.45);
  }
};
/** set card figures (rolling numbers; strings at once) */
const setCards = (vals) => (s, H) => Object.entries(vals).forEach(([i, v]) => {
  const el = key(s, `t${i}`);
  if (!el) return;
  const from = Number(el.textContent), to = Number(v);
  if (isInstant(H) || !Number.isFinite(from) || !Number.isFinite(to) || el.textContent === "") { el.textContent = String(v); return; }
  const t0 = performance.now();
  const tick = (now) => {
    if (!el.isConnected) return;
    const k = Math.min(1, (now - t0) / 900);
    el.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
const hide = (ks) => (s, H) => ks.forEach((k) => { const n = key(s, k) || s?.querySelector(`[data-mb-key="${k}"]`); if (n) { n.style.transition = isInstant(H) ? "" : "opacity .4s"; n.style.opacity = "0"; } });
const reveal = (i, v) => (s, H) => { const el = key(s, `t${i}`); if (el) el.textContent = String(v); H.flip?.(el, String(v), 0.2); H.sound("ding", 0.5); };
const pairsDraw = (count) => (s, H) => { for (let p = 0; p < count; p++) H.draw(s?.querySelector(`[data-mb-key="pr${p}"]`), 0.2 + p * 0.5); };
const litCard = (i) => (s, H) => { const g = key(s, `k${i}`); if (g) H.lit(g.querySelector("rect"), 0.2, 3, RED); };

/* ═══ LESSON 1: FIND THE RULE ══════════════════════════════════════════════ */
export function seqRule() {
  const N = 7; // six terms and the next one
  const blank = (k) => Array.from({ length: k }, (_, i) => `k${i}`);
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "What comes next in each sequence? The rule is always hiding in the gaps." }],
    pics: { rw: () => row(["2", "4", "6", "8", "", "", "?"], { answer: 6 }) },
    picAt: { rw: centred(150, 18) },
    lines: [
      { id: "k1", receipt: true, sub: "Idea 1", text: "The same gap every time", y: 50.5 },
      { id: "k2", receipt: true, sub: "Idea 2", text: "Gaps that grow", y: 50.5 },
      { id: "k3", receipt: true, sub: "Idea 3", text: "The gaps of the gaps", y: 50.5 },
    ],
    stages: {
      "rw.e1": (s, H) => { hide(["k4", "k5"])(s, H); deal(0, 4)(s, H); H.write(key(s, "k6"), 0.9); },
      "rw.e1a": arcs(0, 3, ["+2", "+2", "+2"]),
      "rw.e1b": (s, H) => { hide(["k6"])(s, H); const g = key(s, "k4"); if (g) { g.style.opacity = ""; H.write(g, 0.1); } setCards({ 4: "10" })(s, H); arcs(3, 4, ["+2"], GREEN)(s, H); },
      "rw.e2": (s, H) => { setCards({ 0: 20, 1: 18, 2: 16, 3: 14, 4: 12 })(s, H); arcs(0, 4, ["−2", "−2", "−2", "−2"], RED)(s, H); },
      "rw.e3": (s, H) => {
        [4, 5].forEach((i) => { const g = key(s, `k${i}`); if (g) { g.style.opacity = "1"; } });
        setCards({ 0: 2, 1: 3, 2: 5, 3: 8, 4: 12, 5: 17, 6: "?" })(s, H);
        const g6 = key(s, "k6"); if (g6) g6.style.opacity = "1";
        arcs(0, 5, ["+1", "+2", "+3", "+4", "+5"], BLUE)(s, H);
      },
      "rw.e3a": (s, H) => { arcs(5, 6, ["+6"], GREEN)(s, H); reveal(6, 23)(s, H); },
      "rw.e4": (s, H) => { setCards({ 0: 5, 1: 6, 2: 8, 3: 12, 4: 20, 5: 36, 6: "?" })(s, H); arcs(0, 5, ["+1", "+2", "+4", "+8", "+16"], PURPLE)(s, H); },
      "rw.e4a": (s, H) => { arcs(5, 6, ["+32"], GREEN)(s, H); reveal(6, 68)(s, H); },
    },
    steps: ({ push }) => {
      push("A sequence is a list of numbers that follows a rule, and the question is always: what comes next? The trick is to stop staring at the numbers and look at the GAPS between them.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Two, four, six, eight... what's next? Draw a jump from each card to the next and write the gap on it. Plus two, plus two, plus two.",
        { on: ["rw", "k1"], add: ["rw.e1", "rw.e1a"], cue: { "rw.e1a": "draw a jump" }, transition: card("Idea 1", "The same gap every time"), pause: 0.6 });
      push("The gap never changes, so the next jump is plus two again: ten.",
        { add: ["rw.e1b"], cue: { "rw.e1b": "plus two again" }, pause: 0.6 });
      push("Same picture, new numbers: watch them roll to twenty, eighteen, sixteen, fourteen. The gaps are minus two each time, so this one is going DOWN: the next is twelve.",
        { add: ["rw.e2"], cue: { "rw.e2": "watch them roll" }, pause: 0.8 });
      push("Now two, three, five, eight, twelve, seventeen. The gaps aren't the same: plus one, plus two, plus three, plus four, plus five. But the GAPS have a pattern of their own: they grow by one each time.",
        { on: ["k2"], off: ["k1"], add: ["rw.e3"], cue: { "rw.e3": "the gaps aren't" }, transition: card("Idea 2", "Gaps that grow"), pause: 0.6 });
      push("So the next gap is plus six, and seventeen plus six is twenty-three.",
        { add: ["rw.e3a"], cue: { "rw.e3a": "plus six" }, pause: 0.8 });
      push("One more: five, six, eight, twelve, twenty, thirty-six. Gaps: plus one, plus two, plus four, plus eight, plus sixteen. Look at the gaps of the gaps: each gap is DOUBLE the one before.",
        { on: ["k3"], off: ["k2"], add: ["rw.e4"], cue: { "rw.e4": "gaps: plus one" }, transition: card("Idea 3", "The gaps of the gaps"), pause: 0.6 });
      push("So the next gap is thirty-two, and thirty-six plus thirty-two is sixty-eight.",
        { add: ["rw.e4a"], cue: { "rw.e4a": "thirty-two" }, pause: 1 });
      push("So: write the gaps on the jumps. If they're all the same, keep adding it. If they change, look at how the GAPS change: they grow, or they double, and the next gap tells you the next term.");
    },
  });
}

/* ═══ LESSON 2: THE NTH TERM ═══════════════════════════════════════════════ */
export function seqNth() {
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "The sequence 10, 12, 14, 16, ... goes up by 2 each time. Find the 20th term. How many terms are there up to 106?" }],
    pics: {
      rw: () => row(["10", "12", "14", "16"]),
      m1: () => main([L("a", "\\text{4th} = 10 + 3 \\times 2 = 16")], 7.4),
      m2: () => main([L("a", "\\text{20th} = 10 + 19 \\times 2"), L("e", "="), L("b", "48", GREEN)], 7.4),
      m3: () => main([L("a", "n\\text{th} = \\text{first} + (n - 1) \\times \\text{gap}")], 7.4),
      m4: () => main([L("a", "\\tfrac{106 - 10}{2} = 48\\ \\text{jumps}"), L("e", "\\Rightarrow"), L("b", "49\\ \\text{terms}", GREEN)], 7),
    },
    picAt: { rw: centred(150, 18), m1: at(37), m2: at(37), m3: at(37), m4: at(37) },
    lines: [
      { id: "k1", receipt: true, sub: "Idea 1", text: "Count the jumps, not the terms", y: 50.5 },
      { id: "k2", receipt: true, sub: "Idea 2", text: "Any term at once", y: 50.5 },
      { id: "k3", receipt: true, sub: "Idea 3", text: "How many terms?", y: 50.5 },
    ],
    stages: {
      "rw.deal": deal(0, 4), "rw.arcs": arcs(0, 3, ["+2", "+2", "+2"]),
      "m1.all": (s, H) => write(s, H, ["a"], 0), "m3.all": (s, H) => write(s, H, ["a"], 0),
      "m2.all": (s, H) => line(s, H, true), "m4.all": (s, H) => line(s, H, true),
    },
    steps: ({ push }) => {
      push("Ten, twelve, fourteen, sixteen, going up by two. What's the twentieth term? You could keep adding twos twenty times... or you could see the shortcut.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Look at four cards. How many JUMPS are there between them? Three. To get to the fourth term, you start at ten and make three jumps of two: sixteen.",
        { on: ["rw", "m1", "k1"], add: ["rw.deal", "rw.arcs", "m1.all"], cue: { "rw.arcs": "how many jumps", "m1.all": "three jumps" }, transition: card("Idea 1", "Count the jumps, not the terms"), pause: 0.6 });
      push("Here's the trap everybody falls into: there's always one jump FEWER than there are terms, like fence posts and the gaps between them. Four terms, three jumps.", { pause: 0.8 });
      push("So the twentieth term is ten, plus nineteen jumps of two. Nineteen twos are thirty-eight, and ten plus thirty-eight is forty-eight.",
        { on: ["m2", "k2"], off: ["m1", "k1"], add: ["m2.all"], cue: { "m2.all": "nineteen jumps" }, transition: card("Idea 2", "Any term at once"), pause: 0.8 });
      push("That's the rule for any term: the first term, plus one less than n jumps.",
        { on: ["m3"], off: ["m2"], add: ["m3.all"], cue: { "m3.all": "the first term" }, pause: 0.8 });
      push("And backwards: how many terms up to a hundred and six? From ten to a hundred and six is ninety-six, which is forty-eight jumps of two. Forty-eight jumps means forty-NINE terms: one more than the jumps.",
        { on: ["m4", "k3"], off: ["m3", "k2"], add: ["m4.all"], cue: { "m4.all": "ninety-six" }, transition: card("Idea 3", "How many terms?"), pause: 1 });
      push("So count the jumps: the nth term is the first plus n minus one jumps, and the number of terms is the jumps plus one.");
    },
  });
}

/* ═══ LESSON 3: ADDING A SERIES ════════════════════════════════════════════ */
export function seqSum() {
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "Add up 1 + 2 + 3 + ... + 10. Then the same idea for any series that goes up by the same gap." }],
    pics: {
      rw: () => row(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], { pairs: [[0, 9, "11"], [1, 8, "11"], [2, 7, "11"], [3, 6, "11"], [4, 5, "11"]] }),
      m1: () => main([L("a", "5\\ \\text{pairs} \\times 11"), L("e", "="), L("b", "55", GREEN)]),
      m2: () => main([L("a", "\\text{average} = \\tfrac{1 + 10}{2} = 5.5"), L("e", ",\\quad"), L("b", "10 \\times 5.5 = 55", GREEN)], 6.6),
      m3: () => main([L("a", "\\text{sum} = \\text{how many} \\times \\tfrac{\\text{first} + \\text{last}}{2}")], 6.8),
      m4: () => main([L("a", "(1 - 2) + (3 - 4) + \\cdots"), L("e", "="), L("b", "-1 - 1 - \\cdots", RED)], 6.8),
    },
    picAt: { rw: centred(150, 16), m1: at(38), m2: at(38), m3: at(38), m4: at(38) },
    lines: [
      { id: "k1", receipt: true, sub: "Idea 1", text: "Pair the first with the last", y: 50.5 },
      { id: "k2", receipt: true, sub: "Idea 2", text: "Average × how many", y: 50.5 },
      { id: "k3", receipt: true, sub: "Idea 3", text: "Plus, minus: pair them too", y: 50.5 },
    ],
    stages: {
      "rw.deal": deal(0, 10), "rw.pairs": pairsDraw(5),
      "m1.all": (s, H) => line(s, H, true), "m2.all": (s, H) => line(s, H, true), "m3.all": (s, H) => write(s, H, ["a"], 0), "m4.all": (s, H) => line(s, H),
    },
    steps: ({ push }) => {
      push("Add one plus two plus three, all the way to ten. You could add them one at a time. But there's a much smarter way, and it works for a hundred numbers or a thousand just as easily.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Lay out the cards and pair the FIRST with the LAST: one and ten make eleven. Then the next pair in: two and nine, eleven again. Three and eight, four and seven, five and six. Every pair makes eleven.",
        { on: ["rw", "k1"], add: ["rw.deal", "rw.pairs"], cue: { "rw.pairs": "pair the first" }, transition: card("Idea 1", "Pair the first with the last"), pause: 0.6 });
      push("Ten cards make five pairs, and five elevens are fifty-five.",
        { on: ["m1"], add: ["m1.all"], cue: { "m1.all": "five elevens" }, pause: 0.8 });
      push("Another way to see it: every pair averages to five and a half, halfway between the first and the last. So the whole series is ten numbers, each worth five and a half on average: fifty-five again.",
        { on: ["m2", "k2"], off: ["m1", "k1"], add: ["m2.all"], cue: { "m2.all": "every pair averages" }, transition: card("Idea 2", "Average × how many"), pause: 0.8 });
      push("And that works for ANY series that goes up by the same gap: how many terms, times the average of the first and the last. Count the terms with the jumps rule, plus one.",
        { on: ["m3"], off: ["m2"], add: ["m3.all"], cue: { "m3.all": "how many terms" }, pause: 0.8 });
      push("Last one: a series that goes plus, minus, plus, minus. One minus two, plus three minus four... Pair them in twos, and every pair is minus one. Count the pairs, and see if one number is left over at the end.",
        { on: ["m4", "k3"], off: ["m3", "k2"], add: ["m4.all"], cue: { "m4.all": "pair them in twos" }, transition: card("Idea 3", "Plus, minus: pair them too"), pause: 1 });
      push("So never add a long series one by one. Pair the first with the last, or use how many times the average, and pair up plus-and-minus series as you go.");
    },
  });
}

/* ═══ WORKED: THE RULE OF A SEQUENCE ═══════════════════════════════════════ */
function ruleFilm(cfg) {
  const { terms, gaps, ask } = cfg;   // ask: { index, value } (the "?" card) or { wrong: index, right: value }
  const shown = terms.map(String);
  if (ask.index != null) shown[ask.index] = "?";
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: cfg.question }],
    pics: {
      rw: () => row(shown, { answer: ask.index ?? -1 }),
      m1: () => main([L("a", cfg.ruleTex)], 7),
      m2: () => main([L("a", cfg.answerTex)], 7.4),
    },
    picAt: { rw: centred(150, 18), m1: at(37), m2: at(37) },
    lines: [
      { id: "k1", receipt: true, sub: "Look", text: "write the gaps on the jumps", y: 50.5 },
      { id: "k2", receipt: true, sub: "The rule", text: cfg.ruleName, y: 50.5 },
    ],
    stages: {
      "rw.deal": deal(0, shown.length),
      "rw.arcs": arcs(0, gaps.length, gaps),
      "rw.ans": (s, H) => { if (ask.index != null) reveal(ask.index, ask.value)(s, H); else { litCard(ask.wrong)(s, H); setCards({ [ask.wrong]: ask.right })(s, H); H.sound("ding", 1.2); } },
      "m1.all": (s, H) => write(s, H, ["a"], 0), "m2.all": (s, H) => { write(s, H, ["a"], 0); H.sound("ding", 0.6); },
    },
    steps: ({ push }) => {
      push(cfg.story, { on: ["a1"], transition: "iris", pause: 0.6 });
      push(`Lay the terms out as cards, and write each gap on the jump between them. ${cfg.gapsSay}`,
        { on: ["rw", "k1"], add: ["rw.deal", "rw.arcs"], cue: { "rw.arcs": "write each gap" }, transition: card("Look", "write the gaps on the jumps"), pause: 0.8 });
      push(cfg.ruleSay, { on: ["m1", "k2"], off: ["k1"], add: ["m1.all"], cue: { "m1.all": cfg.ruleSay.split(" ").slice(0, 2).join(" ") }, transition: card("The rule", cfg.ruleName), pause: 0.8 });
      push(cfg.answerSay, { on: ["m2"], off: ["m1"], add: ["rw.ans", "m2.all"], cue: { "rw.ans": cfg.answerSay.split(" ").slice(0, 2).join(" ") }, pause: 1 });
      push(cfg.closing || "Write the gaps on the jumps, find the rule in the gaps, and the next term follows.");
    },
  });
}
export const seqNext17 = () => ruleFilm({
  question: "The next term in the sequence 2, 3, 5, 8, 12, 17, ... is", terms: [2, 3, 5, 8, 12, 17, 23], gaps: ["+1", "+2", "+3", "+4", "+5", "+6"], ask: { index: 6, value: 23 },
  story: "Two, three, five, eight, twelve, seventeen. What comes next? The numbers themselves don't give it away, so we look between them.",
  gapsSay: "Plus one, plus two, plus three, plus four, plus five.", ruleName: "the gaps grow by one",
  ruleTex: "\\text{gaps: } +1,\\ +2,\\ +3,\\ +4,\\ +5,\\ \\ldots", ruleSay: "The gaps grow by one each time, so the next gap is plus six.",
  answerTex: "17 + 6 = 23", answerSay: "Seventeen plus six: twenty-three." });
export const seqNext36 = () => ruleFilm({
  question: "What comes next in the sequence below? 5, 6, 8, 12, 20, 36, ...", terms: [5, 6, 8, 12, 20, 36, 68], gaps: ["+1", "+2", "+4", "+8", "+16", "+32"], ask: { index: 6, value: 68 },
  story: "Five, six, eight, twelve, twenty, thirty-six. The numbers race away, so the gaps must be growing fast.",
  gapsSay: "Plus one, plus two, plus four, plus eight, plus sixteen.", ruleName: "each gap doubles",
  ruleTex: "\\text{gaps: } 1,\\ 2,\\ 4,\\ 8,\\ 16 \\to \\text{doubling}", ruleSay: "Each gap is double the one before, so the next gap is thirty-two.",
  answerTex: "36 + 32 = 68", answerSay: "Thirty-six plus thirty-two: sixty-eight." });
export const seqMissing = () => ruleFilm({
  question: "What number should replace the question mark in the series? 1, 1, 2, 4, 7, ?, 16, 22, 29, 37", terms: [1, 1, 2, 4, 7, 11, 16, 22, 29, 37], gaps: ["+0", "+1", "+2", "+3", "+4", "+5", "+6", "+7", "+8"], ask: { index: 5, value: 11 },
  story: "One, one, two, four, seven, question mark, sixteen, twenty-two, twenty-nine, thirty-seven. A missing term in the middle: the gaps on both sides of it will tell us.",
  gapsSay: "Plus nothing, plus one, plus two, plus three... and after the gap, plus six, plus seven, plus eight.", ruleName: "the gaps grow by one",
  ruleTex: "\\text{gaps: } 0,\\ 1,\\ 2,\\ 3,\\ 4,\\ 5,\\ 6,\\ 7,\\ 8", ruleSay: "The gaps go up by one each time, so the missing jumps are plus four and then plus five.",
  answerTex: "7 + 4 = 11,\\ \\ 11 + 5 = 16\\ \\checkmark", answerSay: "Seven plus four is eleven, and eleven plus five lands on sixteen, which checks. The missing term is eleven." });
export const seqWrong = () => ruleFilm({
  question: "Find out the wrong number in the series. 3, 7, 15, 39, 63, 127, 255, 511", terms: [3, 7, 15, 39, 63, 127, 255, 511], gaps: ["×2+1", "×2+1", "✗", "", "×2+1", "×2+1", "×2+1"], ask: { wrong: 3, right: 31 },
  story: "Three, seven, fifteen, thirty-nine, sixty-three... One of these breaks the rule. To find the odd one out, we need the rule first.",
  gapsSay: "Three to seven: double and add one. Seven to fifteen: double and add one. Fifteen to thirty-nine? That's not double and add one.", ruleName: "double, then add one",
  ruleTex: "\\times 2 + 1:\\ 3 \\to 7 \\to 15 \\to 31 \\to 63", ruleSay: "The rule is double and add one: fifteen should go to thirty-one, and thirty-one goes to sixty-three, which is the next number.",
  answerTex: "39\\ \\text{is wrong: it should be } 31", answerSay: "So thirty-nine is the wrong number: it should be thirty-one.",
  closing: "When a rule works everywhere except one place, the number in that place is the wrong one." });
export const seqTimes2 = () => ruleFilm({
  question: "In a specific number sequence, the first term is 3. Each subsequent term is found by multiplying the previous term by 2 and then subtracting 1. What is the 4th term in this sequence?", terms: [3, 5, 9, 17], gaps: ["×2−1", "×2−1", "×2−1"], ask: { index: 3, value: 17 },
  story: "The first term is three, and each term after it is the one before, times two, take away one. The rule is given; we just follow it carefully.",
  gapsSay: "Three times two is six, take one: five. Five times two is ten, take one: nine.", ruleName: "double, then take one",
  ruleTex: "3 \\to 5 \\to 9 \\to \\ ?", ruleSay: "And once more for the fourth term: nine times two is eighteen, take away one.",
  answerTex: "9 \\times 2 - 1 = 17", answerSay: "Seventeen. The fourth term is seventeen." });

/* ═══ WORKED: ADDING AN ARITHMETIC SERIES (two ways) ═══════════════════════ */
function sumFilm(cfg) {
  const { first, gap, last } = cfg;
  const n = (last - first) / gap + 1, total = (n * (first + last)) / 2;
  const show = [first, first + gap, first + 2 * gap, "…", last - 2 * gap, last - gap, last].map(String);
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: cfg.question }],
    pics: {
      rw: () => row(show, { pairs: [[0, 6, String(first + last)], [1, 5, String(first + last)], [2, 4, String(first + last)]] }),
      mN: () => main([L("a", `\\tfrac{${last} - ${first}}{${gap}} + 1`), L("e", "="), L("b", `${n}\\ \\text{terms}`, BLUE)], 7.4),
      mP: () => main([L("a", `${n}\\ \\text{terms} \\times \\tfrac{${first + last}}{2}`), L("e", "="), L("b", String(total), GREEN)], 7.4),
      mA: () => main([L("a", cfg.altTex)], 7),
    },
    picAt: { rw: centred(150, 16), mN: at(38), mP: at(38), mA: at(38) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Pair first with last", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: cfg.altName, y: 50.5 },
    ],
    stages: {
      "rw.deal": deal(0, 7), "rw.pairs": pairsDraw(3),
      "mN.all": (s, H) => line(s, H), "mP.all": (s, H) => line(s, H, true), "mA.all": (s, H) => { write(s, H, ["a"], 0); H.sound("ding", 0.8); },
    },
    steps: ({ push }) => {
      push(cfg.story, { on: ["a1"], transition: "iris", pause: 0.6 });
      push(`Pair the first with the last: ${first} and ${last} make ${first + last}. The next pair in: ${first + gap} and ${last - gap}, ${first + last} again. Every pair makes ${first + last}.`,
        { on: ["rw", "k1"], add: ["rw.deal", "rw.pairs"], cue: { "rw.pairs": "pair the first" }, transition: card("Method 1", "Pair first with last"), pause: 0.6 });
      push(`How many terms? From ${first} to ${last} is ${last - first}, which is ${(last - first) / gap} jumps of ${gap}. One more term than jumps: ${n} terms.`,
        { on: ["mN"], add: ["mN.all"], cue: { "mN.all": "how many terms" }, pause: 0.8 });
      push(`So the series is ${n} terms, each worth ${first + last} over two on average: ${n} times ${(first + last) / 2}... ${total}.`,
        { on: ["mP"], off: ["mN"], add: ["mP.all"], cue: { "mP.all": "so the series" }, pause: 0.8 });
      push(cfg.altSay, { on: ["mA", "k2"], off: ["mP", "rw", "k1"], add: ["mA.all"], cue: { "mA.all": cfg.altSay.split(" ").slice(0, 2).join(" ") }, transition: card("Method 2", cfg.altName), pause: 1 });
      push(`Two ways, one answer: ${total}. Pair the first with the last, and count the terms with the jumps plus one.`);
    },
  });
}
export const seqSum10106 = () => sumFilm({ first: 10, gap: 2, last: 106,
  question: "Evaluate: 10 + 12 + 14 + 16 + ... + 104 + 106",
  story: "Ten plus twelve plus fourteen, all the way up to a hundred and six, going up in twos. Far too many to add one by one.",
  altName: "Take out the twos", altTex: "2(5 + 6 + \\cdots + 53) = 2 \\times 1421 = 2842",
  altSay: "Another way: every term is two times something, from two times five up to two times fifty-three. Five plus six up to fifty-three is forty-nine numbers averaging twenty-nine, fourteen twenty-one. Doubled: two thousand, eight hundred and forty-two." });
export const seqSumOdd33 = () => sumFilm({ first: 1, gap: 2, last: 33,
  question: "Evaluate: 1 + 3 + 5 + ... + 33",
  story: "The odd numbers from one up to thirty-three, added together.",
  altName: "Odd numbers make squares", altTex: "1 + 3 + \\cdots + 33 = 17^{2} = 289",
  altSay: "Another way: the odd numbers build squares. One, then add three to make a two by two, add five to make three by three. Seventeen odd numbers make a seventeen by seventeen square: two hundred and eighty-nine." });

/* ═══ WORKED: PLUS AND MINUS ═══════════════════════════════════════════════ */
export function seqAlternating() {
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "Evaluate: 1 - 2 + 3 - 4 + 5 - 6 + ... + 71 - 72 + 73" }],
    pics: {
      rw: () => row(["1", "−2", "3", "−4", "…", "71", "−72", "73"], { pairs: [[0, 1, "−1"], [2, 3, "−1"], [5, 6, "−1"]] }),
      m1: () => main([L("a", "36\\ \\text{pairs} \\times (-1) = -36"), L("e", ",\\quad"), L("b", "-36 + 73 = 37", GREEN)], 6.8),
      m2: () => main([L("a", "1 + (3 - 2) + (5 - 4) + \\cdots + (73 - 72)"), L("e", "="), L("b", "1 + 36 = 37", GREEN)], 5.8),
    },
    picAt: { rw: centred(150, 16), m1: at(38), m2: at(38) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Pairs of minus one", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "Pair the other way", y: 50.5 },
    ],
    stages: { "rw.deal": deal(0, 8), "rw.pairs": pairsDraw(3), "m1.all": (s, H) => line(s, H, true), "m2.all": (s, H) => line(s, H, true) },
    steps: ({ push }) => {
      push("One minus two, plus three minus four, all the way to plus seventy-three. It looks long, but it falls apart in pairs.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Pair them in twos from the start: one minus two is minus one. Three minus four, minus one. Every pair, up to seventy-one minus seventy-two, is minus one. That's thirty-six pairs, and seventy-three is left over on its own.",
        { on: ["rw", "k1"], add: ["rw.deal", "rw.pairs"], cue: { "rw.pairs": "pair them in twos" }, transition: card("Method 1", "Pairs of minus one"), pause: 0.6 });
      push("Thirty-six pairs of minus one is minus thirty-six. Add the seventy-three: thirty-seven.",
        { on: ["m1"], add: ["m1.all"], cue: { "m1.all": "thirty-six pairs" }, pause: 0.8 });
      push("Or pair the other way: keep the one, then three minus two is plus one, five minus four plus one, up to seventy-three minus seventy-two. Thirty-six pluses of one, and the first one: thirty-seven again.",
        { on: ["m2", "k2"], off: ["m1", "k1"], add: ["m2.all"], cue: { "m2.all": "keep the one" }, transition: card("Method 2", "Pair the other way"), pause: 1 });
      push("Two ways, one answer: thirty-seven. With a plus-minus series, pair them up, count the pairs, and watch for one left over at the end.");
    },
  });
}

/* ═══ WORKED: ONE SERIES TAKE AWAY ANOTHER ═════════════════════════════════ */
export function seqTwoSeries() {
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "Evaluate: 5 + 10 + 15 + ... + 40 - 4 - 8 - 12 - ... - 32" }],
    pics: {
      m1: () => main([L("a", "5(1 + \\cdots + 8) = 5 \\times 36 = 180"), L("e", ",\\quad"), L("b", "4 \\times 36 = 144", BLUE)], 6.2),
      m2: () => main([L("a", "180 - 144"), L("e", "="), L("b", "36", GREEN)]),
      m3: () => main([L("a", "(5 - 4) + (10 - 8) + \\cdots + (40 - 32)"), L("e", "="), L("b", "1 + 2 + \\cdots + 8 = 36", GREEN)], 5.6),
    },
    picAt: { m1: at(30), m2: at(30), m3: at(30) },
    lines: [
      { id: "k1", receipt: true, sub: "Method 1", text: "Each series on its own", y: 50.5 },
      { id: "k2", receipt: true, sub: "Method 2", text: "Pair them up", y: 50.5 },
    ],
    stages: { "m1.all": (s, H) => line(s, H), "m2.all": (s, H) => line(s, H, true), "m3.all": (s, H) => line(s, H, true) },
    steps: ({ push }) => {
      push("Five plus ten plus fifteen up to forty, then take away four, eight, twelve, up to thirty-two. Two series, one subtracted from the other.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Each series is a times table. The first is five times one, two, three, up to eight: five times thirty-six, a hundred and eighty. The second is four times one up to eight: four times thirty-six, a hundred and forty-four.",
        { on: ["m1", "k1"], add: ["m1.all"], cue: { "m1.all": "the first is" }, transition: card("Method 1", "Each series on its own"), pause: 0.8 });
      push("A hundred and eighty take away a hundred and forty-four: thirty-six.",
        { on: ["m2"], off: ["m1"], add: ["m2.all"], cue: { "m2.all": "take away" }, pause: 0.8 });
      push("Or pair them: five minus four is one, ten minus eight is two, fifteen minus twelve is three, up to forty minus thirty-two, eight. One plus two up to eight: thirty-six.",
        { on: ["m3", "k2"], off: ["m2", "k1"], add: ["m3.all"], cue: { "m3.all": "five minus four" }, transition: card("Method 2", "Pair them up"), pause: 1 });
      push("Two ways, one answer: thirty-six. Both series have eight terms, so they pair up perfectly.");
    },
  });
}

/* ═══ WORKED: A = 1, B = 3, C = 5 … ════════════════════════════════════════ */
export function seqLetters() {
  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1", text: "If A = 1, B = 3, C = 5, D = 7, ..., what is the value of J + K + L?" }],
    pics: {
      rw: () => row(["A 1", "B 3", "C 5", "D 7"]),
      m1: () => main([L("a", "n\\text{th letter} = 1 + (n - 1) \\times 2 = 2n - 1")], 6.8),
      m2: () => main([L("a", "J = 19,\\ K = 21,\\ L = 23"), L("e", "\\Rightarrow"), L("b", "63", GREEN)], 7),
    },
    picAt: { rw: centred(150, 18), m1: at(37), m2: at(37) },
    lines: [
      { id: "k1", receipt: true, sub: "The rule", text: "the nth term", y: 50.5 },
      { id: "k2", receipt: true, sub: "Then", text: "J, K, L", y: 50.5 },
    ],
    stages: { "rw.deal": deal(0, 4), "rw.arcs": arcs(0, 3, ["+2", "+2", "+2"]), "m1.all": (s, H) => write(s, H, ["a"], 0), "m2.all": (s, H) => line(s, H, true) },
    steps: ({ push }) => {
      push("A is one, B is three, C is five, D is seven. What's J plus K plus L? We need the rule that turns a letter's place into its number.",
        { on: ["a1"], transition: "iris", pause: 0.6 });
      push("Each letter is two more than the one before: the odd numbers. The nth letter is one, plus n minus one jumps of two: two n minus one.",
        { on: ["rw", "m1", "k1"], add: ["rw.deal", "rw.arcs", "m1.all"], cue: { "rw.arcs": "two more", "m1.all": "the nth letter" }, transition: card("The rule", "the nth term"), pause: 0.8 });
      push("J is the tenth letter: two tens minus one, nineteen. K is eleventh: twenty-one. L is twelfth: twenty-three. Add them: sixty-three.",
        { on: ["m2", "k2"], off: ["m1", "k1"], add: ["m2.all"], cue: { "m2.all": "J is the tenth" }, transition: card("Then", "J, K, L"), pause: 1 });
      push("Or notice that nineteen, twenty-one and twenty-three are three numbers centred on twenty-one: three twenty-ones, sixty-three. Find the rule, and any term comes straight out.");
    },
  });
}
