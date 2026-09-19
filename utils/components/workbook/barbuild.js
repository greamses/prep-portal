/* ============================================================================
   PRINTABLE WORKBOOK — a bar chart you draw by tapping
   ----------------------------------------------------------------------------
   On paper, "draw the bar chart" is empty axes to rule the bars on. On screen
   each column can be tapped at the height its bar should reach, and the bar
   rises to it; tapping the top of a bar again takes it down a step. It is
   marked bar by bar: a bar is right when it stops at the table's number.

   The drawing says what it is (the workbook draws it):

     svg[data-barbuild]                   one bar chart to draw
       rect.bb-bar[data-col]              the bar, drawn from the axis
       rect.bb-hit[data-col][data-v]      a band to tap: "the bar reaches v"
     svg[data-axis="y0,mmPerUnit"]        where the axis is, and how tall 1 is
     svg[data-horizontal]                 bars run across, not up

   rowRight-style checking is pure: barsRight() has no DOM.
   ========================================================================== */

const num = (s) => String(s || "").split(",").map(Number);

/** Is each bar at its value? One true/false per bar. */
export function barsRight(heights, values) {
  return values.map((v, c) => v == null || Math.abs((heights[c] || 0) - v) < 1e-9);
}

/**
 *   mountBars(svg, { saved, onChange })
 *     saved     heights from before, or null
 *     onChange(heights, before)   after every tap
 *   → { heights(), set(h), clear(), dispose() }
 */
export function mountBars(svg, { saved = null, onChange = () => {} } = {}) {
  svg.dataset.barLive = "1";
  const [base, per] = num(svg.dataset.axis);
  const across = svg.hasAttribute("data-horizontal");
  const bars = () => [...svg.querySelectorAll(".bb-bar")];
  const cols = () => bars().map((b) => Number(b.dataset.col));
  let heights = saved ? saved.slice() : cols().map(() => 0);

  const paint = () => {
    bars().forEach((b) => {
      const c = Number(b.dataset.col);
      const v = heights[c] || 0;
      if (across) b.setAttribute("width", Math.max(0, v * per).toFixed(2));
      else {
        b.setAttribute("y", (base - v * per).toFixed(2));
        b.setAttribute("height", Math.max(0, v * per).toFixed(2));
      }
      b.setAttribute("aria-label", `bar ${c + 1}: ${v}`);
    });
    svg.querySelectorAll(".bb-hit").forEach((h) => {
      h.setAttribute("role", "button");
      h.setAttribute("aria-label", `bar ${Number(h.dataset.col) + 1} to ${h.dataset.v}`);
    });
  };
  paint();

  if (!svg.__wbBarsBound) {
    svg.__wbBarsBound = true;
    svg.addEventListener("click", (e) => {
      const hit = e.target.closest?.(".bb-hit");
      if (!hit || !svg.dataset.barLive) return;
      svg.__wbBarsTap?.(Number(hit.dataset.col), Number(hit.dataset.v), Number(hit.dataset.step));
    });
  }
  svg.__wbBarsTap = (c, v, step) => {
    const before = heights.slice();
    /* tapping the top of the bar again lowers it a step — the only way down */
    heights[c] = Math.abs((heights[c] || 0) - v) < 1e-9 ? Math.max(0, v - step) : v;
    paint();
    onChange(heights.slice(), before);
  };

  return {
    heights: () => heights.slice(),
    set(h) { heights = h.slice(); paint(); },
    clear() { heights = cols().map(() => 0); paint(); },
    dispose() {
      delete svg.dataset.barLive;
      heights = cols().map(() => 0);
      paint();
    },
  };
}
