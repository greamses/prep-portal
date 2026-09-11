/* ============================================================================
   THE WRITTEN BOARDS — painting one, on a canvas
   ----------------------------------------------------------------------------
   Every board hands back the SAME kind of page — a grid of cells with marks in
   them, some lines, some signs, a point or two, and the cell the next figure
   goes in — so there is one painter and not one each. Feed it the sheet any of
   them returns. A mark may stand across more than one cell (`cols`, `span`):
   a number on the fraction board is one mark, where a figure in a column of a
   division is one each.

   It knows nothing about the site: every colour is passed in, so the same
   function paints onto the 3D canvas in the manipulatives (where the colours
   come off the theme) and onto a plain 2D canvas anywhere else.

   The DOM version of the same page lives in utils/components/boards/sheet.js.
   Two renderers, one model: what is on the paper is decided in one place.
   ========================================================================== */

/** A hex colour at an alpha, for the fading this does. */
function rgba(hex, a) {
  const h = String(hex || "#2a2723").trim().replace("#", "");
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h.slice(0, 6);
  const n = parseInt(full, 16) || 0;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/**
 * Paint `sheet` into the rectangle W × H of the 2D context `g`.
 *
 *   c.ink      the pen
 *   c.soft     what is written faintly — a nought that holds a place
 *   c.accent   the carries, and the cell the next figure goes in
 *   c.done     the line under a finished answer
 */
export function drawSheet(g, W, H, sheet, c) {
  const ink = c.ink || "#2a2723";
  const soft = c.soft || rgba(ink, 0.45);
  const accent = c.accent || "#6fb7e8";
  const done = c.done || "#7cc47c";

  const cw = W / sheet.cols;
  const rh = H / sheet.rows;
  const x0 = sheet.gutter * cw;
  const colX = (col) => x0 + col * cw;
  const rowY = (row) => row * rh;
  const size = Math.round(Math.min(cw, rh) * 0.56);

  /* The bus stop, when the board is a division: a line over what is being
     divided and a line down the side of it. The vertical runs the whole way
     down, because everything under it is still part of the same division. */
  if (sheet.bracket) {
    g.strokeStyle = ink;
    g.lineWidth = Math.max(2, rh * 0.06);
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x0, H - rh * 0.15);
    g.lineTo(x0, rowY(sheet.bracket.row));
    g.lineTo(colX(sheet.bracket.to), rowY(sheet.bracket.row));
    g.stroke();
  }

  // the lines: under a thing taken away, under the numbers being added
  g.strokeStyle = ink;
  g.lineWidth = Math.max(1.5, rh * 0.05);
  g.lineCap = "round";
  g.beginPath();
  for (const r of sheet.rules || []) {
    const y = rowY(r.row + 1) - rh * 0.12;
    g.moveTo(colX(r.from) + cw * 0.12, y);
    g.lineTo(colX(r.to) + cw * 0.92, y);
  }
  g.stroke();

  /* Where the next figure goes, so the question and the place on the page are
     the same fact seen twice. */
  if (sheet.ask) {
    const y = rowY(sheet.ask.row);
    const h = rh * (sheet.ask.span || 1) - rh * 0.24;
    for (const col of sheet.ask.cols) {
      const x = colX(col);
      g.fillStyle = rgba(accent, 0.16);
      g.fillRect(x + cw * 0.1, y + rh * 0.12, cw * 0.8, h);
      g.save();
      g.strokeStyle = rgba(accent, 0.9);
      g.lineWidth = Math.max(2, rh * 0.05);
      g.setLineDash([rh * 0.12, rh * 0.1]);
      g.strokeRect(x + cw * 0.1, y + rh * 0.12, cw * 0.8, h);
      g.restore();
    }
  }

  /* The whole working is written in one monospaced hand, so a column of figures
     is a column and not a drift. The carried figures are the exception: smaller
     and in the accent, because they are a note to the writer about the next
     column and not part of either the sum or the answer. */
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const m of sheet.marks) {
    const carried = m.tone === "carry";
    /* A mark may stand across more than one row — the sign between two
       fractions, or the whole number beside one — and then it is centred over
       all of them rather than over the first. */
    const tall = m.span || 1;
    const wide = m.cols || 1;
    g.font = `600 ${carried ? Math.round(size * 0.62) : size}px "JetBrains Mono", monospace`;
    g.fillStyle = carried ? rgba(accent, 0.95) : m.tone === "soft" ? soft : ink;
    g.fillText(m.ch, colX(m.col) + (cw * wide) / 2, rowY(m.row) + rh * (carried ? 0.62 : tall / 2) + 1);
  }

  g.font = `600 ${size}px "JetBrains Mono", monospace`;

  // the point, in the gap between two columns
  g.fillStyle = ink;
  for (const p of sheet.points || []) {
    g.beginPath();
    g.arc(colX(p.col) + cw * 1.02, rowY(p.row) + rh * 0.78, Math.max(1.2, cw * 0.07), 0, Math.PI * 2);
    g.fill();
  }

  // the minus in front of what is being taken away
  g.fillStyle = rgba(ink, 0.75);
  for (const m of sheet.minus || []) {
    g.fillText("−", colX(m.col) - cw * 0.42, rowY(m.row) + rh / 2 + 1);
  }
  // and the sign of the sum, in its own column in front of it
  for (const s of sheet.signs || []) {
    g.fillText(s.ch, colX(s.col) + cw * 0.62, rowY(s.row) + rh / 2 + 1);
  }

  /* The remainder, said on the answer line, once there is an answer to say it
     on. Lighter than the answer itself: it is a note about the answer and not a
     third figure of it. */
  if (sheet.tail) {
    g.fillStyle = soft;
    g.font = `600 ${Math.round(size * 0.72)}px "JetBrains Mono", monospace`;
    g.textAlign = "left";
    g.fillText(sheet.tail, colX(sheet.width) + cw * 0.2, rowY(0) + rh / 2 + 1);
    g.textAlign = "center";
  }

  /* One line under the answer once it is whole, the way an answer is
     underlined — drawn only at the end, so it reads as "that is the answer"
     rather than as one more rule in the middle of the working. */
  if (sheet.underline) {
    g.strokeStyle = rgba(done, 0.95);
    g.lineWidth = Math.max(2, rh * 0.06);
    g.beginPath();
    const y = rowY(sheet.underline.row + 1) - rh * 0.14;
    g.moveTo(colX(sheet.underline.from) + cw * 0.08, y);
    g.lineTo(colX(sheet.underline.to) + cw * 0.92, y);
    g.stroke();
  }
}
