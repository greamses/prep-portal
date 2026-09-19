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
const CUBE_MAX = 30;        // more than this on a pan is not a thing to count
const BLOCK_H = 8.4;
const blockW = (n) => 8 + String(n).length * 2.6;

/* ── the things that stand on a pan ──────────────────────────────────────── */

function bagShape(x, y, letter) {
  /* A sack: gathered at the neck, tied with a band, sitting heavy at the
     bottom. The letter is written across the belly where there is room for it,
     and the same sack is drawn whatever it weighs — see the rule at the top. */
  const w = BAG_W;
  const h = BAG_H;
  const cx = x + w / 2;
  return (
    /* the body. `ab-bag` marks it so a check can measure the sack off the page
       and prove every one is the same size, whatever it holds. */
    `<path class="ab-bag" d="M${f(x + w * 0.31)} ${f(y + 3.4)}` +
    `C${f(x - 0.3)} ${f(y + 5.6)} ${f(x - 0.1)} ${f(y + h)} ${f(cx)} ${f(y + h)}` +
    `C${f(x + w + 0.1)} ${f(y + h)} ${f(x + w + 0.3)} ${f(y + 5.6)} ${f(x + w * 0.69)} ${f(y + 3.4)}Z" ` +
    `fill="${BAG}" stroke="${INK}" stroke-width="0.45" stroke-linejoin="round"/>` +
    /* the light down its left side, so it reads as round and not as a blob */
    `<path d="M${f(x + w * 0.34)} ${f(y + 4.2)}C${f(x + 1)} ${f(y + 6.2)} ${f(x + 1.1)} ${f(y + h - 1.6)} ${f(x + w * 0.42)} ${f(y + h - 0.9)}" ` +
    `fill="none" stroke="#fffdf8" stroke-width="0.8" stroke-linecap="round" opacity="0.85"/>` +
    /* the gathered neck above the tie */
    `<path d="M${f(x + w * 0.33)} ${f(y + 3.2)}l${f(w * 0.06)} -2.3h${f(w * 0.22)}l${f(w * 0.06)} 2.3z" ` +
    `fill="${BAG}" stroke="${INK}" stroke-width="0.4" stroke-linejoin="round"/>` +
    /* the tie */
    `<rect x="${f(x + w * 0.29)}" y="${f(y + 2.7)}" width="${f(w * 0.42)}" height="1.1" rx="0.55" fill="${GREY}"/>` +
    `<text x="${f(cx)}" y="${f(y + h - 2.6)}" text-anchor="middle" font-family="JetBrains Mono, monospace" ` +
    `font-size="4.2" font-weight="700" fill="${INK}">${letter}</text>`
  );
}

function cubeShape(x, y) {
  /* a 1: a cube with a lighter top face, so a row of them counts by eye */
  return (
    `<rect x="${f(x)}" y="${f(y)}" width="${CUBE}" height="${CUBE}" rx="0.6" fill="${WEIGHT}" stroke="${INK}" stroke-width="0.35"/>` +
    `<rect x="${f(x + 0.6)}" y="${f(y + 0.6)}" width="${f(CUBE - 1.2)}" height="1" rx="0.5" fill="#fffdf8" opacity="0.75"/>`
  );
}

function blockShape(x, y, n) {
  /* The classroom weight: a trapezoid, heavier at the foot, with a handle to
     lift it by and the number cast into its face. */
  const w = blockW(n);
  const h = BLOCK_H;
  return (
    `<path d="M${f(x + w * 0.36)} ${f(y + 2)}v-1.1a0.9 0.9 0 0 1 0.9-0.9h${f(w * 0.28)}a0.9 0.9 0 0 1 0.9 0.9v1.1" ` +
    `fill="none" stroke="${INK}" stroke-width="0.5" stroke-linejoin="round"/>` +
    `<path d="M${f(x + 1.6)} ${f(y + 2)}H${f(x + w - 1.6)}L${f(x + w)} ${f(y + h)}H${f(x)}Z" ` +
    `fill="${WEIGHT}" stroke="${INK}" stroke-width="0.45" stroke-linejoin="round"/>` +
    `<path d="M${f(x + 2)} ${f(y + 2.7)}H${f(x + w - 2)}" stroke="#fffdf8" stroke-width="0.7" stroke-linecap="round" opacity="0.8"/>` +
    `<text x="${f(x + w / 2)}" y="${f(y + h - 1.8)}" text-anchor="middle" font-family="JetBrains Mono, monospace" ` +
    `font-size="3.8" font-weight="700" fill="${INK}">${n}</text>`
  );
}

/** What one side of an equation puts on a pan: `bags` of the unknown, and `n` known. */
function items(side, { letter, cubes }) {
  const out = [];
  for (let i = 0; i < side.bags; i++) out.push({ kind: "bag", v: 1, w: BAG_W, h: BAG_H, draw: (x, y) => bagShape(x, y, letter) });
  if (side.n > 0) {
    if (cubes) for (let i = 0; i < side.n; i++) out.push({ kind: "cube", v: 1, w: CUBE, h: CUBE, draw: (x, y) => cubeShape(x, y) });
    else out.push({ kind: "block", v: side.n, w: blockW(side.n), h: BLOCK_H, draw: (x, y) => blockShape(x, y, side.n) });
  }
  return out;
}

/* Each thing on a pan is its own group, drawn at its own origin and moved into
   place — so on screen it can be picked up, put on the other pan or taken off
   (utils/components/workbook/balance.js), and laid out again the same way. */
const piece = (it, x, y) =>
  `<g class="ab-piece" data-kind="${it.kind}" data-v="${it.v}" data-w="${it.w}" data-h="${it.h}" transform="translate(${f(x)} ${f(y)})">` +
  it.draw(0, 0) + `</g>`;

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
      body += piece(it, x, y - it.h);
      x += it.w + GAP;
    }
    y -= row.h + GAP;
  }
  return { body, top: y };
}

const contentHeight = (list) => rows(list).reduce((s, r) => s + r.h + GAP, 0);

/**
 * The scale itself, with its pans at `panY`. Always level.
 *
 * It is drawn as a real object rather than a diagram of one — a plinth with a
 * shadow under it, a tapered column, a beam thick enough to look like it could
 * carry a pan, and a tray with a rim so the things on it read as standing IN
 * something. The one piece of instrumentation is at the pivot: a needle
 * between two marks, showing the beam is centred, because "level" is the whole
 * claim the picture is making.
 */
function frame(panY) {
  const beamY = panY + 9;
  const baseY = beamY + 17;
  const HALF = PAN_W / 2;

  /* a tray: the floor, a rim turned up at each end, and the stem to the beam */
  const pan = (cx) =>
    `<rect x="${f(cx - 1.4)}" y="${f(panY + 2)}" width="2.8" height="${f(beamY - panY - 1.4)}" rx="1.4" fill="${METAL}" stroke="${GREY}" stroke-width="0.35"/>` +
    `<path d="M${f(cx - HALF)} ${f(panY - 2.2)}v1.4a1.1 1.1 0 0 0 .5.9l2.4 1.5h${f(PAN_W - 5.8)}l2.4-1.5a1.1 1.1 0 0 0 .5-.9v-1.4h1.6v1.4a2.6 2.6 0 0 1-1.2 2.2l-2.6 1.6H${f(cx - HALF + 3.2)}l-2.6-1.6a2.6 2.6 0 0 1-1.2-2.2v-1.4z" fill="${GREY}" opacity="0.5"/>` +
    `<path d="M${f(cx - HALF + 0.8)} ${f(panY)}H${f(cx + HALF - 0.8)}l-2.6 2.3H${f(cx - HALF + 3.4)}Z" fill="${METAL}" stroke="${GREY}" stroke-width="0.4" stroke-linejoin="round"/>` +
    /* the shadow the tray casts on itself, so it reads as a dish and not a line */
    `<rect x="${f(cx - HALF + 1.2)}" y="${f(panY)}" width="${f(PAN_W - 2.4)}" height="0.7" fill="${INK}" opacity="0.12"/>`;

  const bossY = beamY - 0.2;
  return {
    body:
      /* the plinth first, so everything stands on it */
      `<ellipse cx="${f(W / 2)}" cy="${f(baseY + 4.6)}" rx="22" ry="1.5" fill="${INK}" opacity="0.1"/>` +
      `<path d="M${f(W / 2 - 21)} ${f(baseY + 4)}a1.4 1.4 0 0 1-1.3-1.8l1-3.1A2 2 0 0 1 ${f(W / 2 - 19.4)} ${f(baseY - 2.4)}h${38.8}a2 2 0 0 1 1.9 1.4l1 3.1a1.4 1.4 0 0 1-1.3 1.9z" fill="${METAL}" stroke="${GREY}" stroke-width="0.4" stroke-linejoin="round"/>` +
      /* the column, a little wider at the foot than at the pivot */
      `<path d="M${f(W / 2 - 2.1)} ${f(baseY - 2.4)}l0.7-${f(baseY - beamY - 2.4)}h${2.8}l0.7 ${f(baseY - beamY - 2.4)}z" fill="${METAL}" stroke="${GREY}" stroke-width="0.4" stroke-linejoin="round"/>` +
      /* each pan in its own group: a beam that tips on screen lifts one and
         lowers the other, and what stands on a pan goes with it */
      `<g class="ab-pan" data-side="L">${pan(PAN_L)}</g>` + `<g class="ab-pan" data-side="R">${pan(PAN_R)}</g>` +
      `<g class="ab-beam">` +
      /* the beam, with a knob where each stem hangs from it */
      `<rect x="${f(PAN_L - 4)}" y="${f(beamY - 1.7)}" width="${f(PAN_R - PAN_L + 8)}" height="3.4" rx="1.7" fill="${METAL}" stroke="${GREY}" stroke-width="0.45"/>` +
      `<circle cx="${f(PAN_L)}" cy="${f(beamY)}" r="1.5" fill="${GREY}" opacity="0.55"/>` +
      `<circle cx="${f(PAN_R)}" cy="${f(beamY)}" r="1.5" fill="${GREY}" opacity="0.55"/>` +
      /* the gauge: two marks, and the needle standing exactly between them */
      `<rect x="${f(W / 2 - 4.4)}" y="${f(beamY - 8.6)}" width="1" height="2.6" rx="0.5" fill="${GREY}"/>` +
      `<rect x="${f(W / 2 + 3.4)}" y="${f(beamY - 8.6)}" width="1" height="2.6" rx="0.5" fill="${GREY}"/>` +
      `<path d="M${f(W / 2)} ${f(beamY - 9.4)}l1.5 7.4h-3z" fill="${INK}"/>` +
      `</g>` +
      `<circle cx="${f(W / 2)}" cy="${f(bossY)}" r="2.6" fill="${METAL}" stroke="${GREY}" stroke-width="0.45"/>` +
      `<circle cx="${f(W / 2)}" cy="${f(bossY)}" r="1" fill="${INK}"/>`,
    height: baseY + 6.5,
    pivot: [W / 2, bossY],
    base: baseY,
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
  /* Cubes are for COUNTING, so they stop being cubes once there are more than
     a child would count: past that the pan takes a labelled weight however the
     caller asked, and the drawing says which it did in data-cubes. Without
     this a big number piles up rows until the scale is taller than the page. */
  const countable = cubes && left.n <= CUBE_MAX && right.n <= CUBE_MAX;
  const L = items(left, { letter, cubes: countable });
  const R = items(right, { letter, cubes: countable });
  const room = Math.max(contentHeight(L), contentHeight(R), BAG_H);
  const panY = 3 + room;
  const a = panContents(L, PAN_L, panY - 0.3);
  const b = panContents(R, PAN_R, panY - 0.3);
  const fr = frame(panY);
  /* the equation the picture says, kept on the drawing so a check can prove
     that every scale printed is one that really balances — and, for the
     screen, where the pans are, so pieces can be laid out on them again */
  const data = ` data-left="${left.bags},${left.n}" data-right="${right.bags},${right.n}" data-cubes="${countable ? 1 : 0}"` +
    ` data-balance="${PAN_L},${PAN_R},${f(panY - 0.3)},${FLOW},${GAP}" data-pivot="${f(fr.pivot[0])},${f(fr.pivot[1])}" data-base="${f(fr.base)}"`;
  const load = (side, body) => `<g class="ab-load" data-side="${side}">${body}</g>`;
  return svg(fr.height, fr.body + load("L", a.body) + load("R", b.body), label, data);
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
