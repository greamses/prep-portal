/* ============================================================================
   PRINTABLE WORKBOOK — what a right answer looks like
   ----------------------------------------------------------------------------
   An exercise that can be marked on screen says, for each question, what
   belongs in each of its answer places, IN THE ORDER THEY APPEAR on the paper:

     key(item, o) → [ want.num(60), want.tick(0), … ]

   The answer places are, in document order inside the question: every answer
   box (.wb-answer), every writing line (.wb-line), every blank table cell
   (.wb-cell) and every row of tick boxes (.wb-tick). One entry per place —
   except `set`, which covers as many places as it has values, in any order,
   and `draw`, which covers none (it is marked off the lines drawn on the
   figure). interactive.js does the marking; this file is only the vocabulary,
   and has no DOM in it, so the answer checks can run in Node.
   ========================================================================== */

export const want = {
  /** A number, within `tol` either side (a measured angle gets 2°). */
  num: (v, tol = 0) => ({ kind: "num", v, tol }),
  /** A count of dots with a direction: 3 up is 3, 2 down is −2, flat is 0. */
  steps: (v) => ({ kind: "steps", v }),
  /** Words: any of these, ignoring case, spaces and ° signs. */
  text: (...accept) => ({ kind: "text", accept }),
  /** One place that must mention every one of these numbers. */
  nums: (...vs) => ({ kind: "nums", vs }),
  /** Several places that between them hold these values, in any order. */
  set: (...vs) => ({ kind: "set", vs }),
  /** A row of tick boxes; option `i` (from 0) is the right one. */
  tick: (i) => ({ kind: "tick", i }),
  /** A place that is not marked — a sketch, a reason in words. */
  free: () => ({ kind: "free" }),
  /**
   * Lines drawn on the question's figure.
   *   check(lines, fig) → true when the drawing is right. `lines` are pairs of
   *   point indices for a figure with snap points, or [[x1,y1],[x2,y2]] pairs
   *   for free drawing. `fig` is { pts, par } read off the figure.
   *   says: what the right drawing is, for "show me the answers".
   */
  draw: ({ check, says, free = false, on = null, hands = false }) => ({ kind: "draw", check, says, free, on, hands }),
  /** One cell of a chart or a written sum: a figure, or — for a leading zero —
      a figure the child may leave empty. */
  cell: (v, blankOk = false) => ({ kind: "cell", v: String(v), blankOk }),
  /** Words, compared on letters and figures only: "twenty-five past 3",
      "twenty five past three" and "Twenty-Five Past Three" are one answer. */
  words: (...accept) => ({ kind: "words", accept }),
  /** Parts of the question's nth cut-up shape to colour in (mode "fill") or to
      cross out (mode "cross") — how many, not which. Covers no places. */
  colour: ({ count, nth = 0, mode = "fill", says = "" }) => ({ kind: "colour", count, nth, mode, says }),
  /** Two columns to join: the right [left, right] pairs. Covers no places. */
  match: (pairs, says = "") => ({ kind: "match", pairs, says }),
  /** A pencil on the pictures for what is not marked — ringing, sharing. */
  pen: (on = null) => ({ kind: "pen", on }),
  /** Corners torn off a figure (svg[data-tear]) and stuck round the dot of
      another (svg[data-paste]). Not marked: it is the experiment, and the
      places after it say what it showed. Covers no places. */
  stick: () => ({ kind: "stick" }),
};

/* ── judging, shared by the page and the Node checks ─────────────────────────*/

const MINUS = /[−–—]/g;

/** The number in what was typed, or NaN. "60°", " 60 ", "60.0" are all 60. */
export function parseNum(s) {
  const t = String(s ?? "").replace(MINUS, "-").replace(/[°\s,]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN;
  return Number(t);
}

/** Words for comparison: lower case, no spaces or degree signs, one minus, one times. */
export function normText(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(MINUS, "-")
    .replace(/[×✕*]/g, "x")
    .replace(/[°\s.,]/g, "");
}

/** Letters and figures only, for answers that are words. */
export const normWords = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const numbersIn = (s) => (String(s ?? "").replace(MINUS, "-").match(/-?\d+(\.\d+)?/g) || []).map(Number);

/**
 * Mark one entry against the values typed in its places. Returns one
 * true/false per place (a tick row's value is the index ticked, or -1).
 */
export function judge(entry, values) {
  switch (entry.kind) {
    case "num": {
      const x = parseNum(values[0]);
      return [!Number.isNaN(x) && Math.abs(x - entry.v) <= entry.tol + 1e-9];
    }
    case "steps": {
      const t = String(values[0] ?? "").toLowerCase().replace(MINUS, "-");
      const ns = numbersIn(t);
      if (entry.v === 0) return [/flat|none|no/.test(t) || (ns.length === 1 && ns[0] === 0)];
      if (ns.length !== 1) return [false];
      let n = ns[0];
      const said = /down/.test(t) ? -1 : /up/.test(t) ? 1 : n < 0 ? -1 : 0;
      n = Math.abs(n);
      return [n === Math.abs(entry.v) && (said === 0 || said === Math.sign(entry.v))];
    }
    case "text": {
      const t = normText(values[0]);
      return [t !== "" && entry.accept.some((a) => normText(a) === t)];
    }
    case "nums": {
      const got = numbersIn(values[0]);
      return [entry.vs.every((v) => got.includes(v))];
    }
    case "set": {
      const pool = entry.vs.slice();
      return values.map((v) => {
        const x = parseNum(v);
        const at = pool.findIndex((p) => p === x);
        if (at < 0) return false;
        pool.splice(at, 1);
        return true;
      });
    }
    case "tick":
      return [Number(values[0]) === entry.i];
    case "cell": {
      const t = normText(values[0]);
      return [t === normText(entry.v) || (entry.blankOk && t === "")];
    }
    case "words": {
      const t = normWords(values[0]);
      return [t !== "" && entry.accept.some((a) => normWords(a) === t)];
    }
    default:
      return values.map(() => true);
  }
}

/** How many answer places an entry covers. */
export const placesOf = (entry) =>
  entry.kind === "set" ? entry.vs.length : ["draw", "colour", "match", "pen", "stick"].includes(entry.kind) ? 0 : 1;

/** The right answer, written for a person. Tick rows name their option. */
export function sayWant(entry, tickLabels = []) {
  switch (entry.kind) {
    case "num": return entry.tol ? `${entry.v} (±${entry.tol})` : String(entry.v);
    case "steps": return entry.v === 0 ? "0 (flat)" : `${Math.abs(entry.v)} ${entry.v > 0 ? "up" : "down"}`;
    case "text": return entry.accept[0];
    case "nums": return entry.vs.join(" and ");
    case "set": return entry.vs.join(", ");
    case "tick": return tickLabels[entry.i] || `option ${entry.i + 1}`;
    case "draw": return entry.says || "";
    case "cell": return entry.v;
    case "words": return entry.accept[0];
    case "colour": return entry.says || `${entry.count} ${entry.mode === "cross" ? "crossed out" : "coloured"}`;
    case "match": return entry.says || "";
    default: return "";
  }
}

/** The values that WOULD be right, one per place — for the self-checks. */
export function rightValues(entry) {
  switch (entry.kind) {
    case "num": return [String(entry.v)];
    case "steps": return [entry.v === 0 ? "0" : `${Math.abs(entry.v)} ${entry.v > 0 ? "up" : "down"}`];
    case "text": return [entry.accept[0]];
    case "nums": return [entry.vs.join(" and ")];
    case "set": return entry.vs.map(String);
    case "tick": return [entry.i];
    case "cell": return [entry.v];
    case "words": return [entry.accept[0]];
    default: return [""];
  }
}
