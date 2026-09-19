/* ============================================================================
   TWO SCALES — what a scale looks like
   ----------------------------------------------------------------------------
   A stand, a beam, two chains, two pans. The beam is always LEVEL, because
   every move the activity allows keeps the scale true — a tipped beam would
   be saying something false. What changes is what lies in the pans.

   The pans are ordinary elements, so a block can be dragged into one and the
   drop can be worked out from what is under the finger.
   ========================================================================== */

import { faceOf, isVar, say, sumOf } from "./model.js";

/* The beam, its pivot and the stand under it — plain boxes, so the pans can
   hang from the beam's ends wherever the page is wide or narrow. */
const STAND = `<div class="ts-beam" aria-hidden="true"><i class="ts-beam__bar"></i><i class="ts-beam__pivot"></i><i class="ts-beam__post"></i><i class="ts-beam__foot"></i></div>`;

/** One block, as it sits in a pan. A `mini` is only a picture of one — on the
    rule chip — so it carries no id: nothing may be dropped on it, and nothing
    should find it when the page asks what is under the finger. */
export const blockHtml = (b, { mini = false } = {}) =>
  `<button type="button" class="ts-block ts-block--${b.kind}${b.n < 0 ? " is-minus" : ""}${mini ? " is-mini" : ""}"` +
  `${mini ? "" : ` data-id="${b.id}"`} data-kind="${b.kind}"${mini ? " tabindex=\"-1\" aria-hidden=\"true\"" : ""}` +
  `${mini ? "" : ` data-tip="Tap to send it across — its sign changes"`}>${faceOf(b)}</button>`;

/** The whole scale: name, stand, two pans, and the equation written out. */
export function scaleHtml(sc, i, { name, rule }) {
  const pan = (which) =>
    `<div class="ts-pan" data-scale="${i}" data-pan="${which}" role="group" aria-label="${name}, ${which === "L" ? "left" : "right"} pan">` +
    `<div class="ts-pan__hook"></div><div class="ts-pan__dish">${sc[which].map((b) => blockHtml(b)).join("")}</div></div>`;
  /* the chip reads like the equation it is: y = x + 2, with the pluses in it */
  const chip = rule
    ? `<button type="button" class="ts-rule" data-rule="${i}" data-tip="Drag this onto the same letter on the other scale">` +
      `<b>${rule.kind}</b><span>=</span>` +
      rule.tiles.map((t, j) => `${j ? `<span class="ts-rule__op">${t.n < 0 ? "−" : "+"}</span>` : ""}` +
        blockHtml(j && t.n < 0 ? { ...t, n: -t.n } : t, { mini: true })).join("") +
      `</button>`
    : "";
  return `<section class="ts-scale" data-scale="${i}">` +
    `<header class="ts-scale__head"><span class="ts-scale__name">${name}</span>${chip}</header>` +
    `<div class="ts-frame">${STAND}<div class="ts-pans">${pan("L")}${pan("R")}</div></div>` +
    `<p class="ts-eq" aria-live="polite">${say(sc)}</p>` +
    `<div class="ts-acts" data-acts="${i}"></div>` +
    `</section>`;
}

/** What a pan is worth in words, for a screen reader and for the tests. */
export const panWords = (pan) => {
  const s = sumOf(pan);
  const bits = [];
  if (s.x) bits.push(`${s.x} x`);
  if (s.y) bits.push(`${s.y} y`);
  if (s.n) bits.push(String(s.n));
  return bits.join(" and ") || "nothing";
};

export { isVar };
