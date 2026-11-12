/* ============================================================================
   FILM MATHS — the films write their mathematics in MathJax
   ----------------------------------------------------------------------------
     mathLoad()                     load MathJax once (a film awaits it: `ready`)
     texOf("sold for 57,000")       a plain label as TeX (words in \text{}, figures as maths)
     texBox(tex, em)                how big it comes out: { w, h, asc } in the drawing's units
     texAt(tex, x, y, { em, anchor, color, attrs })
                                    a nested <svg> of the formula, its BASELINE at y,
                                    ready to sit in any film drawing as a mark
     mathifyPic(svgString)          every <text> in a drawing (a bar model's figures and
                                    brace words) re-set in MathJax, in the same place,
                                    keeping its data-mb name so the hand still draws it

   MathJax draws glyphs as paths, so a formula is a drawing like any other mark:
   it can be written, faded, struck through and counted. When MathJax cannot load,
   everything falls back to the plain text it was given.
   ========================================================================== */

import { loadMath, mathReady, svgFor } from "./mathify.js";

export const mathLoad = () => loadMath();

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** A plain label as TeX: words in \text{}, numbers and signs as maths. */
export function texOf(str) {
  const s = String(str);
  return s.split(/(\s*[A-Za-z][A-Za-z' ]*[A-Za-z]\s*|\s*[A-Za-z]\s*)/).filter((p) => p !== "").map((p) => {
    if (/[A-Za-z]/.test(p)) return `\\text{${p.replace(/[{}\\]/g, "")}}`;
    return p.replace(/(\d),(\d)/g, "$1{,}$2").replace(/%/g, "\\%").replace(/×/g, "\\times ").replace(/÷/g, "\\div ")
      .replace(/−/g, "-").replace(/✓/g, "\\checkmark").replace(/₦/g, "\\text{₦}");
  }).join("");
}

function view(svg) {
  const vb = (svg.getAttribute("viewBox") || "0 0 0 0").split(/[\s,]+/).map(Number);
  return { x: vb[0], y: vb[1], w: vb[2], h: vb[3] };
}

/** How big a formula comes out at `em` drawing-units to the em. */
export function texBox(tex, em) {
  if (!mathReady()) return { w: String(tex).length * em * 0.55, h: em * 1.2, asc: em * 0.8 };
  const svg = svgFor(tex);
  if (!svg) return { w: String(tex).length * em * 0.55, h: em * 1.2, asc: em * 0.8 };
  const v = view(svg);
  const k = em / 1000;
  return { w: v.w * k, h: v.h * k, asc: -v.y * k };
}

/**
 * The formula as a nested <svg>, placed so its baseline is at y and it is
 * anchored at x ("middle", "start" or "end"). `attrs` are written on it
 * (data-mb, data-k …), so it is a mark the film's hand can draw.
 */
export function texAt(tex, x, y, { em = 6, anchor = "middle", color = "#2a2723", attrs = "", fallback = null } = {}) {
  const svg = mathReady() ? svgFor(tex) : null;
  if (!svg) {
    const t = fallback ?? tex;
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="STIX Two Text, serif" font-size="${em}" fill="${color}" ${attrs}>${esc(t)}</text>`;
  }
  const v = view(svg);
  const k = em / 1000;
  const w = v.w * k, h = v.h * k, asc = -v.y * k;
  const left = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const inner = svg.innerHTML;
  return `<svg x="${left.toFixed(2)}" y="${(y - asc).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" `
    + `viewBox="${v.x} ${v.y} ${v.w} ${v.h}" overflow="visible" style="color:${color}" ${attrs}>${inner}</svg>`;
}

/**
 * Every <text> in a drawing re-set in MathJax, in its own place and size,
 * keeping the attributes the film's hand finds it by. Fractions drawn as two
 * texts and a rule stay two texts and a rule, each re-set.
 */
export function mathifyPic(html, { scale = 1.06 } = {}) {
  if (!mathReady() || typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "image/svg+xml");
  const root = doc.documentElement;
  if (!root || root.nodeName !== "svg") return html;
  [...root.querySelectorAll("text")].forEach((t) => {
    const str = t.textContent;
    if (!str.trim()) return;
    const size = Number(t.getAttribute("font-size")) || 4.2;
    const keep = [...t.attributes].filter((a) => /^data-/.test(a.name)).map((a) => `${a.name}="${esc(a.value)}"`).join(" ");
    const mark = texAt(texOf(str), Number(t.getAttribute("x")) || 0, Number(t.getAttribute("y")) || 0, {
      em: size * scale, anchor: t.getAttribute("text-anchor") || "start", color: t.getAttribute("fill") || "#2a2723", attrs: keep,
    });
    const frag = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${mark}</svg>`, "image/svg+xml").documentElement.firstElementChild;
    /* a formula that will not parse leaves its plain text where it was, rather than cut the drawing short */
    if (frag && frag.nodeName !== "parsererror" && !frag.querySelector("parsererror")) t.replaceWith(doc.importNode(frag, true));
  });
  return new XMLSerializer().serializeToString(root);
}
