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
const cap = (t) => String(t || "").replace(/^\s*([a-z])/, (m) => m.toUpperCase());
/* the board's question, said the way a teacher says it: what we are looking
   at, the question, then the answer ("6 and 8. What goes under the line? It's 4, in the ones column.") */
function teacherLine(lead, text, answer, where) {
  const parts = String(text || "").split(/\s+—\s+/);
  const q = parts.pop() || "";
  const ctx = parts.join(", ");
  const asked = /\?\s*$/.test(q);
  /* after "Right," the sentence carries on in lower case; after "On we go:" it starts afresh */
  const first = /[.:]$/.test(lead) ? cap : lower;
  const open = ctx ? `${first(ctx)}. ${cap(q)}` : first(q);
  return `${lead} ${open}${asked ? "" : "."} ${answer}${where ? `, ${where}` : ""}.`.replace(/\s+/g, " ").trim();
}

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
export function createToolDriver({ api, speak, onIdle = () => {} }) {
  let run = 0; // a newer run (or stop) makes an older one give up
  const mine = new Set(); // tools PrepBot put up (and so puts away)

  /* ALWAYS A FRESH TOOL: a panel that is already open (or was brought back
     from last time) still holds an old sum, and puts it back into the boxes
     a moment after it opens — over the sum PrepBot is typing. Closing it
     first forgets that, so the new one opens empty. */
  async function put(id) {
    if (!api || !TOOL_NAMES.includes(id)) return false;
    if (!document.querySelector(`.wb-tools [data-wbtool="${id}"]`)) return false; // switched off for students
    if (api.isOpen(id)) await api.open(id); // (the key toggles: this closes it, forgetting its sum)
    await api.open(id);
    mine.add(id);
    return true;
  }
  /** Put away a tool PrepBot put up (and the rail, if nothing else is open). */
  async function away(id) {
    if (api?.isOpen(id) && mine.has(id)) await api.open(id);
    mine.delete(id);
    if (!mine.size) onIdle();
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
    await sleep(250); // the panel puts back what it last showed: let it, then replace it
    const fields = [...el.querySelectorAll(".bd-sum__in")];
    /* column addition takes the whole sum in ONE box ("456 + 378") */
    let values = (op.values || []).map(String);
    if (fields.length === 1 && values.length > 1) values = [values.join(/[+\-−]/.test(values.slice(1).join("")) ? " " : " + ")];
    op = { ...op, values };
    for (let i = 0; i < fields.length && i < values.length; i++) {
      if (!live()) return;
      if (fields[i].tagName === "SELECT") { fields[i].value = op.values[i]; fields[i].dispatchEvent(new Event("change", { bubbles: true })); }
      else await type(fields[i], op.values[i]);
    }
    if (!op.values?.length) return; // just the board, for the learner
    el.querySelector(".bd-act--set")?.click();
    await sleep(500);
    /* the board did not take the sum: say so rather than work some other sum */
    const set = el.__board?.thing;
    if (!set || /^(type|put|enter|that|those|use)/i.test(el.querySelector(".bd-say")?.textContent || "")) {
      await speak("Hmm, the board didn't take that sum, so let's work it here on the board instead.");
      return;
    }
    if (!op.work || !live()) return;

    /* WORKED, a figure at a time: the board's question, its answer, then the figure */
    const done = () => /^Done/i.test(el.querySelector(".bd-say")?.textContent || "");
    for (let k = 0; k < 90 && !done(); k += 1) {
      if (!live()) return;
      const a = asking(el.__board);
      if (a.done) break;
      const bring = el.querySelector(".bd-bring");
      if (bring) {
        await speak(teacherLine(pick(LEAD, k), a.text || "Bring the next figure down", "Nothing to work out, it just comes down", ""));
        if (!live()) return;
        bring.click();
        await sleep(450);
        continue;
      }
      const figure = nextFigure(el.__board);
      if (figure === null || !el.querySelector(".bd-in")) break;
      await speak(teacherLine(pick(LEAD, k), a.text || "What goes down?", `It's ${figure}`, a.where || ""));
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
      if (said) await speak(said.replace(/^Done[.!:]?\s*[—-]?\s*/i, "And there's our answer: "));
      /* worked and said: a moment to look at it, then it is put away */
      await sleep(2500);
      if (live()) await away(op.name);
    }
  }

  return {
    use,
    /** The learner cut in: whatever a tool was doing stops (the tool stays, to look at). */
    stop() { run++; },
    /** A new board, or the lesson moves on: every tool PrepBot put up is put away. */
    async closeAll() { run++; for (const id of [...mine]) await away(id); },
  };
}
