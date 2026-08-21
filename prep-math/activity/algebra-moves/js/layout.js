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
  return (document.fonts ? document.fonts.load(`400 32px ${FAMILY}`) : Promise.resolve())
    .catch(() => {})
    .then(() => widthCache.clear());
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

function needsBrackets(node, parentKind, slot) {
  if (node.paren) return true;
  switch (parentKind) {
    case "prod": return node.kind === "sum" || (node.kind === "neg" && slot > 0);
    case "neg":  return node.kind === "sum";
    case "pow":  return slot === 0 && node.kind !== "num" && node.kind !== "var";
    default:     return false;
  }
}

function needsBracketsLinear(node, parentKind, slot) {
  if (needsBrackets(node, parentKind, slot)) return true;
  switch (parentKind) {
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

    case "neg": {
      // A minus in front of a term is tight; a minus BETWEEN terms is an
      // operator and gets air on its right, because the sum already left air
      // on its left.
      const signW = measureText("−", size, false);
      const gap = binary ? 0.22 * size : 0.06 * size;
      const k = measure(node.k, size, "neg", 0);
      return { ...base, kind: "neg", signW, gap, k, w: signW + gap + k.w,
               ascent: Math.max(base.ascent, k.ascent), descent: Math.max(base.descent, k.descent) };
    }

    case "sum": {
      const opGap = 0.28 * size;
      const parts = [];
      let w = 0, ascent = base.ascent, descent = base.descent;
      node.kids.forEach((kid, i) => {
        const isNeg = kid.kind === "neg" && !kid.paren;
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
        const dotW = dot ? measureText("·", size, false) : 0;
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
      const pad = 0.16 * size;
      const axis = 0.30 * size;
      const gap = 0.13 * size;
      const rule = Math.max(1, 0.05 * size);
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

    case "eq": {
      const l = measure(node.l, size, "eq", 0);
      const r = measure(node.r, size, "eq", 1);
      const gap = 0.34 * size;
      const eqW = measureText("=", size, false);
      return { ...base, kind: "eq", l, r, gap, eqW, w: l.w + gap + eqW + gap + r.w,
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

  const text = (slot, txt, tx, ty, size, italic) =>
    out.atoms.push({ key: `${id}#${slot}`, nodeId: id, kind: "text", text: txt, x: tx, y: ty, size, italic: !!italic });

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

    case "neg":
      text("sign", "−", x, y, m.size, false);
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
        if (part.dot) { text(`dot${i}`, "·", cx, y, m.size, false); cx += part.dotW + part.gap; }
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

    case "eq": {
      place(m.l, x, y, out);
      const ex = x + m.l.w + m.gap;
      text("eq", "=", ex, y, m.size, false);
      place(m.r, ex + m.eqW + m.gap, y, out);
      break;
    }
  }
}

/**
 * Lay an equation out.
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
    case "neg":  return wrap(`−${plain(node.k, "neg", 0)}`);
    case "sum":  return wrap(node.kids.map((k, i) =>
                   i === 0 ? plain(k, "sum", 0)
                   : k.kind === "neg" && !k.paren ? ` − ${plain(k.k, "neg", 0)}`
                   : ` + ${plain(k, "sum", i)}`).join(""));
    case "prod": return wrap(node.kids.map((k, i) =>
                   (i > 0 && startsWithDigit(k) ? "·" : "") + plain(k, "prod", i)).join(""));
    case "frac": return wrap(`${plain(node.a, "frac", 0)}/${plain(node.b, "frac", 1)}`);
    case "pow":  return wrap(`${plain(node.b, "pow", 0)}^${plain(node.e, "pow", 1)}`);
    case "eq":   return `${plain(node.l, "eq", 0)} = ${plain(node.r, "eq", 1)}`;
    default:     return "?";
  }
}
