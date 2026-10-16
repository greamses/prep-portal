/* ============================================================================
   The bits every PrepBot film is measured in
   ----------------------------------------------------------------------------
   A film's stage is measured in HUNDREDTHS OF ITS OWN WIDTH, so that a lesson
   laid out once looks the same on a phone and on a television. These are the
   handful of things that follow from that, and they live here rather than in
   any one film because two films that disagree about where the bottom of the
   screen is will each be right on their own and wrong together.
   ========================================================================== */

import { tile } from "/prep-math/activity/vedic-maths-workbook/js/explain.js";

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* a hundredth of the screen's HEIGHT, in hundredths of its width (16 : 9) */
export const VH = 0.5625;

/**
 * `down` turns a distance measured ACROSS the screen into the same distance
 * measured DOWN it — and the result is a percentage of the HEIGHT, so it runs
 * 0 to 100 over an argument of 0 to 56.25. Pass it 58 and the tile is below
 * the screen. Two whole lines of the ratio film were laid out off the bottom
 * that way before anyone looked.
 */
export const down = (w) => w / VH;
export const BOTTOM = 53;                 // the largest argument that still shows

export const INK = "#2a2723";

/** A number or a line of working, standing on the screen by itself. */
export const num = (stage, id, text, x, y, c, sizeU = 3.3) =>
  tile(stage, id, String(text), x, y, { c }).firstChild.style.setProperty("font-size", `calc(var(--u) * ${sizeU})`);
