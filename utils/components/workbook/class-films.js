/* ============================================================================
   A PER CENT IS A SHARE, NOT A NUMBER OF PEOPLE — the class of 99 boys
   ----------------------------------------------------------------------------
   "In a class of 100 pupils, 99% are boys. How many boys must leave the room
   so that 98% are boys?"  (topic "percent")
   The user: "Show the traps and why people should consider percent as [not an]
   actual value but proportional to actual values. Use the bar model but also
   show the kids in a class. Show animation of kids move for the trap and for
   the answer." Then: "Use boys and girls ... use our svg to make it realer.
   Let them sit, then stand and leave. Increase the room size. Design the room
   and door better."

     the room       seen from the front of the class, in perspective: a back
                    wall with a chalkboard, a window and a clock, a wooden floor,
                    ten rows of desks getting smaller towards the back, and a
                    panelled door in the back wall that swings open
     the children   the site's own characters (media/characters, as small PNGs
                    in png/): ninety nine boys and one girl. Each SITS behind a
                    desk (the desk hides the legs); to leave, a child STANDS,
                    walks along the row to the aisle, up the aisle (smaller with
                    distance) and out through the door; to come back, the same
                    road the other way, and sits down.
     the bar model  one box per child, the same size in both bars: 100 boxes
                    before, 50 after. The girl's box never changes size — only
                    the bar around it does, so her share goes from 1% to 2%.
     traps          1) "1%, so one pupil": one boy leaves, 98/99 = 98.99%
                    2) "send the girl out": 99/99 = 100%, the wrong way
     method 1       2% = 1/50: the girl is one box of 50, so 50 boys leave
     method 2       1/(100 − x) = 2/100, 100 − x = 50, x = 50
   ========================================================================== */

import { film } from "./film-kit.js";
import { mathLoad } from "./film-math.js";
import { mathRow, svgBox, PAPER } from "./cbt-films.js";

const INK = "#2a2723", RED = "#c0453f", GREEN = "#2f7d4a", BLUE = "#2f6f8f";
const BOYC = "#6fb7e8", GIRLC = "#f0a8c9";
const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const isInstant = (H) => H.show === H.grow;
const card = (title, sub) => ({ kind: "card", title, sub, hold: 1.6 });
const f = (n) => n.toFixed(2);

/* the whole picture is drawn bigger than the other films' (72 of the screen's 100 width-units) */
const PICW = 72, X_AT = 50 - 150 * (PICW / PAPER) / 2;

/* ── the room, in millimetres of the 150mm paper ─────────────────────────── */
const ROOM = { x: 2, y: 2, w: 98, h: 64 };
const WALL_BOTTOM = 19;                           // where the back wall meets the floor
const ROWS = 10, COLS = 10;
const rowT = (r) => r / (ROWS - 1);               // 0 at the back, 1 at the front
const rowScale = (r) => 0.6 + 0.4 * rowT(r);
const deskY = (r) => 25 + 36 * Math.pow(rowT(r), 1.08);       // the top of the desks in row r
const rowW = (r) => 60 + 22 * rowT(r);
const MID = ROOM.x + ROOM.w / 2 - 6;              // the class sits a little left: the aisle and the door are on the right
const seatX = (r, c) => MID - rowW(r) / 2 + (c + 0.5) * (rowW(r) / COLS);
const aisleX = (r) => MID + rowW(r) / 2 + 4.5 * rowScale(r);
const DOOR = { x: 84, y: 5.5, w: 10, h: WALL_BOTTOM - 5.5 };
const KID_H = 21.5;                                // a child's height in the front row
const SIT = 0.5, STAND = 0.92;                     // how much of the child is above the desk top: seated, standing

const GIRL = 23;                                   // row 2, seat 3: the girl, well inside the class
const TRAP = 99;                                   // the boy at the front, nearest the aisle
const LEAVERS = Array.from({ length: 50 }, (_, i) => 50 + i);   // the front five rows: fifty boys
const BOYS = [["boy-closed", 0.375], ["boy-hoodie", 0.305], ["boy-curly", 0.375], ["boy", 0.365]];
const GIRL_PIC = ["girl-hands-down", 0.425];
const picOf = (i) => (i === GIRL ? GIRL_PIC : BOYS[(i * 7 + Math.floor(i / 10) * 3) % BOYS.length]);
const rc = (i) => [Math.floor(i / COLS), i % COLS];

function backWall() {
  const { x, y, w } = ROOM;
  let o = `<rect x="${x}" y="${y}" width="${w}" height="${WALL_BOTTOM - y}" fill="#f3ead8"/>`;
  o += `<rect x="${x}" y="${WALL_BOTTOM - 1.4}" width="${w}" height="1.4" fill="#d9c7a6"/>`;                // the skirting
  /* the chalkboard, in a wooden frame, with today's sum on it */
  o += `<rect x="30" y="5" width="34" height="11" fill="#9b6b3e"/><rect x="31" y="6" width="32" height="9" fill="#2f4f40"/>`;
  o += `<rect x="31" y="15" width="32" height="0.9" fill="#b48452"/>`;
  o += `<text x="47" y="12" text-anchor="middle" font-family="Shantell Sans, cursive" font-size="3.4" fill="rgba(255,255,255,.85)">99% boys</text>`;
  /* the window, sky and cross bars */
  o += `<rect x="7" y="5" width="16" height="10" fill="#cfe8f7" stroke="#f8f4ec" stroke-width="1.1"/>`;
  o += `<path d="M15 5 V15 M7 10 H23" stroke="#f8f4ec" stroke-width="0.8"/><path d="M8 13.5 Q11 11.5 14 13 T22 12.6" stroke="#9fd09a" stroke-width="1.2" fill="none"/>`;
  /* the clock */
  o += `<circle cx="74" cy="9.5" r="3.2" fill="#fffdf8" stroke="${INK}" stroke-width="0.5"/><path d="M74 9.5 V7.4 M74 9.5 L75.6 10.4" stroke="${INK}" stroke-width="0.45" stroke-linecap="round"/>`;
  return o;
}
function floor() {
  const { x, w } = ROOM, y1 = ROOM.y + ROOM.h;
  let o = `<rect x="${x}" y="${WALL_BOTTOM}" width="${w}" height="${y1 - WALL_BOTTOM}" fill="#e7cfa6"/>`;
  /* planks running towards the back wall */
  let lines = "";
  for (let i = -6; i <= 16; i++) {
    const bx = x + i * (w / 10), tx = MID + (bx - MID) * 0.55;
    lines += `M${f(tx)} ${WALL_BOTTOM} L${f(bx)} ${y1}`;
  }
  o += `<path d="${lines}" stroke="rgba(120,80,40,.18)" stroke-width="0.3"/>`;
  return o;
}
function door() {
  const { x, y, w, h } = DOOR;
  let o = `<g data-k="door">`;
  o += `<rect x="${x - 0.9}" y="${y - 0.9}" width="${w + 1.8}" height="${h + 0.9}" fill="#8a5a33"/>`;            // the frame
  o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#3a2e24"/>`;                                       // the dark of the doorway
  /* the leaf: hinged on its left, it swings open (scaleX) */
  o += `<g data-k="leaf" style="transform-origin: ${x}px ${y}px; transform-box: view-box;">`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#c9925a" stroke="#8a5a33" stroke-width="0.35"/>`
    + `<rect x="${x + 1.4}" y="${y + 1.3}" width="${w - 2.8}" height="${h * 0.38}" fill="none" stroke="#a87442" stroke-width="0.45"/>`
    + `<rect x="${x + 1.4}" y="${y + h * 0.5}" width="${w - 2.8}" height="${h * 0.42}" fill="none" stroke="#a87442" stroke-width="0.45"/>`
    + `<circle cx="${x + w - 1.6}" cy="${y + h * 0.52}" r="0.6" fill="#f4c95d" stroke="#8a5a33" stroke-width="0.2"/></g>`;
  o += `<text x="${x + w / 2}" y="${y - 1.8}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.4" font-weight="700" fill="#6b5a46">EXIT</text>`;
  o += `</g>`;
  return o;
}
function kid(i) {
  const [r, c] = rc(i), k = rowScale(r), h = KID_H * k, [src, asp] = picOf(i), w = h * asp;
  const x = seatX(r, c), top = deskY(r) - SIT * h;
  return `<g data-kid="${i}" data-row="${r}"><g class="kv"><image href="/media/characters/png/${src}.png" x="${f(x - w / 2)}" y="${f(top)}" width="${f(w)}" height="${f(h)}"/></g></g>`;
}
function desk(r, c) {
  const k = rowScale(r), x = seatX(r, c), y = deskY(r), dw = (rowW(r) / COLS) * 0.86, th = 1.5 * k, fh = 4.6 * k;
  return `<g class="desk"><path d="M${f(x - dw / 2 + 0.6 * k)} ${f(y)} L${f(x + dw / 2 - 0.6 * k)} ${f(y)} L${f(x + dw / 2)} ${f(y + th)} L${f(x - dw / 2)} ${f(y + th)} Z" fill="#c99a62"/>`
    + `<rect x="${f(x - dw / 2)}" y="${f(y + th)}" width="${f(dw)}" height="${f(fh)}" fill="#a8763f"/>`
    + `<rect x="${f(x - dw / 2)}" y="${f(y + th)}" width="${f(dw)}" height="${f(0.5 * k)}" fill="rgba(0,0,0,.18)"/></g>`;
}
function bar(id, n, y, label) {
  const BOX = 1.38, BX = 6, BH = 5.4;
  let o = `<g data-mb="bar" data-k="${id}">`;
  o += `<rect x="${BX}" y="${y}" width="${f((n - 1) * BOX)}" height="${BH}" fill="${BOYC}" fill-opacity="0.75"/>`;
  o += `<rect x="${f(BX + (n - 1) * BOX)}" y="${y}" width="${BOX}" height="${BH}" fill="${GIRLC}"/>`;
  let cuts = "";
  for (let i = 1; i < n; i++) cuts += `M${f(BX + i * BOX)} ${y}V${y + BH}`;
  o += `<path d="${cuts}" stroke="rgba(42,39,35,.35)" stroke-width="0.12"/>`;
  o += `<rect x="${BX}" y="${y}" width="${f(n * BOX)}" height="${BH}" fill="none" stroke="${INK}" stroke-width="0.5"/></g>`;
  o += `<g data-mb="name" data-k="${id}L"><text x="${BX}" y="${y - 1.3}" font-family="JetBrains Mono, monospace" font-weight="700" font-size="2.9" fill="${INK}">${label}</text></g>`;
  return o;
}
const BY1 = 70, BY2 = 80.5, BOX = 1.38, BX = 6, BH = 5.4;
function picture() {
  let o = `<defs><clipPath id="cls-room"><rect x="${ROOM.x}" y="${ROOM.y}" width="${ROOM.w}" height="${ROOM.h}"/></clipPath></defs>`;
  o += `<g clip-path="url(#cls-room)">${backWall()}${floor()}${door()}`;
  /* row by row from the back: the children, then their desks in front of them */
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) o += kid(r * COLS + c);
    for (let c = 0; c < COLS; c++) o += desk(r, c);
  }
  o += `</g><rect x="${ROOM.x}" y="${ROOM.y}" width="${ROOM.w}" height="${ROOM.h}" fill="none" stroke="${INK}" stroke-width="0.6"/>`;
  o += bar("b100", 100, BY1, "100 pupils: 100%");
  o += bar("b99", 99, BY1, "99 pupils: 100%");
  o += bar("b50", 50, BY2, "50 pupils: 100%");
  o += `<g data-mb="num" data-k="l1"><text x="${f(BX + 99.5 * BOX)}" y="${BY1 + BH + 3.2}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="3.3" fill="${RED}">1 girl = 1%</text></g>`;
  o += `<g data-mb="num" data-k="l2"><text x="${f(BX + 49.5 * BOX)}" y="${BY2 + BH + 3.2}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="3.3" fill="${RED}">1 girl = 2%</text></g>`;
  return svgBox(150, 90, o);
}

/* ── the children move: stand, walk the row to the aisle, up the aisle, out of the door ── */
/** the transform that puts child i's feet-line point (bx, by) at (x, y) and scales it by k about that point */
const placeAt = (bx, by, x, y, k) => `translate(${f(x - bx * k)}px, ${f(y - by * k)}px) scale(${f(k)})`;
function road(i) {
  const [r, c] = rc(i), k0 = rowScale(r), h = KID_H * k0;
  const bx = seatX(r, c), by = deskY(r) - SIT * h + h;            // the child's feet as drawn (seated, behind the desk)
  const rise = (STAND - SIT) * h;
  const kDoor = rowScale(0) * 0.92 / k0;
  return [
    { t: placeAt(bx, by, bx, by, 1), o: 1 },                                          // seated
    { t: placeAt(bx, by, bx, by - rise, 1), o: 1, at: 0.12 },                         // stands up
    { t: placeAt(bx, by, aisleX(r), by - rise, 1), o: 1, at: 0.42 },                  // along the row to the aisle
    { t: placeAt(bx, by, DOOR.x + DOOR.w / 2, WALL_BOTTOM + 0.6, kDoor), o: 1, at: 0.88 },   // up the aisle to the door
    { t: placeAt(bx, by, DOOR.x + DOOR.w / 2, WALL_BOTTOM - 0.4, kDoor * 0.95), o: 0, at: 1 },  // through it
  ];
}
function setClass(s, H, gone, { stagger = 0.08, delay = 0 } = {}) {
  if (!s) return;
  const was = s.__gone || new Set(), want = new Set(gone), instant = isInstant(H);
  if (instant) s.__gen = (s.__gen || 0) + 1;
  const gen = s.__gen || 0;
  const leave = [...want].filter((i) => !was.has(i)), back = [...was].filter((i) => !want.has(i));
  s.__gone = want;
  const kv = (i) => s.querySelector(`[data-kid="${i}"] .kv`);
  const rest = (i, off) => {
    const g = kv(i); if (!g) return;
    g.getAnimations?.().forEach((a) => a.cancel());
    const fr = road(i);
    g.style.transform = off ? fr[fr.length - 1].t : "";
    g.style.opacity = off ? "0" : "";
  };
  const leaf = key(s, "leaf");
  const swing = (open, t) => { if (!leaf) return; if (instant) { leaf.style.transform = ""; return; } setTimeout(() => { if (s.__gen !== gen) return; leaf.style.transition = "transform .5s ease"; leaf.style.transform = open ? "scaleX(0.18)" : ""; }, t * 1000); };
  if (instant) { for (let i = 0; i < ROWS * COLS; i++) rest(i, want.has(i)); swing(false); return; }
  const DUR = 3.2;
  const walk = (i, out, t) => setTimeout(() => {
    if (s.__gen !== gen) return;
    const g = kv(i); if (!g) return;
    const fr = road(i).map((p) => ({ transform: p.t, opacity: p.o, ...(p.at != null ? { offset: p.at } : {}) }));
    fr[0].offset = 0;
    const frames = out ? fr : fr.slice().reverse().map((p) => ({ ...p, offset: 1 - p.offset }));
    const a = g.animate(frames, { duration: DUR * 1000, easing: "linear", fill: "forwards" });
    a.onfinish = () => { rest(i, out); a.cancel(); };
  }, t * 1000);
  const moving = [...leave.map((i) => [i, true]), ...back.map((i) => [i, false])];
  /* the front row goes first (nearest the aisle), so nobody walks through anybody */
  moving.sort((a, b) => b[0] - a[0]);
  moving.forEach(([i, out], k) => walk(i, out, delay + k * stagger));
  if (moving.length) {
    swing(true, delay + 0.8);
    swing(false, delay + (moving.length - 1) * stagger + DUR + 0.2);
    H.sound("whoosh", delay + 0.6);
  }
}

/* the working: a column to the right of the room, one idea a line */
const COL_X = 126;
const wline = (pieces, em = 4.4) => () => svgBox(150, 12, mathRow(pieces, { cx: COL_X, y: 8, em }).svg);
const WY = (i) => 10 + i * 5.2;
const PIC_Y = 11.5;
const at = (y) => ({ x: X_AT, y });

export function classBoys() {
  const W = {
    a1: [L("a", "99\\%\\ \\text{of}\\ 100 = 99"), L("b", "\\ \\text{boys}", BLUE)],
    a2: [L("a", "100 - 99 = 1"), L("b", "\\ \\text{girl}", RED)],
    t1: [L("a", "\\tfrac{98}{99} = 98.99\\%", RED)],
    t1b: [L("a", "\\text{not } 98\\%", RED)],
    t2: [L("a", "\\tfrac{99}{99} = 100\\%", RED)],
    k1: [L("a", "1\\ \\text{girl} = 1\\%\\ \\text{of}\\ 100")],
    k2: [L("a", "1\\ \\text{girl} = 2\\%\\ \\text{of}\\ ?")],
    m1: [L("a", "2\\% = \\tfrac{2}{100} = \\tfrac{1}{50}")],
    m2: [L("a", "\\text{class} = 50")],
    m3: [L("a", "100 - 50 = 50\\ \\text{leave}", GREEN)],
    m4: [L("a", "\\tfrac{49}{50} = \\tfrac{98}{100} = 98\\%", GREEN)],
    e1: [L("a", "\\tfrac{1}{100 - x} = \\tfrac{2}{100}")],
    e2: [L("a", "100 - x = 50")],
    e3: [L("a", "x = 50", GREEN)],
  };
  const pics = { cls: picture }, picAt = { cls: at(PIC_Y) }, stages = {};
  [["a1", "a2"], ["t1", "t1b"], ["t2"], ["k1", "k2"], ["m1", "m2", "m3", "m4"], ["e1", "e2", "e3"]].forEach((group) => group.forEach((k, i) => {
    pics[k] = wline(W[k]); picAt[k] = at(PIC_Y + 1 + i * 5.4);
    stages[`${k}.all`] = (s, H) => W[k].forEach((p, j) => H.write(key(s, p.k), j * 1));
  }));
  const kidImg = (s, i) => s?.querySelector(`[data-kid="${i}"] image`);
  /* the girl lit: a ring of light round her for a moment */
  const ring = (s, H, i, delay, hold = 2.4) => {
    const im = kidImg(s, i);
    if (!im || isInstant(H)) return;
    setTimeout(() => { im.style.transition = "filter .3s"; im.style.filter = "drop-shadow(0 0 1.2px #c0453f) drop-shadow(0 0 2.4px #f4c95d)"; setTimeout(() => { im.style.filter = ""; }, hold * 1000); }, delay * 1000);
  };
  const barSwap = (s, H, to99, t) => {
    const a = key(s, "b100"), aL = key(s, "b100L"), b = key(s, "b99"), bL = key(s, "b99L");
    const go = () => { [a, aL].forEach((n) => { if (n) n.style.opacity = to99 ? "0" : "1"; }); [b, bL].forEach((n) => { if (n) n.style.opacity = to99 ? "1" : "0"; }); };
    if (isInstant(H)) go(); else setTimeout(go, t * 1000);
  };
  Object.assign(stages, {
    "cls.base": (s, H) => {
      setClass(s, H, []);
      const kids = [...(s?.querySelectorAll("[data-kid]") || [])];
      if (!isInstant(H)) kids.forEach((g) => { const r = Number(g.dataset.row); g.style.opacity = "0"; setTimeout(() => { g.style.transition = "opacity .35s"; g.style.opacity = "1"; }, (0.4 + r * 0.18 + Math.random() * 0.15) * 1000); });
      else kids.forEach((g) => { g.style.opacity = "1"; });
    },
    "cls.girl": (s, H) => { ring(s, H, GIRL, 0.3, 3); },
    "cls.bar": (s, H) => { H.grow(key(s, "b100"), 0.3); H.write(key(s, "b100L"), 0.8); H.write(key(s, "l1"), 2.2); },
    "cls.trap1": (s, H) => { setClass(s, H, [TRAP], { delay: 0.5 }); barSwap(s, H, true, 3.6); },
    "cls.back1": (s, H) => { setClass(s, H, []); barSwap(s, H, false, 3.4); },
    "cls.trap2": (s, H) => { setClass(s, H, [GIRL], { delay: 0.4 }); },
    "cls.back2": (s, H) => { setClass(s, H, []); },
    "cls.same": (s, H) => { ring(s, H, GIRL, 0.2, 3); H.focus(key(s, "l1"), 0.6, 1.8, 1.4); },
    "cls.bar50": (s, H) => { H.grow(key(s, "b50"), 0.3); H.write(key(s, "b50L"), 0.9); H.write(key(s, "l2"), 2); if (!isInstant(H)) H.focus(key(s, "l2"), 2.6, 1.8, 1.4); },
    "cls.leave": (s, H) => { setClass(s, H, LEAVERS, { delay: 0.4, stagger: 0.12 }); },
    "cls.check": (s, H) => { ring(s, H, GIRL, 0.3, 2.4); H.sound("ding", 0.6); },
  });

  return film({
    paperMm: PAPER, picW: PICW, ready: mathLoad(),
    asks: [{ id: "a1q", text: "100 pupils, 99% boys. How many boys must leave so that 98% are boys?" }],
    pics, picAt, lines: [], stages,
    steps: ({ push }) => {
      push("A class of a hundred pupils, all sitting at their desks. Ninety nine per cent of them are boys. How many boys must leave the room, so that ninety eight per cent are boys?",
        { on: ["a1q", "cls"], add: ["cls.base"], transition: "iris", pause: 1.2 });
      push("First, who is in the room? Ninety nine per cent of a hundred is ninety nine boys.",
        { on: ["a1"], add: ["a1.all"], cue: { "a1.all": "Ninety nine per cent of" }, pause: 0.6 });
      push("That leaves one girl. There she is, in the third row.",
        { on: ["a2"], add: ["a2.all", "cls.girl"], cue: { "cls.girl": "There she is" }, pause: 0.8 });
      push("As a bar: one box for every pupil. A hundred boxes, and her box at the end is one per cent.",
        { add: ["cls.bar"], cue: { "cls.bar": "one box for every" }, pause: 0.8 });
      /* trap 1 */
      push("Here's the answer most people give. Ninety nine down to ninety eight is one per cent. One per cent of a hundred is one pupil. So one boy leaves.",
        { off: ["a1", "a2"], transition: card("Trap 1", "one per cent, so one pupil"), pause: 0.5 });
      push("Let's try it. One boy stands up, and walks out of the door.",
        { add: ["cls.trap1"], cue: { "cls.trap1": "stands up" }, pause: 1 });
      push("Now there are ninety eight boys out of ninety nine pupils. Ninety eight over ninety nine is ninety eight point nine nine per cent.",
        { on: ["t1"], add: ["t1.all"], cue: { "t1.all": "Ninety eight over" }, pause: 0.6 });
      push("Not ninety eight. It hardly moved. Why? Because when he left, the whole class got smaller too. A per cent is a share of the whole, and the whole moved.",
        { on: ["t1b"], add: ["t1b.all"], pause: 1 });
      push("He comes back in and sits down.",
        { off: ["t1", "t1b"], add: ["cls.back1"], pause: 1.2 });
      /* trap 2 */
      push("Second trap. Send the girl out?",
        { transition: card("Trap 2", "send the girl out"), pause: 0.6 });
      push("Then everyone left is a boy. Ninety nine out of ninety nine is a hundred per cent. That's gone up, not down.",
        { on: ["t2"], add: ["cls.trap2", "t2.all"], cue: { "t2.all": "Ninety nine out of" }, pause: 1 });
      push("She comes back to her desk. To make the boys' share smaller, only boys can leave.",
        { off: ["t2"], add: ["cls.back2"], pause: 1.2 });
      /* the idea */
      push("So here's the thing that never changes. The girl stays. She is one pupil, before and after.",
        { add: ["cls.same"], transition: card("What stays the same", "one girl"), pause: 0.6 });
      push("Before, she is one per cent of a hundred.",
        { on: ["k1"], add: ["k1.all"], pause: 0.6 });
      push("After, the boys are ninety eight per cent, so she must be two per cent. Two per cent of what?",
        { on: ["k2"], add: ["k2.all"], pause: 1.4 });
      push("The same one pupil, a bigger share. That only happens if the whole gets smaller. A per cent is not a number of pupils. It's a share, and it grows and shrinks with the whole.",
        { pause: 1 });
      /* method 1 */
      push("Two per cent is two hundredths. Reduce it: one fiftieth.",
        { off: ["k1", "k2"], on: ["m1"], add: ["m1.all"], transition: card("Method 1", "the bar model"), pause: 0.6 });
      push("One fiftieth means: she is one box out of fifty. Draw the new bar, one box for each pupil, the same size as before. Fifty boxes. Look: her box hasn't changed at all. The bar around it is half as long, so her share is double.",
        { on: ["m2"], add: ["cls.bar50", "m2.all"], cue: { "cls.bar50": "Draw the new bar", "m2.all": "Fifty boxes" }, pause: 1 });
      push("So the class must shrink from a hundred to fifty. Fifty boys stand up, and walk out of the door.",
        { on: ["m3"], add: ["cls.leave", "m3.all"], cue: { "cls.leave": "Fifty boys", "m3.all": "from a hundred to fifty" }, pause: 4 });
      push("Check it. Forty nine boys out of fifty pupils. Forty nine fiftieths is ninety eight hundredths. Ninety eight per cent.",
        { on: ["m4"], add: ["m4.all", "cls.check"], cue: { "m4.all": "Forty nine fiftieths" }, pause: 1 });
      push("Fifty boys must leave. Not one. Fifty.",
        { pause: 1.2 });
      /* method 2 */
      push("Now the same in one line. Say x boys leave. The girl is one pupil out of a hundred take away x, and that must be two hundredths.",
        { off: ["m1", "m2", "m3", "m4"], on: ["e1"], add: ["e1.all"], cue: { "e1.all": "one pupil out of" }, transition: card("Method 2", "an equation"), pause: 0.8 });
      push("One over something is one fiftieth, so the something is fifty. A hundred take away x is fifty.",
        { on: ["e2"], add: ["e2.all"], cue: { "e2.all": "A hundred take away" }, pause: 0.6 });
      push("So x is fifty. The same answer.",
        { on: ["e3"], add: ["e3.all"], pause: 1 });
      push("Remember this class. One per cent of a hundred is one pupil, but one pupil is two per cent of fifty. A per cent is a share of the whole, so always ask: per cent of what?");
    },
  });
}
/* the first version told the same story with left- and right-handers; its id plays this film */
export const classHanded = classBoys;
