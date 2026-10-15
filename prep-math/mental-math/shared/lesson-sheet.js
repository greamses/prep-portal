/* ============================================================================
   TAKING PREPBOT'S EXPLANATION AWAY WITH YOU
   ----------------------------------------------------------------------------
   Every explanation PrepBot gives on its TV can be downloaded as a sheet: the
   title, and every step of the lesson written out in order, on the site's
   paper. It saves as a PNG, so it opens on anything, prints without a reader
   and can be stuck on a wall.

   IT IS DRAWN, NOT SCREENSHOTTED. Turning the TV's own stage into an image
   would mean rasterising live HTML — which needs a library, gets the fonts
   wrong, and would hand back one frame of a film that has fourteen. What a
   child actually wants afterwards is what was SAID, in order, which is this.

   The words are the same strings the voice says, so a sheet and a listen
   agree. (They are the written forms — the maths is left as maths here, since
   this one is read with the eyes; utils/speech-maths.js is only for the ear.)
   ========================================================================== */

const PAPER = "#fffdf8";
const INK = "#2a2723";
const QUIET = "#6b655c";
const RULE = "rgba(42, 39, 35, 0.22)";

const W = 1000;
const PAD = 64;
const TITLE_FONT = '800 40px Unbounded, system-ui, sans-serif';
const STEP_FONT = '400 22px "JetBrains Mono", ui-monospace, monospace';
const NUM_FONT = '800 22px "JetBrains Mono", ui-monospace, monospace';
const FOOT_FONT = '400 17px "JetBrains Mono", ui-monospace, monospace';
const LINE = 34;

/** Break a line of words to a width, the way a paragraph wraps. */
function wrap(ctx, text, width) {
  const out = [];
  let line = "";
  for (const word of String(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= width || !line) { line = next; continue; }
    out.push(line);
    line = word;
  }
  if (line) out.push(line);
  return out;
}

/** A filename nobody has to rename: prepbot-the-box-method.png */
const slug = (s) => String(s || "lesson").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "lesson";

/**
 * Draw the sheet.
 *
 *   title   what the lesson is called
 *   steps   [{ say }] — the lines, in the order they were said
 * → the canvas
 */
export function drawSheet({ title = "PrepBot explains", steps = [] } = {}) {
  const lines = steps.map((s) => String(s?.say ?? s ?? "")).filter(Boolean);

  /* measure first: the sheet is as long as the lesson, not a fixed page */
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = TITLE_FONT;
  const titleLines = wrap(probe, title, W - PAD * 2);
  probe.font = STEP_FONT;
  const bodyWidth = W - PAD * 2 - 54;
  const wrapped = lines.map((t) => wrap(probe, t, bodyWidth));

  const headH = 44 + titleLines.length * 50 + 34;
  const bodyH = wrapped.reduce((h, w) => h + w.length * LINE + 26, 0);
  const H = Math.max(420, headH + bodyH + 96);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  /* the torn top edge the rest of the site's paper has */
  ctx.fillStyle = "#f1ece0";
  const tooth = 26;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x < W + tooth; x += tooth) {
    ctx.lineTo(x + tooth / 2, 13);
    ctx.lineTo(x + tooth, 0);
  }
  ctx.lineTo(W, 0);
  ctx.closePath();
  ctx.fill();

  let y = 44 + 34;
  ctx.fillStyle = QUIET;
  ctx.font = FOOT_FONT;
  ctx.fillText("PREPBOT EXPLAINS", PAD, y - 34);

  ctx.fillStyle = INK;
  ctx.font = TITLE_FONT;
  for (const t of titleLines) { ctx.fillText(t, PAD, y + 8); y += 50; }

  y += 18;
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 2;
  ctx.setLineDash([9, 7]);
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  ctx.setLineDash([]);
  y += 34;

  wrapped.forEach((block, i) => {
    ctx.fillStyle = "#2f6ea8";
    ctx.font = NUM_FONT;
    ctx.fillText(String(i + 1).padStart(2, "0"), PAD, y);
    ctx.fillStyle = INK;
    ctx.font = STEP_FONT;
    for (const l of block) { ctx.fillText(l, PAD + 54, y); y += LINE; }
    y += 26;
  });

  ctx.fillStyle = QUIET;
  ctx.font = FOOT_FONT;
  ctx.fillText("Prep Portal · prepportal.com.ng", PAD, H - 38);

  return canvas;
}

/** Draw it and hand it to the browser to save. */
export function downloadSheet({ title, steps } = {}) {
  const canvas = drawSheet({ title, steps });
  const give = (href, revoke) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = `prepbot-${slug(title)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (revoke) setTimeout(() => URL.revokeObjectURL(href), 10000);
  };
  /* a blob where there is one (it is a tenth the size in memory of a data
     URL), and the data URL where toBlob is missing */
  if (canvas.toBlob) canvas.toBlob((blob) => (blob ? give(URL.createObjectURL(blob), true) : give(canvas.toDataURL("image/png"))), "image/png");
  else give(canvas.toDataURL("image/png"));
  return canvas;
}
