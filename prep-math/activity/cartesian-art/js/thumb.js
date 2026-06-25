/* ============================================================================
   Cartesian Art — vector thumbnails
   ----------------------------------------------------------------------------
   Render a small preview SVG of an artwork's shapes, auto-fit to the box. Used
   by the puzzle picker and the personal gallery so both read as visual galleries
   rather than text lists. Pure (no state) so it works for any shape list.
   ========================================================================== */

const SVGNS = "http://www.w3.org/2000/svg";

function el(name, attrs = {}, parent = null) {
  const n = document.createElementNS(SVGNS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

/** Normalise a saved puzzle/gallery doc into a [{points,closed,fillColor,strokeColor}] list. */
export function normalizeShapes(doc) {
  if (doc && Array.isArray(doc.shapes) && doc.shapes.length) {
    return doc.shapes.map((s) => ({
      points: s.points || [],
      closed: !!s.closed,
      fillColor: s.fillColor || null,
      strokeColor: s.strokeColor || null,
    }));
  }
  if (doc && Array.isArray(doc.points) && doc.points.length) {
    return [{ points: doc.points, closed: !!doc.closed, fillColor: doc.fillColor || null, strokeColor: null }];
  }
  return [];
}

/** Build a fitted preview <svg> for a list of shapes. */
export function buildThumb(shapes, W = 132, H = 104, pad = 9) {
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "ca-thumb-svg", "aria-hidden": "true" });

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of shapes) for (const p of s.points) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  if (!isFinite(minX)) return svg; // nothing to draw

  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const X = (x) => (W / 2 + (x - cx) * scale).toFixed(1);
  const Y = (y) => (H / 2 - (y - cy) * scale).toFixed(1);

  for (const s of shapes) {
    if (!s.points || s.points.length < 2) continue;
    const d = "M " + s.points.map((p) => `${X(p.x)} ${Y(p.y)}`).join(" L ") + (s.closed ? " Z" : "");
    if (s.closed && s.fillColor) {
      el("path", { d, class: "ca-thumb-fill", style: `fill:${s.fillColor}` }, svg);
    }
    const line = el("path", { d, class: "ca-thumb-line" }, svg);
    if (s.strokeColor) line.setAttribute("style", `stroke:${s.strokeColor}`);
  }
  return svg;
}
