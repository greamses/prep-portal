/* ============================================================================
   GRAPHIC ORGANISERS — the English workbooks' working paper
   ----------------------------------------------------------------------------
   A maths page gives a child a written board to work the sum on. An English
   page was giving them a long division board, which is no use to anybody
   drafting a paragraph or picking a passage apart — so these are the two
   boards an English page actually wants.

     DRAFTING        what you are going to write before you write it: who it
                     is for, how it opens, the three things it says, how it
                     ends. A plan is the one part of writing a child skips,
                     and it is the part that decides the mark.
     COMPREHENSION   what the passage says before you answer on it: what it
                     is about, who is in it, the words you did not know, what
                     the question is actually asking, and the line you are
                     going to point at for your evidence.

   They are WORKING, never marked — like the counters, the purse and the bar
   model board. What the child decides here goes in the answer boxes on the
   paper; this is where they decide it.

   An organiser is a list of boxes with headings, so a third one is a table
   entry and not a component. The writing is kept per page in localStorage: a
   plan you lose when the panel shuts is a plan nobody makes twice.

     mountOrganiser(host, { kind, saved, onChange }) → { get(), dispose() }
   ========================================================================== */

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/**
 * The boards themselves. `rows` is a heading and the room it wants — one line
 * for a name, several for the part that is actually the writing.
 */
export const ORGANISERS = {
  draft: {
    label: "Planning a piece",
    say: "Fill this in before you write a word of it. Everything here is one line — the writing comes after.",
    rows: [
      ["What it is about", 1],
      ["Who is going to read it", 1],
      ["How it opens — the first line that makes them carry on", 2],
      ["The first thing it says", 2],
      ["The second thing it says", 2],
      ["The third thing it says", 2],
      ["How it ends — what they are left thinking", 2],
      ["Words I want to use", 2],
    ],
  },
  comprehend: {
    label: "Reading a passage",
    say: "Work the passage out here first. An answer written before you know what the passage says is a guess.",
    rows: [
      ["What the passage is about, in one sentence", 2],
      ["Who is in it", 1],
      ["What happens, in order", 3],
      ["Words I did not know, and what I think they mean", 3],
      ["What the question is actually asking", 2],
      ["The line I am going to point at", 2],
    ],
  },
};

export const ORGANISER_IDS = Object.keys(ORGANISERS);

/**
 * Hang an organiser on `host`.
 *
 *   kind      which board (a key of ORGANISERS)
 *   saved     what was written last time, as { 0: "…", 1: "…" }
 *   onChange  called with that object whenever a word changes
 */
export function mountOrganiser(host, { kind = "draft", saved = null, onChange = () => {} } = {}) {
  const spec = ORGANISERS[kind] || ORGANISERS.draft;
  const wrote = saved && typeof saved === "object" ? { ...saved } : {};

  const el = document.createElement("div");
  el.className = "wb-org";
  el.innerHTML = `<p class="wb-org__say">${esc(spec.say)}</p>`
    + spec.rows.map(([head, lines], i) => `<label class="wb-org__row">`
      + `<span class="wb-org__head">${esc(head)}</span>`
      + `<textarea class="wb-org__box" rows="${lines}" data-org="${i}"`
      + ` aria-label="${esc(head)}">${esc(wrote[i] || "")}</textarea></label>`).join("");
  host.appendChild(el);

  el.addEventListener("input", (e) => {
    const i = e.target.dataset.org;
    if (i == null) return;
    wrote[i] = e.target.value;
    onChange({ ...wrote });
  });

  return {
    el,
    get: () => ({ ...wrote }),
    dispose() { el.remove(); },
  };
}
