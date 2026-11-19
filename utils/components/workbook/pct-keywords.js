/* ============================================================================
   PERCENTAGE KEYWORDS — five short films, one per keyword group
   ----------------------------------------------------------------------------
   The user (2026-11-19), on the old single "Percentage keywords" film:
     "too long for one video. Break each keyword group to its own video. The
      explanation for 'of' doesn't do justice. Maybe add some visuals.
      Show how percent turns to decimal by shifting the place value across the
      decimal point. But animate the fraction and decimal separately and on
      different lines.
      After reducing, show the denominator tells us how many cuts, zoom
      denominator and cuts, then the numerator points to what we are
      considering: take part(s), add part(s) or subtract part(s). Use example
      for multi parts too like 75%.
      When adding or subtracting parts, show it in the bars, fraction, and
      words as labels above the fraction. Then you can now show it in decimal.
      Words will be 4 fourths + 3 fourths is 7 fourths."

     pct-kw-part    take a part (of, commission, interest), with "of" SEEN:
                    divide by the bottom (the cuts), multiply by the top (the boxes)
     pct-kw-add     add on (increase by, profit)
     pct-kw-away    take away (discount, off, loss)
     pct-kw-out     out of (out of, what percentage)
     pct-kw-whole   find the whole (original, cost price) + the up-then-down trap

   Every example walks the same road:
     1. the question, its keyword boxed and noted
     2. the per cent as a FRACTION, reduced prime by prime, then by the HCF
     3. the per cent as a DECIMAL, on its own line: the figures slide two
        places across a point that never moves (÷ 100), noughts hold places
     4. the bar: the fraction stands beside it; the DENOMINATOR swells and the
        bar is cut into that many boxes; the NUMERATOR swells and points at the
        boxes we want — taken (yellow), added (green) or taken away (struck)
     5. the fraction sum, with its words written above each fraction
        ("4 fourths + 1 fourth = 5 fourths"), then the decimal line
   ========================================================================== */

import { film } from "./film-kit.js";
import { mathLoad } from "./film-math.js";
import { mathRow, svgBox, centred, PAPER, PIC_W } from "./cbt-films.js";
import { noteKeyword } from "./film-ask.js";
import { tableLine, tableCol } from "./film-table.js";

const INK = "#2a2723", GREEN = "#2f7d4a", PURPLE = "#6b4fa0", RED = "#c0453f", BLUE = "#2f6f8f";
const SKY = "#bfe3ff", LEAF = "#c8f0c0", PALE = "#e6e0d6", PART = "#f4c95d";
const TAKE = "#f8d77a", ADD = "#c8f0c0", AWAY = "#ffd7a3", WHOLE = "#e8c8ff", OUT = "#fff3a8";
const L = (k, t, color) => ({ k, tex: t, ...(color ? { color } : {}) });
const main = (pieces, em = 6.4) => svgBox(150, 30, mathRow(pieces, { cx: 75, y: 17, em }).svg);
const at = (y) => centred(150, y);
const key = (s, k) => (s ? s.querySelector(`[data-k="${k}"]`) : null);
const isInstant = (H) => H.show === H.grow;
const card = (title, sub) => ({ kind: "card", title, sub, hold: 1.6 });
const S = (x, y, size, t, anchor = "middle", fill = INK, extra = "") => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="STIX Two Text, Cambria Math, serif" font-size="${size}" fill="${fill}" ${extra}>${t}</text>`;
const f2 = (n) => Number(n).toFixed(2);
const gcd = (x, y) => (y ? gcd(y, x % y) : x);
const primeSteps = (a, b) => {
  const out = [];
  for (let q = 2; q <= Math.min(a, b);) { if (a % q === 0 && b % q === 0) { a /= q; b /= q; out.push([q, a, b]); } else q++; }
  return out;
};
const WHY = { 2: "Both are even, so divide both by two", 3: "Both are in the three times table, so divide both by three", 5: "Both end in five or nought, so divide both by five", 7: "Both are in the seven times table, so divide both by seven" };
const PARTNAME = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["fourth", "fourths"], 5: ["fifth", "fifths"], 10: ["tenth", "tenths"], 20: ["twentieth", "twentieths"], 25: ["twenty-fifth", "twenty-fifths"], 100: ["hundredth", "hundredths"] };
const partWord = (k, d) => `${k} ${(PARTNAME[d] || [`${d}th`, `${d}ths`])[k === 1 ? 0 : 1]}`;
/** a fraction with its words above it: 4 fourths over 4/4 */
const worded = (k, d) => `\\overset{\\text{${partWord(k, d)}}}{\\dfrac{${k}}{${d}}}`;

/* ── THE BAR WITH ITS FRACTION BESIDE IT ──────────────────────────────────── */
/** n equal boxes worth `val`; `extra` added on (green); the last `pale` taken away; `part` coloured.
    The reduced fraction num/den stands at the left: its bottom cuts, its top points. */
function fbar({ n, val, top, num, den, extra = 0, pale = 0, ops = null }) {
  const U = Math.min(17, 104 / (n + extra)), X0 = 36, Y = 9, HB = 10;
  const fs = Math.min(4.4, U * 0.42);
  let o = "";
  /* the fraction, big, at the left */
  o += `<g data-mb="num" data-k="fn">${S(17, Y + 2.6, 6.6, num, "middle", INK, 'font-weight="700"')}</g>`;
  o += `<g data-mb="name" data-k="fl"><path d="M11.5 ${Y + 4.6} H22.5" stroke="${INK}" stroke-width="0.6"/></g>`;
  o += `<g data-mb="num" data-k="fd">${S(17, Y + 11.4, 6.6, den, "middle", INK, 'font-weight="700"')}</g>`;
  o += `<g data-mb="name" data-k="top"><path d="M${X0} ${Y - 1.5} V${Y - 3} H${f2(X0 + n * U)} V${Y - 1.5}" fill="none" stroke="${INK}" stroke-width="0.5"/>`
    + `<text data-k="topv" x="${f2(X0 + (n * U) / 2)}" y="${Y - 4.2}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="4.6" fill="${INK}">${top}</text></g>`;
  o += `<g data-mb="bar" data-k="whole">`;
  for (let i = 0; i < n; i++) o += `<rect data-k="b${i}" x="${f2(X0 + i * U)}" y="${Y}" width="${f2(U + 0.05)}" height="${HB}" fill="${SKY}"/>`;
  o += `<rect x="${X0}" y="${Y}" width="${f2(n * U)}" height="${HB}" fill="none" stroke="${INK}" stroke-width="0.6"/></g>`;
  for (let i = 1; i < n; i++) o += `<g data-mb="brace" data-mb-key="cut${i}"><path d="M${f2(X0 + i * U)} ${Y} V${Y + HB}" fill="none" stroke="${INK}" stroke-width="0.6"/></g>`;
  for (let i = 0; i < n; i++) o += `<g data-mb="num" data-k="v${i}">${S(f2(X0 + i * U + U / 2), Y + 6.6, fs, String(val))}</g>`;
  for (let j = 0; j < extra; j++) {
    const x = X0 + (n + j) * U;
    o += `<g data-mb="bar" data-k="x${j}"><rect x="${f2(x)}" y="${Y}" width="${f2(U)}" height="${HB}" fill="${LEAF}" stroke="${INK}" stroke-width="0.6"/>${S(f2(x + U / 2), Y + 6.6, fs, String(val))}</g>`;
  }
  for (let i = n - pale; i < n; i++) {
    const x = X0 + i * U;
    o += `<g data-mb="num" data-k="p${i}"><rect x="${f2(x)}" y="${Y}" width="${f2(U)}" height="${HB}" fill="${PALE}" stroke="${INK}" stroke-width="0.6"/>`
      + `${S(f2(x + U / 2), Y + 6.6, fs, String(val), "middle", "#9a948a")}<path d="M${f2(x)} ${Y + HB} L${f2(x + U)} ${Y}" stroke="${RED}" stroke-width="0.7"/></g>`;
  }
  if (ops) {
    o += `<g data-mb="name" data-k="op0">${S(f2(X0 + (n * U) / 2), Y + HB + 5.4, 4, ops[0], "middle", PURPLE)}</g>`;
    o += `<g data-mb="name" data-k="op1">${S(f2(X0 + (n * U) / 2), Y + HB + 10.4, 4, ops[1], "middle", GREEN)}</g>`;
  } else o += `<g data-mb="name" data-k="hund">${S(f2(X0 + (n * U) / 2), Y + HB + 5.2, 3.8, "100%", "middle", "#6b645b")}</g>`;
  return svgBox(150, ops ? 32 : 26, o);
}
const fbarStages = (id, { n, extra = 0, pale = 0, part = 0, topTo = null }) => ({
  /* the fraction, then the whole as ONE bar (it is cut next, never drawn box by box) */
  [`${id}.base`]: (s, H) => {
    for (let i = 0; i < n; i++) key(s, `b${i}`)?.setAttribute("fill", SKY);
    /* a copy still flying from a step that has been left comes off the drawing */
    if (s) { s.__fb = (s.__fb || 0) + 1; s.querySelectorAll("[data-clone]").forEach((c) => c.remove()); }
    const tv = key(s, "topv"); if (tv && tv.dataset.was) { tv.textContent = tv.dataset.was; tv.setAttribute("fill", INK); }
    H.write(key(s, "fn"), 0); H.write(key(s, "fl"), 0.1); H.write(key(s, "fd"), 0.2);
    H.write(key(s, "top"), 0.5);
    H.grow(key(s, "whole"), 0.7);
    H.write(key(s, "hund"), 1.1);
  },
  /* THE DENOMINATOR TELLS US HOW MANY CUTS: it swells, and the knife goes through the bar */
  [`${id}.cut`]: (s, H) => {
    H.focus(key(s, "fd"), 0, 2.4, 1.8);
    const gap = Math.min(0.35, 2.4 / n);
    for (let i = 1; i < n; i++) {
      const g = s?.querySelector(`[data-mb-key="cut${i}"]`);
      H.draw(g, 0.6 + (i - 1) * gap);
      H.lit(g, 0.7 + (i - 1) * gap, 1.4, RED);
    }
    if (n > 1 && !isInstant(H)) H.sound("snip", 0.6);
  },
  [`${id}.fill`]: (s, H) => { for (let i = 0; i < n; i++) H.write(key(s, `v${i}`), 0.1 + i * Math.min(0.15, 1.8 / n)); },
  /* THE NUMERATOR POINTS: it swells, and the boxes it counts take their action's colour */
  [`${id}.act`]: (s, H) => {
    H.focus(key(s, "fn"), 0, 2.2, 1.8);
    for (let i = 0; i < part; i++) {
      const b = key(s, `b${i}`);
      if (!b) continue;
      if (isInstant(H)) { b.setAttribute("fill", PART); continue; }
      setTimeout(() => { b.style.transition = "fill .45s"; b.setAttribute("fill", PART); }, (0.8 + i * 0.4) * 1000);
      H.lit(b, 0.8 + i * 0.4, 1.2, RED);
    }
    /* ADDING ON IS A COPY OF A PART: "highlight 1 from the 4 cuts and clone and move it to show
       increase". The box the numerator counts is lit, a copy of it lifts off, travels along the top
       and lands as the new box on the end, which then turns green. */
    for (let j = 0; j < extra; j++) {
      const tgt = key(s, `x${j}`);
      if (isInstant(H) || !s) { H.show(tgt); continue; }
      const t0 = 0.8 + j * 1.9, src = key(s, `b${j % n}`), val = key(s, `v${j % n}`);
      H.lit(src, t0, 1.4, RED);
      const gen = s.__fb;
      setTimeout(() => {
        if (!s.isConnected || s.__fb !== gen) return;
        const r = tgt?.querySelector("rect");
        if (!src || !r) { H.show(tgt); return; }
        const x0 = Number(src.getAttribute("x")), y0 = Number(src.getAttribute("y")), w = Number(src.getAttribute("width")), h = Number(src.getAttribute("height"));
        const dx = Number(r.getAttribute("x")) - x0;
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("data-clone", "1");
        g.innerHTML = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${SKY}" stroke="${RED}" stroke-width="0.8"/>` + (val ? val.innerHTML : "");
        s.append(g);
        H.sound("whoosh", 0);
        const lift = -(h + 3);
        const anim = g.animate([
          { transform: "translate(0px, 0px)" },
          { transform: `translate(0px, ${lift}px)`, offset: 0.25 },
          { transform: `translate(${dx}px, ${lift}px)`, offset: 0.75 },
          { transform: `translate(${dx}px, 0px)` },
        ], { duration: 1500, easing: "ease-in-out", fill: "forwards" });
        anim.onfinish = () => { g.remove(); H.write(tgt, 0); H.sound("pop", 0); };
      }, (t0 + 0.5) * 1000);
    }
    for (let i = n - pale; i < n; i++) H.write(key(s, `p${i}`), 0.8 + (i - n + pale) * 0.45);
    if (!isInstant(H)) H.sound("pop", 0.8);
  },
  [`${id}.whole`]: (s, H) => {
    const t = key(s, "topv");
    if (t && topTo != null) { if (!t.dataset.was) t.dataset.was = t.textContent; t.textContent = topTo; t.setAttribute("fill", GREEN); H.focus(key(s, "top"), 0.1, 1.6, 1.25); }
    if (!isInstant(H)) H.sound("ding", 0.2);
  },
  [`${id}.op0`]: (s, H) => H.write(key(s, "op0"), 0.1),
  [`${id}.op1`]: (s, H) => H.write(key(s, "op1"), 0.1),
});

/* ── THE DECIMAL: figures slide across a point that never moves ───────────── */
const COLW = 14, PTW = 5, DX0 = 52;
const COLS = ["hundreds", "tens", "ones", "tenths", "hundredths"];
const dcx = (c) => DX0 + c * COLW + COLW / 2 + (c >= 3 ? PTW : 0);
/** from: "25" (÷ 100: a per cent to a decimal) or "0.75" (× 100: a decimal to a per cent) */
function shiftPlan(from, mode) {
  const tiles = [];
  if (mode === "div") {
    const ds = from.split("");
    ds.forEach((d, i) => tiles.push({ d, col: 2 - (ds.length - 1 - i) }));
  } else {
    const [a, b = ""] = from.split(".");
    a.split("").forEach((d, i) => tiles.push({ d, col: 2 - (a.length - 1 - i) }));
    b.split("").forEach((d, i) => tiles.push({ d, col: 3 + i }));
  }
  const sh = mode === "div" ? 2 : -2;
  tiles.forEach((t) => { t.to = t.col + sh; });
  const nz = tiles.filter((t) => t.d !== "0").map((t) => t.to);
  const lo = Math.min(Math.min(...nz), 2), hi = Math.max(Math.max(...tiles.map((t) => t.to)), 2);
  const taken = new Set(tiles.map((t) => t.to));
  const zeros = [];
  for (let c = lo; c <= hi; c++) if (!taken.has(c)) zeros.push(c);
  /* noughts that drop off: in front of the number, or at the end after the point */
  const lastNz = Math.max(...nz);
  tiles.forEach((t) => { t.drop = t.d === "0" && (t.to < lo || (t.to > 2 && t.to > lastNz)); });
  const value = mode === "div" ? Number(from) / 100 : Math.round(Number(from) * 100);
  return { tiles, zeros, value };
}
function dpic(from, mode, label) {
  const { tiles, zeros, value } = shiftPlan(from, mode);
  let o = `<g data-mb="name" data-k="lbl">${S(4, 16.5, 4.4, label, "start", BLUE)}</g>`;
  o += `<g data-mb="name" data-k="hd">`;
  COLS.forEach((name, c) => {
    const x = DX0 + c * COLW + (c >= 3 ? PTW : 0);
    o += `<rect x="${x}" y="8.5" width="${COLW}" height="11" fill="#fffdf8" stroke="${INK}" stroke-width="0.35"/>` + S(dcx(c), 6.6, 2.9, name, "middle", "#6b645b");
  });
  o += `<circle cx="${DX0 + 3 * COLW + PTW / 2}" cy="17.4" r="1.1" fill="${RED}"/></g>`;
  tiles.forEach((t, i) => { o += `<g data-mb="num" data-k="d${i}"><g class="mv" data-dx="${dcx(t.to) - dcx(t.col)}">${S(dcx(t.col), 17.2, 7.2, t.d)}</g></g>`; });
  zeros.forEach((c, i) => { o += `<g data-mb="num" data-k="z${i}">${S(dcx(c), 17.2, 7.2, "0", "middle", GREEN)}</g>`; });
  /* THE ARROWHEAD LIES ALONG THE CURVE where it arrives (from the control point to the end), and it
     comes in with the label once the stroke has been drawn (film-kit draw() fades in nested svgs) */
  const [from0, to0] = mode === "div" ? [dcx(1), dcx(3)] : [dcx(3), dcx(1)];
  const a = dcx(1), b = dcx(3), cx = (a + b) / 2, cy = 26.5, Y = 21.8;
  const ux = to0 - cx, uy = Y - cy, ul = Math.hypot(ux, uy), dx = ux / ul, dy = uy / ul;
  const bx = to0 - dx * 2, by = Y - dy * 2, px = -dy * 1, py = dx * 1;
  const head = `<svg overflow="visible"><polygon points="${f2(to0)},${f2(Y)} ${f2(bx + px)},${f2(by + py)} ${f2(bx - px)},${f2(by - py)}" fill="${PURPLE}"/></svg>`;
  const arrow = `<path d="M${f2(from0)} ${Y} Q${f2(cx)} ${cy} ${f2(to0)} ${Y}" fill="none" stroke="${PURPLE}" stroke-width="0.55"/>${head}`;
  o += `<g data-mb="brace" data-mb-key="arr">${arrow}${S((a + b) / 2, 28.6, 3.4, mode === "div" ? "÷ 100: two places right" : "× 100: two places left", "middle", PURPLE)}</g>`;
  const res = mode === "div" ? String(value) : `${value}%`;
  o += `<g data-mb="num" data-k="res">${S(DX0 + 5 * COLW + PTW + 4, 16.5, 5.6, `= ${res}`, "start", GREEN)}</g>`;
  return svgBox(150, 30, o);
}
const dStages = (id, from, mode) => {
  const { tiles, zeros } = shiftPlan(from, mode);
  return {
    [`${id}.all`]: (s, H) => {
      if (!s) return;
      const inst = isInstant(H);
      s.__gen = (s.__gen || 0) + 1;
      const gen = s.__gen;
      const later = (t, fn) => { if (inst) fn(); else setTimeout(() => { if (s.__gen === gen) fn(); }, t * 1000); };
      const mv = (i) => key(s, `d${i}`)?.querySelector(".mv");
      tiles.forEach((t, i) => { const m = mv(i); if (m) { m.style.transition = "none"; m.style.transform = ""; m.style.opacity = ""; } });
      H.write(key(s, "lbl"), 0); H.write(key(s, "hd"), 0.4);
      tiles.forEach((t, i) => H.write(key(s, `d${i}`), 1 + i * 0.3));
      H.draw(s.querySelector('[data-mb-key="arr"]'), 2.4);
      later(3.2, () => tiles.forEach((t, i) => { const m = mv(i); if (m) { m.style.transition = inst ? "none" : "transform 1s cubic-bezier(.45,0,.2,1)"; m.style.transform = `translate(${m.dataset.dx}px, 0px)`; } }));
      if (!inst) H.sound("whoosh", 3.2);
      zeros.forEach((c, i) => H.write(key(s, `z${i}`), 4.6 + i * 0.3));
      later(5.4, () => tiles.forEach((t, i) => { if (t.drop) { const m = mv(i); if (m) { m.style.transition = inst ? "none" : "opacity .6s"; m.style.opacity = "0"; } } }));
      H.write(key(s, "res"), 6);
      if (!inst) H.sound("ding", 6.1);
    },
  };
};

/* ── ONE FILM ─────────────────────────────────────────────────────────────── */
/**
 * group: { j, head, tone, cells, intro: [say lines], introKeys }
 * examples: [{ id, q, keys: [[word, note, tone]], pct: [a, b], mode: "part"|"add"|"away"|"out"|"whole-away"|"whole-add",
 *              bar: { n, val, top, part|extra|pale, topTo }, dec: [from, mode, label], sumTex, decTex, say: {...} }]
 */
function kwFilm({ ask, askKeys, group, before = null, examples, after = null, extraLines = [] }) {
  const pics = {}, picAt = {}, stages = {};
  const asks = [{ id: "a0", text: ask, keys: askKeys.map((k) => k[0]) }, ...examples.map((e) => ({ id: e.id, text: e.q, keys: e.keys.map((k) => k[0]) }))];
  const kw = (id, k, note, tone) => (svg, H, stage) => {
    const inner = stage?.querySelector(`[data-t="${id}"]`)?.firstChild;
    noteKeyword(inner, k, note, { instant: isInstant(H), tone });
  };
  askKeys.forEach(([k, note, tone], j) => { stages[`k.a0.${j}`] = kw("a0", k, note, tone); });
  stages["kw.col"] = tableCol("kw", 0);

  examples.forEach((e) => {
    e.keys.forEach(([k, note, tone], j) => { stages[`k.${e.id}.${j}`] = kw(e.id, k, note, tone); });
    const [pa, pb] = e.pct, steps = primeSteps(pa, pb), h = gcd(pa, pb), fa = pa / h, fb = pb / h;
    e.r = { pa, pb, steps, h, fa, fb };
    const chain = [L("s0", `\\dfrac{${pa}}{${pb}}`)];
    steps.forEach(([q, x, y], k) => { chain.push(L(`o${k}`, `\\xrightarrow{\\ \\div ${q}\\ }`, PURPLE)); chain.push(L(`s${k + 1}`, `\\dfrac{${x}}{${y}}`, k === steps.length - 1 ? GREEN : null)); });
    pics[`${e.id}P`] = () => main(chain, steps.length > 2 ? 6 : 6.8);
    pics[`${e.id}H`] = () => main([L("a", `\\text{HCF}(${pa}, ${pb}) = ${h}`, PURPLE), L("e", "\\quad"), L("b", `\\dfrac{${pa} \\div ${h}}{${pb} \\div ${h}} = \\dfrac{${fa}}{${fb}}`, GREEN)], 6.2);
    pics[`${e.id}D`] = () => dpic(...e.dec);
    pics[`${e.id}b`] = () => fbar({ ...e.bar, num: fa, den: fb });
    /* ONE IDEA A LINE ("always use multilines instead of clustering two ideas on one line"): the
       worded sum is one line; what follows its "⇒" goes underneath, one statement a line; the decimal
       working is one line per statement too */
    const cut = e.sumTex.findIndex((t) => t.startsWith("\\Rightarrow"));
    const head = cut < 0 ? e.sumTex : e.sumTex.slice(0, cut);
    const tail = cut < 0 ? [] : e.sumTex.slice(cut).join(" ").replace(/^\\Rightarrow\\ ?/, "").split(/,\\ /).map((t) => t.trim()).filter(Boolean);
    e.sLines = [head, ...tail.map((t) => [t])];
    e.xLines = e.decTex ? e.decTex.join(" ").split(/,\\quad/).map((t) => t.trim()).filter(Boolean) : [];
    e.sLines.forEach((pieces, j) => { pics[`${e.id}S${j}`] = () => main(pieces.map((t, i) => L(`m${i}`, t, j === e.sLines.length - 1 && i === pieces.length - 1 ? GREEN : null)), j ? 6 : (e.sumEm || 5.6)); });
    e.xLines.forEach((t, j) => { pics[`${e.id}X${j}`] = () => main([L("m0", t, j === e.xLines.length - 1 ? GREEN : null)], 6); });
    picAt[`${e.id}P`] = at(12); picAt[`${e.id}H`] = at(22); picAt[`${e.id}D`] = at(35);
    picAt[`${e.id}b`] = centred(150, 14);
    /* the lines stack under the bar: the worded line is the tallest; four lines fit, so when there are
       more, the decimal lines take the place of the fraction lines under the first */
    const SY = (j) => (j === 0 ? 23 : 23 + 8.5 + (j - 1) * 6.6);
    e.sLines.forEach((_, j) => { picAt[`${e.id}S${j}`] = at(SY(j)); });
    e.xFrom = e.sLines.length + e.xLines.length > 4 ? 1 : e.sLines.length;
    e.xLines.forEach((_, j) => { picAt[`${e.id}X${j}`] = at(SY(e.xFrom + j)); });
    if (e.mode === "out") picAt[`${e.id}D`] = at(37);
    stages[`${e.id}P.all`] = (sv, H) => { const ks = ["s0", ...steps.flatMap((_, k) => [`o${k}`, `s${k + 1}`])]; ks.forEach((k, i) => H.write(key(sv, k), i === 0 ? 0 : 1.4 + (i - 1) * 1.3)); };
    stages[`${e.id}H.all`] = (sv, H) => { H.write(key(sv, "a"), 0); H.write(key(sv, "e"), 0.6); H.write(key(sv, "b"), 1.8); H.sound("ding", 2); };
    Object.assign(stages, dStages(`${e.id}D`, e.dec[0], e.dec[1]));
    Object.assign(stages, fbarStages(`${e.id}b`, e.bar));
    let t0 = 0;
    e.sLines.forEach((pieces, j) => {
      const start = t0;
      stages[`${e.id}S${j}.all`] = (sv, H) => { pieces.forEach((_, i) => H.write(key(sv, `m${i}`), start + i * (e.sumGap || 1.1))); };
      t0 += pieces.length * (e.sumGap || 1.1) + 1.4;
    });
    e.xLines.forEach((_, j) => { stages[`${e.id}X${j}.all`] = (sv, H) => { H.write(key(sv, "m0"), j * 2.6); if (j === e.xLines.length - 1) H.sound("ding", j * 2.6 + 0.3); }; });
  });
  if (before) Object.assign(pics, before.pics), Object.assign(picAt, before.picAt), Object.assign(stages, before.stages);
  if (after) Object.assign(pics, after.pics), Object.assign(picAt, after.picAt), Object.assign(stages, after.stages);

  return film({
    paperMm: PAPER, picW: PIC_W, ready: mathLoad(),
    asks, pics, picAt,
    lines: [
      tableLine("kw", [{ head: group.head, tone: group.tone, cells: group.cells }], { y: 22, w: 30, size: 1.6 }),
      ...extraLines,
    ],
    stages,
    steps: ({ push }) => {
      push(group.intro[0], { on: ["a0"], add: askKeys.map((_, j) => `k.a0.${j}`), cue: Object.fromEntries(askKeys.map(([k], j) => [`k.a0.${j}`, group.cueWord || k])), transition: "iris", pause: 0.8 });
      push(group.intro[1], { on: ["kw"], off: ["a0"], add: ["kw.col"], cue: { "kw.col": group.cueCol || "column" }, transition: card("The keywords", group.head), pause: 0.8 });
      let prev = ["kw"];
      if (before) { before.steps(push, prev); prev = before.leave; }
      examples.forEach((e, idx) => {
        const s = e.say, r = e.r;
        push(s.read, { on: [e.id], off: prev, add: e.keys.map((_, j) => `k.${e.id}.${j}`), cue: Object.fromEntries(e.keys.map(([k], j) => [`k.${e.id}.${j}`, k])), transition: card(`Example ${idx + 1}`, e.title), pause: 0.7 });
        /* the FRACTION line */
        const isPct = r.pb === 100;
        const start = isPct ? `${r.pa} per cent is ${r.pa} out of a hundred: ${r.pa} over 100.` : `${r.pa} out of ${r.pb} is the fraction ${r.pa} over ${r.pb}.`;
        const chainSay = r.steps.map(([q, x, y]) => `${WHY[q] || `Both divide by ${q}`}: ${x} over ${y}.`).join(" ");
        push(`${idx === 0 ? "First, the fraction." : "Fraction first."} ${start} Reduce it one small prime at a time. ${chainSay}`,
          { on: [`${e.id}P`], add: [`${e.id}P.all`], cue: { [`${e.id}P.all`]: "one small prime" }, pause: 0.6 });
        push(`Or in one jump, with the highest common factor. The biggest number that goes into both ${r.pa} and ${r.pb} is ${r.h}. Divide both by ${r.h}: ${r.fa} over ${r.fb}. Same fraction, one step.`,
          { on: [`${e.id}H`], add: [`${e.id}H.all`], cue: { [`${e.id}H.all`]: "highest common factor" }, pause: 0.7 });
        if (e.mode !== "out") {
          push(s.dec, { on: [`${e.id}D`], add: [`${e.id}D.all`], cue: { [`${e.id}D.all`]: s.decCue || "decimal" }, pause: 0.9 });
        }
        /* the BAR: the denominator cuts */
        const hold = e.mode.startsWith("whole");
        push(s.cut, { on: [`${e.id}b`], off: [`${e.id}P`, `${e.id}H`, `${e.id}D`], add: [`${e.id}b.base`, `${e.id}b.cut`, ...(hold ? [] : [`${e.id}b.fill`])],
          cue: { [`${e.id}b.cut`]: s.cutCue || "bottom number", ...(hold ? {} : { [`${e.id}b.fill`]: s.fillCue || "each" }) }, pause: 0.7 });
        /* the numerator points, and the fraction sum with its words */
        push(s.act, { add: [`${e.id}b.act`, ...(hold ? [`${e.id}b.fill`] : [])], cue: { [`${e.id}b.act`]: s.actCue || "top number", ...(hold ? { [`${e.id}b.fill`]: s.fillCue || "each" } : {}) }, pause: 0.7 });
        const sIds = e.sLines.map((_, j) => `${e.id}S${j}`), xIds = e.xLines.map((_, j) => `${e.id}X${j}`);
        push(s.sum, { on: sIds, add: [...sIds.map((k) => `${k}.all`), ...(e.bar.topTo ? [`${e.id}b.whole`] : [])], cue: { ...Object.fromEntries(sIds.map((k) => [`${k}.all`, s.sumCue || "fraction"])), ...(e.bar.topTo ? { [`${e.id}b.whole`]: s.wholeCue } : {}) }, pause: 0.8 });
        if (e.mode === "out") push(s.dec, { on: [`${e.id}D`], add: [`${e.id}D.all`], cue: { [`${e.id}D.all`]: s.decCue || "decimal" }, pause: 1 });
        else push(s.end, { on: xIds, off: sIds.slice(e.xFrom), add: xIds.map((k) => `${k}.all`), cue: Object.fromEntries(xIds.map((k) => [`${k}.all`, s.endCue || "decimal"])), pause: 1 });
        prev = [e.id, `${e.id}b`, ...sIds, ...xIds, `${e.id}D`];
      });
      if (after) { after.steps(push, prev); prev = after.leave; }
      push(group.close, { off: prev, on: ["kw"], pause: 0.6 });
    },
  });
}

/* a per cent's decimal line, said: "twenty five per cent is twenty five divided by a hundred …" */
const decSay = (pct, figures, lands, result, extra = "") =>
  `Now the decimal, on a line of its own. ${pct} per cent means ${pct} divided by a hundred. Dividing by a hundred slides every figure two places to the right, across the point. The point itself never moves. ${figures} ${lands} ${extra}So ${pct} per cent is ${result}.`;

/* ═══ 1. TAKE A PART (of, commission, interest) ════════════════════════════ */
export function pctKwPart() {
  /* WHAT "OF" MEANS, SEEN: one fifth of 60, then three quarters of 80 — divide by the bottom, times the top */
  const before = {
    pics: {
      of1: () => fbar({ n: 5, val: 12, top: "60", num: 1, den: 5, ops: ["60 ÷ 5 = 12 in each box", "× 1: take 1 box = 12"] }),
      of2: () => fbar({ n: 4, val: 20, top: "80", num: 3, den: 4, ops: ["80 ÷ 4 = 20 in each box", "× 3: take 3 boxes = 60"] }),
      ofm: () => main([L("a", "\\tfrac{3}{4}\\ \\text{of}\\ 80"), L("b", "= 80 \\div 4 \\times 3", PURPLE), L("c", "= \\tfrac{3}{4} \\times 80 = 60", GREEN)], 6.4),
    },
    picAt: { of1: centred(150, 14), of2: centred(150, 14), ofm: at(32) },
    stages: {
      ...fbarStages("of1", { n: 5, part: 1 }), ...fbarStages("of2", { n: 4, part: 3 }),
      "ofm.all": (s, H) => { H.write(key(s, "a"), 0); H.write(key(s, "b"), 1.6); H.write(key(s, "c"), 4.2); H.sound("ding", 4.4); },
    },
    steps(push, prev) {
      push("Before any percentages, let's see what the word 'of' really does. Take one fifth of sixty. Here's sixty, as one whole bar, with the fraction one fifth beside it.",
        { on: ["of1"], off: prev, add: ["of1.base"], transition: card("What 'of' means", "see it on the bar"), pause: 0.6 });
      push("Look at the bottom number. Five. It tells us how many cuts: five equal boxes. Sixty shared into five boxes is twelve in each. That's sixty divided by five.",
        { add: ["of1.cut", "of1.fill", "of1.op0"], cue: { "of1.cut": "bottom number", "of1.fill": "twelve in each", "of1.op0": "divided by five" }, pause: 0.7 });
      push("Now the top number. One. It points at how many boxes we want. Just one box. Twelve. So one fifth of sixty is twelve.",
        { add: ["of1.act", "of1.op1"], cue: { "of1.act": "top number", "of1.op1": "Just one box" }, pause: 0.9 });
      push("Now more than one part. Three quarters of eighty. Bottom number, four: four equal boxes. Eighty shared into four is twenty each.",
        { on: ["of2"], off: ["of1"], add: ["of2.base", "of2.cut", "of2.fill", "of2.op0"], cue: { "of2.cut": "Bottom number", "of2.fill": "twenty each", "of2.op0": "twenty each" }, pause: 0.7 });
      push("Top number, three. It points at three boxes. Twenty, forty, sixty. Three quarters of eighty is sixty.",
        { add: ["of2.act", "of2.op1"], cue: { "of2.act": "Top number", "of2.op1": "Twenty, forty" }, pause: 0.9 });
      push("So 'of' did two things. It divided by the bottom number, and it multiplied by the top number. Dividing by four and multiplying by three is the same as multiplying by three quarters. That's why 'of' means times.",
        { on: ["ofm"], add: ["ofm.all"], cue: { "ofm.all": "two things" }, pause: 1.2 });
    },
    leave: ["of2", "ofm"],
  };
  const after = null;
  return kwFilm({
    ask: "Find 20% of 60. What is the word 'of' telling you to do?",
    askKeys: [["of", "of: take a part", TAKE]],
    group: {
      head: "Take a part", tone: 0, cells: ["of", "commission", "interest", "tax"], cueWord: "keyword", cueCol: "Here's the column",
      intro: [
        "Every percentage question hides a keyword. Find it, and it tells you exactly what to do. This video is all about one group of them: the ones that say, take a part. Here, the keyword is 'of'.",
        "Here's the column. Of. Commission. Interest. Tax. Each one means a piece of the amount. We don't add anything on, and we don't take anything away. We just want a part.",
      ],
      close: "So, take a part. Find the keyword: of, commission, interest, tax. Reduce the per cent to a fraction. The bottom number cuts the whole into boxes, and the top number points at the boxes you want. Or slide the figures two places to get the decimal, and multiply. Same answer, every time.",
    },
    before, after,
    examples: [
      { id: "e1", title: "20% of 60", q: "Find 20% of 60.", keys: [["of", "of: take a part", TAKE]], mode: "part", pct: [20, 100],
        bar: { n: 5, val: 12, top: "60", part: 1 }, dec: ["20", "div", "20% = 20 ÷ 100"],
        sumTex: [worded(1, 5), "\\ \\text{of}\\ 60", "= \\tfrac{1}{5} \\times 60", "= 12"], decTex: ["0.2 \\times 60", "= 12"],
        say: {
          read: "Now with a per cent. Find twenty per cent of sixty. The keyword is 'of', so I'll box it. Take a part.",
          dec: decSay("Twenty", "The two goes to the tenths, and the nought to the hundredths.", "A nought comes in to hold the ones place.", "nought point two", "The nought at the end is worth nothing, so it can go. "),
          cut: "Now the bar. Sixty is the whole, a hundred per cent, with one fifth beside it. The bottom number, five, gives five cuts: five equal boxes. Sixty shared into five is twelve each.",
          act: "The top number, one, points at the box we want. One box.",
          sum: "Write it as a fraction, with its words above it: one fifth of sixty. That's one fifth times sixty: twelve.",
          end: "And the decimal way: nought point two times sixty is twelve. Same answer.",
        } },
      { id: "e2", title: "75% of 120: more than one part", q: "Find 75% of 120.", keys: [["of", "of: take a part", TAKE]], mode: "part", pct: [75, 100],
        bar: { n: 4, val: 30, top: "120", part: 3 }, dec: ["75", "div", "75% = 75 ÷ 100"],
        sumTex: [worded(3, 4), "\\ \\text{of}\\ 120", "= \\tfrac{3}{4} \\times 120", "= 90"], decTex: ["0.75 \\times 120", "= 90"],
        say: {
          read: "This time, more than one part. Find seventy five per cent of a hundred and twenty. Of again: take a part.",
          dec: decSay("Seventy five", "The seven goes to the tenths, the five to the hundredths.", "A nought holds the ones.", "nought point seven five"),
          cut: "The bar is a hundred and twenty, with three quarters beside it. The bottom number, four: four cuts, four equal boxes. A hundred and twenty shared into four is thirty each.",
          act: "The top number, three, points at three boxes. One, two, three. Thirty, sixty, ninety.",
          sum: "As a fraction, with its words: three fourths of a hundred and twenty. Three quarters times a hundred and twenty: ninety.",
          end: "The decimal way: nought point seven five times a hundred and twenty is ninety.",
        } },
      { id: "e3", title: "5% commission", q: "A salesman earns 5% commission on sales of $400. How much commission does he earn?", keys: [["commission", "commission: a part of the sales", TAKE]], mode: "part", pct: [5, 100],
        bar: { n: 20, val: 20, top: "$400", part: 1 }, dec: ["5", "div", "5% = 5 ÷ 100"],
        sumTex: [worded(1, 20), "\\ \\text{of}\\ 400", "= \\tfrac{1}{20} \\times 400", "= \\$20"], decTex: ["0.05 \\times 400", "= 20"],
        say: {
          read: "Next keyword: commission. A salesman earns five per cent commission on four hundred dollars of sales. Commission is his share, a part of what he sold.",
          dec: decSay("Five", "The five slides two places, all the way to the hundredths.", "Noughts hold the ones and the tenths.", "nought point nought five", ""),
          cut: "The whole is the sales, four hundred dollars. The bottom number is twenty, so twenty cuts: twenty small boxes. Four hundred shared into twenty is twenty each.",
          act: "The top number, one, points at one box. Twenty dollars.",
          sum: "As a fraction: one twentieth of four hundred is twenty dollars.",
          end: "The decimal way: nought point nought five times four hundred is twenty.",
        } },
      { id: "e4", title: "10% interest", q: "Ade saves $500 at 10% interest for one year. Find the interest, and the total he then has.", keys: [["interest", "interest: a part, then added on", TAKE]], mode: "part", pct: [10, 100],
        bar: { n: 10, val: 50, top: "$500", part: 1 }, dec: ["10", "div", "10% = 10 ÷ 100"],
        sumTex: [worded(1, 10), "\\ \\text{of}\\ 500", "= \\$50"], decTex: ["0.1 \\times 500 = 50", ",\\quad 500 + 50", "= \\$550"],
        say: {
          read: "Last one: interest. Ade saves five hundred dollars at ten per cent interest for a year. Interest is a part of the money. Then the bank adds it on.",
          dec: decSay("Ten", "The one goes to the tenths, the nought to the hundredths.", "A nought holds the ones.", "nought point one", "The nought on the end can go. "),
          cut: "Five hundred dollars, with one tenth beside it. Bottom number ten: ten cuts, ten boxes. Five hundred shared into ten is fifty each.",
          act: "Top number, one: one box. The interest is fifty dollars.",
          sum: "As a fraction: one tenth of five hundred, fifty dollars.",
          end: "As a decimal: nought point one times five hundred is fifty. And because interest is added on, his total is five hundred and fifty dollars.",
        } },
    ],
  });
}

/* ═══ 2. ADD ON (increase by, profit) ══════════════════════════════════════ */
export function pctKwAdd() {
  return kwFilm({
    ask: "Increase 80 by 25%. What does 'increase' tell you to do?",
    askKeys: [["increase", "increase by: add on", ADD]],
    group: {
      head: "Add on", tone: 2, cells: ["increase by", "profit", "rise", "more than"], cueWord: "increase", cueCol: "Here's the column",
      intro: [
        "This video is about the keywords that say, add on. The amount gets bigger. You keep all of it, and add a part on top. Here, the keyword is increase.",
        "Here's the column. Increase by. Profit. Rise. More than. Every one of them adds a part to the whole.",
      ],
      close: "So, add on. Increase, profit, rise, more than. Cut the whole with the bottom number, and the top number tells you how many boxes to add. In words: four fourths plus one fourth is five fourths. Then the decimal: one plus the part, times the whole.",
    },
    examples: [
      { id: "a1", title: "Increase 80 by 25%", q: "Increase 80 by 25%.", keys: [["increase", "increase by: add on", ADD]], mode: "add", pct: [25, 100],
        bar: { n: 4, val: 20, top: "80", extra: 1 }, dec: ["25", "div", "25% = 25 ÷ 100"],
        sumTex: [worded(4, 4), "+", worded(1, 4), "=", worded(5, 4), "\\Rightarrow\\ \\tfrac{5}{4} \\times 80 = 100"], sumGap: 1.4,
        decTex: ["1 + 0.25 = 1.25", ",\\quad 1.25 \\times 80", "= 100"],
        say: {
          read: "Increase eighty by twenty five per cent. Box the keyword: increase. Add on.",
          dec: decSay("Twenty five", "The two goes to the tenths, the five to the hundredths.", "A nought holds the ones.", "nought point two five"),
          cut: "Here's eighty, the whole, with one quarter beside it. The bottom number, four: four cuts, four equal boxes. Eighty shared into four is twenty each.",
          act: "The top number, one, points at one box. But increase means add on, so this time a new box of twenty is added to the end.",
          sum: "Now the fraction, with words above it. The whole is four fourths. We add one fourth. Four fourths plus one fourth is five fourths. Five quarters of eighty is a hundred.",
          sumCue: "four fourths",
          end: "Then the decimal. The whole is one. Add nought point two five: one point two five. One point two five times eighty is a hundred.",
          endCue: "The whole is one",
        } },
      { id: "a2", title: "Increase 40 by 75%: three parts on", q: "Increase 40 by 75%.", keys: [["increase", "increase by: add on", ADD]], mode: "add", pct: [75, 100],
        bar: { n: 4, val: 10, top: "40", extra: 3 }, dec: ["75", "div", "75% = 75 ÷ 100"],
        sumTex: [worded(4, 4), "+", worded(3, 4), "=", worded(7, 4), "\\Rightarrow\\ \\tfrac{7}{4} \\times 40 = 70"], sumGap: 1.4,
        decTex: ["1 + 0.75 = 1.75", ",\\quad 1.75 \\times 40", "= 70"],
        say: {
          read: "Now more than one part. Increase forty by seventy five per cent. Increase: add on.",
          dec: decSay("Seventy five", "The seven goes to the tenths, the five to the hundredths.", "A nought holds the ones.", "nought point seven five"),
          cut: "Forty, with three quarters beside it. Bottom number, four: four equal boxes. Forty shared into four is ten each.",
          act: "Top number, three. Three boxes, and they're added on. One, two, three new boxes of ten.",
          sum: "In words above the fractions: four fourths plus three fourths is seven fourths. Seven quarters of forty is seventy.",
          sumCue: "four fourths",
          end: "And the decimal: one plus nought point seven five is one point seven five. One point seven five times forty is seventy.",
          endCue: "one plus",
        } },
      { id: "a3", title: "A 20% profit", q: "A trader buys a bag for $60 and sells it at a 20% profit. What is the selling price?", keys: [["profit", "profit: add on to the cost", ADD]], mode: "add", pct: [20, 100],
        bar: { n: 5, val: 12, top: "$60", extra: 1 }, dec: ["20", "div", "20% = 20 ÷ 100"],
        sumTex: [worded(5, 5), "+", worded(1, 5), "=", worded(6, 5), "\\Rightarrow\\ \\tfrac{6}{5} \\times 60 = \\$72"], sumGap: 1.4,
        decTex: ["1 + 0.2 = 1.2", ",\\quad 1.2 \\times 60", "= 72"],
        say: {
          read: "Profit is in this column too. A trader buys a bag for sixty dollars, and sells it at a twenty per cent profit. Profit means he sells for more than he paid.",
          dec: decSay("Twenty", "The two goes to the tenths, the nought to the hundredths.", "A nought holds the ones.", "nought point two", "The end nought can go. "),
          cut: "What he paid is the whole: sixty dollars, with one fifth beside it. Bottom number, five: five boxes. Sixty shared into five is twelve each.",
          act: "Top number, one: one box, added on for the profit.",
          sum: "In words: five fifths plus one fifth is six fifths. Six fifths of sixty is seventy two dollars.",
          sumCue: "five fifths",
          end: "Decimal: one plus nought point two is one point two. One point two times sixty is seventy two.",
          endCue: "one plus",
        } },
    ],
  });
}

/* ═══ 3. TAKE AWAY (discount, off, loss) ═══════════════════════════════════ */
export function pctKwAway() {
  return kwFilm({
    ask: "A shirt costs $80, with a 25% discount. What does 'discount' tell you to do?",
    askKeys: [["discount", "discount: take away", AWAY]],
    group: {
      head: "Take away", tone: 4, cells: ["decrease by", "discount", "loss", "off"], cueWord: "discount", cueCol: "Here's the column",
      intro: [
        "This video is about the keywords that say, take away. The amount gets smaller. A part is taken off the whole. Here, the keyword is discount.",
        "Here's the column. Decrease by. Discount. Loss. Off. Every one of them takes a part away.",
      ],
      close: "So, take away. Decrease, discount, loss, off. The bottom number cuts the whole, the top number tells you how many boxes go. In words: four fourths take away one fourth is three fourths. Then the decimal: one take away the part, times the whole.",
    },
    examples: [
      { id: "b1", title: "A 25% discount", q: "A shirt costs $80. In a sale there is a 25% discount. What is the sale price?", keys: [["discount", "discount: take away", AWAY]], mode: "away", pct: [25, 100],
        bar: { n: 4, val: 20, top: "$80", pale: 1 }, dec: ["25", "div", "25% = 25 ÷ 100"],
        sumTex: [worded(4, 4), "-", worded(1, 4), "=", worded(3, 4), "\\Rightarrow\\ \\tfrac{3}{4} \\times 80 = \\$60"], sumGap: 1.4,
        decTex: ["1 - 0.25 = 0.75", ",\\quad 0.75 \\times 80", "= 60"],
        say: {
          read: "A shirt costs eighty dollars, and there's a twenty five per cent discount. Box the keyword: discount. Take away.",
          dec: decSay("Twenty five", "The two goes to the tenths, the five to the hundredths.", "A nought holds the ones.", "nought point two five"),
          cut: "Eighty dollars is the whole, with one quarter beside it. Bottom number, four: four equal boxes. Eighty shared into four is twenty each.",
          act: "Top number, one: one box. A discount takes it away, so watch it go pale and get struck out.",
          sum: "In words above the fractions: four fourths take away one fourth is three fourths. Three quarters of eighty is sixty dollars.",
          sumCue: "four fourths",
          end: "And the decimal: one take away nought point two five is nought point seven five. Nought point seven five times eighty is sixty.",
          endCue: "one take away",
        } },
      { id: "b2", title: "30% off: three parts go", q: "Shoes that cost $50 are sold with 30% off. How much are they now?", keys: [["off", "off: take away", AWAY]], mode: "away", pct: [30, 100],
        bar: { n: 10, val: 5, top: "$50", pale: 3 }, dec: ["30", "div", "30% = 30 ÷ 100"],
        sumTex: [worded(10, 10), "-", worded(3, 10), "=", worded(7, 10), "\\Rightarrow\\ \\tfrac{7}{10} \\times 50 = \\$35"], sumGap: 1.4,
        decTex: ["1 - 0.3 = 0.7", ",\\quad 0.7 \\times 50", "= 35"],
        say: {
          read: "Off is a little word with a big job. Shoes that cost fifty dollars are sold with thirty per cent off. Off means take away.",
          dec: decSay("Thirty", "The three goes to the tenths, the nought to the hundredths.", "A nought holds the ones.", "nought point three", "The end nought can go. "),
          cut: "Fifty dollars, with three tenths beside it. Bottom number, ten: ten boxes. Fifty shared into ten is five each.",
          act: "Top number, three. Three boxes are taken away. One, two, three.",
          sum: "In words: ten tenths take away three tenths is seven tenths. Seven tenths of fifty is thirty five dollars.",
          sumCue: "ten tenths",
          end: "The decimal: one take away nought point three is nought point seven. Nought point seven times fifty is thirty five.",
          endCue: "one take away",
        } },
      { id: "b3", title: "A 20% loss", q: "A phone bought for $150 is sold at a 20% loss. What is the selling price?", keys: [["loss", "loss: take away from the cost", AWAY]], mode: "away", pct: [20, 100],
        bar: { n: 5, val: 30, top: "$150", pale: 1 }, dec: ["20", "div", "20% = 20 ÷ 100"],
        sumTex: [worded(5, 5), "-", worded(1, 5), "=", worded(4, 5), "\\Rightarrow\\ \\tfrac{4}{5} \\times 150 = \\$120"], sumGap: 1.4,
        decTex: ["1 - 0.2 = 0.8", ",\\quad 0.8 \\times 150", "= 120"],
        say: {
          read: "Loss is the opposite of profit. A phone bought for a hundred and fifty dollars is sold at a twenty per cent loss. Sold for less than it cost: take away.",
          dec: decSay("Twenty", "The two goes to the tenths, the nought to the hundredths.", "A nought holds the ones.", "nought point two", "The end nought can go. "),
          cut: "A hundred and fifty, with one fifth beside it. Bottom number, five: five boxes. A hundred and fifty shared into five is thirty each.",
          act: "Top number, one: one box of thirty, taken away.",
          sum: "In words: five fifths take away one fifth is four fifths. Four fifths of a hundred and fifty is a hundred and twenty dollars.",
          sumCue: "five fifths",
          end: "The decimal: one take away nought point two is nought point eight. Nought point eight times a hundred and fifty is a hundred and twenty.",
          endCue: "one take away",
        } },
    ],
  });
}

/* ═══ 4. OUT OF (out of, what percentage) ══════════════════════════════════ */
export function pctKwOut() {
  return kwFilm({
    ask: "A pupil scores 18 out of 24. What does 'out of' tell you to do?",
    askKeys: [["out of", "out of: make a fraction", OUT]],
    group: {
      head: "Out of", tone: 3, cells: ["out of", "what percent", "as a percentage"], cueWord: "out of", cueCol: "Here's the column",
      intro: [
        "This group goes the other way. You're given two amounts, and you turn them into a per cent. The keyword here is, out of.",
        "Here's the column. Out of. What percent. As a percentage. Each one says: make a fraction first, then turn it into a per cent.",
      ],
      close: "So, out of. Write the fraction, reduce it, and read it off the boxes. Then turn it into a per cent: a fraction of a hundred, or a decimal with its figures slid two places left. Two lines, one answer.",
    },
    examples: [
      { id: "o1", title: "18 out of 24", q: "A pupil scores 18 out of 24 in a test. What is that as a percentage?", keys: [["out of", "out of: make a fraction", OUT]], mode: "out", pct: [18, 24],
        bar: { n: 4, val: 6, top: "24", part: 3 }, dec: ["0.75", "mul", "3 ÷ 4 = 0.75"],
        sumTex: ["\\tfrac{18}{24} =", worded(3, 4), "= \\tfrac{75}{100}", "= 75\\%"],
        say: {
          read: "A pupil scores eighteen out of twenty four. What's that as a percentage? Box the keyword: out of. Make a fraction.",
          cut: "Here are the twenty four marks, the whole, with three quarters beside it. Bottom number, four: four boxes. Twenty four shared into four is six each.",
          act: "Top number, three, points at three boxes. Six, twelve, eighteen. The eighteen marks are three of the four boxes.",
          sum: "As a fraction: eighteen over twenty four is three fourths. And three fourths is seventy five hundredths: seventy five per cent.",
          sumCue: "eighteen over",
          dec: "Or the decimal way. Three divided by four is nought point seven five. To make a per cent, multiply by a hundred. Every figure slides two places to the left, across the point. The point doesn't move. The nought in front drops off. Seventy five per cent.",
          decCue: "Three divided",
        } },
      { id: "o2", title: "12 out of 20", q: "A team won 12 out of 20 games. What percentage did it win?", keys: [["out of", "out of: make a fraction", OUT], ["percentage", "as a percentage", OUT]], mode: "out", pct: [12, 20],
        bar: { n: 5, val: 4, top: "20", part: 3 }, dec: ["0.6", "mul", "3 ÷ 5 = 0.6"],
        sumTex: ["\\tfrac{12}{20} =", worded(3, 5), "= \\tfrac{60}{100}", "= 60\\%"],
        say: {
          read: "A team won twelve out of twenty games. What percentage did it win? Two keywords: out of, and percentage.",
          cut: "Twenty games is the whole, with three fifths beside it. Bottom number, five: five boxes. Twenty shared into five is four each.",
          act: "Top number, three: three boxes. Four, eight, twelve. The twelve wins.",
          sum: "As a fraction: twelve over twenty is three fifths, which is sixty hundredths: sixty per cent.",
          sumCue: "twelve over",
          dec: "The decimal way: three divided by five is nought point six. Times a hundred: every figure slides two places left. The six lands in the tens, and a nought comes in to hold the ones. Sixty per cent.",
          decCue: "three divided",
        } },
    ],
  });
}

/* ═══ 5. FIND THE WHOLE (original, cost price) + the trap ═════════════════ */
export function pctKwWhole() {
  const after = {
    pics: {
      t1: () => main([L("a", "\\text{\\$100, up 20\\%, then down 20\\%}")], 6),
      u1: () => fbar({ n: 5, val: 20, top: "$100", num: 1, den: 5, extra: 1 }),
      u2: () => fbar({ n: 5, val: 24, top: "$120", num: 1, den: 5, pale: 1 }),
      mU: () => main([L("a", "\\tfrac{6}{5} \\times \\tfrac{4}{5} = \\tfrac{24}{25} = 96\\%"), L("e", "\\quad"), L("b", "\\$96,\\ \\text{not } \\$100", RED)], 6.4),
    },
    picAt: { t1: at(2), u1: centred(150, 14), u2: centred(150, 14), mU: at(32) },
    stages: {
      "t1.all": (s, H) => H.write(key(s, "a"), 0),
      ...fbarStages("u1", { n: 5, extra: 1 }), ...fbarStages("u2", { n: 5, pale: 1 }),
      "mU.all": (s, H) => { H.write(key(s, "a"), 0); H.write(key(s, "e"), 0.6); H.write(key(s, "b"), 1.6); H.sound("ding", 1.8); },
    },
    steps(push, prev) {
      push("Now a trap that uses two keywords at once. A price of a hundred dollars goes up by twenty per cent, then down by twenty per cent. Most people say it's back to a hundred. Let's see.",
        { on: ["t1"], off: prev, add: ["t1.all"], transition: card("The trap", "the whole moves"), pause: 0.7 });
      push("Up twenty per cent. The whole is a hundred: five boxes of twenty, and one more box is added on. A hundred and twenty.",
        { on: ["u1"], add: ["u1.base", "u1.cut", "u1.fill", "u1.act"], cue: { "u1.cut": "five boxes", "u1.fill": "five boxes", "u1.act": "one more box" }, pause: 0.7 });
      push("Now down twenty per cent. But twenty per cent of what? Of the new price, a hundred and twenty. That's a new whole: five boxes of twenty four. Take one away... ninety six dollars.",
        { on: ["u2"], off: ["u1"], add: ["u2.base", "u2.cut", "u2.fill", "u2.act"], cue: { "u2.cut": "new whole", "u2.fill": "twenty four", "u2.act": "Take one away" }, pause: 0.9 });
      push("The fractions show it straight away: six fifths, then four fifths, is twenty four twenty fifths. Ninety six per cent of where you started. The second per cent belongs to a different whole.",
        { on: ["mU"], add: ["mU.all"], cue: { "mU.all": "six fifths" }, pause: 1.2 });
    },
    leave: ["t1", "u2", "mU"],
  };
  return kwFilm({
    ask: "After a 20% discount, a shirt costs $80. What was the original price?",
    askKeys: [["original", "original: the whole, before", WHOLE]],
    group: {
      head: "Find the whole", tone: 1, cells: ["original", "was", "before", "cost price"], cueWord: "original", cueCol: "Here's the column",
      intro: [
        "This is the group that catches everybody. The keywords say, find the whole: the hundred per cent, from before the change. Here, the keyword is original.",
        "Here's the column. Original. Was. Before. Cost price. The number you're given is not the whole. The whole is what you're hunting.",
      ],
      close: "So, find the whole. Original, was, before, cost price. The number you're given is what's left, or what it grew to. Count its boxes, find one box, and build the whole back up. And watch out: a second per cent has a new whole.",
    },
    after,
    examples: [
      { id: "w1", title: "The price before a 20% discount", q: "After a 20% discount, a shirt costs $80. What was the original price?", keys: [["discount", "discount: take away", AWAY], ["original", "original: the whole, before", WHOLE]], mode: "whole-away", pct: [20, 100],
        bar: { n: 5, val: 20, top: "original ?", pale: 1, topTo: "$100" }, dec: ["20", "div", "20% = 20 ÷ 100"],
        sumTex: [worded(5, 5), "-", worded(1, 5), "=", worded(4, 5), "= \\$80", "\\Rightarrow\\ \\tfrac{1}{5} = 20,\\ \\tfrac{5}{5} = \\$100"], sumGap: 1.3, sumEm: 5,
        decTex: ["1 - 0.2 = 0.8", ",\\quad 80 \\div 0.8", "= 100"],
        say: {
          read: "After a twenty per cent discount, a shirt costs eighty dollars. What was the original price? Two keywords. Discount: take away. Original: the whole, before the discount.",
          dec: decSay("Twenty", "The two goes to the tenths, the nought to the hundredths.", "A nought holds the ones.", "nought point two", "The end nought can go. "),
          cut: "The original price is the whole, and we don't know it yet: a question mark. One fifth beside it. Bottom number, five: five boxes.",
          cutCue: "Bottom number",
          act: "Top number, one: the discount took one box away. So the eighty dollars is what's left: four boxes. Four boxes are eighty, so twenty each.",
          fillCue: "twenty each",
          sum: "In words: five fifths take away one fifth is four fifths, and four fifths is eighty dollars. So one fifth is twenty, and five fifths, the original, is a hundred dollars.",
          sumCue: "five fifths",
          wholeCue: "a hundred dollars",
          end: "The decimal: one take away nought point two is nought point eight. Eighty is nought point eight of the original, so divide: eighty divided by nought point eight is a hundred. Not ninety six! That would be twenty per cent of the wrong whole.",
          endCue: "one take away",
        } },
      { id: "w2", title: "The cost before a 20% profit", q: "A bag is sold for $72 at a 20% profit. Find the cost price.", keys: [["profit", "profit: add on", ADD], ["cost price", "cost price: the whole", WHOLE]], mode: "whole-add", pct: [20, 100],
        bar: { n: 5, val: 12, top: "cost price ?", extra: 1, topTo: "$60" }, dec: ["20", "div", "20% = 20 ÷ 100"],
        sumTex: [worded(5, 5), "+", worded(1, 5), "=", worded(6, 5), "= \\$72", "\\Rightarrow\\ \\tfrac{1}{5} = 12,\\ \\tfrac{5}{5} = \\$60"], sumGap: 1.3, sumEm: 5,
        decTex: ["1 + 0.2 = 1.2", ",\\quad 72 \\div 1.2", "= 60"],
        say: {
          read: "One more. A bag is sold for seventy two dollars at a twenty per cent profit. Find the cost price. Profit: add on. Cost price: the whole, before the profit.",
          dec: decSay("Twenty", "The two goes to the tenths, the nought to the hundredths.", "A nought holds the ones.", "nought point two", "The end nought can go. "),
          cut: "The cost price is the whole, a question mark, with one fifth beside it. Bottom number, five: five boxes.",
          cutCue: "Bottom number",
          act: "Top number, one: the profit added one more box. So seventy two dollars is six boxes. Six boxes are seventy two, so twelve each.",
          fillCue: "twelve each",
          sum: "In words: five fifths plus one fifth is six fifths, and six fifths is seventy two. One fifth is twelve, so five fifths, the cost price, is sixty dollars.",
          sumCue: "five fifths",
          wholeCue: "sixty dollars",
          end: "The decimal: one plus nought point two is one point two. Seventy two divided by one point two is sixty.",
          endCue: "one plus",
        } },
    ],
  });
}
