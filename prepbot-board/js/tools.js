/* ============================================================================
   PrepBoard — the site's own tools, put up and USED by PrepBot
   ----------------------------------------------------------------------------
   The workbook's tools (utils/components/workbook/toolbar.js) open in their own
   panels on this page: the written boards (column addition, multiplication,
   criss-cross, short and long division), the calculator, the bar-model board,
   the number line, the grapher, Algebra Moves, a sticky note.

   {"op":"tool","name":"longdiv","values":["945","7"],"work":true}
     → the long-division board opens, the sum goes in, and PrepBot works it a
       figure at a time, reading out the board's OWN question for each figure
       (the way the Toy Shop's guide does) — or, with work:false, leaves it set
       up for the learner to do.

   The board asks; PrepBot answers it; only then is the figure written. The
   words cannot drift from the method, because they ARE the board's words.
   ========================================================================== */

export const BOARD_TOOLS = ["column", "times", "criss", "shortdiv", "longdiv"];
export const TOOL_NAMES = [...BOARD_TOOLS, "calculator", "barmodel", "linemodel", "graph", "gm", "note"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lower = (s) => String(s || "").replace(/^([A-Z])(?=[a-z])/, (m) => m.toLowerCase());
const LEAD = ["Right,", "So,", "Next,", "Now,", "And", "On we go:", "Then"];
const pick = (list, k) => list[k % list.length];

/* the figure that goes next: the board itself is asked which digit it accepts */
function nextFigure(board) {
  const { thing, kind } = board || {};
  if (!thing || !kind?.answer) return null;
  for (let d = 0; d <= 99; d += 1) {
    let copy;
    try { copy = structuredClone(thing); } catch { return null; }
    if (kind.answer(copy, String(d)).ok) return String(d);
  }
  return null;
}
const asking = (board) => { try { return board?.kind?.ask?.(board.thing) || {}; } catch { return {}; } };

async function waitFor(sel, ms = 6000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    const el = document.querySelector(sel);
    if (el) return el;
    await sleep(80);
  }
  return null;
}

/**
 * @param api     mountTools()'s handle: { open(id), isOpen(id) }
 * @param speak   (text) => Promise — said aloud (and captioned) by the page
 */
export function createToolDriver({ api, speak }) {
  let run = 0; // a newer run (or stop) makes an older one give up

  async function put(id) {
    if (!api || !TOOL_NAMES.includes(id)) return false;
    if (!api.isOpen(id)) await api.open(id);
    return true;
  }

  async function type(field, value) {
    field.focus();
    field.value = "";
    for (const ch of String(value)) {
      field.value += ch;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(110);
    }
  }

  /** Put a tool up (and, on a written board, set the sum and maybe work it). */
  async function use(op) {
    const me = ++run;
    const live = () => me === run;
    if (!(await put(op.name))) return;
    if (!BOARD_TOOLS.includes(op.name)) {
      /* the calculator: the sum typed in, so the learner sees what is being worked out */
      if (op.name === "calculator" && op.values?.[0]) {
        const inp = await waitFor("[data-calc-expr]", 3000);
        if (inp && live()) { await type(inp, op.values[0]); inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); }
      }
      return;
    }
    const el = await waitFor(`.bd-board--${op.name}`);
    if (!el || !live()) return;
    const fields = [...el.querySelectorAll(".bd-sum__in")];
    for (let i = 0; i < fields.length && i < (op.values || []).length; i++) {
      if (!live()) return;
      if (fields[i].tagName === "SELECT") { fields[i].value = op.values[i]; fields[i].dispatchEvent(new Event("change", { bubbles: true })); }
      else await type(fields[i], op.values[i]);
    }
    if (!op.values?.length) return; // just the board, for the learner
    el.querySelector(".bd-act--set")?.click();
    await sleep(500);
    if (!op.work || !live()) return;

    /* WORKED, a figure at a time: the board's question, its answer, then the figure */
    const done = () => /^Done/i.test(el.querySelector(".bd-say")?.textContent || "");
    for (let k = 0; k < 90 && !done(); k += 1) {
      if (!live()) return;
      const a = asking(el.__board);
      if (a.done) break;
      const bring = el.querySelector(".bd-bring");
      if (bring) {
        await speak(`${pick(LEAD, k)} ${lower(a.text) || "bring the next figure down"}. Nothing to work out there, it just comes down.`);
        if (!live()) return;
        bring.click();
        await sleep(450);
        continue;
      }
      const figure = nextFigure(el.__board);
      if (figure === null || !el.querySelector(".bd-in")) break;
      await speak(`${pick(LEAD, k)} ${lower(a.text) || "what goes down?"} ${figure}${a.where ? `, ${a.where}` : ""}.`);
      if (!live()) return;
      for (const ch of figure) {
        const cells = [...el.querySelectorAll(".bd-in")];
        const cell = cells.find((c) => c.value.length < (c.maxLength || 1)) || cells[0];
        if (!cell) break;
        cell.focus();
        cell.value += ch;
        cell.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(160);
      }
      await sleep(350);
    }
    if (live()) {
      const said = el.querySelector(".bd-say")?.textContent || "";
      if (said) await speak(said.replace(/^Done[.!:]?\s*/i, "And that's it: "));
    }
  }

  return {
    use,
    /** The learner cut in, or a new board: whatever a tool was doing stops. */
    stop() { run++; },
  };
}
