/* ============================================================================
   PRINTABLE WORKBOOK — points you plot by tapping
   ----------------------------------------------------------------------------
   A scatter graph is plotted one point at a time: across to one value, up to
   the other, a cross. On paper that is done with a pencil on the grid; on
   screen every gridpoint can be tapped, and a tap puts a cross there (or takes
   it away again). It is marked as a whole: every point plotted, and nothing
   plotted that is not a point.

   The drawing says what it is (the workbook draws it):

     svg[data-dotplot]                       one graph to plot on
       circle.dp-hit[data-x][data-y]         a gridpoint to tap, by its values
       g.dp-dots                             where the crosses are drawn

   dotsRight() has no DOM, so the checks run it in Node.
   ========================================================================== */

const NS = "http://www.w3.org/2000/svg";
export const keyOf = (x, y) => `${+x},${+y}`;

/** Are these exactly the points asked for? Order does not matter. */
export function dotsRight(placed, points) {
  const want = new Set(points.map(([x, y]) => keyOf(x, y)));
  const got = new Set(placed);
  return got.size === want.size && [...want].every((k) => got.has(k));
}

/**
 *   mountDots(svg, { saved, onChange })
 *     saved     ["x,y", …] from before, or null
 *   → { dots(), set(list), clear(), dispose() }
 */
export function mountDots(svg, { saved = null, onChange = () => {} } = {}) {
  svg.dataset.dotLive = "1";
  let dots = saved ? saved.slice() : [];
  const layer = () => {
    let g = svg.querySelector(":scope > .dp-dots");
    if (!g) { g = document.createElementNS(NS, "g"); g.setAttribute("class", "dp-dots"); svg.appendChild(g); }
    return g;
  };
  const paint = () => {
    const g = layer();
    g.innerHTML = "";
    dots.forEach((k) => {
      const hit = svg.querySelector(`.dp-hit[data-x="${k.split(",")[0]}"][data-y="${k.split(",")[1]}"]`);
      if (!hit) return;
      const cx = Number(hit.getAttribute("cx"));
      const cy = Number(hit.getAttribute("cy"));
      const d = 1.3;
      g.insertAdjacentHTML("beforeend",
        `<path d="M${cx - d} ${cy - d}L${cx + d} ${cy + d}M${cx + d} ${cy - d}L${cx - d} ${cy + d}" stroke="#2f6ea8" stroke-width="0.6" stroke-linecap="round" pointer-events="none"/>`);
    });
    svg.querySelectorAll(".dp-hit").forEach((h) => {
      h.setAttribute("role", "button");
      h.setAttribute("aria-label", `the point (${h.dataset.x}, ${h.dataset.y})`);
    });
  };
  paint();

  if (!svg.__wbDotsBound) {
    svg.__wbDotsBound = true;
    svg.addEventListener("click", (e) => {
      const hit = e.target.closest?.(".dp-hit");
      if (!hit || !svg.dataset.dotLive) return;
      svg.__wbDotsTap?.(keyOf(hit.dataset.x, hit.dataset.y));
    });
  }
  svg.__wbDotsTap = (k) => {
    const before = dots.slice();
    dots = dots.includes(k) ? dots.filter((d) => d !== k) : [...dots, k];
    paint();
    onChange(dots.slice(), before);
  };

  return {
    dots: () => dots.slice(),
    set(list) { dots = list.slice(); paint(); },
    clear() { dots = []; paint(); },
    dispose() { delete svg.dataset.dotLive; dots = []; svg.querySelector(":scope > .dp-dots")?.remove(); },
  };
}
