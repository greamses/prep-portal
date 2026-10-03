/* ============================================================================
   Vedic Maths Workbook — the small pieces every chapter writes with
   ----------------------------------------------------------------------------
   The paper's own marks (answer boxes, ticks, the worked-example frame) are
   the shared wb- ones from /utils/components/workbook.css. A trick is shown as
   a STRIP: the parts it makes, each in its own cell, laid side by side the way
   they are joined — "3 × 4 | 25" — so a child sees the answer being assembled
   rather than computed. Strips are kept out of MathJax's way (wb-nomath) so
   each part stays in its cell.
   ========================================================================== */

import { levelOf } from "./levels.js";

export const box = () => `<span class="wb-answer"></span>`;
export const ask = (html) => `<p class="wb-ask">${html}</p>`;
export const big = (html) => `<p class="wb-ask vm-q">${html}</p>`;
export const tick = (...opts) =>
  `<span class="wb-tick">${opts.map((t) => `<span class="wb-tick__one"><span class="wb-box"></span>${t}</span>`).join("")}</span>`;
export const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One done for you</p>${body}</div>`;
export const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;

export const tier = (o) => levelOf(o).id;

/** One step of a trick: what to do, and where its answer goes. */
export const step = (what, slot = box()) => `<span class="vm-step"><span class="vm-step__what">${what}</span> ${slot}</span>`;
/** The steps of one question, one under the other. */
export const steps = (...list) => `<div class="vm-steps">${list.join("")}</div>`;

/**
 * The parts of an answer side by side, joined by bars: [["7", "left"], …].
 * In a worked example the parts are numbers; in a question they are boxes.
 */
export const strip = (...parts) =>
  `<span class="vm-strip wb-nomath">${parts.map((p) => `<span class="vm-strip__part">${p}</span>`).join('<span class="vm-strip__bar">|</span>')}</span>`;

/** A whole number written out with its digits padded to `n` places: 6 → "06". */
export const pad = (v, n) => String(v).padStart(n, "0");

/** Repeated digit sum, 1–9 (the digital root). */
export const root = (n) => (n === 0 ? 0 : 1 + ((n - 1) % 9));
export const digits = (n) => String(n).split("").map(Number);
