/* ═══════════════════════════════════════════════════════════════════════════
   LAYOUT

   Our own typesetting, not MathJax. MathJax sets beautiful maths and is what
   the rest of the site uses, but it hands back a picture: there is no way to
   say "this glyph is that term" and no way to ask where that term will be
   after the next step. Both of those are the whole job here.

   Two passes. `measure` walks the tree and works out how wide and how tall
   every node wants to be; `place` walks it again with a real position and
   emits ATOMS. Every atom carries a key of the form nodeId#slot. That key is
   the thread the animation pulls on: an atom whose key exists in both the old
   and the new picture is the SAME piece of writing and has to travel between
   the two, not blink from one to the other.

   Widths come from a 2D canvas measuring the same font the SVG will draw with.
   Heights are proportions of the font size rather than real metrics, which is
   fine because every atom uses the same proportions, so they all sit on a
   consistent baseline.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as R from "./rational.js";
import { FN_FACE } from "./ast.js";

const FAMILY = '"STIX Two Text", "Times New Roman", serif';
const ASC = 0.72;   // baseline to top of a glyph, as a share of font size
const DESC = 0.22;  // baseline to bottom

let ctx = null;
const widthCache = new Map();

function measureText(text, size, italic) {
  const key = `${italic ? "i" : "r"}|${size}|${text}`;
  const hit = widthCache.get(key);
  if (hit !== undefined) return hit;
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `${italic ? "italic " : ""}400 ${size}px ${FAMILY}`;
  const w = ctx.measureText(text).width;
  widthCache.set(key, w);
  return w;
}

/** The font is webfont-loaded; anything measured before it lands is wrong. */
export function fontReady() {
  /* Never wait on the font for long: a slow or blocked font server would leave
     the whole page blank behind it. Past the limit the page is built with the
     fallback's widths, and drawn again the moment the font does land. */
  const loading = (document.fonts ? document.fonts.load(`400 32px ${FAMILY}`) : Promise.resolve()).catch(() => {});
  const limit = new Promise((resolve) => setTimeout(resolve, 2500));
  loading.then(() => { widthCache.clear(); window.dispatchEvent?.(new Event("am-font-ready")); });
  return Promise.race([loading, limit]).then(() => widthCache.clear());
}

export const FONT_FAMILY = FAMILY;

/* ── What a number or a name reads as ─────────────────────────────────────── */

function numText(node) {
  if (node.text) return node.text;                    // keep what was typed
  return R.isInt(node.v) ? String(node.v.n) : `${node.v.n}/${node.v.d}`;
}

/* ── Brackets ───────────────────────────────────────────────────────────────
   Drawn when the student typed them (parse.js marks those) or when leaving
   them out would change what the line says.

   THERE ARE TWO SETS OF RULES, and conflating them is a real bug rather than a
   nicety. Set out in two dimensions, a fraction bar does the grouping and a
   raised exponent does its own, so (20 − 5)/3 needs no brackets at all. Read
   back on one line, both of those groupings vanish and the same tree has to be
   written (20 − 5)/3 or it says something else entirely. */

/* MathJax's radical outlines (its TeX font, SVG output): the normal √ and
   the tall one it uses for taller contents. h, d, w in ems; paths in font
   units, 1000 to the em, y pointing up. */
const RADICAL = {
  normal: { h: 0.8, d: 0.2, w: 0.833, path: "M95 178Q89 178 81 186T72 200T103 230T169 280T207 309Q209 311 212 311H213Q219 311 227 294T281 177Q300 134 312 108L397 -77Q398 -77 501 136T707 565T814 786Q820 800 834 800Q841 800 846 794T853 782V776L620 293L385 -193Q381 -200 366 -200Q357 -200 354 -197Q352 -195 256 15L160 225L144 214Q129 202 113 190T95 178" },
  tall: { h: 1.15, d: 0.65, w: 1.0, path: "M1001 1150Q1017 1150 1020 1132Q1020 1127 741 244L460 -643Q453 -650 436 -650H424Q423 -647 423 -645T421 -640T419 -631T415 -617T408 -594T399 -560T385 -512T367 -448T343 -364T312 -259L203 119L138 41L111 67L212 188L264 248L472 -474L983 1140Q988 1150 1001 1150" },
};

/* The sign drawn between factors that need one (3·3, not 3x): a dot, or ×.
   A choice the student makes once and keeps on this machine; the line itself
   is the same either way. */
let TIMES = "·";
try { if (localStorage.getItem("am-times") === "×") TIMES = "×"; } catch { /* storage off: the dot */ }
export const timesSign = () => TIMES;
export function setTimesSign(sign) {
  TIMES = sign === "×" ? "×" : "·";
  widthCache.clear();
  try { localStorage.setItem("am-times", TIMES); } catch { /* not kept */ }
}

const SUBS = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉" };
/** E_1 as it is drawn: E₁. */
export const refFace = (name) => name.replace(/_?(\d+)$/, (_, d) => [...d].map((c) => SUBS[c]).join(""));

function needsBrackets(node, parentKind, slot) {
  // A fraction bar and a raised exponent do their own grouping, so brackets in
  // those places are noise EVEN WHEN THE STUDENT TYPED THEM — which matters
  // because the keypad's fraction key types a pair into each half.
  if (parentKind === "frac") return false;
  if (parentKind === "abs") return false;              // the bars group what is between them
  if (parentKind === "pow" && slot === 1) return false;
  // A root's bar groups whatever is under it, the way a fraction bar does.
  if (parentKind === "root") return false;
  // A matrix draws its own brackets, so it takes none from what holds it.
  if (node.kind === "mat" && (parentKind === "fn" || parentKind === "tr")) return false;
  if (parentKind === "tr") return node.kind !== "var";
  // 3 × 2⅓ is 3(2⅓): a mixed number is a sum, and holds together in brackets.
  if (node.kind === "mixed" && (parentKind === "prod" || parentKind === "pow")) return true;
  // A function's argument and a derivative's body are always in brackets.
  if (parentKind === "fn" || parentKind === "deriv") return true;
  if (parentKind === "int" || parentKind === "lim") return node.kind === "sum";
  if (parentKind === "deg" || parentKind === "pct" || parentKind === "fact") return node.kind !== "num" && node.kind !== "var";
  // nCr's two numbers are set apart by their places, not by brackets; so are a
  // list's by its commas and a sum's limits by where they sit.
  if (parentKind === "choose" || parentKind === "list" || parentKind === "sigmalim" || parentKind === "baserad" || parentKind === "logbase") return false;
  // a root's bar groups what is under it, and its index sits small above; a tower's base is bracketed unless it is one symbol
  if (parentKind === "nroot") return false;
  if (parentKind === "tet") return slot === 1 && node.kind !== "num" && node.kind !== "var" && node.kind !== "const";
  // a logarithm's argument stands in brackets, as a function's does; its base sits lowered beside it
  if (parentKind === "logb") return slot === 1;
  if (parentKind === "sigma") return node.kind === "sum";
  if (parentKind === "div") return node.kind === "sum" || node.kind === "neg" || node.kind === "pm" || (slot === 1 && (node.kind === "prod" || node.kind === "div"));
  if (node.kind === "div" && (parentKind === "prod" || parentKind === "neg" || parentKind === "pm")) return true;
  if (node.paren) return true;
  switch (parentKind) {
    case "prod": return node.kind === "sum" || ((node.kind === "neg" || node.kind === "pm") && slot > 0);
    case "neg":
    case "pm":   return node.kind === "sum";
    case "pow":  return slot === 0 && !["num", "var", "const"].includes(node.kind);
    default:     return false;
  }
}

function needsBracketsLinear(node, parentKind, slot) {
  if (needsBrackets(node, parentKind, slot)) return true;
  switch (parentKind) {
    // a ÷ b reads left to right: a fraction beside it must be bracketed or it would run on
    case "div": return node.kind === "frac";
    // A bar groups; a slash does not.
    case "frac":
      return slot === 0
        ? node.kind === "sum"
        : node.kind === "sum" || node.kind === "prod" || node.kind === "frac";
    // A raised exponent groups; a caret only takes the next factor.
    case "pow":
      return slot === 1 && node.kind !== "num" && node.kind !== "var";
    // x·1/3 would read as (x·1)/3.
    case "prod":
      return slot > 0 && node.kind === "frac";
    default:
      return false;
  }
}

/* ── Measure ────────────────────────────────────────────────────────────────
   Returns { node, size, w, ascent, descent, ... } in local terms. */

function measure(node, size, parentKind = null, slot = 0, binary = false) {
  const inner = measureBare(node, size, binary);
  if (!needsBrackets(node, parentKind, slot)) return inner;

  const h = inner.ascent + inner.descent;
  const pSize = Math.min(size * 2.4, Math.max(size, h));
  const lw = measureText("(", pSize, false);
  const rw = measureText(")", pSize, false);
  // Centre the brackets on the content rather than sitting them on the baseline,
  // or a bracketed fraction hangs well below its own brackets.
  const centre = -inner.ascent + h / 2;
  const dy = centre + 0.25 * pSize;

  return {
    node, size, kind: "brackets", inner, pSize, lw, rw, dy,
    w: lw + inner.w + rw,
    ascent: Math.max(inner.ascent, 0.75 * pSize - dy),
    descent: Math.max(inner.descent, 0.25 * pSize + dy),
  };
}

function measureBare(node, size, binary) {
  const base = { node, size, ascent: ASC * size, descent: DESC * size };

  switch (node.kind) {
    case "num": {
      const text = numText(node);
      return { ...base, kind: "text", text, italic: false, w: measureText(text, size, false) };
    }
    case "var":
      return { ...base, kind: "text", text: node.name, italic: true, w: measureText(node.name, size, true) };

    case "hole":
      // Drawn as a box the size of a digit, so a half-typed fraction looks like
      // a fraction with something still to go in it.
      return { ...base, kind: "hole", w: 0.62 * size, ascent: 0.62 * size, descent: 0.02 * size };

    case "neg":
    case "pm": {
      // A minus in front of a term is tight; a minus BETWEEN terms is an
      // operator and gets air on its right, because the sum already left air
      // on its left. A ± is drawn exactly the same way.
      const signW = measureText(node.kind === "pm" ? "±" : "−", size, false);
      const gap = binary ? 0.22 * size : 0.06 * size;
      const k = measure(node.k, size, "neg", 0);
      return { ...base, kind: node.kind, signW, gap, k, w: signW + gap + k.w,
               ascent: Math.max(base.ascent, k.ascent), descent: Math.max(base.descent, k.descent) };
    }

    case "sum": {
      const opGap = 0.28 * size;
      const parts = [];
      let w = 0, ascent = base.ascent, descent = base.descent;
      node.kids.forEach((kid, i) => {
        // A − or a ± in front of a term is that term's own sign.
        const isNeg = (kid.kind === "neg" || kid.kind === "pm") && !kid.paren;
        if (i > 0) {
          // A negative term draws its own sign and its own trailing space, so
          // all the sum owes it is the space on the LEFT. Charging it the full
          // operator advance as well is what pushed every minus a gap too far.
          const opW = isNeg ? 0 : measureText("+", size, false);
          const adv = isNeg ? opGap : opGap + opW + opGap;
          parts.push({ op: isNeg ? null : "+", opW, opGap, adv });
          w += adv;
        }
        const m = measure(kid, size, "sum", i, i > 0);
        parts.push({ m });
        w += m.w;
        ascent = Math.max(ascent, m.ascent);
        descent = Math.max(descent, m.descent);
      });
      return { ...base, kind: "sum", parts, w, ascent, descent };
    }

    case "prod": {
      const parts = [];
      let w = 0, ascent = base.ascent, descent = base.descent;
      node.kids.forEach((kid, i) => {
        const m = measure(kid, size, "prod", i);
        // A dot is only needed where juxtaposition would read as one number.
        const dot = i > 0 && startsWithDigit(kid) && m.kind !== "brackets";
        const gap = i === 0 ? 0 : dot ? 0.16 * size : 0.04 * size;
        const dotW = dot ? measureText(timesSign(), size, false) : 0;
        parts.push({ m, dot, gap, dotW });
        w += gap + dotW + (dot ? gap : 0) + m.w;
        ascent = Math.max(ascent, m.ascent);
        descent = Math.max(descent, m.descent);
      });
      return { ...base, kind: "prod", parts, w, ascent, descent };
    }

    case "frac": {
      const a = measure(node.a, size, "frac", 0);
      const b = measure(node.b, size, "frac", 1);
      // A fraction with a fraction in its top or bottom: its own bar is the main one, drawn heavier and longer than the small bars it holds
      const tower = node.a.kind === "frac" || node.b.kind === "frac";
      const pad = (tower ? 0.34 : 0.16) * size;
      const axis = 0.30 * size;
      const gap = (tower ? 0.2 : 0.13) * size;
      const rule = Math.max(tower ? 2 : 1, (tower ? 0.1 : 0.05) * size);
      return {
        ...base, kind: "frac", a, b, pad, axis, gap, rule,
        w: Math.max(a.w, b.w) + pad * 2,
        ascent: axis + rule / 2 + gap + a.descent + a.ascent,
        descent: -axis + rule / 2 + gap + b.ascent + b.descent,
      };
    }

    case "pow": {
      const b = measure(node.b, size, "pow", 0);
      const e = measure(node.e, size * 0.68, "pow", 1);
      const rise = 0.46 * size;
      const kern = 0.03 * size;
      return { ...base, kind: "pow", b, e, rise, kern, w: b.w + kern + e.w,
               ascent: Math.max(b.ascent, rise + e.ascent),
               descent: Math.max(b.descent, e.descent - rise) };
    }

    /* A radical: the √ glyph, grown with what it covers the way a bracket is,
       and a bar (the vinculum) running over the whole radicand. */
    case "root": {
      const k = measure(node.k, size, "root", 0);
      const gap = 0.1 * size;
      const rule = Math.max(1, 0.05 * size);
      const above = k.ascent + gap + rule;               // baseline to the bar
      /* MathJax's own √ (radical.js): its normal one when the contents fit in
         it, its tall one when they do not, stretched upward only past that. */
      const need = above + k.descent;
      // A digit or a letter fits under the normal sign with a little to spare,
      // the way MathJax sets √12; anything taller takes the tall one.
      const g = need <= 1.25 * (RADICAL.normal.h + RADICAL.normal.d) * size ? RADICAL.normal : RADICAL.tall;
      const unit = size;
      const sy = Math.max(1, need / ((g.h + g.d) * unit));
      const rw = g.w * unit;
      const pad = 0.06 * size;
      const below = g.d * unit * sy - (g.h * unit * sy - above);   // baseline to the foot of the sign
      return {
        ...base, kind: "root", k, gap, rule, rw, pad, g, sy,
        w: rw + pad + k.w + pad,
        ascent: Math.max(base.ascent, above),
        descent: Math.max(base.descent, k.descent, below),
      };
    }

    // e and π: numbers that happen to be written as letters.
    // 2⅓: the whole number, a hair of space, the fraction stacked beside it.
    case "mixed": {
      const whole = measure(node.w, size, "mixed", 0);
      const part = measure(node.f, size, "mixed", 1);
      const gap = 0.08 * size;
      return { ...base, kind: "mixed", whole, part, gap, w: whole.w + gap + part.w,
               ascent: Math.max(base.ascent, whole.ascent, part.ascent), descent: Math.max(base.descent, whole.descent, part.descent) };
    }
    /* [[1,2],[3,4]]: entries in columns, each centred in its own, between two
       tall square brackets drawn as strokes — which stretch to any height, where
       a typed [ would only ever be one size. */
    case "mat": {
      const cells = node.rows.map((r) => r.map((c) => measure(c, size, "mat", 0)));
      const cols = node.rows[0].length;
      const colW = Array.from({ length: cols }, (_, j) => Math.max(...cells.map((r) => r[j].w)));
      const rowA = cells.map((r) => Math.max(...r.map((c) => c.ascent)));
      const rowD = cells.map((r) => Math.max(...r.map((c) => c.descent)));
      const colGap = 0.95 * size, rowGap = 0.32 * size, pad = 0.2 * size, bw = 0.3 * size;
      const bodyW = colW.reduce((a, b) => a + b, 0) + colGap * (cols - 1);
      const bodyH = rowA.reduce((a, b) => a + b, 0) + rowD.reduce((a, b) => a + b, 0) + rowGap * (cells.length - 1);
      const H = bodyH + 2 * pad;
      const axis = 0.3 * size;
      return { ...base, kind: "mat", cells, colW, rowA, rowD, colGap, rowGap, pad, bw, bodyH, H, axis,
               w: bw * 2 + pad * 2 + bodyW,
               ascent: Math.max(base.ascent, H / 2 + axis), descent: Math.max(base.descent, H / 2 - axis) };
    }
    // 25%: the number, then the sign right after it.
    case "pct": {
      const k = measure(node.k, size, "pct", 0);
      const sw = measureText("%", size, false);
      return { ...base, kind: "pct", k, sw, w: k.w + sw,
               ascent: Math.max(base.ascent, k.ascent), descent: Math.max(base.descent, k.descent) };
    }
    // {4, 7, 9}: the numbers between braces, set a comma apart.
    case "list": {
      const items = node.items.map((it) => measure(it, size, "list", 0));
      const open = measureText("{", size, false), close = measureText("}", size, false);
      const comma = measureText(",", size, false), sp = 0.3 * size;
      const w = open + items.reduce((a, m, i) => a + m.w + (i ? comma + sp : 0), 0) + close;
      return { ...base, kind: "list", items, open, close, comma, sp, w,
               ascent: Math.max(base.ascent, ...items.map((m) => m.ascent)),
               descent: Math.max(base.descent, ...items.map((m) => m.descent)) };
    }
    // Σ with the counter and where it starts underneath, where it stops above.
    case "sigma": {
      const body = measure(node.k, size, "sigma", 0);
      const small = size * 0.62;
      const lo = measure(node.lo, small, "sigmalim", 0), hi = measure(node.hi, small, "sigmalim", 0);
      const loLab = measureText(`${node.x}=`, small, true);
      const loW = loLab + lo.w;
      const sSize = Math.max(size * 1.3, (Math.max(body.ascent + body.descent, size) * 1.1) / (ASC + DESC));
      const sW = measureText("Σ", sSize, false);
      const colW = Math.max(sW, hi.w, loW);
      const up = 0.3 * size + ((ASC + DESC) / 2) * sSize;      // baseline to the Σ's top
      const down = -0.3 * size + ((ASC + DESC) / 2) * sSize;   // baseline to its foot
      const gap = 0.06 * size;
      return { ...base, kind: "sigma", body, lo, hi, loLab, loW, small, sSize, sW, colW, up, down, gap,
               w: colW + 0.14 * size + body.w,
               ascent: Math.max(base.ascent, body.ascent, up + gap + hi.descent + hi.ascent),
               descent: Math.max(base.descent, body.descent, down + gap + lo.ascent + lo.descent) };
    }
    // 5!: the number, then the mark right after it.
    case "fact": {
      const k = measure(node.k, size, "fact", 0);
      const bw = measureText("!", size, false);
      return { ...base, kind: "fact", k, bw, w: k.w + bw,
               ascent: Math.max(base.ascent, k.ascent), descent: Math.max(base.descent, k.descent) };
    }
    // ⁿCᵣ and ⁿPᵣ: n raised before the letter, r lowered after it.
    case "choose": {
      const small = size * 0.62;
      const n = measure(node.n, small, "choose", 0), r = measure(node.r, small, "choose", 1);
      const lw = measureText(node.perm ? "P" : "C", size, false);
      const lift = 0.42 * size, drop = 0.26 * size, gap = 0.04 * size;
      return { ...base, kind: "choose", n, r, lw, lift, drop, gap, w: n.w + gap + lw + gap + r.w,
               ascent: Math.max(base.ascent, lift + n.ascent), descent: Math.max(base.descent, drop + r.descent) };
    }
    // 1011₂: the digits upright, the base lowered and small after them.
    case "base": {
      // each digit its own width: an unknown digit is a letter, set italic
      const cw = [...node.digits].map((c) => (c === "?" ? 0.62 * size : measureText(c, size, /[a-z]/.test(c))));
      const dw = cw.reduce((a, b) => a + b, 0);
      const sub = size * 0.6;
      // a base that is more than a letter or a number is laid out as the expression it is
      const radix = node.v && node.v.kind !== "var" && node.v.kind !== "hole" ? measure(node.v, sub, "baserad", 0) : null;
      const bw = radix ? radix.w : node.v?.kind === "hole" ? 0.62 * sub : measureText(node.v ? node.v.name : String(node.base), sub, !!node.v);
      return { ...base, kind: "base", dw, cw, bw, sub, radix, w: dw + 0.04 * size + bw,
               descent: Math.max(base.descent, 0.32 * size + DESC * sub, radix ? 0.32 * size + radix.descent : 0) };
    }
    // ⁿ√x: the radical of a square root, its index small and raised at its left
    case "nroot": {
      const r = measureBare({ ...node, kind: "root", paren: false }, size, false);
      const idx = measure(node.n, size * 0.5, "nroot", 0);
      const indent = Math.max(0, idx.w * 0.85 - r.rw * 0.3);
      const lift = r.ascent * 0.5;
      return { ...r, kind: "nroot", node, idx, indent, lift, w: r.w + indent,
               ascent: Math.max(r.ascent, lift + idx.ascent) };
    }
    // a ÷ b: the two sides with a ÷ between, each fraction kept stacked
    case "div": {
      const a = measure(node.a, size, "div", 0);
      const b = measure(node.b, size, "div", 1);
      const sign = measureText("÷", size, false), gap = 0.28 * size;
      return { ...base, kind: "div", a, b, sign, gap, w: a.w + gap + sign + gap + b.w,
               ascent: Math.max(base.ascent, a.ascent, b.ascent), descent: Math.max(base.descent, a.descent, b.descent) };
    }
    // ⁿa: the height raised small before the base
    case "tet": {
      const n = measure(node.n, size * 0.62, "tet", 0);
      const b = measure(node.b, size, "tet", 1);
      const lift = 0.5 * size, gap = 0.03 * size;
      return { ...base, kind: "tet", n, b, lift, gap, w: n.w + gap + b.w,
               ascent: Math.max(base.ascent, b.ascent, lift + n.ascent), descent: Math.max(base.descent, b.descent) };
    }
    // log with its base lowered and small, then the argument in brackets
    case "logb": {
      const nameW = measureText("log", size, false);
      const small = size * 0.62;
      const b = measure(node.b, small, "logb", 0);
      const k = measure(node.k, size, "logb", 1);
      const gap = 0.04 * size, lower = 0.26 * size;
      return { ...base, kind: "logb", nameW, b, k, gap, lower, w: nameW + gap + b.w + gap + k.w,
               ascent: Math.max(base.ascent, k.ascent), descent: Math.max(base.descent, k.descent, lower + b.descent) };
    }
    // A named equation, its number lowered the way it is written: E₁.
    case "ref": {
      const t = refFace(node.name);
      return { ...base, kind: "text", text: t, italic: false, w: measureText(t, size, false) };
    }
    case "const": {
      // Euler's number is written italic, the way it is in print; π stays upright
      const slanted = node.name === "e";
      return { ...base, kind: "text", text: node.name, italic: slanted, w: measureText(node.name, size, slanted) };
    }

    case "fn": {
      // A matrix turned on its side is written with a raised T: Aᵀ.
      if (node.name === "transpose") {
        const k = measure(node.k, size, "tr", 0);
        const sup = size * 0.62;
        const tW = measureText("T", sup, false);
        return { ...base, kind: "fn", transpose: true, k, sup, tW, w: k.w + 0.05 * size + tW,
                 ascent: Math.max(base.ascent, k.ascent, 0.55 * size + 0.72 * sup), descent: Math.max(base.descent, k.descent) };
      }
      const nameW = measureText(FN_FACE[node.name] || node.name, size, false);
      const gap = 0.06 * size;
      const k = measure(node.k, size, "fn", 0);
      return { ...base, kind: "fn", nameW, gap, k, w: nameW + gap + k.w,
               ascent: Math.max(base.ascent, k.ascent), descent: Math.max(base.descent, k.descent) };
    }

    case "deg": {
      const k = measure(node.k, size, "deg", 0);
      const degW = measureText("°", size, false);
      return { ...base, kind: "deg", k, degW, w: k.w + degW,
               ascent: Math.max(base.ascent, k.ascent), descent: Math.max(base.descent, k.descent) };
    }

    /* d/dx as a small stacked fraction in front of its bracketed body. */
    case "deriv": {
      const s2 = size * 0.8;
      const topW = measureText("d", s2, true);
      const botW = measureText(`d${node.x}`, s2, true);
      const fw = Math.max(topW, botW) + 0.12 * size;
      const axis = 0.3 * size, gap = 0.08 * size, rule = Math.max(1, 0.05 * size);
      const half = gap + (ASC + DESC) * s2;
      const k = measure(node.k, size, "deriv", 0);
      return { ...base, kind: "deriv", s2, topW, botW, fw, axis, gap, rule, k,
               w: fw + 0.06 * size + k.w,
               ascent: Math.max(base.ascent, k.ascent, axis + rule / 2 + half),
               descent: Math.max(base.descent, k.descent, -axis + rule / 2 + half) };
    }

    /* ∫, grown to cover its body, with its limits (if any) beside it, then the
       body and "dx". */
    case "int": {
      const body = measure(node.k, size, "int", 0);
      const lo = node.lo ? measure(node.lo, size * 0.62, "intlim", 0) : null;
      const hi = node.hi ? measure(node.hi, size * 0.62, "intlim", 0) : null;
      const tall = Math.max(body.ascent + body.descent, size) * 1.2;
      const iSize = Math.max(size * 1.3, tall / (ASC + DESC));
      const iW = measureText("∫", iSize, false);
      const limW = Math.max(lo ? lo.w : 0, hi ? hi.w : 0);
      const dxW = measureText(`d${node.x}`, size, true);
      const up = 0.3 * size + ((ASC + DESC) / 2) * iSize;     // baseline to the ∫'s top
      const down = -0.3 * size + ((ASC + DESC) / 2) * iSize;  // baseline to its foot
      // After a substitution, what u stands for is written small beside it.
      const back = node.back ? measure(node.back.g, size * 0.62, "intlim", 0) : null;
      const backLead = node.back ? measureText(`, ${node.x} = `, size * 0.62, false) : 0;
      return { ...base, kind: "int", body, lo, hi, iSize, iW, limW, dxW, up, down, back, backLead,
               w: iW + limW + 0.1 * size + body.w + 0.14 * size + dxW + (back ? backLead + back.w + 0.1 * size : 0),
               ascent: Math.max(base.ascent, body.ascent, up + (hi ? 0.1 * size : 0)),
               descent: Math.max(base.descent, body.descent, down + (lo ? 0.1 * size : 0)) };
    }

    /* lim with "h→0" underneath it, then the body. */
    case "lim": {
      const limW = measureText("lim", size, false);
      const sub = size * 0.62;
      const arrowW = measureText(`${node.x}→`, sub, true);
      const to = measure(node.to, sub, "limto", 0);
      const subW = arrowW + to.w;
      const colW = Math.max(limW, subW);
      const body = measure(node.k, size, "lim", 0);
      const subDrop = DESC * size + (ASC + 0.1) * sub;
      return { ...base, kind: "lim", limW, sub, arrowW, to, subW, colW, body, subDrop,
               w: colW + 0.18 * size + body.w,
               ascent: Math.max(base.ascent, body.ascent),
               descent: Math.max(base.descent, body.descent, subDrop + Math.max(DESC * sub, to.descent)) };
    }

    // A one-sided line is drawn as exactly its one side. It keeps a node of its
    // own here so it gets a box like everything else — the keypad's caret walks
    // boxes, and the root is the box that spans the whole line.
    case "expr": {
      const e = measure(node.e, size, "expr", 0);
      return { ...base, kind: "expr", e, w: e.w,
               ascent: Math.max(base.ascent, e.ascent), descent: Math.max(base.descent, e.descent) };
    }

    case "abs": {
      const k = measure(node.k, size, "abs", 0);
      const rule = Math.max(1, 0.055 * size), pad = 0.16 * size, over = 0.12 * size;
      return { ...base, kind: "abs", k, rule, pad, over, w: k.w + 2 * (rule + pad),
               ascent: Math.max(base.ascent, k.ascent + over), descent: Math.max(base.descent, k.descent + over) };
    }

    case "eq": {
      const l = measure(node.l, size, "eq", 0);
      const r = measure(node.r, size, "eq", 1);
      const mid = node.m ? measure(node.m, size, "eq", 2) : null;
      const gap = 0.34 * size;
      const eqW = measureText(node.rel || "=", size, false);
      if (mid) {
        const eqW2 = measureText(node.rel2 || node.rel || "=", size, false);
        return { ...base, kind: "eq", l, m: mid, r, gap, eqW, eqW2, rel: node.rel || "=", rel2: node.rel2 || node.rel || "=",
                 w: l.w + gap + eqW + gap + mid.w + gap + eqW2 + gap + r.w,
                 ascent: Math.max(base.ascent, l.ascent, mid.ascent, r.ascent),
                 descent: Math.max(base.descent, l.descent, mid.descent, r.descent) };
      }
      return { ...base, kind: "eq", l, r, gap, eqW, rel: node.rel || "=", w: l.w + gap + eqW + gap + r.w,
               ascent: Math.max(base.ascent, l.ascent, r.ascent),
               descent: Math.max(base.descent, l.descent, r.descent) };
    }

    default:
      return { ...base, kind: "text", text: "?", italic: false, w: measureText("?", size, false) };
  }
}

function startsWithDigit(node) {
  if (node.paren) return false;
  switch (node.kind) {
    case "num":  return true;
    case "prod": return node.kids.length > 0 && startsWithDigit(node.kids[0]);
    case "pow":  return startsWithDigit(node.b);
    case "frac": return true;
    default:     return false;
  }
}

/* ── Place ──────────────────────────────────────────────────────────────────
   Walks the measured tree at a real position and emits atoms + a box per node.
   `y` is always a BASELINE, never a top — that is what SVG text wants. */

function place(m, x, y, out) {
  const id = m.node.id;
  const box = { x, y: y - m.ascent, w: m.w, h: m.ascent + m.descent };
  // A node placed twice (it cannot be, but be safe) keeps its first box.
  if (!out.boxes.has(id)) out.boxes.set(id, box);

  // Every glyph carries its own extent, so it can be a tap target of its own —
  // the 3 of 3x, the x, the + between terms, the = — not just a slice of a term.
  const text = (slot, txt, tx, ty, size, italic) =>
    out.atoms.push({
      key: `${id}#${slot}`, nodeId: id, kind: "text", text: txt, x: tx, y: ty, size, italic: !!italic,
      w: measureText(txt, size, !!italic), asc: ASC * size, desc: DESC * size,
    });

  switch (m.kind) {
    case "brackets": {
      text("lp", "(", x, y + m.dy, m.pSize, false);
      place(m.inner, x + m.lw, y, out);
      text("rp", ")", x + m.lw + m.inner.w, y + m.dy, m.pSize, false);
      // The brackets belong to the node they wrap, so the box is the whole thing.
      out.boxes.set(id, box);
      break;
    }

    case "text":
      text("t", m.text, x, y, m.size, m.italic);
      break;

    case "hole":
      out.atoms.push({ key: `${id}#box`, nodeId: id, kind: "hole",
                       x, y: y - m.ascent, w: m.w, h: m.ascent + m.descent });
      break;

    case "neg":
    case "pm":
      text("sign", m.kind === "pm" ? "±" : "−", x, y, m.size, false);
      place(m.k, x + m.signW + m.gap, y, out);
      break;

    case "sum": {
      let cx = x;
      let i = 0;
      for (const part of m.parts) {
        if (part.m) { place(part.m, cx, y, out); cx += part.m.w; i++; }
        else {
          if (part.op) text(`op${i}`, part.op, cx + part.opGap, y, m.size, false);
          cx += part.adv;
        }
      }
      break;
    }

    case "prod": {
      let cx = x;
      m.parts.forEach((part, i) => {
        cx += part.gap;
        if (part.dot) { text(`dot${i}`, timesSign(), cx, y, m.size, false); cx += part.dotW + part.gap; }
        place(part.m, cx, y, out);
        cx += part.m.w;
      });
      break;
    }

    case "frac": {
      const barTop = y - m.axis - m.rule / 2;
      const cw = m.w - m.pad * 2;
      place(m.a, x + m.pad + (cw - m.a.w) / 2, barTop - m.gap - m.a.descent, out);
      place(m.b, x + m.pad + (cw - m.b.w) / 2, barTop + m.rule + m.gap + m.b.ascent, out);
      out.atoms.push({ key: `${id}#bar`, nodeId: id, kind: "rule", x, y: barTop, w: m.w, h: m.rule });
      break;
    }

    case "pow":
      place(m.b, x, y, out);
      place(m.e, x + m.b.w + m.kern, y - m.rise, out);
      break;

    case "mat": {
      const top = y - m.axis - m.H / 2;           // the top of the brackets
      const t = Math.max(1, 0.05 * m.size);
      const bottom = top + m.H;
      const arm = m.bw;
      out.atoms.push({ key: `${id}#lb`, nodeId: id, kind: "path", text: "[", x, y: top, w: arm, h: m.H, stroke: t,
        d: `M${x + arm} ${top + t / 2} H${x + t / 2} V${bottom - t / 2} H${x + arm}` });
      const rx = x + m.w;
      out.atoms.push({ key: `${id}#rb`, nodeId: id, kind: "path", text: "]", x: rx - arm, y: top, w: arm, h: m.H, stroke: t,
        d: `M${rx - arm} ${top + t / 2} H${rx - t / 2} V${bottom - t / 2} H${rx - arm}` });
      let cy = top + m.pad;
      m.cells.forEach((row, i) => {
        const baseline = cy + m.rowA[i];
        let cx = x + m.bw + m.pad;
        row.forEach((cell, j) => {
          place(cell, cx + (m.colW[j] - cell.w) / 2, baseline, out);
          cx += m.colW[j] + m.colGap;
        });
        cy += m.rowA[i] + m.rowD[i] + m.rowGap;
      });
      break;
    }

    case "pct":
      place(m.k, x, y, out);
      text("pct", "%", x + m.k.w, y, m.size, false);
      break;

    case "list": {
      let cx = x;
      text("lbrace", "{", cx, y, m.size, false);
      cx += m.open;
      m.items.forEach((it, i) => {
        if (i) { text(`lc${i}`, ",", cx, y, m.size, false); cx += m.comma + m.sp; }
        place(it, cx, y, out);
        cx += it.w;
      });
      text("rbrace", "}", cx, y, m.size, false);
      break;
    }

    case "sigma": {
      const iy = y - 0.3 * m.size + ((ASC - DESC) / 2) * m.sSize;
      text("sigma", "Σ", x + (m.colW - m.sW) / 2, iy, m.sSize, false);
      place(m.hi, x + (m.colW - m.hi.w) / 2, y - m.up - m.gap - m.hi.descent, out);
      const ly = y + m.down + m.gap + m.lo.ascent;
      const lx = x + (m.colW - m.loW) / 2;
      text("sigx", `${m.node.x}=`, lx, ly, m.small, true);
      place(m.lo, lx + m.loLab, ly, out);
      place(m.body, x + m.colW + 0.14 * m.size, y, out);
      break;
    }

    case "fact":
      place(m.k, x, y, out);
      text("bang", "!", x + m.k.w, y, m.size, false);
      break;

    case "choose":
      place(m.n, x, y - m.lift, out);
      text(m.node.perm ? "perm" : "comb", m.node.perm ? "P" : "C", x + m.n.w + m.gap, y, m.size, false);
      place(m.r, x + m.n.w + m.gap + m.lw + m.gap, y + m.drop, out);
      break;

    case "base":
      {
        let cx = x;
        [...m.node.digits].forEach((c, i) => {
          if (c === "?") {
            // an empty digit box, drawn like every other empty box
            out.atoms.push({ key: `${m.node.id}#d${i}`, nodeId: m.node.id, kind: "hole", x: cx, y: y - 0.62 * m.size, w: m.cw[i], h: 0.64 * m.size });
          } else text(`d${i}`, c, cx, y, m.size, /[a-z]/.test(c));
          cx += m.cw[i];
        });
      }
      if (m.radix) {
        place(m.radix, x + m.dw + 0.04 * m.size, y + 0.32 * m.size, out);
      } else if (m.node.v?.kind === "hole") {
        out.atoms.push({ key: `${m.node.id}#radix`, nodeId: m.node.id, kind: "hole", x: x + m.dw + 0.04 * m.size, y: y + 0.32 * m.size - 0.62 * m.sub, w: m.bw, h: 0.64 * m.sub });
      } else text("radix", m.node.v ? m.node.v.name : String(m.node.base), x + m.dw + 0.04 * m.size, y + 0.32 * m.size, m.sub, !!m.node.v);
      break;

    case "nroot":
      place(m.idx, x, y - m.lift, out);
      place({ ...m, kind: "root" }, x + m.indent, y, out);
      break;

    case "div":
      place(m.a, x, y, out);
      text("div", "÷", x + m.a.w + m.gap, y, m.size, false);
      place(m.b, x + m.a.w + m.gap + m.sign + m.gap, y, out);
      break;

    case "tet":
      place(m.n, x, y - m.lift, out);
      place(m.b, x + m.n.w + m.gap, y, out);
      break;

    case "logb":
      text("log", "log", x, y, m.size, false);
      place(m.b, x + m.nameW + m.gap, y + m.lower, out);
      place(m.k, x + m.nameW + m.gap + m.b.w + m.gap, y, out);
      break;

    case "mixed":
      place(m.whole, x, y, out);
      place(m.part, x + m.whole.w + m.gap, y, out);
      break;

    case "fn":
      if (m.transpose) {
        place(m.k, x, y, out);
        text("fn", "T", x + m.k.w + 0.05 * m.size, y - 0.55 * m.size, m.sup, false);
        break;
      }
      text("fn", FN_FACE[m.node.name] || m.node.name, x, y, m.size, false);
      place(m.k, x + m.nameW + m.gap, y, out);
      break;

    case "deg":
      place(m.k, x, y, out);
      text("deg", "°", x + m.k.w, y, m.size, false);
      break;

    case "deriv": {
      const barTop = y - m.axis - m.rule / 2;
      text("dtop", "d", x + (m.fw - m.topW) / 2, barTop - m.gap - DESC * m.s2, m.s2, true);
      text("dbot", `d${m.node.x}`, x + (m.fw - m.botW) / 2, barTop + m.rule + m.gap + ASC * m.s2, m.s2, true);
      out.atoms.push({ key: `${id}#dbar`, nodeId: id, kind: "rule", x: x + 0.03 * m.size, y: barTop, w: m.fw - 0.06 * m.size, h: m.rule });
      place(m.k, x + m.fw + 0.06 * m.size, y, out);
      break;
    }

    case "int": {
      // The ∫ centred on the maths axis, whatever size it has grown to.
      const iy = y - 0.3 * m.size + ((ASC - DESC) / 2) * m.iSize;
      text("int", "∫", x, iy, m.iSize, false);
      const lx = x + m.iW * 0.9;
      if (m.hi) place(m.hi, lx, y - m.up + m.hi.ascent, out);
      if (m.lo) place(m.lo, lx, y + m.down - m.lo.descent, out);
      const bx = x + m.iW + m.limW + 0.1 * m.size;
      place(m.body, bx, y, out);
      text("dx", `d${m.node.x}`, bx + m.body.w + 0.14 * m.size, y, m.size, true);
      if (m.back) {
        const ax = bx + m.body.w + 0.14 * m.size + m.dxW + 0.1 * m.size;
        text("back", `, ${m.node.x} = `, ax, y, m.size * 0.62, true);
        place(m.back, ax + m.backLead, y, out);
      }
      break;
    }

    case "lim": {
      text("lim", "lim", x + (m.colW - m.limW) / 2, y, m.size, false);
      const sx = x + (m.colW - m.subW) / 2;
      const sy = y + m.subDrop;
      text("limto", `${m.node.x}→`, sx, sy, m.sub, true);
      place(m.to, sx + m.arrowW, sy, out);
      place(m.body, x + m.colW + 0.18 * m.size, y, out);
      break;
    }

    case "root": {
      const barY = y - m.k.ascent - m.gap - m.rule;
      // MathJax's outline, its top on the bar: font units (1000 to the em, y up).
      const s = m.size / 1000;
      const gy = barY + m.g.h * m.size * m.sy;            // where the outline's baseline goes
      out.atoms.push({
        key: `${id}#rad`, nodeId: id, kind: "path", text: "√",
        x, y: barY, w: m.rw, h: (m.g.h + m.g.d) * m.size * m.sy,
        d: m.g.d === RADICAL.normal.d ? RADICAL.normal.path : RADICAL.tall.path,
        transform: `translate(${x} ${gy}) scale(${s} ${-s * m.sy})`,
      });
      place(m.k, x + m.rw + m.pad, y, out);
      const overlap = 0.04 * m.size;                     // join the bar to the tick
      out.atoms.push({ key: `${id}#vinc`, nodeId: id, kind: "rule",
                       x: x + m.rw - overlap, y: barY, w: m.k.w + m.pad * 2 + overlap, h: m.rule });
      break;
    }

    case "expr":
      place(m.e, x, y, out);
      break;

    case "abs": {
      const h = m.ascent + m.descent;
      out.atoms.push({ key: `${id}#lbar`, nodeId: id, kind: "rule", x, y: y - m.ascent, w: m.rule, h });
      place(m.k, x + m.rule + m.pad, y, out);
      out.atoms.push({ key: `${id}#rbar`, nodeId: id, kind: "rule", x: x + m.w - m.rule, y: y - m.ascent, w: m.rule, h });
      break;
    }

    case "eq": {
      place(m.l, x, y, out);
      const ex = x + m.l.w + m.gap;
      text("eq", m.rel || "=", ex, y, m.size, false);
      if (m.m) {
        const mx = ex + m.eqW + m.gap;
        place(m.m, mx, y, out);
        const ex2 = mx + m.m.w + m.gap;
        text("eq2", m.rel2 || "=", ex2, y, m.size, false);
        place(m.r, ex2 + m.eqW2 + m.gap, y, out);
        break;
      }
      place(m.r, ex + m.eqW + m.gap, y, out);
      break;
    }
  }
}

/**
 * Lay a line out.
 * Returns { w, h, atoms, boxes, baseline } in a coordinate space that starts
 * at (0, 0) — the caller decides where on the page that lands.
 */
export function layout(eq, size, padding = 10) {
  const m = measure(eq, size);
  const out = { atoms: [], boxes: new Map() };
  const baseline = padding + m.ascent;
  place(m, padding, baseline, out);
  return {
    ...out,
    baseline,
    w: m.w + padding * 2,
    h: m.ascent + m.descent + padding * 2,
  };
}

/* ── Reading a node back as words ───────────────────────────────────────────
   For the step notes and the labels on the offers, where a picture will not do. */

export function plain(node, parentKind = null, slot = 0) {
  const wrap = (s) => (needsBracketsLinear(node, parentKind, slot) ? `(${s})` : s);
  switch (node.kind) {
    case "num":  return wrap(numText(node));
    case "var":  return wrap(node.name);
    case "hole": return wrap("?");
    case "neg":  return wrap(`−${plain(node.k, "neg", 0)}`);
    case "pm":   return wrap(`±${plain(node.k, "pm", 0)}`);
    case "sum":  return wrap(node.kids.map((k, i) =>
                   i === 0 ? plain(k, "sum", 0)
                   : k.kind === "neg" && !k.paren ? ` − ${plain(k.k, "neg", 0)}`
                   : k.kind === "pm" && !k.paren ? ` ± ${plain(k.k, "pm", 0)}`
                   : ` + ${plain(k, "sum", i)}`).join(""));
    case "prod": return wrap(node.kids.map((k, i) =>
                   (i > 0 && startsWithDigit(k) ? "·" : "") + plain(k, "prod", i)).join(""));
    case "frac": return wrap(`${plain(node.a, "frac", 0)}/${plain(node.b, "frac", 1)}`);
    case "div":  return wrap(`${plain(node.a, "div", 0)}÷${plain(node.b, "div", 1)}`);
    case "pow":  return wrap(`${plain(node.b, "pow", 0)}^${plain(node.e, "pow", 1)}`);
    // √3 and √x read back as typed; anything bigger is a parcel: √(3x + 1).
    case "root": {
      const simple = node.k.kind === "num" || node.k.kind === "var";
      const inside = plain(node.k, "root", 0);
      return wrap(simple ? `√${inside}` : `√(${inside})`);
    }
    case "const": return wrap(node.name);
    case "ref":  return wrap(node.name);
    case "pct":  return wrap(`${plain(node.k, "pct", 0)}%`);
    case "fact": return wrap(`${plain(node.k, "fact", 0)}!`);
    case "list": return wrap(`{${node.items.map((it, i) => plain(it, "list", i)).join(", ")}}`);
    case "sigma": {
      const lim = (n) => (n.kind === "num" || n.kind === "var" || n.kind === "const" ? plain(n) : `(${plain(n)})`);
      return wrap(`Σ_(${node.x}=${plain(node.lo)})^${lim(node.hi)}(${plain({ ...node.k, paren: false })})`);
    }
    case "choose": return wrap(`n${node.perm ? "P" : "C"}r(${plain(node.n, "choose", 0)},${plain(node.r, "choose", 1)})`);
    case "mat":  return `[${node.rows.map((r) => `[${r.map((c) => plain(c, "mat", 0)).join(",")}]`).join(",")}]`;
    case "base": {
      const rad = node.v ? (node.v.kind === "hole" ? "?" : node.v.kind === "var" ? node.v.name : `(${plain({ ...node.v, paren: false })})`) : node.base;
      return wrap(`${node.digits}_${rad}`);
    }
    case "nroot": {
      // the cube and fourth roots read back as the glyphs they are written with
      const nv = node.n.kind === "num" && R.isInt(node.n.v) ? Number(node.n.v.n) : 0;
      if (nv === 3 || nv === 4) {
        const simple = node.k.kind === "num" || node.k.kind === "var";
        const inside = plain({ ...node.k }, "root", 0);
        return wrap(`${nv === 3 ? "∛" : "∜"}${simple ? inside : `(${inside})`}`);
      }
      const idx = node.n.kind === "num" || node.n.kind === "var" || node.n.kind === "hole" ? plain(node.n) : `(${plain({ ...node.n, paren: false })})`;
      return wrap(`root_${idx}${plain(node.k, "logb", 1)}`);
    }
    case "tet": {
      const h = node.n.kind === "num" || node.n.kind === "var" || node.n.kind === "hole" ? plain(node.n) : `(${plain({ ...node.n, paren: false })})`;
      return wrap(`${plain(node.b, "tet", 1)}^^${h}`);
    }
    case "logb": {
      const rad = node.b.kind === "num" || node.b.kind === "var" || node.b.kind === "hole" ? plain(node.b) : `(${plain({ ...node.b, paren: false })})`;
      return wrap(`log_${rad}${plain(node.k, "logb", 1)}`);
    }
    case "mixed": return wrap(`${plain(node.w)} ${plain(node.f.a)}/${plain(node.f.b)}`);
    case "fn":
      // A matrix on its side reads back as [[…]]^T, which the parser takes as it is.
      if (node.name === "transpose" && node.k.kind === "mat") return wrap(`${plain(node.k)}^T`);
      return wrap(`${node.name}${plain(node.k, "fn", 0)}`);
    case "deg":  return wrap(`${plain(node.k, "deg", 0)}°`);
    case "deriv": return wrap(`d/d${node.x}${plain(node.k, "deriv", 0)}`);
    case "int": {
      const lim = (n) => (n.kind === "num" || n.kind === "var" || n.kind === "const" ? plain(n) : `(${plain(n)})`);
      const range = node.lo ? `_${lim(node.lo)}^${lim(node.hi)}` : "";
      return wrap(`∫${range}(${plain({ ...node.k, paren: false })})d${node.x}`);
    }
    case "lim":  return wrap(`lim(${node.x}->${plain(node.to)})(${plain({ ...node.k, paren: false })})`);
    case "eq":   return node.m
      ? `${plain(node.l, "eq", 0)} ${node.rel} ${plain(node.m, "eq", 2)} ${node.rel2 || node.rel} ${plain(node.r, "eq", 1)}`
      : `${plain(node.l, "eq", 0)} ${node.rel || "="} ${plain(node.r, "eq", 1)}`;
    case "abs":  return wrap(`abs(${plain(node.k, "abs", 0)})`);
    case "expr": return plain(node.e, "expr", 0);
    default:     return "?";
  }
}
