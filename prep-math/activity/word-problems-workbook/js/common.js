/* ============================================================================
   Competition Word Problems — what every chapter is written with
   ----------------------------------------------------------------------------
   A section is a BANK of story templates of one kind. Each template makes a
   problem from its answer, so the numbers always come out exactly:

       { text, ans: [[label, value], …], how }

   value is a number (marked as a number), a pair [n, d] (a fraction: any
   equal fraction is right), or a string (marked as written). `how` is the
   line of working printed in the answer key.

   Under every problem there is room to work. For the chapters where a
   picture is the method — ages, mixtures, ratios — that room is the bar
   model board on screen (utils/components/workbook/barmodel.js).
   ========================================================================== */

import { want } from "/utils/components/workbook/want.js";
import { blankModelSvg } from "/prep-math/activity/maths-workbook/js/modelart.js";
import { levelOf } from "./levels.js";

export const box = () => `<span class="wb-answer"></span>`;
export const ask = (html) => `<p class="wb-ask">${html}</p>`;
export const worked = (body) => `<div class="wb-worked"><p class="wb-worked__tag">One worked in full</p>${body}</div>`;
export const say = (html) => `<p class="wb-ask wb-worked__say">${html}</p>`;
export const tier = (o) => levelOf(o).id;

export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a, b) => (a * b) / gcd(a, b);
export const naira = (n) => `₦${n.toLocaleString("en-NG")}`;
export const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many);
/** A ratio in its lowest terms. */
export const low = (a, b) => { const g = gcd(a, b) || 1; return [a / g, b / g]; };
/** One problem. */
export const P = (text, ans, how) => ({ text, ans, how });

const NAMES = ["Ada", "Tunde", "Musa", "Chika", "Bola", "Ngozi", "Emeka", "Zainab", "Kemi", "Ife", "Sani", "Amaka", "Uche", "Halima"];
export function names(r, n) {
  const out = [];
  while (out.length < n) { const x = r.pick(NAMES); if (!out.includes(x)) out.push(x); }
  return out;
}

const wantOf = (v) => (Array.isArray(v) ? want.frac(v[0], v[1]) : typeof v === "string" ? want.text(v) : want.num(v));
/** As the answer key prints it: a fraction in its lowest terms, a minus sign that is one. */
const sayOf = (v) => {
  if (!Array.isArray(v)) return typeof v === "number" && v < 0 ? `−${-v}` : String(v);
  const [n, d] = low(v[0], v[1]);
  return d === 1 ? String(n) : `${n}/${d}`;
};
const sound = (p, signed) => !!p && p.ans.every(([, v]) => (Array.isArray(v) ? v[1] > 0 && Number.isInteger(v[0]) && Number.isInteger(v[1]) && v[0] >= 0
  : typeof v === "string" ? v.length > 0 : Number.isFinite(v) && (signed || v > 0) && Math.abs(v * 100 - Math.round(v * 100)) < 1e-6));

/**
 * A section: a bank of templates of one kind of problem.
 *   templates   [(r, tier) => P(...) | null]   null = "try again"
 *   board       give the working room the bar model board
 *   signed      answers may be zero or negative (the remainder theorem)
 */
export function bank(id, group, { label, blurb, heading, instruction, example, solution, count = 3, board = false, signed = false }, templates) {
  return {
    id, group, label, blurb, heading,
    instruction: () => instruction,
    cols: 1,
    defaultCount: count,
    make(r, o) {
      const t = tier(o);
      for (let g = 0; g < 2000; g++) { const p = r.pick(templates)(r, t); if (sound(p, signed)) return p; }
      throw new Error(`${id}: no template made a problem`);
    },
    render: (p) => ask(p.text) +
      (board ? `<div class="mb-art">${blankModelSvg({ h: 34 })}</div>` : `<div class="wp-room" aria-hidden="true"></div>`) +
      ask(p.ans.map(([l]) => `${l} ${box()}`).join(" &nbsp;&nbsp; ")),
    worked: () => worked(ask(example) + say(solution)),
    key: (p) => p.ans.map(([, v]) => wantOf(v)),
    answer: (p) => [`${p.how ? `${p.how} → ` : ""}${p.ans.map(([l, v]) => `${l} ${sayOf(v)}`).join(", ")}`],
  };
}
