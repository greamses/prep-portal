/* ============================================================================
   PRINTABLE WORKBOOK — a pictogram you build by tapping
   ----------------------------------------------------------------------------
   On paper, "draw the pictogram" is a row of empty dashed boxes to draw the
   symbols into. On screen each box can be tapped:

     empty  →  a whole symbol  →  half a symbol  →  empty again

   and it is marked the way a teacher marks one, row by row. A row is right
   when its symbols add up to what the table says — counted in halves, so a
   half symbol is worth half the key — AND it is written the way a pictogram
   is written: whole symbols from the left with no gaps, and a half symbol, if
   there is one, only at the very end. "Two whole, a gap, one whole" is not a
   pictogram of 3, however the arithmetic comes out.

   The drawing says what it is (the workbook draws it):

     svg[data-picto]                      one pictogram to build
       g.pc-cell[data-row][data-col]      a box to tap; its state is data-state
         .pc-whole / .pc-half             the symbol, whole and cut in half

   and workbook.css shows the whole or the half by data-state. A row the
   question has already drawn has no cells, and is not marked.

   Pure where it can be: rowRight() has no DOM, so the checks run it in Node.
   ========================================================================== */

/* the states, counted in halves of a symbol */
export const EMPTY = 0;
export const HALF = 1;
export const WHOLE = 2;
const NEXT = { [EMPTY]: WHOLE, [WHOLE]: HALF, [HALF]: EMPTY };

/**
 * Is a row of states a correct pictogram of `halves` half-symbols? Whole
 * symbols packed from the left, at most one half, and only at the end.
 */
export function rowRight(states, halves) {
  const used = states.filter((s) => s !== EMPTY);
  const packed = states.slice(0, used.length).every((s) => s !== EMPTY);
  const halfOk = used.slice(0, -1).every((s) => s === WHOLE);
  const total = used.reduce((a, s) => a + s, 0);
  return packed && halfOk && total === halves;
}

/** The states in the drawing: rows × columns, 0 where nothing is placed. */
const gridOf = (svg) => {
  const out = [];
  svg.querySelectorAll(".pc-cell").forEach((c) => {
    const r = Number(c.dataset.row);
    const k = Number(c.dataset.col);
    (out[r] ||= [])[k] = Number(c.dataset.state) || EMPTY;
  });
  return out.map((row) => [...(row || [])].map((s) => s || EMPTY));
};

/**
 *   mountPicto(svg, { saved, onChange })
 *     saved      states from before (as gridOf gives them), or null
 *     onChange(states, before)   after every tap
 *   → { states(), set(states), clear(), dispose() }
 */
export function mountPicto(svg, { saved = null, onChange = () => {} } = {}) {
  svg.dataset.pictoLive = "1";
  const cells = () => [...svg.querySelectorAll(".pc-cell")];
  const paint = (grid) => {
    cells().forEach((c) => {
      const s = grid?.[Number(c.dataset.row)]?.[Number(c.dataset.col)] || EMPTY;
      c.dataset.state = String(s);
      c.setAttribute("role", "button");
      c.setAttribute("tabindex", "0");
      c.setAttribute("aria-label", s === WHOLE ? "a whole symbol" : s === HALF ? "half a symbol" : "empty — tap to draw a symbol");
    });
  };
  paint(saved);

  if (!svg.__wbPictoBound) {
    svg.__wbPictoBound = true;
    const tap = (c) => {
      if (!svg.dataset.pictoLive) return;
      const before = gridOf(svg);
      c.dataset.state = String(NEXT[Number(c.dataset.state) || EMPTY]);
      paint(gridOf(svg));
      svg.__wbPictoChange?.(gridOf(svg), before);
    };
    svg.addEventListener("click", (e) => {
      const c = e.target.closest?.(".pc-cell");
      if (c) tap(c);
    });
    svg.addEventListener("keydown", (e) => {
      const c = e.target.closest?.(".pc-cell");
      if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); tap(c); }
    });
  }
  svg.__wbPictoChange = onChange;

  return {
    states: () => gridOf(svg),
    set(grid) { paint(grid); },
    clear() { paint(null); },
    dispose() {
      delete svg.dataset.pictoLive;
      cells().forEach((c) => { c.removeAttribute("data-state"); c.removeAttribute("role"); c.removeAttribute("tabindex"); c.removeAttribute("aria-label"); });
    },
  };
}
