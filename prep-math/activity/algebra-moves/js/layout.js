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
  // A fraction bar and a raised exponent do their own grouping, so brackets in
  // those places are noise EVEN WHEN THE STUDENT TYPED THEM — which matters
  // because the keypad's fraction key types a pair into each half.
  if (parentKind === "frac") return false;
  if (parentKind === "pow" && slot === 1) return false;
  // A root's bar groups whatever is under it, the way a fraction bar does.
  if (parentKind === "root") return false;
  // A function's argument and a derivative's body are always in brackets.
  if (parentKind === "fn" || parentKind === "deriv") return true;
  if (parentKind === "int" || parentKind === "lim") return node.kind === "sum";
  if (parentKind === "deg") return node.kind !== "num" && node.kind !== "var";
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

    /* A radical: the √ glyph, grown with what it covers the way a bracket is,
       and a bar (the vinculum) running over the whole radicand. */
    case "root": {
      const k = measure(node.k, size, "root", 0);
      const gap = 0.1 * size;
      const rule = Math.max(1, 0.05 * size);
      const above = k.ascent + gap + rule;               // baseline to the bar
      const rSize = Math.max(size, (above + k.descent) / (ASC + DESC));
      const rw = measureText("√", rSize, false);
      const pad = 0.06 * size;
      return {
        ...base, kind: "root", k, gap, rule, rSize, rw, pad,
        w: rw + pad + k.w + pad,
        ascent: Math.max(base.ascent, above),
        descent: Math.max(base.descent, k.descent, (ASC + DESC) * rSize - above),
      };
    }

    // e and π: numbers that happen to be written as letters.
    case "const":
      return { ...base, kind: "text", text: node.name, italic: false, w: measureText(node.name, size, false) };

    case "fn": {
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
      const topW = measureText("d", s2, false);
      const botW = measureText(`d${node.x}`, s2, false);
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
      const dxW = measureText(`d${node.x}`, size, false);
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
      const arrowW = measureText(`${node.x}→`, sub, false);
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

    case "fn":
      text("fn", FN_FACE[m.node.name] || m.node.name, x, y, m.size, false);
      place(m.k, x + m.nameW + m.gap, y, out);
      break;

    case "deg":
      place(m.k, x, y, out);
      text("deg", "°", x + m.k.w, y, m.size, false);
      break;

    case "deriv": {
      const barTop = y - m.axis - m.rule / 2;
      text("dtop", "d", x + (m.fw - m.topW) / 2, barTop - m.gap - DESC * m.s2, m.s2, false);
      text("dbot", `d${m.node.x}`, x + (m.fw - m.botW) / 2, barTop + m.rule + m.gap + ASC * m.s2, m.s2, false);
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
      text("dx", `d${m.node.x}`, bx + m.body.w + 0.14 * m.size, y, m.size, false);
      if (m.back) {
        const ax = bx + m.body.w + 0.14 * m.size + m.dxW + 0.1 * m.size;
        text("back", `, ${m.node.x} = `, ax, y, m.size * 0.62, false);
        place(m.back, ax + m.backLead, y, out);
      }
      break;
    }

    case "lim": {
      text("lim", "lim", x + (m.colW - m.limW) / 2, y, m.size, false);
      const sx = x + (m.colW - m.subW) / 2;
      const sy = y + m.subDrop;
      text("limto", `${m.node.x}→`, sx, sy, m.sub, false);
      place(m.to, sx + m.arrowW, sy, out);
      place(m.body, x + m.colW + 0.18 * m.size, y, out);
      break;
    }

    case "root": {
      const barY = y - m.k.ascent - m.gap - m.rule;
      // Sit the glyph so its top meets the bar.
      text("rad", "√", x, barY + ASC * m.rSize, m.rSize, false);
      place(m.k, x + m.rw + m.pad, y, out);
      const overlap = 0.04 * m.size;                     // join the bar to the tick
      out.atoms.push({ key: `${id}#vinc`, nodeId: id, kind: "rule",
                       x: x + m.rw - overlap, y: barY, w: m.k.w + m.pad * 2 + overlap, h: m.rule });
      break;
    }

    case "expr":
      place(m.e, x, y, out);
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
    case "pow":  return wrap(`${plain(node.b, "pow", 0)}^${plain(node.e, "pow", 1)}`);
    // √3 and √x read back as typed; anything bigger is a parcel: √(3x + 1).
    case "root": {
      const simple = node.k.kind === "num" || node.k.kind === "var";
      const inside = plain(node.k, "root", 0);
      return wrap(simple ? `√${inside}` : `√(${inside})`);
    }
    case "const": return wrap(node.name);
    case "fn":   return wrap(`${node.name}${plain(node.k, "fn", 0)}`);
    case "deg":  return wrap(`${plain(node.k, "deg", 0)}°`);
    case "deriv": return wrap(`d/d${node.x}${plain(node.k, "deriv", 0)}`);
    case "int": {
      const lim = (n) => (n.kind === "num" || n.kind === "var" || n.kind === "const" ? plain(n) : `(${plain(n)})`);
      const range = node.lo ? `_${lim(node.lo)}^${lim(node.hi)}` : "";
      return wrap(`∫${range}(${plain({ ...node.k, paren: false })})d${node.x}`);
    }
    case "lim":  return wrap(`lim(${node.x}->${plain(node.to)})(${plain({ ...node.k, paren: false })})`);
    case "eq":   return `${plain(node.l, "eq", 0)} = ${plain(node.r, "eq", 1)}`;
    case "expr": return plain(node.e, "expr", 0);
    default:     return "?";
  }
}
