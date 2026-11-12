/* ============================================================================
   FILM MATHS — the films write their mathematics in MathJax
   ----------------------------------------------------------------------------
     mathLoad()                     get a MathJax that draws SVG (a film awaits it: `ready`)
     texOf("sold for 57,000")       a plain label as TeX (words in \text{}, figures as maths)
     texBox(tex, em)                how big it comes out: { w, h, asc } in the drawing's units
     texAt(tex, x, y, { em, anchor, color, attrs })
                                    a nested <svg> of the formula, its BASELINE at y,
                                    ready to sit in any film drawing as a mark
     mathifyPic(svgString)          every <text> in a drawing (a bar model's figures and
                                    brace words) re-set in MathJax, in the same place,
                                    keeping its data-mb name so the hand still draws it

   WHICH MATHJAX. A page may already have one, and it may draw HTML rather than
   SVG: the CBT page runs MathJax 4 with CommonHTML, and a film there drew its
   TeX source on the screen ("The mathjax is showing the code"). So the page's
   MathJax is used only if it can draw SVG; a page with none gets the site's
   own (mathify.js loadMath); anything else gets a PRIVATE MathJax in a hidden
   frame, which cannot clash with the page's. If none can be had, a formula is
   written as plain readable text, never as TeX.
   ========================================================================== */

import { loadMath } from "./mathify.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const SRC = "https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js";

let engine = null;          // a MathJax with tex2svg
let local = false;          // whether it is the page's own (whose fontCache must be set per call)
let loading = null;
const cache = new Map();

const svgCapable = (mj) => !!(mj && typeof mj.tex2svg === "function");

/** A private MathJax in a frame of its own, so the page's (whatever it is) is never touched. */
function frameEngine() {
  return new Promise((resolve) => {
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.tabIndex = -1;
    f.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden;left:-9999px";
    f.srcdoc = `<!doctype html><html><head><script>window.MathJax={svg:{fontCache:"local"},startup:{typeset:false}};<\/script>`
      + `<script src="${SRC}" async><\/script></head><body></body></html>`;
    document.body.appendChild(f);
    const t0 = Date.now();
    const wait = () => {
      const mj = f.contentWindow?.MathJax;
      const p = mj?.startup?.promise;
      if (svgCapable(mj) && p) { p.then(() => resolve(mj), () => resolve(null)); return; }
      if (Date.now() - t0 > 12000) { resolve(null); return; }
      setTimeout(wait, 80);
    };
    wait();
  });
}

/** A MathJax that draws SVG, from wherever one can be had. */
export function mathLoad() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (loading) return loading;
  loading = (async () => {
    if (svgCapable(window.MathJax) && window.MathJax.startup?.output?.name !== "CHTML") {
      engine = window.MathJax; local = true; return true;
    }
    if (!window.MathJax) {
      await loadMath();
      if (svgCapable(window.MathJax)) { engine = window.MathJax; local = true; return true; }
    }
    engine = await frameEngine();
    local = false;
    return !!engine;
  })();
  return loading;
}

export const mathReady = () => !!engine;

function svgOf(tex) {
  if (cache.has(tex)) return cache.get(tex);
  let svg = null;
  try {
    const out = engine.startup?.output;
    const was = out?.options?.fontCache;
    if (local && out?.options) out.options.fontCache = "local";
    try { svg = engine.tex2svg(tex, { display: false }).querySelector("svg"); }
    finally { if (local && out?.options && was !== undefined) out.options.fontCache = was; }
    if (svg && svg.querySelector("[data-mjx-error], merror")) svg = null;
  } catch { svg = null; }
  cache.set(tex, svg);
  return svg;
}

/** TeX as plain words and signs, for when no MathJax can be had: never the source. */
export function plainOf(tex) {
  return String(tex)
    .replace(/\\tfrac\s*\{?(\d)\}?\s*\{?(\d)\}?/g, "$1/$2").replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2")
    .replace(/\\text\{([^}]*)\}/g, "$1").replace(/\{,\}/g, ",").replace(/\\%/g, "%")
    .replace(/\\times/g, "×").replace(/\\div/g, "÷").replace(/\\checkmark/g, "✓")
    .replace(/\\[,;: ]/g, " ").replace(/\\ /g, " ").replace(/[{}]/g, "").replace(/\\/g, "").replace(/\s+/g, " ").trim();
}

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
  const svg = engine ? svgOf(tex) : null;
  if (!svg) return { w: plainOf(tex).length * em * 0.5, h: em * 1.2, asc: em * 0.72 };
  const v = view(svg);
  const k = em / 1000;
  return { w: v.w * k, h: v.h * k, asc: -v.y * k };
}

/**
 * The formula as a nested <svg>, placed so its baseline is at y and it is
 * anchored at x ("middle", "start" or "end"). `attrs` are written on it
 * (data-mb, data-k …), so it is a mark the film's hand can draw.
 */
export function texAt(tex, x, y, { em = 6, anchor = "middle", color = "#2a2723", attrs = "" } = {}) {
  const svg = engine ? svgOf(tex) : null;
  if (!svg) {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="STIX Two Text, Cambria Math, serif" font-size="${em}" fill="${color}" ${attrs}>${esc(plainOf(tex))}</text>`;
  }
  const v = view(svg);
  const k = em / 1000;
  const w = v.w * k, h = v.h * k, asc = -v.y * k;
  const left = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return `<svg x="${left.toFixed(2)}" y="${(y - asc).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" `
    + `viewBox="${v.x} ${v.y} ${v.w} ${v.h}" overflow="visible" style="color:${color}" ${attrs}>${svg.innerHTML}</svg>`;
}

/**
 * Every <text> in a drawing re-set in MathJax, in its own place and size,
 * keeping the attributes the film's hand finds it by.
 */
export function mathifyPic(html, { scale = 1.06 } = {}) {
  if (!engine || typeof DOMParser === "undefined") return html;
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
    /* MathJax draws with <use xlink:href>, so the wrapper MUST declare xlink: without it the
       fragment does not parse, and the drawing after it was silently cut off */
    const frag = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${mark}</svg>`, "image/svg+xml").documentElement.firstElementChild;
    if (frag && frag.nodeName !== "parsererror" && !frag.querySelector("parsererror")) t.replaceWith(doc.importNode(frag, true));
  });
  return new XMLSerializer().serializeToString(root);
}
