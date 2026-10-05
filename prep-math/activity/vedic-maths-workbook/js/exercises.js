/* ============================================================================
   Vedic Maths Workbook — the ONE registry
   ----------------------------------------------------------------------------
   The engine, the builder and the answer key read this file and nothing else.

     ex-add.js      chapter 1, adding and taking away — complements (all from
                    9 and the last from 10), adding or taking away a number
                    just under a round one, and taking away with no
                    regrouping: same difference (a slider) and easy regroupers
     ex-quick.js    chapter 2, multiplying in your head — × 11, × 5 / 25 / 50,
                    same front with units making 10, vertically and crosswise,
                    and multiplying near a base
     ex-squares.js  chapter 3, squares — every squaring trick together: ending
                    in 5, ending in 1, starting with 1, same digits, near 50,
                    near 100
     ex-roots.js    chapter 4, square roots and cube roots of perfect squares
                    and cubes, read off in two looks
     ex-check.js    chapter 5, dividing by 9 with running totals, digit sums,
                    and casting out nines to check a product
     ex-trach.js    chapter 6, the Trachtenberg system — × 12, 6, 7, 5, 9
                    and 8, one digit at a time from the right
     ex-tables.js   chapter 7, times table secrets — the pattern in each
                    table that writes it out; the nines first

   THE ORDER IS THE BOOK: complements first, because every "near a base"
   trick after them starts by finding one; each trick met first where nothing
   carries, so the pattern itself can be seen; checking last, because by then
   there are fast answers worth checking. A new chapter is new group entries
   and a new ex-file, and nothing else.

   On screen the whole paper is a SPEED DRILL — see LIVE in subject.js.
   ========================================================================== */

import { CM_GROUPS, CM_EXERCISES } from "./ex-add.js";
import { QK_GROUPS, QK_EXERCISES } from "./ex-quick.js";
import { SQ_GROUPS, SQ_EXERCISES } from "./ex-squares.js";
import { RT_GROUPS, RT_EXERCISES } from "./ex-roots.js";
import { CK_GROUPS, CK_EXERCISES } from "./ex-check.js";
import { TR_GROUPS, TR_EXERCISES } from "./ex-trach.js";
import { TT_GROUPS, TT_EXERCISES } from "./ex-tables.js";
import { SAYS } from "./ex-check.js";
import { isDrill } from "./levels.js";
import { want, rightValues } from "/utils/components/workbook/want.js";
import { tick } from "./common.js";

export { LEVELS, HELP, MODES, levelOf, helpOf, modeOf, isDrill } from "./levels.js";

export const GROUPS = [...CM_GROUPS, ...QK_GROUPS, ...SQ_GROUPS, ...RT_GROUPS, ...CK_GROUPS, ...TR_GROUPS, ...TT_GROUPS];
const SKILL = [...CM_EXERCISES, ...QK_EXERCISES, ...SQ_EXERCISES, ...RT_EXERCISES, ...CK_EXERCISES, ...TR_EXERCISES, ...TT_EXERCISES];

/* ═══ the DRILL form of every exercise ══════════════════════════════════════
   In Drills mode an exercise is its question and one box for the whole
   answer — no steps, no digit boxes, no example. The question is the one the
   skill paper prints in large type; the answer is the trick's last step.
   The few that are not like that say so here. */
const DRILL = {
  "vm-nine": (it) => ({ q: `${it.B} − ${it.n}`, a: [it.B - it.n] }),
  "vm-root": (it) => ({ q: `the digit root of ${it.n}`, a: null }),
  "vm-div9": (it) => ({ q: `${it.n} ÷ 9`, a: [Math.floor(it.n / 9), it.n % 9], rem: true }),
  "vm-check9": (it) => ({ q: `${it.a} × ${it.b} = ${it.shown} ?`, tick: it.kind }),
  /* the whole-table section drills as one sum out of the table */
  "vm-tt9-all": (it) => ({ q: `9 × ${it.n}`, a: [9 * it.n] }),
};
const BOX = '<span class="wb-answer vm-whole"></span>';

function drillOf(ex, item, o) {
  if (DRILL[ex.id]) return DRILL[ex.id](item);
  if (item.product != null && /^vm-tr/.test(ex.id)) return { q: `${item.n} × ${item.m}`, a: [item.product] };
  const html = ex.render(item, o);
  return { q: (html.match(/class="wb-ask vm-q">(.*?)<\/p>/) || [])[1] || ex.heading, a: null };
}

const asDrill = (ex) => ({
  ...ex,
  cols: (o) => (isDrill(o) ? 2 : ex.cols),
  render(item, o) {
    if (!isDrill(o)) return ex.render(item, o);
    const d = drillOf(ex, item, o);
    if (d.tick != null) return `<p class="wb-ask vm-q vm-drill">${d.q}</p><p class="wb-ask">${tick(...SAYS)}</p>`;
    return `<p class="wb-ask vm-q vm-drill">${d.q} = ${BOX}${d.rem ? ` r ${BOX}` : ""}</p>`;
  },
  key(item, o) {
    const full = ex.key(item, o);
    if (!isDrill(o)) return full;
    const d = drillOf(ex, item, o);
    if (d.tick != null) return [full[full.length - 1]];
    if (d.a) return d.a.map((v) => want.num(v));
    return [want.num(Number(rightValues(full[full.length - 1])[0]))];
  },
});

export const EXERCISES = SKILL.map(asDrill);

/** Which chapter an exercise belongs to. */
const CHAPTER = new Map([
  ...CM_GROUPS.map((g) => [g.id, 1]),
  ...QK_GROUPS.map((g) => [g.id, 2]),
  ...SQ_GROUPS.map((g) => [g.id, 3]),
  ...RT_GROUPS.map((g) => [g.id, 4]),
  ...CK_GROUPS.map((g) => [g.id, 5]),
  ...TR_GROUPS.map((g) => [g.id, 6]),
  ...TT_GROUPS.map((g) => [g.id, 7]),
]);
export const chapterOf = (ex) => CHAPTER.get(ex.group) || 1;

export function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

/** Why an exercise cannot run under these settings, or null. */
export function unavailable(ex, o) {
  if (ex.minLevel === "middle" && (o.level || "gentle") === "gentle") return "needs Middle or Stretch";
  return null;
}

export const GROUP_IDS = GROUPS.map((g) => g.id);
