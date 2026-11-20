/* ============================================================================
   A PER CENT IS A SHARE, NOT A NUMBER OF PEOPLE — the right-handed class
   ----------------------------------------------------------------------------
   "In a class of 100 students, 99% are right handed. How many must leave the
   room to make this per cent drop to 98%?"  (topic "percent")
   The user: "Show the traps and why people should consider percent as [not an]
   actual value but proportional to actual values. Use the bar model but also
   show the kids in a class. Show animation of kids move for the trap and for
   the answer."

     the class      100 children in rows; the one left-hander in orange; a door
                    on the right. Children who leave WALK to the door and out;
                    a trap is undone by walking them back in.
     the bar model  one box per child, the same size in both bars: 100 boxes
                    before, 50 after. The left-hander's box never changes size —
                    only the bar around it does, and that is why his share goes
                    from 1% to 2%.
     traps          1) "1%, so one pupil": one leaves, 98/99 = 98.99%, not 98%
                    2) "send the left-hander out": 99/99 = 100%, the wrong way
     method 1       2% = 1/50, so the left-hander is one box of 50: the class
                    must be 50, so 50 leave (49/50 = 98%)
     method 2       1/(100 − x) = 2/100, 100 − x = 50, x = 50
   ========================================================================== */

import { film } from "./film-kit.js";
import { mathLoad } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W } from "./cbt-films.js";

const INK = "#2a2723", RED = "#c0453f", GREEN = "#2f7d4a", BLUE = "#2f6f8f", PURPLE = "#6b4fa0";
const RIGHT = "#6fb7e8", LEFT = "#f0a868", SKINS = ["#8d5a3b", "#c68e64", "#e9c39b", "#6b3f26", "#b07650"];
const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const mark = (s, k) => (s ? s.querySelector(`[data-mb-key="${k}"]`) : null);
const isInstant = (H) => H.show === H.grow;
const card = (title, sub) => ({ kind: "card", title, sub, hold: 1.6 });
const f = (n) => n.toFixed(2);

/* ── the classroom and the bars, in millimetres of the 150mm paper ───────── */
const COLS = 10, ROWS = 10, PITCH = 5.2, GX = 8, GY = 4;
const LEFTY = 13;                                   // row 1, seat 3: the left-hander, away from the door
const TRAP = 99;                                    // the child nearest the door
const LEAVERS = Array.from({ length: 50 }, (_, i) => 50 + i);   // rows 5 to 9: fifty right-handers
const DOOR = [GX + COLS * PITCH + 1.5, GY + ROWS * PITCH - 13];
const seat = (i) => [GX + (i % COLS) * PITCH + PITCH / 2, GY + Math.floor(i / COLS) * PITCH + PITCH / 2];
const BOX = 1.38, BX = 6, BY1 = 64, BY2 = 78, BH = 6;

function kid(i) {
  const [x, y] = seat(i), lefty = i === LEFTY;
  const body = lefty ? LEFT : RIGHT, skin = SKINS[(i * 7) % SKINS.length];
  return `<g data-kid="${i}"><g class="kv">`
    + `<path d="M${f(x - 1.4)} ${f(y + 2.3)} L${f(x - 1.4)} ${f(y + 0.5)} Q${f(x - 1.4)} ${f(y - 0.5)} ${f(x)} ${f(y - 0.5)} Q${f(x + 1.4)} ${f(y - 0.5)} ${f(x + 1.4)} ${f(y + 0.5)} L${f(x + 1.4)} ${f(y + 2.3)} Z" fill="${body}" stroke="${INK}" stroke-width="0.25"/>`
    + `<circle cx="${f(x)}" cy="${f(y - 1.6)}" r="1.05" fill="${skin}" stroke="${INK}" stroke-width="0.2"/>`
    + (lefty ? `<path d="M${f(x - 1.3)} ${f(y + 0.2)} L${f(x - 2.4)} ${f(y - 2.2)}" stroke="${INK}" stroke-width="0.45" stroke-linecap="round"/><circle cx="${f(x - 2.5)}" cy="${f(y - 2.5)}" r="0.45" fill="${skin}"/>` : "")
    + `</g></g>`;
}
function bar(id, n, y, label) {
  let o = `<g data-mb="bar" data-k="${id}">`;
  o += `<rect x="${BX}" y="${y}" width="${f((n - 1) * BOX)}" height="${BH}" fill="${RIGHT}" fill-opacity="0.75"/>`;
  o += `<rect x="${f(BX + (n - 1) * BOX)}" y="${y}" width="${BOX}" height="${BH}" fill="${LEFT}"/>`;
  let cuts = "";
  for (let i = 1; i < n; i++) cuts += `M${f(BX + i * BOX)} ${y}V${y + BH}`;
  o += `<path d="${cuts}" stroke="rgba(42,39,35,.35)" stroke-width="0.12"/>`;
  o += `<rect x="${BX}" y="${y}" width="${f(n * BOX)}" height="${BH}" fill="none" stroke="${INK}" stroke-width="0.5"/></g>`;
  o += `<g data-mb="name" data-k="${id}L"><text x="${BX}" y="${y - 1.4}" font-family="JetBrains Mono, monospace" font-weight="700" font-size="3" fill="${INK}">${label}</text></g>`;
  return o;
}
function room() {
  let o = "";
  o += `<rect x="${GX - 2}" y="${GY - 2.5}" width="${f(COLS * PITCH + 4)}" height="${f(ROWS * PITCH + 4)}" fill="#fffdf8" stroke="${INK}" stroke-width="0.5"/>`;
  o += `<g data-mb="name" data-k="door"><rect x="${f(DOOR[0])}" y="${f(DOOR[1])}" width="4" height="13" fill="#c99a62" stroke="${INK}" stroke-width="0.4"/><circle cx="${f(DOOR[0] + 1)}" cy="${f(DOOR[1] + 7)}" r="0.45" fill="${INK}"/>`
    + `<text x="${f(DOOR[0] + 2)}" y="${f(DOOR[1] - 1.5)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.6" font-weight="700" fill="${INK}">door</text></g>`;
  for (let i = 0; i < COLS * ROWS; i++) o += kid(i);
  /* the bar model: one box for each child */
  o += bar("b100", 100, BY1, "100 pupils: 100%");
  o += bar("b99", 99, BY1, "99 pupils: 100%");
  o += bar("b50", 50, BY2, "50 pupils: 100%");
  o += `<g data-mb="num" data-k="l1"><text x="${f(BX + 99.5 * BOX)}" y="${BY1 + BH + 3.4}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="3.4" fill="${RED}">1 = 1%</text></g>`;
  o += `<g data-mb="num" data-k="l2"><text x="${f(BX + 49.5 * BOX)}" y="${BY2 + BH + 3.4}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="3.4" fill="${RED}">1 = 2%</text></g>`;
  return svgBox(150, 90, o);
}

/* the class as a set of children out of the room: they walk to the door and out, or back in */
function setClass(s, H, gone, { stagger = 0.05, delay = 0 } = {}) {
  if (!s) return;
  const was = s.__gone || new Set(), want = new Set(gone);
  const instant = isInstant(H);
  s.__gen = (s.__gen || 0) + (instant ? 1 : 0);
  const gen = s.__gen;
  const leave = [...want].filter((i) => !was.has(i)), back = [...was].filter((i) => !want.has(i));
  s.__gone = want;
  const outOf = (i) => { const [x, y] = seat(i); return [DOOR[0] + 8 - x, DOOR[1] + 8 - y]; };
  const place = (i, off) => {
    const g = s.querySelector(`[data-kid="${i}"] .kv`);
    if (!g) return;
    g.getAnimations?.().forEach((a) => a.cancel());
    if (off) { const [dx, dy] = outOf(i); g.style.transform = `translate(${dx}px, ${dy}px)`; g.style.opacity = "0"; }
    else { g.style.transform = ""; g.style.opacity = ""; }
  };
  if (instant) { for (let i = 0; i < COLS * ROWS; i++) place(i, want.has(i)); return; }
  const walk = (i, out, t) => setTimeout(() => {
    if (s.__gen !== gen) return;
    const g = s.querySelector(`[data-kid="${i}"] .kv`);
    if (!g) return;
    const [dx, dy] = outOf(i), mid = [DOOR[0] - 3 - seat(i)[0], seat(i)[1] < DOOR[1] ? DOOR[1] + 4 - seat(i)[1] : dy];
    const frames = [
      { transform: "translate(0px, 0px)", opacity: 1 },
      { transform: `translate(${mid[0]}px, ${mid[1]}px)`, opacity: 1, offset: 0.7 },
      { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
    ];
    const a = g.animate(out ? frames : frames.slice().reverse(), { duration: 1500, easing: "ease-in-out", fill: "forwards" });
    a.onfinish = () => { place(i, out); a.cancel(); };
  }, t * 1000);
  leave.forEach((i, k) => walk(i, true, delay + k * stagger));
  back.forEach((i, k) => walk(i, false, delay + k * stagger));
  if (leave.length || back.length) H.sound("whoosh", delay);
}

/* the working: a column on the right, one idea a line */
const COL_X = 112;
const wline = (pieces, em = 5) => () => svgBox(150, 14, mathRow(pieces, { cx: COL_X, y: 9, em }).svg);
const WY = (i) => 12 + i * 5.6;

export function classHanded() {
  const W = {
    a1: [L("a", "99\\%\\ \\text{of}\\ 100 = 99"), L("b", "\\ \\text{right}", BLUE)],
    a2: [L("a", "100 - 99 = 1"), L("b", "\\ \\text{left}", RED)],
    t1: [L("a", "\\tfrac{98}{99} = 98.99\\%", RED)],
    t1b: [L("a", "\\text{not } 98\\%", RED)],
    t2: [L("a", "\\tfrac{99}{99} = 100\\%", RED)],
    k1: [L("a", "1\\ \\text{left} = 1\\%\\ \\text{of}\\ 100")],
    k2: [L("a", "1\\ \\text{left} = 2\\%\\ \\text{of}\\ ?")],
    m1: [L("a", "2\\% = \\tfrac{2}{100} = \\tfrac{1}{50}")],
    m2: [L("a", "\\text{class} = 50")],
    m3: [L("a", "100 - 50 = 50\\ \\text{leave}", GREEN)],
    m4: [L("a", "\\tfrac{49}{50} = \\tfrac{98}{100} = 98\\%", GREEN)],
    e1: [L("a", "\\tfrac{1}{100 - x} = \\tfrac{2}{100}")],
    e2: [L("a", "100 - x = 50")],
    e3: [L("a", "x = 50", GREEN)],
  };
  const pics = { cls: room }, picAt = { cls: centred(150, 11) }, stages = {};
  const COLS_ORDER = [["a1", "a2"], ["t1", "t1b"], ["t2"], ["k1", "k2"], ["m1", "m2", "m3", "m4"], ["e1", "e2", "e3"]];
  COLS_ORDER.forEach((group) => group.forEach((k, i) => {
    pics[k] = wline(W[k]); picAt[k] = centred(150, WY(i));
    stages[`${k}.all`] = (s, H) => W[k].forEach((p, j) => H.write(key(s, p.k), j * 1));
  }));
  const kidG = (s, i) => s?.querySelector(`[data-kid="${i}"]`);
  const ring = (s, H, i, delay, hold = 2) => { const g = kidG(s, i); const b = g?.querySelector("path"); if (b && !isInstant(H)) H.lit(b, delay, hold, RED); };
  Object.assign(stages, {
    "cls.base": (s, H) => {
      setClass(s, H, []);
      const kids = [...(s?.querySelectorAll("[data-kid]") || [])];
      if (!isInstant(H)) kids.forEach((g, n) => { g.style.opacity = "0"; setTimeout(() => { g.style.transition = "opacity .3s"; g.style.opacity = "1"; }, (0.3 + (n % 10) * 0.06 + Math.floor(n / 10) * 0.12) * 1000); });
      else kids.forEach((g) => { g.style.opacity = "1"; });
      H.write(key(s, "door"), 1.8);
    },
    "cls.lefty": (s, H) => { ring(s, H, LEFTY, 0.4, 2.6); const g = kidG(s, LEFTY); if (g && !isInstant(H)) H.focus(g, 0.4, 2, 2.2); },
    "cls.bar": (s, H) => { H.grow(key(s, "b100"), 0.3); H.write(key(s, "b100L"), 0.8); H.write(key(s, "l1"), 2.2); },
    /* TRAP 1: one right-hander walks out; the bar loses a box */
    "cls.trap1": (s, H) => {
      setClass(s, H, [TRAP], { delay: 0.6 });
      const a = key(s, "b100"), aL = key(s, "b100L"), b = key(s, "b99"), bL = key(s, "b99L");
      const swap = () => { [a, aL].forEach((n) => { if (n) n.style.opacity = "0"; }); [b, bL].forEach((n) => { if (n) n.style.opacity = "1"; }); };
      if (isInstant(H)) swap(); else setTimeout(swap, 2300);
    },
    "cls.back1": (s, H) => {
      setClass(s, H, []);
      const a = key(s, "b100"), aL = key(s, "b100L"), b = key(s, "b99"), bL = key(s, "b99L");
      const swap = () => { [a, aL].forEach((n) => { if (n) n.style.opacity = "1"; }); [b, bL].forEach((n) => { if (n) n.style.opacity = "0"; }); };
      if (isInstant(H)) swap(); else setTimeout(swap, 1200);
    },
    /* TRAP 2: the left-hander walks out */
    "cls.trap2": (s, H) => { setClass(s, H, [LEFTY], { delay: 0.5 }); },
    "cls.back2": (s, H) => { setClass(s, H, []); },
    /* the same one pupil: 1% of 100, then 2% of ... */
    "cls.same": (s, H) => { ring(s, H, LEFTY, 0.2, 3); H.focus(key(s, "l1"), 0.6, 1.8, 1.4); },
    /* METHOD 1: the 50-box bar, the left-hander's box the same size */
    "cls.bar50": (s, H) => { H.grow(key(s, "b50"), 0.3); H.write(key(s, "b50L"), 0.9); H.write(key(s, "l2"), 2); if (!isInstant(H)) { H.focus(key(s, "l2"), 2.6, 1.8, 1.4); } },
    "cls.leave": (s, H) => { setClass(s, H, LEAVERS, { delay: 0.5, stagger: 0.07 }); },
    "cls.check": (s, H) => { ring(s, H, LEFTY, 0.3, 2.4); H.sound("ding", 0.6); },
  });

  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks: [{ id: "a1q", text: "100 pupils, 99% right-handed. How many must leave so that 98% are?" }],
    pics, picAt, lines: [], stages,
    steps: ({ push }) => {
      push("A class of a hundred pupils. Ninety nine per cent of them are right-handed. How many pupils must leave the room, so that ninety eight per cent are right-handed?",
        { on: ["a1q", "cls"], add: ["cls.base"], transition: "iris", pause: 1.2 });
      push("First, who is in the room? Ninety nine per cent of a hundred is ninety nine right-handers.",
        { on: ["a1"], add: ["a1.all"], cue: { "a1.all": "Ninety nine per cent of" }, pause: 0.6 });
      push("That leaves one left-hander. There he is, in orange, with his left hand up.",
        { on: ["a2"], add: ["a2.all", "cls.lefty"], cue: { "cls.lefty": "There he is" }, pause: 0.8 });
      push("As a bar: one box for every pupil. A hundred boxes, and his box at the end is one per cent.",
        { add: ["cls.bar"], cue: { "cls.bar": "one box for every" }, pause: 0.8 });
      /* trap 1 */
      push("Here's the answer most people give. Ninety nine down to ninety eight is one per cent. One per cent of a hundred is one pupil. So one pupil leaves.",
        { off: ["a1", "a2"], transition: card("Trap 1", "one per cent, so one pupil"), pause: 0.5 });
      push("Let's try it. One right-hander walks out of the door.",
        { add: ["cls.trap1"], cue: { "cls.trap1": "walks out" }, pause: 0.8 });
      push("Now there are ninety eight right-handers out of ninety nine pupils. Ninety eight over ninety nine is ninety eight point nine nine per cent.",
        { on: ["t1"], add: ["t1.all"], cue: { "t1.all": "Ninety eight over" }, pause: 0.6 });
      push("Not ninety eight. It hardly moved. Why? Because when he left, the whole class got smaller too. A per cent is a share of the whole, and the whole moved.",
        { on: ["t1b"], add: ["t1b.all"], pause: 1 });
      push("Bring him back in.",
        { off: ["t1", "t1b"], add: ["cls.back1"], pause: 0.6 });
      /* trap 2 */
      push("Second trap. Send the left-hander out?",
        { transition: card("Trap 2", "send the left-hander out"), pause: 0.6 });
      push("Then everyone left is right-handed. Ninety nine out of ninety nine is a hundred per cent. That's gone up, not down.",
        { on: ["t2"], add: ["cls.trap2", "t2.all"], cue: { "t2.all": "Ninety nine out of" }, pause: 0.8 });
      push("He comes back. To make the right-handers' share smaller, only right-handers can leave.",
        { off: ["t2"], add: ["cls.back2"], pause: 0.8 });
      /* the idea */
      push("So here's the thing that never changes. The left-hander stays. He is one pupil, before and after.",
        { add: ["cls.same"], transition: card("What stays the same", "one left-hander"), pause: 0.6 });
      push("Before, he is one per cent of a hundred.",
        { on: ["k1"], add: ["k1.all"], pause: 0.6 });
      push("After, the right-handers are ninety eight per cent, so he must be two per cent. Two per cent of what?",
        { on: ["k2"], add: ["k2.all"], pause: 1.4 });
      push("The same one pupil, a bigger share. That only happens if the whole gets smaller. A per cent is not a number of pupils. It's a share, and it grows and shrinks with the whole.",
        { pause: 1 });
      /* method 1 */
      push("Two per cent is two hundredths. Reduce it: one fiftieth.",
        { off: ["k1", "k2"], on: ["m1"], add: ["m1.all"], transition: card("Method 1", "the bar model"), pause: 0.6 });
      push("One fiftieth means: he is one box out of fifty. Draw the new bar, one box for each pupil, the same size as before. Fifty boxes. Look: his box hasn't changed at all. The bar around it is half as long, so his share is double.",
        { on: ["m2"], add: ["cls.bar50", "m2.all"], cue: { "cls.bar50": "Draw the new bar", "m2.all": "Fifty boxes" }, pause: 1 });
      push("So the class must shrink from a hundred to fifty. Fifty right-handers walk out.",
        { on: ["m3"], add: ["cls.leave", "m3.all"], cue: { "cls.leave": "Fifty right-handers", "m3.all": "from a hundred to fifty" }, pause: 1.2 });
      push("Check it. Forty nine right-handers out of fifty pupils. Forty nine fiftieths is ninety eight hundredths. Ninety eight per cent.",
        { on: ["m4"], add: ["m4.all", "cls.check"], cue: { "m4.all": "Forty nine fiftieths" }, pause: 1 });
      push("Fifty pupils must leave. Not one. Fifty.",
        { pause: 1.2 });
      /* method 2 */
      push("Now the same in one line. Say x right-handers leave. The left-hander is one pupil out of a hundred take away x, and that must be two hundredths.",
        { off: ["m1", "m2", "m3", "m4"], on: ["e1"], add: ["e1.all"], cue: { "e1.all": "one pupil out of" }, transition: card("Method 2", "an equation"), pause: 0.8 });
      push("One over something is one fiftieth, so the something is fifty. A hundred take away x is fifty.",
        { on: ["e2"], add: ["e2.all"], cue: { "e2.all": "A hundred take away" }, pause: 0.6 });
      push("So x is fifty. The same answer.",
        { on: ["e3"], add: ["e3.all"], pause: 1 });
      push("Remember the right-handed class. One per cent of a hundred is one pupil, but one pupil is two per cent of fifty. A per cent is a share of the whole, so always ask: per cent of what?");
    },
  });
}
