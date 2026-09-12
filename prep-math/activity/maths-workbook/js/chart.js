/* ============================================================================
   Place Value Workbook — the place-value chart
   ----------------------------------------------------------------------------
   A table, not a drawing, because the chart is a thing to WRITE IN and a table
   cell is the only box a printer, a screen reader and a pencil all agree about.

   The chart carries three claims about a number, and it is built to make all
   three visible at once:

     • Each column is a place, named, with what one of it is worth underneath.
     • The columns are grouped in threes — ones, thousands, millions — because
       that grouping is the whole reason big numbers are readable, and a chart
       that hides it teaches a child to count digits on their fingers instead.
     • The colour of a column head says WHERE IN ITS PERIOD the place sits, the
       same butter / sky / leaf beat as the blocks. Read down a printed page,
       the hundreds column and the hundred-thousands column are the same green,
       and that is the point: they are the same place, three sizes up.

   Rows come in two kinds and every exercise is made of them: a row with digits
   in it (given, to be read off) and a row without (to be filled in).
   ========================================================================== */

import { placeFill } from "./blocks.js";
import { placeName, placeWorth, digitChar, htuOf, PERIODS as PERIOD_WORDS } from "./numbers.js";

/* The periods a base-ten chart bands across the top. Only base ten gets a
   period band: "thousands" is an English word about English numerals, and
   there is no word for base-five's third period.

   Taken from the one list of period names (numbers.js) rather than kept here,
   so a chart and the labels over a figure can never disagree about what the
   fourth period is called. The ones period has no name of its own in that
   list — it is the one every other period is counted from — so it is named
   here, where a chart needs a heading over it. */
const PERIODS = PERIOD_WORDS.map((w, i) => (
  i === 0 ? "Ones" : w.charAt(0).toUpperCase() + w.slice(1) + "s"
));

/**
 * Build a chart.
 *
 * @param {object} spec
 * @param {number[]} spec.powers   Highest place first, e.g. [3,2,1,0].
 * @param {number}   spec.base
 * @param {object[]} spec.rows     One per line: { side, digits, tail }.
 *        `digits` is lowest-place-first (like digitsOf) or null for an empty
 *        row; `side` and `tail` are the optional columns either end.
 * @param {string}   [spec.side]   Heading of the left-hand column, if any.
 * @param {string}   [spec.tail]   Heading of the right-hand column, if any.
 * @param {boolean}  [spec.band]   Draw the ONES / THOUSANDS band across the top.
 */
/**
 * What one of a place is worth, written so it cannot overflow its column.
 *
 * A twelve-place chart would otherwise print 1000000000000 across a cell two
 * figures wide. Past the hundreds it is written as a power instead, which is
 * the form the number is READ in anyway once it has a period name over it.
 */
function worthHtml(power, base) {
  if (power === 0) return "1";
  if (base !== 10 || power < 3) return placeWorth(power, base);
  return `10<sup>${power}</sup>`;
}

export function chartHtml({ powers, base, rows, side = "", tail = "", band = true, names = "full", merge = false }) {
  /* One cell per PERIOD instead of one per place: 256 written in the thousands
     column rather than split across its H, T and U. The period band already
     says which period it is, so nothing is lost and the chart gets short. */
  if (merge) return periodChart({ powers, base, rows, side, tail });
  const showBand = band && base === 10 && Math.max(...powers) >= 3;

  let head = "";
  if (showBand) {
    /* One band cell per period actually present, spanning its columns. */
    const groups = [];
    powers.forEach((p) => {
      const period = Math.floor(p / 3);
      const last = groups[groups.length - 1];
      if (last && last.period === period) last.span++;
      else groups.push({ period, span: 1 });
    });
    head +=
      "<tr class=\"pv-chart__band\">" +
      (side ? "<th></th>" : "") +
      groups
        .map((g) => `<th colspan="${g.span}">${PERIODS[g.period] || ""}</th>`)
        .join("") +
      (tail ? "<th></th>" : "") +
      "</tr>";
  }

  head +=
    "<tr class=\"pv-chart__head\">" +
    (side ? `<th class="pv-chart__side">${side}</th>` : "") +
    powers
      .map((p, i) => {
        /* The rule between one period and the next: a thick left edge on the
           column that STARTS a lower period. */
        const edge = i > 0 && p % 3 === 2 ? " pv-chart__col--period" : "";
        return (
          /* "H" under THOUSANDS says everything "Hundred Thousands" says, in
             one letter, and every period repeats the same three — which is
             the pattern the whole thing is teaching. The written-out names
             stay the default, for the printed workbook. */
          `<th class="pv-chart__place${edge}" style="--pv-fill:${placeFill(p)}">` +
          `<span class="pv-chart__name">${names === "htu" ? htuOf(p) : placeName(p, base)}</span>` +
          `<span class="pv-chart__worth">${names === "htu" ? worthHtml(p, base) : placeWorth(p, base)}</span>` +
          "</th>"
        );
      })
      .join("") +
    (tail ? `<th class="pv-chart__side">${tail}</th>` : "") +
    "</tr>";

  const body = rows
    .map((row) => {
      const blank = (v) => (v === "" || v === undefined || v === null
        ? " pv-chart__side--blank wb-cell" : "");
      const cells = powers
        .map((p, i) => {
          const edge = i > 0 && p % 3 === 2 ? " pv-chart__col--period" : "";
          const d = row.digits ? row.digits[p] : null;
          const text = d === null || d === undefined ? "" : digitChar(d);
          return `<td class="pv-chart__cell${edge}${text === "" ? " wb-cell" : ""}">${text}</td>`;
        })
        .join("");
      return (
        "<tr>" +
        (side ? `<td class="pv-chart__side${blank(row.side)}">${row.side ?? ""}</td>` : "") +
        cells +
        (tail ? `<td class="pv-chart__side${blank(row.tail)}">${row.tail ?? ""}</td>` : "") +
        "</tr>"
      );
    })
    .join("");

  return `<table class="pv-chart"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

/**
 * The same chart with one column per period.
 *
 * `powers` is still given place by place — the caller does not have to know
 * about periods — and they are gathered here, so a period's three figures land
 * in one cell in the order they are written.
 */
function periodChart({ powers, base, rows, side, tail }) {
  const groups = [];
  powers.forEach((p) => {
    const k = Math.floor(p / 3);
    const last = groups[groups.length - 1];
    if (last && last.k === k) last.powers.push(p);
    else groups.push({ k, powers: [p] });
  });

  const head =
    `<tr class="pv-chart__head">` +
    (side ? `<th class="pv-chart__side">${side}</th>` : "") +
    groups.map((g, i) => (
      `<th class="pv-chart__place${i ? " pv-chart__col--period" : ""}" style="--pv-fill:${placeFill(g.k * 3)}">` +
      `<span class="pv-chart__name">${PERIODS[g.k] || ""}</span>` +
      `<span class="pv-chart__worth">${worthHtml(g.k * 3, base)}</span>` +
      `</th>`
    )).join("") +
    (tail ? `<th class="pv-chart__side">${tail}</th>` : "") +
    `</tr>`;

  const body = rows.map((row) => {
    const cells = groups.map((g, i) => {
      const text = row.digits
        ? g.powers.map((p) => {
            const d = row.digits[p];
            return d === null || d === undefined ? "" : digitChar(d);
          }).join("")
        : "";
      return `<td class="pv-chart__cell pv-chart__cell--period${i ? " pv-chart__col--period" : ""}`
        + `${text === "" ? " wb-cell" : ""}">${text}</td>`;
    }).join("");
    return `<tr>`
      + (side ? `<td class="pv-chart__side">${row.side ?? ""}</td>` : "")
      + cells
      + (tail ? `<td class="pv-chart__side">${row.tail ?? ""}</td>` : "")
      + `</tr>`;
  }).join("");

  return `<table class="pv-chart pv-chart--periods"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

/** The powers of a chart `places` wide, highest first. */
export function powersFor(places) {
  return Array.from({ length: places }, (_, i) => places - 1 - i);
}
