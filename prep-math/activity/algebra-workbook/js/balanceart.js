/* ============================================================================
   Algebra Workbook — the BALANCE SCALE (chapter 3)
   ----------------------------------------------------------------------------
   An equation is a balance that is level. Whatever is on the left pan weighs
   exactly what is on the right, and the one move that keeps it level is to do
   the SAME thing to both pans. That sentence is the whole of solving a linear
   equation, and a child who has seen it on a scale does not have to take it on
   trust when it turns up as "subtract 4 from both sides".

   TWO RULES, and the drawing keeps both of them:

   THE BEAM IS ALWAYS LEVEL. A balance drawn tipped is not an equation, it is
   an inequality, and this chapter is about equations. There is no angle
   parameter here on purpose — no question can draw a scale that is not level.

   A BAG IS NOT DRAWN TO ITS WEIGHT. Every bag holding the unknown is the same
   sack, the same size, whatever it weighs — the same rule as the bar model's
   unknown box, for the same reason: a bag drawn bigger for a bigger x is an
   answer that can be read off the page.

   Known weights come in two ways, and the chapter moves from one to the other:

     cubes     every 1 drawn as its own small cube, so a child can cross the
               same number off both pans and SEE the scale stay level
     blocks    one labelled weight per number, once the counting is not the
               point any more

   Everything is measured in millimetres at the paper's own size, like barart.js.
   ========================================================================== */

const INK = "#2a2723";
const BAG = "#fff3a8";      // butter: the unknown, the same as the bar model's box
const WEIGHT = "#bfe3ff";   // sky: a weight we were told
const METAL = "#d8d2c6";    // the scale itself — quiet, so what is ON it reads first
const GREY = "#8a837a";

const f = (n) => (+n).toFixed(2);

export const W = 150;       // mm, the paper a scale takes
const PAN_W = 60;           // mm, each pan
const PAN_L = 38;           // centre of the left pan
const PAN_R = 112;          // centre of the right pan
const FLOW = 56;            // mm of a pan things may stand on
const GAP = 0.9;

const BAG_W = 10;
const BAG_H = 11;
const CUBE = 4.2;
const BLOCK_H = 8.4;
const blockW = (n) => 8 + String(n).length * 2.6;

/* ── the things that stand on a pan ──────────────────────────────────────── */

function bagShape(x, y, letter) {
  /* a sack with a tied neck: the top pinched, the body round */
  const w = BAG_W;
  const h = BAG_H;
  return (
    `<path d="M${f(x + w * 0.34)} ${f(y + 2.6)}` +
    `C${f(x + 0.2)} ${f(y + 4.4)} ${f(x - 0.4)} ${f(y + h)} ${f(x + w / 2)} ${f(y + h)}` +
    `C${f(x + w + 0.4)} ${f(y + h)} ${f(x + w - 0.2)} ${f(y + 4.4)} ${f(x + w * 0.66)} ${f(y + 2.6)}Z" ` +
    `fill="${BAG}" stroke="${INK}" stroke-width="0.45"/>` +
    `<path d="M${f(x + w * 0.3)} ${f(y + 0.6)}L${f(x + w * 0.5)} ${f(y + 2.7)}L${f(x + w * 0.7)} ${f(y + 0.6)}" ` +
    `fill="none" stroke="${INK}" stroke-width="0.45" stroke-linejoin="round"/>` +
    `<text x="${f(x + w / 2)}" y="${f(y + h - 2.3)}" text-anchor="middle" font-family="JetBrains Mono, monospace" ` +
    `font-size="4.2" font-weight="700" fill="${INK}">${letter}</text>`
  );
}

function cubeShape(x, y) {
  return `<rect x="${f(x)}" y="${f(y)}" width="${CUBE}" height="${CUBE}" rx="0.5" fill="${WEIGHT}" stroke="${INK}" stroke-width="0.35"/>`;
}

function blockShape(x, y, n) {
  /* the classroom weight: a trapezoid with a little handle, the number on it */
  const w = blockW(n);
  const h = BLOCK_H;
  return (
    `<path d="M${f(x + w * 0.38)} ${f(y + 1.8)}v${f(-1.2)}h${f(w * 0.24)}v1.2" fill="none" stroke="${INK}" stroke-width="0.45"/>` +
    `<path d="M${f(x + 1.4)} ${f(y + 1.8)}H${f(x + w - 1.4)}L${f(x + w)} ${f(y + h)}H${f(x)}Z" ` +
    `fill="${WEIGHT}" stroke="${INK}" stroke-width="0.45" stroke-linejoin="round"/>` +
    `<text x="${f(x + w / 2)}" y="${f(y + h - 1.9)}" text-anchor="middle" font-family="JetBrains Mono, monospace" ` +
    `font-size="3.8" font-weight="700" fill="${INK}">${n}</text>`
  );
}

/** What one side of an equation puts on a pan: `bags` of the unknown, and `n` known. */
function items(side, { letter, cubes }) {
  const out = [];
  for (let i = 0; i < side.bags; i++) out.push({ bag: true, w: BAG_W, h: BAG_H, draw: (x, y) => bagShape(x, y, letter) });
  if (side.n > 0) {
    if (cubes) for (let i = 0; i < side.n; i++) out.push({ w: CUBE, h: CUBE, draw: (x, y) => cubeShape(x, y) });
    else out.push({ w: blockW(side.n), h: BLOCK_H, draw: (x, y) => blockShape(x, y, side.n) });
  }
  return out;
}

/**
 * Lay a pan's things out in rows from the pan up, bags first and weights after
 * them in the SAME row while there is room — because that is where they are on
 * a real pan, side by side. Only when the row is full does the next thing go
 * above. Returns the rows, bottom first.
 */
function rows(list) {
  const out = [];
  let row = null;
  for (const it of list) {
    if (!row || row.w + GAP + it.w > FLOW) {
      row = { items: [], w: -GAP, h: 0 };
      out.push(row);
    }
    row.w += GAP + it.w;
    row.h = Math.max(row.h, it.h);
    row.items.push(it);
  }
  return out;
}

function panContents(list, cx, floor) {
  let y = floor;
  let body = "";
  for (const row of rows(list)) {
    let x = cx - row.w / 2;
    for (const it of row.items) {
      body += it.draw(x, y - it.h);
      x += it.w + GAP;
    }
    y -= row.h + GAP;
  }
  return { body, top: y };
}

const contentHeight = (list) => rows(list).reduce((s, r) => s + r.h + GAP, 0);

/** The scale itself, with its pans at `panY`. Always level. */
function frame(panY) {
  const beamY = panY + 7;
  const baseY = beamY + 14;
  const pan = (cx) =>
    `<rect x="${f(cx - 1.1)}" y="${f(panY + 1.6)}" width="2.2" height="${f(beamY - panY - 1.6)}" fill="${METAL}" stroke="${GREY}" stroke-width="0.3"/>` +
    `<path d="M${f(cx - PAN_W / 2)} ${f(panY)}H${f(cx + PAN_W / 2)}l-3 2.4H${f(cx - PAN_W / 2 + 3)}Z" fill="${METAL}" stroke="${GREY}" stroke-width="0.4" stroke-linejoin="round"/>`;
  return {
    body:
      pan(PAN_L) + pan(PAN_R) +
      `<rect x="${f(PAN_L - 3)}" y="${f(beamY - 1.3)}" width="${f(PAN_R - PAN_L + 6)}" height="2.6" rx="1.3" fill="${METAL}" stroke="${GREY}" stroke-width="0.4"/>` +
      `<rect x="${f(W / 2 - 1.5)}" y="${f(beamY)}" width="3" height="${f(baseY - beamY)}" fill="${METAL}" stroke="${GREY}" stroke-width="0.35"/>` +
      `<path d="M${f(W / 2 - 17)} ${f(baseY + 3)}L${f(W / 2 - 11)} ${f(baseY)}H${f(W / 2 + 11)}L${f(W / 2 + 17)} ${f(baseY + 3)}Z" fill="${METAL}" stroke="${GREY}" stroke-width="0.4" stroke-linejoin="round"/>` +
      /* the pointer at the pivot, straight up: this scale is level, and says so */
      `<path d="M${f(W / 2)} ${f(beamY - 6.2)}l1.3 4.4h-2.6z" fill="${INK}"/>` +
      `<circle cx="${f(W / 2)}" cy="${f(beamY)}" r="2" fill="${INK}"/>`,
    height: baseY + 3.5,
  };
}

const svg = (h, body, label, data = "") =>
  `<svg class="ab-bal" viewBox="0 0 ${W} ${f(h)}" width="${W}mm" height="${f(h)}mm" role="img" aria-label="${label}"${data}>${body}</svg>`;

/**
 * A level balance for the equation  left.bags·x + left.n = right.bags·x + right.n.
 *
 *   left, right   { bags, n }
 *   letter        what is written on each bag
 *   cubes         draw each 1 as a cube (the counting stage) rather than a block
 */
export function balanceSvg(left, right, { letter = "x", cubes = false, label = "A balance scale" } = {}) {
  const L = items(left, { letter, cubes });
  const R = items(right, { letter, cubes });
  const room = Math.max(contentHeight(L), contentHeight(R), BAG_H);
  const panY = 3 + room;
  const a = panContents(L, PAN_L, panY - 0.3);
  const b = panContents(R, PAN_R, panY - 0.3);
  const fr = frame(panY);
  /* the equation the picture says, kept on the drawing so a check can prove
     that every scale printed is one that really balances */
  const data = ` data-left="${left.bags},${left.n}" data-right="${right.bags},${right.n}" data-cubes="${cubes ? 1 : 0}"`;
  return svg(fr.height, fr.body + a.body + b.body, label, data);
}

/** An empty level balance with room on both pans to draw what goes on them. */
export function blankBalanceSvg({ room = 26 } = {}) {
  const panY = 3 + room;
  const fr = frame(panY);
  const guide = (cx) =>
    `<rect x="${f(cx - FLOW / 2)}" y="3" width="${FLOW}" height="${f(room - 1)}" rx="1.5" fill="none" ` +
    `stroke="${GREY}" stroke-width="0.3" stroke-dasharray="1 1.4"/>`;
  return svg(fr.height, fr.body + guide(PAN_L) + guide(PAN_R), "An empty balance to draw on");
}

/** "3x + 4 = x + 12", written the way the paper writes it. */
export function sideText(side, letter = "x") {
  const parts = [];
  if (side.bags) parts.push(side.bags === 1 ? letter : `${side.bags}${letter}`);
  if (side.n || !side.bags) parts.push(String(side.n));
  return parts.join(" + ");
}
export const balanceText = (left, right, letter = "x") => `${sideText(left, letter)} = ${sideText(right, letter)}`;
