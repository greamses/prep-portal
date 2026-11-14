/* ============================================================================
   A TABLE IN A FILM, MADE OF THE SITE'S OWN COMPONENTS
   ----------------------------------------------------------------------------
   *"The tables in the video dont use our style and components."* So a film's
   table is not a drawn grid: it is a real .pp-receipt (wrapper for the shadow,
   paper for the torn teeth and punched holes) with a taped .pp-sticky note on
   top of every column, the column's words written underneath on dashed rules.

   It is a LINE of the film (html: true), so it comes on and off like any line:
     lines: [tableLine("kw", COLS, { y: 24 })]
   and its columns are revealed by stages:
     stages: { "kw.c0": tableCol("kw", 0), ... }
   COLS: [{ head, tone (0..5, the six note papers), cells: [...] }]
   ========================================================================== */

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function tableCss() {
  if (typeof document === "undefined" || document.getElementById("ft-css")) return;
  const st = document.createElement("style");
  st.id = "ft-css";
  st.textContent = `
.ft.pp-receipt { display: block; }
.ft .pp-receipt__paper { padding: calc(var(--u) * 1.5) calc(var(--u) * 2.8) calc(var(--u) * 1.7); background-color: #fffdf8; }
.ft__grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: calc(var(--u) * 1.3); }
.ft__col { display: flex; flex-direction: column; align-items: stretch; gap: calc(var(--u) * 0.35); }
.ft__head.pp-sticky { display: block; text-align: center; font-size: 1.02em; line-height: 1.15; padding: 0.4em 0.35em 0.45em; margin: 0 0 0.45em;
  white-space: normal; }
.ft__col:nth-child(odd) .ft__head.pp-sticky { --pp-note-tilt: -2deg; }
.ft__col:nth-child(even) .ft__head.pp-sticky { --pp-note-tilt: 1.6deg; }
.ft__cell { display: block; text-align: center; font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 0.9em; color: #2a2723;
  padding: 0.28em 0.1em; border-bottom: 1px dashed rgba(42, 39, 35, 0.32); white-space: normal; }
.ft [data-ftk] { opacity: 0; }
`;
  document.head.appendChild(st);
}

export function tableHtml(id, cols) {
  return `<div class="ft pp-receipt" data-ft="${esc(id)}"><div class="pp-receipt__paper"><div class="ft__grid" style="--cols:${cols.length}">`
    + cols.map((c, j) => `<div class="ft__col"><span class="ft__head pp-sticky pp-sticky--tape pp-sticky--c${c.tone ?? j % 6}" data-ftk="h${j}">${esc(c.head)}</span>`
      + c.cells.filter((x) => x !== "").map((w, i) => `<span class="ft__cell" data-ftk="c${j}-${i}">${esc(w)}</span>`).join("") + `</div>`).join("")
    + `</div></div></div>`;
}

/** The film line for a table: centred, `w` units wide, its middle at `y`. */
export function tableLine(id, cols, { y = 24, w = 92, size = 1.55 } = {}) {
  tableCss();
  return { id, html: true, text: tableHtml(id, cols), x: 50 - w / 2, y, w, size, lh: 1.25 };
}

/** Reveal column j: its sticky note lands, then its words are written one by one. */
export const tableCol = (id, j, gap = 0.35) => (svg, H, stage) => {
  tableCss();
  const box = stage?.querySelector(`[data-t="${id}"]`);
  if (!box) return;
  const head = box.querySelector(`[data-ftk="h${j}"]`);
  if (head) H.write(head, 0);
  [...box.querySelectorAll(`[data-ftk^="c${j}-"]`)].forEach((n, i) => H.write(n, 0.4 + i * gap));
};
