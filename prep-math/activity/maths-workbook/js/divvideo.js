/* ============================================================================
   Maths Workbook — PrepBot's video for dividing by one figure
   ----------------------------------------------------------------------------
   One video for PLACE VALUE DIVISION and one for BOX DIVISION, on the shared
   teacher's TV (mental-math/shared/prepbot-tv.js), with the number tiles of the
   Mental Maths Workbook (its explain.js `tile` and `acts`).

   THE SCREEN shows both charts of the paper at once:
     left    the COUNTING GRID — the number's counters in the top row, and each
             column's groups under it. The counters are real pieces: each one
             is dealt down into its group, and one that is left over breaks
             into ten that fly across to the next column.
     right   the INPUT GRID — filled in a box at a time, as each thing is said,
             with the arrow that carries what is left over.
     below   the rule, D M S R — "Does My Sister Run?" — and the letter of the
             step being done is the one that jumps.

   THE PLAN, for 472 ÷ 3 (both videos work the same sum, written two ways):
     1   the sum, and the two empty charts
     2   the counters that make 472 are taken: 4 hundreds, 7 tens, 2 ones
     3   the rule: Divide, Multiply, Subtract, Regroup
     then for EACH column — hundreds, tens, ones:
       D   its counters are dealt into the groups; the Divide box is written
       M   the groups are pointed at; the Multiply box is written
       S   what is still on top is pointed at; the Subtract box is written
       R   what is left breaks into ten of the next place and flies across;
           the arrow is drawn and the carry is written beside the next figure
           (in the ones there is nowhere to go: that is the remainder)
     last the answer is read off the Divide row

   Every step first PUTS the whole screen as it stood before it (`lay`) and
   then plays its own change, so going back or skipping lands exactly.
   ========================================================================== */

import { tile, acts, PLAY } from "/prep-math/activity/vedic-maths-workbook/js/explain.js";
import { ICON_PREPBOT } from "/prep-math/mental-math/shared/icons.js";
import { divWork } from "./divwork.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** What opens a section: PrepBot itself and a play button — no strip, no words (the method's name is the tooltip). */
export const videoStrip = (mode, label) =>
  `<div class="vm-video vm-video--icon has-video" data-divvideo="${mode}" data-title="${esc(label)}" tabindex="0" `
  + `aria-label="Watch PrepBot explain: ${esc(label)}" title="Watch PrepBot explain: ${esc(label)}">`
  + `<span class="vm-video__bot">${ICON_PREPBOT}</span>`
  + `<span class="vm-video__go">${PLAY}</span></div>`;

const FILL = { 100: "#8fd39a", 10: "#6fb7e8", 1: "#f4c95d" };
const EDGE = { 100: "#3f8f4f", 10: "#2a6ca8", 1: "#c9922f" };
const PAPER = { 100: "#c8f0c0", 10: "#bfe3ff", 1: "#fff3a8" };
const disc = (v) => `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${FILL[v]}" stroke="${EDGE[v]}" stroke-width="2.4"/>`
  + `<text x="16" y="16" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono, monospace" font-size="${v === 100 ? 10 : v === 10 ? 12 : 15}" font-weight="800" fill="#14130f">${v}</text></svg>`;

/* a hundredth of the screen's HEIGHT, in hundredths of its width (the screen is 16 : 9) */
const VH = 0.5625;

function divScene(mode, n = 472, d = 3) {
  const W = divWork(n, d);
  const k = W.cols.length;
  const PL = [{ v: 100, name: "hundreds", one: "hundred" }, { v: 10, name: "tens", one: "ten" }, { v: 1, name: "ones", one: "one" }].slice(3 - k);
  const val = (c, x) => (mode === "value" ? x * W.cols[c].place : x);

  /* ── the counting grid, on the left: all in hundredths of the screen ───── */
  const C = { x0: 3, lab: 8.5, cw: 14.5, yHead: 12, yTop: 17, yShare: 38, yEnd: 66 };
  const cx = (c) => C.x0 + C.lab + c * C.cw;
  const topSlot = (c, i) => [cx(c) + 1.9 + (i % 6) * 2.15, C.yTop + 3.6 + Math.floor(i / 6) * 3.7];
  const gw = C.cw / d, per = Math.max(1, Math.floor((gw - 0.6) / 2.05));
  const groupSlot = (c, g, j) => [cx(c) + g * gw + gw / 2 + ((j % per) - (per - 1) / 2) * 2.05, C.yShare + 3.6 + Math.floor(j / per) * 3.7];
  /* where counter i of column c stands in each PHASE of its column:
       −1 not taken yet · 0 the number's own counters on top · 1 the carried ones have joined them
        2 shared out — q × d in the groups, the rest on top · 3 the rest broken and gone to the next column */
  const own = (c) => W.cols[c].digit;
  const where = (c, i, ph) => {
    const { q } = W.cols[c];
    if (ph < 0) return null;
    if (ph === 0) return i < own(c) ? topSlot(c, i) : null;
    if (ph === 1) return topSlot(c, i);
    if (i < q * d) return groupSlot(c, i % d, Math.floor(i / d));
    return ph === 2 ? topSlot(c, i - q * d) : null;
  };
  const chartSvg = () => {
    const X = (x) => (x - C.x0) * 10, Y = (y) => (y - C.yHead) * 10 * VH;
    const w = X(cx(k)), h = Y(C.yEnd);
    let s = `<rect x="0" y="0" width="${w}" height="${h}" fill="#fffdf8"/><rect x="0" y="0" width="${X(cx(0))}" height="${h}" fill="#f4f0e8"/>`;
    PL.forEach((p, c) => {
      s += `<rect x="${X(cx(c))}" y="0" width="${C.cw * 10}" height="${Y(C.yTop)}" fill="${PAPER[p.v]}"/>`
        + `<text x="${X(cx(c)) + C.cw * 5}" y="${Y(C.yTop) * 0.68}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="15" font-weight="800" letter-spacing="1" fill="#14130f">${p.name.toUpperCase()}</text>`;
      for (let g = 1; g < d; g++) s += `<path d="M${X(cx(c) + g * gw)} ${Y(C.yShare)}V${h}" stroke="#8a837a" stroke-width="1.4" stroke-dasharray="5 4"/>`;
      s += `<path d="M${X(cx(c))} 0V${h}" stroke="#b8b1a4" stroke-width="1.6"/>`;
    });
    s += `<path d="M0 ${Y(C.yTop)}H${w}M0 ${Y(C.yShare)}H${w}" stroke="#b8b1a4" stroke-width="1.6"/>`
      + `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="#2a2723" stroke-width="2.4"/>`;
    const name = (t1, t2, y) => `<text x="${X(cx(0)) / 2}" y="${y}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12.5" font-weight="700" fill="#2a2723">${t1}</text>`
      + `<text x="${X(cx(0)) / 2}" y="${y + 15}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12.5" font-weight="700" fill="#2a2723">${t2}</text>`;
    s += name("The", "number", (Y(C.yTop) + Y(C.yShare)) / 2 - 4) + name("Shared", `into ${d}`, (Y(C.yShare) + h) / 2 - 4);
    return { w, h, s };
  };

  /* ── the input grid, on the right ──────────────────────────────────────── */
  const I = { x0: 58, name: 10, cw: 9.7, yHead: 12, yRow: 17, rh: 8.6 };
  const rows = mode === "value" ? ["number", "divide", "multiply", "subtract"] : ["divide", "number", "multiply", "subtract"];
  const ix = (c) => I.x0 + I.name + c * I.cw;
  const iy = (r) => I.yRow + rows.indexOf(r) * I.rh + I.rh / 2;
  const LETTER = { divide: "D", multiply: "M", subtract: "S" };
  const INK = { D: 2, M: 1, S: 4, R: 3 };
  const inputSvg = () => {
    const X = (x) => (x - I.x0) * 10, Y = (y) => (y - I.yHead) * 10 * VH;
    const w = X(ix(k)), h = Y(I.yRow + 4 * I.rh);
    let s = `<rect x="0" y="0" width="${w}" height="${h}" fill="#fffdf8"/><rect x="0" y="0" width="${X(ix(0))}" height="${h}" fill="#f4f0e8"/>`
      + `<rect x="${X(ix(0))}" y="${Y(iy("number") - I.rh / 2)}" width="${w - X(ix(0))}" height="${I.rh * 10 * VH}" fill="#fff9dc"/>`;
    PL.forEach((p, c) => {
      s += `<rect x="${X(ix(c))}" y="0" width="${I.cw * 10}" height="${Y(I.yRow)}" fill="${PAPER[p.v]}"/>`
        + `<text x="${X(ix(c)) + I.cw * 5}" y="${Y(I.yRow) * 0.68}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" font-weight="800" fill="#14130f">${p.name.toUpperCase()}</text>`
        + `<path d="M${X(ix(c))} 0V${h}" stroke="#b8b1a4" stroke-width="1.5"/>`;
    });
    for (let r = 0; r <= 4; r++) s += `<path d="M0 ${Y(I.yRow + r * I.rh)}H${w}" stroke="#b8b1a4" stroke-width="1.5"/>`;
    rows.forEach((r) => {
      const y = Y(iy(r)) + 4.5;
      if (r === "number") s += mode === "digit"
        ? `<text x="${X(ix(0)) - 12}" y="${y + 3}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="24" font-weight="800" fill="#14130f">${d}</text>`
        : `<text x="8" y="${y}" font-family="JetBrains Mono, monospace" font-size="11.5" font-weight="700" fill="#2a2723">The number</text>`;
      else s += `<text x="8" y="${y}" font-family="JetBrains Mono, monospace" font-size="11.5" font-weight="700" fill="#2a2723"><tspan font-weight="800" font-size="14" fill="${["", "#7b4fa3", "#2e8b46", "#2f6ea8", "#d9632b"][INK[LETTER[r]]]}">${LETTER[r]} </tspan>${r[0].toUpperCase() + r.slice(1)}</text>`;
    });
    /* the box: a heavy line over the number and down its door */
    if (mode === "digit") s += `<path d="M${X(ix(0))} ${Y(iy("number") + I.rh / 2)}V${Y(iy("number") - I.rh / 2)}H${w}" fill="none" stroke="#2a2723" stroke-width="4"/>`;
    s += `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="#2a2723" stroke-width="2.4"/>`;
    return { w, h, s };
  };
  /* the arrow that carries what column c has left, up from its Subtract box to beside the next figure */
  const arrowBox = (c) => {
    const xb = ix(c + 1), ys = iy("subtract"), yn = iy("number");
    const hU = (ys - yn) * VH + 2.4;          // its height, in hundredths of the width
    const H = hU * 10;
    return { x: xb, y: (ys + yn) / 2, wU: 3, hU,
      svg: `<svg viewBox="0 0 30 ${H}"><path d="M3 ${H - 12}Q15 ${H - 12} 15 ${H - 26}L15 26Q15 12 24 12" fill="none" stroke="#2f6ea8" stroke-width="3.4" stroke-linecap="round"/>`
        + `<path d="M21 4L30 12L21 20Z" fill="#2f6ea8"/></svg>` };
  };

  const art = (stage, id, x, y, widthU, html) => {
    const box = tile(stage, id, "", x, y, { bare: true });
    box.firstChild.className = "vm-t__in vm-t__art";
    box.firstChild.style.width = `calc(var(--u) * ${widthU})`;
    box.firstChild.innerHTML = html;
    return box;
  };
  const num = (stage, id, text, x, y, c, sizeU = 3.3) => { tile(stage, id, String(text), x, y, { c }).firstChild.style.fontSize = `calc(var(--u) * ${sizeU})`; };

  const RULE = [["D", "Does", "Divide"], ["M", "My", "Multiply"], ["S", "Sister", "Subtract"], ["R", "Run?", "Regroup"]];
  const build = (stage) => {
    stage.innerHTML = `<div class="vm-tv"></div>`;
    tile(stage, "sum", `${n} ÷ ${d}`, 29, 6, { c: 0 });
    const ch = chartSvg();
    art(stage, "chart", (C.x0 + cx(k)) / 2, (C.yHead + C.yEnd) / 2, ch.w / 10, `<svg viewBox="0 0 ${ch.w} ${ch.h}">${ch.s}</svg>`);
    const ig = inputSvg();
    art(stage, "grid", (I.x0 + ix(k)) / 2, (I.yHead + I.yRow + 4 * I.rh) / 2, ig.w / 10, `<svg viewBox="0 0 ${ig.w} ${ig.h}">${ig.s}</svg>`);
    W.cols.forEach((col, c) => {
      const mid = ix(c) + I.cw / 2;
      /* the figure of the number; and, beside every one but the first, what is carried to it */
      if (mode === "value") { num(stage, `n${c}`, col.digit * col.place, c ? mid + 2.9 : mid, iy("number"), 0, c ? 2.6 : 2.9); if (c) num(stage, `r${c}`, `${val(c - 1, W.cols[c - 1].s)}+`, mid - 0.9, iy("number"), 3, 1.9); }
      else { num(stage, `n${c}`, col.digit, c ? mid + 1.75 : mid, iy("number"), 0, 3.5); if (c) num(stage, `r${c}`, W.cols[c - 1].s, mid - 0.35, iy("number"), 3, 3.5); }
      num(stage, `q${c}`, val(c, col.q), mid, iy("divide"), INK.D);
      num(stage, `m${c}`, val(c, col.m), mid, iy("multiply"), INK.M);
      num(stage, `s${c}`, val(c, col.s), mid, iy("subtract"), INK.S);
      if (c < k - 1) { const a = arrowBox(c); art(stage, `a${c}`, a.x, a.y, a.wU, a.svg); }
      /* its counters: every one a piece of its own */
      for (let i = 0; i < col.now; i++) { const [x, y] = topSlot(c, i); art(stage, `k${c}_${i}`, x, y, 1.8, disc(PL[c].v)); }
    });
    RULE.forEach(([l, word, what], i) => {
      tile(stage, `L${i}`, l, 9 + i * 11.5, 76, { c: INK[l], size: "l" });
      tile(stage, `W${i}`, word, 9 + i * 11.5, 84.5, { bare: true, size: "s" });
      tile(stage, `Z${i}`, what, 9 + i * 11.5, 91, { c: INK[l], size: "s" });
    });
    num(stage, "ans", `${n} ÷ ${d} = ${W.q}${W.r ? ` r ${W.r}` : ""}`, (I.x0 + ix(k)) / 2, 59, 0, 3.1);
  };

  /* ── the script: what is on, and where every counter stands, after each step ── */
  const RULE_IDS = RULE.flatMap((_, i) => [`L${i}`, `W${i}`, `Z${i}`]);
  const events = [];
  let ph = Array(k).fill(-1), on = new Set();
  const push = (say, { phase = {}, show = [], play = () => {} } = {}) => {
    const before = { ph: [...ph], on: new Set(on) };
    Object.entries(phase).forEach(([c, p]) => { ph[Number(c)] = p; });
    show.forEach((id) => on.add(id));
    events.push({ say, before, after: { ph: [...ph], on: new Set(on) }, show, play });
  };
  const wordsOf = (t) => t.trim().split(/\s+/).length;
  const letter = (S, l, at = 0.3) => { const i = "DMSR".indexOf(l); S.pulse(`L${i}`, at); S.pulse(`Z${i}`, at + 0.15); };
  const V = (c, x) => val(c, x);

  push(`Let us divide ${n} by ${d} with counters and two charts. This is ${mode === "value" ? "place value division: we write the value every time" : "box division: we write only the digits"}.`,
    { show: ["sum", "chart", "grid", ...W.cols.map((_, c) => `n${c}`)] });
  push(`First, take the counters that make ${n}. ${W.cols.map((col, c) => `${col.digit} ${col.digit === 1 ? PL[c].one : PL[c].name}`).join(". ")}. They go in the top row.`,
    { phase: Object.fromEntries(W.cols.map((_, c) => [c, 0])) });
  push("Here is the rule for every column. Divide, Multiply, Subtract, Regroup. D, M, S, R: Does My Sister Run?", { show: RULE_IDS });

  W.cols.forEach((col, c) => {
    const P = PL[c], last = c === k - 1;
    push(`${c === 0 ? "Start with" : "Now"} the ${P.name}. D: divide. Share the ${col.now} ${col.now === 1 ? P.one : P.name} into ${d} groups. `
      + (col.q ? `${col.q} in each group. Write ${V(c, col.q)}.` : `There are not enough to give every group one. Write 0.`),
      { phase: { [c]: 2 }, show: [`q${c}`], play: (S) => letter(S, "D") });
    push(`M: multiply. ${d} groups of ${V(c, col.q)} is ${V(c, col.m)}. That is how many we shared out. Write ${V(c, col.m)}.`,
      { show: [`m${c}`], play: (S) => { letter(S, "M"); for (let i = 0; i < col.m; i++) S.pulse(`k${c}_${i}`, 1.6 + (i % d) * 0.5); } });
    push(`S: subtract. ${V(c, col.now)} take away ${V(c, col.m)} leaves ${V(c, col.s)}. ` + (col.s ? `That is the ${col.s} still on top.` : "Nothing is left on top."),
      { show: [`s${c}`], play: (S) => { letter(S, "S"); for (let i = col.m; i < col.now; i++) S.pulse(`k${c}_${i}`, 3.4 + (i - col.m) * 0.3); } });
    if (!last) {
      const N = PL[c + 1], nx = W.cols[c + 1];
      push(`R: regroup. ` + (col.s
        ? `Break ${col.s === 1 ? `the ${P.one}` : `each ${P.one}`} that is left into 10 ${N.name}. That makes ${col.s * 10} ${N.name}, and with the ${nx.digit} already there, ${nx.now} ${N.name}. `
          + `Follow the arrow, and write the ${V(c, col.s)} beside the ${V(c + 1, nx.digit)}: ${V(c + 1, nx.now)}.`
        : `Nothing is left to break. Follow the arrow and write 0: the ${N.name} stay as ${nx.digit}.`),
      { phase: { [c]: 3, [c + 1]: 1 }, show: [`a${c}`, `r${c + 1}`], play: (S) => letter(S, "R") });
    } else {
      push(col.s ? `R: there is no next place to regroup into. So the ${col.s} left over is the remainder.` : "R: nothing is left over, so there is no remainder.",
        { play: (S) => { letter(S, "R"); for (let i = col.m; i < col.now; i++) S.pulse(`k${c}_${i}`, 2.4); S.pulse(`s${c}`, 2.8); } });
    }
  });
  push((mode === "value"
    ? `Now add the divide row. ${W.cols.map((col, c) => V(c, col.q)).join(" and ")} is ${W.q}.`
    : `Now read the row on top of the box. ${W.cols.map((col) => col.q).join(", ")}.`)
    + ` So ${n} divided by ${d} is ${W.q}${W.r ? `, remainder ${W.r}` : ""}.`,
  { show: ["ans"], play: (S) => W.cols.forEach((_, c) => S.pulse(`q${c}`, 1.4 + c * 0.6)) });

  const ALL = ["sum", "chart", "grid", "ans", ...RULE_IDS, ...W.cols.flatMap((_, c) => [`n${c}`, `q${c}`, `m${c}`, `s${c}`, ...(c ? [`r${c}`] : []), ...(c < k - 1 ? [`a${c}`] : [])])];
  /** the whole screen, as a state says it stands */
  const lay = (S, st) => {
    ALL.forEach((id) => S.put(id, { on: st.on.has(id) ? 1 : 0 }));
    W.cols.forEach((col, c) => { for (let i = 0; i < col.now; i++) { const at = where(c, i, st.ph[c]); const [x, y] = at || topSlot(c, i); S.put(`k${c}_${i}`, { on: at ? 1 : 0, x, y }); } });
  };
  const steps = events.map((ev) => ({
    say: ev.say,
    show(stage, how) {
      const S = acts(stage, how.gsap, how.instant);
      lay(S, ev.before);
      const t0 = Math.min(6.5, 0.8 + wordsOf(ev.say) * 0.14);
      /* the counters: taken, dealt down one at a time, or broken and sent across */
      W.cols.forEach((col, c) => {
        const a = ev.before.ph[c], b2 = ev.after.ph[c];
        if (a === b2) return;
        for (let i = 0; i < col.now; i++) {
          const from = where(c, i, a), to = where(c, i, b2);
          const id = `k${c}_${i}`;
          if (!from && to) {
            if (b2 === 1) {
              /* carried in: it flies from the counter that was broken, in the column before */
              const j = Math.floor((i - own(c)) / 10), prev = W.cols[c - 1];
              const [fx, fy] = topSlot(c - 1, j);
              S.fly(id, fx, fy, t0 + 0.6 + (i - own(c)) * 0.07 + (prev.s > 1 ? j * 0.5 : 0));
            } else S.pop(id, 1.6 + c * 1.5 + i * 0.12);
          } else if (from && !to) S.hide(id, t0);
          else if (from && to && (from[0] !== to[0] || from[1] !== to[1])) S.move(id, to[0], to[1], t0 + i * (col.now > 12 ? 0.14 : 0.24));
        }
      });
      /* what is written or drawn at this step comes on after the counters have shown it */
      const moved = W.cols.reduce((m2, col, c) => (ev.before.ph[c] !== ev.after.ph[c] && ev.after.ph[c] === 2 ? Math.max(m2, col.m * (col.now > 12 ? 0.14 : 0.24)) : m2), 0);
      ev.show.forEach((id, j) => { if (!ev.before.on.has(id)) S.pop(id, (RULE_IDS.includes(id) ? 2.2 + RULE_IDS.indexOf(id) * 0.35 : /^[qmsra]/.test(id) ? t0 + moved + 0.8 + j * 0.5 : 0.3 + j * 0.2)); });
      ev.play(S);
    },
  }));
  return { build, steps };
}

/* ── the strip is tapped: the set comes up ───────────────────────────────── */
let tvOpen = false;
async function play(strip) {
  if (tvOpen) return;
  const made = divScene(strip.dataset.divvideo === "digit" ? "digit" : "value");
  const sized = (stage) => { made.build(stage); stage.querySelector(".vm-tv").style.setProperty("--u", `${stage.clientWidth / 100}px`); };
  tvOpen = true;
  strip.classList.add("is-playing");
  try {
    const { openTv } = await import("/prep-math/mental-math/shared/prepbot-tv.js");
    await openTv({ title: strip.dataset.title || "", build: sized, steps: made.steps });
    const refit = () => { const st = document.querySelector(".mm-tv-overlay [data-tv='stage'] .vm-tv"); if (st) st.style.setProperty("--u", `${st.parentElement.clientWidth / 100}px`); };
    window.addEventListener("resize", refit);
    document.addEventListener("fullscreenchange", refit);
    const watch = new MutationObserver(() => {
      if (document.querySelector(".mm-tv-overlay")) return;
      watch.disconnect();
      window.removeEventListener("resize", refit);
      document.removeEventListener("fullscreenchange", refit);
      tvOpen = false;
      strip.classList.remove("is-playing");
    });
    watch.observe(document.body, { childList: true });
  } catch (err) {
    tvOpen = false;
    strip.classList.remove("is-playing");
    console.error("PrepBot's TV could not be opened", err);
  }
}

if (typeof document !== "undefined" && !document.__divVideo) {
  document.__divVideo = true;
  const open = (e) => {
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    const strip = e.target.closest?.(".vm-video[data-divvideo]");
    if (!strip) return;
    e.preventDefault();
    play(strip);
  };
  document.addEventListener("click", open);
  document.addEventListener("keydown", open);
}
